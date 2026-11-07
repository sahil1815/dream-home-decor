import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBangladeshiPhone, maskPhoneNumber } from '../lib/validations/order.ts';

test('Bangladeshi phone normalization', async (t) => {
  await t.test('normalizes standard 11-digit local format', () => {
    assert.equal(normalizeBangladeshiPhone('01712345678'), '01712345678');
    assert.equal(normalizeBangladeshiPhone('01812345678'), '01812345678');
    assert.equal(normalizeBangladeshiPhone('01912345678'), '01912345678');
  });

  await t.test('strips +88 and 88 country codes', () => {
    assert.equal(normalizeBangladeshiPhone('+8801712345678'), '01712345678');
    assert.equal(normalizeBangladeshiPhone('8801712345678'), '01712345678');
  });

  await t.test('strips spaces and hyphens', () => {
    assert.equal(normalizeBangladeshiPhone('01712-345 678'), '01712345678');
    assert.equal(normalizeBangladeshiPhone('+880 1712-345678'), '01712345678');
  });
});

test('Customer phone number masking for privacy', async (t) => {
  await t.test('masks middle digits to protect PII', () => {
    const masked = maskPhoneNumber('01712345678');
    assert.equal(masked, '017****678');
  });

  await t.test('masks formatted country code input correctly', () => {
    const masked = maskPhoneNumber('+8801812345678');
    assert.equal(masked, '018****678');
  });
});
