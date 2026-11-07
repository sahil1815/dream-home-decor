'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PlusCircle,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Product, Category } from '@/types/database';
import { formatBDT } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import {
  duplicateProductAction,
  deleteProductAction,
  toggleProductStatusAction,
} from '@/lib/actions';

interface ProductListManagerProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ProductListManager({
  initialProducts,
  categories,
}: ProductListManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.title_bn.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q);

    const matchCat = categoryFilter === 'all' || p.category_id === categoryFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'draft' && !p.is_active) ||
      (statusFilter === 'placeholder' && p.has_placeholder_images);

    return matchSearch && matchCat && matchStatus;
  });

  const handleTogglePublish = async (product: Product) => {
    setActionId(product.id);
    try {
      const newStatus = !product.is_active;
      const res = await toggleProductStatusAction(product.id, newStatus);
      if (res.success) {
        setProducts((prev) =>
          prev.map((item) => (item.id === product.id ? { ...item, is_active: newStatus } : item))
        );
      }
    } finally {
      setActionId(null);
    }
  };

  const handleDuplicate = async (product: Product) => {
    setActionId(product.id);
    try {
      const res = await duplicateProductAction(product.id);
      if (res.success) {
        // Refresh or append
        window.location.reload();
      }
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`আপনি কি "${product.title_bn || product.title}" মুছে ফেলতে চান?`)) return;
    setActionId(product.id);
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900">
            ফার্নিচার ও প্রোডাক্ট ক্যাটালগ
          </h1>
          <p className="text-xs font-bn text-stone-500 mt-0.5">
            মোট ফার্নিচার: {products.length}টি | ড্রাফট: {products.filter((p) => !p.is_active).length}টি | অ্যাক্টিভ: {products.filter((p) => p.is_active).length}টি
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-5 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন ফার্নিচার যোগ করুন</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম বা স্লাগ দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-800"
          >
            <option value="all">সব ক্যাটাগরি (All Categories)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_bn || c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-800"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="active">শুধুমাত্র প্রকাশিত (Active)</option>
            <option value="draft">ড্রাফট / হাইডকৃত (Hidden)</option>
            <option value="placeholder">নমুনা ছবি সক্রিয় (Placeholders)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs font-bn">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">ছবি</th>
                <th className="py-3.5 px-4">পণ্যের নাম ও বিবরণ</th>
                <th className="py-3.5 px-4">ক্যাটাগরি</th>
                <th className="py-3.5 px-4">কারখানা রেট</th>
                <th className="py-3.5 px-4">স্টক ও ফটো স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    কোনো পণ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const img =
                    product.images?.[0] ||
                    '/placeholders/products/smart-ergonomic-reading-table/01.jpg';
                  const currentPrice = product.discount_price ?? product.price;
                  const isBusy = actionId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        !product.is_active ? 'opacity-60 bg-stone-50/50' : ''
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                          <Image
                            src={getOptimizedImageUrl(img, 150)}
                            alt={product.title}
                            fill
                            className="object-cover"
                            unoptimized={img.startsWith('http')}
                          />
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-stone-900 text-sm">
                            {product.title_bn || product.title}
                          </p>
                          {!product.is_active && (
                            <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-1.5 py-0.5 rounded">
                              ড্রাফট
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5 truncate">
                          {product.slug}
                        </p>
                        {product.dimensions && (
                          <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                            {product.dimensions}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-stone-600">
                        {product.category?.name_bn || 'ফার্নিচার'}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <p className="font-sans font-extrabold text-sm text-[#8B5A2B]">
                          {formatBDT(currentPrice)}
                        </p>
                        {product.discount_price && (
                          <span className="text-[11px] text-stone-400 line-through font-sans block">
                            {formatBDT(product.price)}
                          </span>
                        )}
                      </td>

                      {/* Stock & Photo Status */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div>
                          {product.stock_status === 'in_stock' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              রেডি স্টক
                            </span>
                          ) : product.stock_status === 'made_to_order' ? (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              অর্ডারে তৈরি
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              স্টক আউট
                            </span>
                          )}
                        </div>

                        {product.has_placeholder_images && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                            <Camera className="w-2.5 h-2.5 text-amber-600" />
                            <span>নমুনা ছবি</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(product)}
                          disabled={isBusy}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                          title={product.is_active ? 'আনপাবলিশ (হাইড) করুন' : 'পাবলিশ করুন'}
                        >
                          {product.is_active ? (
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(product)}
                          disabled={isBusy}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                          title="ডুপ্লিকেট কপি বানান"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="inline-flex p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
                          title="স্টোরফ্রন্টে দেখুন"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          <span>এডিট</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={isBusy}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
