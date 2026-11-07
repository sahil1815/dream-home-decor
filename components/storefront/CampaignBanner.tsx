import React from 'react';
import Image from 'next/image';
import { Gift, ExternalLink } from 'lucide-react';
import { CampaignGiveaway } from '@/types/database';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CampaignBannerProps {
  campaigns: CampaignGiveaway[];
}

export function CampaignBanner({ campaigns }: CampaignBannerProps) {
  const activeCampaign = campaigns.find((c) => c.is_active);

  if (!activeCampaign) return null;

  return (
    <section className="py-10 bg-[#F7F3EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#2B1D14] text-white shadow-xl p-6 sm:p-10 border border-[#8A5A3B]/30">
          {/* Subtle Warm Amber Glow */}
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-[#B08D57]/15 rounded-full blur-3xl pointer-events-none" />

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
              <div className="inline-flex items-center gap-2 bg-[#B08D57]/20 backdrop-blur-md text-[#FAF3E8] border border-[#B08D57]/30 px-3.5 py-1 rounded-full text-xs font-bn font-semibold uppercase tracking-wider">
                <Gift className="w-4 h-4 text-[#B08D57]" />
                <span>স্পেশাল অফার ও লটারি</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white leading-tight">
                {activeCampaign.title}
              </h3>

              <p className="text-stone-300 text-sm font-bn leading-relaxed">
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white font-bn font-semibold text-sm sm:text-base px-6 sm:px-7 py-3 rounded-xl shadow-xs transition-colors"
                >
                  <Gift className="w-5 h-5 text-amber-200 shrink-0" />
                  <span>লটারিতে অংশ নিন</span>
                  <ExternalLink className="w-4 h-4 ml-1 shrink-0 text-amber-200" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
