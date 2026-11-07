/**
/**
 * UTM Tracking & Marketing Attribution Engine
 * Dream Home Decor - Captures and preserves campaign parameters across browsing sessions
 */

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  gclid?: string;
  referrer?: string;
  landing_page?: string;
  captured_at?: string;
}

const STORAGE_KEY = 'dhd_utm_attribution';

/**
 * Extracts UTM parameters from URL search params and stores them in sessionStorage/localStorage
 */
export function captureUtmParameters(searchParams: URLSearchParams): UtmParams | null {
  if (typeof window === 'undefined') return null;

  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');
  const utmTerm = searchParams.get('utm_term');
  const utmContent = searchParams.get('utm_content');
  const fbclid = searchParams.get('fbclid');
  const gclid = searchParams.get('gclid');

  // If at least one campaign identifier is present
  if (utmSource || utmMedium || utmCampaign || fbclid || gclid) {
    const params: UtmParams = {
      utm_source: utmSource || (fbclid ? 'facebook' : gclid ? 'google' : undefined),
      utm_medium: utmMedium || (fbclid ? 'cpc' : gclid ? 'cpc' : undefined),
      utm_campaign: utmCampaign || undefined,
      utm_term: utmTerm || undefined,
      utm_content: utmContent || undefined,
      fbclid: fbclid || undefined,
      gclid: gclid || undefined,
      referrer: document.referrer || undefined,
      landing_page: window.location.pathname,
      captured_at: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch {
      // Storage unavailable or quota exceeded
    }

    return params;
  }

  return null;
}

/**
 * Retrieves the currently stored attribution parameters
 */
export function getStoredUtmParameters(): UtmParams {
  if (typeof window === 'undefined') return {};

  try {
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }

    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      return JSON.parse(localData);
    }
  } catch {
    // Ignore storage parse errors
  }

  return {};
}

/**
 * Clears stored attribution once order is finalized
 */
export function clearStoredUtmParameters(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
