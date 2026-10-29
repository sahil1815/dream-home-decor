/**
 * ImageKit URL Helper Utility
 * Enables high-performance, responsive WebP/AVIF transformations via ImageKit.io CDN
 * with ZERO consumption of Vercel's free 1,000 image optimization limits.
 */

export interface ImageKitTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  cropMode?: 'maintain_ratio' | 'force' | 'pad_resize';
  blur?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Checks if a given URL is hosted on ImageKit
 */
export function isImageKitUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('ik.imagekit.io');
}

/**
 * Generates an optimized ImageKit transformation URL.
 * If the URL is not from ImageKit, returns the original URL untouched.
 * 
 * Example ImageKit transformation query:
 * ?tr=w-800,q-80,f-auto
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width?: number,
  quality: number = 80,
  options?: Omit<ImageKitTransformOptions, 'width' | 'quality'>
): string {
  if (!url) {
    return 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80';
  }

  // If not ImageKit, return original URL (or Unsplash optimization if applicable)
  if (!isImageKitUrl(url)) {
    if (url.includes('images.unsplash.com') && width) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${width}&q=${quality}&auto=format`;
    }
    return url;
  }

  const transformParts: string[] = [];

  if (width) transformParts.push(`w-${width}`);
  if (options?.height) transformParts.push(`h-${options.height}`);
  if (quality) transformParts.push(`q-${quality}`);
  if (options?.cropMode) transformParts.push(`cm-${options.cropMode}`);
  if (options?.blur) transformParts.push(`bl-${options.blur}`);
  
  // Always default to auto format (delivers WebP/AVIF depending on browser support)
  const format = options?.format || 'auto';
  transformParts.push(`f-${format}`);

  const transformString = `tr=${transformParts.join(',')}`;

  // If URL already contains query parameters
  if (url.includes('?')) {
    // Check if tr= is already present
    if (url.includes('tr=') || url.includes('?tr=')) {
      return url; // Keep existing transformation
    }
    return `${url}&${transformString}`;
  }

  return `${url}?${transformString}`;
}

/**
 * Generate a standard thumbnail URL (e.g. for Admin lists or product thumbnails)
 */
export function getImageKitThumbnail(
  url: string | null | undefined,
  size: number = 200
): string {
  return getOptimizedImageUrl(url, size, 70, { height: size, cropMode: 'maintain_ratio' });
}

/**
 * Fallback curated furniture images for Dream Home Decor categories
 */
export const FALLBACK_FURNITURE_IMAGES = {
  readingTable: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
  bookshelf: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
  computerTable: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
  wallShelf: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
  dressingTable: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
  workshop1: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=80',
  workshop2: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
  heroBanner: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85',
};
