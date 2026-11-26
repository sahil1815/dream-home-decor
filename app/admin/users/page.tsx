import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSessionAction } from '@/lib/actions';
import { getAdminSecurityOverview } from '@/lib/admin-credentials';
import { UserManager } from '@/components/admin/UserManager';

export const metadata = {
  title: 'ইউজার ভূমিকা ও নিরাপত্তা | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'অ্যাডমিন ইউজার ভূমিকা, পাসওয়ার্ড ব্যবস্থাপনা ও রোল-বেসড এক্সেস কন্ট্রোল (RBAC)',
};

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await getAdminSessionAction();

  if (!session) {
    redirect('/admin/login?redirect=/admin/users');
  }

  if (session.role !== 'owner') {
    redirect('/admin');
  }

  const securityOverview = await getAdminSecurityOverview();

  const configuredUsers = {
    ownerUsername: process.env.ADMIN_OWNER_USERNAME || process.env.ADMIN_USERNAME || 'admin',
    ownerEmail: process.env.ADMIN_OWNER_EMAIL || process.env.ADMIN_EMAIL || 'owner@dreamhomedecor.com',
    managerUsername: process.env.ADMIN_MANAGER_USERNAME || 'manager',
    managerEmail: process.env.ADMIN_MANAGER_EMAIL || 'manager@dreamhomedecor.com',
    staffUsername: process.env.ADMIN_STAFF_USERNAME || 'staff',
    staffEmail: process.env.ADMIN_STAFF_EMAIL || 'staff@dreamhomedecor.com',
  };

  return (
    <UserManager
      currentSession={session}
      configuredUsers={configuredUsers}
      initialSecurityOverview={securityOverview}
    />
  );
}
