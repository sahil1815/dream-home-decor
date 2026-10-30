'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Menu,
  X,
  Phone,
  Search,
  PackageCheck,
  Hammer,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { SiteSettings, Category } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface NavbarProps {
  settings: SiteSettings;
  categories: Category[];
}

export function Navbar({ settings, categories }: NavbarProps) {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'হোম', href: '/' },
    { label: 'সকল ফার্নিচার', href: '/products' },
    { label: 'পড়ার টেবিল', href: '/products?category=reading-tables' },
    { label: 'বুকশেলফ', href: '/products?category=bookshelves' },
    { label: 'কম্পিউটার টেবিল', href: '/products?category=computer-tables' },
    { label: 'আমাদের কারখানা', href: '/#workshop' },
    { label: 'অর্ডার ট্র্যাকিং', href: '/track-order', highlight: true },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-stone-700 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
            aria-label="মেনু খুলুন"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group shrink">
            {settings.logo_url && settings.logo_url.startsWith('http') ? (
              <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-stone-900 border border-amber-900/20 shadow-xs flex items-center justify-center shrink-0">
                <Image
                  src={getOptimizedImageUrl(settings.logo_url, 120)}
                  alt={settings.site_name}
                  fill
                  sizes="(max-width: 640px) 36px, 48px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#8B5A2B] text-white flex items-center justify-center shadow-xs font-bold text-base sm:text-lg font-serif shrink-0">
                DH
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span className="font-serif text-base sm:text-xl font-bold tracking-tight text-[#1C1917] group-hover:text-[#8B5A2B] transition-colors leading-tight truncate">
                {settings.site_name}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 font-bn font-medium flex items-center gap-1 truncate">
                <span className="truncate">{settings.site_name_bn || 'ড্রিম হোম ডেকোর'}</span>
                <span className="w-1 h-1 rounded-full bg-amber-600 inline-block shrink-0" />
                <span className="text-[#8B5A2B] font-semibold shrink-0">নিজস্ব কারখানা</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all font-bn flex items-center gap-1 ${
                    isActive
                      ? 'text-[#8B5A2B] bg-[#8B5A2B]/10 font-bold'
                      : link.highlight
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/80'
                  }`}
                >
                  {link.highlight && <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 sm:p-2.5 text-stone-700 hover:text-[#8B5A2B] rounded-full hover:bg-stone-100 transition-colors"
              aria-label="পণ্য খুঁজুন"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Hotline Pill (Desktop) */}
            <a
              href={`tel:${settings.phone}`}
              className="hidden sm:inline-flex items-center gap-2 bg-[#8B5A2B]/10 hover:bg-[#8B5A2B]/20 text-[#8B5A2B] px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors border border-[#8B5A2B]/20"
            >
              <Phone className="w-3.5 h-3.5 text-[#8B5A2B]" />
              <span className="font-sans">{settings.phone}</span>
            </a>

            {/* Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center gap-1.5 sm:gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm shadow-sm transition-all hover:shadow-md cursor-pointer group"
              aria-label="শপিং কার্ট"
            >
              <ShoppingCart className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline font-bn">কার্ট</span>
              {totalItems > 0 && (
                <span className="bg-amber-400 text-stone-950 font-bold text-[11px] sm:text-xs px-1.5 py-0.2 rounded-full min-w-4.5 h-4.5 sm:min-w-5 sm:h-5 flex items-center justify-center font-sans shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        {searchOpen && (
          <div className="py-2.5 sm:py-3 px-1 sm:px-2 border-t border-stone-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পড়ার টেবিল, কম্পিউটার টেবিল বা বুকশেলফ খুঁজুন..."
                className="w-full pl-9 sm:pl-10 pr-20 sm:pr-24 py-2 sm:py-2.5 bg-white border border-stone-300 rounded-full text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent font-bn shadow-xs text-stone-800"
                autoFocus
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 sm:left-3.5" />
              <button
                type="submit"
                className="absolute right-1 sm:right-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold font-bn transition-colors"
              >
                খুঁজুন
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu & Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden absolute top-full inset-x-0 bg-[#FAF8F5] border-b border-stone-300 shadow-xl p-4 sm:p-5 z-50 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100dvh-5rem)] overflow-y-auto">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-stone-100 text-stone-800 font-bn font-medium transition-colors text-sm sm:text-base"
                >
                  <div className="flex items-center gap-2.5">
                    {link.highlight ? (
                      <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5A2B] shrink-0" />
                    )}
                    <span className={link.highlight ? 'text-emerald-700 font-bold' : ''}>
                      {link.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                </Link>
              ))}

              <div className="pt-3 sm:pt-4 mt-2 border-t border-stone-200 flex flex-col gap-2">
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-colors"
                >
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>সরাসরি কল করুন: {settings.phone}</span>
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
