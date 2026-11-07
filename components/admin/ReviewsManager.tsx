'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Review, Product } from '@/types/database';
import { toggleReviewApprovalAction, deleteReviewAction } from '@/lib/actions';
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ReviewsManagerProps {
  initialReviews: Review[];
  products: Product[];
}

export function ReviewsManager({ initialReviews, products }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const approvedCount = reviews.filter((r) => r.is_approved).length;

  const handleToggleApproval = (review: Review) => {
    const nextState = !review.is_approved;
    startTransition(async () => {
      const res = await toggleReviewApprovalAction(review.id, nextState);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, is_approved: nextState } : r))
        );
        showToast(res.message || 'রিভিউ স্ট্যাটাস আপডেট হয়েছে', 'success');
      } else {
        showToast(res.error || 'ব্যর্থ হয়েছে', 'error');
      }
    });
  };

  const handleDelete = (reviewId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই রিভিউটি মুছে ফেলতে চান?')) return;

    startTransition(async () => {
      const res = await deleteReviewAction(reviewId);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        showToast(res.message || 'রিভিউ মুছে ফেলা হয়েছে', 'success');
      } else {
        showToast(res.error || 'ব্যর্থ হয়েছে', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-bn flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-[#8B5A2B]" />
          <span>গ্রাহক রিভিউ ও প্রশংসাপত্র মডারেশন</span>
        </h1>
        <p className="text-xs sm:text-sm font-bn text-stone-600 mt-1">
          স্টোরফ্রন্টে প্রদর্শনের পূর্বে কাস্টমার রিভিউ যাচাই, অ্যাপ্রুভ এবং স্প্যাম ফিল্টারিং।
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">অনুমোদন অপেক্ষমাণ</span>
            <span className="text-xl font-bold font-sans text-amber-700">{pendingCount} টি</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">প্রকাশিত রিভিউ</span>
            <span className="text-xl font-bold font-sans text-emerald-700">{approvedCount} টি</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#8B5A2B]" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">গড় রেটিং</span>
            <span className="text-xl font-bold font-sans text-stone-900">
              {reviews.length > 0
                ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                : '৫.০'}{' '}
              ★
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bn text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-[#8B5A2B] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          সবগুলো ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl font-bn text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          অপেক্ষমাণ ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3.5 py-1.5 rounded-xl font-bn text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            filter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          অনুমোদিত ({approvedCount})
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 font-bn">
            <MessageSquare className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p>কোনো রিভিউ পাওয়া যায়নি।</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const product = productMap.get(review.product_id);

            return (
              <div
                key={review.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  review.is_approved
                    ? 'border-emerald-200 bg-white'
                    : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                <div>
                  {/* Top Bar: Customer & Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-stone-900 font-bn text-sm sm:text-base">
                        {review.customer_name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-stone-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-sans text-stone-500 ml-1">
                          ({review.rating}/5)
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bn font-semibold border ${
                        review.is_approved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {review.is_approved ? 'সাইটে প্রদর্শিত' : 'অপেক্ষমাণ'}
                    </span>
                  </div>

                  {/* Product Tag */}
                  {product && (
                    <div className="mt-2.5 text-xs text-[#8B5A2B] font-bn font-semibold flex items-center gap-1">
                      <span>পণ্য:</span>
                      <span className="text-stone-700">{product.title}</span>
                    </div>
                  )}

                  {/* Review Text */}
                  <div className="mt-3 text-stone-700 font-bn text-sm leading-relaxed bg-stone-50/70 p-3 rounded-xl border border-stone-100">
                    &quot;{review.review_text}&quot;
                  </div>

                  {/* Review Photos if any */}
                  {review.customer_photos && review.customer_photos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {review.customer_photos.map((photo, pIdx) => (
                        <Image
                          key={pIdx}
                          src={photo}
                          alt="Customer feedback"
                          width={64}
                          height={64}
                          unoptimized
                          className="w-16 h-16 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-sans text-stone-400">
                    {new Date(review.created_at).toLocaleDateString('bn-BD')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleApproval(review)}
                      className={`px-3 py-1.5 rounded-xl font-bn text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        review.is_approved
                          ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      }`}
                    >
                      {review.is_approved ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>হাইড করুন</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>অ্যাপ্রুভ করুন</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(review.id)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
