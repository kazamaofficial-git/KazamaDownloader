'use strict';
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cfg = require('./src/config');

const app = express();
app.disable('x-powered-by');
if (cfg.trustProxy) app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'self'"],
      'object-src': ["'none'"],
      'img-src': ["'self'", 'data:', 'blob:', new URL(cfg.QRIS_URL).origin],
      'media-src': ["'self'", 'blob:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'script-src': ["'self'"],
      'connect-src': ["'self'"],
      ...(cfg.isProd ? { 'upgrade-insecure-requests': [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: cfg.isProd,
}));
app.use(compression());

// variabel global untuk semua view
app.locals.app = {
  name: cfg.APP_NAME, full: cfg.APP_FULL_NAME, dev: cfg.DEVELOPER, org: cfg.ORG, version: cfg.VERSION,
  site: cfg.SITE_URL, repo: cfg.REPO_URL, releases: cfg.RELEASES_URL, qris: cfg.QRIS_URL,
};

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: cfg.isProd ? '1h' : 0,
  setHeaders: (res, p) => { if (p.includes(`${path.sep}logos${path.sep}`)) res.set('Cache-Control', 'public, max-age=604800'); },
}));

app.use('/api', require('./src/routes/api'));
app.use('/', require('./src/routes/pages'));

app.use((req, res) => res.status(404).render('404', { title: '404 — DownloadIn', page: '404' }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  if (res.headersSent) return res.destroy();
  res.status(500).render('404', { title: 'Error — DownloadIn', page: '404', error: true });
});

if (require.main === module) {
  app.listen(cfg.port, () => {
    console.log(`[${cfg.APP_FULL_NAME}] http://localhost:${cfg.port}  (dev: ${cfg.DEVELOPER})`);
    require('./src/engine').health().then((h) => {
      if (!h.yt_dlp) console.warn('\n[!] yt-dlp BELUM terpasang — jalankan:  npm run setup\n');
      else console.log(`[engine] yt-dlp ${h.yt_dlp}${h.plugins ? ' + plugin' : ''}`);
    });
  });
}
module.exports = app;
