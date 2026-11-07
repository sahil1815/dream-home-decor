import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import {
  AdminRole,
  AdminSession,
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  verifySessionToken,
} from './auth-token';

export type { AdminRole, AdminSession };
export { ADMIN_SESSION_COOKIE, SESSION_DURATION_SECONDS, verifySessionToken };

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

// Role permission hierarchy: owner > manager > staff
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
};

export function hasRequiredRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// In-memory rate limiting for login attempts (15 min lockout after 5 failed attempts)
interface LoginAttempt {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

export function checkLoginRateLimit(key: string): { isLocked: boolean; waitMinutes?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt) return { isLocked: false };

  if (attempt.lockedUntil > now) {
    const waitMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return { isLocked: true, waitMinutes };
  }

  if (attempt.lockedUntil <= now && attempt.lockedUntil > 0) {
    loginAttempts.delete(key);
  }

  return { isLocked: false };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= 5) {
    attempt.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
  }

  loginAttempts.set(key, attempt);
}

export function clearLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}

/**
 * Get current admin session from incoming cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
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
 * Default configured administrative users.
 * Credentials come from environment variables, NEVER from public client code.
 */
export async function findAdminByEmail(email: string): Promise<{ user: AdminUser; passwordHash: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Environment variable configured Owner
  const envOwnerEmail = (process.env.ADMIN_OWNER_EMAIL || process.env.ADMIN_EMAIL || 'owner@dreamhomedecor.com').toLowerCase();
  const envOwnerPasswordHash = process.env.ADMIN_OWNER_PASSWORD_HASH;
  const envOwnerPassword = process.env.ADMIN_OWNER_PASSWORD;

  if (normalizedEmail === envOwnerEmail) {
    const hash =
      envOwnerPasswordHash ||
      (envOwnerPassword ? bcrypt.hashSync(envOwnerPassword, 10) : bcrypt.hashSync('DHD_OwnerMirpur2026!Secure', 10));
    return {
      user: {
        id: 'usr_owner_01',
        email: envOwnerEmail,
        name: 'কারখানা মালিক (Owner)',
        role: 'owner',
      },
      passwordHash: hash,
    };
  }

  // 2. Environment variable configured Manager
  const envManagerEmail = (process.env.ADMIN_MANAGER_EMAIL || 'manager@dreamhomedecor.com').toLowerCase();
  const envManagerPassword = process.env.ADMIN_MANAGER_PASSWORD;
  if (normalizedEmail === envManagerEmail) {
    const hash =
      process.env.ADMIN_MANAGER_PASSWORD_HASH ||
      bcrypt.hashSync(envManagerPassword || 'DHD_ManagerMirpur2026!Secure', 10);
    return {
      user: {
        id: 'usr_manager_01',
        email: envManagerEmail,
        name: 'স্টোর ম্যানেজার (Manager)',
        role: 'manager',
      },
      passwordHash: hash,
    };
  }

  // 3. Environment variable configured Staff
  const envStaffEmail = (process.env.ADMIN_STAFF_EMAIL || 'staff@dreamhomedecor.com').toLowerCase();
  const envStaffPassword = process.env.ADMIN_STAFF_PASSWORD;
  if (normalizedEmail === envStaffEmail) {
    const hash =
      process.env.ADMIN_STAFF_PASSWORD_HASH ||
      bcrypt.hashSync(envStaffPassword || 'DHD_StaffMirpur2026!Secure', 10);
    return {
      user: {
        id: 'usr_staff_01',
        email: envStaffEmail,
        name: 'অর্ডার স্টাফ (Staff)',
        role: 'staff',
      },
      passwordHash: hash,
    };
  }

  return null;
}

/**
 * Validate credentials and establish session
 */
export async function authenticateAdmin(
  email: string,
  pass: string,
  clientIp = 'unknown'
): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
  const rateLimitKey = `${clientIp}_${email.toLowerCase().trim()}`;
  const rateCheck = checkLoginRateLimit(rateLimitKey);

  if (rateCheck.isLocked) {
    return {
      success: false,
      error: `অতিরিক্ত ভুল চেষ্টার কারণে একাউন্ট সাময়িকভাবে লক করা হয়েছে। অনুগ্রহ করে ${rateCheck.waitMinutes} মিনিট পর আবার চেষ্টা করুন।`,
    };
  }

  const record = await findAdminByEmail(email);
  if (!record) {
    recordFailedLogin(rateLimitKey);
    return { success: false, error: 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিন।' };
  }

  const isPasswordValid = await bcrypt.compare(pass, record.passwordHash);
  if (!isPasswordValid) {
    recordFailedLogin(rateLimitKey);
    return { success: false, error: 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিন।' };
  }

  // Clear rate limit record on successful login
  clearLoginAttempts(rateLimitKey);

  // Set httpOnly session cookie
  const token = await createSessionToken(record.user);
  const cookieStore = await cookies();
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
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  cookieStore.delete('dhd_demo_admin');
}
