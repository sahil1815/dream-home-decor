import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { getSiteSettings, getCategories } from '@/lib/data';
import { AnnouncementBar } from '@/components/storefront/AnnouncementBar';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { QuickOrderModal } from '@/components/storefront/QuickOrderModal';
import { FloatingContact } from '@/components/storefront/FloatingContact';
import { BottomStickyBar } from '@/components/storefront/BottomStickyBar';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Dream Home Decor | নিজস্ব কারখানায় তৈরি আধুনিক ফার্নিচার ও পড়ার টেবিল',
  description:
    'ড্রিম হোম ডেকোর - নিজস্ব কারখানায় মেলামাইন বোর্ড দিয়ে তৈরি আধুনিক পড়ার টেবিল, বুকশেলফ ও কম্পিউটার টেবিল। সারাদেশে ক্যাশ অন ডেলিভারি ও সরাসরি ফ্যাক্টরি রেট।',
  keywords: [
    'Dream Home Decor',
    'ড্রিম হোম ডেকোর',
    'পড়ার টেবিল',
    'reading table bd',
    'furniture bangladesh',
    'computer table',
    'bookshelf dhaka',
    'বোর্ড কাটিং কারখানা',
  ],
  openGraph: {
    title: 'Dream Home Decor | সেরা ফার্নিচার ফ্যাক্টরি রেটে',
    description: 'নিজস্ব কারখানায় তৈরি উন্নত মানের পড়ার টেবিল ও হোম ডেকোর ফার্নিচার। সারাদেশে ক্যাশ অন ডেলিভারি।',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  return (
    <html
      lang="bn"
      className={`${plusJakartaSans.variable} ${hindSiliguri.variable} scroll-smooth`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917] antialiased">
        <CartProvider>
          {/* Top Announcement Bar */}
          <AnnouncementBar settings={settings} />

          {/* Sticky Navigation */}
          <Navbar settings={settings} categories={categories} />

          {/* Main Content */}
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>

          {/* Footer */}
          <Footer settings={settings} />

          {/* Global Drawers & Modals */}
          <CartDrawer />
          <QuickOrderModal />

          {/* Floating WhatsApp / Phone Contact (Desktop) */}
          <FloatingContact settings={settings} />

          {/* Bottom Sticky Navigation Bar (Mobile / Tablet) */}
          <BottomStickyBar settings={settings} />
        </CartProvider>
      </body>
    </html>
  );
}
