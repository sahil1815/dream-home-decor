import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'কাস্টম ফার্নিচার রিকোয়েস্ট',
  description:
    'আপনার ঘরের মাপ, পছন্দের রঙ ও স্পেসিফিকেশন অনুযায়ী কাস্টম পড়ার টেবিল, বুকশেলফ বা কম্পিউটার ডেস্ক তৈরির রিকোয়েস্ট পাঠান।',
  alternates: {
    canonical: '/custom-furniture',
  },
  openGraph: {
    title: 'কাস্টম ফার্নিচার রিকোয়েস্ট | Dream Home Decor',
    description: 'ঘরের প্রয়োজন অনুযায়ী কাস্টম সাইজ ও কাটার ফার্নিচার সরাসরি মিরপুর-১০ কারখানা থেকে তৈরি করুন।',
    url: '/custom-furniture',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function CustomFurnitureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
