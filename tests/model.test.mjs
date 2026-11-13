// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModel, fakeStorage, KEY } from './harness.mjs';

const actor = { name: 'Uji', role: 'coordinator', id: 'u3' };

test('status perjalanan diturunkan dari data (seed)', () => {
  const { M } = loadModel();
  const st = id => M.journeyStatus(M.journey(id));
  assert.equal(st('j1'), 3, 'j1: hambatan terbuka + komitmen diterima = perbaikan berlangsung');
  assert.equal(st('j2'), 2, 'j2: hambatan terbuka tanpa komitmen = terhambat');
  assert.equal(st('j4'), 5, 'j4: semua terverifikasi + uji berhasil');
  assert.equal(st('j5'), 1, 'j5: belum dinilai (assessed:false di seed)');
  const j = M.journey('j5'); j.assessed = true;
  assert.equal(M.journeyStatus(j), 2, 'setelah dinilai, hambatan terbuka tanpa komitmen');
});

test('perjalanan tanpa hambatan terbuka dan tanpa uji = siap uji (4)', () => {
  const { M } = loadModel();
  M.db.barriers.filter(b => b.journeyId === 'j2').forEach(b => { b.status = 'Terverifikasi'; });
  assert.equal(M.journeyStatus(M.journey('j2')), 4);
});

test('segState mengikuti status hambatan', () => {
  const { M } = loadModel();
  const j = M.journey('j1');
  assert.equal(M.segState(j, M.segOf(j, 'j1s1')), 'unassessed', 'tanpa catatan kondisi');
  M.segOf(j, 'j1s1').cond = 'Pintu keluar rata.';
  assert.equal(M.segState(j, M.segOf(j, 'j1s1')), 'clear');
  assert.equal(M.segState(j, M.segOf(j, 'j1s2')), 'barrier');
  assert.equal(M.segState(j, M.segOf(j, 'j1s3')), 'planned');
  assert.equal(M.segState(j, M.segOf(j, 'j1s5')), 'awaiting');
  assert.equal(M.segState(M.journey('j4'), M.segOf(M.journey('j4'), 'j4s2')), 'verified');
});

test('transisi status hambatan: hanya yang diizinkan', () => {
  const { M } = loadModel();
  assert.match(M.setBarrierStatus('BR-0006', 'Terverifikasi', '', actor), /tidak diizinkan/);
  assert.equal(M.barrier('BR-0006').status, 'Terkirim');
  assert.equal(M.setBarrierStatus('BR-0006', 'Sedang ditinjau', '', actor), null);
  assert.equal(M.barrier('BR-0006').status, 'Sedang ditinjau');
  assert.match(M.setBarrierStatus('BR-0006', 'Ditolak', '   ', actor), /Alasan penolakan/);
  assert.equal(M.setBarrierStatus('BR-0006', 'Ditolak', 'Duplikat', actor), null);
  assert.equal(M.barrier('BR-0006').reason, 'Duplikat');
  assert.match(M.setBarrierStatus('BR-9999', 'Ditolak', 'x', actor), /tidak ditemukan/);
});

test('status akhir (Terverifikasi/Ditolak) tidak punya transisi keluar', () => {
  const { M } = loadModel();
  assert.equal(M.TRANS['Terverifikasi'].length, 0);
  assert.equal(M.TRANS['Ditolak'].length, 0);
  for (const [from, tos] of Object.entries(M.TRANS)) for (const to of tos) assert.ok(M.BSTAT.includes(to), `${from} → ${to}`);
});

test('submitReport: id berurutan, notifikasi, log', () => {
  const { M } = loadModel();
  const u = M.user('u1');
  const b = M.submitReport({ journeyId: 'j1', segId: 'j1s2', cat: 'Trotoar tidak rata', desc: 'x', impact: 'y', vis: 'Privat' }, u);
  assert.equal(b.id, 'BR-0015');
  assert.equal(b.orgId, 'o3');
  assert.equal(b.status, 'Terkirim');
  assert.equal(M.db.barriers[0].id, 'BR-0015');
  assert.equal(M.db.logs[0].action, 'Mengirim laporan BR-0015');
});

test('createPackage hanya menerima hambatan berstatus Diterima', () => {
  const { M } = loadModel();
  const u = M.user('u3');
  const bad = M.createPackage({ title: 'T', desc: '', journeyId: 'j2', outcome: '', priority: 'Tinggi', barrierIds: ['BR-0005'], start: null, end: null, improvement: 1, coordination: 1, verification: 1 }, u);
  assert.match(bad.err, /BR-0005 harus berstatus Diterima/);
  const ok = M.createPackage({ title: 'T', desc: '', journeyId: 'j1', outcome: '', priority: 'Tinggi', barrierIds: ['BR-0001'], start: null, end: null, improvement: 1, coordination: 1, verification: 1 }, u);
  assert.ok(ok.id);
  assert.equal(M.barrier('BR-0001').status, 'Perbaikan direncanakan');
  assert.equal(M.barrier('BR-0001').pkgId, ok.id);
});

test('respond: validasi alasan, dan status komitmen', () => {
  const { M } = loadModel();
  const u = M.user('u2');
  assert.match(M.respond('c1', 'decline', '', u), /Alasan/);
  assert.match(M.respond('c1', 'alt', '', u), /alternatif/);
  assert.equal(M.respond('c1', 'accept', '', u), null);
  assert.equal(M.commit('c1').status, 'Diterima');
  assert.match(M.respond('c1', 'accept', '', u), /sudah direspons/);
});

test('submitVerif: aturan hasil Terverifikasi', () => {
  const { M } = loadModel();
  const u = M.user('u4');
  const base = { checklist: { m1: { a: 'Sesuai' } }, method: 'Kunjungan lapangan', notes: 'ok', followup: '', evidence: ['f.jpg'], result: 'Terverifikasi' };
  assert.match(M.submitVerif('vf1', { ...base, checklist: {} }, u), /minimal satu item/);
  assert.match(M.submitVerif('vf1', { ...base, method: '' }, u), /Metode/);
  assert.match(M.submitVerif('vf1', { ...base, notes: ' ' }, u), /Observasi/);
  assert.match(M.submitVerif('vf1', { ...base, evidence: [] }, u), /bukti foto/);
  assert.match(M.submitVerif('vf1', { ...base, checklist: { m1: { a: 'Perlu perbaikan' } } }, u), /Needs Improvement/);
  assert.match(M.submitVerif('vf1', { ...base, checklist: { m1: { a: 'Tidak berlaku' } } }, u), /benar-benar diverifikasi/);
  assert.equal(M.barrier('BR-0004').status, 'Selesai, menunggu verifikasi', 'penolakan validasi tidak mengubah data');
  assert.equal(M.submitVerif('vf1', base, u), null);
  assert.equal(M.barrier('BR-0004').status, 'Terverifikasi');
  assert.equal(M.commit('c3').status, 'Selesai');
});

test('submitTest: validasi', () => {
  const { M } = loadModel();
  const u = M.user('u1');
  assert.match(M.submitTest('j1', { walked: false, needs: ['a'], feedback: 'f' }, u), /menempuh/);
  assert.match(M.submitTest('j1', { walked: true, needs: [], feedback: 'f' }, u), /kebutuhan akses/);
  assert.match(M.submitTest('j1', { walked: true, needs: ['a'], feedback: ' ' }, u), /Umpan balik/);
  assert.equal(M.submitTest('j1', { walked: true, needs: ['a'], result: 'success', feedback: 'f' }, u), null);
});

test('validated() dan costPerValidated() dari seed', () => {
  const { M } = loadModel();
  assert.equal(M.validated().length, 1);
  const c = M.costPerValidated();
  assert.equal(c.n, 1);
  assert.equal(c.spend, 48e6);
  assert.equal(c.value, 48e6);
});

test('pkgProgress dan committed berada dalam rentang valid', () => {
  const { M } = loadModel();
  for (const p of M.db.packages) {
    const v = M.pkgProgress(p);
    assert.ok(Number.isFinite(v) && v >= 0 && v <= 100, `${p.id}: ${v}`);
  }
  assert.equal(M.committed(M.pkg('p1')), 60e6 + 25e6 + 15e6);
});

test('phase() menghasilkan indeks tahap yang valid', () => {
  const { M } = loadModel();
  for (const p of M.db.packages) assert.ok(M.phase(p) >= 0 && M.phase(p) < M.PHASES.length);
});

test('isStale memakai waktu yang dibekukan', () => {
  const { M } = loadModel();
  assert.equal(M.isStale(new Date(Date.UTC(2024, 0, 1)).toISOString()), true);
  assert.equal(M.isStale(new Date(Date.UTC(2026, 0, 1)).toISOString()), false);
  assert.ok(!M.isStale(null));
});

test('deleteJourney, createJourney: id unik', () => {
  const { M } = loadModel();
  const u = M.user('u1');
  const id = M.createJourney({ title: 'A → B', from: 'A', to: 'B', desc: '', needs: [], segs: [{ type: 'walking', name: 's1' }, { type: 'destination', name: 's2' }] }, u);
  assert.equal(id, 'j6');
  assert.equal(M.journey(id).segs[1].id, 'j6s2');
  M.deleteJourney(id, u);
  assert.equal(M.journey(id), undefined);
});
