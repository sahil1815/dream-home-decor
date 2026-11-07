import React from 'react';
import {
  PackageCheck,
  Search,
  CheckCircle,
  Phone,
  MessageCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { trackOrderSecure, getSiteSettings } from '@/lib/data';
import { formatBDT, getStatusBadgeInfo, buildWhatsAppUrl } from '@/lib/utils';
import { OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

interface TrackOrderPageProps {
  searchParams: Promise<{
    order?: string;
    phone?: string;
    query?: string;
  }>;
}

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const params = await searchParams;
  const rawOrder = (params.order || params.query?.split(/\s+/)[0] || '').trim();
  const rawPhone = (params.phone || params.query?.split(/\s+/)[1] || '').trim();

  const settings = await getSiteSettings();

  const hasSearched = Boolean(rawOrder && rawPhone);
  const order = hasSearched ? await trackOrderSecure(rawOrder, rawPhone) : null;

  const getStepStatus = (
    orderStatus: OrderStatus,
    targetStep: OrderStatus
  ): 'completed' | 'current' | 'upcoming' => {
    const stepOrder: Record<OrderStatus, number> = {
      pending: 0,
      confirmation_call: 1,
      confirmed: 1,
      in_production: 2,
      ready: 3,
      shipped: 3,
      delivered: 4,
      cancelled: -1,
      returned: -2,
    };

    const targetMap: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      in_production: 2,
      shipped: 3,
      delivered: 4,
    };

    const cur = stepOrder[orderStatus] ?? 0;
    const tgt = targetMap[targetStep] ?? 0;

    if (orderStatus === 'cancelled' || orderStatus === 'returned') return 'upcoming';
    if (tgt < cur) return 'completed';
    if (tgt === cur) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
          <PackageCheck className="w-4 h-4" />
          <span>লাইভ অর্ডার ট্র্যাকিং</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          আপনার ফার্নিচার ডেলিভারি ট্র্যাক করুন
        </h1>
        <p className="text-stone-600 font-bn text-sm max-w-lg mx-auto leading-relaxed">
          আপনার অর্ডার নাম্বার ও অর্ডারের সময় দেওয়া মোবাইল নাম্বার প্রদান করে বর্তমান অগ্রগতি জানুন।
        </p>
      </div>

      {/* Two-factor secure search form */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#E8E2D9] shadow-xs max-w-2xl mx-auto">
        <form method="GET" action="/track-order" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="orderInput" className="block text-xs font-bn font-semibold text-[#2B1D14] mb-1.5">
                অর্ডার নাম্বার <span className="text-[#9F1239]">*</span>
              </label>
              <div className="relative">
                <input
                  id="orderInput"
                  type="text"
                  name="order"
                  defaultValue={rawOrder}
                  placeholder="যেমন: DHD-1001"
                  required
                  autoCapitalize="characters"
                  className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-[#E8E2D9] rounded-xl text-xs sm:text-sm font-sans uppercase font-semibold text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]/20 focus:border-[#8A5A3B]"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 sm:top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="phoneInput" className="block text-xs font-bn font-semibold text-[#2B1D14] mb-1.5">
                মোবাইল নাম্বার <span className="text-[#9F1239]">*</span>
              </label>
              <div className="relative">
                <input
                  id="phoneInput"
                  type="tel"
                  name="phone"
                  defaultValue={rawPhone}
                  placeholder="যেমন: 017XXXXXXXX"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-[#E8E2D9] rounded-xl text-xs sm:text-sm font-sans font-medium text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]/20 focus:border-[#8A5A3B]"
                />
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3 sm:top-3.5" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-bn">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>তথ্য সুরক্ষায় অর্ডার নাম্বার ও ফোন উভয়টি আবশ্যক</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-7 py-2.5 sm:py-3 rounded-xl font-bn font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              ট্র্যাক করুন
            </button>
          </div>
        </form>
      </div>

      {/* Query Results */}
      {hasSearched && (
        <div className="space-y-6">
          {!order ? (
            <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-stone-200 space-y-4 max-w-2xl mx-auto shadow-xs">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <PackageCheck className="w-6 h-6" />
              </div>
              <p className="text-stone-900 font-bn font-bold text-base">
                কোনো অর্ডার খুঁজে পাওয়া যায়নি
              </p>
              <p className="text-xs font-bn text-stone-500 max-w-md mx-auto leading-relaxed">
                অর্ডার নাম্বার <span className="font-sans font-semibold text-stone-700">{rawOrder}</span> এবং
                মোবাইল নাম্বার <span className="font-sans font-semibold text-stone-700">{rawPhone}</span> সঠিক
                কিনা তা মিলিয়ে দেখুন। প্রয়োজনে আমাদের সাথে যোগাযোগ করুন।
              </p>
              <div className="pt-2">
                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-stone-200 text-[#8B5A2B] hover:bg-stone-100 px-4 py-2 rounded-xl font-bn text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>হটলাইনে কল করুন: {settings.phone}</span>
                </a>
              </div>
            </div>
          ) : (
            (() => {
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

                  {/* Customer & Items Summary with Masked PII */}
                  <div className="p-3.5 sm:p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs font-bn text-stone-700">
                    <div>
                      <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-stone-500 font-semibold">গ্রাহকের তথ্য (সুরক্ষিত):</span>
                      </div>
                      <p className="font-bold text-stone-900 text-sm mt-0.5">{order.customer_name}</p>
                      <p className="text-stone-600 mt-0.5 break-words">{order.customer_address}</p>
                      <p className="text-stone-500 font-sans mt-0.5">{order.customer_phone}</p>
                    </div>

                    <div>
                      <span className="text-stone-400 block font-semibold">অর্ডার পণ্যের বিবরণ:</span>
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
            })()
          )}
        </div>
      )}
    </div>
  );
}
