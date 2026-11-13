<div align="center">

<img src="assets/logo/logo-full.png" alt="LintasAkses" width="320">

### Every Journey, Within Reach.

<p>Platform koordinasi perjalanan akses ujung ke ujung: memetakan hambatan, mengoordinasikan perbaikan lintas mitra, dan memverifikasi bahwa perjalanan benar-benar bisa dilalui.</p>

<p><img src="https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=white&labelColor=3a3f47" alt="JavaScript ES Modules"> <img src="https://img.shields.io/badge/Node.js-dev%20server-339933?logo=nodedotjs&logoColor=white&labelColor=3a3f47" alt="Node.js dev server"> <img src="https://img.shields.io/badge/mode-prototipe%20%28data%20fiktif%29-d4a017?labelColor=3a3f47" alt="mode prototipe (data fiktif)"> <img src="https://img.shields.io/badge/license-All%20rights%20reserved-1e3a8a?labelColor=3a3f47" alt="license All rights reserved"></p>

<p><a href="https://lintasakses.vercel.app"><b>Lihat demo langsung &rarr;</b></a></p>
</div>

<p align="center">
  <img src="docs/screenshots/01-hero.jpg" alt="Halaman utama LintasAkses dengan peta rute animasi" width="900">
</p>

> **Prototipe.** Seluruh data berasal dari wilayah fiktif "Kawasan Puspa" dan tersimpan di `localStorage` browser. Tidak ada server, pembayaran, atau peta langsung.

## Kenapa LintasAkses?

Satu fasilitas aksesibel belum tentu membuat seluruh perjalanan aksesibel. Museum boleh punya toilet ramah kursi roda, tetapi bila penyeberangan menuju pintunya tidak punya ramp kerb, perjalanan tetap berhenti di sana. LintasAkses memperlakukan **perjalanan utuh** sebagai satuan kerja, bukan satu lokasi.

<p align="center">
  <img src="docs/screenshots/02-masalah.jpg" alt="Simulasi interaktif: perjalanan lima segmen terhenti di satu hambatan" width="900">
</p>

## Fitur utama

### Satu platform, lima peran

Pelancong, Mitra Lokasi, Koordinator Proyek, Verifikator, dan Administrator masing-masing punya dasbor sendiri. Pilih akun demo tanpa kata sandi, lalu berganti peran kapan saja dari menu samping.

<p align="center">
  <img src="docs/screenshots/05-pilih-akun.jpg" alt="Pemilihan akun demo untuk lima peran" width="900">
</p>

<p align="center">
  <img src="docs/screenshots/03-peran.jpg" alt="Ringkasan dasbor per peran" width="900">
</p>

### Pelancong: rencanakan tanpa menebak-nebak

Susun perjalanan per segmen, pilih kebutuhan akses tanpa menyebut diagnosis, lapor hambatan dengan bukti, dan ikut menguji perjalanan setelah diverifikasi.

<p align="center">
  <img src="docs/screenshots/06-pelancong.jpg" alt="Dasbor pelancong" width="900">
</p>

### Koordinator: satukan banyak pihak dalam satu rencana

Kelompokkan hambatan lintas segmen menjadi paket perbaikan, tugaskan mitra, pantau jadwal bergaya Gantt dan anggaran ilustratif, lalu hasilkan laporan dampak (PDF/CSV).

<p align="center">
  <img src="docs/screenshots/07-koordinator-jadwal.jpg" alt="Jadwal proyek bergaya Gantt" width="900">
</p>

<p align="center">
  <img src="docs/screenshots/08-koordinator-hambatan.jpg" alt="Kelola hambatan aksesibilitas" width="900">
</p>

### Verifikasi independen dan dasbor dampak

Verifikator mengisi daftar periksa terstruktur dengan bukti foto, lalu memutuskan: terverifikasi, sebagian, tidak, atau uji ulang. Hasilnya tampil di dasbor dampak publik.

<p align="center">
  <img src="docs/screenshots/10-dasbor-dampak.jpg" alt="Dasbor dampak publik" width="900">
</p>

## Menjalankan

Butuh Node.js 22 saja, tanpa install dependensi dan tanpa build step.

```bash
npm run dev
```

Lalu buka:

| Alamat | Isi |
|---|---|
| `http://localhost:8765/` | Company profile |
| `http://localhost:8765/app/index.html#/demo` | Pilih akun demo |
| `http://localhost:8765/app/index.html#/impact` | Dasbor dampak publik |

Port pindah otomatis bila terpakai. Untuk mengatur ulang data demo, buka menu **Atur ulang data demo** di aplikasi.

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server statis lokal (`dev.mjs`) |
| `npm run check` | Pemeriksaan sintaks semua file `.js`/`.mjs` |
| `npm test` | Tes unit (`node:test`, tanpa dependensi) |
| `npm run test:e2e` | Tes e2e Playwright Chromium (lihat di bawah) |

## Tes

- **Unit** (`tests/*.test.mjs`): memuat `app/data.js` di Node dengan `localStorage` tiruan, waktu dibekukan, dan `TZ=UTC`. Mencakup status perjalanan dan segmen, mesin status hambatan, validasi verifikasi dan uji pengguna, penyimpanan (termasuk data korup dan storage diblokir), serta integritas data fiktif (id unik, referensi valid).
- **E2E** (`tests/e2e/*.e2e.mjs`): smoke semua halaman peran, tanpa gulir horizontal di 360px, `prefers-reduced-motion`, fokus keyboard, alternatif teks peta, dan data `localStorage` korup. Butuh paket `playwright` (alat tes, tidak masuk `package.json`):

  ```bash
  npm install --no-save playwright@1.63.0
  npx playwright install chromium
  npm run test:e2e
  ```

CI (`.github/workflows/ci.yml`) menjalankan sintaks, tes unit, e2e, dan pemeriksaan penyajian situs pada Node 22.

## Struktur

| Bagian | File |
|---|---|
| Company profile (animasi) | `index.html`, `assets/profile.css`, `assets/profile.js` |
| Aplikasi lima peran + dasbor dampak | `app/` (hash-router, vanilla JS; model dan data di `app/data.js`) |
| Logo transparan | `assets/logo/` |
| Server statis lokal | `dev.mjs` |
| Tes dan skrip bantu | `tests/`, `scripts/` |
| Audit | `docs/AUDIT.md` |

## Catatan jujur

- Semua data fiktif dan hanya tersimpan di browser Anda.
- Verifikasi adalah penilaian internal, bukan sertifikasi pemerintah.
- Angka anggaran bersifat ilustratif.
- Tidak ada server, pembayaran, peta langsung, atau unggah berkas nyata (bukti hanya nama berkas).
- Data tersimpan di satu kunci `localStorage` per browser; tidak ada sinkronisasi antar-tab atau migrasi versi.
- Temuan dan keputusan yang belum diambil ada di [docs/AUDIT.md](docs/AUDIT.md).

## Author & License

Created by Vassel Goleyu. Copyright (c) 2026 Vassel Goleyu. All rights reserved. Lihat [LICENSE](LICENSE).
