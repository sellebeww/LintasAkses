/* Copyright (c) 2026 Vassel Goleyu. All rights reserved. */
/* Model + seed data + workflow rules. All names/figures are fictional demo data ("Kawasan Puspa"). */
(function () {
  const KEY = 'lintasakses.demo.v2';
  const D = n => new Date(Date.now() + n * 864e5).toISOString();

  const CATS = ['Trotoar tidak rata', 'Tidak ada ramp trotoar', 'Pintu masuk tidak dapat diakses', 'Jalur terlalu sempit', 'Lift tidak dapat diakses', 'Papan penunjuk kurang memadai', 'Tidak ada jalur pemandu taktil', 'Informasi visual tidak tersedia', 'Informasi audio tidak tersedia', 'Toilet tidak dapat diakses', 'Lainnya'];
  const BSTAT = ['Terkirim', 'Sedang ditinjau', 'Diterima', 'Perlu informasi tambahan', 'Perbaikan direncanakan', 'Selesai, menunggu verifikasi', 'Terverifikasi', 'Ditolak'];
  // allowed manual/system transitions (consistent status machine)
  const TRANS = {
    'Terkirim': ['Sedang ditinjau', 'Ditolak'],
    'Sedang ditinjau': ['Diterima', 'Perlu informasi tambahan', 'Ditolak'],
    'Perlu informasi tambahan': ['Sedang ditinjau', 'Ditolak'],
    'Diterima': ['Perbaikan direncanakan', 'Ditolak'],
    'Perbaikan direncanakan': ['Selesai, menunggu verifikasi'],
    'Selesai, menunggu verifikasi': ['Terverifikasi', 'Perbaikan direncanakan'],
    'Terverifikasi': [], 'Ditolak': []
  };
  const JSTAT = { 1: 'Belum dapat dinilai', 2: 'Terhambat oleh hambatan akses', 3: 'Perbaikan sedang berlangsung', 4: 'Siap untuk pengujian', 5: 'Berhasil diuji oleh pengguna dengan kebutuhan akses yang sesuai' };
  const SEGTYPES = { walking: 'Berjalan kaki', transit: 'Transportasi umum', shuttle: 'Shuttle / kendaraan lain', crossing: 'Penyeberangan', sidewalk: 'Trotoar penghubung', entrance: 'Pintu masuk gedung', indoor: 'Sirkulasi dalam ruangan', destination: 'Tujuan akhir' };
  const NEEDS = {
    Mobilitas: ['Akses tanpa anak tangga', 'Jalur ramah kursi roda', 'Ramp yang sesuai', 'Lift yang dapat diakses', 'Lebar jalur memadai'],
    Penglihatan: ['Pemandu taktil', 'Kontras visual jelas', 'Papan penunjuk yang dapat diakses', 'Informasi audio'],
    Pendengaran: ['Notifikasi visual', 'Informasi tertulis', 'Petunjuk visual yang jelas'],
    'Kognitif & sensorik': ['Petunjuk arah mudah dipahami', 'Informasi rute yang dapat diprediksi', 'Hambatan sensorik berkurang']
  };
  const CHECK = {
    Mobilitas: [['m1', 'Apakah jalurnya tidak terputus?'], ['m2', 'Apakah pintu masuk bebas anak tangga bila diperlukan?'], ['m3', 'Apakah ramp dapat digunakan sesuai kebutuhan yang ditetapkan?'], ['m4', 'Apakah lebar jalur memadai?'], ['m5', 'Apakah lift tersedia dan berfungsi?']],
    Penglihatan: [['v1', 'Apakah petunjuk arah cukup jelas?'], ['v2', 'Apakah informasi taktil tersedia bila diperlukan?'], ['v3', 'Apakah kontras visual memadai?']],
    Pendengaran: [['h1', 'Apakah informasi penting tersedia secara visual?'], ['h2', 'Apakah peringatan visual tersedia bila diperlukan?']],
    'Kognitif & sensorik': [['c1', 'Apakah petunjuk arah mudah dipahami?'], ['c2', 'Apakah informasi rute dapat diprediksi?'], ['c3', 'Apakah hambatan sensorik yang relevan sudah dicatat?']]
  };
  const PHASES = ['Identifikasi Hambatan', 'Kesepakatan Mitra', 'Perencanaan', 'Pelaksanaan', 'Verifikasi Independen', 'Uji Pengguna', 'Laporan Hasil'];
  const PROGRESS = ['Belum dimulai', 'Perencanaan', 'Sedang berjalan', 'Tertunda', 'Tuntas', 'Menunggu verifikasi'];

  const seg = (id, type, name, desc, orgId, cond) => ({ id, type, name, desc, orgId, cond: cond || 'Belum ada catatan kondisi.' });
  const bar = (n, jid, sid, cat, desc, impact, pr, org, st, extra) => Object.assign({
    id: 'BR-' + String(n).padStart(4, '0'), journeyId: jid, segId: sid, cat, desc, impact, priority: pr, orgId: org, status: st,
    reporterId: 'u1', vis: 'Dibagikan ke mitra proyek', evidence: ['foto-' + n + '.jpg'], pkgId: null, created: D(-60 + n * 2), updated: D(-n),
    hist: [{ ts: D(-60 + n * 2), status: 'Terkirim', note: 'Laporan diterima.' }]
  }, extra || {});

  function seed() {
    const o = (id, name, type, status, contact, email) => ({ id, name, type, status, contact, email, regNo: 'SIM-' + id.toUpperCase() + '-2026', docs: ['Akta pendirian (simulasi).pdf', 'Surat tugas kontak.pdf'], joined: D(-200) });
    const db = {
      v: 1,
      users: [
        { id: 'u1', name: 'Dewi Anggraini', email: 'dewi@demo.lintasakses.id', role: 'traveler', status: 'Aktif', created: D(-120), last: D(-1), prefs: ['Akses tanpa anak tangga', 'Jalur ramah kursi roda', 'Ramp yang sesuai', 'Lebar jalur memadai'] },
        { id: 'u2', name: 'Raka Pratama', email: 'raka@dpu-puspa.demo', role: 'partner', orgId: 'o3', status: 'Aktif', created: D(-150), last: D(-1) },
        { id: 'u3', name: 'Sari Wulandari', email: 'sari@koordinasi.demo', role: 'coordinator', status: 'Aktif', created: D(-180), last: D(0) },
        { id: 'u4', name: 'Bima Santoso', email: 'bima@aksessetara.demo', role: 'verifier', orgId: 'o6', status: 'Aktif', created: D(-170), last: D(-2) },
        { id: 'u5', name: 'Admin LintasAkses', email: 'admin@lintasakses.demo', role: 'admin', status: 'Aktif', created: D(-300), last: D(0) },
        { id: 'u6', name: 'Made Wirawan', email: 'made@demo.lintasakses.id', role: 'traveler', status: 'Aktif', created: D(-90), last: D(-4), prefs: ['Pemandu taktil', 'Papan penunjuk yang dapat diakses', 'Informasi audio'] },
        { id: 'u7', name: 'Lestari Hartono', email: 'lestari@museum-puspa.demo', role: 'partner', orgId: 'o2', status: 'Aktif', created: D(-140), last: D(-2) },
        { id: 'u8', name: 'Yoga Prakoso', email: 'yoga@kai-contoh.demo', role: 'partner', orgId: 'o1', status: 'Aktif', created: D(-130), last: D(-6) },
        { id: 'u9', name: 'Nadia Kusuma', email: 'nadia@demo.lintasakses.id', role: 'traveler', status: 'Ditangguhkan', created: D(-40), last: D(-20) }
      ],
      orgs: [
        o('o1', 'PT Kereta Contoh Puspa', 'Penyedia transportasi', 'Terverifikasi', 'Yoga Prakoso', 'yoga@kai-contoh.demo'),
        o('o2', 'Pengelola Museum Puspa', 'Operator destinasi', 'Terverifikasi', 'Lestari Hartono', 'lestari@museum-puspa.demo'),
        o('o3', 'Dinas Pekerjaan Umum Kota Puspa', 'Pengelola infrastruktur publik', 'Terverifikasi', 'Raka Pratama', 'raka@dpu-puspa.demo'),
        o('o4', 'Hotel Puspa Grand', 'Hotel / akomodasi', 'Terverifikasi', 'Intan Maharani', 'intan@hotelpuspa.demo'),
        o('o5', 'Perum Terminal Contoh', 'Penyedia transportasi', 'Terverifikasi', 'Budi Hermawan', 'budi@terminal-contoh.demo'),
        o('o6', 'Yayasan Akses Setara', 'Verifikator independen', 'Terverifikasi', 'Bima Santoso', 'bima@aksessetara.demo'),
        o('o7', 'Dinas Pariwisata Puspa', 'Operator destinasi', 'Terverifikasi', 'Citra Ayu', 'citra@wisata-puspa.demo'),
        o('o8', 'Pengelola Taman Puspa', 'Operator destinasi', 'Terverifikasi', 'Hendra Gunawan', 'hendra@taman-puspa.demo'),
        o('o9', 'Komunitas Wisata Setara', 'Lainnya', 'Menunggu verifikasi', 'Farah Aulia', 'farah@wisata-setara.demo')
      ],
      locations: [
        { id: 'l1', orgId: 'o1', name: 'Stasiun Contoh', type: 'Stasiun', addr: 'Jl. Stasiun No. 1, Kawasan Puspa (fiktif)', dept: 'Layanan Penumpang', contact: 'Yoga Prakoso', a11y: 'Lift ke peron tersedia; jalur taktil di peron utama.' },
        { id: 'l2', orgId: 'o2', name: 'Museum Puspa', type: 'Museum', addr: 'Jl. Puspa Raya No. 12 (fiktif)', dept: 'Fasilitas & Layanan Pengunjung', contact: 'Lestari Hartono', a11y: 'Pintu utama bertangga; ramp sementara. Lift lantai 2 pernah rusak.' },
        { id: 'l3', orgId: 'o3', name: 'Penyeberangan Jl. Puspa Raya', type: 'Infrastruktur jalan', addr: 'Persimpangan Jl. Puspa Raya (fiktif)', dept: 'Bidang Bina Marga', contact: 'Raka Pratama', a11y: 'Kerb tinggi tanpa ramp di sisi timur.' },
        { id: 'l4', orgId: 'o3', name: 'Trotoar Jl. Puspa Raya', type: 'Infrastruktur jalan', addr: 'Segmen stasiun–museum (fiktif)', dept: 'Bidang Bina Marga', contact: 'Raka Pratama', a11y: 'Permukaan tidak rata di beberapa titik.' },
        { id: 'l5', orgId: 'o4', name: 'Hotel Puspa Grand', type: 'Hotel', addr: 'Jl. Kenari No. 7 (fiktif)', dept: 'Front Office', contact: 'Intan Maharani', a11y: 'Lobi step-free; papan petunjuk berkontras rendah.' },
        { id: 'l6', orgId: 'o5', name: 'Terminal Contoh', type: 'Terminal', addr: 'Jl. Terminal No. 3 (fiktif)', dept: 'Operasional', contact: 'Budi Hermawan', a11y: 'Koridor sempit pada jam sibuk.' },
        { id: 'l7', orgId: 'o7', name: 'Pusat Informasi Puspa', type: 'Pusat informasi', addr: 'Jl. Wisata No. 2 (fiktif)', dept: 'Layanan Informasi', contact: 'Citra Ayu', a11y: 'Informasi audio belum tersedia.' },
        { id: 'l8', orgId: 'o7', name: 'Gedung Serbaguna Puspa', type: 'Gedung', addr: 'Jl. Balai No. 5 (fiktif)', dept: 'Pengelolaan Gedung', contact: 'Citra Ayu', a11y: 'Pintu masuk bertangga di sisi parkir.' },
        { id: 'l9', orgId: 'o8', name: 'Taman Puspa', type: 'Taman', addr: 'Jl. Taman No. 9 (fiktif)', dept: 'Pengelolaan Taman', contact: 'Hendra Gunawan', a11y: 'Papan informasi visual dan audio sudah dibenahi.' }
      ],
      journeys: [
        { id: 'j1', userId: 'u1', title: 'Stasiun Contoh → Museum Puspa', from: 'Stasiun Contoh', to: 'Museum Puspa', desc: 'Kunjungan akhir pekan dengan kursi roda manual.', created: D(-58), updated: D(-1), assessed: true, public: true,
          needs: ['Akses tanpa anak tangga', 'Jalur ramah kursi roda', 'Ramp yang sesuai', 'Lift yang dapat diakses'],
          segs: [seg('j1s1', 'transit', 'Titik awal — keluar Stasiun Contoh', 'Pintu keluar utara menuju area penurunan.', 'o1'), seg('j1s2', 'sidewalk', 'Trotoar penghubung', 'Trotoar 220 m dari stasiun ke persimpangan.', 'o3', 'Permukaan bergelombang dan ubin retak.'), seg('j1s3', 'crossing', 'Penyeberangan Jl. Puspa Raya', 'Zebra cross satu arah menuju sisi museum.', 'o3', 'Kerb tinggi ±15 cm tanpa ramp.'), seg('j1s4', 'entrance', 'Pintu masuk Museum Puspa', 'Pintu utama museum.', 'o2', 'Tiga anak tangga; ramp sementara terlalu curam.'), seg('j1s5', 'destination', 'Akses ruang pamer (lift)', 'Lift menuju galeri lantai 2.', 'o2', 'Lift diperbaiki mitra; menunggu verifikasi.')] },
        { id: 'j2', userId: 'u1', title: 'Terminal Contoh → Pusat Informasi Puspa', from: 'Terminal Contoh', to: 'Pusat Informasi Puspa', desc: 'Rute dari terminal bus ke pusat informasi wisata.', created: D(-50), updated: D(-3), assessed: true, public: true,
          needs: ['Akses tanpa anak tangga', 'Lebar jalur memadai', 'Pemandu taktil'],
          segs: [seg('j2s1', 'walking', 'Titik awal — keluar terminal', 'Area kedatangan.', 'o5'), seg('j2s2', 'sidewalk', 'Koridor pejalan terminal', 'Koridor menuju gerbang timur.', 'o5', 'Lebar efektif 85 cm saat ramai.'), seg('j2s3', 'crossing', 'Penyeberangan gerbang timur', 'Penyeberangan bersinyal.', 'o3'), seg('j2s4', 'entrance', 'Pintu Pusat Informasi', 'Pintu otomatis.', 'o7'), seg('j2s5', 'destination', 'Loket informasi', 'Loket layanan.', 'o7')] },
        { id: 'j3', userId: 'u6', title: 'Hotel Puspa → Galeri Kota', from: 'Hotel Puspa Grand', to: 'Galeri Kota', desc: 'Jalan kaki dari hotel ke galeri.', created: D(-45), updated: D(-2), assessed: true, public: true,
          needs: ['Papan penunjuk yang dapat diakses', 'Kontras visual jelas', 'Ramp yang sesuai'],
          segs: [seg('j3s1', 'walking', 'Titik awal — lobi hotel', 'Lobi step-free.', 'o4'), seg('j3s2', 'walking', 'Jalur keluar hotel', 'Koridor menuju pintu samping.', 'o4', 'Papan petunjuk kontras rendah.'), seg('j3s3', 'crossing', 'Penyeberangan Jl. Kenari', 'Zebra cross.', 'o3', 'Ramp kerb tidak tersedia di sisi galeri.'), seg('j3s4', 'entrance', 'Pintu Galeri Kota', 'Pintu kaca ganda.', 'o7'), seg('j3s5', 'destination', 'Ruang pamer galeri', 'Lantai datar.', 'o7')] },
        { id: 'j4', userId: 'u1', title: 'Halte Contoh → Taman Puspa', from: 'Halte Contoh', to: 'Taman Puspa', desc: 'Rute harian ke taman kota.', created: D(-110), updated: D(-40), assessed: true, public: true,
          needs: ['Akses tanpa anak tangga', 'Jalur ramah kursi roda', 'Informasi audio'],
          segs: [seg('j4s1', 'transit', 'Titik awal — Halte Contoh', 'Halte bus.', 'o1', 'Pengumuman audio kini tersedia.'), seg('j4s2', 'sidewalk', 'Trotoar menuju taman', 'Trotoar 150 m.', 'o3', 'Sudah diratakan.'), seg('j4s3', 'entrance', 'Gerbang Taman Puspa', 'Gerbang utama.', 'o8', 'Papan informasi visual dibenahi.'), seg('j4s4', 'destination', 'Area taman', 'Jalur paving rata.', 'o8')] },
        { id: 'j5', userId: 'u6', title: 'Area Parkir Puspa → Gedung Serbaguna', from: 'Area Parkir Puspa', to: 'Gedung Serbaguna Puspa', desc: 'Menghadiri acara komunitas.', created: D(-12), updated: D(-6), assessed: false, public: true,
          needs: ['Akses tanpa anak tangga', 'Jalur ramah kursi roda'],
          segs: [seg('j5s1', 'walking', 'Titik awal — area parkir', 'Parkir disabilitas.', 'o7'), seg('j5s2', 'sidewalk', 'Jalur parkir ke gedung', 'Jalur 80 m.', 'o7'), seg('j5s3', 'entrance', 'Pintu Gedung Serbaguna', 'Pintu sisi parkir.', 'o7', 'Bertangga.'), seg('j5s4', 'indoor', 'Sirkulasi dalam gedung', 'Lorong menuju aula.', 'o7'), seg('j5s5', 'destination', 'Aula utama', 'Aula.', 'o7')] }
      ],
      barriers: [
        bar(1, 'j1', 'j1s2', 'Trotoar tidak rata', 'Ubin trotoar retak dan bergelombang sepanjang 40 m; kursi roda tersangkut.', 'Pengguna kursi roda dan pengguna tongkat terdampak.', 'Tinggi', 'o3', 'Diterima'),
        bar(2, 'j1', 'j1s3', 'Tidak ada ramp trotoar', 'Kerb setinggi ±15 cm tanpa ramp di sisi timur penyeberangan.', 'Kursi roda tidak dapat naik ke trotoar.', 'Kritis', 'o3', 'Perbaikan direncanakan', { pkgId: 'p1' }),
        bar(3, 'j1', 'j1s4', 'Pintu masuk tidak dapat diakses', 'Pintu utama bertangga tiga; ramp sementara terlalu curam.', 'Kursi roda dan stroller tidak dapat masuk mandiri.', 'Kritis', 'o2', 'Perbaikan direncanakan', { pkgId: 'p1' }),
        bar(4, 'j1', 'j1s5', 'Lift tidak dapat diakses', 'Lift galeri sering mati dan tanpa penanda visual.', 'Akses ke lantai 2 tertutup.', 'Tinggi', 'o2', 'Selesai, menunggu verifikasi', { pkgId: 'p1' }),
        bar(5, 'j2', 'j2s2', 'Jalur terlalu sempit', 'Koridor tersisa 85 cm karena pedagang kaki lima.', 'Kursi roda tidak dapat berpapasan.', 'Sedang', 'o5', 'Sedang ditinjau'),
        bar(6, 'j2', 'j2s2', 'Tidak ada jalur pemandu taktil', 'Tidak ada jalur taktil menuju gerbang timur.', 'Pengguna tunanetra kesulitan orientasi.', 'Tinggi', 'o5', 'Terkirim', { reporterId: 'u6' }),
        bar(7, 'j3', 'j3s2', 'Papan penunjuk kurang memadai', 'Papan petunjuk berkontras rendah dan huruf kecil.', 'Pengguna low vision sulit membaca.', 'Sedang', 'o4', 'Perbaikan direncanakan', { pkgId: 'p1', reporterId: 'u6' }),
        bar(8, 'j3', 'j3s3', 'Tidak ada ramp trotoar', 'Tidak ada ramp kerb di sisi galeri.', 'Kursi roda terhenti di tepi jalan.', 'Tinggi', 'o3', 'Diterima', { reporterId: 'u6' }),
        bar(9, 'j4', 'j4s2', 'Trotoar tidak rata', 'Trotoar sudah diratakan dan diperiksa.', 'Terselesaikan.', 'Sedang', 'o3', 'Terverifikasi', { pkgId: 'p0' }),
        bar(10, 'j4', 'j4s3', 'Informasi visual tidak tersedia', 'Papan informasi gerbang taman kini berkontras tinggi.', 'Terselesaikan.', 'Rendah', 'o8', 'Terverifikasi', { pkgId: 'p0' }),
        bar(11, 'j4', 'j4s1', 'Informasi audio tidak tersedia', 'Pengumuman audio di halte telah dipasang.', 'Terselesaikan.', 'Sedang', 'o1', 'Terverifikasi', { pkgId: 'p0' }),
        bar(12, 'j5', 'j5s4', 'Toilet tidak dapat diakses', 'Toilet disabilitas dipakai sebagai gudang.', 'Tidak ada toilet aksesibel.', 'Sedang', 'o7', 'Perlu informasi tambahan', { reporterId: 'u6' }),
        bar(13, 'j5', 'j5s3', 'Pintu masuk tidak dapat diakses', 'Pintu sisi parkir bertangga dua, tanpa ramp.', 'Kursi roda tidak dapat masuk.', 'Tinggi', 'o7', 'Terkirim', { reporterId: 'u6' }),
        bar(14, 'j2', 'j2s4', 'Informasi audio tidak tersedia', 'Duplikat laporan terminal; pengumuman audio sudah ada.', 'Tidak ada hambatan baru.', 'Rendah', 'o7', 'Ditolak', { reason: 'Duplikat dari laporan yang sudah diverifikasi; tidak ada bukti hambatan baru.' })
      ],
      packages: [
        { id: 'p1', title: 'Koridor Stasiun–Museum Puspa', desc: 'Paket lintas mitra untuk membuka perjalanan dari Stasiun Contoh ke Museum Puspa bagi pengguna kursi roda, termasuk papan petunjuk hotel terkait.', journeyId: 'j1', outcome: 'Perjalanan Stasiun Contoh → Museum Puspa dapat ditempuh pengguna kursi roda tanpa bantuan, diverifikasi dan diuji pengguna.', priority: 'Kritis', owner: 'u3', start: D(-30), end: D(60), created: D(-32), status: 'Aktif',
          budget: { improvement: 185e6, coordination: 20e6, verification: 15e6, approved: 200e6, actual: 38e6, funding: 'Sebagian dikomitmenkan' },
          thread: [{ by: 'Sari Wulandari', role: 'coordinator', ts: D(-10), text: 'Mohon DPU konfirmasi jadwal pengerjaan ramp kerb sebelum tenggat respons.' }, { by: 'Lestari Hartono', role: 'partner', ts: D(-6), text: 'Lift sudah diperbaiki, kami unggah bukti dan menunggu jadwal verifikator.' }] },
        { id: 'p0', title: 'Koridor Halte–Taman Puspa (selesai)', desc: 'Paket selesai yang membuka rute Halte Contoh → Taman Puspa.', journeyId: 'j4', outcome: 'Rute halte ke taman dapat ditempuh pengguna kursi roda.', priority: 'Tinggi', owner: 'u3', start: D(-160), end: D(-70), created: D(-165), status: 'Selesai',
          budget: { improvement: 40e6, coordination: 8e6, verification: 7e6, approved: 55e6, actual: 48e6, funding: 'Terpenuhi' }, thread: [] }
      ],
      commitments: [
        { id: 'c1', pkgId: 'p1', barrierId: 'BR-0002', orgId: 'o3', task: 'Bangun ramp kerb dan pelandaian di penyeberangan Jl. Puspa Raya', status: 'Diminta', progress: 'Belum dimulai', deadline: D(5), start: D(10), end: D(45), cost: 85e6, priority: 'Kritis', notes: [] },
        { id: 'c2', pkgId: 'p1', barrierId: 'BR-0003', orgId: 'o2', task: 'Pasang ramp permanen berkemiringan sesuai standar di pintu utama museum', status: 'Diterima', progress: 'Sedang berjalan', deadline: D(-20), start: D(-14), end: D(30), cost: 60e6, priority: 'Kritis', notes: [{ ts: D(-7), text: 'Pondasi ramp selesai.' }] },
        { id: 'c3', pkgId: 'p1', barrierId: 'BR-0004', orgId: 'o2', task: 'Perbaikan lift galeri dan penambahan penanda visual', status: 'Menunggu verifikasi', progress: 'Menunggu verifikasi', deadline: D(-40), start: D(-40), end: D(-5), cost: 25e6, priority: 'Tinggi', notes: [{ ts: D(-5), text: 'Pekerjaan selesai, bukti diunggah.' }] },
        { id: 'c4', pkgId: 'p1', barrierId: 'BR-0007', orgId: 'o4', task: 'Ganti papan petunjuk dengan kontras tinggi di jalur keluar hotel', status: 'Diterima', progress: 'Perencanaan', deadline: D(-10), start: D(0), end: D(30), cost: 15e6, priority: 'Sedang', notes: [] },
        { id: 'c9', pkgId: 'p0', barrierId: 'BR-0009', orgId: 'o3', task: 'Ratakan trotoar menuju Taman Puspa', status: 'Selesai', progress: 'Tuntas', deadline: D(-150), start: D(-150), end: D(-100), cost: 20e6, priority: 'Sedang', notes: [] },
        { id: 'c10', pkgId: 'p0', barrierId: 'BR-0010', orgId: 'o8', task: 'Ganti papan informasi gerbang taman', status: 'Selesai', progress: 'Tuntas', deadline: D(-150), start: D(-140), end: D(-90), cost: 10e6, priority: 'Rendah', notes: [] },
        { id: 'c11', pkgId: 'p0', barrierId: 'BR-0011', orgId: 'o1', task: 'Pasang pengumuman audio di halte', status: 'Selesai', progress: 'Tuntas', deadline: D(-150), start: D(-130), end: D(-80), cost: 10e6, priority: 'Sedang', notes: [] }
      ],
      verifs: [
        { id: 'vf1', barrierId: 'BR-0004', commitId: 'c3', pkgId: 'p1', journeyId: 'j1', segId: 'j1s5', orgId: 'o2', verifierId: 'u4', status: 'Dijadwalkan', scheduled: D(2), method: 'Kunjungan lapangan', checklist: {}, result: null, notes: '', followup: '', evidence: [], date: null },
        ...['BR-0009:c9:j4s2:o3', 'BR-0010:c10:j4s3:o8', 'BR-0011:c11:j4s1:o1'].map((s, i) => { const [b, c, sg, org] = s.split(':'); return { id: 'vf' + (i + 2), barrierId: b, commitId: c, pkgId: 'p0', journeyId: 'j4', segId: sg, orgId: org, verifierId: 'u4', status: 'Selesai', scheduled: D(-75 + i), method: 'Kunjungan lapangan', checklist: { m1: { a: 'Sesuai', o: 'Jalur kontinu.' } }, result: 'Terverifikasi', notes: 'Seluruh item relevan lolos.', followup: 'Tidak ada.', evidence: ['verifikasi-' + (i + 2) + '.jpg'], date: D(-70 + i) }; })
      ],
      tests: [{ id: 't1', journeyId: 'j4', userId: 'u1', needs: ['Akses tanpa anak tangga', 'Jalur ramah kursi roda'], result: 'success', feedback: 'Rute dapat saya tempuh sendiri dengan kursi roda manual. Pengumuman audio membantu.', date: D(-40) }],
      notifs: [
        { id: 'n1', role: 'traveler', cat: 'Laporan aksesibilitas', text: 'Laporan hambatan BR-0001 sedang ditinjau koordinator.', link: '/t/journeys/j1', read: false, ts: D(-1) },
        { id: 'n2', role: 'traveler', cat: 'Komitmen mitra', text: 'Pengelola Museum Puspa menerima permintaan perbaikan untuk perjalananmu.', link: '/t/journeys/j1', read: false, ts: D(-3) },
        { id: 'n3', role: 'traveler', cat: 'Progres proyek', text: 'Paket perbaikan Koridor Stasiun–Museum memasuki tahap implementasi.', link: '/t/journeys/j1', read: true, ts: D(-8) },
        { id: 'n4', role: 'traveler', cat: 'Verifikasi lapangan', text: 'Jadwal verifikasi lift Museum Puspa dikonfirmasi.', link: '/t/journeys/j1', read: true, ts: D(-9) },
        { id: 'n5', role: 'partner', cat: 'Permintaan perbaikan', text: 'Permintaan baru: bangun ramp kerb di penyeberangan Jl. Puspa Raya. Tenggat respons 5 hari.', link: '/p/requests', read: false, ts: D(-2) },
        { id: 'n6', role: 'coordinator', cat: 'Laporan aksesibilitas', text: 'Ada 3 laporan hambatan baru menunggu peninjauan.', link: '/c/barriers', read: false, ts: D(-1) },
        { id: 'n7', role: 'coordinator', cat: 'Progres proyek', text: 'Museum Puspa menandai lift selesai dan menunggu verifikasi.', link: '/c/packages/p1', read: false, ts: D(-5) },
        { id: 'n8', role: 'verifier', cat: 'Verifikasi lapangan', text: 'Penugasan baru: verifikasi lift galeri Museum Puspa (BR-0004).', link: '/v/assigned', read: false, ts: D(-4) },
        { id: 'n9', role: 'admin', cat: 'Pengumuman sistem', text: 'Organisasi “Komunitas Wisata Setara” menunggu verifikasi.', link: '/a/orgs', read: false, ts: D(-2) }
      ],
      logs: [
        { id: 'g1', ts: D(-32), actor: 'Sari Wulandari', role: 'coordinator', action: 'Membuat paket perbaikan PKG-001', entity: 'p1' },
        { id: 'g2', ts: D(-20), actor: 'Lestari Hartono', role: 'partner', action: 'Menerima komitmen c2 (ramp pintu utama)', entity: 'c2' },
        { id: 'g3', ts: D(-12), actor: 'Sari Wulandari', role: 'coordinator', action: 'Merevisi anggaran PKG-001 menjadi Rp 220.000.000 (ilustratif)', entity: 'p1' },
        { id: 'g4', ts: D(-70), actor: 'Bima Santoso', role: 'verifier', action: 'Keputusan verifikasi: Terverifikasi untuk BR-0009', entity: 'vf2' },
        { id: 'g5', ts: D(-5), actor: 'Lestari Hartono', role: 'partner', action: 'Menandai c3 selesai, menunggu verifikasi', entity: 'c3' },
        { id: 'g6', ts: D(-2), actor: 'Admin LintasAkses', role: 'admin', action: 'Menolak laporan duplikat BR-0014', entity: 'BR-0014' }
      ],
      settings: { categories: CATS.slice(), notifPrefs: { 'Pembaruan perjalanan': true, 'Laporan aksesibilitas': true, 'Permintaan perbaikan': true, 'Komitmen mitra': true, 'Progres proyek': true, 'Verifikasi lapangan': true, 'Uji pengguna': true, 'Pengumuman sistem': true } }
    };
    return db;
  }

  /* ---------- store ---------- */
  let db;
  const COLLECTIONS = ['users', 'orgs', 'locations', 'journeys', 'barriers', 'packages', 'commitments', 'verifs', 'tests', 'notifs', 'logs'];
  const valid = d => !!d && typeof d === 'object' && d.v === 1 && COLLECTIONS.every(k => Array.isArray(d[k])) && !!d.settings && typeof d.settings === 'object';
  const load = () => { try { const s = localStorage.getItem(KEY); db = s ? JSON.parse(s) : null; } catch (e) { db = null; } if (!valid(db)) { db = seed(); save(); } return db; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* storage blocked: stays in memory */ } };
  load();
  const nid = (arr, p) => p + (arr.reduce((m, x) => Math.max(m, parseInt(String(x.id).replace(/\D/g, '')) || 0), 0) + 1);

  const M = {
    get db() { return db; }, save, CATS, BSTAT, TRANS, JSTAT, SEGTYPES, NEEDS, CHECK, PHASES, PROGRESS,
    reset() { db = seed(); save(); },
    user: id => db.users.find(u => u.id === id), org: id => db.orgs.find(o => o.id === id), loc: id => db.locations.find(l => l.id === id),
    journey: id => db.journeys.find(j => j.id === id), barrier: id => db.barriers.find(b => b.id === id), pkg: id => db.packages.find(p => p.id === id),
    commit: id => db.commitments.find(c => c.id === id), verif: id => db.verifs.find(v => v.id === id),
    orgName: id => (db.orgs.find(o => o.id === id) || {}).name || '—', userName: id => (db.users.find(u => u.id === id) || {}).name || '—',
    barriersOf: j => db.barriers.filter(b => b.journeyId === (j.id || j)),
    segOf: (j, sid) => j.segs.find(s => s.id === sid),

    /* journey status machine (derived from underlying records, never hand-set) */
    journeyStatus(j) {
      if (!j.assessed) return 1;
      const open = db.barriers.filter(b => b.journeyId === j.id && !['Terverifikasi', 'Ditolak'].includes(b.status));
      if (open.length) {
        const prog = open.some(b => db.commitments.some(c => c.barrierId === b.id && ['Diterima', 'Menunggu verifikasi', 'Selesai'].includes(c.status)));
        return prog ? 3 : 2;
      }
      return db.tests.some(t => t.journeyId === j.id && t.result === 'success') ? 5 : 4;
    },
    segState(j, s) {
      const bs = db.barriers.filter(b => b.segId === s.id && b.status !== 'Ditolak');
      if (!bs.length) return j.assessed ? (/^Belum/.test(s.cond) ? 'unassessed' : 'clear') : 'unassessed';
      const has = f => bs.some(f);
      if (has(b => b.status === 'Diterima')) return 'barrier';
      if (has(b => ['Terkirim', 'Sedang ditinjau', 'Perlu informasi tambahan'].includes(b.status))) return 'review';
      if (has(b => b.status === 'Perbaikan direncanakan')) return 'planned';
      if (has(b => b.status === 'Selesai, menunggu verifikasi')) return 'awaiting';
      return 'verified';
    },
    phase(p) {
      const cs = db.commitments.filter(c => c.pkgId === p.id), bs = db.barriers.filter(b => b.pkgId === p.id);
      if (!cs.length) return 0;
      if (cs.some(c => ['Diminta', 'Ditolak', 'Alternatif diusulkan'].includes(c.status))) return 1;
      if (bs.length && bs.every(b => b.status === 'Terverifikasi')) return db.tests.some(t => t.journeyId === p.journeyId && t.result === 'success') ? 6 : 5;
      if (cs.every(c => ['Menunggu verifikasi', 'Tuntas'].includes(c.progress))) return 4;
      if (cs.some(c => ['Sedang berjalan', 'Tertunda', 'Menunggu verifikasi', 'Tuntas'].includes(c.progress))) return 3;
      return 2;
    },
    pkgProgress(p) { const cs = db.commitments.filter(c => c.pkgId === p.id); if (!cs.length) return 0; const w = { 'Belum dimulai': 0, 'Perencanaan': .15, 'Sedang berjalan': .5, 'Tertunda': .4, 'Tuntas': 1, 'Menunggu verifikasi': .9 }; const bs = db.barriers.filter(b => b.pkgId === p.id); const v = bs.filter(b => b.status === 'Terverifikasi').length; return Math.round(100 * (cs.reduce((a, c) => a + (c.progress === 'Menunggu verifikasi' && bs.find(b => b.id === c.barrierId)?.status === 'Terverifikasi' ? 1 : w[c.progress]), 0) / cs.length)) || (v ? 100 : 0); },
    committed: p => db.commitments.filter(c => c.pkgId === p.id && ['Diterima', 'Menunggu verifikasi', 'Selesai'].includes(c.status)).reduce((a, c) => a + c.cost, 0),
    /* validated outcome = journey with a successful user test AND all its barriers verified/rejected */
    validated() { return db.tests.filter(t => t.result === 'success' && !db.barriers.some(b => b.journeyId === t.journeyId && !['Terverifikasi', 'Ditolak'].includes(b.status))); },
    costPerValidated() {
      const v = M.validated(); if (!v.length) return null;
      const js = [...new Set(v.map(t => t.journeyId))];
      const spend = db.packages.filter(p => p.status === 'Selesai' && js.includes(p.journeyId)).reduce((a, p) => a + p.budget.actual, 0);
      return { value: spend / v.length, spend, n: v.length };
    },
    isStale: iso => iso && (Date.now() - new Date(iso)) > 365 * 864e5,

    notify(role, cat, text, link) { db.notifs.unshift({ id: nid(db.notifs, 'n'), role, cat, text, link, read: false, ts: new Date().toISOString() }); },
    log(actor, action, entity) { db.logs.unshift({ id: nid(db.logs, 'g'), ts: new Date().toISOString(), actor: actor.name, role: actor.role, action, entity }); },

    setBarrierStatus(id, to, note, actor) {
      const b = M.barrier(id); if (!b) return 'Hambatan tidak ditemukan.';
      if (!TRANS[b.status].includes(to)) return `Transisi tidak diizinkan: ${b.status} → ${to}.`;
      if (to === 'Ditolak' && !(note || '').trim()) return 'Alasan penolakan wajib diisi.';
      b.status = to; b.updated = new Date().toISOString(); if (to === 'Ditolak') b.reason = note;
      b.hist.push({ ts: b.updated, status: to, note: note || '' });
      M.log(actor, `Status ${b.id} → ${to}`, b.id);
      const j = M.journey(b.journeyId); const u = M.user(b.reporterId);
      if (u) M.notify(u.role, 'Laporan aksesibilitas', `Laporan ${b.id}: status kini “${to}”.`, '/t/reports/' + b.id);
      if (j) j.updated = b.updated; M.save(); return null;
    },
    createJourney(d, user) {
      const id = nid(db.journeys, 'j'); const now = new Date().toISOString();
      const segs = d.segs.map((s, i) => ({ id: id + 's' + (i + 1), type: s.type, name: s.name, desc: s.desc || '', orgId: s.orgId || null, cond: 'Belum ada catatan kondisi.' }));
      db.journeys.unshift({ id, userId: user.id, title: d.title, from: d.from, to: d.to, stops: d.stops || [], desc: d.desc, date: d.date, created: now, updated: now, assessed: false, public: false, needs: d.needs, custom: d.custom, notes: d.notes, segs });
      M.log(user, 'Membuat perjalanan ' + d.title, id); M.notify('coordinator', 'Pembaruan perjalanan', `Perjalanan baru “${d.title}” dipetakan.`, '/c/journeys'); M.save(); return id;
    },
    updateJourney(id, d, user) { const j = M.journey(id); Object.assign(j, d, { updated: new Date().toISOString() }); M.log(user, 'Mengubah perjalanan ' + j.title, id); M.save(); },
    deleteJourney(id, user) { const j = M.journey(id); db.journeys = db.journeys.filter(x => x.id !== id); M.log(user, 'Menghapus perjalanan ' + j.title, id); M.save(); },
    submitReport(d, user) {
      const n = db.barriers.reduce((m, b) => Math.max(m, parseInt(b.id.slice(3))), 0) + 1; const j = M.journey(d.journeyId); const s = j && M.segOf(j, d.segId);
      const now = new Date().toISOString();
      const b = { id: 'BR-' + String(n).padStart(4, '0'), journeyId: d.journeyId, segId: d.segId, cat: d.cat, desc: d.desc, impact: d.impact, priority: d.priority || 'Sedang', orgId: s ? s.orgId : null, status: 'Terkirim', reporterId: user.id, vis: d.vis, evidence: d.evidence || [], loc: d.loc, pkgId: null, created: now, updated: now, hist: [{ ts: now, status: 'Terkirim', note: 'Laporan diterima.' }] };
      db.barriers.unshift(b); if (j) j.updated = now;
      M.notify('coordinator', 'Laporan aksesibilitas', `Laporan baru ${b.id}: ${b.cat}.`, '/c/barriers');
      if (b.orgId) M.notify('partner', 'Laporan aksesibilitas', `Laporan baru ${b.id} pada lokasi Anda (${b.cat}).`, '/p/reports');
      M.log(user, 'Mengirim laporan ' + b.id, b.id); M.save(); return b;
    },
    createPackage(d, user) {
      const id = nid(db.packages, 'p'); const now = new Date().toISOString();
      const bs = d.barrierIds.map(M.barrier);
      const bad = bs.find(b => b.status !== 'Diterima'); if (bad) return { err: `${bad.id} harus berstatus Diterima sebelum dikelompokkan.` };
      db.packages.unshift({ id, title: d.title, desc: d.desc, journeyId: d.journeyId, outcome: d.outcome, priority: d.priority, owner: user.id, start: d.start, end: d.end, created: now, status: 'Aktif', budget: { improvement: d.improvement, coordination: d.coordination, verification: d.verification, approved: d.approved || 0, actual: 0, funding: 'Belum dikomitmenkan' }, thread: [] });
      bs.forEach(b => M.addToPackage(id, b.id, user, d.perCost || 0, true)); M.log(user, 'Membuat paket ' + d.title, id); M.save(); return { id };
    },
    addToPackage(pid, bid, user, cost, quiet) {
      const b = M.barrier(bid), p = M.pkg(pid); const e = M.setBarrierStatus(bid, 'Perbaikan direncanakan', 'Dikelompokkan ke ' + p.title, user); if (e) return e;
      b.pkgId = pid; const cid = nid(db.commitments, 'c');
      db.commitments.push({ id: cid, pkgId: pid, barrierId: bid, orgId: b.orgId, task: `Perbaiki: ${b.cat} (${M.segOf(M.journey(b.journeyId), b.segId)?.name || ''})`, status: 'Diminta', progress: 'Belum dimulai', deadline: new Date(Date.now() + 7 * 864e5).toISOString(), start: p.start, end: p.end, cost: cost || 0, priority: b.priority, notes: [] });
      if (b.orgId) M.notify('partner', 'Permintaan perbaikan', `Permintaan perbaikan baru: ${b.cat} — paket “${p.title}”. Mohon respons dalam 7 hari.`, '/p/requests');
      M.log(user, `Menambahkan ${bid} ke ${p.title}`, pid); if (!quiet) M.save(); return null;
    },
    respond(cid, kind, text, user) {
      const c = M.commit(cid); if (!c || c.status !== 'Diminta') return 'Permintaan sudah direspons.';
      if (kind === 'decline' && !(text || '').trim()) return 'Alasan penolakan wajib diisi.';
      if (kind === 'alt' && !(text || '').trim()) return 'Jelaskan alternatif yang diusulkan.';
      c.status = { accept: 'Diterima', decline: 'Ditolak', alt: 'Alternatif diusulkan' }[kind]; c.response = text || ''; c.respondedAt = new Date().toISOString();
      const p = M.pkg(c.pkgId); p.thread.push({ by: user.name, role: 'partner', ts: c.respondedAt, text: ({ accept: 'Menerima: ', decline: 'Menolak. Alasan: ', alt: 'Usulan alternatif: ' }[kind]) + (text || c.task) });
      M.notify('coordinator', 'Komitmen mitra', `${M.orgName(c.orgId)} ${kind === 'accept' ? 'menerima' : kind === 'decline' ? 'menolak' : 'mengusulkan alternatif untuk'} permintaan “${c.task}”.`, '/c/packages/' + c.pkgId);
      if (kind === 'accept') { const j = M.journey(p.journeyId); if (j) M.notify('traveler', 'Komitmen mitra', `${M.orgName(c.orgId)} menerima permintaan perbaikan untuk “${j.title}”.`, '/t/journeys/' + j.id); }
      M.log(user, `Respons komitmen ${c.id}: ${c.status}`, c.id); M.save(); return null;
    },
    reassign(cid, orgId, user) { const c = M.commit(cid); c.orgId = orgId; c.status = 'Diminta'; c.deadline = new Date(Date.now() + 7 * 864e5).toISOString(); M.barrier(c.barrierId).orgId = orgId; M.notify('partner', 'Permintaan perbaikan', `Permintaan perbaikan baru ditugaskan: ${c.task}`, '/p/requests'); M.log(user, `Menugaskan ulang ${c.id} ke ${M.orgName(orgId)}`, c.id); M.save(); },
    progress(cid, st, note, user) {
      const c = M.commit(cid); if (!c || !['Diterima', 'Menunggu verifikasi'].includes(c.status)) return 'Komitmen belum diterima.';
      if (['Tertunda', 'Tuntas'].includes(st) && !(note || '').trim()) return 'Catatan wajib diisi untuk status Delayed/Completed.';
      c.progress = st === 'Tuntas' ? 'Menunggu verifikasi' : st; if (note) c.notes.push({ ts: new Date().toISOString(), text: note });
      const p = M.pkg(c.pkgId);
      if (['Tuntas', 'Menunggu verifikasi'].includes(st)) {
        c.status = 'Menunggu verifikasi';
        const b = M.barrier(c.barrierId);
        if (b.status === 'Perbaikan direncanakan') M.setBarrierStatus(b.id, 'Selesai, menunggu verifikasi', note, user);
        if (!db.verifs.some(v => v.commitId === c.id && v.status !== 'Selesai')) db.verifs.push({ id: nid(db.verifs, 'vf'), barrierId: b.id, commitId: c.id, pkgId: c.pkgId, journeyId: b.journeyId, segId: b.segId, orgId: c.orgId, verifierId: 'u4', status: 'Menunggu jadwal', scheduled: null, method: '', checklist: {}, result: null, notes: '', followup: '', evidence: [], date: null });
        M.notify('verifier', 'Verifikasi lapangan', `Penugasan baru: verifikasi ${b.cat} (${b.id}).`, '/v/assigned');
        M.notify('coordinator', 'Progres proyek', `${M.orgName(c.orgId)} menandai “${c.task}” selesai — menunggu verifikasi.`, '/c/packages/' + c.pkgId);
      } else M.notify('coordinator', 'Progres proyek', `${M.orgName(c.orgId)}: “${c.task}” → ${st}.`, '/c/packages/' + c.pkgId);
      M.log(user, `Progres ${c.id} → ${st}`, c.id); if (p.status === 'Aktif') p.updated = new Date().toISOString(); M.save(); return null;
    },
    schedule(vid, when, method, user) { const v = M.verif(vid); if (!when) return 'Tanggal kunjungan wajib diisi.'; v.scheduled = new Date(when).toISOString(); v.method = method; v.status = 'Dijadwalkan'; M.notify('partner', 'Verifikasi lapangan', `Verifikasi ${v.barrierId} dijadwalkan ${new Date(v.scheduled).toLocaleDateString('id-ID')}.`, '/p/verification'); M.log(user, 'Menjadwalkan verifikasi ' + v.id, v.id); M.save(); return null; },
    submitVerif(vid, d, user) {
      const v = M.verif(vid); const answers = Object.values(d.checklist);
      if (!answers.length) return 'Isi minimal satu item daftar periksa.';
      if (!d.method) return 'Metode asesmen wajib dipilih.';
      if (!(d.notes || '').trim()) return 'Observasi pendukung wajib diisi.';
      if (!d.evidence.length) return 'Lampirkan minimal satu bukti foto.';
      if (d.result === 'Terverifikasi' && answers.some(a => a.a === 'Perlu perbaikan')) return 'Hasil “Terverifikasi” tidak dapat dipilih bila ada item Needs Improvement.';
      if (d.result === 'Terverifikasi' && answers.every(a => ['Tidak dapat diverifikasi', 'Tidak berlaku'].includes(a.a))) return 'Tidak ada item yang benar-benar diverifikasi (Pass).';
      Object.assign(v, { checklist: d.checklist, method: d.method, notes: d.notes, followup: d.followup, evidence: d.evidence, result: d.result, date: new Date().toISOString(), scope: d.scope, needsApplicable: d.needs });
      const b = M.barrier(v.barrierId), c = M.commit(v.commitId);
      if (d.result === 'Terverifikasi') { v.status = 'Selesai'; M.setBarrierStatus(b.id, 'Terverifikasi', 'Diverifikasi independen.', user); c.status = 'Selesai'; c.progress = 'Tuntas'; }
      else if (d.result === 'Perlu uji ulang') { v.status = 'Menunggu jadwal'; }
      else { v.status = 'Selesai'; M.setBarrierStatus(b.id, 'Perbaikan direncanakan', `Verifikasi: ${d.result}. ${d.followup || ''}`, user); c.status = 'Diterima'; c.progress = 'Sedang berjalan'; M.notify('partner', 'Verifikasi lapangan', `Verifikasi ${b.id}: ${d.result}. Perlu tindak lanjut.`, '/p/verification'); }
      const j = M.journey(v.journeyId);
      M.notify('coordinator', 'Verifikasi lapangan', `Hasil verifikasi ${b.id}: ${d.result}.`, '/c/packages/' + v.pkgId);
      if (M.journeyStatus(j) === 4) { M.notify('traveler', 'Uji pengguna', `Perjalanan “${j.title}” siap untuk pengujian pengguna.`, '/t/journeys/' + j.id); M.notify('coordinator', 'Uji pengguna', `Perjalanan “${j.title}” siap untuk pengujian.`, '/c/journeys'); }
      M.log(user, `Keputusan verifikasi: ${d.result} untuk ${b.id}`, v.id); M.save(); return null;
    },
    submitTest(jid, d, user) {
      if (!d.walked) return 'Konfirmasi bahwa Anda telah menempuh seluruh perjalanan.'; if (!d.needs.length) return 'Pilih kebutuhan akses yang diuji.'; if (!(d.feedback || '').trim()) return 'Umpan balik wajib diisi.';
      db.tests.push({ id: nid(db.tests, 't'), journeyId: jid, userId: user.id, needs: d.needs, result: d.result, feedback: d.feedback, date: new Date().toISOString() });
      const j = M.journey(jid); j.updated = new Date().toISOString(); M.notify('coordinator', 'Uji pengguna', `Uji pengguna “${j.title}”: ${d.result === 'success' ? 'berhasil' : 'belum berhasil'}.`, '/c/reports'); M.log(user, `Uji pengguna ${j.title}: ${d.result}`, jid); M.save(); return null;
    }
  };
  window.M = M;
})();
