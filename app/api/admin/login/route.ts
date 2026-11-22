import { NextResponse, type NextRequest } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.name ?? body.username ?? body.identifier ?? body.email ?? '').trim();
    const password = body.password ?? body.pass ?? '';

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const result = await authenticateAdmin(identifier, password, ip);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
