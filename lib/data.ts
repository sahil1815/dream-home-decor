import { getPublicClient } from '@/lib/supabase/public';
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
 * Fetch active promotional campaigns/lotteries
 */
export async function getCampaigns(): Promise<CampaignGiveaway[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CAMPAIGNS;
  }

  const query = (async () => {
    try {
      const supabase = getPublicClient();
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
  })();

  return withTimeout(query, MOCK_CAMPAIGNS);
}

/**
 * Track an order by order number or customer phone
 */
export async function trackOrderQuery(query: string): Promise<Order[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  const getMockOrder = () =>
    MOCK_SAMPLE_ORDERS.filter(
      (o) =>
        o.order_number.toLowerCase().includes(cleaned.toLowerCase()) ||
        o.customer_phone.includes(cleaned)
    );

  if (!isSupabaseConfigured()) {
    return getMockOrder();
  }

  const q = (async () => {
    try {
      const supabase = getPublicClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`order_number.ilike.%${cleaned}%,customer_phone.ilike.%${cleaned}%`)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return getMockOrder();
      }

      return data as Order[];
    } catch {
      return [];
    }
  })();

  return withTimeout(q, getMockOrder());
}
