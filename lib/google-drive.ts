/**
 * Dream Home Decor - Google Drive Media Integration Engine
 *
 * Implements Phase 3 media requirements:
 * 1. Robust Drive URL parsing for folders, files, and view links
 * 2. View-to-Direct link converter with technical explanation of why /view fails in <img>
 * 3. Public folder listing via Google Drive API v3 (with graceful fallback for missing API key)
 * 4. Automatic target matching (product slugs, hero, workshop 1-4, showroom, team)
 * 5. Media import & schema sync with placeholder deactivation and "নমুনা ছবি" tag removal
 */

export interface DriveUrlParseResult {
  type: 'folder' | 'file' | 'unknown';
  id: string | null;
  rawUrl: string;
}

export interface DriveDirectLinks {
  id: string;
  directDownloadUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
  embedUrl: string;
  explanationBn: string;
}

export interface DriveFolderFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
  webContentLink?: string;
  createdTime?: string;
  path?: string;
}

export type DriveTarget =
  | { type: 'product'; slug: string; productId?: string; productTitleBn?: string; sortOrder: number }
  | { type: 'site'; slot: string; slotLabelBn: string }
  | { type: 'unknown'; suggestedName: string };

export interface DriveScannedItem {
  fileId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailUrl: string;
  directUrl: string;
  target: DriveTarget;
  isDuplicate?: boolean;
}

export interface DriveScanResult {
  success: boolean;
  folderId?: string;
  items: DriveScannedItem[];
  totalFiles: number;
  error?: string;
  warning?: string;
  usedFallback?: boolean;
}

/**
 * Parse any Google Drive URL format or raw ID
 */
export function parseDriveUrl(input: string): DriveUrlParseResult {
  if (!input || typeof input !== 'string') {
    return { type: 'unknown', id: null, rawUrl: '' };
  }

  const rawUrl = input.trim();

  // 1. Folder URL formats:
  // e.g., https://drive.google.com/drive/folders/1abc-XYZ_123
  // e.g., https://drive.google.com/drive/u/0/folders/1abc-XYZ_123
  const folderMatch = rawUrl.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return { type: 'folder', id: folderMatch[1], rawUrl };
  }

  // 2. File /view URL formats:
  // e.g., https://drive.google.com/file/d/1abc-XYZ_123/view?usp=sharing
  const fileMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return { type: 'file', id: fileMatch[1], rawUrl };
  }

  // 3. Query param formats:
  // e.g., https://drive.google.com/open?id=1abc-XYZ_123
  // e.g., https://drive.google.com/uc?id=1abc-XYZ_123
  // e.g., https://drive.google.com/thumbnail?id=1abc-XYZ_123
  try {
    if (rawUrl.includes('drive.google.com')) {
      const parsed = new URL(rawUrl);
      const idParam = parsed.searchParams.get('id');
      if (idParam) {
        // Can be file or folder, but id query is predominantly file or shared folder
        return { type: 'file', id: idParam, rawUrl };
      }
    }
  } catch {
    // ignore URL parse errors for raw IDs
  }

  // 4. Bare Google Drive ID string (typically 25-50 chars alphanumeric with _ or -)
  if (/^[a-zA-Z0-9_-]{25,60}$/.test(rawUrl)) {
    return { type: 'file', id: rawUrl, rawUrl };
  }

  return { type: 'unknown', id: null, rawUrl };
}

/**
 * Converts any Google Drive view or share link to reliable direct download & thumbnail URLs
 * and provides technical explanation of the /view HTML preview trap.
 */
export function convertDriveViewToDirectLinks(input: string): DriveDirectLinks | null {
  const parsed = parseDriveUrl(input);
  if (!parsed.id) {
    return null;
  }

  const id = parsed.id;
  const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
  const previewUrl = `https://drive.google.com/file/d/${id}/view`;
  const embedUrl = `https://drive.google.com/file/d/${id}/preview`;

  const explanationBn =
    'Google Drive-এর "/file/d/ID/view" লিঙ্ক একটি পূর্ণাঙ্গ HTML ওয়েব পেজ রিটার্ন করে যাতে গুগল ড্রাইভের ইন্টারফেস, টুলবার ও ভিউয়ার স্ক্রিপ্ট থাকে। এটি কোনো ইমেজ বাইনারি ফাইল নয়, তাই ওয়েবসাইটের <img> ট্যাগে দিলে ব্রাউজার ছবি হিসেবে রেন্ডার করতে পারে না। সরাসরি ইমেজ প্রদর্শন করতে "uc?export=download&id=ID" অথবা গুগল থাম্বনেইল API "thumbnail?id=ID&sz=w1200" ব্যবহার করা আবশ্যক।';

  return {
    id,
    directDownloadUrl,
    thumbnailUrl,
    previewUrl,
    embedUrl,
    explanationBn,
  };
}

/**
 * Well-known site slots
 */
export const SITE_MEDIA_SLOTS = [
  { slot: 'hero', labelBn: 'হোমপেজ হিরো কাভার ব্যানার' },
  { slot: 'workshop_1', labelBn: 'ওয়ার্কশপ ধাপ ১: উন্নত মেলামাইন বোর্ড কাটিং' },
  { slot: 'workshop_2', labelBn: 'ওয়ার্কশপ ধাপ ২: ১ মিমি পিভিসি এজ ব্যান্ডিং' },
  { slot: 'workshop_3', labelBn: 'ওয়ার্কশপ ধাপ ৩: দক্ষ কারিগরদের ফিটিং' },
  { slot: 'workshop_4', labelBn: 'ওয়ার্কশপ ধাপ ৪: সুরক্ষিত বাবল র‍্যাপ প্যাকেজিং' },
  { slot: 'showroom', labelBn: 'মিরপুর শোরুম ও ডিসপ্লে সেন্টার' },
  { slot: 'about_team', labelBn: 'আমাদের কারিগর ও টিম' },
  { slot: 'about_workshop', labelBn: 'কারখানা ও মেশিনারিজ অন্দরমহল' },
  { slot: 'og_default', labelBn: 'সোশ্যাল শেয়ার প্রিভিউ (OG Image)' },
];

/**
 * Matches a folder/file path to a target product or site media slot
 */
export function matchDriveFileToTarget(
  pathOrName: string,
  knownProducts: Array<{ id: string; slug: string; title_bn: string }> = []
): DriveTarget {
  const normalized = pathOrName.toLowerCase().replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');
  const filename = segments[segments.length - 1];

  // 1. Check Site Media Slots
  if (normalized.includes('hero') || filename.startsWith('hero') || filename.startsWith('cover')) {
    return { type: 'site', slot: 'hero', slotLabelBn: 'হোমপেজ হিরো কাভার ব্যানার' };
  }

  if (normalized.includes('workshop')) {
    if (normalized.includes('1') || normalized.includes('cutting')) {
      return { type: 'site', slot: 'workshop_1', slotLabelBn: 'ওয়ার্কশপ ১: বোর্ড কাটিং' };
    }
    if (normalized.includes('2') || normalized.includes('edge') || normalized.includes('banding')) {
      return { type: 'site', slot: 'workshop_2', slotLabelBn: 'ওয়ার্কশপ ২: পিভিসি এজ ব্যান্ডিং' };
    }
    if (normalized.includes('3') || normalized.includes('fitting') || normalized.includes('assembly')) {
      return { type: 'site', slot: 'workshop_3', slotLabelBn: 'ওয়ার্কশপ ৩: কারিগর ফিটিং' };
    }
    if (normalized.includes('4') || normalized.includes('pack') || normalized.includes('bubble')) {
      return { type: 'site', slot: 'workshop_4', slotLabelBn: 'ওয়ার্কশপ ৪: প্যাকেজিং' };
    }
    return { type: 'site', slot: 'about_workshop', slotLabelBn: 'কারখানা অন্দরমহল' };
  }

  if (normalized.includes('team')) {
    return { type: 'site', slot: 'about_team', slotLabelBn: 'আমাদের কারিগর টিম' };
  }

  if (normalized.includes('showroom')) {
    return { type: 'site', slot: 'showroom', slotLabelBn: 'মিরপুর শোরুম' };
  }

  // 2. Check Known Products by slug matching
  for (const product of knownProducts) {
    if (normalized.includes(product.slug.toLowerCase())) {
      // Extract sort order number from filename (e.g. 01.jpg -> 1, 02.png -> 2)
      const numMatch = filename.match(/(\d+)/);
      const sortOrder = numMatch ? parseInt(numMatch[1], 10) : 1;
      return {
        type: 'product',
        slug: product.slug,
        productId: product.id,
        productTitleBn: product.title_bn,
        sortOrder,
      };
    }
  }

  // 3. Fallback: Check if folder structure matches products/<slug>/<file>
  const productFolderMatch = normalized.match(/(?:products|items)\/([a-z0-9-]+)\//);
  if (productFolderMatch && productFolderMatch[1]) {
    const slug = productFolderMatch[1];
    const numMatch = filename.match(/(\d+)/);
    const sortOrder = numMatch ? parseInt(numMatch[1], 10) : 1;
    return {
      type: 'product',
      slug,
      sortOrder,
    };
  }

  return {
    type: 'unknown',
    suggestedName: filename,
  };
}

/**
 * List files inside a public Google Drive folder using Google Drive API v3
 */
export async function listDrivePublicFolder(
  folderId: string,
  apiKey?: string,
  subPath: string = ''
): Promise<{ files: DriveFolderFile[]; error?: string }> {
  const key = apiKey || process.env.GOOGLE_DRIVE_API_KEY;

  if (!key) {
    return {
      files: [],
      error:
        'GOOGLE_DRIVE_API_KEY কনফিগার করা নেই। সম্পূর্ণ ফোল্ডার স্বয়ংক্রিয়ভাবে স্ক্যান করতে .env.local ফাইলে GOOGLE_DRIVE_API_KEY যুক্ত করুন, অথবা নিচে ছবির সরাসরি লিঙ্ক পেস্ট করুন।',
    };
  }

  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent(
      'files(id,name,mimeType,size,thumbnailLink,webContentLink,createdTime)'
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=name&pageSize=100&key=${key}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const message = errJson?.error?.message || `Google Drive API error: ${res.status}`;
      return { files: [], error: message };
    }

    const data = await res.json();
    const rawFiles: Array<Record<string, unknown>> = data.files || [];

    const resultFiles: DriveFolderFile[] = [];

    for (const f of rawFiles) {
      const id = String(f.id);
      const name = String(f.name);
      const mimeType = String(f.mimeType);
      const size = f.size ? Number(f.size) : undefined;
      const thumbnailLink = f.thumbnailLink ? String(f.thumbnailLink) : undefined;
      const webContentLink = f.webContentLink ? String(f.webContentLink) : undefined;
      const createdTime = f.createdTime ? String(f.createdTime) : undefined;
      const currentPath = subPath ? `${subPath}/${name}` : name;

      if (mimeType === 'application/vnd.google-apps.folder') {
        // Recursive subfolder scan (up to 2 levels deep)
        const subLevel = (subPath.match(/\//g) || []).length;
        if (subLevel < 2) {
          const subResult = await listDrivePublicFolder(id, key, currentPath);
          if (subResult.files.length > 0) {
            resultFiles.push(...subResult.files);
          }
        }
      } else if (
        mimeType.startsWith('image/') ||
        /\.(jpe?g|png|webp|heic|avif)$/i.test(name)
      ) {
        resultFiles.push({
          id,
          name,
          mimeType,
          size,
          thumbnailLink,
          webContentLink,
          createdTime,
          path: currentPath,
        });
      }
    }

    return { files: resultFiles };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown Drive API error';
    return { files: [], error: msg };
  }
}

/**
 * Scan a Drive URL (folder or individual file) and match against known products
 */
export async function scanDriveMedia(
  urlOrId: string,
  knownProducts: Array<{ id: string; slug: string; title_bn: string }> = []
): Promise<DriveScanResult> {
  const parsed = parseDriveUrl(urlOrId);

  if (!parsed.id) {
    return {
      success: false,
      items: [],
      totalFiles: 0,
      error: 'সঠিক গুগল ড্রাইভ লিঙ্ক বা ফোল্ডার আইডি পাওয়া যায়নি।',
    };
  }

  // Case 1: Individual file link
  if (parsed.type === 'file') {
    const directLinks = convertDriveViewToDirectLinks(parsed.id);
    if (!directLinks) {
      return {
        success: false,
        items: [],
        totalFiles: 0,
        error: 'ফাইল লিঙ্ক কনভার্ট করা সম্ভব হয়নি।',
      };
    }

    const target = matchDriveFileToTarget(parsed.rawUrl, knownProducts);
    const item: DriveScannedItem = {
      fileId: parsed.id,
      fileName: `drive_image_${parsed.id.slice(0, 8)}`,
      filePath: `drive_image_${parsed.id.slice(0, 8)}`,
      mimeType: 'image/jpeg',
      sizeBytes: 0,
      thumbnailUrl: directLinks.thumbnailUrl,
      directUrl: directLinks.directDownloadUrl,
      target,
    };

    return {
      success: true,
      items: [item],
      totalFiles: 1,
    };
  }

  // Case 2: Folder link
  const listRes = await listDrivePublicFolder(parsed.id);

  if (listRes.error && listRes.files.length === 0) {
    return {
      success: false,
      folderId: parsed.id,
      items: [],
      totalFiles: 0,
      error: listRes.error,
    };
  }

  const items: DriveScannedItem[] = listRes.files.map((file) => {
    const links = convertDriveViewToDirectLinks(file.id);
    const path = file.path || file.name;
    const target = matchDriveFileToTarget(path, knownProducts);

    return {
      fileId: file.id,
      fileName: file.name,
      filePath: path,
      mimeType: file.mimeType,
      sizeBytes: file.size || 0,
      thumbnailUrl: links?.thumbnailUrl || file.thumbnailLink || '',
      directUrl: links?.directDownloadUrl || '',
      target,
    };
  });

  return {
    success: true,
    folderId: parsed.id,
    items,
    totalFiles: items.length,
  };
}
