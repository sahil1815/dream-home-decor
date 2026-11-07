import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ShieldCheck,
  Hammer,
  Truck,
  HelpCircle,
  ChevronDown,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
} from 'lucide-react';
import {
  getSiteSettings,
  getCategories,
  getProducts,
  getCampaigns,
  getWorkshopData,
} from '@/lib/data';
import { HeroSlider } from '@/components/storefront/HeroSlider';
import { TrustBadges } from '@/components/storefront/TrustBadges';
import { ProductCard } from '@/components/storefront/ProductCard';
import { WorkshopShowcase } from '@/components/storefront/WorkshopShowcase';
import { CampaignBanner } from '@/components/storefront/CampaignBanner';
import { getOptimizedImageUrl } from '@/lib/imagekit';

export const revalidate = 3600; // 1-hour ISR

export default async function HomePage() {
  const [settings, categories, products, campaigns, workshopData] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getProducts({ limit: 12 }),
    getCampaigns(),
    getWorkshopData(),
  ]);

  const faqs = [
    {
      q: 'ফার্নিচারের বোর্ড কি পানি বা আর্দ্রতায় সহজে নষ্ট হবে?',
      a: 'আমরা ১৬ মিমি মেলামাইন বোর্ড এবং প্রতিটি কাটিং প্রান্তে মেশিনের সাহায্যে ১ মিমি পুরু পিভিসি এজ ব্যান্ডিং সিলিং ব্যবহার করি। এর ফলে স্বাভাবিক পানির ছিটা কিংবা ঘরের আর্দ্রতায় বোর্ডের প্রান্ত ক্ষতিগ্রস্ত হয় না।',
    },
    {
      q: 'ডেলিভারির সময় কি ফার্নিচার খুলে দেখে নেওয়া যাবে?',
      a: 'হ্যাঁ, সারাদেশে ক্যাশ অন ডেলিভারিতে ডেলিভারিম্যানের সামনে প্যাকেট খুলে ফার্নিচারের ফিনিশিং ও রঙ চেক করে নেওয়ার সম্পূর্ণ সুযোগ রয়েছে। সন্তুষ্ট হলে তবেই মূল্য পরিশোধ করবেন।',
    },
    {
      q: 'আমার ঘরের মাপ অনুযায়ী কাস্টম সাইজ তৈরি করা যাবে কি?',
      a: 'অবশ্যই। আমাদের মিরপুর-১০ নিজস্ব কারখানা থাকায় যেকোনো টেবিল, সেলফ কিংবা বুকশেলফের দৈর্ঘ্য, প্রস্থ, ড্রয়ার বা তাক আপনার পছন্দমতো কাস্টমাইজ করা সম্ভব। সাইজ জানিয়ে সরাসরি WhatsApp-এ যোগাযোগ করতে পারেন।',
    },
    {
      q: 'ঢাকার ভেতরে ও বাইরে ডেলিভারি পেতে কতদিন সময় লাগে?',
      a: 'ঢাকার ভেতরের ঠিকানায় সাধারণত ১ থেকে ২ কর্মদিবসে এবং ঢাকার বাইরে ৩ থেকে ৫ কর্মদিবসের মধ্যে কুরিয়ারের মাধ্যমে নিরাপদে বাবল র‍্যাপ প্যাকেজিংসহ পৌঁছে দেওয়া হয়।',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
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
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B1D14]">
              প্রয়োজন অনুযায়ী ফার্নিচার বেছে নিন
            </h2>
            <p className="text-stone-600 font-bn text-sm mt-1">
              পড়ার টেবিল, বুকশেলফ কিংবা কাজের ডেস্ক—প্রতিটি মডেল কারখানা থেকে সরাসরি সরবরাহযোগ্য
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bn font-semibold text-[#8A5A3B] hover:text-[#6E442B] transition-colors shrink-0"
          >
            <span>সব ক্যাটাগরি</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group p-4 bg-white rounded-2xl border border-[#E8E2D9] hover:border-[#8A5A3B]/40 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-between"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 mb-3 border border-stone-100">
                <Image
                  src={getOptimizedImageUrl(cat.image_url, 200)}
                  alt={cat.name}
                  fill
                  sizes="100px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-[#2B1D14] text-sm group-hover:text-[#8A5A3B] transition-colors">
                {cat.name_bn || cat.name}
              </h3>
              <span className="text-[11px] text-stone-500 font-sans mt-0.5">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Split Editorial: Signature Reading Table (পড়ার টেবিল - ৳৩,৮০০) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF8F5] rounded-3xl overflow-hidden shadow-xs border border-[#E8E2D9] p-6 sm:p-10 lg:p-12 relative">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="bg-[#F4ECE1] text-[#8A5A3B] text-xs font-bn font-semibold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block border border-[#E8E2D9]">
                কারখানা সিগনেচার মডেল
              </span>

              <h2 className="text-2xl sm:text-4xl font-bold font-serif leading-tight text-[#2B1D14]">
                স্মার্ট বুকশেলফ সহ পড়ার টেবিল — মাত্র ৳3,800
              </h2>
              <p className="text-stone-700 font-bn text-sm sm:text-base leading-relaxed">
                শিক্ষার্থী ও বইপ্রেমীদের জন্য আমাদের নিয়মিত তৈরি মডেল। পর্যাপ্ত বই রাখার খোপ,
                ল্যাপটপ স্পেস ও মসৃণ ওয়াটারপ্রুফ মেলামাইন কোটিং। মিরপুর কারখানা থেকে সরাসরি
                ক্যাশ অন ডেলিভারিতে হোম ডেলিভারি।
              </p>

              <div className="flex flex-wrap gap-2.5 sm:gap-4 pt-2">
                <div className="bg-white px-4 py-2.5 rounded-xl text-xs font-bn border border-[#E8E2D9] shadow-2xs">
                  <span className="text-[#8A5A3B] font-bold block">পরিমাপ:</span>
                  <span className="text-stone-800 font-medium font-sans">৩.৫ ফুট x ২ ফুট x ৪.৫ ফুট</span>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl text-xs font-bn border border-[#E8E2D9] shadow-2xs">
                  <span className="text-emerald-700 font-bold block">ডেলিভারি:</span>
                  <span className="text-stone-800 font-medium">সারাদেশে ক্যাশ অন ডেলিভারি</span>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                <Link
                  href="/products/smart-ergonomic-reading-table"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-7 py-3.5 rounded-xl font-bn font-semibold text-sm sm:text-base shadow-xs transition-colors"
                >
                  বিস্তারিত দেখুন ও অর্ডার করুন
                </Link>
                <span className="text-stone-600 text-xs sm:text-sm font-bn">
                  বাটন ক্লিক করলেই ক্যাশ অন ডেলিভারি ফর্ম খুলবে
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-md border border-[#E8E2D9]">
                <Image
                  src="/placeholders/products/smart-ergonomic-reading-table/01.jpg"
                  alt="Smart Reading Table"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B1D14]">
              ফার্নিচার কালেকশন
            </h2>
            <p className="text-stone-600 font-bn text-sm mt-1">
              সরাসরি মিরপুর কারখানা মূল্যে তৈরি ও ডেলিভারিযোগ্য
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bn font-semibold text-[#8A5A3B] hover:text-[#6E442B]"
          >
            <span>সবগুলো ফার্নিচার দেখুন</span>
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
      <WorkshopShowcase workshopData={workshopData} facebookUrl={settings.facebook_url} />

      {/* 8. Factual Craftsmanship & Manufacturing Standards (Replaced Comparison Table) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-8 sm:p-12 shadow-xs">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bn font-semibold text-[#8A5A3B] uppercase tracking-wider block mb-1">
              নির্মাণ মান ও উপকরণ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B1D14]">
              আমাদের ফার্নিচার কীভাবে দীর্ঘস্থায়ী হয়?
            </h2>
            <p className="text-stone-600 text-sm font-bn mt-2 leading-relaxed">
              সরাসরি কারখানা থেকে ফার্নিচার ক্রয়ের ক্ষেত্রে উপকরণের স্বচ্ছতা সবচেয়ে গুরুত্বপূর্ণ। প্রতিটি ফার্নিচারে যা নিশ্চিত করা হয়:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="space-y-3 p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <div className="w-10 h-10 rounded-xl bg-[#F4ECE1] text-[#8A5A3B] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2B1D14]">
                ১৬ মিমি ডেনসিটি মেলামাইন বোর্ড
              </h3>
              <p className="font-bn text-stone-600 text-xs sm:text-sm leading-relaxed">
                উচ্চ ঘনত্বের বোর্ড ব্যবহার করা হয়, যা সাধারণ ব্যবহারের চাপ ও ওজন সহজে সহ্য করতে পারে। ওপরের মসৃণ কোটিং স্ক্র্যাচ প্রতিরোধী।
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-3 p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <div className="w-10 h-10 rounded-xl bg-[#F4ECE1] text-[#8A5A3B] flex items-center justify-center">
                <Hammer className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2B1D14]">
                ১ মিমি পিভিসি এজ সিলিং
              </h3>
              <p className="font-bn text-stone-600 text-xs sm:text-sm leading-relaxed">
                কাটিং প্রান্তগুলোতে মেশিনের সাহায্যে পিভিসি সিলিং দেওয়া হয়। ফলে অসাবধানতাবশত পানি বা তরল পড়লেও ভেতরের বোর্ডে সহজে পানি জমে না।
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-3 p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <div className="w-10 h-10 rounded-xl bg-[#F4ECE1] text-[#8A5A3B] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2B1D14]">
                সরাসরি কারখানা ডেলিভারি
              </h3>
              <p className="font-bn text-stone-600 text-xs sm:text-sm leading-relaxed">
                মিরপুর-১০ কারখানা থেকে বাবল র‍্যাপ দিয়ে সুরক্ষিতভাবে আপনার ঠিকানায় পাঠানো হয়। ডেলিভারিম্যানের সামনে খুলে চেক করার পর মূল্য পরিশোধের সুযোগ।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bn font-semibold text-[#8A5A3B]">
            <HelpCircle className="w-4 h-4" />
            <span>সচরাচর জিজ্ঞাসা</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B1D14]">
            অর্ডার করার আগে জেনে নিন
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs open:border-[#8A5A3B]/40 transition-colors"
            >
              <summary className="flex items-center justify-between cursor-pointer font-serif font-bold text-[#2B1D14] text-base list-none select-none">
                <span>{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
              </summary>
              <p className="mt-3 text-stone-600 font-bn text-sm leading-relaxed border-t border-[#E8E2D9]/60 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. Showroom & Mirpur Factory Location Block */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-3xl border border-[#E8E2D9] overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
          {/* Details Column */}
          <div className="lg:col-span-7 p-8 sm:p-12 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bn font-semibold text-[#8A5A3B] uppercase tracking-wider block">
                সরাসরি কারখানা পরিদর্শন
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B1D14]">
                আমাদের ওয়ার্কশপ ও শোরুমে স্বাগতম
              </h2>
              <p className="text-stone-600 font-bn text-sm leading-relaxed">
                মিরপুর-১০ এ অবস্থিত আমাদের নিজস্ব কারখানায় এসে স্বচক্ষে বোর্ডের মান, ফিনিশিং ও কাটিং দেখতে পারেন। সরাসরি কথা বলে দিতে পারেন আপনার পছন্দের কাস্টম অর্ডারের মাপ।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bn">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                <div className="flex items-center gap-2 text-[#8A5A3B] font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>কারখানা ও শোরুম ঠিকানা</span>
                </div>
                <p className="text-stone-700 leading-relaxed font-sans">
                  {settings.address || 'সেকশন ১০, ব্লক সি, রোড ২, মিরপুর, ঢাকা ১২১৬ (মিরপুর ১০ গোলচত্বর সংলগ্ন)'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                <div className="flex items-center gap-2 text-[#8A5A3B] font-bold">
                  <Clock className="w-4 h-4" />
                  <span>পরিদর্শনের সময়সূচি</span>
                </div>
                <p className="text-stone-700 leading-relaxed font-sans">
                  প্রতিদিন সকাল ১০:০০ টা — রাত ৯:০০ টা<br />
                  (শুক্রবারসহ সপ্তাহের ৭ দিনই খোলা)
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="https://maps.google.com/?q=Mirpur-10+Dhaka+Bangladesh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-5 py-2.5 rounded-xl font-bn font-semibold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>গুগল ম্যাপে লোকেশন দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#2B1D14] border border-[#E8E2D9] px-4 py-2.5 rounded-xl font-bn font-semibold text-xs sm:text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-[#8A5A3B]" />
                <span className="font-sans">হটলাইন: {settings.phone}</span>
              </a>
            </div>
          </div>

          {/* Showroom Photo Column */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full bg-stone-100">
            <Image
              src="/placeholders/site/showroom.jpg"
              alt="Dream Home Decor Showroom & Workshop Mirpur"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
            <div className="absolute bottom-4 left-4 text-white text-xs font-bn font-semibold lg:hidden">
              মিরপুর-১০ ডিসপ্লে ও কারখানা কর্নার
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
