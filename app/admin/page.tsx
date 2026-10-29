import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Hammer,
  ArrowRight,
  PackageCheck,
  PlusCircle,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MOCK_SAMPLE_ORDERS } from '@/lib/mock-data';
import { formatBDT, getStatusBadgeInfo } from '@/lib/utils';
import { Order } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let orders: Order[] = MOCK_SAMPLE_ORDERS;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      orders = data as Order[];
    }
  } catch {
    orders = MOCK_SAMPLE_ORDERS;
  }

  // Calculate metrics
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const inProductionCount = orders.filter((o) => o.status === 'in_production').length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <span className="text-xs font-bn font-semibold text-[#8B5A2B]">
            ড্রিম হোম ডেকোর বিজনেস হাব
          </span>
          <h1 className="text-2xl font-bold font-bn text-stone-900 mt-0.5">
            অ্যাডমিন ড্যাশবোর্ড ওভারভিউ
          </h1>
          <p className="text-xs font-bn text-stone-500">
            অর্ডার, কারখানা উৎপাদন এবং বিক্রয় পরিসংখ্যান এক নজরে
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-4 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন ফার্নিচার যোগ করুন</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2.5 rounded-xl text-xs font-bn font-semibold transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-stone-600" />
            <span>সকল অর্ডার ({orders.length})</span>
          </Link>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">
              মোট অর্ডার ভলিউম (Revenue)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-sans text-stone-900">
            {formatBDT(totalRevenue)}
          </p>
          <span className="text-[11px] font-bn text-emerald-700 flex items-center gap-1">
            <span>সরাসরি কারখানা বিক্রয়</span>
          </span>
        </div>

        {/* Metric 2: Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">
              নতুন অপেক্ষমাণ অর্ডার (Pending)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-sans text-amber-600">
            {pendingCount}
          </p>
          <span className="text-[11px] font-bn text-stone-500">
            কল করে কনফার্ম করতে হবে
          </span>
        </div>

        {/* Metric 3: In Production */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">
              কারখানায় তৈরি হচ্ছে (In Production)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Hammer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-sans text-purple-700">
            {inProductionCount}
          </p>
          <span className="text-[11px] font-bn text-stone-500">
            বোর্ড কাটিং ও ফিটিং চলছে
          </span>
        </div>

        {/* Metric 4: Confirmed Orders */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">
              কনফার্মড অর্ডার (Ready to Ship)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-sans text-blue-700">
            {confirmedCount}
          </p>
          <span className="text-[11px] font-bn text-stone-500">
            ডেলিভারি বুকিংয়ের অপেক্ষায়
          </span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="font-bn font-bold text-base text-stone-900">
              সাম্প্রতিক অর্ডারসমূহ (Recent Customer Orders)
            </h2>
            <p className="text-xs font-bn text-stone-500">
              সর্বশেষ প্রাপ্ত অর্ডারের তাৎক্ষণিক আপডেট
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bn font-semibold text-[#8B5A2B] hover:underline flex items-center gap-1"
          >
            <span>সবগুলো অর্ডার দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bn">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">অর্ডার আইডি</th>
                <th className="py-3 px-4">গ্রাহক ও ফোন</th>
                <th className="py-3 px-4">আইটেম</th>
                <th className="py-3 px-4">মূল্য</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {orders.slice(0, 6).map((order) => {
                const badge = getStatusBadgeInfo(order.status);
                return (
                  <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-[#8B5A2B]">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-stone-900">{order.customer_name}</p>
                      <p className="font-sans text-stone-500 text-[11px]">{order.customer_phone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                      {order.order_items?.[0]?.product_title || 'ফার্নিচার'}
                      {order.order_items && order.order_items.length > 1 && ` (+${order.order_items.length - 1} আরও)`}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-stone-900">
                      {formatBDT(order.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                        {badge.labelBn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders`}
                        className="text-[#8B5A2B] hover:text-[#6D431F] font-bold text-xs"
                      >
                        ম্যানেজ করুন →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
