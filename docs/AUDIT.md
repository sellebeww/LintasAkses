# Audit singkat

Prototipe dengan data fiktif "Kawasan Puspa". Audit ini mencatat temuan dan statusnya setelah cabang `improve/safe-quality`. Tidak ada desain atau perilaku yang diubah kecuali perbaikan bug yang dibuktikan dengan tes.

## Ruang lingkup nyata

Aplikasi tidak punya pencarian, penilaian, atau penentuan rute. "Rute" adalah perjalanan buatan pengguna yang terdiri atas segmen berurutan, dan "biaya" adalah anggaran ilustratif per paket perbaikan. Logika yang ada dan sudah dites ada di `app/data.js`: status perjalanan (`journeyStatus`), status segmen (`segState`), mesin status hambatan (`TRANS`), progres dan anggaran paket (`pkgProgress`, `committed`, `costPerValidated`), serta aturan validasi verifikasi dan uji pengguna. Filter kebutuhan akses hanya berupa pilihan tersimpan per perjalanan dan per pengguna, dan tidak ada logika penyaringan yang bisa dites terpisah.

## Bug yang terbukti dan diperbaiki

| # | Temuan | Bukti | Perbaikan |
|---|---|---|---|
| 1 | Data `localStorage` berbentuk `{"v":1}` lolos pemeriksaan versi, lalu koleksi (`users`, `journeys`, dst.) hilang dan render melempar error. | `tests/storage-structure.test.mjs`, gagal sebelum perbaikan. | `load()` memvalidasi struktur minimal dan kembali ke seed bila tidak valid. |
| 2 | Menghapus perjalanan yang masih punya hambatan membuat `segOf` melempar `TypeError`. Halaman paket (`/c/packages/p1`), tugas verifikator, dan laporan mitra jatuh ke layar "Kesalahan". | `tests/model.test.mjs` (segOf) dan `tests/e2e/smoke.e2e.mjs` (hapus perjalanan), gagal sebelum perbaikan. | `segOf` mengembalikan `undefined` bila perjalanan tidak ada. |

## Temuan aksesibilitas

Diperbaiki (dibuktikan tes e2e yang gagal sebelum perbaikan):

- Caption peta animasi di halaman profil memakai `aria-live="polite"` dan berganti otomatis setiap beberapa detik, sehingga pembaca layar terus mengumumkan. Atribut dihapus, teks tetap terlihat, dan `svg` kini memakai `aria-describedby` ke caption.
- Node peta rute di aplikasi (`role="button"`) kehilangan fokus keyboard setelah dipilih karena render ulang. Node kini punya `id` sehingga fokus dipulihkan.
- Lencana jumlah notifikasi putih di atas `#C65E5E` (4,07:1). Kini memakai `--bad-t` (di atas 4,5:1).
- Teks kecil "(rencana indikatif)" memakai `opacity: .8` sehingga kontras 3,9:1. Opacity dihapus.

Sudah baik sebelumnya (dikonfirmasi tes): peta profil punya `role="img"` dengan nama dan deskripsi, tombol jeda dapat dioperasikan dengan keyboard dan benar-benar menghentikan siklus, `prefers-reduced-motion` menghentikan animasi dan menyembunyikan tombol jeda, peta rute aplikasi punya padanan teks (daftar segmen dan tabel), tautan "Lewati ke konten utama" ada di semua halaman, dan semua tombol/tautan/kontrol form yang diuji punya nama aksesibel.

Belum diubah (keputusan Anda):

- Marquee "Pihak yang terlibat" bergerak otomatis lebih dari 5 detik tanpa tombol jeda (WCAG 2.2.2). Konten dobel itu `aria-hidden` dan ada padanan teks `sr-only`, dan animasi mati pada reduced-motion. Risikonya rendah, tetapi tombol jeda akan lebih patuh.
- Di aplikasi, fokus dipindah ke `<main>` saat halaman dimuat. Akibatnya Tab pertama pada pemuatan langsung berada setelah header dan menu. Ini pola umum pada SPA, tetapi pengguna keyboard harus Shift+Tab untuk menjangkau menu.
- `role="tabpanel"` pada panel peran di profil punya `aria-live="polite"`, sehingga seluruh isi panel diumumkan tiap ganti tab.
- Pemeriksaan kontras teks dilakukan dengan skrip sementara (bukan bagian repo) dan hanya mencakup halaman utama peran demo. Hasil di bagian profil banyak positif palsu pada latar gradien, jadi kontras di sana belum terverifikasi sepenuhnya. Disarankan audit dengan axe/Lighthouse.

## 360px

Tidak ditemukan gulir horizontal pada halaman profil, login, demo, bantuan, dampak, dan dasbor kelima peran (tes e2e mencakup 5 halaman publik dan 18 halaman dasbor; pemeriksaan manual awal mencakup sekitar 40). Pengukuran di `tests/e2e/a11y.e2e.mjs` menetralkan `overflow-x` pada `body` lebih dulu, sehingga tidak tertutup. `body{overflow-x:hidden}` di `assets/profile.css` ternyata tidak diperlukan (hero dan marquee sudah memotong sendiri lewat `overflow:hidden`). Aturan itu dibiarkan agar tidak mengubah perilaku, tetapi aman dihapus.

## Penyimpanan localStorage

- Seluruh data satu kunci (`lintasakses.demo.v2`). Tidak ada migrasi: versi tidak cocok berarti data diganti seed.
- Kegagalan tulis (kuota, mode privat) ditelan diam-diam. Data tetap di memori tetapi hilang saat dimuat ulang, tanpa pesan ke pengguna.
- Pengguna aktif (`sessionStorage`) tidak divalidasi terhadap data: bila `userId` tidak ada di database, `S.user()` mengembalikan `undefined`. Rute yang butuh peran menganggapnya belum masuk, jadi aman.
- Dua tab membuka aplikasi bersamaan saling menimpa data karena tidak ada sinkronisasi `storage` event.

## Lain-lain

- Penghapusan perjalanan tidak mengikutkan hambatan, paket, dan uji terkait (data yatim). Sekarang tidak lagi membuat halaman error, tetapi data yatim tetap ada. Menghapus berantai atau melarang hapus adalah keputusan produk.
- Anggaran `p1`: `approved` Rp 200 juta, sedangkan jumlah `improvement + coordination + verification` Rp 220 juta, dan log seed menyebut revisi menjadi Rp 220 juta. Kemungkinan seed belum diperbarui. Tidak diubah karena menyangkut data.
- Pesan galat memakai istilah Inggris di antarmuka Indonesia: `Needs Improvement`, `Pass`, `Delayed/Completed` (`submitVerif`, `progress`).
- `pkgProgress` memakai ekspresi tunggal yang panjang dengan fallback `|| (v ? 100 : 0)`. Hasilnya valid untuk seed, tetapi nilai `progress` di luar daftar `PROGRESS` akan menghasilkan `NaN`.
- Font memuat dari Google Fonts. Tanpa jaringan, tampilan jatuh ke font sistem. Tes e2e memblokir font agar deterministik.
- Dependensi nol dan tanpa lockfile. Alat tes e2e (Playwright) dipasang di CI tanpa mengubah `package.json`.
