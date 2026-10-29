import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { MOCK_SAMPLE_ORDERS } from '@/lib/mock-data';
import { AdminOrdersManager } from '@/components/admin/AdminOrdersManager';
import { Order } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  let orders: Order[] = MOCK_SAMPLE_ORDERS;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      orders = data as Order[];
    }
  } catch {
    orders = MOCK_SAMPLE_ORDERS;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-bn text-stone-900">
          অর্ডার ম্যানেজমেন্ট ও কুরিয়ার চালান
        </h1>
        <p className="text-xs font-bn text-stone-500">
          গ্রাহকদের সাথে এক ক্লিকে কল বা হোয়াটসঅ্যাপে যোগাযোগ করুন এবং স্ট্যাটাস আপডেট করুন
        </p>
      </div>

      <AdminOrdersManager initialOrders={orders} />
    </div>
  );
}
