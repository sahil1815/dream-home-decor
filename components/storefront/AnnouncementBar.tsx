'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import Link from 'next/link';
import { SiteSettings } from '@/types/database';

interface AnnouncementBarProps {
  settings: SiteSettings;
  announcementContent?: {
    enabled?: boolean;
    text?: string;
    link?: string;
  };
}

export function AnnouncementBar({ settings, announcementContent }: AnnouncementBarProps) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // If explicitly disabled in Site Content Editor, don't show
  if (announcementContent && announcementContent.enabled === false) {
    return null;
  }

  // Use content from Site Content Editor, falling back to Site Settings
  const announcement =
    announcementContent?.text?.trim() || settings.announcement_text?.trim();

  if (pathname?.startsWith('/admin') || dismissed || !announcement) {
    return null;
  }

  const link = announcementContent?.link?.trim();

  return (
    <aside
      aria-label="ঘোষণা"
      className="bg-[#2B1D14] text-[#FAF3E8] text-xs font-bn py-2 px-4 border-b border-[#3E281C] relative select-none transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {link ? (
          <Link
            href={link}
            className="flex-1 text-center text-xs font-medium text-stone-200 hover:text-white truncate transition-colors underline-offset-2 hover:underline"
          >
            {announcement}
          </Link>
        ) : (
          <p className="flex-1 text-center text-xs font-medium text-stone-200 truncate">
            {announcement}
          </p>
        )}

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
