'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PlusCircle, Trash2, Layers } from 'lucide-react';
import { Category } from '@/types/database';
import { saveCategoryAction, deleteCategoryAction } from '@/lib/actions';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openCreate = () => {
    setEditingCategory(null);
    setNameBn('');
    setNameEn('');
    setSlug('');
    setImageUrl('/placeholders/products/smart-ergonomic-reading-table/01.jpg');
    setDisplayOrder((categories.length + 1).toString());
    setIsActive(true);
    setIsCreating(true);
    setMessage(null);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNameBn(cat.name_bn);
    setNameEn(cat.name);
    setSlug(cat.slug);
    setImageUrl(cat.image_url || '/placeholders/products/smart-ergonomic-reading-table/01.jpg');
    setDisplayOrder(cat.display_order?.toString() || '1');
    setIsActive(cat.is_active);
    setIsCreating(true);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await saveCategoryAction({
        id: editingCategory?.id,
        name: nameEn || nameBn,
        name_bn: nameBn,
        slug: slug.trim().toLowerCase(),
        image_url: imageUrl.trim() || null,
        display_order: Number(displayOrder) || 1,
        is_active: isActive,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'ক্যাটাগরি সংরক্ষিত হয়েছে' });
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } else {
        setMessage({ type: 'error', text: res.error || 'সংরক্ষণ ব্যর্থ হয়েছে' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`আপনি কি "${name}" ক্যাটাগরি মুছে ফেলতে চান?`)) return;
    try {
      const res = await deleteCategoryAction(id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#8B5A2B]" />
            <span>ফার্নিচার ক্যাটাগরি ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-xs font-bn text-stone-500 mt-0.5">
            ওয়েবসাইটের মেন্যু, ফিল্টারিং ও ব্রাউজিং ক্যাটাগরি নিয়ন্ত্রণ করুন
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-5 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন ক্যাটাগরি যোগ করুন</span>
        </button>
      </div>

      {/* Create / Edit Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-bn font-bold text-base text-stone-900">
                {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-bn font-bold ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs font-bn">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  বাংলা নাম (মেন্যুতে দৃশ্যমান) *
                </label>
                <input
                  type="text"
                  required
                  value={nameBn}
                  onChange={(e) => {
                    setNameBn(e.target.value);
                    if (!editingCategory && !slug) {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="যেমন: পড়ার টেবিল"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">ইংরেজি নাম *</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Reading Tables"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">স্লাগ (URL Slug) *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="reading-tables"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">কাভার ছবি URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/placeholders/products/smart-ergonomic-reading-table/01.jpg"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">ক্রম নম্বর (Display Order)</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans font-bold"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-[#8B5A2B] focus:ring-[#8B5A2B]"
                    />
                    <span className="font-bold text-stone-800">সক্রিয় (Active)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-2 text-stone-500 hover:text-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white font-bold rounded-xl shadow-xs"
                >
                  {isSaving ? 'সংরক্ষিত হচ্ছে...' : 'ক্যাটাগরি সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                <Image
                  src={getOptimizedImageUrl(cat.image_url || '/placeholders/products/smart-ergonomic-reading-table/01.jpg', 150)}
                  alt={cat.name_bn}
                  fill
                  className="object-cover"
                  unoptimized={cat.image_url?.startsWith('http')}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bn font-bold text-sm text-stone-900 truncate">
                    {cat.name_bn}
                  </h3>
                  <span
                    className={`text-[9px] font-bn px-1.5 py-0.5 rounded ${
                      cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {cat.is_active ? 'অ্যাক্টিভ' : 'হাইড'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-sans truncate">{cat.name}</p>
                <p className="text-[10px] text-stone-400 font-mono mt-0.5">/{cat.slug}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bn">
              <span className="text-stone-400 font-mono text-[11px]">
                সিরিয়াল: #{cat.display_order}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold"
                >
                  এডিট
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name_bn)}
                  className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                  title="মুছুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
