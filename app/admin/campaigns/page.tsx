import React from 'react';
import { getCampaigns } from '@/lib/data';
import { AdminCampaignManager } from '@/components/admin/AdminCampaignManager';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-6">
      <AdminCampaignManager initialCampaigns={campaigns} />
    </div>
  );
}
