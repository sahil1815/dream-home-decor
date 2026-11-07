import React from 'react';
import { getSiteContentMap } from '@/lib/data';
import { SiteContentEditor } from '@/components/admin/SiteContentEditor';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'সাইট কনটেন্ট ও পলিসি এডিটর | Dream Home Decor Admin',
  description: 'ওয়েবসাইটের ব্যানার, নোটিস বার, পলিসি ও এফএকিউ এডিটর',
};

export default async function AdminContentPage() {
  const contentMap = await getSiteContentMap();

  return <SiteContentEditor initialContent={contentMap} />;
}
