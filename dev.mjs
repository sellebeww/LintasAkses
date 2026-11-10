// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Server statis lokal untuk `npm run dev`. Otomatis pindah port jika terpakai. Tanpa dependensi.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2' };

const server = http.createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    let file = join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Tidak ditemukan'); }
});

const START = Number(process.env.PORT) || 8765;
let port = START;
server.on('error', e => {
  if (e.code === 'EADDRINUSE' && port < START + 20) { port++; server.listen(port); } else { console.error(e.message); process.exit(1); }
});
server.on('listening', () => {
  const url = `http://localhost:${port}/`;
  console.log(`\n  LintasAkses berjalan di ${url}\n  Tekan Ctrl+C untuk berhenti.\n`);
  if (process.env.NO_OPEN) return;
  const cmd = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
});
server.listen(port);
