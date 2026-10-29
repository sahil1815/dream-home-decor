'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Zap, Check, MessageCircle, Ruler } from 'lucide-react';
import { Product } from '@/types/database';
import { formatBDT, getDiscountPercentage, buildWhatsAppUrl } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { useCart } from '@/context/cart-context';

interface ProductCardProps {
  product: Product;
  whatsappNumber?: string;
}

export function ProductCard({ product, whatsappNumber = '8801712345678' }: ProductCardProps) {
  const { addToCart, openQuickOrder } = useCart();

  const primaryImage =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80';

  const secondaryImage = product.images?.[1] || primaryImage;

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
    <div className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 hover:border-amber-700/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-4/3 sm:aspect-square bg-stone-100 overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block w-full h-full">
            <Image
              src={getOptimizedImageUrl(primaryImage, 600)}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Discount Pill */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow-xs font-sans tracking-tight">
              -{discountPercent}% ছাড়
            </div>
          )}

          {/* Stock Status Badge */}
          <div className="absolute top-2.5 right-2.5">
            {isOutOfStock ? (
              <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bn px-2 py-0.5 rounded-full">
                স্টক আউট
              </span>
            ) : isMadeToOrder ? (
              <span className="bg-amber-600/90 backdrop-blur-xs text-white text-[11px] font-bn px-2 py-0.5 rounded-full font-medium">
                অর্ডারে তৈরি
              </span>
            ) : (
              <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bn px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Check className="w-2.5 h-2.5" />
                <span>রেডি স্টক</span>
              </span>
            )}
          </div>

          {/* Dimensions tag */}
          {product.dimensions && (
            <div className="absolute bottom-2 left-2 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-sans">
              <Ruler className="w-2.5 h-2.5 text-amber-300" />
              <span>{product.dimensions}</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-2">
          {/* Material note */}
          {product.material && (
            <p className="text-[11px] text-stone-500 font-bn truncate">
              {product.material}
            </p>
          )}

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-bn font-bold text-stone-900 text-base leading-snug line-clamp-2 hover:text-[#8B5A2B] transition-colors">
              {product.title_bn || product.title}
            </h3>
            <p className="text-xs text-stone-400 font-sans truncate mt-0.5">
              {product.title}
            </p>
          </Link>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg sm:text-xl font-extrabold text-[#8B5A2B] font-sans">
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

      {/* Action Buttons (F-Commerce Conversion Focused) */}
      <div className="p-4 pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Quick Order Button */}
          <button
            type="button"
            onClick={() => openQuickOrder(product)}
            className="flex items-center justify-center gap-1 bg-[#8B5A2B] hover:bg-[#6D431F] text-white py-2 px-3 rounded-xl font-bn font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>দ্রুত অর্ডার</span>
          </button>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 px-3 rounded-xl font-bn font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-stone-600" />
            <span>কার্টে যোগ</span>
          </button>
        </div>

        {/* WhatsApp Fast Inquiry */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-lg text-[11px] font-bn font-medium transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>হোয়াটসঅ্যাপে অর্ডার করুন</span>
        </a>
      </div>
    </div>
  );
}
