export type DeliveryZone = 'inside' | 'outside';

export interface OrderRiskEvaluation {
  riskLevel: 'low' | 'medium' | 'high';
  isSuspicious: boolean;
  requiresAdvancePayment: boolean;
  advanceAmount: number;
  reasonBn?: string;
  customerAdviceBn?: string;
}

export interface RiskEvaluationInput {
  phone: string;
  deliveryZone: DeliveryZone;
  totalAmount: number;
  customerIsBlocked?: boolean;
  historicalCancelledOrders?: number;
  isCustomOrder?: boolean;
}

/**
 * Evaluates order risk and determines advance payment rules for Bangladesh e-commerce
 */
export function evaluateOrderRisk(input: RiskEvaluationInput): OrderRiskEvaluation {
  const {
    phone,
    deliveryZone,
    totalAmount,
    customerIsBlocked = false,
    historicalCancelledOrders = 0,
    isCustomOrder = false,
  } = input;

  // 1. Repetitive fake phone number pattern
  if (isSuspiciousPhoneNumber(phone)) {
    return {
      riskLevel: 'high',
      isSuspicious: true,
      requiresAdvancePayment: true,
      advanceAmount: totalAmount,
      reasonBn: 'অস্বাভাবিক বা পুনরাবৃত্তিমূলক ফোন নম্বর সনাক্ত হয়েছে।',
      customerAdviceBn: 'অর্ডারটি কনফার্ম করতে অনুগ্রহ করে আমাদের হটলাইনে কল করুন।',
    };
  }

  // 2. Blocked customer
  if (customerIsBlocked) {
    return {
      riskLevel: 'high',
      isSuspicious: true,
      requiresAdvancePayment: true,
      advanceAmount: totalAmount,
      reasonBn: 'এই নম্বরটি পূর্বে একাধিকবার অর্ডার ফেরত বা অস্বীকৃতির কারণে ব্লকলিস্টে রয়েছে।',
      customerAdviceBn: 'অর্ডারটি কনফার্ম করতে অনুগ্রহ করে হটলাইনে যোগাযোগ করুন।',
    };
  }

  // 2. High cancellation history (2 or more cancelled orders)
  if (historicalCancelledOrders >= 2) {
    return {
      riskLevel: 'high',
      isSuspicious: true,
      requiresAdvancePayment: true,
      advanceAmount: deliveryZone === 'outside' ? 200 : 120,
      reasonBn: 'পূর্ববর্তী ডেলিভারি বাতিলের রেকর্ড রয়েছে।',
      customerAdviceBn: 'অর্ডার কনফার্মেশনের জন্য অগ্রিম ডেলিভারি চার্জ প্রযোজ্য।',
    };
  }

  // 3. Custom-sized or made-to-order furniture
  if (isCustomOrder) {
    const bookingDeposit = Math.max(500, Math.round(totalAmount * 0.2));
    return {
      riskLevel: 'medium',
      isSuspicious: false,
      requiresAdvancePayment: true,
      advanceAmount: bookingDeposit,
      reasonBn: 'কাস্টম ফার্নিচার তৈরির জন্য বোর্ড কাটিং শুরুর পূর্বে বুকিং মানি প্রযোজ্য।',
      customerAdviceBn: `কাস্টম অর্ডারের ক্ষেত্রে ৳${bookingDeposit} অগ্রিম বুকিং প্রযোজ্য। বাকি টাকা ডেলিভারির সময় দেবেন।`,
    };
  }

  // 4. Outside Dhaka delivery (Standard BD E-commerce practice: Advance delivery charge of ৳200)
  if (deliveryZone === 'outside') {
    return {
      riskLevel: 'medium',
      isSuspicious: false,
      requiresAdvancePayment: true,
      advanceAmount: 200,
      reasonBn: 'ঢাকার বাইরে কুরিয়ার বুকিং ডেলিভারি চার্জ।',
      customerAdviceBn:
        'ঢাকার বাইরে কুরিয়ার বুকিং নিশ্চিত করতে ২০০ টাকা ডেলিভারি চার্জ অগ্রিম প্রযোজ্য (বিকাশ/নগদ)। পণ্য হাতে পেয়ে চেক করে বাকি সম্পূর্ণ মূল্য পরিশোধ করবেন।',
    };
  }

  // 5. High value orders inside Dhaka (> ৳15,000)
  if (totalAmount >= 15000) {
    return {
      riskLevel: 'medium',
      isSuspicious: false,
      requiresAdvancePayment: true,
      advanceAmount: 1000,
      reasonBn: 'উচ্চ মূল্যের ফার্নিচার অর্ডারের নিরাপত্তা যাচাই।',
      customerAdviceBn:
        '৳১৫,০০০ এর অধিক অর্ডারে ১,০০০ টাকা টোকেন বুকিং মানি প্রযোজ্য। বাকি টাকা ডেলিভারির সময় ক্যাশে দেবেন।',
    };
  }

  // 6. Normal safe order (Inside Dhaka, standard COD)
  return {
    riskLevel: 'low',
    isSuspicious: false,
    requiresAdvancePayment: false,
    advanceAmount: 0,
    customerAdviceBn: 'কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন।',
  };
}

/**
 * Validates whether a phone number matches rapid suspicious pattern
 */
export function isSuspiciousPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, '');
  // Sequential numbers like 01711111111 or 01712345678
  const isAllSame = /^(\d)\1{7,}$/.test(digits.slice(3));
  return isAllSame || digits.length < 11;
}
