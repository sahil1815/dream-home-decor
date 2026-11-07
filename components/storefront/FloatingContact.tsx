'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { SiteSettings } from '@/types/database';
import { buildWhatsAppUrl } from '@/lib/utils';

interface FloatingContactProps {
  settings: SiteSettings;
}

export function FloatingContact({ settings }: FloatingContactProps) {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isOpenHours, setIsOpenHours] = useState(true);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    const bdtTimer = setTimeout(() => {
      try {
        const now = new Date();
        const bdtTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
        const hours = bdtTime.getHours();
        setIsOpenHours(hours >= 10 && hours < 20);
      } catch {
        setIsOpenHours(true);
      }

      if (typeof window !== 'undefined') {
        setPageUrl(window.location.href);
      }
    }, 0);

    // Show a polite, brief tooltip after 3 seconds on initial visit, auto-dismiss after 10 seconds
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 10000);

    return () => {
      clearTimeout(bdtTimer);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname]);

  // Hide on admin routes or checkout
  if (pathname?.startsWith('/admin') || pathname === '/checkout') {
    return null;
  }

  const cleanNumber = (settings.whatsapp_number || '8801725357873').replace(/[^0-9]/g, '');

  // Dynamic pre-filled message
  let message = 'আসসালামু আলাইকুম, ড্রিম হোম ডেকোর ফার্নিচার সম্পর্কে জানতে চাচ্ছিলাম।';
  if (pathname?.startsWith('/products/') && pathname !== '/products') {
    message = `আসসালামু আলাইকুম, ড্রিম হোম ডেকোর। আমি এই পণ্যটি সম্পর্কে তথ্য ও ডেলিভারি জানতে চাই:\n${pageUrl || pathname}`;
  } else if (pathname === '/custom-furniture') {
    message = 'আসসালামু আলাইকুম, আমি কাস্টম সাইজের ফার্নিচার অর্ডার করতে আগ্রহী।';
  }

  const whatsappUrl = buildWhatsAppUrl(cleanNumber, message);

  // Determine bottom positioning:
  // On mobile product detail pages, there's a sticky bar at bottom-0, so we lift the button to bottom-20
  const isProductDetail = pathname?.startsWith('/products/') && pathname !== '/products';
  const bottomClasses = isProductDetail
    ? 'bottom-22 lg:bottom-6 right-4 sm:right-6'
    : 'bottom-20 lg:bottom-6 right-4 sm:right-6';

  return (
    <aside
      aria-label="সরাসরি হোয়াটসঅ্যাপ যোগাযোগ"
      className={`fixed ${bottomClasses} z-40 flex flex-col items-end gap-2 pointer-events-auto`}
    >
      {/* Tooltip bubble */}
      {showTooltip && (
        <div
          role="status"
          className="flex items-center gap-2 bg-[#2B1D14] text-white py-2 px-3.5 rounded-2xl shadow-xl border border-stone-700/50 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-xs"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {isOpenHours && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOpenHours ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </span>

          <p className="text-[11px] sm:text-xs font-bn text-stone-200 leading-snug">
            {isOpenHours
              ? 'সরাসরি কারিগরের সাথে কথা বলুন (অনলাইন)'
              : 'মেসেজ পাঠান • সকাল ১০টায় উত্তর পাবেন'}
          </p>

          <button
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-white p-0.5 cursor-pointer ml-1"
            aria-label="বার্তা বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp-এ সরাসরি কথা বলুন"
        className="group relative flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>

        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-[#25D366]" />

        <span className="hidden sm:inline font-bn font-semibold text-xs sm:text-sm tracking-wide">
          WhatsApp
        </span>
      </a>
    </aside>
  );
}
