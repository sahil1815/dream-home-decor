import React from 'react';
import { getAllOrdersAdmin } from '@/lib/data';
import { AdminOrdersManager } from '@/components/admin/AdminOrdersManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'অর্ডার ম্যানেজমেন্ট ও কুরিয়ার চালান | Dream Home Decor Admin',
  description: 'গ্রাহকদের অর্ডার ফিল্টারিং, চালান প্রিন্টিং ও লাইভ স্ট্যাটাস আপডেট',
};

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900">
          অর্ডার ম্যানেজমেন্ট ও কুরিয়ার চালান
        </h1>
        <p className="text-xs font-bn text-stone-500">
          গ্রাহকদের সাথে ১-ক্লিকে কল বা WhatsApp-এ যোগাযোগ, চালান প্রিন্টিং ও পূর্ণাঙ্গ ৯-ধাপ স্ট্যাটাস ট্র্যাকিং
        </p>
      </div>

      <AdminOrdersManager initialOrders={orders} />
    </div>
  );
}
