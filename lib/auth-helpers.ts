import fs from 'fs/promises';
import path from 'path';
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
  tokenVersion?: number;
  source?: 'env' | 'database';
}

export interface SessionLike {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  tokenVersion?: number;
  expiresAt: number;
}

const BCRYPT_SALT_ROUNDS = 12;

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

// In-memory token version tracking when Supabase is offline/unconfigured
const localFallbackTokenVersions = new Map<AdminRole, number>();

export function getLocalFallbackTokenVersion(role: AdminRole): number {
  return localFallbackTokenVersions.get(role) ?? 1;
}

export function setLocalFallbackTokenVersion(role: AdminRole, version: number): void {
  localFallbackTokenVersions.set(role, version);
}

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

export function clearAllLoginAttempts(): void {
  loginAttempts.clear();
}

/**
 * Unescape `\$` sequences that may remain if `.env.local` is loaded without dotenv-expand.
 */
export function normalizeBcryptHash(hash?: string): string | undefined {
  if (!hash) return undefined;
  const trimmed = hash.trim().replace(/\\\$/g, '$');
  return trimmed || undefined;
}

const WEAK_PASSWORDS = new Set([
  'admin',
  'admin123',
  'admin1234',
  'administrator',
  'manager',
  'manager123',
  'staff',
  'staff123',
  'password',
  'password123',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'qwerty123',
  'dreamhomedecor',
]);

/**
 * Enforce strong password policy for admin accounts.
 */
export function validateNewPassword(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'পাসওয়ার্ড ১২৮ অক্ষরের বেশি হতে পারবে না।' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: 'পাসওয়ার্ডে অন্তত একটি ইংরেজি অক্ষর (A-Z বা a-z) থাকতে হবে।' };
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return {
      valid: false,
      error: 'পাসওয়ার্ডে অন্তত একটি সংখ্যা (0-9) অথবা বিশেষ চিহ্ন (!@#$...) থাকতে হবে।',
    };
  }
  if (WEAK_PASSWORDS.has(password.trim().toLowerCase())) {
    return {
      valid: false,
      error: 'এটি একটি সাধারণ/দুর্বল পাসওয়ার্ড। অনুগ্রহ করে আরও শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।',
    };
  }
  return { valid: true };
}

export async function verifyRecordPassword(
  record: AdminRecord,
  candidatePassword: string
): Promise<boolean> {
  if (!candidatePassword) return false;
  if (record.allowedPlainPasswords?.includes(candidatePassword)) {
    return true;
  }
  if (!record.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, record.passwordHash);
}

export interface RoleEnvMetadata {
  role: AdminRole;
  id: string;
  username: string;
  email: string;
  name: string;
  aliases: string[];
  plainPassword?: string;
  passwordHash?: string;
  hashEnvKey: string;
  plainEnvKeys: string[];
}

function splitAliases(...vals: (string | undefined)[]): string[] {
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
}

export function getRoleEnvMetadata(role: AdminRole): RoleEnvMetadata {
  if (role === 'manager') {
    const email = (process.env.ADMIN_MANAGER_EMAIL || '').toLowerCase().trim();
    const name = process.env.ADMIN_MANAGER_NAME;
    const username = process.env.ADMIN_MANAGER_USERNAME;
    return {
      role: 'manager',
      id: 'usr_manager_01',
      username: username || 'manager',
      email: email || `${username || 'manager'}@dreamhomedecor.com`,
      name: name || username || 'স্টোর ম্যানেজার (Manager)',
      aliases: splitAliases(username, email, name),
      plainPassword: (process.env.ADMIN_MANAGER_PASSWORD || '').trim() || undefined,
      passwordHash: normalizeBcryptHash(process.env.ADMIN_MANAGER_PASSWORD_HASH),
      hashEnvKey: 'ADMIN_MANAGER_PASSWORD_HASH',
      plainEnvKeys: ['ADMIN_MANAGER_PASSWORD'],
    };
  }

  if (role === 'staff') {
    const email = (process.env.ADMIN_STAFF_EMAIL || '').toLowerCase().trim();
    const name = process.env.ADMIN_STAFF_NAME;
    const username = process.env.ADMIN_STAFF_USERNAME;
    return {
      role: 'staff',
      id: 'usr_staff_01',
      username: username || 'staff',
      email: email || `${username || 'staff'}@dreamhomedecor.com`,
      name: name || username || 'অর্ডার স্টাফ (Staff)',
      aliases: splitAliases(username, email, name),
      plainPassword: (process.env.ADMIN_STAFF_PASSWORD || '').trim() || undefined,
      passwordHash: normalizeBcryptHash(process.env.ADMIN_STAFF_PASSWORD_HASH),
      hashEnvKey: 'ADMIN_STAFF_PASSWORD_HASH',
      plainEnvKeys: ['ADMIN_STAFF_PASSWORD'],
    };
  }

  const email = (process.env.ADMIN_OWNER_EMAIL || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const name = process.env.ADMIN_OWNER_NAME || process.env.ADMIN_NAME;
  const username = process.env.ADMIN_OWNER_USERNAME || process.env.ADMIN_USERNAME;
  return {
    role: 'owner',
    id: 'usr_owner_01',
    username: username || 'admin',
    email: email || `${username || 'admin'}@dreamhomedecor.com`,
    name: name || username || 'কারখানা মালিক (Owner)',
    aliases: splitAliases(username, email, name),
    plainPassword:
      (process.env.ADMIN_OWNER_PASSWORD || process.env.ADMIN_PASSWORD || '').trim() || undefined,
    passwordHash: normalizeBcryptHash(
      process.env.ADMIN_OWNER_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH
    ),
    hashEnvKey: 'ADMIN_OWNER_PASSWORD_HASH',
    plainEnvKeys: ['ADMIN_OWNER_PASSWORD', 'ADMIN_PASSWORD', 'ADMIN_PASSWORD_HASH'],
  };
}

export function buildEnvAdminRecord(role: AdminRole): AdminRecord | null {
  const meta = getRoleEnvMetadata(role);
  if (!meta.passwordHash && !meta.plainPassword) return null;

  // Security: When a bcrypt hash is configured, ignore plaintext fallback so rotated passwords stay invalidated.
  const hash = meta.passwordHash || bcrypt.hashSync(meta.plainPassword!, 10);
  const allowedPlainPasswords = meta.passwordHash ? [] : meta.plainPassword ? [meta.plainPassword] : [];

  return {
    user: {
      id: meta.id,
      email: meta.email,
      name: meta.name,
      role: meta.role,
    },
    passwordHash: hash,
    allowedPlainPasswords,
    tokenVersion: getLocalFallbackTokenVersion(role),
    source: 'env',
  };
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

  const roles: AdminRole[] = ['manager', 'staff', 'owner'];
  for (const role of roles) {
    const meta = getRoleEnvMetadata(role);
    if (meta.aliases.includes(normalized)) {
      const record = buildEnvAdminRecord(role);
      if (record) return record;
    }
  }

  return null;
}

export const findAdminByEmail = findAdminByIdentifier;

export interface EnvSyncResult {
  synced: boolean;
  envFile?: string;
  reason?: 'updated' | 'serverless_readonly' | 'no_env_file' | 'readonly_filesystem' | 'write_error';
}

/**
 * Resolve writable env file path if present (`.env.local` preferred over `.env`).
 */
export async function detectEnvFileTarget(cwd = process.cwd()): Promise<{
  exists: boolean;
  writable: boolean;
  fileName?: string;
  filePath?: string;
  isServerless: boolean;
}> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    return { exists: false, writable: false, isServerless: true };
  }

  for (const fileName of ['.env.local', '.env']) {
    const candidate = path.join(/*turbopackIgnore: true*/ cwd, fileName);
    try {
      await fs.access(/*turbopackIgnore: true*/ candidate, fs.constants.F_OK);
      try {
        await fs.access(/*turbopackIgnore: true*/ candidate, fs.constants.W_OK);
        return { exists: true, writable: true, fileName, filePath: candidate, isServerless: false };
      } catch {
        return { exists: true, writable: false, fileName, filePath: candidate, isServerless: false };
      }
    } catch {
      // Try next file
    }
  }

  return { exists: false, writable: false, isServerless: false };
}

/**
 * Escapes `$` as `\$` so Next.js `@next/env` (dotenv-expand) preserves bcrypt hashes verbatim.
 */
export function formatBcryptHashForDotenv(bcryptHash: string): string {
  const escaped = bcryptHash.replace(/\$/g, '\\$');
  return `"${escaped}"`;
}

/**
 * Safely update `.env.local` (or `.env`) with the bcrypt password hash for `role`
 * and remove legacy plaintext password variables so old passwords cannot persist.
 */
export async function syncPasswordToEnvFile(
  role: AdminRole,
  bcryptHash: string,
  options?: { envFilePath?: string; forceReadOnly?: boolean }
): Promise<EnvSyncResult> {
  const meta = getRoleEnvMetadata(role);

  // Always update in-memory process.env so current Node process immediately honors the new hash
  process.env[meta.hashEnvKey] = bcryptHash;
  for (const plainKey of meta.plainEnvKeys) {
    delete process.env[plainKey];
  }

  if (options?.forceReadOnly || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return { synced: false, reason: 'serverless_readonly' };
  }

  let targetPath = options?.envFilePath;
  let targetName = targetPath ? path.basename(targetPath) : undefined;

  if (!targetPath) {
    const detected = await detectEnvFileTarget();
    if (!detected.exists || !detected.filePath) {
      return { synced: false, reason: 'no_env_file' };
    }
    if (!detected.writable) {
      return { synced: false, envFile: detected.fileName, reason: 'readonly_filesystem' };
    }
    targetPath = detected.filePath;
    targetName = detected.fileName;
  }

  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ targetPath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const formattedValue = formatBcryptHashForDotenv(bcryptHash);
    const keysToRemove = new Set(meta.plainEnvKeys);

    let hashLineUpdated = false;
    const updatedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) {
        updatedLines.push(line);
        continue;
      }

      const key = trimmed.slice(0, eqIdx).trim();

      if (key === meta.hashEnvKey) {
        if (!hashLineUpdated) {
          updatedLines.push(`${meta.hashEnvKey}=${formattedValue}`);
          hashLineUpdated = true;
        }
        continue;
      }

      if (keysToRemove.has(key)) {
        if (!hashLineUpdated) {
          updatedLines.push(`${meta.hashEnvKey}=${formattedValue}`);
          hashLineUpdated = true;
        }
        continue;
      }

      updatedLines.push(line);
    }

    if (!hashLineUpdated) {
      if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== '') {
        updatedLines.push('');
      }
      updatedLines.push(`${meta.hashEnvKey}=${formattedValue}`);
    }

    const nextContent = updatedLines.join('\n');
    await fs.writeFile(targetPath, nextContent, { encoding: 'utf-8', mode: 0o600 });

    return { synced: true, envFile: targetName, reason: 'updated' };
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return { synced: false, envFile: targetName, reason: 'readonly_filesystem' };
    }
    return { synced: false, envFile: targetName, reason: 'write_error' };
  }
}

export interface StoredAdminRecord {
  id: string;
  email: string;
  username?: string | null;
  name: string;
  role: AdminRole;
  passwordHash: string;
  tokenVersion: number;
  isActive: boolean;
}

export interface CredentialStoreAdapter {
  getByRole(role: AdminRole): Promise<StoredAdminRecord | null>;
  savePassword(input: {
    role: AdminRole;
    email: string;
    username: string;
    name: string;
    passwordHash: string;
    tokenVersion: number;
    updatedBy: string;
    nowIso: string;
  }): Promise<{ saved: boolean; error?: string }>;
  writeAuditLog?(entry: {
    adminEmail: string;
    adminRole: AdminRole;
    targetRole: AdminRole;
    dbSaved: boolean;
    envSynced: boolean;
    envFile?: string;
    envReason?: string;
    tokenVersion: number;
  }): Promise<void>;
  onRotated?(role: AdminRole): void;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
  message?: string;
  dbSaved?: boolean;
  dbError?: string;
  envSynced?: boolean;
  envFile?: string;
  envReason?: EnvSyncResult['reason'];
  newTokenVersion?: number;
  updatedUser?: {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
  };
}

/**
 * Core password-change orchestrator shared by production DB store and unit tests.
 */
export async function changePasswordWithStore(
  params: {
    actorSession: SessionLike;
    targetRole: AdminRole;
    currentOwnerPassword: string;
    newPassword: string;
    confirmPassword: string;
    clientIp?: string;
    envFilePath?: string;
    forceReadOnlyEnv?: boolean;
  },
  store?: CredentialStoreAdapter
): Promise<ChangePasswordResult> {
  const {
    actorSession,
    targetRole,
    currentOwnerPassword,
    newPassword,
    confirmPassword,
    clientIp = 'unknown',
    envFilePath,
    forceReadOnlyEnv,
  } = params;

  if (actorSession.role !== 'owner') {
    return { success: false, error: 'শুধুমাত্র কারখানা মালিক (Owner) পাসওয়ার্ড পরিবর্তন করতে পারবেন।' };
  }

  const rateLimitKey = `pwchange_${clientIp}_${actorSession.email.toLowerCase()}`;
  const rateCheck = checkLoginRateLimit(rateLimitKey);
  if (rateCheck.isLocked) {
    return {
      success: false,
      error: `অতিরিক্ত ভুল পাসওয়ার্ড চেষ্টার কারণে পাসওয়ার্ড পরিবর্তন সাময়িকভাবে লক করা হয়েছে। ${rateCheck.waitMinutes} মিনিট পর আবার চেষ্টা করুন।`,
    };
  }

  if (!currentOwnerPassword) {
    return { success: false, error: 'অনুগ্রহ করে আপনার বর্তমান মালিক (Owner) পাসওয়ার্ড দিন।' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।' };
  }

  const policy = validateNewPassword(newPassword);
  if (!policy.valid) {
    return { success: false, error: policy.error };
  }

  const dbOwner = store ? await store.getByRole('owner') : null;
  const envOwner = buildEnvAdminRecord('owner');

  const ownerRecord: AdminRecord | null = dbOwner
    ? {
        user: {
          id: dbOwner.id || envOwner?.user.id || 'usr_owner_01',
          email: dbOwner.email || envOwner?.user.email || actorSession.email,
          name: dbOwner.name || envOwner?.user.name || actorSession.name,
          role: 'owner',
        },
        passwordHash: dbOwner.passwordHash,
        allowedPlainPasswords: [],
        tokenVersion: dbOwner.tokenVersion,
        source: 'database',
      }
    : envOwner;

  if (!ownerRecord) {
    return { success: false, error: 'মালিক (Owner) একাউন্ট কনফিগারেশন খুঁজে পাওয়া যায়নি।' };
  }

  const isCurrentValid = await verifyRecordPassword(ownerRecord, currentOwnerPassword);
  if (!isCurrentValid) {
    recordFailedLogin(rateLimitKey);
    return { success: false, error: 'বর্তমান মালিক পাসওয়ার্ডটি সঠিক নয়।' };
  }

  clearLoginAttempts(rateLimitKey);

  if (targetRole === 'owner' && newPassword === currentOwnerPassword) {
    return {
      success: false,
      error: 'নতুন পাসওয়ার্ডটি বর্তমান পাসওয়ার্ডের থেকে ভিন্ন হতে হবে।',
    };
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  const nowIso = new Date().toISOString();

  const targetMeta = getRoleEnvMetadata(targetRole);
  const existingTargetDb = store ? await store.getByRole(targetRole) : null;
  const previousTokenVersion =
    existingTargetDb?.tokenVersion ?? getLocalFallbackTokenVersion(targetRole);
  const nextTokenVersion = previousTokenVersion + 1;

  let dbSaved = false;
  let dbErrorMsg: string | undefined;

  if (store) {
    const saveRes = await store.savePassword({
      role: targetRole,
      email: existingTargetDb?.email || targetMeta.email,
      username: existingTargetDb?.username || targetMeta.username,
      name: existingTargetDb?.name || targetMeta.name,
      passwordHash: newHash,
      tokenVersion: nextTokenVersion,
      updatedBy: actorSession.email,
      nowIso,
    });
    dbSaved = saveRes.saved;
    dbErrorMsg = saveRes.error;
  }

  const envResult = await syncPasswordToEnvFile(targetRole, newHash, {
    envFilePath,
    forceReadOnly: forceReadOnlyEnv,
  });

  if (!dbSaved && !envResult.synced) {
    return {
      success: false,
      error: dbErrorMsg
        ? `পাসওয়ার্ড সংরক্ষণ করা যায়নি। ডাটাবেজ ত্রুটি: ${dbErrorMsg}`
        : 'ডাটাবেজ বা সার্ভারের .env ফাইল কোনোটিই রাইটেবল নয়, তাই পাসওয়ার্ড সংরক্ষণ করা যায়নি।',
      dbSaved: false,
      dbError: dbErrorMsg,
      envSynced: false,
      envReason: envResult.reason,
    };
  }

  setLocalFallbackTokenVersion(targetRole, nextTokenVersion);
  store?.onRotated?.(targetRole);

  if (store?.writeAuditLog) {
    await store.writeAuditLog({
      adminEmail: actorSession.email,
      adminRole: actorSession.role,
      targetRole,
      dbSaved,
      envSynced: envResult.synced,
      envFile: envResult.envFile,
      envReason: envResult.reason,
      tokenVersion: nextTokenVersion,
    });
  }

  const targetUser = {
    id: existingTargetDb?.id || targetMeta.id,
    email: existingTargetDb?.email || targetMeta.email,
    name: existingTargetDb?.name || targetMeta.name,
    role: targetRole,
  };

  return {
    success: true,
    dbSaved,
    dbError: dbErrorMsg,
    envSynced: envResult.synced,
    envFile: envResult.envFile,
    envReason: envResult.reason,
    newTokenVersion: nextTokenVersion,
    updatedUser: targetUser,
    message: envResult.synced
      ? dbSaved
        ? `পাসওয়ার্ড ডাটাবেজ এবং ${envResult.envFile} উভয় স্থানেই নিরাপদভাবে পরিবর্তন হয়েছে।`
        : `পাসওয়ার্ড ${envResult.envFile} ফাইলে নিরাপদভাবে আপডেট করা হয়েছে।`
      : 'পাসওয়ার্ড ডাটাবেজে নিরাপদভাবে সংরক্ষিত হয়েছে এবং পূর্বের সকল সেশন বাতিল করা হয়েছে।',
  };
}
