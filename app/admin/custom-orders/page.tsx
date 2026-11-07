import React from 'react';
import { getCustomRequestsList } from '@/lib/data';
import { CustomOrdersManager } from '@/components/admin/CustomOrdersManager';

export const metadata = {
  title: 'কাস্টম ফার্নিচার রিকোয়েস্ট | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'গ্রাহকদের পছন্দের মাপ ও ডিজাইনের ফার্নিচার কোটেশন ইনবক্স',
};

export const revalidate = 0;

export default async function AdminCustomOrdersPage() {
  const requests = await getCustomRequestsList();

  return <CustomOrdersManager initialRequests={requests} />;
}
