import React from 'react';
import type { Metadata } from 'next';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'গোপনীয়তা নীতিমালা (Privacy Policy)',
  description:
    'ড্রিম হোম ডেকোর গ্রাহকদের ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার ও সম্পূর্ণ গোপনীয়তা সুরক্ষার আনুষ্ঠানিক নীতিমালা।',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'গোপনীয়তা নীতিমালা | Dream Home Decor',
    description: 'গ্রাহকদের ব্যক্তিগত ফোন ও ঠিকানার গোপনীয়তা সুরক্ষা ও দায়িত্বশীল ব্যবহার।',
    url: '/privacy',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#8A5A3B]" />
          <span>গ্রাহক ডেটা ও তথ্য নিরাপত্তা</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          গোপনীয়তা নীতিমালা (Privacy Policy)
        </h1>
        <p className="text-stone-600 font-bn text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          আপনার ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের অগ্রাধিকার। কীভাবে আমরা তথ্য সংগ্রহ ও সংরক্ষণ করি তা নিচে স্পষ্ট করা হলো।
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D9] shadow-xs space-y-8 text-xs sm:text-sm font-bn text-stone-700 leading-relaxed">
        {/* Section 1 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#8A5A3B]" />
            <span>১. আমরা কী তথ্য সংগ্রহ করি?</span>
          </h2>
          <p>
            অর্ডার সম্পন্ন করার জন্য আমরা শুধুমাত্র প্রয়োজনীয় তথ্য সংগ্রহ করি, যেমন: আপনার নাম, সচল মোবাইল নম্বর, জেলা/থানা এবং সম্পূর্ণ ডেলিভারি ঠিকানা। আপনি চাইলে কাস্টম অর্ডারের সময় অতিরিক্ত নোট বা রুমের পরিমাপ প্রদান করতে পারেন।
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#8A5A3B]" />
            <span>২. তথ্যের ব্যবহার কীভাবে হয়?</span>
          </h2>
          <p>
            সংগৃহীত তথ্য শুধুমাত্র আপনার অর্ডার নিশ্চিতকরণ, কারখানায় পণ্য প্রস্তুত, কুরিয়ারে পণ্য বুকিং এবং ডেলিভারি ম্যানের যোগাযোগের উদ্দেশ্যে ব্যবহৃত হয়। আমরা কোনো স্প্যাম মেসেজ পাঠাই না এবং কোনো প্রচারণামূলক থার্ড-পার্টির সাথে গ্রাহকের তথ্য বিক্রি বা বিনিময় করি না।
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#8A5A3B]" />
            <span>৩. মোবাইল নাম্বার ও গোপনীয়তা সুরক্ষা</span>
          </h2>
          <p>
            আমাদের ওয়েবসাইটে গ্রাহকের ফোন নম্বর সর্বদাই সুরক্ষিত ও এনক্রিপ্ট রাখা হয়। পাবলিক অর্ডার ট্র্যাকিং পেজে সম্পূর্ণ ফোন নম্বর কখনো প্রদর্শন করা হয় না (যেমন: 017****3456)।
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14]">
            ৪. কুকিজ ও ব্রাউজিং সেশন
          </h2>
          <p>
            আপনার কার্টে যোগ করা ফার্নিচারের তালিকা এবং পছন্দের প্রোডাক্ট মনে রাখার সুবিধার্থে ব্রাউজারের লোকাল স্টোরেজ ও কুকিজ ব্যবহৃত হয়। এতে কোনো ব্যক্তিগত আর্থিক তথ্য সংরক্ষিত থাকে না।
          </p>
        </div>

        <div className="pt-4 border-t border-stone-100 text-stone-500 text-xs">
          সর্বশেষ সংস্করণ: ৭ নভেম্বর ২০২৬ • ড্রিম হোম ডেকোর মিরপুর কারখানা
        </div>
      </div>
    </div>
  );
}
