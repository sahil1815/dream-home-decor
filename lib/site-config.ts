/**
 * Centralized Site Configuration: Dream Home Decor
 * Factory & Showroom: Mirpur-10, Dhaka, Bangladesh
 * 
 * In Phase 4, these default settings will be fully synced with and editable
 * from the Admin Settings dashboard.
 */

export interface SiteConfig {
  name: string;
  nameBn: string;
  tagline: string;
  taglineBn: string;
  descriptionBn: string;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  addressBn: string;
  addressEn: string;
  facebookUrl: string;
  deliveryChargeInsideDhaka: number;
  deliveryChargeOutsideDhaka: number;
  freeDeliveryThreshold?: number;
  announcementText: string;
  bkashMerchantNumber?: string;
  nagadMerchantNumber?: string;
  currencySymbol: string;
}

export const SITE_CONFIG: SiteConfig = {
  name: 'Dream Home Decor',
  nameBn: 'ড্রিম হোম ডেকোর',
  tagline: 'Modern Ergonomic Furniture Factory Direct',
  taglineBn: 'সরাসরি নিজস্ব কারখানায় তৈরি আধুনিক মেলামাইন ফার্নিচার',
  descriptionBn:
    'মিরপুর-১০ কারখানায় উন্নত মেলামাইন বোর্ড দিয়ে তৈরি পড়ার টেবিল, বুকশেলফ ও কম্পিউটার ডেস্ক। মধ্যস্বত্বভোগী ছাড়া সরাসরি ফ্যাক্টরি মূল্যে ক্যাশ অন ডেলিভারি।',
  phone: '01712345678', // Verified placeholder - configurable in admin/env
  phoneDisplay: '01712-345678',
  whatsappNumber: '8801712345678',
  whatsappDisplay: '+880 1712-345678',
  addressBn: 'মিরপুর-১০, ঢাকা, বাংলাদেশ (সরাসরি নিজস্ব কারখানা ও বিক্রয়কেন্দ্র)',
  addressEn: 'Mirpur-10, Dhaka-1216, Bangladesh (Factory & Showroom)',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61584955311887',
  deliveryChargeInsideDhaka: 120,
  deliveryChargeOutsideDhaka: 200,
  freeDeliveryThreshold: 15000,
  announcementText: 'নিজস্ব কারখানায় প্রস্তুত প্রিমিয়াম ফার্নিচার • সারাদেশে ক্যাশ অন ডেলিভারি',
  bkashMerchantNumber: '01712345678',
  nagadMerchantNumber: '01712345678',
  currencySymbol: '৳',
};
