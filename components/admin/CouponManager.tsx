'use client';

import React, { useState, useTransition } from 'react';
import { Coupon } from '@/types/database';
import { saveCouponAction, deleteCouponAction } from '@/lib/actions';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Check,
  AlertTriangle,
  Gift,
} from 'lucide-react';

interface CouponManagerProps {
  initialCoupons: Coupon[];
}

export function CouponManager({ initialCoupons }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(500);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(3000);
  const [usageLimit, setUsageLimit] = useState<string>('100');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('fixed');
    setDiscountValue(500);
    setMinOrderAmount(3000);
    setUsageLimit('100');
    setExpiresAt('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value);
    setMinOrderAmount(coupon.min_order_amount);
    setUsageLimit(coupon.usage_limit ? String(coupon.usage_limit) : '');
    setExpiresAt(coupon.expires_at ? coupon.expires_at.split('T')[0] : '');
    setIsActive(coupon.is_active);
    setModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('কুপন কোড প্রদান করতে হবে', 'error');
      return;
    }

    startTransition(async () => {
      const payload = {
        id: editingCoupon?.id,
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrderAmount),
        usage_limit: usageLimit ? Number(usageLimit) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      };

      const res = await saveCouponAction(payload);
      if (res.success) {
        if (editingCoupon) {
          setCoupons((prev) =>
            prev.map((c) =>
              c.id === editingCoupon.id
                ? {
                    ...c,
                    code: payload.code,
                    discount_type: payload.discount_type,
                    discount_value: payload.discount_value,
                    min_order_amount: payload.min_order_amount,
                    usage_limit: payload.usage_limit,
                    expires_at: payload.expires_at,
                    is_active: payload.is_active,
                  }
                : c
            )
          );
        } else {
          setCoupons((prev) => [
            {
              id: `cp-${Date.now()}`,
              code: payload.code,
              discount_type: payload.discount_type,
              discount_value: payload.discount_value,
              min_order_amount: payload.min_order_amount,
              usage_limit: payload.usage_limit,
              expires_at: payload.expires_at,
              is_active: payload.is_active,
              usage_count: 0,
            },
            ...prev,
          ]);
        }
        showToast(res.message || 'কুপন সংরক্ষিত হয়েছে', 'success');
        setModalOpen(false);
      } else {
        showToast(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে', 'error');
      }
    });
  };

  const handleDeleteCoupon = (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই কুপন কোডটি মুছে ফেলতে চান?')) return;

    startTransition(async () => {
      const res = await deleteCouponAction(id);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        showToast(res.message || 'কুপন মুছে ফেলা হয়েছে', 'success');
      } else {
        showToast(res.error || 'মুছে ফেলা ব্যর্থ হয়েছে', 'error');
      }
    });
  };

  const handleToggleActive = (coupon: Coupon) => {
    const nextState = !coupon.is_active;
    startTransition(async () => {
      const res = await saveCouponAction({
        ...coupon,
        is_active: nextState,
      });
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, is_active: nextState } : c))
        );
        showToast(`কুপনটি ${nextState ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`, 'success');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-[#8B5A2B]" />
            <span>কুপন ও ছাড়ের কোড ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-xs sm:text-sm font-bn text-stone-600 mt-1">
            প্রচারমূলক অফার, নির্দিষ্ট বা শতকরা ছাড় এবং ন্যূনতম ক্রয়সীমা নির্ধারণ করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#8B5A2B] text-white hover:bg-[#724822] rounded-xl font-bn text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন কুপন যোগ করুন</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 font-bn">
            <Tag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p>কোনো কুপন কোড নেই। &quot;নতুন কুপন যোগ করুন&quot; বাটনে ক্লিক করে তৈরি করুন।</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                coupon.is_active
                  ? 'border-stone-200 hover:border-[#8B5A2B]/40'
                  : 'border-stone-200 bg-stone-50/60 opacity-75'
              }`}
            >
              <div>
                {/* Coupon Code Banner */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-stone-900 text-amber-300 rounded-lg font-mono font-bold text-sm tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleActive(coupon)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bn font-semibold border cursor-pointer transition-colors ${
                        coupon.is_active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-stone-200 text-stone-600 border-stone-300'
                      }`}
                    >
                      {coupon.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="কুপন মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Discount details */}
                <div className="mt-4 space-y-2 font-bn">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-sans text-stone-900">
                      {coupon.discount_type === 'percent'
                        ? `${coupon.discount_value}%`
                        : `৳${coupon.discount_value.toLocaleString('en-US')}`}
                    </span>
                    <span className="text-xs text-stone-500">ছাড়</span>
                  </div>

                  <div className="text-xs text-stone-600 space-y-1">
                    <p>
                      ন্যূনতম ক্রয়:{' '}
                      <strong className="font-sans text-stone-900">
                        ৳{coupon.min_order_amount.toLocaleString('en-US')}
                      </strong>
                    </p>
                    <p>
                      ব্যবহার:{' '}
                      <strong className="font-sans text-stone-900">{coupon.usage_count} বার</strong>
                      {coupon.usage_limit && ` (সর্বোচ্চ ${coupon.usage_limit})`}
                    </p>
                    {coupon.expires_at && (
                      <p className="flex items-center gap-1 text-stone-500 text-[11px] mt-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          মেয়াদ শেষ: {new Date(coupon.expires_at).toLocaleDateString('bn-BD')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit button */}
              <div className="mt-4 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => openEditModal(coupon)}
                  className="w-full py-1.5 text-center bg-stone-100 hover:bg-stone-200 rounded-xl font-bn text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                >
                  সম্পাদনা করুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create or Edit Coupon */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                {editingCoupon ? 'কুপন সম্পাদন করুন' : 'নতুন কুপন কোড তৈরি'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 py-4 font-bn text-sm">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  কুপন কোড (ইংরেজি বড় হাত) *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="যেমন: FACTORY500"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/20 focus:border-[#8B5A2B]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ছাড়ের ধরন
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#8B5A2B]"
                  >
                    <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                    <option value="percent">শতকরা হার (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ছাড়ের পরিমাণ *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans text-stone-800 focus:outline-none focus:border-[#8B5A2B]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-sans text-xs">
                      {discountType === 'percent' ? '%' : '৳'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Min Order & Usage Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ন্যূনতম অর্ডার (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans text-stone-800 focus:outline-none focus:border-[#8B5A2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    সর্বোচ্চ ব্যবহারের সীমা
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="সীমা না থাকলে খালি"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans text-stone-800 focus:outline-none focus:border-[#8B5A2B]"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  মেয়াদ শেষ হওয়ার তারিখ (ঐচ্ছিক)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans text-stone-800 focus:outline-none focus:border-[#8B5A2B]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8B5A2B] focus:ring-[#8B5A2B]"
                />
                <label htmlFor="couponActive" className="text-xs text-stone-700 cursor-pointer">
                  কুপনটি এখন থেকেই সক্রিয় থাকবে
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bn text-sm cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-[#8B5A2B] text-white hover:bg-[#724822] font-bn text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
