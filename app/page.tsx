import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  CheckCircle,
  XCircle,
  BookOpen,
  Monitor,
  Library,
  Palette,
  Maximize2,
} from 'lucide-react';
import {
  getSiteSettings,
  getCategories,
  getProducts,
  getCampaigns,
} from '@/lib/data';
import { HeroSlider } from '@/components/storefront/HeroSlider';
import { TrustBadges } from '@/components/storefront/TrustBadges';
import { ProductCard } from '@/components/storefront/ProductCard';
import { WorkshopShowcase } from '@/components/storefront/WorkshopShowcase';
import { CampaignBanner } from '@/components/storefront/CampaignBanner';
import { getOptimizedImageUrl } from '@/lib/imagekit';

export const revalidate = 3600; // 1-hour ISR

export default async function HomePage() {
  const [settings, categories, products, campaigns] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getProducts({ limit: 12 }),
    getCampaigns(),
  ]);

  const featuredProducts = products.filter((p) => p.is_featured);
  const readingTables = products.filter(
    (p) =>
      p.slug.includes('reading') ||
      p.title.toLowerCase().includes('reading') ||
      p.title_bn.includes('পড়ার টেবিল')
  );

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Hero Section */}
      <HeroSlider settings={settings} />

      {/* 2. Trust Badges Bar */}
      <TrustBadges />

      {/* 3. Promotional Campaign / Lottery Banner */}
      <CampaignBanner campaigns={campaigns} />

      {/* 4. Visual Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bn font-bold text-[#8B5A2B] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>ফার্নিচার ক্যাটাগরি</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-bn text-[#1C1917] mt-1">
              আপনার ঘরের প্রয়োজন অনুযায়ী বেছে নিন
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-bn font-semibold text-[#8B5A2B] hover:text-[#6D431F] transition-colors"
          >
            <span>সকল ক্যাটাগরি দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group p-4 bg-white rounded-2xl border border-stone-200/90 hover:border-amber-600/50 shadow-2xs hover:shadow-lg transition-all text-center flex flex-col items-center justify-between"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 mb-3 border border-stone-100">
                <Image
                  src={getOptimizedImageUrl(cat.image_url, 200)}
                  alt={cat.name}
                  fill
                  sizes="100px"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-bn font-bold text-stone-900 text-sm group-hover:text-[#8B5A2B] transition-colors">
                {cat.name_bn || cat.name}
              </h3>
              <span className="text-[11px] text-stone-400 font-sans mt-0.5">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Special Spotlight: Signature Reading Table (পড়ার টেবিল - ৳৩,৮০০) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-[#643D1A] rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-10 text-white relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="bg-[#8B5A2B] text-white text-xs font-bn font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                হট ডিল • কারখানা স্পেশাল
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-bn leading-tight text-white">
                স্মার্ট বুকশেলফ সহ পড়ার টেবিল — মাত্র ৳৩,৮০০!
              </h2>
              <p className="text-stone-300 font-bn text-sm sm:text-base leading-relaxed">
                শিক্ষার্থী ও বইপ্রেমীদের জন্য আমাদের সর্বোচ্চ বিক্রিত মডেল। পর্যাপ্ত বই রাখার খোপ,
                ল্যাপটপ স্পেস ও মসৃণ ওয়াটারপ্রুফ মেলামাইন কোটিং। সরাসরি কারখানা থেকে দ্রুততম সময়ে
                হোম ডেলিভারি।
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl text-xs font-bn border border-white/10">
                  <span className="text-amber-400 font-bold block">বোর্ড সাইজ:</span>
                  <span>৩.৫ ফুট x ২ ফুট x ৪.৫ ফুট</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl text-xs font-bn border border-white/10">
                  <span className="text-emerald-400 font-bold block">ডেলিভারি:</span>
                  <span>সারাদেশে ক্যাশ অন ডেলিভারি</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4 items-center">
                <Link
                  href="/products/smart-ergonomic-reading-table"
                  className="bg-amber-400 hover:bg-amber-300 text-stone-950 px-7 py-3 rounded-full font-bn font-bold text-base shadow-lg transition-transform hover:scale-105"
                >
                  বিস্তারিত দেখুন ও অর্ডার করুন
                </Link>
                <span className="text-stone-300 text-sm font-bn">
                  বাটন ক্লিক করলেই ক্যাশ অন ডেলিভারি ফর্ম খুলবে
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-xl border-2 border-white/20">
                <Image
                  src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80"
                  alt="Smart Reading Table"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full font-sans">
                  ১৬% সেভ
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bn font-bold text-[#8B5A2B] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>আমাদের জনপ্রিয় ফার্নিচার</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-bn text-[#1C1917] mt-1">
              রেডি স্টক ও ফ্যাক্টরি ফ্রেশ কালেকশন
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bn font-semibold text-[#8B5A2B] hover:text-[#6D431F]"
          >
            <span>সবগুলো ফার্নিচার ({products.length}+)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.slice(0, 6).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              whatsappNumber={settings.whatsapp_number}
            />
          ))}
        </div>
      </section>

      {/* 7. Inside Our Workshop Section */}
      <WorkshopShowcase facebookUrl={settings.facebook_url} />

      {/* 8. Comparison: Why Buy from Factory Direct (Dream Home Decor) vs Traditional Retail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bn font-bold text-[#8B5A2B] uppercase tracking-wider">
            সরাসরি কারখানার সুবিধা
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-bn text-[#1C1917]">
            শোরুম বনাম ড্রিম হোম ডেকোর কারখানা
          </h2>
          <p className="text-stone-500 text-sm font-bn">
            জেনে নিন কেন মধ্যস্বত্বভোগী ছাড়া আমাদের থেকে ফার্নিচার কেনা লাভজনক
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            {/* Dream Home Decor Column */}
            <div className="p-6 sm:p-8 space-y-4 bg-emerald-50/30">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </span>
                <h3 className="font-bn font-bold text-lg text-emerald-900">
                  ড্রিম হোম ডেকোর (সরাসরি কারখানা)
                </h3>
              </div>
              <ul className="space-y-3 text-sm font-bn text-stone-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>কোনো শোরুম ভাড়া বা রিটেলার কমিশন নেই (২৫-৪০% সাশ্রয়)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>বোর্ড কাটিং থেকে কালার পর্যন্ত সরাসরি কাস্টমাইজেশনের সুযোগ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ডেলিভারি ম্যানের উপস্থিতিতে পণ্য চেক করে নেওয়ার শতভাগ নিশ্চয়তা</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>সরাসরি কারিগরের সাথে কথা বলে সাইজ চূড়ান্ত করার সুবিধা</span>
                </li>
              </ul>
            </div>

            {/* Traditional Retail Showroom Column */}
            <div className="p-6 sm:p-8 space-y-4 bg-rose-50/30">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  ✕
                </span>
                <h3 className="font-bn font-bold text-lg text-rose-900">
                  সাধারণ মার্কেট বা শোরুম
                </h3>
              </div>
              <ul className="space-y-3 text-sm font-bn text-stone-600">
                <li className="flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>শোরুমের উচ্চ ডেকোরেশন ও ভাড়া বাবদ অতিরিক্ত চড়া দাম</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>ভেতরের বোর্ডের মান সরাসরি যাচাই করার সুযোগ নেই</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>কাস্টম সাইজ তৈরি করতে গেলে দ্বিগুণ চার্জ দাবি করা হয়</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>বিক্রির পর সার্ভিসিং নিয়ে দীর্ঘসূত্রিতা ও গড়িমসি</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
