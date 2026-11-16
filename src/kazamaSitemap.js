'use strict';
// DownloadIn — pembuat sitemap.xml dan robots.txt (fungsi murni agar mudah dites).

const KAZAMA_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/ios', changefreq: 'monthly', priority: '0.6' },
  { path: '/lisensi', changefreq: 'yearly', priority: '0.2' },
];

const kazamaEscapeXml = (text) =>
  String(text).replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));

function kazamaVideoEntry({ id, title, description }) {
  return [
    '    <video:video>',
    `      <video:thumbnail_loc>https://i.ytimg.com/vi/${kazamaEscapeXml(id)}/hqdefault.jpg</video:thumbnail_loc>`,
    `      <video:title>${kazamaEscapeXml(title)}</video:title>`,
    `      <video:description>${kazamaEscapeXml(description)}</video:description>`,
    `      <video:player_loc>https://www.youtube.com/embed/${kazamaEscapeXml(id)}</video:player_loc>`,
    '    </video:video>',
  ].join('\n');
}

/** Sitemap halaman publik; halaman beranda memuat entri video tutorial. */
function kazamaBuildSitemap({ baseUrl, lastModified, tutorial }) {
  const origin = baseUrl.replace(/\/+$/, '');
  const urls = KAZAMA_PAGES.map((page) => {
    const lines = [
      '  <url>',
      `    <loc>${kazamaEscapeXml(origin + page.path)}</loc>`,
      `    <lastmod>${lastModified}</lastmod>`,
      `    <changefreq>${page.changefreq}</changefreq>`,
      `    <priority>${page.priority}</priority>`,
    ];
    if (page.path === '/' && tutorial) lines.push(kazamaVideoEntry(tutorial));
    lines.push('  </url>');
    return lines.join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

function kazamaBuildRobots({ baseUrl }) {
  const origin = baseUrl.replace(/\/+$/, '');
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /download/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}

module.exports = { kazamaBuildSitemap, kazamaBuildRobots, KAZAMA_PAGES };
