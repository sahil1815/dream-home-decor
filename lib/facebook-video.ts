export interface ParsedFacebookVideoSuccess {
  valid: true;
  url: string;
  embedUrl: string;
  isReel: boolean;
  isShortLink: boolean;
}

export interface ParsedFacebookVideoError {
  valid: false;
  error: string;
}

export type ParsedFacebookVideoResult =
  | ParsedFacebookVideoSuccess
  | ParsedFacebookVideoError;

const ALLOWED_FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
  'www.fb.watch',
]);

const ESSENTIAL_QUERY_PARAMS = new Set(['v', 'story_fbid', 'id', 'fbid']);

export function isAllowedFacebookHost(hostname: string): boolean {
  return ALLOWED_FACEBOOK_HOSTS.has(hostname.toLowerCase());
}

/**
 * Extracts a Facebook URL from a pasted <iframe> embed snippet if the owner copied the embed code instead of the share link.
 */
function extractUrlFromInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  if (/<iframe/i.test(trimmed)) {
    const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch?.[1]) {
      const unescapedSrc = srcMatch[1].replace(/&amp;/g, '&').trim();
      try {
        const srcUrl = new URL(unescapedSrc);
        if (
          isAllowedFacebookHost(srcUrl.hostname) &&
          srcUrl.pathname.includes('/plugins/video.php')
        ) {
          const hrefParam = srcUrl.searchParams.get('href');
          if (hrefParam) {
            return hrefParam.trim();
          }
        }
      } catch {
        // Ignore and let URL parser handle/reject below
      }
      return unescapedSrc;
    }
  }

  return trimmed;
}

/**
 * Validates and normalizes a Facebook video, Reel, Watch, or fb.watch link.
 */
export function parseFacebookVideoInput(rawInput: string): ParsedFacebookVideoResult {
  const extracted = extractUrlFromInput(rawInput);
  if (!extracted) {
    return { valid: false, error: 'অনুগ্রহ করে ফেসবুক ভিডিওর লিঙ্ক দিন।' };
  }

  const withProtocol =
    /^(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\//i.test(extracted)
      ? `https://${extracted}`
      : extracted;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return {
      valid: false,
      error: 'সঠিক ফেসবুক ভিডিও লিঙ্ক দিন (যেমন: https://www.facebook.com/.../videos/...)',
    };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      valid: false,
      error: 'অবৈধ লিঙ্ক ফরম্যাট। শুধুমাত্র https ফেসবুক লিঙ্ক গ্রহণযোগ্য।',
    };
  }

  const rawHost = parsed.hostname.toLowerCase();
  if (!isAllowedFacebookHost(rawHost)) {
    return {
      valid: false,
      error:
        'শুধুমাত্র ফেসবুক ভিডিও বা রিল লিঙ্ক গ্রহণযোগ্য (facebook.com অথবা fb.watch)।',
    };
  }

  // Upgrade protocol and normalize mobile/web subdomains to canonical host
  parsed.protocol = 'https:';
  const isFbWatch = rawHost === 'fb.watch' || rawHost === 'www.fb.watch';
  parsed.hostname = isFbWatch ? 'fb.watch' : 'www.facebook.com';
  parsed.hash = '';

  const pathname = parsed.pathname;

  if (isFbWatch) {
    const slug = pathname.replace(/\//g, '').trim();
    if (!slug) {
      return {
        valid: false,
        error: 'সঠিক fb.watch ভিডিও লিঙ্ক দিন।',
      };
    }

    parsed.search = '';
    const canonicalUrl = parsed.toString();
    return {
      valid: true,
      url: canonicalUrl,
      embedUrl: buildFacebookEmbedUrl(canonicalUrl),
      isReel: false,
      isShortLink: true,
    };
  }

  // Strip Facebook tracking params while keeping video/post identifiers
  const preservedParams = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    if (ESSENTIAL_QUERY_PARAMS.has(key) && value.trim()) {
      preservedParams.set(key, value.trim());
    }
  }
  parsed.search = preservedParams.toString();

  const hasVideoIdQuery = preservedParams.has('v');
  const hasPermalinkQuery =
    /\/permalink\.php$/i.test(pathname) &&
    preservedParams.has('story_fbid') &&
    preservedParams.has('id');
  const isVideoPath =
    /\/videos?\//i.test(pathname) ||
    (/\/video\.php$/i.test(pathname) && hasVideoIdQuery) ||
    (/\/watch\/?$/i.test(pathname) && hasVideoIdQuery) ||
    /\/watch\/live\/?$/i.test(pathname) ||
    /\/reels?\//i.test(pathname) ||
    /\/share\/(?:v|r)\//i.test(pathname) ||
    /^\/share\/[^/]+/i.test(pathname) ||
    /\/posts\//i.test(pathname) ||
    hasPermalinkQuery;

  if (!isVideoPath) {
    return {
      valid: false,
      error:
        'অনুগ্রহ করে নির্দিষ্ট ফেসবুক ভিডিও, রিল অথবা Watch লিঙ্ক দিন (শুধু পেজের হোম লিঙ্ক নয়)।',
    };
  }

  const isReel = /\/reels?\//i.test(pathname) || /\/share\/r\//i.test(pathname);
  const isShortLink = /^\/share\//i.test(pathname);
  const canonicalUrl = parsed.toString();

  return {
    valid: true,
    url: canonicalUrl,
    embedUrl: buildFacebookEmbedUrl(canonicalUrl),
    isReel,
    isShortLink,
  };
}

export function buildFacebookEmbedUrl(canonicalUrl: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    canonicalUrl
  )}&show_text=false&t=0`;
}

export function getFacebookVideoEmbedData(
  url: string
): ParsedFacebookVideoSuccess | null {
  const result = parseFacebookVideoInput(url);
  return result.valid ? result : null;
}

export function sanitizeFacebookVideoUrls(
  urls: string[] | null | undefined
): string[] {
  if (!Array.isArray(urls)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const raw of urls) {
    if (typeof raw !== 'string') continue;
    const parsed = parseFacebookVideoInput(raw);
    if (parsed.valid && !seen.has(parsed.url)) {
      seen.add(parsed.url);
      cleaned.push(parsed.url);
    }
  }

  return cleaned;
}
