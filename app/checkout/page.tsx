'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  Trash2,
  ArrowLeft,
  Loader2,
  ShoppingBag,
  CreditCard,
  Tag,
  X,
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatBDT } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { submitOrderAction, validateCouponAction } from '@/lib/actions';
import { DeliveryZone, PaymentMethod } from '@/types/database';
import { getStoredUtmParameters, clearStoredUtmParameters } from '@/lib/utm';
import { trackInitiateCheckout, trackPurchase } from '@/lib/analytics';

const BD_DISTRICTS = [
  'ঢাকা (Dhaka)',
  'গাজীপুর (Gazipur)',
  'নারায়ণগঞ্জ (Narayanganj)',
  'চট্টগ্রাম (Chattogram)',
  'সিলেট (Sylhet)',
  'রাজশাহী (Rajshahi)',
  'খুলনা (Khulna)',
  'বরিশাল (Barishal)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
  'কুমিল্লা (Cumilla)',
  'বগুড়া (Bogura)',
  'কক্সবাজার (Cox\'s Bazar)',
  'ফরিদপুর (Faridpur)',
  'যশোর (Jashore)',
  'দিনাজপুর (Dinajpur)',
  'টাঙ্গাইল (Tangail)',
  'অন্যান্য সকল জেলা (Other Districts)',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, removeFromCart, updateQuantity, clearCart } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা (Dhaka)');
  const [upazila, setUpazila] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('inside');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [bkashSenderPhone, setBkashSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [idempotencyKey] = useState(() => 'chk_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto set zone based on district
  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    if (dist.includes('ঢাকা') || dist.includes('Dhaka')) {
      setDeliveryZone('inside');
    } else {
      setDeliveryZone('outside');
    }
  };

  const deliveryCharge = deliveryZone === 'inside' ? 120 : 200;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const effectiveSubtotal = Math.max(0, subtotal - couponDiscount);
  const totalAmount = effectiveSubtotal + deliveryCharge;

  // Track InitiateCheckout on page mount
  const hasFiredCheckoutRef = React.useRef(false);
  React.useEffect(() => {
    if (cart.length > 0 && !hasFiredCheckoutRef.current) {
      hasFiredCheckoutRef.current = true;
      trackInitiateCheckout(
        cart.map((item) => ({
          id: item.product.id,
          title: item.product.title_bn || item.product.title,
          price: item.product.discount_price ?? item.product.price,
          quantity: item.quantity,
        })),
        totalAmount
      );
    }
  }, [cart, totalAmount]);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bn font-bold text-[#2B1D14]">
            আপনার শপিং কার্টে কোনো পণ্য নেই
          </h1>
          <p className="text-stone-600 font-bn text-sm">
            চেকআউট করতে প্রথমে পছন্দের পণ্য কার্টে যুক্ত করুন।
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-7 py-3 rounded-full font-bn font-bold text-sm shadow-md transition-colors"
        >
          <span>ফার্নিচার কালেকশন দেখুন</span>
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponFeedback(null);

    try {
      const res = await validateCouponAction(couponCode.trim(), subtotal);
      if (res.success && res.discount) {
        setAppliedCoupon({
          code: res.code!,
          discount: res.discount,
          discount_type: res.discount_type!,
          discount_value: res.discount_value!,
        });
        setCouponFeedback({ type: 'success', text: res.message || 'কুপন সফলভাবে যুক্ত হয়েছে!' });
      } else {
        setCouponFeedback({ type: 'error', text: res.error || 'কুপন প্রযোজ্য নয়' });
      }
    } catch {
      setCouponFeedback({ type: 'error', text: 'কুপন যাচাই করা যায়নি' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponFeedback(null);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?88)?(01[3-9]\d{8})$/.test(cleanPhone)) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    if (!address.trim() || address.trim().length < 10) {
      setErrorMessage('অনুগ্রহ করে বিস্তারিত ঠিকানা দিন (বাসা নং, রোড, এলাকা, জেলা - কমপক্ষে ১০ অক্ষর)');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullAddress = `${address.trim()}, ${upazila ? upazila + ', ' : ''}${selectedDistrict}`;

      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        product_title: item.product.title_bn || item.product.title,
        selected_color: item.selectedColor,
        quantity: item.quantity,
        unit_price: item.product.discount_price ?? item.product.price,
      }));

      const utm = getStoredUtmParameters();

      const res = await submitOrderAction({
        customer_name: name,
        customer_phone: cleanPhone,
        customer_address: fullAddress,
        delivery_zone: deliveryZone,
        delivery_charge: deliveryCharge,
        subtotal: effectiveSubtotal,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        transaction_id: trxId ? `${trxId}${bkashSenderPhone ? ` (Sender: ${bkashSenderPhone})` : ''}` : undefined,
        order_notes: orderNotes
          ? `${orderNotes}${appliedCoupon ? ` [Coupon: ${appliedCoupon.code}]` : ''}`
          : appliedCoupon
          ? `[Coupon: ${appliedCoupon.code}]`
          : undefined,
        items: orderItems,
        website: websiteHoneypot,
        idempotency_key: idempotencyKey,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
      });

      if (res.success && res.orderNumber) {
        // Fire client-side Meta Pixel & GA4 Purchase with deduplicated event ID (orderNumber)
        trackPurchase(
          {
            orderNumber: res.orderNumber,
            totalAmount,
            items: orderItems.map((i) => ({
              id: i.product_id,
              title: i.product_title,
              price: i.unit_price,
              quantity: i.quantity,
            })),
          },
          res.orderNumber
        );

        clearStoredUtmParameters();
        clearCart();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bn text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ফার্নিচার কেনাকাটা চালিয়ে যান</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#2B1D14] mt-2">
          অর্ডার কনফার্মেশন ও চেকআউট
        </h1>
        <p className="text-xs sm:text-sm font-bn text-stone-600">
          কোনো অগ্রিম পেমেন্ট ছাড়াই সারাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার করুন
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Details Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bn font-bold text-[#2B1D14] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8A5A3B] text-white flex items-center justify-center text-xs font-sans">
                ১
              </span>
              <span>আপনার ডেলিভারি তথ্য</span>
            </h2>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bn rounded-2xl">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCheckout} id="checkout-form" className="space-y-4">
            {/* Anti-bot Honeypot field */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="checkout-website-field">Website</label>
              <input
                id="checkout-website-field"
                type="text"
                name="website"
                value={websiteHoneypot}
                onChange={(e) => setWebsiteHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Field 1: Name */}
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                আপনার পুরো নাম <span className="text-[#9F1239]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B] font-bn"
              />
            </div>

            {/* Field 2: Mobile Number */}
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                ১১ ডিজিটের সচল মোবাইল নাম্বার <span className="text-[#9F1239]">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B] font-sans"
              />
              <span className="text-[11px] text-stone-400 font-bn mt-1 block">
                ডেলিভারি ম্যান এই নম্বরে কল করে অর্ডার পৌঁছে দেবে
              </span>
            </div>

            {/* Field 3: District and Upazila Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                  জেলা নির্বাচন করুন <span className="text-[#9F1239]">*</span>
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B] cursor-pointer"
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                  থানা / উপজেলা
                </label>
                <input
                  type="text"
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  placeholder="যেমন: মিরপুর / উত্তরা / সদর"
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                />
              </div>
            </div>

            {/* Field 4: Address */}
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                বিস্তারিত ঠিকানা (বাসা নং, রোড, এলাকা) <span className="text-[#9F1239]">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: বাড়ি ১২, রোড ৪, সেক্টর ১০"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B] font-bn"
              />
            </div>

            {/* Field 5: Order Notes (Optional) */}
            <div>
              <label className="block text-xs font-bn font-semibold text-stone-600 mb-1">
                অর্ডারের বিশেষ নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="যেমন: বিকেল ৪টার পর কল দিবেন"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-xs font-bn text-stone-800"
              />
            </div>

            {/* Delivery Zone Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bn font-bold text-stone-700 mb-2">
                ডেলিভারি এলাকা ও চার্জ:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryZone('inside')}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    deliveryZone === 'inside'
                      ? 'border-[#8A5A3B] bg-[#8A5A3B]/10 ring-2 ring-[#8A5A3B]/30'
                      : 'border-stone-200 bg-[#FAF8F5] hover:bg-stone-100'
                  }`}
                >
                  <div>
                    <span className="font-bn text-xs font-bold text-stone-900 block">
                      ঢাকার ভেতরে (Inside Dhaka)
                    </span>
                    <span className="text-[11px] text-stone-500 font-bn">১-২ কর্মদিবসে সরাসরি ডেলিভারি</span>
                  </div>
                  <span className="text-sm font-sans font-bold text-[#8A5A3B] shrink-0">
                    ৳১২০
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone('outside')}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    deliveryZone === 'outside'
                      ? 'border-[#8A5A3B] bg-[#8A5A3B]/10 ring-2 ring-[#8A5A3B]/30'
                      : 'border-stone-200 bg-[#FAF8F5] hover:bg-stone-100'
                  }`}
                >
                  <div>
                    <span className="font-bn text-xs font-bold text-stone-900 block">
                      ঢাকার বাইরে (All Bangladesh)
                    </span>
                    <span className="text-[11px] text-stone-500 font-bn">কুরিয়ারে সুরক্ষিত হোম ডেলিভারি</span>
                  </div>
                  <span className="text-sm font-sans font-bold text-[#8A5A3B] shrink-0">
                    ৳২০০
                  </span>
                </button>
              </div>

              {deliveryZone === 'outside' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200/90 rounded-2xl text-xs font-bn text-amber-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    ঢাকার বাইরে নিশ্চিত ডেলিভারির জন্য ২০০ টাকা ডেলিভারি চার্জ অগ্রিম প্রযোজ্য (বিকাশ/নগদ)। পণ্য হাতে পেয়ে ডেলিভারিম্যানের সামনে চেক করে বাকি টাকা ক্যাশে পরিশোধ করবেন।
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bn font-bold text-stone-700 mb-2">
                পেমেন্ট পদ্ধতি নির্বাচন করুন:
              </label>
              <div className="space-y-2.5">
                <label
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all gap-3 ${
                    paymentMethod === 'cod'
                      ? 'border-[#8A5A3B] bg-[#8A5A3B]/10 ring-1 ring-[#8A5A3B]'
                      : 'border-stone-200 bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="payment_opt"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#8A5A3B] w-4 h-4 shrink-0"
                    />
                    <div>
                      <span className="font-bn font-bold text-sm text-stone-900 block">
                        ক্যাশ অন ডেলিভারি (Cash on Delivery)
                      </span>
                      <span className="font-bn text-xs text-stone-500">
                        পণ্য হাতে পেয়ে খুলে দেখে মূল্য পরিশোধ করুন
                      </span>
                    </div>
                  </div>
                  <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                </label>

                <label
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all gap-3 ${
                    paymentMethod === 'bkash_manual'
                      ? 'border-[#8A5A3B] bg-[#8A5A3B]/10 ring-1 ring-[#8A5A3B]'
                      : 'border-stone-200 bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="payment_opt"
                      checked={paymentMethod === 'bkash_manual'}
                      onChange={() => setPaymentMethod('bkash_manual')}
                      className="accent-[#8A5A3B] w-4 h-4 shrink-0"
                    />
                    <div>
                      <span className="font-bn font-bold text-sm text-stone-900 block">
                        বিকাশ / নগদ (অগ্রিম সেন্ড মানি)
                      </span>
                      <span className="font-bn text-xs text-stone-500">
                        অর্ডার দ্রুত প্রসেসিংয়ের জন্য অগ্রিম পেমেন্ট
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-pink-600 shrink-0" />
                </label>
              </div>

              {/* bKash instructions */}
              {paymentMethod === 'bkash_manual' && (
                <div className="mt-3 p-4 bg-pink-50/70 border border-pink-200 rounded-2xl text-xs font-bn text-pink-900 space-y-3">
                  <p>
                    আমাদের বিকাশ/নগদ নাম্বারে <strong>(01712-345678)</strong> সেন্ড মানি করে নিচের তথ্য দিন:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="tel"
                      value={bkashSenderPhone}
                      onChange={(e) => setBkashSenderPhone(e.target.value)}
                      placeholder="যে নাম্বার থেকে পাঠিয়েছেন"
                      className="px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-sans text-stone-900"
                    />
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="Transaction ID (TrxID)"
                      className="px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-sans text-stone-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary, Editable Items & Coupons */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif font-bold text-base text-[#2B1D14]">
                অর্ডার সারাংশ ({cart.length} টি ফার্নিচার)
              </h2>
            </div>

            {/* Editable Cart Item Rows */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => {
                const price = item.product.discount_price ?? item.product.price;
                const img =
                  item.product.images?.[0] ||
                  '/placeholders/products/smart-ergonomic-reading-table/01.jpg';

                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor}`}
                    className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-b-0"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                      <Image
                        src={getOptimizedImageUrl(img, 120)}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bn font-bold text-xs text-stone-900 truncate">
                        {item.product.title_bn || item.product.title}
                      </h4>
                      {item.selectedColor && (
                        <p className="text-[11px] font-bn text-stone-400">
                          কালার: {item.selectedColor}
                        </p>
                      )}
                      <p className="text-xs font-sans font-semibold text-stone-700">
                        {formatBDT(price)}
                      </p>
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor)}
                          className="px-2 py-0.5 text-xs font-bold text-stone-700 hover:bg-stone-200"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold font-sans">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                          className="px-2 py-0.5 text-xs font-bold text-stone-700 hover:bg-stone-200"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                        className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-3 border-t border-stone-200">
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bn text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>
                      কুপন <strong>{appliedCoupon.code}</strong> কার্যকর (-{formatBDT(appliedCoupon.discount)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 hover:text-emerald-950 cursor-pointer"
                    aria-label="কুপন বাতিল করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="কুপন কোড (যেমন: FACTORY500)"
                        className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans uppercase text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                      />
                      <Tag className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-[#8A5A3B] hover:bg-[#6E442B] disabled:bg-stone-300 text-white rounded-xl text-xs font-bn font-bold transition-colors cursor-pointer shrink-0"
                    >
                      {couponLoading ? 'যাচাই হচ্ছে...' : 'প্রয়োগ করুন'}
                    </button>
                  </div>
                  {couponFeedback && (
                    <p
                      className={`text-[11px] font-bn ${
                        couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {couponFeedback.text}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-stone-200 space-y-2 text-xs font-bn text-stone-600">
              <div className="flex justify-between">
                <span>পণ্যের মোট মূল্য:</span>
                <span className="font-sans font-bold text-stone-900">{formatBDT(subtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>কুপন ছাড় ({appliedCoupon.code}):</span>
                  <span className="font-sans font-bold">-{formatBDT(appliedCoupon.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-sans font-bold text-stone-900">{formatBDT(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>সর্বমোট প্রদেয়:</span>
                <span className="font-sans text-lg sm:text-xl text-[#8A5A3B]">{formatBDT(totalAmount)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 bg-[#8A5A3B] hover:bg-[#6E442B] disabled:bg-stone-400 text-white rounded-2xl font-bn font-bold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                  <span>অর্ডার তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>অর্ডার নিশ্চিত করুন ({formatBDT(totalAmount)})</span>
                </>
              )}
            </button>
          </div>

          {/* Trust Guarantee Box */}
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E8E2D9] space-y-2 text-xs font-bn text-stone-700">
            <div className="flex items-center gap-2 font-bold text-[#2B1D14]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>নিরাপদ ও নির্ভরযোগ্য অর্ডার নিশ্চয়তা:</span>
            </div>
            <p className="leading-relaxed">
              ডেলিভারি ম্যানের উপস্থিতিতে পণ্য খুলে দেখে নিন। কোনো ত্রুটি থাকলে সরাসরি ফেরত পাঠাতে পারবেন। কোনো অগ্রিম চার্জ ছাড়া ঘরে বসে কেনাকাটা করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
