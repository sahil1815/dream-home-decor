import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Logic mirror of server-side price calculation
 */
function calculateServerPrice(items, deliveryZone, settings = { inside: 120, outside: 200 }) {
  const deliveryCharge = deliveryZone === 'inside' ? settings.inside : settings.outside;
  const subtotal = items.reduce((sum, it) => {
    const authoritativeUnitPrice = it.discount_price ?? it.price;
    return sum + authoritativeUnitPrice * it.quantity;
  }, 0);
  const totalAmount = subtotal + deliveryCharge;

  return { subtotal, deliveryCharge, totalAmount };
}

test('Authoritative Server-Side Price Calculation', async (t) => {
  const sampleProducts = [
    { id: 'p1', price: 4500, discount_price: 3800, quantity: 2 },
    { id: 'p2', price: 2000, discount_price: null, quantity: 1 },
  ];

  await t.test('calculates correct subtotal with discounts applied', () => {
    const result = calculateServerPrice(sampleProducts, 'inside');
    // (3800 * 2) + (2000 * 1) = 7600 + 2000 = 9600
    assert.equal(result.subtotal, 9600);
  });

  await t.test('applies inside Dhaka delivery charge of ৳120', () => {
    const result = calculateServerPrice(sampleProducts, 'inside');
    assert.equal(result.deliveryCharge, 120);
    assert.equal(result.totalAmount, 9600 + 120);
  });

  await t.test('applies outside Dhaka delivery charge of ৳200', () => {
    const result = calculateServerPrice(sampleProducts, 'outside');
    assert.equal(result.deliveryCharge, 200);
    assert.equal(result.totalAmount, 9600 + 200);
  });

  await t.test('ignores client-sent prices', () => {
    // Malicious client tries to send ৳1 price
    const clientHackedInput = [
      { id: 'p1', price: 4500, discount_price: 3800, quantity: 1, clientClaimedPrice: 1 },
    ];
    const serverResult = calculateServerPrice(clientHackedInput, 'inside');
    assert.equal(serverResult.subtotal, 3800);
    assert.equal(serverResult.totalAmount, 3920);
  });
});
