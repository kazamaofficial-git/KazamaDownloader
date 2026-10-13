<div align="center">

# DownloadIn (KazamaDownloader)

**Satu link, semua platform.** Download video tanpa watermark, MP3, foto slide, dan Live Photo dari TikTok, Instagram, YouTube, X, Bilibili, pixiv, dan 1.700+ situs lain.

[![Build APK](https://github.com/kazamaofficial-git/KazamaDownloader/actions/workflows/android.yml/badge.svg)](https://github.com/kazamaofficial-git/KazamaDownloader/actions/workflows/android.yml)
[![Build IPA](https://github.com/kazamaofficial-git/KazamaDownloader/actions/workflows/ios.yml/badge.svg)](https://github.com/kazamaofficial-git/KazamaDownloader/actions/workflows/ios.yml)
[![Release](https://img.shields.io/github/v/release/kazamaofficial-git/KazamaDownloader?label=rilis&color=7B5CFF)](https://github.com/kazamaofficial-git/KazamaDownloader/releases/latest)
[![Lisensi](https://img.shields.io/badge/lisensi-GPL--3.0--or--later-blue)](LICENSE)

Dibuat oleh **KazamaTech** · Developer: **KazamaDev** · Website: **[dlin.kazamasite.biz.id](https://dlin.kazamasite.biz.id)**

</div>

---

## Tentang

DownloadIn adalah downloader media yang tersedia di tiga tempat dengan tampilan yang sama (Neo-Brutalism):

| | Website | Android | iOS |
|---|---|---|---|
| Teknologi | Node.js + Express + EJS | Kotlin + Jetpack Compose | SwiftUI |
| Mesin pengunduh | yt-dlp di server | yt-dlp + FFmpeg di dalam aplikasi | memakai server DownloadIn |
| Pemasangan | buka di browser / PWA | APK dari website atau GitHub Releases | IPA (sideload) atau PWA |

## Fitur

**Hasil unduhan**
- Video per resolusi (hemat sampai maksimal) dengan codec dan perkiraan ukuran.
- Audio: MP3 128 / 192 / 320 kbps, audio asli, dan musik latar (TikTok/Douyin).
- Foto slide, carousel, dan Live Photo dalam galeri; unduh satu per satu atau semua sekaligus.
- Video tanpa watermark bila platform menyediakannya.
- Nama file rapi: `DownloadIn-<judul>-<id>[-kualitas].<ext>`.
- Playlist/album sampai 12 item per link.

**Website**
- Tempel link atau seluruh teks *share*; deteksi platform otomatis; riwayat 20 link terakhir (disimpan di browser).
- Tombol **Unduh APK** langsung dari website (tanpa membuka GitHub) dan panduan iOS.
- Bisa dipasang sebagai aplikasi web (PWA).
- Keamanan: link unduhan bertanda tangan, anti-SSRF, rate limit, CSP ketat.

**Aplikasi Android**
- Berjalan mandiri (yt-dlp, Python, dan FFmpeg minimal ada di dalam aplikasi).
- Menu *Bagikan* dari aplikasi lain langsung ke DownloadIn; pratinjau video sebelum diunduh.
- **Pemutar bawaan**: video, audio, dan foto hasil unduhan diputar di dalam aplikasi, tanpa membuka aplikasi lain.
- **Unduh di latar belakang**: tetap jalan saat layar mati atau aplikasi ditutup (layanan foreground + izin bebas hemat baterai).
- **Notifikasi**: unduhan selesai (ketuk untuk memutar), unduhan gagal, dan pembaruan aplikasi tersedia.
- **Pembaruan langsung dari aplikasi**: tombol *Perbarui sekarang* mengunduh dan memasang APK baru.
- **Mode Offline**: tanpa internet, hanya tab Unduhan yang bisa dibuka.
- **Pulihkan**: setelah pasang ulang, tombol Pulihkan di tab Unduhan membaca kembali file di `Download/DownloadIn`.

**Aplikasi iOS**
- Pemutar bawaan, unduhan latar belakang (URLSession background), notifikasi lokal, dan Mode Offline.
- Tab Unduhan menyimpan salinan di app Berkas > DownloadIn; tombol Pulihkan mengimpor file dari Berkas.
- Pengaturan alamat server (untuk yang menjalankan server sendiri).

**Deteksi jaringan otomatis** (Android & iOS): bukan hanya melihat status Wi-Fi/seluler, aplikasi juga mengetes akses internet sungguhan. Wi-Fi yang tersambung tetapi tanpa internet dianggap offline, lalu otomatis online lagi begitu internet hidup.

## Alur kerja

```
 tempel link ──► DownloadIn membaca link ──► daftar kualitas ──► pilih ──► file tersimpan
                  (yt-dlp + plugin platform)    video / MP3 / foto         │
                                                                            ├─ video+audio terpisah → digabung FFmpeg
                                                                            ├─ MP3 → dikonversi FFmpeg
                                                                            └─ file langsung → diteruskan apa adanya
```

1. **Tempel link** (atau bagikan dari aplikasi lain).
2. **Membaca link**: engine mengenali platform, mengambil metadata, dan menyusun pilihan kualitas. Link unduhan bertanda tangan dan berlaku 6 jam.
3. **Pilih kualitas**: video, MP3, audio asli, atau foto.
4. **Unduh**: file digabung/dikonversi bila perlu, lalu disimpan (Android: `Download/DownloadIn`; iOS: Foto dan Berkas > DownloadIn; web: unduhan browser).
5. **Tab Unduhan** menyimpan riwayat; file bisa diputar di dalam aplikasi, dibagikan, atau dipulihkan.

## Platform yang didukung

48 platform unggulan (TikTok, Douyin, Instagram, YouTube, X, Facebook, Threads, Bluesky, Bilibili, pixiv, Weibo, Xiaohongshu, Kuaishou, dan lainnya) ditambah situs lain yang dikenali yt-dlp. Link dari situs di luar daftar tetap dicoba. Daftar lengkap ada di website.

## Info aplikasi

| | |
|---|---|
| Android | 7.0 (API 24) ke atas. Varian APK: `arm64-v8a` (HP modern), `armeabi-v7a` (32-bit), `x86_64` (emulator) |
| iOS | iOS 16 ke atas. IPA tanpa tanda tangan, dipasang lewat AltStore / Sideloadly / TrollStore; Apple ID gratis berlaku 7 hari |
| Unduh APK | tombol **Unduh APK** di website, atau [GitHub Releases](https://github.com/kazamaofficial-git/KazamaDownloader/releases/latest) |
| Ukuran | APK Android besar karena membawa yt-dlp, Python, dan FFmpeg. IPA iOS kecil karena aplikasi hanya klien yang memakai server (bukan PWA, melainkan aplikasi SwiftUI asli) |
| Versi | lihat [CHANGELOG](CHANGELOG.md) |

## Privasi & keamanan

- Tidak ada pelacakan: website tanpa analitik; aplikasi Android dan iOS tidak mengirim data pemakaian ke pihak ketiga.
- Riwayat tersimpan di perangkatmu, bukan di server.
- File hasil gabungan/MP3 di server hanya ada sementara selama proses, lalu dihapus.
- Hanya konten publik. Konten privat, berbayar, atau berDRM tidak didukung.

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | menjalankan website secara lokal, konfigurasi `.env`, skrip npm |
| [docs/DEPLOY.md](docs/DEPLOY.md) | deploy ke Vercel dan VPS (PM2 + Nginx) |
| [docs/RELEASE.md](docs/RELEASE.md) | build APK/IPA lewat GitHub Actions, tanda tangan, alur rilis, build lokal |
| [docs/API.md](docs/API.md) | endpoint API |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | masalah umum dan solusinya |
| [CHANGELOG.md](CHANGELOG.md) | riwayat perubahan |

## Donasi

DownloadIn gratis dan tanpa iklan. Kalau terbantu, dukung lewat **QRIS** (semua e-wallet dan m-banking):

<p align="center">
  <a href="https://www.kazamasite.biz.id/images/qris.jpg"><img src="https://www.kazamasite.biz.id/images/qris.jpg" alt="QRIS donasi KazamaTech" width="260"></a>
</p>

Donasi bersifat sukarela dan tidak membuka fitur tambahan. Terima kasih!

## Lisensi & kredit

DownloadIn (KazamaDownloader) © 2026 **KazamaTech** dirilis dengan lisensi **GPL-3.0-or-later**, lihat [`LICENSE`](LICENSE).

Proyek ini adalah turunan dari **XyDownloader / DownloadAja** © 2026 XyVerse (GPL-3.0-or-later). Pemberitahuan hak cipta karya asal dipertahankan sebagaimana dipersyaratkan GPL. Daftar komponen pihak ketiga dan lisensinya ada di [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), halaman `/lisensi`, dan layar Lisensi di aplikasi.

Logo dan nama platform adalah merek dagang milik pemiliknya masing-masing dan hanya dipakai untuk menunjukkan kompatibilitas. DownloadIn tidak berafiliasi dengan platform mana pun. Gunakan hanya untuk konten milik sendiri atau yang kamu punya izin mengunduhnya.
