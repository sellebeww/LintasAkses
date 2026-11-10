/* Copyright (c) 2026 Vassel Goleyu. All rights reserved. */
/* UI kernel: safe templating, router, role layouts, reusable components, modal/toast, form + action dispatch. */
(function () {
  /* ---------- safe templating: interpolations are escaped unless wrapped by raw() ---------- */
  const E = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s).replace(/[&<>"']/g, c => E[c]);
  const raw = s => ({ __raw: String(s) });
  const val = v => v == null || v === false ? '' : Array.isArray(v) ? v.map(val).join('') : typeof v === 'object' && '__raw' in v ? v.__raw : esc(v);
  const h = (s, ...v) => raw(s.reduce((o, x, i) => o + x + (i < v.length ? val(v[i]) : ''), ''));
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- formatting ---------- */
  const fmtD = i => i ? new Date(i).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtDT = i => i ? new Date(i).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
  const ago = i => { const d = Math.round((Date.now() - new Date(i)) / 864e5); return d <= 0 ? 'Hari ini' : d === 1 ? 'Kemarin' : d + ' hari lalu'; };
  const toDateInput = i => i ? new Date(i).toISOString().slice(0, 10) : '';

  /* ---------- icons (24px stroke set) ---------- */
  const P = {
    home: 'M3 11.5 12 4l9 7.5M5 10v10h14V10', route: 'M5 18a2 2 0 1 0 0 .01M19 6a2 2 0 1 0 0 .01M7 18h7a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h7', compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2 5-5 2 2-5z', flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0', users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6',
    plus: 'M12 5v14M5 12h14', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.5-4.5', check: 'm5 12.5 4.5 4.5L19 7.5', x: 'm6 6 12 12M18 6 6 18', alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.5v.5', clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14', package: 'M12 3 3.5 7.5v9L12 21l8.5-4.5v-9zM3.5 7.5 12 12l8.5-4.5M12 12v9', shield: 'M12 3 5 6v5.5c0 4.3 2.9 7.8 7 9.5 4.1-1.7 7-5.2 7-9.5V6zM9 12l2.2 2.2L15.5 10',
    chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6', wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M16 13.5h.01', file: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6', folder: 'M3 6h6l2 2h10v11H3z',
    building: 'M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3M17 13h.01M17 17h.01M3 21h18', settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2 3.5-.2-.1a1.7 1.7 0 0 0-1.8.1l-.1.1H9.3l-.1-.1a1.7 1.7 0 0 0-1.8-.1l-.2.1-2-3.5.1-.1a1.7 1.7 0 0 0 .3-1.8V9l-.3-.5-.1-.1 2-3.5.2.1a1.7 1.7 0 0 0 1.8-.1l.1-.1h5.4l.1.1a1.7 1.7 0 0 0 1.8.1l.2-.1 2 3.5-.1.1a1.7 1.7 0 0 0-.3 1.8z',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z',
    eyeoff: 'M3 3l18 18M10.6 6a9 9 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a16 16 0 0 1-2.6 3.3M6.6 7.6C3.9 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.6-.3 3.7-.8M9.9 9.9a3 3 0 0 0 4.2 4.2', upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4', download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
    menu: 'M4 7h16M4 12h16M4 17h16', logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9', edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
    arrow: 'M5 12h14M13 6l6 6-6 6', info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.01', calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', camera: 'M4 8h3l2-3h6l2 3h3v12H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', lock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',
    clip: 'M9 4h6l1 2h3v15H5V6h3zM9 12l2 2 4-4', send: 'M21 3 3 10l7 3 3 7zM10 13l11-10', handshake: 'M2 12l5-5 4 2 3-2 4 3 4-1M7 7v9l4 3 3-2M14 17l2 2 3-3', pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', wrench: 'M14.5 6a4 4 0 0 0-5 5L3 17.5 6.5 21 13 14.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z', rotate: 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4', up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', dot: 'M12 12h.01'
  };
  const ic = (n, c = '') => raw(`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${P[n] || P.dot}"/></svg>`);

  /* ---------- badges: always colour + icon + text ---------- */
  const badge = (k, t, i) => h`<span class="badge b-${k}">${ic(i || ({ ok: 'check', warn: 'clock', bad: 'alert', info: 'info', neutral: 'dot', teal: 'shield' }[k] || 'dot'))}${t}</span>`;
  const BS = { 'Terkirim': ['neutral', 'send'], 'Sedang ditinjau': ['info', 'eye'], 'Diterima': ['teal', 'check'], 'Perlu informasi tambahan': ['warn', 'info'], 'Perbaikan direncanakan': ['info', 'clip'], 'Selesai, menunggu verifikasi': ['warn', 'clock'], 'Terverifikasi': ['ok', 'shield'], 'Ditolak': ['bad', 'x'] };
  const STL = { 'Terkirim': 'Terkirim', 'Sedang ditinjau': 'Sedang ditinjau', 'Diterima': 'Diterima', 'Perlu informasi tambahan': 'Perlu informasi tambahan', 'Perbaikan direncanakan': 'Perbaikan direncanakan', 'Selesai, menunggu verifikasi': 'Selesai, menunggu verifikasi', 'Terverifikasi': 'Terverifikasi', 'Ditolak': 'Ditolak' };
  const stl = s => STL[s] || s;
  const bst = s => badge(BS[s][0], stl(s), BS[s][1]);
  const JB = { 1: ['neutral', 'dot'], 2: ['bad', 'alert'], 3: ['warn', 'wrench'], 4: ['info', 'users'], 5: ['ok', 'shield'] };
  const jbadge = n => badge(JB[n][0], M.JSTAT[n], JB[n][1]);
  const SG = { unassessed: ['neutral', 'Perlu dinilai', 'dot'], clear: ['ok', 'Tidak ada hambatan', 'check'], barrier: ['bad', 'Ada hambatan', 'alert'], review: ['info', 'Sedang ditinjau', 'eye'], planned: ['warn', 'Perbaikan diusulkan', 'clip'], awaiting: ['warn', 'Menunggu verifikasi', 'clock'], verified: ['ok', 'Terverifikasi', 'shield'] };
  const sgbadge = k => badge(SG[k][0], SG[k][1], SG[k][2]);
  const prb = p => badge({ Kritis: 'bad', Tinggi: 'warn', Sedang: 'info', Rendah: 'neutral' }[p] || 'neutral', p, { Kritis: 'alert', Tinggi: 'up', Sedang: 'dot', Rendah: 'down' }[p]);
  const cbadge = s => badge({ 'Diminta': 'warn', 'Diterima': 'ok', 'Ditolak': 'bad', 'Alternatif diusulkan': 'info', 'Menunggu verifikasi': 'warn', 'Selesai': 'ok' }[s] || 'neutral', s);

  /* ---------- components ---------- */
  const card = (title, body, act, cls = '') => h`<section class="card ${cls}">${title || act ? h`<header class="card-h"><h2>${title}</h2>${act || ''}</header>` : ''}${body}</section>`;
  const kpi = (label, value, hint, icon = 'chart', href) => h`<div class="kpi"><span class="kpi-i">${ic(icon)}</span><div><p class="kpi-l">${label}</p><p class="kpi-v">${value}</p>${hint ? h`<p class="kpi-h">${hint}</p>` : ''}</div></div>`;
  const kpis = a => h`<div class="kpis">${a.map(k => kpi(...k))}</div>`;
  const empty = (t, m, cta) => h`<div class="empty">${ic('compass', 'xl')}<h3>${t}</h3><p>${m}</p>${cta || ''}</div>`;
  const progress = (p, label) => h`<div class="prog" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${label || 'Progres'}"><i style="width:${p}%"></i></div>`;
  const tip = (txt) => h`<span class="tip" tabindex="0" role="note" aria-label="${txt}">${ic('info')}<span class="tip-b" role="tooltip">${txt}</span></span>`;
  const btn = (label, act, id, cls = 'btn-p', icon, extra = '') => h`<button type="button" class="btn ${cls}" data-act="${act}" ${id != null ? raw(`data-id="${esc(id)}"`) : ''} ${raw(extra)}>${icon ? ic(icon) : ''}${label}</button>`;
  const link = (label, to, cls = 'btn-s', icon) => h`<a class="btn ${cls}" href="#${to}">${icon ? ic(icon) : ''}${label}</a>`;

  const field = o => {
    const id = 'f-' + o.name, hint = o.hint ? `${id}-h` : '', er = `${id}-e`;
    const desc = `aria-describedby="${hint} ${er}"`;
    let ctl;
    const v = o.value ?? '';
    if (o.type === 'select') ctl = h`<select id="${id}" name="${o.name}" ${raw(desc)} ${o.req ? raw('required') : ''}>${o.ph ? h`<option value="">${o.ph}</option>` : ''}${o.opts.map(x => { const [a, b] = Array.isArray(x) ? x : [x, x]; return h`<option value="${a}" ${String(a) === String(v) ? raw('selected') : ''}>${b}</option>`; })}</select>`;
    else if (o.type === 'textarea') ctl = h`<textarea id="${id}" name="${o.name}" rows="${o.rows || 4}" ${raw(desc)} placeholder="${o.ph || ''}" ${o.req ? raw('required') : ''}>${v}</textarea>`;
    else ctl = h`<input id="${id}" name="${o.name}" type="${o.type || 'text'}" value="${v}" ${raw(desc)} placeholder="${o.ph || ''}" ${o.req ? raw('required') : ''} ${o.min != null ? raw(`min="${o.min}"`) : ''} ${o.ac ? raw(`autocomplete="${o.ac}"`) : ''} ${o.list ? raw(`list="${o.list}"`) : ''} ${o.multiple ? raw('multiple') : ''}>`;
    return h`<div class="fld ${o.cls || ''}"><label for="${id}">${o.label}${o.req ? h`<span class="req" aria-hidden="true"> *</span>` : ''}</label>${o.hint ? h`<p class="hint" id="${hint}">${o.hint}</p>` : ''}${ctl}<p class="err" id="${er}" role="alert"></p></div>`;
  };
  const checks = (name, label, opts, sel = [], legendCls = '') => h`<fieldset class="chk ${legendCls}"><legend>${label}</legend>${opts.map(o => h`<label class="chk-i"><input type="checkbox" name="${name}" value="${o}" ${sel.includes(o) ? raw('checked') : ''}><span>${o}</span></label>`)}</fieldset>`;
  const radios = (name, label, opts, sel) => h`<fieldset class="chk"><legend>${label}</legend>${opts.map(([v, t, d]) => h`<label class="chk-i rad"><input type="radio" name="${name}" value="${v}" ${v === sel ? raw('checked') : ''}><span><b>${t}</b>${d ? h`<small>${d}</small>` : ''}</span></label>`)}</fieldset>`;

  const UI = { f: {}, pg: {}, path: '' };
  function table(o) {
    const size = o.size || 8, pg = UI.pg[o.id] || 1, total = o.rows.length, pages = Math.max(1, Math.ceil(total / size)), cur = Math.min(pg, pages);
    const rows = o.rows.slice((cur - 1) * size, cur * size);
    if (!total) return o.empty || empty('Belum ada data', 'Tidak ada data yang cocok dengan filter saat ini.');
    return h`<div class="tbl-w" tabindex="0" role="region" aria-label="${o.cap}"><table class="tbl"><caption class="sr">${o.cap}</caption><thead><tr>${o.cols.map(c => h`<th scope="col">${c.h}</th>`)}</tr></thead><tbody>${rows.map(r => h`<tr>${o.cols.map((c, i) => i === 0 && !c.td ? h`<th scope="row">${c.f(r)}</th>` : h`<td>${c.f(r)}</td>`)}</tr>`)}</tbody></table></div>
    ${pages > 1 ? h`<nav class="pager" aria-label="Halaman tabel ${o.cap}"><button class="btn btn-s sm" data-act="page" data-id="${o.id}" data-n="${cur - 1}" ${cur === 1 ? raw('disabled') : ''}>Sebelumnya</button><span>Halaman ${cur} dari ${pages} · ${total} data</span><button class="btn btn-s sm" data-act="page" data-id="${o.id}" data-n="${cur + 1}" ${cur === pages ? raw('disabled') : ''}>Berikutnya</button></nav>` : ''}`;
  }
  const searchBox = (id, ph) => h`<div class="srch"><label class="sr" for="flt-${id}">${ph}</label>${ic('search')}<input id="flt-${id}" type="search" data-filter="${id}" value="${UI.f[id] || ''}" placeholder="${ph}"></div>`;
  const selFilter = (id, label, opts) => h`<div class="sel-f"><label for="flt-${id}">${label}</label><select id="flt-${id}" data-filter="${id}"><option value="">Semua</option>${opts.map(x => { const [a, b] = Array.isArray(x) ? x : [x, x]; return h`<option value="${a}" ${String(UI.f[id]) === String(a) ? raw('selected') : ''}>${b}</option>`; })}</select></div>`;
  const stepper = (labels, cur) => h`<ol class="stepper" aria-label="Tahapan">${labels.map((l, i) => h`<li class="${i < cur ? 'done' : i === cur ? 'cur' : ''}" ${i === cur ? raw('aria-current="step"') : ''}><span>${i < cur ? ic('check') : i + 1}</span>${l}</li>`)}</ol>`;

  /* ---------- toast / modal ---------- */
  let tt;
  function toast(msg, kind = 'ok') {
    const t = $('#toast'); t.className = 'toast t-' + kind; t.innerHTML = `${kind === 'bad' ? '' : ''}${esc(msg)}`; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 4200);
  }
  function modal(title, body, o = {}) {
    closeModal();
    const d = document.createElement('dialog'); d.className = 'modal' + (o.drawer ? ' drawer' : '') + (o.wide ? ' wide' : ''); d.setAttribute('aria-labelledby', 'md-t');
    d.innerHTML = `<div class="md-h"><h2 id="md-t">${esc(title)}</h2><button class="icon-btn" data-act="closeModal" aria-label="Tutup dialog">${ic('x').__raw}</button></div><div class="md-b">${body.__raw ?? esc(body)}</div>`;
    document.body.append(d); d.addEventListener('click', e => { if (e.target === d) closeModal(); }); d.addEventListener('close', () => d.remove()); d.showModal();
    const f = $('input,select,textarea', d); if (f && !o.nofocus) f.focus();
  }
  function closeModal() { $$('dialog.modal').forEach(d => { d.close(); d.remove(); }); }
  function confirmDlg(msg, okLabel, cb, danger = true) {
    modal('Konfirmasi', h`<p>${msg}</p><div class="md-f"><button class="btn btn-s" data-act="closeModal">Batal</button><button class="btn ${danger ? 'btn-d' : 'btn-p'}" id="cfm-ok">${okLabel}</button></div>`, { nofocus: true });
    $('#cfm-ok').addEventListener('click', () => { closeModal(); cb(); }); $('#cfm-ok').focus();
  }

  /* ---------- session ---------- */
  const SK = 'lintasakses.session';
  const S = {
    get() { try { return JSON.parse(sessionStorage.getItem(SK)); } catch (e) { return null; } },
    set(s) { try { sessionStorage.setItem(SK, JSON.stringify(s)); } catch (e) { S._m = s; } }, clear() { try { sessionStorage.removeItem(SK); } catch (e) { } S._m = null; },
    user() { const s = S.get() || S._m; return s ? M.user(s.userId) : null; }, demo() { const s = S.get() || S._m; return !!(s && s.demo); }
  };
  const HOME = { traveler: '/t', partner: '/p', coordinator: '/c', verifier: '/v', admin: '/a' };
  const ROLES = { traveler: 'Pelancong', partner: 'Mitra Lokasi', coordinator: 'Koordinator Proyek', verifier: 'Verifikator', admin: 'Administrator' };
  const DEMO_USER = { traveler: 'u1', partner: 'u2', coordinator: 'u3', verifier: 'u4', admin: 'u5' };
  const NAV = {
    traveler: [['/t', 'Beranda', 'home'], ['/t/journeys', 'Perjalanan Saya', 'route'], ['/t/explore', 'Jelajahi', 'compass'], ['/t/report', 'Lapor Hambatan', 'flag'], ['/t/notifications', 'Notifikasi', 'bell'], ['/t/profile', 'Profil Saya', 'user']],
    partner: [['/p', 'Beranda', 'home'], ['/p/locations', 'Lokasi Saya', 'pin'], ['/p/reports', 'Laporan Aksesibilitas', 'flag'], ['/p/requests', 'Permintaan Perbaikan', 'package'], ['/p/projects', 'Proyek Berjalan', 'wrench'], ['/p/commitments', 'Komitmen', 'handshake'], ['/p/verification', 'Verifikasi', 'shield'], ['/p/documents', 'Dokumen', 'folder'], ['/p/settings', 'Pengaturan Organisasi', 'settings']],
    coordinator: [['/c', 'Beranda', 'home'], ['/c/journeys', 'Pemetaan Perjalanan', 'route'], ['/c/barriers', 'Kelola Hambatan', 'flag'], ['/c/packages', 'Paket Perbaikan', 'package'], ['/c/partners', 'Mitra', 'users'], ['/c/timeline', 'Jadwal Proyek', 'calendar'], ['/c/budget', 'Anggaran', 'wallet'], ['/c/reports', 'Laporan Dampak', 'chart'], ['/c/activity', 'Riwayat Aktivitas', 'list']],
    verifier: [['/v', 'Beranda', 'home'], ['/v/assigned', 'Asesmen Ditugaskan', 'clip'], ['/v/visits', 'Kunjungan Lapangan', 'calendar'], ['/v/checklist', 'Daftar Periksa', 'check'], ['/v/evidence', 'Bukti', 'camera'], ['/v/reports', 'Laporan Verifikasi', 'file'], ['/v/history', 'Riwayat', 'clock']],
    admin: [['/a', 'Ringkasan Sistem', 'home'], ['/a/users', 'Kelola Pengguna', 'users'], ['/a/orgs', 'Kelola Organisasi', 'building'], ['/a/journeys', 'Kelola Perjalanan', 'route'], ['/a/moderation', 'Moderasi Laporan', 'flag'], ['/a/verifications', 'Kelola Verifikasi', 'shield'], ['/a/settings', 'Kategori & Pengaturan', 'settings'], ['/a/audit', 'Log Audit', 'list']]
  };

  /* ---------- router ---------- */
  const routes = [];
  const route = (pattern, role, fn) => routes.push({ keys: [], re: new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => '([^/]+)') + '/?$'), names: [...pattern.matchAll(/:(\w+)/g)].map(m => m[1]), role, fn });
  const cur = () => (location.hash.slice(1) || '/').split('?')[0];
  const go = p => { if (cur() === p) render(); else location.hash = '#' + p; };
  function match(p) { for (const r of routes) { const m = p.match(r.re); if (m) return { r, params: Object.fromEntries(r.names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) }; } return null; }

  const logoMark = '../assets/logo/logo-mark-light.png', logoWord = '../assets/logo/logo-wordmark-light.png';
  function shellPublic(body) {
    const u = S.user();
    return h`<a class="skip" href="#main">Lewati ke konten utama</a><header class="pub-h"><a class="pub-b" href="../index.html"><img src="../assets/logo/logo-mark.png" alt="" width="34" height="35"><img src="../assets/logo/logo-wordmark.png" alt="LintasAkses" width="130" height="17"></a>
      <nav aria-label="Navigasi publik"><a href="../index.html">Beranda</a><a href="#/impact">Dasbor Dampak</a><a href="#/page/help">Bantuan</a></nav>
      <div class="pub-a">${u ? link('Buka dasbor', HOME[u.role], 'btn-p sm') : h`${link('Masuk', '/login', 'btn-s sm')}${link('Coba Demo', '/demo', 'btn-p sm')}`}</div></header>
      <main id="main" tabindex="-1">${body}</main>
      <footer class="pub-f"><p>© 2026 Vassel Goleyu. All rights reserved. Prototipe dengan data simulasi · Kawasan Puspa adalah wilayah fiktif.</p><nav aria-label="Tautan kebijakan"><a href="#/page/privacy">Kebijakan Privasi</a><a href="#/page/terms">Ketentuan Layanan</a><a href="#/page/a11y">Pernyataan Aksesibilitas</a></nav></footer>`;
  }
  function shellApp(role, path, title, body) {
    const u = S.user(), nav = NAV[role], unread = M.db.notifs.filter(n => n.role === role && !n.read).length;
    const active = nav.map(n => n[0]).filter(p => path === p || (p !== HOME[role] && path.startsWith(p + '/'))).sort((a, b) => b.length - a.length)[0] || HOME[role];
    const item = (n, cls) => h`<a class="${cls} ${n[0] === active ? 'on' : ''}" href="#${n[0]}" ${n[0] === active ? raw('aria-current="page"') : ''}>${ic(n[2])}<span>${n[1]}</span>${n[1] === 'Notifikasi' && unread ? h`<b class="cnt" aria-label="${unread} belum dibaca">${unread}</b>` : ''}</a>`;
    return h`<a class="skip" href="#main">Lewati ke konten utama</a>
    ${S.demo() ? h`<div class="demo-bar" role="note"><strong>Mode demonstrasi</strong> · data simulasi di wilayah fiktif “Kawasan Puspa”, tersimpan di browser ini. <button class="lnk" data-act="resetDemo">Atur ulang data demo</button></div>` : ''}
    <div class="shell"><aside class="side" id="side" aria-label="Menu ${ROLES[role]}"><a class="side-b" href="#${HOME[role]}"><img src="${logoMark}" alt="" width="34" height="35"><img src="${logoWord}" alt="LintasAkses" width="120" height="16"></a>
      <p class="side-r">${ROLES[role]}</p><nav aria-label="Menu utama" class="side-n">${nav.map(n => item(n, 'si'))}</nav>
      ${S.demo() ? h`<div class="side-demo"><label for="role-sw">Beralih peran (demo)</label><select id="role-sw" data-act-change="switchRole">${Object.keys(ROLES).map(r => h`<option value="${r}" ${r === role ? raw('selected') : ''}>${ROLES[r]}</option>`)}</select></div>` : ''}
      <div class="side-f"><a href="#/impact">${ic('chart')}Dasbor Dampak</a><a href="../index.html">${ic('home')}Situs publik</a></div></aside>
      <div class="side-scrim" data-act="toggleSide"></div>
      <div class="main-col"><header class="top"><button class="icon-btn burger" data-act="toggleSide" aria-label="Buka menu navigasi" aria-controls="side" aria-expanded="false">${ic('menu')}</button><p class="top-t">${title}</p>
        <div class="top-r">
          <a class="icon-btn bell" href="#/${HOME[role].slice(1)}/notifications" aria-label="Notifikasi${unread ? ', ' + unread + ' belum dibaca' : ''}">${ic('bell')}${unread ? h`<b class="cnt">${unread}</b>` : ''}</a>
          <div class="usr"><span class="av" aria-hidden="true">${u.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span><span class="usr-n"><b>${u.name}</b><small>${ROLES[role]}</small></span><button class="icon-btn" data-act="logout" aria-label="Keluar">${ic('logout')}</button></div></div></header>
        <main id="main" tabindex="-1">${body}</main></div></div>
      ${role === 'traveler' ? h`<nav class="bottom-nav" aria-label="Navigasi cepat">${nav.slice(0, 5).map(n => item(n, 'bn'))}</nav>` : ''}`;
  }

  let lastPath = null;
  function render() {
    const path = cur(); let m = match(path);
    if (!m) { m = match('/404'); }
    const { r, params } = m, u = S.user();
    if (r.role && r.role !== 'any') {
      if (!u) { sessionStorage.setItem('lintasakses.next', path); return go('/login'); }
      if (u.role !== r.role) return go(HOME[u.role]);
    }
    if (path !== lastPath) { UI.f = {}; UI.pg = {}; }
    const ae = document.activeElement, keep = ae && ae.id && ae.closest('main') ? { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd } : null;
    let out; try { out = r.fn(params, u); } catch (err) { console.error(err); out = { title: 'Kesalahan', body: empty('Terjadi kesalahan', 'Halaman tidak dapat ditampilkan. Coba atur ulang data demo.', btn('Atur ulang data demo', 'resetDemo')) }; }
    const title = out.title || 'LintasAkses', body = out.body || out;
    document.title = title + ' · LintasAkses';
    $('#app').innerHTML = (r.role && r.role !== 'any' ? shellApp(r.role, path, title, h`<div class="page ${out.cls || ''}">${out.hdr || h`<div class="ph"><h1>${title}</h1>${out.sub ? h`<p>${out.sub}</p>` : ''}</div>`}${body}</div>`) : shellPublic(h`<div class="page ${out.cls || ''}">${out.hdr != null ? out.hdr : h`<div class="ph"><h1>${title}</h1>${out.sub ? h`<p>${out.sub}</p>` : ''}</div>`}${body}</div>`)).__raw;
    if (path !== lastPath) { window.scrollTo(0, 0); const mn = $('#main'); if (mn && !keep) mn.focus({ preventScroll: true }); $('#live').textContent = 'Halaman ' + title; }
    lastPath = path;
    if (keep) { const el = document.getElementById(keep.id); if (el) { el.focus(); try { el.setSelectionRange(keep.s, keep.e); } catch (e) { } } }
    if (out.after) out.after();
  }

  /* ---------- form + action dispatch ---------- */
  const A = {}, Fm = {};
  const formData = f => { const o = {}; new FormData(f).forEach((v, k) => { const x = v instanceof File ? v.name : v; if (k in o) o[k] = [].concat(o[k], x); else o[k] = x; }); return o; };
  const arr = x => x == null || x === '' ? [] : [].concat(x);
  function clearErrors(f) { $$('.err', f).forEach(e => e.textContent = ''); $$('[aria-invalid]', f).forEach(e => e.removeAttribute('aria-invalid')); const fe = $('.form-err', f); if (fe) fe.textContent = ''; }
  function showErrors(f, errs) {
    let first = true;
    for (const [k, msg] of Object.entries(errs)) {
      const el = $('#f-' + k, f), er = $('#f-' + k + '-e', f);
      if (er) { er.textContent = msg; if (el) el.setAttribute('aria-invalid', 'true'); if (first && el) { el.focus(); first = false; } }
      else { const fe = $('.form-err', f); if (fe) { fe.textContent = msg; } else toast(msg, 'bad'); }
    }
  }
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    clearErrors(f); const r = Fm[f.dataset.form](formData(f), f);
    if (typeof r === 'string') showErrors(f, { _form: r }); else if (r && r.errors) showErrors(f, r.errors);
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t || !A[t.dataset.act]) return;
    if (t.tagName === 'A' && !t.dataset.keep) e.preventDefault(); A[t.dataset.act](t, e);
  });
  document.addEventListener('change', e => { const t = e.target.closest('[data-act-change]'); if (t && A[t.dataset.actChange]) A[t.dataset.actChange](t, e); });
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.filter) { UI.f[t.dataset.filter] = t.value; UI.pg = {}; render(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('nav-open'); });

  Object.assign(A, {
    closeModal, page(t) { UI.pg[t.dataset.id] = +t.dataset.n; render(); },
    toggleSide(t) { const o = document.body.classList.toggle('nav-open'); const b = $('.burger'); if (b) b.setAttribute('aria-expanded', o); },
    logout() { S.clear(); toast('Anda telah keluar.', 'ok'); go('/login'); },
    resetDemo() { confirmDlg('Seluruh perubahan pada data demo di browser ini akan dikembalikan ke data awal. Lanjutkan?', 'Atur ulang data', () => { M.reset(); toast('Data demo dikembalikan ke kondisi awal.'); render(); }); },
    switchRole(t) { const r = t.value; S.set({ userId: DEMO_USER[r], demo: true }); go(HOME[r]); }
  });

  const download = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; document.body.append(a); a.click(); a.remove(); };
  const csv = rows => rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');

  addEventListener('hashchange', () => { closeModal(); document.body.classList.remove('nav-open'); render(); });
  window.U = { esc, raw, h, $, $$, fmtD, fmtDT, rp, ago, toDateInput, ic, badge, bst, stl, jbadge, sgbadge, prb, cbadge, card, kpi, kpis, empty, progress, tip, btn, link, field, checks, radios, table, searchBox, selFilter, stepper, toast, modal, closeModal, confirmDlg, S, HOME, ROLES, DEMO_USER, NAV, route, go, render, A, Fm, UI, formData, arr, download, csv, shellPublic, cur };
})();
