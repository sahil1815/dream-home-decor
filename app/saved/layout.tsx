import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'সংরক্ষিত ফার্নিচার',
  description: 'আপনার পছন্দের সংরক্ষিত ফার্নিচার তালিকা।',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
