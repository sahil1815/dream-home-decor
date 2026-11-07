import React from 'react';
import { getAllOrdersAdmin } from '@/lib/data';
import { ProductionTracker } from '@/components/admin/ProductionTracker';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'কারখানা প্রোডাকশন ট্র্যাকার | Dream Home Decor Admin',
  description: 'বোর্ড কাটিং, ফিটিং, ফিনিশিং ও প্যাকিং কানবান ট্র্যাকার',
};

export default async function AdminProductionPage() {
  const orders = await getAllOrdersAdmin({ limit: 100 });

  return <ProductionTracker initialOrders={orders} />;
}
