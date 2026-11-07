import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate 11-digit Bangladeshi Phone Number
 * Accepts: 017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX, 013XXXXXXXX, 014XXXXXXXX, 015XXXXXXXX, 016XXXXXXXX
 * (With or without +88 / 88 prefix)
 */
export function validateBangladeshiPhone(phone: string): { isValid: boolean; formatted: string } {
  const digits = phone.replace(/[\s-]/g, '');
  const match = digits.match(/^(?:\+?88)?(01[3-9]\d{8})$/);
  if (match) {
    return { isValid: true, formatted: match[1] };
  }
  return { isValid: false, formatted: phone };
}

/**
 * Format currency into Bangladeshi Taka (e.g. ৳3,800)
 * Uses standard Latin digits with the Taka sign for consistent numeral rendering
 */
export function formatBDT(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '৳0';
  }
  return `৳${Number(amount).toLocaleString('en-IN')}`;
}

/**
 * Convert Latin numerals to Bengali numerals when needed for editorial text
 */
export function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => banglaDigits[+w]);
}

/**
 * Format date consistently in Bengali locale
 */
export function formatBanglaDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate percentage discount
 */
export function getDiscountPercentage(originalPrice: number, discountPrice: number): number {
  if (!originalPrice || !discountPrice || originalPrice <= discountPrice) return 0;
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

/**
 * Format status in Bengali and English
 */
export function getStatusBadgeInfo(status: string) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        labelBn: 'অপেক্ষমাণ',
        className: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'confirmation_call':
      return {
        label: 'Call Done',
        labelBn: 'কনফার্মেশন কল সম্পন্ন',
        className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        labelBn: 'কনফার্ম হয়েছে',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'in_production':
      return {
        label: 'In Production',
        labelBn: 'কারখানায় তৈরি হচ্ছে',
        className: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    case 'ready':
      return {
        label: 'Ready to Ship',
        labelBn: 'প্যাকিং সম্পন্ন / প্রস্তুত',
        className: 'bg-teal-100 text-teal-800 border-teal-300',
      };
    case 'shipped':
      return {
        label: 'Shipped',
        labelBn: 'ডেলিভারিতে আছে',
        className: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        labelBn: 'ডেলিভারি সম্পন্ন',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        labelBn: 'বাতিল',
        className: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    case 'returned':
      return {
        label: 'Returned',
        labelBn: 'পণ্য ফেরত',
        className: 'bg-stone-200 text-stone-800 border-stone-400',
      };
    default:
      return {
        label: status,
        labelBn: status,
        className: 'bg-stone-100 text-stone-800 border-stone-300',
      };
  }
}

/**
 * Build WhatsApp click-to-chat URL with pre-filled message
 */
export function buildWhatsAppUrl(
  whatsappNumber: string,
  message: string
): string {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
