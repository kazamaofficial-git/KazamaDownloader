'use strict';
// Pasang yt-dlp (pip) dan cek FFmpeg.
//   npm run setup            -> pasang/perbarui yt-dlp (paksa)
//   node scripts/setup.js --if-missing   -> dipakai `npm start`: hanya memasang bila belum ada, tidak pernah menggagalkan start
const { spawnSync } = require('node:child_process');
try { require('dotenv').config(); } catch { /* dotenv opsional */ }

const ifMissing = process.argv.includes('--if-missing');
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit' });
const has = (cmd, args = ['--version']) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
const fail = (msg) => { console.error(msg); process.exit(ifMissing ? 0 : 1); }; // saat start: jangan blokir server

function checkFfmpeg() {
  if (!has(FFMPEG, ['-version'])) {
    console.warn('[setup] ffmpeg belum ada — MP3 & video gabungan tidak akan jalan. Pasang: sudo apt install ffmpeg (Windows: winget install ffmpeg)');
  } else if (!ifMissing) console.log('ffmpeg OK');
}

if (ifMissing && has(YTDLP)) { checkFfmpeg(); process.exit(0); }

console.log(ifMissing ? '[setup] yt-dlp belum terpasang, memasang otomatis…' : '== yt-dlp (butuh Python 3.9+ dan pip)');
const py = ['python3', 'python'].find((p) => has(p));
if (!py) fail('[setup] Python tidak ditemukan. Pasang dulu: sudo apt install python3 python3-pip (Windows: python.org)');

const pkg = 'yt-dlp[default,curl-cffi]';
let r = run(py, ['-m', 'pip', 'install', '-U', pkg]);
if (r.status !== 0) {
  console.log('[setup] pip biasa gagal, mencoba --user --break-system-packages …');
  r = run(py, ['-m', 'pip', 'install', '-U', '--user', '--break-system-packages', pkg]);
}
if (r.status !== 0) fail(`[setup] Pemasangan yt-dlp gagal. Coba manual: pip install -U "${pkg}"`);

console.log(has(YTDLP)
  ? '[setup] yt-dlp OK'
  : '[setup] yt-dlp terpasang tetapi belum ada di PATH. Tambahkan ~/.local/bin ke PATH atau isi YTDLP_PATH di .env.');
checkFfmpeg();
