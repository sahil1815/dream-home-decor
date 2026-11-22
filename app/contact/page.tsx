import type { Metadata } from 'next';
import { getSiteContentMap, getSiteSettings } from '@/lib/data';
import { ContactClient } from '@/components/storefront/ContactClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'যোগাযোগ ও শোরুমের ঠিকানা',
  description: 'ড্রিম হোম ডেকোর এর মিরপুর-১০ কারখানা ও শোরুমের ঠিকানা, ফোন নাম্বার এবং যোগাযোগ ফর্ম',
};

export default async function ContactPage() {
  const [contentMap, settings] = await Promise.all([
    getSiteContentMap(),
    getSiteSettings(),
  ]);

  const rawContact = (contentMap as any)?.contact_details?.content || {};

  return (
    <ContactClient
      address={rawContact.address || settings.address}
      hours={rawContact.hours}
      phone={rawContact.phone || settings.phone}
      whatsapp={rawContact.whatsapp || settings.whatsapp_number}
      email={rawContact.email || undefined}
    />
  );
}
