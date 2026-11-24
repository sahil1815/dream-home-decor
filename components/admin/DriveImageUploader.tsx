'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Loader2,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { getOptimizedImageUrl, isImageKitUrl } from '@/lib/imagekit';

interface DriveImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  helperText?: string;
  aspectRatio?: 'square' | 'banner' | 'auto';
  placeholder?: string;
  previewLabel?: string;
  defaultFallbackText?: string;
}

export function DriveImageUploader({
  value,
  onChange,
  label,
  helperText,
  aspectRatio = 'auto',
  placeholder = 'https://...',
  previewLabel,
  defaultFallbackText,
}: DriveImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState(value);
  const [isBroken, setIsBroken] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      setUploadError('শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP) গ্রহণযোগ্য।');
      return;
    }

    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('ফাইলের সাইজ ১৫ মেগাবাইট (15MB)-এর বেশি হতে পারবে না।');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/drive-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
        setInputUrl(data.url);
        setIsBroken(false);
      } else {
        setUploadError(data.error || 'গুগল ড্রাইভে আপলোড ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setUploadError('নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error('Drive single image upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleApplyManualUrl = () => {
    const trimmed = inputUrl.trim();
    onChange(trimmed);
    setIsBroken(false);
  };

  const handleClear = () => {
    onChange('');
    setInputUrl('');
    setIsBroken(false);
  };

  const isDriveUrl = value.includes('drive.google.com') || value.includes('googleusercontent.com');

  return (
    <div className="space-y-3">
      {/* Label and Actions Header */}
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bn font-bold text-stone-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] font-bn text-[#8B5A2B] hover:text-[#6D431F] font-semibold underline flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showManualUrl ? 'লিঙ্ক লুকান' : 'সরাসরি লিঙ্ক পেস্ট'}</span>
        </button>
      </div>

      {helperText && (
        <p className="text-[11px] font-bn text-stone-500 -mt-1">{helperText}</p>
      )}

      {/* Manual URL input toggle */}
      {showManualUrl && (
        <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onBlur={handleApplyManualUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyManualUrl();
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
          />
          <button
            type="button"
            onClick={handleApplyManualUrl}
            className="px-3 py-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] text-white text-xs font-bn font-bold rounded-lg cursor-pointer"
          >
            প্রয়োগ
          </button>
        </div>
      )}

      {/* Current Image View OR Upload Dropzone */}
      {value ? (
        <div className="space-y-2">
          {aspectRatio === 'square' ? (
            /* Square layout for Logo */
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-300 flex items-center justify-center">
                {isBroken ? (
                  <div className="text-center p-1">
                    <AlertCircle className="w-4 h-4 text-rose-500 mx-auto" />
                    <span className="text-[9px] text-rose-500 font-bn block">ভুল ছবি</span>
                  </div>
                ) : (
                  <Image
                    src={getOptimizedImageUrl(value, 200)}
                    alt={label}
                    fill
                    className="object-cover"
                    onError={() => setIsBroken(true)}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-stone-800 font-bn">
                    {previewLabel || 'লাইভ ছবি প্রিভিউ'}
                  </span>
                  {isDriveUrl && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bn font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <HardDrive className="w-2.5 h-2.5" />
                      গুগল ড্রাইভ
                    </span>
                  )}
                  {isImageKitUrl(value) && (
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-sans font-bold px-1.5 py-0.2 rounded border border-blue-200">
                      ImageKit
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-stone-500 truncate mt-0.5">
                  {value}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bn font-semibold flex items-center gap-1 cursor-pointer"
                  title="ছবি পরিবর্তন করুন"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>পরিবর্তন</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Banner layout for Hero Cover Banner */
            <div className="space-y-2">
              <div className="relative aspect-16/7 rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 shadow-2xs group">
                {isBroken ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1 font-bn text-xs">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                    <span>ছবি লোড করা যায়নি</span>
                  </div>
                ) : (
                  <Image
                    src={getOptimizedImageUrl(value, 800)}
                    alt={label}
                    fill
                    className="object-cover"
                    onError={() => setIsBroken(true)}
                  />
                )}

                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <div className="bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bn px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{previewLabel || 'লাইভ ব্যানার প্রিভিউ'}</span>
                  </div>
                  {isDriveUrl && (
                    <span className="bg-emerald-900/80 backdrop-blur-xs text-emerald-200 text-[10px] font-bn px-2 py-0.5 rounded flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      গুগল ড্রাইভ
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black/70 hover:bg-black/90 text-white px-2.5 py-1 rounded-lg text-xs font-bn font-semibold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>পরিবর্তন করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-rose-600/80 hover:bg-rose-700 text-white p-1 rounded-lg shadow-xs cursor-pointer transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Upload Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isDragOver
              ? 'border-[#8B5A2B] bg-amber-50/60 scale-[1.01]'
              : 'border-stone-300 bg-stone-50/60 hover:border-[#8B5A2B]/60 hover:bg-stone-50'
          } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <Loader2 className="w-7 h-7 text-[#8B5A2B] animate-spin" />
              <p className="text-xs font-bn font-bold text-stone-800">
                গুগল ড্রাইভে আপলোড হচ্ছে...
              </p>
              <p className="text-[10px] font-bn text-stone-500">
                অনুগ্রহ করে অপেক্ষা করুন, ছবিটি আপনার ড্রাইভ ফোল্ডারে সেভ হচ্ছে
              </p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8B5A2B] flex items-center justify-center border border-amber-200/50">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bn font-bold text-stone-800">
                  ছবি আপলোড করতে ক্লিক করুন বা ড্র্যাগ করে ছেড়ে দিন
                </p>
                <p className="text-[10px] font-bn text-stone-400">
                  স্বয়ংক্রিয়ভাবে Google Drive ফোল্ডারে সেভ হবে (JPG, PNG, WebP — সর্বোচ্চ ১৫MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(e.target.files);
          }
        }}
      />

      {uploadError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
