import React from 'react';
import { getSiteSettings } from '@/lib/data';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <SiteSettingsForm initialSettings={settings} />
    </div>
  );
}
