'use strict';
// Dijalankan Vercel saat build (npm run vercel-build): unduh binary yt-dlp (Linux x64, mandiri — tidak butuh Python)
// ke bin/yt-dlp. Binary ini ikut dibundel ke serverless function lewat vercel.json (includeFiles).
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'bin', 'yt-dlp');
const URL_ = process.env.YTDLP_DOWNLOAD_URL || 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

(async () => {
  if (fs.existsSync(OUT) && fs.statSync(OUT).size > 10e6 && !process.argv.includes('--force')) {
    console.log('[vercel-prepare] bin/yt-dlp sudah ada, dilewati'); return;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  console.log('[vercel-prepare] mengunduh', URL_);
  const res = await fetch(URL_, { redirect: 'follow' });
  if (!res.ok) throw new Error(`unduh yt-dlp gagal: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10e6) throw new Error(`ukuran yt-dlp tidak wajar (${buf.length} byte)`);
  fs.writeFileSync(OUT, buf, { mode: 0o755 });
  console.log(`[vercel-prepare] OK — bin/yt-dlp ${(buf.length / 1e6).toFixed(1)} MB`);
})().catch((e) => { console.error('[vercel-prepare]', e.message); process.exit(1); });
