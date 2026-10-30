import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  Heart,
} from 'lucide-react';
import { FacebookIcon } from '@/components/icons/FacebookIcon';
import { SiteSettings } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface FooterProps {
  settings: SiteSettings;
}

export function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-[#1C1917] text-[#FAF8F5] pt-14 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Brand & Factory Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {settings.logo_url && settings.logo_url.startsWith('http') ? (
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-stone-900 border border-stone-700">
                  <Image
                    src={getOptimizedImageUrl(settings.logo_url, 120)}
                    alt={settings.site_name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#8B5A2B] text-white flex items-center justify-center font-bold text-lg font-serif">
                  DH
                </div>
              )}
              <div>
                <h3 className="font-serif text-xl font-bold tracking-tight text-white">
                  {settings.site_name}
                </h3>
                <p className="text-xs text-amber-500 font-bn font-semibold">
                  সরাসরি নিজস্ব কারখানায় তৈরি
                </p>
              </div>
            </div>

            <p className="text-stone-300 text-sm font-bn leading-relaxed">
              আমরা কোনো মধ্যস্বত্বভোগী ছাড়া নিজস্ব ওয়ার্কশপে বোর্ড কাটিং ও কারিগর দ্বারা আধুনিক
              পড়ার টেবিল, বুকশেলফ ও ফার্নিচার প্রস্তুত করে সরাসরি ফ্যাক্টরি মূল্যে সারা বাংলাদেশে
              সরবরাহ করি।
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Facebook Page"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="WhatsApp Support"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={`tel:${settings.phone}`}
                className="w-9 h-9 rounded-full bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Phone Call"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-sans border-b border-stone-800 pb-2">
              পপুলার ক্যাটাগরি
            </h4>
            <ul className="space-y-2.5 text-sm font-bn text-stone-300">
              <li>
                <Link
                  href="/products?category=reading-tables"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-amber-600">›</span> পড়ার টেবিল (Reading Tables)
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=bookshelves"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-amber-600">›</span> আধুনিক বুকশেলফ ও র‍্যাক
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=computer-tables"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-amber-600">›</span> কম্পিউটার ও ওয়ার্কস্টেশন ডেস্ক
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=wall-shelves"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-amber-600">›</span> ওয়াল সেলফ ও ডেকোরেশন
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=dressing-tables"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-amber-600">›</span> সৌখিন ড্রেসিং টেবিল
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service & Trust */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-sans border-b border-stone-800 pb-2">
              গ্রাহক সেবা ও পলিসি
            </h4>
            <ul className="space-y-2.5 text-sm font-bn text-stone-300">
              <li className="flex items-center gap-2 text-stone-300">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>সারাদেশে হোম ডেলিভারি</span>
              </li>
              <li className="flex items-center gap-2 text-stone-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ডেলিভারি ম্যানের সামনে দেখে নেওয়ার সুযোগ</span>
              </li>
              <li className="flex items-center gap-2 text-stone-300">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>২৪ ঘণ্টা অনলাইন অর্ডার সুবিধা</span>
              </li>
              <li className="pt-2">
                <Link
                  href="/track-order"
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold text-sm font-bn"
                >
                  <span>অর্ডার ট্র্যাকিং পেজ</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Factory Address */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-sans border-b border-stone-800 pb-2">
              কারখানা ও যোগাযোগ
            </h4>
            <div className="space-y-3 text-sm font-bn text-stone-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                <span>{settings.address || 'মিরপুর, ঢাকা, বাংলাদেশ (সরাসরি কারখানা)'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-sans font-medium">{settings.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>WhatsApp: {settings.whatsapp_number}</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-[#1877F2] hover:bg-blue-600 text-white py-2.5 px-4 rounded-xl text-xs font-semibold font-bn transition-colors"
              >
                <FacebookIcon className="w-4 h-4" />
                <span>আমাদের ফেসবুক পেজ ভিজিট করুন</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-stone-300 font-bn text-center sm:text-left">
          <p>© {new Date().getFullYear()} {settings.site_name}. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            <Link href="/admin" className="hover:text-stone-300 transition-colors">
              অ্যাডমিন পোর্টাল
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" /> for Bangladeshi Homes
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
