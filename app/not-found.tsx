import React from 'react';
import Link from 'next/link';
import { Home, ShoppingBag, Search, Hammer } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-8 max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] rounded-3xl flex items-center justify-center font-bold text-3xl font-serif shadow-xs">
        ৪০৪
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
        </h1>
        <p className="text-stone-600 font-bn text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          আপনি যে ঠিকানাটি খুঁজছেন তা হয়তো সরানো হয়েছে অথবা লিংকটি ভুল ছিল। নিচের অপশনগুলো থেকে আপনার প্রয়োজনীয় পৃষ্ঠা খুঁজে নিতে পারেন।
        </p>
      </div>

      {/* Quick Search */}
      <form action="/products" method="GET" className="w-full max-w-md relative">
        <input
          type="text"
          name="search"
          placeholder="পড়ার টেবিল, বুকশেলফ বা কম্পিউটার ডেস্ক খুঁজুন..."
          className="w-full pl-10 pr-24 py-3 bg-white border border-[#E8E2D9] rounded-2xl text-xs sm:text-sm font-bn text-[#2B1D14] shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
        />
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#8A5A3B] hover:bg-[#6E442B] text-white rounded-xl text-xs font-bn font-semibold transition-colors"
        >
          খুঁজুন
        </button>
      </form>

      {/* Navigation Shortcuts */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-bn font-semibold shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>হোমপেজে ফিরুন</span>
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#2B1D14] border border-[#E8E2D9] px-6 py-3 rounded-xl text-xs sm:text-sm font-bn font-semibold transition-colors shadow-2xs"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>সকল ফার্নিচার কালেকশন</span>
        </Link>
        <Link
          href="/custom-furniture"
          className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#8A5A3B] border border-[#E8E2D9] px-6 py-3 rounded-xl text-xs sm:text-sm font-bn font-semibold transition-colors shadow-2xs"
        >
          <Hammer className="w-4 h-4" />
          <span>কাস্টম ফার্নিচার তৈরি</span>
        </Link>
      </div>
    </div>
  );
}
