import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getProductBySlug, getProducts, getSiteSettings } from '@/lib/data';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';
import { ProductCard } from '@/components/storefront/ProductCard';

export const revalidate = 3600;

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'ফার্নিচার পাওয়া যায়নি | Dream Home Decor',
    };
  }

  return {
    title: `${product.title_bn || product.title} | Dream Home Decor`,
    description: product.description || 'ড্রিম হোম ডেকোর - সরাসরি নিজস্ব কারখানায় তৈরি মেলামাইন ফার্নিচার।',
    openGraph: {
      title: `${product.title_bn || product.title} - কারখানা মূল্য`,
      description: product.description || 'সেরা মেলামাইন বোর্ড ফার্নিচার সরাসরি নিজস্ব কারখানায় তৈরি।',
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  const [product, settings, allProducts] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
    getProducts({ limit: 8 }),
  ]);

  if (!product) {
    notFound();
  }

  // Related products from same category or exclude current product
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bn text-stone-500">
        <Link href="/" className="hover:text-stone-900 transition-colors">
          হোম
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-stone-900 transition-colors">
          ফার্নিচার
        </Link>
        <span>/</span>
        <span className="text-stone-800 font-semibold truncate max-w-xs">
          {product.title_bn || product.title}
        </span>
      </div>

      {/* Main Interactive Product Detail */}
      <ProductDetailClient product={product} settings={settings} />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-stone-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bn font-bold text-[#8B5A2B]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>আরও পছন্দ হতে পারে</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bn font-bold text-stone-900 mt-1">
                সম্পর্কিত ফার্নিচার কালেকশন
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bn font-semibold text-[#8B5A2B] hover:text-[#6D431F]"
            >
              সবগুলো দেখুন →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relProduct) => (
              <ProductCard
                key={relProduct.id}
                product={relProduct}
                whatsappNumber={settings.whatsapp_number}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
