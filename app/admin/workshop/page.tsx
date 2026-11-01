import React from 'react';
import { getSiteSettings, getWorkshopData } from '@/lib/data';
import { WorkshopManager } from '@/components/admin/WorkshopManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ওয়ার্কশপ সেকশন এডিটর | Dream Home Decor Admin',
  description: 'হোমপেজের সরাসরি কারখানার অন্দরমহল সেকশন ম্যানেজমেন্ট ও এডিটর',
};

export default async function AdminWorkshopPage() {
  const [settings, workshopData] = await Promise.all([
    getSiteSettings(),
    getWorkshopData(),
  ]);

  return (
    <div className="space-y-6">
      <WorkshopManager
        initialData={workshopData}
        defaultFacebookUrl={settings.facebook_url}
      />
    </div>
  );
}
