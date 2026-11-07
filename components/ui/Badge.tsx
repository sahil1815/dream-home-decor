'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'wood' | 'sample' | 'brass' | 'neutral' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'wood',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-bn font-semibold rounded-lg border transition-colors select-none';

  const variants: Record<string, string> = {
    wood: 'bg-[#F4ECE1] text-[#8A5A3B] border-[#E8E2D9]',
    sample: 'bg-[#F4ECE1] text-[#8A5A3B] border-[#8A5A3B]/30 gap-1 shadow-2xs',
    brass: 'bg-[#FAF3E8] text-[#977745] border-[#B08D57]/30',
    neutral: 'bg-[#FAF8F5] text-stone-700 border-[#E8E2D9]',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  const sizes: Record<string, string> = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {variant === 'sample' && <Camera className="w-3 h-3 text-[#8A5A3B] shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
