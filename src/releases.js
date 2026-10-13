'use strict';
// Rilis terbaru dari GitHub -> daftar APK/IPA, supaya pengguna bisa mengunduh langsung dari website
// (/download/android, /download/ios) tanpa membuka halaman GitHub.
const cfg = require('./config');

const REPO = new URL(cfg.REPO_URL).pathname.replace(/^\/|\/$/g, '').replace(/\.git$/, '');
const TTL = 10 * 60 * 1000;
let cache = null;

const ABI_ORDER = ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'universal'];

async function fetchLatest() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'DownloadIn-Web', 'X-GitHub-Api-Version': '2022-11-28' };
  if (cfg.githubToken) headers.Authorization = `Bearer ${cfg.githubToken}`;
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers, signal: AbortSignal.timeout(8000) });
  if (res.status === 404) return { none: true };
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const r = await res.json();
  const assets = r.assets || [];
  const apk = assets.filter((a) => /\.apk$/i.test(a.name)).map((a) => ({
    abi: (a.name.match(/(arm64-v8a|armeabi-v7a|x86_64|universal)/i) || [, 'universal'])[1].toLowerCase(),
    name: a.name, size: a.size, url: a.browser_download_url,
  })).sort((a, b) => ABI_ORDER.indexOf(a.abi) - ABI_ORDER.indexOf(b.abi));
  const ipa = assets.filter((a) => /\.ipa$/i.test(a.name)).map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url }));
  return {
    version: String(r.tag_name || '').replace(/^v/, ''), name: r.name, published: r.published_at,
    page: r.html_url, apk, ipa: ipa[0] || null,
  };
}

/** Dengan cache 10 menit; bila GitHub gagal tetapi ada cache lama, pakai cache lama. */
async function latest() {
  if (cache && Date.now() - cache.t < TTL) return cache.v;
  try {
    const v = await fetchLatest();
    cache = { t: Date.now(), v };
    return v;
  } catch (e) {
    if (cache) return cache.v;
    throw e;
  }
}

module.exports = { latest, REPO };
