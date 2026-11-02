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
    <section className="py-10 bg-gradient-to-b from-[#FAF8F5] via-[#F6EFE6] to-[#FAF8F5] border-y border-amber-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#9E4A19] via-[#853B12] to-[#6E2E0A] text-white shadow-xl shadow-amber-950/15 p-6 sm:p-10 border border-amber-500/20">
          {/* Ambient Warm Glow */}
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />

          {/* Background image tint */}
          {activeCampaign.banner_url && (
            <div className="absolute inset-0 opacity-15 mix-blend-overlay">
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
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-amber-100 border border-white/25 px-3.5 py-1 rounded-full text-xs font-bn font-bold uppercase tracking-wider shadow-xs">
                <Gift className="w-4 h-4 text-amber-300" />
                <span>স্পেশাল ক্যাম্পেইন ও লটারি অফার</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-bn text-white leading-tight">
                {activeCampaign.title}
              </h3>

              <p className="text-amber-100/90 text-sm font-bn leading-relaxed">
                {activeCampaign.description ||
                  'আমাদের ফেসবুক পেজে যুক্ত হয়ে জিতে নিন আকর্ষণীয় ফার্নিচার উপহার ও স্পেশাল ডিসকাউন্ট ভাউচার!'}
              </p>
            </div>

            {/* CTA to Facebook Contest */}
            {activeCampaign.facebook_post_link && (
              <div className="w-full lg:w-auto shrink-0">
                <a
                  href={activeCampaign.facebook_post_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-[#6E2E0A] font-bn font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full shadow-lg shadow-black/15 transition-all hover:scale-105"
                >
                  <Gift className="w-5 h-5 text-[#853B12] shrink-0" />
                  <span>ফেসবুক লটারিতে অংশ নিন</span>
                  <ExternalLink className="w-4 h-4 ml-1 shrink-0 text-[#853B12]" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
