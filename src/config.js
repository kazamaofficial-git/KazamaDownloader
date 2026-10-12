'use strict';
try { require('dotenv').config(); } catch { /* dotenv opsional */ }
const crypto = require('node:crypto');

const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);
<<<<<<< HEAD
const bins = require('./binaries');
const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
=======
const isProd = process.env.NODE_ENV === 'production';
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8

let signingKey = process.env.SIGNING_KEY || '';
if (!signingKey) {
  if (isProd) {
    console.error('[config] SIGNING_KEY wajib diisi saat NODE_ENV=production.');
    process.exit(1);
  }
  signingKey = crypto.randomBytes(32).toString('hex'); // dev: acak tiap start
}

module.exports = {
  APP_NAME: 'DownloadIn',
  APP_FULL_NAME: 'DownloadIn (KazamaDownloader)',
  DEVELOPER: 'KazamaDev',
  ORG: 'KazamaTech',
<<<<<<< HEAD
  SITE_URL: 'https://dlin.kazamasite.biz.id',
  REPO_URL: 'https://github.com/kazamaofficial-git/KazamaDownloader',
  RELEASES_URL: 'https://github.com/kazamaofficial-git/KazamaDownloader/releases/latest',
=======
  SITE_URL: 'https://www.kazamasite.biz.id',
  REPO_URL: 'https://github.com/kazamaofficial/KazamaDownloader',
  RELEASES_URL: 'https://github.com/kazamaofficial/KazamaDownloader/releases/latest',
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
  QRIS_URL: 'https://www.kazamasite.biz.id/images/qris.jpg',
  VERSION: require('../package.json').version,
  isProd,
  port: int(process.env.PORT, 3000),
<<<<<<< HEAD
  trustProxy: process.env.TRUST_PROXY === '1' || !!process.env.VERCEL,
  serverless: bins.isServerless,
  signingKey,
  get ytdlp() { return bins.ytdlp(); },
  get ffmpeg() { return bins.ffmpeg(); },
  childEnv: () => bins.childEnv(),
  githubToken: process.env.GITHUB_TOKEN || '',
=======
  trustProxy: process.env.TRUST_PROXY === '1',
  signingKey,
  ytdlp: process.env.YTDLP_PATH || 'yt-dlp',
  ffmpeg: process.env.FFMPEG_PATH || 'ffmpeg',
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
  rateLimit: int(process.env.RATE_LIMIT, 25),
  maxJobs: int(process.env.MAX_JOBS, 3),
  extractTimeoutMs: int(process.env.EXTRACT_TIMEOUT_MS, 60000),
  extractProxy: (process.env.EXTRACT_PROXY || '').trim(),
  maxEntries: 12,
  tokenTtlSec: 6 * 3600,
};
