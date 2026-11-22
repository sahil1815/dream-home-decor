import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findAdminByIdentifier,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  hasRequiredRole,
} from '../lib/auth-helpers.ts';

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
