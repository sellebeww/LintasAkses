/* Copyright (c) 2026 Vassel Goleyu. All rights reserved. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- toast ---------- */
  let tt;
  const toast = msg => {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 3200);
  };
  $$('[data-soon]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('Tautan media sosial belum tersedia pada prototipe.'); }));

  /* ---------- nav, progress, burger ---------- */
  const nav = $('#nav'), bar = $('#progress'), burger = $('#burger');
  const onScroll = () => {
    nav.classList.toggle('solid', scrollY > 30);
    const h = document.documentElement;
    bar.style.width = (scrollY / (h.scrollHeight - innerHeight)) * 100 + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => {
    const o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Tutup menu' : 'Buka menu');
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  /* ---------- chapter dots ---------- */
  const chapObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $$('#chapters a').forEach(a => a.classList.toggle('on', a.dataset.t === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-chapter]').forEach(s => chapObs.observe(s));

  /* ---------- reveal (staggered by sibling index) ---------- */
  const revObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => {
    const i = [...el.parentElement.children].filter(c => c.classList.contains('reveal')).indexOf(el);
    el.style.setProperty('--d', Math.min(i, 5) * 0.09 + 's');
    revObs.observe(el);
  });

  /* ---------- counters ---------- */
  const cntObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cntObs.unobserve(e.target);
    const el = e.target, end = +el.dataset.count;
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const f = t => { const p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cntObs.observe(el));

  /* ---------- hero glow + map tilt ---------- */
  const hero = $('.hero'), card = $('.map-card');
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', e.clientX - r.left + 'px'); hero.style.setProperty('--my', e.clientY - r.top + 'px');
      const c = card.getBoundingClientRect();
      const dx = (e.clientX - (c.left + c.width / 2)) / innerWidth, dy = (e.clientY - (c.top + c.height / 2)) / innerHeight;
      card.style.setProperty('--ry', (dx * 5).toFixed(2) + 'deg'); card.style.setProperty('--rx', (-dy * 5).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => { card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg'); });
  }

  /* ---------- spotlight on feature cards ---------- */
  document.addEventListener('pointermove', e => {
    const c = e.target.closest?.('.card'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--x', e.clientX - r.left + 'px'); c.style.setProperty('--y', e.clientY - r.top + 'px');
  });

  /* ---------- hero route map: status cycle ---------- */
  const pinBg = $('.pin-bg'), pulse = $('.pulse'), pinIc = $('#pin-ic'), pin = $('#pin'), s3 = $('#s3');
  const chip = $('#map-state'), live = $('#map-live');
  let paused = false, timers = [];

  const setChip = (cls, txt, icon) => {
    chip.className = 'chip ' + cls;
    chip.innerHTML = `<svg class="ic"><use href="#${icon}"/></svg><b>${txt}</b>`;
  };
  const states = {
    blocked() {
      s3.setAttribute('class', 'seg bad done-draw');
      pinBg.style.fill = 'var(--bad)'; pulse.style.fill = 'var(--bad)'; pin.style.opacity = 1;
      pinIc.setAttribute('d', 'M-4.5 -4.5l9 9M4.5 -4.5l-9 9');
      setChip('', 'Terhambat', 'i-flag');
      live.textContent = 'Segmen 3 (penyeberangan) belum punya ramp kerb. Seluruh perjalanan tertahan.';
    },
    plan() {
      s3.setAttribute('class', 'seg plan live done-draw');
      pinBg.style.fill = '#1E8F7B'; pulse.style.fill = '#3FC2A8';
      pinIc.setAttribute('d', 'M-5.5 0h.01M0 0h.01M5.5 0h.01'); pinIc.setAttribute('stroke-width', '3.4');
      setChip('plan', 'Perbaikan berjalan', 'i-package');
      live.textContent = 'Paket perbaikan disepakati: pengelola jalan memasang ramp kerb. Status: sedang dikerjakan.';
    },
    ok() {
      s3.setAttribute('class', 'seg ok done-draw');
      pinBg.style.fill = '#B88A45'; pulse.style.fill = '#C79F57';
      pinIc.setAttribute('d', 'M-5 0.5l3.5 3.5L5.5 -3.5'); pinIc.setAttribute('stroke-width', '2.6');
      setChip('ok', 'Segmen 3 terverifikasi', 'i-shield');
      live.textContent = 'Verifikator independen menyatakan segmen 3 lolos. Perjalanan kini bisa masuk tahap uji pengguna.';
    }
  };
  const order = ['blocked', 'plan', 'ok'], dwell = [4800, 3800, 6200];
  let idx = 0;
  const step = () => {
    states[order[idx]](); const d = dwell[idx]; idx = (idx + 1) % order.length;
    timers = [setTimeout(() => { if (!paused) step(); }, d)];
  };
  const startMap = () => { idx = 0; step(); };
  setTimeout(() => { $$('.seg').forEach(s => s.classList.add('done-draw')); $$('#segs .plan,#segs .rev,#segs .wait').forEach(s => s.classList.add('live')); }, 3800);
  if (reduce) { states.blocked(); } else setTimeout(startMap, 3000);
  const pauseBtn = $('#map-pause');
  pauseBtn.addEventListener('click', () => {
    paused = !paused; pauseBtn.setAttribute('aria-pressed', paused);
    pauseBtn.textContent = paused ? 'Putar animasi' : 'Jeda animasi';
    if (paused) timers.forEach(clearTimeout); else step();
  });
  if (reduce) pauseBtn.hidden = true;

  /* ---------- problem section: interactive journey ---------- */
  const J = $('#journey'), jSteps = $$('.j-step', J), fix = $('#j-fix'), reset = $('#j-reset'), msg = $('#j-msg');
  const setP = p => J.style.setProperty('--p', p + '%');
  const reach = n => jSteps.forEach((s, i) => s.classList.toggle('reached', i <= n));
  const jBlocked = () => {
    J.dataset.state = 'blocked'; fix.hidden = false; reset.hidden = true;
    $('.st-t', J).textContent = 'Tanpa ramp kerb';
    $('.j-step.bad use', J).setAttribute('href', '#i-x');
    reach(1); setP(50);
    msg.innerHTML = '<strong>Perjalanan terhenti di segmen 3.</strong> Empat segmen lain aksesibel, tetapi tidak satu pun berguna bila pengguna tidak bisa menyeberang.';
  };
  const jFixed = () => {
    J.dataset.state = 'fixed'; fix.hidden = true; reset.hidden = false;
    $('.st-t', J).textContent = 'Ramp terpasang';
    $('.j-step.bad use', J).setAttribute('href', '#i-check');
    setP(100); [2, 3, 4].forEach((n, k) => setTimeout(() => reach(n), reduce ? 0 : 500 + k * 450));
    msg.innerHTML = '<strong>Perjalanan utuh bisa dilalui.</strong> Dalam platform, status ini baru sah setelah diverifikasi independen dan diuji pengguna dengan kebutuhan akses yang sesuai.';
  };
  fix.addEventListener('click', jFixed); reset.addEventListener('click', jBlocked);
  const jObs = new IntersectionObserver(es => { if (es[0].isIntersecting) { setTimeout(jBlocked, 200); jObs.disconnect(); } }, { threshold: .5 });
  jObs.observe(J);

  /* ---------- role tabs ---------- */
  const mk = (side, kpis, rows, active = 0) => `
    <div class="win" aria-hidden="true"><div class="win-bar"><i></i><i></i><i></i><span>Tampilan contoh · data simulasi</span></div>
    <div class="win-body"><div class="win-side">${side.map((s, i) => `<b class="${i === active ? 'on' : ''}">${s}</b>`).join('')}</div>
    <div class="win-main"><div class="kpis">${kpis.map(k => `<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b></div>`).join('')}</div><div class="rows">${rows}</div></div></div></div>`;
  const row = (t, tag, c) => `<div class="mrow"><b>${t}</b><span class="tag ${c}">${tag}</span></div>`;
  const prog = (t, p) => `<div class="mrow" style="display:grid"><b>${t}</b><div class="bar"><i style="width:${p}%"></i></div></div>`;
  const roles = [
    { k: 'traveler', n: 'Pelancong', t: 'Rencanakan perjalanan tanpa menebak-nebak.', d: 'Antarmuka yang ramah dan sederhana untuk memetakan perjalanan, melihat hambatan, dan mengikuti perbaikan.',
      li: ['Susun perjalanan per segmen dengan wizard empat langkah', 'Pilih kebutuhan akses tanpa menyebut diagnosis', 'Lapor hambatan dengan bukti dan atur visibilitasnya', 'Ikut menguji perjalanan setelah diverifikasi'],
      m: mk(['Overview', 'My Journeys', 'Explore', 'Report a Barrier', 'Notifications'], [['Tersimpan', 5], ['Dinilai', 3], ['Siap uji', 1]],
        row('Stasiun Contoh → Museum Puspa', 'Terhambat', 'r') + row('Hotel Puspa → Galeri Kota', 'Perbaikan berlangsung', 'y') + row('Halte Contoh → Taman Puspa', 'Siap untuk pengujian', 'g')) },
    { k: 'partner', n: 'Mitra Lokasi', t: 'Terima tugas yang memang tanggung jawab Anda.', d: 'Dasbor gaya enterprise untuk operator destinasi, transportasi, hotel, dan pengelola infrastruktur.',
      li: ['Daftarkan organisasi dan lokasi yang dikelola', 'Terima, tolak (dengan alasan), atau usulkan alternatif', 'Catat komitmen dan perbarui progres dengan bukti', 'Lihat hasil verifikasi atas pekerjaan Anda'],
      m: mk(['Overview', 'My Locations', 'Improvement Requests', 'Active Projects', 'Commitments'], [['Lokasi', 3], ['Permintaan', 2], ['Komitmen aktif', 1]],
        row('Ramp kerb penyeberangan · Tinggi', 'Menunggu respons', 'y') + row('Penanda taktil jalur masuk · Sedang', 'Diterima', 'g') + row('Papan petunjuk kontras tinggi', 'Usulan alternatif', 'b'), 2) },
    { k: 'coordinator', n: 'Koordinator Proyek', t: 'Satukan banyak pihak dalam satu rencana.', d: 'Pusat operasi untuk mengelompokkan hambatan menjadi paket, menugaskan mitra, dan memantau anggaran serta jadwal.',
      li: ['Kelompokkan hambatan lintas segmen menjadi paket perbaikan', 'Tugaskan mitra dan pantau komitmen', 'Kelola anggaran ilustratif dan jadwal bergaya Gantt', 'Hasilkan laporan dampak PDF/CSV'],
      m: mk(['Overview', 'Barrier Mgmt', 'Packages', 'Timeline', 'Budget'], [['Perjalanan', 5], ['Hambatan kritis', 4], ['Paket terbuka', 1]],
        prog('PKG-001 · Koridor Stasiun–Museum', 46) + prog('Implementasi · Penyeberangan', 30) + row('Verifikasi independen', 'Dijadwalkan', 'b'), 2) },
    { k: 'verifier', n: 'Verifikator Lapangan', t: 'Buktikan, jangan hanya percaya.', d: 'Ruang kerja auditor independen dengan daftar periksa terstruktur dan jejak bukti yang tersimpan.',
      li: ['Terima penugasan dan jadwalkan kunjungan lapangan', 'Isi daftar periksa mobilitas, visual, pendengaran, kognitif', 'Unggah bukti foto, catat metode dan tanggal', 'Putuskan: terverifikasi, sebagian, tidak, atau uji ulang'],
      m: mk(['Overview', 'Assigned', 'Field Visits', 'Checklist', 'Reports'], [['Tugas', 3], ['Kunjungan', 2], ['Selesai', 4]],
        row('Jalur kontinu & lebar memadai', 'Pass', 'g') + row('Ramp dapat dipakai', 'Needs Improvement', 'y') + row('Isyarat visual tersedia', 'Unable to Verify', 'b'), 3) },
    { k: 'admin', n: 'Administrator', t: 'Jaga platform tetap jujur dan aman.', d: 'Kontrol pengguna, organisasi, moderasi laporan, dan log audit yang mencatat setiap keputusan penting.',
      li: ['Verifikasi organisasi dan kelola izin pengguna', 'Moderasi laporan: duplikat, data pribadi, tidak valid', 'Pantau aktivitas platform', 'Tinjau log audit, termasuk perubahan anggaran dan status'],
      m: mk(['Overview', 'Users', 'Organizations', 'Moderation', 'Audit Logs'], [['Pengguna', 24], ['Organisasi', 6], ['Laporan baru', 3]],
        row('Verifikator: keputusan “Verified”', 'Dicatat', 'g') + row('Anggaran PKG-001 direvisi', 'Dicatat', 'y') + row('Laporan duplikat digabung', 'Dicatat', 'b'), 4) }
  ];
  const tabs = $('#role-tabs'), stage = $('#role-stage');
  roles.forEach((r, i) => {
    const b = document.createElement('button');
    b.className = 'tab'; b.role = 'tab'; b.id = 'tab-' + r.k; b.textContent = r.n;
    b.setAttribute('aria-selected', i === 0); b.tabIndex = i === 0 ? 0 : -1; b.setAttribute('aria-controls', 'role-stage');
    b.addEventListener('click', () => show(i));
    b.addEventListener('keydown', e => {
      const n = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!n) return;
      e.preventDefault(); const j = (i + n + roles.length) % roles.length; show(j); $$('.tab')[j].focus();
    });
    tabs.append(b);
  });
  function show(i) {
    const r = roles[i];
    $$('.tab').forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; });
    stage.setAttribute('aria-labelledby', 'tab-' + r.k);
    stage.innerHTML = `<div class="role-info"><h3>${esc(r.t)}</h3><p>${esc(r.d)}</p>
      <ul>${r.li.map(x => `<li><svg class="ic"><use href="#i-check"/></svg>${esc(x)}</li>`).join('')}</ul>
      <a class="btn btn-navy" href="app/index.html#/demo/${r.k}">Buka sebagai ${esc(r.n)} <svg class="ic"><use href="#i-arrow"/></svg></a></div>${r.m}`;
  }
  show(0);

  /* ---------- contact form ---------- */
  $('#contact').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, err = $('#c-err'), org = f.org, em = f.email;
    [org, em].forEach(i => i.removeAttribute('aria-invalid'));
    const bad = !org.value.trim() ? org : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value) ? em : null;
    if (bad) {
      bad.setAttribute('aria-invalid', 'true');
      err.textContent = bad === org ? 'Nama organisasi wajib diisi.' : 'Masukkan alamat email yang valid.';
      err.hidden = false; bad.focus(); return;
    }
    err.hidden = true; f.reset();
    toast('Terima kasih! Pada prototipe ini minat Anda tidak dikirim ke mana pun.');
  });
})();
