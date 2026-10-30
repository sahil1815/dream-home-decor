'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { formatBDT, getDiscountPercentage } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';

export default function SavedPage() {
  const { wishlist, removeFromWishlist, totalSaved } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bn font-bold mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>আপনার পছন্দের ফার্নিচার তালিকা</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-bn text-[#1C1917]">
            সেভ করা পছন্দের পণ্যসমূহ
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm font-bn mt-1">
            পছন্দের ফার্নিচারগুলো এক জায়গায় সেভ করে রাখুন এবং সুবিধাজনক সময়ে অর্ডার করুন।
          </p>
        </div>

        {totalSaved > 0 && (
          <div className="text-sm font-bn text-stone-600 bg-stone-100 px-4 py-2 rounded-xl self-start sm:self-auto">
            মোট সেভ করা ফার্নিচার:{' '}
            <span className="font-bold text-[#8B5A2B]">{totalSaved} টি</span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16 px-4 space-y-5">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto shadow-xs border border-rose-100">
            <Heart className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-bn text-stone-900">
              আপনার সেভ করা তালিকা এখন খালি!
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm font-bn leading-relaxed">
              পণ্য দেখার সময় লাভ (Heart) আইকনে ক্লিক করে আপনার পছন্দের পড়ার টেবিল ও ফার্নিচার
              এখানে সংরক্ষণ করতে পারেন।
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-6 py-3 rounded-full text-sm font-bn font-bold shadow-md transition-all hover:scale-105"
          >
            <span>ফার্নিচার কালেকশন দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Saved Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((product) => {
            const currentPrice = product.discount_price ?? product.price;
            const originalPrice = product.discount_price ? product.price : null;
            const discountPercent = originalPrice
              ? getDiscountPercentage(originalPrice, currentPrice)
              : 0;

            const primaryImage =
              product.images?.[0] ||
              'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-4/3 sm:aspect-square bg-stone-100 overflow-hidden">
                    <Link href={`/products/${product.slug}`} className="block w-full h-full">
                      <Image
                        src={getOptimizedImageUrl(primaryImage, 600)}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Discount badge */}
                    {discountPercent > 0 && (
                      <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full font-sans">
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-500 hover:text-rose-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                      title="তালিকা থেকে সরান"
                      aria-label="সেভ তালিকা থেকে মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-3.5 sm:p-4 space-y-2">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-bn font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#8B5A2B] transition-colors line-clamp-1">
                        {product.title_bn || product.title}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base sm:text-lg font-bold text-[#8B5A2B] font-sans">
                        {formatBDT(currentPrice)}
                      </span>
                      {originalPrice && (
                        <span className="text-xs text-stone-400 line-through font-sans">
                          {formatBDT(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3.5 sm:p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] text-white py-2.5 px-3 rounded-xl font-bn font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>কার্টে যোগ করুন</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
