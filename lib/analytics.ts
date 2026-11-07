'use client';

/**
 * Dream Home Decor - Unified Analytics Engine (Meta Pixel + Google Analytics 4)
 * Provides client-side event tracking with event deduplication (eventID) matching server-side CAPI.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Generates a unique event ID for deduplication between Pixel and CAPI
 */
export function generateEventId(prefix = 'evt'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Tracks PageView across Meta Pixel and GA4
 */
export function trackPageView(url?: string) {
  if (typeof window === 'undefined') return;

  const currentUrl = url || window.location.pathname;

  // 1. Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }

  // 2. GA4
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_location: currentUrl,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    // Helpful dev logging
    // console.debug('[Analytics] PageView:', currentUrl);
  }
}

/**
 * Tracks ViewContent (Product Detail View)
 */
export function trackViewContent(
  product: {
    id: string;
    title: string;
    price: number;
    category?: string;
  },
  eventId?: string
) {
  if (typeof window === 'undefined') return;
  const evtId = eventId || generateEventId('vc');

  // Meta Pixel
  if (window.fbq) {
    window.fbq(
      'track',
      'ViewContent',
      {
        content_name: product.title,
        content_category: product.category || 'Furniture',
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'BDT',
      },
      { eventID: evtId }
    );
  }

  // GA4
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'BDT',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  }
}

/**
 * Tracks AddToCart
 */
export function trackAddToCart(
  item: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    category?: string;
  },
  eventId?: string
) {
  if (typeof window === 'undefined') return;
  const evtId = eventId || generateEventId('atc');

  // Meta Pixel
  if (window.fbq) {
    window.fbq(
      'track',
      'AddToCart',
      {
        content_name: item.title,
        content_category: item.category || 'Furniture',
        content_ids: [item.id],
        content_type: 'product',
        value: item.price * item.quantity,
        currency: 'BDT',
      },
      { eventID: evtId }
    );
  }

  // GA4
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'BDT',
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.title,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    });
  }
}

/**
 * Tracks InitiateCheckout
 */
export function trackInitiateCheckout(
  items: Array<{ id: string; title: string; price: number; quantity: number }>,
  totalAmount: number,
  eventId?: string
) {
  if (typeof window === 'undefined') return;
  const evtId = eventId || generateEventId('ic');

  // Meta Pixel
  if (window.fbq) {
    window.fbq(
      'track',
      'InitiateCheckout',
      {
        content_ids: items.map((i) => i.id),
        content_type: 'product',
        num_items: items.reduce((acc, curr) => acc + curr.quantity, 0),
        value: totalAmount,
        currency: 'BDT',
      },
      { eventID: evtId }
    );
  }

  // GA4
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'BDT',
      value: totalAmount,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.title,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }
}

/**
 * Tracks Purchase
 * Uses orderNumber or orderId as eventID to deduplicate with Meta CAPI
 */
export function trackPurchase(
  order: {
    orderNumber: string;
    totalAmount: number;
    items?: Array<{ id?: string; title: string; price: number; quantity: number }>;
  },
  eventId?: string
) {
  if (typeof window === 'undefined') return;
  const evtId = eventId || order.orderNumber;

  // Meta Pixel
  if (window.fbq) {
    window.fbq(
      'track',
      'Purchase',
      {
        content_type: 'product',
        content_ids: order.items?.map((i) => i.id || i.title) || [],
        num_items: order.items?.reduce((acc, curr) => acc + curr.quantity, 0) || 1,
        value: order.totalAmount,
        currency: 'BDT',
      },
      { eventID: evtId }
    );
  }

  // GA4
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: order.orderNumber,
      value: order.totalAmount,
      currency: 'BDT',
      items: order.items?.map((i) => ({
        item_id: i.id || i.title,
        item_name: i.title,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }
}

/**
 * Tracks Lead (e.g. Call Back Request or Custom Furniture inquiry)
 */
export function trackLead(leadType: string, eventId?: string) {
  if (typeof window === 'undefined') return;
  const evtId = eventId || generateEventId('lead');

  if (window.fbq) {
    window.fbq(
      'track',
      'Lead',
      {
        content_name: leadType,
      },
      { eventID: evtId }
    );
  }

  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'Lead',
      event_label: leadType,
    });
  }
}
