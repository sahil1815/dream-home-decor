'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, Hammer, ShoppingBag, MessageCircle } from 'lucide-react';
import { SiteSettings } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { buildWhatsAppUrl } from '@/lib/utils';

interface HeroSliderProps {
  settings: SiteSettings;
}

export function HeroSlider({ settings }: HeroSliderProps) {
  const bannerImage = settings.cover_banner_url || '/placeholders/site/hero.jpg';
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'আসসালামু আলাইকুম, আমি ড্রিম হোম ডেকোর ফার্নিচার সম্পর্কে জানতে চাই।'
  );

  return (
    <section className="relative overflow-hidden bg-[#F7F3EE] py-14 sm:py-20 lg:py-24 border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Authentic Craftsmanship Story */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Factory Badge */}
            <div className="inline-flex items-center gap-2 bg-[#F4ECE1] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-[#8A5A3B] text-xs sm:text-sm font-bn font-semibold">
              <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8A5A3B] shrink-0" />
              <span>মিরপুর নিজস্ব কারখানায় প্রস্তুতকৃত • সরাসরি ফ্যাক্টরি মূল্য</span>
            </div>

            {/* Main Headline in Noto Serif Bengali */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2B1D14] tracking-tight font-serif leading-[1.3]">
              আপনার ঘরের জন্য{' '}
              <span className="text-[#8A5A3B] relative inline-block">
                হাতে তৈরি ফার্নিচার
              </span>
              , সরাসরি নিজস্ব কারখানা থেকে
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-stone-700 font-bn leading-relaxed max-w-2xl mx-auto lg:mx-0">
              উন্নত মেলামাইন বোর্ড ও মালয়েশিয়ান প্রসেসড উডে তৈরি পড়ার টেবিল, বুকশেলফ ও কম্পিউটার ডেস্ক।
              কোনো শোরুমের অতিরিক্ত ভাড়া বা মধ্যস্বত্বভোগী ছাড়া নির্ভরযোগ্য স্থায়িত্ব। পড়ার টেবিল শুরু মাত্র{' '}
              <span className="font-bold text-[#8A5A3B] underline decoration-[#B08D57] underline-offset-4 font-sans">
                ৳3,800
              </span>{' '}
              থেকে।
            </p>

            {/* Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1 text-xs sm:text-sm font-bn text-[#2B1D14] max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8A5A3B] shrink-0" />
                <span>সারাদেশে ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8A5A3B] shrink-0" />
                <span>ডেলিভারিম্যানের সামনে দেখে নেওয়ার সুযোগ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8A5A3B] shrink-0" />
                <span>১ মিমি পিভিসি এজ ব্যান্ডিং কোটিং</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8A5A3B] shrink-0" />
                <span>কাস্টম মাপ ও পছন্দের রঙে তৈরির সুবিধা</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-3">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-7 py-3.5 rounded-xl font-bn font-semibold text-sm sm:text-base shadow-xs transition-colors"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>ফার্নিচার কালেকশন দেখুন</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#2B1D14] border border-[#E8E2D9] px-6 py-3.5 rounded-xl font-bn font-semibold text-sm sm:text-base transition-colors shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>হোয়াটসঅ্যাপে কথা বলুন</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-4/3 sm:aspect-16/11 lg:aspect-4/3 group">
              <Image
                src={getOptimizedImageUrl(bannerImage, 900, 85)}
                alt="ড্রিম হোম ডেকোর মিরপুর নিজস্ব কারখানায় প্রস্তুত আধুনিক মেলামাইন ফার্নিচার"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

              {/* Floating Pill */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/95 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-xl shadow-xs border border-[#E8E2D9] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-bn text-[11px] sm:text-xs font-semibold text-[#2B1D14]">
                  মিরপুর-১০ কারখানা থেকে সরাসরি
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
