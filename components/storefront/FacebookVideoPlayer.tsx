'use client';

import React from 'react';
import { ExternalLink, Video, AlertCircle } from 'lucide-react';
import { getFacebookVideoEmbedData } from '@/lib/facebook-video';

interface FacebookVideoPlayerProps {
  url: string;
  title?: string;
  compact?: boolean;
  className?: string;
}

export function FacebookVideoPlayer({
  url,
  title = 'পণ্যের বাস্তব ভিডিও',
  compact = false,
  className = '',
}: FacebookVideoPlayerProps) {
  const parsed = getFacebookVideoEmbedData(url);

  if (!parsed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 p-6 bg-stone-900 text-stone-300 rounded-2xl text-center ${className}`}
      >
        <AlertCircle className="w-6 h-6 text-amber-400" />
        <p className="text-xs font-bn">ভিডিও লিঙ্কটি সঠিক ফরম্যাটে নেই।</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#1C1612] rounded-2xl overflow-hidden ${className}`}>
      <div
        className={`relative w-full flex items-center justify-center bg-[#140F0C] ${
          compact ? 'p-2' : 'flex-1 p-2 sm:p-3'
        }`}
      >
        <div
          className={
            parsed.isReel
              ? `relative w-full ${compact ? 'max-w-[240px]' : 'max-w-[330px]'} aspect-9/16 rounded-xl overflow-hidden bg-black shadow-lg`
              : 'relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg'
          }
        >
          <iframe
            key={parsed.embedUrl}
            src={parsed.embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      {/* Helpful fallback bar if browser privacy/adblocker blocks third-party Facebook iframe */}
      <div className="px-3.5 py-2.5 bg-[#2B1D14] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bn text-[#FAF3E8]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Video className="w-3.5 h-3.5 text-[#B08D57] shrink-0" />
          <span className="truncate">
            {parsed.isReel ? 'ফেসবুক রিল • বাস্তব প্রদর্শনী' : 'ফেসবুক ভিডিও • বাস্তব প্রদর্শনী'}
          </span>
        </div>

        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-amber-200 hover:text-white font-semibold underline underline-offset-2 shrink-0"
        >
          <span>ভিডিও লোড না হলে ফেসবুকে দেখুন</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
