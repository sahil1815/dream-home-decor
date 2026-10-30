import React from 'react';
import Image from 'next/image';
import { Hammer, CheckCircle2, Video, Sparkles, ExternalLink } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface WorkshopShowcaseProps {
  facebookUrl?: string;
}

export function WorkshopShowcase({
  facebookUrl = 'https://www.facebook.com/profile.php?id=61584955311887',
}: WorkshopShowcaseProps) {
  const workshopSteps = [
    {
      title: '১. উন্নত মেলামাইন বোর্ড কাটিং',
      desc: 'কম্পিউটারাইজড কাটার মেশিনে নিখুঁত মাপে বোর্ড সাইজিং করা হয়।',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: '২. ১ মিমি পিভিসি এজ ব্যান্ডিং',
      desc: 'বোর্ডের চারপাশের কাটিং প্রান্ত সম্পূর্ণ মসৃণ ও পানি প্রতিরোধী সিলিং করা হয়।',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: '৩. দক্ষ কারিগরদের ফিটিং ও ফিনিশিং',
      desc: 'প্রতিটি জয়েন্ট ও হার্ডওয়্যার স্ক্রু নিখুঁতভাবে পরীক্ষা ও সেট করা হয়।',
      image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: '৪. সুরক্ষিত বাবল র‍্যাপ প্যাকেজিং',
      desc: 'কুরিয়ারে পরিবহনের সময় যেন এক ফোঁটাও দাগ না পড়ে সেজন্য মজবুত প্যাকেজিং।',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <section id="workshop" className="py-16 sm:py-20 bg-stone-900 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#8B5A2B]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#8B5A2B] text-white px-3.5 py-1.5 rounded-full text-xs font-bn font-bold tracking-wide">
            <Hammer className="w-4 h-4 text-amber-300" />
            <span>সরাসরি কারখানার অন্দরমহল • Inside Our Workshop</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-bn text-white leading-tight">
            আমরা কীভাবে তৈরি করি আপনার পছন্দের ফার্নিচার?
          </h2>

          <p className="text-stone-300 font-bn text-sm sm:text-base leading-relaxed">
            কোনো থার্ড-পার্টি বা মধ্যস্বত্বভোগী নয় — বোর্ড কেনা থেকে শুরু করে কাটিং, সাইজিং ও ডেলিভারি
            প্যাকেজিং পর্যন্ত সবকিছু সম্পন্ন হয় আমাদের নিজস্ব মিরপুরের ওয়ার্কশপে। তাই পাচ্ছেন সেরা ফিনিশিং
            ও অবিশ্বাস্য সাশ্রয়ী রেট।
          </p>
        </div>

        {/* 4-Step Workshop Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {workshopSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-stone-800/80 rounded-2xl overflow-hidden border border-stone-700 hover:border-amber-500/50 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-stone-950 overflow-hidden">
                <Image
                  src={getOptimizedImageUrl(step.image, 500)}
                  alt={step.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bn font-bold text-white text-base">
                  {step.title}
                </h3>
                <p className="font-bn text-stone-300 text-xs leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Facebook Reels / Workshop Video Banner Card */}
        <div className="mt-12 bg-gradient-to-r from-[#8B5A2B] to-[#643D1A] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bn text-amber-200">
              <Video className="w-4 h-4 text-rose-400" />
              <span>কারখানার সরাসরি ভিডিও ও রিলস</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-bn text-white">
              বোর্ড কাটিং ও তৈরির লাইভ ভিডিও দেখতে চান?
            </h3>
            <p className="text-amber-100 text-xs sm:text-sm font-bn max-w-xl">
              আমাদের অফিসিয়াল ফেসবুক পেজে গ্রাহকদের অর্ডার প্রস্তুতের ভিডিও, বোর্ড কাটিং ও ডেলিভারি
              আপডেট নিয়মিত শেয়ার করা হয়। সরাসরি চোখ রাখুন আমাদের পেজে!
            </p>
          </div>

          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 font-bn font-bold text-sm px-6 py-3.5 rounded-full shadow-lg transition-all hover:scale-105"
          >
            <span>ফেসবুকে ভিডিও দেখুন</span>
            <ExternalLink className="w-4 h-4 text-[#8B5A2B]" />
          </a>
        </div>
      </div>
    </section>
  );
}
