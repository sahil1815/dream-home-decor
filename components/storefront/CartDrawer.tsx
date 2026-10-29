'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatBDT } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';

export function CartDrawer() {
  const { isCartOpen, closeCart, cart, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#1C1917] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-bn font-bold text-lg text-white">
                আপনার শপিং কার্ট ({totalItems})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bn font-bold text-stone-800 text-base">
                    আপনার কার্ট এখন খালি!
                  </h3>
                  <p className="font-bn text-stone-500 text-xs">
                    পছন্দের ফার্নিচার নির্বাচন করে কার্টে যোগ করুন
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-5 py-2.5 rounded-full text-xs font-bn font-semibold transition-colors"
                >
                  ফার্নিচার কালেকশন দেখুন
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const price = item.product.discount_price ?? item.product.price;
                const image =
                  item.product.images?.[0] ||
                  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=200&q=80';

                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor}`}
                    className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex gap-3 items-center justify-between"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                      <Image
                        src={getOptimizedImageUrl(image, 150)}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bn font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {item.product.title_bn || item.product.title}
                      </h4>
                      {item.selectedColor && (
                        <p className="text-[11px] text-stone-500 font-bn">
                          কালার: {item.selectedColor}
                        </p>
                      )}
                      <p className="text-xs font-sans font-bold text-[#8B5A2B] mt-0.5">
                        {formatBDT(price)}
                      </p>
                    </div>

                    {/* Quantity & Delete */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                        className="text-stone-400 hover:text-rose-600 transition-colors"
                        aria-label="পণ্য মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.selectedColor
                            )
                          }
                          className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.selectedColor
                            )
                          }
                          className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-sm font-bn">
                <span className="text-stone-600">পণ্য সাবটোটাল:</span>
                <span className="text-lg font-bold font-sans text-stone-900">
                  {formatBDT(subtotal)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bn text-stone-500 bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ডেলিভারি চার্জ পরবর্তী ধাপে যুক্ত হবে। সারাদেশে ক্যাশ অন ডেলিভারি।</span>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white py-3.5 rounded-2xl font-bn font-bold text-base shadow-lg transition-all"
              >
                <span>অর্ডার সম্পন্ন করুন (চেকআউট)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
