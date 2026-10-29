import React from 'react';
import { Hammer, Truck, ShieldCheck, Headphones, Sparkles } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: Hammer,
      title: 'সরাসরি নিজস্ব কারখানা',
      subtitle: 'মাঝের কোনো দালাল বা অতিরিক্ত খরচ ছাড়া সাশ্রয়ী রেট',
      color: 'text-amber-700 bg-amber-100',
    },
    {
      icon: Truck,
      title: 'সারাদেশে ক্যাশ অন ডেলিভারি',
      subtitle: 'পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা',
      color: 'text-emerald-700 bg-emerald-100',
    },
    {
      icon: ShieldCheck,
      title: 'উন্নত মেলামাইন বোর্ড',
      subtitle: 'পানি ও স্ক্র্যাচ প্রতিরোধী, দীর্ঘস্থায়ী মজবুত ফিনিশিং',
      color: 'text-blue-700 bg-blue-100',
    },
    {
      icon: Headphones,
      title: '২৪/৭ কাস্টমার সাপোর্ট',
      subtitle: 'যেকোনো জিজ্ঞাসা বা কাস্টম অর্ডারে সার্বক্ষণিক সহায়তা',
      color: 'text-purple-700 bg-purple-100',
    },
  ];

  return (
    <section className="bg-white py-8 border-y border-stone-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-stone-50 transition-colors"
              >
                <div className={`p-3 rounded-xl shrink-0 ${b.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bn font-bold text-stone-900 text-sm sm:text-base leading-snug">
                    {b.title}
                  </h4>
                  <p className="font-bn text-stone-500 text-xs mt-1 leading-relaxed">
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
