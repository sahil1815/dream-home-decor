import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const path = request.nextUrl.pathname;
  const isDemoAdmin = request.cookies.get('dhd_demo_admin')?.value === 'true';

  // Demo admin bypass for admin routes
  if (isDemoAdmin) {
    if (path === '/admin/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Fast path for non-admin public routes:
  // If not accessing /admin and no Supabase auth token cookie exists, skip auth check entirely.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));

  if (!path.startsWith('/admin') && !hasAuthCookie) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Strict timeout protection: never let Supabase auth hang edge/serverless middleware
  let user = null;
  try {
    const getUserWithTimeout = Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase Auth timeout')), 2500)
      ),
    ]);

    const { data } = await getUserWithTimeout;
    user = data?.user || null;
  } catch {
    user = null;
  }

  // Protect /admin routes (except /admin/login)
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }
  }

  // If already logged in as Supabase user, redirect away from /admin/login to /admin
  if (path === '/admin/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
