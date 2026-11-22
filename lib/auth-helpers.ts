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
 * Find administrative user strictly by Name, Username, or Email defined in environment variables.
 * NO hardcoded fallback usernames, passwords, or fuzzy matching.
 * Only credentials explicitly provided in environment variables (.env / .env.local) are valid:
 * - Owner: ADMIN_USERNAME, ADMIN_NAME, ADMIN_EMAIL (Password: ADMIN_PASSWORD or ADMIN_OWNER_PASSWORD_HASH)
 * - Manager: ADMIN_MANAGER_USERNAME, ADMIN_MANAGER_NAME, ADMIN_MANAGER_EMAIL (Password: ADMIN_MANAGER_PASSWORD or ADMIN_MANAGER_PASSWORD_HASH)
 * - Staff: ADMIN_STAFF_USERNAME, ADMIN_STAFF_NAME, ADMIN_STAFF_EMAIL (Password: ADMIN_STAFF_PASSWORD or ADMIN_STAFF_PASSWORD_HASH)
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

  // 1. Manager configuration strictly from environment variables
  const envManagerPassword = (process.env.ADMIN_MANAGER_PASSWORD || '').trim();
  const envManagerPasswordHash = process.env.ADMIN_MANAGER_PASSWORD_HASH;
  const envManagerEmail = (process.env.ADMIN_MANAGER_EMAIL || '').toLowerCase().trim();
  const envManagerName = process.env.ADMIN_MANAGER_NAME;
  const envManagerUsername = process.env.ADMIN_MANAGER_USERNAME;

  const managerAliases = new Set([
    ...splitAliases(envManagerUsername, envManagerEmail, envManagerName),
  ]);

  if ((envManagerPassword || envManagerPasswordHash) && managerAliases.has(normalized)) {
    const hash =
      envManagerPasswordHash || bcrypt.hashSync(envManagerPassword, 10);

    return {
      user: {
        id: 'usr_manager_01',
        email: envManagerEmail || `${envManagerUsername || 'manager'}@dreamhomedecor.com`,
        name: envManagerName || envManagerUsername || 'স্টোর ম্যানেজার (Manager)',
        role: 'manager',
      },
      passwordHash: hash,
      allowedPlainPasswords: envManagerPassword ? [envManagerPassword] : [],
    };
  }

  // 2. Staff configuration strictly from environment variables
  const envStaffPassword = (process.env.ADMIN_STAFF_PASSWORD || '').trim();
  const envStaffPasswordHash = process.env.ADMIN_STAFF_PASSWORD_HASH;
  const envStaffEmail = (process.env.ADMIN_STAFF_EMAIL || '').toLowerCase().trim();
  const envStaffName = process.env.ADMIN_STAFF_NAME;
  const envStaffUsername = process.env.ADMIN_STAFF_USERNAME;

  const staffAliases = new Set([
    ...splitAliases(envStaffUsername, envStaffEmail, envStaffName),
  ]);

  if ((envStaffPassword || envStaffPasswordHash) && staffAliases.has(normalized)) {
    const hash =
      envStaffPasswordHash || bcrypt.hashSync(envStaffPassword, 10);

    return {
      user: {
        id: 'usr_staff_01',
        email: envStaffEmail || `${envStaffUsername || 'staff'}@dreamhomedecor.com`,
        name: envStaffName || envStaffUsername || 'অর্ডার স্টাফ (Staff)',
        role: 'staff',
      },
      passwordHash: hash,
      allowedPlainPasswords: envStaffPassword ? [envStaffPassword] : [],
    };
  }

  // 3. Owner configuration strictly from environment variables
  const envOwnerPassword = (
    process.env.ADMIN_OWNER_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    ''
  ).trim();
  const envOwnerPasswordHash =
    process.env.ADMIN_OWNER_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH;
  const envOwnerEmail = (
    process.env.ADMIN_OWNER_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ''
  ).toLowerCase().trim();
  const envOwnerName = process.env.ADMIN_OWNER_NAME || process.env.ADMIN_NAME;
  const envOwnerUsername = process.env.ADMIN_OWNER_USERNAME || process.env.ADMIN_USERNAME;

  const ownerAliases = new Set([
    ...splitAliases(envOwnerUsername, envOwnerEmail, envOwnerName),
  ]);

  if ((envOwnerPassword || envOwnerPasswordHash) && ownerAliases.has(normalized)) {
    const hash =
      envOwnerPasswordHash || bcrypt.hashSync(envOwnerPassword, 10);

    return {
      user: {
        id: 'usr_owner_01',
        email: envOwnerEmail || `${envOwnerUsername || 'admin'}@dreamhomedecor.com`,
        name: envOwnerName || envOwnerUsername || 'কারখানা মালিক (Owner)',
        role: 'owner',
      },
      passwordHash: hash,
      allowedPlainPasswords: envOwnerPassword ? [envOwnerPassword] : [],
    };
  }

  return null;
}

export const findAdminByEmail = findAdminByIdentifier;
