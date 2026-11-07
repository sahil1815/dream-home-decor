import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলি (FAQ)',
  description:
    'ফার্নিচারের বোর্ড, ডেলিভারি, কাস্টমাইজেশন ও পেমেন্ট সংক্রান্ত গ্রাহকদের নিয়মিত প্রশ্নের সহজ উত্তর।',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলি (FAQ) | Dream Home Decor',
    description: 'ফার্নিচারের বোর্ড, ১ মিমি পিভিসি এজ ব্যান্ডিং, ক্যাশ অন ডেলিভারি ও রিটার্ন পলিসির বিস্তারিত।',
    url: '/faq',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
