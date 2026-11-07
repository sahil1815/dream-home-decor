'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Phone,
  MessageCircle,
  DollarSign,
  Ruler,
  Palette,
} from 'lucide-react';
import { CustomFurnitureRequest } from '@/types/database';
import { formatBDT, buildWhatsAppUrl } from '@/lib/utils';
import { updateCustomRequestAction } from '@/lib/actions';

interface CustomOrdersManagerProps {
  initialRequests: CustomFurnitureRequest[];
}

export function CustomOrdersManager({ initialRequests }: CustomOrdersManagerProps) {
  const [requests, setRequests] = useState<CustomFurnitureRequest[]>(initialRequests);
  const [selectedReq, setSelectedReq] = useState<CustomFurnitureRequest | null>(null);

  const [quoteAmount, setQuoteAmount] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const openQuoteModal = (req: CustomFurnitureRequest) => {
    setSelectedReq(req);
    setQuoteAmount(req.quoted_price?.toString() || req.budget?.toString() || '');
    setStaffNotes(req.staff_notes || '');
  };

  const handleSaveQuote = async (status: 'new' | 'quoted' | 'accepted' | 'rejected') => {
    if (!selectedReq) return;
    setIsUpdating(true);
    try {
      const res = await updateCustomRequestAction(
        selectedReq.id,
        status,
        quoteAmount ? Number(quoteAmount) : undefined,
        staffNotes.trim() || undefined
      );

      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedReq.id
              ? {
                  ...r,
                  status,
                  quoted_price: quoteAmount ? Number(quoteAmount) : r.quoted_price,
                  staff_notes: staffNotes.trim() || r.staff_notes,
                }
              : r
          )
        );
        setSelectedReq(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#8B5A2B]" />
            <span>কাস্টম ফার্নিচার রিকোয়েস্ট ইনবক্স</span>
          </h1>
          <p className="text-xs font-bn text-stone-500 mt-0.5">
            গ্রাহকদের নিজস্ব সাইজ ও পছন্দের ডিজাইনে ফার্নিচার তৈরির আবেদন ও কোটেশন ম্যানেজমেন্ট
          </p>
        </div>

        <div className="text-xs font-bn bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl font-bold self-start sm:self-auto">
          মোট রিকোয়েস্ট: {requests.length} টি
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((req) => {
          const waMsg = `আসসালামু আলাইকুম ${req.customer_name}, আপনার ড্রিম হোম ডেকোরে পাঠানো কাস্টম ফার্নিচার ডিজাইনের কোটেশন মূল্য: ${
            req.quoted_price ? formatBDT(req.quoted_price) : 'আলোচনা সাপেক্ষ'
          }। মাপ: ${req.dimensions || 'কাস্টম'}।`;

          return (
            <div
              key={req.id}
              className="p-5 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bn font-bold text-base text-stone-900">
                      {req.customer_name}
                    </h3>
                    <p className="text-stone-500 font-sans text-xs">{req.customer_phone}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bn font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      req.status === 'new'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : req.status === 'quoted'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : req.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {req.status === 'new'
                      ? 'নতুন আবেদন'
                      : req.status === 'quoted'
                      ? 'কোটেশন পাঠানো হয়েছে'
                      : req.status === 'accepted'
                      ? 'গ্রাহক গ্রহণ করেছেন'
                      : 'বাতিল'}
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 space-y-2 text-xs font-bn text-stone-700">
                  {req.dimensions && (
                    <div className="flex items-center gap-2">
                      <Ruler className="w-3.5 h-3.5 text-[#8B5A2B]" />
                      <span>মাপ: {req.dimensions}</span>
                    </div>
                  )}
                  {req.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-[#8B5A2B]" />
                      <span>কালার: {req.color}</span>
                    </div>
                  )}
                  {req.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-[#8B5A2B]" />
                      <span>গ্রাহকের বাজেট: {formatBDT(req.budget)}</span>
                    </div>
                  )}
                  {req.description && (
                    <p className="text-stone-800 pt-1 leading-relaxed border-t border-stone-200">
                      &quot;{req.description}&quot;
                    </p>
                  )}
                </div>

                {req.quoted_price && (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bn text-emerald-900 flex justify-between items-center font-bold">
                    <span>প্রস্তাবিত কারখানা কোটেশন:</span>
                    <span className="font-sans text-sm">{formatBDT(req.quoted_price)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${req.customer_phone}`}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700"
                    title="কল দিন"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={buildWhatsAppUrl(req.customer_phone, waMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366]"
                    title="WhatsApp কোটেশন মেসেজ"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => openQuoteModal(req)}
                  className="px-4 py-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white rounded-xl text-xs font-bn font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  কোটেশন দিন / আপডেট
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quote Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-bn font-bold text-base text-stone-900">
                কোটেশন মূল্য নির্ধারণ ও নোট
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-bn">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  কারখানা কোটেশন মূল্য (৳ BDT):
                </label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="যেমন: 7500"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  কারিগর ও স্টাফ নোট (Internal):
                </label>
                <textarea
                  rows={3}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="বোর্ড কোয়ালিটি, চ্যানেল ফিটিংস এবং লিড-টাইম নোট লিখুন..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuote('quoted')}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                >
                  কোটেশন পাঠানো মার্ক করুন
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuote('accepted')}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                >
                  গৃহীত (Accepted)
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSaveQuote('rejected')}
                disabled={isUpdating}
                className="w-full py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold"
              >
                বাতিল করুন (Reject)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
