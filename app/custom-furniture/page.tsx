'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Hammer,
  Ruler,
  Palette,
  DollarSign,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { submitCustomFurnitureRequestAction } from '@/lib/actions';
import { buildWhatsAppUrl } from '@/lib/utils';

function CustomFurnitureContent() {
  const searchParams = useSearchParams();
  const refProduct = searchParams.get('ref') || '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [color, setColor] = useState('Walnut Brown (ওয়ালনাট ব্রাউন)');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState(
    refProduct ? `আমি "${refProduct}" মডেলের মতো কাস্টম সাইজে ফার্নিচার তৈরি করতে চাই।` : ''
  );
  const [referenceUrl, setReferenceUrl] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const colors = [
    'Walnut Brown (ওয়ালনাট ব্রাউন)',
    'Light Oak (লাইট ওক)',
    'Natural Teak (সেগুন ফিনিশ)',
    'Classic Pure White (সাদা)',
    'Charcoal Wenge (কালো / চারকোল)',
    'অন্যান্য পছন্দের কালার',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'error', text: 'অনুগ্রহ করে আপনার নাম প্রদান করুন' });
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?88)?(01[3-9]\d{8})$/.test(cleanPhone)) {
      setFeedback({ type: 'error', text: 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)' });
      return;
    }

    if (!description.trim()) {
      setFeedback({ type: 'error', text: 'ফার্নিচারের বিবরণ অথবা প্রয়োজনীয় ড্রয়ার/তাকের সংখ্যা লিখুন' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitCustomFurnitureRequestAction({
        customer_name: name.trim(),
        customer_phone: cleanPhone,
        dimensions: dimensions.trim() || undefined,
        color,
        budget: budget ? Number(budget) : undefined,
        description: referenceUrl ? `${description.trim()}\n[রেফারেন্স ছবি লিঙ্ক]: ${referenceUrl}` : description.trim(),
        website: websiteHoneypot,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message || 'আপনার কাস্টম ফার্নিচার রিকোয়েস্ট গৃহীত হয়েছে। শীঘ্রই কারিগর যোগাযোগ করবেন।',
        });
      } else {
        setFeedback({ type: 'error', text: res.error || 'রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'নেটওয়ার্ক সমস্যা, দয়া করে আবার চেষ্টা করুন' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const directWhatsappUrl = buildWhatsAppUrl(
    '8801712345678',
    `আসসালামু আলাইকুম ড্রিম হোম ডেকোর! আমি কাস্টম ফার্নিচার অর্ডার করতে চাই। ${
      dimensions ? `পরিমাপ: ${dimensions}, ` : ''
    }${refProduct ? `মডেল রেফারেন্স: ${refProduct}` : ''}`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
          <Hammer className="w-4 h-4 text-[#8A5A3B]" />
          <span>সরাসরি কারিগর সহায়তা • Custom Furniture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2B1D14]">
          আপনার ঘরের মাপে তৈরি কাস্টম ফার্নিচার
        </h1>
        <p className="text-stone-600 font-bn text-sm sm:text-base leading-relaxed">
          বাজারের রেডিমেড সাইজে জায়গা নষ্ট না করে নিজের ঘরের দৈর্ঘ্য ও প্রস্থ অনুযায়ী তৈরি করে নিন পড়ার টেবিল, বুকশেলফ কিংবা কাজের ডেস্ক।
        </p>
      </div>

      {feedback && feedback.type === 'success' ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2B1D14]">
            আপনার রিকোয়েস্ট সফলভাবে জমা হয়েছে!
          </h2>
          <p className="font-bn text-stone-600 text-sm max-w-lg mx-auto leading-relaxed">
            {feedback.text}
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href={directWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-2.5 rounded-xl font-bn font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp-এ দ্রুত কোটেশন চান?</span>
            </a>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#2B1D14] border border-[#E8E2D9] px-5 py-2.5 rounded-xl font-bn font-semibold text-xs sm:text-sm transition-colors"
            >
              ফার্নিচার ক্যাটালগে ফিরুন
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D9] shadow-xs space-y-8">
          {feedback && feedback.type === 'error' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bn rounded-2xl">
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="custom-website-field">Website</label>
              <input
                id="custom-website-field"
                type="text"
                name="website"
                value={websiteHoneypot}
                onChange={(e) => setWebsiteHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Step 1: Customer Contact Info */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-base text-[#2B1D14] border-b border-stone-100 pb-2">
                ১. যোগাযোগের তথ্য
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    ১১ ডিজিটের মোবাইল নাম্বার <span className="text-[#9F1239]">*</span>
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
              </div>
            </div>

            {/* Step 2: Dimensions & Color */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-base text-[#2B1D14] border-b border-stone-100 pb-2">
                ২. পরিমাপ ও পছন্দের কালার
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bn font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-[#8A5A3B]" />
                    <span>প্রয়োজনীয় পরিমাপ (দৈর্ঘ্য x প্রস্থ x উচ্চতা)</span>
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="যেমন: ৪ ফুট x ২ ফুট x ২.৫ ফুট"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                  />
                  <span className="text-[11px] text-stone-400 font-bn mt-0.5 block">
                    ফুট বা ইঞ্চিতে পরিমাপ লিখতে পারেন
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bn font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#8A5A3B]" />
                    <span>বোর্ড কালার ফিনিশ</span>
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B] cursor-pointer"
                  >
                    {colors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Budget & Details */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-base text-[#2B1D14] border-b border-stone-100 pb-2">
                ৩. ফার্নিচারের বিবরণ ও বাজেট
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bn font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#8A5A3B]" />
                    <span>আনুমানিক বাজেট (৳)</span>
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="যেমন: 5000"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-sans text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bn font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#8A5A3B]" />
                    <span>রেফারেন্স ছবি লিঙ্ক বা ড্রাইভ লিঙ্ক (ঐচ্ছিক)</span>
                  </label>
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    placeholder="https://drive.google.com/... বা ছবির লিঙ্ক"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-sans text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                  কী ধরনের টেবিল বা ফার্নিচার চান তার বিবরণ <span className="text-[#9F1239]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: ২টি ড্রয়ার থাকবে, ডানপাশে ল্যাপটপ রাখার খোপ এবং ক্যাবল হোল থাকতে হবে..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
                />
              </div>
            </div>

            {/* Submit & WhatsApp Shortcut */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] disabled:bg-stone-300 text-white px-8 py-3.5 rounded-xl font-bn font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>রিকোয়েস্ট পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>কাস্টম ফার্নিচার রিকোয়েস্ট পাঠান</span>
                  </>
                )}
              </button>

              <a
                href={directWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3.5 rounded-xl font-bn font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp-এ সরাসরি কথা বলুন</span>
              </a>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CustomFurniturePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#8A5A3B]" />
        </div>
      }
    >
      <CustomFurnitureContent />
    </Suspense>
  );
}
