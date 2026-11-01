'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Save,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Phone,
  MessageCircle,
  Truck,
  MapPin,
  Bell,
  CreditCard,
  Hammer,
} from 'lucide-react';
import { SiteSettings } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { saveSiteSettingsAction } from '@/lib/actions';

interface SiteSettingsFormProps {
  initialSettings: SiteSettings;
}

export function SiteSettingsForm({ initialSettings }: SiteSettingsFormProps) {
  const [siteName, setSiteName] = useState(initialSettings.site_name || 'Dream Home Decor');
  const [siteNameBn, setSiteNameBn] = useState(initialSettings.site_name_bn || 'ড্রিম হোম ডেকোর');
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(initialSettings.cover_banner_url || '');
  const [phone, setPhone] = useState(initialSettings.phone || '01712-345678');
  const [whatsapp, setWhatsapp] = useState(initialSettings.whatsapp_number || '8801712345678');
  const [facebookUrl, setFacebookUrl] = useState(
    initialSettings.facebook_url || 'https://www.facebook.com/profile.php?id=61584955311887'
  );
  const [address, setAddress] = useState(
    initialSettings.address || 'মিরপুর-১০, ঢাকা, বাংলাদেশ (সরাসরি কারখানা)'
  );
  const [deliveryInside, setDeliveryInside] = useState(
    initialSettings.delivery_charge_inside?.toString() || '120'
  );
  const [deliveryOutside, setDeliveryOutside] = useState(
    initialSettings.delivery_charge_outside?.toString() || '200'
  );
  const [announcement, setAnnouncement] = useState(
    initialSettings.announcement_text ||
      '🎉 নিজস্ব কারখানায় তৈরি সেরা মানের ফার্নিচার! সারাদেশে ক্যাশ অন ডেলিভারি। ২৪ ঘণ্টা অর্ডার সার্ভিস।'
  );
  const [bkashNumber, setBkashNumber] = useState(initialSettings.bkash_merchant_number || '01712345678');

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await saveSiteSettingsAction({
        site_name: siteName,
        site_name_bn: siteNameBn,
        logo_url: logoUrl,
        cover_banner_url: coverUrl,
        phone,
        whatsapp_number: whatsapp,
        facebook_url: facebookUrl,
        address,
        delivery_charge_inside: Number(deliveryInside),
        delivery_charge_outside: Number(deliveryOutside),
        announcement_text: announcement,
        bkash_merchant_number: bkashNumber,
      });

      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' });
      } else {
        setFeedback({ type: 'error', text: res.error || 'সংরক্ষণ ব্যর্থ হয়েছে' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-bn text-stone-900">
            ব্র্যান্ড পরিচয় ও সাইট সেটিংস
          </h1>
          <p className="text-xs font-bn text-stone-500">
            লোগো, ফেসবুক পেজ লিংক, হটলাইন ও ডেলিভারি চার্জ কোনো কোড ছাড়াই আপডেট করুন
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-400 text-white text-xs font-bn font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer self-start sm:self-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>সংরক্ষণ হচ্ছে...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>সেটিংস সেভ করুন</span>
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bn font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Workshop Section Quick Access Card */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5 rounded-3xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5A2B] text-white flex items-center justify-center shrink-0">
            <Hammer className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bn font-bold text-sm text-white">
              কারখানা ও ওয়ার্কশপ সেকশন এডিটর
            </h3>
            <p className="font-bn text-stone-300 text-xs">
              হোমপেজের &ldquo;সরাসরি কারখানার অন্দরমহল&rdquo; সেকশনের টেক্সট, ছবি ও ভিডিও লিঙ্ক পরিবর্তন করতে চান?
            </p>
          </div>
        </div>

        <Link
          href="/admin/workshop"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B5A2B] hover:bg-[#6D431F] text-white text-xs font-bn font-bold transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>ওয়ার্কশপ এডিটরে যান</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section 1: Logo & Cover Banners (ImageKit URL Preview) */}
        <div className="lg:col-span-12 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-6">
          <div className="border-b border-stone-100 pb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#8B5A2B]" />
            <h2 className="text-base font-bn font-bold text-stone-900">
              ইমেজকিট ব্যানার ও লোগো মিডিয়া (ImageKit Media Assets)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo URL */}
            <div className="space-y-3">
              <label className="block text-xs font-bn font-bold text-stone-700">
                সাইট লোগো ImageKit লিঙ্ক (Logo URL)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/dreamhomedecor/logo.png"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />

              {/* Instant Logo Preview */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-300 flex items-center justify-center">
                  {logoUrl ? (
                    <Image
                      src={getOptimizedImageUrl(logoUrl, 150)}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-serif font-bold text-white text-base">DH</span>
                  )}
                </div>
                <div className="text-xs font-bn">
                  <span className="font-bold text-stone-800 block">লাইভ লোগো প্রিভিউ</span>
                  <span className="text-stone-400 text-[11px]">
                    ওয়েবসাইটের হেডার ও ফুটার অংশে দৃশ্যমান হবে
                  </span>
                </div>
              </div>
            </div>

            {/* Cover Banner URL */}
            <div className="space-y-3">
              <label className="block text-xs font-bn font-bold text-stone-700">
                হোমপেজ হিরো কাভার ব্যানার (Hero Cover URL)
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-1555041469-a586c61ea9bc..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
              />

              {/* Instant Banner Preview */}
              <div className="relative aspect-16/7 rounded-2xl overflow-hidden border border-stone-300 bg-stone-100">
                {coverUrl && (
                  <Image
                    src={getOptimizedImageUrl(coverUrl, 600)}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-stone-900/80 text-white text-[10px] font-bn px-2 py-0.5 rounded">
                  হিরো ব্যানার প্রিভিউ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact, Phone, WhatsApp & Social */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bn font-bold text-stone-900">
              যোগাযোগ ও সোশ্যাল প্রোফাইল
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              হটলাইন মোবাইল নম্বর
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712-345678"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              হোয়াটসঅ্যাপ নম্বর (WhatsApp Country Code সহ)
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="8801712345678"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900"
            />
            <span className="text-[10px] text-stone-400 font-bn mt-0.5 block">
              এই নম্বরে গ্রাহক ১-ক্লিকে WhatsApp অর্ডার পাঠাবে
            </span>
          </div>

          <div>
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              অফিসিয়াল ফেসবুক পেজ লিঙ্ক (Facebook Page URL)
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://www.facebook.com/profile.php?id=61584955311887"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              কারখানা ও শোরুম ঠিকানা
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
            />
          </div>
        </div>

        {/* Section 3: Delivery Charges & Announcements */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bn font-bold text-stone-900">
              ডেলিভারি চার্জ ও নোটিস বার
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ঢাকার ভেতরে চার্জ (৳)
              </label>
              <input
                type="number"
                value={deliveryInside}
                onChange={(e) => setDeliveryInside(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ঢাকার বাইরে চার্জ (৳)
              </label>
              <input
                type="number"
                value={deliveryOutside}
                onChange={(e) => setDeliveryOutside(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              টপ অ্যানাউন্সমেন্ট বার টেক্সট
            </label>
            <textarea
              rows={2}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
              বিকাশ / নগদ পার্সোনাল নম্বর (Send Money)
            </label>
            <input
              type="text"
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              placeholder="01712-345678"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans text-stone-900"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
