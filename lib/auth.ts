import bcrypt from 'bcryptjs';
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
  findAdminByIdentifier,
  findAdminByEmail,
} from './auth-helpers';

export type { AdminRole, AdminSession, AdminUser, AdminRecord };
export {
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
  hasRequiredRole,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  findAdminByIdentifier,
  findAdminByEmail,
};

async function getNextCookies() {
  const { cookies } = await import('next/headers');
  return await cookies();
}

/**
 * Get current admin session from incoming cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await getNextCookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  return await verifySessionToken(token);
}

/**
 * Assert that the request comes from an authenticated admin with required minimum role.
 * Throws if unauthorized.
 */
export async function requireAdmin(minRole: AdminRole = 'staff'): Promise<AdminSession> {
  const session = await getAdminSession();
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

  const record = await findAdminByIdentifier(identifier);
  if (!record) {
    recordFailedLogin(rateLimitKey);
    return { success: false, error: 'ভুল নাম বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিন।' };
  }

  let isPasswordValid = false;
  if (record.allowedPlainPasswords?.includes(pass)) {
    isPasswordValid = true;
  } else {
    isPasswordValid = await bcrypt.compare(pass, record.passwordHash);
  }

  if (!isPasswordValid) {
    recordFailedLogin(rateLimitKey);
    return { success: false, error: 'ভুল নাম বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিন।' };
  }

  // Clear rate limit record on successful login
  clearLoginAttempts(rateLimitKey);

  // Set httpOnly session cookie
  const token = await createSessionToken(record.user);
  const cookieStore = await getNextCookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });

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
