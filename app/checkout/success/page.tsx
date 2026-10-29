'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Printer,
  PackageCheck,
  Phone,
  Home,
  MessageCircle,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { formatBDT } from '@/lib/utils';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'DHD-1001';
  const name = searchParams.get('name') || 'সম্মানিত গ্রাহক';
  const total = searchParams.get('total') || '3920';
  const phone = searchParams.get('phone') || '';

  useEffect(() => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5A2B', '#D97706', '#16A34A', '#FAF8F5'],
      });
    } catch {
      // Ignore confetti errors
    }
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const whatsappMessage = `হ্যালো ড্রিম হোম ডেকোর, আমি অর্ডার #${orderNumber} কনফার্ম করেছি। ডেলিভারি সংক্রান্ত আপডেট জানতে চাই।`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-xl print-shadow-none text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bn font-semibold px-3 py-1 rounded-full inline-block">
            অর্ডার সফলভাবে গৃহীত হয়েছে
          </span>
          <h1 className="text-2xl sm:text-3xl font-bn font-extrabold text-stone-900">
            ধন্যবাদ, {name}!
          </h1>
          <p className="text-stone-500 font-bn text-sm max-w-lg mx-auto">
            আপনার অর্ডারটি ড্রিম হোম ডেকোর কারখানায় প্রক্রিয়াকরণ শুরু হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি
            কল করে ডেলিভারি সময় জানিয়ে দেবে।
          </p>
        </div>

        {/* Invoice Summary Box (Printable) */}
        <div className="p-6 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-200 gap-2">
            <div>
              <span className="text-xs text-stone-400 font-bn block">অর্ডার নাম্বার (Order ID):</span>
              <span className="font-sans font-extrabold text-xl text-[#8B5A2B] tracking-wide">
                {orderNumber}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-stone-400 font-bn block">মোট প্রদেয় মূল্য (ক্যাশ অন ডেলিভারি):</span>
              <span className="font-sans font-extrabold text-xl text-stone-900">
                {formatBDT(Number(total))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bn text-stone-600">
            <div>
              <span className="text-stone-400 block">গ্রাহকের নাম:</span>
              <span className="font-semibold text-stone-900 text-sm">{name}</span>
            </div>
            {phone && (
              <div>
                <span className="text-stone-400 block">মোবাইল নাম্বার:</span>
                <span className="font-sans font-semibold text-stone-900 text-sm">{phone}</span>
              </div>
            )}
            <div>
              <span className="text-stone-400 block">পেমেন্ট মেথড:</span>
              <span className="font-semibold text-stone-900">Cash on Delivery (ক্যাশ অন ডেলিভারি)</span>
            </div>
            <div>
              <span className="text-stone-400 block">কারখানা ও সাপোর্ট:</span>
              <span className="font-semibold text-stone-900">ড্রিম হোম ডেকোর, মিরপুর, ঢাকা</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 no-print">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-black text-white px-6 py-3 rounded-full text-xs sm:text-sm font-bn font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ইনভয়েস প্রিন্ট / ডাউনলোড করুন</span>
          </button>

          <Link
            href={`/track-order?query=${encodeURIComponent(orderNumber)}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-bn font-bold transition-colors"
          >
            <PackageCheck className="w-4 h-4" />
            <span>অর্ডারের বর্তমান অবস্থা ট্র্যাক করুন</span>
          </Link>
        </div>

        <div className="pt-2 no-print flex items-center justify-center gap-4 text-xs font-bn text-stone-500">
          <a
            href={`https://wa.me/8801712345678?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-700 hover:underline font-semibold"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp-এ যোগাযোগ করুন</span>
          </a>
          <span>•</span>
          <Link href="/" className="hover:text-stone-900 transition-colors">
            হোম পেজে ফিরুন
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center font-bn">
          অর্ডার লোড হচ্ছে...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
