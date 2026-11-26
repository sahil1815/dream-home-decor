import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { createRequire } from 'node:module';
import {
  findAdminByIdentifier,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  clearAllLoginAttempts,
  hasRequiredRole,
  validateNewPassword,
  verifyRecordPassword,
  syncPasswordToEnvFile,
  changePasswordWithStore,
  getLocalFallbackTokenVersion,
  setLocalFallbackTokenVersion,
} from '../lib/auth-helpers.ts';
import { createSessionToken, verifySessionToken } from '../lib/auth-token.ts';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');

test('Admin Auth: Environment-Driven Name & Username Lookup', async (t) => {
  const origEnv = { ...process.env };

  t.beforeEach(() => {
    process.env.ADMIN_USERNAME = 'dreamhomedecor_admin';
    process.env.ADMIN_PASSWORD = 'admin_dJaKcY2dEf@r3e';
    process.env.ADMIN_NAME = 'dreamhomedecor_admin';
    process.env.ADMIN_EMAIL = 'owner@dreamhomedecor.com';

    process.env.ADMIN_MANAGER_USERNAME = 'dreamhomedecor_manager';
    process.env.ADMIN_MANAGER_PASSWORD = 'manager_mJakYc@ky3';
    process.env.ADMIN_MANAGER_NAME = 'dreamhomedecor_manager';
    process.env.ADMIN_MANAGER_EMAIL = 'manager@dreamhomedecor.com';

    process.env.ADMIN_STAFF_USERNAME = 'dreamhomedecor_staff';
    process.env.ADMIN_STAFF_PASSWORD = 'staff_sJaKYc@9mz';
    process.env.ADMIN_STAFF_NAME = 'dreamhomedecor_staff';
    process.env.ADMIN_STAFF_EMAIL = 'staff@dreamhomedecor.com';
  });

  t.afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in origEnv)) delete process.env[k];
      else process.env[k] = origEnv[k];
    }
  });

  await t.test('resolves admin strictly by configured env values', async () => {
    const ownerRecord = await findAdminByIdentifier('dreamhomedecor_admin');
    assert.ok(ownerRecord);
    assert.strictEqual(ownerRecord.user.role, 'owner');
    assert.deepStrictEqual(ownerRecord.allowedPlainPasswords, ['admin_dJaKcY2dEf@r3e']);

    const managerRecord = await findAdminByIdentifier('dreamhomedecor_manager');
    assert.ok(managerRecord);
    assert.strictEqual(managerRecord.user.role, 'manager');
    assert.deepStrictEqual(managerRecord.allowedPlainPasswords, ['manager_mJakYc@ky3']);

    const staffRecord = await findAdminByIdentifier('dreamhomedecor_staff');
    assert.ok(staffRecord);
    assert.strictEqual(staffRecord.user.role, 'staff');
    assert.deepStrictEqual(staffRecord.allowedPlainPasswords, ['staff_sJaKYc@9mz']);
  });

  await t.test('rejects arbitrary or unconfigured identifiers (no hardcoded backdoors)', async () => {
    assert.strictEqual(await findAdminByIdentifier('admin'), null);
    assert.strictEqual(await findAdminByIdentifier('owner'), null);
    assert.strictEqual(await findAdminByIdentifier('sahil'), null);
    assert.strictEqual(await findAdminByIdentifier('manager'), null);
    assert.strictEqual(await findAdminByIdentifier('staff'), null);
    assert.strictEqual(await findAdminByIdentifier('unknown_hacker'), null);
  });

  await t.test('handles whitespace and case insensitivity on valid env usernames', async () => {
    const record = await findAdminByIdentifier('   DrEaMhOmEdEcOr_AdMiN   ');
    assert.ok(record);
    assert.strictEqual(record.user.role, 'owner');
  });

  await t.test('allows email configured in env', async () => {
    const record = await findAdminByIdentifier('owner@dreamhomedecor.com');
    assert.ok(record);
    assert.strictEqual(record.user.role, 'owner');
  });
});

test('Admin Auth: Strictly Environment-Configured Passwords', async (t) => {
  const origEnv = { ...process.env };

  t.afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in origEnv)) delete process.env[k];
      else process.env[k] = origEnv[k];
    }
  });

  await t.test('does not contain hardcoded default passwords', async () => {
    process.env.ADMIN_USERNAME = 'my_owner';
    process.env.ADMIN_PASSWORD = 'SecretOwnerPass2026!';

    const record = await findAdminByIdentifier('my_owner');
    assert.ok(record);
    assert.strictEqual(record.allowedPlainPasswords.length, 1);
    assert.strictEqual(record.allowedPlainPasswords[0], 'SecretOwnerPass2026!');

    assert.strictEqual(record.allowedPlainPasswords.includes('admin'), false);
    assert.strictEqual(record.allowedPlainPasswords.includes('admin123'), false);
    assert.strictEqual(record.allowedPlainPasswords.includes('123456'), false);
    assert.strictEqual(record.allowedPlainPasswords.includes('DHD_OwnerMirpur2026!Secure'), false);
  });

  await t.test('dynamically honors custom usernames and passwords from environment variables', async () => {
    process.env.ADMIN_USERNAME = 'super_boss';
    process.env.ADMIN_PASSWORD = 'CustomBossPass2026!';
    process.env.ADMIN_MANAGER_USERNAME = 'shop_karim';
    process.env.ADMIN_MANAGER_PASSWORD = 'KarimPass2026!';

    const bossRecord = await findAdminByIdentifier('super_boss');
    assert.ok(bossRecord);
    assert.strictEqual(bossRecord.user.role, 'owner');
    assert.deepStrictEqual(bossRecord.allowedPlainPasswords, ['CustomBossPass2026!']);

    const managerRecord = await findAdminByIdentifier('shop_karim');
    assert.ok(managerRecord);
    assert.strictEqual(managerRecord.user.role, 'manager');
    assert.deepStrictEqual(managerRecord.allowedPlainPasswords, ['KarimPass2026!']);
  });
});

test('Admin Auth: Rate Limiting & Role Hierarchy', async (t) => {
  await t.test('correctly records failed attempts and clears them', async () => {
    const testKey = 'test_ip_user_login';
    clearLoginAttempts(testKey);

    assert.strictEqual(checkLoginRateLimit(testKey).isLocked, false);
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(testKey);
    }
    assert.strictEqual(checkLoginRateLimit(testKey).isLocked, true);

    clearLoginAttempts(testKey);
    assert.strictEqual(checkLoginRateLimit(testKey).isLocked, false);
  });

  await t.test('enforces RBAC hierarchy (owner > manager > staff)', () => {
    assert.strictEqual(hasRequiredRole('owner', 'owner'), true);
    assert.strictEqual(hasRequiredRole('owner', 'manager'), true);
    assert.strictEqual(hasRequiredRole('owner', 'staff'), true);

    assert.strictEqual(hasRequiredRole('manager', 'owner'), false);
    assert.strictEqual(hasRequiredRole('manager', 'manager'), true);
    assert.strictEqual(hasRequiredRole('manager', 'staff'), true);

    assert.strictEqual(hasRequiredRole('staff', 'owner'), false);
    assert.strictEqual(hasRequiredRole('staff', 'manager'), false);
    assert.strictEqual(hasRequiredRole('staff', 'staff'), true);
  });
});

test('Admin Auth: Password Policy, Hash Precedence & Token Versioning', async (t) => {
  const origEnv = { ...process.env };

  t.afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in origEnv)) delete process.env[k];
      else process.env[k] = origEnv[k];
    }
    clearAllLoginAttempts();
    setLocalFallbackTokenVersion('owner', 1);
    setLocalFallbackTokenVersion('manager', 1);
    setLocalFallbackTokenVersion('staff', 1);
  });

  await t.test('enforces strong password policy', () => {
    assert.strictEqual(validateNewPassword('short1').valid, false);
    assert.strictEqual(validateNewPassword('onlyletters').valid, false);
    assert.strictEqual(validateNewPassword('12345678').valid, false);
    assert.strictEqual(validateNewPassword('admin123').valid, false);
    assert.strictEqual(validateNewPassword('password123').valid, false);
    assert.strictEqual(validateNewPassword('DreamHome#2026').valid, true);
  });

  await t.test('hash env var strictly overrides plaintext password env var', async () => {
    process.env.ADMIN_USERNAME = 'owner_user';
    process.env.ADMIN_PASSWORD = 'OldPlainPassword1';
    process.env.ADMIN_OWNER_PASSWORD_HASH = await bcrypt.hash('NewHashedPass#99', 10);

    const record = await findAdminByIdentifier('owner_user');
    assert.ok(record);
    assert.deepStrictEqual(record.allowedPlainPasswords, []);
    assert.strictEqual(await verifyRecordPassword(record, 'OldPlainPassword1'), false);
    assert.strictEqual(await verifyRecordPassword(record, 'NewHashedPass#99'), true);
  });

  await t.test('preserves tokenVersion in HMAC session tokens', async () => {
    process.env.AUTH_SECRET = 'test_secret_key_for_unit_tests_32chars';
    const token = await createSessionToken({
      id: 'usr_owner_01',
      email: 'owner@dreamhomedecor.com',
      name: 'Owner',
      role: 'owner',
      tokenVersion: 4,
    });
    const session = await verifySessionToken(token);
    assert.ok(session);
    assert.strictEqual(session.tokenVersion, 4);
    assert.strictEqual(session.role, 'owner');
  });
});

test('Admin Auth: Secure Password Change & .env.local Sync', async (t) => {
  const origEnv = { ...process.env };

  t.afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in origEnv)) delete process.env[k];
      else process.env[k] = origEnv[k];
    }
    clearAllLoginAttempts();
    setLocalFallbackTokenVersion('owner', 1);
    setLocalFallbackTokenVersion('manager', 1);
    setLocalFallbackTokenVersion('staff', 1);
  });

  await t.test('syncs bcrypt hash to .env.local cleanly and loads back via @next/env', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dhd-env-sync-'));
    const envPath = path.join(tmpDir, '.env.local');
    try {
      await fs.writeFile(
        envPath,
        [
          '# Storefront config',
          'NEXT_PUBLIC_SITE_URL=https://example.com',
          'ADMIN_USERNAME=owner_boss',
          'ADMIN_PASSWORD=old_plaintext_pw',
          'ADMIN_MANAGER_USERNAME=mgr_boss',
          'ADMIN_MANAGER_PASSWORD=mgr_old_pw',
          '',
        ].join('\n'),
        'utf-8'
      );

      const newHash = await bcrypt.hash('BrandNewPass#2026', 10);
      const syncRes = await syncPasswordToEnvFile('owner', newHash, { envFilePath: envPath });

      assert.strictEqual(syncRes.synced, true);
      assert.strictEqual(process.env.ADMIN_PASSWORD, undefined);
      assert.strictEqual(process.env.ADMIN_OWNER_PASSWORD_HASH, newHash);

      const fileContent = await fs.readFile(envPath, 'utf-8');
      assert.strictEqual(fileContent.includes('old_plaintext_pw'), false);
      assert.strictEqual(fileContent.includes('BrandNewPass#2026'), false);
      assert.strictEqual(fileContent.includes('NEXT_PUBLIC_SITE_URL=https://example.com'), true);
      assert.strictEqual(fileContent.includes('ADMIN_MANAGER_PASSWORD=mgr_old_pw'), true);
      assert.strictEqual(fileContent.includes('ADMIN_OWNER_PASSWORD_HASH="\\$2b\\$10\\$'), true);

      // Simulate a fresh Next.js server restart (process.env clean) and verify @next/env parses .env.local back to the exact bcrypt hash
      delete process.env.ADMIN_OWNER_PASSWORD_HASH;
      const { combinedEnv } = loadEnvConfig(tmpDir, true, undefined, true);
      assert.strictEqual(combinedEnv.ADMIN_OWNER_PASSWORD_HASH, newHash);
      assert.strictEqual(combinedEnv.ADMIN_PASSWORD, undefined);
      assert.strictEqual(await bcrypt.compare('BrandNewPass#2026', combinedEnv.ADMIN_OWNER_PASSWORD_HASH), true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('reports serverless_readonly gracefully when filesystem is read-only', async () => {
    const hash = await bcrypt.hash('ServerlessPass#1', 10);
    const res = await syncPasswordToEnvFile('owner', hash, { forceReadOnly: true });
    assert.strictEqual(res.synced, false);
    assert.strictEqual(res.reason, 'serverless_readonly');
  });

  await t.test('enforces owner auth, verifies current password, updates .env.local & DB store, and rotates tokenVersion', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dhd-pw-change-'));
    const envPath = path.join(tmpDir, '.env.local');
    try {
      process.env.ADMIN_USERNAME = 'owner_test';
      process.env.ADMIN_PASSWORD = 'CurrentOwner#123';
      process.env.ADMIN_EMAIL = 'owner@dreamhomedecor.com';
      process.env.ADMIN_MANAGER_USERNAME = 'manager_test';
      process.env.ADMIN_MANAGER_PASSWORD = 'OldManager#123';

      await fs.writeFile(
        envPath,
        [
          'ADMIN_USERNAME=owner_test',
          'ADMIN_PASSWORD=CurrentOwner#123',
          'ADMIN_MANAGER_USERNAME=manager_test',
          'ADMIN_MANAGER_PASSWORD=OldManager#123',
        ].join('\n'),
        'utf-8'
      );

      // In-memory store mock simulating Supabase admin_users + audit_log
      const mockDb = new Map();
      const auditEntries = [];
      const mockStore = {
        async getByRole(role) {
          return mockDb.get(role) || null;
        },
        async savePassword(input) {
          mockDb.set(input.role, {
            id: `db_${input.role}`,
            email: input.email,
            username: input.username,
            name: input.name,
            role: input.role,
            passwordHash: input.passwordHash,
            tokenVersion: input.tokenVersion,
            isActive: true,
          });
          return { saved: true };
        },
        async writeAuditLog(entry) {
          auditEntries.push(entry);
        },
      };

      const staffSession = {
        userId: 'usr_staff_01',
        email: 'staff@dreamhomedecor.com',
        name: 'Staff',
        role: 'staff',
        tokenVersion: 1,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      // Non-owner rejected
      const nonOwnerRes = await changePasswordWithStore(
        {
          actorSession: staffSession,
          targetRole: 'owner',
          currentOwnerPassword: 'CurrentOwner#123',
          newPassword: 'OwnerNewPass#2026',
          confirmPassword: 'OwnerNewPass#2026',
          envFilePath: envPath,
        },
        mockStore
      );
      assert.strictEqual(nonOwnerRes.success, false);

      const ownerSession = {
        userId: 'usr_owner_01',
        email: 'owner@dreamhomedecor.com',
        name: 'Owner',
        role: 'owner',
        tokenVersion: 1,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      // Wrong current password rejected
      const wrongCurRes = await changePasswordWithStore(
        {
          actorSession: ownerSession,
          targetRole: 'owner',
          currentOwnerPassword: 'WrongPassword#1',
          newPassword: 'OwnerNewPass#2026',
          confirmPassword: 'OwnerNewPass#2026',
          clientIp: '127.0.0.1',
          envFilePath: envPath,
        },
        mockStore
      );
      assert.strictEqual(wrongCurRes.success, false);

      // Valid owner password change succeeds in BOTH DB store and .env.local
      const okRes = await changePasswordWithStore(
        {
          actorSession: ownerSession,
          targetRole: 'owner',
          currentOwnerPassword: 'CurrentOwner#123',
          newPassword: 'OwnerNewPass#2026',
          confirmPassword: 'OwnerNewPass#2026',
          clientIp: '127.0.0.1',
          envFilePath: envPath,
        },
        mockStore
      );
      assert.strictEqual(okRes.success, true);
      assert.strictEqual(okRes.dbSaved, true);
      assert.strictEqual(okRes.envSynced, true);
      assert.strictEqual(okRes.newTokenVersion, 2);
      assert.strictEqual(getLocalFallbackTokenVersion('owner'), 2);
      assert.strictEqual(auditEntries.length, 1);
      assert.strictEqual(auditEntries[0].targetRole, 'owner');

      // Verify old password fails and new password succeeds
      const updatedOwnerRecord = await findAdminByIdentifier('owner_test');
      assert.ok(updatedOwnerRecord);
      assert.strictEqual(await verifyRecordPassword(updatedOwnerRecord, 'CurrentOwner#123'), false);
      assert.strictEqual(await verifyRecordPassword(updatedOwnerRecord, 'OwnerNewPass#2026'), true);

      // On serverless (read-only .env), DB store still persists & verifies using DB password
      const mgrRes = await changePasswordWithStore(
        {
          actorSession: ownerSession,
          targetRole: 'manager',
          currentOwnerPassword: 'OwnerNewPass#2026',
          newPassword: 'ManagerNewPass#2026',
          confirmPassword: 'ManagerNewPass#2026',
          clientIp: '127.0.0.1',
          forceReadOnlyEnv: true,
        },
        mockStore
      );
      assert.strictEqual(mgrRes.success, true);
      assert.strictEqual(mgrRes.dbSaved, true);
      assert.strictEqual(mgrRes.envSynced, false);
      assert.strictEqual(mgrRes.envReason, 'serverless_readonly');
      assert.strictEqual(mgrRes.newTokenVersion, 2);
      assert.strictEqual(await bcrypt.compare('ManagerNewPass#2026', mockDb.get('manager').passwordHash), true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
