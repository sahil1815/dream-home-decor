'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  AlertCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { getOptimizedImageUrl, isImageKitUrl } from '@/lib/imagekit';

interface ImageKitUrlManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageKitUrlManager({ images, onChange }: ImageKitUrlManagerProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  const handleAddUrl = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;
    if (images.includes(trimmed)) return;

    onChange([...images, trimmed]);
    setInputUrl('');
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([item, ...remaining]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  const handleImageError = (url: string) => {
    setBrokenUrls((prev) => ({ ...prev, [url]: true }));
  };

  const addSampleImage = (url: string) => {
    if (!images.includes(url)) {
      onChange([...images, url]);
    }
  };

  return (
    <div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bn font-bold text-stone-900">
            প্রোডাক্ট ইমেজ ইউআরএল ম্যানেজার (ImageKit.io Multi-URL Preview)
          </label>
          <p className="text-[11px] font-bn text-stone-500">
            ImageKit থেকে কপি করা ডাইরেক্ট ইমেজ লিংক পেস্ট করুন। প্রথম ছবিটি কভার ইমেজ হিসেবে প্রদর্শিত হবে।
          </p>
        </div>

        {images.length > 0 && (
          <span className="text-xs font-bn font-semibold text-stone-600 bg-stone-200/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
            মোট ছবি: {images.length}
          </span>
        )}
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="https://ik.imagekit.io/your_id/products/reading-table-01.jpg"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
          />
          <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
        </div>

        <button
          type="button"
          onClick={handleAddUrl}
          className="bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-4 py-2.5 rounded-xl text-xs font-bn font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>লিঙ্ক যোগ করুন</span>
        </button>
      </div>

      {/* Fast sample images for instant testing */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bn text-stone-400">টেস্টিং স্যাম্পল ছবি:</span>
        <button
          type="button"
          onClick={() =>
            addSampleImage(
              'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'
            )
          }
          className="text-[10px] font-bn text-[#8B5A2B] hover:underline bg-white px-2 py-0.5 rounded border border-stone-200"
        >
          + পড়ার টেবিল ১
        </button>
        <button
          type="button"
          onClick={() =>
            addSampleImage(
              'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
            )
          }
          className="text-[10px] font-bn text-[#8B5A2B] hover:underline bg-white px-2 py-0.5 rounded border border-stone-200"
        >
          + কম্পিউটার ডেস্ক
        </button>
        <button
          type="button"
          onClick={() =>
            addSampleImage(
              'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80'
            )
          }
          className="text-[10px] font-bn text-[#8B5A2B] hover:underline bg-white px-2 py-0.5 rounded border border-stone-200"
        >
          + বুকশেলফ
        </button>
      </div>

      {/* Dynamic List with Instant Thumbnail Previews */}
      {images.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto text-stone-300" />
          <p className="text-xs font-bn">
            এখনও কোনো ছবির লিঙ্ক যোগ করা হয়নি। উপরে ImageKit বা ছবির URL পেস্ট করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {images.map((url, index) => {
            const isPrimary = index === 0;
            const isBroken = !!brokenUrls[url];

            return (
              <div
                key={`${url}-${index}`}
                className={`p-3 bg-white rounded-2xl border flex items-center gap-3 transition-all ${
                  isPrimary
                    ? 'border-[#8B5A2B] ring-1 ring-[#8B5A2B]/20 bg-amber-50/20'
                    : 'border-stone-200'
                }`}
              >
                {/* Instant Thumbnail Preview */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 flex items-center justify-center">
                  {isBroken ? (
                    <div className="text-center p-1">
                      <AlertCircle className="w-4 h-4 text-rose-500 mx-auto" />
                      <span className="text-[9px] text-rose-600 font-bn block">ভুল লিঙ্ক</span>
                    </div>
                  ) : (
                    <Image
                      src={getOptimizedImageUrl(url, 150)}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(url)}
                    />
                  )}
                </div>

                {/* URL Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isPrimary ? (
                      <span className="bg-[#8B5A2B] text-white text-[10px] font-bn font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white" />
                        <span>মূল কভার ছবি</span>
                      </span>
                    ) : (
                      <span className="bg-stone-100 text-stone-600 text-[10px] font-bn font-semibold px-2 py-0.5 rounded-full">
                        ছবি #{index + 1}
                      </span>
                    )}

                    {isImageKitUrl(url) && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-sans font-bold px-1.5 py-0.2 rounded border border-blue-200">
                        ImageKit CDN
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-stone-600 truncate mt-1">
                    {url}
                  </p>
                </div>

                {/* Actions: Reorder & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleMakePrimary(index)}
                      className="text-stone-500 hover:text-[#8B5A2B] p-1.5 rounded-lg hover:bg-stone-100 text-xs font-bn font-semibold flex items-center gap-1"
                      title="কভার ইমেজ হিসেবে সেট করুন"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">কভার করুন</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 hover:bg-stone-100 rounded-lg"
                    title="উপরে নিন"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 hover:bg-stone-100 rounded-lg"
                    title="নিচে নিন"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
