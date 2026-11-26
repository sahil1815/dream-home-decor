import { createAdminClient } from './supabase/admin';
import { isSupabaseConfigured } from './data';
import { logger } from './logger';
import { AdminSession } from './auth-token';
import {
  AdminRecord,
  AdminRole,
  ChangePasswordResult,
  CredentialStoreAdapter,
  StoredAdminRecord,
  changePasswordWithStore,
  detectEnvFileTarget,
  findAdminByIdentifier,
  getLocalFallbackTokenVersion,
  getRoleEnvMetadata,
} from './auth-helpers';

export type { ChangePasswordResult };

const CACHE_TTL_MS = 2500;

interface CachedRoleTokenState {
  tokenVersion: number;
  isActive: boolean;
  fetchedAt: number;
}

const roleTokenCache = new Map<AdminRole, CachedRoleTokenState>();

export function invalidateCredentialCache(role?: AdminRole): void {
  if (role) {
    roleTokenCache.delete(role);
  } else {
    roleTokenCache.clear();
  }
}

interface DbAdminUserRow {
  id: string;
  email: string;
  username?: string | null;
  name: string;
  role: string;
  password_hash: string;
  token_version?: number | null;
  is_active: boolean;
  password_updated_at?: string | null;
  updated_by?: string | null;
  last_login_at?: string | null;
}

function mapRowToStoredRecord(row: DbAdminUserRow): StoredAdminRecord {
  const validRole: AdminRole =
    row.role === 'owner' || row.role === 'manager' || row.role === 'staff' ? row.role : 'staff';
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    name: row.name,
    role: validRole,
    passwordHash: row.password_hash,
    tokenVersion: row.token_version ?? 1,
    isActive: row.is_active !== false,
  };
}

async function fetchDbAdminByRole(role: AdminRole): Promise<DbAdminUserRow | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select(
        'id, email, username, name, role, password_hash, token_version, is_active, password_updated_at, updated_by, last_login_at'
      )
      .eq('role', role)
      .maybeSingle();

    if (error || !data) return null;
    return data as DbAdminUserRow;
  } catch {
    return null;
  }
}

async function fetchDbAdminByIdentifier(identifier: string): Promise<DbAdminUserRow | null> {
  if (!isSupabaseConfigured()) return null;
  const needle = identifier.trim().toLowerCase();
  if (!needle) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select(
        'id, email, username, name, role, password_hash, token_version, is_active, password_updated_at, updated_by, last_login_at'
      )
      .limit(20);

    if (error || !Array.isArray(data)) return null;
    const match = (data as DbAdminUserRow[]).find(
      (row) =>
        row.email?.trim().toLowerCase() === needle ||
        row.username?.trim().toLowerCase() === needle ||
        row.name?.trim().toLowerCase() === needle
    );
    return match || null;
  } catch {
    return null;
  }
}

/**
 * Resolve admin credentials for login.
 * Priority:
 * 1. If Supabase `admin_users` has an active record for the matched role, its `password_hash` and `token_version`
 *    are strictly authoritative (old plaintext `.env` passwords are NOT accepted).
 * 2. Otherwise falls back to `.env` / `.env.local` configured credentials.
 */
export async function resolveAdminForLogin(identifier: string): Promise<AdminRecord | null> {
  const envRecord = await findAdminByIdentifier(identifier);
  const roleFromEnv = envRecord?.user.role;

  const dbRow = roleFromEnv
    ? await fetchDbAdminByRole(roleFromEnv)
    : await fetchDbAdminByIdentifier(identifier);

  if (dbRow) {
    if (!dbRow.is_active) return null;

    const validRole: AdminRole =
      dbRow.role === 'owner' || dbRow.role === 'manager' || dbRow.role === 'staff'
        ? dbRow.role
        : roleFromEnv || 'staff';

    return {
      user: {
        id: dbRow.id || envRecord?.user.id || `usr_${validRole}_01`,
        email: dbRow.email || envRecord?.user.email || `${validRole}@dreamhomedecor.com`,
        name: dbRow.name || envRecord?.user.name || validRole,
        role: validRole,
      },
      passwordHash: dbRow.password_hash,
      allowedPlainPasswords: [],
      tokenVersion: dbRow.token_version ?? 1,
      source: 'database',
    };
  }

  if (!envRecord) return null;
  return {
    ...envRecord,
    tokenVersion: getLocalFallbackTokenVersion(envRecord.user.role),
    source: 'env',
  };
}

/**
 * Verify that a session's tokenVersion is still current and the account is active.
 */
export async function getActiveTokenState(
  role: AdminRole,
  bypassCache = false
): Promise<{ tokenVersion: number; isActive: boolean }> {
  const now = Date.now();
  if (!bypassCache) {
    const cached = roleTokenCache.get(role);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return { tokenVersion: cached.tokenVersion, isActive: cached.isActive };
    }
  }

  if (isSupabaseConfigured()) {
    const dbRow = await fetchDbAdminByRole(role);
    if (dbRow) {
      const state = {
        tokenVersion: dbRow.token_version ?? 1,
        isActive: dbRow.is_active !== false,
      };
      roleTokenCache.set(role, { ...state, fetchedAt: now });
      return state;
    }
  }

  const fallbackState = {
    tokenVersion: getLocalFallbackTokenVersion(role),
    isActive: true,
  };
  roleTokenCache.set(role, { ...fallbackState, fetchedAt: now });
  return fallbackState;
}

export async function recordAdminLastLogin(role: AdminRole): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createAdminClient();
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('role', role);
  } catch {
    // Non-blocking telemetry
  }
}

export interface RoleSecurityStatus {
  role: AdminRole;
  username: string;
  email: string;
  name: string;
  source: 'database' | 'env';
  isActive: boolean;
  tokenVersion: number;
  passwordUpdatedAt: string | null;
  updatedBy: string | null;
  lastLoginAt: string | null;
}

export interface AdminSecurityOverview {
  supabaseConfigured: boolean;
  envFileExists: boolean;
  envFileWritable: boolean;
  envFileName: string | null;
  isServerless: boolean;
  roles: RoleSecurityStatus[];
}

export async function getAdminSecurityOverview(): Promise<AdminSecurityOverview> {
  const supabaseConfigured = isSupabaseConfigured();
  const envTarget = await detectEnvFileTarget();

  let dbRows: DbAdminUserRow[] = [];
  if (supabaseConfigured) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('admin_users')
        .select(
          'id, email, username, name, role, token_version, is_active, password_updated_at, updated_by, last_login_at'
        );
      if (Array.isArray(data)) {
        dbRows = data as DbAdminUserRow[];
      }
    } catch {
      // Ignore if table not yet created
    }
  }

  const byRole = new Map(dbRows.map((r) => [r.role, r]));
  const roles: RoleSecurityStatus[] = (['owner', 'manager', 'staff'] as AdminRole[]).map((role) => {
    const envMeta = getRoleEnvMetadata(role);
    const dbRow = byRole.get(role);
    return {
      role,
      username: dbRow?.username || envMeta.username,
      email: dbRow?.email || envMeta.email,
      name: dbRow?.name || envMeta.name,
      source: dbRow ? 'database' : 'env',
      isActive: dbRow ? dbRow.is_active !== false : true,
      tokenVersion: dbRow?.token_version ?? getLocalFallbackTokenVersion(role),
      passwordUpdatedAt: dbRow?.password_updated_at || null,
      updatedBy: dbRow?.updated_by || null,
      lastLoginAt: dbRow?.last_login_at || null,
    };
  });

  return {
    supabaseConfigured,
    envFileExists: envTarget.exists,
    envFileWritable: envTarget.writable,
    envFileName: envTarget.fileName || null,
    isServerless: envTarget.isServerless,
    roles,
  };
}

function createSupabaseStoreAdapter(): CredentialStoreAdapter | undefined {
  if (!isSupabaseConfigured()) return undefined;

  return {
    async getByRole(role: AdminRole) {
      const row = await fetchDbAdminByRole(role);
      return row ? mapRowToStoredRecord(row) : null;
    },
    async savePassword(input) {
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.from('admin_users').upsert(
          {
            role: input.role,
            email: input.email,
            username: input.username,
            name: input.name,
            password_hash: input.passwordHash,
            token_version: input.tokenVersion,
            is_active: true,
            password_updated_at: input.nowIso,
            updated_by: input.updatedBy,
            updated_at: input.nowIso,
          },
          { onConflict: 'role' }
        );

        if (error) {
          logger.warn('Failed to persist password in Supabase admin_users', {
            role: input.role,
            error: error.message,
          });
          return { saved: false, error: error.message };
        }
        return { saved: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn('Exception persisting password in Supabase admin_users', {
          role: input.role,
          error: msg,
        });
        return { saved: false, error: msg };
      }
    },
    async writeAuditLog(entry) {
      try {
        const supabase = createAdminClient();
        await supabase.from('audit_log').insert({
          admin_email: entry.adminEmail,
          admin_role: entry.adminRole,
          action: 'change_admin_password',
          entity_type: 'admin_users',
          entity_id: entry.targetRole,
          details: {
            target_role: entry.targetRole,
            db_saved: entry.dbSaved,
            env_synced: entry.envSynced,
            env_file: entry.envFile || null,
            env_reason: entry.envReason || null,
            token_version: entry.tokenVersion,
          },
        });
      } catch {
        // Non-fatal
      }
    },
    onRotated(role: AdminRole) {
      invalidateCredentialCache(role);
    },
  };
}

/**
 * Change an admin tier's password (Owner-authorized only).
 */
export async function changeAdminPassword(params: {
  actorSession: AdminSession;
  targetRole: AdminRole;
  currentOwnerPassword: string;
  newPassword: string;
  confirmPassword: string;
  clientIp?: string;
  envFilePath?: string;
}): Promise<ChangePasswordResult> {
  return await changePasswordWithStore(params, createSupabaseStoreAdapter());
}
