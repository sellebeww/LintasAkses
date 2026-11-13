// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModel, fakeStorage, KEY } from './harness.mjs';

test('pemuatan pertama: seed disimpan ke localStorage', () => {
  const { M, storage } = loadModel();
  const raw = storage.getItem(KEY);
  assert.ok(raw);
  assert.equal(JSON.parse(raw).v, 1);
  assert.equal(M.db.journeys.length, 5);
});

test('data valid di localStorage dimuat ulang apa adanya', () => {
  const a = loadModel();
  a.M.db.users[0].name = 'Nama Diubah';
  a.M.save();
  const b = loadModel(a.storage);
  assert.equal(b.M.db.users[0].name, 'Nama Diubah');
});

test('perubahan persisten setelah aksi model', () => {
  const a = loadModel();
  a.M.setBarrierStatus('BR-0006', 'Sedang ditinjau', '', { name: 'x', role: 'coordinator' });
  const b = loadModel(a.storage);
  assert.equal(b.M.barrier('BR-0006').status, 'Sedang ditinjau');
});

for (const [nama, isi] of [
  ['JSON rusak', '{not json'],
  ['string kosong', ''],
  ['null', 'null'],
  ['versi tidak cocok', JSON.stringify({ v: 99 })],
  ['array', '[]'],
  ['angka', '42']
]) {
  test(`data korup (${nama}) tidak membuat model crash dan kembali ke seed`, () => {
    const { M, storage } = loadModel(fakeStorage({ [KEY]: isi }));
    assert.equal(M.db.v, 1);
    assert.equal(M.db.journeys.length, 5);
    assert.equal(JSON.parse(storage.getItem(KEY)).v, 1, 'seed ditulis ulang');
  });
}

test('storage diblokir saat baca: tetap berjalan dari seed di memori', () => {
  const { M } = loadModel(fakeStorage({}, { throwOnGet: true }));
  assert.equal(M.db.journeys.length, 5);
});

test('storage diblokir saat tulis (kuota/privat): aksi tetap berhasil di memori', () => {
  const { M } = loadModel(fakeStorage({}, { throwOnSet: true }));
  assert.equal(M.setBarrierStatus('BR-0006', 'Sedang ditinjau', '', { name: 'x', role: 'coordinator' }), null);
  assert.equal(M.barrier('BR-0006').status, 'Sedang ditinjau');
});

test('reset() mengembalikan data awal', () => {
  const { M } = loadModel();
  M.db.journeys.length = 0; M.save();
  M.reset();
  assert.equal(M.db.journeys.length, 5);
});
