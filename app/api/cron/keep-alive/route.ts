import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional Vercel Cron Secret verification if set
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Perform a lightweight query on site_settings or count query to keep Postgres active
    const { data, error } = await supabase
      .from('site_settings')
      .select('id, site_name, updated_at')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Keep-alive ping query warning:', error.message);
      return NextResponse.json({
        success: false,
        message: 'Database query executed with notice',
        error: error.message,
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dream Home Decor Supabase keep-alive ping successful. Inactivity pause prevented.',
      site: data?.site_name || 'Dream Home Decor',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
