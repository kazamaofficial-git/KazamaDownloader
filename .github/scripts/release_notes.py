"""Ambil catatan rilis satu versi dari CHANGELOG.md (format Keep a Changelog).

    python .github/scripts/release_notes.py 1.0.0

Mencari heading `## [1.0.0] - tanggal`. Jika tidak ada, jatuh ke bagian `## [Belum dirilis]`,
lalu ke teks standar — sehingga rilis tidak pernah gagal hanya karena catatan belum ditulis.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FOOTER = (
    "\n\n---\n"
    "**Pasang:** unduh APK sesuai arsitektur HP (kebanyakan HP modern: `arm64-v8a`) lalu ketuk untuk memasang. "
    "Aplikasi akan memberi tahu bila ada versi baru.\n"
    "Aktifkan *Instal aplikasi tidak dikenal* bila diminta Android.\n"
)


def section(text, version):
    pat = re.compile(r'^##\s*\[(?P<v>[^\]]+)\][^\n]*\n(?P<body>.*?)(?=^##\s*\[|\Z)', re.S | re.M)
    found = {m.group('v').strip().lower(): m.group('body').strip() for m in pat.finditer(text)}
    for key in (version.lower(), 'belum dirilis', 'unreleased'):
        if found.get(key):
            return found[key]
    return ''


def main():
    version = (sys.argv[1] if len(sys.argv) > 1 else '').lstrip('v')
    path = os.path.join(ROOT, 'CHANGELOG.md')
    body = section(open(path, encoding='utf-8').read(), version) if os.path.exists(path) else ''
    print(f"## DownloadIn {version} — KazamaTech\n")
    print(body or "Pembaruan rutin dan perbaikan.")
    print(FOOTER)


if __name__ == '__main__':
    main()
