import React from 'react';
import { getAbandonedCheckoutsList } from '@/lib/data';
import { AbandonedCheckoutsManager } from '@/components/admin/AbandonedCheckoutsManager';

export const metadata = {
  title: 'পরিত্যক্ত চেকআউট ও রিকভারি | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'অসম্পূর্ণ চেকআউটের তালিকা ও ১-ক্লিক হোয়াটসঅ্যাপ ফলোআপ',
};

export const revalidate = 0;

export default async function AdminAbandonedPage() {
  const checkouts = await getAbandonedCheckoutsList();

  return <AbandonedCheckoutsManager initialCheckouts={checkouts} />;
}
