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
  MessageCircle,
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatBDT } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { submitOrderAction } from '@/lib/actions';
import { DeliveryZone, PaymentMethod } from '@/types/database';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, removeFromCart, updateQuantity, clearCart } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('inside');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [trxId, setTrxId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const deliveryCharge = deliveryZone === 'inside' ? 120 : 200;
  const totalAmount = subtotal + deliveryCharge;

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bn font-bold text-stone-900">
            আপনার শপিং কার্ট খালি!
          </h1>
          <p className="text-stone-500 font-bn text-sm">
            চেকআউট করতে প্রথমে পণ্য কার্টে যুক্ত করুন।
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-7 py-3 rounded-full font-bn font-bold text-sm shadow-md transition-colors"
        >
          <span>ফার্নিচার কালেকশন দেখুন</span>
        </Link>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
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
      setErrorMessage('অনুগ্রহ করে বিস্তারিত ঠিকানা দিন (বাসা নং, রোড, থানা, জেলা)');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        product_title: item.product.title_bn || item.product.title,
        selected_color: item.selectedColor,
        quantity: item.quantity,
        unit_price: item.product.discount_price ?? item.product.price,
      }));

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
        items: orderItems,
      });

      if (res.success && res.orderNumber) {
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
        <h1 className="text-2xl sm:text-3xl font-extrabold font-bn text-stone-900 mt-2">
          অর্ডার কনফার্মেশন ও চেকআউট
        </h1>
        <p className="text-xs sm:text-sm font-bn text-stone-500">
          কোনো অগ্রিম পেমেন্ট ছাড়াই ক্যাশ অন ডেলিভারিতে অর্ডার করুন
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3-Field Frictionless Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bn font-bold text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8B5A2B] text-white flex items-center justify-center text-xs font-sans">
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
            {/* Field 1: Name */}
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                আপনার পুরো নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn"
              />
            </div>

            {/* Field 2: Mobile Number */}
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                ১১ ডিজিটের সচল মোবাইল নাম্বার <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans"
              />
              <span className="text-[11px] text-stone-400 font-bn mt-1 block">
                ডেলিভারি ম্যান এই নম্বরে কল করে অর্ডার পৌঁছে দেবে
              </span>
            </div>

            {/* Field 3: Address */}
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                সম্পূর্ণ ঠিকানা (বাসা, রোড, থানা, জেলা) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: বাড়ি ১২, রোড ৪, সেক্টর ১০, উত্তরা, ঢাকা"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn"
              />
            </div>

            {/* Delivery Zone Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bn font-bold text-stone-700 mb-2">
                ডেলিভারি এলাকা নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryZone('inside')}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    deliveryZone === 'inside'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 ring-2 ring-[#8B5A2B]/30'
                      : 'border-stone-200 bg-[#FAF8F5] hover:bg-stone-100'
                  }`}
                >
                  <div>
                    <span className="font-bn text-xs font-bold text-stone-900 block">
                      ঢাকার ভেতরে (Inside Dhaka)
                    </span>
                    <span className="text-[11px] text-stone-500 font-bn">২৪-৪৮ ঘণ্টার মধ্যে ডেলিভারি</span>
                  </div>
                  <span className="text-sm font-sans font-bold text-[#8B5A2B] shrink-0">
                    ৳১২০
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone('outside')}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    deliveryZone === 'outside'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 ring-2 ring-[#8B5A2B]/30'
                      : 'border-stone-200 bg-[#FAF8F5] hover:bg-stone-100'
                  }`}
                >
                  <div>
                    <span className="font-bn text-xs font-bold text-stone-900 block">
                      ঢাকার বাইরে (All Bangladesh)
                    </span>
                    <span className="text-[11px] text-stone-500 font-bn">কুরিয়ারে হোম ডেলিভারি</span>
                  </div>
                  <span className="text-sm font-sans font-bold text-[#8B5A2B] shrink-0">
                    ৳২০০
                  </span>
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bn font-bold text-stone-700 mb-2">
                পেমেন্ট পদ্ধতি:
              </label>
              <div className="space-y-2.5">
                <label
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all gap-3 ${
                    paymentMethod === 'cod'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 ring-1 ring-[#8B5A2B]'
                      : 'border-stone-200 bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="payment_opt"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#8B5A2B] w-4 h-4 shrink-0"
                    />
                    <div>
                      <span className="font-bn font-bold text-sm text-stone-900 block">
                        ক্যাশ অন ডেলিভারি (Cash on Delivery)
                      </span>
                      <span className="font-bn text-xs text-stone-500">
                        পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করুন
                      </span>
                    </div>
                  </div>
                  <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                </label>

                <label
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all gap-3 ${
                    paymentMethod === 'bkash_manual'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 ring-1 ring-[#8B5A2B]'
                      : 'border-stone-200 bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="payment_opt"
                      checked={paymentMethod === 'bkash_manual'}
                      onChange={() => setPaymentMethod('bkash_manual')}
                      className="accent-[#8B5A2B] w-4 h-4 shrink-0"
                    />
                    <div>
                      <span className="font-bn font-bold text-sm text-stone-900 block">
                        বিকাশ বা নগদ (সেন্ড মানি)
                      </span>
                      <span className="font-bn text-xs text-stone-500">
                        পার্সোনাল নাম্বারে সেন্ড মানি করুন
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-pink-600 shrink-0" />
                </label>
              </div>
            </div>

            {paymentMethod === 'bkash_manual' && (
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl space-y-2">
                <p className="text-xs font-bn text-pink-900">
                  আমাদের মার্চেন্ট/পার্সোনাল নম্বর: <strong className="font-sans">01712-345678</strong> (বিকাশ/নগদ)
                </p>
                <input
                  type="text"
                  placeholder="bKash / Nagad TrxID (যদি পেমেন্ট করে থাকেন)"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-pink-300 rounded-xl text-xs font-sans"
                />
              </div>
            )}

            {/* Optional Order Notes */}
            <div>
              <label className="block text-xs font-bn font-medium text-stone-600 mb-1">
                বিশেষ কোনো নির্দেশনা (অপশনাল):
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="যেমন: কোনো নির্দিষ্ট কালার বা ডেলিভারি সময় থাকলে লিখুন"
                className="w-full px-4 py-2 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn"
              />
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary & Place Order CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-base font-bn font-bold text-stone-900 border-b border-stone-100 pb-3">
              অর্ডারের সারসংক্ষেপ ({cart.length} টি আইটেম)
            </h2>

            {/* Item list */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => {
                const price = item.product.discount_price ?? item.product.price;
                const img =
                  item.product.images?.[0] ||
                  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=150&q=80';

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
                        {item.quantity} x {formatBDT(price)}
                      </p>
                    </div>
                    <span className="font-sans font-bold text-xs text-stone-900 shrink-0">
                      {formatBDT(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-stone-200 space-y-2 text-xs font-bn text-stone-600">
              <div className="flex justify-between">
                <span>পণ্যের মোট মূল্য:</span>
                <span className="font-sans font-bold text-stone-900">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-sans font-bold text-stone-900">{formatBDT(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>সর্বমোট প্রদেয়:</span>
                <span className="font-sans text-lg sm:text-xl text-[#8B5A2B]">{formatBDT(totalAmount)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-400 text-white rounded-2xl font-bn font-bold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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

          {/* Trust Guarantees */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-2 text-xs font-bn text-emerald-800">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>নিরাপদ ও নির্ভরযোগ্য অর্ডার:</span>
            </div>
            <p>
              ডেলিভারি ম্যানের সামনে পণ্য খুলে দেখে নিন। কোনো ত্রুটি বা সমস্যা থাকলে তাৎক্ষণিক
              বদল বা রিটার্ন সুবিধা রয়েছে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
