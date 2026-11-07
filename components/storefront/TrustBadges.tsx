import React from 'react';
import { ShieldCheck, Truck, Hammer, Clock } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: ShieldCheck,
      title: '১ মিমি পিভিসি এজ ব্যান্ডিং',
      subtitle: 'বোর্ডের প্রান্ত মসৃণ ও জলরোধী, সহজে প্রান্ত ক্ষতিগ্রস্ত হয় না',
    },
    {
      icon: Truck,
      title: 'সারাদেশে ক্যাশ অন ডেলিভারি',
      subtitle: 'ডেলিভারিম্যানের সামনে প্যাকেট খুলে চেক করে গ্রহণের সুবিধা',
    },
    {
      icon: Hammer,
      title: 'কাস্টম সাইজ ও ফিনিশিং',
      subtitle: 'ঘরের মাপ ও পছন্দের রঙে কারিগরের সাথে কথা বলে তৈরির সুযোগ',
    },
    {
      icon: Clock,
      title: 'সরাসরি দ্রুত ডেলিভারি',
      subtitle: 'ঢাকার ভেতরে ১-২ দিনে এবং বাইরে ৩-৫ দিনে সরাসরি ডেলিভারি',
    },
  ];

  return (
    <section className="bg-[#FAF8F5] py-8 sm:py-10 border-y border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs hover:border-[#8A5A3B]/40 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-[#F4ECE1] text-[#8A5A3B] shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#2B1D14] text-sm sm:text-base leading-snug">
                    {b.title}
                  </h3>
                  <p className="font-bn text-stone-600 text-xs mt-1 leading-relaxed">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
