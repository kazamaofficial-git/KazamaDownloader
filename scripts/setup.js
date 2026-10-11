'use strict';
// Pasang yt-dlp (pip) dan cek FFmpeg:  npm run setup
const { spawnSync } = require('node:child_process');

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit' });
const has = (cmd, args = ['--version']) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;

console.log('== yt-dlp (butuh Python 3.9+ dan pip)');
const py = ['python3', 'python'].find((p) => has(p));
if (!py) {
  console.error('Python tidak ditemukan. Pasang dulu: sudo apt install python3 python3-pip  (Windows: python.org)');
  process.exit(1);
}
let r = run(py, ['-m', 'pip', 'install', '-U', 'yt-dlp[default,curl-cffi]']);
if (r.status !== 0) {
  console.log('Gagal dengan pip biasa, mencoba --break-system-packages / --user ...');
  r = run(py, ['-m', 'pip', 'install', '-U', '--user', '--break-system-packages', 'yt-dlp[default,curl-cffi]']);
}
if (r.status !== 0) { console.error('Pemasangan yt-dlp gagal. Coba manual: pip install -U "yt-dlp[default,curl-cffi]"'); process.exit(1); }

console.log(has('yt-dlp') ? '\nyt-dlp OK' : '\nyt-dlp terpasang tetapi belum ada di PATH. Tambahkan ~/.local/bin ke PATH atau isi YTDLP_PATH di .env.');

console.log('\n== FFmpeg');
console.log(has('ffmpeg', ['-version']) ? 'ffmpeg OK' : 'ffmpeg belum ada. Pasang: sudo apt install ffmpeg  (Windows: winget install ffmpeg)');
