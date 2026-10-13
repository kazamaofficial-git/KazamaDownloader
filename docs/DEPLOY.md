# Deploy

## Vercel

`vercel.json` mengarahkan semua rute ke `api/index.js` (Express). Saat build, `npm run vercel-build` mengunduh binary **yt-dlp mandiri** (tanpa Python) ke `bin/`, dan FFmpeg dibundel lewat paket `ffmpeg-static`.

1. Import repo di Vercel (Framework Preset: **Other**).
2. Tambah **Environment Variables**: `SIGNING_KEY` (wajib, string acak panjang). Opsional: `GITHUB_TOKEN`, `EXTRACT_PROXY` (lihat [SETUP.md](SETUP.md)).
3. Deploy, lalu hubungkan domain `dlin.kazamasite.biz.id`.
4. Cek `https://<domain>/api/health`: `yt_dlp` harus berisi versi dan `plugins` bernilai `true`. Coba satu link TikTok dan satu link Douyin/Kuaishou (memakai plugin) untuk memastikan plugin termuat.

Batasan Vercel:

| Hal | Dampak |
|---|---|
| `maxDuration` fungsi 60 detik (batas Hobby) | video panjang yang perlu digabung/diubah ke MP3 bisa timeout. Plan Pro/Fluid bisa menaikkannya di `vercel.json` |
| Ukuran fungsi maks. 250 MB | yt-dlp (±40 MB) + FFmpeg (±75 MB) muat; jangan menambah dependensi besar |
| Disk hanya `/tmp` (512 MB) | file merge/MP3 sementara harus muat di sini |
| Memori & rate limit per instance | rate limit tersimpan di memori tiap instance, jadi bersifat perkiraan |
| Lalu lintas unduhan lewat fungsi | memakai kuota bandwidth/durasi Vercel; pantau pemakaianmu |

Kalau trafik unduhan besar, VPS biasanya lebih murah dan tanpa batas waktu.

## VPS (PM2 + Nginx)

```bash
npm install -g pm2
NODE_ENV=production pm2 start npm --name downloadin -- start   # `npm start` ikut memasang yt-dlp bila belum ada
pm2 save && pm2 startup
```

Buat file `.env` dengan `SIGNING_KEY` dan `TRUST_PROXY=1` (lihat [SETUP.md](SETUP.md)).

Nginx (reverse proxy):

```nginx
server {
  server_name dlin.kazamasite.biz.id;
  client_max_body_size 1m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;        # unduhan streaming
    proxy_read_timeout 600s;    # proses merge/MP3 butuh waktu
  }
}
```

Pasang HTTPS (mis. Certbot). Perbarui yt-dlp rutin karena extractor platform sering berubah:

```bash
npm run setup && pm2 restart downloadin
```
