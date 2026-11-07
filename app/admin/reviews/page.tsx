import React from 'react';
import { getReviewsList, getProducts } from '@/lib/data';
import { ReviewsManager } from '@/components/admin/ReviewsManager';

export const metadata = {
  title: 'রিভিউ ও ফিডব্যাক মডারেশন | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'গ্রাহকদের রিভিউ অ্যাপ্রুভ ও প্রদর্শন নিয়ন্ত্রণ',
};

export const revalidate = 0;

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([
    getReviewsList(),
    getProducts({ limit: 100 }),
  ]);

  return <ReviewsManager initialReviews={reviews} products={products} />;
}
