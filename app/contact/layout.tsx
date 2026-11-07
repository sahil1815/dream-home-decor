import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'যোগাযোগ ও শোরুম',
  description:
    'মিরপুর-১০ কারখানা ও বিক্রয়কেন্দ্রের ঠিকানা, ফোন নম্বর, হোয়াটসঅ্যাপ এবং সরাসরি কারখানা পরিদর্শনের সময়সূচি।',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'যোগাযোগ ও শোরুম | Dream Home Decor',
    description:
      'হোল্ডিং নং ২৩, রোড নং ৪, মিরপুর-১০, ঢাকা-১২১৬। সরাসরি কারখানা ও শোরুম পরিদর্শনের সময়: প্রতিদিন সকাল ১০টা - রাত ৮টা।',
    url: '/contact',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
