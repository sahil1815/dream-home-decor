import test from 'node:test';
import assert from 'node:assert';
import { evaluateOrderRisk, isSuspiciousPhoneNumber } from '../lib/risk-engine.ts';
import { buildBengaliSmsMessage } from '../lib/sms.ts';
import { mapSteadfastStatusToBengali, createSteadfastParcel } from '../lib/courier/steadfast.ts';

test('Conversion Engine: Bangladesh Order Risk & Advance Payment Rules', async (t) => {
  await t.test('evaluates low risk and zero advance for normal Inside Dhaka order', () => {
    const res = evaluateOrderRisk({
      phone: '01712345678',
      deliveryZone: 'inside',
      totalAmount: 3800,
    });
    assert.strictEqual(res.riskLevel, 'low');
    assert.strictEqual(res.isSuspicious, false);
    assert.strictEqual(res.requiresAdvancePayment, false);
    assert.strictEqual(res.advanceAmount, 0);
  });

  await t.test('requires ৳200 advance delivery charge for Outside Dhaka delivery', () => {
    const res = evaluateOrderRisk({
      phone: '01812345678',
      deliveryZone: 'outside',
      totalAmount: 4500,
    });
    assert.strictEqual(res.riskLevel, 'medium');
    assert.strictEqual(res.requiresAdvancePayment, true);
    assert.strictEqual(res.advanceAmount, 200);
    assert.match(res.customerAdviceBn || '', /২০০ টাকা ডেলিভারি চার্জ অগ্রিম প্রযোজ্য/);
  });

  await t.test('flags high risk and full payment for blocked customer', () => {
    const res = evaluateOrderRisk({
      phone: '01912345678',
      deliveryZone: 'inside',
      totalAmount: 5000,
      customerIsBlocked: true,
    });
    assert.strictEqual(res.riskLevel, 'high');
    assert.strictEqual(res.isSuspicious, true);
    assert.strictEqual(res.requiresAdvancePayment, true);
    assert.strictEqual(res.advanceAmount, 5000);
  });

  await t.test('flags suspicious risk for customer with 2+ cancelled orders', () => {
    const res = evaluateOrderRisk({
      phone: '01612345678',
      deliveryZone: 'outside',
      totalAmount: 4200,
      historicalCancelledOrders: 3,
    });
    assert.strictEqual(res.riskLevel, 'high');
    assert.strictEqual(res.isSuspicious, true);
  });

  await t.test('calculates 20% booking deposit for custom-made furniture orders', () => {
    const res = evaluateOrderRisk({
      phone: '01712345678',
      deliveryZone: 'inside',
      totalAmount: 10000,
      isCustomOrder: true,
    });
    assert.strictEqual(res.requiresAdvancePayment, true);
    assert.strictEqual(res.advanceAmount, 2000); // 20% of 10000
  });

  await t.test('detects repetitive fake phone numbers', () => {
    assert.strictEqual(isSuspiciousPhoneNumber('01711111111'), true);
    assert.strictEqual(isSuspiciousPhoneNumber('01799999999'), true);
    assert.strictEqual(isSuspiciousPhoneNumber('01712345678'), false);
  });
});

test('Conversion Engine: Bengali SMS Notification Templates', async (t) => {
  await t.test('generates order placed SMS with Bengali digits and tracking URL', () => {
    const msg = buildBengaliSmsMessage({
      orderNumber: 'DHD-1005',
      customerName: 'তানভীর',
      customerPhone: '01712345678',
      totalAmount: 3800,
      status: 'pending',
    });
    assert.match(msg, /ড্রিম হোম ডেকোর: প্রিয় তানভীর/);
    assert.match(msg, /#DHD-1005/);
    assert.match(msg, /৳3,800/);
    assert.match(msg, /track-order\?orderNumber=DHD-1005/);
  });

  await t.test('generates order confirmed SMS with delivery timeframe', () => {
    const msg = buildBengaliSmsMessage({
      orderNumber: 'DHD-1005',
      customerName: 'সাবরিনা',
      customerPhone: '01812345678',
      totalAmount: 4200,
      status: 'confirmed',
      estimatedDeliveryDate: '১০ নভেম্বর ২০২৬',
    });
    assert.match(msg, /কনফার্ম করা হয়েছে/);
    assert.match(msg, /১০ নভেম্বর ২০২৬/);
  });

  await t.test('generates shipped SMS with courier tracking code', () => {
    const msg = buildBengaliSmsMessage({
      orderNumber: 'DHD-1005',
      customerName: 'মাহমুদ',
      customerPhone: '01912345678',
      totalAmount: 5120,
      status: 'shipped',
      courierTrackingCode: 'STF-839201',
    });
    assert.match(msg, /কুরিয়ারে হস্তান্তর করা হয়েছে/);
    assert.match(msg, /STF-839201/);
  });
});

test('Conversion Engine: Steadfast Courier Integration', async (t) => {
  await t.test('creates simulated parcel with valid STF consignment code when API key is omitted', async () => {
    const res = await createSteadfastParcel({
      invoice: 'DHD-1008',
      recipientName: 'আরিফুল ইসলাম',
      recipientPhone: '01712345678',
      recipientAddress: 'মিরপুর-১, ঢাকা',
      codAmount: 3920,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.simulated, true);
    assert.strictEqual(res.courierName, 'Steadfast');
    assert.match(res.trackingCode || '', /^STF-/);
  });

  await t.test('translates courier statuses to clear Bengali', () => {
    assert.strictEqual(mapSteadfastStatusToBengali('in_review'), 'রিভিউ প্রক্রিয়াধীন');
    assert.strictEqual(mapSteadfastStatusToBengali('delivered'), 'সফলভাবে ডেলিভারি সম্পন্ন');
    assert.strictEqual(mapSteadfastStatusToBengali('cancelled'), 'ডেলিভারি বাতিল');
    assert.strictEqual(mapSteadfastStatusToBengali('in_transit'), 'পথে রয়েছে (ইন-ট্রানজিট)');
  });
});
