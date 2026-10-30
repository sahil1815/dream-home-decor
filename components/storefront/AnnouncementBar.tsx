import React from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { SiteSettings } from '@/types/database';

interface AnnouncementBarProps {
  settings: SiteSettings;
}

export function AnnouncementBar({ settings }: AnnouncementBarProps) {
  return (
    <aside aria-label="Announcement" className="bg-[#1C1917] text-[#FAF8F5] text-xs font-medium py-1.5 sm:py-2 px-3 sm:px-4 border-b border-stone-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-center sm:text-left">
        {/* Left: Highlight message */}
        <div className="flex items-center justify-center sm:justify-start gap-2 max-w-full min-w-0">
          <span className="inline-flex items-center justify-center bg-[#8B5A2B] text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
            কারখানা রেট
          </span>
          <p className="truncate font-bn text-stone-200 text-xs">
            {settings.announcement_text ||
              '🎉 নিজস্ব কারখানায় তৈরি সেরা ফার্নিচার! সারাদেশে ক্যাশ অন ডেলিভারি।'}
          </p>
        </div>

        {/* Right: Direct Hotline & WhatsApp CTA */}
        <div className="flex items-center justify-center sm:justify-end flex-wrap gap-2.5 sm:gap-4 text-[11px] sm:text-xs shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-stone-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bn">১০০% গ্যারান্টিযুক্ত কোয়ালিটি</span>
          </div>

          <a
            href={`tel:${settings.phone}`}
            className="flex items-center gap-1 text-stone-200 hover:text-white transition-colors shrink-0"
          >
            <Phone className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-sans font-semibold tracking-wide">{settings.phone}</span>
          </a>

          <a
            href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('হ্যালো ড্রিম হোম ডেকোর, আমি ফার্নিচার সম্পর্কে জানতে চাই।')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-[#16A34A] hover:bg-emerald-600 text-white px-2.5 py-0.5 rounded-full transition-colors text-[10px] sm:text-[11px] font-medium shrink-0"
          >
            <MessageCircle className="w-3 h-3 shrink-0" />
            <span>WhatsApp অর্ডার</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
