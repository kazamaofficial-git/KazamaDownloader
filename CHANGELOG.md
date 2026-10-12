# Changelog

Semua perubahan penting pada DownloadIn (KazamaDownloader) dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan versi mengikuti [SemVer](https://semver.org/lang/id/).

> **Cara menambah catatan:** setiap ada perubahan, tulis di bagian `[Belum dirilis]`. Saat merilis, ganti judulnya
> menjadi `[X.Y.Z] - TANGGAL`, lalu buat tag `vX.Y.Z`. Workflow GitHub Actions memakai bagian itu sebagai isi halaman Release.
> Kelompok yang dipakai: **Ditambahkan**, **Diubah**, **Diperbaiki**, **Dihapus**, **Keamanan**.

## [Belum dirilis]

<<<<<<< HEAD
## [1.1.0] - 2026-10-11

### Ditambahkan
- **Deploy ke Vercel**: `vercel.json`, entry `api/index.js`, dan `npm run vercel-build` yang mengunduh binary yt-dlp mandiri; FFmpeg dibundel lewat `ffmpeg-static`. Binary otomatis disalin ke `/tmp` saat cold start.
- **Unduh APK langsung dari website**: tombol Unduh APK di beranda memanggil `/download/android` yang mengarahkan ke APK rilis terbaru tanpa membuka halaman GitHub. Tersedia varian per arsitektur (`/download/android/<abi>`), info versi dan ukuran lewat `GET /api/android`, serta cache 10 menit (opsional `GITHUB_TOKEN`).
- **Versi iOS**:
  - Aplikasi SwiftUI (`ios/`) bertema Neo-Brutalism: tempel link, pilih kualitas, simpan ke Foto atau lembar Bagikan, galeri foto/Live Photo, URL scheme `downloadin://?url=`, dan pengaturan alamat server.
  - Workflow `ios.yml` membangun IPA tanpa tanda tangan (sideload via AltStore/Sideloadly/TrollStore) dan melampirkannya ke Release; unduh lewat `/download/ios`.
  - Halaman `/ios` berisi panduan memasang sebagai aplikasi web (PWA) dan membuat Shortcut yang menyimpan langsung ke Foto.
- **PWA**: `manifest.webmanifest`, service worker kecil, dan ikon (bisa dipasang lewat "Tambah ke Layar Utama").
- `npm start` (dan `npm run dev`) otomatis memasang yt-dlp lewat pip bila belum ada, tanpa menggagalkan start; `npm run setup` untuk memasang/memperbarui manual; `npm run start:only` melewati pengecekan.
- **Pembaruan langsung dari aplikasi** (Android): saat versi baru terdeteksi, popup menampilkan tombol **Perbarui sekarang** yang langsung mengunduh dan memasang APK baru, dengan progres di layar Pembaruan. Pengecekan juga diulang otomatis begitu internet kembali (jeda minimal 6 jam).
- **Mode Offline** (Android & iOS): tanpa internet, hanya tab **Unduhan** yang bisa dibuka (tab lain dinonaktifkan, ada pita "Mode offline"). Status jaringan hanya memeriksa kemampuan internet, sehingga jaringan yang memblokir server cek koneksi tidak salah dianggap offline.
- iOS: tab **Unduhan** (salinan lokal di app Berkas > DownloadIn, bisa dibuka/dibagikan/dihapus), dan pita pembaruan yang membuka unduhan IPA terbaru.
- Tombol *Run workflow* di GitHub Actions bisa langsung menerbitkan Release (opsi `publish` + `version`).

### Diubah
- **UI aplikasi Android disamakan dengan website**: tema Neo-Brutalism (palet lilac/kuning/cyan/lime/pink, garis hitam 3dp, bayangan keras, tombol "tertekan", bilah bawah kuning). Aplikasi kini selalu bertema terang seperti website.
- Alamat repo menjadi `github.com/kazamaofficial-git/KazamaDownloader` dan alamat website menjadi `dlin.kazamasite.biz.id` (website, aplikasi Android, pembaruan otomatis, README).
- Di Vercel, `NODE_ENV=production` dan `TRUST_PROXY` diaktifkan otomatis; cache dan HOME yt-dlp diarahkan ke `/tmp`.
=======
### Ditambahkan
- `npm run setup` untuk memasang yt-dlp (pip) dan mengecek FFmpeg; server memperingatkan saat start bila yt-dlp belum ada.
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8

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
<<<<<<< HEAD
- Berdasar XyDownloader (© 2026 XyVerse, GPL-3.0-or-later); pemberitahuan hak cipta karya asal dipertahankan di `LICENSE`, halaman `/lisensi`, dan layar Lisensi aplikasi.
=======
- Berdasar LunaDownloader (© 2026 KazamaTech, GPL-3.0-or-later); pemberitahuan hak cipta karya asal dipertahankan di `LICENSE`, halaman `/lisensi`, dan layar Lisensi aplikasi.
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
