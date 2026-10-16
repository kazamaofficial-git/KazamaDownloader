'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SIGNING_KEY = 'test-key';

test('releases: parse APK per ABI + IPA dari GitHub, urut ABI, dan cache', async () => {
  let calls = 0;
  global.fetch = async (url) => {
    calls++;
    assert.match(String(url), /api\.github\.com\/repos\/kazamaofficial-git\/KazamaDownloader\/releases\/latest/);
    return {
      ok: true, status: 200,
      json: async () => ({
        tag_name: 'v1.1.0', name: 'DownloadIn 1.1.0', published_at: '2026-10-11T00:00:00Z', html_url: 'https://github.com/x/y/releases/tag/v1.1.0',
        assets: [
          { name: 'DownloadIn-1.1.0-x86_64.apk', size: 3, browser_download_url: 'https://dl/x86' },
          { name: 'DownloadIn-1.1.0-arm64-v8a.apk', size: 1, browser_download_url: 'https://dl/arm64' },
          { name: 'DownloadIn-1.1.0.ipa', size: 9, browser_download_url: 'https://dl/ipa' },
          { name: 'DownloadIn-1.1.0.tipa', size: 9, browser_download_url: 'https://dl/tipa' },
          { name: 'DownloadIn-1.1.0-ios.zip', size: 8, browser_download_url: 'https://dl/zip' },
          { name: 'update-banner.webp', size: 5, browser_download_url: 'https://dl/banner' },
        ],
      }),
    };
  };
  const releases = require('../src/releases');
  const r = await releases.latest();
  assert.equal(r.version, '1.1.0');
  assert.deepEqual(r.apk.map((a) => a.abi), ['arm64-v8a', 'x86_64']);
  assert.equal(r.apk[0].url, 'https://dl/arm64');
  assert.equal(r.ipa.url, 'https://dl/ipa');
  assert.equal(r.tipa.url, 'https://dl/tipa');
  assert.equal(r.zip.url, 'https://dl/zip');
  await releases.latest();
  assert.equal(calls, 1, 'hasil kedua harus dari cache');
});
