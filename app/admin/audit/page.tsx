import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSessionAction } from '@/lib/actions';
import { getAuditLogsList } from '@/lib/data';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export const metadata = {
  title: 'সিকিউরিটি ও অডিট লগ | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'অ্যাডমিন অপারেশন্স, কনফিগারেশন পরিবর্তন ও নিরাপত্তা অডিট লগ',
};

export const revalidate = 0;

export default async function AdminAuditPage() {
  const session = await getAdminSessionAction();

  if (!session) {
    redirect('/admin/login?redirect=/admin/audit');
  }

  if (session.role !== 'owner') {
    redirect('/admin');
  }

  const logs = await getAuditLogsList(150);

  return <AuditLogViewer initialLogs={logs} />;
}
