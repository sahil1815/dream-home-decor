'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, MessageCircle, Phone } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/utils';

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const faqGroups = [
    {
      category: 'অর্ডার ও ডেলিভারি',
      items: [
        {
          q: 'আমি কীভাবে অর্ডার করব?',
          a: 'পছন্দের ফার্নিচার সিলেক্ট করে "এখনই কিনুন" বা "কার্টে যোগ করুন" বাটনে ক্লিক করে আপনার নাম, সচল মোবাইল নম্বর ও সম্পূর্ণ ঠিকানা প্রদান করলেই অর্ডার সম্পন্ন হবে। কোনো অ্যাকাউন্ট খোলার প্রয়োজন নেই।',
        },
        {
          q: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
          a: 'ঢাকার মেট্রো এলাকায় সাধারণত ১ থেকে ২ কর্মদিবসে এবং ঢাকার বাইরে সারা বাংলাদেশে ৩ থেকে ৫ কর্মদিবসের মধ্যে কুরিয়ারের মাধ্যমে সুরক্ষিত হোম ডেলিভারি করা হয়।',
        },
        {
          q: 'ডেলিভারি চার্জ কত?',
          a: 'ঢাকার ভেতরের ঠিকানায় হোম ডেলিভারি চার্জ ৳১২০ এবং ঢাকার বাইরে সারা বাংলাদেশে কুরিয়ার চার্জ ৳২০০।',
        },
        {
          q: 'ডেলিভারির সময় কি ফার্নিচার খুলে দেখে নেওয়া যাবে?',
          a: 'হ্যাঁ, এটি আমাদের কারখানার প্রধান প্রতিশ্রুতি। ডেলিভারিম্যানের সামনে সম্পূর্ণ প্যাকেট খুলে ফার্নিচারের ফিনিশিং, বোর্ড ও কালার দেখে নেওয়ার পূর্ণ সুযোগ পাবেন। পুরোপুরি সন্তুষ্ট হয়ে তবেই মূল্য পরিশোধ করবেন।',
        },
      ],
    },
    {
      category: 'ফার্নিচারের বোর্ড ও নির্মাণ মান',
      items: [
        {
          q: 'ফার্নিচারে কী ধরনের বোর্ড ব্যবহার করা হয়?',
          a: 'আমরা প্রিমিয়াম ১৬ মিমি ডেনসিটি ওয়াটারপ্রুফ মেলামাইন বোর্ড ব্যবহার করি। এটি সাধারণ কাঠের চেয়ে মসৃণ এবং স্ক্র্যাচ ও ঘুণপোকা প্রতিরোধী।',
        },
        {
          q: 'বোর্ডে পানি লাগলে কি নষ্ট হয়ে যাবে?',
          a: 'আমাদের প্রতিটি কাটিং প্রান্তে উন্নত মেশিনের সাহায্যে ১ মিমি পুরু ওয়াটারপ্রুফ পিভিসি এজ ব্যান্ডিং লাগানো হয়। ফলে সাধারণ পানির ছিটা কিংবা ভেজা কাপড়ে মুছলে বোর্ডের কোনো ক্ষতি হয় না।',
        },
        {
          q: 'হার্ডওয়্যার ও স্ক্রু কি মরিচারোধী?',
          a: 'হ্যাঁ, আমরা প্রতিটি জয়েন্টে অ্যান্টি-রাস্ট হেভি ডিউটি হার্ডওয়্যার স্ক্রু ও চ্যানেল ব্যবহার করি, যা ভারী বই বা কম্পিউটার লোড সহজেই বহন করতে পারে।',
        },
      ],
    },
    {
      category: 'কাস্টমাইজেশন ও সাইজ পরিবর্তন',
      items: [
        {
          q: 'আমার ঘরের মাপ অনুযায়ী কি ফার্নিচার তৈরি করে দেবেন?',
          a: 'অবশ্যই। আমাদের মিরপুর-১০ এ নিজস্ব কারখানা থাকায় যেকোনো টেবিল, বুকশেলফ বা ড্রয়ারের দৈর্ঘ্য, প্রস্থ ও উচ্চতা আপনার প্রয়োজনমতো কাস্টমাইজ করে তৈরি করা সম্ভব।',
        },
        {
          q: 'কাস্টম অর্ডারের জন্য কীভাবে যোগাযোগ করব?',
          a: 'আমাদের সাইটের "কাস্টম ফার্নিচার" পেজের ফর্ম পূরণ করতে পারেন অথবা সরাসরি WhatsApp (+8801712345678) এ আপনার ঘরের মাপ ও পছন্দের কালার লিখে মেসেজ পাঠাতে পারেন।',
        },
      ],
    },
    {
      category: 'পেমেন্ট ও রিটার্ন পলিসি',
      items: [
        {
          q: 'পেমেন্ট করার নিয়ম কী?',
          a: 'সারাদেশে ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য। পণ্য হাতে পেয়ে দেখে তারপর ডেলিভারিম্যানকে টাকা পরিশোধ করবেন। চাইলে বিকাশ বা নগদেও অগ্রিম পেমেন্ট করতে পারেন।',
        },
        {
          q: 'পণ্য পছন্দ না হলে বা পরিবহনে ত্রুটি থাকলে কী করণীয়?',
          a: 'ডেলিভারির সময় কোনো ত্রুটি ধরা পড়লে ডেলিভারিম্যানের উপস্থিতিতে সরাসরি পণ্য ফেরত দেওয়া যাবে। এছাড়া পরিবহনে কোনো অংশ ক্ষতিগ্রস্ত হলে আমরা ৭ দিনের মধ্যে দ্রুততম সময়ে নতুন পার্টস বা রিপ্লেসমেন্ট সরবরাহ করি।',
        },
      ],
    },
  ];

  const filteredGroups = faqGroups
    .map((group) => {
      const filteredItems = group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.a.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);

  const whatsappUrl = buildWhatsAppUrl('8801712345678', 'আসসালামু আলাইকুম, ফার্নিচার সংক্রান্ত কিছু প্রশ্ন জানতে চাচ্ছি।');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqGroups.flatMap((group) =>
      group.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      }))
    ),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Schema.org FAQPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
          <HelpCircle className="w-4 h-4 text-[#8A5A3B]" />
          <span>সহায়তা কেন্দ্র ও সচরাচর জিজ্ঞাসা</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          সচরাচর জিজ্ঞাসিত প্রশ্নাবলি (FAQ)
        </h1>
        <p className="text-stone-600 font-bn text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          ফার্নিচারের বোর্ড, ডেলিভারি, কাস্টমাইজেশন ও পেমেন্ট সংক্রান্ত গ্রাহকদের নিয়মিত প্রশ্নের সহজ উত্তর
        </p>

        {/* Search input */}
        <div className="pt-4 max-w-lg mx-auto relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="যেকোনো প্রশ্ন লিখে খুঁজুন (যেমন: ডেলিভারি, বোর্ড, কাস্টম)..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-2xl text-xs sm:text-sm font-bn text-[#2B1D14] shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Grouped Accordions */}
      <div className="space-y-10">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E2D9] space-y-3">
            <p className="text-stone-700 font-bn text-sm font-semibold">
              &quot;{searchTerm}&quot; সম্পর্কিত কোনো প্রশ্ন খুঁজে পাওয়া যায়নি
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-bn font-bold text-[#8A5A3B] underline cursor-pointer"
            >
              সকল প্রশ্ন দেখুন
            </button>
          </div>
        ) : (
          filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <h2 className="text-lg font-serif font-bold text-[#2B1D14] pb-1 border-b border-[#E8E2D9]">
                {group.category}
              </h2>
              <div className="space-y-3">
                {group.items.map((item, iIdx) => (
                  <details
                    key={iIdx}
                    className="group bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-2xs open:border-[#8A5A3B]/40 transition-colors"
                  >
                    <summary className="flex items-center justify-between cursor-pointer font-serif font-bold text-[#2B1D14] text-sm sm:text-base list-none select-none">
                      <span>{item.q}</span>
                      <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
                    </summary>
                    <p className="mt-3 text-stone-600 font-bn text-xs sm:text-sm leading-relaxed border-t border-[#E8E2D9]/60 pt-3">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Still need help callout */}
      <div className="p-6 sm:p-8 bg-[#FAF8F5] rounded-3xl border border-[#E8E2D9] text-center space-y-4">
        <h3 className="font-serif font-bold text-lg text-[#2B1D14]">
          আপনার প্রশ্নের উত্তর খুঁজে পাননি?
        </h3>
        <p className="text-stone-600 font-bn text-xs sm:text-sm max-w-md mx-auto">
          আমাদের কারখানা প্রতিনিধির সাথে সরাসরি কথা বলুন অথবা WhatsApp-এ মেসেজ দিন।
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-2.5 rounded-xl text-xs font-bn font-bold transition-colors shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp সাপোর্ট</span>
          </a>
          <a
            href="tel:01712-345678"
            className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-[#2B1D14] border border-[#E8E2D9] px-5 py-2.5 rounded-xl text-xs font-bn font-semibold transition-colors shadow-2xs"
          >
            <Phone className="w-4 h-4 text-[#8A5A3B]" />
            <span>হটলাইন: 01712-345678</span>
          </a>
        </div>
      </div>
    </div>
  );
}
