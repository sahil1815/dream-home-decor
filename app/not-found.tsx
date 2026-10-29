import React from 'react';
import Link from 'next/link';
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="w-20 h-20 bg-amber-100 text-[#8B5A2B] rounded-full flex items-center justify-center font-bold text-3xl font-serif">
        404
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-bn text-stone-900">
          পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
        </h1>
        <p className="text-stone-500 font-bn text-sm max-w-md mx-auto">
          আপনি যে পেজটি খুঁজছেন তা হয়তো সরানো হয়েছে অথবা লিংকটি ভুল ছিল।
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-6 py-3 rounded-full text-xs font-bn font-bold shadow-md transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>হোমপেজে ফিরুন</span>
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-3 rounded-full text-xs font-bn font-semibold transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>সকল ফার্নিচার দেখুন</span>
        </Link>
      </div>
    </div>
  );
}
