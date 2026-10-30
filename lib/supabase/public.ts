import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let publicClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Public Supabase client for read-only storefront queries (Products, Categories, Settings, Campaigns).
 * Does NOT access cookies(), allowing Next.js to leverage full ISR and Edge CDN caching.
 */
export function getPublicClient() {
  if (publicClient) return publicClient;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://placeholder-project.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key';

  publicClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return publicClient;
}
