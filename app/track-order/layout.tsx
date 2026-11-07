import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'অর্ডার ট্র্যাকিং',
  description:
    'আপনার অর্ডার নম্বর (যেমন: DHD-1001) ও মোবাইল নম্বর দিয়ে বর্তমান প্রোডাকশন ও ডেলিভারি স্ট্যাটাস যাচাই করুন।',
  alternates: {
    canonical: '/track-order',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
