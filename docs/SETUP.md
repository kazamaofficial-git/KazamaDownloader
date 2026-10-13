# Menjalankan website (lokal)

## Kebutuhan

| Kebutuhan | Keterangan |
|---|---|
| Node.js ≥ 20 | menjalankan website |
| Python 3.9+ dan pip | hanya untuk memasang yt-dlp (di Vercel tidak perlu, lihat [DEPLOY.md](DEPLOY.md)) |
| yt-dlp | dipasang otomatis oleh `npm start` bila belum ada |
| FFmpeg | menggabung video + audio, HLS, dan MP3 (`sudo apt install ffmpeg` / `winget install ffmpeg`) |

yt-dlp dan FFmpeg bukan paket npm, keduanya program terpisah.

## Langkah

```bash
git clone https://github.com/kazamaofficial-git/KazamaDownloader.git
cd KazamaDownloader
npm install
npm start          # memasang yt-dlp bila belum ada, lalu jalan di http://localhost:3000
```

Mode pengembangan (restart otomatis saat file berubah): `npm run dev`.

## Konfigurasi

Konfigurasi dibaca dari environment variable. Untuk pemakaian lokal, buat file **`.env`** di folder proyek (file ini sudah ada di `.gitignore`, **jangan di-commit**):

```ini
PORT=3000
SIGNING_KEY=isi-dengan-string-acak-panjang
```

Buat `SIGNING_KEY` dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variabel | Default | Fungsi |
|---|---|---|
| `PORT` | `3000` | port server |
| `NODE_ENV` | — | `production` mewajibkan `SIGNING_KEY` dan mengaktifkan HSTS (otomatis aktif di Vercel) |
| `SIGNING_KEY` | acak saat start (hanya dev) | kunci penandatangan link unduhan. Jika berubah, link lama tidak berlaku |
| `TRUST_PROXY` | `0` | isi `1` bila di belakang Nginx/Cloudflare agar IP pengguna terbaca benar (otomatis di Vercel) |
| `YTDLP_PATH` | `yt-dlp` / `bin/yt-dlp` | lokasi yt-dlp |
| `FFMPEG_PATH` | `ffmpeg` | lokasi ffmpeg |
| `RATE_LIMIT` | `25` | permintaan `/api/extract` per menit per IP |
| `MAX_JOBS` | `3` | proses unduhan yt-dlp yang berjalan bersamaan |
| `EXTRACT_TIMEOUT_MS` | `60000` | batas waktu membaca satu link |
| `EXTRACT_PROXY` | kosong | proxy untuk situs yang memblokir IP datacenter (YouTube, Bilibili, Douyin, Reddit) |
| `GITHUB_TOKEN` | kosong | token GitHub opsional (tanpa scope) untuk tombol Unduh APK, menaikkan batas API |

## Skrip npm

| Perintah | Fungsi |
|---|---|
| `npm start` | pasang yt-dlp bila belum ada, lalu jalankan server |
| `npm run dev` | sama, dengan restart otomatis |
| `npm run start:only` | jalankan server tanpa pengecekan yt-dlp |
| `npm run setup` | pasang/perbarui yt-dlp secara manual |
| `npm test` | tes unit |

## Struktur proyek

```
server.js                Express + Helmet (CSP) + EJS
api/index.js             entry Vercel Serverless Function
vercel.json              konfigurasi Vercel
src/                     config, engine (yt-dlp), downloader, security, signer, binaries, releases, routes
views/                   template EJS (beranda, iOS, lisensi, 404)
public/                  CSS, JS, logo platform, PWA (manifest + service worker)
plugins/                 plugin extractor yt-dlp (dipakai web dan Android)
android/                 aplikasi Android (Kotlin + Compose)
ios/                     aplikasi iOS (SwiftUI + XcodeGen)
licenses/                components.json + teks lisensi
scripts/                 setup, vercel-prepare, sync_android, gen_notices, make_banner
.github/                 workflow Actions dan skrip bantu
tests/                   tes unit (node:test)
```

Menambah/mengubah platform: edit `src/platforms.json` (dan logo di `public/logos/`), lalu jalankan `python3 scripts/sync_android.py` agar aplikasi Android ikut diperbarui. Setelah mengubah `licenses/components.json`, jalankan `python3 scripts/gen_notices.py`.
