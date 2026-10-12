'use strict';
// Engine DownloadIn: yt-dlp (binary) + plugin KazamaDownloader -> JSON rapi.
// Port dari engine Python XyDownloader ke Node.js.
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const sec = require('./security');
const signer = require('./signer');
const { detectPlatform } = require('./platforms');

const PLUGIN_DIR = path.join(__dirname, '..', 'plugins');
const MAX_GALLERY = 60;
const IMAGE_EXTS = new Set(['mhtml', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'avif']);

class XyError extends Error {
  constructor(code, message, detail = null, status = 422) {
    super(message);
    Object.assign(this, { code, detail, status });
  }
}

// ---------------------------------------------------------------------------
// Error ramah pengguna
// ---------------------------------------------------------------------------
const ERROR_RULES = [
  [['unsupported url'], 'unsupported', 'Link ini belum didukung. Pastikan itu link postingan/video (bukan profil atau halaman utama).'],
  [['confirm you', 'not a bot'], 'blocked', 'YouTube memblokir server ini dengan cek anti-bot. Coba lagi nanti, atau pasang cookies/proxy di server.'],
  [['412', 'precondition failed', 'menolak permintaan', 'butuh verifikasi', 'argus'], 'blocked', 'Platform ini sedang memblokir IP server. Coba lagi beberapa saat lagi.'],
  [['drm'], 'drm', 'Konten ini dilindungi DRM (konten premium/berbayar) dan tidak bisa diunduh.'],
  [['private', 'login', 'log in', 'sign in', 'authentication', 'cookies', 'members-only', 'subscriber'], 'private', 'Konten ini privat / butuh login. DownloadIn hanya bisa mengambil konten publik.'],
  [['geo', 'not available in your country', 'your region', 'country'], 'geo', 'Konten ini dibatasi wilayah (geo-block).'],
  [['timed out', 'timeout', 'time out'], 'timeout', 'Server platform lambat merespons. Coba lagi sebentar lagi.'],
  [['403', 'forbidden', 'tls fingerprint', 'blocked', 'rate-limit', 'rate limit', '429'], 'blocked', 'Platform memblokir/membatasi server untuk link ini. Coba lagi nanti.'],
  [['404', 'not found', 'unavailable', 'removed', 'deleted', 'does not exist', 'no longer'], 'notfound', 'Konten tidak ditemukan — mungkin sudah dihapus, privat, atau link-nya salah.'],
  [['no video', 'no formats', 'no media'], 'novideo', 'Tidak ada video/audio yang bisa diunduh di postingan ini.'],
];
function friendlyError(raw) {
  const m = String(raw || '').toLowerCase();
  for (const [keys, code, text] of ERROR_RULES) if (keys.some((k) => m.includes(k))) return [code, text];
  return ['error', 'Gagal memproses link ini.'];
}
function cleanError(msg) {
  return String(msg || '')
    .replace(/\x1b\[[0-9;]*m/g, '').replace(/ERROR: /g, '')
    .replace(/;? ?please report this issue on[\s\S]*$/i, '')
    .trim().slice(0, 400);
}

// ---------------------------------------------------------------------------
// Util nama & label
// ---------------------------------------------------------------------------
function safeFilename(name, max = 90) {
  let n = String(name || 'video').replace(/[\\/:*?"<>|\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').replace(/^[ .]+|[ .]+$/g, '');
  if (n.length > max) n = `${n.slice(0, max).trimEnd()}…`;
  return n || 'video';
}
function slugTitle(name, max = 36) {
  let s = safeFilename(name, max + 10).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
  if (s.length > max) s = s.slice(0, max).replace(/-+$/, '');
  return s || 'file';
}
function contentId(info, pageUrl = '') {
  const raw = String(info.id || '').trim() || pageUrl || info.webpage_url || info.original_url || info.title || 'x';
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
}
/** DownloadIn-<slug>-<id>[-tag].ext */
function brandedName(info, title, pageUrl = '', tag = '', ext = 'mp4') {
  let base = `DownloadIn-${slugTitle(title || info.title || 'file')}-${contentId(info, pageUrl)}`;
  const t = String(tag || '').replace(/[\\/:*?"<>|\s]+/g, '');
  if (t) base += `-${t}`;
  const e = String(ext || 'bin').replace(/^\./, '').toLowerCase() || 'bin';
  return `${base}.${e}`;
}
function qualityTier(q) {
  q = Number(q) || 0;
  if (q <= 0) return 'auto';
  if (q <= 480) return 'hemat';
  if (q <= 720) return 'normal';
  if (q <= 1080) return 'tinggi';
  return 'maksimal';
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Analisis format
// ---------------------------------------------------------------------------
const proto = (f) => {
  const p = String(f.protocol || '').split('+')[0];
  if (p === 'http' || p === 'https') return 'direct';
  if (p === 'm3u8' || p === 'm3u8_native') return 'hls';
  return null;
};
function usable(f) {
  if (!f.url || f.has_drm) return false;
  if (IMAGE_EXTS.has(f.ext) || String(f.format_note || '').toLowerCase().includes('storyboard')) return false;
  if (['jpeg', 'png', 'gif', 'webp', 'mjpeg'].includes(String(f.vcodec || '').toLowerCase())) return false;
  const kind = proto(f);
  if (!kind) return false;
  if (kind === 'direct' && f.fragments) return false;
  return true;
}
const hasVideo = (f) => {
  if (f.vcodec === 'none') return false;
  if (f.video_ext === 'none' && f.audio_ext && f.audio_ext !== 'none') return false;
  return true;
};
const hasAudio = (f) => f.acodec !== 'none';
const watermarked = (f) => {
  const note = `${f.format_note || ''} ${f.format_id || ''}`.toLowerCase();
  return note.includes('watermark') || note.trim().startsWith('download');
};
function vcodecScore(f) {
  const v = String(f.vcodec || '').toLowerCase();
  if (/^(avc|h264)/.test(v)) return 4;
  if (!v) return 3.5;
  if (/^(hev|hvc|h265|bytevc1)/.test(v)) return 3;
  if (v.startsWith('av01')) return 2;
  if (/^(vp9|vp09)/.test(v)) return 1.5;
  return 1;
}
function vcodecLabel(f) {
  const v = String(f.vcodec || '').toLowerCase();
  if (/^(avc|h264)/.test(v)) return 'H.264';
  if (/^(hev|hvc|h265|bytevc1)/.test(v)) return 'HEVC';
  if (v.startsWith('av01')) return 'AV1';
  if (/^(vp9|vp09)/.test(v)) return 'VP9';
  return null;
}
const sizeOf = (f) => f.filesize || f.filesize_approx || null;
function shortSide(f) {
  const { width: w, height: h } = f;
  if (w && h) return Math.min(w, h);
  if (h || w) return h || w;
  const hint = `${f.format_id || ''} ${f.format_note || ''}`.toLowerCase();
  if (/\bhd\b/.test(hint)) return 719;
  if (/\bsd\b/.test(hint)) return 359;
  return 0;
}
const qualityLabel = (q) => (q === 719 ? 'HD' : q === 359 ? 'SD' : q ? `${q}p` : 'Video');
function audioExt(f) {
  const a = String(f.acodec || '').toLowerCase();
  if (a.startsWith('mp4a') || ['m4a', 'mp4', 'aac'].includes(f.ext)) return 'm4a';
  if (a.startsWith('opus') || f.ext === 'webm') return 'webm';
  if (a.startsWith('mp3') || f.ext === 'mp3') return 'mp3';
  return f.ext || 'm4a';
}
const maxBy = (arr, key) => arr.reduce((best, x) => {
  if (!best) return x;
  const a = key(x), b = key(best);
  for (let i = 0; i < a.length; i++) { if (a[i] > b[i]) return x; if (a[i] < b[i]) return best; }
  return best;
}, null);
const num = (v) => (typeof v === 'number' ? v : Number(v) || 0);

// ---------------------------------------------------------------------------
// Pembuat token unduhan / media
// ---------------------------------------------------------------------------
class Ctx {
  constructor(info, pageUrl) { this.info = info; this.pageUrl = pageUrl; }

  /** Token unduhan via yt-dlp: mode 'stream' (pipe langsung) atau 'file' (merge/HLS/MP3). */
  dl(meta) {
    return `/api/download?t=${signer.sign({ s: this.pageUrl, ...meta })}`;
  }

  headersFor(f) {
    const h = {};
    for (const [k, v] of Object.entries(f.http_headers || {})) {
      if (!['accept-encoding', 'host', 'content-length'].includes(k.toLowerCase())) h[k] = v;
    }
    if (f.cookies) h.Cookie = f.cookies;
    return h;
  }

  /** Link proxy media (gambar/thumbnail/video langsung) dengan header sumber. */
  media(f, filename, extra = {}) {
    return `/api/media?t=${signer.sign({ u: f.url, h: this.headersFor(f), f: filename, ...extra })}`;
  }

  thumb(url) {
    if (!url) return null;
    const h = { 'User-Agent': 'Mozilla/5.0' };
    try { h.Referer = `https://${new URL(this.pageUrl).hostname}/`; } catch { /* abaikan */ }
    return `/api/media?t=${signer.sign({ u: url, h, ct: 'image/jpeg' }, 24 * 3600)}`;
  }
}

function entryMeta(ctx, info, title) {
  const thumbUrl = info.thumbnail || [...(info.thumbnails || [])].reverse().find((t) => t.url)?.url;
  return {
    id: info.id,
    title,
    uploader: info.uploader || info.channel || info.uploader_id || null,
    duration: info.duration || null,
    thumbnail: ctx.thumb(thumbUrl),
    webpage_url: info.webpage_url || ctx.pageUrl,
    extractor: info.extractor_key || info.extractor || null,
    is_live: !!info.is_live,
    video: [],
    audio: [],
  };
}

// ---------------------------------------------------------------------------
// Satu entri video/audio
// ---------------------------------------------------------------------------
function buildEntry(ctx, info) {
  const title = info.title || info.id || 'video';
  const raw = info.formats || (info.url ? [info] : []);
  const formats = raw.filter(usable);

  let videos = formats.filter(hasVideo);
  const audios = formats.filter((f) => !hasVideo(f) && hasAudio(f));
  if (videos.some((f) => !watermarked(f))) videos = videos.filter((f) => !watermarked(f));

  const audioKey = (f) => [proto(f) === 'direct' ? 1 : 0, audioExt(f) === 'm4a' ? 1 : 0, num(f.abr || f.tbr)];
  let bestAudio = audios.length ? maxBy(audios, audioKey) : null;
  const muxed = videos.filter(hasAudio);

  // TikTok/Douyin: format audio-only = musik latar, bukan suara video asli
  let musicTrack = null;
  if (bestAudio && muxed.length && ['audio', 'music'].includes(bestAudio.format_id)) {
    musicTrack = bestAudio; bestAudio = null;
  }
  if (!bestAudio && muxed.length) videos = muxed; // buang video bisu bila ada versi bersuara
  if (bestAudio && String(info.extractor_key || '').toLowerCase().includes('youtube')) {
    videos = videos.filter((f) => !hasAudio(f)).length ? videos.filter((f) => !hasAudio(f)) : videos;
  }

  // ---- video per resolusi ----
  const buckets = new Map();
  for (const f of videos) {
    const q = shortSide(f);
    if (!buckets.has(q)) buckets.set(q, []);
    buckets.get(q).push(f);
  }
  const vkey = (f) => [
    proto(f) === 'direct' && (hasAudio(f) || bestAudio) ? 1 : 0,
    hasAudio(f) ? 1 : 0, vcodecScore(f), num(f.fps), num(f.tbr), num(sizeOf(f)),
  ];

  const videoOptions = [];
  for (const q of [...buckets.keys()].sort((a, b) => b - a)) {
    const f = maxBy(buckets.get(q), vkey);
    const isMuxed = hasAudio(f);
    let rawLabel = qualityLabel(q);
    if (f.fps && f.fps > 30) rawLabel += String(Math.trunc(f.fps));
    const tier = qualityTier(q);
    const label = q && tier !== 'auto' ? `${cap(tier)} · ${rawLabel}` : rawLabel;
    const needAudio = !isMuxed && !!bestAudio;

    let ext;
    if (needAudio) {
      const aExt = audioExt(bestAudio); const vExt = f.ext || 'mp4';
      ext = ['mp4', 'm4v'].includes(vExt) && aExt === 'm4a' ? 'mp4' : vExt === 'webm' && aExt === 'webm' ? 'webm' : 'mkv';
    } else {
      ext = !f.ext || ['mp4', 'm4v', 'unknown_video'].includes(f.ext) || proto(f) === 'hls' ? 'mp4' : f.ext;
    }
    const tag = rawLabel !== 'Video' ? rawLabel : (tier !== 'auto' ? tier : 'video');
    const filename = brandedName(info, title, ctx.pageUrl, tag, ext);

    // selector utama + cadangan berdasar tinggi (format id YouTube bisa berubah antar-request)
    const h = q > 0 && q !== 719 && q !== 359 ? q : 0;
    const hls = proto(f) === 'hls';
    const sel = needAudio
      ? `${f.format_id}+${bestAudio.format_id}${h ? `/bv*[height<=${h}]+ba/b[height<=${h}]` : '/b'}`
      : `${f.format_id}${h ? `/b[height<=${h}]` : ''}/b`;
    const mode = needAudio || hls ? 'file' : 'stream';
    const size = (sizeOf(f) || 0) + (needAudio ? sizeOf(bestAudio) || 0 : 0) || null;

    videoOptions.push({
      id: `v${q}-${f.format_id}`, label, tier, quality: q, ext, codec: vcodecLabel(f), size,
      no_audio: !isMuxed && !bestAudio && f.acodec === 'none',
      mode: needAudio ? 'merge' : hls ? 'hls' : 'direct',
      filename,
      url: ctx.dl({ sel, m: mode, f: filename, mg: needAudio || hls ? ext : null }),
    });
  }
  videoOptions.length = Math.min(videoOptions.length, 8);

  // ---- audio ----
  const audioOptions = [];
  let mp3Src = bestAudio;
  if (!mp3Src && muxed.length) {
    mp3Src = [...muxed].sort((a, b) => (proto(a) !== 'direct') - (proto(b) !== 'direct') ||
      (shortSide(a) || 9999) - (shortSide(b) || 9999) || num(sizeOf(a)) - num(sizeOf(b)))[0];
  }
  if (mp3Src) {
    for (const kbps of [320, 192, 128]) {
      const filename = brandedName(info, title, ctx.pageUrl, `mp3-${kbps}`, 'mp3');
      audioOptions.push({
        id: `mp3-${kbps}`, label: `MP3 ${kbps} kbps`, kind: 'mp3', bitrate: kbps, ext: 'mp3', mode: 'mp3', filename,
        size: Math.trunc(num(info.duration) * kbps * 125) || null,
        url: ctx.dl({ sel: String(mp3Src.format_id), m: 'file', f: filename, mp3: kbps }),
      });
    }
  }
  if (bestAudio) {
    const aExt = audioExt(bestAudio);
    const abr = Math.trunc(num(bestAudio.abr || bestAudio.tbr));
    const filename = brandedName(info, title, ctx.pageUrl, 'asli', aExt);
    audioOptions.push({
      id: 'orig', label: `${aExt.toUpperCase()} asli${abr ? ` ${abr} kbps` : ''}`, kind: 'original', ext: aExt,
      mode: proto(bestAudio) === 'hls' ? 'hls' : 'direct', size: sizeOf(bestAudio), filename,
      url: ctx.dl({ sel: String(bestAudio.format_id), m: proto(bestAudio) === 'hls' ? 'file' : 'stream', f: filename }),
    });
  }
  if (musicTrack) {
    const aExt = audioExt(musicTrack);
    const filename = brandedName(info, title, ctx.pageUrl, 'musik', aExt);
    audioOptions.push({
      id: 'music', label: `Musik latar (${aExt.toUpperCase()})`, kind: 'original', ext: aExt,
      mode: 'direct', size: sizeOf(musicTrack), filename,
      url: ctx.media(musicTrack, filename),
    });
  }

  const entry = entryMeta(ctx, info, title);
  entry.video = videoOptions;
  entry.audio = audioOptions;
  entry.media_kind = videoOptions.length ? 'video' : audioOptions.length ? 'audio' : 'other';
  return entry;
}

// ---------------------------------------------------------------------------
// Galeri foto / carousel / Live Photo
// ---------------------------------------------------------------------------
const isGalleryItem = (e) => !!(e.xy_image || e.xy_live);

function galleryItem(ctx, e, idx, base, total) {
  const fmts = (e.formats || []).filter((f) => f.url);
  const thumbUrl = e.thumbnail || [...(e.thumbnails || [])].reverse().find((t) => t.url)?.url;
  const tag = (s) => (total > 1 ? `p${String(idx).padStart(2, '0')}${s}` : s.replace(/^-/, '') || 'img');
  const item = { index: idx, id: e.id, title: e.title, thumb: null, width: null, height: null, duration: e.duration || null };

  if (isGalleryItem(e)) {
    const img = fmts.find((f) => f.format_id === 'image') || fmts[0];
    if (!img) return null;
    const ext = String(img.ext || 'jpg').toLowerCase();
    const fn = brandedName(e, e.title || base, ctx.pageUrl, total > 1 ? tag('') : 'img', ext);
    Object.assign(item, { type: 'image', width: img.width, height: img.height, thumb: ctx.thumb(thumbUrl || img.url) });
    item.image = { url: ctx.media(img, fn), ext, filename: fn, size: sizeOf(img) };
    const live = e.xy_live ? fmts.find((f) => f.format_id === 'live') : null;
    if (live) {
      const vExt = String(live.ext || 'mp4').toLowerCase();
      const vfn = brandedName(e, e.title || base, ctx.pageUrl, total > 1 ? tag('-live') : 'live', vExt);
      item.type = 'live';
      item.video = { url: ctx.media(live, vfn), ext: vExt, filename: vfn, size: sizeOf(live) };
    }
    return item;
  }
  // video di dalam carousel (hanya sumber langsung)
  const cands = fmts.filter((f) => usable(f) && hasVideo(f) && hasAudio(f) && !watermarked(f) && proto(f) === 'direct');
  if (!cands.length) return null;
  const best = maxBy(cands, (f) => [shortSide(f) <= 1080 ? 1 : 0, shortSide(f) <= 1080 ? shortSide(f) : -shortSide(f), vcodecScore(f), num(f.tbr)]);
  const vExt = !best.ext || ['mp4', 'm4v', 'unknown_video'].includes(best.ext) ? 'mp4' : best.ext;
  const fn = brandedName(e, e.title || base, ctx.pageUrl, total > 1 ? tag('') : 'vid', vExt);
  Object.assign(item, { type: 'video', width: best.width, height: best.height, thumb: ctx.thumb(thumbUrl) });
  item.video = { url: ctx.media(best, fn), ext: vExt, filename: fn, size: sizeOf(best) };
  return item;
}

function buildGallery(ctx, info, rawEntries) {
  const title = info.title || rawEntries[0]?.title || 'galeri';
  const base = safeFilename(title);
  const list = rawEntries.slice(0, MAX_GALLERY);
  const items = list.map((e, i) => galleryItem(ctx, e, i + 1, base, list.length)).filter(Boolean);
  const entry = entryMeta(ctx, info, title);
  entry.media_kind = 'gallery';
  entry.gallery = items;
  if (!entry.thumbnail && items[0]) entry.thumbnail = items[0].thumb;
  return entry;
}

// ---------------------------------------------------------------------------
// Menjalankan yt-dlp
// ---------------------------------------------------------------------------
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
const isYoutube = (u) => /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(hostOf(u));
const PROXY_DOMAINS = ['youtube.com', 'youtu.be', 'bilibili.com', 'b23.tv', 'douyin.com', 'reddit.com', 'redd.it'];
const inProxyScope = (u) => PROXY_DOMAINS.some((d) => hostOf(u) === d || hostOf(u).endsWith(`.${d}`));

function baseArgs(url) {
  const args = ['--ignore-config', '--no-warnings', '--no-playlist', '--socket-timeout', '20', '--retries', '2'];
  if (fs.existsSync(path.join(PLUGIN_DIR, 'yt_dlp_plugins'))) args.push('--plugin-dirs', PLUGIN_DIR);
  if (cfg.extractProxy && inProxyScope(url)) args.push('--proxy', cfg.extractProxy);
<<<<<<< HEAD
  if (cfg.serverless) args.push('--cache-dir', path.join(require('node:os').tmpdir(), 'yt-dlp-cache'));
=======
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
  if (isYoutube(url)) args.push('--js-runtimes', `node:${process.execPath}`);
  return args;
}

/** Variasi percobaan: X/Twitter -> syndication dulu, graphql cadangan. */
function attempts(url) {
  if (/(^|\.)(twitter\.com|x\.com)$/.test(hostOf(url))) {
    return [['--extractor-args', 'twitter:api=syndication'], ['--extractor-args', 'twitter:api=graphql']];
  }
  return [[]];
}

function runYtdlp(args, { timeout = cfg.extractTimeoutMs, maxBuffer = 64 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
<<<<<<< HEAD
    const child = spawn(cfg.ytdlp, args, { stdio: ['ignore', 'pipe', 'pipe'], env: cfg.childEnv() });
=======
    const child = spawn(cfg.ytdlp, args, { stdio: ['ignore', 'pipe', 'pipe'] });
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
    const out = []; let outLen = 0; let err = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); err += '\ntimed out'; }, timeout);
    child.stdout.on('data', (d) => { outLen += d.length; if (outLen > maxBuffer) child.kill('SIGKILL'); else out.push(d); });
    child.stderr.on('data', (d) => { if (err.length < 8000) err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout: Buffer.concat(out).toString(), stderr: err }); });
  });
}

const cache = new Map();
const CACHE_TTL = 300000;

async function extract(text) {
  const url = sec.findUrl(text);
  if (!url) throw new XyError('invalid', 'Tidak ada link yang valid. Paste link video/postingan (awali dengan https://).', null, 400);
  if (url.length > 2048) throw new XyError('invalid', 'Link terlalu panjang.', null, 400);

  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.v;

  const platform = detectPlatform(url);
  const ok = platform ? await sec.isPublicUrl(url) : await sec.guardPublicHops(url);
  if (!ok) throw new XyError('invalid', 'Link tidak diizinkan.', null, 400);

  const t0 = Date.now();
  let info = null; let lastErr = '';
  const tries = attempts(url);
  for (let i = 0; i < tries.length && !info; i++) {
    let res;
    try {
      res = await runYtdlp([...baseArgs(url), ...tries[i], '--playlist-end', String(cfg.maxEntries), '-J', '--', url]);
    } catch (e) {
      if (e.code === 'ENOENT') throw new XyError('config', `yt-dlp tidak ditemukan (${cfg.ytdlp}). Pasang yt-dlp dulu — lihat README.`, null, 500);
      throw new XyError('error', 'Gagal menjalankan engine.', String(e.message).slice(0, 200), 500);
    }
    if (res.code === 0 && res.stdout.trim()) {
      try { info = JSON.parse(res.stdout); } catch { lastErr = 'respons engine rusak'; }
    } else {
      lastErr = cleanError(res.stderr || 'gagal');
      const [code] = friendlyError(lastErr);
      if (!['blocked', 'timeout', 'error'].includes(code)) break;
    }
  }
  if (!info) {
    const [code, msg] = friendlyError(lastErr);
    throw new XyError(code, msg, lastErr);
  }

  const pageUrl = info.webpage_url || url;
  const ctx = new Ctx(info, pageUrl);
  const isPlaylist = info._type === 'playlist' || Array.isArray(info.entries);
  const rawAll = isPlaylist ? (info.entries || []).filter(Boolean) : [info];

  let entries; let title;
  if (info.xy_gallery || rawAll.some(isGalleryItem)) {
    entries = [buildGallery(ctx, info, rawAll)]; title = entries[0].title;
  } else if (isPlaylist) {
    entries = rawAll.slice(0, cfg.maxEntries).map((e) => buildEntry(new Ctx(e, e.webpage_url || pageUrl), e));
    title = info.title;
  } else {
    entries = [buildEntry(ctx, info)]; title = entries[0].title;
  }
  entries = entries.filter((e) => e.video.length || e.audio.length || e.gallery?.length);
  if (!entries.length) throw new XyError('novideo', 'Tidak ada video/foto/audio yang bisa diunduh di link ini.');

  const plat = platform || (() => {
    const ex = entries[0].extractor || 'Web';
    return { id: ex.toLowerCase(), name: ex, region: 'global', color: '#6366F1' };
  })();
  const total = isPlaylist ? Number(info.playlist_count) || rawAll.length : 1;
  const result = {
    ok: true, url,
    platform: { id: plat.id, name: plat.name, region: plat.region, color: plat.color, logo: plat.logo || null },
    title, count: entries.length, total, truncated: total > entries.length, entries,
    took_ms: Date.now() - t0,
  };
  if (cache.size > 200) cache.clear();
  cache.set(url, { t: Date.now(), v: result });
  return result;
}

async function health() {
  let ytdlp = null;
  try { const r = await runYtdlp(['--version'], { timeout: 8000 }); if (r.code === 0) ytdlp = r.stdout.trim(); } catch { /* tidak ada */ }
  return {
    ok: true, service: cfg.APP_NAME, version: cfg.VERSION, developer: cfg.DEVELOPER,
    yt_dlp: ytdlp, node: process.version, plugins: fs.existsSync(path.join(PLUGIN_DIR, 'yt_dlp_plugins')),
  };
}

module.exports = {
  XyError, extract, health, friendlyError, cleanError, runYtdlp, baseArgs,
  // diekspor untuk tes
  _t: { buildEntry, buildGallery, Ctx, brandedName, safeFilename, qualityTier, shortSide, usable },
};
