'use strict';
// Token bertanda tangan HMAC-SHA256: base64url(payload).base64url(sig)
const crypto = require('node:crypto');
const { signingKey, tokenTtlSec } = require('./config');

class TokenError extends Error {}

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const mac = (body) => crypto.createHmac('sha256', signingKey).update(body).digest('base64url');

function sign(payload, ttl = tokenTtlSec) {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttl }));
  return `${body}.${mac(body)}`;
}

function verify(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) throw new TokenError('Token tidak valid.');
  const good = Buffer.from(mac(body));
  const got = Buffer.from(sig);
  if (good.length !== got.length || !crypto.timingSafeEqual(good, got)) {
    throw new TokenError('Token tidak valid.');
  }
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString()); }
  catch { throw new TokenError('Token rusak.'); }
  if (!payload.exp || payload.exp < Date.now() / 1000) {
    throw new TokenError('Link unduhan sudah kedaluwarsa. Proses ulang link-nya.');
  }
  return payload;
}

module.exports = { sign, verify, TokenError };
