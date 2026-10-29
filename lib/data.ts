import { createClient } from '@/lib/supabase/server';
import {
  MOCK_SITE_SETTINGS,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_CAMPAIGNS,
  MOCK_SAMPLE_ORDERS,
} from '@/lib/mock-data';
import {
  SiteSettings,
  Category,
  Product,
  CampaignGiveaway,
  Order,
  OrderStatus,
  DeliveryZone,
  PaymentMethod,
} from '@/types/database';

export const revalidate = 3600; // 1-hour ISR cache default

// Check if valid Supabase connection is available
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
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

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      console.warn('Error fetching site settings, falling back to mock:', error?.message);
      return MOCK_SITE_SETTINGS;
    }

    return data as SiteSettings;
  } catch {
    return MOCK_SITE_SETTINGS;
  }
}

/**
 * Fetch active categories
 */
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CATEGORIES;
  }

  try {
    const supabase = await createClient();
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
}

/**
 * Fetch products with optional filtering
 */
export async function getProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
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
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (options?.featured) {
      query = query.eq('is_featured', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS;
    }

    if (options?.categorySlug) {
      return (data as Product[]).filter(
        (p) => p.category?.slug === options.categorySlug
      );
    }

    return data as Product[];
  } catch {
    return MOCK_PRODUCTS;
  }
}

/**
 * Fetch single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
    if (!found) return null;
    const cat = MOCK_CATEGORIES.find((c) => c.id === found.category_id);
    return { ...found, category: cat };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      const mockFound = MOCK_PRODUCTS.find((p) => p.slug === slug);
      if (mockFound) {
        const cat = MOCK_CATEGORIES.find((c) => c.id === mockFound.category_id);
        return { ...mockFound, category: cat };
      }
      return null;
    }

    return data as Product;
  } catch {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
  }
}

/**
 * Fetch active promotional campaigns/lotteries
 */
export async function getCampaigns(): Promise<CampaignGiveaway[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CAMPAIGNS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('campaigns_giveaways')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_CAMPAIGNS;
    }

    return data as CampaignGiveaway[];
  } catch {
    return MOCK_CAMPAIGNS;
  }
}

/**
 * Track an order by order number or customer phone
 */
export async function trackOrderQuery(query: string): Promise<Order[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  if (!isSupabaseConfigured()) {
    return MOCK_SAMPLE_ORDERS.filter(
      (o) =>
        o.order_number.toLowerCase().includes(cleaned.toLowerCase()) ||
        o.customer_phone.includes(cleaned)
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`order_number.ilike.%${cleaned}%,customer_phone.ilike.%${cleaned}%`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return MOCK_SAMPLE_ORDERS.filter(
        (o) =>
          o.order_number.toLowerCase().includes(cleaned.toLowerCase()) ||
          o.customer_phone.includes(cleaned)
      );
    }

    return data as Order[];
  } catch {
    return [];
  }
}
