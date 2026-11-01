'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { OrderStatus, DeliveryZone, PaymentMethod, WorkshopData } from '@/types/database';
import { isSupabaseConfigured } from '@/lib/data';
import { validateBangladeshiPhone } from '@/lib/utils';
import { DEFAULT_WORKSHOP_DATA } from '@/lib/mock-data';

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_zone: DeliveryZone;
  delivery_charge: number;
  subtotal: number;
  total_amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  order_notes?: string;
  items: Array<{
    product_id: string;
    product_title: string;
    selected_color?: string;
    quantity: number;
    unit_price: number;
  }>;
}

/**
 * Server Action: Submit an Order from Storefront Checkout or Quick Order
 */
export async function submitOrderAction(payload: CreateOrderPayload) {
  try {
    // 1. Validation
    if (!payload.customer_name?.trim()) {
      return { success: false, error: 'অনুগ্রহ করে আপনার নাম লিখুন (Please enter your name)' };
    }

    const phoneCheck = validateBangladeshiPhone(payload.customer_phone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        error: 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (e.g., 017XXXXXXXX)',
      };
    }

    if (!payload.customer_address?.trim() || payload.customer_address.trim().length < 6) {
      return {
        success: false,
        error: 'অনুগ্রহ করে আপনার বিস্তারিত ঠিকানা দিন (বাসা, রোড, এলাকা)',
      };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'অর্ডারের পণ্য তালিকা খালি' };
    }

    // Fallback if Supabase is not configured yet (e.g. preview mode)
    const orderNumber = `DHD-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!isSupabaseConfigured()) {
      return {
        success: true,
        orderNumber,
        message: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে (Demo Mode)!',
      };
    }

    const supabase = await createClient();

    // 2. Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: payload.customer_name.trim(),
        customer_phone: phoneCheck.formatted,
        customer_address: payload.customer_address.trim(),
        delivery_zone: payload.delivery_zone,
        delivery_charge: payload.delivery_charge,
        subtotal: payload.subtotal,
        total_amount: payload.total_amount,
        payment_method: payload.payment_method,
        transaction_id: payload.transaction_id?.trim() || null,
        order_notes: payload.order_notes?.trim() || null,
        status: 'pending',
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      console.error('Supabase order insert error:', orderError);
      return { success: false, error: 'অর্ডার সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
    }

    // 3. Insert order items
    const orderItems = payload.items.map((item) => ({
      order_id: orderData.id,
      product_id: item.product_id || null,
      product_title: item.product_title,
      selected_color: item.selected_color || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      console.error('Supabase order items error:', itemsError);
    }

    // On-demand revalidation
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
    return { success: false, error: `অর্ডার প্রক্রিয়াকরণে সমস্যা: ${msg}` };
  }
}

/**
 * Server Action: Update Order Status (Admin)
 */
export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, message: `Status updated to ${status} (Demo mode)` };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

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
 * Server Action: Save / Update Product (Admin)
 */
export async function saveProductAction(productData: {
  id?: string;
  title: string;
  title_bn: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number | null;
  category_id?: string | null;
  images: string[];
  dimensions?: string;
  material?: string;
  color_options: string[];
  stock_status: 'in_stock' | 'made_to_order' | 'out_of_stock';
  is_featured: boolean;
  is_active: boolean;
}) {
  try {
    if (!productData.title || !productData.slug || !productData.price) {
      return { success: false, error: 'Title, slug, and price are required' };
    }

    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Product saved successfully (Demo mode)' };
    }

    const supabase = await createClient();

    const payload = {
      title: productData.title.trim(),
      title_bn: productData.title_bn.trim() || productData.title.trim(),
      slug: productData.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: productData.description.trim(),
      price: Number(productData.price),
      discount_price: productData.discount_price ? Number(productData.discount_price) : null,
      category_id: productData.category_id || null,
      images: productData.images.filter(Boolean),
      dimensions: productData.dimensions?.trim() || null,
      material: productData.material?.trim() || null,
      color_options: productData.color_options.filter(Boolean),
      stock_status: productData.stock_status,
      is_featured: productData.is_featured,
      is_active: productData.is_active,
      updated_at: new Date().toISOString(),
    };

    if (productData.id) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productData.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) return { success: false, error: error.message };
    }

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
 * Server Action: Delete Product (Admin)
 */
export async function deleteProductAction(productId: string) {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Product deleted (Demo mode)' };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) return { success: false, error: error.message };

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
 * Server Action: Save Site Settings & Brand Details (Admin)
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
}) {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Settings saved successfully (Demo mode)' };
    }

    const supabase = await createClient();
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
 * Server Action: Save / Delete Campaign Giveaway
 */
export async function saveCampaignAction(campaign: {
  id?: string;
  title: string;
  description: string;
  banner_url: string;
  end_date?: string;
  facebook_post_link?: string;
  is_active: boolean;
}) {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Campaign saved (Demo mode)' };
    }

    const supabase = await createClient();
    if (campaign.id) {
      const { error } = await supabase
        .from('campaigns_giveaways')
        .update(campaign)
        .eq('id', campaign.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('campaigns_giveaways').insert(campaign);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/campaigns');
    return { success: true, message: 'ক্যাম্পেইন সফলভাবে সংরক্ষিত হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteCampaignAction(campaignId: string) {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, message: 'Campaign deleted (Demo mode)' };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('campaigns_giveaways').delete().eq('id', campaignId);
    if (error) return { success: false, error: error.message };

    revalidatePath('/');
    revalidatePath('/admin/campaigns');
    return { success: true, message: 'ক্যাম্পেইন ডিলিট করা হয়েছে' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Save Workshop Showcase Content (Admin)
 */
export async function saveWorkshopDataAction(payload: WorkshopData) {
  try {
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
        description: payload.videoCard?.description?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.description,
        buttonText: payload.videoCard?.buttonText?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.buttonText,
        buttonUrl: payload.videoCard?.buttonUrl?.trim() || DEFAULT_WORKSHOP_DATA.videoCard.buttonUrl,
      },
      updated_at: new Date().toISOString(),
    };

    // 1. Write to data/workshop.json for guaranteed local & static persistence
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const dirPath = path.join(process.cwd(), 'data');
      await fs.mkdir(dirPath, { recursive: true });
      const filePath = path.join(dirPath, 'workshop.json');
      await fs.writeFile(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');
    } catch (fsErr) {
      console.error('File write error for workshop.json:', fsErr);
    }

    // 2. If Supabase is configured, attempt to save to workshop_settings
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('workshop_settings' as any) as any)
          .upsert({
            id: 1,
            badge: cleanData.badge,
            title: cleanData.title,
            description: cleanData.description,
            steps: cleanData.steps,
            video_card: cleanData.videoCard,
            updated_at: cleanData.updated_at,
          });
      } catch (sbErr) {
        // Warning only, table may not exist yet in Supabase
        console.warn('Supabase workshop sync warning:', sbErr);
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
 * Server Action: Reset Workshop Showcase to Default Factory Data
 */
export async function resetWorkshopDataAction() {
  return await saveWorkshopDataAction(DEFAULT_WORKSHOP_DATA);
}
