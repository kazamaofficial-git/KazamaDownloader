'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { gate } = require('../src/gate');

const run = (headers) => {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  let status = 200; let nexted = false;
  const res = { status(c) { status = c; return this; }, json() { return this; } };
  gate({ get: (k) => lower[k.toLowerCase()] }, res, () => { nexted = true; });
  return { status, nexted };
};

test('gerbang: kunci benar lolos, salah/kosong ditolak', () => {
  const key = Buffer.from('RExJTkFQUC0xMTEwMjU=', 'base64').toString();
  assert.equal(run({ 'X-KD-Key': key }).nexted, true);
  assert.equal(run({ 'X-KD-Key': 'salah' }).status, 403);
  assert.equal(run({}).status, 403);
});
