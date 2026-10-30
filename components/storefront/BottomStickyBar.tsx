'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Grid3X3,
  Heart,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { SiteSettings } from '@/types/database';
import { buildWhatsAppUrl } from '@/lib/utils';

interface BottomStickyBarProps {
  settings: SiteSettings;
}

export function BottomStickyBar({ settings }: BottomStickyBarProps) {
  const pathname = usePathname();
  const { totalItems, openCart, isCartOpen } = useCart();
  const { totalSaved } = useWishlist();

  // Do not render on admin dashboard pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const cleanNumber = (settings.whatsapp_number || '8801700000000').replace(/[^0-9]/g, '');
  const whatsappUrl = buildWhatsAppUrl(
    cleanNumber,
    'আসসালামু আলাইকুম, আমি ড্রিম হোম ডেকোর ফার্নিচার সম্পর্কে জানতে চাই।'
  );

  const isHomeActive = pathname === '/';
  const isExploreActive = pathname.startsWith('/products');
  const isSavedActive = pathname.startsWith('/saved');
  const isBagActive = isCartOpen || pathname === '/checkout';

  return (
    <nav
      aria-label="মোবাইল নেভিগেশন (Mobile Bottom Navigation)"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#FAF8F5]/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 items-center h-15 sm:h-16 max-w-lg mx-auto px-1">
        {/* 1. HOME */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors group ${
            isHomeActive
              ? 'text-[#8B5A2B]'
              : 'text-stone-800 hover:text-stone-950'
          }`}
          aria-label="হোম পেইজ"
        >
          <Home
            className={`w-5 h-5 transition-transform group-active:scale-90 ${
              isHomeActive ? 'stroke-[2.2]' : 'stroke-[1.75]'
            }`}
          />
          <span
            className={`text-[9.5px] sm:text-[10px] tracking-wider uppercase font-sans leading-none ${
              isHomeActive ? 'font-bold' : 'font-semibold'
            }`}
          >
            HOME
          </span>
        </Link>

        {/* 2. EXPLORE ALL */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors group ${
            isExploreActive
              ? 'text-[#8B5A2B]'
              : 'text-stone-800 hover:text-stone-950'
          }`}
          aria-label="সকল পণ্য কালেকশন"
        >
          <Grid3X3
            className={`w-5 h-5 transition-transform group-active:scale-90 ${
              isExploreActive ? 'stroke-[2.2]' : 'stroke-[1.75]'
            }`}
          />
          <span
            className={`text-[9.5px] sm:text-[10px] tracking-wider uppercase font-sans leading-none whitespace-nowrap ${
              isExploreActive ? 'font-bold' : 'font-semibold'
            }`}
          >
            EXPLORE ALL
          </span>
        </Link>

        {/* 3. SAVED */}
        <Link
          href="/saved"
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors group ${
            isSavedActive
              ? 'text-[#8B5A2B]'
              : 'text-stone-800 hover:text-stone-950'
          }`}
          aria-label={`সেভ করা তালিকা (${totalSaved} টি পণ্য)`}
        >
          <div className="relative flex items-center justify-center">
            <Heart
              className={`w-5 h-5 transition-transform group-active:scale-90 ${
                isSavedActive
                  ? 'fill-[#8B5A2B] stroke-[#8B5A2B]'
                  : 'stroke-[1.75]'
              }`}
            />
            {totalSaved > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-[#FAF8F5] animate-in zoom-in-50 duration-150">
                {totalSaved}
              </span>
            )}
          </div>
          <span
            className={`text-[9.5px] sm:text-[10px] tracking-wider uppercase font-sans leading-none whitespace-nowrap ${
              isSavedActive ? 'font-bold' : 'font-semibold'
            }`}
          >
            SAVED
          </span>
        </Link>

        {/* 4. WHATSAPP */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-1 text-stone-800 hover:text-stone-950 transition-colors group"
          aria-label="হোয়াটসঅ্যাপে সরাসরি মেসেজ দিন"
        >
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#25D366] stroke-[1.8] transition-transform group-active:scale-90" />
            {/* Green accent badge dot matching reference image */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#25D366] ring-1.5 ring-[#FAF8F5]" />
          </div>
          <span className="text-[9.5px] sm:text-[10px] tracking-wider uppercase font-sans leading-none font-semibold">
            WHATSAPP
          </span>
        </a>

        {/* 5. BAG */}
        <button
          type="button"
          onClick={openCart}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer group ${
            isBagActive
              ? 'text-[#8B5A2B]'
              : 'text-stone-800 hover:text-stone-950'
          }`}
          aria-label={`শপিং ব্যাগ (${totalItems} টি পণ্য)`}
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag
              className={`w-5 h-5 transition-transform group-active:scale-90 ${
                isBagActive ? 'stroke-[2.2]' : 'stroke-[1.75]'
              }`}
            />
            {totalItems > 0 ? (
              <span className="absolute -top-1.5 -right-2 bg-[#8B5A2B] text-white text-[10px] font-bold min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-[#FAF8F5] animate-in zoom-in-50 duration-150">
                {totalItems}
              </span>
            ) : (
              /* Amber/tan indicator dot matching reference image */
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#C4A47C] ring-1.5 ring-[#FAF8F5]" />
            )}
          </div>
          <span
            className={`text-[9.5px] sm:text-[10px] tracking-wider uppercase font-sans leading-none ${
              isBagActive ? 'font-bold' : 'font-semibold'
            }`}
          >
            BAG
          </span>
        </button>
      </div>
    </nav>
  );
}
