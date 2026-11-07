'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Product, Category } from '@/types/database';
import { ProductCard } from '@/components/storefront/ProductCard';

interface ProductCatalogClientProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  initialSearch?: string;
  initialSort?: string;
  whatsappNumber?: string;
}

export function ProductCatalogClient({
  products,
  categories,
  initialCategory = '',
  initialSearch = '',
  initialSort = 'newest',
  whatsappNumber,
}: ProductCatalogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortOption, setSortOption] = useState<string>(initialSort);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState<number>(12);

  // Extract all available colors from product collection
  const allColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.color_options?.forEach((c) => set.add(c));
    });
    return Array.from(set);
  }, [products]);

  // Filtered and sorted products calculation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Filter
    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) {
        result = result.filter((p) => p.category_id === cat.id);
      }
    }

    // 2. Search Keyword
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.title_bn.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.material && p.material.toLowerCase().includes(q))
      );
    }

    // 3. Price Bracket Filter
    if (selectedPriceRange !== 'all') {
      result = result.filter((p) => {
        const price = p.discount_price ?? p.price;
        if (selectedPriceRange === 'under-3000') return price < 3000;
        if (selectedPriceRange === '3000-5000') return price >= 3000 && price <= 5000;
        if (selectedPriceRange === 'above-5000') return price > 5000;
        return true;
      });
    }

    // 4. Color Filter
    if (selectedColor !== 'all') {
      result = result.filter((p) => p.color_options?.includes(selectedColor));
    }

    // 5. Sorting
    if (sortOption === 'price_asc') {
      result.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price));
    } else if (sortOption === 'price_desc') {
      result.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price));
    } else if (sortOption === 'name_asc') {
      result.sort((a, b) => (a.title_bn || a.title).localeCompare(b.title_bn || b.title, 'bn'));
    }

    return result;
  }, [products, categories, selectedCategory, searchQuery, selectedPriceRange, selectedColor, sortOption]);

  const hasActiveFilters = Boolean(
    selectedCategory ||
      searchQuery.trim() ||
      selectedPriceRange !== 'all' ||
      selectedColor !== 'all' ||
      sortOption !== 'newest'
  );

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSortOption('newest');
    setSelectedPriceRange('all');
    setSelectedColor('all');
    setDisplayCount(12);
  };

  const visibleProducts = filteredProducts.slice(0, displayCount);
  const currentCategoryObj = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Accessible Title */}
      <h1 className="sr-only">
        {currentCategoryObj ? currentCategoryObj.name_bn || currentCategoryObj.name : 'সকল ফার্নিচার কালেকশন'}
      </h1>

      {/* Search, Filter Triggers & Sort Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, ম্যাটেরিয়াল বা মডেল দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs sm:text-sm font-bn text-[#2B1D14] focus:outline-hidden focus:ring-2 focus:ring-[#8A5A3B]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              aria-label="সার্চ ক্লিয়ার করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls Cluster */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Mobile Filter Sheet Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-bn font-semibold text-[#2B1D14] hover:bg-[#F4ECE1] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#8A5A3B]" />
            <span>ফিল্টার ({hasActiveFilters ? 'সক্রিয়' : 'সব'})</span>
          </button>

          {/* Desktop Sort Dropdown */}
          <div className="flex items-center gap-2 bg-[#FAF8F5] px-3.5 py-1.5 rounded-xl border border-[#E8E2D9]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8A5A3B] shrink-0" />
            <span className="text-xs font-bn text-stone-500 hidden sm:inline">সাজান:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-xs font-bn font-semibold text-[#2B1D14] focus:outline-hidden cursor-pointer"
              aria-label="প্রোডাক্ট সাজান"
            >
              <option value="newest">সর্বশেষ সংযোজিত</option>
              <option value="price_asc">মূল্য: কম থেকে বেশি</option>
              <option value="price_desc">মূল্য: বেশি থেকে কম</option>
              <option value="name_asc">নাম অনুযায়ী (অ-ক্ষ)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bn font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              title="সকল ফিল্টার রিসেট করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Horizontal Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-xl text-xs font-bn font-semibold whitespace-nowrap transition-all cursor-pointer ${
            !selectedCategory
              ? 'bg-[#8A5A3B] text-white shadow-xs'
              : 'bg-white text-[#2B1D14] border border-[#E8E2D9] hover:bg-[#FAF8F5]'
          }`}
        >
          সবগুলো ফার্নিচার ({products.length})
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? '' : cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bn font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#8A5A3B] text-white shadow-xs'
                  : 'bg-white text-[#2B1D14] border border-[#E8E2D9] hover:bg-[#FAF8F5]'
              }`}
            >
              {cat.name_bn || cat.name}
            </button>
          );
        })}
      </div>

      {/* Desktop Inline Filters for Price & Color */}
      <div className="hidden lg:flex items-center justify-between gap-6 py-2 px-1 text-xs font-bn border-b border-[#E8E2D9]">
        {/* Price Range Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-stone-500 font-medium shrink-0">বাজেট সীমা:</span>
          {[
            { id: 'all', label: 'সকল মূল্য' },
            { id: 'under-3000', label: '৳৩,০০০ এর নিচে' },
            { id: '3000-5000', label: '৳৩,০০০ - ৳৫,০০০' },
            { id: 'above-5000', label: '৳৫,০০০ এর বেশি' },
          ].map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedPriceRange(tier.id)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedPriceRange === tier.id
                  ? 'bg-[#2B1D14] text-white font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Color Options */}
        {allColors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium shrink-0">কালার:</span>
            <button
              type="button"
              onClick={() => setSelectedColor('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedColor === 'all'
                  ? 'bg-[#2B1D14] text-white font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              সব
            </button>
            {allColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedColor === c
                    ? 'bg-[#8A5A3B] text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Products Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#E8E2D9] p-8 space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center mx-auto text-[#8A5A3B]">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-serif font-bold text-[#2B1D14]">
              কোনো ফার্নিচার খুঁজে পাওয়া যায়নি
            </h3>
            <p className="text-sm font-bn text-stone-600 max-w-md mx-auto leading-relaxed">
              আপনার নির্বাচিত ফিল্টার বা সার্চ কিওয়ার্ড অনুযায়ী কোনো ফার্নিচার মেলেনি। ফিল্টার রিসেট করে পুনরায় চেষ্টা করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white px-6 py-2.5 rounded-xl font-bn font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ফিল্টার রিসেট করুন</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsappNumber={whatsappNumber}
              />
            ))}
          </div>

          {/* Load More Button */}
          {visibleProducts.length < filteredProducts.length && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setDisplayCount((c) => c + 12)}
                className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#2B1D14] border border-[#E8E2D9] px-8 py-3 rounded-xl font-bn font-semibold text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <span>আরও ফার্নিচার দেখুন ({filteredProducts.length - visibleProducts.length} টি বাকি)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Sheet Filter Drawer */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Bottom Sheet Drawer */}
          <div className="fixed inset-x-0 bottom-0 bg-[#FAF8F5] rounded-t-3xl border-t border-[#E8E2D9] p-5 space-y-6 max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#8A5A3B]" />
                <h3 className="font-serif font-bold text-lg text-[#2B1D14]">
                  ফিল্টার ও সাজান
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                aria-label="ফিল্টার বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <label className="block text-xs font-bn font-bold text-[#2B1D14]">
                ক্যাটাগরি নির্বাচন
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`p-2 rounded-xl text-xs font-bn font-semibold text-left transition-colors ${
                    !selectedCategory
                      ? 'bg-[#8A5A3B] text-white'
                      : 'bg-white border border-[#E8E2D9] text-[#2B1D14]'
                  }`}
                >
                  সকল ফার্নিচার
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`p-2 rounded-xl text-xs font-bn font-semibold text-left transition-colors truncate ${
                      selectedCategory === c.slug
                        ? 'bg-[#8A5A3B] text-white'
                        : 'bg-white border border-[#E8E2D9] text-[#2B1D14]'
                    }`}
                  >
                    {c.name_bn || c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="block text-xs font-bn font-bold text-[#2B1D14]">
                বাজেট রেঞ্জ
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'সকল মূল্য' },
                  { id: 'under-3000', label: '৳৩,০০০ এর নিচে' },
                  { id: '3000-5000', label: '৳৩,০০০ - ৳৫,০০০' },
                  { id: 'above-5000', label: '৳৫,০০০ এর বেশি' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedPriceRange(tier.id)}
                    className={`p-2 rounded-xl text-xs font-bn font-semibold text-left transition-colors ${
                      selectedPriceRange === tier.id
                        ? 'bg-[#2B1D14] text-white'
                        : 'bg-white border border-[#E8E2D9] text-stone-700'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            {allColors.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bn font-bold text-[#2B1D14]">
                  পছন্দের রঙ
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedColor('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bn font-medium transition-colors ${
                      selectedColor === 'all'
                        ? 'bg-[#2B1D14] text-white'
                        : 'bg-white border border-[#E8E2D9] text-stone-700'
                    }`}
                  >
                    সকল রঙ
                  </button>
                  {allColors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bn font-medium transition-colors ${
                        selectedColor === col
                          ? 'bg-[#8A5A3B] text-white'
                          : 'bg-white border border-[#E8E2D9] text-stone-700'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apply & Reset Buttons */}
            <div className="pt-3 border-t border-[#E8E2D9] flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 bg-[#8A5A3B] hover:bg-[#6E442B] text-white py-3 rounded-xl font-bn font-bold text-sm shadow-xs transition-colors"
              >
                ফলাফল দেখুন ({filteredProducts.length} টি)
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-3 bg-stone-200 text-[#2B1D14] rounded-xl font-bn font-semibold text-sm transition-colors"
                >
                  রিসেট
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
