import type { Metadata } from 'next';
import { getSiteContentMap, getSiteSettings } from '@/lib/data';
import { FAQClient } from '@/components/storefront/FAQClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলি (FAQ)',
  description: 'ফার্নিচারের বোর্ড, ডেলিভারি, কাস্টমাইজেশন ও পেমেন্ট সংক্রান্ত গ্রাহকদের নিয়মিত প্রশ্নের সহজ উত্তর',
};

export default async function FAQPage() {
  const [contentMap, settings] = await Promise.all([
    getSiteContentMap(),
    getSiteSettings(),
  ]);

  const rawFaq = (contentMap as any)?.faq?.content;
  const customItems = Array.isArray(rawFaq?.items) ? rawFaq.items : undefined;

  return (
    <FAQClient
      customItems={customItems}
      whatsappNumber={settings.whatsapp_number}
      phone={settings.phone}
    />
  );
}
