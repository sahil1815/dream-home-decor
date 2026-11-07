import test from 'node:test';
import assert from 'node:assert';
import { buildRobotsConfig, buildSitemapUrls, validateSeoMetadata } from '../lib/seo.ts';

test('SEO & Performance: Robots Configuration', async (t) => {
  const baseUrl = 'https://dream-home-decor.vercel.app';
  const robotsConfig = buildRobotsConfig(baseUrl);

  await t.test('disallows administrative and api endpoints', () => {
    assert.ok(robotsConfig.rules);
    const rule = robotsConfig.rules[0];
    assert.strictEqual(rule.allow, '/');
    assert.deepStrictEqual(rule.disallow, ['/admin', '/admin/*', '/api', '/api/*']);
  });

  await t.test('specifies valid sitemap URL without trailing slash duplication', () => {
    assert.strictEqual(robotsConfig.sitemap, 'https://dream-home-decor.vercel.app/sitemap.xml');
  });

  await t.test('handles baseUrl with trailing slash gracefully', () => {
    const configWithSlash = buildRobotsConfig('https://dream-home-decor.vercel.app/');
    assert.strictEqual(configWithSlash.sitemap, 'https://dream-home-decor.vercel.app/sitemap.xml');
  });
});

test('SEO & Performance: Sitemap Dynamic Generation', async (t) => {
  const baseUrl = 'https://dream-home-decor.vercel.app';
  const mockProducts = [
    { slug: 'smart-ergonomic-reading-table', is_active: true, updated_at: '2026-11-01' },
    { slug: 'compact-student-study-table', is_active: true, updated_at: '2026-11-02' },
    { slug: 'hidden-draft-table', is_active: false }, // Should be excluded
  ];

  const sitemapEntries = buildSitemapUrls(baseUrl, mockProducts);

  await t.test('contains all core public storefront routes', () => {
    const urls = sitemapEntries.map((e) => e.url);
    const hasHome = urls.includes('https://dream-home-decor.vercel.app');
    const hasProducts = urls.includes('https://dream-home-decor.vercel.app/products');
    const hasAbout = urls.includes('https://dream-home-decor.vercel.app/about');
    const hasContact = urls.includes('https://dream-home-decor.vercel.app/contact');
    const hasFaq = urls.includes('https://dream-home-decor.vercel.app/faq');
    const hasDelivery = urls.includes('https://dream-home-decor.vercel.app/delivery-and-returns');
    const hasCustom = urls.includes('https://dream-home-decor.vercel.app/custom-furniture');

    assert.ok(hasHome, 'Missing Home route in sitemap');
    assert.ok(hasProducts, 'Missing Products route in sitemap');
    assert.ok(hasAbout, 'Missing About route in sitemap');
    assert.ok(hasContact, 'Missing Contact route in sitemap');
    assert.ok(hasFaq, 'Missing FAQ route in sitemap');
    assert.ok(hasDelivery, 'Missing Delivery route in sitemap');
    assert.ok(hasCustom, 'Missing Custom Furniture route in sitemap');
  });

  await t.test('includes active products and excludes inactive ones', () => {
    const urls = sitemapEntries.map((e) => e.url);
    assert.ok(urls.includes('https://dream-home-decor.vercel.app/products/smart-ergonomic-reading-table'));
    assert.ok(urls.includes('https://dream-home-decor.vercel.app/products/compact-student-study-table'));
    assert.strictEqual(
      urls.includes('https://dream-home-decor.vercel.app/products/hidden-draft-table'),
      false,
      'Inactive product must not be included in sitemap'
    );
  });

  await t.test('excludes private admin routes from sitemap', () => {
    const urls = sitemapEntries.map((e) => e.url);
    const hasAdmin = urls.some((u) => u.includes('/admin'));
    assert.strictEqual(hasAdmin, false, 'Admin routes should never appear in public sitemap');
  });

  await t.test('has valid priority scores between 0.1 and 1.0', () => {
    for (const entry of sitemapEntries) {
      if (entry.priority !== undefined) {
        assert.ok(entry.priority >= 0.1 && entry.priority <= 1.0);
      }
    }
  });
});

test('SEO & Performance: Metadata Standards & Open Graph', async (t) => {
  await t.test('validates absence of obsolete keywords meta tag per modern SEO guidelines', () => {
    const validMeta = {
      alternates: { canonical: '/' },
      openGraph: { locale: 'bn_BD', siteName: 'Dream Home Decor' },
    };
    const check = validateSeoMetadata(validMeta);
    assert.strictEqual(check.hasKeywordsTag, false);
    assert.strictEqual(check.hasCanonical, true);
    assert.strictEqual(check.hasBnLocale, true);
  });

  await t.test('flags obsolete keywords if present', () => {
    const obsoleteMeta = {
      keywords: ['table', 'chair'],
      alternates: { canonical: '/' },
      openGraph: { locale: 'bn_BD' },
    };
    const check = validateSeoMetadata(obsoleteMeta);
    assert.strictEqual(check.hasKeywordsTag, true);
  });
});
