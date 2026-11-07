'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Zap,
  MessageCircle,
  Truck,
  ShieldCheck,
  Ruler,
  Layers,
  Loader2,
  Heart,
  Camera,
  ChevronDown,
  Wrench,
  HelpCircle,
  FileText,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { Product, SiteSettings, DeliveryZone, PaymentMethod } from '@/types/database';
import { formatBDT, getDiscountPercentage, buildWhatsAppUrl } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { submitOrderAction } from '@/lib/actions';
import { trackViewContent } from '@/lib/analytics';
import { CallBackModal } from '@/components/storefront/CallBackModal';

interface ProductDetailClientProps {
  product: Product;
  settings: SiteSettings;
}

export function ProductDetailClient({ product, settings }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isSaved, toggleWishlist } = useWishlist();
  const saved = isSaved(product.id);

  const images = useMemo(
    () =>
      product.images && product.images.length > 0
        ? product.images
        : ['/placeholders/products/smart-ergonomic-reading-table/01.jpg'],
    [product.images]
  );

  const isPlaceholder = Boolean(
    settings.show_placeholder_tag !== false &&
    (product.has_placeholder_images ||
      images.some((img) => img.startsWith('/placeholders/') || img.includes('/placeholders/')))
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.color_options?.[0] || 'Standard'
  );
  const [quantity, setQuantity] = useState(1);
  const [isCallBackModalOpen, setIsCallBackModalOpen] = useState(false);

  // In-Page Direct Checkout State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('inside');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [trxId, setTrxId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [idempotencyKey] = useState(() => 'pdp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Recently viewed tracker
  const [recentlyViewed] = useState<
    Array<{
      id: string;
      title: string;
      title_bn: string;
      slug: string;
      price: number;
      discount_price?: number | null;
      image: string;
    }>
  >(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('dhd_recently_viewed');
      const list = stored ? JSON.parse(stored) : [];
      return list.filter((item: { id: string }) => item.id !== product.id).slice(0, 4);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dhd_recently_viewed');
      const list = stored ? JSON.parse(stored) : [];
      const others = list.filter((item: { id: string }) => item.id !== product.id);
      const updated = [
        {
          id: product.id,
          title: product.title,
          title_bn: product.title_bn,
          slug: product.slug,
          price: product.price,
          discount_price: product.discount_price,
          image: images[0],
        },
        ...others,
      ].slice(0, 8);
      localStorage.setItem('dhd_recently_viewed', JSON.stringify(updated));

      // Fire Meta Pixel & GA4 ViewContent event
      trackViewContent({
        id: product.id,
        title: product.title_bn || product.title,
        price: product.discount_price || product.price,
        category: product.category?.name_bn || product.category?.name,
      });
    } catch {
      // Ignore
    }
  }, [
    product.id,
    product.title,
    product.title_bn,
    product.slug,
    product.price,
    product.discount_price,
    product.category?.name,
    product.category?.name_bn,
    images,
  ]);

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

    if (!address.trim() || address.trim().length < 10) {
      setErrorMessage('অনুগ্রহ করে বিস্তারিত ঠিকানা দিন (বাসা নং, রোড, এলাকা, জেলা - কমপক্ষে ১০ অক্ষর)');
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
        website: websiteHoneypot,
        idempotency_key: idempotencyKey,
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

          {/* Stock or Lead Time Badge */}
          <div className="absolute top-4 right-4 bg-[#2B1D14]/80 backdrop-blur-xs text-[#FAF3E8] text-xs font-bn font-medium px-3 py-1 rounded-full border border-white/10">
            {product.stock_status === 'out_of_stock'
              ? 'স্টক শেষ'
              : product.stock_status === 'made_to_order'
              ? 'অর্ডারে তৈরি'
              : product.lead_time_days
              ? `ডেলিভারি ${product.lead_time_days} দিনে`
              : 'ডেলিভারি প্রস্তুত'}
          </div>

          {/* Sample Photo (নমুনা ছবি) Tag */}
          {isPlaceholder && (
            <div
              className="absolute bottom-4 left-4 bg-stone-900/85 backdrop-blur-xs text-amber-200 text-xs font-bn px-3 py-1 rounded-xl border border-amber-400/30 flex items-center gap-1.5 shadow-md"
              title="আসল পণ্যের ছবি শীঘ্রই যুক্ত হবে"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>নমুনা ছবি • আসল ছবি শীঘ্রই আসছে</span>
            </div>
          )}
        </div>

        {/* Placeholder Information Callout */}
        {isPlaceholder && (
          <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs font-bn">
                <p className="font-bold">কারখানায় তৈরি আসল পণ্যের ছবি দ্রুত যুক্ত করা হচ্ছে</p>
                <p className="text-amber-800 text-[11px] mt-0.5">আপনার কাস্টম সাইজ বা কালারের বাস্তব ছবি ও ভিডিও দেখতে WhatsApp-এ সরাসরি মেসেজ দিন।</p>
              </div>
            </div>
            <a
              href={`https://wa.me/${settings.whatsapp_number || '8801712345678'}?text=${encodeURIComponent(
                `আসসালামু আলাইকুম, "${product.title_bn || product.title}" পণ্যের কারখানা তৈরির আসল ছবি ও ভিডিও দেখতে চাই।`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bn font-bold rounded-xl shrink-0 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>আসল ছবি দেখতে চান?</span>
            </a>
          </div>
        )}

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

        {/* Workshop Craftsmanship Standard */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 space-y-3">
          <h4 className="font-bn font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ড্রিম হোম ডেকোর কারখানার নির্মাণ মান:</span>
          </h4>
          <ul className="text-xs font-bn text-stone-600 space-y-1.5 list-disc list-inside">
            <li>১৬ মিমি ডেনসিটি মেলামাইন বোর্ড ও অ্যান্টি-রাস্ট হার্ডওয়্যার</li>
            <li>১ মিমি পিভিসি এজ ব্যান্ডিং দিয়ে মসৃণ ও জলরোধী ফিনিশিং</li>
            <li>ডেলিভারিম্যানের উপস্থিতিতে প্যাকেজ খুলে চেক করে নেওয়ার সুযোগ</li>
            <li>মিরপুর নিজস্ব কারখানা থেকে সরাসরি যত্নসহকারে সরবরাহ</li>
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
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-[#5C3615] hover:bg-[#45270D] text-white py-2.5 px-3 sm:px-4 rounded-xl font-bn font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
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
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-3 rounded-xl font-bn font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-[1.01]"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন</span>
        </a>

        {/* Call Back Request Button */}
        <button
          type="button"
          onClick={() => setIsCallBackModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#F4ECE1] hover:bg-[#EAE0D3] text-[#8A5A3B] border border-[#E8E2D9] py-2.5 rounded-xl font-bn font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 text-[#8A5A3B]" />
          <span>কারিগরের সাথে কথা বলুন (কল ব্যাক রিকোয়েস্ট)</span>
        </button>

        {/* IN-PAGE FAST CHECKOUT FORM (F-Commerce Conversion) */}
        <div id="direct-order-form" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-[#8B5A2B]/30 shadow-md space-y-4">
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
            {/* Honeypot field (hidden from real users) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="pdp-website-field">Website</label>
              <input
                id="pdp-website-field"
                type="text"
                name="website"
                value={websiteHoneypot}
                onChange={(e) => setWebsiteHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
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
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B] font-bn"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
                বিশেষ নির্দেশনা (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="যেমন: কালার বা ডেলিভারি সময়ের নির্দেশনা"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B] font-bn"
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

        {/* Custom Sizing Callout */}
        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs font-bn">
          <div className="space-y-0.5">
            <span className="font-bold text-[#2B1D14] block">কাস্টম মাপ বা রঙের প্রয়োজন?</span>
            <span className="text-stone-600 block">আপনার ঘরের পরিমাপ অনুযায়ী ফার্নিচার তৈরি করে দেওয়া সম্ভব।</span>
          </div>
          <Link
            href={`/custom-furniture?ref=${encodeURIComponent(product.title_bn || product.title)}`}
            className="px-3.5 py-1.5 bg-white hover:bg-[#F4ECE1] text-[#8A5A3B] border border-[#8A5A3B]/40 rounded-xl font-bold whitespace-nowrap transition-colors shrink-0 shadow-2xs"
          >
            কাস্টম অর্ডার করুন
          </Link>
        </div>

        {/* Product Details & Specifications Accordions */}
        <div className="space-y-3 pt-2">
          {/* Accordion 1: Full Description */}
          {product.description && (
            <details
              open
              className="group bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-2xs open:border-[#8A5A3B]/40 transition-colors"
            >
              <summary className="flex items-center justify-between cursor-pointer font-serif font-bold text-[#2B1D14] text-sm list-none select-none">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8A5A3B]" />
                  <span>পণ্যটির বিস্তারিত বিবরণ</span>
                </span>
                <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <p className="mt-3 text-stone-600 font-bn text-xs sm:text-sm leading-relaxed whitespace-pre-line border-t border-[#E8E2D9]/60 pt-3">
                {product.description}
              </p>
            </details>
          )}

          {/* Accordion 2: Technical Specifications Table */}
          <details className="group bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-2xs open:border-[#8A5A3B]/40 transition-colors">
            <summary className="flex items-center justify-between cursor-pointer font-serif font-bold text-[#2B1D14] text-sm list-none select-none">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#8A5A3B]" />
                <span>উপকরণ ও কারিগরি স্পেসিফিকেশন</span>
              </span>
              <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <div className="mt-3 border-t border-[#E8E2D9]/60 pt-3 text-xs font-bn space-y-2">
              <div className="grid grid-cols-2 py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">বোর্ডের ধরন:</span>
                <span className="text-stone-900 font-bold font-sans">16mm Density Melamine Board</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">এজ ব্যান্ডিং সিলিং:</span>
                <span className="text-stone-900 font-bold font-sans">1mm Waterproof PVC Edge Banding</span>
              </div>
              {product.dimensions && (
                <div className="grid grid-cols-2 py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">পরিমাপ (L x W x H):</span>
                  <span className="text-stone-900 font-bold font-sans">{product.dimensions}</span>
                </div>
              )}
              {product.material && (
                <div className="grid grid-cols-2 py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">ম্যাটেরিয়াল ফিনিশ:</span>
                  <span className="text-stone-900 font-bold font-sans">{product.material}</span>
                </div>
              )}
              <div className="grid grid-cols-2 py-1.5">
                <span className="text-stone-500 font-medium">প্রস্তুতকারী কারখানা:</span>
                <span className="text-stone-900 font-bold">ড্রিম হোম ডেকোর, মিরপুর-১০, ঢাকা</span>
              </div>
            </div>
          </details>

          {/* Accordion 3: Delivery & Returns Policy */}
          <details className="group bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-2xs open:border-[#8A5A3B]/40 transition-colors">
            <summary className="flex items-center justify-between cursor-pointer font-serif font-bold text-[#2B1D14] text-sm list-none select-none">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#8A5A3B]" />
                <span>ডেলিভারি ও রিটার্ন নিশ্চয়তা</span>
              </span>
              <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <div className="mt-3 border-t border-[#E8E2D9]/60 pt-3 text-xs font-bn text-stone-600 space-y-2 leading-relaxed">
              <p>• <strong>ঢাকার ভেতরে:</strong> ১-২ কর্মদিবসে সরাসরি হোম ডেলিভারি (চার্জ ৳১২০)।</p>
              <p>• <strong>ঢাকার বাইরে:</strong> ৩-৫ কর্মদিবসে কুরিয়ারে ক্যাশ অন ডেলিভারি (চার্জ ৳২০০)।</p>
              <p>• <strong>খুলে দেখার সুযোগ:</strong> ডেলিভারিম্যানের সামনে সম্পূর্ণ প্যাকেট খুলে দেখে নেওয়ার শতভাগ নিশ্চয়তা রয়েছে। কোনো ত্রুটি থাকলে সরাসরি ফেরত পাঠাতে পারবেন।</p>
              <p>• <strong>৭ দিনের পার্টস রিপ্লেসমেন্ট:</strong> পরিবহনে কোনো অংশ ক্ষতিগ্রস্ত হলে দ্রুততম সময়ে নতুন পার্টস সরবরাহ করা হয়।</p>
            </div>
          </details>

          {/* Accordion 4: Furniture Care Instructions */}
          <details className="group bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-2xs open:border-[#8A5A3B]/40 transition-colors">
            <summary className="flex items-center justify-between cursor-pointer font-serif font-bold text-[#2B1D14] text-sm list-none select-none">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#8A5A3B]" />
                <span>মেলামাইন ফার্নিচারের যত্ন ও ব্যবহারবিধি</span>
              </span>
              <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <div className="mt-3 border-t border-[#E8E2D9]/60 pt-3 text-xs font-bn text-stone-600 space-y-1.5 leading-relaxed">
              <p>• পরিষ্কার শুকনো নরম সুতি কাপড় দিয়ে নিয়মিত ধুলাবালি মুছুন।</p>
              <p>• পানি পড়লে দ্রুত শুকনো কাপড় দিয়ে মুছে নিন। অতিরিক্ত তরল দীর্ঘক্ষণ জমিয়ে রাখবেন না।</p>
              <p>• টেবিল স্থানান্তরের সময় ফ্লোরে টেনে না নিয়ে উঁচু করে ধরে স্থানান্তর করুন।</p>
              <p>• সরাসরি তীব্র রোদ বা বৃষ্টি হতে দূরে রাখুন।</p>
            </div>
          </details>
        </div>
      </div>

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <div className="lg:col-span-12 pt-8 border-t border-[#E8E2D9] space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2B1D14]">
            সম্প্রতি আপনি দেখেছেন
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentlyViewed.map((rv) => (
              <Link
                key={rv.id}
                href={`/products/${rv.slug}`}
                className="group p-3 bg-white rounded-2xl border border-[#E8E2D9] hover:border-[#8A5A3B]/40 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 mb-2">
                  <Image
                    src={getOptimizedImageUrl(rv.image, 250)}
                    alt={rv.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h4 className="font-bn font-bold text-xs text-[#2B1D14] group-hover:text-[#8A5A3B] transition-colors line-clamp-1">
                    {rv.title_bn || rv.title}
                  </h4>
                  <span className="font-sans font-bold text-xs text-[#8A5A3B] mt-0.5 block">
                    {formatBDT(rv.discount_price ?? rv.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Mobile Bar for Conversion (390px Mobile View) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E8E2D9] p-3 z-40 flex items-center justify-between gap-3 shadow-xl">
        <div className="min-w-0">
          <span className="font-sans font-extrabold text-base sm:text-lg text-[#8A5A3B] block leading-none">
            {formatBDT(currentPrice)}
          </span>
          <span className="text-[10px] text-stone-500 font-bn block mt-0.5 truncate">
            {product.stock_status === 'out_of_stock' ? 'স্টক শেষ' : 'সরাসরি কারখানা মূল্য'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-xs"
            aria-label="হোয়াটসঅ্যাপে অর্ডার"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('direct-order-form');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                addToCart(product, 1, selectedColor);
              }
            }}
            className="px-4 py-2.5 bg-[#8A5A3B] hover:bg-[#6E442B] text-white text-xs font-bn font-bold rounded-xl shadow-xs transition-colors"
          >
            অর্ডার করুন
          </button>
        </div>
      </div>

      {/* Call Back Request Modal */}
      <CallBackModal
        isOpen={isCallBackModalOpen}
        onClose={() => setIsCallBackModalOpen(false)}
        productTitle={product.title_bn || product.title}
      />
    </div>
  );
}
