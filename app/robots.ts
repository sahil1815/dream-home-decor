import { MetadataRoute } from 'next';
import { buildRobotsConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dream-home-decor.vercel.app';
  return buildRobotsConfig(baseUrl);
}
