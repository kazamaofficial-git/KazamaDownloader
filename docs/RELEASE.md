# Build & rilis

## GitHub Actions

| Workflow | Pemicu | Hasil |
|---|---|---|
| `android.yml` | PR / push ke `main` | build APK (artifact) + smoke test emulator |
| | push tag `v*` | semua di atas + **GitHub Release** berisi APK per arsitektur, `update-banner.webp`, dan catatan rilis dari `CHANGELOG.md` |
| | *Run workflow*, `publish` dicentang + isi `version` | build + buat tag `vX.Y.Z` dan Release |
| | *Run workflow*, `publish` tidak dicentang | APK sebagai artifact saja |
| `ios.yml` | sama dengan di atas | IPA tanpa tanda tangan; saat tag/`publish`, dilampirkan ke Release yang sama |
| `ci.yml` | push / PR | tes unit website |

Hasil rilis: `DownloadIn-<versi>-arm64-v8a.apk`, `-armeabi-v7a.apk`, `-x86_64.apk`, serta untuk iOS `DownloadIn-<versi>.ipa` (AltStore/Sideloadly), `.tipa` (TrollStore), dan `DownloadIn-<versi>-ios.zip` (paket `.app` mentah). Tombol Unduh APK di website otomatis menunjuk ke rilis terbaru.

Pengaturan repo: **Settings → Actions → General → Workflow permissions** harus *Read and write permissions*.

## Tanda tangan APK (sekali saja)

Tanpa keystore, APK ditandatangani *debug key*: cukup untuk uji coba, tetapi runner GitHub tidak punya key tetap, sehingga APK dari build berbeda bisa memiliki tanda tangan berbeda. Akibatnya pembaruan dari dalam aplikasi gagal dengan pesan "bentrok" (INSTALL_FAILED_UPDATE_INCOMPATIBLE). Workflow menyimpan debug key di cache sebagai cadangan, tetapi untuk rilis publik **wajib** memakai keystore sendiri. Buat keystore sebelum rilis publik pertama:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.p12 -alias downloadin \
  -keyalg RSA -keysize 4096 -validity 36500
base64 -w0 release.p12        # salin hasilnya
```

Tambahkan di **Settings → Secrets and variables → Actions**:

| Secret | Isi |
|---|---|
| `KEYSTORE_BASE64` | hasil `base64` di atas |
| `KEYSTORE_PASSWORD` | password keystore |
| `KEY_ALIAS` | `downloadin` |
| `KEY_PASSWORD` | password key |

Simpan `release.p12` dan passwordnya di tempat aman, jangan pernah di-commit (`*.p12`, `*.jks`, `*.keystore` sudah di `.gitignore`).

## Penomoran versi

| Sumber | `versionName` | `versionCode` (Android) |
|---|---|---|
| tag `vA.B.C` | `A.B.C` | `A×1.000.000 + B×1.000 + C×10` |
| branch / PR | `A.B.C-dev.N` | `100 + N` |

## Alur rilis dan changelog

Setiap perubahan **wajib** dicatat di [`CHANGELOG.md`](../CHANGELOG.md) pada bagian `[Belum dirilis]`.

```bash
# 1. ganti "[Belum dirilis]" menjadi "[1.3.0] - 2026-11-01" (dan buat bagian [Belum dirilis] kosong di atasnya)
# 2. perbarui "version" di package.json dan MARKETING_VERSION di ios/project.yml
# 3. (opsional) banner popup pembaruan:
python3 scripts/make_banner.py --title "DownloadIn 1.3.0" --sub "Ringkasan singkat" --out android/release-banner.webp
# 4. commit lalu beri tag
git commit -am "rilis v1.3.0"
git tag v1.3.0
git push origin main v1.3.0
```

Setelah tag didorong, workflow membangun APK dan IPA lalu menerbitkan Release otomatis. Aplikasi Android yang terpasang akan menawarkan pembaruan (popup + notifikasi).

## Build lokal

**Android** butuh JDK 17, Android SDK 35, dan NDK 27. FFmpeg minimal dibangun lewat `android/ffmpeg/build.sh` (CI sudah mengerjakannya dan meng-cache hasilnya):

```bash
cd android && ./gradlew assembleRelease
```

**iOS** butuh macOS + Xcode 16.3+ dan [XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
cd ios && xcodegen generate && open DownloadIn.xcodeproj
```

IPA dari CI tidak bertanda tangan; alat sideload (AltStore/Sideloadly) menandatanganinya dengan Apple ID pemakai.
