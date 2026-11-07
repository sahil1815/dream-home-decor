'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FolderUp,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
  Sparkles,
  Camera,
  Layers,
  Info,
  Check,
} from 'lucide-react';
import { Product, SiteSettings } from '@/types/database';
import {
  scanGoogleDriveFolderAction,
  importGoogleDriveImagesAction,
} from '@/lib/actions';
import {
  convertDriveViewToDirectLinks,
  SITE_MEDIA_SLOTS,
  DriveScannedItem,
} from '@/lib/google-drive';

interface MediaManagerProps {
  products: Product[];
  settings: SiteSettings;
}

export function MediaManager({ products, settings }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'drive' | 'converter'>('drive');

  // Drive Import State
  const [driveUrl, setDriveUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<DriveScannedItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    errors?: string[];
  } | null>(null);

  // Link Converter State
  const [converterInput, setConverterInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleScanDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    setIsScanning(true);
    setScanError(null);
    setImportResult(null);

    try {
      const res = await scanGoogleDriveFolderAction(driveUrl.trim());
      if (res.success && res.items.length > 0) {
        setScannedItems(res.items);
      } else {
        setScanError(
          res.error ||
            'ফোল্ডারে কোনো ইমেজ ফাইল পাওয়া যায়নি। ফোল্ডারটি "Anyone with the link: Viewer" পারমিশনে শেয়ার করা আছে কিনা নিশ্চিত করুন।'
        );
        setScannedItems([]);
      }
    } catch {
      setScanError('ড্রাইভ স্ক্যান করতে নেটওয়ার্ক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateItemTarget = (index: number, newTargetVal: string) => {
    const updated = [...scannedItems];
    const item = updated[index];

    if (newTargetVal.startsWith('prod:')) {
      const slug = newTargetVal.replace('prod:', '');
      const prod = products.find((p) => p.slug === slug);
      item.target = {
        type: 'product',
        slug,
        productId: prod?.id,
        productTitleBn: prod?.title_bn || prod?.title,
        sortOrder: 1,
      };
    } else if (newTargetVal.startsWith('site:')) {
      const slot = newTargetVal.replace('site:', '');
      const s = SITE_MEDIA_SLOTS.find((x) => x.slot === slot);
      item.target = {
        type: 'site',
        slot,
        slotLabelBn: s?.labelBn || slot,
      };
    } else {
      item.target = {
        type: 'unknown',
        suggestedName: item.fileName,
      };
    }

    setScannedItems(updated);
  };

  const handleImportScannedItems = async () => {
    if (scannedItems.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await importGoogleDriveImagesAction(scannedItems);
      if (res.success) {
        setImportResult({
          success: true,
          message: res.message || 'ছবি সফলভাবে ইম্পোর্ট সম্পন্ন হয়েছে!',
          errors: res.errors,
        });
        setScannedItems([]);
      } else {
        setImportResult({
          success: false,
          message: res.error || 'ইম্পোর্ট প্রক্রিয়া ব্যর্থ হয়েছে',
        });
      }
    } catch {
      setImportResult({
        success: false,
        message: 'ইম্পোর্ট করার সময় নেটওয়ার্ক ত্রুটি ঘটেছে',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Converted link info for Tab 3
  const convertedLinks = converterInput.trim()
    ? convertDriveViewToDirectLinks(converterInput.trim())
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bn font-bold text-stone-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#8B5A2B]" />
            <span>মিডিয়া পাইপলাইন ও গুগল ড্রাইভ ইম্পোর্ট</span>
          </h1>
          <p className="text-xs sm:text-sm font-bn text-stone-600 mt-0.5">
            কারখানার বাস্তব ছবির ইন্টিগ্রেশন, গুগল ড্রাইভ পাবলিক ফোল্ডার অটো-সিঙ্ক ও নমুনা ছবি ম্যানেজমেন্ট
          </p>
        </div>

        {/* Global Tag Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bn text-amber-900 self-start sm:self-auto">
          <Camera className="w-4 h-4 text-amber-700" />
          <span>
            নমুনা ছবি ট্যাগ:{' '}
            <strong>{settings.show_placeholder_tag !== false ? 'চালু (Active)' : 'বন্ধ (Hidden)'}</strong>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto gap-2 text-xs sm:text-sm font-bn font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'drive'
              ? 'border-[#8B5A2B] text-[#8B5A2B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FolderUp className="w-4 h-4" />
          <span>১. গুগল ড্রাইভ ফোল্ডার ইম্পোর্ট</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'library'
              ? 'border-[#8B5A2B] text-[#8B5A2B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>২. বর্তমান মিডিয়া লাইব্রেরি ও স্লট</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('converter')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'converter'
              ? 'border-[#8B5A2B] text-[#8B5A2B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>৩. ড্রাইভ লিঙ্ক কনভার্টার টুল</span>
        </button>
      </div>

      {/* Tab 1: Google Drive Import */}
      {activeTab === 'drive' && (
        <div className="space-y-6">
          {/* Expected Folder Convention Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold font-bn text-sm">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>গুগল ড্রাইভে ছবির ফোল্ডার সাজানোর নিয়ম (Folder Convention):</span>
            </div>
            <p className="text-xs font-bn text-amber-950 leading-relaxed">
              আপনার ড্রাইভের ফোল্ডারের শেয়ারিং পারমিশন <strong>&quot;Anyone with the link: Viewer&quot;</strong> রাখুন। নিচের মতো করে ফোল্ডারের নাম দিলে সিস্টেম স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট পণ্যের সাথে ছবি সংযুক্ত করবে:
            </p>
            <pre className="p-3 bg-stone-900 text-amber-200 text-xs rounded-xl font-mono overflow-x-auto leading-relaxed">
{`Dream Home Decor Photos/
  ├── products/
  │   ├── smart-ergonomic-reading-table/     -> 01.jpg, 02.jpg (01 = মূল কাভার ছবি)
  │   ├── compact-student-study-table/       -> 01.jpg, 02.jpg
  │   ├── executive-workstation-computer-desk/
  │   ├── modern-multi-tier-bookshelf/
  │   ├── floating-geometric-wall-shelf-set/
  │   └── contemporary-full-length-dressing-table/
  ├── hero/                                  -> banner.jpg (হোমপেজ হিরো কাভার ব্যানার)
  └── workshop/                              -> 1-cutting.jpg, 2-edgebanding.jpg, 3-fitting.jpg, 4-packaging.jpg`}
            </pre>
            <p className="text-[11px] font-bn text-amber-800">
              * নোট: ড্রাইভ থেকে কোনো পণ্যের আসল ছবি ইম্পোর্ট হওয়ামাত্র স্বয়ংক্রিয়ভাবে তার &quot;নমুনা ছবি&quot; ট্যাগ মুছে যাবে এবং আসল ছবি শোকেস হবে। ড্রাইভের কোনো ফাইল কখনোই ডিলিট করা হবে না।
            </p>
          </div>

          {/* Drive Link Input Form */}
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <form onSubmit={handleScanDrive} className="space-y-3">
              <label className="block text-xs font-bn font-bold text-stone-800">
                গুগল ড্রাইভ পাবলিক ফোল্ডার লিঙ্ক অথবা ফাইল শেয়ার লিঙ্ক:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1abc9876XYZ... অথবা https://drive.google.com/file/d/..."
                  className="flex-1 px-4 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
                />
                <button
                  type="submit"
                  disabled={isScanning || !driveUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#8B5A2B] hover:bg-[#6F441F] disabled:opacity-50 text-white text-xs font-bn font-bold rounded-xl shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>স্ক্যান হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <FolderUp className="w-4 h-4" />
                      <span>ফোল্ডার স্ক্যান করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {scanError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bn flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">স্ক্যান ব্যর্থ হয়েছে</p>
                  <p className="text-rose-700 mt-0.5">{scanError}</p>
                </div>
              </div>
            )}

            {/* Import Feedback Message */}
            {importResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-bn flex items-start gap-2.5 ${
                  importResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {importResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">{importResult.message}</p>
                  {importResult.errors && (
                    <ul className="list-disc list-inside text-rose-700 text-[11px]">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scanned Items Preview Table */}
          {scannedItems.length > 0 && (
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-sm font-bn font-bold text-stone-900">
                    স্ক্যানকৃত ফাইলের তালিকা ({scannedItems.length}টি ইমেজ সনাক্ত হয়েছে)
                  </h3>
                  <p className="text-xs font-bn text-stone-500">
                    নিচের ড্রপডাউন থেকে প্রয়োজনে টার্গেট প্রোডাক্ট বা সাইট স্লট পরিবর্তন করতে পারেন:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleImportScannedItems}
                  disabled={isImporting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bn font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ডাটাবেজে যুক্ত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>সবগুলো ছবি ইম্পোর্ট করুন</span>
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-700 font-bn font-bold">
                      <th className="py-2.5 px-3">প্রিভিউ</th>
                      <th className="py-2.5 px-3">ফাইলের নাম ও পাথ</th>
                      <th className="py-2.5 px-3">সনাক্তকৃত টার্গেট (Target Mapping)</th>
                      <th className="py-2.5 px-3">সাইজ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {scannedItems.map((item, idx) => {
                      const currentVal =
                        item.target.type === 'product'
                          ? `prod:${item.target.slug}`
                          : item.target.type === 'site'
                          ? `site:${item.target.slot}`
                          : 'unknown';

                      return (
                        <tr key={item.fileId} className="hover:bg-stone-50/70">
                          <td className="py-2 px-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                              {item.thumbnailUrl ? (
                                <Image
                                  src={item.thumbnailUrl}
                                  alt={item.fileName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-stone-700">
                            <p className="font-bold text-stone-900">{item.fileName}</p>
                            <p className="text-stone-400">{item.filePath}</p>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={currentVal}
                              onChange={(e) => handleUpdateItemTarget(idx, e.target.value)}
                              className="px-2.5 py-1.5 bg-[#FAF8F5] border border-stone-300 rounded-lg text-xs font-bn text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-[#8B5A2B]"
                            >
                              <optgroup label="পণ্যসমূহ (Products):">
                                {products.map((p) => (
                                  <option key={p.id} value={`prod:${p.slug}`}>
                                    পণ্য: {p.title_bn || p.title} ({p.slug})
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="সাইট স্লটসমূহ (Site Media Slots):">
                                {SITE_MEDIA_SLOTS.map((s) => (
                                  <option key={s.slot} value={`site:${s.slot}`}>
                                    স্লট: {s.labelBn}
                                  </option>
                                ))}
                              </optgroup>
                              <option value="unknown">অনির্ধারিত (Unmapped Slot)</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-stone-500 font-sans text-[11px]">
                            {item.sizeBytes > 0
                              ? `${(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                              : 'Unknown'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Current Media Library & Slots */}
      {activeTab === 'library' && (
        <div className="space-y-8">
          {/* Section A: Site Media Slots */}
          <div className="space-y-4">
            <h2 className="text-base font-bn font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8B5A2B]" />
              <span>হোমপেজ ও সাইট মিডিয়া স্লটসমূহ (Site Slots)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SITE_MEDIA_SLOTS.map((slot) => {
                const currentImg =
                  slot.slot === 'hero'
                    ? settings.cover_banner_url || '/placeholders/site/hero.jpg'
                    : `/placeholders/site/${slot.slot}.jpg`;

                return (
                  <div
                    key={slot.slot}
                    className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bn font-bold text-stone-800 mb-2">
                        <span>{slot.labelBn}</span>
                        <span className="font-mono text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                          {slot.slot}
                        </span>
                      </div>
                      <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                        <Image
                          src={currentImg}
                          alt={slot.labelBn}
                          fill
                          className="object-cover"
                          unoptimized={currentImg.startsWith('http')}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bn">
                      <span className="text-stone-500 truncate max-w-[180px] font-mono">
                        {currentImg}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentImg, slot.slot)}
                        className="text-[#8B5A2B] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        {copiedKey === slot.slot ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>কপি URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Product Catalog Media */}
          <div className="space-y-4">
            <h2 className="text-base font-bn font-bold text-stone-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-700" />
              <span>পণ্য ক্যাটালগ ফটো স্ট্যাটাস ({products.length}টি পণ্য)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const primary = product.images?.[0] || '/placeholders/products/smart-ergonomic-reading-table/01.jpg';
                const isPlaceholder = Boolean(
                  product.has_placeholder_images ||
                  primary.startsWith('/placeholders/')
                );

                return (
                  <div
                    key={product.id}
                    className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bn font-bold text-xs text-stone-900">
                          {product.title_bn || product.title}
                        </h4>
                        <p className="font-mono text-[10px] text-stone-400">{product.slug}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bn font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isPlaceholder
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {isPlaceholder ? 'নমুনা ছবি (Placeholder)' : 'আসল ছবি (Real)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(product.images && product.images.length > 0 ? product.images : [primary]).map(
                        (img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200"
                          >
                            <Image
                              src={img}
                              alt={`${product.title} - ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized={img.startsWith('http')}
                            />
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Drive Link Converter & Diagnostics Tool */}
      {activeTab === 'converter' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bn font-bold text-stone-900 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#8B5A2B]" />
                <span>গুগল ড্রাইভ লিঙ্ক কনভার্টার টুল (Drive View to Direct Link)</span>
              </h2>
              <p className="text-xs font-bn text-stone-600 mt-1">
                যেকোনো Google Drive শেয়ারকৃত লিঙ্ক পেস্ট করুন। এটি স্বয়ংক্রিয়ভাবে সরাসরি ডাউনলোড ও হাই-রেজোলিউশন থাম্বনেইল লিঙ্কে রূপান্তর করবে।
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bn font-bold text-stone-700">
                ড্রাইভের শেয়ার লিঙ্ক পেস্ট করুন:
              </label>
              <input
                type="text"
                value={converterInput}
                onChange={(e) => setConverterInput(e.target.value)}
                placeholder="https://drive.google.com/file/d/1XyZ_Abc123/view?usp=sharing"
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />
            </div>

            {/* Explanation box */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-950 text-xs font-bn leading-relaxed">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">কেন ড্রাইভের &quot;/view&quot; লিঙ্ক সরাসরি ছবিতে কাজ করে না?</p>
                <p className="text-amber-900 mt-1">
                  গুগল ড্রাইভের <code>/file/d/ID/view</code> লিঙ্কটি একটি পূর্ণাঙ্গ ওয়েব পেজ (HTML) রিটার্ন করে, যাতে গুগল ড্রাইভের নিজস্ব ইউজার ইন্টারফেস ও টুলবার থাকে। এটি কোনো ইমেজ বাইনারি ডেটা নয়। তাই ব্রাউজারে <code>&lt;img&gt;</code> ট্যাগে এটি দিলে ছবি ব্রোকেন দেখায়। ইমেজ হিসেবে দেখাতে সরাসরি ডাউনলোড লিঙ্ক (<code>uc?export=download</code>) অথবা গুগল থাম্বনেইল API ব্যবহার করা আবশ্যক।
                </p>
              </div>
            </div>

            {/* Converted Output Display */}
            {convertedLinks && (
              <div className="space-y-4 pt-3 border-t border-stone-200">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bn font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>কনভার্ট সম্পন্ন হয়েছে! সরাসরি ব্যবহারযোগ্য লিঙ্কসমূহ:</span>
                  </div>

                  {/* Thumbnail Link */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bn text-emerald-900 font-bold">
                      ১. হাই-রেজ থাম্বনেইল লিঙ্ক (ওয়েবসাইটে ব্যবহারের জন্য সেরা):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={convertedLinks.thumbnailUrl}
                        className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-[11px] font-mono text-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(convertedLinks.thumbnailUrl, 'thumb')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bn font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'thumb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'thumb' ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Download Link */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bn text-emerald-900 font-bold">
                      ২. সরাসরি ডাউনলোড লিঙ্ক (Direct Download URL):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={convertedLinks.directDownloadUrl}
                        className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-[11px] font-mono text-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(convertedLinks.directDownloadUrl, 'direct')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bn font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'direct' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'direct' ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Image Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-bn font-bold text-stone-800">
                    ছবিটির লাইভ প্রিভিউ (সরাসরি কনভার্ট করা লিঙ্ক থেকে লোড হচ্ছে):
                  </p>
                  <div className="relative aspect-16/9 max-w-sm rounded-2xl overflow-hidden bg-stone-100 border border-stone-300">
                    <Image
                      src={convertedLinks.thumbnailUrl}
                      alt="Drive Image Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
