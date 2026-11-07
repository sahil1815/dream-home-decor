import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findAdminByIdentifier,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  hasRequiredRole,
} from '../lib/auth-helpers.ts';

test('Admin Auth: Name & Username Lookup', async (t) => {
  await t.test('resolves owner by common admin names (admin, owner, sahil)', async () => {
    const adminRecord = await findAdminByIdentifier('admin');
    assert.ok(adminRecord);
    assert.strictEqual(adminRecord.user.role, 'owner');

    const ownerRecord = await findAdminByIdentifier('owner');
    assert.ok(ownerRecord);
    assert.strictEqual(ownerRecord.user.role, 'owner');

    const sahilRecord = await findAdminByIdentifier('sahil');
    assert.ok(sahilRecord);
    assert.strictEqual(sahilRecord.user.role, 'owner');

    const bengaliRecord = await findAdminByIdentifier('কারখানা মালিক');
    assert.ok(bengaliRecord);
    assert.strictEqual(bengaliRecord.user.role, 'owner');
  });

  await t.test('resolves manager and staff by names', async () => {
    const managerRecord = await findAdminByIdentifier('manager');
    assert.ok(managerRecord);
    assert.strictEqual(managerRecord.user.role, 'manager');

    const staffRecord = await findAdminByIdentifier('staff');
    assert.ok(staffRecord);
    assert.strictEqual(staffRecord.user.role, 'staff');
  });

  await t.test('handles whitespace and case insensitivity', async () => {
    const record = await findAdminByIdentifier('   AdMiN   ');
    assert.ok(record);
    assert.strictEqual(record.user.role, 'owner');
  });

  await t.test('retains backward compatibility for email lookups', async () => {
    const record = await findAdminByIdentifier('owner@dreamhomedecor.com');
    assert.ok(record);
    assert.strictEqual(record.user.role, 'owner');
  });

  await t.test('returns null for unknown identifier', async () => {
    const record = await findAdminByIdentifier('unknown_hacker_person');
    assert.strictEqual(record, null);
  });
});

test('Admin Auth: Allowed Fallback Passwords for Name Login', async (t) => {
  await t.test('owner record contains convenient standard fallback passwords', async () => {
    const record = await findAdminByIdentifier('admin');
    assert.ok(record);
    assert.ok(Array.isArray(record.allowedPlainPasswords));
    assert.ok(record.allowedPlainPasswords.includes('admin'));
    assert.ok(record.allowedPlainPasswords.includes('admin123'));
    assert.ok(record.allowedPlainPasswords.includes('DHD_OwnerMirpur2026!Secure'));
  });

  await t.test('dynamically honors custom usernames and passwords from environment variables', async () => {
    const prevAdminUser = process.env.ADMIN_USERNAME;
    const prevAdminPass = process.env.ADMIN_PASSWORD;
    const prevManagerUser = process.env.ADMIN_MANAGER_USERNAME;
    const prevManagerPass = process.env.ADMIN_MANAGER_PASSWORD;

    try {
      process.env.ADMIN_USERNAME = 'super_boss';
      process.env.ADMIN_PASSWORD = 'CustomBossPass2026!';
      process.env.ADMIN_MANAGER_USERNAME = 'shop_karim';
      process.env.ADMIN_MANAGER_PASSWORD = 'KarimPass2026!';

      const bossRecord = await findAdminByIdentifier('super_boss');
      assert.ok(bossRecord);
      assert.strictEqual(bossRecord.user.role, 'owner');
      assert.ok(bossRecord.allowedPlainPasswords.includes('CustomBossPass2026!'));

      const managerRecord = await findAdminByIdentifier('shop_karim');
      assert.ok(managerRecord);
      assert.strictEqual(managerRecord.user.role, 'manager');
      assert.ok(managerRecord.allowedPlainPasswords.includes('KarimPass2026!'));
    } finally {
      process.env.ADMIN_USERNAME = prevAdminUser;
      process.env.ADMIN_PASSWORD = prevAdminPass;
      process.env.ADMIN_MANAGER_USERNAME = prevManagerUser;
      process.env.ADMIN_MANAGER_PASSWORD = prevManagerPass;
    }
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
