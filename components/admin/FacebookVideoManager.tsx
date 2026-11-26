'use client';

import React, { useState } from 'react';
import {
  Video,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Info,
} from 'lucide-react';
import { parseFacebookVideoInput } from '@/lib/facebook-video';
import { resolveFacebookVideoUrlAction } from '@/lib/actions';
import { FacebookVideoPlayer } from '@/components/storefront/FacebookVideoPlayer';

interface FacebookVideoManagerProps {
  videoUrls: string[];
  onChange: (urls: string[]) => void;
}

export function FacebookVideoManager({
  videoUrls,
  onChange,
}: FacebookVideoManagerProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleAddVideo = async () => {
    setError(null);
    setWarning(null);

    const parsed = parseFacebookVideoInput(inputUrl);
    if (!parsed.valid) {
      setError(parsed.error);
      return;
    }

    if (videoUrls.includes(parsed.url)) {
      setError('এই ফেসবুক ভিডিও লিঙ্কটি ইতোমধ্যে যোগ করা হয়েছে।');
      return;
    }

    setIsAdding(true);
    try {
      let finalUrl = parsed.url;

      if (parsed.isShortLink) {
        const resolved = await resolveFacebookVideoUrlAction(parsed.url);
        if (!resolved.success) {
          setError(resolved.error || 'লিঙ্ক যাচাই করা যায়নি');
          return;
        }
        if (resolved.url) {
          finalUrl = resolved.url;
        }
        if (resolved.warning) {
          setWarning(resolved.warning);
        }
      }

      if (videoUrls.includes(finalUrl)) {
        setError('এই ফেসবুক ভিডিও লিঙ্কটি ইতোমধ্যে যোগ করা হয়েছে।');
        return;
      }

      const nextList = [...videoUrls, finalUrl];
      onChange(nextList);
      setInputUrl('');
      setPreviewIndex(nextList.length - 1);
    } catch {
      setError('নেটওয়ার্ক ত্রুটি, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = (index: number) => {
    const updated = videoUrls.filter((_, i) => i !== index);
    onChange(updated);
    if (previewIndex === index) {
      setPreviewIndex(null);
    } else if (previewIndex !== null && previewIndex > index) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videoUrls.length) return;

    const copy = [...videoUrls];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);

    if (previewIndex === index) {
      setPreviewIndex(targetIndex);
    } else if (previewIndex === targetIndex) {
      setPreviewIndex(index);
    }
  };

  return (
    <div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bn font-bold text-stone-900">
              প্রোডাক্ট বাস্তব ভিডিও (Facebook Page Video / Reel)
            </label>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bn font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Video className="w-3 h-3" />
              ফেসবুক শেয়ার লিঙ্ক
            </span>
          </div>
          <p className="text-[11px] font-bn text-stone-500 mt-0.5">
            আগে আপনার ফেসবুক পেজে ভিডিওটি <strong>Public</strong> হিসেবে আপলোড করুন, তারপর ভিডিওর লিঙ্ক কপি করে এখানে পেস্ট করুন। গ্রাহক ওয়েবসাইটেই ভিডিও দেখতে পারবেন।
          </p>
        </div>

        {videoUrls.length > 0 && (
          <span className="text-xs font-bn font-semibold text-stone-600 bg-stone-200/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
            মোট ভিডিও: {videoUrls.length}
          </span>
        )}
      </div>

      {/* Input Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleAddVideo();
              }
            }}
            placeholder="https://www.facebook.com/.../videos/... অথবা https://www.facebook.com/reel/..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
          />
          <Video className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
        </div>

        <button
          type="button"
          onClick={() => void handleAddVideo()}
          disabled={isAdding || !inputUrl.trim()}
          className="bg-[#8B5A2B] hover:bg-[#6D431F] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bn font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          {isAdding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>যাচাই হচ্ছে...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>ভিডিও যোগ করুন</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warning && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-bn">
          <Info className="w-4 h-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {/* Video List */}
      {videoUrls.length === 0 ? (
        <div className="p-5 text-center bg-white rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 space-y-1">
          <Video className="w-6 h-6 mx-auto text-stone-300" />
          <p className="text-xs font-bn">
            এখনও কোনো ভিডিও লিঙ্ক যোগ করা হয়নি (ঐচ্ছিক)। বাস্তব সাইজ দেখাতে ফেসবুক ভিডিও যোগ করতে পারেন।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {videoUrls.map((url, index) => {
            const parsed = parseFacebookVideoInput(url);
            const isReel = parsed.valid && parsed.isReel;
            const isPreviewOpen = previewIndex === index;

            return (
              <div
                key={`${url}-${index}`}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
              >
                <div className="p-3 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-[#8B5A2B] text-white text-[10px] font-bn font-bold px-2 py-0.5 rounded-full">
                        ভিডিও #{index + 1}
                      </span>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-sans font-bold px-2 py-0.5 rounded">
                        {isReel ? 'Facebook Reel (9:16)' : 'Facebook Video (16:9)'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-stone-600 truncate mt-1">
                      {url}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(isPreviewOpen ? null : index)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-[11px] font-bn font-semibold flex items-center gap-1 cursor-pointer"
                      title={isPreviewOpen ? 'প্রিভিউ বন্ধ করুন' : 'ভিডিও প্রিভিউ দেখুন'}
                    >
                      {isPreviewOpen ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">লুকান</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">প্রিভিউ</span>
                        </>
                      )}
                    </button>

                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="ফেসবুকে খুলুন"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

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
                      disabled={index === videoUrls.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 hover:bg-stone-100 rounded-lg cursor-pointer"
                      title="নিচে নিন"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isPreviewOpen && (
                  <div className="p-3 pt-0 border-t border-stone-100 bg-stone-50/70">
                    <FacebookVideoPlayer
                      url={url}
                      title={`Admin preview video ${index + 1}`}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
