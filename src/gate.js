'use strict';
// Gerbang API ringan: /api/extract, /api/android, /api/platforms, /api/health butuh header X-KD-Key.
// Kunci tetap (bukan secret, tidak di env/Secrets) dan disimpan terenkode; website dan aplikasi mengirimnya,
// siapa pun yang membuka/memeriksa klien bisa menemukannya. Rute bertoken (/api/download, /api/media) dan /api/ping tidak lewat gerbang.
const crypto = require('node:crypto');

const KEY = Buffer.from('RExJTkFQUC0xMTEwMjU=', 'base64').toString();

function same(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function gate(req, res, next) {
  const k = req.get('x-kd-key');
  if (k && same(k, KEY)) return next();
  return res.status(403).json({ ok: false, code: 'forbidden', error: 'Akses ditolak.' });
}

module.exports = { gate };
