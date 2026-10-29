import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit, Trash2, Check, ExternalLink, Package } from 'lucide-react';
import { getProducts, getCategories } from '@/lib/data';
import { formatBDT } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-bn text-stone-900">
            ফার্নিচার ও প্রোডাক্ট ক্যাটালগ
          </h1>
          <p className="text-xs font-bn text-stone-500">
            মোট ফার্নিচার সংখ্যা: {products.length} টি
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-4 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন ফার্নিচার যোগ করুন</span>
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bn">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">ছবি</th>
                <th className="py-3.5 px-4">পণ্যের নাম</th>
                <th className="py-3.5 px-4">ক্যাটাগরি</th>
                <th className="py-3.5 px-4">মূল্য (কারখানা রেট)</th>
                <th className="py-3.5 px-4">স্টক স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {products.map((product) => {
                const img = product.images?.[0] || 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=150&q=80';
                const currentPrice = product.discount_price ?? product.price;

                return (
                  <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                        <Image
                          src={getOptimizedImageUrl(img, 120)}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-stone-900 text-sm">{product.title_bn || product.title}</p>
                      <p className="text-[11px] text-stone-400 font-sans">{product.title}</p>
                    </td>

                    <td className="py-3 px-4 text-stone-600">
                      {product.category?.name_bn || 'ফার্নিচার'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-sans font-extrabold text-sm text-[#8B5A2B]">
                        {formatBDT(currentPrice)}
                      </span>
                      {product.discount_price && (
                        <span className="text-[11px] text-stone-400 line-through font-sans block">
                          {formatBDT(product.price)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {product.stock_status === 'in_stock' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          রেডি স্টক
                        </span>
                      ) : product.stock_status === 'made_to_order' ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          অর্ডারে তৈরি
                        </span>
                      ) : (
                        <span className="bg-stone-100 text-stone-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          স্টক আউট
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                        title="স্টোরে দেখুন"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="inline-flex items-center gap-1 bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        <span>এডিট</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
