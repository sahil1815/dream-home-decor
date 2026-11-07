export type OrderStatus =
  | 'pending'
  | 'confirmation_call'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface SendSmsParams {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  trackingUrl?: string;
  status: OrderStatus;
  estimatedDeliveryDate?: string;
  courierTrackingCode?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

function formatSmsAmount(amount: number): string {
  return `৳${Number(amount || 0).toLocaleString('en-US')}`;
}

/**
 * Builds standard Bengali SMS message templates according to order status
 */
export function buildBengaliSmsMessage(params: SendSmsParams): string {
  const {
    orderNumber,
    customerName,
    totalAmount,
    trackingUrl,
    status,
    estimatedDeliveryDate,
    courierTrackingCode,
  } = params;

  const baseUrl = 'https://dream-home-decor.vercel.app';
  const trackLink = trackingUrl || `${baseUrl}/track-order?orderNumber=${orderNumber}`;

  switch (status) {
    case 'pending':
      return `ড্রিম হোম ডেকোর: প্রিয় ${customerName}, আপনার অর্ডার #${orderNumber} সফলভাবে গৃহীত হয়েছে। মোট মূল্য: ${formatSmsAmount(
        totalAmount
      )}। ডেলিভারি যাচাই ও ট্র্যাকিং: ${trackLink}`;

    case 'confirmed':
      return `ড্রিম হোম ডেকোর: প্রিয় ${customerName}, আপনার অর্ডার #${orderNumber} কনফার্ম করা হয়েছে। কারখানা থেকে তৈরি সম্পন্ন করে ${
        estimatedDeliveryDate || '২-৪ দিনের মধ্যে'
      } ডেলিভারি দেওয়া হবে।`;

    case 'in_production':
      return `ড্রিম হোম ডেকোর: প্রিয় ${customerName}, আপনার ফার্নিচার অর্ডার #${orderNumber} মিরপুর কারখানায় কাটিং ও এসেম্বলিং চলছে। ট্র্যাকিং: ${trackLink}`;

    case 'shipped':
      return `ড্রিম হোম ডেকোর: আপনার অর্ডার #${orderNumber} কুরিয়ারে হস্তান্তর করা হয়েছে। ${
        courierTrackingCode ? `কুরিয়ার ট্র্যাকিং কোড: ${courierTrackingCode}। ` : ''
      }ট্র্যাকিং: ${trackLink}`;

    case 'delivered':
      return `ড্রিম হোম ডেকোর: আপনার অর্ডার #${orderNumber} সফলভাবে ডেলিভারি সম্পন্ন হয়েছে। যেকোনো প্রয়োজনে কল করুন: +8801725357873। ধন্যবাদ!`;

    case 'cancelled':
      return `ড্রিম হোম ডেকোর: দুঃখিত, আপনার অর্ডার #${orderNumber} বাতিল করা হয়েছে। বিস্তারিত জানতে আমাদের হটলাইনে যোগাযোগ করুন।`;

    default:
      return `ড্রিম হোম ডেকোর: আপনার অর্ডার #${orderNumber}-এর স্ট্যাটাস আপডেট: ${status}। ট্র্যাকিং: ${trackLink}`;
  }
}

/**
 * Sends transactional SMS to customer via Bangladeshi SMS Gateway
 * Supports Greenweb, BulkSMS BD, AlphaSMS, or generic HTTP SMS POST/GET
 * Safely defaults to simulated dispatch in development without breaking.
 */
export async function sendCustomerOrderSMS(params: SendSmsParams): Promise<SmsResult> {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'DreamHome';
  const gatewayUrl = process.env.SMS_GATEWAY_URL;

  const messageText = buildBengaliSmsMessage(params);

  // If no SMS provider credentials exist, simulate and log
  if (!apiKey || !gatewayUrl) {
    console.info(`[SMS Simulated] To: ${params.customerPhone} | Msg: "${messageText}"`);
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    const cleanPhone = params.customerPhone.replace(/[^0-9]/g, '');
    const recipientPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

    const payload = {
      api_key: apiKey,
      sender_id: senderId,
      recipient: recipientPhone,
      message: messageText,
      type: 'unicode',
    };

    const res = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SMS Delivery Failed] HTTP ${res.status}: ${errText}`);
      return { success: false, error: errText };
    }

    const data = await res.json().catch(() => ({}));
    console.info(`[SMS Delivered] Order #${params.orderNumber} to ${recipientPhone}`);
    return {
      success: true,
      messageId: data.message_id || `msg_${Date.now()}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS Exception] Failed to send SMS to ${params.customerPhone}: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
