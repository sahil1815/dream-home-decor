import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/auth-token';

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Create base response
  const response = NextResponse.next({
    request,
  });

  // Inject strict HTTP security headers onto every outgoing response
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Remove any legacy insecure demo bypass cookie if encountered
  if (request.cookies.has('dhd_demo_admin')) {
    response.cookies.delete('dhd_demo_admin');
  }

  // Admin route protection
  if (path.startsWith('/admin')) {
    // Inject robots noindex on all admin pages
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

    const isLoginPage = path === '/admin/login';

    if (isLoginPage) {
      if (session) {
        // Already logged in, redirect to dashboard
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/admin';
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }

    // Any other /admin route requires a valid session
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
