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
  AlertTriangle,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { getAdminDashboardStats } from '@/lib/data';
import { formatBDT, getStatusBadgeInfo, buildWhatsAppUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'অ্যাডমিন ড্যাশবোর্ড ওভারভিউ | Dream Home Decor',
  description: 'অর্ডার, কারখানা উৎপাদন এবং বিক্রয় পরিসংখ্যান এক নজরে',
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const statusList = [
    { key: 'pending', label: '১. অপেক্ষমাণ (Pending)', count: stats.statusCounts.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'confirmation_call', label: '২. কল সম্পন্ন (Call Done)', count: stats.statusCounts.confirmation_call, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { key: 'confirmed', label: '৩. কনফার্মড (Confirmed)', count: stats.statusCounts.confirmed, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { key: 'in_production', label: '৪. কারখানায় তৈরি (In Production)', count: stats.statusCounts.in_production, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { key: 'ready', label: '৫. প্যাকিং সম্পন্ন (Ready)', count: stats.statusCounts.ready, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    { key: 'shipped', label: '৬. কুরিয়ারে রওয়ানা (Shipped)', count: stats.statusCounts.shipped, color: 'text-amber-800 bg-orange-50 border-orange-200' },
    { key: 'delivered', label: '৭. ডেলিভারি সম্পন্ন (Delivered)', count: stats.statusCounts.delivered, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { key: 'cancelled', label: '৮. বাতিল (Cancelled)', count: stats.statusCounts.cancelled, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { key: 'returned', label: '৯. ফেরত (Returned)', count: stats.statusCounts.returned, color: 'text-stone-700 bg-stone-100 border-stone-200' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Welcome & Operations Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bn font-bold text-[#8B5A2B] uppercase tracking-wider">
              ড্রিম হোম ডেকোর • কারখানা ও বিজনেস হাব
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900 mt-0.5">
            অ্যাডমিন ড্যাশবোর্ড ও বিক্রয় অ্যানালিটিক্স
          </h1>
          <p className="text-xs font-bn text-stone-500">
            মিরপুর কারখানার লাইভ অর্ডার ফ্লো, কুরিয়ার ডেলিভারি ও রিয়েল-টাইম পরিসংখ্যান
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
          <Link
            href="/admin/production"
            className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-3.5 py-2.5 rounded-xl text-xs font-bn font-bold transition-colors"
          >
            <Hammer className="w-4 h-4 text-purple-700" />
            <span>প্রোডাকশন ট্র্যাকার</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-4 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন ফার্নিচার যোগ</span>
          </Link>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3.5 py-2.5 rounded-xl text-xs font-bn font-bold transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-stone-600" />
            <span>সকল অর্ডার ({stats.totalOrdersCount})</span>
          </Link>
        </div>
      </div>

      {/* 2. Urgent Attention Box (Unconfirmed orders > 2hrs, Unverified MFS) */}
      {stats.needsAttentionOrders.length > 0 && (
        <div className="p-5 sm:p-6 bg-amber-50/90 border-2 border-amber-300 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5 text-amber-950 font-bn font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 animate-bounce" />
              <span>জরুরি নজরদারি প্রয়োজন ({stats.needsAttentionOrders.length}টি অর্ডার অ্যাকশন পেন্ডিং)</span>
            </div>
            <span className="text-[11px] font-bn text-amber-800">
              ২ ঘণ্টার বেশি কনফার্মেশন কল হয়নি অথবা বিকাশ/নগদ পেমেন্ট ভেরিফাই বাকি
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {stats.needsAttentionOrders.map((order) => {
              const waMsg = `আসসালামু আলাইকুম ${order.customer_name}, ড্রিম হোম ডেকোর থেকে আপনার অর্ডারটি (${order.order_number}) কনফার্ম করতে যোগাযোগ করছি।`;
              const waUrl = buildWhatsAppUrl(order.customer_phone, waMsg);

              return (
                <div
                  key={order.id}
                  className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bn">
                      <span className="font-mono font-bold text-[#8B5A2B]">{order.order_number}</span>
                      <span className="text-stone-400 text-[10px]">
                        {new Date(order.created_at).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="font-bn font-bold text-stone-900 text-sm mt-0.5 truncate">
                      {order.customer_name}
                    </p>
                    <p className="text-stone-500 text-xs font-sans truncate">{order.customer_phone}</p>
                    <p className="text-stone-600 text-[11px] font-bn line-clamp-1 mt-1">
                      {order.order_items?.[0]?.product_title || 'ফার্নিচার'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="font-sans font-bold text-xs text-stone-900">
                      {formatBDT(order.total_amount)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bn flex items-center gap-1 transition-colors"
                        title="সরাসরি কল দিন"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">কল</span>
                      </a>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg text-xs font-bn flex items-center gap-1 transition-colors"
                        title="হোয়াটসঅ্যাপ মেসেজ পাঠান"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Four Core Revenue & Volume Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Orders & Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">আজকের অর্ডার ও বিক্রয়</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold font-sans text-stone-900">
              {formatBDT(stats.todayRevenue)}
            </p>
            <p className="text-xs font-bn text-emerald-700 font-bold mt-0.5">
              আজকে {stats.todayOrdersCount} টি নতুন অর্ডার এসেছে
            </p>
          </div>
        </div>

        {/* Metric 2: This Week's Orders & Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">এই সপ্তাহের মোট বিক্রয়</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold font-sans text-stone-900">
              {formatBDT(stats.weekRevenue)}
            </p>
            <p className="text-xs font-bn text-blue-700 font-bold mt-0.5">
              গত ৭ দিনে {stats.weekOrdersCount} টি অর্ডার গৃহীত হয়েছে
            </p>
          </div>
        </div>

        {/* Metric 3: Delivered Revenue vs Placed */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">ক্যাশ ডেলিভারি সম্পন্ন</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold font-sans text-purple-700">
              {formatBDT(stats.totalDeliveredRevenue)}
            </p>
            <p className="text-[11px] font-bn text-stone-500 mt-0.5">
              মোট প্লেসড: {formatBDT(stats.totalPlacedRevenue)}
            </p>
          </div>
        </div>

        {/* Metric 4: Pending Confirmation */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bn text-stone-500 font-semibold">অপেক্ষমাণ কনফার্মেশন</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold font-sans text-amber-600">
              {stats.statusCounts.pending} টি
            </p>
            <p className="text-[11px] font-bn text-stone-500 mt-0.5">
              কল দিয়ে ঠিকানা ও কালার নিশ্চিত করুন
            </p>
          </div>
        </div>
      </div>

      {/* 4. Nine Order Status Progression Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bn font-bold text-stone-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8B5A2B]" />
            <span>অর্ডার স্ট্যাটাস অগ্রগতি ও কারখানা ট্র্যাকিং (৯-ধাপ)</span>
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-bn text-[#8B5A2B] hover:underline font-bold"
          >
            অর্ডার টেবিলে দেখুন →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
          {statusList.map((st) => (
            <Link
              key={st.key}
              href={`/admin/orders?status=${st.key}`}
              className={`p-3 rounded-2xl border transition-all hover:scale-102 flex flex-col justify-between ${st.color}`}
            >
              <p className="text-[11px] font-bn font-medium truncate">{st.label.split('(')[0]}</p>
              <p className="text-xl font-sans font-black mt-2">{st.count}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Split Section: Top Selling Furniture & Low Stock / Made to Order */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top Selling Products */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bn font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>জনপ্রিয় ফার্নিচার (শীর্ষ বিক্রিত আইটেম)</span>
            </h3>
            <Link href="/admin/products" className="text-xs font-bn text-[#8B5A2B] hover:underline">
              ক্যাটালগ দেখুন
            </Link>
          </div>

          <div className="space-y-3">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#8B5A2B]/10 text-[#8B5A2B] font-bold text-xs flex items-center justify-center font-sans">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bn font-bold text-xs text-stone-900">{p.title}</p>
                      <p className="text-[11px] text-stone-500 font-bn">মোট বিক্রি: {p.count} টি</p>
                    </div>
                  </div>
                  <span className="font-sans font-bold text-xs text-stone-900">
                    {formatBDT(p.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs font-bn text-stone-400 py-4 text-center">
                এখনও কোনো বিক্রয় রেকর্ড তৈরি হয়নি
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Low Stock / Made to Order Alerts */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bn font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
              <Hammer className="w-4 h-4 text-purple-600" />
              <span>কারখানা অর্ডার ও স্টক স্ট্যাটাস</span>
            </h3>
            <span className="text-[11px] font-bn text-stone-400">
              {stats.lowStockProducts.length}টি আইটেম
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {stats.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-bn font-bold text-xs text-stone-900 truncate">
                    {product.title_bn || product.title}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono truncate">{product.slug}</p>
                </div>
                <span
                  className={`text-[10px] font-bn font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    product.stock_status === 'out_of_stock'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {product.stock_status === 'out_of_stock' ? 'স্টক আউট' : 'অর্ডারে তৈরি (৩-৫ দিন)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Recent Customer Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="font-bn font-bold text-base text-stone-900">
              সাম্প্রতিক কাস্টমার অর্ডারসমূহ
            </h2>
            <p className="text-xs font-bn text-stone-500">
              সর্বশেষ প্রাপ্ত অর্ডারের তাৎক্ষণিক আপডেট ও অ্যাকশন
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bn font-bold text-[#8B5A2B] hover:underline flex items-center gap-1"
          >
            <span>সবগুলো অর্ডার ফিল্টার ও সার্চ করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bn">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">অর্ডার নম্বর</th>
                <th className="py-3 px-4">গ্রাহক ও ফোন</th>
                <th className="py-3 px-4">ফার্নিচার ও পরিমাণ</th>
                <th className="py-3 px-4">মূল্য ও পেমেন্ট</th>
                <th className="py-3 px-4">বর্তমান স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {stats.recentOrders.map((order) => {
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
                      {order.order_items && order.order_items.length > 1 && ` (+${order.order_items.length - 1} টি)`}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-sans font-bold text-stone-900">{formatBDT(order.total_amount)}</p>
                      <span className="text-[10px] text-stone-400 font-sans uppercase">
                        {order.payment_method}
                      </span>
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
                        বিস্তারিত →
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
