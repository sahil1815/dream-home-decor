import React from 'react';
import { getCustomersDirectory } from '@/lib/data';
import { CustomerDirectoryManager } from '@/components/admin/CustomerDirectoryManager';

export const metadata = {
  title: 'কাস্টমার ডিরেক্টরি | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'গ্রাহকদের তালিকা, লাইফটাইম সেলস এবং ব্লক স্ট্যাটাস ম্যানেজমেন্ট',
};

export const revalidate = 0;

export default async function AdminCustomersPage() {
  const customers = await getCustomersDirectory();

  return <CustomerDirectoryManager initialCustomers={customers} />;
}
