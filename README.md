<div align="center">

# DownloadIn (KazamaDownloader)

**Satu link, semua platform.** Download video tanpa watermark, MP3, foto slide, dan Live Photo dari TikTok, Instagram, YouTube, X, Bilibili, pixiv, dan 1.700+ situs lain.

[![Build APK](https://github.com/kazamaofficial/KazamaDownloader/actions/workflows/android.yml/badge.svg)](https://github.com/kazamaofficial/KazamaDownloader/actions/workflows/android.yml)
[![Web CI](https://github.com/kazamaofficial/KazamaDownloader/actions/workflows/ci.yml/badge.svg)](https://github.com/kazamaofficial/KazamaDownloader/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/kazamaofficial/KazamaDownloader?label=APK&color=7B5CFF)](https://github.com/kazamaofficial/KazamaDownloader/releases/latest)
[![Lisensi](https://img.shields.io/badge/lisensi-GPL--3.0--or--later-blue)](LICENSE)

Dibuat oleh **KazamaTech** · Developer: **KazamaDev**

[Unduh APK](https://github.com/kazamaofficial/KazamaDownloader/releases/latest) · [Changelog](CHANGELOG.md) · [Donasi](#donasi)

</div>

---

## Isi

- [Fitur](#fitur)
- [Unduh aplikasi Android](#unduh-aplikasi-android)
- [Menjalankan website](#menjalankan-website)
- [Konfigurasi (.env)](#konfigurasi-env)
- [Deploy ke production](#deploy-ke-production)
- [API](#api)
- [Build & rilis Android lewat GitHub Actions](#build--rilis-android-lewat-github-actions)
- [Alur rilis & changelog](#alur-rilis--changelog)
- [Struktur proyek](#struktur-proyek)
- [Keamanan & privasi](#keamanan--privasi)
- [Troubleshooting](#troubleshooting)
- [Donasi](#donasi)
- [Lisensi & kredit](#lisensi--kredit)

## Fitur

**Hasil unduhan**
- Video per resolusi (dari hemat sampai maksimal), codec dan perkiraan ukuran ditampilkan.
- Audio: MP3 128 / 192 / 320 kbps, audio asli (M4A/WebM), dan musik latar untuk TikTok/Douyin.
- Foto slide, carousel, dan Live Photo (foto + video) dalam galeri; unduh satu per satu atau semua sekaligus.
- Video tanpa watermark bila platform menyediakannya.
- Nama file rapi: `DownloadIn-<judul>-<id>[-kualitas].<ext>`.
- Playlist/album: sampai 12 item per link.

**Website (Node.js + Express + EJS)**
- Tampilan **Neo-Brutalism**: garis tebal, bayangan keras, tombol yang "tertekan", responsif sampai layar HP kecil.
- Tempel link atau seluruh teks *share* (link diambil otomatis); tombol Tempel dari clipboard.
- Deteksi platform otomatis, riwayat 20 link terakhir (disimpan di browser, bukan di server).
- Penggabungan video + audio dan pembuatan MP3 dilakukan server dengan FFmpeg; file sementara dihapus otomatis.
- Link unduhan bertanda tangan HMAC (berlaku 6 jam), anti-SSRF, rate limit, pemblokir bot, CSP ketat.
- Halaman Android, Donasi (QRIS), FAQ, dan Lisensi.

**Aplikasi Android (Kotlin + Jetpack Compose)**
- yt-dlp, Python, dan FFmpeg minimal berjalan **di dalam aplikasi**; tidak butuh server.
- Menu *Bagikan* dari TikTok/Instagram/YouTube langsung ke DownloadIn.
- Pratinjau video sebelum diunduh, galeri foto dengan viewer, riwayat unduhan, notifikasi progres.
- File tersimpan di `Download/DownloadIn`.
- Pembaruan aplikasi otomatis dari GitHub Releases; yt-dlp diperbarui sendiri maksimal sekali sehari.
- Tanpa iklan, tanpa analitik, tanpa push notification pihak ketiga.
- Halaman Tentang berisi donasi QRIS dan daftar lisensi.

## Unduh aplikasi Android

1. Buka [halaman Releases](https://github.com/kazamaofficial/KazamaDownloader/releases/latest).
2. Pilih APK sesuai HP-mu. Kebanyakan HP modern memakai **`arm64-v8a`**; HP lama (32-bit) memakai `armeabi-v7a`; emulator memakai `x86_64`.
3. Ketuk file APK, izinkan *Instal aplikasi tidak dikenal* bila diminta, lalu pasang.

Persyaratan: Android 7.0 (API 24) ke atas. Aplikasi memberi tahu bila ada versi baru dan bisa memasangnya sendiri.

## Menjalankan website

### Kebutuhan

| Kebutuhan | Keterangan |
|---|---|
| Node.js ≥ 20 | menjalankan website |
| yt-dlp | `pip install -U "yt-dlp[default,curl-cffi]"` — pakai **pip** (bukan binary tunggal) supaya plugin di `plugins/` terbaca |
| FFmpeg | menggabung video + audio, HLS, dan MP3 (`sudo apt install ffmpeg`) |

> yt-dlp dan FFmpeg **bukan paket npm** — keduanya program terpisah, jadi `npm install` tidak memasangnya. Jalankan `npm run setup` (memasang yt-dlp lewat pip dan mengecek FFmpeg).

### Langkah

```bash
git clone https://github.com/kazamaofficial/KazamaDownloader.git
cd KazamaDownloader
npm install
npm run setup            # pasang yt-dlp (pip) + cek FFmpeg
cp .env.example .env     # isi SIGNING_KEY (wajib di production)
npm start                # http://localhost:3000
npm test                 # tes unit modul inti
```

Buat `SIGNING_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Konfigurasi (.env)

| Variabel | Default | Fungsi |
|---|---|---|
| `PORT` | `3000` | port server |
| `NODE_ENV` | — | isi `production` untuk deploy (mewajibkan `SIGNING_KEY`, mengaktifkan HSTS) |
| `SIGNING_KEY` | acak saat start (dev) | kunci penandatangan link unduhan. Jika berubah, link lama tidak berlaku |
| `TRUST_PROXY` | `0` | isi `1` bila di belakang Nginx/Cloudflare agar IP pengguna terbaca benar |
| `YTDLP_PATH` | `yt-dlp` | lokasi yt-dlp |
| `FFMPEG_PATH` | `ffmpeg` | lokasi ffmpeg |
| `RATE_LIMIT` | `25` | permintaan `/api/extract` per menit per IP |
| `MAX_JOBS` | `3` | proses unduhan yt-dlp yang berjalan bersamaan |
| `EXTRACT_TIMEOUT_MS` | `60000` | batas waktu membaca satu link |
| `EXTRACT_PROXY` | kosong | proxy untuk situs yang memblokir IP datacenter (YouTube, Bilibili, Douyin, Reddit) |

## Deploy ke production

**PM2**

```bash
npm install -g pm2
NODE_ENV=production pm2 start server.js --name downloadin
pm2 save && pm2 startup
```

**Nginx (reverse proxy)**

```nginx
server {
  server_name contoh.domain.com;
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

Set `TRUST_PROXY=1` di `.env`. Pasang HTTPS (mis. Certbot).

**Perawatan**: perbarui yt-dlp rutin, karena extractor platform sering berubah.

```bash
pip install -U yt-dlp && pm2 restart downloadin
```

## API

| Endpoint | Fungsi |
|---|---|
| `GET /api/health` | status server, versi yt-dlp, dan status plugin |
| `GET /api/platforms` | katalog platform per wilayah |
| `POST /api/extract` `{ "url": "..." }` | info konten + opsi unduhan (link bertanda tangan, berlaku 6 jam) |
| `GET /api/download?t=TOKEN&dl=1` | unduh lewat yt-dlp (stream langsung, atau file sementara untuk merge/HLS/MP3) |
| `GET /api/media?t=TOKEN&dl=1` | proxy thumbnail, foto galeri, dan video langsung |

Kode galat: `invalid`, `unsupported`, `private`, `geo`, `drm`, `blocked`, `notfound`, `novideo`, `timeout`, `rate_limit`, `busy`.
Endpoint `/api/extract` menolak klien tanpa User-Agent browser (curl, python-requests, dll.) dan dibatasi `RATE_LIMIT`.

## Build & rilis Android lewat GitHub Actions

Workflow [`android.yml`](.github/workflows/android.yml) membangun APK dan **mempublikasikannya otomatis** ke GitHub Releases.

| Pemicu | Hasil |
|---|---|
| Pull request / push ke `main` | build APK (artifact) + smoke test di emulator (screenshot sebagai artifact) |
| Push tag `v*` (mis. `v1.0.0`) | semua di atas **+ GitHub Release** berisi APK per arsitektur, `update-banner.webp`, dan catatan rilis dari [`CHANGELOG.md`](CHANGELOG.md) |
| Manual (*Run workflow*) | build APK sebagai artifact |

Hasil rilis: `DownloadIn-<versi>-arm64-v8a.apk`, `-armeabi-v7a.apk`, `-x86_64.apk`.

### Setup sekali: tanda tangan APK

Tanpa keystore, APK ditandatangani *debug key* — cukup untuk uji coba, tetapi **pembaruan akan gagal** bila nanti kamu beralih ke key lain. Buat keystore sebelum rilis publik pertama:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.p12 -alias downloadin \
  -keyalg RSA -keysize 4096 -validity 36500
base64 -w0 release.p12        # salin hasilnya
```

Di GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi |
|---|---|
| `KEYSTORE_BASE64` | hasil `base64` di atas |
| `KEYSTORE_PASSWORD` | password keystore |
| `KEY_ALIAS` | `downloadin` |
| `KEY_PASSWORD` | password key |

> Simpan `release.p12` dan passwordnya di tempat aman. Jangan pernah di-commit. Jika hilang, pemakai harus memasang ulang aplikasi.

Pastikan juga **Settings → Actions → General → Workflow permissions** diset ke *Read and write permissions* agar workflow bisa membuat Release.

### Penomoran versi

| Sumber | `versionName` | `versionCode` |
|---|---|---|
| tag `vA.B.C` | `A.B.C` | `A×1.000.000 + B×1.000 + C×10` |
| branch / PR | `1.0.0-dev.N` | `100 + N` |

### Build lokal (opsional)

Butuh JDK 17, Android SDK 35, dan NDK 27. FFmpeg minimal dibangun lewat `android/ffmpeg/build.sh` (CI sudah mengerjakannya dan meng-cache hasilnya).

```bash
cd android && ./gradlew assembleRelease
```

## Alur rilis & changelog

Setiap perubahan **wajib** dicatat di [`CHANGELOG.md`](CHANGELOG.md) pada bagian `[Belum dirilis]`.

```bash
# 1. ganti "[Belum dirilis]" menjadi "[1.1.0] - 2026-11-01" (dan buat bagian [Belum dirilis] kosong di atasnya)
# 2. perbarui "version" di package.json
# 3. (opsional) buat banner popup pembaruan:
python3 scripts/make_banner.py --title "DownloadIn 1.1.0" --sub "Ringkasan singkat" --out android/release-banner.webp
# 4. commit lalu beri tag
git commit -am "rilis v1.1.0"
git tag v1.1.0
git push origin main v1.1.0
```

Setelah tag didorong, workflow membangun APK dan menerbitkan Release otomatis dengan catatan dari `CHANGELOG.md`. Aplikasi yang sudah terpasang akan menawarkan pembaruan.

## Struktur proyek

```
server.js                Express + Helmet (CSP) + EJS
src/
  config.js              konfigurasi dari .env + tautan publik
  engine.js              yt-dlp → JSON opsi video/audio/galeri
  downloader.js          /api/download (stream/file sementara) dan /api/media
  security.js            anti-SSRF, rate limit, blokir bot, batas job
  signer.js              token HMAC-SHA256
  platforms.js / .json   katalog 48 platform (sumber tunggal web + Android)
  routes/                api.js, pages.js
views/                   index.ejs, licenses.ejs, 404.ejs, partials/
public/                  css/style.css, js/app.js, logos/, img/
plugins/                 plugin extractor yt-dlp (dipakai web dan Android)
android/                 aplikasi Android (Kotlin + Compose), FFmpeg minimal, tools
licenses/                components.json + teks lisensi
scripts/                 sync_android.py, gen_notices.py, make_banner.py
.github/workflows/       android.yml (APK + rilis), ci.yml (tes web)
tests/                   tes unit (node:test)
CHANGELOG.md             riwayat perubahan
```

Menambah/mengubah platform: edit `src/platforms.json` (+ logo di `public/logos/`), lalu jalankan `python3 scripts/sync_android.py` supaya aplikasi Android ikut diperbarui. Setelah mengubah `licenses/components.json`, jalankan `python3 scripts/gen_notices.py`.

## Keamanan & privasi

- **Tidak ada pelacakan.** Website tidak memakai analitik. Aplikasi Android tidak mengirim data pemakaian dan tidak memakai push notification pihak ketiga. Riwayat hanya tersimpan di perangkatmu.
- Link unduhan hanya bisa dibuat server dan kedaluwarsa dalam 6 jam.
- Server menolak alamat internal (localhost, jaringan privat, metadata cloud) termasuk lewat redirect.
- File hasil merge/MP3 hanya ada di folder sementara selama proses, lalu dihapus.
- Hanya konten publik yang bisa diunduh. Konten privat, berbayar, atau berDRM tidak didukung.
- Menemukan celah keamanan? Laporkan lewat [GitHub Issues](https://github.com/kazamaofficial/KazamaDownloader/issues) tanpa menyertakan detail eksploitasi, atau hubungi KazamaTech lewat [situs resmi](https://www.kazamasite.biz.id).

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `yt-dlp tidak ditemukan` | jalankan `npm run setup`; pastikan `yt-dlp` ada di `PATH` (pip `--user` → `~/.local/bin`), atau isi `YTDLP_PATH` |
| MP3 / video gabungan gagal | FFmpeg belum terpasang; isi `FFMPEG_PATH` bila tidak ada di `PATH` |
| YouTube minta "confirm you're not a bot" | IP datacenter diblokir. Isi `EXTRACT_PROXY` atau coba lagi nanti |
| Douyin / Kuaishou / Threads tidak jalan | plugin tidak terbaca: pasang yt-dlp lewat **pip**, bukan binary tunggal |
| `503 busy` | sudah `MAX_JOBS` unduhan berjalan; naikkan sesuai RAM/CPU |
| Link unduhan "kedaluwarsa" | proses ulang linknya; atau `SIGNING_KEY` berubah setelah restart (isi di `.env`) |
| Semua orang kena rate limit | di belakang proxy tapi `TRUST_PROXY` belum `1` |
| Rilis Actions gagal membuat Release | beri *Read and write permissions* pada workflow (lihat di atas) |
| Aplikasi gagal memperbarui diri | APK baru harus ditandatangani key yang sama dengan yang terpasang |

## Donasi

DownloadIn gratis dan tanpa iklan. Kalau terbantu, dukung lewat **QRIS** (semua e-wallet dan m-banking):

<p align="center">
  <a href="https://www.kazamasite.biz.id/images/qris.jpg"><img src="https://www.kazamasite.biz.id/images/qris.jpg" alt="QRIS donasi KazamaTech" width="260"></a>
</p>

Donasi bersifat sukarela dan tidak membuka fitur tambahan. Terima kasih!

## Lisensi & kredit

DownloadIn (KazamaDownloader) © 2026 **KazamaTech** dirilis dengan lisensi **GPL-3.0-or-later** — lihat [`LICENSE`](LICENSE).

Proyek ini adalah turunan dari **XyDownloader / DownloadAja** © 2026 XyVerse (GPL-3.0-or-later). Pemberitahuan hak cipta karya asal dipertahankan sebagaimana dipersyaratkan GPL. Daftar lengkap komponen pihak ketiga dan lisensinya ada di [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), halaman `/lisensi`, dan layar Lisensi di aplikasi.

Logo dan nama platform adalah merek dagang milik pemiliknya masing-masing dan hanya dipakai untuk menunjukkan kompatibilitas. DownloadIn tidak berafiliasi dengan platform mana pun. Gunakan hanya untuk konten milik sendiri atau yang kamu punya izin mengunduhnya.
