'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Loader2,
  Plus,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  HardDrive,
} from 'lucide-react';
import { getOptimizedImageUrl, isImageKitUrl } from '@/lib/imagekit';

interface ImageKitUrlManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageKitUrlManager({ images, onChange }: ImageKitUrlManagerProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload handler for single or multiple files
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('image/')) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      setUploadError('শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP) গ্রহণযোগ্য।');
      setIsUploading(false);
      return;
    }

    const newUploadedUrls: string[] = [];
    let failedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress(`গুগল ড্রাইভে আপলোড হচ্ছে (${i + 1}/${validFiles.length}): ${file.name}`);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/drive-upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          newUploadedUrls.push(data.url);
        } else {
          failedCount++;
          console.error('Upload failed for file:', file.name, data.error);
        }
      } catch (err) {
        failedCount++;
        console.error('Upload network error:', err);
      }
    }

    if (newUploadedUrls.length > 0) {
      onChange([...images, ...newUploadedUrls]);
    }

    if (failedCount > 0) {
      setUploadError(
        `${failedCount}টি ফাইল আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।`
      );
    }

    setIsUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

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

  const isGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('googleusercontent.com');
  };

  return (
    <div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
      {/* Header with Connected Drive Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bn font-bold text-stone-900">
              প্রোডাক্ট ফটো গ্যালারি ও গুগল ড্রাইভ অটো-আপলোড
            </label>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bn font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ড্রাইভ সিঙ্ক সক্রিয়
            </span>
          </div>
          <p className="text-[11px] font-bn text-stone-500 mt-0.5">
            কম্পিউটার বা মোবাইল থেকে ছবি সিলেক্ট করলেই স্বয়ংক্রিয়ভাবে গুগল ড্রাইভ ফোল্ডারে সেভ হয়ে যাবে।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {images.length > 0 && (
            <span className="text-xs font-bn font-semibold text-stone-600 bg-stone-200/80 px-2.5 py-1 rounded-full">
              মোট ছবি: {images.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-[11px] font-bn text-[#8B5A2B] hover:text-[#6D431F] font-semibold underline flex items-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showManualUrl ? 'লিঙ্ক ইনপুট লুকান' : 'সরাসরি লিঙ্ক পেস্ট করুন'}</span>
          </button>
        </div>
      </div>

      {/* Primary: Direct Drag & Drop / File Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        className={`relative p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'border-[#8B5A2B] bg-amber-50/60 scale-[1.01]'
            : 'border-stone-300 bg-white hover:border-[#8B5A2B]/60 hover:bg-stone-50/80'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files);
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-8 h-8 text-[#8B5A2B] animate-spin" />
            <p className="text-xs font-bn font-bold text-stone-800">
              {uploadProgress || 'গুগল ড্রাইভে আপলোড হচ্ছে...'}
            </p>
            <p className="text-[11px] font-bn text-stone-500">
              অনুগ্রহ করে অপেক্ষা করুন, ছবিটি গুগল ড্রাইভের ক্লাউডে আপলোড হচ্ছে
            </p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#8B5A2B] flex items-center justify-center shadow-2xs border border-amber-200/50">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bn font-bold text-stone-800">
                ছবি আপলোড করতে ক্লিক করুন অথবা টেনে এনে ছেড়ে দিন (Drag & Drop)
              </p>
              <p className="text-[11px] font-bn text-stone-500">
                একসাথে একাধিক ছবি সিলেক্ট করা যাবে (JPG, PNG, WebP — সর্বোচ্চ ১৫ মেগাবাইট)
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bn text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                ফোল্ডার: Dream Home Decor Products
              </span>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Secondary: Manual URL input (collapsible) */}
      {showManualUrl && (
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2 transition-all">
          <label className="block text-xs font-bn font-semibold text-stone-700">
            ম্যানুয়াল ইমেজ লিঙ্ক (ImageKit অথবা সরাসরি ছবির URL)
          </label>
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
                placeholder="https://ik.imagekit.io/... অথবা https://drive.google.com/..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />
              <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </div>

            <button
              type="button"
              onClick={handleAddUrl}
              className="bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-4 py-2 rounded-xl text-xs font-bn font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>লিঙ্ক যোগ করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic List with Instant Thumbnail Previews */}
      {images.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 space-y-1">
          <ImageIcon className="w-7 h-7 mx-auto text-stone-300" />
          <p className="text-xs font-bn">
            এখনও কোনো ছবি যোগ করা হয়নি। উপরের বক্সে ক্লিক করে ছবি আপলোড করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {images.map((url, index) => {
            const isPrimary = index === 0;
            const isBroken = !!brokenUrls[url];
            const isDrive = isGoogleDriveUrl(url);

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

                    {isDrive && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bn font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5" />
                        গুগল ড্রাইভ
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
                      className="text-stone-500 hover:text-[#8B5A2B] p-1.5 rounded-lg hover:bg-stone-100 text-xs font-bn font-semibold flex items-center gap-1 cursor-pointer"
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
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 hover:bg-stone-100 rounded-lg cursor-pointer"
                    title="উপরে নিন"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 hover:bg-stone-100 rounded-lg cursor-pointer"
                    title="নিচে নিন"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
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
