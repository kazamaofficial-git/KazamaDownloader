# Changelog

Semua perubahan penting pada DownloadIn (KazamaDownloader) dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan versi mengikuti [SemVer](https://semver.org/lang/id/).

> **Cara menambah catatan:** setiap ada perubahan, tulis di bagian `[Belum dirilis]`. Saat merilis, ganti judulnya
> menjadi `[X.Y.Z] - TANGGAL`, lalu buat tag `vX.Y.Z`. Workflow GitHub Actions memakai bagian itu sebagai isi halaman Release.
> Kelompok yang dipakai: **Ditambahkan**, **Diubah**, **Diperbaiki**, **Dihapus**, **Keamanan**.

## [Belum dirilis]

## [1.3.0] - 2026-10-16

### Ditambahkan
- **Layar sambutan** (Android & iOS) saat pertama kali dipasang: 6 halaman bergeser, tombol Lewati/Lanjut/Mulai, dan izin notifikasi diminta setelah Mulai.
- **Kategori di tab Unduhan**: Semua, Video, Audio, Foto, dan Gagal, masing-masing dengan jumlah file.
- **Coba lagi** untuk unduhan yang gagal langsung dari tab Unduhan, tanpa memproses link dari awal. Bila tautan unduhan sudah kedaluwarsa (iOS), tautan baru diambil otomatis dari link asal.
- **Segarkan** di tab Unduhan (tarik ke bawah atau tombol): mengimpor file baru dan membuang entri yang filenya sudah dihapus.
- **Tombol Bagikan** di pemutar bawaan (video, audio, dan foto), selain tombol Bagikan di daftar Unduhan.
- **Logo KazamaTech** resmi di layar sambutan, halaman Tentang, dan footer website.
- **Varian file iOS**: `.ipa` (AltStore/Sideloadly), `.tipa` (TrollStore), dan `.zip` (paket `.app` mentah), tersedia di Releases dan lewat `/download/ios`, `/download/ios/tipa`, `/download/ios/zip`.
- Pesan galat pembaruan yang jelas di Android (mis. "bentrok" bila tanda tangan APK berbeda dari aplikasi terpasang), dan peringatan di GitHub Actions bila APK ditandatangani debug key.

### Diubah
- ID paket Android menjadi `com.kazamatech.dlin` (juga ID bundel iOS).
- Tanda tangan APK cadangan (debug key) kini disimpan di cache Actions supaya konsisten antar-build bila secrets keystore belum diisi.
- Halaman Lisensi menampilkan karya asal tanpa nama proyek, hanya pemberitahuan hak cipta yang dipersyaratkan GPL.

## [1.2.0] - 2026-10-13

### Ditambahkan
- **Pemutar bawaan** (Android & iOS): video, audio, dan foto hasil unduhan diputar di dalam aplikasi tanpa membuka aplikasi lain.
- **Tombol Pulihkan** di tab Unduhan. Android: membaca ulang file di `Download/DownloadIn` setelah pasang ulang (dengan izin baca media, atau memilih folder secara manual bila perlu). iOS: mengimpor file dari app Berkas.
- **Unduh di latar belakang**: Android meminta izin bebas hemat baterai lewat Pengaturan; iOS memakai URLSession background sehingga unduhan lanjut saat aplikasi ditutup/di latar belakang.
- **Notifikasi** (Android & iOS): unduhan selesai (ketuk untuk memutar), unduhan gagal, dan pembaruan aplikasi tersedia (dicek berkala di latar belakang). Bisa dimatikan per jenis di Pengaturan; izin notifikasi diminta saat pertama dibuka.
- **Deteksi jaringan otomatis**: selain status Wi-Fi/seluler, aplikasi mengetes akses internet sungguhan. Jaringan yang tersambung tetapi mati dianggap offline (Mode Offline aktif), dan kembali online otomatis saat internet hidup.
- Dokumentasi dipisah: `README.md` berisi fitur dan alur kerja; cara menjalankan, deploy, rilis, API, dan troubleshooting ada di folder `docs/`.

### Diubah
- **Ikon aplikasi baru** (Android adaptif + ikon monokrom, ikon iOS, splash) sesuai logo website.
- Layar **Pembaruan** (Android) lebih ringkas: gambar besar di atasnya dihapus.
- `.env.example` dihapus dari repositori; daftar variabel konfigurasi ada di `docs/SETUP.md`.

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
- ID aplikasi Android menjadi `com.kazamatech.dlin`.

### Dihapus
- Analitik (beacon ke server pihak lain) dan push notification OneSignal bawaan aplikasi asal. DownloadIn tidak mengirim data pemakaian ke mana pun.
- Cloudflare Worker proxy, dashboard admin, dan konversi ugoira pixiv (tidak dibawa ke versi ini).

### Kredit
- Berdasar XyDownloader (© 2026 XyVerse, GPL-3.0-or-later); pemberitahuan hak cipta karya asal dipertahankan di `LICENSE`, halaman `/lisensi`, dan layar Lisensi aplikasi.
