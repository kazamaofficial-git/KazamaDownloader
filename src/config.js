'use strict';
try { require('dotenv').config(); } catch { /* dotenv opsional */ }
const crypto = require('node:crypto');

const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);
const bins = require('./binaries');
const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

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
  SITE_URL: 'https://dlin.kazamasite.biz.id',
  REPO_URL: 'https://github.com/kazamaofficial-git/KazamaDownloader',
  RELEASES_URL: 'https://github.com/kazamaofficial-git/KazamaDownloader/releases/latest',
  QRIS_URL: 'https://www.kazamasite.biz.id/images/qris.jpg',
  VERSION: require('../package.json').versionLabel || require('../package.json').version,
  isProd,
  port: int(process.env.PORT, 3000),
  trustProxy: process.env.TRUST_PROXY === '1' || !!process.env.VERCEL,
  serverless: bins.isServerless,
  signingKey,
  get ytdlp() { return bins.ytdlp(); },
  get ffmpeg() { return bins.ffmpeg(); },
  childEnv: () => bins.childEnv(),
  githubToken: process.env.GITHUB_TOKEN || '',
  rateLimit: int(process.env.RATE_LIMIT, 25),
  maxJobs: int(process.env.MAX_JOBS, 3),
  extractTimeoutMs: int(process.env.EXTRACT_TIMEOUT_MS, 60000),
  extractProxy: (process.env.EXTRACT_PROXY || '').trim(),
  maxEntries: 12,
  tokenTtlSec: 6 * 3600,
};
