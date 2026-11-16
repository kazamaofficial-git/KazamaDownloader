'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { kazamaBuildSitemap, kazamaBuildRobots } = require('../src/kazamaSitemap');

const tutorial = { id: 'xxy4yc4D1bk', title: 'Tutorial DownloadIn', description: 'Cara pakai & unduh' };

test('sitemap: memuat semua halaman publik dan video tutorial', () => {
  const xml = kazamaBuildSitemap({ baseUrl: 'https://dlin.example/', lastModified: '2026-11-14', tutorial });
  assert.match(xml, /<loc>https:\/\/dlin\.example\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/dlin\.example\/ios<\/loc>/);
  assert.match(xml, /<loc>https:\/\/dlin\.example\/lisensi<\/loc>/);
  assert.match(xml, /<video:player_loc>https:\/\/www\.youtube\.com\/embed\/xxy4yc4D1bk<\/video:player_loc>/);
  assert.match(xml, /Cara pakai &amp; unduh/, 'karakter khusus harus di-escape');
  assert.equal((xml.match(/<video:video>/g) || []).length, 1);
});

test('robots: menunjuk ke sitemap dan menutup /api/', () => {
  const txt = kazamaBuildRobots({ baseUrl: 'https://dlin.example' });
  assert.match(txt, /Sitemap: https:\/\/dlin\.example\/sitemap\.xml/);
  assert.match(txt, /Disallow: \/api\//);
});
