#!/usr/bin/env node
'use strict';
// Pemeriksa keutuhan merek & pemberitahuan lisensi untuk repositori RESMI (dijalankan di CI pada setiap push/PR).
// Tujuan: PR yang menghapus pemberitahuan hak cipta, lisensi, atau identitas resmi akan GAGAL dan tidak bisa digabung.
// Catatan: ini melindungi repositori resmi dari perubahan tak sengaja/berbahaya lewat PR. Ini BUKAN mekanisme yang
// mencegah orang lain membuat fork (GPL-3.0 mengizinkannya); fork wajib mengganti nama & logo (lihat TRADEMARK.md).
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const failures = [];
const need = (ok, msg) => { if (!ok) failures.push(msg); };

// 1. Teks lisensi GPL tidak boleh berubah
const GPL_SHA256 = process.env.GPL_SHA256 || fs.readFileSync(path.join(__dirname, 'brand-guard.sha256'), 'utf8').trim();
const gpl = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'LICENSE'))).digest('hex');
need(gpl === GPL_SHA256, 'LICENSE berubah dari teks GPL-3.0 yang sah');

// 2. Pemberitahuan hak cipta + atribusi karya asal harus tetap ada
const components = JSON.parse(read('licenses/components.json'));
const flat = [...(components.web || []), ...(components.android || [])];
need(flat.some((c) => /KazamaTech/.test(c.copyright || '')), 'components.json: hak cipta KazamaTech hilang');
need(flat.some((c) => /XyVerse/.test(c.copyright || '')), 'components.json: atribusi karya asal (GPL) hilang');
need(/XyVerse/.test(read('README.md')), 'README: atribusi karya asal hilang');

// 3. Berkas kebijakan harus ada
for (const f of ['TRADEMARK.md', '.github/CODEOWNERS', 'docs/PROTECTION.md', 'THIRD_PARTY_NOTICES.md']) need(exists(f), `berkas wajib hilang: ${f}`);

// 4. Identitas resmi
const pkg = JSON.parse(read('package.json'));
need(/KazamaDev/.test(pkg.author || ''), 'package.json: author KazamaDev hilang');
need(pkg.license === 'GPL-3.0-or-later', 'package.json: lisensi harus GPL-3.0-or-later');
need(/applicationId = "com\.kazamatech\.dlin"/.test(read('android/app/build.gradle.kts')), 'applicationId Android berubah');
need(/PRODUCT_BUNDLE_IDENTIFIER: com\.kazamatech\.dlin/.test(read('ios/project.yml')), 'bundle id iOS berubah');
need(/KazamaTech/.test(read('views/partials/footer.ejs')), 'footer website: kredit KazamaTech hilang');
need(exists('public/img/kazamatech.png'), 'logo KazamaTech hilang');

if (failures.length) {
  console.error('\nBrand guard GAGAL:\n' + failures.map((f) => '  - ' + f).join('\n') + '\n');
  process.exit(1);
}
console.log('Brand guard OK');
