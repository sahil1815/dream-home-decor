import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/data';
import { buildSitemapUrls } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dream-home-decor.vercel.app';

  try {
    const products = await getProducts();
    return buildSitemapUrls(baseUrl, products);
  } catch {
    return buildSitemapUrls(baseUrl, []);
  }
}
