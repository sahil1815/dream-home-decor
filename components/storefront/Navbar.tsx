'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  ChevronRight,
  Phone,
  PackageCheck,
  Hammer,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { SiteSettings, Category } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { buildWhatsAppUrl } from '@/lib/utils';

interface NavbarProps {
  settings: SiteSettings;
  categories: Category[];
}

export function Navbar({ settings, categories }: NavbarProps) {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { totalSaved } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);

  // Close 'MORE' dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanNumber = (settings.whatsapp_number || '8801700000000').replace(/[^0-9]/g, '');
  const whatsappUrl = buildWhatsAppUrl(
    cleanNumber,
    'আসসালামু আলাইকুম, আমি ড্রিম হোম ডেকোর ফার্নিচার সম্পর্কে জানতে চাই।'
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
  };

  const isExploreActive = pathname === '/products';
  const isReadingActive = pathname.includes('category=reading-tables');
  const isBookshelfActive = pathname.includes('category=bookshelves');
  const isComputerActive = pathname.includes('category=computer-tables');
  const isSavedActive = pathname === '/saved';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/98 backdrop-blur-md border-b border-stone-200/90 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          
          {/* ========================================================= */}
          {/* MOBILE ONLY: Hamburger Trigger                            */}
          {/* ========================================================= */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-800 hover:text-stone-950 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP LEFT: Navigation Links (Inspired by reference)     */}
          {/* ========================================================= */}
          <nav
            aria-label="মূল নেভিগেশন"
            className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0"
          >
            {/* 1. EXPLORE ALL */}
            <Link
              href="/products"
              className={`text-[11px] xl:text-xs font-semibold tracking-wider uppercase transition-colors select-none ${
                isExploreActive
                  ? 'text-[#8B5A2B] font-bold'
                  : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              EXPLORE ALL
            </Link>

            {/* 2. READING TABLES */}
            <Link
              href="/products?category=reading-tables"
              className={`text-[11px] xl:text-xs font-semibold tracking-wider uppercase transition-colors select-none ${
                isReadingActive
                  ? 'text-[#8B5A2B] font-bold'
                  : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              READING TABLES
            </Link>

            {/* 3. BOOKSHELVES */}
            <Link
              href="/products?category=bookshelves"
              className={`text-[11px] xl:text-xs font-semibold tracking-wider uppercase transition-colors select-none ${
                isBookshelfActive
                  ? 'text-[#8B5A2B] font-bold'
                  : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              BOOKSHELVES
            </Link>

            {/* 4. COMPUTER DESKS */}
            <Link
              href="/products?category=computer-tables"
              className={`hidden xl:inline-block text-[11px] xl:text-xs font-semibold tracking-wider uppercase transition-colors select-none ${
                isComputerActive
                  ? 'text-[#8B5A2B] font-bold'
                  : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              COMPUTER DESKS
            </Link>

            {/* 5. MORE (Dropdown) */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1 text-[11px] xl:text-xs font-semibold tracking-wider uppercase text-stone-800 hover:text-stone-950 transition-colors cursor-pointer select-none"
              >
                <span>MORE</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {moreOpen && (
                <div className="absolute top-full left-0 mt-2.5 w-56 bg-[#FAF8F5] border border-stone-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link
                    href="/products?category=computer-tables"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-xs text-stone-800 hover:bg-stone-100/80 transition-colors font-bn font-medium"
                  >
                    <span>কম্পিউটার টেবিল (Computer Desks)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                  <Link
                    href="/track-order"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-xs text-stone-800 hover:bg-stone-100/80 transition-colors font-bn font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>অর্ডার ট্র্যাকিং (Track Order)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                  <Link
                    href="/#workshop"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-xs text-stone-800 hover:bg-stone-100/80 transition-colors font-bn font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Hammer className="w-3.5 h-3.5 text-[#8B5A2B]" />
                      <span>আমাদের কারখানা (Workshop)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                  <div className="border-t border-stone-200 my-1" />
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors font-bn font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>কাস্টম ফার্নিচার অর্ডার</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </a>
                </div>
              )}
            </div>

            {/* 6. WORKSHOP (Highlighted link matching LOOKBOOK style) */}
            <Link
              href="/#workshop"
              className="text-[11px] xl:text-xs font-bold tracking-widest uppercase text-[#8B5A2B] hover:text-[#6D431F] transition-colors select-none"
            >
              WORKSHOP
            </Link>
          </nav>

          {/* ========================================================= */}
          {/* CENTER: Brand Logo & Editorial Typography                 */}
          {/* ========================================================= */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group select-none min-w-0"
            aria-label={settings.site_name}
          >
            {settings.logo_url && settings.logo_url.startsWith('http') ? (
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full overflow-hidden bg-stone-900 border border-amber-900/30 shadow-xs flex items-center justify-center shrink-0">
                <Image
                  src={getOptimizedImageUrl(settings.logo_url, 120)}
                  alt={settings.site_name}
                  fill
                  sizes="(max-width: 640px) 32px, 40px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full bg-stone-900 border border-amber-900/30 text-amber-200 font-serif font-bold text-xs sm:text-sm flex items-center justify-center tracking-wider shrink-0 shadow-xs">
                DH
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span className="font-serif text-base sm:text-lg xl:text-xl font-bold tracking-[0.16em] text-[#1C1917] group-hover:text-[#8B5A2B] transition-colors leading-none truncate uppercase">
                {settings.site_name || 'DREAM HOME'}
              </span>
              <span className="text-[8px] sm:text-[9px] xl:text-[9.5px] tracking-[0.24em] font-sans font-medium text-stone-500 uppercase leading-none mt-1 truncate">
                FURNITURE & WORKSHOP
              </span>
            </div>
          </Link>

          {/* ========================================================= */}
          {/* RIGHT: Actions Cluster (WhatsApp, Account, Search, Saved, Bag) */}
          {/* ========================================================= */}
          <div className="flex items-center gap-1 sm:gap-2 xl:gap-3 shrink-0">
            {/* 1. WHATSAPP Pill Button (Matches reference image style) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#F2ECE4] hover:bg-[#EAE2D7] text-stone-800 px-3 py-1.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase transition-colors border border-stone-200/70 select-none"
              aria-label="হোয়াটসঅ্যাপে যোগাযোগ"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span>WHATSAPP</span>
            </a>

            {/* 2. User / Account (Admin / Owner login) */}
            <Link
              href="/admin"
              className="hidden sm:inline-flex p-1.5 sm:p-2 text-stone-800 hover:text-[#8B5A2B] transition-colors rounded-full hover:bg-stone-100"
              title="অ্যাডমিন লগইন / পোর্টাল"
              aria-label="অ্যাডমিন লগইন"
            >
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.6]" />
            </Link>

            {/* 3. Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1.5 sm:p-2 text-stone-800 hover:text-[#8B5A2B] transition-colors rounded-full hover:bg-stone-100 cursor-pointer"
              aria-label="পণ্য সার্চ করুন"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.6]" />
            </button>

            {/* 4. Heart (Saved / Wishlist) */}
            <Link
              href="/saved"
              className={`relative p-1.5 sm:p-2 transition-colors rounded-full hover:bg-stone-100 ${
                isSavedActive ? 'text-[#8B5A2B]' : 'text-stone-800 hover:text-[#8B5A2B]'
              }`}
              title={`সেভ করা তালিকা (${totalSaved} টি)`}
              aria-label="সেভ করা ফার্নিচার"
            >
              <Heart
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                  isSavedActive ? 'fill-[#8B5A2B] stroke-[#8B5A2B]' : 'stroke-[1.6]'
                }`}
              />
              {totalSaved > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#FAF8F5]" />
              )}
            </Link>

            {/* 5. Bag (Shopping Bag with tan/amber badge counter) */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-1.5 sm:p-2 text-stone-800 hover:text-[#8B5A2B] transition-colors rounded-full hover:bg-stone-100 cursor-pointer"
              aria-label={`শপিং ব্যাগ (${totalItems} টি পণ্য)`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.6]" />
              {/* Tan/caramel circular badge matching reference image */}
              <span className="absolute -top-0.5 -right-1 bg-[#C4A47C] text-stone-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-sans leading-none shadow-2xs">
                {totalItems}
              </span>
            </button>
          </div>

        </div>

        {/* ========================================================= */}
        {/* Expandable Search Input Bar                               */}
        {/* ========================================================= */}
        {searchOpen && (
          <div className="py-2.5 sm:py-3 px-1 sm:px-2 border-t border-stone-200/90 animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পড়ার টেবিল, কম্পিউটার টেবিল বা বুকশেলফ খুঁজুন..."
                className="w-full pl-9 sm:pl-10 pr-20 sm:pr-24 py-2 sm:py-2.5 bg-white border border-stone-300 rounded-full text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-bn shadow-xs text-stone-800"
                autoFocus
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 sm:left-3.5" />
              <button
                type="submit"
                className="absolute right-1 sm:right-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold font-bn transition-colors cursor-pointer"
              >
                খুঁজুন
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* Mobile Drawer Menu & Overlay                              */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden absolute top-full inset-x-0 bg-[#FAF8F5] border-b border-stone-300 shadow-xl p-4 sm:p-5 z-50 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100dvh-5rem)] overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 text-stone-900 font-sans uppercase tracking-wider text-xs font-bold transition-colors"
              >
                <span>EXPLORE ALL (সকল ফার্নিচার)</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/products?category=reading-tables"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 text-stone-800 font-sans uppercase tracking-wider text-xs font-semibold transition-colors"
              >
                <span>READING TABLES (পড়ার টেবিল)</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/products?category=bookshelves"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 text-stone-800 font-sans uppercase tracking-wider text-xs font-semibold transition-colors"
              >
                <span>BOOKSHELVES (বুকশেলফ)</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/products?category=computer-tables"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 text-stone-800 font-sans uppercase tracking-wider text-xs font-semibold transition-colors"
              >
                <span>COMPUTER DESKS (কম্পিউটার টেবিল)</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/#workshop"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 text-[#8B5A2B] font-sans uppercase tracking-wider text-xs font-bold transition-colors"
              >
                <span>WORKSHOP (আমাদের কারখানা)</span>
                <ChevronRight className="w-4 h-4 text-[#8B5A2B]" />
              </Link>

              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-800 font-sans uppercase tracking-wider text-xs font-bold transition-colors border border-emerald-200/50"
              >
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>TRACK ORDER (অর্ডার ট্র্যাকিং)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </Link>

              <div className="pt-3 mt-2 border-t border-stone-200 flex flex-col gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp এ মেসেজ দিন</span>
                </a>

                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded-xl font-medium text-xs transition-colors"
                >
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>হটলাইন কল: {settings.phone}</span>
                </a>

                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-xs text-stone-400 hover:text-stone-600 py-1"
                >
                  অ্যাডমিন লগইন (Owner Portal)
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
