'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatBDT } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { submitOrderAction } from '@/lib/actions';
import { DeliveryZone, PaymentMethod } from '@/types/database';

export function QuickOrderModal() {
  const router = useRouter();
  const { quickOrderProduct, closeQuickOrder } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('inside');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [trxId, setTrxId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!quickOrderProduct) return null;

  const currentPrice = quickOrderProduct.discount_price ?? quickOrderProduct.price;
  const deliveryCharge = deliveryZone === 'inside' ? 120 : 200;
  const subtotal = currentPrice * quantity;
  const totalAmount = subtotal + deliveryCharge;

  const primaryImage =
    quickOrderProduct.images?.[0] ||
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80';

  const currentColor =
    selectedColor ||
    quickOrderProduct.color_options?.[0] ||
    'Standard Natural';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?88)?(01[3-9]\d{8})$/.test(cleanPhone)) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)');
      return;
    }

    if (!address.trim() || address.trim().length < 6) {
      setErrorMessage('অনুগ্রহ করে আপনার বিস্তারিত ঠিকানা লিখুন');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitOrderAction({
        customer_name: name,
        customer_phone: cleanPhone,
        customer_address: address,
        delivery_zone: deliveryZone,
        delivery_charge: deliveryCharge,
        subtotal,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        transaction_id: trxId || undefined,
        order_notes: orderNotes || undefined,
        items: [
          {
            product_id: quickOrderProduct.id,
            product_title: quickOrderProduct.title_bn || quickOrderProduct.title,
            selected_color: currentColor,
            quantity,
            unit_price: currentPrice,
          },
        ],
      });

      if (res.success && res.orderNumber) {
        closeQuickOrder();
        router.push(
          `/checkout/success?orderNumber=${res.orderNumber}&name=${encodeURIComponent(
            name
          )}&total=${totalAmount}&phone=${cleanPhone}`
        );
      } else {
        setErrorMessage(res.error || 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch {
      setErrorMessage('নেটওয়ার্ক সমস্যার কারণে অর্ডার সম্পন্ন করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1C1917] text-white p-3.5 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] sm:text-[11px] bg-[#8B5A2B] text-white px-2 py-0.5 rounded font-bn font-semibold uppercase">
              ১ মিনিটে দ্রুত অর্ডার
            </span>
            <h3 className="font-bn font-bold text-base sm:text-xl text-white mt-1">
              ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করুন
            </h3>
          </div>
          <button
            onClick={closeQuickOrder}
            className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer shrink-0"
            aria-label="ফর্ম বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Summary Mini Card */}
        <div className="p-3 sm:p-4 bg-amber-50/60 border-b border-amber-200/60 flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200">
            <Image
              src={getOptimizedImageUrl(primaryImage, 150)}
              alt={quickOrderProduct.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="font-bn font-bold text-stone-900 text-xs sm:text-sm truncate">
              {quickOrderProduct.title_bn || quickOrderProduct.title}
            </h4>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-xs sm:text-sm font-extrabold text-[#8B5A2B] font-sans">
                {formatBDT(currentPrice)}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 font-bn">
                (কারখানা মূল্য)
              </span>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-2 py-1 hover:bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
            >
              -
            </button>
            <span className="px-2.5 sm:px-3 py-1 font-bold text-xs">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-2 py-1 hover:bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Color Choice */}
        {quickOrderProduct.color_options && quickOrderProduct.color_options.length > 0 && (
          <div className="px-4 sm:px-5 pt-2.5 pb-2 border-b border-stone-200/60 shrink-0">
            <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
              পছন্দের কালার নির্বাচন করুন:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickOrderProduct.color_options.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bn font-medium transition-all cursor-pointer ${
                    currentColor === col
                      ? 'bg-[#8B5A2B] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bn font-medium">
              {errorMessage}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
              আপনার নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: তানভীর আহমেদ"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
              মোবাইল নাম্বার (১১ ডিজিট) <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="যেমন: 017XXXXXXXX"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans"
            />
          </div>

          {/* Customer Address */}
          <div>
            <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
              সম্পূর্ণ ঠিকানা (বাসা, রোড, থানা, জেলা) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: বাসা ১২, রোড ৪, সেক্টর ১০, উত্তরা, ঢাকা"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn"
            />
          </div>

          {/* Delivery Zone Selector */}
          <div>
            <label className="block text-xs font-bn font-semibold text-stone-700 mb-1.5">
              ডেলিভারি এরিয়া নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeliveryZone('inside')}
                className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  deliveryZone === 'inside'
                    ? 'border-[#8B5A2B] bg-[#8B5A2B]/5 ring-1 ring-[#8B5A2B]'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="font-bn text-xs font-bold text-stone-900">ঢাকার ভেতরে</span>
                <span className="text-xs font-sans font-semibold text-[#8B5A2B]">৳১২০</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryZone('outside')}
                className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  deliveryZone === 'outside'
                    ? 'border-[#8B5A2B] bg-[#8B5A2B]/5 ring-1 ring-[#8B5A2B]'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="font-bn text-xs font-bold text-stone-900">ঢাকার বাইরে</span>
                <span className="text-xs font-sans font-semibold text-[#8B5A2B]">৳২০০</span>
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bn font-semibold text-stone-700 mb-1.5">
              পেমেন্ট মাধ্যম:
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all gap-2 ${
                  paymentMethod === 'cod'
                    ? 'border-[#8B5A2B] bg-[#8B5A2B]/5 ring-1 ring-[#8B5A2B]'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name="quick_payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#8B5A2B] shrink-0"
                  />
                  <span className="font-bn text-xs font-bold text-stone-900">
                    ক্যাশ অন ডেলিভারি (পণ্য পেয়ে টাকা দিন)
                  </span>
                </div>
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              </label>

              <label
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all gap-2 ${
                  paymentMethod === 'bkash_manual'
                    ? 'border-[#8B5A2B] bg-[#8B5A2B]/5 ring-1 ring-[#8B5A2B]'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name="quick_payment"
                    checked={paymentMethod === 'bkash_manual'}
                    onChange={() => setPaymentMethod('bkash_manual')}
                    className="accent-[#8B5A2B] shrink-0"
                  />
                  <span className="font-bn text-xs font-bold text-stone-900">
                    বিকাশ / নগদ (অগ্রিম সেন্ড মানি)
                  </span>
                </div>
                <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded font-semibold shrink-0">
                  bKash / Nagad
                </span>
              </label>
            </div>
          </div>

          {paymentMethod === 'bkash_manual' && (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl space-y-2">
              <p className="text-xs font-bn text-pink-800">
                আমাদের বিকাশ/নগদ নম্বর: <strong className="font-sans">01712-345678</strong> (Personal/Send Money)
              </p>
              <input
                type="text"
                placeholder="bKash / Nagad TrxID (অপশনাল)"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-pink-300 rounded-lg text-xs"
              />
            </div>
          )}

          {/* Pricing Summary */}
          <div className="pt-2 border-t border-stone-200 space-y-1.5 text-xs font-bn text-stone-600">
            <div className="flex justify-between">
              <span>সাবটোটাল ({quantity} টি পণ্য):</span>
              <span className="font-sans font-semibold text-stone-900">{formatBDT(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-sans font-semibold text-stone-900">{formatBDT(deliveryCharge)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
              <span>সর্বমোট প্রদেয় মূল্য:</span>
              <span className="font-sans text-base text-[#8B5A2B]">{formatBDT(totalAmount)}</span>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 sm:py-3.5 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-400 text-white rounded-2xl font-bn font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                <span>অর্ডার প্রক্রিয়াকরণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>অর্ডার নিশ্চিত করুন ({formatBDT(totalAmount)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
