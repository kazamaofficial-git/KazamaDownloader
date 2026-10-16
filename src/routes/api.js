'use strict';
const express = require('express');
const cfg = require('../config');
const sec = require('../security');
const signer = require('../signer');
const engine = require('../engine');
const { catalog } = require('../platforms');
const { handleDownload, handleMedia } = require('../downloader');
const releases = require('../releases');

const router = express.Router();
router.use(express.json({ limit: '64kb' }));
router.use((req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' });
  next();
});

router.get(['/health', '/'], async (req, res) => res.json(await engine.health()));

router.get('/platforms', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600').json(catalog());
});

router.get('/android', async (req, res) => {
  try {
    const r = await releases.latest();
    if (r.none) return res.json({ ok: true, available: false });
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600').json({
      ok: true, available: true, version: r.version, published: r.published,
      apk: r.apk.map((a) => ({ abi: a.abi, size: a.size, name: a.name, href: `/download/android/${a.abi}` })),
      ios: r.ipa ? {
        size: r.ipa.size,
        href: '/download/ios',
        variants: [
          r.ipa && { kind: 'ipa', size: r.ipa.size, href: '/download/ios' },
          r.tipa && { kind: 'tipa', size: r.tipa.size, href: '/download/ios/tipa' },
          r.zip && { kind: 'zip', size: r.zip.size, href: '/download/ios/zip' },
        ].filter(Boolean),
      } : null,
    });
  } catch {
    res.status(502).json({ ok: false, error: 'Gagal membaca data rilis. Coba lagi sebentar.' });
  }
});

router.all('/extract', async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'method not allowed' });
  if (sec.uaBlocked(req.get('user-agent'))) {
    return res.status(403).json({ ok: false, code: 'forbidden', error: 'Akses API ditolak. Pakai situs resmi DownloadIn.' });
  }
  if (sec.rateLimited(req.ip)) {
    return res.status(429).set('Retry-After', '60').json({ ok: false, code: 'rate_limit', error: 'Terlalu banyak permintaan. Tunggu 1 menit ya.' });
  }
  const text = (req.method === 'POST' ? req.body?.url : null) || req.query.url || '';
  try {
    res.json(await engine.extract(String(text)));
  } catch (e) {
    if (e instanceof engine.KazamaError) {
      return res.status(e.status).json({ ok: false, code: e.code, error: e.message, detail: e.detail });
    }
    console.error('[extract]', e);
    res.status(500).json({ ok: false, code: 'internal', error: 'Terjadi kesalahan server.' });
  }
});

function withToken(handler) {
  return (req, res) => {
    let payload;
    try { payload = signer.verify(req.query.t); }
    catch (e) { return res.status(403).json({ ok: false, code: 'token', error: e.message }); }
    if (sec.rateLimited(`dl:${req.ip}`, cfg.rateLimit * 6)) {
      return res.status(429).set('Retry-After', '60').json({ ok: false, code: 'rate_limit', error: 'Terlalu banyak unduhan dari IP ini. Tunggu sebentar ya.' });
    }
    return handler(payload, req, res);
  };
}
router.get('/download', withToken(handleDownload));
router.get('/media', withToken(handleMedia));
router.head('/media', withToken(handleMedia));

router.use((req, res) => res.status(404).json({ ok: false, error: 'not found' }));

module.exports = router;
