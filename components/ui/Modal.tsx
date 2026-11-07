'use client';

import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  // Synchronize dialog open/close with native showModal() API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native cancel event (ESC key press)
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  // Light dismiss: click on native backdrop (clicks outside the dialog rect)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      onClose();
    }
  };

  const maxWidths: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={cn(
        'w-full bg-white rounded-3xl p-6 shadow-2xl border border-[#E8E2D9] text-[#2B1D14]',
        'm-auto animate-in fade-in zoom-in-95 duration-200',
        maxWidths[maxWidth],
        className
      )}
    >
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
        <div>
          <h2 id={titleId} className="font-serif font-bold text-lg sm:text-xl text-[#2B1D14]">
            {title}
          </h2>
          {description && (
            <p id={descId} className="font-bn text-xs sm:text-sm text-stone-600 mt-1">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="ডায়ালগ বন্ধ করুন"
          className="p-1.5 text-stone-400 hover:text-[#2B1D14] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="py-4 font-bn text-sm text-[#2B1D14]">{children}</div>
    </dialog>
  );
}
