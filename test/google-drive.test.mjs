import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDriveUrl,
  convertDriveViewToDirectLinks,
  matchDriveFileToTarget,
} from '../lib/google-drive.ts';

describe('Google Drive URL Parser', () => {
  test('parses public folder URL', () => {
    const url = 'https://drive.google.com/drive/folders/1abc9876XYZ_FolderId';
    const result = parseDriveUrl(url);
    assert.equal(result.type, 'folder');
    assert.equal(result.id, '1abc9876XYZ_FolderId');
  });

  test('parses folder URL with user index (/u/0/)', () => {
    const url = 'https://drive.google.com/drive/u/0/folders/1abc9876XYZ_FolderId2';
    const result = parseDriveUrl(url);
    assert.equal(result.type, 'folder');
    assert.equal(result.id, '1abc9876XYZ_FolderId2');
  });

  test('parses file /view link', () => {
    const url = 'https://drive.google.com/file/d/1XyZ_FileID_1234567890/view?usp=sharing';
    const result = parseDriveUrl(url);
    assert.equal(result.type, 'file');
    assert.equal(result.id, '1XyZ_FileID_1234567890');
  });

  test('parses query format open?id=ID', () => {
    const url = 'https://drive.google.com/open?id=1XyZ_FileID_1234567890';
    const result = parseDriveUrl(url);
    assert.equal(result.type, 'file');
    assert.equal(result.id, '1XyZ_FileID_1234567890');
  });

  test('parses bare drive ID', () => {
    const id = '1a2b3c4d5e6f7g8h9i0j1k2l3m4n';
    const result = parseDriveUrl(id);
    assert.equal(result.type, 'file');
    assert.equal(result.id, id);
  });
});

describe('Drive View to Direct Links Converter', () => {
  test('generates correct direct download and thumbnail URLs', () => {
    const viewUrl = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M/view';
    const links = convertDriveViewToDirectLinks(viewUrl);

    assert.ok(links);
    assert.equal(links.id, '1A2B3C4D5E6F7G8H9I0J1K2L3M');
    assert.equal(
      links.directDownloadUrl,
      'https://drive.google.com/uc?export=download&id=1A2B3C4D5E6F7G8H9I0J1K2L3M'
    );
    assert.equal(
      links.thumbnailUrl,
      'https://drive.google.com/thumbnail?id=1A2B3C4D5E6F7G8H9I0J1K2L3M&sz=w1200'
    );
    assert.ok(links.explanationBn.includes('HTML'));
    assert.ok(links.explanationBn.includes('<img>'));
  });
});

describe('Target Matching for Drive Files', () => {
  const sampleProducts = [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      slug: 'smart-ergonomic-reading-table',
      title_bn: 'স্মার্ট রিডিং টেবিল',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      slug: 'compact-student-study-table',
      title_bn: 'কমপ্যাক্ট স্টাডি টেবিল',
    },
  ];

  test('matches hero image', () => {
    const target = matchDriveFileToTarget('hero/main-banner.jpg', sampleProducts);
    assert.equal(target.type, 'site');
    assert.equal(target.slot, 'hero');
  });

  test('matches workshop step images', () => {
    const t1 = matchDriveFileToTarget('workshop/1-cutting.jpg', sampleProducts);
    assert.equal(t1.type, 'site');
    assert.equal(t1.slot, 'workshop_1');

    const t2 = matchDriveFileToTarget('workshop/2-edgebanding.jpg', sampleProducts);
    assert.equal(t2.type, 'site');
    assert.equal(t2.slot, 'workshop_2');
  });

  test('matches product slug and extracts sort order', () => {
    const target = matchDriveFileToTarget(
      'products/smart-ergonomic-reading-table/02.jpg',
      sampleProducts
    );
    assert.equal(target.type, 'product');
    assert.equal(target.slug, 'smart-ergonomic-reading-table');
    assert.equal(target.sortOrder, 2);
    assert.equal(target.productTitleBn, 'স্মার্ট রিডিং টেবিল');
  });

  test('fallback matches product slug from directory name without known products', () => {
    const target = matchDriveFileToTarget('products/custom-sofa-set/01.png', []);
    assert.equal(target.type, 'product');
    assert.equal(target.slug, 'custom-sofa-set');
    assert.equal(target.sortOrder, 1);
  });

  test('returns unknown for unmapped random file', () => {
    const target = matchDriveFileToTarget('misc/random_receipt.pdf', sampleProducts);
    assert.equal(target.type, 'unknown');
  });
});
