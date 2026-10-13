# API

| Endpoint | Fungsi |
|---|---|
| `GET /api/health` | status server, versi yt-dlp, dan status plugin (juga dipakai aplikasi untuk mendeteksi jaringan) |
| `GET /api/platforms` | katalog platform per wilayah |
| `POST /api/extract` `{ "url": "..." }` | info konten + opsi unduhan (link bertanda tangan, berlaku 6 jam) |
| `GET /api/download?t=TOKEN&dl=1` | unduh lewat yt-dlp (stream langsung, atau file sementara untuk merge/HLS/MP3) |
| `GET /api/media?t=TOKEN&dl=1` | proxy thumbnail, foto galeri, dan video langsung |
| `GET /api/android` | versi rilis terbaru, ukuran, dan tautan unduh APK/IPA |
| `GET /download/android[/<abi>]` | arahkan langsung ke APK terbaru (`arm64-v8a`, `armeabi-v7a`, `x86_64`) |
| `GET /download/ios` | arahkan langsung ke IPA terbaru |

Kode galat `/api/extract`: `invalid`, `unsupported`, `private`, `geo`, `drm`, `blocked`, `notfound`, `novideo`, `timeout`, `rate_limit`, `busy`.

`/api/extract` menolak klien tanpa User-Agent browser (curl, python-requests, dll.) dan dibatasi `RATE_LIMIT` per menit per IP.
