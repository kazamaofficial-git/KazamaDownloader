'use strict';
const express = require('express');
const { catalog } = require('../platforms');
const components = require('../../licenses/components.json');

<<<<<<< HEAD
const cfg = require('../config');
const releases = require('../releases');

=======
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'DownloadIn — Download video, MP3 & foto gratis', catalog: catalog(), page: 'home' });
});

router.get('/lisensi', (req, res) => {
  res.render('licenses', { title: 'Lisensi — DownloadIn', page: 'licenses', web: components.web, trademarks: components.trademarks });
});

<<<<<<< HEAD
router.get('/ios', (req, res) => {
  res.render('ios', { title: 'DownloadIn untuk iPhone & iPad', page: 'ios' });
});

// Unduh langsung dari website: server mencari rilis terbaru lalu mengarahkan ke berkas APK/IPA-nya.
function sendFile(res, url) {
  res.set('Cache-Control', 'public, max-age=120, s-maxage=300').redirect(302, url);
}
const notYet = (res, what) =>
  res.status(404).set('Cache-Control', 'no-store').type('text/plain; charset=utf-8')
    .send(`${what} belum dirilis. Coba lagi nanti.`);

router.get(['/download/android', '/download/android/:abi'], async (req, res) => {
  try {
    const r = await releases.latest();
    if (r.none || !r.apk.length) return notYet(res, 'APK Android');
    const want = String(req.params.abi || 'arm64-v8a').toLowerCase();
    const pick = r.apk.find((a) => a.abi === want) || r.apk.find((a) => a.abi === 'arm64-v8a') || r.apk[0];
    return sendFile(res, pick.url);
  } catch {
    return res.redirect(302, cfg.RELEASES_URL); // GitHub sedang bermasalah: jalur cadangan
  }
});

router.get('/download/ios', async (req, res) => {
  try {
    const r = await releases.latest();
    if (r.none || !r.ipa) return notYet(res, 'Aplikasi iOS (IPA)');
    return sendFile(res, r.ipa.url);
  } catch {
    return res.redirect(302, cfg.RELEASES_URL);
  }
});

=======
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
module.exports = router;
