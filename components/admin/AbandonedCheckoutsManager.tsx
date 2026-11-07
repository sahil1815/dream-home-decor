'use client';

import React, { useState, useTransition } from 'react';
import { AbandonedCheckout } from '@/types/database';
import { markAbandonedCheckoutRecoveredAction } from '@/lib/actions';
import {
  ShoppingBag,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface AbandonedCheckoutsManagerProps {
  initialCheckouts: AbandonedCheckout[];
}

interface CartItemSummary {
  title?: string;
  name?: string;
  quantity?: number;
  price?: number;
}

export function AbandonedCheckoutsManager({ initialCheckouts }: AbandonedCheckoutsManagerProps) {
  const [checkouts, setCheckouts] = useState<AbandonedCheckout[]>(initialCheckouts);
  const [filter, setFilter] = useState<'all' | 'pending' | 'recovered'>('all');
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCheckouts = checkouts.filter((item) => {
    if (filter === 'pending') return !item.is_recovered;
    if (filter === 'recovered') return item.is_recovered;
    return true;
  });

  const totalAbandonedAmount = checkouts.reduce((acc, c) => acc + (c.subtotal || 0), 0);
  const pendingCount = checkouts.filter((c) => !c.is_recovered).length;
  const recoveredCount = checkouts.filter((c) => c.is_recovered).length;

  const handleMarkRecovered = (id: string) => {
    startTransition(async () => {
      const res = await markAbandonedCheckoutRecoveredAction(id);
      if (res.success) {
        setCheckouts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_recovered: true } : c))
        );
        showToast('চেকআউটটি সফলভাবে রিকভার্ড হিসেবে চিহ্নিত করা হয়েছে', 'success');
      } else {
        showToast(res.error || 'ব্যর্থ হয়েছে', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-bn flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
          <RotateCcw className="w-7 h-7 text-[#8B5A2B]" />
          <span>পরিত্যক্ত চেকআউট ও রিকভারি</span>
        </h1>
        <p className="text-xs sm:text-sm font-bn text-stone-600 mt-1">
          যেসব ক্রেতা তথ্য দিয়েও শেষ ধাপে অর্ডার সম্পন্ন করেননি তাদের তালিকা ও ১-ক্লিক ফলোআপ।
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">ফলোআপ বাকি</span>
            <span className="text-xl font-bold font-sans text-amber-700">{pendingCount} টি</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">সফলভাবে রিকভার্ড</span>
            <span className="text-xl font-bold font-sans text-emerald-700">{recoveredCount} টি</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#8B5A2B]" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">মোট আটকে থাকা সম্ভাব্য রেভিনিউ</span>
            <span className="text-xl font-bold font-sans text-stone-900">
              ৳{totalAbandonedAmount.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bn text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-[#8B5A2B] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          সবগুলো ({checkouts.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl font-bn text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          ফলোআপ বাকি ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('recovered')}
          className={`px-3.5 py-1.5 rounded-xl font-bn text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            filter === 'recovered'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          রিকভার্ড ({recoveredCount})
        </button>
      </div>

      {/* Abandoned Checkouts List */}
      <div className="space-y-3">
        {filteredCheckouts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 font-bn">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
            <p>কোনো পরিত্যক্ত চেকআউট নেই। সব অর্ডার সফল!</p>
          </div>
        ) : (
          filteredCheckouts.map((checkout) => {
            const cleanPhone = checkout.customer_phone.replace(/[^0-9]/g, '');
            const waNumber = cleanPhone.startsWith('88')
              ? cleanPhone
              : cleanPhone.startsWith('0')
              ? `88${cleanPhone}`
              : `880${cleanPhone}`;

            // Parse cart items safely
            let cartItems: CartItemSummary[] = [];
            if (Array.isArray(checkout.cart_items)) {
              cartItems = checkout.cart_items as CartItemSummary[];
            }

            const customerGreeting = checkout.customer_name ? `${checkout.customer_name} সাহেব/ম্যাডাম` : 'সম্মানিত ক্রেতা';
            const itemNames = cartItems.map((i) => i.title || i.name || 'পণ্য').join(', ');
            const waMessage = encodeURIComponent(
              `আসসালামু আলাইকুম ${customerGreeting}, ড্রিম হোম ডেকোর (মিরপুর-১০) থেকে যোগাযোগ করছি।\n\nআপনার কার্টে "${itemNames}" আইটেমটি রাখা হয়েছিল। অর্ডারটি সম্পন্ন করতে কোনো প্রশ্ন বা কাস্টমাইজেশন সুবিধা লাগলে জানান। আমরা ফ্যাক্টরি থেকে সরাসরি দ্রুত ডেলিভারি নিশ্চিত করব। ধন্যবাদ!`
            );

            return (
              <div
                key={checkout.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                  checkout.is_recovered
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-stone-200 hover:border-[#8B5A2B]/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Customer & Timestamp */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-stone-900 font-bn">
                        {checkout.customer_name || 'নাম উল্লেখ নেই'}
                      </span>
                      {checkout.is_recovered ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bn font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          রিকভার্ড
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bn font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          অসম্পূর্ণ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500 font-sans">
                      <span>{checkout.customer_phone}</span>
                      <span>•</span>
                      <span>{new Date(checkout.created_at).toLocaleString('bn-BD')}</span>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bn text-stone-500 block">কার্ট সাবটোটাল</span>
                    <span className="text-lg font-bold font-sans text-stone-900">
                      ৳{(checkout.subtotal || 0).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                {/* Items in cart */}
                <div className="mt-3 pt-3 border-t border-stone-100 font-bn text-xs sm:text-sm">
                  <span className="text-stone-500 text-xs block mb-1.5 font-semibold">
                    কার্টের ফার্নিচার আইটেমসমূহ:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cartItems.length > 0 ? (
                      cartItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg border border-stone-200/80 text-xs flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3 h-3 text-[#8B5A2B]" />
                          <span>{item.title || item.name || 'পণ্য'}</span>
                          <span className="text-stone-500 font-sans">x{item.quantity || 1}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-400 italic text-xs">আইটেমের বিবরণ পাওয়া যায়নি</span>
                    )}
                  </div>
                </div>

                {/* Follow-up Action Bar */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Phone Call */}
                    <a
                      href={`tel:${checkout.customer_phone}`}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bn text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200"
                    >
                      <Phone className="w-3.5 h-3.5 text-stone-600" />
                      <span>কল দিন</span>
                    </a>

                    {/* WhatsApp Follow-up */}
                    <a
                      href={`https://wa.me/${waNumber}?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bn text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp ফলোআপ মেসেজ</span>
                    </a>
                  </div>

                  {/* Mark as recovered button */}
                  {!checkout.is_recovered && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleMarkRecovered(checkout.id)}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-black text-white font-bn text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>রিকভার্ড হিসেবে মার্ক করুন</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
