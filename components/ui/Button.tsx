'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'brass' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bn font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A3B] focus-visible:ring-offset-2';

    const variants: Record<string, string> = {
      primary:
        'bg-[#8A5A3B] hover:bg-[#6E442B] active:bg-[#5A3620] text-white shadow-xs rounded-xl border border-transparent',
      secondary:
        'bg-[#FAF8F5] hover:bg-[#F4ECE1] text-[#2B1D14] border border-[#E8E2D9] hover:border-[#8A5A3B]/40 rounded-xl shadow-xs',
      brass:
        'bg-[#B08D57] hover:bg-[#977745] active:bg-[#836437] text-white rounded-xl shadow-xs border border-transparent',
      outline:
        'bg-transparent hover:bg-[#8A5A3B]/10 text-[#8A5A3B] border border-[#8A5A3B] rounded-xl',
      ghost:
        'bg-transparent hover:bg-[#8A5A3B]/10 text-[#2B1D14] hover:text-[#8A5A3B] rounded-xl',
      destructive:
        'bg-[#9F1239] hover:bg-[#881337] active:bg-[#6F0D29] text-white rounded-xl shadow-xs border border-transparent',
    };

    const sizes: Record<string, string> = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2', // Meets 44px WCAG mobile touch target
      lg: 'text-base px-6 py-3.5 min-h-[48px] gap-2.5',
      icon: 'p-2.5 min-w-[44px] min-h-[44px] rounded-xl',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? 'true' : undefined}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>অপেক্ষা করুন...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
