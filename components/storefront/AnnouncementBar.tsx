'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { SiteSettings } from '@/types/database';

interface AnnouncementBarProps {
  settings: SiteSettings;
}

export function AnnouncementBar({ settings }: AnnouncementBarProps) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Shown only when there is an active announcement text and on storefront pages
  const announcement = settings.announcement_text?.trim();

  if (pathname?.startsWith('/admin') || dismissed || !announcement) {
    return null;
  }

  return (
    <aside
      aria-label="ঘোষণা"
      className="bg-[#2B1D14] text-[#FAF3E8] text-xs font-bn py-2 px-4 border-b border-[#3E281C] relative select-none transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <p className="flex-1 text-center text-xs font-medium text-stone-200 truncate">
          {announcement}
        </p>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="বিজ্ঞপ্তি বন্ধ করুন"
          className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
