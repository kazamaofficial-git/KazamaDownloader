'use strict';
const data = require('./platforms.json');

const PLATFORMS = data.platforms;
const REGIONS = data.regions;

const index = new Map();
for (const p of PLATFORMS) for (const d of p.domains) index.set(d, p);

/** Cocokkan platform dari domain (v.qq.com -> qq.com dst). */
function detectPlatform(url) {
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return null; }
  const parts = host.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const hit = index.get(parts.slice(i).join('.'));
    if (hit) return hit;
  }
  return null;
}

function catalog() {
  return {
    regions: Object.entries(REGIONS).map(([id, meta]) => ({
      id, ...meta,
      platforms: PLATFORMS.filter((p) => p.region === id)
        .map(({ id: pid, name, color, note, domains, logo }) => ({ id: pid, name, color, note, domains, logo })),
    })),
    total_featured: PLATFORMS.length,
    engine_sites: '1700+',
  };
}

module.exports = { PLATFORMS, REGIONS, detectPlatform, catalog };
