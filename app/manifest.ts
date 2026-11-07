import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dream Home Decor',
    short_name: 'DHD',
    description: 'ড্রিম হোম ডেকোর - মিরপুর নিজস্ব কারখানায় তৈরি আধুনিক ফার্নিচার',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#8B5A2B',
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/brand-images/official_brand_logo.jpg',
        sizes: '720x720',
        type: 'image/jpeg',
      },
    ],
  };
}
