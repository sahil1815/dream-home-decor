'use client';

import React, { useState } from 'react';
import {
  FileText,
  Save,
  Check,
  Loader2,
  Info,
  Plus,
  Trash2,
} from 'lucide-react';
import { saveSiteContentAction } from '@/lib/actions';

interface SiteContentEditorProps {
  initialContent: Record<
    string,
    { id: string; title: string; content: Record<string, unknown>; updated_at?: string }
  >;
}

export function SiteContentEditor({ initialContent }: SiteContentEditorProps) {
  const [contentMap] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<'announcement' | 'hero' | 'policies' | 'faq' | 'contact'>('announcement');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Announcement state
  const announcement = (contentMap.announcement?.content || {}) as {
    enabled?: boolean;
    text?: string;
    link?: string;
  };
  const [annText, setAnnText] = useState(
    announcement.text ||
      '🎉 মিরপুর নিজস্ব কারখানা থেকে সরাসরি ফার্নিচার কিনুন! সারাদেশে ক্যাশ অন ডেলিভারি।'
  );
  const [annEnabled, setAnnEnabled] = useState(announcement.enabled !== false);
  const [annLink, setAnnLink] = useState(announcement.link || '/products');

  // Hero state
  const hero = (contentMap.hero?.content || {}) as {
    badge?: string;
    title?: string;
    subtitle?: string;
    cta_text?: string;
    cta_link?: string;
  };
  const [heroBadge, setHeroBadge] = useState(
    hero.badge || 'সরাসরি নিজস্ব কারখানায় তৈরি • ফ্যাক্টরি হোলসেল রেট'
  );
  const [heroTitle, setHeroTitle] = useState(
    hero.title || 'প্রিমিয়াম কোয়ালিটি মেলামাইন ও কাঠের ফার্নিচার'
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    hero.subtitle ||
      'মিরপুর নিজস্ব কারখানায় উন্নত মেশিনারিজ ও দক্ষ কারিগর দ্বারা প্রস্তুতকৃত। মধ্যস্বত্বভোগী ছাড়া পান নির্ভরযোগ্য স্থায়িত্ব।'
  );
  const [heroCtaText, setHeroCtaText] = useState(hero.cta_text || 'ফার্নিচার কালেকশন দেখুন');
  const [heroCtaLink, setHeroCtaLink] = useState(hero.cta_link || '/products');

  // Policies state
  const deliveryPolicy = (contentMap.delivery_policy?.content || {}) as {
    lead_time_inside?: string;
    lead_time_outside?: string;
    packaging?: string;
  };
  const [leadInside, setLeadInside] = useState(
    deliveryPolicy.lead_time_inside || '১-২ কর্মদিবস (হোম ডেলিভারি)'
  );
  const [leadOutside, setLeadOutside] = useState(
    deliveryPolicy.lead_time_outside || '৩-৫ কর্মদিবস (রেডএক্স বা সুন্দরবন কুরিয়ার)'
  );
  const [packagingText, setPackagingText] = useState(
    deliveryPolicy.packaging || 'হেভি-ডিউটি বাবল র‍্যাপ এবং ৪-কোণা কর্নার প্রোটেকশন দিয়ে প্যাক করা হয়।'
  );

  const returnPolicy = (contentMap.return_policy?.content || {}) as {
    condition?: string;
    damage_warranty?: string;
  };
  const [returnCondition, setReturnCondition] = useState(
    returnPolicy.condition ||
      'ডেলিভারিম্যানের উপস্থিতিতে পার্সেল চেক করে গ্রহণ করুন। কোনো ত্রুটি বা সাইজ সমস্যা থাকলে তাৎক্ষণিক ফেরত দিতে পারবেন।'
  );
  const [damageWarranty, setDamageWarranty] = useState(
    returnPolicy.damage_warranty ||
      'পরিবহনজনিত ভাঙচুর বা ত্রুটির ক্ষেত্রে ২৪ ঘণ্টার মধ্যে অভিযোগ দিলে বিনামূল্যে রিপ্লেসমেন্ট প্রদান করা হয়।'
  );

  // FAQ state
  const faqData = (contentMap.faq?.content || {}) as {
    items?: Array<{ q: string; a: string }>;
  };
  const [faqItems, setFaqItems] = useState<Array<{ q: string; a: string }>>(
    faqData.items || [
      {
        q: 'আপনারা কি সম্পূর্ণ নিজস্ব কারখানায় ফার্নিচার তৈরি করেন?',
        a: 'হ্যাঁ, আমাদের কারখানা মিরপুর-১০ এ অবস্থিত। কাঠ কাটিং, এজ ব্যান্ডিং ও ফিটিং সবকিছু নিজস্ব দক্ষ কারিগর দ্বারা সম্পন্ন হয়।',
      },
      {
        q: 'ডেলিভারির সময় কি খুলে চেক করা যাবে?',
        a: 'অবশ্যই! আমাদের প্রতিটি পণ্যে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। ডেলিভারিম্যান সামনে থাকা অবস্থায় পণ্য খুলে সন্তুষ্ট হয়ে পেমেন্ট করবেন।',
      },
    ]
  );

  // Contact state
  const contact = (contentMap.contact_details?.content || {}) as {
    address?: string;
    hours?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  const [contactAddress, setContactAddress] = useState(
    contact.address || 'মিরপুর-১০, ঢাকা, বাংলাদেশ (সরাসরি নিজস্ব কারখানা ও শোরুম)'
  );
  const [contactHours, setContactHours] = useState(
    contact.hours || 'প্রতিদিন সকাল ১০:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত খোলা'
  );
  const [contactPhone, setContactPhone] = useState(contact.phone || '01712-345678');
  const [contactWa, setContactWa] = useState(contact.whatsapp || '8801712345678');

  const handleSaveTab = async (section: string) => {
    setIsSaving(true);
    setFeedback(null);

    try {
      if (section === 'announcement') {
        const payload = { enabled: annEnabled, text: annText, link: annLink };
        const res = await saveSiteContentAction('announcement', 'টপ অ্যানাউন্সমেন্ট বার', payload);
        if (res.success) setFeedback({ type: 'success', text: 'অ্যানাউন্সমেন্ট বার আপডেট হয়েছে!' });
      } else if (section === 'hero') {
        const payload = {
          badge: heroBadge,
          title: heroTitle,
          subtitle: heroSubtitle,
          cta_text: heroCtaText,
          cta_link: heroCtaLink,
        };
        const res = await saveSiteContentAction('hero', 'হোমপেজ হিরো সেকশন', payload);
        if (res.success) setFeedback({ type: 'success', text: 'হিরো সেকশন কনটেন্ট আপডেট হয়েছে!' });
      } else if (section === 'policies') {
        await saveSiteContentAction('delivery_policy', 'ডেলিভারি পলিসি', {
          lead_time_inside: leadInside,
          lead_time_outside: leadOutside,
          packaging: packagingText,
        });
        await saveSiteContentAction('return_policy', 'রিটার্ন ও রিফান্ড পলিসি', {
          condition: returnCondition,
          damage_warranty: damageWarranty,
        });
        setFeedback({ type: 'success', text: 'ডেলিভারি ও রিটার্ন পলিসি সফলভাবে সংরক্ষিত হয়েছে!' });
      } else if (section === 'faq') {
        const res = await saveSiteContentAction('faq', 'সাধারণ প্রশ্নোত্তর (FAQ)', { items: faqItems });
        if (res.success) setFeedback({ type: 'success', text: 'FAQ প্রশ্নোত্তর সফলভাবে সংরক্ষিত হয়েছে!' });
      } else if (section === 'contact') {
        const payload = {
          address: contactAddress,
          hours: contactHours,
          phone: contactPhone,
          whatsapp: contactWa,
        };
        const res = await saveSiteContentAction('contact_details', 'যোগাযোগ ও শোরুমের ঠিকানা', payload);
        if (res.success) setFeedback({ type: 'success', text: 'শোরুম ও যোগাযোগ তথ্য সংরক্ষিত হয়েছে!' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'সংরক্ষণ ব্যর্থ হয়েছে' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#8B5A2B]" />
            <span>সাইট কনটেন্ট ও পলিসি এডিটর</span>
          </h1>
          <p className="text-xs font-bn text-stone-500 mt-0.5">
            ওয়েবসাইটের ব্যানার টেক্সট, পলিসি পেজ, এফএকিউ এবং শোরুমের তথ্য পরিবর্তন করুন
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveTab(activeTab)}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>বর্তমান সেকশন সেভ করুন</span>
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
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-2 text-xs font-bn font-bold overflow-x-auto pb-1">
        {[
          { key: 'announcement', label: '১. টপ অ্যানাউন্সমেন্ট বার' },
          { key: 'hero', label: '২. হোমপেজ হিরো টেক্সট' },
          { key: 'policies', label: '৩. ডেলিভারি ও রিটার্ন পলিসি' },
          { key: 'faq', label: '৪. এফএকিউ (FAQ)' },
          { key: 'contact', label: '৫. শোরুম ও যোগাযোগ' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key as typeof activeTab);
              setFeedback(null);
            }}
            className={`px-4 py-2.5 rounded-t-xl transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white border-t border-x border-stone-200 text-[#8B5A2B]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Announcement Bar */}
      {activeTab === 'announcement' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4 max-w-2xl text-xs font-bn">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-sm text-stone-900">টপ অ্যানাউন্সমেন্ট বার কন্ট্রোল</h3>
              <p className="text-stone-500 text-[11px]">ওয়েবসাইটের একদম উপরে সরু নোটিস স্ট্রিপ</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={annEnabled}
                onChange={(e) => setAnnEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5A2B]"></div>
            </label>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">নোটিস বার মেসেজ:</label>
            <textarea
              rows={2}
              value={annText}
              onChange={(e) => setAnnText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">ক্লিক করলে লিঙ্ক (URL):</label>
            <input
              type="text"
              value={annLink}
              onChange={(e) => setAnnLink(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px]"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Hero Section */}
      {activeTab === 'hero' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4 max-w-3xl text-xs font-bn">
          <h3 className="font-bold text-sm text-stone-900 pb-2 border-b border-stone-100">
            হোমপেজ হিরো হেডলাইন ও স্লোগান
          </h3>

          <div>
            <label className="block font-bold text-stone-700 mb-1">টপ ব্যাজ টেক্সট (Eyebrow):</label>
            <input
              type="text"
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">মূল শিরোনাম (H1):</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">উপশিরোনাম (Subheadline):</label>
            <textarea
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">বাটন টেক্সট (CTA):</label>
              <input
                type="text"
                value={heroCtaText}
                onChange={(e) => setHeroCtaText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">বাটন লিঙ্ক:</label>
              <input
                type="text"
                value={heroCtaLink}
                onChange={(e) => setHeroCtaLink(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Policies */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bn">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
              ডেলিভারি পলিসি ও সময়সীমা
            </h3>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ঢাকার ভেতরে লিড-টাইম:</label>
              <input
                type="text"
                value={leadInside}
                onChange={(e) => setLeadInside(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ঢাকার বাইরে লিড-টাইম:</label>
              <input
                type="text"
                value={leadOutside}
                onChange={(e) => setLeadOutside(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">সুরক্ষিত প্যাকেজিং নোট:</label>
              <textarea
                rows={3}
                value={packagingText}
                onChange={(e) => setPackagingText(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
              রিটার্ন ও রিপ্লেসমেন্ট গ্যারান্টি
            </h3>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ডেলিভারির সময় চেক করার নিয়ম:</label>
              <textarea
                rows={3}
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ভাঙচুর ও ওয়ারেন্টি পলিসি:</label>
              <textarea
                rows={3}
                value={damageWarranty}
                onChange={(e) => setDamageWarranty(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: FAQ Items */}
      {activeTab === 'faq' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4 max-w-3xl text-xs font-bn">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-stone-900">সাধারণ প্রশ্নোত্তর (FAQ Items)</h3>
              <p className="text-stone-500 text-[11px]">কাস্টমারদের সাধারণ প্রশ্নের উত্তর যোগ বা পরিবর্তন করুন</p>
            </div>
            <button
              type="button"
              onClick={() => setFaqItems([...faqItems, { q: 'নতুন প্রশ্ন', a: 'উত্তর' }])}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8B5A2B] text-white rounded-lg font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>প্রশ্ন যোগ</span>
            </button>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.q}
                    onChange={(e) => {
                      const updated = [...faqItems];
                      updated[idx].q = e.target.value;
                      setFaqItems(updated);
                    }}
                    placeholder="প্রশ্ন লিখুন..."
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-bold text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                    title="মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={item.a}
                  onChange={(e) => {
                    const updated = [...faqItems];
                    updated[idx].a = e.target.value;
                    setFaqItems(updated);
                  }}
                  placeholder="উত্তর লিখুন..."
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-800"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Contact & Showroom */}
      {activeTab === 'contact' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4 max-w-2xl text-xs font-bn">
          <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
            মিরপুর কারখানা ও শোরুম যোগাযোগের তথ্য
          </h3>

          <div>
            <label className="block font-bold text-stone-700 mb-1">কারখানা ও শোরুমের পূর্ণ ঠিকানা:</label>
            <textarea
              rows={2}
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">খোলা থাকার সময়সূচী (Business Hours):</label>
            <input
              type="text"
              value={contactHours}
              onChange={(e) => setContactHours(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">হটলাইন মোবাইল নম্বর:</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-sans"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">হোয়াটসঅ্যাপ অর্ডার নম্বর:</label>
              <input
                type="text"
                value={contactWa}
                onChange={(e) => setContactWa(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-sans"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
