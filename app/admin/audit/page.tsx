import React from 'react';
import { getAuditLogsList } from '@/lib/data';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export const metadata = {
  title: 'সিকিউরিটি ও অডিট লগ | ড্রিম হোম ডেকোর অ্যাডমিন',
  description: 'অ্যাডমিন অপারেশন্স, কনফিগারেশন পরিবর্তন ও নিরাপত্তা অডিট লগ',
};

export const revalidate = 0;

export default async function AdminAuditPage() {
  const logs = await getAuditLogsList(150);

  return <AuditLogViewer initialLogs={logs} />;
}
