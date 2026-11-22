import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for larger image uploads

export async function POST(request: NextRequest) {
  try {
    await requireAdmin('staff');

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'কোনো ইমেজ ফাইল নির্বাচন করা হয়নি।' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP) গ্রহণযোগ্য।' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'ফাইলের সাইজ ১৫ মেগাবাইট (15MB)-এর বেশি হতে পারবে না।' },
        { status: 400 }
      );
    }

    const webhookUrl =
      process.env.GOOGLE_DRIVE_WEBHOOK_URL ||
      'https://script.google.com/macros/s/AKfycbzUIpSh7X6mPEmpT7_86qXTMo4hZlPn_mcV3gTwRBL7TWiuzp0VyU2Ijfgq6h7THgPkmQ/exec';

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const payload = {
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      base64,
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          error: `গুগল ড্রাইভ আপলোড ব্যর্থ হয়েছে (${res.status}): ${errText.slice(0, 100)}`,
        },
        { status: 502 }
      );
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || 'গুগল ড্রাইভে ফাইল সংরক্ষণ করা যায়নি।',
        },
        { status: 500 }
      );
    }

    const directUrl = data.directUrl || `https://drive.google.com/thumbnail?id=${data.fileId}&sz=w1600`;

    return NextResponse.json({
      success: true,
      fileId: data.fileId,
      fileName: data.fileName || file.name,
      url: directUrl,
      message: 'গুগল ড্রাইভে ছবি সফলভাবে আপলোড হয়েছে!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown upload error';
    return NextResponse.json(
      { success: false, error: `আপলোড করার সময় ত্রুটি ঘটেছে: ${msg}` },
      { status: 500 }
    );
  }
}
