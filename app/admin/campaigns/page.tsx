import React from 'react';
import { getAllCampaigns } from '@/lib/data';
import { AdminCampaignManager } from '@/components/admin/AdminCampaignManager';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  const campaigns = await getAllCampaigns();

  return (
    <div className="space-y-6">
      <AdminCampaignManager initialCampaigns={campaigns} />
    </div>
  );
}
