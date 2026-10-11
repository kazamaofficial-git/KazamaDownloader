# Changelog

Semua perubahan penting pada DownloadIn (KazamaDownloader) dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan versi mengikuti [SemVer](https://semver.org/lang/id/).

> **Cara menambah catatan:** setiap ada perubahan, tulis di bagian `[Belum dirilis]`. Saat merilis, ganti judulnya
> menjadi `[X.Y.Z] - TANGGAL`, lalu buat tag `vX.Y.Z`. Workflow GitHub Actions memakai bagian itu sebagai isi halaman Release.
> Kelompok yang dipakai: **Ditambahkan**, **Diubah**, **Diperbaiki**, **Dihapus**, **Keamanan**.

## [Belum dirilis]

### Ditambahkan
- `npm run setup` untuk memasang yt-dlp (pip) dan mengecek FFmpeg; server memperingatkan saat start bila yt-dlp belum ada.

## [1.0.0] - 2026-10-11

Rilis perdana DownloadIn (KazamaDownloader) oleh KazamaTech.

### Ditambahkan
- Website baru berbasis **Node.js + Express + EJS** dengan tampilan **Neo-Brutalism**.
- Download video (beberapa resolusi), MP3 (128/192/320 kbps), audio asli, foto slide, carousel, dan Live Photo.
- Katalog 48 platform unggulan (TikTok, Douyin, Instagram, YouTube, X, Bilibili, pixiv, Threads, Bluesky, dll.) dan 1.700+ situs lain lewat yt-dlp.
- Aplikasi **Android** native (Kotlin + Jetpack Compose): yt-dlp dan FFmpeg berjalan di dalam aplikasi, pratinjau video, galeri foto, riwayat unduhan, dan pembaruan otomatis dari GitHub Releases.
- **Donasi QRIS** di website dan di halaman Tentang aplikasi Android.
- **GitHub Actions**: build APK per arsitektur (arm64-v8a, armeabi-v7a, x86_64), smoke test emulator, dan rilis otomatis saat tag `v*` didorong.
- Riwayat link di website (disimpan di browser), tombol Tempel, dan deteksi platform otomatis.
- Keamanan server: link unduhan bertanda tangan HMAC (berlaku 6 jam), perlindungan SSRF, rate limit, pemblokir bot, dan CSP ketat.
- Halaman `/lisensi` dan `THIRD_PARTY_NOTICES.md` yang dibuat dari `licenses/components.json`.

### Diubah
- Nama layanan menjadi **DownloadIn (KazamaDownloader)**; developer **KazamaDev**; penerbit **KazamaTech**.
- Backend ditulis ulang dari Python ke Node.js. Penggabungan video + audio dan pembuatan MP3 kini dikerjakan server (FFmpeg), bukan di browser.
- Nama file unduhan: `DownloadIn-<judul>-<id>[-kualitas].<ext>`; folder Android: `Download/DownloadIn`.
- ID aplikasi Android menjadi `com.kazamatech.downloadin`.

### Dihapus
- Analitik (beacon ke server pihak lain) dan push notification OneSignal bawaan aplikasi asal. DownloadIn tidak mengirim data pemakaian ke mana pun.
- Cloudflare Worker proxy, dashboard admin, dan konversi ugoira pixiv (tidak dibawa ke versi ini).

### Kredit
- Berdasar XyDownloader (© 2026 XyVerse, GPL-3.0-or-later); pemberitahuan hak cipta karya asal dipertahankan di `LICENSE`, halaman `/lisensi`, dan layar Lisensi aplikasi.
