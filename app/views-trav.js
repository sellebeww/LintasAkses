/* Copyright (c) 2026 Vassel Goleyu. All rights reserved. */
/* Traveler experience: overview, journeys, wizard, journey detail + schematic map, reporting, notifications. */
(function () {
  const { h, raw, ic, field, checks, radios, card, kpis, link, btn, route, go, S, A, Fm, UI, toast, fmtD, fmtDT, ago, empty, badge, bst, jbadge, sgbadge, prb, cbadge, table, searchBox, selFilter, modal, closeModal, confirmDlg, stepper, arr, esc, $, $$, HOME } = U;
  const db = () => M.db, me = () => S.user();
  const VIS = [['Publik, tanpa data pribadi', 'Publik, tanpa data pribadi', 'Terlihat di Explore tanpa nama Anda.'], ['Dibagikan ke mitra proyek', 'Dibagikan ke mitra proyek', 'Hanya mitra dan koordinator yang terlibat.'], ['Privat, hanya peninjau berwenang', 'Privat', 'Hanya peninjau berwenang (koordinator, administrator).']];
  const PLACES = ['Stasiun Contoh', 'Terminal Contoh', 'Halte Contoh', 'Museum Puspa', 'Pusat Informasi Puspa', 'Hotel Puspa Grand', 'Galeri Kota', 'Taman Puspa', 'Area Parkir Puspa', 'Gedung Serbaguna Puspa', 'Pasar Puspa', 'Balai Kota Puspa'];

  /* ---------- helpers ---------- */
  const jBarriers = j => db().barriers.filter(b => b.journeyId === j.id && b.status !== 'Ditolak');
  const jcard = (j, mine = true) => h`<article class="jcard"><div class="jc-h">${jbadge(M.journeyStatus(j))}<span class="muted sm-t">${ago(j.updated)}</span></div><h3>${j.title}</h3>
    ${j.title.includes(j.from) && j.title.includes(j.to) ? '' : h`<p class="jc-r">${ic('pin')}<span>${j.from}</span>${ic('arrow')}<span>${j.to}</span></p>`}
    <dl class="jc-m"><div><dt>Segmen</dt><dd>${j.segs.length}</dd></div><div><dt>Hambatan</dt><dd>${jBarriers(j).filter(b => b.status !== 'Terverifikasi').length}</dd></div><div><dt>Diperbarui</dt><dd>${fmtD(j.updated)}</dd></div></dl>
    <a class="btn btn-s blk" href="#/t/journeys/${j.id}">Lihat Detail<span class="sr"> ${j.title}</span></a></article>`;

  /* ---------- overview ---------- */
  route('/t', 'traveler', (_, u) => {
    const js = db().journeys.filter(j => j.userId === u.id), st = j => M.journeyStatus(j);
    const notes = db().notifs.filter(n => n.role === 'traveler').slice(0, 5);
    return {
      title: 'Beranda', hdr: h`<div class="ph row-sb"><div><h1>Selamat datang kembali!</h1><p>Rencanakan perjalanan yang lebih mudah diakses dan lihat perkembangan perbaikan di sepanjang perjalananmu.</p></div>${link('Buat Perjalanan Baru', '/t/journeys/new', 'btn-p', 'plus')}</div>`,
      body: h`${kpis([['Perjalanan tersimpan', js.length, '', 'route'], ['Sedang dinilai / terhambat', js.filter(j => st(j) <= 2).length, '', 'search'], ['Perbaikan berlangsung', js.filter(j => st(j) === 3).length, '', 'wrench'], ['Siap untuk pengujian', js.filter(j => st(j) === 4).length, '', 'users']])}
      <div class="grid-main">
        <div>${card('Perjalanan Terbaru', js.length ? h`<div class="jgrid">${js.slice(0, 3).map(j => jcard(j))}</div>` : empty('Belum ada perjalanan', 'Mulai dengan memetakan perjalanan pertama Anda.', link('Buat Perjalanan Baru', '/t/journeys/new', 'btn-p')), link('Lihat semua', '/t/journeys', 'btn-s sm'))}</div>
        <div>${card('Pembaruan Terbaru', notes.length ? h`<ul class="feed">${notes.map(n => h`<li class="${n.read ? '' : 'unread'}"><a href="#${n.link}">${n.text}</a><small>${ago(n.ts)} · ${n.cat}</small></li>`)}</ul>` : empty('Belum ada pembaruan', 'Pembaruan perjalanan akan muncul di sini.'), link('Notifikasi', '/t/notifications', 'btn-s sm'))}
        ${card('Preferensi Aksesibilitas', h`<p class="muted sm-t">Dipilih secara sukarela. Anda tidak perlu menyebut diagnosis.</p>${u.prefs && u.prefs.length ? h`<ul class="chips">${u.prefs.map(p => h`<li>${p}</li>`)}</ul>` : h`<p>Belum ada preferensi dipilih.</p>`}`, btn('Edit', 'editPrefs', null, 'btn-s sm', 'edit'))}</div>
      </div>`
    };
  });
  A.editPrefs = () => { const u = me(); modal('Preferensi Aksesibilitas', h`<form data-form="prefs" novalidate><p class="muted">Pilihan bersifat sukarela. Jangan memasukkan diagnosis medis.</p>${Object.entries(M.NEEDS).map(([k, v]) => checks('prefs', k, v, u.prefs || []))}<div class="md-f"><button type="button" class="btn btn-s" data-act="closeModal">Batal</button><button class="btn btn-p" type="submit">Simpan preferensi</button></div></form>`, { wide: true }); };
  Fm.prefs = d => { me().prefs = arr(d.prefs); M.save(); closeModal(); toast('Preferensi disimpan.'); U.render(); };

  /* ---------- my journeys ---------- */
  route('/t/journeys', 'traveler', (_, u) => {
    const q = (UI.f.q || '').toLowerCase(), s = UI.f.s, view = UI.f.view || 'grid';
    const js = db().journeys.filter(j => j.userId === u.id && (!q || (j.title + j.from + j.to).toLowerCase().includes(q)) && (!s || M.journeyStatus(j) === +s));
    return {
      title: 'Perjalanan Saya', sub: 'Perjalanan yang Anda simpan dan status aksesibilitasnya.', hdr: h`<div class="ph row-sb"><div><h1>My Journeys</h1><p>Perjalanan yang Anda simpan dan status aksesibilitasnya.</p></div>${link('Buat Perjalanan Baru', '/t/journeys/new', 'btn-p', 'plus')}</div>`,
      body: h`<div class="toolbar">${searchBox('q', 'Cari perjalanan, asal, atau tujuan')}${selFilter('s', 'Status', [1, 2, 3, 4, 5].map(n => [n, M.JSTAT[n]]))}
        <div class="seg-t" role="group" aria-label="Tampilan"><button class="btn btn-s sm" data-act="setView" data-id="grid" aria-pressed="${view === 'grid'}">${ic('grid')}Kartu</button><button class="btn btn-s sm" data-act="setView" data-id="list" aria-pressed="${view === 'list'}">${ic('list')}Daftar</button></div></div>
      <p class="sr" aria-live="polite">${js.length} perjalanan ditemukan</p>
      ${!js.length ? empty('Tidak ada perjalanan', q || s ? 'Tidak ada perjalanan yang cocok dengan filter.' : 'Anda belum menyimpan perjalanan.', link('Buat Perjalanan Baru', '/t/journeys/new', 'btn-p'))
          : view === 'grid' ? h`<div class="jgrid">${js.map(j => jcard(j))}</div>` : table({ id: 'myj', cap: 'Perjalanan saya', rows: js, cols: [{ h: 'Perjalanan', f: j => h`<a href="#/t/journeys/${j.id}">${j.title}</a>` }, { h: 'Segmen', f: j => j.segs.length }, { h: 'Hambatan terbuka', f: j => jBarriers(j).filter(b => b.status !== 'Terverifikasi').length }, { h: 'Status', f: j => jbadge(M.journeyStatus(j)) }, { h: 'Diperbarui', f: j => fmtD(j.updated) }] })}`
    };
  });
  A.setView = t => { UI.f.view = t.dataset.id; U.render(); };

  /* ---------- journey wizard ---------- */
  let W = null;
  const newW = () => ({ step: 1, title: '', from: '', to: '', stops: '', desc: '', date: '', segs: [{ type: 'transit', name: 'Titik awal', desc: '', orgId: '' }, { type: 'destination', name: 'Tujuan akhir', desc: '', orgId: '' }], needs: [], custom: '', notes: '' });
  document.addEventListener('input', e => {
    const f = e.target.closest && e.target.closest('#wiz'); if (!f || !W) return; const n = e.target.name;
    if (n === 'needs') W.needs = $$('[name=needs]:checked', f).map(x => x.value);
    else if (/^s\d+_/.test(n)) { const [i, k] = n.slice(1).split('_'); if (W.segs[+i]) W.segs[+i][k] = e.target.value; } else if (n in W) W[n] = e.target.value;
  });
  document.addEventListener('keydown', e => { const t = e.target; if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute && t.getAttribute('role') === 'button' && t.dataset.act) { e.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  const orgOpts = () => db().orgs.filter(o => o.type !== 'Verifikator independen').map(o => [o.id, o.name]);
  const wizView = (edit) => {
    if (edit) { const j = M.journey(edit); if (!j || j.userId !== me().id) return { title: 'Tidak ditemukan', body: empty('Perjalanan tidak ditemukan', '') }; if (!W || W.id !== edit) W = { id: edit, step: 1, title: j.title, from: j.from, to: j.to, stops: (j.stops || []).join(', '), desc: j.desc, date: j.date || '', segs: j.segs.map(s => ({ ...s })), needs: [...j.needs], custom: j.custom || '', notes: j.notes || '' }; }
    else if (!W || W.id) W = newW();
    const labels = ['Informasi', 'Segmen', 'Kebutuhan akses', 'Tinjau'];
    let b;
    if (W.step === 1) b = h`<h2>Mulai petakan perjalananmu.</h2><datalist id="places">${PLACES.map(p => h`<option value="${p}"></option>`)}</datalist><p class="note-s">Saran lokasi bersifat simulasi (Kawasan Puspa, fiktif). Tidak ada pemetaan atau validasi lokasi langsung.</p>
      ${field({ name: 'title', label: 'Nama perjalanan', req: true, value: W.title, ph: 'Mis. Stasiun Contoh → Museum Puspa' })}<div class="f2">${field({ name: 'from', label: 'Lokasi awal', req: true, value: W.from, list: 'places' })}${field({ name: 'to', label: 'Tujuan', req: true, value: W.to, list: 'places' })}</div>
      ${field({ name: 'stops', label: 'Pemberhentian di antara (opsional)', value: W.stops, list: 'places', hint: 'Pisahkan dengan koma.' })}${field({ name: 'desc', label: 'Deskripsi perjalanan', type: 'textarea', value: W.desc, rows: 3 })}${field({ name: 'date', label: 'Tanggal rencana (opsional)', type: 'date', value: W.date })}`;
    else if (W.step === 2) b = h`<h2>Transportasi dan segmen perjalanan</h2><p class="muted">Susun perjalanan sebagai rangkaian segmen. Anda dapat menambah, mengubah, menghapus, dan mengurutkan ulang.</p>
      <ol class="segs-e">${W.segs.map((s, i) => h`<li class="seg-e"><div class="seg-n">${i + 1}</div><div class="seg-f"><div class="f3">${field({ name: 's' + i + '_type', label: 'Jenis segmen', type: 'select', value: s.type, opts: Object.entries(M.SEGTYPES) })}${field({ name: 's' + i + '_name', label: 'Nama segmen', value: s.name, req: true })}${field({ name: 's' + i + '_orgId', label: 'Penanggung jawab (opsional)', type: 'select', value: s.orgId, opts: orgOpts(), ph: 'Belum diketahui' })}</div>
        <div class="row-g"><button type="button" class="btn btn-s sm" data-act="wizMove" data-id="${i}" data-d="-1" ${i === 0 ? raw('disabled') : ''}>${ic('up')}Naik<span class="sr"> segmen ${i + 1}</span></button><button type="button" class="btn btn-s sm" data-act="wizMove" data-id="${i}" data-d="1" ${i === W.segs.length - 1 ? raw('disabled') : ''}>${ic('down')}Turun<span class="sr"> segmen ${i + 1}</span></button><button type="button" class="btn btn-d sm" data-act="wizDel" data-id="${i}" ${W.segs.length <= 2 ? raw('disabled') : ''}>${ic('trash')}Hapus<span class="sr"> segmen ${i + 1}</span></button></div></div></li>`)}</ol>
      <button type="button" class="btn btn-s" data-act="wizAdd">${ic('plus')}Tambah segmen</button>
      <div class="seg-prev" aria-label="Pratinjau urutan segmen"><p class="sm-t muted">Pratinjau rangkaian:</p><ol>${W.segs.map(s => h`<li>${s.name || '(tanpa nama)'}</li>`)}</ol></div>`;
    else if (W.step === 3) b = h`<h2>Kebutuhan akses</h2><p class="muted">Pilih yang relevan. Tidak perlu menyebut diagnosis medis, dan semua pilihan bersifat sukarela.</p>${Object.entries(M.NEEDS).map(([k, v]) => checks('needs', k, v, W.needs))}${field({ name: 'custom', label: 'Kebutuhan lain (opsional)', type: 'textarea', value: W.custom, rows: 2 })}${field({ name: 'notes', label: 'Catatan tambahan (opsional)', type: 'textarea', value: W.notes, rows: 2 })}`;
    else b = h`<h2>Tinjau perjalanan</h2><dl class="rev-l"><div><dt>Nama</dt><dd>${W.title}</dd></div><div><dt>Asal → Tujuan</dt><dd>${W.from} → ${W.to}</dd></div>${W.stops ? h`<div><dt>Pemberhentian</dt><dd>${W.stops}</dd></div>` : ''}<div><dt>Tanggal rencana</dt><dd>${W.date ? fmtD(W.date) : 'Belum ditentukan'}</dd></div><div><dt>Segmen & moda</dt><dd><ol class="ol-s">${W.segs.map(s => h`<li>${s.name} <span class="muted">(${M.SEGTYPES[s.type]}${s.orgId ? ' · ' + M.orgName(s.orgId) : ''})</span></li>`)}</ol></dd></div><div><dt>Kebutuhan akses</dt><dd>${W.needs.length ? h`<ul class="chips">${W.needs.map(n => h`<li>${n}</li>`)}</ul>` : 'Tidak ada yang dipilih'}${W.custom ? h`<p>Lainnya: ${W.custom}</p>` : ''}</dd></div>${W.notes ? h`<div><dt>Catatan</dt><dd>${W.notes}</dd></div>` : ''}</dl>`;
    return {
      title: edit ? 'Edit Perjalanan' : 'Buat Perjalanan', cls: 'narrow-pg',
      body: card('', h`${stepper(labels, W.step - 1)}<form id="wiz" data-form="wiz" novalidate>${b}<p class="form-err err" role="alert"></p><div class="md-f">${W.step > 1 ? h`<button type="button" class="btn btn-s" data-act="wizBack">Kembali</button>` : h`<button type="button" class="btn btn-s" data-act="wizCancel">Batal</button>`}<button class="btn btn-p" type="submit">${W.step === 4 ? 'Simpan Perjalanan' : 'Lanjut'}</button></div></form>`)
    };
  };
  route('/t/journeys/new', 'traveler', () => wizView(null));
  route('/t/journeys/:id/edit', 'traveler', p => wizView(p.id));
  A.wizBack = () => { W.step--; U.render(); };
  A.wizCancel = () => { W = null; go('/t/journeys'); };
  A.wizAdd = () => { W.segs.splice(W.segs.length - 1, 0, { type: 'walking', name: '', desc: '', orgId: '' }); U.render(); };
  A.wizMove = t => { const i = +t.dataset.id, d = +t.dataset.d, j = i + d; if (j < 0 || j >= W.segs.length) return; [W.segs[i], W.segs[j]] = [W.segs[j], W.segs[i]]; U.render(); };
  A.wizDel = t => { const i = +t.dataset.id, s = W.segs[i]; if (s.id && db().barriers.some(b => b.segId === s.id)) return toast('Segmen ini memiliki laporan hambatan dan tidak dapat dihapus.', 'bad'); confirmDlg(`Hapus segmen “${s.name || i + 1}”?`, 'Hapus', () => { W.segs.splice(i, 1); U.render(); }); };
  Fm.wiz = d => {
    const er = {};
    if (W.step === 1) { ['title', 'from', 'to'].forEach(k => { if (!(W[k] || '').trim()) er[k] = 'Wajib diisi.'; }); if (W.from && W.to && W.from.trim().toLowerCase() === W.to.trim().toLowerCase()) er.to = 'Tujuan tidak boleh sama dengan lokasi awal.'; }
    if (W.step === 2) { W.segs.forEach((s, i) => { if (!(s.name || '').trim()) er['s' + i + '_name'] = 'Nama segmen wajib diisi.'; }); if (W.segs.length < 2) er._form = 'Minimal dua segmen.'; }
    if (Object.keys(er).length) return { errors: er };
    if (W.step < 4) { W.step++; return U.render(); }
    const payload = { title: W.title.trim(), from: W.from.trim(), to: W.to.trim(), stops: W.stops.split(',').map(x => x.trim()).filter(Boolean), desc: W.desc, date: W.date, needs: W.needs, custom: W.custom, notes: W.notes };
    if (W.id) { const j = M.journey(W.id); let mx = j.segs.reduce((m, s) => Math.max(m, parseInt(s.id.split('s').pop()) || 0), 0); payload.segs = W.segs.map(s => ({ cond: 'Belum ada catatan kondisi.', ...s, id: s.id || W.id + 's' + (++mx), orgId: s.orgId || null })); M.updateJourney(W.id, payload, me()); const id = W.id; W = null; toast('Perjalanan diperbarui.'); go('/t/journeys/' + id); }
    else { payload.segs = W.segs; const id = M.createJourney(payload, me()); W = null; toast('Perjalanan disimpan. Tahap berikutnya: penilaian oleh koordinator.'); go('/t/journeys/' + id); }
  };

  /* ---------- journey detail ---------- */
  const SC = { unassessed: '#687887', clear: '#27845C', barrier: '#C65E5E', review: '#315D78', planned: '#C58A32', awaiting: '#C58A32', verified: '#27845C' };
  function routeSvg(j, sel) {
    const n = j.segs.length, pts = j.segs.map((s, i) => [50 + i * (500 / Math.max(1, n - 1)), 150 + 85 * Math.sin(i * 1.25 + .4)]);
    const st = j.segs.map(s => M.segState(j, s));
    return h`<svg viewBox="0 0 600 300" class="rmap" role="group" aria-label="Peta skematis perjalanan ${j.title}. Gunakan daftar segmen di sebelah kiri atau tabel di bawah sebagai padanan teks.">
      <rect width="600" height="300" rx="14" class="rm-bg"/>${[1, 2, 3].map(i => h`<line x1="0" x2="600" y1="${i * 75}" y2="${i * 75}" class="rm-g"/>`)}${[1, 2, 3, 4, 5].map(i => h`<line y1="0" y2="300" x1="${i * 100}" x2="${i * 100}" class="rm-g"/>`)}
      ${pts.slice(1).map((p, i) => { const k = st[i + 1]; return h`<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${p[0]}" y2="${p[1]}" stroke="${SC[k]}" stroke-width="6" stroke-linecap="round" ${k === 'planned' || k === 'awaiting' ? raw('stroke-dasharray="2 10"') : k === 'review' ? raw('stroke-dasharray="14 8"') : k === 'unassessed' ? raw('stroke-dasharray="1 9"') : ''}/>`; })}
      ${pts.map((p, i) => { const s = j.segs[i], k = st[i], on = sel === s.id; return h`<g class="rm-n ${on ? 'on' : ''}" role="button" tabindex="0" data-act="selSeg" data-id="${s.id}" aria-pressed="${on}" aria-label="Segmen ${i + 1}: ${s.name}. Status: ${SG_T[k]}" transform="translate(${p[0]} ${p[1]})">${on ? h`<circle r="25" class="rm-ring"/>` : ''}<circle r="17" fill="#fff" stroke="${SC[k]}" stroke-width="4"/>${k === 'barrier' ? h`<path d="M-6 -6l12 12M6 -6l-12 12" stroke="${SC[k]}" stroke-width="3" stroke-linecap="round"/>` : k === 'verified' || k === 'clear' ? h`<path d="M-7 0l4.5 5L7 -5" fill="none" stroke="${SC[k]}" stroke-width="3" stroke-linecap="round"/>` : h`<text y="5" text-anchor="middle" class="rm-t">${i + 1}</text>`}<text y="${i % 2 ? -30 : 38}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" class="rm-l">${s.name.length > 17 ? s.name.slice(0, 16) + '…' : s.name}</text></g>`; })}</svg>
      <ul class="legend-a" aria-label="Legenda peta">${[['verified', 'Terverifikasi / tanpa hambatan'], ['barrier', 'Hambatan'], ['planned', 'Perbaikan direncanakan / menunggu verifikasi'], ['review', 'Ditinjau'], ['unassessed', 'Belum dinilai']].map(([k, t]) => h`<li><i style="background:${SC[k]}"></i>${t}</li>`)}</ul>`;
  }
  const SG_T = { unassessed: 'Perlu dinilai', clear: 'Tidak ada hambatan', barrier: 'Ada hambatan', review: 'Sedang ditinjau', planned: 'Perbaikan diusulkan', awaiting: 'Menunggu verifikasi', verified: 'Terverifikasi' };
  A.selSeg = t => { UI.f.seg = t.dataset.id; U.render(); };
  function segPanel(j, s, own) {
    const bs = db().barriers.filter(b => b.segId === s.id && b.status !== 'Ditolak'), vf = db().verifs.filter(v => v.segId === s.id && v.date).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const cms = db().commitments.filter(c => bs.some(b => b.id === c.barrierId));
    return card(h`Segmen: ${s.name}`, h`<div class="seg-d"><p>${s.desc || 'Belum ada deskripsi.'}</p>
      <dl class="dl2"><div><dt>Jenis</dt><dd>${M.SEGTYPES[s.type]}</dd></div><div><dt>Status segmen</dt><dd>${sgbadge(M.segState(j, s))}</dd></div><div><dt>Kondisi saat ini</dt><dd>${s.cond}</dd></div><div><dt>Organisasi penanggung jawab</dt><dd>${s.orgId ? M.orgName(s.orgId) : 'Belum ditetapkan'}</dd></div><div><dt>Verifikasi terakhir</dt><dd>${vf ? h`${fmtD(vf.date)} · ${vf.result}${M.isStale(vf.date) ? h` ${badge('warn', 'Kedaluwarsa')}` : ''}` : 'Belum pernah diverifikasi'}</dd></div></dl>
      <h3>Kebutuhan akses perjalanan</h3>${j.needs.length ? h`<ul class="chips">${j.needs.map(n => h`<li>${n}</li>`)}</ul>` : h`<p class="muted">Tidak ada yang dipilih.</p>`}
      <h3>Hambatan teridentifikasi (${bs.length})</h3>${bs.length ? h`<ul class="blist">${bs.map(b => h`<li><div><b>${b.id}</b> · ${b.cat} ${prb(b.priority)}</div><p>${b.desc}</p><div class="row-g">${bst(b.status)}${own && b.reporterId === me().id ? link('Lacak laporan', '/t/reports/' + b.id, 'btn-s sm') : ''}</div></li>`)}</ul>` : h`<p class="muted">Belum ada hambatan terlapor pada segmen ini.</p>`}
      <h3>Status perbaikan</h3>${cms.length ? h`<ul class="blist">${cms.map(c => h`<li><b>${M.orgName(c.orgId)}</b>: ${c.task}<div class="row-g">${cbadge(c.status)}${badge('info', c.progress, 'wrench')}</div></li>`)}</ul>` : h`<p class="muted">Belum ada rencana perbaikan.</p>`}
      <h3>Foto / bukti pendukung</h3>${bs.some(b => b.evidence.length) ? h`<ul class="chips ev">${bs.flatMap(b => b.evidence).map(e => h`<li>${ic('camera')}${e}</li>`)}</ul>` : h`<p class="muted">Belum ada bukti terunggah.</p>`}
      ${own ? h`<div class="row-g"><a class="btn btn-p" href="#/t/report" data-act="reportSeg" data-keep="1" data-j="${j.id}" data-s="${s.id}">${ic('flag')}Laporkan Masalah</a></div>` : ''}</div>`, null, 'seg-pn');
  }
  A.reportSeg = t => { UI.rep = { j: t.dataset.j, s: t.dataset.s }; go('/t/report'); };
  route('/t/journeys/:id', 'traveler', (p, u) => {
    const j = M.journey(p.id); if (!j) return { title: 'Tidak ditemukan', body: empty('Perjalanan tidak ditemukan', 'Perjalanan mungkin sudah dihapus.', link('Kembali', '/t/journeys')) };
    const own = j.userId === u.id; if (!own && !j.public) return { title: 'Tidak tersedia', body: empty('Perjalanan ini privat', 'Pemilik belum membagikannya.', link('Kembali', '/t/explore')) };
    const s = j.segs.find(x => x.id === UI.f.seg) || j.segs[0], status = M.journeyStatus(j), tests = db().tests.filter(t => t.journeyId === j.id);
    return {
      title: j.title, hdr: h`<div class="ph"><div class="row-sb"><div><p class="eyebrow-a">${own ? 'Perjalanan saya' : 'Perjalanan publik (hanya lihat)'}</p><h1>${j.title}</h1><p class="jc-r">${ic('pin')}${j.from}${ic('arrow')}${j.to}</p></div>${own ? h`<div class="row-g">${btn('Bagikan', 'shareJ', j.id, 'btn-s', 'share')}${link('Edit', '/t/journeys/' + j.id + '/edit', 'btn-s', 'edit')}${btn('Hapus', 'delJ', j.id, 'btn-d', 'trash')}</div>` : ''}</div>
        <div class="row-g meta">${jbadge(status)}<span class="muted">Dibuat ${fmtD(j.created)} · Diperbarui ${fmtD(j.updated)}</span></div></div>`,
      body: h`
      ${status === 4 && own ? h`<div class="banner ok" role="status">${ic('users')}<div><b>Perjalanan ini siap untuk pengujian.</b> Seluruh hambatan telah diverifikasi independen. Ikuti pengujian bila Anda memiliki kebutuhan akses yang relevan.</div>${btn('Ikuti pengujian', 'testJ', j.id, 'btn-p')}</div>` : ''}
      ${status === 5 ? h`<div class="banner ok" role="status">${ic('shield')}<div><b>Berhasil diuji</b> oleh pengguna dengan kebutuhan akses: ${[...new Set(tests.filter(t => t.result === 'success').flatMap(t => t.needs))].join(', ') || '—'}. <br><small>Hasil ini hanya berlaku untuk kebutuhan dan pengguna yang terlibat, bukan jaminan untuk setiap orang atau setiap kebutuhan akses.</small></div></div>` : ''}
      <div class="grid-2c"><div>
        ${card('Segmen perjalanan', h`<ol class="tl">${j.segs.map((x, i) => { const k = M.segState(j, x), on = x.id === s.id; return h`<li class="${on ? 'on' : ''}"><button class="tl-b" id="sg-${x.id}" data-act="selSeg" data-id="${x.id}" aria-pressed="${on}"><span class="tl-n">${i + 1}</span><span class="tl-t"><b>Segmen ${String(i + 1).padStart(2, '0')} — ${x.name}</b><small>${M.SEGTYPES[x.type]}</small></span>${sgbadge(k)}</button></li>`; })}</ol>`)}
        ${segPanel(j, s, own)}
        ${tests.length ? card('Catatan uji pengguna', h`<ul class="blist">${tests.map(t => h`<li><b>${t.result === 'success' ? 'Berhasil' : 'Belum berhasil'}</b> · ${fmtD(t.date)}<br>Kebutuhan akses: ${t.needs.join(', ')}<p>“${t.feedback}”</p></li>`)}</ul>`) : ''}</div>
      <div class="sticky-c">${card('Peta skematis', h`${routeSvg(j, s.id)}<p class="note-s">Peta skematis (bukan peta langsung). Tidak ada data lokasi waktu nyata atau integrasi peta eksternal.</p>
        <details class="alt"><summary>Versi daftar dari peta</summary>${U.table({ id: 'mapt', cap: 'Daftar segmen perjalanan', rows: j.segs, size: 20, cols: [{ h: 'No.', f: x => j.segs.indexOf(x) + 1 }, { h: 'Segmen', f: x => x.name }, { h: 'Penanggung jawab', f: x => x.orgId ? M.orgName(x.orgId) : '—' }, { h: 'Status', f: x => sgbadge(M.segState(j, x)) }, { h: 'Hambatan', f: x => db().barriers.filter(b => b.segId === x.id && b.status !== 'Ditolak').length }] })}</details>`)}</div></div>`
    };
  });
  A.delJ = t => confirmDlg('Hapus perjalanan ini beserta catatannya? Tindakan ini tidak dapat dibatalkan.', 'Hapus perjalanan', () => { M.deleteJourney(t.dataset.id, me()); toast('Perjalanan dihapus.'); go('/t/journeys'); });
  A.shareJ = t => { const j = M.journey(t.dataset.id); modal('Bagikan perjalanan', h`<form data-form="shareJ" data-j="${j.id}" novalidate><input type="hidden" name="id" value="${j.id}"><label class="chk-i"><input type="checkbox" name="pub" ${j.public ? raw('checked') : ''}><span>Izinkan perjalanan ini tampil di Explore (tanpa data pribadi Anda).</span></label><p class="muted sm-t">Tanpa izin ini, perjalanan hanya terlihat oleh Anda dan koordinator proyek.</p><div class="fld"><label for="sh-l">Tautan (hanya berfungsi di browser ini pada prototipe)</label><input id="sh-l" readonly value="${location.origin === 'null' ? location.href.split('#')[0] : location.href}"></div><div class="md-f"><button type="button" class="btn btn-s" data-act="copyLink">Salin tautan</button><button class="btn btn-p" type="submit">Simpan</button></div></form>`); };
  A.copyLink = () => { const i = $('#sh-l'); i.select(); try { navigator.clipboard.writeText(i.value).then(() => toast('Tautan disalin.')); } catch (e) { toast('Salin manual dari kolom tautan.', 'warn'); } };
  Fm.shareJ = d => { M.journey(d.id).public = !!d.pub; M.save(); closeModal(); toast(d.pub ? 'Perjalanan dibagikan ke Explore.' : 'Perjalanan kini privat.'); U.render(); };
  A.testJ = t => { const j = M.journey(t.dataset.id); modal('Uji perjalanan', h`<form data-form="testJ" novalidate><input type="hidden" name="id" value="${j.id}"><p class="muted">Pengujian hanya berlaku untuk kebutuhan akses yang Anda pilih. Satu hasil tidak menjamin aksesibilitas bagi semua orang.</p>
    <label class="chk-i"><input type="checkbox" name="walked" id="f-walked"><span>Saya telah menempuh seluruh segmen perjalanan ini.</span></label>${checks('needs', 'Kebutuhan akses yang diuji', j.needs)}${radios('result', 'Hasil pengujian', [['success', 'Berhasil', 'Saya dapat menyelesaikan perjalanan sesuai kebutuhan akses saya.'], ['failed', 'Belum berhasil', 'Masih ada hambatan.']], 'success')}${field({ name: 'feedback', label: 'Umpan balik', type: 'textarea', req: true, rows: 3 })}<p class="form-err err" role="alert"></p><div class="md-f"><button type="button" class="btn btn-s" data-act="closeModal">Batal</button><button class="btn btn-p" type="submit">Kirim hasil uji</button></div></form>`, { wide: true }); };
  Fm.testJ = d => { const e = M.submitTest(d.id, { walked: d.walked, needs: arr(d.needs), result: d.result, feedback: d.feedback }, me()); if (e) return e; closeModal(); toast('Terima kasih! Hasil uji tercatat.'); U.render(); };

  /* ---------- explore ---------- */
  route('/t/explore', 'traveler', (_, u) => {
    const q = (UI.f.q || '').toLowerCase();
    const js = db().journeys.filter(j => j.userId !== u.id && j.public && (!q || (j.title + j.from + j.to).toLowerCase().includes(q)));
    const reps = db().barriers.filter(b => b.vis.startsWith('Publik') && b.status !== 'Ditolak' && (!q || (b.cat + b.desc).toLowerCase().includes(q)));
    return {
      title: 'Jelajahi', sub: 'Perjalanan publik dan laporan hambatan yang dibagikan tanpa data pribadi.', body: h`<div class="toolbar">${searchBox('q', 'Cari perjalanan atau hambatan')}</div>
      ${card('Perjalanan publik', js.length ? h`<div class="jgrid">${js.map(j => jcard(j, false))}</div>` : empty('Tidak ada perjalanan publik', 'Belum ada perjalanan yang cocok.'))}
      ${card('Laporan hambatan publik', reps.length ? table({ id: 'exr', cap: 'Laporan hambatan publik', rows: reps, cols: [{ h: 'Kategori', f: b => b.cat }, { h: 'Perjalanan', f: b => M.journey(b.journeyId)?.title || '—' }, { h: 'Deskripsi', f: b => b.desc }, { h: 'Status', f: b => bst(b.status) }] }) : empty('Belum ada laporan publik', 'Laporan dengan visibilitas publik akan tampil di sini.'))}`
    };
  });

  /* ---------- report a barrier ---------- */
  function reportForm(user, journeys, back) {
    const pre = UI.rep || {}, selJ = pre.j || '', selS = pre.s || '';
    return card('', h`<form data-form="report" data-back="${back}" novalidate>
      <h2>1. Lokasi</h2><div class="f2">${field({ name: 'journeyId', label: 'Perjalanan', type: 'select', req: true, value: selJ, opts: journeys.map(j => [j.id, j.title]), ph: 'Pilih perjalanan' })}
      <div class="fld"><label for="f-segId">Segmen perjalanan<span class="req" aria-hidden="true"> *</span></label><select id="f-segId" name="segId" aria-describedby="f-segId-e"><option value="">Pilih segmen</option>${journeys.flatMap(j => j.segs.map(s => h`<option value="${s.id}" data-j="${j.id}" ${s.id === selS ? raw('selected') : ''}>${s.name}</option>`))}</select><p class="err" id="f-segId-e" role="alert"></p></div></div>
      ${field({ name: 'loc', label: 'Detail lokasi', hint: 'Mis. sisi timur penyeberangan, dekat tiang lampu.' })}
      <h2>2. Kategori hambatan</h2>${field({ name: 'cat', label: 'Kategori', type: 'select', req: true, opts: db().settings.categories, ph: 'Pilih kategori' })}
      <h2>3. Deskripsi</h2>${field({ name: 'desc', label: 'Jelaskan masalahnya dengan kata-katamu sendiri', type: 'textarea', req: true, rows: 4 })}
      <h2>4. Dampak aksesibilitas</h2>${field({ name: 'impact', label: 'Kebutuhan akses mana yang terdampak?', type: 'textarea', req: true, rows: 3, hint: 'Tidak perlu menyebut diagnosis.' })}
      <h2>5. Bukti pendukung</h2><div class="banner warn sm" role="note">${ic('alert')}<div>Hindari mengunggah informasi pribadi yang dapat mengidentifikasi seseorang atau foto orang lain tanpa izin.</div></div>${field({ name: 'evidence', label: 'Foto atau dokumen', type: 'file', multiple: true, hint: 'Pada prototipe, hanya nama berkas yang disimpan.' })}
      <h2>6. Visibilitas laporan</h2>${radios('vis', 'Siapa yang dapat melihat laporan ini?', VIS.map(v => [v[0], v[1], v[2]]), VIS[1][0])}
      <p class="form-err err" role="alert"></p><div class="md-f"><button class="btn btn-p" type="submit">7. Kirim Laporan</button></div></form>`);
  }
  const syncSeg = () => { const j = $('#f-journeyId'), s = $('#f-segId'); if (!j || !s) return; const f = () => { [...s.options].forEach(o => { if (!o.value) return; const ok = !j.value || o.dataset.j === j.value; o.hidden = !ok; o.disabled = !ok; }); if (s.selectedOptions[0] && s.selectedOptions[0].disabled) s.value = ''; }; j.addEventListener('change', f); f(); };
  route('/t/report', 'traveler', (_, u) => ({ title: 'Lapor Hambatan', sub: 'Laporkan hambatan aksesibilitas pada segmen perjalanan.', cls: 'narrow-pg', body: db().journeys.some(j => j.userId === u.id) ? reportForm(u, db().journeys.filter(j => j.userId === u.id), '/t/reports/') : empty('Belum ada perjalanan', 'Petakan perjalanan terlebih dahulu agar hambatan dapat dikaitkan ke segmen.', link('Buat Perjalanan Baru', '/t/journeys/new', 'btn-p')), after: syncSeg }));
  window.V = window.V || {}; window.V.reportForm = reportForm; window.V.syncSeg = syncSeg;
  Fm.report = (d, f) => {
    const er = {}; const j = M.journey(d.journeyId), s = j && j.segs.find(x => x.id === d.segId);
    if (!j) er.journeyId = 'Pilih perjalanan.'; if (!d.segId) er.segId = 'Pilih segmen.'; else if (j && !s) er.segId = 'Segmen tidak termasuk perjalanan yang dipilih.';
    if (!d.cat) er.cat = 'Pilih kategori hambatan.'; if (!(d.desc || '').trim() || d.desc.trim().length < 15) er.desc = 'Jelaskan minimal 15 karakter.'; if (!(d.impact || '').trim()) er.impact = 'Jelaskan dampak aksesibilitasnya.';
    if (Object.keys(er).length) return { errors: er };
    const b = M.submitReport({ journeyId: d.journeyId, segId: d.segId, cat: d.cat, desc: d.desc.trim(), impact: d.impact.trim(), vis: d.vis, evidence: arr(d.evidence).filter(Boolean), loc: d.loc }, me());
    UI.rep = null; UI.sent = b.id; toast('Laporan terkirim: ' + b.id); go(f.dataset.back === '/t/reports/' ? '/t/reports/' + b.id : f.dataset.back);
  };
  route('/t/reports/:id', 'traveler', (p, u) => {
    const b = M.barrier(p.id); if (!b || b.reporterId !== u.id) return { title: 'Tidak ditemukan', body: empty('Laporan tidak ditemukan', 'Anda hanya dapat melihat laporan milik Anda.', link('Kembali', '/t/journeys')) };
    const j = M.journey(b.journeyId), s = j && M.segOf(j, b.segId), sent = UI.sent === b.id;
    return {
      title: 'Laporan ' + b.id, after: () => { UI.sent = null; }, body: h`${sent ? h`<div class="banner ok" role="status">${ic('check')}<div><b>Laporan Anda telah diterima.</b> Simpan nomor referensi <strong>${b.id}</strong> untuk melacak perkembangannya.</div></div>` : ''}
      <div class="grid-main"><div>${card('Detail laporan', h`<dl class="dl2"><div><dt>Nomor referensi</dt><dd><b>${b.id}</b></dd></div><div><dt>Status</dt><dd>${bst(b.status)}</dd></div><div><dt>Perjalanan</dt><dd>${j ? h`<a href="#/t/journeys/${j.id}">${j.title}</a>` : '—'}</dd></div><div><dt>Segmen</dt><dd>${s ? s.name : '—'}${b.loc ? ' · ' + b.loc : ''}</dd></div><div><dt>Kategori</dt><dd>${b.cat}</dd></div><div><dt>Deskripsi</dt><dd>${b.desc}</dd></div><div><dt>Dampak</dt><dd>${b.impact}</dd></div><div><dt>Visibilitas</dt><dd>${b.vis}</dd></div><div><dt>Bukti</dt><dd>${b.evidence.length ? h`<ul class="chips ev">${b.evidence.map(e => h`<li>${ic('camera')}${e}</li>`)}</ul>` : 'Tidak ada'}</dd></div></dl>
        ${b.status === 'Ditolak' ? h`<div class="banner bad sm" role="note">${ic('x')}<div><b>Ditolak.</b> ${b.reason || 'Tidak ada penjelasan.'}</div></div>` : ''}
        ${b.status === 'Perlu informasi tambahan' ? h`<form data-form="addInfo" data-id="${b.id}" novalidate>${field({ name: 'info', label: 'Informasi tambahan yang diminta peninjau', type: 'textarea', req: true, rows: 3 })}<p class="form-err err" role="alert"></p><button class="btn btn-p" type="submit">Kirim informasi</button></form>` : ''}`)}</div>
        <div>${card('Pelacakan status', h`<ol class="tl2">${b.hist.slice().reverse().map(x => h`<li><b>${x.status}</b><small>${fmtDT(x.ts)}</small>${x.note ? h`<p>${x.note}</p>` : ''}</li>`)}</ol><p class="note-s">Status “Terverifikasi” hanya diberikan setelah verifikator independen memeriksa; penandaan selesai oleh mitra saja tidak cukup.</p>`)}</div></div>`
    };
  });
  Fm.addInfo = (d, f) => { const b = M.barrier(f.dataset.id); if (!(d.info || '').trim()) return { errors: { info: 'Informasi wajib diisi.' } }; const e = M.setBarrierStatus(b.id, 'Sedang ditinjau', 'Informasi tambahan dari pelapor: ' + d.info.trim(), me()); if (e) return e; toast('Informasi terkirim; laporan kembali ditinjau.'); U.render(); };

  /* ---------- notifications (shared by all roles) ---------- */
  const NCATS = Object.keys(db().settings.notifPrefs);
  function notifView(role) {
    const cat = UI.f.cat, unread = UI.f.unread; const prefs = db().settings.notifPrefs;
    const list = db().notifs.filter(n => n.role === role && (!cat || n.cat === cat) && (!unread || !n.read) && prefs[n.cat] !== false);
    return {
      title: 'Notifikasi', hdr: h`<div class="ph row-sb"><div><h1>Notifications</h1><p>Pembaruan dari seluruh aktivitas yang terkait dengan peran Anda.</p></div>${btn('Tandai semua dibaca', 'readAll', role, 'btn-s', 'check')}</div>`,
      body: h`<div class="grid-main"><div>${card('', h`<div class="toolbar">${selFilter('cat', 'Kategori', NCATS)}${selFilter('unread', 'Tampilkan', [['1', 'Belum dibaca']])}</div>
        ${list.length ? h`<ul class="nlist">${list.map(n => h`<li class="${n.read ? '' : 'unread'}"><span class="ud" aria-hidden="true"></span><div><p>${n.read ? '' : h`<span class="sr">Belum dibaca. </span>`}${n.text}</p><small>${badge('neutral', n.cat)} <time datetime="${n.ts}">${fmtDT(n.ts)}</time></small></div><div class="row-g">${link('Buka', n.link, 'btn-s sm')}${n.read ? '' : btn('Tandai dibaca', 'readN', n.id, 'btn-s sm')}</div></li>`)}</ul>` : empty('Tidak ada notifikasi', 'Tidak ada pembaruan yang cocok dengan filter.')}`)}</div>
        <div>${card('Preferensi notifikasi', h`<form data-form="nprefs" novalidate><fieldset class="chk"><legend>Kategori yang ingin diterima</legend>${NCATS.map(c => h`<label class="chk-i"><input type="checkbox" name="cats" value="${c}" ${prefs[c] !== false ? raw('checked') : ''}><span>${c}</span></label>`)}</fieldset><button class="btn btn-p sm" type="submit">Simpan preferensi</button></form>`)}</div></div>`
    };
  }
  window.V.notifView = notifView;
  Object.keys(HOME).forEach(r => route(HOME[r] + '/notifications', r, () => notifView(r)));
  A.readN = t => { M.db.notifs.find(n => n.id === t.dataset.id).read = true; M.save(); U.render(); };
  A.readAll = t => { M.db.notifs.filter(n => n.role === t.dataset.id).forEach(n => n.read = true); M.save(); toast('Semua notifikasi ditandai dibaca.'); U.render(); };
  Fm.nprefs = d => { const on = arr(d.cats); NCATS.forEach(c => db().settings.notifPrefs[c] = on.includes(c)); M.save(); toast('Preferensi notifikasi disimpan.'); U.render(); };

  /* ---------- profile ---------- */
  route('/t/profile', 'traveler', (_, u) => ({
    title: 'Profil Saya', cls: 'narrow-pg', body: h`${card('Informasi akun', h`<form data-form="profile" novalidate>${field({ name: 'name', label: 'Nama lengkap', req: true, value: u.name })}${field({ name: 'email', label: 'Email', value: u.email, type: 'email', req: true })}<p class="form-err err" role="alert"></p><button class="btn btn-p" type="submit">Simpan</button></form>`)}
    ${card('Preferensi aksesibilitas', h`${u.prefs.length ? h`<ul class="chips">${u.prefs.map(p => h`<li>${p}</li>`)}</ul>` : h`<p>Belum ada preferensi.</p>`}`, btn('Edit', 'editPrefs', null, 'btn-s sm', 'edit'))}
    ${card('Privasi', h`<p>Anda mengendalikan visibilitas setiap laporan dan perjalanan. Platform tidak meminta diagnosis medis. Data prototipe hanya tersimpan di browser ini.</p>`)}`
  }));
  Fm.profile = d => { const er = {}; if (!(d.name || '').trim()) er.name = 'Nama wajib diisi.'; if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) er.email = 'Email tidak valid.'; if (Object.keys(er).length) return { errors: er }; Object.assign(me(), { name: d.name.trim(), email: d.email.trim() }); M.save(); toast('Profil disimpan.'); U.render(); };
})();
