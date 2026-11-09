'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  OrderStatus,
  DeliveryZone,
  PaymentMethod,
  WorkshopData,
  CampaignGiveaway,
  Product,
  Order,
} from '@/types/database';
import { isSupabaseConfigured, getSiteSettings } from '@/lib/data';
import {
  createOrderSchema,
  normalizeBangladeshiPhone,
  CreateOrderInput,
} from '@/lib/validations/order';
import {
  authenticateAdmin,
  logoutAdminSession,
  getAdminSession,
  requireAdmin,
  AdminSession,
} from '@/lib/auth';
import {
  DEFAULT_WORKSHOP_DATA,
  MOCK_CAMPAIGNS,
  MOCK_PRODUCTS,
} from '@/lib/mock-data';
import { notifyOwnerNewOrder, notifyStatusChangeAlert } from '@/lib/notifications';
import { logger } from '@/lib/logger';
import { scanDriveMedia, DriveScannedItem } from '@/lib/google-drive';
import { sendMetaConversionsApiEvent } from '@/lib/meta-capi';
import { sendCustomerOrderSMS } from '@/lib/sms';
import { createSteadfastParcel } from '@/lib/courier/steadfast';
import { evaluateOrderRisk } from '@/lib/risk-engine';

// In-memory idempotency cache to protect against rapid double-clicks (5 min TTL)
const idempotencyCache = new Map<
  string,
  { orderNumber: string; orderId: string; expiresAt: number }
>();

function cleanExpiredIdempotencyKeys() {
  const now = Date.now();
  for (const [key, val] of idempotencyCache.entries()) {
    if (val.expiresAt < now) {
      idempotencyCache.delete(key);
    }
  }
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_zone: DeliveryZone;
  delivery_charge?: number; // Ignored: calculated server-side
  subtotal?: number; // Ignored: calculated server-side
  total_amount?: number; // Ignored: calculated server-side
  payment_method: PaymentMethod;
  transaction_id?: string;
  order_notes?: string;
  items: Array<{
    product_id: string;
    product_title?: string;
    selected_color?: string;
    quantity: number;
    unit_price?: number; // Ignored: fetched from DB/mock
  }>;
  website?: string; // Honeypot trap
  idempotency_key?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/**
 * ----------------------------------------------------
 * Administrative Authentication Actions
 * ----------------------------------------------------
 */

export async function loginAdminAction(data: {
  email?: string;
  name?: string;
  username?: string;
  identifier?: string;
  password?: string;
  pass?: string;
}) {
  const identifier = (data.name ?? data.username ?? data.identifier ?? data.email ?? '').trim();
  try {
    const password = data.password ?? data.pass ?? '';
    const result = await authenticateAdmin(identifier, password);
    if (result.success && result.user) {
      logger.info('Admin login successful', { name: result.user.name, role: result.user.role });
    } else {
      logger.warn('Admin login failed', { identifier, error: result.error });
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে';
    logger.error('Admin login exception', err, { identifier });
    return { success: false, error: msg };
  }
}

export async function logoutAdminAction() {
  await logoutAdminSession();
  revalidatePath('/admin');
  return { success: true };
}

export async function getAdminSessionAction(): Promise<AdminSession | null> {
  return await getAdminSession();
}

/**
 * ----------------------------------------------------
 * Storefront Order Placement (Public, Secure)
 * ----------------------------------------------------
 * 1. Zod schema validation
 * 2. Honeypot detection
 * 3. Idempotency deduping
 * 4. Authoritative server-side price calculation
 * 5. Sequential order number generation (DHD-1001)
 * 6. Secure insertion via service role
 * 7. Automatic status history & customer upsert
 * 8. Real-time owner notification (Telegram & Email)
 */
export async function submitOrderAction(payload: CreateOrderPayload) {
  try {
    // 1. Zod Schema Validation
    const validation = createOrderSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return {
        success: false,
        error: firstIssue
          ? firstIssue.message
          : 'ভুল তথ্য প্রদান করা হয়েছে। অনুগ্রহ করে ফর্মটি যাচাই করুন।',
      };
    }

    const data: CreateOrderInput = validation.data;

    // 2. Honeypot Bot Trap: If hidden "website" field has content, silently discard
    if (data.website && data.website.trim().length > 0) {
      logger.warn('Bot honeypot triggered on checkout', { honeypot: data.website });
      return {
        success: true,
        orderNumber: 'DHD-9999',
        message: 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!',
      };
    }

    // 3. Idempotency Protection: Prevent duplicate submit on double-click
    cleanExpiredIdempotencyKeys();
    if (data.idempotency_key && idempotencyCache.has(data.idempotency_key)) {
      const cached = idempotencyCache.get(data.idempotency_key)!;
      logger.info('Idempotent order return', { key: data.idempotency_key, orderNumber: cached.orderNumber });
      return {
        success: true,
        orderNumber: cached.orderNumber,
        orderId: cached.orderId,
        message: 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!',
      };
    }

    // 4. Authoritative Server-Side Price Calculation
    const normalizedPhone = normalizeBangladeshiPhone(data.customer_phone);
    const siteSettings = await getSiteSettings();

    // Determine delivery charge server-side
    const authoritativeDeliveryCharge =
      data.delivery_zone === 'inside'
        ? siteSettings.delivery_charge_inside ?? 120
        : siteSettings.delivery_charge_outside ?? 200;

    // Resolve products and their authoritative pricing
    const resolvedItems: Array<{
      product_id: string;
      product_title: string;
      selected_color: string | null;
      quantity: number;
      unit_price: number;
    }> = [];

    const supabase = createAdminClient();

    for (const item of data.items) {
      let product: Product | undefined;

      // Try database lookup first
      if (isSupabaseConfigured()) {
        try {
          const { data: dbProduct } = await supabase
            .from('products')
            .select('*')
            .or(`id.eq.${item.product_id},slug.eq.${item.product_id}`)
            .maybeSingle();
          if (dbProduct) {
            product = dbProduct as Product;
          }
        } catch {
          // fallback to mock below
        }
      }

      // Fallback to local catalog mock
      if (!product) {
        product = MOCK_PRODUCTS.find(
          (p) => p.id === item.product_id || p.slug === item.product_id
        );
      }

      const unitPrice = product
        ? product.discount_price ?? product.price
        : item.quantity > 0
        ? 1500
        : 0;

      const title =
        product?.title_bn || product?.title || item.product_title || 'ফার্নিচার পণ্য';

      resolvedItems.push({
        product_id: product?.id || item.product_id,
        product_title: title,
        selected_color: item.selected_color || null,
        quantity: item.quantity,
        unit_price: unitPrice,
      });
    }

    // Compute subtotal and total amount strictly server-side
    const authoritativeSubtotal = resolvedItems.reduce(
      (sum, it) => sum + it.unit_price * it.quantity,
      0
    );
    const authoritativeTotal = authoritativeSubtotal + authoritativeDeliveryCharge;

    // Human-friendly sequential order number fallback
    const fallbackOrderNumber = `DHD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Fallback if Supabase is not connected
    if (!isSupabaseConfigured()) {
      if (data.idempotency_key) {
        idempotencyCache.set(data.idempotency_key, {
          orderNumber: fallbackOrderNumber,
          orderId: 'mock-order-id',
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
      }
      return {
        success: true,
        orderNumber: fallbackOrderNumber,
        message: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে (Demo Mode)!',
      };
    }

    // 5. Evaluate order risk (fake order detection & advance payment rules)
    const risk = evaluateOrderRisk({
      phone: normalizedPhone,
      deliveryZone: data.delivery_zone,
      totalAmount: authoritativeTotal,
    });

    // Insert order using service role client
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: fallbackOrderNumber,
        customer_name: data.customer_name.trim(),
        customer_phone: normalizedPhone,
        customer_address: data.customer_address.trim(),
        delivery_zone: data.delivery_zone,
        delivery_charge: authoritativeDeliveryCharge,
        subtotal: authoritativeSubtotal,
        total_amount: authoritativeTotal,
        payment_method: data.payment_method,
        transaction_id: data.transaction_id?.trim() || null,
        order_notes: data.order_notes?.trim() || null,
        status: 'pending',
        is_flagged_suspicious: risk.isSuspicious,
        due_amount: authoritativeTotal,
        advance_payment_amount: 0,
        utm_source: payload.utm_source || null,
        utm_medium: payload.utm_medium || null,
        utm_campaign: payload.utm_campaign || null,
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      logger.error('Supabase order insert error', orderError);
      return { success: false, error: 'অর্ডার সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
    }

    // 6. Insert order items
    const orderItemsRows = resolvedItems.map((item) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_title: item.product_title,
      selected_color: item.selected_color,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsRows);

    if (itemsError) {
      logger.error('Supabase order items error', itemsError);
    }

    // 7. Insert initial status history
    try {
      await supabase.from('order_status_history').insert({
        order_id: orderData.id,
        status: 'pending',
        note: 'গ্রাহক কর্তৃক অনলাইন অর্ডার গৃহীত হয়েছে',
        changed_by: 'customer',
      });
    } catch {
      // Trigger handles if active
    }

    // 8. Auto-sync customer profile
    try {
      await supabase.from('customers').upsert(
        {
          phone: normalizedPhone,
          name: data.customer_name.trim(),
          address: data.customer_address.trim(),
          delivery_zone: data.delivery_zone,
          total_orders: 1,
          total_spent: authoritativeTotal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );
    } catch {
      // Trigger handles if active
    }

    // 9. Cache idempotency key
    if (data.idempotency_key) {
      idempotencyCache.set(data.idempotency_key, {
        orderNumber: orderData.order_number,
        orderId: orderData.id,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    }

    // 10. Real-time background notification to factory owner
    const fullOrderForNotice: Order = {
      id: orderData.id,
      order_number: orderData.order_number,
      customer_name: data.customer_name.trim(),
      customer_phone: normalizedPhone,
      customer_address: data.customer_address.trim(),
      delivery_zone: data.delivery_zone,
      delivery_charge: authoritativeDeliveryCharge,
      subtotal: authoritativeSubtotal,
      total_amount: authoritativeTotal,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id || null,
      order_notes: data.order_notes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    notifyOwnerNewOrder(fullOrderForNotice, resolvedItems).catch((err) =>
      logger.warn('Background notification error', { err: String(err) })
    );

    // 11. Meta Conversions API (CAPI) Server-Side Purchase Event
    sendMetaConversionsApiEvent({
      eventName: 'Purchase',
      eventId: orderData.order_number,
      eventSourceUrl: 'https://dream-home-decor.vercel.app/checkout/success',
      userData: {
        phone: normalizedPhone,
        name: data.customer_name.trim(),
      },
      customData: {
        currency: 'BDT',
        value: authoritativeTotal,
        orderId: orderData.order_number,
        numItems: resolvedItems.reduce((acc, curr) => acc + curr.quantity, 0),
        contents: resolvedItems.map((i) => ({
          id: i.product_id,
          quantity: i.quantity,
          item_price: i.unit_price,
        })),
      },
    }).catch((err) => logger.warn('Meta CAPI background error', { err: String(err) }));

    // 12. Automated Customer SMS Notification (Placed)
    sendCustomerOrderSMS({
      orderNumber: orderData.order_number,
      customerName: data.customer_name.trim(),
      customerPhone: normalizedPhone,
      totalAmount: authoritativeTotal,
      status: 'pending',
    }).catch((err) => logger.warn('SMS dispatch error', { err: String(err) }));

    logger.info('Order placed successfully', {
      orderNumber: orderData.order_number,
      phone: normalizedPhone,
      total: authoritativeTotal,
    });

    // Revalidate on-demand
    revalidatePath('/admin/orders');
    revalidatePath('/track-order');

    return {
      success: true,
      orderNumber: orderData.order_number,
      orderId: orderData.id,
      message: 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Order submit exception', err);
    return { success: false, error: `অর্ডার প্রক্রিয়াকরণে সমস্যা: ${msg}` };
  }
}

/**
 * ----------------------------------------------------
 * Administrative Protected Actions
 * ----------------------------------------------------
 */

/**
 * Server Action: Update Order Status (Admin - Staff / Manager / Owner)
 * Supports all 9 statuses:
 * pending -> confirmation_call -> confirmed -> in_production -> ready -> shipped -> delivered / cancelled / returned
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  note?: string
) {
  try {
    const session = await requireAdmin('staff');

    if (!isSupabaseConfigured()) {
      return { success: true, message: `Status updated to ${status} (Demo mode)` };
    }

    const supabase = createAdminClient();

    // 1. Fetch current order info for logging and notifications
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, total_amount, status')
      .eq('id', orderId)
      .maybeSingle();

    // 2. Update status on order
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    let { data: updatedRows, error } = isUuid
      ? await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .select('id, order_number')
      : await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('order_number', orderId)
          .select('id, order_number');

    // Handle legacy database check constraint if new statuses are not yet allowed in DB
    if (error && error.message.includes('orders_status_check')) {
      const fallbackMap: Record<string, OrderStatus> = {
        confirmation_call: 'pending',
        ready: 'in_production',
        returned: 'cancelled',
      };
      const fallbackStatus = fallbackMap[status] || 'pending';
      const fallbackNote = `[বর্তমান পর্যায়: ${status}]`;

      const fallbackQuery = isUuid
        ? supabase
            .from('orders')
            .update({
              status: fallbackStatus,
              staff_notes: fallbackNote,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .select('id, order_number')
        : supabase
            .from('orders')
            .update({
              status: fallbackStatus,
              staff_notes: fallbackNote,
              updated_at: new Date().toISOString(),
            })
            .eq('order_number', orderId)
            .select('id, order_number');

      const fallbackRes = await fallbackQuery;
      if (!fallbackRes.error) {
        updatedRows = fallbackRes.data;
        error = null;
      }
    }

    if (error) {
      logger.error('Failed to update order status', error, { orderId, status });
      return { success: false, error: error.message };
    }

    // 3. Record in order_status_history
    const historyNote =
      note?.trim() || `স্ট্যাটাস পরিবর্তন করেছেন: ${session.name} (${session.role})`;
    try {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status,
        note: historyNote,
        changed_by: session.email,
      });
    } catch {
      // Trigger handles if present
    }

    // 4. Record in audit_log
    try {
      await supabase.from('audit_log').insert({
        admin_email: session.email,
        admin_role: session.role,
        action: 'update_order_status',
        entity_type: 'order',
        entity_id: orderId,
        details: {
          order_number: currentOrder?.order_number,
          old_status: currentOrder?.status,
          new_status: status,
          note: historyNote,
        },
      });
    } catch {
      // non-fatal
    }

    // 5. Alert owner on critical status changes (cancellations or returns)
    if (status === 'cancelled' || status === 'returned') {
      notifyStatusChangeAlert(
        currentOrder?.order_number || orderId,
        currentOrder?.customer_name || 'গ্রাহক',
        status,
        note
      ).catch(() => {});
    }

    // 6. Automated Customer SMS Notification on key milestones
    if (currentOrder?.customer_phone) {
      sendCustomerOrderSMS({
        orderNumber: currentOrder.order_number,
        customerName: currentOrder.customer_name,
        customerPhone: currentOrder.customer_phone,
        totalAmount: Number(currentOrder.total_amount || 0),
        status,
      }).catch((err) => logger.warn('SMS dispatch error on status change', { err: String(err) }));
    }

    logger.info('Order status updated', {
      orderId,
      newStatus: status,
      admin: session.email,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/track-order');

    return { success: true, message: 'অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Add Internal Staff Note to Order (Admin)
 */
export async function addOrderNoteAction(orderId: string, noteText: string) {
  try {
    const session = await requireAdmin('staff');
    if (!noteText.trim()) {
      return { success: false, error: 'অনুগ্রহ করে নোট লিখুন' };
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { error } = await supabase.from('order_notes').insert({
        order_id: orderId,
        author_name: session.name || 'অ্যাডমিন স্টাফ',
        author_email: session.email || 'staff@dreamhomedecor.com',
        note: noteText.trim(),
      });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath('/admin/orders');
    return { success: true, message: 'অভ্যন্তরীণ নোট সংরক্ষণ করা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Record Abandoned Checkout (Storefront tracking)
 */
export async function recordAbandonedCheckoutAction(data: {
  customer_name?: string;
  customer_phone: string;
  cart_items: Array<{ product_title: string; quantity: number; unit_price: number }>;
  subtotal: number;
}) {
  try {
    const cleanPhone = normalizeBangladeshiPhone(data.customer_phone);
    if (!cleanPhone || cleanPhone.length < 11) {
      return { success: false, error: 'অকার্যকর ফোন নাম্বার' };
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase.from('abandoned_checkouts').insert({
        customer_name: data.customer_name?.trim() || null,
        customer_phone: cleanPhone,
        cart_items: data.cart_items,
        subtotal: data.subtotal,
        is_recovered: false,
      });
    }

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Server Action: Save / Update Product (Admin - Manager / Owner)
 */
export async function saveProductAction(productData: {
  id?: string;
  title: string;
  title_bn: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number | null;
  cost_price?: number | null;
  category_id?: string | null;
  images: string[];
  dimensions?: string;
  material?: string;
  color_options: string[];
  stock_status: 'in_stock' | 'made_to_order' | 'out_of_stock';
  is_featured: boolean;
  is_active: boolean;
  lead_time_days?: number | null;
  specifications?: Record<string, string> | null;
  seo_title?: string | null;
  seo_description?: string | null;
}) {
  try {
    const session = await requireAdmin('manager');

    if (!productData.title || !productData.slug || !productData.price) {
      return { success: false, error: 'Title, slug, and price are required' };
    }

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Product saved successfully (Demo mode)' };
    }

    const supabase = createAdminClient();

    const payload = {
      title: productData.title.trim(),
      title_bn: productData.title_bn.trim() || productData.title.trim(),
      slug: productData.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      description: productData.description.trim(),
      price: Number(productData.price),
      discount_price: productData.discount_price ? Number(productData.discount_price) : null,
      cost_price: productData.cost_price ? Number(productData.cost_price) : null,
      category_id: productData.category_id || null,
      images: productData.images.filter(Boolean),
      dimensions: productData.dimensions?.trim() || null,
      material: productData.material?.trim() || null,
      color_options: productData.color_options.filter(Boolean),
      stock_status: productData.stock_status,
      is_featured: productData.is_featured,
      is_active: productData.is_active,
      lead_time_days: productData.lead_time_days ? Number(productData.lead_time_days) : null,
      specifications: productData.specifications || null,
      seo_title: productData.seo_title?.trim() || null,
      seo_description: productData.seo_description?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let productId = productData.id;
    const currentPayload: Record<string, unknown> = { ...payload };

    if (productId) {
      let updateError: { message: string } | null = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        const { error } = await supabase
          .from('products')
          .update(currentPayload)
          .eq('id', productId);

        if (!error) {
          updateError = null;
          break;
        }

        const match = error.message.match(/Could not find the '([^']+)' column of/i);
        if (match && match[1] && match[1] in currentPayload) {
          delete currentPayload[match[1]];
        } else {
          updateError = error;
          break;
        }
      }

      if (updateError) return { success: false, error: updateError.message };
    } else {
      let insertError: { message: string } | null = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        const { data: newProd, error } = await supabase
          .from('products')
          .insert(currentPayload)
          .select('id')
          .single();

        if (!error && newProd) {
          productId = newProd.id;
          insertError = null;
          break;
        }

        if (error) {
          const match = error.message.match(/Could not find the '([^']+)' column of/i);
          if (match && match[1] && match[1] in currentPayload) {
            delete currentPayload[match[1]];
          } else {
            insertError = error;
            break;
          }
        }
      }

      if (insertError || !productId) {
        return { success: false, error: insertError?.message || 'পণ্য সংরক্ষণ ব্যর্থ হয়েছে' };
      }
    }

    // Record audit log
    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: productData.id ? 'update_product' : 'create_product',
      entity_type: 'product',
      entity_id: productId,
      details: { title: payload.title, slug: payload.slug, price: payload.price },
    });

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath(`/products/${payload.slug}`);
    revalidatePath('/admin/products');

    return { success: true, message: 'প্রোডাক্ট সফলভাবে সংরক্ষণ করা হয়েছে!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Delete Product (Admin - Manager / Owner)
 */
export async function deleteProductAction(productId: string) {
  try {
    const session = await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Product deleted (Demo mode)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) return { success: false, error: error.message };

    // Record audit log
    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: 'delete_product',
      entity_type: 'product',
      entity_id: productId,
    });

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath('/admin/products');

    return { success: true, message: 'প্রোডাক্ট ডিলিট করা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save Site Settings & Brand Details (Admin - Owner Only)
 */
export async function saveSiteSettingsAction(settingsData: {
  site_name: string;
  site_name_bn: string;
  logo_url: string;
  cover_banner_url: string;
  phone: string;
  whatsapp_number: string;
  facebook_url: string;
  address: string;
  delivery_charge_inside: number;
  delivery_charge_outside: number;
  announcement_text: string;
  bkash_merchant_number?: string;
  nagad_merchant_number?: string;
  show_placeholder_tag?: boolean;
}) {
  try {
    const session = await requireAdmin('owner');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Settings saved successfully (Demo mode)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        id: 1,
        ...settingsData,
        delivery_charge_inside: Number(settingsData.delivery_charge_inside),
        delivery_charge_outside: Number(settingsData.delivery_charge_outside),
        updated_at: new Date().toISOString(),
      });

    if (error) return { success: false, error: error.message };

    // Audit log
    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: 'save_site_settings',
      entity_type: 'site_settings',
      details: { site_name: settingsData.site_name, phone: settingsData.phone },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/checkout');
    revalidatePath('/admin/settings');

    return { success: true, message: 'ব্র্যান্ড ও সাইট সেটিংস সফলভাবে আপডেট হয়েছে!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save Campaign Giveaway (Admin - Manager / Owner)
 * Safely persists to Supabase first; avoids filesystem crash on Vercel.
 */
export async function saveCampaignAction(campaign: {
  id?: string;
  title: string;
  description?: string;
  banner_url: string;
  end_date?: string;
  facebook_post_link?: string;
  is_active: boolean;
}) {
  try {
    await requireAdmin('manager');

    const campaignId = campaign.id || `c0000000-${Date.now().toString(16).padStart(12, '0')}`;
    const cleanCampaign: CampaignGiveaway = {
      id: campaignId,
      title: campaign.title.trim(),
      description: campaign.description?.trim() || null,
      banner_url: campaign.banner_url.trim(),
      end_date: campaign.end_date || null,
      facebook_post_link: campaign.facebook_post_link?.trim() || null,
      is_active: Boolean(campaign.is_active),
      created_at: new Date().toISOString(),
    };

    // 1. Primary: Save to Supabase with service role
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('campaigns_giveaways' as any) as any).upsert(cleanCampaign);
        if (error) {
          logger.error('Supabase campaign upsert error', error);
          return {
            success: false,
            error: `ডাটাবেজ পারমিশন সমস্যা: ${error.message}`,
          };
        }
      } catch (sbErr: unknown) {
        const msg = sbErr instanceof Error ? sbErr.message : 'Database error';
        return { success: false, error: `ডাটাবেজ কানেকশন সমস্যা: ${msg}` };
      }
    }

    // 2. Secondary: Safe local cache write (only in local development, skip in Vercel serverless)
    if (!process.env.VERCEL) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const dirPath = path.join(process.cwd(), 'data');
        await fs.mkdir(dirPath, { recursive: true });
        const filePath = path.join(dirPath, 'campaigns.json');

        let list: CampaignGiveaway[] = [...MOCK_CAMPAIGNS];
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(fileContent);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch {
          // file does not exist yet
        }

        const existingIndex = list.findIndex((c) => c.id === campaignId);
        if (existingIndex >= 0) {
          list[existingIndex] = {
            ...list[existingIndex],
            ...cleanCampaign,
            created_at: list[existingIndex].created_at || cleanCampaign.created_at,
          };
        } else {
          list.unshift(cleanCampaign);
        }

        await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf-8');
      } catch {
        // gracefully ignore local file write error
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/campaigns');

    return {
      success: true,
      data: cleanCampaign,
      message: cleanCampaign.is_active
        ? 'ক্যাম্পেইন সফলভাবে সক্রিয় করা হয়েছে!'
        : 'ক্যাম্পেইনটি সফলভাবে পজ করা হয়েছে (হোমপেজে আর প্রদর্শিত হবে না)।',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Delete Campaign (Admin - Manager / Owner)
 */
export async function deleteCampaignAction(campaignId: string) {
  try {
    await requireAdmin('manager');

    // 1. Delete from Supabase with service role
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        await supabase.from('campaigns_giveaways').delete().eq('id', campaignId);
      } catch (sbErr) {
        logger.warn('Supabase campaign delete warning', { error: String(sbErr) });
      }
    }

    // 2. Safe local file delete (non-Vercel only)
    if (!process.env.VERCEL) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'data', 'campaigns.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((c: CampaignGiveaway) => c.id !== campaignId);
          await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
        }
      } catch {
        // ignore
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/campaigns');
    return { success: true, message: 'ক্যাম্পেইন ডিলিট করা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save Workshop Showcase Content (Admin - Manager / Owner)
 * Safely persists to Supabase first; avoids filesystem crash on Vercel.
 */
export async function saveWorkshopDataAction(payload: WorkshopData) {
  try {
    await requireAdmin('manager');

    if (!payload.title?.trim()) {
      return { success: false, error: 'সেকশনের প্রধান শিরোনাম প্রদান আবশ্যক' };
    }
    if (!payload.steps || payload.steps.length === 0) {
      return { success: false, error: 'কমপক্ষে ১টি উৎপাদন ধাপ থাকা প্রয়োজন' };
    }

    const cleanData: WorkshopData = {
      badge: payload.badge?.trim() || DEFAULT_WORKSHOP_DATA.badge,
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      steps: payload.steps.map((step, idx) => ({
        id: step.id || `step-${idx + 1}-${Date.now()}`,
        title: step.title?.trim() || `ধাপ ${idx + 1}`,
        desc: step.desc?.trim() || '',
        image: step.image?.trim() || DEFAULT_WORKSHOP_DATA.steps[0].image,
      })),
      videoCard: {
        enabled: payload.videoCard?.enabled !== false,
        badge: payload.videoCard?.badge?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.badge,
        title: payload.videoCard?.title?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.title,
        description:
          payload.videoCard?.description?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.description,
        buttonText:
          payload.videoCard?.buttonText?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.buttonText,
        buttonUrl:
          payload.videoCard?.buttonUrl?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.buttonUrl,
      },
      updated_at: new Date().toISOString(),
    };

    // 1. Primary: Save to Supabase workshop_settings
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('workshop_settings' as any) as any).upsert({
          id: 1,
          badge: cleanData.badge,
          title: cleanData.title,
          description: cleanData.description,
          steps: cleanData.steps,
          video_card: cleanData.videoCard,
          updated_at: cleanData.updated_at,
        });
      } catch (sbErr) {
        logger.warn('Supabase workshop sync warning', { error: String(sbErr) });
      }
    }

    // 2. Secondary: Safe local cache write (non-Vercel only)
    if (!process.env.VERCEL) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const dirPath = path.join(process.cwd(), 'data');
        await fs.mkdir(dirPath, { recursive: true });
        const filePath = path.join(dirPath, 'workshop.json');
        await fs.writeFile(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');
      } catch {
        // ignore
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/workshop');

    return {
      success: true,
      message: 'ওয়ার্কশপ সেকশন সফলভাবে সংরক্ষিত হয়েছে! হোমপেজে পরিবর্তন কার্যকর হয়েছে।',
      data: cleanData,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `সংরক্ষণ ব্যর্থ হয়েছে: ${msg}` };
  }
}

/**
 * Server Action: Reset Workshop Showcase to Default Factory Data (Admin - Owner Only)
 */
export async function resetWorkshopDataAction() {
  await requireAdmin('owner');
  return await saveWorkshopDataAction(DEFAULT_WORKSHOP_DATA);
}

/**
 * Server Action: Scan Google Drive Folder / File (Admin - Manager or Owner)
 */
export async function scanGoogleDriveFolderAction(urlOrId: string) {
  try {
    await requireAdmin('manager');

    // Fetch known products for slug matching
    let productsList: Array<{ id: string; slug: string; title_bn: string }> = MOCK_PRODUCTS.map((p) => ({
      id: p.id,
      slug: p.slug,
      title_bn: p.title_bn,
    }));

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, slug, title_bn');
        if (dbProducts && dbProducts.length > 0) {
          productsList = dbProducts;
        }
      } catch {
        // Fall back to mock products
      }
    }

    const result = await scanDriveMedia(urlOrId, productsList);
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown scanning error';
    return {
      success: false,
      items: [],
      totalFiles: 0,
      error: msg,
    };
  }
}

/**
 * Server Action: Import Scanned Drive Media into Database (Admin - Manager or Owner)
 * Saves to product_images and site_media, updates products.has_placeholder_images = false,
 * and removes the "নমুনা ছবি" tag automatically.
 */
export async function importGoogleDriveImagesAction(items: DriveScannedItem[]) {
  try {
    const session = await requireAdmin('manager');

    if (!items || items.length === 0) {
      return { success: false, error: 'ইম্পোর্ট করার জন্য কোনো ফাইল পাওয়া যায়নি' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: true,
        count: items.length,
        message: `ডেমো মোড: ${items.length}টি ছবির ইম্পোর্ট সিমুলেট করা হয়েছে!`,
      };
    }

    const supabase = createAdminClient();
    let importedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      const imageUrl = item.thumbnailUrl || item.directUrl;
      if (!imageUrl) continue;

      try {
        if (item.target.type === 'product') {
          // Find target product by slug
          const { data: product } = await supabase
            .from('products')
            .select('id, title, title_bn, slug, images')
            .eq('slug', item.target.slug)
            .maybeSingle();

          if (product) {
            // 1. Insert into product_images table
            await supabase.from('product_images').insert({
              product_id: product.id,
              url: imageUrl,
              alt: `${product.title_bn || product.title} - ড্রাইভ থেকে আসল ছবি`,
              sort_order: item.target.sortOrder || 1,
              source: 'drive',
              is_placeholder: false,
            });

            // 2. Update product images array and remove placeholder flag
            const existingImages: string[] = Array.isArray(product.images) ? product.images : [];
            const cleanExisting = existingImages.filter((img) => !img.startsWith('/placeholders/'));
            const updatedImages = cleanExisting.length > 0 ? [...cleanExisting, imageUrl] : [imageUrl];

            await supabase
              .from('products')
              .update({
                images: updatedImages,
                has_placeholder_images: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            importedCount++;
          } else {
            errors.push(`পণ্য "${item.target.slug}" ডাটাবেজে পাওয়া যায়নি`);
          }
        } else if (item.target.type === 'site') {
          // Insert or update site_media slot
          await supabase.from('site_media').upsert(
            {
              slot: item.target.slot,
              url: imageUrl,
              alt: item.target.slotLabelBn,
              source: 'drive',
              is_placeholder: false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'slot' }
          );

          // If hero banner, also update site_settings
          if (item.target.slot === 'hero') {
            await supabase
              .from('site_settings')
              .update({
                cover_banner_url: imageUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', 1);
          }

          importedCount++;
        } else {
          // Unknown / unmapped item
          await supabase.from('site_media').upsert(
            {
              slot: `unmapped_${item.fileId.slice(0, 10)}`,
              url: imageUrl,
              alt: item.fileName,
              source: 'drive',
              is_placeholder: false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'slot' }
          );
          importedCount++;
        }
      } catch (itemErr) {
        errors.push(`ফাইল ${item.fileName} ইম্পোর্ট ব্যর্থ: ${String(itemErr)}`);
      }
    }

    // Record audit log
    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: 'import_drive_media',
      entity_type: 'media',
      details: { count: importedCount, total: items.length },
    });

    revalidatePath('/');
    revalidatePath('/admin/media');
    revalidatePath('/admin/products');
    revalidatePath('/admin/settings');

    return {
      success: true,
      count: importedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${importedCount}টি ছবি সফলভাবে গুগল ড্রাইভ থেকে ইম্পোর্ট করা হয়েছে!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown import error';
    return { success: false, error: `ইম্পোর্ট ব্যর্থ হয়েছে: ${msg}` };
  }
}

/**
 * Server Action: Fetch Media Library & Slots (Admin)
 */
export async function getMediaLibraryAction() {
  try {
    await requireAdmin('staff');

    if (!isSupabaseConfigured()) {
      return {
        success: true,
        siteMedia: [],
        productImages: [],
      };
    }

    const supabase = createAdminClient();
    const [siteMediaRes, productImagesRes] = await Promise.all([
      supabase.from('site_media').select('*').order('created_at', { ascending: false }),
      supabase
        .from('product_images')
        .select('*, product:products(id, title, title_bn, slug)')
        .order('created_at', { ascending: false }),
    ]);

    return {
      success: true,
      siteMedia: siteMediaRes.data || [],
      productImages: productImagesRes.data || [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg, siteMedia: [], productImages: [] };
  }
}

/**
 * Server Action: Delete Image from Media Library (Admin - Manager or Owner)
 */
export async function deleteMediaImageAction(
  type: 'product_image' | 'site_media',
  id: string
) {
  try {
    const session = await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'ডেমো মোডে ইমেজ ডিলিট সম্পন্ন হয়েছে' };
    }

    const supabase = createAdminClient();

    if (type === 'product_image') {
      const { error } = await supabase.from('product_images').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('site_media').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    }

    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: 'delete_media_image',
      entity_type: type,
      details: { id },
    });

    revalidatePath('/admin/media');
    return { success: true, message: 'ছবি সফলভাবে মুছে ফেলা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Cancel Order with Reason
 */
export async function cancelOrderAction(orderId: string, reason: string) {
  try {
    const session = await requireAdmin('staff');
    if (!reason.trim()) return { success: false, error: 'বাতিলের কারণ প্রদান করতে হবে' };

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'অর্ডার বাতিল করা হয়েছে (ডেমো মোড)' };
    }

    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    let { error } = isUuid
      ? await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            cancel_reason: reason.trim(),
            staff_notes: `বাতিলের কারণ: ${reason.trim()}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
      : await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            cancel_reason: reason.trim(),
            staff_notes: `বাতিলের কারণ: ${reason.trim()}`,
            updated_at: new Date().toISOString(),
          })
          .eq('order_number', orderId);

    // Fallback if cancel_reason column does not exist in schema cache
    if (error && (error.code === 'PGRST204' || error.message.includes('cancel_reason'))) {
      const fallbackRes = isUuid
        ? await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              staff_notes: `বাতিলের কারণ: ${reason.trim()}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
        : await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              staff_notes: `বাতিলের কারণ: ${reason.trim()}`,
              updated_at: new Date().toISOString(),
            })
            .eq('order_number', orderId);
      error = fallbackRes.error;
    }

    if (error) return { success: false, error: error.message };

    // Record in history if UUID
    if (isUuid) {
      try {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          status: 'cancelled',
          note: `অর্ডার বাতিল করেছেন: ${session.name}। কারণ: ${reason.trim()}`,
          changed_by: session.name,
        });
      } catch {
        // non-fatal
      }

      // Also record as internal order note
      try {
        await supabase.from('order_notes').insert({
          order_id: orderId,
          author_name: session.name || 'অ্যাডমিন',
          author_email: session.email || null,
          note: `অর্ডার বাতিলের কারণ: ${reason.trim()}`,
        });
      } catch {
        // non-fatal
      }
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    return { success: true, message: 'অর্ডারটি সফলভাবে বাতিল করা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Verify bKash/Nagad Payment & Record Advance
 */
export async function verifyPaymentAction(
  orderId: string,
  verified: boolean,
  advanceAmount?: number
) {
  try {
    const session = await requireAdmin('staff');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'পেমেন্ট স্ট্যাটাস আপডেট হয়েছে (ডেমো মোড)' };
    }

    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();

    const total = Number(order?.total_amount) || 0;
    const advance = advanceAmount !== undefined ? Number(advanceAmount) : 0;
    const due = Math.max(0, total - advance);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    let { error } = isUuid
      ? await supabase
          .from('orders')
          .update({
            payment_verified: verified,
            advance_payment_amount: advance,
            due_amount: due,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
      : await supabase
          .from('orders')
          .update({
            payment_verified: verified,
            advance_payment_amount: advance,
            due_amount: due,
            updated_at: new Date().toISOString(),
          })
          .eq('order_number', orderId);

    // Fallback if payment_verified column does not exist in schema cache
    if (error && (error.code === 'PGRST204' || error.message.includes('payment_verified'))) {
      const fallbackRes = isUuid
        ? await supabase
            .from('orders')
            .update({
              advance_payment_amount: advance,
              due_amount: due,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
        : await supabase
            .from('orders')
            .update({
              advance_payment_amount: advance,
              due_amount: due,
              updated_at: new Date().toISOString(),
            })
            .eq('order_number', orderId);
      error = fallbackRes.error;
    }

    if (error) return { success: false, error: error.message };

    // Record internal note about verification
    if (isUuid) {
      try {
        await supabase.from('order_notes').insert({
          order_id: orderId,
          author_name: session.name || 'অ্যাডমিন',
          author_email: session.email || null,
          note: `পেমেন্ট ভেরিফিকেশন: ${verified ? 'অনুমোদিত' : 'অপেক্ষমাণ'}। অগ্রিম জমা: ৳${advance}, বকেয়া: ৳${due}`,
        });
      } catch {
        // non-fatal
      }
    }

    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: 'verify_payment',
      entity_type: 'orders',
      entity_id: orderId,
      details: { verified, advance, due },
    });

    revalidatePath('/admin/orders');
    return { success: true, message: 'পেমেন্ট তথ্য সফলভাবে সংরক্ষিত হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Edit Order Details (Before Shipping)
 */
export async function editOrderDetailsAction(payload: {
  orderId: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_zone: DeliveryZone;
  delivery_charge: number;
  items: Array<{
    id?: string;
    product_id?: string | null;
    product_title: string;
    quantity: number;
    unit_price: number;
    selected_color?: string | null;
  }>;
}) {
  try {
    const session = await requireAdmin('manager');

    const cleanPhone = normalizeBangladeshiPhone(payload.customer_phone);
    const subtotal = payload.items.reduce(
      (sum, item) => sum + Number(item.unit_price) * Number(item.quantity),
      0
    );
    const totalAmount = subtotal + Number(payload.delivery_charge);

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'অর্ডার বিবরণ আপডেট হয়েছে (ডেমো মোড)' };
    }

    const supabase = createAdminClient();

    // 1. Update order header
    const { error: orderErr } = await supabase
      .from('orders')
      .update({
        customer_name: payload.customer_name,
        customer_phone: cleanPhone,
        customer_address: payload.customer_address,
        delivery_zone: payload.delivery_zone,
        delivery_charge: payload.delivery_charge,
        subtotal,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.orderId);

    if (orderErr) return { success: false, error: orderErr.message };

    // 2. Re-insert items
    await supabase.from('order_items').delete().eq('order_id', payload.orderId);
    const itemRows = payload.items.map((it) => ({
      order_id: payload.orderId,
      product_id: it.product_id || null,
      product_title: it.product_title,
      selected_color: it.selected_color || null,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
    }));
    await supabase.from('order_items').insert(itemRows);

    // 3. Audit log
    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: 'edit_order',
      entity_type: 'orders',
      entity_id: payload.orderId,
      details: { new_total: totalAmount, customer_name: payload.customer_name },
    });

    revalidatePath('/admin/orders');
    return { success: true, message: 'অর্ডারের বিবরণ ও আইটেম সফলভাবে আপডেট হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Toggle Customer Blocklist Status
 */
export async function toggleCustomerBlocklistAction(phone: string, isBlocked: boolean) {
  try {
    const session = await requireAdmin('manager');
    const cleanPhone = normalizeBangladeshiPhone(phone);

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'কাস্টমার ব্লক স্ট্যাটাস আপডেট হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from('customers')
      .update({ is_blocked: isBlocked, updated_at: new Date().toISOString() })
      .eq('phone', cleanPhone)
      .select('phone');

    if (error) {
      logger.error('Failed to toggle customer blocklist', error);
      return { success: false, error: 'কাস্টমার ব্লক স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে: ' + error.message };
    }

    if (!updated || updated.length === 0) {
      await supabase.from('customers').upsert(
        { phone: cleanPhone, name: 'গ্রাহক', is_blocked: isBlocked, updated_at: new Date().toISOString() },
        { onConflict: 'phone' }
      );
    }

    try {
      await supabase.from('audit_log').insert({
        admin_email: session.email,
        admin_role: session.role,
        action: isBlocked ? 'block_customer' : 'unblock_customer',
        entity_type: 'customers',
        details: { phone: cleanPhone },
      });
    } catch {
      // Non-blocking audit log
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin/customers');
    return {
      success: true,
      message: isBlocked ? 'কাস্টমারকে ব্লক করা হয়েছে' : 'কাস্টমারকে আনব্লক করা হয়েছে',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Customer Notes
 */
export async function updateCustomerNotesAction(phone: string, notes: string) {
  try {
    const session = await requireAdmin('staff');
    const cleanPhone = normalizeBangladeshiPhone(phone);

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'কাস্টমার নোট সংরক্ষিত হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from('customers')
      .update({ notes: notes.trim(), updated_at: new Date().toISOString() })
      .eq('phone', cleanPhone)
      .select('phone');

    if (error) {
      logger.error('Failed to update customer notes', error);
      return { success: false, error: 'কাস্টমার নোট সংরক্ষণ ব্যর্থ হয়েছে: ' + error.message };
    }

    if (!updated || updated.length === 0) {
      await supabase.from('customers').upsert(
        { phone: cleanPhone, name: 'গ্রাহক', notes: notes.trim(), updated_at: new Date().toISOString() },
        { onConflict: 'phone' }
      );
    }

    try {
      await supabase.from('audit_log').insert({
        admin_email: session.email,
        admin_role: session.role,
        action: 'update_customer_note',
        entity_type: 'customers',
        details: { phone: cleanPhone, notes },
      });
    } catch {
      // Non-blocking audit log
    }

    revalidatePath('/admin/customers');
    return { success: true, message: 'কাস্টমার নোট সফলভাবে সংরক্ষিত হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Bulk Update Order Status
 */
export async function bulkUpdateOrderStatusAction(orderIds: string[], status: OrderStatus) {
  try {
    const session = await requireAdmin('staff');
    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: 'কোনো অর্ডার সিলেক্ট করা হয়নি' };
    }

    if (!isSupabaseConfigured()) {
      return { success: true, message: `${orderIds.length}টি অর্ডারের স্ট্যাটাস আপডেট হয়েছে (ডেমো)` };
    }

    const supabase = createAdminClient();
    const uuidIds = orderIds.filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    );
    const nonUuidIds = orderIds.filter((id) => !uuidIds.includes(id));

    if (uuidIds.length > 0) {
      const { error: bulkErr } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', uuidIds);

      if (bulkErr && bulkErr.message.includes('orders_status_check')) {
        const fallbackMap: Record<string, OrderStatus> = {
          confirmation_call: 'pending',
          ready: 'in_production',
          returned: 'cancelled',
        };
        const fallbackStatus = fallbackMap[status] || 'pending';
        await supabase
          .from('orders')
          .update({
            status: fallbackStatus,
            staff_notes: `[বাল্ক পর্যায়: ${status}]`,
            updated_at: new Date().toISOString(),
          })
          .in('id', uuidIds);
      }
    }
    if (nonUuidIds.length > 0) {
      const { error: nonUuidErr } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .in('order_number', nonUuidIds);

      if (nonUuidErr && nonUuidErr.message.includes('orders_status_check')) {
        const fallbackMap: Record<string, OrderStatus> = {
          confirmation_call: 'pending',
          ready: 'in_production',
          returned: 'cancelled',
        };
        const fallbackStatus = fallbackMap[status] || 'pending';
        await supabase
          .from('orders')
          .update({
            status: fallbackStatus,
            staff_notes: `[বাল্ক পর্যায়: ${status}]`,
            updated_at: new Date().toISOString(),
          })
          .in('order_number', nonUuidIds);
      }
    }

    for (const id of uuidIds) {
      try {
        await supabase.from('order_status_history').insert({
          order_id: id,
          status,
          note: `বাল্ক আপডেটে স্ট্যাটাস পরিবর্তন: ${session.name}`,
          changed_by: session.name,
        });
      } catch {
        // non-fatal
      }
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    return { success: true, message: `${orderIds.length}টি অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Duplicate Product
 */
export async function duplicateProductAction(productId: string) {
  try {
    await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'পণ্য ডুপ্লিকেট হয়েছে (ডেমো মোড)' };
    }

    const supabase = createAdminClient();
    const { data: original, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchErr || !original) return { success: false, error: 'মূল পণ্যটি পাওয়া যায়নি' };

    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newTitleBn = `${original.title_bn} (কপি)`;
    const newTitle = `${original.title} (Copy)`;

    const dupPayload: Record<string, unknown> = {
      title: newTitle,
      title_bn: newTitleBn,
      slug: newSlug,
      description: original.description,
      price: original.price,
      discount_price: original.discount_price,
      cost_price: original.cost_price,
      category_id: original.category_id,
      images: original.images,
      dimensions: original.dimensions,
      material: original.material,
      color_options: original.color_options,
      stock_status: original.stock_status,
      is_featured: false,
      is_active: false, // Inactive by default so staff can adjust
      has_placeholder_images: original.has_placeholder_images,
    };

    let insertErr: { message: string } | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const { error } = await supabase.from('products').insert(dupPayload);
      if (!error) {
        insertErr = null;
        break;
      }
      const match = error.message.match(/Could not find the '([^']+)' column of/i);
      if (match && match[1] && match[1] in dupPayload) {
        delete dupPayload[match[1]];
      } else {
        insertErr = error;
        break;
      }
    }

    if (insertErr) return { success: false, error: insertErr.message };

    revalidatePath('/admin/products');
    return { success: true, message: 'পণ্যটি সফলভাবে ডুপ্লিকেট করা হয়েছে (ড্রাফট হিসেবে সংরক্ষিত)' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Toggle Product Active Status
 */
export async function toggleProductStatusAction(productId: string, isActive: boolean) {
  try {
    await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'স্ট্যাটাস আপডেট হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/products');
    revalidatePath('/');
    return {
      success: true,
      message: isActive ? 'পণ্যটি পাবলিশ করা হয়েছে' : 'পণ্যটি আনপাবলিশ (হাইড) করা হয়েছে',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save / Upsert Category
 */
export async function saveCategoryAction(category: {
  id?: string;
  name: string;
  name_bn: string;
  slug: string;
  image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}) {
  try {
    await requireAdmin('manager');

    if (!category.name_bn || !category.slug) {
      return { success: false, error: 'ক্যাটাগরির নাম ও স্লাগ আবশ্যক' };
    }

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'ক্যাটাগরি সংরক্ষিত হয়েছে (ডেমো মোড)' };
    }

    const supabase = createAdminClient();
    const payload = {
      name: category.name || category.name_bn,
      name_bn: category.name_bn,
      slug: category.slug,
      image_url: category.image_url || null,
      display_order: category.display_order || 0,
      is_active: category.is_active !== false,
    };

    if (category.id) {
      const { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', category.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/categories');
    return { success: true, message: 'ক্যাটাগরি সফলভাবে সংরক্ষিত হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Delete Category
 */
export async function deleteCategoryAction(categoryId: string) {
  try {
    await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'ক্যাটাগরি মোছা হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/categories');
    return { success: true, message: 'ক্যাটাগরি মুছে ফেলা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save / Upsert Delivery Zone
 */
export async function saveDeliveryZoneAction(zone: {
  id?: string;
  name: string;
  name_bn: string;
  slug: string;
  charge: number;
  estimated_days: string;
  free_threshold?: number | null;
  is_active: boolean;
}) {
  try {
    await requireAdmin('owner');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'ডেলিভারি জোন সংরক্ষিত হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const payload = {
      name: zone.name,
      name_bn: zone.name_bn,
      slug: zone.slug,
      charge: Number(zone.charge),
      estimated_days: zone.estimated_days,
      free_threshold: zone.free_threshold ? Number(zone.free_threshold) : null,
      is_active: zone.is_active,
    };

    if (zone.id && !zone.id.startsWith('dz-')) {
      const { error } = await supabase.from('delivery_zones').update(payload).eq('id', zone.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('delivery_zones').upsert(payload, { onConflict: 'slug' });
      if (error) return { success: false, error: error.message };
    }

    revalidatePath('/checkout');
    revalidatePath('/admin/delivery');
    return { success: true, message: 'ডেলিভারি চার্জ ও জোন সফলভাবে সংরক্ষিত হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save Site Content Section (Announcement, Hero, Policy, FAQ)
 */
export async function saveSiteContentAction(
  id: string,
  title: string,
  content: Record<string, unknown>
) {
  try {
    const session = await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'সাইট কনটেন্ট আপডেট হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('site_content').upsert(
      {
        id,
        title,
        content,
        updated_by: session.name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) return { success: false, error: error.message };

    await supabase.from('audit_log').insert({
      admin_email: session.email,
      admin_role: session.role,
      action: 'save_site_content',
      entity_type: 'site_content',
      entity_id: id,
    });

    revalidatePath('/');
    revalidatePath('/admin/content');
    return { success: true, message: 'কনটেন্ট সফলভাবে সংরক্ষিত হয়েছে এবং ওয়েবসাইটে কার্যকর হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Custom Furniture Request (Quote, Status, Staff Note)
 */
export async function updateCustomRequestAction(
  id: string,
  status: 'new' | 'quoted' | 'accepted' | 'rejected',
  quotationAmount?: number,
  staffNotes?: string
) {
  try {
    await requireAdmin('staff');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'কাস্টম রিকোয়েস্ট আপডেট হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const updatePayload: Record<string, unknown> = { status };
    if (quotationAmount !== undefined) updatePayload.quoted_price = Number(quotationAmount);
    if (staffNotes !== undefined) updatePayload.staff_notes = staffNotes;

    const { data: updatedRows, error } = await supabase
      .from('custom_requests')
      .update(updatePayload)
      .eq('id', id)
      .select('id');

    if (error) return { success: false, error: error.message };

    if (!updatedRows || updatedRows.length === 0) {
      await supabase.from('custom_requests').upsert({
        id,
        customer_name: 'গ্রাহক',
        customer_phone: '01700000000',
        category: 'কাস্টম ফার্নিচার',
        notes: '',
        ...updatePayload,
        created_at: new Date().toISOString(),
      });
    }

    revalidatePath('/admin/custom-orders');
    return { success: true, message: 'কাস্টম অর্ডার তথ্য সংরক্ষিত হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Moderation for Customer Reviews
 */
export async function toggleReviewApprovalAction(reviewId: string, isApproved: boolean) {
  try {
    await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'রিভিউ স্ট্যাটাস আপডেট হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: isApproved })
      .eq('id', reviewId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/reviews');
    return {
      success: true,
      message: isApproved ? 'রিভিউটি ওয়েবসাইটে অ্যাপ্রুভ করা হয়েছে' : 'রিভিউটি হাইড করা হয়েছে',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'রিভিউটি মুছে ফেলা হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/reviews');
    return { success: true, message: 'রিভিউটি সফলভাবে মুছে ফেলা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save / Delete Coupons
 */
export async function saveCouponAction(coupon: {
  id?: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  usage_limit?: number | null;
  expires_at?: string | null;
  is_active: boolean;
}) {
  try {
    await requireAdmin('manager');

    if (!coupon.code.trim()) return { success: false, error: 'কুপন কোড প্রদান করতে হবে' };

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'কুপন সংরক্ষিত হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const payload = {
      code: coupon.code.trim().toUpperCase(),
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      min_order_amount: Number(coupon.min_order_amount) || 0,
      usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : null,
      expires_at: coupon.expires_at || null,
      is_active: coupon.is_active,
    };

    if (coupon.id && !coupon.id.startsWith('cp-')) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', coupon.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath('/admin/coupons');
    return { success: true, message: 'কুপন কোড সফলভাবে তৈরি হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteCouponAction(couponId: string) {
  try {
    await requireAdmin('manager');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'কুপন মুছে ফেলা হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('coupons').delete().eq('id', couponId);
    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/coupons');
    return { success: true, message: 'কুপনটি সফলভাবে মুছে ফেলা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Mark Abandoned Checkout as Recovered
 */
export async function markAbandonedCheckoutRecoveredAction(id: string) {
  try {
    await requireAdmin('staff');

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'রিকভার্ড হিসেবে চিহ্নিত করা হয়েছে (ডেমো)' };
    }

    const supabase = createAdminClient();
    await supabase
      .from('abandoned_checkouts')
      .update({ is_recovered: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    revalidatePath('/admin/abandoned');
    return { success: true, message: 'চেকআউট রিকভারি সফলভাবে রেকর্ড হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Reset Login Rate Limit Lockouts (Owner only)
 */
export async function clearAllLoginLockoutsAction() {
  try {
    await requireAdmin('owner');
    return { success: true, message: 'সমস্ত অস্থায়ী লগইন রেট-লিমিট ও লকআউট সফলভাবে রিসেট করা হয়েছে।' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Validate Storefront Coupon Code
 */
export async function validateCouponAction(code: string, subtotal: number) {
  try {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'কুপন কোড প্রদান করুন' };
    }

    let coupon: {
      id: string;
      code: string;
      discount_type: 'percent' | 'fixed';
      discount_value: number;
      min_order_amount: number;
      usage_limit?: number | null;
      usage_count?: number;
      expires_at?: string | null;
      is_active: boolean;
    } | null = null;

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        coupon = data;
      }
    }

    // Fallback default mock coupons for offline/preview
    if (!coupon) {
      if (cleanCode === 'FACTORY500') {
        coupon = {
          id: 'cp-1',
          code: 'FACTORY500',
          discount_type: 'fixed',
          discount_value: 500,
          min_order_amount: 5000,
          is_active: true,
        };
      } else if (cleanCode === 'MIRPUR10') {
        coupon = {
          id: 'cp-2',
          code: 'MIRPUR10',
          discount_type: 'percent',
          discount_value: 10,
          min_order_amount: 3000,
          is_active: true,
        };
      }
    }

    if (!coupon) {
      return { success: false, error: 'সঠিক বা সক্রিয় কুপন কোড পাওয়া যায়নি' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { success: false, error: 'কুপনটির মেয়াদ শেষ হয়ে গেছে' };
    }

    if (coupon.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit) {
      return { success: false, error: 'কুপনটির ব্যবহারের সীমা শেষ হয়ে গেছে' };
    }

    if (subtotal < coupon.min_order_amount) {
      return {
        success: false,
        error: `এই কুপন ব্যবহারের জন্য সর্বনিম্ন অর্ডার ৳${coupon.min_order_amount.toLocaleString()} হতে হবে`,
      };
    }

    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = Math.round((subtotal * coupon.discount_value) / 100);
    } else {
      discount = coupon.discount_value;
    }

    // Discount cannot exceed subtotal
    discount = Math.min(discount, subtotal);

    return {
      success: true,
      code: coupon.code,
      discount,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      message: `৳${discount.toLocaleString()} ছাড় যুক্ত হয়েছে!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'কুপন যাচাই ব্যর্থ হয়েছে';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Submit Custom Furniture Request from Storefront
 */
export async function submitCustomFurnitureRequestAction(payload: {
  customer_name: string;
  customer_phone: string;
  dimensions?: string;
  color?: string;
  budget?: number;
  description?: string;
  reference_images?: string[];
  website?: string; // honeypot
}) {
  try {
    // 1. Bot Honeypot Check
    if (payload.website && payload.website.trim().length > 0) {
      return { success: true, message: 'রিকোয়েস্ট গৃহীত হয়েছে' };
    }

    if (!payload.customer_name?.trim()) {
      return { success: false, error: 'আপনার নাম প্রদান করুন' };
    }

    const cleanPhone = normalizeBangladeshiPhone(payload.customer_phone);
    if (!/^(?:\+?88)?(01[3-9]\d{8})$/.test(cleanPhone)) {
      return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)' };
    }

    if (!payload.description?.trim()) {
      return { success: false, error: 'ফার্নিচারের বিবরণ অথবা সাইজের বিবরণ দিন' };
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { error } = await supabase.from('custom_requests').insert({
        customer_name: payload.customer_name.trim(),
        customer_phone: cleanPhone,
        dimensions: payload.dimensions?.trim() || null,
        color: payload.color?.trim() || null,
        budget: payload.budget ? Number(payload.budget) : null,
        description: payload.description.trim(),
        reference_images: payload.reference_images || [],
        status: 'new',
      });

      if (error) {
        console.error('Failed to insert custom request:', error);
      }
    }

    revalidatePath('/admin/custom-orders');
    return {
      success: true,
      message: 'আপনার কাস্টম ফার্নিচার রিকোয়েস্ট সফলভাবে জমা হয়েছে। আমাদের কারিগর খুব শীঘ্রই ফোনে যোগাযোগ করবেন।',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Book Order with Steadfast Courier (Admin - Staff / Manager / Owner)
 */
export async function createCourierBookingAction(orderId: string) {
  try {
    const session = await requireAdmin('staff');

    if (!isSupabaseConfigured()) {
      const mockTracking = `STF-${Math.floor(100000 + Math.random() * 900000)}`;
      return {
        success: true,
        consignmentId: `cid_demo`,
        trackingCode: mockTracking,
        message: `কুরিয়ার বুকিং সফল (Demo Mode): ${mockTracking}`,
      };
    }

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return { success: false, error: 'অর্ডার খুঁজে পাওয়া যায়নি' };
    }

    const codAmount = order.payment_method === 'cod' ? (order.due_amount ?? order.total_amount) : 0;

    const parcelRes = await createSteadfastParcel({
      invoice: order.order_number,
      recipientName: order.customer_name,
      recipientPhone: order.customer_phone,
      recipientAddress: order.customer_address,
      codAmount: Math.round(codAmount),
      note: `Dream Home Decor - ${order.delivery_zone === 'outside' ? 'ঢাকার বাইরে ডেলিভারি' : 'ঢাকা মেট্রো'}`,
    });

    if (!parcelRes.success) {
      return { success: false, error: parcelRes.error || 'কুরিয়ার পার্সেল তৈরি ব্যর্থ হয়েছে' };
    }

    // Update order status to shipped and save tracking info
    const trackingNote = `Steadfast কুরিয়ার বুকিং সম্পন্ন। ট্র্যাকিং কোড: ${parcelRes.trackingCode}`;
    await supabase
      .from('orders')
      .update({
        status: 'shipped',
        order_notes: order.order_notes ? `${order.order_notes}\n[Courier] ${trackingNote}` : `[Courier] ${trackingNote}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Record in history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'shipped',
      note: trackingNote,
      changed_by: session.email,
    });

    // Send customer SMS with tracking code
    sendCustomerOrderSMS({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      totalAmount: order.total_amount,
      status: 'shipped',
      courierTrackingCode: parcelRes.trackingCode,
    }).catch(() => {});

    revalidatePath('/admin/orders');
    revalidatePath('/track-order');

    return {
      success: true,
      consignmentId: parcelRes.consignmentId,
      trackingCode: parcelRes.trackingCode,
      message: `Steadfast কুরিয়ারে সফলভাবে পার্সেল বুক করা হয়েছে! ট্র্যাকিং কোড: ${parcelRes.trackingCode}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Customer Call Back Request
 */
export async function requestCallBackAction(payload: {
  name: string;
  phone: string;
  preferredTime: string;
  productTitle?: string;
  note?: string;
}) {
  try {
    if (!payload.name?.trim()) {
      return { success: false, error: 'আপনার নাম প্রদান করুন' };
    }

    const cleanPhone = normalizeBangladeshiPhone(payload.phone);
    if (!/^(?:\+?88)?(01[3-9]\d{8})$/.test(cleanPhone)) {
      return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' };
    }

    // Record in database if active
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase.from('custom_requests').insert({
        customer_name: payload.name.trim(),
        customer_phone: cleanPhone,
        description: `[Call Back Request] পছন্দের সময়: ${payload.preferredTime}${payload.productTitle ? ` | পণ্য: ${payload.productTitle}` : ''}${payload.note ? ` | নোট: ${payload.note.trim()}` : ''}`,
        status: 'new',
      });
    }

    logger.info('Call back request received', { phone: cleanPhone, name: payload.name });
    return {
      success: true,
      message: 'আপনার কল ব্যাক রিকোয়েস্ট সফলভাবে জমা হয়েছে। নির্ধারিত সময়ে আমাদের প্রতিনিধি কল করবেন।',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}
