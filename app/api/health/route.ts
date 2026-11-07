import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/data';
import { getPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'unconfigured';
  let dbLatencyMs = 0;

  if (isSupabaseConfigured()) {
    try {
      const dbStart = Date.now();
      const supabase = getPublicClient();
      const { error } = await supabase.from('site_settings').select('id').limit(1);
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = error ? `error: ${error.message}` : 'healthy';
    } catch (err) {
      dbStatus = `unreachable: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  const checks = {
    database: dbStatus,
    database_latency_ms: dbLatencyMs,
    auth_secret: Boolean(process.env.AUTH_SECRET),
    admin_owner_configured: Boolean(
      process.env.ADMIN_OWNER_EMAIL || process.env.ADMIN_OWNER_PASSWORD_HASH
    ),
    telegram_notifications: Boolean(
      process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
    ),
    resend_notifications: Boolean(process.env.RESEND_API_KEY),
  };

  const isHealthy = dbStatus === 'healthy' || dbStatus === 'unconfigured';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'Dream Home Decor Storefront & API',
      timestamp: new Date().toISOString(),
      latency_ms: Date.now() - startTime,
      node_version: process.version,
      checks,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
