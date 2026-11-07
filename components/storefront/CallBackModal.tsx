'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, X, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { requestCallBackAction } from '@/lib/actions';
import { trackLead } from '@/lib/analytics';

interface CallBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
}

export function CallBackModal({ isOpen, onClose, productTitle }: CallBackModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('সকাল ১০টা - দুপুর ২টা');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?88)?(01[3-9]\d{8})$/.test(cleanPhone)) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await requestCallBackAction({
        name: name.trim(),
        phone: cleanPhone,
        preferredTime,
        productTitle: productTitle || undefined,
        note: note.trim() || undefined,
      });

      if (res.success) {
        setIsSuccess(true);
        trackLead('call_back_request');
      } else {
        setError(res.error || 'রিকোয়েস্ট পাঠানো যায়নি। আবার চেষ্টা করুন।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করা যায়নি। অনুগ্রহ করে সরাসরি হটলাইনে কল করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setNote('');
    setError('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto backdrop:bg-stone-900/60 backdrop:backdrop-blur-xs bg-transparent p-0 max-w-lg w-[95vw] rounded-3xl outline-none"
    >
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-[#8A5A3B]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-[#2B1D14]">
                কল ব্যাক রিকোয়েস্ট
              </h3>
              <p className="text-xs text-stone-600 font-bn">
                কারিগরের সাথে সরাসরি ফোনে কথা বলে বিস্তারিত জানুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-[#2B1D14] p-1.5 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-serif font-bold text-lg text-[#2B1D14]">
                রিকোয়েস্ট গৃহীত হয়েছে!
              </h4>
              <p className="text-stone-600 font-bn text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                ধন্যবাদ {name}। আমাদের কারিগর দল আপনার নির্বাচিত সময়ে ({preferredTime}){' '}
                <span className="font-semibold text-stone-900">{phone}</span> নম্বরে সরাসরি কল
                করবে।
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-6 py-2.5 rounded-xl font-bn text-sm font-semibold cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bn">
                {error}
              </div>
            )}

            {productTitle && (
              <div className="bg-[#F4ECE1] px-3.5 py-2 rounded-xl text-xs font-bn text-stone-700">
                <span className="text-stone-500">পণ্য: </span>
                <span className="font-semibold text-[#2B1D14]">{productTitle}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="cb-name" className="block text-xs font-bn font-semibold text-stone-700">
                আপনার নাম *
              </label>
              <input
                id="cb-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর হাসান"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm font-bn focus:outline-none focus:border-[#8A5A3B] focus:ring-1 focus:ring-[#8A5A3B]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cb-phone" className="block text-xs font-bn font-semibold text-stone-700">
                মোবাইল নম্বর *
              </label>
              <input
                id="cb-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm font-bn focus:outline-none focus:border-[#8A5A3B] focus:ring-1 focus:ring-[#8A5A3B]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cb-time" className="block text-xs font-bn font-semibold text-stone-700">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#8A5A3B]" />
                  <span>কল করার সুবিধাজনক সময়</span>
                </span>
              </label>
              <select
                id="cb-time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm font-bn focus:outline-none focus:border-[#8A5A3B] focus:ring-1 focus:ring-[#8A5A3B] cursor-pointer"
              >
                <option value="সকাল ১০টা - দুপুর ২টা">সকাল ১০টা - দুপুর ২টা</option>
                <option value="দুপুর ২টা - সন্ধ্যা ৬টা">দুপুর ২টা - সন্ধ্যা ৬টা</option>
                <option value="সন্ধ্যা ৬টা - রাত ৮টা">সন্ধ্যা ৬টা - রাত ৮টা</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cb-note" className="block text-xs font-bn font-semibold text-stone-700">
                কোনো নির্দিষ্ট প্রশ্ন (ঐচ্ছিক)
              </label>
              <textarea
                id="cb-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: পড়ার টেবিলের ড্রয়ারের মাপ পরিবর্তন করা যাবে কি না?"
                className="w-full px-3.5 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs sm:text-sm font-bn focus:outline-none focus:border-[#8A5A3B] focus:ring-1 focus:ring-[#8A5A3B] resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bn font-semibold text-stone-600 hover:text-stone-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] disabled:bg-stone-300 text-white px-6 py-2.5 rounded-xl font-bn text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>রিকোয়েস্ট পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <span>রিকোয়েস্ট পাঠান</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
