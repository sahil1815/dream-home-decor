import React from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  Search,
  Clock,
  CheckCircle,
  Truck,
  CheckCircle2,
  Hammer,
  ShieldCheck,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { trackOrderQuery, getSiteSettings } from '@/lib/data';
import { formatBDT, getStatusBadgeInfo, buildWhatsAppUrl } from '@/lib/utils';
import { OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

interface TrackOrderPageProps {
  searchParams: Promise<{
    query?: string;
  }>;
}

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const { query } = await searchParams;
  const settings = await getSiteSettings();

  const orders = query ? await trackOrderQuery(query) : [];

  const getStepStatus = (
    orderStatus: OrderStatus,
    targetStep: OrderStatus
  ): 'completed' | 'current' | 'upcoming' => {
    const steps: OrderStatus[] = [
      'pending',
      'confirmed',
      'in_production',
      'shipped',
      'delivered',
    ];

    if (orderStatus === 'cancelled') return 'upcoming';

    const currentIndex = steps.indexOf(orderStatus);
    const targetIndex = steps.indexOf(targetStep);

    if (targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#8B5A2B]/10 text-[#8B5A2B] px-3.5 py-1.5 rounded-full text-xs font-bn font-bold">
          <PackageCheck className="w-4 h-4" />
          <span>লাইভ অর্ডার ট্র্যাকিং</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-bn text-stone-900">
          আপনার ফার্নিচার ডেলিভারি ট্র্যাক করুন
        </h1>
        <p className="text-stone-500 font-bn text-sm max-w-lg mx-auto">
          অর্ডার নাম্বার (যেমন: <strong className="font-sans">DHD-1001</strong>) অথবা আপনার দেওয়া ১১ ডিজিটের
          মোবাইল নাম্বার লিখে সার্চ করুন।
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-stone-200/90 shadow-sm max-w-2xl mx-auto">
        <form method="GET" action="/track-order" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              name="query"
              defaultValue={query || ''}
              placeholder="অর্ডার নাম্বার বা মোবাইল নাম্বার লিখুন..."
              required
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn text-stone-800"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 sm:top-3.5" />
          </div>
          <button
            type="submit"
            className="bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bn font-bold text-xs sm:text-sm shadow-md transition-colors whitespace-nowrap cursor-pointer"
          >
            সার্চ করুন
          </button>
        </form>
      </div>

      {/* Query Results */}
      {query && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 space-y-3">
              <p className="text-rose-600 font-bn font-bold text-base">
                &quot;{query}&quot; নম্বরে কোনো অর্ডার খুঁজে পাওয়া যায়নি।
              </p>
              <p className="text-xs font-bn text-stone-500 max-w-md mx-auto">
                অনুগ্রহ করে নিশ্চিত করুন যে অর্ডার নাম্বার বা মোবাইল নাম্বারটি সঠিকভাবে টাইপ করেছেন।
                সাহায্যের জন্য আমাদের হটলাইনে যোগাযোগ করতে পারেন।
              </p>
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center gap-1.5 text-[#8B5A2B] hover:underline font-bn text-xs font-semibold pt-2"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>সরাসরি হটলাইনে কল করুন: {settings.phone}</span>
              </a>
            </div>
          ) : (
            orders.map((order) => {
              const statusInfo = getStatusBadgeInfo(order.status);
              const whatsappChat = buildWhatsAppUrl(
                settings.whatsapp_number,
                `আসসালামু আলাইকুম, আমি অর্ডার #${order.order_number} সম্পর্কে জানতে চাচ্ছি।`
              );

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-md space-y-6"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-200 gap-2">
                    <div>
                      <span className="text-xs text-stone-400 font-bn block">অর্ডার আইডি:</span>
                      <span className="font-sans font-extrabold text-2xl text-[#8B5A2B]">
                        {order.order_number}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bn font-bold px-3 py-1 rounded-full border ${statusInfo.className}`}
                      >
                        {statusInfo.labelBn} ({statusInfo.label})
                      </span>
                      <a
                        href={whatsappChat}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>হেল্পলাইন</span>
                      </a>
                    </div>
                  </div>

                  {/* Visual 5-Step Stepper */}
                  <div className="py-3 sm:py-4">
                    <h3 className="text-xs font-bn font-bold text-stone-500 uppercase tracking-wider mb-4 sm:mb-6">
                      অর্ডার অগ্রগতি (Order Timeline):
                    </h3>

                    <div className="relative flex flex-col md:flex-row justify-between gap-3.5 md:gap-2">
                      {[
                        { key: 'pending', label: 'অর্ডার গৃহীত', sub: 'Placed' },
                        { key: 'confirmed', label: 'কনফার্ম হয়েছে', sub: 'Confirmed' },
                        { key: 'in_production', label: 'কারখানায় তৈরি', sub: 'In Production' },
                        { key: 'shipped', label: 'কুরিয়ারে রওয়ানা', sub: 'Shipped' },
                        { key: 'delivered', label: 'ডেলিভারি সম্পন্ন', sub: 'Delivered' },
                      ].map((step, idx) => {
                        const stepState = getStepStatus(order.status, step.key as OrderStatus);

                        return (
                          <div
                            key={step.key}
                            className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center flex-1 relative"
                          >
                            <div
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                                stepState === 'completed'
                                  ? 'bg-emerald-600 text-white'
                                  : stepState === 'current'
                                  ? 'bg-[#8B5A2B] text-white ring-4 ring-[#8B5A2B]/20 animate-pulse'
                                  : 'bg-stone-100 text-stone-400'
                              }`}
                            >
                              {stepState === 'completed' ? (
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`font-bn text-xs sm:text-sm font-bold truncate ${
                                  stepState === 'current'
                                    ? 'text-[#8B5A2B]'
                                    : stepState === 'completed'
                                    ? 'text-emerald-700'
                                    : 'text-stone-400'
                                }`}
                              >
                                {step.label}
                              </p>
                              <span className="text-[10px] text-stone-400 font-sans block">
                                {step.sub}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer & Items Summary */}
                  <div className="p-3.5 sm:p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs font-bn text-stone-700">
                    <div>
                      <span className="text-stone-400 block">গ্রাহকের নাম ও ঠিকানা:</span>
                      <p className="font-bold text-stone-900 text-sm mt-0.5">{order.customer_name}</p>
                      <p className="text-stone-600 mt-0.5 break-words">{order.customer_address}</p>
                      <p className="text-stone-500 font-sans mt-0.5">{order.customer_phone}</p>
                    </div>

                    <div>
                      <span className="text-stone-400 block">অর্ডার পণ্যের বিবরণ:</span>
                      <div className="mt-1 space-y-1">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-stone-800 truncate">
                              {item.product_title} {item.selected_color && `(${item.selected_color})`}
                            </span>
                            <span className="font-sans font-bold shrink-0">
                              {item.quantity} x {formatBDT(item.unit_price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 mt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                        <span>সর্বমোট প্রদেয়:</span>
                        <span className="font-sans text-[#8B5A2B]">{formatBDT(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
