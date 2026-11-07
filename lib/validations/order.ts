import { z } from 'zod';

/**
 * Normalizes any Bangladeshi phone format (+8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX)
 * to standard 11-digit format: 01XXXXXXXXX
 */
export function normalizeBangladeshiPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('8801') && digits.length === 13) {
    return digits.slice(2);
  }
  if (digits.startsWith('88') && digits.length === 13) {
    return digits.slice(2);
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits;
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  return digits;
}

/**
 * Masks customer phone number for public display: 017****678
 */
export function maskPhoneNumber(phone: string): string {
  const normalized = normalizeBangladeshiPhone(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}****${normalized.slice(8)}`;
  }
  return `${phone.slice(0, 3)}****`;
}

/**
 * Masks customer full address for public tracking, showing only district/zone
 */
export function maskAddress(address: string, deliveryZone?: string): string {
  const isInside = deliveryZone === 'inside' || /ঢাকা|dhaka|mirpur|dhanmondi|gulshan|uttara/i.test(address);
  if (isInside) {
    return 'ঢাকা মেট্রো (গোপনীয়তার স্বার্থে পুরো ঠিকানা লুকানো)';
  }
  return 'ঢাকার বাইরে (গোপনীয়তার স্বার্থে পুরো ঠিকানা লুকানো)';
}

export const orderItemSchema = z.object({
  product_id: z.string().min(1, 'প্রোডাক্ট নির্বাচন করুন'),
  product_title: z.string().optional(),
  selected_color: z.string().max(50).optional().nullable(),
  quantity: z
    .number()
    .int('পরিমাণ পূর্ণসংখ্যা হতে হবে')
    .min(1, 'কমপক্ষে ১টি পণ্য নির্বাচন করুন')
    .max(10, 'একবারে সর্বোচ্চ ১০টি অর্ডার করা যাবে'),
});

export const createOrderSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, 'অনুগ্রহ করে আপনার পুরো নাম দিন (কমপক্ষে ২ অক্ষর)')
    .max(100, 'নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে'),
  customer_phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+8801|8801|01)[3-9]\d{8}$/,
      'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)'
    ),
  customer_address: z
    .string()
    .trim()
    .min(10, 'অনুগ্রহ করে বিস্তারিত ঠিকানা দিন (বাসা/রোড/এলাকা - কমপক্ষে ১০ অক্ষর)')
    .max(300, 'ঠিকানা সর্বোচ্চ ৩০০ অক্ষরের হতে পারে'),
  delivery_zone: z.enum(['inside', 'outside'], {
    message: 'ডেলিভারি এরিয়া নির্বাচন করুন',
  }),
  payment_method: z.enum(['cod', 'bkash', 'nagad', 'bkash_manual', 'nagad_manual'], {
    message: 'পেমেন্ট মেথড নির্বাচন করুন (COD, bKash অথবা Nagad)',
  }),
  transaction_id: z.string().trim().max(100).optional().nullable(),
  order_notes: z.string().trim().max(500).optional().nullable(),
  items: z
    .array(orderItemSchema)
    .min(1, 'অর্ডারের পণ্য তালিকা খালি (কার্টে কমপক্ষে ১টি পণ্য রাখুন)'),
  // Honeypot field for anti-bot protection (must be empty)
  website: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
  // Optional client idempotency key to prevent double clicks
  idempotency_key: z.string().max(100).optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const trackOrderSchema = z.object({
  order_number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^DHD-\d{3,}$/i, 'অর্ডার নাম্বার DHD-XXXX ফরম্যাটে দিন (যেমন: DHD-1001)'),
  customer_phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+8801|8801|01)[3-9]\d{8}$/,
      'সঠিক মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)'
    ),
});

export type TrackOrderInput = z.infer<typeof trackOrderSchema>;
