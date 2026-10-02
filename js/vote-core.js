/**
 * vote-core.js — engine for the Live Voting overlay.
 * Reads a public Google Sheet (Google Forms responses), auto-detects the
 * Name / Status / Choice columns by header text, tallies votes, and draws
 * bar / column / pie / donut / number charts with animated counting.
 */
(function (g) {
  const PALETTE = ['#3BD16F', '#FFB020', '#4DA3FF', '#FF4438', '#B66DFF', '#2EE6D6', '#FF7AC6', '#C8D13B'];

  function parseCSV(t) {
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim() !== ''));
  }

  const sheetId = u => (u.match(/\/d\/([a-zA-Z0-9-_]+)/) || [])[1];
  const gidOf = u => (u.match(/[#&?]gid=(\d+)/) || [])[1] || '';

  async function fetchSheet(url, gid) {
    const id = sheetId(url || '');
    if (!id) throw new Error('Link Google Sheets tidak valid');
    const gd = gid || gidOf(url);
    const api = 'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv' + (gd ? '&gid=' + gd : '') + '&_=' + Date.now();
    let r;
    try { r = await fetch(api, { cache: 'no-store' }); }
    catch (e) { throw new Error('Gagal membaca sheet. Pastikan akses: "Anyone with the link — Viewer".'); }
    const t = await r.text();
    if (!r.ok || t.trim().startsWith('<')) throw new Error('Sheet tidak publik / tidak ditemukan. Atur akses ke "Anyone with the link".');
    const all = parseCSV(t);
    return { headers: (all[0] || []).map(h => h.trim()), rows: all.slice(1) };
  }

  const clean = h => h.replace(/^\s*\d+\s*[.)\-:]\s*/, '').trim().toLowerCase();

  // Auto-detect which column is name / status / choice from header text.
  function detect(headers) {
    const H = headers.map(clean), m = { nm: -1, st: -1, ch: -1 };
    m.nm = H.findIndex(h => /\b(nama|name)\b/.test(h));
    m.st = H.findIndex(h => /status/.test(h));
    let best = -1, bs = 0;
    H.forEach((h, i) => {
      if (i === m.nm || i === m.st || /timestamp|waktu|email/.test(h)) return;
      const s = /dipilih|terpilih/.test(h) ? 3 : /kandidat|calon|choice|vote|voting|pilihan/.test(h) ? 2 : /ketua|pilih/.test(h) ? 1 : 0;
      if (s > bs) { bs = s; best = i; }
    });
    m.ch = best >= 0 ? best : (headers.length > 1 ? headers.length - 1 : -1);
    return m;
  }

  // map = {nm,st,ch} as header text OR index; opt = {ok:[...], uniq}
  function idx(headers, v) {
    if (v === undefined || v === '' || v === null) return -1;
    if (/^\d+$/.test(v) && +v < headers.length && !headers.includes(v)) return +v;
    return headers.findIndex(h => h === v);
  }

  function tally(sheet, map, opt) {
    opt = opt || {};
    const ci = idx(sheet.headers, map.ch), ni = idx(sheet.headers, map.nm), si = idx(sheet.headers, map.st);
    const ok = (opt.ok || []).map(s => s.trim().toLowerCase());
    let list = [];
    sheet.rows.forEach(r => {
      const ch = (r[ci] || '').trim(); if (!ch) return;
      if (si >= 0 && ok.length && !ok.includes((r[si] || '').trim().toLowerCase())) return;
      list.push({ name: ni >= 0 ? (r[ni] || '').trim() : '', choice: ch });
    });
    if (opt.uniq && ni >= 0) { // one vote per name, latest wins
      const seen = new Map(); list.forEach(v => seen.set(v.name.toLowerCase() || Math.random(), v)); list = [...seen.values()];
    }
    const map2 = new Map();
    list.forEach(v => { const k = v.choice.toLowerCase(); if (!map2.has(k)) map2.set(k, { label: v.choice, count: 0 }); map2.get(k).count++; });
    return { items: [...map2.values()], total: list.length, voters: list };
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function arc(cx, cy, r, a0, a1) {
    const p = a => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return 'M' + cx + ' ' + cy + ' L' + x0 + ' ' + y0 + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1 + ' ' + y1 + ' Z';
  }

  /**
   * mount(el, o): o = {type, hide, title, pct, sort, recent, total, colors[]}
   * returns {update(data)} — values tween smoothly so numbers "climb".
   */
  function mount(el, o) {
    el.innerHTML = '<div class="v-title"></div><div class="v-chart"></div><div class="v-total"></div><div class="v-recent"></div><div class="v-err"></div>';
    const $ = s => el.querySelector(s);
    $('.v-title').textContent = o.title || '';
    $('.v-title').style.display = o.title ? '' : 'none';
    let cur = {}, tgt = {}, data = { items: [], total: 0, voters: [] }, raf = 0, labels = [];

    const color = l => { const i = labels.indexOf(l); return (o.colors && o.colors[i]) || PALETTE[i % PALETTE.length]; };

    function draw() {
      const items = data.items.map(it => ({ label: it.label, v: cur[it.label] || 0, n: it.count }));
      if (o.sort === 'name') items.sort((a, b) => a.label.localeCompare(b.label));
      else if (o.sort !== 'none') items.sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
      const sum = items.reduce((s, i) => s + i.v, 0), tot = data.total || 0;
      const pc = i => (tot ? (i.n / tot * 100).toFixed(1).replace('.0', '') : 0) + '%';
      const num = i => Math.round(i.v);
      const max = Math.max(1, ...items.map(i => i.v));
      let h = '';
      if (!items.length) h = '<div class="v-empty">Menunggu suara masuk…</div>';
      else if (o.type === 'column') {
        h = '<div class="v-cols">' + items.map(i => '<div class="v-col"><div class="v-cnum">' + num(i) + (o.pct ? '<small>' + pc(i) + '</small>' : '') +
          '</div><div class="v-cbar" style="height:' + (i.v / max * 100) + '%;background:' + color(i.label) + '"></div><div class="v-clab">' + esc(i.label) + '</div></div>').join('') + '</div>';
      } else if (o.type === 'pie' || o.type === 'donut') {
        let a = -0, svg = '';
        const useSum = sum || 1;
        if (items.filter(i => i.v > 0).length === 1) svg = '<circle cx="100" cy="100" r="95" fill="' + color(items.find(i => i.v > 0).label) + '"/>';
        else items.forEach(i => { const d = i.v / useSum * Math.PI * 2; if (d > 0) svg += '<path d="' + arc(100, 100, 95, a, a + d) + '" fill="' + color(i.label) + '"/>'; a += d; });
        if (o.type === 'donut') svg += '<circle cx="100" cy="100" r="58" class="v-hole"/><text x="100" y="104" text-anchor="middle" class="v-dtot">' + Math.round(sum) + '</text><text x="100" y="124" text-anchor="middle" class="v-dsub">suara</text>';
        h = '<div class="v-pie"><svg viewBox="0 0 200 200">' + svg + '</svg><div class="v-legend">' + items.map(i =>
          '<div class="v-li"><i style="background:' + color(i.label) + '"></i><span>' + esc(i.label) + '</span><b>' + num(i) + (o.pct ? ' <small>' + pc(i) + '</small>' : '') + '</b></div>').join('') + '</div></div>';
      } else if (o.type === 'number') {
        h = '<div class="v-nums">' + items.map(i => '<div class="v-ncard" style="border-color:' + color(i.label) + '"><div class="v-nbig" style="color:' + color(i.label) + '">' + num(i) +
          '</div><div class="v-nlab">' + esc(i.label) + (o.pct ? ' · ' + pc(i) : '') + '</div></div>').join('') + '</div>';
      } else {
        h = '<div class="v-bars">' + items.map(i => '<div class="v-row"><div class="v-rtop"><span>' + esc(i.label) + '</span><b>' + num(i) + (o.pct ? ' <small>' + pc(i) + '</small>' : '') +
          '</b></div><div class="v-track"><div class="v-fill" style="width:' + (i.v / max * 100) + '%;background:' + color(i.label) + '"></div></div></div>').join('') + '</div>';
      }
      $('.v-chart').innerHTML = h;
    }

    function tick() {
      let moving = false;
      for (const k in tgt) {
        const d = tgt[k] - (cur[k] || 0);
        if (Math.abs(d) > 0.01) { cur[k] = (cur[k] || 0) + d * 0.18; moving = true; } else cur[k] = tgt[k];
      }
      draw();
      raf = moving ? requestAnimationFrame(tick) : 0;
    }

    return {
      update(d) {
        data = d; tgt = {};
        labels = d.items.map(i => i.label).sort((a, b) => a.localeCompare(b));
        d.items.forEach(i => { tgt[i.label] = i.count; if (!(i.label in cur)) cur[i.label] = 0; });
        $('.v-total').style.display = o.total ? '' : 'none';
        $('.v-total').innerHTML = 'Total suara: <b>' + d.total + '</b>';
        const rc = $('.v-recent');
        if (o.hide || !o.recent) rc.style.display = 'none';   // hide names => no voter info at all
        else {
          rc.style.display = '';
          rc.innerHTML = '<div class="v-rh">Suara terbaru</div>' + d.voters.slice(-o.recent).reverse().map(v =>
            '<div class="v-rv"><span>' + esc(v.name || 'Anonim') + '</span><em>' + esc(v.choice) + '</em></div>').join('');
        }
        $('.v-err').textContent = '';
        if (!raf) raf = requestAnimationFrame(tick);
      },
      error(msg) { $('.v-err').textContent = '⚠ ' + msg; }
    };
  }

  g.VoteCore = { fetchSheet, detect, tally, mount, parseCSV, PALETTE };
})(window);
