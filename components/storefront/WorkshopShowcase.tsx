import React from 'react';
import Image from 'next/image';
import { Hammer, Video, ExternalLink } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { WorkshopData } from '@/types/database';
import { DEFAULT_WORKSHOP_DATA } from '@/lib/mock-data';

interface WorkshopShowcaseProps {
  workshopData?: WorkshopData;
  facebookUrl?: string;
}

export function WorkshopShowcase({
  workshopData,
  facebookUrl,
}: WorkshopShowcaseProps) {
  const data = workshopData || DEFAULT_WORKSHOP_DATA;
  const steps = data.steps && data.steps.length > 0 ? data.steps : DEFAULT_WORKSHOP_DATA.steps;
  const videoCard = data.videoCard || DEFAULT_WORKSHOP_DATA.videoCard;
  const activeFacebookUrl = videoCard.buttonUrl || facebookUrl || DEFAULT_WORKSHOP_DATA.videoCard.buttonUrl;

  return (
    <section id="workshop" className="py-16 sm:py-20 lg:py-24 bg-[#FAF8F5] text-[#2B1D14] relative overflow-hidden border-y border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#F4ECE1] text-[#8A5A3B] border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-xs font-bn font-semibold">
            <Hammer className="w-4 h-4 text-[#8A5A3B]" />
            <span>{data.badge || DEFAULT_WORKSHOP_DATA.badge}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#2B1D14] leading-tight">
            {data.title || DEFAULT_WORKSHOP_DATA.title}
          </h2>

          <p className="text-stone-600 font-bn text-sm sm:text-base leading-relaxed">
            {data.description || DEFAULT_WORKSHOP_DATA.description}
          </p>
        </div>

        {/* Dynamic Workshop Gallery */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${
          steps.length >= 4 ? 'lg:grid-cols-4' : steps.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
        } gap-6 mt-12`}>
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="bg-white rounded-2xl overflow-hidden border border-[#E8E2D9] hover:border-[#8A5A3B]/40 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                <Image
                  src={getOptimizedImageUrl(step.image, 500)}
                  alt={step.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="font-serif font-bold text-[#2B1D14] group-hover:text-[#8A5A3B] text-base transition-colors">
                  {step.title}
                </h3>
                <p className="font-bn text-stone-600 text-xs leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Facebook Reels / Workshop Video Banner Card */}
        {videoCard.enabled !== false && (
          <div className="mt-12 bg-[#2B1D14] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl text-white border border-[#8A5A3B]/30">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-[#B08D57]/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bn text-[#FAF3E8] border border-[#B08D57]/30">
                <Video className="w-4 h-4 text-[#B08D57]" />
                <span>{videoCard.badge || DEFAULT_WORKSHOP_DATA.videoCard.badge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
                {videoCard.title || DEFAULT_WORKSHOP_DATA.videoCard.title}
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-bn max-w-xl">
                {videoCard.description || DEFAULT_WORKSHOP_DATA.videoCard.description}
              </p>
            </div>

            <a
              href={activeFacebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-[#8A5A3B] hover:bg-[#6E442B] text-white font-bn font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors"
            >
              <span>{videoCard.buttonText || DEFAULT_WORKSHOP_DATA.videoCard.buttonText}</span>
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
