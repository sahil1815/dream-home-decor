import test from 'node:test';
import assert from 'node:assert';
import { formatBDT, toBanglaDigits, formatBanglaDate } from '../lib/utils.ts';

// Luminance and Contrast calculation functions per WCAG 2.1 specs
function getLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

test('Design System: Currency & Numeral Standardization', async (t) => {
  await t.test('formatBDT formats standard amounts with Taka symbol and comma separators', () => {
    assert.strictEqual(formatBDT(3800), '৳3,800');
    assert.strictEqual(formatBDT(15000), '৳15,000');
    assert.strictEqual(formatBDT(120), '৳120');
  });

  await t.test('formatBDT handles zero, null and undefined consistently as ৳0', () => {
    assert.strictEqual(formatBDT(0), '৳0');
    assert.strictEqual(formatBDT(null), '৳0');
    assert.strictEqual(formatBDT(undefined), '৳0');
  });

  await t.test('toBanglaDigits converts ASCII numbers to Bengali digits', () => {
    assert.strictEqual(toBanglaDigits(12345), '১২৩৪৫');
    assert.strictEqual(toBanglaDigits('3800'), '৩৮০০');
    assert.strictEqual(toBanglaDigits('01712-345678'), '০১৭১২-৩৪৫৬৭৮');
  });

  await t.test('formatBanglaDate formats ISO date string gracefully', () => {
    const res = formatBanglaDate('2026-11-07T12:00:00Z');
    assert.ok(typeof res === 'string' && res.length > 0);
  });
});

test('Design System: WCAG 2.1 AA Contrast Ratio Verification', async (t) => {
  const WARM_BG = '#F7F3EE';
  const WALNUT_TEXT = '#2B1D14';
  const WOOD_ACCENT = '#8A5A3B';
  const WHITE = '#FFFFFF';

  await t.test('Walnut text on warm off-white background meets WCAG AAA (>7:1)', () => {
    const ratio = getContrastRatio(WARM_BG, WALNUT_TEXT);
    assert.ok(
      ratio >= 7.0,
      `Contrast ratio ${ratio.toFixed(2)} must be at least 7.0:1 for AAA`
    );
  });

  await t.test('Muted wood accent on warm off-white background meets WCAG AA (>4.5:1)', () => {
    const ratio = getContrastRatio(WARM_BG, WOOD_ACCENT);
    assert.ok(
      ratio >= 4.5,
      `Contrast ratio ${ratio.toFixed(2)} must be at least 4.5:1 for AA`
    );
  });

  await t.test('White text on walnut background meets WCAG AAA (>7:1)', () => {
    const ratio = getContrastRatio(WALNUT_TEXT, WHITE);
    assert.ok(
      ratio >= 7.0,
      `Contrast ratio ${ratio.toFixed(2)} must be at least 7.0:1 for AAA`
    );
  });
});
