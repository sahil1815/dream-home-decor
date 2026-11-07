import React from 'react';
import { getCouponsList } from '@/lib/data';
import { CouponManager } from '@/components/admin/CouponManager';

export const metadata = {
  title: 'কুপন ও প্রমো কোড | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'ডিসকাউন্ট কুপন তৈরি ও ব্যবহারের পরিসংখ্যান',
};

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const coupons = await getCouponsList();

  return <CouponManager initialCoupons={coupons} />;
}
