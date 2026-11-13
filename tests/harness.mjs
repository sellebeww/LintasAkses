// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Memuat app/data.js (IIFE yang mengisi window.M) di Node dengan localStorage tiruan.
// Waktu dibekukan agar seed deterministik.
process.env.TZ = 'UTC';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FIXED_NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const SRC = readFileSync(fileURLToPath(new URL('../app/data.js', import.meta.url)), 'utf8');

export function fakeStorage(initial = {}, opts = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => { if (opts.throwOnGet) throw new Error('blocked'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (opts.throwOnSet) throw new Error('quota'); m.set(k, String(v)); },
    removeItem: k => m.delete(k),
    _map: m
  };
}

export function loadModel(storage = fakeStorage()) {
  const RealDate = Date;
  class FrozenDate extends RealDate {
    constructor(...a) { a.length ? super(...a) : super(FIXED_NOW); }
    static now() { return FIXED_NOW; }
  }
  const win = {};
  const ctx = vm.createContext({ window: win, localStorage: storage, Date: FrozenDate, console, JSON, Math, Object, Array, String, Number, parseInt, Set, Map });
  vm.runInContext(SRC, ctx, { filename: 'app/data.js' });
  return { M: win.M, storage };
}
export const KEY = 'lintasakses.demo.v2';
