import React from 'react';
import { notFound } from 'next/navigation';
import { getCategories, getProducts } from '@/lib/data';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [allProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const product = allProducts.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProductForm initialProduct={product} categories={categories} />
    </div>
  );
}
