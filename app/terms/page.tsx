import React from 'react';
import type { Metadata } from 'next';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ব্যবহারের শর্তাবলি (Terms & Conditions)',
  description:
    'ড্রিম হোম ডেকোর ওয়েবসাইট ব্যবহারের সাধারণ নিয়মাবলী, অর্ডার কনফার্মেশন ও সার্ভিস শর্তাবলি।',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'ব্যবহারের শর্তাবলি | Dream Home Decor',
    description: 'ড্রিম হোম ডেকোর সাধারণ নিয়মাবলী, অর্ডার ডেলিভারি ও কাস্টমার সার্ভিস শর্তাবলি।',
    url: '/terms',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
          <FileText className="w-4 h-4 text-[#8A5A3B]" />
          <span>ব্যবহারের নিয়মনীতি</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          শর্তাবলি ও নীতিমালা (Terms & Conditions)
        </h1>
        <p className="text-stone-600 font-bn text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          ড্রিম হোম ডেকোর ওয়েবসাইট ব্যবহার করে কেনাকাটা করার ক্ষেত্রে প্রযোজ্য সাধারণ শর্তাবলি
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D9] shadow-xs space-y-8 text-xs sm:text-sm font-bn text-stone-700 leading-relaxed">
        {/* Section 1 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14]">
            ১. অর্ডার নিশ্চিতকরণ প্রক্রিয়া
          </h2>
          <p>
            ওয়েবসাইটে ক্যাশ অন ডেলিভারিতে অর্ডার প্লেস করার পর আমাদের কাস্টমার প্রতিনিধি ২ ঘণ্টার মধ্যে ফোনে কল করে আপনার ঠিকানা ও পণ্যের রঙ নিশ্চিত করবেন। কোনো কারণে ৩ বার চেষ্টার পরও যোগাযোগ স্থাপন না হলে অর্ডারটি সাময়িকভাবে স্থগিত হতে পারে।
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14]">
            ২. মূল্য ও ডেলিভারি চার্জ
          </h2>
          <p>
            আমাদের সাইটে প্রদর্শিত সকল মূল্য সরাসরি কারখানা দর। ঢাকার ভেতরের ঠিকানায় ১২০ টাকা এবং ঢাকার বাইরে সারা বাংলাদেশে ২০০ টাকা কুরিয়ার ডেলিভারি চার্জ সর্বমোট মূল্যের সাথে যুক্ত হবে। কোনো লুকানো চার্জ নেই।
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14]">
            ৩. ডেলিভারির সময় পণ্য যাচাই
          </h2>
          <p>
            ডেলিভারিম্যানের উপস্থিতিতে বাবল র‍্যাপ খুলে ফার্নিচার ভালো করে দেখে নেওয়া গ্রাহকের দায়িত্ব। পণ্য গ্রহণ ও মূল্য পরিশোধের পর সাধারণ ব্যবহারজনিত স্ক্র্যাচ বা ইচ্ছাকৃত ক্ষতির জন্য কোম্পানি দায়ী থাকবে না। তবে উৎপাদনগত কোনো অভ্যন্তরীণ ত্রুটি ৭ দিনের মধ্যে জানালে আমরা দ্রুত সমাধান প্রদান করি।
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#2B1D14]">
            ৪. কাস্টম ফার্নিচার ও অর্ডার বাতিল
          </h2>
          <p>
            সাধারণ রেডি স্টক অর্ডার ডেলিভারিম্যান রওয়ানা হওয়ার পূর্ব পর্যন্ত যেকোনো সময় বাতিল করা যায়। তবে গ্রাহকের নির্দিষ্ট ঘরের মাপে বোর্ড কাটিং শুরু হয়ে যাওয়ার পর কাস্টম অর্ডার বাতিল করা সম্ভব নয়।
          </p>
        </div>

        <div className="pt-4 border-t border-stone-100 text-stone-500 text-xs">
          সর্বশেষ সংস্করণ: ৭ নভেম্বর ২০২৬ • ড্রিম হোম ডেকোর মিরপুর কারখানা
        </div>
      </div>
    </div>
  );
}
