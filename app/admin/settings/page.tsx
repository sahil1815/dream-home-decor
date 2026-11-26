import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSessionAction } from '@/lib/actions';
import { getSiteSettings } from '@/lib/data';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getAdminSessionAction();

  if (!session) {
    redirect('/admin/login?redirect=/admin/settings');
  }

  if (session.role !== 'owner') {
    redirect('/admin');
  }

  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <SiteSettingsForm initialSettings={settings} />
    </div>
  );
}
