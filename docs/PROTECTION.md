# Perlindungan proyek

## Yang ada

| Risiko | Perlindungan | Di mana |
|---|---|---|
| Aplikasi dibongkar/di-rebrand: tanda tangan (keystore), ID paket, nama aplikasi, atau nama pengembang diubah lalu disebar | **Gerbang anti bajak (Android dan iOS)**: aplikasi memeriksa identitasnya terhadap nilai resmi yang tersimpan terenkode (agar tidak ikut berubah saat ganti nama massal). Bila tidak cocok, tampil layar "Aplikasi tiruan terdeteksi" dan aplikasi berhenti. Android juga membandingkan sidik jari tanda tangan (build resmi menanamkan sidik jari sertifikat KazamaTech). Pemeriksaan tersebar di beberapa titik dan dikaburkan R8 (Android) | `Integrity.kt`, `TamperScreen.kt` (Android); `Integrity.swift`, `TamperView.swift` (iOS) |
| Pengguna tertipu aplikasi tiruan | Halaman Tentang (Android) menampilkan *Build resmi KazamaTech* atau peringatan | `AboutScreen.kt` |
| Orang memakai nama/logo/identitasmu | Kebijakan merek: nama, logo, ikon, domain, dan ID paket tidak dilisensikan; fork wajib menggantinya | [TRADEMARK.md](../TRADEMARK.md) |
| PR yang menghapus lisensi, atribusi, atau identitas resmi | *Brand guard* di CI memblokir PR tersebut; `CODEOWNERS` mewajibkan persetujuan pemilik | `scripts/brand-guard.js`, `.github/CODEOWNERS` |
| Rilis palsu | Rilis dibuat workflow dari repo resmi dan APK ditandatangani keystore yang hanya kamu pegang | [RELEASE.md](RELEASE.md) |

## Batas yang perlu kamu tahu

- **Gerbang anti bajak melawan pembajakan biner, bukan pembuatan fork dari sumber.** Selama kode sumber publik, siapa pun yang membangun dari sumber bisa membaca dan menghapus pemeriksaan apa pun. Tidak ada cara membuat kode di repositori publik "tidak bisa dihapus" atau "terenkripsi hanya untuk pemilik".
- Pemeriksaan tanda tangan di Android hanya aktif di build yang punya sidik jari resmi (build CI dengan keystore rilis); build dari sumber asli tanpa perubahan identitas tidak diblokir.
- **Di iOS, tanda tangan tidak diperiksa.** IPA selalu ditandatangani ulang oleh alat sideload di perangkat pengguna; yang diperiksa adalah ID bundel (boleh diberi akhiran oleh alat sideload), nama aplikasi, dan nama pengembang.
- **Lisensi.** Kode ini turunan dari karya GPL-3.0-or-later milik XyVerse, dan aplikasi membawa komponen GPL/LGPL lain (mis. FFmpeg). Menghapus lisensi atau mengubahnya menjadi tertutup hanya sah bila kamu memegang hak cipta atas semua kodenya atau punya izin tertulis pemegang hak ciptanya. Karena itu berkas `LICENSE` dan atribusi tidak saya hapus.

## Yang perlu kamu atur

1. **Keystore Android**: isi 4 secrets keystore (lihat [RELEASE.md](RELEASE.md)). Sidik jari resmi diambil otomatis dari keystore itu saat build; tanpa keystore, gerbang tidak aktif.
2. **Branch protection** (Settings → Branches → `main`): *Require a pull request before merging*, *Require review from Code Owners*, *Require status checks* (`Brand guard`, `Web CI`), *Do not allow bypassing*.
3. Aktifkan **Secret scanning** dan **Dependabot alerts** di Settings → Code security.
4. Jangan pernah commit `.env`, `*.p12`, `*.jks`, atau kunci rahasia.
