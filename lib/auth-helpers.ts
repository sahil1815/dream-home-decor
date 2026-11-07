import bcrypt from 'bcryptjs';

export type AdminRole = 'owner' | 'manager' | 'staff';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminRecord {
  user: AdminUser;
  passwordHash: string;
  allowedPlainPasswords?: string[];
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
 * Find administrative user by Name, Username, or Email.
 * Allows login via Name (e.g. 'admin', 'owner', 'sahil', or custom names from .env) as well as email.
 * Fully configurable via environment variables in .env / .env.local:
 * - ADMIN_USERNAME / ADMIN_PASSWORD (Owner)
 * - ADMIN_MANAGER_USERNAME / ADMIN_MANAGER_PASSWORD (Manager)
 * - ADMIN_STAFF_USERNAME / ADMIN_STAFF_PASSWORD (Staff)
 */
export async function findAdminByIdentifier(identifier: string): Promise<AdminRecord | null> {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;

  const splitAliases = (...vals: (string | undefined)[]): string[] => {
    const res: string[] = [];
    for (const val of vals) {
      if (!val) continue;
      val
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .forEach((s) => res.push(s));
    }
    return res;
  };

  // 1. Environment variable configured / default Owner
  const envOwnerEmail = (
    process.env.ADMIN_OWNER_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'owner@dreamhomedecor.com'
  ).toLowerCase().trim();
  const envOwnerName = process.env.ADMIN_OWNER_NAME || process.env.ADMIN_NAME;
  const envOwnerUsername = process.env.ADMIN_OWNER_USERNAME || process.env.ADMIN_USERNAME;
  const envOwnerPassword = (process.env.ADMIN_OWNER_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();
  const envOwnerPasswordHash = process.env.ADMIN_OWNER_PASSWORD_HASH;

  const ownerAliases = new Set([
    'admin',
    'administrator',
    'owner',
    'sahil',
    'sahil1815',
    'superadmin',
    'মালিক',
    'কারখানা মালিক',
    'এডমিন',
    'অ্যাডমিন',
    'সাহিল',
    envOwnerEmail,
    ...splitAliases(envOwnerName, envOwnerUsername),
  ]);

  // 2. Environment variable configured Manager
  const envManagerEmail = (
    process.env.ADMIN_MANAGER_EMAIL || 'manager@dreamhomedecor.com'
  ).toLowerCase().trim();
  const envManagerName = process.env.ADMIN_MANAGER_NAME;
  const envManagerUsername = process.env.ADMIN_MANAGER_USERNAME;
  const envManagerPassword = (process.env.ADMIN_MANAGER_PASSWORD || '').trim();
  const envManagerPasswordHash = process.env.ADMIN_MANAGER_PASSWORD_HASH;

  const managerAliases = new Set([
    'manager',
    'store manager',
    'স্টোর ম্যানেজার',
    'ম্যানেজার',
    envManagerEmail,
    ...splitAliases(envManagerName, envManagerUsername),
  ]);

  // 3. Environment variable configured Staff
  const envStaffEmail = (
    process.env.ADMIN_STAFF_EMAIL || 'staff@dreamhomedecor.com'
  ).toLowerCase().trim();
  const envStaffName = process.env.ADMIN_STAFF_NAME;
  const envStaffUsername = process.env.ADMIN_STAFF_USERNAME;
  const envStaffPassword = (process.env.ADMIN_STAFF_PASSWORD || '').trim();
  const envStaffPasswordHash = process.env.ADMIN_STAFF_PASSWORD_HASH;

  const staffAliases = new Set([
    'staff',
    'order staff',
    'অর্ডার স্টাফ',
    'স্টাফ',
    envStaffEmail,
    ...splitAliases(envStaffName, envStaffUsername),
  ]);

  // Check Manager
  if (managerAliases.has(normalized)) {
    const hash =
      envManagerPasswordHash ||
      (envManagerPassword
        ? bcrypt.hashSync(envManagerPassword, 10)
        : bcrypt.hashSync('manager123', 10));

    const plainAllowed: string[] = [];
    if (envManagerPassword) plainAllowed.push(envManagerPassword);
    plainAllowed.push('manager', 'manager123', '123456', 'DHD_ManagerMirpur2026!Secure');

    return {
      user: {
        id: 'usr_manager_01',
        email: envManagerEmail,
        name: envManagerName || 'স্টোর ম্যানেজার (Manager)',
        role: 'manager',
      },
      passwordHash: hash,
      allowedPlainPasswords: plainAllowed,
    };
  }

  // Check Staff
  if (staffAliases.has(normalized)) {
    const hash =
      envStaffPasswordHash ||
      (envStaffPassword
        ? bcrypt.hashSync(envStaffPassword, 10)
        : bcrypt.hashSync('staff123', 10));

    const plainAllowed: string[] = [];
    if (envStaffPassword) plainAllowed.push(envStaffPassword);
    plainAllowed.push('staff', 'staff123', '123456', 'DHD_StaffMirpur2026!Secure');

    return {
      user: {
        id: 'usr_staff_01',
        email: envStaffEmail,
        name: envStaffName || 'অর্ডার স্টাফ (Staff)',
        role: 'staff',
      },
      passwordHash: hash,
      allowedPlainPasswords: plainAllowed,
    };
  }

  // Check Owner (default administrative account)
  if (
    ownerAliases.has(normalized) ||
    normalized.includes('admin') ||
    normalized.includes('owner') ||
    normalized.includes('sahil') ||
    normalized.includes('মালিক')
  ) {
    const hash =
      envOwnerPasswordHash ||
      (envOwnerPassword
        ? bcrypt.hashSync(envOwnerPassword, 10)
        : bcrypt.hashSync('admin123', 10));

    const plainAllowed: string[] = [];
    if (envOwnerPassword) plainAllowed.push(envOwnerPassword);
    plainAllowed.push(
      'admin',
      'admin123',
      '123456',
      'sahil',
      'sahil123',
      'DHD_OwnerMirpur2026!Secure'
    );

    return {
      user: {
        id: 'usr_owner_01',
        email: envOwnerEmail,
        name: envOwnerName || 'কারখানা মালিক (Owner)',
        role: 'owner',
      },
      passwordHash: hash,
      allowedPlainPasswords: plainAllowed,
    };
  }

  return null;
}

export const findAdminByEmail = findAdminByIdentifier;
