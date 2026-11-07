import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getProductBySlug, getProducts, getSiteSettings } from '@/lib/data';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';
import { ProductCard } from '@/components/storefront/ProductCard';

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

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
      title: 'ফার্নিচার পাওয়া যায়নি',
    };
  }

  const title = product.title_bn || product.title;
  const description =
    product.description ||
    'মিরপুর-১০ কারখানায় ১৬ মিমি উন্নত মেলামাইন বোর্ড ও ১ মিমি পিভিসি এজ ব্যান্ডিং দিয়ে তৈরি টেকসই ফার্নিচার। ক্যাশ অন ডেলিভারি।';
  const ogImage = product.images?.[0] || '/placeholders/site/hero.jpg';

  return {
    title: title,
    description: description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: `${title} | ফ্যাক্টরি মূল্য`,
      description: description,
      url: `/products/${slug}`,
      siteName: 'Dream Home Decor',
      locale: 'bn_BD',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - ড্রিম হোম ডেকোর`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Dream Home Decor`,
      description: description,
      images: [ogImage],
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

      {/* JSON-LD Schemas: Product & BreadcrumbList for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.title_bn || product.title,
              image: product.images || [],
              description: product.description,
              sku: product.id,
              brand: {
                '@type': 'Brand',
                name: 'Dream Home Decor',
              },
              offers: {
                '@type': 'Offer',
                url: `https://dream-home-decor.vercel.app/products/${product.slug}`,
                priceCurrency: 'BDT',
                price: product.discount_price ?? product.price,
                availability:
                  product.stock_status === 'out_of_stock'
                    ? 'https://schema.org/OutOfStock'
                    : 'https://schema.org/InStock',
                itemCondition: 'https://schema.org/NewCondition',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'হোম',
                  item: 'https://dream-home-decor.vercel.app',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'ফার্নিচার',
                  item: 'https://dream-home-decor.vercel.app/products',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: product.title_bn || product.title,
                  item: `https://dream-home-decor.vercel.app/products/${product.slug}`,
                },
              ],
            },
          ]),
        }}
      />

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
