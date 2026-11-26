import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFacebookVideoInput,
  sanitizeFacebookVideoUrls,
  buildFacebookEmbedUrl,
} from '../lib/facebook-video.ts';

describe('Facebook Video Link Parser & Validator', () => {
  test('parses standard Facebook page video link and strips tracking query params', () => {
    const raw =
      'https://www.facebook.com/dreamhomedecorbd/videos/123456789012345/?mibextid=rS40aB7S9Ucbxw6v';
    const result = parseFacebookVideoInput(raw);

    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(
        result.url,
        'https://www.facebook.com/dreamhomedecorbd/videos/123456789012345/'
      );
      assert.equal(result.isReel, false);
      assert.equal(result.isShortLink, false);
      assert.equal(
        result.embedUrl,
        buildFacebookEmbedUrl('https://www.facebook.com/dreamhomedecorbd/videos/123456789012345/')
      );
    }
  });

  test('parses watch/?v= link and preserves video id', () => {
    const raw = 'https://m.facebook.com/watch/?v=9876543210&ref=sharing';
    const result = parseFacebookVideoInput(raw);

    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.url, 'https://www.facebook.com/watch/?v=9876543210');
      assert.equal(result.isReel, false);
      assert.equal(result.isShortLink, false);
    }
  });

  test('parses Facebook Reel link and flags isReel = true', () => {
    const raw = 'https://www.facebook.com/reel/555666777888999?s=yWDuG2&fs=e';
    const result = parseFacebookVideoInput(raw);

    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.url, 'https://www.facebook.com/reel/555666777888999');
      assert.equal(result.isReel, true);
      assert.equal(result.isShortLink, false);
    }
  });

  test('parses fb.watch short link and flags isShortLink = true', () => {
    const raw = 'https://fb.watch/abc123XYZ/?mibextid=NnVzG8';
    const result = parseFacebookVideoInput(raw);

    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.url, 'https://fb.watch/abc123XYZ/');
      assert.equal(result.isShortLink, true);
    }
  });

  test('parses /share/r/ link and flags both isReel and isShortLink', () => {
    const raw = 'https://www.facebook.com/share/r/1A2B3C4D5E/';
    const result = parseFacebookVideoInput(raw);

    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.isReel, true);
      assert.equal(result.isShortLink, true);
    }
  });

  test('extracts canonical video URL from pasted Facebook iframe embed snippet', () => {
    const iframeSnippet =
      '<iframe src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1122334455%2F&show_text=false&width=267&t=0" width="267" height="476"></iframe>';
    const result = parseFacebookVideoInput(iframeSnippet);

    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.url, 'https://www.facebook.com/reel/1122334455/');
      assert.equal(result.isReel, true);
    }
  });

  test('rejects non-Facebook domains and javascript URIs', () => {
    const yt = parseFacebookVideoInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(yt.valid, false);

    const xss = parseFacebookVideoInput('javascript:alert(1)');
    assert.equal(xss.valid, false);

    const homepage = parseFacebookVideoInput('https://www.facebook.com/dreamhomedecorbd');
    assert.equal(homepage.valid, false);
  });

  test('sanitizeFacebookVideoUrls deduplicates and drops invalid entries', () => {
    const cleaned = sanitizeFacebookVideoUrls([
      'https://m.facebook.com/reel/999888777?mibextid=abc',
      'https://www.facebook.com/reel/999888777',
      'https://evil.example.com/video.mp4',
      'https://www.facebook.com/watch/?v=12345',
    ]);

    assert.deepEqual(cleaned, [
      'https://www.facebook.com/reel/999888777',
      'https://www.facebook.com/watch/?v=12345',
    ]);
  });
});
