'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id: customId,
      leftElement,
      rightElement,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="w-full space-y-1.5 font-bn">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs sm:text-sm font-semibold text-[#2B1D14] select-none"
          >
            {label} {required && <span className="text-[#9F1239]">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-stone-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={cn(
              'w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border text-sm text-[#2B1D14] placeholder:text-stone-400 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[#8A5A3B]/20 focus:border-[#8A5A3B]',
              error
                ? 'border-[#9F1239] focus:ring-[#9F1239]/20 focus:border-[#9F1239]'
                : 'border-[#E8E2D9] hover:border-[#D4CCC1]',
              leftElement ? 'pl-10' : '',
              rightElement ? 'pr-10' : '',
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 flex items-center text-stone-400">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="text-xs text-[#9F1239] flex items-center gap-1 font-bn font-medium animate-in fade-in"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="text-xs text-stone-500 font-bn">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
