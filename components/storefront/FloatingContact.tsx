'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, Phone, X, Sparkles } from 'lucide-react';
import { SiteSettings } from '@/types/database';
import { buildWhatsAppUrl } from '@/lib/utils';

interface FloatingContactProps {
  settings: SiteSettings;
}

export function FloatingContact({ settings }: FloatingContactProps) {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(true);

  // Hide on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const cleanNumber = (settings.whatsapp_number || '8801712345678').replace(/[^0-9]/g, '');
  const whatsappUrl = buildWhatsAppUrl(
    cleanNumber,
    'আসসালামু আলাইকুম, আমি ড্রিম হোম ডেকোর ফার্নিচার সম্পর্কে জানতে চাই।'
  );

  return (
    <div className="hidden lg:flex fixed bottom-6 right-5 z-40 flex-col items-end gap-3 pointer-events-auto">
      {/* Tooltip bubble */}
      {showTooltip && (
        <div className="flex items-center gap-2 bg-[#1C1917] text-white py-2 px-3.5 rounded-2xl shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs font-bn text-stone-200">
            যেকোনো কাস্টমাইজেশন বা অর্ডার সহযোগিতায় সরাসরি নক দিন!
          </p>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
            aria-label="বার্তা বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-2">
        {/* Call Button */}
        <a
          href={`tel:${settings.phone}`}
          className="w-12 h-12 rounded-full bg-[#1C1917] hover:bg-stone-800 text-amber-400 flex items-center justify-center shadow-lg border border-stone-700 transition-all hover:scale-105"
          aria-label="হটলাইনে কল করুন"
          title={`Call ${settings.phone}`}
        >
          <Phone className="w-5 h-5" />
        </a>

        {/* WhatsApp Button with pulse animation */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-xl transition-all hover:scale-105"
          aria-label="WhatsApp এ মেসেজ দিন"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300" />
          </span>
          <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
          <span className="font-bn font-bold text-sm tracking-wide">
            WhatsApp অর্ডার
          </span>
        </a>
      </div>
    </div>
  );
}
