/* DownloadIn (KazamaDownloader) — front-end. Tanpa framework, tanpa inline script (CSP ketat). */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const SVG = 'http://www.w3.org/2000/svg';

  // ---- util DOM ----
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  }
  function icon(id) {
    const s = document.createElementNS(SVG, 'svg'); s.setAttribute('class', 'ico');
    const u = document.createElementNS(SVG, 'use'); u.setAttribute('href', `#i-${id}`);
    s.append(u); return s;
  }
  const fmtSize = (b) => {
    if (!b) return '';
    const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let n = b;
    while (n >= 1024 && i < 3) { n /= 1024; i++; }
    return `${n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)} ${u[i]}`;
  };
  const fmtDur = (s) => {
    if (!s) return '';
    s = Math.round(s); const hh = Math.floor(s / 3600); const mm = Math.floor((s % 3600) / 60); const ss = s % 60;
    return hh ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${mm}:${String(ss).padStart(2, '0')}`;
  };
  const withDl = (u) => u + (u.includes('?') ? '&' : '?') + 'dl=1';

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---- riwayat (localStorage) ----
  const HKEY = 'downloadin.history.v1';
  const hist = {
    get() { try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch { return []; } },
    add(item) {
      try {
        const list = this.get().filter((x) => x.url !== item.url);
        list.unshift({ ...item, ts: Date.now() });
        localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 20)));
      } catch { /* mode privat / penuh */ }
    },
    clear() { try { localStorage.removeItem(HKEY); } catch { /* abaikan */ } },
  };

  // PWA: service worker kecil supaya bisa dipasang ("Add to Home Screen") di iOS/Android
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  const form = $('#form');
  const dlg = $('#history-dialog');

  // tombol Riwayat ada di semua halaman; dialognya hanya di beranda
  const btnHist = $('#btn-history');
  if (btnHist) {
    btnHist.addEventListener('click', () => {
      if (!dlg) { location.href = '/'; return; }
      renderHistory(); dlg.showModal();
    });
  }
  if (!form) return; // halaman statis

  const input = $('#url'); const go = $('#go'); const goLabel = $('#go-label');
  const clearBtn = $('#clear'); const pasteBtn = $('#paste');
  const result = $('#result'); const detected = $('#detected');

  // ---- deteksi platform dari katalog ----
  let platforms = [];
  try {
    platforms = JSON.parse($('#catalog-data').textContent).regions.flatMap((r) => r.platforms);
  } catch { /* katalog opsional */ }
  function detect(text) {
    const m = String(text).match(/https?:\/\/[^\s]+/i); if (!m) return null;
    let host; try { host = new URL(m[0]).hostname.toLowerCase(); } catch { return null; }
    return platforms.find((p) => p.domains.some((d) => host === d || host.endsWith(`.${d}`))) || null;
  }
  function showDetected() {
    detected.replaceChildren();
    clearBtn.classList.toggle('hidden', !input.value);
    const p = detect(input.value);
    if (p) detected.append(h('span', { class: 'chip' }, h('img', { src: p.logo, alt: '' }), `Terdeteksi: ${p.name}`));
  }
  input.addEventListener('input', showDetected);
  clearBtn.addEventListener('click', () => { input.value = ''; showDetected(); input.focus(); });
  pasteBtn.addEventListener('click', async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (!t) return toast('Clipboard kosong');
      input.value = t; showDetected(); form.requestSubmit();
    } catch { toast('Izin clipboard ditolak. Tempel manual dengan Ctrl+V.'); input.focus(); }
  });

  // ---- kirim ke API ----
  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) { toast('Tempel link dulu ya'); return input.focus(); }
    if (busy) return;
    busy = true; go.disabled = true; goLabel.textContent = 'Memproses…';
    result.classList.remove('hidden');
    result.replaceChildren(h('div', { class: 'card card-loading' }, h('span', { class: 'spinner' }), 'Membaca link, tunggu sebentar…'));
    try {
      const r = await fetch('/api/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: text }),
      });
      const data = await r.json().catch(() => ({ ok: false, error: 'Respons server tidak terbaca.' }));
      if (!r.ok || !data.ok) throw Object.assign(new Error(data.error || 'Gagal memproses link.'), { detail: data.detail });
      renderResult(data);
      hist.add({ url: data.url, title: data.title, platform: data.platform?.name });
    } catch (err) {
      renderError(err);
    } finally {
      busy = false; go.disabled = false; goLabel.textContent = 'Ambil file';
    }
  });

  function renderError(err) {
    result.replaceChildren(h('div', { class: 'card card-error', role: 'alert' },
      h('h3', null, icon('alert'), 'Belum bisa diunduh'),
      h('p', null, err.message),
      err.detail ? h('small', null, err.detail) : null));
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function optionButton(o, cls) {
    const sub = [o.ext && o.ext.toUpperCase(), o.codec, fmtSize(o.size)].filter(Boolean).join(' · ');
    return h('li', null, h('a', { class: `btn opt ${cls}`, href: withDl(o.url), download: o.filename, rel: 'nofollow' },
      h('span', { class: 'opt-label', text: o.label }),
      sub ? h('span', { class: 'opt-sub', text: sub }) : null,
      o.no_audio ? h('span', { class: 'opt-sub', text: 'tanpa suara' }) : null));
  }

  function galleryView(entry) {
    const links = [];
    const items = entry.gallery.map((it) => {
      const acts = [];
      if (it.image) { acts.push(h('a', { href: withDl(it.image.url), download: it.image.filename }, 'Foto')); links.push(it.image); }
      if (it.video) { acts.push(h('a', { href: withDl(it.video.url), download: it.video.filename }, it.type === 'live' ? 'Video' : 'Unduh')); links.push(it.video); }
      return h('li', { class: 'shot' },
        h('div', { class: 'shot-img' }, it.thumb ? h('img', { src: it.thumb, alt: `Item ${it.index}`, loading: 'lazy' }) : null),
        h('div', { class: 'shot-actions' }, acts));
    });
    const all = h('button', { type: 'button', class: 'btn btn-yellow' }, icon('archive'), `Unduh semua (${links.length} file)`);
    all.addEventListener('click', async () => {
      toast('Mengunduh satu per satu. Izinkan unduhan ganda jika diminta browser.');
      for (const f of links) {
        const a = h('a', { href: withDl(f.url), download: f.filename }); document.body.append(a); a.click(); a.remove();
        await new Promise((r) => setTimeout(r, 600));
      }
    });
    return h('div', { class: 'group' }, h('h4', null, icon('image'), `Galeri · ${entry.gallery.length} item`), all, h('ul', { class: 'gallery' }, items));
  }

  function entryCard(entry, platform) {
    const meta = h('div', { class: 'meta' });
    if (platform?.name) meta.append(h('span', { class: 'tag', text: platform.name }));
    if (entry.uploader) meta.append(h('span', { class: 'tag', text: entry.uploader }));
    if (entry.duration) meta.append(h('span', { class: 'tag', text: fmtDur(entry.duration) }));
    if (entry.is_live) meta.append(h('span', { class: 'tag', text: 'LIVE' }));

    const card = h('article', { class: 'card' },
      h('div', { class: 'entry-head' },
        h('div', { class: 'thumb' }, entry.thumbnail ? h('img', { src: entry.thumbnail, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }) : null),
        h('div', { class: 'entry-info' }, h('h3', { text: entry.title || 'Tanpa judul' }), meta)));

    if (entry.gallery?.length) card.append(galleryView(entry));
    if (entry.video?.length) {
      card.append(h('div', { class: 'group' }, h('h4', null, icon('video'), 'Video'),
        h('ul', { class: 'opts' }, entry.video.map((o) => optionButton(o, 'video')))));
    }
    if (entry.audio?.length) {
      card.append(h('div', { class: 'group' }, h('h4', null, icon('music'), 'Audio'),
        h('ul', { class: 'opts' }, entry.audio.map((o) => optionButton(o, 'audio')))));
    }
    if (entry.video?.some((o) => o.mode === 'merge' || o.mode === 'hls') || entry.audio?.some((o) => o.mode === 'mp3')) {
      card.append(h('div', { class: 'group' }, h('p', { class: 'notice', text: 'Video gabungan, HLS, dan MP3 diproses dulu di server. Unduhan baru mulai setelah proses selesai, jadi mohon tunggu.' })));
    }
    return card;
  }

  function renderResult(data) {
    const cards = data.entries.map((e) => entryCard(e, data.platform));
    if (data.truncated) cards.push(h('p', { class: 'notice', text: `Menampilkan ${data.count} dari ${data.total} item.` }));
    result.replaceChildren(...cards);
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- dialog riwayat ----
  function renderHistory() {
    const list = $('#history-list'); const items = hist.get();
    list.replaceChildren(...(items.length ? items.map((x) => {
      const b = h('button', { type: 'button' }, h('span', { text: x.title || x.url }), h('small', { text: `${x.platform || 'Web'} · ${x.url}` }));
      b.addEventListener('click', () => { dlg.close(); input.value = x.url; showDetected(); form.requestSubmit(); });
      return h('li', null, b);
    }) : [h('li', { class: 'empty', text: 'Belum ada riwayat. Link yang berhasil diproses muncul di sini.' })]));
  }
  $('#history-close').addEventListener('click', () => dlg.close());
  $('#history-clear').addEventListener('click', () => { hist.clear(); renderHistory(); toast('Riwayat dihapus'); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  // ---- info APK terbaru (unduh langsung dari website) ----
  const apkInfo = $('#apk-info');
  if (apkInfo) {
    const ABI = { 'arm64-v8a': 'arm64-v8a (HP modern)', 'armeabi-v7a': 'armeabi-v7a (HP 32-bit)', x86_64: 'x86_64 (emulator)', universal: 'universal' };
    fetch('/api/android').then((r) => r.json()).then((d) => {
      if (!d.ok) throw new Error();
      if (!d.available || !d.apk.length) { apkInfo.textContent = 'APK belum dirilis. Segera hadir.'; return; }
      const main = d.apk.find((a) => a.abi === 'arm64-v8a') || d.apk[0];
      apkInfo.textContent = `Versi ${d.version} · ${fmtSize(main.size)} · ${main.abi}`;
      $('#apk-btn').href = main.href;
      if (d.apk.length > 1) {
        const box = $('#apk-abis'); box.classList.remove('hidden');
        box.replaceChildren('Varian lain:', ...d.apk.filter((a) => a !== main).map((a) => h('a', { href: a.href, text: `${ABI[a.abi] || a.abi} · ${fmtSize(a.size)}` })));
      }
    }).catch(() => { apkInfo.textContent = 'Tekan tombol di atas untuk mengunduh versi terbaru.'; });
  }

  // dukung ?url=... (mis. dari bookmark / share target)
  const q = new URLSearchParams(location.search).get('url');
  if (q) { input.value = q; showDetected(); form.requestSubmit(); }
})();
