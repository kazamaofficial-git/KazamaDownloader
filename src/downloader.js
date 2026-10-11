'use strict';
// Penyaji unduhan: /api/download (yt-dlp) dan /api/media (proxy media bertanda tangan)
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const cfg = require('./config');
const sec = require('./security');
const { baseArgs, friendlyError, cleanError } = require('./engine');

const MIME = {
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mov: 'video/quicktime',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', opus: 'audio/ogg', ogg: 'audio/ogg', wav: 'audio/wav',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  avif: 'image/avif', heic: 'image/heic', zip: 'application/zip',
};
const mimeOf = (name) => MIME[path.extname(name || '').slice(1).toLowerCase()] || 'application/octet-stream';

function contentDisposition(filename) {
  const ascii = (filename.replace(/[^\x20-\x7e]/g, '') || 'download').replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

const fail = (res, status, code, error, extra = {}) => {
  if (res.headersSent) return res.destroy();
  res.status(status).set('Cache-Control', 'no-store').json({ ok: false, code, error, ...extra });
};

function ytArgs(p) {
  const args = [...baseArgs(p.s), '-f', p.sel, '--no-part', '--no-mtime', '--concurrent-fragments', '4'];
  if (cfg.ffmpeg !== 'ffmpeg') args.push('--ffmpeg-location', cfg.ffmpeg);
  return args;
}

/** Pipe langsung stdout yt-dlp -> respons (video/audio langsung tanpa merge). */
function streamJob(p, req, res, dl) {
  const child = spawn(cfg.ytdlp, [...ytArgs(p), '--quiet', '-o', '-', '--', p.s], { stdio: ['ignore', 'pipe', 'pipe'] });
  let started = false; let err = '';
  const done = () => sec.releaseJob();
  child.stderr.on('data', (d) => { if (err.length < 4000) err += d; });
  child.stdout.on('data', (chunk) => {
    if (!started) {
      started = true;
      res.status(200).set({
        'Content-Type': mimeOf(p.f), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        ...(dl ? { 'Content-Disposition': contentDisposition(p.f) } : {}),
      });
    }
    if (!res.write(chunk)) { child.stdout.pause(); res.once('drain', () => child.stdout.resume()); }
  });
  child.on('error', () => { done(); fail(res, 500, 'config', 'yt-dlp tidak ditemukan di server.'); });
  child.on('close', (code) => {
    done();
    if (started) return res.end();
    const raw = cleanError(err);
    const [c, msg] = friendlyError(raw);
    fail(res, 502, c, msg, { detail: raw });
  });
  res.on('close', () => { if (!child.killed && child.exitCode === null) child.kill('SIGKILL'); });
}

/** Unduh ke folder sementara (merge / HLS / MP3), kirim, lalu hapus. */
function fileJob(p, req, res, dl) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdl-'));
  const args = [...ytArgs(p), '--quiet', '-o', path.join(dir, 'out.%(ext)s')];
  if (p.mp3) args.push('-x', '--audio-format', 'mp3', '--audio-quality', `${p.mp3}K`);
  else if (p.mg) args.push('--merge-output-format', p.mg);
  args.push('--', p.s);

  const child = spawn(cfg.ytdlp, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = ''; let cleaned = false;
  const cleanup = () => {
    if (cleaned) return; cleaned = true;
    sec.releaseJob();
    fs.rm(dir, { recursive: true, force: true }, () => {});
  };
  const timer = setTimeout(() => child.kill('SIGKILL'), 10 * 60 * 1000);
  child.stderr.on('data', (d) => { if (err.length < 4000) err += d; });
  child.on('error', () => { clearTimeout(timer); cleanup(); fail(res, 500, 'config', 'yt-dlp tidak ditemukan di server.'); });
  child.on('close', (code) => {
    clearTimeout(timer);
    const file = fs.readdirSync(dir).find((n) => !/\.(part|ytdl|temp)$/i.test(n) && !/^out\.f\d+/.test(n));
    if (code !== 0 || !file) {
      cleanup();
      const raw = cleanError(err);
      const [c, msg] = friendlyError(raw);
      return fail(res, 502, c, msg, { detail: raw || 'tidak ada file hasil' });
    }
    const full = path.join(dir, file);
    const size = fs.statSync(full).size;
    res.status(200).set({
      'Content-Type': mimeOf(p.f), 'Content-Length': size, 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(dl ? { 'Content-Disposition': contentDisposition(p.f) } : {}),
    });
    const rs = fs.createReadStream(full);
    rs.pipe(res);
    res.on('close', () => { rs.destroy(); cleanup(); });
  });
  res.on('close', () => { if (child.exitCode === null) { child.kill('SIGKILL'); } });
}

function handleDownload(p, req, res) {
  if (!p.s || !p.sel) return fail(res, 400, 'token', 'Token unduhan tidak lengkap.');
  if (!sec.acquireJob()) {
    res.set('Retry-After', '10');
    return fail(res, 503, 'busy', 'Server sedang sibuk memproses unduhan lain. Coba lagi sebentar.');
  }
  const dl = req.query.dl === '1';
  try {
    return p.m === 'stream' ? streamJob(p, req, res, dl) : fileJob(p, req, res, dl);
  } catch (e) {
    sec.releaseJob();
    return fail(res, 500, 'internal', 'Gagal memulai unduhan.');
  }
}

/** Proxy media dengan header sumber (thumbnail, foto galeri, video langsung). */
async function handleMedia(p, req, res) {
  let url = p.u;
  const headers = { ...(p.h || {}), 'Accept-Encoding': 'identity' };
  if (req.headers.range) headers.Range = req.headers.range;
  const ac = new AbortController();
  res.on('close', () => ac.abort());
  try {
    let up;
    for (let hop = 0; hop < 5; hop++) {
      if (!(await sec.isPublicUrl(url))) return fail(res, 400, 'invalid', 'Link tidak diizinkan.');
      up = await fetch(url, { headers, redirect: 'manual', signal: ac.signal });
      const loc = up.headers.get('location');
      if (up.status >= 300 && up.status < 400 && loc) { url = new URL(loc, url).toString(); up.body?.cancel().catch(() => {}); continue; }
      break;
    }
    if (!up || (up.status >= 300 && up.status < 400)) return fail(res, 502, 'error', 'Terlalu banyak redirect.');
    if (!up.ok && up.status !== 206) return fail(res, 502, 'blocked', `Sumber menolak permintaan (${up.status}).`);
    const out = {
      'Content-Type': p.ct || up.headers.get('content-type') || mimeOf(p.f),
      'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff',
    };
    for (const k of ['content-length', 'content-range']) { const v = up.headers.get(k); if (v) out[k] = v; }
    if (req.query.dl === '1' && p.f) out['Content-Disposition'] = contentDisposition(p.f);
    res.status(up.status).set(out);
    if (req.method === 'HEAD' || !up.body) return res.end();
    Readable.fromWeb(up.body).on('error', () => res.destroy()).pipe(res);
  } catch (e) {
    if (e.name === 'AbortError') return;
    fail(res, 502, 'error', 'Gagal mengambil media.');
  }
}

module.exports = { handleDownload, handleMedia, mimeOf, contentDisposition };
