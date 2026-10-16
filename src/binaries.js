'use strict';
// Menemukan yt-dlp & ffmpeg. Urutan: env -> binary bawaan proyek (bin/yt-dlp, ffmpeg-static) -> PATH.
// Di Vercel /var/task bersifat read-only dan bit executable bisa hilang, jadi binary disalin ke /tmp dulu.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const memo = {};

function materialize(src) {
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) return src;
  const dir = path.join(os.tmpdir(), 'kdl-bin');
  const dest = path.join(dir, `${path.basename(src)}-${fs.statSync(src).size}`);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, 0o755);
  }
  return dest;
}

function ytdlp() {
  if (memo.ytdlp) return memo.ytdlp;
  if (process.env.YTDLP_PATH) return (memo.ytdlp = process.env.YTDLP_PATH);
  const bundled = path.join(ROOT, 'bin', 'yt-dlp');
  memo.ytdlp = fs.existsSync(bundled) ? materialize(bundled) : 'yt-dlp';
  return memo.ytdlp;
}

function ffmpeg() {
  if (memo.ffmpeg) return memo.ffmpeg;
  if (process.env.FFMPEG_PATH) return (memo.ffmpeg = process.env.FFMPEG_PATH);
  try {
    const p = require('ffmpeg-static'); // opsional (optionalDependencies)
    if (p && fs.existsSync(p)) return (memo.ffmpeg = materialize(p));
  } catch { /* tidak terpasang */ }
  return (memo.ffmpeg = 'ffmpeg');
}

/** Env untuk proses anak: HOME harus bisa ditulis (cache yt-dlp) di lingkungan serverless. */
function childEnv() {
  const env = { ...process.env };
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    env.HOME = os.tmpdir();
    env.XDG_CACHE_HOME = path.join(os.tmpdir(), 'cache');
  }
  return env;
}

module.exports = { ytdlp, ffmpeg, childEnv, isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) };
