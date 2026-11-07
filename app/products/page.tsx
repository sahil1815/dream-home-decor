import React from 'react';
import type { Metadata } from 'next';
import { getCategories, getProducts, getSiteSettings } from '@/lib/data';
import { ProductCatalogClient } from '@/components/storefront/ProductCatalogClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'সকল ফার্নিচার কালেকশন',
  description:
    'মিরপুর-১০ কারখানা থেকে সরাসরি উন্নত মেলামাইন বোর্ডের পড়ার টেবিল, বুকশেলফ ও কম্পিউটার ডেস্ক। ক্যাশ অন ডেলিভারি ও কাস্টম সাইজের সুবিধা।',
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'সকল ফার্নিচার কালেকশন | Dream Home Decor',
    description: 'উন্নত মেলামাইন বোর্ডের আধুনিক পড়ার টেবিল, কম্পিউটার ডেস্ক ও বুকশেলফ সরাসরি ফ্যাক্টরি মূল্যে।',
    url: '/products',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search, sort } = await searchParams;

  const [categories, products, settings] = await Promise.all([
    getCategories(),
    getProducts({ limit: 100 }),
    getSiteSettings(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProductCatalogClient
        products={products}
        categories={categories}
        initialCategory={category}
        initialSearch={search}
        initialSort={sort}
        whatsappNumber={settings.whatsapp_number}
      />
    </div>
  );
}
