'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Send,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/utils';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const whatsappUrl = buildWhatsAppUrl(
    '8801712345678',
    'আসসালামু আলাইকুম, আমি ড্রিম হোম ডেকোর ফার্নিচার সম্পর্কে যোগাযোগ করতে চাই।'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
          <MapPin className="w-4 h-4 text-[#8A5A3B]" />
          <span>মিরপুর-১০ কারখানা ও শোরুম</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          আমাদের সাথে যোগাযোগ করুন
        </h1>
        <p className="text-stone-600 font-bn text-sm sm:text-base leading-relaxed">
          যেকোনো সাধারণ জিজ্ঞাসা, বাল্ক অর্ডার কিংবা সরাসরি কারখানা পরিদর্শনে আমরা সর্বদা আপনার সহায়তায় প্রস্তুত।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Factory Contact Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-xs space-y-6">
            <h2 className="font-serif font-bold text-lg text-[#2B1D14] border-b border-stone-100 pb-3">
              কারখানা ও শোরুমের ঠিকানা
            </h2>

            <div className="space-y-4 text-xs sm:text-sm font-bn">
              <div className="flex items-start gap-3 text-stone-700">
                <MapPin className="w-5 h-5 text-[#8A5A3B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#2B1D14] block">ঠিকানা:</span>
                  <span className="leading-relaxed">
                    সেকশন ১০, ব্লক সি, রোড ২, মিরপুর, ঢাকা ১২১৬ (মিরপুর ১০ গোলচত্বর সংলগ্ন)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <Clock className="w-5 h-5 text-[#8A5A3B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#2B1D14] block">খোলা থাকার সময়সূচি:</span>
                  <span className="leading-relaxed">
                    প্রতিদিন সকাল ১০:০০ টা — রাত ৯:০০ টা<br />
                    (শুক্রবারসহ সপ্তাহের ৭ দিনই খোলা)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#2B1D14] block">হটলাইন কল:</span>
                  <a href="tel:01712-345678" className="font-sans font-bold text-emerald-800 hover:underline">
                    01712-345678
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#2B1D14] block">WhatsApp সাপোর্ট:</span>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-sans font-bold text-emerald-700 hover:underline">
                    +880 1712-345678
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 rounded-xl text-xs font-bn font-bold transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp মেসেজ</span>
              </a>

              <a
                href="https://maps.google.com/?q=Mirpur-10+Dhaka+Bangladesh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-[#2B1D14] py-2.5 rounded-xl text-xs font-bn font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>গুগল ম্যাপে দেখুন</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="font-serif font-bold text-lg text-[#2B1D14]">
              আমাদের কাছে মেসেজ পাঠান
            </h2>
            <p className="text-stone-500 font-bn text-xs mt-0.5">
              যেকোনো জিজ্ঞাসা বা মতামত লিখে পাঠান, আমরা অতিসত্বর যোগাযোগ করব
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-emerald-950">
                আপনার মেসেজ পেয়েছি!
              </h3>
              <p className="font-bn text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                ধন্যবাদ। আমাদের প্রতিনিধি আপনার সাথে শীঘ্রই প্রদত্ত মোবাইল নাম্বারে যোগাযোগ করবে।
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bn font-semibold text-emerald-700 underline"
              >
                আরেকটি মেসেজ পাঠান
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  আপনার নাম <span className="text-[#9F1239]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  মোবাইল নাম্বার <span className="text-[#9F1239]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-sans text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  আপনার জিজ্ঞাসা বা মেসেজ <span className="text-[#9F1239]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনি কোন মডেলটি খুঁজছেন অথবা কী জানতে চান তা বিস্তারিত লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-7 py-3 rounded-xl font-bn font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>মেসেজ পাঠান</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
