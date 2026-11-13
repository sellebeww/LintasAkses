// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModel, fakeStorage, KEY } from './harness.mjs';

test('JSON dengan v:1 tetapi struktur tidak lengkap ditolak dan diganti seed', () => {
  // v === 1 lolos pemeriksaan versi, lalu field array hilang.
  const { M } = loadModel(fakeStorage({ [KEY]: JSON.stringify({ v: 1 }) }));
  assert.equal(M.db.v, 1);
  assert.ok(Array.isArray(M.db.users), 'db harus divalidasi struktur minimalnya, bukan hanya versinya');
  assert.doesNotThrow(() => M.journeyStatus({ id: 'x', assessed: true }));
});

test('koleksi bukan array (mis. users: {}) juga ditolak', () => {
  const rusak = { ...loadModel().M.db, users: {} };
  const { M } = loadModel(fakeStorage({ [KEY]: JSON.stringify(rusak) }));
  assert.ok(Array.isArray(M.db.users));
  assert.equal(M.db.users.length, 9);
});
