import React from 'react';
import { getProducts, getSiteSettings } from '@/lib/data';
import { MediaManager } from '@/components/admin/MediaManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'মিডিয়া ও গুগল ড্রাইভ ইম্পোর্ট | Dream Home Decor Admin',
  description: 'গুগল ড্রাইভ থেকে বাস্তব ছবি ইম্পোর্ট, মিডিয়া লাইব্রেরি ও নমুনা ছবি ম্যানেজমেন্ট',
};

export default async function AdminMediaPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSiteSettings(),
  ]);

  return <MediaManager products={products} settings={settings} />;
}
