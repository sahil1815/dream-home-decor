export interface SitemapItem {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface RobotsConfig {
  rules: {
    userAgent: string;
    allow: string;
    disallow: string[];
  }[];
  sitemap: string;
}

/**
 * Builds standard robots.txt configuration for Dream Home Decor
 */
export function buildRobotsConfig(baseUrl: string): RobotsConfig {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api', '/api/*'],
      },
    ],
    sitemap: `${cleanBase}/sitemap.xml`,
  };
}

/**
 * Generates sitemap URLs for static and dynamic product pages
 */
export function buildSitemapUrls(
  baseUrl: string,
  products: Array<{ slug: string; updated_at?: string; is_active?: boolean }> = []
): SitemapItem[] {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const currentDate = new Date().toISOString();

  const staticRoutes: SitemapItem[] = [
    {
      url: `${cleanBase}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${cleanBase}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${cleanBase}/custom-furniture`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${cleanBase}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${cleanBase}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${cleanBase}/faq`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${cleanBase}/delivery-and-returns`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${cleanBase}/track-order`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${cleanBase}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${cleanBase}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const productRoutes: SitemapItem[] = products
    .filter((p) => p.slug && p.is_active !== false)
    .map((p) => ({
      url: `${cleanBase}/products/${p.slug}`,
      lastModified: p.updated_at || currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  return [...staticRoutes, ...productRoutes];
}

/**
 * Validates whether metadata adheres to modern Google SEO guidelines
 * Google has officially ignored the meta keywords tag since September 2009.
 */
export function validateSeoMetadata(meta: {
  keywords?: unknown;
  alternates?: { canonical?: string };
  openGraph?: { locale?: string; siteName?: string };
}): { hasKeywordsTag: boolean; hasCanonical: boolean; hasBnLocale: boolean } {
  return {
    hasKeywordsTag: Boolean(meta.keywords),
    hasCanonical: Boolean(meta.alternates?.canonical),
    hasBnLocale: meta.openGraph?.locale === 'bn_BD',
  };
}
