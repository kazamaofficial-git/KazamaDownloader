/* DownloadIn — menerapkan tema terang/gelap sedini mungkin supaya halaman tidak berkedip. */
(function kazamaApplySavedTheme() {
  var storageKey = 'downloadin.theme';
  var saved = null;
  try { saved = localStorage.getItem(storageKey); } catch (error) { /* mode privat: abaikan */ }
  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersLight ? 'light' : 'dark'));
})();
