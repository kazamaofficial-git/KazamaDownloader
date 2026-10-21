'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SIGNING_KEY = 'test-key';
const signer = require('../src/signer');
const sec = require('../src/security');
const { detectPlatform, catalog } = require('../src/platforms');
const engine = require('../src/engine');

test('signer: sign/verify dan tolak token rusak', () => {
  const t = signer.sign({ a: 1 });
  assert.equal(signer.verify(t).a, 1);
  assert.throws(() => signer.verify(`${t}x`), signer.TokenError);
  assert.throws(() => signer.verify('abc.def'), signer.TokenError);
  assert.throws(() => signer.verify(signer.sign({ a: 1 }, -10)), /kedaluwarsa/);
});

test('findUrl: ambil link dari teks share', () => {
  assert.equal(sec.findUrl('Lihat ini https://vt.tiktok.com/ZS123/ keren!'), 'https://vt.tiktok.com/ZS123/');
  assert.equal(sec.findUrl('vt.tiktok.com/abc/x'), 'https://vt.tiktok.com/abc/x');
  assert.equal(sec.findUrl('bukan link'), null);
});

test('anti-SSRF: IP privat ditolak', async () => {
  for (const ip of ['127.0.0.1', '10.0.0.5', '169.254.169.254', '192.168.1.1', '172.16.0.1', '::1', '::ffff:127.0.0.1', 'fd00::1']) {
    assert.equal(sec.isPrivateIp(ip), true, ip);
  }
  assert.equal(sec.isPrivateIp('8.8.8.8'), false);
  assert.equal(await sec.isPublicUrl('http://127.0.0.1:9090/'), false);
  assert.equal(await sec.isPublicUrl('http://localhost/'), false);
  assert.equal(await sec.isPublicUrl('file:///etc/passwd'), false);
  assert.equal(await sec.isPublicUrl('http://8.8.8.8/'), true);
});

test('uaBlocked & rateLimited', () => {
  assert.equal(sec.uaBlocked('curl/8.0'), true);
  assert.equal(sec.uaBlocked(''), true);
  assert.equal(sec.uaBlocked('Mozilla/5.0 (X11; Linux) Chrome/139'), false);
  for (let i = 0; i < 3; i++) assert.equal(sec.rateLimited('1.1.1.1', 3), false);
  assert.equal(sec.rateLimited('1.1.1.1', 3), true);
});

test('platform: deteksi domain & katalog', () => {
  assert.equal(detectPlatform('https://www.tiktok.com/@a/video/1').id, 'tiktok');
  assert.equal(detectPlatform('https://v.qq.com/x/page/abc.html').id, 'vqq');
  assert.equal(detectPlatform('https://example.org/'), null);
  assert.equal(catalog().total_featured, 48);
});

test('engine: nama file bermerek & opsi video/audio dari info yt-dlp', () => {
  const { buildEntry, Ctx, brandedName } = engine._t;
  assert.match(brandedName({ id: 'x1' }, 'Halo Dunia!', 'https://a/b', '720p', 'mp4'), /^DownloadIn-Halo-Dunia-[0-9a-f]{8}-720p\.mp4$/);
  const info = {
    id: 'abc', title: 'Tes Video', duration: 100, extractor_key: 'Youtube', webpage_url: 'https://youtu.be/abc',
    formats: [
      { format_id: '137', url: 'https://x/v137', protocol: 'https', ext: 'mp4', vcodec: 'avc1', acodec: 'none', width: 1920, height: 1080, filesize: 1000 },
      { format_id: '136', url: 'https://x/v136', protocol: 'https', ext: 'mp4', vcodec: 'avc1', acodec: 'none', width: 1280, height: 720 },
      { format_id: '140', url: 'https://x/a140', protocol: 'https', ext: 'm4a', vcodec: 'none', acodec: 'mp4a.40.2', abr: 128, filesize: 200 },
      { format_id: 'sb0', url: 'https://x/sb', protocol: 'mhtml', ext: 'mhtml', format_note: 'storyboard' },
    ],
  };
  const e = buildEntry(new Ctx(info, info.webpage_url), info);
  assert.deepEqual(e.video.map((v) => v.quality), [1080, 720]);
  assert.equal(e.video[0].mode, 'merge');
  assert.equal(e.video[0].ext, 'mp4');
  assert.equal(e.video[0].size, 1200);
  assert.deepEqual(e.audio.map((a) => a.id), ['mp3-320', 'mp3-192', 'mp3-128', 'orig']);
  const tok = signer.verify(new URL(e.video[0].url, 'http://x').searchParams.get('t'));
  assert.equal(tok.sel.startsWith('137+140'), true);
  assert.equal(tok.m, 'file');
  assert.equal(tok.mg, 'mp4');
  assert.equal(e.media_kind, 'video');
});

test('engine: video muxed langsung di-stream, tanpa merge', () => {
  const { buildEntry, Ctx } = engine._t;
  const info = { id: 'k', title: 'TikTok', webpage_url: 'https://tiktok.com/x', formats: [
    { format_id: 'h264', url: 'https://c/v', protocol: 'https', ext: 'mp4', vcodec: 'h264', acodec: 'aac', width: 720, height: 1280 },
  ] };
  const e = buildEntry(new Ctx(info, info.webpage_url), info);
  assert.equal(e.video[0].mode, 'direct');
  assert.equal(signer.verify(new URL(e.video[0].url, 'http://x').searchParams.get('t')).m, 'stream');
  assert.ok(e.audio.some((a) => a.kind === 'mp3'));
});

test('engine: pesan error ramah', () => {
  assert.equal(engine.friendlyError('Unsupported URL: x')[0], 'unsupported');
  assert.equal(engine.friendlyError('Video unavailable')[0], 'notfound');
  assert.equal(engine.friendlyError('HTTP Error 429')[0], 'blocked');
});
