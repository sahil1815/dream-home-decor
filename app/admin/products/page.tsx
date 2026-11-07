import React from 'react';
import { getProducts, getCategories } from '@/lib/data';
import { ProductListManager } from '@/components/admin/ProductListManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ফার্নিচার ক্যাটালগ | Dream Home Decor Admin',
  description: 'কারখানার পণ্য তালিকা, ড্রাফট ও স্টক ম্যানেজমেন্ট',
};

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts({ limit: 100 }),
    getCategories(),
  ]);

  return <ProductListManager initialProducts={products} categories={categories} />;
}
