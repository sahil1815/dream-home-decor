'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Save,
  ArrowLeft,
  Loader2,
  Trash2,
  Copy,
  Eye,
  Camera,
  Info,
  Check,
} from 'lucide-react';
import { Product, Category, StockStatus } from '@/types/database';
import { ImageKitUrlManager } from '@/components/admin/ImageKitUrlManager';
import { saveProductAction, deleteProductAction, duplicateProductAction } from '@/lib/actions';
import { formatBDT, getDiscountPercentage } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface ProductFormProps {
  initialProduct?: Product;
  categories: Category[];
}

export function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialProduct?.title || '');
  const [titleBn, setTitleBn] = useState(initialProduct?.title_bn || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id || categories[0]?.id || '');
  const [price, setPrice] = useState(initialProduct?.price?.toString() || '');
  const [discountPrice, setDiscountPrice] = useState(initialProduct?.discount_price?.toString() || '');
  const [costPrice, setCostPrice] = useState(initialProduct?.cost_price?.toString() || '');
  const [dimensions, setDimensions] = useState(initialProduct?.dimensions || '');
  const [material, setMaterial] = useState(
    initialProduct?.material || 'Premium Melamine Board with 1mm PVC Edge Banding'
  );
  const [leadTimeDays, setLeadTimeDays] = useState(initialProduct?.lead_time_days?.toString() || '3');
  const [colorsText, setColorsText] = useState(
    initialProduct?.color_options?.join(', ') || 'Walnut Brown, Teak Wood, Antique Wood, Classic White'
  );
  const [stockStatus, setStockStatus] = useState<StockStatus>(
    initialProduct?.stock_status || 'in_stock'
  );
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured || false);
  const [isActive, setIsActive] = useState(initialProduct ? initialProduct.is_active : true);
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seo_description || '');
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto generate slug from title if empty
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialProduct && !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const colorArray = colorsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const res = await saveProductAction({
        id: initialProduct?.id,
        title,
        title_bn: titleBn,
        slug: slug.trim().toLowerCase(),
        description,
        price: Number(price),
        discount_price: discountPrice ? Number(discountPrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        category_id: categoryId || null,
        images,
        dimensions,
        material,
        lead_time_days: Number(leadTimeDays) || null,
        color_options: colorArray,
        stock_status: stockStatus,
        is_featured: isFeatured,
        is_active: isActive,
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'পণ্য সফলভাবে সংরক্ষণ হয়েছে!' });
        setTimeout(() => {
          router.push('/admin/products');
        }, 800);
      } else {
        setMessage({ type: 'error', text: res.error || 'সংরক্ষণ ব্যর্থ হয়েছে' });
      }
    } catch {
      setMessage({ type: 'error', text: 'নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!initialProduct) return;
    setIsDuplicating(true);
    try {
      const res = await duplicateProductAction(initialProduct.id);
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'পণ্য ডুপ্লিকেট হয়েছে!' });
        setTimeout(() => {
          router.push('/admin/products');
        }, 800);
      } else {
        setMessage({ type: 'error', text: res.error || 'ডুপ্লিকেট ব্যর্থ হয়েছে' });
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!initialProduct) return;
    if (!confirm('আপনি কি নিশ্চিত এই ফার্নিচারটি মুছে ফেলতে চান? (সফট ডিলিট: ড্রাফট হিসেবে হাইড থাকবে)')) return;

    setIsDeleting(true);
    try {
      const res = await deleteProductAction(initialProduct.id);
      if (res.success) {
        router.push('/admin/products');
      } else {
        setMessage({ type: 'error', text: res.error || 'মুছে ফেলা ব্যর্থ হয়েছে' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Preview computations
  const currentPrice = discountPrice ? Number(discountPrice) : Number(price) || 0;
  const originalPrice = discountPrice ? Number(price) : null;
  const discountPercent = originalPrice ? getDiscountPercentage(originalPrice, currentPrice) : 0;
  const primaryImg = images[0] || '/placeholders/products/smart-ergonomic-reading-table/01.jpg';
  const isPlaceholder = primaryImg.startsWith('/placeholders/');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-bn text-stone-900">
              {initialProduct ? 'ফার্নিচার এডিট করুন' : 'নতুন ফার্নিচার যোগ করুন'}
            </h1>
            <p className="text-xs font-bn text-stone-500">
              {initialProduct ? initialProduct.title_bn : 'কারখানার ক্যাটালগে নতুন আইটেম অন্তর্ভুক্তকরণ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {initialProduct && (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bn font-bold transition-colors cursor-pointer"
                title="একই ডিজাইনের অন্য ভ্যারিয়েন্ট তৈরির জন্য কপি করুন"
              >
                {isDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                <span>ডুপ্লিকেট কপি</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bn font-bold transition-colors cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>মুছুন</span>
              </button>
            </>
          )}

          <button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ফার্নিচার সেভ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bn font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form & Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <form
          id="product-form"
          onSubmit={handleSubmit}
          className="lg:col-span-8 space-y-6"
        >
          {/* Section 1: Basic Names & Slug */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bn font-bold text-stone-900 border-b border-stone-100 pb-2">
              ১. মূল পরিচিতি ও ক্যাটাগরি
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  বাংলা নাম (গ্রাহক প্রদর্শিত) *
                </label>
                <input
                  type="text"
                  required
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  placeholder="যেমন: স্মার্ট পড়ার টেবিল ও বুকশেলফ"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  ইংরেজি নাম (Internal / SEO) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Smart Ergonomic Reading Table"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  ইউআরএল স্লাগ (URL Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="smart-reading-table"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  ক্যাটাগরি *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_bn || c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Private Cost */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bn font-bold text-stone-900 border-b border-stone-100 pb-2">
              ২. মূল্য ও প্রফিট মার্জিন (Pricing)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  মূল মূল্য (Regular ৳) *
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="4500"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  ডিসকাউন্ট অফার মূল্য (৳)
                </label>
                <input
                  type="number"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="3800"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  কারখানা কস্ট প্রাইস (Cost ৳ - গোপন)
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="2400"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-500"
                />
                <span className="text-[10px] text-stone-400 font-bn">শুধুমাত্র মালিক/ম্যানেজার দেখতে পান</span>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Specifications & Stock */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bn font-bold text-stone-900 border-b border-stone-100 pb-2">
              ৩. স্পেসিফিকেশন ও কারখানা স্টক
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  মাপ ও ডাইমেনশন (Dimensions)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="3.5ft (L) x 2ft (W) x 4.5ft (H)"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  মেটেরিয়াল ও বোর্ড গ্রেড
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Premium Melamine Board with 1mm PVC Edge Banding"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  স্টক স্ট্যাটাস
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
                >
                  <option value="in_stock">রেডি স্টক (In Stock)</option>
                  <option value="made_to_order">অর্ডারে তৈরি (Made to Order)</option>
                  <option value="out_of_stock">স্টক আউট (Out of Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  তৈরির সময় (Lead time দিন)
                </label>
                <input
                  type="number"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  placeholder="3"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  কালার অপশনসমূহ (কমা দিয়ে আলাদা)
                </label>
                <input
                  type="text"
                  value={colorsText}
                  onChange={(e) => setColorsText(e.target.value)}
                  placeholder="Walnut Brown, Teak Wood, Antique Pine"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                বিস্তারিত পণ্যের বিবরণ (Bangla Description)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ফার্নিচারের সুবিধা, মেটেরিয়াল ফিনিশিং এবং ব্যবহারের সুবিধাসমূহ লিখুন..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: Images Manager */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bn font-bold text-stone-900 border-b border-stone-100 pb-2">
              ৪. ছবির গ্যালারি ও ড্রাইভ লিঙ্ক
            </h2>
            <ImageKitUrlManager images={images} onChange={setImages} />
          </div>

          {/* Section 5: SEO Meta & Visibility */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bn font-bold text-stone-900 border-b border-stone-100 pb-2">
              ৫. ভিজিবিলিটি ও সার্চ ইঞ্জিন অপটিমাইজেশন (SEO)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  এসইও মেটা টাইটেল (SEO Title)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={titleBn || title}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  মেটা ডেসক্রিপশন (Meta Description)
                </label>
                <input
                  type="text"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="সেরা মানের মেলামাইন বোর্ড দিয়ে তৈরি ফার্নিচার..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8B5A2B] focus:ring-[#8B5A2B]"
                />
                <span className="text-xs font-bn font-bold text-stone-800">
                  হোমপেজে ফিচার্ড সেকশনে প্রদর্শন করুন
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8B5A2B] focus:ring-[#8B5A2B]"
                />
                <span className="text-xs font-bn font-bold text-stone-800">
                  পাবলিশ স্ট্যাটাস (ওয়েবসাইটে দৃশ্যমান)
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Right Column: Live Storefront Card Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-1.5 text-xs font-bn font-bold text-stone-900">
                <Eye className="w-4 h-4 text-[#8B5A2B]" />
                <span>লাইভ স্টোরফ্রন্ট প্রিভিউ (Storefront Preview)</span>
              </div>
              <span className="text-[10px] font-bn text-stone-400">গ্রাহক যেভাবে দেখবেন</span>
            </div>

            {/* Rendered Mock Product Card */}
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200">
              <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs flex flex-col justify-between">
                <div className="relative aspect-square bg-stone-100 overflow-hidden">
                  <Image
                    src={getOptimizedImageUrl(primaryImg, 400)}
                    alt={title || 'Product'}
                    fill
                    className="object-cover"
                    unoptimized={primaryImg.startsWith('http')}
                  />

                  {discountPercent > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full font-sans">
                      -{discountPercent}% ছাড়
                    </div>
                  )}

                  {isPlaceholder && (
                    <div className="absolute bottom-2.5 left-2.5 bg-stone-900/85 backdrop-blur-xs text-amber-200 text-[10px] font-bn px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                      <Camera className="w-2.5 h-2.5 text-amber-300" />
                      <span>নমুনা ছবি</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 bg-[#5C3615]/90 text-white text-[10px] font-bn px-2 py-0.5 rounded-full">
                    {stockStatus === 'in_stock'
                      ? 'রেডি স্টক'
                      : stockStatus === 'made_to_order'
                      ? 'অর্ডারে তৈরি'
                      : 'স্টক আউট'}
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <p className="font-bn font-bold text-xs text-stone-900 truncate">
                    {titleBn || 'পণ্যের নাম এখানে প্রদর্শিত হবে'}
                  </p>
                  <p className="text-[10px] text-stone-400 font-sans truncate">{dimensions || '3.5ft x 2ft'}</p>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-sans font-extrabold text-sm text-[#8B5A2B]">
                      {formatBDT(currentPrice)}
                    </span>
                    {originalPrice && (
                      <span className="font-sans text-[11px] text-stone-400 line-through">
                        {formatBDT(originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-bn text-stone-500 space-y-1 bg-stone-50 p-3 rounded-xl">
              <p className="font-bold text-stone-700">কারখানা টিপস:</p>
              <p>• প্রতিটি পণ্যের উচ্চমানের ২-৩টি কোণ থেকে তোলা ছবি যোগ করুন।</p>
              <p>• মেলামাইন বোর্ডের ফিনিশিং ও ওয়াটারপ্রুফ এজ ব্যান্ডিং বিবরণে উল্লেখ করুন।</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
