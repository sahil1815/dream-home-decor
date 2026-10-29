'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Loader2,
  Package,
  Layers,
  Ruler,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Product, Category, StockStatus } from '@/types/database';
import { ImageKitUrlManager } from '@/components/admin/ImageKitUrlManager';
import { saveProductAction, deleteProductAction } from '@/lib/actions';

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
  const [dimensions, setDimensions] = useState(initialProduct?.dimensions || '');
  const [material, setMaterial] = useState(
    initialProduct?.material || 'Premium Melamine Board with 1mm PVC Edge Banding'
  );
  const [colorsText, setColorsText] = useState(
    initialProduct?.color_options?.join(', ') || 'Walnut Brown, Teak Wood, Antique Wood, Classic White'
  );
  const [stockStatus, setStockStatus] = useState<StockStatus>(
    initialProduct?.stock_status || 'in_stock'
  );
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured || false);
  const [isActive, setIsActive] = useState(initialProduct ? initialProduct.is_active : true);
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
        category_id: categoryId || null,
        images,
        dimensions,
        material,
        color_options: colorArray,
        stock_status: stockStatus,
        is_featured: isFeatured,
        is_active: isActive,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'পণ্য সফলভাবে সংরক্ষণ হয়েছে!' });
        setTimeout(() => {
          router.push('/admin/products');
        }, 800);
      } else {
        setMessage({ type: 'error', text: res.error || 'সংরক্ষণ করতে সমস্যা হয়েছে' });
      }
    } catch {
      setMessage({ type: 'error', text: 'নেটওয়ার্ক এরর, আবার চেষ্টা করুন' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialProduct?.id) return;
    if (!confirm('আপনি কি নিশ্চিত যে এই ফার্নিচারটি ডিলিট করতে চান?')) return;

    setIsDeleting(true);
    try {
      const res = await deleteProductAction(initialProduct.id);
      if (res.success) {
        router.push('/admin/products');
      } else {
        alert(res.error || 'ডিলিট করা যায়নি');
      }
    } catch {
      alert('ত্রুটি ঘটেছে');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-bn text-stone-900">
              {initialProduct ? 'ফার্নিচার সম্পাদনা করুন' : 'নতুন ফার্নিচার যুক্ত করুন'}
            </h1>
            <p className="text-xs font-bn text-stone-500">
              টাইটেল, কারখানা মূল্য ও ImageKit ছবির লিংক দিন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {initialProduct && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bn font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>ডিলিট</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-400 text-white text-xs font-bn font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bn font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Main Form Fields */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bn font-bold text-stone-900">
              সাধারণ বিবরণ (Basic Details)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ইংরেজি নাম (Title EN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Smart Ergonomic Reading Table"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                বাংলা নাম (Title BN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="বুকশেলফ সহ আধুনিক পড়ার টেবিল"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ইউআরএল স্লাগ (Slug) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="smart-reading-table"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ক্যাটাগরি (Category)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_bn || c.name} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                রেগুলার মূল্য (Original Price - ৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4500"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ডিসকাউন্ট / কারখানা বিক্রয় মূল্য (Offer Price - ৳)
              </label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="3800"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />
              <span className="text-[11px] text-stone-400 font-bn mt-0.5 block">
                এই মূল্যে গ্রাহক অর্ডার করবে (ফ্যাক্টরি রেট)
              </span>
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                পরিমাপ (Dimensions)
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
                ম্যাটেরিয়াল ও ফিনিশিং
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Melamine Board with 1mm PVC Edge Banding"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              উপলব্ধ কালার অপশন (কমা দিয়ে লিখুন)
            </label>
            <input
              type="text"
              value={colorsText}
              onChange={(e) => setColorsText(e.target.value)}
              placeholder="Walnut Brown, Teak Wood, Antique Wood, Classic White"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
            />
          </div>

          {/* Dynamic ImageKit URL Preview Manager */}
          <div className="pt-4 border-t border-stone-100">
            <ImageKitUrlManager images={images} onChange={setImages} />
          </div>

          {/* Description */}
          <div className="pt-2">
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              বিস্তারিত বিবরণ (Description)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="আমাদের নিজস্ব কারখানায় উন্নত মানের ওয়াটারপ্রুফ মেলামাইন বোর্ড দিয়ে অত্যন্ত যত্নসহকারে তৈরি..."
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900 leading-relaxed"
            />
          </div>
        </div>

        {/* Right 4 Cols: Stock & Visibility Toggles */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
            <h3 className="text-sm font-bn font-bold text-stone-900 border-b border-stone-100 pb-2">
              স্টক ও প্রদর্শন স্ট্যাটাস
            </h3>

            {/* Stock status select */}
            <div>
              <label className="block text-xs font-bn font-semibold text-stone-700 mb-1">
                স্টক অবস্থা:
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn font-bold text-stone-800"
              >
                <option value="in_stock">রেডি স্টক (In Stock)</option>
                <option value="made_to_order">অর্ডারে তৈরি (Made to Order)</option>
                <option value="out_of_stock">স্টক শেষ (Out of Stock)</option>
              </select>
            </div>

            {/* Featured toggle */}
            <label className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
              <span className="text-xs font-bn font-semibold text-stone-800">
                হোমপেজ ফিচার্ড পণ্য (Featured)
              </span>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#8B5A2B] rounded"
              />
            </label>

            {/* Active toggle */}
            <label className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
              <span className="text-xs font-bn font-semibold text-stone-800">
                স্টোরফ্রন্টে প্রদর্শন করুন (Active)
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
