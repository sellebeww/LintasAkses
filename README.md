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

Butuh Node.js saja, tanpa install dependensi dan tanpa build step.

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

## Struktur

| Bagian | File |
|---|---|
| Company profile (animasi) | `index.html`, `assets/profile.css`, `assets/profile.js` |
| Aplikasi lima peran + dasbor dampak | `app/` (hash-router, vanilla JS) |
| Logo transparan | `assets/logo/` |
| Server statis lokal | `dev.mjs` |

## Catatan jujur

- Semua data fiktif dan hanya tersimpan di browser Anda.
- Verifikasi adalah penilaian internal, bukan sertifikasi pemerintah.
- Angka anggaran bersifat ilustratif.

## Author & License

Created by Vassel Goleyu. Copyright (c) 2026 Vassel Goleyu. All rights reserved. Lihat [LICENSE](LICENSE).
