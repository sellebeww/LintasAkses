// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from './harness.mjs';

const { M } = loadModel();
const db = M.db;
const dup = (arr, f = x => x.id) => { const s = new Set(); return arr.map(f).filter(i => s.size === s.add(i).size); };

test('tidak ada id ganda per koleksi', () => {
  for (const k of ['users', 'orgs', 'locations', 'journeys', 'barriers', 'packages', 'commitments', 'verifs', 'tests', 'notifs', 'logs']) {
    assert.equal(dup(db[k]).length, 0, `${k}: ${dup(db[k])}`);
  }
  assert.equal(dup(db.journeys.flatMap(j => j.segs)).length, 0, 'id segmen');
});

test('referensi antar-entitas valid', () => {
  const ids = k => new Set(db[k].map(x => x.id));
  const [users, orgs, journeys, barriers, pkgs, commits] = ['users', 'orgs', 'journeys', 'barriers', 'packages', 'commitments'].map(ids);
  const segs = new Set(db.journeys.flatMap(j => j.segs.map(s => s.id)));
  const bad = [];
  const chk = (ok, msg) => { if (!ok) bad.push(msg); };
  db.users.forEach(u => u.orgId && chk(orgs.has(u.orgId), `user ${u.id}.orgId`));
  db.locations.forEach(l => chk(orgs.has(l.orgId), `loc ${l.id}.orgId`));
  db.journeys.forEach(j => { chk(users.has(j.userId), `journey ${j.id}.userId`); j.segs.forEach(s => s.orgId && chk(orgs.has(s.orgId), `seg ${s.id}.orgId`)); });
  db.barriers.forEach(b => {
    chk(journeys.has(b.journeyId), `${b.id}.journeyId`); chk(segs.has(b.segId), `${b.id}.segId`);
    chk(M.segOf(M.journey(b.journeyId), b.segId), `${b.id}: segmen bukan milik perjalanannya`);
    chk(orgs.has(b.orgId), `${b.id}.orgId`); chk(users.has(b.reporterId), `${b.id}.reporterId`);
    chk(!b.pkgId || pkgs.has(b.pkgId), `${b.id}.pkgId`); chk(M.BSTAT.includes(b.status), `${b.id}.status`); chk(M.CATS.includes(b.cat), `${b.id}.cat`);
    chk(b.hist.length > 0, `${b.id}.hist`);
  });
  db.packages.forEach(p => { chk(journeys.has(p.journeyId), `${p.id}.journeyId`); chk(users.has(p.owner), `${p.id}.owner`); });
  db.commitments.forEach(c => { chk(pkgs.has(c.pkgId), `${c.id}.pkgId`); chk(barriers.has(c.barrierId), `${c.id}.barrierId`); chk(orgs.has(c.orgId), `${c.id}.orgId`); chk(M.barrier(c.barrierId).pkgId === c.pkgId, `${c.id}: pkg tidak cocok dengan hambatan`); chk(M.PROGRESS.includes(c.progress), `${c.id}.progress`); });
  db.verifs.forEach(v => { chk(barriers.has(v.barrierId), `${v.id}.barrierId`); chk(commits.has(v.commitId), `${v.id}.commitId`); chk(pkgs.has(v.pkgId), `${v.id}.pkgId`); chk(users.has(v.verifierId), `${v.id}.verifierId`); chk(segs.has(v.segId), `${v.id}.segId`); });
  db.tests.forEach(t => { chk(journeys.has(t.journeyId), `${t.id}.journeyId`); chk(users.has(t.userId), `${t.id}.userId`); });
  assert.equal(bad.length, 0, bad.join('\n'));
});

test('kebutuhan akses pada preferensi/perjalanan ada di daftar NEEDS', () => {
  const all = new Set(Object.values(M.NEEDS).flat());
  const bad = [...db.users.flatMap(u => u.prefs || []), ...db.journeys.flatMap(j => j.needs)].filter(n => !all.has(n));
  assert.equal(bad.length, 0, bad.join('\n'));
});

test('kategori hambatan ada di CATS; prioritas dikenal', () => {
  const pr = new Set(['Kritis', 'Tinggi', 'Sedang', 'Rendah']);
  db.barriers.forEach(b => { assert.ok(M.CATS.includes(b.cat)); assert.ok(pr.has(b.priority), b.id); });
});

test('data seed tetap berlabel fiktif (tidak ada domain/identitas nyata)', () => {
  const emails = db.users.map(u => u.email).concat(db.orgs.map(o => o.email));
  for (const e of emails) assert.match(e, /\.(demo|lintasakses\.id)$/, e);
  for (const l of db.locations) assert.match(l.addr, /fiktif/, l.id);
});

test('anggaran: angka non-negatif dan konsisten', () => {
  for (const p of db.packages) {
    for (const k of ['improvement', 'coordination', 'verification', 'approved', 'actual']) assert.ok(p.budget[k] >= 0, `${p.id}.${k}`);
  }
  for (const c of db.commitments) assert.ok(c.cost >= 0);
});

test('seed deterministik: dua pemuatan menghasilkan data identik', () => {
  assert.equal(JSON.stringify(loadModel().M.db), JSON.stringify(loadModel().M.db));
});
