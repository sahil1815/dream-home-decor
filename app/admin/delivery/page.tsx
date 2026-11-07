import React from 'react';
import { getDeliveryZones } from '@/lib/data';
import { DeliveryZoneManager } from '@/components/admin/DeliveryZoneManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ডেলিভারি চার্জ ও জোন | Dream Home Decor Admin',
  description: 'ঢাকার ভেতরে ও বাইরে কুরিয়ার চার্জ এবং লিড টাইম কনফিগারেশন',
};

export default async function AdminDeliveryPage() {
  const zones = await getDeliveryZones();

  return <DeliveryZoneManager initialZones={zones} />;
}
