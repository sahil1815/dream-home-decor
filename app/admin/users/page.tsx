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

  const configuredUsers = {
    ownerUsername: process.env.ADMIN_OWNER_USERNAME || process.env.ADMIN_USERNAME || 'admin',
    ownerEmail: process.env.ADMIN_OWNER_EMAIL || process.env.ADMIN_EMAIL || 'owner@dreamhomedecor.com',
    managerUsername: process.env.ADMIN_MANAGER_USERNAME || 'manager',
    managerEmail: process.env.ADMIN_MANAGER_EMAIL || 'manager@dreamhomedecor.com',
    staffUsername: process.env.ADMIN_STAFF_USERNAME || 'staff',
    staffEmail: process.env.ADMIN_STAFF_EMAIL || 'staff@dreamhomedecor.com',
  };

  return <UserManager currentSession={session} configuredUsers={configuredUsers} />;
}
