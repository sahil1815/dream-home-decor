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
