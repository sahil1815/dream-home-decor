import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderSchema } from '../lib/validations/order.ts';

test('Zod Schema Order Validation', async (t) => {
  const validPayload = {
    customer_name: 'তানভীর আহমেদ',
    customer_phone: '01712345678',
    customer_address: 'বাড়ি ১২, রোড ৪, সেক্টর ১০, উত্তরা, ঢাকা',
    delivery_zone: 'inside',
    payment_method: 'cod',
    items: [
      {
        product_id: 'b0000000-0000-0000-0000-000000000001',
        quantity: 2,
        selected_color: 'Walnut Brown',
      },
    ],
  };

  await t.test('accepts valid Bangladeshi order payload', () => {
    const result = createOrderSchema.safeParse(validPayload);
    assert.equal(result.success, true);
  });

  await t.test('rejects customer name shorter than 2 characters', () => {
    const invalid = { ...validPayload, customer_name: 'A' };
    const result = createOrderSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  await t.test('rejects invalid Bangladeshi mobile numbers', () => {
    // 010 is not a valid operator
    const invalidOperator = { ...validPayload, customer_phone: '01012345678' };
    assert.equal(createOrderSchema.safeParse(invalidOperator).success, false);

    // 10 digits
    const shortDigits = { ...validPayload, customer_phone: '0171234567' };
    assert.equal(createOrderSchema.safeParse(shortDigits).success, false);

    // non-numeric
    const nonNumeric = { ...validPayload, customer_phone: '0171234abcd' };
    assert.equal(createOrderSchema.safeParse(nonNumeric).success, false);
  });

  await t.test('rejects address shorter than 10 characters', () => {
    const shortAddress = { ...validPayload, customer_address: 'ঢাকা' };
    const result = createOrderSchema.safeParse(shortAddress);
    assert.equal(result.success, false);
  });

  await t.test('rejects empty items array', () => {
    const noItems = { ...validPayload, items: [] };
    const result = createOrderSchema.safeParse(noItems);
    assert.equal(result.success, false);
  });

  await t.test('rejects quantity greater than 10', () => {
    const tooMany = {
      ...validPayload,
      items: [{ product_id: 'p1', quantity: 99 }],
    };
    const result = createOrderSchema.safeParse(tooMany);
    assert.equal(result.success, false);
  });

  await t.test('flags non-empty honeypot field', () => {
    const botPayload = { ...validPayload, website: 'https://spambot.ru' };
    const result = createOrderSchema.safeParse(botPayload);
    // Honeypot field max length is 0
    assert.equal(result.success, false);
  });
});

test('Sequential Order Numbering & Dummy Order Deletion Resilience', async (t) => {
  const calculateNextNumber = (existingOrderNumbers, candidateChecker = () => true) => {
    const DEFAULT_START = 1000;
    let maxNum = DEFAULT_START;

    for (const numStr of existingOrderNumbers) {
      const m = numStr?.match(/^DHD-(\d+)$/i);
      if (m) {
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    let candidateNum = maxNum + 1;
    let candidate = `DHD-${candidateNum}`;

    while (!candidateChecker(candidate)) {
      candidateNum++;
      candidate = `DHD-${candidateNum}`;
    }

    return candidate;
  };

  await t.test('starts cleanly at DHD-1001 when all dummy orders are deleted (empty table)', () => {
    const next = calculateNextNumber([]);
    assert.equal(next, 'DHD-1001');
  });

  await t.test('generates DHD-1004 when initial dummy orders DHD-1001..DHD-1003 exist', () => {
    const next = calculateNextNumber(['DHD-1001', 'DHD-1002', 'DHD-1003']);
    assert.equal(next, 'DHD-1004');
  });

  await t.test('resets sequential numbering safely when random dummy order (e.g. DHD-9650) is deleted', () => {
    // Before deleting DHD-9650
    const beforeDelete = calculateNextNumber(['DHD-1001', 'DHD-1002', 'DHD-1003', 'DHD-9650']);
    assert.equal(beforeDelete, 'DHD-9651');

    // After deleting DHD-9650
    const afterDelete = calculateNextNumber(['DHD-1001', 'DHD-1002', 'DHD-1003']);
    assert.equal(afterDelete, 'DHD-1004');
  });

  await t.test('collision-safeguard advances to next free sequential number if candidate is occupied', () => {
    const occupied = new Set(['DHD-1001', 'DHD-1002', 'DHD-1003', 'DHD-1004', 'DHD-1005']);
    const next = calculateNextNumber(
      ['DHD-1001', 'DHD-1002', 'DHD-1003'],
      (candidate) => !occupied.has(candidate)
    );
    assert.equal(next, 'DHD-1006');
  });
});
