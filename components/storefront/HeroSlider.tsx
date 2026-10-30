'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, CheckCircle2, ShieldAlert, Hammer, ShoppingBag } from 'lucide-react';
import { SiteSettings } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface HeroSliderProps {
  settings: SiteSettings;
}

export function HeroSlider({ settings }: HeroSliderProps) {
  const bannerImage = settings.cover_banner_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#F5F2EB] py-12 sm:py-16 lg:py-20 border-b border-stone-200">
      {/* Decorative Warm Walnut Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#8B5A2B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Persuasive Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Factory Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#8B5A2B]/10 border border-[#8B5A2B]/30 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[#8B5A2B] text-xs sm:text-sm font-bn font-semibold">
              <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8B5A2B] shrink-0" />
              <span>সরাসরি নিজস্ব কারখানায় তৈরি • ফ্যাক্টরি হোলসেল রেট</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] tracking-tight font-bn leading-[1.25]">
              আপনার স্বপ্নের ঘরের জন্য{' '}
              <span className="text-[#8B5A2B] relative inline-block">
                প্রিমিয়াম ফার্নিচার
                <svg
                  className="absolute -bottom-2 left-0 w-full h-2 text-amber-500/40"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path d="M0,15 Q50,0 100,15" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
              , সরাসরি নিজস্ব কারখানায় প্রস্তুত!
            </h1>

            {/* Subtitle with Bengali Pricing highlight */}
            <p className="text-sm sm:text-lg text-stone-600 font-bn leading-relaxed max-w-2xl mx-auto lg:mx-0">
              উন্নত মেলামাইন বোর্ড ও মালয়েশিয়ান প্রসেসড উডে তৈরি পড়ার টেবিল, বুকশেলফ ও কম্পিউটার ডেস্ক।
              কোনো শোরুমের অতিরিক্ত ভাড়া বা মধ্যস্বত্বভোগী ছাড়া পাচ্ছেন সাশ্রয়ী দামে। পড়ার টেবিল শুরু মাত্র{' '}
              <span className="font-bold text-[#8B5A2B] underline decoration-amber-500 underline-offset-4">
                ৳৩,৮০০ টাকা
              </span>{' '}
              থেকে!
            </p>

            {/* Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2 text-xs sm:text-sm font-bn text-stone-700 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>সারাদেশে ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>দেখে নেওয়ার সম্পূর্ণ নিশ্চয়তা</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>১০০% উন্নত পিভিসি এজ ব্যান্ডিং</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>কাস্টম সাইজ ও কালার অপশন</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-4">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-7 py-3.5 rounded-full font-bn font-bold text-sm sm:text-base shadow-lg shadow-[#8B5A2B]/20 hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>সকল ফার্নিচার দেখুন</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>

              <Link
                href="#workshop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 px-6 py-3.5 rounded-full font-bn font-semibold text-sm sm:text-base transition-colors shadow-2xs"
              >
                <Hammer className="w-4 h-4 text-amber-700 shrink-0" />
                <span>আমাদের কারখানা ভিজিট</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Visual Card with High-Impact Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3 sm:aspect-16/11 lg:aspect-4/3 group">
              <Image
                src={getOptimizedImageUrl(bannerImage, 900, 85)}
                alt="Dream Home Decor Workshop & Furniture"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

              {/* Floating Price Pill */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/95 backdrop-blur-md px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-2xl shadow-lg border border-stone-100 flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bn text-[11px] sm:text-xs font-bold text-stone-900">
                  রেডি স্টক ডেলিভারি
                </span>
              </div>

              {/* Floating Bottom Card */}
              <div className="absolute bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 bg-stone-900/90 backdrop-blur-md text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-amber-400 font-bn font-semibold truncate">
                      সর্বাধিক বিক্রিত পড়ার টেবিল
                    </p>
                    <p className="text-xs sm:text-sm font-bn font-bold text-white mt-0.5 truncate">
                      Smart Reading Table with Shelf
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] sm:text-xs line-through text-stone-400 font-sans block">৳৪,৫০০</span>
                    <p className="text-base sm:text-lg font-extrabold text-amber-400 font-sans">৳৩,৮০০</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Badge floating behind */}
            <div className="absolute -bottom-4 -left-4 bg-[#8B5A2B] text-white px-4 py-2 rounded-2xl shadow-xl font-bn text-xs font-bold flex items-center gap-1.5 hidden sm:flex">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>সরাসরি কারখানা থেকে হোম ডেলিভারি</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
