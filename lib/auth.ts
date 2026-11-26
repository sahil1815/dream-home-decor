import {
  AdminRole,
  AdminSession,
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  verifySessionToken,
} from './auth-token';
import {
  AdminUser,
  AdminRecord,
  hasRequiredRole,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  clearAllLoginAttempts,
  findAdminByIdentifier,
  findAdminByEmail,
  verifyRecordPassword,
} from './auth-helpers';
import {
  getActiveTokenState,
  recordAdminLastLogin,
  resolveAdminForLogin,
} from './admin-credentials';

export type { AdminRole, AdminSession, AdminUser, AdminRecord };
export {
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
  hasRequiredRole,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  clearAllLoginAttempts,
  findAdminByIdentifier,
  findAdminByEmail,
};

async function getNextCookies() {
  const { cookies } = await import('next/headers');
  return await cookies();
}

export async function setAdminSessionCookie(
  user: { id: string; email: string; name: string; role: AdminRole; tokenVersion?: number }
): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await getNextCookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Get current admin session from incoming cookies and verify token_version is still valid.
 */
export async function getAdminSession(options?: { bypassCache?: boolean }): Promise<AdminSession | null> {
  const cookieStore = await getNextCookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const activeState = await getActiveTokenState(session.role, Boolean(options?.bypassCache));
  if (!activeState.isActive) return null;
  if ((session.tokenVersion ?? 1) !== activeState.tokenVersion) {
    return null;
  }

  return session;
}

/**
 * Assert that the request comes from an authenticated admin with required minimum role.
 * Throws if unauthorized.
 */
export async function requireAdmin(
  minRole: AdminRole = 'staff',
  options?: { bypassCache?: boolean }
): Promise<AdminSession> {
  const session = await getAdminSession(options);
  if (!session) {
    throw new Error('অননুমোদিত: অ্যাডমিন লগইন প্রয়োজন (Unauthorized)');
  }

  if (!hasRequiredRole(session.role, minRole)) {
    throw new Error(`অননুমোদিত: এই কাজের জন্য ${minRole} পারমিশন প্রয়োজন`);
  }

  return session;
}

/**
 * Validate credentials and establish session
 */
export async function authenticateAdmin(
  identifier: string,
  pass: string,
  clientIp = 'unknown'
): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
  const normalizedId = identifier.toLowerCase().trim();
  const rateLimitKey = `${clientIp}_${normalizedId}`;
  const rateCheck = checkLoginRateLimit(rateLimitKey);

  if (rateCheck.isLocked) {
    return {
      success: false,
      error: `অতিরিক্ত ভুল চেষ্টার কারণে একাউন্ট সাময়িকভাবে লক করা হয়েছে। অনুগ্রহ করে ${rateCheck.waitMinutes} মিনিট পর আবার চেষ্টা করুন।`,
    };
  }

  const record = await resolveAdminForLogin(identifier);
  if (!record) {
    recordFailedLogin(rateLimitKey);
    return { success: false, error: 'ভুল নাম বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিন।' };
  }

  const isPasswordValid = await verifyRecordPassword(record, pass);

  if (!isPasswordValid) {
    recordFailedLogin(rateLimitKey);
    return { success: false, error: 'ভুল নাম বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিন।' };
  }

  // Clear rate limit record on successful login
  clearLoginAttempts(rateLimitKey);

  // Set httpOnly session cookie with current tokenVersion
  await setAdminSessionCookie({
    ...record.user,
    tokenVersion: record.tokenVersion ?? 1,
  });

  // Update last login timestamp asynchronously
  recordAdminLastLogin(record.user.role).catch(() => {});

  return { success: true, user: record.user };
}

/**
 * Logout and invalidate session cookie
 */
export async function logoutAdminSession(): Promise<void> {
  const cookieStore = await getNextCookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  cookieStore.delete('dhd_demo_admin');
}
