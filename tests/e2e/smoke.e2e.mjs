// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, startServer, newPage, horizontalOverflow, BASE } from './helpers.mjs';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); server?.kill(); });

const APP = BASE + 'app/index.html';
const ROLE_PATHS = {
  traveler: ['/t', '/t/journeys', '/t/journeys/j1', '/t/explore', '/t/report', '/t/notifications', '/t/profile'],
  partner: ['/p', '/p/locations', '/p/requests', '/p/verification'],
  coordinator: ['/c', '/c/journeys', '/c/barriers', '/c/packages', '/c/packages/p1', '/c/timeline', '/c/budget', '/c/reports'],
  verifier: ['/v', '/v/assigned', '/v/checklist'],
  admin: ['/a', '/a/users', '/a/orgs', '/a/audit']
};

test('company profile: dimuat, berlabel prototipe/fiktif, tanpa error JS', async () => {
  const page = await newPage(browser);
  await page.goto(BASE);
  assert.match(await page.title(), /LintasAkses/);
  await page.getByText('Kawasan Puspa', { exact: false }).first().waitFor();
  assert.equal(await page.locator('h1').count(), 1);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('aplikasi: setiap peran demo memuat semua halaman utama tanpa error', async () => {
  for (const [role, paths] of Object.entries(ROLE_PATHS)) {
    const page = await newPage(browser);
    await page.goto(`${APP}#/demo/${role}`);
    await page.locator('main h1').first().waitFor();
    for (const p of paths) {
      await page.evaluate(h => { location.hash = h; }, '#' + p);
      await page.locator('main h1').first().waitFor();
      const t = await page.locator('main h1').first().innerText();
      assert.ok(t.trim().length > 0, `${role} ${p}: h1 kosong`);
      assert.notEqual(t.trim(), 'Kesalahan', `${role} ${p}: halaman error`);
    }
    assert.deepEqual(page.errors, [], role);
    await page.context().close();
  }
});

test('localStorage korup ({"v":1}) tidak membuat aplikasi crash', async () => {
  const page = await newPage(browser, { init: () => { try { localStorage.setItem('lintasakses.demo.v2', '{"v":1}'); } catch (e) { /* abaikan */ } } });
  await page.goto(`${APP}#/demo/coordinator`);
  await page.locator('main h1').first().waitFor();
  assert.deepEqual(page.errors, []);
  const ok = await page.evaluate(() => JSON.parse(localStorage.getItem('lintasakses.demo.v2')).journeys.length);
  assert.equal(ok, 5);
  await page.context().close();
});

test('localStorage JSON rusak tidak membuat aplikasi crash', async () => {
  const page = await newPage(browser, { init: () => { try { localStorage.setItem('lintasakses.demo.v2', '{rusak'); } catch (e) { /* abaikan */ } } });
  await page.goto(`${APP}#/impact`);
  await page.locator('main h1').first().waitFor();
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
