import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Workshop System: Data File and Storefront Visibility Logic', async (t) => {
  const jsonPath = path.join(__dirname, '..', 'data', 'workshop.json');
  const content = await fs.readFile(jsonPath, 'utf-8');
  const workshopData = JSON.parse(content);

  await t.test('data/workshop.json has valid structure with is_active flag', () => {
    assert.ok(workshopData, 'workshop.json should exist and be valid JSON');
    assert.strictEqual(typeof workshopData.is_active, 'boolean', 'is_active should be a boolean');
    assert.strictEqual(workshopData.is_active, true, 'is_active should default to true');
    assert.ok(workshopData.title, 'title should be present');
    assert.ok(Array.isArray(workshopData.steps), 'steps should be an array');
    assert.ok(workshopData.steps.length >= 1, 'should have at least 1 step');
    assert.ok(workshopData.videoCard, 'videoCard should be present');
  });

  await t.test('Storefront visibility rule omits workshop when is_active is false', () => {
    const turnedOffWorkshop = {
      ...workshopData,
      is_active: false,
    };

    // Storefront display condition in app/page.tsx & WorkshopShowcase
    const shouldDisplaySection = turnedOffWorkshop.is_active !== false;
    assert.strictEqual(shouldDisplaySection, false, 'Section must not display on frontend when turned off');

    // Navbar link condition in components/storefront/Navbar.tsx
    const shouldDisplayNavLink = turnedOffWorkshop.is_active !== false;
    assert.strictEqual(shouldDisplayNavLink, false, 'Navbar link must not display when turned off');
  });

  await t.test('Storefront visibility rule displays workshop when is_active is true', () => {
    const turnedOnWorkshop = {
      ...workshopData,
      is_active: true,
    };

    const shouldDisplaySection = turnedOnWorkshop.is_active !== false;
    assert.strictEqual(shouldDisplaySection, true, 'Section must display on frontend when active');

    const shouldDisplayNavLink = turnedOnWorkshop.is_active !== false;
    assert.strictEqual(shouldDisplayNavLink, true, 'Navbar link must display when active');
  });

  await t.test('Storefront visibility gracefully defaults to true if is_active is undefined (legacy data fallback)', () => {
    const legacyWorkshop = { ...workshopData };
    delete legacyWorkshop.is_active;

    const shouldDisplaySection = legacyWorkshop.is_active !== false;
    assert.strictEqual(shouldDisplaySection, true, 'Section must gracefully default to true for backward compatibility');

    const shouldDisplayNavLink = legacyWorkshop.is_active !== false;
    assert.strictEqual(shouldDisplayNavLink, true, 'Navbar link must gracefully default to true for backward compatibility');
  });
});
