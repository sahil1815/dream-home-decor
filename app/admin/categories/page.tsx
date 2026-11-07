import React from 'react';
import { getCategories } from '@/lib/data';
import { CategoryManager } from '@/components/admin/CategoryManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ক্যাটাগরি ম্যানেজমেন্ট | Dream Home Decor Admin',
  description: 'ফার্নিচার ক্যাটাগরি তৈরি, প্রদর্শন ও ফিল্টারিং নিয়ন্ত্রণ',
};

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return <CategoryManager initialCategories={categories} />;
}
