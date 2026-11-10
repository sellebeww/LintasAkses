/* Copyright (c) 2026 Vassel Goleyu. All rights reserved. */
/* Public screens: login, role-based registration, demo access, public impact dashboard, policy pages. */
(function () {
  const { h, raw, ic, field, checks, card, link, btn, route, go, S, HOME, ROLES, DEMO_USER, A, Fm, UI, toast, rp, fmtD, empty, badge, kpi } = U;
  const db = () => M.db;

  /* ---------- login ---------- */
  const ROLE_INFO = {
    traveler: ['Pelancong / Pengguna Akses', 'Petakan perjalanan, laporkan hambatan, ikuti perkembangan dan uji perjalanan.', 'route'],
    partner: ['Mitra Lokasi / Layanan', 'Kelola lokasi, respons permintaan perbaikan, catat komitmen dan progres.', 'building'],
    coordinator: ['Koordinator Proyek', 'Kelompokkan hambatan menjadi paket, tugaskan mitra, pantau anggaran dan dampak.', 'package'],
    verifier: ['Verifikator Lapangan', 'Periksa perbaikan secara independen dengan daftar periksa terstruktur.', 'shield'],
    admin: ['Administrator Platform', 'Kelola pengguna, organisasi, moderasi laporan, dan log audit.', 'settings']
  };
  route('/login', 'any', () => {
    if (S.user()) { setTimeout(() => go(HOME[S.user().role]), 0); }
    return {
      title: 'Masuk', cls: 'narrow-pg', hdr: '', body: h`
      <div class="auth-wrap">
        <section class="card auth-c" aria-labelledby="lg-h"><h1 id="lg-h">Masuk ke LintasAkses</h1><p class="muted">Masuk dengan akun Anda untuk melanjutkan perjalanan.</p>
        <form data-form="login" novalidate>
          ${field({ name: 'email', label: 'Alamat email', type: 'email', req: true, ac: 'email', ph: 'nama@organisasi.id' })}
          <div class="fld"><label for="f-password">Kata sandi<span class="req" aria-hidden="true"> *</span></label><div class="pw"><input id="f-password" name="password" type="password" autocomplete="current-password" required aria-describedby="f-password-e"><button type="button" class="icon-btn" data-act="togglePw" aria-label="Tampilkan kata sandi" aria-pressed="false">${ic('eye')}</button></div><p class="err" id="f-password-e" role="alert"></p></div>
          <div class="row-sb"><label class="chk-i"><input type="checkbox" name="remember"><span>Ingat saya</span></label><a href="#/page/forgot">Lupa kata sandi?</a></div>
          <p class="form-err err" role="alert"></p>
          <button class="btn btn-p blk" type="submit" style="margin-top:20px">Masuk</button>
        </form>
        <div class="or-sep"><span>atau</span></div>
        ${link('Coba dengan akun demo', '/demo', 'btn-s blk', 'users')}
        <p class="muted sm-t" style="margin-top:24px;text-align:center">Belum punya akun? <a href="#/register">Daftar sekarang</a></p>
        <p class="note-s">Autentikasi pada prototipe ini <strong>disimulasikan</strong>: kata sandi tidak disimpan dan tidak diperiksa ke server. Contoh email: <code>dewi@demo.lintasakses.id</code> dengan kata sandi bebas (minimal 8 karakter).</p>
        </section>
      </div>`
    };
  });
  /* pilih akun dulu, baru masuk */
  route('/demo', 'any', () => ({
    title: 'Pilih Akun Demo', cls: 'narrow-pg', hdr: '', body: h`
    <div class="demo-top"><span class="demo-tag" style="justify-self:start;margin:0">Mode demonstrasi</span><h1>Pilih akun demo</h1>
      <p>Pilih satu akun untuk menjelajah aplikasi dari sudut pandang perannya. Tanpa kata sandi. Semua data bersifat simulasi dan hanya tersimpan di browser ini. Anda bisa berganti peran kapan saja dari menu samping.</p></div>
    <ul class="acct-grid">${Object.keys(ROLE_INFO).map(r => h`<li><a class="acct" href="#/demo/${r}"><span class="av" aria-hidden="true">${M.userName(DEMO_USER[r]).split(' ').map(x => x[0]).slice(0, 2).join('')}</span><span><span class="rl">${ROLES[r]}</span><b>${M.userName(DEMO_USER[r])}</b><small>${ROLE_INFO[r][1]}</small></span>${ic('arrow', 'arr')}</a></li>`)}</ul>
    <p class="center-p" style="margin-top:8px">Punya akun sendiri? <a href="#/login">Masuk di sini</a></p>`
  }));
  A.togglePw = t => { const i = U.$('#f-password'), s = i.type === 'password'; i.type = s ? 'text' : 'password'; t.setAttribute('aria-pressed', s); t.setAttribute('aria-label', s ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'); t.innerHTML = ic(s ? 'eyeoff' : 'eye').__raw; };
  Fm.login = d => {
    const er = {}; const em = (d.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) er.email = 'Masukkan alamat email yang valid.';
    if (!d.password) er.password = 'Kata sandi wajib diisi.'; else if (d.password.length < 8) er.password = 'Kata sandi minimal 8 karakter.';
    if (Object.keys(er).length) return { errors: er };
    const u = db().users.find(x => x.email.toLowerCase() === em);
    if (!u) return { errors: { email: 'Email tidak terdaftar. Periksa kembali atau daftar akun baru.' } };
    if (u.status === 'Ditangguhkan') return 'Akun ini ditangguhkan. Hubungi administrator.';
    S.set({ userId: u.id, demo: false }); u.last = new Date().toISOString(); M.save();
    const nx = sessionStorage.getItem('lintasakses.next'); sessionStorage.removeItem('lintasakses.next');
    toast('Selamat datang, ' + u.name.split(' ')[0] + '!'); go(nx && nx.startsWith(HOME[u.role]) ? nx : HOME[u.role]);
  };
  route('/demo/:role', 'any', p => { if (!ROLE_INFO[p.role]) return U.empty('Peran tidak ditemukan', ''); S.set({ userId: DEMO_USER[p.role], demo: true }); setTimeout(() => go(HOME[p.role]), 0); return { title: 'Menyiapkan demo', body: h`<p class="center-p">Menyiapkan mode demonstrasi…</p>`, hdr: '' }; });

  /* ---------- register ---------- */
  const R = { step: 1, role: null };
  route('/register', 'any', () => {
    const roles = ['traveler', 'partner', 'coordinator', 'verifier', 'admin'];
    const stepper = U.stepper(['Pilih peran', R.role === 'traveler' ? 'Data akun' : 'Data akun & organisasi', 'Selesai'], R.step - 1);
    let body;
    if (R.step === 1) body = h`<h2>Pilih jenis akun</h2><p class="muted">Alur pendaftaran menyesuaikan peran yang Anda pilih.</p>
      <form data-form="regRole" novalidate><div class="role-grid" role="radiogroup" aria-label="Jenis akun">${roles.map(r => h`<label class="role-c ${R.role === r ? 'sel' : ''} ${r === 'admin' ? 'dis' : ''}"><input type="radio" name="role" value="${r}" ${R.role === r ? raw('checked') : ''} ${r === 'admin' ? raw('disabled') : ''}>${ic(ROLE_INFO[r][2], 'lg')}<b>${ROLE_INFO[r][0]}</b><small>${r === 'admin' ? 'Hanya melalui undangan internal.' : ROLE_INFO[r][1]}</small></label>`)}</div>
      <p class="form-err err" role="alert"></p><button class="btn btn-p" type="submit">Lanjut ${ic('arrow')}</button></form>`;
    else {
      const org = R.role !== 'traveler';
      body = h`<h2>${ROLE_INFO[R.role][0]}</h2><form data-form="register" novalidate>
        <div class="f2">${field({ name: 'name', label: 'Nama lengkap', req: true, ac: 'name' })}${field({ name: 'email', label: 'Email', type: 'email', req: true, ac: 'email' })}</div>
        ${field({ name: 'password', label: 'Kata sandi', type: 'password', req: true, ac: 'new-password', hint: 'Minimal 8 karakter.' })}
        ${org ? h`<fieldset class="grp"><legend>Verifikasi organisasi</legend><p class="muted">Organisasi akan ditinjau administrator sebelum tugas dapat diterima. Dokumen hanya terlihat oleh peninjau.</p>
          <div class="f2">${field({ name: 'orgName', label: 'Nama organisasi', req: true })}${field({ name: 'orgType', label: 'Jenis organisasi', type: 'select', req: true, opts: ['Operator destinasi', 'Penyedia transportasi', 'Hotel / akomodasi', 'Pengelola infrastruktur publik', 'Verifikator independen', 'Konsorsium / koordinator', 'Lainnya'], ph: 'Pilih jenis' })}</div>
          <div class="f2">${field({ name: 'regNo', label: 'Nomor registrasi / izin', req: true, hint: 'Contoh simulasi: SIM-123456.' })}${field({ name: 'contact', label: 'Kontak berwenang (nama & jabatan)', req: true })}</div>
          ${field({ name: 'doc', label: 'Dokumen pendukung (akta / surat tugas)', type: 'file', hint: 'Hanya nama berkas yang dicatat pada prototipe ini.', multiple: true })}</fieldset>` : ''}
        <label class="chk-i"><input type="checkbox" name="agree" id="f-agree" aria-describedby="f-agree-e"><span>Saya menyetujui <a href="#/page/privacy" target="_blank" rel="noopener">Kebijakan Privasi</a> dan <a href="#/page/terms" target="_blank" rel="noopener">Ketentuan Layanan</a>.</span></label><p class="err" id="f-agree-e" role="alert"></p>
        <p class="form-err err" role="alert"></p><div class="row-g"><button class="btn btn-s" type="button" data-act="regBack">Kembali</button><button class="btn btn-p" type="submit">Buat akun</button></div>
        <p class="note-s">Prototipe: kata sandi tidak disimpan. Data hanya tersimpan di browser ini.</p></form>`;
    }
    return { title: 'Daftar akun', cls: 'narrow-pg', hdr: '', body: h`<section class="card auth-c wide-c"><h1>Daftar akun</h1>${stepper}${body}</section>` };
  });
  A.regBack = () => { R.step = 1; U.render(); };
  Fm.regRole = d => { if (!d.role) return 'Pilih salah satu jenis akun.'; R.role = d.role; R.step = 2; U.render(); };
  document.addEventListener('change', e => { if (e.target.name === 'role' && e.target.closest('.role-grid')) U.$$('.role-c').forEach(c => c.classList.toggle('sel', c.contains(e.target))); });
  Fm.register = d => {
    const er = {}; const em = (d.email || '').trim().toLowerCase();
    if (!(d.name || '').trim()) er.name = 'Nama lengkap wajib diisi.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) er.email = 'Masukkan alamat email yang valid.'; else if (db().users.some(u => u.email.toLowerCase() === em)) er.email = 'Email sudah terdaftar.';
    if (!d.password || d.password.length < 8) er.password = 'Kata sandi minimal 8 karakter.';
    if (R.role !== 'traveler') { ['orgName', 'orgType', 'regNo', 'contact'].forEach(k => { if (!(d[k] || '').trim()) er[k] = 'Wajib diisi.'; }); }
    if (!d.agree) er.agree = 'Anda harus menyetujui kebijakan privasi dan ketentuan layanan.';
    if (Object.keys(er).length) return { errors: er };
    const id = 'u' + (db().users.reduce((m, u) => Math.max(m, parseInt(u.id.slice(1)) || 0), 0) + 1);
    const user = { id, name: d.name.trim(), email: em, role: R.role, status: 'Aktif', created: new Date().toISOString(), last: new Date().toISOString(), prefs: [] };
    if (R.role !== 'traveler') {
      const oid = 'o' + (db().orgs.reduce((m, o) => Math.max(m, parseInt(o.id.slice(1)) || 0), 0) + 1);
      db().orgs.push({ id: oid, name: d.orgName.trim(), type: d.orgType, status: 'Menunggu verifikasi', contact: d.contact, email: em, regNo: d.regNo, docs: U.arr(d.doc).filter(Boolean), joined: new Date().toISOString() }); user.orgId = oid;
      M.notify('admin', 'Pengumuman sistem', `Organisasi “${d.orgName.trim()}” menunggu verifikasi.`, '/a/orgs');
    }
    db().users.push(user); M.save(); S.set({ userId: id, demo: false }); R.step = 1; R.role = null;
    toast(R.role === 'traveler' ? 'Akun dibuat. Selamat datang!' : 'Akun dibuat. Organisasi Anda menunggu verifikasi administrator.'); go(HOME[user.role]);
  };

  /* ---------- static pages ---------- */
  const PAGES = {
    help: ['Pusat Bantuan', [['Bagaimana memulai?', 'Coba akun demo dari halaman Masuk, atau daftar sebagai pelancong atau mitra. Pelancong memetakan perjalanan lalu melaporkan hambatan.'], ['Siapa yang melihat laporan saya?', 'Anda memilih visibilitas: publik tanpa identitas, dibagikan ke mitra proyek, atau privat untuk peninjau berwenang.'], ['Apa arti “Terverifikasi”?', 'Perbaikan telah diperiksa verifikator independen untuk ruang lingkup tertentu. Ini bukan sertifikasi resmi pemerintah.'], ['Apakah data ini nyata?', 'Tidak. Seluruh data pada prototipe adalah simulasi di wilayah fiktif Kawasan Puspa.']]],
    privacy: ['Kebijakan Privasi (ringkasan prototipe)', [['Data minimum', 'Kami tidak meminta diagnosis medis. Preferensi akses bersifat sukarela.'], ['Bukti foto', 'Jangan mengunggah informasi pribadi atau foto orang lain tanpa izin. Moderator dapat menghapus data sensitif.'], ['Penyimpanan', 'Pada prototipe, data tersimpan hanya di browser Anda (localStorage) dan tidak dikirim ke server.'], ['Hak Anda', 'Anda dapat menghapus perjalanan Anda dan mengatur ulang data demo kapan saja.']]],
    terms: ['Ketentuan Layanan (ringkasan prototipe)', [['Sifat prototipe', 'Layanan ini adalah demonstrasi konsep. Tidak ada transaksi uang yang diproses; angka anggaran bersifat ilustratif.'], ['Integritas status', 'Pembayaran atau hubungan komersial tidak boleh mengubah status aksesibilitas atau menyembunyikan laporan negatif.'], ['Batas klaim', 'Hasil uji pengguna hanya berlaku untuk kebutuhan akses dan pengguna yang terlibat dalam pengujian.']]],
    a11y: ['Pernyataan Aksesibilitas', [['Target', 'LintasAkses dirancang menuju WCAG 2.2 AA: navigasi keyboard, label formulir, fokus terlihat, kontras teks, dan dukungan reduced motion.'], ['Alternatif non-visual', 'Peta skematis dan grafik selalu disertai daftar atau tabel yang setara.'], ['Keterbatasan', 'Prototipe belum diaudit pihak ketiga. Kami tidak mengklaim kesesuaian penuh. Laporkan kendala melalui Pusat Bantuan.']]],
    forgot: ['Lupa kata sandi', [['Prototipe', 'Pada prototipe ini tidak ada kata sandi tersimpan. Gunakan akun demo dari halaman Masuk.']]]
  };
  route('/page/:id', 'any', p => {
    const pg = PAGES[p.id]; if (!pg) return { title: 'Tidak ditemukan', body: empty('Halaman tidak ditemukan', '', link('Kembali ke halaman masuk', '/login')) };
    return { title: pg[0], cls: 'narrow-pg', body: h`<article class="card prose">${pg[1].map(([a, b]) => h`<h2>${a}</h2><p>${b}</p>`)}<p class="muted">Kembali ke <a href="../index.html">situs publik</a>.</p></article>` };
  });
  route('/404', 'any', () => ({ title: 'Halaman tidak ditemukan', body: empty('Halaman tidak ditemukan', 'Alamat yang Anda tuju tidak ada.', link('Ke halaman masuk', '/login')) }));
  route('/', 'any', () => { setTimeout(() => go(S.user() ? HOME[S.user().role] : '/login'), 0); return { title: 'LintasAkses', hdr: '', body: h`<p class="center-p">Memuat…</p>` }; });

  /* ---------- public impact dashboard ---------- */
  const hbar = (items, fmt = v => v) => { const mx = Math.max(1, ...items.map(i => i[1])); return h`<ul class="hbar">${items.map(([l, v, c]) => h`<li><span class="hb-l">${l}</span><span class="hb-t"><i style="width:${(v / mx) * 100}%;${c ? 'background:' + c : ''}"></i></span><b class="hb-v">${fmt(v)}</b></li>`)}</ul>`; };
  const month = i => { const d = new Date(i); return d.getFullYear() * 12 + d.getMonth(); };
  const mlabel = k => new Date(Math.floor(k / 12), k % 12, 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
  function lineChart(series, labels) {
    const W = 560, Hh = 190, pad = 34, mx = Math.max(1, ...series.flatMap(s => s.v)), x = i => pad + i * (W - pad * 2) / Math.max(1, labels.length - 1), y = v => Hh - pad - (v / mx) * (Hh - pad * 2);
    return h`<svg viewBox="0 0 ${W} ${Hh}" class="line-c" role="img" aria-label="Grafik garis: ${series.map(s => s.n).join(' dan ')} kumulatif per bulan. Data lengkap tersedia pada tabel di bawah.">
      ${[0, .5, 1].map(f => h`<line x1="${pad}" x2="${W - pad}" y1="${y(mx * f)}" y2="${y(mx * f)}" class="gl"/><text x="${pad - 6}" y="${y(mx * f) + 4}" class="ax" text-anchor="end">${Math.round(mx * f)}</text>`)}
      ${labels.map((l, i) => h`<text x="${x(i)}" y="${Hh - 10}" class="ax" text-anchor="middle">${l}</text>`)}
      ${series.map((s, si) => h`<polyline fill="none" class="ln ln${si}" points="${s.v.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>${s.v.map((v, i) => h`<circle cx="${x(i)}" cy="${y(v)}" r="4" class="pt pt${si}"><title>${s.n}, ${labels[i]}: ${v}</title></circle>`)}`)}</svg>
      <ul class="lg-l"><li><i class="sw s0"></i>${series[0].n}</li><li><i class="sw s1"></i>${series[1].n}</li></ul>`;
  }
  const chartCard = (title, tipTxt, chart, tbl) => card(h`${title} ${U.tip(tipTxt)}`, h`${chart}<details class="alt"><summary>Lihat sebagai tabel</summary>${tbl}</details>`, null, 'chart-c');
  const tbl = (cols, rows, cap) => h`<div class="tbl-w"><table class="tbl"><caption class="sr">${cap}</caption><thead><tr>${cols.map(c => h`<th scope="col">${c}</th>`)}</tr></thead><tbody>${rows.map(r => h`<tr>${r.map((c, i) => i === 0 ? h`<th scope="row">${c}</th>` : h`<td>${c}</td>`)}</tr>`)}</tbody></table></div>`;

  function impactData() {
    const d = db(), js = d.journeys, st = [1, 2, 3, 4, 5].map(n => [n, js.filter(j => M.journeyStatus(j) === n).length]);
    const verified = d.barriers.filter(b => b.status === 'Terverifikasi').length, open = d.barriers.filter(b => !['Terverifikasi', 'Ditolak'].includes(b.status)).length;
    const tested = [...new Set(d.tests.filter(t => t.result === 'success').map(t => t.journeyId))];
    const combos = new Set(d.tests.filter(t => t.result === 'success').flatMap(t => t.needs.map(n => t.journeyId + '|' + n))).size;
    const partners = new Set(d.commitments.map(c => c.orgId)).size;
    const cats = M.CATS.map(c => [c, d.barriers.filter(b => b.cat === c && b.status !== 'Ditolak').length]).filter(x => x[1]);
    const byOrg = [...new Set(d.commitments.map(c => c.orgId))].map(o => [M.orgName(o), d.commitments.filter(c => c.orgId === o).length]);
    const bu = d.packages.reduce((a, p) => ({ i: a.i + p.budget.improvement, c: a.c + p.budget.coordination, v: a.v + p.budget.verification }), { i: 0, c: 0, v: 0 });
    const keys = []; const now = month(new Date().toISOString()); for (let k = now - 5; k <= now; k++) keys.push(k);
    const cum = (arr, f) => keys.map(k => arr.filter(x => month(f(x)) <= k).length);
    return { js, st, verified, open, tested, combos, partners, cats, byOrg, bu, keys, rep: cum(d.barriers, b => b.created), ver: cum(d.verifs.filter(v => v.result === 'Terverifikasi'), v => v.date), cost: M.costPerValidated(), pkgs: d.packages.filter(p => p.status === 'Aktif').length, staleCount: d.verifs.filter(v => v.result === 'Terverifikasi' && M.isStale(v.date)).length, assessed: js.filter(j => j.assessed).length };
  }
  window.impactData = impactData; window.impactCharts = (D) => ({ hbar, lineChart, tbl });
  route('/impact', 'any', () => {
    const D = impactData(); const COL = { 1: '#9AA8B5', 2: '#C65E5E', 3: '#C58A32', 4: '#315D78', 5: '#27845C' };
    return {
      title: 'Dasbor Dampak', cls: 'impact-pg', hdr: h`<div class="ph hero-i"><p class="eyebrow-a">Dasbor publik · data simulasi</p><h1>Mengukur perjalanan yang benar-benar terwujud.</h1><p>Aktivitas bukan hasil. Halaman ini memisahkan <b>aktivitas</b>, <b>keluaran</b>, dan <b>hasil</b>, dan menjelaskan cara menghitung masing-masing. Seluruh angka berasal dari data demo fiktif.</p></div>`,
      body: h`
      <div class="sim-b" role="note">${ic('info')}<span><strong>Data simulasi.</strong> Wilayah demo “Kawasan Puspa” fiktif. Angka mengikuti rekaman pada prototipe ini dan berubah ketika Anda menjalankan alur demo.</span></div>
      <div class="tiers-a">
        <section class="tier-a" aria-labelledby="t-a"><p class="tier-k">Aktivitas · tindakan yang dilakukan</p><h2 id="t-a" class="sr">Aktivitas</h2><div class="kpis">${[['Perjalanan dinilai', D.assessed, 'Perjalanan dengan penilaian awal', 'route'], ['Perjalanan dengan hambatan ditangani', D.js.filter(j => M.journeyStatus(j) === 3).length, 'Perbaikan sedang berlangsung', 'wrench'], ['Mitra berpartisipasi', D.partners, 'Organisasi dengan komitmen', 'users']].map(k => kpi(...k))}</div></section>
        <section class="tier-a" aria-labelledby="t-o"><p class="tier-k">Keluaran · hambatan yang diperbaiki</p><h2 id="t-o" class="sr">Keluaran</h2><div class="kpis">${[['Perbaikan terverifikasi', D.verified, 'Diperiksa verifikator independen', 'shield'], ['Hambatan menunggu perbaikan', D.open, 'Belum terverifikasi', 'alert']].map(k => kpi(...k))}</div></section>
        <section class="tier-a out" aria-labelledby="t-r"><p class="tier-k">Hasil · perjalanan yang terbukti</p><h2 id="t-r" class="sr">Hasil</h2><div class="kpis">${[['Perjalanan berhasil diuji', D.tested.length, 'Segmen kritis terverifikasi + uji pengguna', 'check'], ['Kombinasi perjalanan × kebutuhan akses', D.combos, 'Bukan jaminan untuk semua orang', 'users']].map(k => kpi(...k))}</div></section>
      </div>
      <div class="grid2">
        ${chartCard('Distribusi status perjalanan', 'Jumlah perjalanan per status, dihitung dari data hambatan, komitmen, dan uji pengguna. Status tidak diatur manual.', hbar(D.st.map(([n, v]) => [M.JSTAT[n], v, COL[n]])), tbl(['Status', 'Jumlah'], D.st.map(([n, v]) => [M.JSTAT[n], v]), 'Distribusi status perjalanan'))}
        ${chartCard('Kategori hambatan', 'Jumlah laporan hambatan per kategori (tidak termasuk laporan yang ditolak).', hbar(D.cats), tbl(['Kategori', 'Jumlah'], D.cats, 'Kategori hambatan'))}
        ${chartCard('Kemajuan perbaikan dari waktu ke waktu', 'Kumulatif laporan hambatan dan perbaikan terverifikasi per bulan, berdasarkan tanggal laporan dan tanggal keputusan verifikasi.', lineChart([{ n: 'Hambatan dilaporkan', v: D.rep }, { n: 'Perbaikan terverifikasi', v: D.ver }], D.keys.map(mlabel)), tbl(['Bulan', 'Dilaporkan (kumulatif)', 'Terverifikasi (kumulatif)'], D.keys.map((k, i) => [mlabel(k), D.rep[i], D.ver[i]]), 'Kemajuan perbaikan per bulan'))}
        ${chartCard('Partisipasi mitra', 'Jumlah tugas perbaikan (komitmen) per organisasi mitra.', hbar(D.byOrg), tbl(['Organisasi', 'Tugas'], D.byOrg, 'Partisipasi mitra'))}
        ${chartCard('Alokasi anggaran proyek (ilustratif)', 'Total anggaran usulan seluruh paket, dipecah per komponen. Angka ilustratif; platform tidak menyimpan atau memindahkan dana.', hbar([['Perbaikan', D.bu.i, '#157C78'], ['Koordinasi', D.bu.c, '#315D78'], ['Verifikasi', D.bu.v, '#C58A32']], rp), tbl(['Komponen', 'Anggaran (ilustratif)'], [['Perbaikan', rp(D.bu.i)], ['Koordinasi', rp(D.bu.c)], ['Verifikasi', rp(D.bu.v)]], 'Alokasi anggaran'))}
        ${card(h`Biaya per perjalanan tervalidasi ${U.tip('Total belanja aktual paket yang selesai untuk perjalanan tervalidasi, dibagi jumlah uji pengguna berhasil. Tidak dihitung bila belum ada perjalanan tervalidasi.')}`, D.cost ? h`<p class="big-n">${rp(D.cost.value)}</p><p class="muted">= ${rp(D.cost.spend)} belanja aktual (ilustratif) ÷ ${D.cost.n} perjalanan tervalidasi.</p>` : h`<p class="big-n">Belum dapat dihitung</p><p class="muted">Belum ada perjalanan yang lolos verifikasi dan uji pengguna.</p>`, null, 'chart-c')}
      </div>
      ${card('Metodologi dan batas klaim', h`<div class="meth">
        <details open><summary>Aktivitas, keluaran, dan hasil</summary><p><b>Aktivitas</b> adalah tindakan (penilaian, paket, komitmen). <b>Keluaran</b> adalah hambatan yang diperbaiki dan terverifikasi. <b>Hasil</b> adalah perjalanan yang benar-benar dapat ditempuh. Memasang fasilitas bukan bukti perjalanan berhasil.</p></details>
        <details><summary>Kapan perjalanan dihitung berhasil?</summary><p>Hanya bila (1) seluruh hambatan pada perjalanan berstatus Terverifikasi atau Ditolak, dan (2) pengguna dengan kebutuhan akses yang relevan menyelesaikan perjalanan serta memberi umpan balik. Hitungan dilakukan per kombinasi perjalanan × kebutuhan akses.</p></details>
        <details><summary>Apa yang tidak dijamin?</summary><p>Satu uji berhasil tidak menjamin aksesibilitas untuk semua orang atau semua kebutuhan. Verifikasi LintasAkses adalah penilaian independen internal, bukan sertifikasi resmi pemerintah.</p></details>
        <details><summary>Informasi verifikasi yang usang</summary><p>Keputusan verifikasi yang lebih tua dari 12 bulan ditandai kedaluwarsa dan tidak dihitung sebagai bukti terkini sampai diverifikasi ulang. Saat ini: <b>${D.staleCount}</b> keputusan kedaluwarsa pada data demo.</p></details>
        <details><summary>Integritas</summary><p>Hubungan komersial tidak dapat mengubah status atau menyembunyikan laporan negatif. Setiap keputusan status dan anggaran tercatat pada log audit.</p></details></div>`)}`
    };
  });
})();
