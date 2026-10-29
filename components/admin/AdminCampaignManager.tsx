'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Gift,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { CampaignGiveaway } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { saveCampaignAction, deleteCampaignAction } from '@/lib/actions';

interface AdminCampaignManagerProps {
  initialCampaigns: CampaignGiveaway[];
}

export function AdminCampaignManager({ initialCampaigns }: AdminCampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<CampaignGiveaway[]>(initialCampaigns);

  // New campaign modal/form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [fbLink, setFbLink] = useState('https://www.facebook.com/profile.php?id=61584955311887');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !bannerUrl) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await saveCampaignAction({
        title,
        description,
        banner_url: bannerUrl,
        facebook_post_link: fbLink,
        is_active: isActive,
      });

      if (res.success) {
        setCampaigns((prev) => [
          {
            id: `camp-${Date.now()}`,
            title,
            description,
            banner_url: bannerUrl,
            facebook_post_link: fbLink,
            is_active: isActive,
            end_date: null,
          },
          ...prev,
        ]);
        setTitle('');
        setDescription('');
        setBannerUrl('');
        setFeedback('ক্যাম্পেইন সফলভাবে চালু করা হয়েছে!');
      }
    } catch {
      // Error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (camp: CampaignGiveaway) => {
    const updatedStatus = !camp.is_active;
    setCampaigns((prev) =>
      prev.map((c) => (c.id === camp.id ? { ...c, is_active: updatedStatus } : c))
    );

    await saveCampaignAction({
      id: camp.id,
      title: camp.title,
      description: camp.description || '',
      banner_url: camp.banner_url,
      facebook_post_link: camp.facebook_post_link || undefined,
      is_active: updatedStatus,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি এই ক্যাম্পেইনটি মুছে ফেলতে চান?')) return;
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    await deleteCampaignAction(id);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200">
        <h1 className="text-xl font-bold font-bn text-stone-900">
          ফেসবুক ক্যাম্পেইন ও গিভঅ্যাওয়ে লটারি ম্যানেজার
        </h1>
        <p className="text-xs font-bn text-stone-500">
          ড্রিম হোম ডেকোর পেজের স্পেশাল অফার ও ফেসবুক পোস্ট লিংক ব্যানার হিসেবে প্রদর্শন করুন
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bn rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bn font-bold text-stone-900">
              নতুন ক্যাম্পেইন তৈরি করুন
            </h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ক্যাম্পেইনের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: Facebook Mega Giveaway: ফ্রি রিডিং টেবিল লটারি!"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ব্যানার ছবির ImageKit URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/.../banner.jpg"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans"
              />
              {bannerUrl && (
                <div className="relative aspect-16/7 rounded-xl overflow-hidden mt-2 border border-stone-200">
                  <Image
                    src={getOptimizedImageUrl(bannerUrl, 400)}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                ফেসবুক পোস্ট লিংক (Facebook Post Link)
              </label>
              <input
                type="url"
                value={fbLink}
                onChange={(e) => setFbLink(e.target.value)}
                placeholder="https://www.facebook.com/..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-bn font-bold text-stone-700 mb-1">
                সংক্ষিপ্ত বিবরণ (Description)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="লাইক, শেয়ার ও কমেন্ট করে জিতে নিন আকর্ষণীয় পড়ার টেবিল..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn"
              />
            </div>

            <label className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
              <span className="text-xs font-bn font-semibold text-stone-800">
                হোমপেজে সাথে সাথে সক্রিয় করুন
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#8B5A2B] rounded"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#8B5A2B] hover:bg-[#6D431F] text-white rounded-xl text-xs font-bn font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>ক্যাম্পেইন প্রকাশ করুন</span>
            </button>
          </form>
        </div>

        {/* Existing Campaigns List */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bn font-bold text-stone-900">
            বিদ্যমান ক্যাম্পেইন ও অফার তালিকা ({campaigns.length})
          </h2>

          {campaigns.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 font-bn text-xs">
              এখনও কোনো ক্যাম্পেইন তৈরি করা হয়নি
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <div className="relative w-full sm:w-28 aspect-16/9 sm:aspect-square rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                  <Image
                    src={getOptimizedImageUrl(camp.banner_url, 200)}
                    alt={camp.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bn font-bold px-2 py-0.5 rounded-full ${
                        camp.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {camp.is_active ? 'লাইভ সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>
                  <h3 className="font-bn font-bold text-stone-900 text-sm mt-1 truncate">
                    {camp.title}
                  </h3>
                  <p className="text-xs font-bn text-stone-500 line-clamp-1 mt-0.5">
                    {camp.description}
                  </p>
                  {camp.facebook_post_link && (
                    <a
                      href={camp.facebook_post_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>ফেসবুক পোস্ট</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggle(camp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bn font-semibold border transition-colors cursor-pointer ${
                      camp.is_active
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                    }`}
                  >
                    {camp.is_active ? 'পজ করুন' : 'চালু করুন'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(camp.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
