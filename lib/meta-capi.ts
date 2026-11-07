import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * SHA-256 hash a normalized string for Meta Conversions API user data
 */
function hashMetaField(val?: string | null): string | undefined {
  if (!val) return undefined;
  const clean = val.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * Normalizes a Bangladeshi phone number to E.164 (without leading +)
 * e.g., "01712345678" -> "8801712345678"
 */
function normalizePhoneForMeta(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('88')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return `880${digits}`;
}

export interface MetaCapiEventPayload {
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Lead';
  eventId: string;
  eventSourceUrl?: string;
  userData: {
    phone?: string;
    name?: string;
    email?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbc?: string;
    fbp?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contentType?: string;
    contents?: Array<{ id: string; quantity: number; item_price: number }>;
    numItems?: number;
    orderId?: string;
  };
}

/**
 * Sends a server-side event to Meta Conversions API (Graph API v19.0)
 * Uses event_id for client-side Pixel deduplication.
 */
export async function sendMetaConversionsApiEvent(
  payload: MetaCapiEventPayload
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  // If credentials are not configured, log gracefully and avoid breaking the user request
  if (!pixelId || !accessToken) {
    logger.info(`[Meta CAPI] Skipped ${payload.eventName} (Pixel ID or Access Token not configured)`);
    return { success: true, skipped: true };
  }

  try {
    const normalizedPhone = normalizePhoneForMeta(payload.userData.phone);
    const hashedPhone = hashMetaField(normalizedPhone);
    const hashedName = hashMetaField(payload.userData.name);
    const hashedEmail = hashMetaField(payload.userData.email);

    const eventData = {
      event_name: payload.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.eventId,
      event_source_url: payload.eventSourceUrl || 'https://dream-home-decor.vercel.app',
      action_source: 'website',
      user_data: {
        ph: hashedPhone ? [hashedPhone] : undefined,
        fn: hashedName ? [hashedName] : undefined,
        em: hashedEmail ? [hashedEmail] : undefined,
        client_ip_address: payload.userData.clientIpAddress,
        client_user_agent: payload.userData.clientUserAgent,
        fbc: payload.userData.fbc,
        fbp: payload.userData.fbp,
      },
      custom_data: payload.customData
        ? {
            currency: payload.customData.currency || 'BDT',
            value: payload.customData.value,
            content_name: payload.customData.contentName,
            content_category: payload.customData.contentCategory,
            content_ids: payload.customData.contentIds,
            content_type: payload.customData.contentType || 'product',
            contents: payload.customData.contents,
            num_items: payload.customData.numItems,
            order_id: payload.customData.orderId,
          }
        : undefined,
    };

    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [eventData],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.warn(`[Meta CAPI Error] HTTP ${res.status}: ${errorText}`);
      return { success: false, error: errorText };
    }

    logger.info(`[Meta CAPI Success] Sent ${payload.eventName} event with ID: ${payload.eventId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[Meta CAPI Exception] Failed to send ${payload.eventName}: ${message}`);
    return { success: false, error: message };
  }
}
