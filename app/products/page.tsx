import React from 'react';
import Link from 'next/link';
import { Layers, Search, Filter, ShoppingBag } from 'lucide-react';
import { getCategories, getProducts, getSiteSettings } from '@/lib/data';
import { ProductCard } from '@/components/storefront/ProductCard';

export const revalidate = 3600;

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search, sort } = await searchParams;

  const [categories, allProducts, settings] = await Promise.all([
    getCategories(),
    getProducts(),
    getSiteSettings(),
  ]);

  let filtered = [...allProducts];

  // Filter by category
  if (category) {
    const selectedCategory = categories.find((c) => c.slug === category);
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory.id);
    }
  }

  // Filter by search keyword
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.title_bn.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // Sort
  if (sort === 'price_asc') {
    filtered.sort((a, b) => {
      const priceA = a.discount_price ?? a.price;
      const priceB = b.discount_price ?? b.price;
      return priceA - priceB;
    });
  } else if (sort === 'price_desc') {
    filtered.sort((a, b) => {
      const priceA = a.discount_price ?? a.price;
      const priceB = b.discount_price ?? b.price;
      return priceB - priceA;
    });
  }

  const currentCategory = categories.find((c) => c.slug === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#1C1917] rounded-3xl p-5 sm:p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#8B5A2B] text-white px-3 py-1 rounded-full text-xs font-bn font-bold">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
            <span>সরাসরি কারখানা ক্যাটালগ</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-bn text-white">
            {currentCategory ? currentCategory.name_bn : 'সকল ফার্নিচার কালেকশন'}
          </h1>
          <p className="text-stone-300 font-bn text-xs sm:text-sm max-w-xl">
            উন্নত মেলামাইন বোর্ড দিয়ে নিজস্ব কারখানায় প্রস্তুত। শোরুমের অতিরিক্ত খরচ ছাড়া সরাসরি
            কারখানা রেটে কেনাকাটা করুন।
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <span className="font-sans text-2xl sm:text-3xl font-extrabold text-amber-400">
            {filtered.length}
          </span>
          <span className="text-stone-400 font-bn text-xs block">টি প্রোডাক্ট উপলব্ধ</span>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-stone-200">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-none">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-full text-xs font-bn font-semibold whitespace-nowrap transition-all ${
              !category
                ? 'bg-[#8B5A2B] text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            সবগুলো ({allProducts.length})
          </Link>
          {categories.map((cat) => {
            const isSelected = category === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}${search ? `&search=${search}` : ''}`}
                className={`px-4 py-2 rounded-full text-xs font-bn font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#8B5A2B] text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat.name_bn || cat.name}
              </Link>
            );
          })}
        </div>

        {/* Search & Sort Active indicator */}
        {search && (
          <div className="text-xs font-bn text-stone-500 flex items-center gap-2 shrink-0">
            <span>সার্চ ফলাফল: &quot;{search}&quot;</span>
            <Link href="/products" className="text-rose-600 font-bold hover:underline">
              [রিসেট]
            </Link>
          </div>
        )}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bn font-bold text-stone-800">
            কোনো ফার্নিচার খুঁজে পাওয়া যায়নি
          </h3>
          <p className="text-sm font-bn text-stone-500 max-w-md mx-auto">
            অন্য কোনো কী-ওয়ার্ড দিয়ে সার্চ করুন অথবা সকল ফার্নিচার দেখুন।
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#8B5A2B] text-white px-6 py-2.5 rounded-full text-xs font-bn font-semibold"
          >
            সকল ফার্নিচার দেখুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              whatsappNumber={settings.whatsapp_number}
            />
          ))}
        </div>
      )}
    </div>
  );
}
