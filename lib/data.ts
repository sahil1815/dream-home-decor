import { getPublicClient } from '@/lib/supabase/public';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  normalizeBangladeshiPhone,
  maskPhoneNumber,
  maskAddress,
} from '@/lib/validations/order';
import {
  MOCK_SITE_SETTINGS,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_CAMPAIGNS,
  MOCK_SAMPLE_ORDERS,
  DEFAULT_WORKSHOP_DATA,
} from '@/lib/mock-data';
import {
  SiteSettings,
  Category,
  Product,
  CampaignGiveaway,
  Order,
  WorkshopData,
  DeliveryZoneConfig,
  AuditLogEntry,
  CustomFurnitureRequest,
  Customer,
  Review,
  Coupon,
  AbandonedCheckout,
} from '@/types/database';

export const revalidate = 3600; // 1-hour ISR cache default

// Helper to ensure database queries never hang past a timeout threshold
async function withTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 3500
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback);
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]).catch(() => {
    clearTimeout(timer);
    return fallback;
  });
}

// Check if valid Supabase connection is available
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return (
    !!url &&
    !url.includes('placeholder-project') &&
    !!key &&
    !key.includes('placeholder')
  );
}

/**
 * Fetch Site Settings (Brand, logo, delivery charge, hotline)
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) {
    return MOCK_SITE_SETTINGS;
  }

  const query = (async () => {
    try {
      const supabase = getPublicClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) {
        return MOCK_SITE_SETTINGS;
      }

      return data as SiteSettings;
    } catch {
      return MOCK_SITE_SETTINGS;
    }
  })();

  return withTimeout(query, MOCK_SITE_SETTINGS);
}

/**
 * Fetch active categories
 */
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CATEGORIES;
  }

  const query = (async () => {
    try {
      const supabase = getPublicClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_CATEGORIES;
      }

      return data as Category[];
    } catch {
      return MOCK_CATEGORIES;
    }
  })();

  return withTimeout(query, MOCK_CATEGORIES);
}

/**
 * Fetch products with optional filtering
 */
export async function getProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  const fallbackProducts = () => {
    let list = [...MOCK_PRODUCTS];
    if (options?.featured) {
      list = list.filter((p) => p.is_featured);
    }
    if (options?.categorySlug) {
      const cat = MOCK_CATEGORIES.find((c) => c.slug === options.categorySlug);
      if (cat) {
        list = list.filter((p) => p.category_id === cat.id);
      }
    }
    if (options?.limit) {
      list = list.slice(0, options.limit);
    }
    return list;
  };

  if (!isSupabaseConfigured()) {
    return fallbackProducts();
  }

  const query = (async () => {
    try {
      const supabase = getPublicClient();
      let q = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (options?.featured) {
        q = q.eq('is_featured', true);
      }

      if (options?.limit) {
        q = q.limit(options.limit);
      }

      const { data, error } = await q;

      if (error || !data || data.length === 0) {
        return fallbackProducts();
      }

      if (options?.categorySlug) {
        return (data as Product[]).filter(
          (p) => p.category?.slug === options.categorySlug
        );
      }

      return data as Product[];
    } catch {
      return fallbackProducts();
    }
  })();

  return withTimeout(query, fallbackProducts());
}

/**
 * Fetch single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const getMockProduct = () => {
    const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
    if (!found) return null;
    const cat = MOCK_CATEGORIES.find((c) => c.id === found.category_id);
    return { ...found, category: cat };
  };

  if (!isSupabaseConfigured()) {
    return getMockProduct();
  }

  const query = (async () => {
    try {
      const supabase = getPublicClient();
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return getMockProduct();
      }

      return data as Product;
    } catch {
      return getMockProduct();
    }
  })();

  return withTimeout(query, getMockProduct());
}

/**
 * Fetch promotional campaigns/lotteries
 * @param options.onlyActive - If true (default), returns only active campaigns for storefront. If false, returns all for admin.
 */
export async function getCampaigns(options?: { onlyActive?: boolean }): Promise<CampaignGiveaway[]> {
  const onlyActive = options?.onlyActive ?? true;

  if (!isSupabaseConfigured()) {
    return onlyActive ? MOCK_CAMPAIGNS.filter((c) => c.is_active) : MOCK_CAMPAIGNS;
  }

  const query = (async () => {
    try {
      const supabase = getPublicClient();

      // Query all campaigns from Supabase
      const { data, error } = await supabase
        .from('campaigns_giveaways')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getCampaigns warning:', error.message);
        return onlyActive ? MOCK_CAMPAIGNS.filter((c) => c.is_active) : MOCK_CAMPAIGNS;
      }

      // If Supabase has records
      if (data && data.length > 0) {
        const list = data as CampaignGiveaway[];
        return onlyActive ? list.filter((c) => c.is_active) : list;
      }

      // If database has 0 rows, return initial mock
      return onlyActive ? MOCK_CAMPAIGNS.filter((c) => c.is_active) : MOCK_CAMPAIGNS;
    } catch {
      return onlyActive ? MOCK_CAMPAIGNS.filter((c) => c.is_active) : MOCK_CAMPAIGNS;
    }
  })();

  const fallback = onlyActive ? [] : MOCK_CAMPAIGNS;
  return withTimeout(query, fallback);
}

/**
 * Fetch all campaigns for Admin management (both active and inactive)
 */
export async function getAllCampaigns(): Promise<CampaignGiveaway[]> {
  return getCampaigns({ onlyActive: false });
}

/**
 * Securely track an order requiring BOTH order number AND customer phone.
 * Restricts access, revokes public enumeration, and masks sensitive customer PII.
 */
export async function trackOrderSecure(
  orderNumber: string,
  customerPhone: string
): Promise<Order | null> {
  const cleanOrderNum = orderNumber.trim().toUpperCase();
  const cleanPhone = normalizeBangladeshiPhone(customerPhone.trim());

  if (!cleanOrderNum || !cleanPhone || cleanPhone.length < 11) {
    return null;
  }

  const maskOrderPII = (o: Order): Order => ({
    ...o,
    customer_phone: maskPhoneNumber(o.customer_phone),
    customer_address: maskAddress(o.customer_address, o.delivery_zone),
  });

  const getMockOrder = (): Order | null => {
    const match = MOCK_SAMPLE_ORDERS.find(
      (o) =>
        o.order_number.toUpperCase() === cleanOrderNum &&
        normalizeBangladeshiPhone(o.customer_phone) === cleanPhone
    );
    return match ? maskOrderPII(match) : null;
  };

  if (!isSupabaseConfigured()) {
    return getMockOrder();
  }

  const query = (async () => {
    try {
      // Use service role admin client to bypass public RLS securely inside server execution
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), status_history:order_status_history(*)')
        .eq('order_number', cleanOrderNum)
        .maybeSingle();

      if (error || !data) {
        return getMockOrder();
      }

      // Verify that normalized phone matches the order record
      const orderDbPhone = normalizeBangladeshiPhone(data.customer_phone || '');
      if (orderDbPhone !== cleanPhone) {
        // Phone doesn't match this order -> deny access without revealing existence
        return null;
      }

      return maskOrderPII(data as Order);
    } catch {
      return getMockOrder();
    }
  })();

  return withTimeout(query, getMockOrder());
}

/**
 * Backward compatibility stub for trackOrderQuery (deprecated).
 */
export async function trackOrderQuery(query: string): Promise<Order[]> {
  const parts = query.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const order = await trackOrderSecure(parts[0], parts[1]);
    return order ? [order] : [];
  }
  return [];
}

/**
 * Fetch Workshop Showcase Data (steps, video banner, badge, texts)
 */
export async function getWorkshopData(): Promise<WorkshopData> {
  const getFromFileOrMock = async (): Promise<WorkshopData> => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'data', 'workshop.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        return parsed as WorkshopData;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WORKSHOP_DATA;
  };

  if (!isSupabaseConfigured()) {
    return getFromFileOrMock();
  }

  const query = (async () => {
    try {
      const supabase = getPublicClient();
      const { data, error } = await supabase
        .from('workshop_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) {
        return getFromFileOrMock();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data as any;
      return {
        badge: row.badge || DEFAULT_WORKSHOP_DATA.badge,
        title: row.title || DEFAULT_WORKSHOP_DATA.title,
        description: row.description || DEFAULT_WORKSHOP_DATA.description,
        steps: Array.isArray(row.steps) && row.steps.length > 0 ? row.steps : DEFAULT_WORKSHOP_DATA.steps,
        videoCard: row.video_card && typeof row.video_card === 'object' ? row.video_card : DEFAULT_WORKSHOP_DATA.videoCard,
        updated_at: row.updated_at,
      } as WorkshopData;
    } catch {
      return getFromFileOrMock();
    }
  })();

  return withTimeout(query, DEFAULT_WORKSHOP_DATA);
}

/**
 * Admin: Fetch all orders with items, status history and internal notes
 */
export async function getAllOrdersAdmin(options?: {
  status?: string;
  limit?: number;
}): Promise<Order[]> {
  const getMockOrders = () => {
    let list = MOCK_SAMPLE_ORDERS;
    if (options?.status && options.status !== 'all') {
      list = list.filter((o) => o.status === options.status);
    }
    if (options?.limit) {
      list = list.slice(0, options.limit);
    }
    return list;
  };

  if (!isSupabaseConfigured()) {
    return getMockOrders();
  }

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      let q = supabase
        .from('orders')
        .select('*, order_items(*), status_history:order_status_history(*), notes_history:order_notes(*)')
        .order('created_at', { ascending: false });

      if (options?.status && options.status !== 'all') {
        q = q.eq('status', options.status);
      }
      if (options?.limit) {
        q = q.limit(options.limit);
      }

      const { data, error } = await q;
      if (error || !data || data.length === 0) {
        return getMockOrders();
      }
      return data as Order[];
    } catch {
      return getMockOrders();
    }
  })();

  return withTimeout(query, getMockOrders());
}

export interface AdminDashboardStats {
  todayOrdersCount: number;
  todayRevenue: number;
  weekOrdersCount: number;
  weekRevenue: number;
  totalPlacedRevenue: number;
  totalDeliveredRevenue: number;
  statusCounts: Record<string, number>;
  needsAttentionOrders: Order[];
  topProducts: Array<{ title: string; count: number; revenue: number }>;
  lowStockProducts: Product[];
  recentOrders: Order[];
  totalOrdersCount: number;
}

/**
 * Admin: Fetch comprehensive dashboard metrics and alerts
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [orders, products] = await Promise.all([
    getAllOrdersAdmin({ limit: 100 }),
    getProducts(),
  ]);

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;

  let todayOrdersCount = 0;
  let todayRevenue = 0;
  let weekOrdersCount = 0;
  let weekRevenue = 0;
  let totalPlacedRevenue = 0;
  let totalDeliveredRevenue = 0;

  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmation_call: 0,
    confirmed: 0,
    in_production: 0,
    ready: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };

  const needsAttentionOrders: Order[] = [];
  const productSalesMap = new Map<string, { title: string; count: number; revenue: number }>();

  for (const order of orders) {
    const createdTime = new Date(order.created_at).getTime();
    const amount = Number(order.total_amount) || 0;

    // Status counts
    if (statusCounts[order.status] !== undefined) {
      statusCounts[order.status]++;
    }

    // Revenue calculations
    if (order.status !== 'cancelled' && order.status !== 'returned') {
      totalPlacedRevenue += amount;

      if (createdTime >= oneDayAgo) {
        todayOrdersCount++;
        todayRevenue += amount;
      }
      if (createdTime >= oneWeekAgo) {
        weekOrdersCount++;
        weekRevenue += amount;
      }
    }

    if (order.status === 'delivered') {
      totalDeliveredRevenue += amount;
    }

    // Needs attention:
    // 1. Pending for more than 2 hours without confirmation call
    // 2. bKash/Nagad manual payment not yet verified
    const isOldPending = order.status === 'pending' && createdTime <= twoHoursAgo;
    const isUnverifiedMFS =
      (order.payment_method === 'bkash' ||
        order.payment_method === 'nagad' ||
        order.payment_method === 'bkash_manual' ||
        order.payment_method === 'nagad_manual') &&
      order.status !== 'cancelled' &&
      order.status !== 'delivered' &&
      !order.payment_verified;

    if (isOldPending || isUnverifiedMFS || order.is_flagged_suspicious) {
      needsAttentionOrders.push(order);
    }

    // Product frequency
    if (order.order_items) {
      for (const item of order.order_items) {
        const title = item.product_title || 'ফার্নিচার';
        const existing = productSalesMap.get(title) || { title, count: 0, revenue: 0 };
        existing.count += item.quantity || 1;
        existing.revenue += Number(item.unit_price) * (item.quantity || 1);
        productSalesMap.set(title, existing);
      }
    }
  }

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const lowStockProducts = products.filter(
    (p) => p.stock_status === 'out_of_stock' || p.stock_status === 'made_to_order'
  );

  return {
    todayOrdersCount,
    todayRevenue,
    weekOrdersCount,
    weekRevenue,
    totalPlacedRevenue,
    totalDeliveredRevenue,
    statusCounts,
    needsAttentionOrders: needsAttentionOrders.slice(0, 10),
    topProducts,
    lowStockProducts,
    recentOrders: orders.slice(0, 8),
    totalOrdersCount: orders.length,
  };
}

/**
 * Admin: Fetch Delivery Zones
 */
export async function getDeliveryZones(): Promise<DeliveryZoneConfig[]> {
  const defaultZones: DeliveryZoneConfig[] = [
    {
      id: 'dz-inside',
      name: 'Inside Dhaka Metro',
      name_bn: 'ঢাকা মেট্রোপলিটন এলাকা',
      slug: 'inside',
      charge: 120,
      estimated_days: '১-২ কর্মদিবস',
      free_threshold: 15000,
      is_active: true,
    },
    {
      id: 'dz-outside',
      name: 'Outside Dhaka (All BD)',
      name_bn: 'ঢাকার বাইরে (সারাদেশ)',
      slug: 'outside',
      charge: 200,
      estimated_days: '৩-৫ কর্মদিবস',
      free_threshold: 25000,
      is_active: true,
    },
  ];

  if (!isSupabaseConfigured()) return defaultZones;

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('charge', { ascending: true });
      if (error || !data || data.length === 0) return defaultZones;
      return data as DeliveryZoneConfig[];
    } catch {
      return defaultZones;
    }
  })();

  return withTimeout(query, defaultZones);
}

/**
 * Admin: Fetch Site Content Pages and Sections
 */
export async function getSiteContentMap(): Promise<
  Record<string, { id: string; title: string; content: Record<string, unknown>; updated_at?: string }>
> {
  const defaultContent: Record<
    string,
    { id: string; title: string; content: Record<string, unknown>; updated_at?: string }
  > = {
    announcement: {
      id: 'announcement',
      title: 'টপ অ্যানাউন্সমেন্ট বার',
      content: {
        enabled: true,
        text: '🎉 মিরপুর নিজস্ব কারখানা থেকে সরাসরি ফার্নিচার কিনুন! সারাদেশে ক্যাশ অন ডেলিভারি।',
        link: '/products',
      },
    },
    hero: {
      id: 'hero',
      title: 'হোমপেজ হিরো সেকশন',
      content: {
        badge: 'সরাসরি নিজস্ব কারখানায় তৈরি • ফ্যাক্টরি হোলসেল রেট',
        title: 'প্রিমিয়াম কোয়ালিটি মেলামাইন ও কাঠের ফার্নিচার',
        subtitle: 'মিরপুর নিজস্ব কারখানায় উন্নত মেশিনারিজ ও দক্ষ কারিগর দ্বারা প্রস্তুতকৃত। মধ্যস্বত্বভোগী ছাড়া পান নির্ভরযোগ্য স্থায়িত্ব।',
        cta_text: 'ফার্নিচার কালেকশন দেখুন',
        cta_link: '/products',
      },
    },
    delivery_policy: {
      id: 'delivery_policy',
      title: 'ডেলিভারি পলিসি',
      content: {
        lead_time_inside: '১-২ কর্মদিবস (হোম ডেলিভারি)',
        lead_time_outside: '৩-৫ কর্মদিবস (রেডএক্স বা সুন্দরবন কুরিয়ার)',
        packaging: 'হেভি-ডিউটি বাবল র‍্যাপ এবং ৪-কোণা কর্নার প্রোটেকশন দিয়ে প্যাক করা হয়।',
      },
    },
    return_policy: {
      id: 'return_policy',
      title: 'রিটার্ন ও রিফান্ড পলিসি',
      content: {
        condition: 'ডেলিভারিম্যানের উপস্থিতিতে পার্সেল চেক করে গ্রহণ করুন। কোনো ত্রুটি বা সাইজ সমস্যা থাকলে তাৎক্ষণিক ফেরত দিতে পারবেন।',
        damage_warranty: 'পরিবহনজনিত ভাঙচুর বা ত্রুটির ক্ষেত্রে ২৪ ঘণ্টার মধ্যে অভিযোগ দিলে বিনামূল্যে রিপ্লেসমেন্ট প্রদান করা হয়।',
      },
    },
    faq: {
      id: 'faq',
      title: 'সাধারণ প্রশ্নোত্তর (FAQ)',
      content: {
        items: [
          {
            q: 'আপনারা কি সম্পূর্ণ নিজস্ব কারখানায় ফার্নিচার তৈরি করেন?',
            a: 'হ্যাঁ, আমাদের কারখানা মিরপুর-১০ এ অবস্থিত। কাঠ কাটিং, এজ ব্যান্ডিং ও ফিটিং সবকিছু নিজস্ব দক্ষ কারিগর দ্বারা সম্পন্ন হয়।',
          },
          {
            q: 'ডেলিভারির সময় কি খুলে চেক করা যাবে?',
            a: 'অবশ্যই! আমাদের প্রতিটি পণ্যে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। ডেলিভারিম্যান সামনে থাকা অবস্থায় পণ্য খুলে সন্তুষ্ট হয়ে পেমেন্ট করবেন।',
          },
          {
            q: 'কাস্টম সাইজ বা অন্য কালারে বানানো যাবে?',
            a: 'হ্যাঁ, আপনার ঘরের মাপ অনুযায়ী যেকোনো কালার ও সাইজে আমরা ফার্নিচার বানিয়ে দিতে পারি। WhatsApp-এ যোগাযোগ করুন।',
          },
        ],
      },
    },
    contact_details: {
      id: 'contact_details',
      title: 'যোগাযোগ ও শোরুমের ঠিকানা',
      content: {
        address: 'মিরপুর-১০, ঢাকা, বাংলাদেশ (সরাসরি নিজস্ব কারখানা ও শোরুম)',
        hours: 'প্রতিদিন সকাল ১০:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত খোলা',
        phone: '01712-345678',
        whatsapp: '8801712345678',
        email: 'info@dreamhomedecor.com',
      },
    },
  };

  if (!isSupabaseConfigured()) return defaultContent;

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('site_content').select('*');
      if (error || !data || data.length === 0) return defaultContent;

      const map: Record<
        string,
        { id: string; title: string; content: Record<string, unknown>; updated_at?: string }
      > = { ...defaultContent };

      for (const row of data) {
        map[row.id] = {
          id: row.id,
          title: row.title,
          content: (row.content as Record<string, unknown>) || {},
          updated_at: row.updated_at,
        };
      }
      return map;
    } catch {
      return defaultContent;
    }
  })();

  return withTimeout(query, defaultContent);
}

/**
 * Admin: Fetch Audit Logs
 */
export async function getAuditLogsList(limit = 100): Promise<AuditLogEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      return (data as AuditLogEntry[]) || [];
    } catch {
      return [];
    }
  })();

  return withTimeout(query, []);
}

/**
 * Admin: Fetch Custom Furniture Requests
 */
export async function getCustomRequestsList(): Promise<CustomFurnitureRequest[]> {
  const defaultRequests: CustomFurnitureRequest[] = [
    {
      id: 'cr-1',
      customer_name: 'তানভীর আহমেদ',
      customer_phone: '01711223344',
      dimensions: '5ft x 2.5ft x 3ft',
      color: 'Dark Walnut',
      budget: 8500,
      description: 'অফিস ডেস্কে মনিটর আর্ম মাউন্ট এবং ড্রয়ারের ডাবল চ্যানেল ড্রপ চাই।',
      status: 'new',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'cr-2',
      customer_name: 'নাসরিন সুলতানা',
      customer_phone: '01899887766',
      dimensions: '4ft x 1ft x 6ft',
      color: 'White & Gold',
      budget: 6500,
      description: 'বেডরুমের কর্নারে কাচের পাল্লা সহ বইয়ের ডিসপ্লে র‍্যাক।',
      status: 'quoted',
      quoted_price: 7200,
      staff_notes: 'মেলামাইন বোর্ড ও ৫ মিমি গ্লাস দরজার কোটেশন পাঠানো হয়েছে।',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  if (!isSupabaseConfigured()) return defaultRequests;

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!data || data.length === 0) return defaultRequests;
      return data as CustomFurnitureRequest[];
    } catch {
      return defaultRequests;
    }
  })();

  return withTimeout(query, defaultRequests);
}

/**
 * Admin: Fetch Customers Directory
 */
export async function getCustomersDirectory(): Promise<Customer[]> {
  const defaultCustomers: Customer[] = [
    {
      id: 'c-1',
      name: 'রফিকুল ইসলাম',
      phone: '01711223344',
      address: 'রোড ১২, সেক্টর ৪, উত্তরা, ঢাকা',
      delivery_zone: 'inside',
      total_orders: 3,
      total_spent: 12500,
      is_blocked: false,
      notes: 'নিয়মিত কাস্টমার, ফিনিশিং ভালো পছন্দ করেন',
      created_at: '2026-10-15T10:00:00Z',
    },
    {
      id: 'c-2',
      name: 'মাকসুদুর রহমান',
      phone: '01922334455',
      address: 'জিইসি মোড়, চট্টগ্রাম',
      delivery_zone: 'outside',
      total_orders: 1,
      total_spent: 4500,
      is_blocked: false,
      created_at: '2026-10-20T12:00:00Z',
    },
  ];

  if (!isSupabaseConfigured()) return defaultCustomers;

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false });
      if (!data || data.length === 0) return defaultCustomers;
      return data as Customer[];
    } catch {
      return defaultCustomers;
    }
  })();

  return withTimeout(query, defaultCustomers);
}

/**
 * Admin: Fetch Abandoned Checkouts
 */
export async function getAbandonedCheckoutsList(): Promise<AbandonedCheckout[]> {
  const defaultAbandoned: AbandonedCheckout[] = [
    {
      id: 'ac-1',
      customer_name: 'মাহমুদ হাসান',
      customer_phone: '01755667788',
      cart_items: [
        {
          title: 'স্মার্ট পড়ার টেবিল (বুকশেলফ সহ)',
          quantity: 1,
          price: 3800,
        },
      ],
      subtotal: 3800,
      is_recovered: false,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  if (!isSupabaseConfigured()) return defaultAbandoned;

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('abandoned_checkouts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!data || data.length === 0) return defaultAbandoned;
      return data as AbandonedCheckout[];
    } catch {
      return defaultAbandoned;
    }
  })();

  return withTimeout(query, defaultAbandoned);
}

/**
 * Admin: Fetch Customer Reviews
 */
export async function getReviewsList(): Promise<Review[]> {
  const defaultReviews: Review[] = [
    {
      id: 'rev-1',
      product_id: 'b0000000-0000-0000-0000-000000000001',
      customer_name: 'ইশতিয়াক আহমেদ, ধানমন্ডি',
      rating: 5,
      review_text:
        'মিরপুরের কারখানায় সরাসরি গিয়ে দেখে অর্ডার দিয়েছিলাম। কাঠের ফিনিশিং এবং পিভিসি এজ ব্যান্ডিং খুবই নিখুঁত। ধন্যবাদ ড্রিম হোম ডেকোর!',
      is_approved: true,
      created_at: '2026-10-25T14:30:00Z',
    },
    {
      id: 'rev-2',
      product_id: 'b0000000-0000-0000-0000-000000000003',
      customer_name: 'শারমিন আক্তার, মিরপুর',
      rating: 5,
      review_text:
        'কম্পিউটার টেবিলটা দেখতে অসাধারণ এবং ওজনে বেশ ভারী। কোনো নড়াচড়া নেই। সময়মতো ডেলিভারি পেয়েছি।',
      is_approved: true,
      created_at: '2026-10-28T09:15:00Z',
    },
  ];

  if (!isSupabaseConfigured()) return defaultReviews;

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!data || data.length === 0) return defaultReviews;
      return data as Review[];
    } catch {
      return defaultReviews;
    }
  })();

  return withTimeout(query, defaultReviews);
}

/**
 * Admin: Fetch Coupons
 */
export async function getCouponsList(): Promise<Coupon[]> {
  const defaultCoupons: Coupon[] = [
    {
      id: 'cp-1',
      code: 'FACTORY500',
      discount_type: 'fixed',
      discount_value: 500,
      min_order_amount: 5000,
      usage_limit: 100,
      usage_count: 24,
      expires_at: '2026-12-31T23:59:59Z',
      is_active: true,
    },
    {
      id: 'cp-2',
      code: 'MIRPUR10',
      discount_type: 'percent',
      discount_value: 10,
      min_order_amount: 3000,
      usage_limit: 50,
      usage_count: 12,
      expires_at: '2026-11-30T23:59:59Z',
      is_active: true,
    },
  ];

  if (!isSupabaseConfigured()) return defaultCoupons;

  const query = (async () => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (!data || data.length === 0) return defaultCoupons;
      return data as Coupon[];
    } catch {
      return defaultCoupons;
    }
  })();

  return withTimeout(query, defaultCoupons);
}
