// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Pembantu e2e: server statis lokal (dev.mjs) + Playwright Chromium.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url); // menghormati NODE_PATH bila playwright terpasang global
export const { chromium } = require('playwright');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const PORT = 8791;
export const BASE = `http://127.0.0.1:${PORT}/`;

export function startServer() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ['dev.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NO_OPEN: '1' } });
    const t = setTimeout(() => reject(new Error('server tidak siap')), 10000);
    p.stdout.on('data', d => { if (String(d).includes('berjalan di')) { clearTimeout(t); resolve(p); } });
    p.on('error', reject);
  });
}

// Konteks deterministik: locale/zona waktu tetap, font web diblokir (tanpa jaringan eksternal).
export async function newPage(browser, { width = 1280, height = 800, reducedMotion = 'no-preference', init } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion, locale: 'id-ID', timezoneId: 'UTC', serviceWorkers: 'block' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  return page;
}

// Lebar konten melebihi viewport? Diuji dengan overflow-x body dinetralkan agar tidak tertutup.
export async function horizontalOverflow(page) {
  return page.evaluate(() => {
    document.body.style.setProperty('overflow-x', 'visible', 'important');
    const de = document.documentElement;
    const over = de.scrollWidth - de.clientWidth;
    document.body.style.removeProperty('overflow-x');
    return over;
  });
}
