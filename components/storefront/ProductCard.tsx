'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Zap, MessageCircle, Ruler, Heart, Camera } from 'lucide-react';
import { Product } from '@/types/database';
import { formatBDT, getDiscountPercentage, buildWhatsAppUrl } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

interface ProductCardProps {
  product: Product;
  whatsappNumber?: string;
  showPlaceholderTag?: boolean;
}

export function ProductCard({
  product,
  whatsappNumber = '8801712345678',
  showPlaceholderTag = true,
}: ProductCardProps) {
  const { addToCart, openQuickOrder } = useCart();
  const { isSaved, toggleWishlist } = useWishlist();
  const saved = isSaved(product.id);

  const primaryImage =
    product.images?.[0] ||
    '/placeholders/products/smart-ergonomic-reading-table/01.jpg';

  const secondaryImage = product.images?.[1] || primaryImage;

  const isPlaceholder = Boolean(
    showPlaceholderTag &&
    (product.has_placeholder_images ||
      primaryImage.startsWith('/placeholders/') ||
      primaryImage.includes('/placeholders/'))
  );

  const currentPrice = product.discount_price ?? product.price;
  const originalPrice = product.discount_price ? product.price : null;
  const discountPercent = originalPrice
    ? getDiscountPercentage(originalPrice, currentPrice)
    : 0;

  const isOutOfStock = product.stock_status === 'out_of_stock';
  const isMadeToOrder = product.stock_status === 'made_to_order';

  const whatsappMessage = `আসসালামু আলাইকুম, আমি "${product.title_bn || product.title}" (মূল্য: ${formatBDT(currentPrice)}) অর্ডার করতে চাই।`;
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, whatsappMessage);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#E8E2D9] hover:border-[#8A5A3B]/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-4/3 sm:aspect-square bg-[#FAF8F5] overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
            <Image
              src={getOptimizedImageUrl(primaryImage, 600)}
              alt={product.title_bn || product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-all duration-500 ${
                product.images?.[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'
              }`}
            />
            {product.images?.[1] && (
              <Image
                src={getOptimizedImageUrl(secondaryImage, 600)}
                alt={`${product.title_bn || product.title} - বিকল্প কোণ`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
            )}
          </Link>

          {/* Discount Pill */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-[#9F1239] text-white font-bold text-[11px] px-2 py-0.5 rounded-md shadow-xs font-sans tracking-tight">
              -{discountPercent}% ছাড়
            </div>
          )}

          {/* Sample Photo (নমুনা ছবি) Tag */}
          {isPlaceholder && (
            <div
              className={`absolute ${discountPercent > 0 ? 'top-9' : 'top-2.5'} left-2.5 bg-[#2B1D14]/85 backdrop-blur-xs text-[#FAF3E8] text-[10px] font-bn px-2 py-0.5 rounded-md border border-[#B08D57]/30 flex items-center gap-1 shadow-xs`}
              title="আসল পণ্যের ছবি শীঘ্রই যুক্ত হবে"
            >
              <Camera className="w-2.5 h-2.5 text-[#B08D57]" />
              <span>নমুনা ছবি</span>
            </div>
          )}

          {/* Stock or Lead Time Badge (Shown only when meaningful) */}
          <div className="absolute top-2.5 right-2.5">
            {isOutOfStock ? (
              <span className="bg-[#2B1D14]/90 backdrop-blur-xs text-white text-[11px] font-bn px-2 py-0.5 rounded-md">
                স্টক শেষ
              </span>
            ) : isMadeToOrder ? (
              <span className="bg-[#8A5A3B]/90 backdrop-blur-xs text-white text-[11px] font-bn px-2 py-0.5 rounded-md font-medium">
                অর্ডারে তৈরি
              </span>
            ) : product.lead_time_days ? (
              <span className="bg-[#2B1D14]/75 backdrop-blur-xs text-[#FAF3E8] text-[10px] font-bn px-2 py-0.5 rounded-md font-medium">
                ডেলিভারি {product.lead_time_days} দিনে
              </span>
            ) : null}
          </div>

          {/* Dimensions tag */}
          {product.dimensions && (
            <div className="absolute bottom-2 left-2 bg-[#2B1D14]/80 backdrop-blur-xs text-stone-200 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-sans border border-white/10">
              <Ruler className="w-2.5 h-2.5 text-[#B08D57]" />
              <span>{product.dimensions}</span>
            </div>
          )}

          {/* Wishlist / Save Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer ${
              saved
                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                : 'bg-white/90 text-stone-600 hover:text-rose-500 hover:bg-white'
            }`}
            aria-label={saved ? 'সেভ তালিকা থেকে মুছুন' : 'পছন্দে সেভ করুন'}
            title={saved ? 'Saved' : 'Save to wishlist'}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                saved ? 'fill-rose-500 stroke-rose-500' : 'stroke-[1.75]'
              }`}
            />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-1.5">
          {/* Material note */}
          {product.material && (
            <p className="text-[11px] text-stone-500 font-bn truncate">
              {product.material}
            </p>
          )}

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-serif font-bold text-[#2B1D14] text-sm sm:text-base leading-snug line-clamp-2 hover:text-[#8A5A3B] transition-colors">
              {product.title_bn || product.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-400 font-sans truncate mt-0.5">
              {product.title}
            </p>
          </Link>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-base sm:text-lg font-bold text-[#8A5A3B] font-sans">
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

      {/* Action Buttons */}
      <div className="p-4 pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Quick Order Button */}
          <button
            type="button"
            onClick={() => openQuickOrder(product)}
            className="flex items-center justify-center gap-1 bg-[#8A5A3B] hover:bg-[#6E442B] text-white py-2.5 px-3 rounded-xl font-bn font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200 shrink-0" />
            <span className="truncate">দ্রুত অর্ডার</span>
          </button>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="flex items-center justify-center gap-1 bg-[#FAF8F5] hover:bg-[#F4ECE1] text-[#2B1D14] border border-[#E8E2D9] hover:border-[#8A5A3B]/40 py-2.5 px-3 rounded-xl font-bn font-semibold text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px]"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-stone-600 shrink-0" />
            <span className="truncate">কার্টে যোগ</span>
          </button>
        </div>

        {/* WhatsApp Fast Inquiry */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 py-2 px-2.5 rounded-xl text-xs font-bn font-medium transition-colors border border-emerald-200/50 min-h-[40px]"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">হোয়াটসঅ্যাপে অর্ডার ও তথ্য</span>
        </a>
      </div>
    </div>
  );
}
