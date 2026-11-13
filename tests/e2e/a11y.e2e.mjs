// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, startServer, newPage, horizontalOverflow, BASE } from './helpers.mjs';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); server?.kill(); });

const APP = BASE + 'app/index.html';

test('peta animasi: punya alternatif teks (nama + deskripsi) dan caption terlihat', async () => {
  const page = await newPage(browser);
  await page.goto(BASE);
  const svg = page.locator('#route-map');
  assert.equal(await svg.getAttribute('role'), 'img');
  assert.ok((await svg.getAttribute('aria-label')).length > 30);
  assert.equal(await svg.getAttribute('aria-describedby'), 'map-live');
  assert.ok((await page.locator('#map-live').innerText()).trim().length > 20);
  assert.equal(await page.locator('#map-live').getAttribute('aria-live'), null, 'caption yang berganti otomatis tidak boleh diumumkan terus-menerus');
  assert.ok(await page.locator('ul.legend').isVisible());
  await page.context().close();
});

test('peta animasi: tombol jeda dapat difokus dan dioperasikan dengan keyboard', async () => {
  const page = await newPage(browser);
  await page.goto(BASE);
  const btn = page.locator('#map-pause');
  await btn.focus();
  assert.equal(await btn.getAttribute('aria-pressed'), 'false');
  await page.keyboard.press('Enter');
  assert.equal(await btn.getAttribute('aria-pressed'), 'true');
  assert.equal((await btn.innerText()).trim(), 'Putar animasi');
  await page.keyboard.press('Space');
  assert.equal(await btn.getAttribute('aria-pressed'), 'false');
  await page.context().close();
});

test('peta animasi: jeda benar-benar menghentikan pergantian status', async () => {
  const page = await newPage(browser);
  await page.goto(BASE);
  await page.locator('#map-pause').click();
  const a = await page.locator('#map-live').innerText();
  await page.waitForTimeout(6500); // lebih lama dari dwell terpanjang (6,2 dtk) sejak jeda
  assert.equal(await page.locator('#map-live').innerText(), a);
  await page.context().close();
});

test('prefers-reduced-motion: animasi berhenti, status statis, tombol jeda disembunyikan', async () => {
  const page = await newPage(browser, { reducedMotion: 'reduce' });
  await page.goto(BASE);
  const a = await page.locator('#map-live').innerText();
  assert.equal(await page.locator('#map-pause').isHidden(), true);
  const st = await page.evaluate(() => ({
    mq: getComputedStyle(document.querySelector('.mq-track')).animationName,
    seg: getComputedStyle(document.querySelector('#s1')).strokeDashoffset
  }));
  assert.equal(st.mq, 'none');
  assert.equal(parseFloat(st.seg), 0);
  await page.waitForTimeout(5500);
  assert.equal(await page.locator('#map-live').innerText(), a, 'status tidak berganti sendiri');
  await page.context().close();
});

test('fokus keyboard: tautan lewati-konten dapat difokus, terlihat, dan beroutline', async () => {
  for (const url of [BASE, APP + '#/impact']) {
    const page = await newPage(browser);
    await page.goto(url);
    await page.keyboard.press('Tab');
    // Di aplikasi, fokus awal dipindah ke <main> (manajemen fokus rute), sehingga Tab pertama
    // berada setelahnya; tautan lewati diuji lewat fokus langsung.
    if (url !== BASE) { await page.keyboard.press('Shift+Tab'); await page.locator('.skip').focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); }
    await page.waitForTimeout(400); // tunggu transisi posisi tautan lewati (0,2 dtk)
    const f = await page.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); return { cls: e.className, href: e.getAttribute('href'), outline: cs.outlineStyle, w: parseFloat(cs.outlineWidth), top: e.getBoundingClientRect().top }; });
    assert.match(f.cls, /skip/);
    assert.equal(f.href, '#main');
    assert.notEqual(f.outline, 'none');
    assert.ok(f.w >= 2);
    assert.ok(f.top >= 0, 'tautan lewati terlihat saat fokus');
    await page.context().close();
  }
});

test('peta rute di aplikasi: node dapat dipilih dengan Enter/Spasi dan fokus tidak hilang', async () => {
  const page = await newPage(browser);
  await page.goto(`${APP}#/demo/traveler`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => { location.hash = '#/t/journeys/j1'; });
  const nodes = page.locator('.rm-n');
  await nodes.first().waitFor();
  assert.equal(await nodes.count(), 5);
  for (const n of ['name']) assert.ok((await nodes.nth(1).getAttribute('aria-label')).includes('Status:'), n);
  await nodes.nth(2).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.rm-n').nth(2).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'rm-j1s3', 'fokus tetap di node setelah render ulang');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('.rm-n').nth(2).getAttribute('aria-pressed'), 'true');
  await page.context().close();
});

test('360px: tanpa gulir horizontal (overflow-x body dinetralkan saat pengukuran)', async () => {
  const targets = [
    BASE, APP + '#/impact', APP + '#/login', APP + '#/demo', APP + '#/page/help'
  ];
  for (const u of targets) {
    const page = await newPage(browser, { width: 360, height: 740 });
    await page.goto(u);
    await page.waitForTimeout(300);
    assert.ok((await horizontalOverflow(page)) <= 0, `overflow di ${u}`);
    await page.context().close();
  }
  const ROLES = { traveler: ['/t', '/t/journeys', '/t/journeys/j1', '/t/explore', '/t/report'], partner: ['/p', '/p/requests'], coordinator: ['/c', '/c/barriers', '/c/packages/p1', '/c/timeline', '/c/budget', '/c/reports'], verifier: ['/v', '/v/assigned'], admin: ['/a', '/a/users', '/a/audit'] };
  for (const [role, paths] of Object.entries(ROLES)) {
    const page = await newPage(browser, { width: 360, height: 740 });
    await page.goto(`${APP}#/demo/${role}`);
    for (const p of paths) {
      await page.evaluate(h => { location.hash = h; }, '#' + p);
      await page.locator('main h1').first().waitFor();
      await page.waitForTimeout(150);
      assert.ok((await horizontalOverflow(page)) <= 0, `overflow ${role} ${p}`);
    }
    await page.context().close();
  }
});

test('nama aksesibel: tombol/tautan ikon dan kontrol form punya label', async () => {
  const page = await newPage(browser);
  await page.goto(`${APP}#/demo/traveler`);
  for (const p of ['/t', '/t/report', '/t/journeys']) {
    await page.evaluate(h => { location.hash = h; }, '#' + p);
    await page.locator('main h1').first().waitFor();
    const bad = await page.evaluate(() => {
      const name = e => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.textContent || [...e.querySelectorAll('img[alt]')].map(i => i.alt).join('') || e.value || '').trim();
      const out = [];
      document.querySelectorAll('button,a[href]').forEach(e => { if (!name(e)) out.push(e.outerHTML.slice(0, 80)); });
      document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(e => { if (!e.labels?.length && !e.getAttribute('aria-label')) out.push(e.outerHTML.slice(0, 80)); });
      return out;
    });
    assert.deepEqual(bad, [], p);
  }
  await page.context().close();
});

test('kontras: lencana jumlah notifikasi memenuhi 4,5:1', async () => {
  const page = await newPage(browser);
  await page.goto(`${APP}#/demo/traveler`);
  await page.locator('.cnt').first().waitFor();
  const ratio = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.cnt'));
    const p = c => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const L = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const a = L(p(cs.color)), b = L(p(cs.backgroundColor));
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
  assert.ok(ratio >= 4.5, 'rasio ' + ratio.toFixed(2));
  await page.context().close();
});
