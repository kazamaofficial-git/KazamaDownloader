'use strict';
// Anti-SSRF, rate limit, pemblokir bot. Port dari netpolicy + penjaga di api/index.py
const dns = require('node:dns').promises;
const net = require('node:net');
const cfg = require('./config');

const URL_RE = /https?:\/\/[^\s<>"'\u3000-\u303f\uff00-\uffef]+/i;

function findUrl(text) {
  text = String(text || '').trim();
  if (!text) return null;
  const m = text.match(URL_RE);
  if (!m) {
    if (/^[\w-]+(\.[\w-]+)+\/\S*$/.test(text)) return `https://${text}`; // "vt.tiktok.com/xxx"
    return null;
  }
  return m[0].replace(/[.,;:!?)\]}>'"]+$/, '');
}

// ---- IP privat / lokal ---------------------------------------------------
function isPrivateV4(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}
function isPrivateV6(ip) {
  const x = ip.toLowerCase();
  if (x === '::' || x === '::1') return true;
  const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe8') ||
    x.startsWith('fe9') || x.startsWith('fea') || x.startsWith('feb') || x.startsWith('ff');
}
const isPrivateIp = (ip) => (net.isIPv4(ip) ? isPrivateV4(ip) : net.isIPv6(ip) ? isPrivateV6(ip) : true);

async function isPublicUrl(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (!['http:', 'https:'].includes(u.protocol) || !u.hostname) return false;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || /\.(local|internal|localhost)$/.test(host)) return false;
  if (net.isIP(host)) return !isPrivateIp(host);
  try {
    const infos = await dns.lookup(host, { all: true });
    return infos.every((i) => !isPrivateIp(i.address));
  } catch {
    return true; // biarkan yt-dlp memberi error "tidak ditemukan"
  }
}

/** Ikuti redirect manual; setiap hop harus publik (anti SSRF lewat 302 ke 127.0.0.1). */
async function guardPublicHops(url, maxHops = 6) {
  if (!(await isPublicUrl(url))) return false;
  let cur = url;
  for (let i = 0; i < maxHops; i++) {
    let res;
    try {
      res = await fetch(cur, {
        method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(2500),
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' },
      });
      res.body?.cancel().catch(() => {});
    } catch { return true; } // fail-open: biar yt-dlp yang coba
    const loc = res.headers.get('location');
    if (res.status < 300 || res.status >= 400 || !loc) return true;
    cur = new URL(loc, cur).toString();
    if (!(await isPublicUrl(cur))) return false;
  }
  return true;
}

// ---- Bot / scraper -------------------------------------------------------
const BLOCKED_UA = [
  'scrapy', 'httrack', 'wget/', 'curl/', 'python-requests', 'python-urllib', 'go-http-client',
  'java/', 'libwww', 'httpclient', 'bytespider', 'gptbot', 'ccbot', 'anthropic', 'claude-web',
  'petalbot', 'semrush', 'ahrefs', 'dataforseo', 'mj12bot', 'dotbot', 'magpie-crawler',
];
function uaBlocked(ua) {
  const u = String(ua || '').toLowerCase();
  if (!u || u === 'mozilla/5.0') return true;
  if (u.includes('mozilla/')) return false;
  return BLOCKED_UA.some((b) => u.includes(b));
}

// ---- Rate limit (fixed window 60 dtk, entri kedaluwarsa dibuang satu-satu) ---
const hits = new Map();
function rateLimited(ip, limit = cfg.rateLimit) {
  const now = Date.now();
  let q = hits.get(ip);
  if (!q) hits.set(ip, (q = []));
  while (q.length && now - q[0] > 60000) q.shift();
  if (q.length >= limit) return true;
  q.push(now);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 120000) hits.delete(k);
  }
  return false;
}

// ---- Slot job download ---------------------------------------------------
let running = 0;
const acquireJob = () => (running >= cfg.maxJobs ? false : (running++, true));
const releaseJob = () => { running = Math.max(0, running - 1); };

module.exports = {
  findUrl, isPublicUrl, isPrivateIp, guardPublicHops, uaBlocked, rateLimited, acquireJob, releaseJob,
};
