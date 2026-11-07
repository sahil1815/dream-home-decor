import type { Metadata, Viewport } from 'next';
import { Noto_Serif_Bengali, Hind_Siliguri, Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { getSiteSettings, getCategories } from '@/lib/data';
import { AnnouncementBar } from '@/components/storefront/AnnouncementBar';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { QuickOrderModal } from '@/components/storefront/QuickOrderModal';
import { BottomStickyBar } from '@/components/storefront/BottomStickyBar';
import { FloatingContact } from '@/components/storefront/FloatingContact';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';
import { UtmTracker } from '@/components/analytics/UtmTracker';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: ['400', '600', '700'],
  variable: '--font-serif-bn',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dream-home-decor.vercel.app'),
  title: {
    default: 'Dream Home Decor | নিজস্ব কারখানায় তৈরি আধুনিক ফার্নিচার',
    template: '%s | Dream Home Decor',
  },
  description:
    'মিরপুর-১০ নিজস্ব কারখানায় ১৬ মিমি মেলামাইন বোর্ড ও ১ মিমি পিভিসি এজ ব্যান্ডিং দিয়ে তৈরি পড়ার টেবিল, বুকশেলফ ও কম্পিউটার ডেস্ক। সারাদেশে ক্যাশ অন ডেলিভারি।',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Dream Home Decor | নিজস্ব কারখানায় তৈরি আধুনিক মেলামাইন ফার্নিচার',
    description:
      'মিরপুর-১০ নিজস্ব কারখানায় তৈরি পড়ার টেবিল ও স্টোরেজ ফার্নিচার। কোনো মধ্যস্বত্বভোগী ছাড়া সরাসরি ফ্যাক্টরি মূল্যে ক্যাশ অন ডেলিভারি।',
    url: '/',
    siteName: 'Dream Home Decor',
    locale: 'bn_BD',
    type: 'website',
    images: [
      {
        url: '/placeholders/site/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'ড্রিম হোম ডেকোর মিরপুর কারখানা ও আধুনিক ফার্নিচার',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dream Home Decor | নিজস্ব কারখানায় তৈরি আধুনিক মেলামাইন ফার্নিচার',
    description:
      'মিরপুর-১০ নিজস্ব কারখানায় তৈরি পড়ার টেবিল ও স্টোরেজ ফার্নিচার। সরাসরি ফ্যাক্টরি মূল্যে ক্যাশ অন ডেলিভারি।',
    images: ['/placeholders/site/hero.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'FurnitureStore', 'Organization'],
    name: 'Dream Home Decor (ড্রিম হোম ডেকোর)',
    url: 'https://dream-home-decor.vercel.app',
    logo: 'https://dream-home-decor.vercel.app/placeholders/brand/logo.png',
    image: 'https://dream-home-decor.vercel.app/placeholders/site/hero.jpg',
    telephone: settings.phone || '+8801725357873',
    priceRange: '৳১,২০০ - ৳১৫,০০০',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'হোল্ডিং নং ২৩, রোড নং ৪, সেকশন-১০',
      addressLocality: 'মিরপুর, ঢাকা',
      postalCode: '1216',
      addressCountry: 'BD',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '23.8069',
      longitude: '90.3687',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '10:00',
      closes: '20:00',
    },
    sameAs: [
      settings.facebook_url || 'https://www.facebook.com/profile.php?id=61584955311887',
    ],
  };

  return (
    <html
      lang="bn"
      className={`${inter.variable} ${hindSiliguri.variable} ${notoSerifBengali.variable} scroll-smooth`}
    >
      <body className="min-h-screen flex flex-col bg-[#F7F3EE] text-[#2B1D14] antialiased">
        {/* LocalBusiness & Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <CartProvider>
          <WishlistProvider>
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

            {/* Bottom Sticky Navigation Bar (Mobile / Tablet) */}
            <BottomStickyBar settings={settings} />

            {/* Floating WhatsApp Contact Button */}
            <FloatingContact settings={settings} />

            {/* Campaign Attribution & Analytics Trackers */}
            <UtmTracker />
            <AnalyticsScripts />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
