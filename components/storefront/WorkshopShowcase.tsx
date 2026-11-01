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
    <section id="workshop" className="py-16 sm:py-20 bg-stone-900 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#8B5A2B]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#8B5A2B] text-white px-3.5 py-1.5 rounded-full text-xs font-bn font-bold tracking-wide">
            <Hammer className="w-4 h-4 text-amber-300" />
            <span>{data.badge || DEFAULT_WORKSHOP_DATA.badge}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-bn text-white leading-tight">
            {data.title || DEFAULT_WORKSHOP_DATA.title}
          </h2>

          <p className="text-stone-300 font-bn text-sm sm:text-base leading-relaxed">
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
              className="bg-stone-800/80 rounded-2xl overflow-hidden border border-stone-700 hover:border-amber-500/50 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-stone-950 overflow-hidden">
                <Image
                  src={getOptimizedImageUrl(step.image, 500)}
                  alt={step.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bn font-bold text-white text-base">
                  {step.title}
                </h3>
                <p className="font-bn text-stone-300 text-xs leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Facebook Reels / Workshop Video Banner Card */}
        {videoCard.enabled !== false && (
          <div className="mt-12 bg-gradient-to-r from-[#8B5A2B] to-[#643D1A] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bn text-amber-200">
                <Video className="w-4 h-4 text-rose-400" />
                <span>{videoCard.badge || DEFAULT_WORKSHOP_DATA.videoCard.badge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-bn text-white">
                {videoCard.title || DEFAULT_WORKSHOP_DATA.videoCard.title}
              </h3>
              <p className="text-amber-100 text-xs sm:text-sm font-bn max-w-xl">
                {videoCard.description || DEFAULT_WORKSHOP_DATA.videoCard.description}
              </p>
            </div>

            <a
              href={activeFacebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 font-bn font-bold text-sm px-6 py-3.5 rounded-full shadow-lg transition-all hover:scale-105"
            >
              <span>{videoCard.buttonText || DEFAULT_WORKSHOP_DATA.videoCard.buttonText}</span>
              <ExternalLink className="w-4 h-4 text-[#8B5A2B]" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
