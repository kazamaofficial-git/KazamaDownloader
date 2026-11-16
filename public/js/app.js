/* DownloadIn (KazamaDownloader) — front-end halaman web.
   Tanpa framework dan tanpa skrip inline (CSP ketat). Semua fungsi berawalan "kazama". */
(() => {
  'use strict';

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const HISTORY_KEY = 'downloadin.history.v1';
  const THEME_KEY = 'downloadin.theme';
  const HISTORY_LIMIT = 20;
  const TOAST_DURATION_MS = 2600;
  // kunci klien (terenkode); sama dengan yang dikirim aplikasi
  const KAZAMA_CLIENT_HEADERS = { 'X-KD-Key': atob('RExJTkFQUC0xMTEwMjU=') };

  const kazamaQuery = (selector, root = document) => root.querySelector(selector);

  // ---------------------------------------------------------------------------
  // Util DOM & format
  // ---------------------------------------------------------------------------

  function kazamaElement(tag, attributes, ...children) {
    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (name === 'class') element.className = value;
      else if (name === 'text') element.textContent = value;
      else element.setAttribute(name, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child !== null && child !== undefined) element.append(child.nodeType ? child : document.createTextNode(child));
    }
    return element;
  }

  function kazamaIcon(name) {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    svg.setAttribute('class', 'kazama-icon');
    const use = document.createElementNS(SVG_NAMESPACE, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function kazamaFormatSize(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) { value /= 1024; unitIndex += 1; }
    const digits = value >= 100 || unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(digits)} ${units[unitIndex]}`;
  }

  function kazamaFormatDuration(totalSeconds) {
    if (!totalSeconds) return '';
    const seconds = Math.round(totalSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = String(seconds % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
  }

  const kazamaWithDownloadFlag = (url) => `${url}${url.includes('?') ? '&' : '?'}dl=1`;

  let kazamaToastTimer;
  function kazamaToast(message) {
    const toast = kazamaQuery('#kazama-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('kazama-toast--show');
    clearTimeout(kazamaToastTimer);
    kazamaToastTimer = setTimeout(() => toast.classList.remove('kazama-toast--show'), TOAST_DURATION_MS);
  }

  // ---------------------------------------------------------------------------
  // Tema terang/gelap
  // ---------------------------------------------------------------------------

  function kazamaBindThemeToggle() {
    const button = kazamaQuery('#kazama-theme-toggle');
    if (!button) return;
    const root = document.documentElement;
    const syncState = () => button.setAttribute('aria-pressed', String(root.dataset.theme === 'light'));
    syncState();
    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (error) { /* mode privat */ }
      syncState();
    });
  }

  // ---------------------------------------------------------------------------
  // PWA: service worker + tombol "Pasang aplikasi" (Windows, macOS, Linux, ChromeOS)
  // ---------------------------------------------------------------------------

  function kazamaRegisterServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  function kazamaBindInstallButton() {
    const button = kazamaQuery('#kazama-install');
    if (!button) return;
    let installPrompt = null;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installPrompt = event;
      button.hidden = false;
    });
    window.addEventListener('appinstalled', () => { button.hidden = true; installPrompt = null; });
    button.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      button.hidden = true;
    });
  }

  // ---------------------------------------------------------------------------
  // Video tutorial: poster dulu, iframe YouTube baru dimuat saat diklik (lebih ringan & privat)
  // ---------------------------------------------------------------------------

  function kazamaBindTutorialVideo() {
    const poster = kazamaQuery('#kazama-tutorial-player');
    if (!poster) return;
    poster.addEventListener('click', () => {
      const frame = kazamaElement('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${poster.dataset.videoId}?autoplay=1&rel=0`,
        title: 'Video tutorial DownloadIn',
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        allowfullscreen: true,
      });
      poster.replaceWith(frame);
    }, { once: true });
  }

  // ---------------------------------------------------------------------------
  // Riwayat (localStorage)
  // ---------------------------------------------------------------------------

  const kazamaHistory = {
    read() {
      try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (error) { return []; }
    },
    add(entry) {
      try {
        const list = this.read().filter((item) => item.url !== entry.url);
        list.unshift({ ...entry, ts: Date.now() });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
      } catch (error) { /* penyimpanan penuh / mode privat */ }
    },
    clear() {
      try { localStorage.removeItem(HISTORY_KEY); } catch (error) { /* abaikan */ }
    },
  };

  // ---------------------------------------------------------------------------
  // Info APK terbaru (satu APK untuk semua HP ARM)
  // ---------------------------------------------------------------------------

  async function kazamaLoadApkInfo() {
    const info = kazamaQuery('#kazama-apk-info');
    const button = kazamaQuery('#kazama-apk-btn');
    if (!info || !button) return;
    try {
      const response = await fetch('/api/android', { headers: KAZAMA_CLIENT_HEADERS });
      const data = await response.json();
      if (!data.ok) throw new Error('rilis tidak terbaca');
      if (!data.available || !data.apk.length) { info.textContent = 'APK belum dirilis. Segera hadir.'; return; }
      const apk = data.apk[0];
      button.href = apk.href;
      info.textContent = `Versi ${data.version} · ${kazamaFormatSize(apk.size)} · 64-bit & 32-bit`;
    } catch (error) {
      info.textContent = 'Tekan tombol di atas untuk mengunduh versi terbaru.';
    }
  }

  // ---------------------------------------------------------------------------
  // Tampilan hasil
  // ---------------------------------------------------------------------------

  function kazamaRenderOption(option, kind) {
    const subtitle = [option.ext && option.ext.toUpperCase(), option.codec, kazamaFormatSize(option.size)].filter(Boolean).join(' · ');
    return kazamaElement('li', null,
      kazamaElement('a', { class: `kazama-option kazama-option--${kind}`, href: kazamaWithDownloadFlag(option.url), download: option.filename, rel: 'nofollow' },
        kazamaElement('span', { class: 'kazama-option__label', text: option.label }),
        subtitle ? kazamaElement('span', { class: 'kazama-option__sub', text: subtitle }) : null,
        option.no_audio ? kazamaElement('span', { class: 'kazama-option__sub', text: 'tanpa suara' }) : null));
  }

  function kazamaRenderOptionGroup(title, iconName, options, kind) {
    return kazamaElement('div', { class: 'kazama-group' },
      kazamaElement('h4', null, kazamaIcon(iconName), title),
      kazamaElement('ul', { class: 'kazama-options' }, options.map((option) => kazamaRenderOption(option, kind))));
  }

  function kazamaRenderGallery(entry) {
    const files = [];
    const items = entry.gallery.map((item) => {
      const actions = [];
      if (item.image) { actions.push(kazamaElement('a', { href: kazamaWithDownloadFlag(item.image.url), download: item.image.filename }, 'Foto')); files.push(item.image); }
      if (item.video) { actions.push(kazamaElement('a', { href: kazamaWithDownloadFlag(item.video.url), download: item.video.filename }, item.type === 'live' ? 'Video' : 'Unduh')); files.push(item.video); }
      return kazamaElement('li', { class: 'kazama-shot' },
        kazamaElement('div', { class: 'kazama-shot__img' }, item.thumb ? kazamaElement('img', { src: item.thumb, alt: `Item ${item.index}`, loading: 'lazy' }) : null),
        kazamaElement('div', { class: 'kazama-shot__actions' }, actions));
    });

    const downloadAll = kazamaElement('button', { type: 'button', class: 'kazama-btn kazama-btn--primary' }, kazamaIcon('archive'), `Unduh semua (${files.length} file)`);
    downloadAll.addEventListener('click', async () => {
      kazamaToast('Mengunduh satu per satu. Izinkan unduhan ganda jika diminta browser.');
      for (const file of files) {
        const link = kazamaElement('a', { href: kazamaWithDownloadFlag(file.url), download: file.filename });
        document.body.append(link);
        link.click();
        link.remove();
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    });
    return kazamaElement('div', { class: 'kazama-group' },
      kazamaElement('h4', null, kazamaIcon('image'), `Galeri · ${entry.gallery.length} item`),
      downloadAll,
      kazamaElement('ul', { class: 'kazama-gallery' }, items));
  }

  function kazamaRenderEntry(entry, platform) {
    const meta = kazamaElement('div', { class: 'kazama-entry__meta' });
    if (platform && platform.name) meta.append(kazamaElement('span', { class: 'kazama-chip', text: platform.name }));
    if (entry.uploader) meta.append(kazamaElement('span', { class: 'kazama-chip', text: entry.uploader }));
    if (entry.duration) meta.append(kazamaElement('span', { class: 'kazama-chip', text: kazamaFormatDuration(entry.duration) }));
    if (entry.is_live) meta.append(kazamaElement('span', { class: 'kazama-chip', text: 'LIVE' }));

    const thumbnail = entry.thumbnail ? kazamaElement('img', { src: entry.thumbnail, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }) : null;
    const card = kazamaElement('article', { class: 'kazama-card kazama-entry' },
      kazamaElement('div', { class: 'kazama-entry__head' },
        kazamaElement('div', { class: 'kazama-entry__thumb' }, thumbnail),
        kazamaElement('div', { class: 'kazama-entry__info' }, kazamaElement('h3', { text: entry.title || 'Tanpa judul' }), meta)));

    if (entry.gallery && entry.gallery.length) card.append(kazamaRenderGallery(entry));
    if (entry.video && entry.video.length) card.append(kazamaRenderOptionGroup('Video', 'video', entry.video, 'video'));
    if (entry.audio && entry.audio.length) card.append(kazamaRenderOptionGroup('Audio', 'music', entry.audio, 'audio'));

    const needsServerProcessing = (entry.video || []).some((o) => o.mode === 'merge' || o.mode === 'hls') || (entry.audio || []).some((o) => o.mode === 'mp3');
    if (needsServerProcessing) {
      card.append(kazamaElement('div', { class: 'kazama-group' },
        kazamaElement('p', { class: 'kazama-notice', text: 'Video gabungan, HLS, dan MP3 diproses dulu di server. Unduhan baru mulai setelah proses selesai, jadi mohon tunggu.' })));
    }
    return card;
  }

  function kazamaRenderResult(container, data) {
    const cards = data.entries.map((entry) => kazamaRenderEntry(entry, data.platform));
    if (data.truncated) cards.push(kazamaElement('p', { class: 'kazama-notice', text: `Menampilkan ${data.count} dari ${data.total} item.` }));
    container.replaceChildren(...cards);
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function kazamaRenderError(container, error) {
    container.replaceChildren(kazamaElement('div', { class: 'kazama-card kazama-card--error', role: 'alert' },
      kazamaElement('h3', null, kazamaIcon('alert'), 'Belum bisa diunduh'),
      kazamaElement('p', null, error.message),
      error.detail ? kazamaElement('small', null, error.detail) : null));
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------------------
  // Form: tempel link -> ambil opsi unduhan
  // ---------------------------------------------------------------------------

  function kazamaLoadPlatforms() {
    try {
      return JSON.parse(kazamaQuery('#kazama-catalog-data').textContent).regions.flatMap((region) => region.platforms);
    } catch (error) {
      return [];
    }
  }

  function kazamaDetectPlatform(platforms, text) {
    const match = String(text).match(/https?:\/\/[^\s]+/i);
    if (!match) return null;
    let host;
    try { host = new URL(match[0]).hostname.toLowerCase(); } catch (error) { return null; }
    return platforms.find((platform) => platform.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) || null;
  }

  async function kazamaRequestExtract(text) {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...KAZAMA_CLIENT_HEADERS },
      body: JSON.stringify({ url: text }),
    });
    const data = await response.json().catch(() => ({ ok: false, error: 'Respons server tidak terbaca.' }));
    if (!response.ok || !data.ok) throw Object.assign(new Error(data.error || 'Gagal memproses link.'), { detail: data.detail });
    return data;
  }

  function kazamaBindHistoryDialog(form) {
    const dialog = kazamaQuery('#kazama-history-dialog');
    const openButton = kazamaQuery('#kazama-history-btn');
    if (!openButton) return;
    if (!dialog) { openButton.addEventListener('click', () => { location.href = '/'; }); return; }

    const renderList = () => {
      const list = kazamaQuery('#kazama-history-list');
      const items = kazamaHistory.read();
      list.replaceChildren(...(items.length ? items.map((item) => {
        const button = kazamaElement('button', { type: 'button' },
          kazamaElement('span', { text: item.title || item.url }),
          kazamaElement('small', { text: `${item.platform || 'Web'} · ${item.url}` }));
        button.addEventListener('click', () => { dialog.close(); form.fill(item.url); });
        return kazamaElement('li', null, button);
      }) : [kazamaElement('li', { class: 'kazama-empty', text: 'Belum ada riwayat. Link yang berhasil diproses muncul di sini.' })]));
    };

    openButton.addEventListener('click', () => { renderList(); dialog.showModal(); });
    kazamaQuery('#kazama-history-close').addEventListener('click', () => dialog.close());
    kazamaQuery('#kazama-history-clear').addEventListener('click', () => { kazamaHistory.clear(); renderList(); kazamaToast('Riwayat dihapus'); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }

  function kazamaBindExtractForm() {
    const form = kazamaQuery('#kazama-form');
    const input = kazamaQuery('#kazama-url');
    const submitButton = kazamaQuery('#kazama-go');
    const submitLabel = kazamaQuery('#kazama-go-label');
    const clearButton = kazamaQuery('#kazama-clear');
    const pasteButton = kazamaQuery('#kazama-paste');
    const result = kazamaQuery('#kazama-result');
    const detected = kazamaQuery('#kazama-detected');
    if (!form) return;

    const platforms = kazamaLoadPlatforms();
    let isBusy = false;

    const refreshDetection = () => {
      detected.replaceChildren();
      clearButton.hidden = !input.value;
      const platform = kazamaDetectPlatform(platforms, input.value);
      if (platform) {
        detected.append(kazamaElement('span', { class: 'kazama-chip kazama-chip--ok' },
          kazamaElement('img', { src: platform.logo, alt: '' }), `Terdeteksi: ${platform.name}`));
      }
    };

    const submit = async () => {
      const text = input.value.trim();
      if (!text) { kazamaToast('Tempel link dulu ya'); input.focus(); return; }
      if (isBusy) return;
      isBusy = true;
      submitButton.disabled = true;
      submitLabel.textContent = 'Memproses…';
      result.hidden = false;
      result.replaceChildren(kazamaElement('div', { class: 'kazama-card kazama-card--loading' },
        kazamaElement('span', { class: 'kazama-spinner' }), 'Membaca link, tunggu sebentar…'));
      try {
        const data = await kazamaRequestExtract(text);
        kazamaRenderResult(result, data);
        kazamaHistory.add({ url: data.url, title: data.title, platform: data.platform && data.platform.name });
      } catch (error) {
        kazamaRenderError(result, error);
      } finally {
        isBusy = false;
        submitButton.disabled = false;
        submitLabel.textContent = 'Ambil file';
      }
    };

    form.addEventListener('submit', (event) => { event.preventDefault(); submit(); });
    input.addEventListener('input', refreshDetection);
    clearButton.addEventListener('click', () => { input.value = ''; refreshDetection(); input.focus(); });
    pasteButton.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) { kazamaToast('Clipboard kosong'); return; }
        input.value = text;
        refreshDetection();
        submit();
      } catch (error) {
        kazamaToast('Izin clipboard ditolak. Tempel manual dengan Ctrl+V.');
        input.focus();
      }
    });

    // dipakai dialog riwayat dan parameter ?url=
    const api = { fill(url) { input.value = url; refreshDetection(); submit(); } };
    kazamaBindHistoryDialog(api);

    const sharedUrl = new URLSearchParams(location.search).get('url');
    if (sharedUrl) api.fill(sharedUrl);
  }

  // ---------------------------------------------------------------------------
  // Mulai
  // ---------------------------------------------------------------------------

  kazamaBindThemeToggle();
  kazamaBindInstallButton();
  kazamaRegisterServiceWorker();
  kazamaBindTutorialVideo();
  kazamaLoadApkInfo();
  kazamaBindExtractForm();
  if (!kazamaQuery('#kazama-form')) kazamaBindHistoryDialog({ fill() {} });
})();
