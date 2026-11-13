// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Pemeriksaan sintaks semua file JS (pengganti lint ringan, tanpa dependensi).
import { readdirSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const skip = new Set(['node_modules', '.git', 'docs', 'test-results', 'playwright-report']);
const files = [];
(function walk(d) {
  for (const n of readdirSync(d).sort()) {
    if (skip.has(n)) continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p); else if (['.js', '.mjs'].includes(extname(n))) files.push(p);
  }
})(root);

let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) { bad++; console.error(r.stderr); }
}
console.log(`${files.length} file diperiksa, ${bad} bermasalah.`);
process.exit(bad ? 1 : 0);
