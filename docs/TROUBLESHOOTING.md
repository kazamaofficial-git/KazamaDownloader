# Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `yt-dlp tidak ditemukan` | `npm start` mencoba memasangnya otomatis; bila gagal jalankan `npm run setup` dan baca pesan galatnya. Pastikan `yt-dlp` ada di `PATH` (pip `--user` → `~/.local/bin`) atau isi `YTDLP_PATH` |
| MP3 / video gabungan gagal | FFmpeg belum terpasang; isi `FFMPEG_PATH` bila tidak ada di `PATH` |
| YouTube minta "confirm you're not a bot" | IP datacenter diblokir. Isi `EXTRACT_PROXY` atau coba lagi nanti |
| Douyin / Kuaishou / Threads tidak jalan | plugin tidak termuat. Cek `/api/health` (`plugins: true`); pasang yt-dlp lewat pip bila memakai VPS |
| `503 busy` | sudah `MAX_JOBS` unduhan berjalan; naikkan sesuai RAM/CPU |
| Link unduhan "kedaluwarsa" | proses ulang linknya; atau `SIGNING_KEY` berubah setelah restart (isi di `.env`) |
| Semua orang kena rate limit | di belakang proxy tetapi `TRUST_PROXY` belum `1` |
| Vercel: fungsi gagal start / yt-dlp tidak ada | cek log build `vercel-build` (unduhan yt-dlp dari GitHub harus berhasil) dan pastikan `bin/**` ada di `includeFiles` |
| Vercel: timeout saat unduh | durasi fungsi habis (60 dtk di Hobby). Pilih kualitas yang tidak perlu digabung, naikkan `maxDuration`, atau pakai VPS |
| Tombol Unduh APK membuka halaman GitHub | GitHub membatasi API; isi `GITHUB_TOKEN`. Jika rilis belum ada, tombol menampilkan "belum dirilis" |
| Release tidak terbit | beri *Read and write permissions* pada workflow; Release hanya dibuat saat tag `v*` didorong atau *Run workflow* dengan `publish` + `version` |
| Aplikasi Android gagal memperbarui diri ("bentrok") | APK baru harus ditandatangani key yang sama dengan yang terpasang. Isi 4 secrets keystore (lihat [RELEASE.md](RELEASE.md)); bila APK terpasang bertanda tangan lain, copot sekali lalu pasang versi terbaru. Mengganti ID paket juga membuat aplikasi terpasang sebagai aplikasi terpisah, bukan pembaruan |
| Build iOS: "future Xcode project file format" | pakai runner dengan Xcode 16.3+ (workflow sudah memakai `macos-15`) |
| Unduhan Android berhenti saat layar mati | di Pengaturan aplikasi, ketuk *Izinkan di latar belakang* (bebas hemat baterai) |
| Aplikasi dianggap offline padahal Wi-Fi tersambung | aplikasi mengetes akses internet sungguhan; Wi-Fi tanpa internet memang dianggap offline dan otomatis online lagi saat internet hidup |
