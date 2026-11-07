import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Truck, ShieldCheck, CheckCircle, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ডেলিভারি ও রিটার্ন পলিসি',
  description:
    'ড্রিম হোম ডেকোর ফার্নিচারের ডেলিভারি সময়সীমা, চার্জ, বাবল র‍্যাপ প্যাকেজিং এবং ৭ দিনের রিটার্ন ও পার্টস রিপ্লেসমেন্ট পলিসি।',
  alternates: {
    canonical: '/delivery-and-returns',
  },
  openGraph: {
    title: 'ডেলিভারি ও রিটার্ন পলিসি | Dream Home Decor',
    description: 'ডেলিভারিম্যানের সামনে চেক করে নেওয়ার সুযোগ, বাবল র‍্যাপ সুরক্ষা ও সহজ রিটার্ন পলিসি।',
    url: '/delivery-and-returns',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function DeliveryAndReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
          <Truck className="w-4 h-4 text-[#8A5A3B]" />
          <span>সারাদেশে ডেলিভারি ও গ্রাহক সুরক্ষা</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          ডেলিভারি ও রিটার্ন নীতিমালা
        </h1>
        <p className="text-stone-600 font-bn text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          আপনার অর্ডারকৃত ফার্নিচারটি নিরাপদে ও দ্রুততম সময়ে আপনার ঘরে পৌঁছানোর সম্পূর্ণ নির্দেশিকা
        </p>
      </div>

      {/* Delivery Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-[#E8E2D9] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4ECE1] text-[#8A5A3B] flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <h2 className="font-serif font-bold text-lg text-[#2B1D14]">
            ঢাকার ভেতরে হোম ডেলিভারি
          </h2>
          <div className="text-xs sm:text-sm font-bn text-stone-600 space-y-1.5">
            <p>• <strong>সময়সীমা:</strong> ১ থেকে ২ কর্মদিবস।</p>
            <p>• <strong>ডেলিভারি চার্জ:</strong> ৳১২০ (ফিক্সড)।</p>
            <p>• <strong>পদ্ধতি:</strong> সরাসরি আমাদের নিজস্ব প্রতিনিধি বা নির্ভরযোগ্য লোকাল কুরিয়ার দ্বারা হোম ডেলিভারি।</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#E8E2D9] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4ECE1] text-[#8A5A3B] flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <h2 className="font-serif font-bold text-lg text-[#2B1D14]">
            ঢাকার বাইরে সারা বাংলাদেশে ডেলিভারি
          </h2>
          <div className="text-xs sm:text-sm font-bn text-stone-600 space-y-1.5">
            <p>• <strong>সময়সীমা:</strong> ৩ থেকে ৫ কর্মদিবস।</p>
            <p>• <strong>কুরিয়ার চার্জ:</strong> ৳২০০ (ফিক্সড)।</p>
            <p>• <strong>পদ্ধতি:</strong> সুন্দরবন / স্টিডফাস্ট কুরিয়ারের মাধ্যমে জেলা বা উপজেলা পয়েন্টে সুরক্ষিত হোম ডেলিভারি।</p>
          </div>
        </div>
      </div>

      {/* Inspection & Protection Banner */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#E8E2D9] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <h2 className="font-serif font-bold text-lg text-[#2B1D14]">
            ডেলিভারির সময় খুলে দেখে নেওয়ার বিশেষ অধিকার
          </h2>
        </div>
        <p className="text-stone-700 font-bn text-xs sm:text-sm leading-relaxed">
          আমরা কোনো প্রকার লুকোচুরি সমর্থন করি না। ডেলিভারিম্যান আপনার ঠিকানায় ফার্নিচার নিয়ে গেলে তার উপস্থিতিতে বাবল র‍্যাপ খুলে বোর্ড, কাটিং, কালার ও ফিনিশিং সম্পূর্ণ যাচাই করে নিন। আপনি সন্তুষ্ট হলে তবেই নির্ধারিত মূল্য পরিশোধ করবেন।
        </p>
      </div>

      {/* Return & Replacement Policy Details */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-serif font-bold text-lg text-[#2B1D14]">
            রিটার্ন ও ৭ দিনের রিপ্লেসমেন্ট শর্তাবলি
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm font-bn text-stone-700 leading-relaxed">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>তাৎক্ষণিক রিটার্ন:</strong> ডেলিভারির সময় যদি পণ্যে কোনো ভাঙা, ফাটা বা বড় ধরনের ত্রুটি দেখতে পান, তবে কোনো চার্জ ছাড়াই ডেলিভারিম্যানের কাছে পণ্য ফেরত দিতে পারবেন।
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>৭ দিনের পার্টস রিপ্লেসমেন্ট:</strong> পরিবহনের কারণে কোনো ড্রয়ার স্লাইডার, হাতল বা ছোট স্ক্রু ক্ষতিগ্রস্ত হয়ে থাকলে পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে আমাদের জানালে আমরা সম্পূর্ণ ফ্রিতে নতুন পার্টস কুরিয়ার করব।
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>কাস্টম ফার্নিচার শর্ত:</strong> গ্রাহকের নির্দিষ্ট ঘরের মাপে তৈরি কাস্টম ফার্নিচার তৈরির পূর্বে বিস্তারিত নিশ্চিত করা হয়। কাস্টম অর্ডারে প্রস্তুতকৃত পণ্যে সাইজ সংক্রান্ত ভুল ছাড়া সাধারণ পছন্দ পরিবর্তনের কারণে রিটার্ন প্রযোজ্য নয়।
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bn text-stone-500">
            রিটার্ন বা রিপ্লেসমেন্ট সংক্রান্ত যেকোনো সহায়তায়:
          </span>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-[#8A5A3B] hover:bg-[#6E442B] text-white rounded-xl text-xs font-bn font-semibold transition-colors"
          >
            যোগাযোগ পেজ
          </Link>
        </div>
      </div>
    </div>
  );
}
