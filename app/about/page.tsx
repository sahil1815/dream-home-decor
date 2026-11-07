import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Hammer, ShieldCheck, Heart, Truck, MapPin } from 'lucide-react';
import { getSiteSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: 'আমাদের কারখানা ও গল্প',
  description:
    'মিরপুর-১০ এ অবস্থিত ড্রিম হোম ডেকোর নিজস্ব ফার্নিচার কারখানার কারিগরি গল্প, উন্নত মেলামাইন বোর্ড ও সরাসরি ফ্যাক্টরি মূল্যের প্রতিশ্রুতি।',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'আমাদের কারখানা ও গল্প | Dream Home Decor',
    description: 'মিরপুর-১০ এ নিজস্ব কারিগরদের নিপুণ হাতে তৈরি ফার্নিচার ও সরাসরি ফ্যাক্টরি মূল্যের প্রতিশ্রুতি।',
    url: '/about',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  const values = [
    {
      icon: Hammer,
      title: 'নিজস্ব ওয়ার্কশপ উৎপাদন',
      desc: 'কোনো থার্ড-পার্টি বা সাধারণ শোরুম নয়। বোর্ড কাটিং, এজ ব্যান্ডিং ও ফিটিং সবকিছু সম্পন্ন হয় আমাদের মিরপুরের কারখানায়।',
    },
    {
      icon: ShieldCheck,
      title: '১ মিমি পিভিসি এজ ব্যান্ডিং',
      desc: 'বোর্ডের কাটিং প্রান্তে মেশিনে ১ মিমি পুরু পিভিসি সিলিং দেওয়া হয়, ফলে ঘরের আর্দ্রতা বা পানির ছিটায় প্রান্ত ক্ষতিগ্রস্ত হয় না।',
    },
    {
      icon: Truck,
      title: 'খুলে দেখে মূল্য পরিশোধ',
      desc: 'ডেলিভারিম্যানের সামনে সম্পূর্ণ প্যাকেট খুলে দেখে নেওয়ার শতভাগ নিশ্চয়তা। সন্তুষ্ট হলে তবেই মূল্য পরিশোধ করবেন।',
    },
    {
      icon: Heart,
      title: 'কাস্টম সাইজ স্বাধীনতা',
      desc: 'ঘরের নির্দিষ্ট মাপ বা পছন্দের রঙ অনুযায়ী যেকোনো পড়ার টেবিল বা বুকশেলফ কাস্টমাইজ করে দেওয়ার সুবিধা।',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
      {/* 1. Hero Story Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 bg-[#F4ECE1] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-[#8A5A3B] text-xs font-bn font-semibold">
            <Hammer className="w-3.5 h-3.5 text-[#8A5A3B]" />
            <span>আমাদের কারিগরি গল্প • Mirpur-10 Workshop</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#2B1D14] leading-[1.25]">
            কাঠ ও বোর্ডের মমতায় গড়া{' '}
            <span className="text-[#8A5A3B]">নির্ভরযোগ্য ফার্নিচার</span>
          </h1>

          <p className="text-stone-700 font-bn text-sm sm:text-base leading-relaxed">
            ড্রিম হোম ডেকোর শুরু হয়েছিল একটি সহজ বিশ্বাস থেকে—বাংলাদেশের প্রতিটি ঘরে যেন মধ্যস্বত্বভোগীদের মাত্রাতিরিক্ত মুনাফা ছাড়া সরাসরি কারখানা মূল্যে মজবুত ও মার্জিত ফার্নিচার পৌঁছানো যায়।
          </p>

          <p className="text-stone-600 font-bn text-sm sm:text-base leading-relaxed">
            মিরপুর-১০ এর প্রাণকেন্দ্রে অবস্থিত আমাদের ওয়ার্কশপে অভিজ্ঞ কারিগরদের নিখুঁত হাতে তৈরি হয় প্রতিটি পড়ার টেবিল, কম্পিউটার ডেস্ক ও বুকশেলফ। আমরা ১৬ মিমি ডেনসিটি মেলামাইন বোর্ড এবং উচ্চমানের হার্ডওয়্যার ব্যবহার করি, যাতে বছরের পর বছর আপনার ঘরের সৌন্দর্য অটুট থাকে।
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/products"
              className="bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-7 py-3 rounded-xl font-bn font-semibold text-sm shadow-xs transition-colors"
            >
              ফার্নিচার কালেকশন দেখুন
            </Link>
            <Link
              href="/custom-furniture"
              className="bg-white hover:bg-[#FAF8F5] text-[#2B1D14] border border-[#E8E2D9] px-6 py-3 rounded-xl font-bn font-semibold text-sm shadow-2xs transition-colors"
            >
              কাস্টম অর্ডার দিন
            </Link>
          </div>
        </div>

        {/* Visual Workshop Image */}
        <div className="lg:col-span-5 relative aspect-4/3 sm:aspect-16/11 lg:aspect-4/3 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-stone-100">
          <Image
            src="/placeholders/site/about_workshop.jpg"
            alt="Dream Home Decor Mirpur Workshop"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 text-white text-xs font-bn font-semibold">
            মিরপুর-১০ ওয়ার্কশপে বোর্ড কাটিং ও অ্যাসেম্বলি
          </div>
        </div>
      </div>

      {/* 2. Key Values Grid */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bn font-semibold text-[#8A5A3B] uppercase tracking-wider block">
            আমাদের মূল্যবোধ
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B1D14]">
            কেন ড্রিম হোম ডেকোর অনন্য?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, idx) => {
            const Icon = v.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs hover:border-[#8A5A3B]/40 transition-colors space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F4ECE1] text-[#8A5A3B] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#2B1D14]">
                  {v.title}
                </h3>
                <p className="font-bn text-stone-600 text-xs leading-relaxed">
                  {v.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Team & Workshop Culture */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8E2D9] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 relative aspect-4/3 rounded-2xl overflow-hidden border border-[#E8E2D9] shadow-sm bg-stone-100">
          <Image
            src="/placeholders/site/about_team.jpg"
            alt="Craftsmen Team Dream Home Decor"
            fill
            className="object-cover"
          />
        </div>

        <div className="lg:col-span-7 space-y-4">
          <span className="bg-[#F4ECE1] text-[#8A5A3B] text-xs font-bn font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-block border border-[#E8E2D9]">
            কারিগরদের দক্ষতা
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B1D14]">
            কারখানার অভিজ্ঞ কারিগর দল
          </h2>
          <p className="text-stone-700 font-bn text-sm leading-relaxed">
            আমাদের কারখানার প্রতিটি কারিগরের রয়েছে দীর্ঘদিনের কাষ্ঠ ও মেলামাইন বোর্ড প্রসেসিংয়ের বাস্তব অভিজ্ঞতা। কম্পিউটারাইজড প্রিসিশন কাটার থেকে শুরু করে ১ মিমি এজ ব্যান্ডিং ফিনিশ—প্রত্যেকটি ধাপে তারা বজায় রাখেন সততা ও মনোযোগ।
          </p>
          <div className="pt-2 flex items-center gap-6 text-xs font-bn text-[#2B1D14]">
            <div>
              <span className="font-sans text-2xl font-bold text-[#8A5A3B] block">১০০%</span>
              <span className="text-stone-500">নিজস্ব মিরপুর কারখানা</span>
            </div>
            <div className="h-8 w-px bg-[#E8E2D9]" />
            <div>
              <span className="font-sans text-2xl font-bold text-[#8A5A3B] block">৩,৫০০+</span>
              <span className="text-stone-500">সন্তুষ্ট গ্রাহকের আস্থা</span>
            </div>
            <div className="h-8 w-px bg-[#E8E2D9]" />
            <div>
              <span className="font-sans text-2xl font-bold text-[#8A5A3B] block">৬৪</span>
              <span className="text-stone-500">জেলায় কুরিয়ার ডেলিভারি</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Factory Address Block */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-serif font-bold text-lg text-[#2B1D14] flex items-center justify-center md:justify-start gap-2">
            <MapPin className="w-5 h-5 text-[#8A5A3B]" />
            <span>সরাসরি কারখানা পরিদর্শন করতে চান?</span>
          </h3>
          <p className="text-stone-600 font-bn text-xs sm:text-sm">
            {settings.address || 'সেকশন ১০, ব্লক সি, রোড ২, মিরপুর, ঢাকা ১২১৬ (মিরপুর ১০ গোলচত্বর সংলগ্ন)'}
          </p>
        </div>

        <Link
          href="/contact"
          className="px-6 py-3 bg-[#8A5A3B] hover:bg-[#6E442B] text-white rounded-xl text-xs sm:text-sm font-bn font-semibold transition-colors shrink-0 shadow-xs"
        >
          যোগাযোগ ও ম্যাপ দেখুন
        </Link>
      </div>
    </div>
  );
}
