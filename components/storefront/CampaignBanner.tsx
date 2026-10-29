import React from 'react';
import Image from 'next/image';
import { Gift, ExternalLink, Sparkles, Clock } from 'lucide-react';
import { CampaignGiveaway } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CampaignBannerProps {
  campaigns: CampaignGiveaway[];
}

export function CampaignBanner({ campaigns }: CampaignBannerProps) {
  const activeCampaign = campaigns.find((c) => c.is_active);

  if (!activeCampaign) return null;

  return (
    <section className="py-10 bg-amber-50/70 border-b border-amber-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 text-white shadow-xl p-6 sm:p-10">
          {/* Background image tint */}
          {activeCampaign.banner_url && (
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <Image
                src={getOptimizedImageUrl(activeCampaign.banner_url, 1200)}
                alt={activeCampaign.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-amber-400 text-stone-950 px-3.5 py-1 rounded-full text-xs font-bn font-bold uppercase tracking-wider">
                <Gift className="w-4 h-4" />
                <span>স্পেশাল ক্যাম্পেইন ও লটারি অফার</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-bn text-white leading-tight">
                {activeCampaign.title}
              </h3>

              <p className="text-amber-100 text-sm font-bn leading-relaxed">
                {activeCampaign.description ||
                  'আমাদের ফেসবুক পেজে যুক্ত হয়ে জিতে নিন আকর্ষণীয় ফার্নিচার উপহার ও স্পেশাল ডিসকাউন্ট ভাউচার!'}
              </p>
            </div>

            {/* CTA to Facebook Contest */}
            {activeCampaign.facebook_post_link && (
              <div className="shrink-0">
                <a
                  href={activeCampaign.facebook_post_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bn font-bold text-sm sm:text-base px-7 py-4 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  <Gift className="w-5 h-5 text-stone-900" />
                  <span>ফেসবুক লটারিতে অংশ নিন</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
