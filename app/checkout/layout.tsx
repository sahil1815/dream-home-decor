import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'চেকআউট ও পেমেন্ট',
  description: 'ড্রিম হোম ডেকোর নিরাপদ এক-পৃষ্ঠা চেকআউট ও ক্যাশ অন ডেলিভারি অর্ডার কনফার্মেশন।',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
