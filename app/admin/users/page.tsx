import React from 'react';
import { getAdminSessionAction } from '@/lib/actions';
import { UserManager } from '@/components/admin/UserManager';

export const metadata = {
  title: 'ইউজার ভূমিকা ও নিরাপত্তা | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'অ্যাডমিন ইউজার ভূমিকা, প্রিভিলেজ ও রোল-বেসড এক্সেস কন্ট্রোল (RBAC)',
};

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await getAdminSessionAction();

  return <UserManager currentSession={session} />;
}
