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
    return '/placeholders/products/smart-ergonomic-reading-table/01.jpg';
  }

  // If local asset or placeholder, return as is
  if (url.startsWith('/')) {
    return url;
  }

  // If not ImageKit, return original URL untouched
  if (!isImageKitUrl(url)) {
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
  readingTable: '/placeholders/products/smart-ergonomic-reading-table/01.jpg',
  bookshelf: '/placeholders/products/modern-multi-tier-bookshelf/01.jpg',
  computerTable: '/placeholders/products/executive-workstation-computer-desk/01.jpg',
  wallShelf: '/placeholders/products/floating-geometric-wall-shelf-set/01.jpg',
  dressingTable: '/placeholders/products/luxurious-mirror-dressing-table/01.jpg',
  workshop1: '/placeholders/site/workshop_1.jpg',
  workshop2: '/placeholders/site/workshop_2.jpg',
  heroBanner: '/placeholders/site/hero.jpg',
};
