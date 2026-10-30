'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Zap,
  MessageCircle,
  Truck,
  ShieldCheck,
  Ruler,
  Layers,
  CheckCircle2,
  Phone,
  Clock,
  Loader2,
  Check,
  Heart,
} from 'lucide-react';
import { Product, SiteSettings, DeliveryZone, PaymentMethod } from '@/types/database';
import { formatBDT, getDiscountPercentage, buildWhatsAppUrl } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { submitOrderAction } from '@/lib/actions';

interface ProductDetailClientProps {
  product: Product;
  settings: SiteSettings;
}

export function ProductDetailClient({ product, settings }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isSaved, toggleWishlist } = useWishlist();
  const saved = isSaved(product.id);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.color_options?.[0] || 'Standard'
  );
  const [quantity, setQuantity] = useState(1);

  // In-Page Direct Checkout State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('inside');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [trxId, setTrxId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentPrice = product.discount_price ?? product.price;
  const originalPrice = product.discount_price ? product.price : null;
  const discountPercent = originalPrice
    ? getDiscountPercentage(originalPrice, currentPrice)
    : 0;

  const deliveryCharge = deliveryZone === 'inside'
    ? (Number(settings.delivery_charge_inside) || 120)
    : (Number(settings.delivery_charge_outside) || 200);

  const subtotal = currentPrice * quantity;
  const totalAmount = subtotal + deliveryCharge;

  // WhatsApp Order Link
  const whatsappMessage = `আসসালামু আলাইকুম ড্রিম হোম ডেকোর! আমি "${product.title_bn || product.title}" (কালার: ${selectedColor}, মূল্য: ${formatBDT(currentPrice)}) অর্ডার করতে চাই।`;
  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number, whatsappMessage);

  const handleDirectOrder = async (e: React.FormEvent) => {
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

    if (!address.trim() || address.trim().length < 6) {
      setErrorMessage('অনুগ্রহ করে আপনার বিস্তারিত ঠিকানা দিন');
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
            product_id: product.id,
            product_title: product.title_bn || product.title,
            selected_color: selectedColor,
            quantity,
            unit_price: currentPrice,
          },
        ],
      });

      if (res.success && res.orderNumber) {
        router.push(
          `/checkout/success?orderNumber=${res.orderNumber}&name=${encodeURIComponent(
            name
          )}&total=${totalAmount}&phone=${cleanPhone}`
        );
      } else {
        setErrorMessage(res.error || 'অর্ডার করতে সমস্যা হয়েছে');
      }
    } catch {
      setErrorMessage('নেটওয়ার্ক ত্রুটি, আবার চেষ্টা করুন');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left Column: Image Gallery */}
      <div className="lg:col-span-7 space-y-4">
        {/* Main Display Image */}
        <div className="relative aspect-4/3 sm:aspect-square bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm">
          <Image
            src={getOptimizedImageUrl(images[activeImageIndex], 900)}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />

          {discountPercent > 0 && (
            <div className="absolute top-4 left-4 bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-md">
              -{discountPercent}% ছাড়
            </div>
          )}

          <div className="absolute top-4 right-4 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-bn font-semibold px-3 py-1 rounded-full">
            {product.stock_status === 'in_stock'
              ? 'রেডি স্টক'
              : product.stock_status === 'made_to_order'
              ? 'অর্ডারে তৈরি'
              : 'স্টক আউট'}
          </div>
        </div>

        {/* Thumbnail Carousel / Grid */}
        {images.length > 1 && (
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-[#8B5A2B] scale-105 shadow-md'
                    : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={getOptimizedImageUrl(img, 150)}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Workshop Guarantee Box */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 space-y-3">
          <h4 className="font-bn font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ড্রিম হোম ডেকোর কারখানার বিশেষ নিশ্চয়তা:</span>
          </h4>
          <ul className="text-xs font-bn text-stone-600 space-y-1.5 list-disc list-inside">
            <li>১০০% প্রিমিয়াম মেলামাইন বোর্ড দ্বারা নির্মিত, কোনো ভেজাল নেই</li>
            <li>১ মিমি পিভিসি এজ ব্যান্ডিং দিয়ে মসৃণ ও ওয়াটারপ্রুফ ফিনিশিং</li>
            <li>ডেলিভারির সময় প্যাকেজ খুলে চেক করে নেওয়ার পূর্ণ সুযোগ</li>
            <li>মিরপুর নিজস্ব কারখানা থেকে সরাসরি যত্নসহকারে হ্যান্ডেল করা হয়</li>
          </ul>
        </div>
      </div>

      {/* Right Column: Details & Direct In-Page Checkout */}
      <div className="lg:col-span-5 space-y-5 sm:space-y-6">
        {/* Title & Pricing */}
        <div className="space-y-2">
          <span className="text-xs font-bn font-semibold text-[#8B5A2B] bg-[#8B5A2B]/10 px-2.5 py-1 rounded-full inline-block">
            {product.category?.name_bn || 'ফার্নিচার'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-bn text-[#1C1917] leading-tight">
            {product.title_bn || product.title}
          </h1>
          <p className="text-xs text-stone-400 font-sans">{product.title}</p>

          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 pt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#8B5A2B] font-sans">
              {formatBDT(currentPrice)}
            </span>
            {originalPrice && (
              <span className="text-sm sm:text-base text-stone-400 line-through font-sans">
                {formatBDT(originalPrice)}
              </span>
            )}
            <span className="text-xs font-bn text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
              সরাসরি কারখানা মূল্য
            </span>
          </div>
        </div>

        {/* Specifications Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bn bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200">
          {product.dimensions && (
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-stone-400 block text-[10px]">পরিমাপ (Dimensions):</span>
                <span className="font-sans font-bold text-stone-800 truncate block">{product.dimensions}</span>
              </div>
            </div>
          )}
          {product.material && (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8B5A2B] shrink-0" />
              <div className="min-w-0">
                <span className="text-stone-400 block text-[10px]">ম্যাটেরিয়াল:</span>
                <span className="font-semibold text-stone-800 truncate block">{product.material}</span>
              </div>
            </div>
          )}
        </div>

        {/* Color Selector */}
        {product.color_options && product.color_options.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bn font-bold text-stone-800">
              কালার নির্বাচন করুন:
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {product.color_options.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-bn font-medium transition-all cursor-pointer ${
                    selectedColor === col
                      ? 'bg-[#8B5A2B] text-white shadow-sm ring-2 ring-[#8B5A2B]/40'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Adjuster & Quick Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-2.5 sm:px-3 py-2 text-stone-700 hover:bg-stone-100 font-bold text-xs sm:text-sm cursor-pointer"
            >
              -
            </button>
            <span className="px-3 sm:px-4 py-2 font-bold text-xs sm:text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-2.5 sm:px-3 py-2 text-stone-700 hover:bg-stone-100 font-bold text-xs sm:text-sm cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => addToCart(product, quantity, selectedColor)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-stone-900 hover:bg-black text-white py-2.5 px-3 sm:px-4 rounded-xl font-bn font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">কার্টে যোগ করুন</span>
          </button>

          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
              saved
                ? 'border-rose-300 bg-rose-50 text-rose-500 hover:bg-rose-100'
                : 'border-stone-300 bg-white text-stone-600 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50/50'
            }`}
            aria-label={saved ? 'সেভ তালিকা থেকে মুছুন' : 'পছন্দে সেভ করুন'}
            title={saved ? 'সেভ করা আছে' : 'সেভ করুন'}
          >
            <Heart className={`w-5 h-5 ${saved ? 'fill-rose-500 stroke-rose-500' : 'stroke-[1.75]'}`} />
          </button>
        </div>

        {/* WhatsApp One-Click Order */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-emerald-700 text-white py-3 rounded-xl font-bn font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-[1.01]"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন</span>
        </a>

        {/* IN-PAGE FAST CHECKOUT FORM (F-Commerce Conversion) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-[#8B5A2B]/30 shadow-md space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <span className="bg-[#8B5A2B] text-white text-[10px] sm:text-[11px] font-bn font-semibold px-2 py-0.5 rounded uppercase">
              সরাসরি অর্ডার ফর্ম
            </span>
            <h3 className="text-base sm:text-lg font-bn font-bold text-stone-900 mt-1">
              ক্যাশ অন ডেলিভারিতে নিতে নিচের ফর্মটি পূরণ করুন
            </h3>
            <p className="text-xs text-stone-500 font-bn">
              কোনো অগ্রিম পেমেন্ট ছাড়াই অর্ডার করতে পারবেন
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bn rounded-xl">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleDirectOrder} className="space-y-3">
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
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
                মোবাইল নাম্বার <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: 017XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
                সম্পূর্ণ ঠিকানা <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="বাসা নং, রোড, থানা, জেলা"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn"
              />
            </div>

            {/* Delivery Zone Selector */}
            <div>
              <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
                ডেলিভারি এরিয়া:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryZone('inside')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bn flex justify-between items-center transition-all cursor-pointer ${
                    deliveryZone === 'inside'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 font-bold'
                      : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <span>ঢাকার ভেতরে</span>
                  <span className="font-sans font-bold text-[#8B5A2B]">
                    {formatBDT(settings.delivery_charge_inside || 120)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone('outside')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bn flex justify-between items-center transition-all cursor-pointer ${
                    deliveryZone === 'outside'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 font-bold'
                      : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <span>ঢাকার বাইরে</span>
                  <span className="font-sans font-bold text-[#8B5A2B]">
                    {formatBDT(settings.delivery_charge_outside || 200)}
                  </span>
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
                পেমেন্ট অপশন:
              </label>
              <div className="space-y-1.5">
                <label
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs font-bn gap-2 ${
                    paymentMethod === 'cod'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 font-bold'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="radio"
                      name="pdp_payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#8B5A2B] shrink-0"
                    />
                    <span>ক্যাশ অন ডেলিভারি (পণ্য পেয়ে টাকা দিন)</span>
                  </div>
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                </label>

                <label
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs font-bn gap-2 ${
                    paymentMethod === 'bkash_manual'
                      ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 font-bold'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="radio"
                      name="pdp_payment"
                      checked={paymentMethod === 'bkash_manual'}
                      onChange={() => setPaymentMethod('bkash_manual')}
                      className="accent-[#8B5A2B] shrink-0"
                    />
                    <span>বিকাশ / নগদ (অগ্রিম সেন্ড মানি)</span>
                  </div>
                  <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-semibold shrink-0">
                    01712-345678
                  </span>
                </label>
              </div>
            </div>

            {paymentMethod === 'bkash_manual' && (
              <input
                type="text"
                placeholder="bKash / Nagad TrxID (অপশনাল)"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="w-full px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg text-xs font-sans"
              />
            )}

            {/* Price Total */}
            <div className="pt-2 border-t border-stone-200 text-xs font-bn space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>পণ্য মূল্য:</span>
                <span className="font-sans font-bold">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-sans font-bold">{formatBDT(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                <span>সর্বমোট:</span>
                <span className="font-sans text-base sm:text-lg text-[#8B5A2B]">{formatBDT(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 sm:py-3.5 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-400 text-white rounded-2xl font-bn font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                  <span>অর্ডার প্রসেসিং...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300 shrink-0" />
                  <span>এখনই অর্ডার কনফার্ম করুন ({formatBDT(totalAmount)})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-2">
            <h3 className="font-bn font-bold text-stone-900 text-sm">
              পণ্যটির বিস্তারিত বিবরণ:
            </h3>
            <p className="font-bn text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
