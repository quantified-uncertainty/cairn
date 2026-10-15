// Stacks Browser v2 — lanes of openable texts, cropped page spreads, a context
// panel with AI summaries, and a prefetcher that tries to have the next thing
// you will look at already decoded in memory.

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
const P = (u) => '/proxy?u=' + encodeURIComponent(u);
const $ = (s) => document.querySelector(s);
const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k);
  return el;
};
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('stacks2:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('stacks2:' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

// ---------- corpus ----------
const corpus = await (await fetch('/corpus.json')).json();
const { items } = corpus;
const LANES = corpus.lanes || {};
const LANE_COLORS = { lesswrong: '#5a7a4b', 'ai-safety': '#a0442f', llm: '#3c5a7a', 'information-theory': '#6b4f8a', cybernetics: '#2f7a76', ttrpg: '#8a5a2b', oddities: '#7a6f60' };
const byId = new Map(items.map((it, i) => [it.id, i]));
const STOP = new Set('the and for with from that this into over under about their your what when where which while using towards toward between through against without within paper part book books volume introduction theory study notes edition'.split(' '));
const tokens = (it) => [...new Set(String(it.t).toLowerCase().match(/[a-z][a-z-]{3,}/g) || [])].filter((w) => !STOP.has(w));
const laneMax = {};
for (const it of items) laneMax[it.lane] = Math.max(laneMax[it.lane] || 1, it.score || 0);

const state = {
  view: 'feed', lane: store.get('lane', 'all'),
  aff: store.get('aff', { lane: {}, tok: {} }), saved: store.get('saved', []),
  order: [], pos: 0, start: new Map(), shown: 0, gen: 0,
  per: store.get('per', 3), zoom: false, crop: store.get('crop', true), cols: store.get('cols', false),
  presum: store.get('presum', true), turns: [], status: {}, panel: store.get('panel', true), pin: store.get('pin', false),
};
const seed = store.get('seed', Math.floor(Math.random() * 1e9));
store.set('seed', seed);
const noise = (i) => { let x = (i + 1) * 2654435761 ^ seed; x = Math.imul(x ^ (x >>> 15), 2246822507); x ^= x >>> 13; return ((x >>> 0) % 10000) / 10000; };

function score(i) {
  const it = items[i];
  const lane = state.aff.lane[it.lane] || 0;
  const tok = Math.max(-2, Math.min(2, tokens(it).reduce((s, w) => s + (state.aff.tok[w] || 0), 0)));
  const q = Math.log(1 + (it.score || 0)) / Math.log(1 + laneMax[it.lane]);
  return noise(i) * 0.9 + 0.5 * lane + 0.25 * tok + 0.8 * q;
}
function buildOrder(keepHead = true) {
  let pool = items.map((_, i) => i).filter((i) => state.lane === 'all' || items[i].lane === state.lane);
  pool.sort((a, b) => score(b) - score(a));
  if (state.lane === 'all') {
    // Round-robin across lanes, giving liked lanes more turns.
    const buckets = {};
    for (const i of pool) (buckets[items[i].lane] ||= []).push(i);
    const lanes = Object.keys(buckets);
    const weight = (l) => Math.max(0.3, 1 + (state.aff.lane[l] || 0) * 0.5);
    const out = []; const credit = Object.fromEntries(lanes.map((l) => [l, 0]));
    while (out.length < pool.length) {
      for (const l of lanes) credit[l] += weight(l);
      const l = lanes.filter((x) => buckets[x].length).sort((a, b) => credit[b] - credit[a])[0];
      if (!l) break;
      credit[l] -= lanes.length; out.push(buckets[l].shift());
    }
    pool = out;
  }
  if (keepHead && state.order.length) {
    const head = state.order.slice(0, state.pos + 3);
    const hs = new Set(head);
    state.order = head.concat(pool.filter((i) => !hs.has(i)));
  } else { state.order = pool; state.pos = 0; }
}
function learn(it, w) {
  state.aff.lane[it.lane] = (state.aff.lane[it.lane] || 0) + w;
  for (const t of tokens(it)) state.aff.tok[t] = (state.aff.tok[t] || 0) + w * 0.5;
  store.set('aff', state.aff);
}

// ---------- documents ----------
let pdfjsP = null;
const pdfjs = () => (pdfjsP ||= import(P(PDFJS + 'pdf.min.mjs')).then((m) => { m.GlobalWorkerOptions.workerSrc = P(PDFJS + 'pdf.worker.min.mjs'); return m; }));
const docs = new Map();
function lru(map, key, make, cap) {
  if (map.has(key)) { const v = map.get(key); map.delete(key); map.set(key, v); return v; }
  const v = make();
  if (v && v.catch) v.catch(() => map.delete(key));
  map.set(key, v);
  while (map.size > cap) {
    const [k, old] = map.entries().next().value;
    map.delete(k);
    if (old && old.then) old.then((d) => d?.pdf?.destroy?.()).catch(() => {});
  }
  return v;
}
const scanUrl = (it, k, w) => `https://archive.org/download/${it.ia}/page/n${k}_w${w}.jpg`;

function openDoc(it) {
  if (it.kind === 'scan') return Promise.resolve({ n: it.n, outline: [] });
  return lru(docs, it.id, async () => {
    if (it.kind === 'pdf') {
      const [lib, buf] = await Promise.all([pdfjs(), fetch(P(it.url)).then((r) => { if (!r.ok) throw new Error('PDF ' + r.status); return r.arrayBuffer(); })]);
      const pdf = await lib.getDocument({ data: buf, isEvalSupported: false }).promise;
      return { n: pdf.numPages, pdf, outline: null };
    }
    const r = await fetch(P(it.url));
    if (!r.ok) throw new Error('fetch ' + r.status);
    let html;
    if (it.kind === 'html') {
      const j = await r.json();
      html = j?.data?.post?.result?.htmlBody || '<p>(empty)</p>';
    } else {
      let txt = (await r.text()).replace(/\r\n/g, '\n');
      const s = txt.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i);
      if (s >= 0) txt = txt.slice(txt.indexOf('\n', s) + 1);
      const e = txt.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i);
      if (e >= 0) txt = txt.slice(0, e);
      html = txt.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => {
        const one = p.replace(/\s*\n\s*/g, ' ');
        const esc = one.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return /^(CHAPTER|BOOK|PART|SECTION)\b/i.test(one) || (one.length < 70 && one === one.toUpperCase() && /[A-Z]/.test(one)) ? `<h3>${esc}</h3>` : `<p>${esc}</p>`;
      }).join('');
    }
    return paginate(it, html);
  }, 16);
}

/** Lay HTML out into fixed 640x900 virtual pages by measuring real layout. */
function paginate(it, html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,form,noscript').forEach((x) => x.remove());
  doc.querySelectorAll('img').forEach((img) => { img.setAttribute('style', 'height:260px;width:100%;object-fit:contain'); img.setAttribute('loading', 'lazy'); });
  doc.querySelectorAll('a').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
  const blocks = [];
  const walk = (node) => {
    for (const c of [...node.childNodes]) {
      if (c.nodeType === 3) { if (c.textContent.trim()) blocks.push(Object.assign(document.createElement('p'), { textContent: c.textContent })); continue; }
      if (c.nodeType !== 1) continue;
      if (/^(DIV|SECTION|ARTICLE|SPAN)$/.test(c.tagName) && c.querySelector('p,h1,h2,h3,h4,ul,ol,figure,blockquote,table,pre')) walk(c);
      else blocks.push(c);
    }
  };
  walk(doc.body);
  const meas = h('div', { className: 'vpage' });
  Object.assign(meas.style, { position: 'absolute', left: '-20000px', top: '0', visibility: 'hidden' });
  document.body.append(meas);
  const title = `<div class="title-block"><div class="t">${esc(it.t)}</div><div class="m">${esc([it.a, it.y, it.src].filter(Boolean).join(' · '))}</div></div>`;
  const pages = []; const texts = []; const outline = [];
  meas.innerHTML = title;
  const limit = () => meas.clientHeight; // content box incl. padding; compare scrollHeight
  const flush = () => { pages.push(meas.innerHTML); texts.push(meas.textContent); meas.innerHTML = ''; };
  for (const b of blocks) {
    const el = document.importNode(b, true);
    meas.append(el);
    if (meas.scrollHeight > limit() && meas.childNodes.length > 1) { el.remove(); flush(); meas.append(el); }
    if (/^H[1-4]$/.test(el.tagName) && el.textContent.trim()) outline.push({ title: el.textContent.trim().slice(0, 90), page: pages.length, depth: Number(el.tagName[1]) - 1 });
  }
  if (meas.childNodes.length) flush();
  meas.remove();
  return { n: pages.length, pages, texts, outline };
}
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

async function pdfOutline(d) {
  if (d.outline) return d.outline;
  const out = [];
  try {
    const ol = await d.pdf.getOutline();
    const visit = async (nodes, depth) => {
      for (const n of nodes || []) {
        if (out.length > 80) return;
        let page = null;
        try {
          const dest = typeof n.dest === 'string' ? await d.pdf.getDestination(n.dest) : n.dest;
          if (dest) page = await d.pdf.getPageIndex(dest[0]);
        } catch { /* unresolvable */ }
        out.push({ title: n.title, page, depth });
        if (depth < 1) await visit(n.items, depth + 1);
      }
    };
    await visit(ol, 0);
  } catch { /* no outline */ }
  d.outline = out;
  return out;
}

// ---------- images, cropping, columns ----------
const imgs = new Map();
function loadImg(src) {
  return lru(imgs, src, () => new Promise((res, rej) => {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => im.decode().then(() => res(im), () => res(im));
    im.onerror = () => rej(new Error('image unavailable'));
    im.src = src;
  }), 60);
}

/** Find the ink box, whether the page is blank, and a two-column gutter. */
function analyze(src) {
  const W = 220; const H = Math.max(1, Math.round(src.height * (W / src.width)));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = 0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2];
  const sorted = Float32Array.from(lum).sort();
  const bg = sorted[Math.floor(sorted.length * 0.8)];
  const thr = bg - Math.max(45, bg * 0.25);
  const rows = new Uint16Array(H), cols = new Uint16Array(W);
  let ink = 0;
  // Ignore a thin outer border, where scanner shadows and page edges live.
  const mx = Math.round(W * 0.03), my = Math.round(H * 0.02);
  for (let y = my; y < H - my; y++) for (let x = mx; x < W - mx; x++) if (lum[y * W + x] < thr) { rows[y]++; cols[x]++; ink++; }
  const frac = ink / (W * H);
  if (frac < 0.0025) return { blank: true };
  const rmin = Math.max(1, W * 0.004), cmin = Math.max(1, H * 0.004);
  let y0 = my, y1 = H - my - 1, x0 = mx, x1 = W - mx - 1;
  while (y0 < y1 && rows[y0] < rmin) y0++;
  while (y1 > y0 && rows[y1] < rmin) y1--;
  while (x0 < x1 && cols[x0] < cmin) x0++;
  while (x1 > x0 && cols[x1] < cmin) x1--;
  const pad = 0.025;
  const box = { x0: Math.max(0, x0 / W - pad), y0: Math.max(0, y0 / H - pad), x1: Math.min(1, (x1 + 1) / W + pad), y1: Math.min(1, (y1 + 1) / H + pad) };
  // Gutter: an ink-free vertical run in the middle third of the box.
  let gutter = null;
  const bw = x1 - x0;
  if (bw > 40) {
    let run = 0, best = 0, at = 0;
    for (let x = Math.round(x0 + bw * 0.38); x <= Math.round(x0 + bw * 0.62); x++) {
      if (cols[x] <= (y1 - y0) * 0.004) { run++; if (run > best) { best = run; at = x - run / 2; } } else run = 0;
    }
    if (best >= Math.max(2, bw * 0.012)) gutter = at / W;
  }
  return { blank: false, box, gutter };
}
function cut(src, box) {
  const sx = Math.round(box.x0 * src.width), sy = Math.round(box.y0 * src.height);
  const sw = Math.max(1, Math.round((box.x1 - box.x0) * src.width)), sh = Math.max(1, Math.round((box.y1 - box.y0) * src.height));
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}
/** Turn a raster page into display panels: cropped, or split into columns, or marked blank. */
function panelsFrom(src, k) {
  const a = analyze(src);
  if (a.blank) return [{ blank: true, k }];
  const full = { x0: 0, y0: 0, x1: 1, y1: 1 };
  const box = state.crop ? a.box : full;
  if (state.cols && a.gutter) {
    const left = { ...box, x1: Math.min(box.x1, a.gutter + 0.01) };
    const right = { ...box, x0: Math.max(box.x0, a.gutter - 0.01) };
    return [{ canvas: cut(src, left), k, part: 'a' }, { canvas: cut(src, right), k, part: 'b' }];
  }
  return [{ canvas: state.crop ? cut(src, box) : src, k }];
}

// Rendered pages, keyed by item, page and display options.
const renders = new Map();
function renderPage(it, k) {
  const key = `${it.id}|${k}|${state.crop}|${state.cols}`;
  return lru(renders, key, async () => {
    if (it.kind === 'scan') {
      const im = await loadImg(P(scanUrl(it, k, 1000)));
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      return panelsFrom(c, k);
    }
    const d = await openDoc(it);
    if (k >= d.n) return [];
    if (it.kind === 'pdf') {
      const page = await d.pdf.getPage(k + 1);
      const vp0 = page.getViewport({ scale: 1 });
      const scale = Math.min(1500 / vp0.width, 1400 / vp0.height);
      const vp = page.getViewport({ scale });
      const c = document.createElement('canvas'); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: g, viewport: vp }).promise;
      return panelsFrom(c, k);
    }
    return [{ html: d.pages[k], k }];
  }, 48);
}

// ---------- prefetch planning ----------
// A small client-side scheduler: tasks run 4 at a time, highest priority first,
// and every navigation replaces the plan with one centred on where you are now.
const sched = { q: new Map(), running: 0 };
function plan(tasks) {
  for (const [k, t] of sched.q) if (!t.started) sched.q.delete(k);
  for (const t of tasks) if (!sched.q.has(t.key)) sched.q.set(t.key, t);
  pumpSched();
}
function pumpSched() {
  while (sched.running < 4) {
    const next = [...sched.q.values()].filter((t) => !t.started).sort((a, b) => b.pri - a.pri)[0];
    if (!next) return;
    next.started = true; sched.running++;
    Promise.resolve().then(next.fn).catch(() => {}).finally(() => { sched.running--; sched.q.delete(next.key); pumpSched(); });
  }
}
function serverPrefetch(urls, pri, group) {
  if (urls.length) fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls, pri, group }) }).catch(() => {});
}

function velocity() {
  const now = Date.now();
  state.turns = state.turns.filter((t) => now - t.at < 4000);
  const last = state.turns.at(-1);
  if (!last) return { dir: 1, v: 0 };
  return { dir: last.dir, v: state.turns.filter((t) => t.dir === last.dir).length };
}

const randomTarget = new Map(); // item index -> next random start page, chosen in advance

function planAround(i, s) {
  const it = items[i];
  const per = Math.max(1, state.shown || state.per);
  const { dir, v } = velocity();
  const tasks = [];
  const render = (ii, k, pri) => tasks.push({ key: `r|${items[ii].id}|${k}|${state.crop}|${state.cols}`, pri, fn: () => renderPage(items[ii], k) });
  const n = it.n || null;
  // Ahead in the direction you are paging; further the faster you go.
  const ahead = 2 + 2 * Math.min(v, 3);
  for (let d = 1; d <= ahead; d++) for (let j = 0; j < per; j++) {
    const k = s + dir * d * per + (dir > 0 ? j : -j - 1 + per);
    if (k >= 0 && (!n || k < n)) render(i, k, 90 - d * 4 - j * 0.1);
  }
  // One spread the other way, for a reversal.
  for (let j = 0; j < per; j++) { const k = s - dir * per + j; if (k >= 0 && (!n || k < n)) render(i, k, 78 - j * 0.1); }
  // The random jump you have not made yet.
  if (n) {
    if (!randomTarget.has(i)) randomTarget.set(i, Math.floor(Math.random() * Math.max(1, n - per)));
    for (let j = 0; j < per; j++) render(i, randomTarget.get(i) + j, 70);
  }
  // The next items' first spreads.
  state.order.slice(state.pos + 1, state.pos + 4).forEach((ii, d) => {
    const s0 = startOf(ii);
    if (s0 != null) for (let j = 0; j < state.per; j++) render(ii, s0 + j, 65 - d * 5 - j * 0.1);
    else tasks.push({ key: `o|${items[ii].id}`, pri: 64 - d * 5, fn: () => openDoc(items[ii]).then((d2) => { items[ii].n ||= d2.n; }) });
  });
  plan(tasks);
  // The server works further ahead, into its disk cache, in priority bands:
  // sharp pages near you, then the next items' first spreads, then legible
  // mid-res pages a little further out, then thumbnails for the page strip.
  const near = [], mid = [], thumbs = [], nextItems = [];
  if (it.kind === 'scan') {
    const lo = Math.max(0, s - 2 * per), hi = Math.min(it.n, s + per * (6 + 4 * v));
    for (let k = lo; k < hi; k++) near.push(scanUrl(it, k, 1000));
    for (let k = Math.max(0, s - 10); k < Math.min(it.n, s + 40); k++) mid.push(scanUrl(it, k, 400));
    for (let k = Math.max(0, s - 20); k < Math.min(it.n, s + 60); k++) thumbs.push(scanUrl(it, k, 120));
  }
  for (const ii of state.order.slice(state.pos + 1, state.pos + 25)) {
    const x = items[ii];
    if (x.kind === 'scan') { const s0 = startOf(ii) ?? 0; for (let j = 0; j < state.per; j++) nextItems.push(scanUrl(x, s0 + j, 1000)); } else nextItems.push(x.url);
  }
  serverPrefetch(near, 60, 'near');
  serverPrefetch(nextItems, 55, 'next-items');
  serverPrefetch(mid, 40, 'mid');
  serverPrefetch(thumbs, 30, 'thumbs');
}

function startOf(i) {
  if (state.start.has(i)) return state.start.get(i);
  const it = items[i];
  if (it.kind === 'scan') return Math.max(0, Math.min(Math.round(it.n * 0.08) + 3, it.n - state.per));
  if (it.kind === 'pdf' && it.n && (it.lane === 'ttrpg' || it.n > 60)) return Math.min(Math.round(it.n * 0.05), it.n - 1);
  return 0;
}

// ---------- feed ----------
async function showFeed() {
  const gen = ++state.gen;
  const i = state.order[state.pos];
  if (i == null) { $('#item-head').textContent = 'Nothing in this lane.'; $('#spread').replaceChildren(); return; }
  const it = items[i];
  paintHead(it);
  if (gen !== state.renderedPanelFor) { state.renderedPanelFor = gen; }
  if (state.panelItem !== it.id) { state.panelItem = it.id; paintPanel(i); trailTick(it); }
  const spread = $('#spread');
  let n = it.n;
  if (!n) {
    try { n = it.n = (await openDoc(it)).n; } catch (e) { spread.replaceChildren(h('div', { className: 'pg err', textContent: 'Could not open: ' + e.message, style: 'width:420px;height:300px' })); return; }
    if (gen !== state.gen) return;
  }
  let s = Math.max(0, Math.min(startOf(i), n - 1));
  state.start.set(i, s);
  const per = state.zoom ? 1 : state.per;
  // Lay out panels until the spread is full. Blank pages collapse to a thin strip
  // and do not count, so a spread always shows `per` pages of content.
  const boxH = spread.clientHeight - 12, boxW = spread.clientWidth - 40;
  const slots = []; let content = 0; let k = s;
  while (content < per && k < n && slots.length < per * 3) {
    const kk = k++;
    const el = h('div', { className: 'pg loading' });
    slots.push({ el, k: kk, p: renderPage(it, kk) });
    content++;
  }
  // Placeholders with a low-res preview where we have one.
  spread.replaceChildren(...slots.map((x) => x.el));
  for (const x of slots) {
    if (it.kind === 'scan') { x.el.append(h('img', { src: P(scanUrl(it, x.k, 400)), alt: '' })); x.el.classList.add('lowres'); }
    x.el.style.height = boxH + 'px'; x.el.style.width = Math.round(boxH * 0.68) + 'px';
  }
  fitSpread(boxW, boxH);
  state.shown = slots.length;
  paintPos(it, s, slots.length, n);
  paintScrub(i, s, slots.length);
  planAround(i, s);
  // Fill in as renders arrive; more blanks pull in more pages.
  const results = await Promise.all(slots.map((x) => x.p.catch((e) => [{ err: e.message, k: x.k }])));
  if (gen !== state.gen) return;
  let extra = results.filter((r) => r.length === 1 && r[0].blank).length;
  while (extra > 0 && k < n) {
    const kk = k++; const p = await renderPage(it, kk).catch((e) => [{ err: e.message, k: kk }]);
    if (gen !== state.gen) return;
    results.push(p); slots.push({ k: kk }); if (!(p.length === 1 && p[0].blank)) extra--;
  }
  const els = [];
  results.forEach((panels, j) => {
    for (const pnl of panels) {
      const el = h('div', { className: 'pg' });
      el.dataset.k = pnl.k ?? slots[j].k;
      if (pnl.blank) { el.className = 'pg blank'; el.textContent = 'blank'; el.dataset.aspect = '0.06'; }
      else if (pnl.err) { el.className = 'pg err'; el.textContent = pnl.err; el.dataset.aspect = '0.68'; }
      else if (pnl.html != null) {
        const vp = h('div', { className: 'vpage' }); vp.innerHTML = pnl.html; el.append(vp); el.dataset.aspect = String(640 / 900);
      } else { el.append(pnl.canvas); el.dataset.aspect = String(pnl.canvas.width / pnl.canvas.height); }
      el.append(h('span', { className: 'pno', textContent: String(Number(el.dataset.k) + 1) + (pnl.part ? pnl.part : '') }));
      el.onclick = () => { if (!state.zoom) { state.start.set(i, Number(el.dataset.k)); toggleZoom(true); } };
      els.push(el);
    }
  });
  spread.replaceChildren(...els);
  state.shown = slots.length;
  layoutPanels(els, boxW, boxH);
  paintPos(it, s, slots.length, n);
  paintScrub(i, s, slots.length);
}
function fitSpread() { /* placeholders keep their nominal size */ }
/** Size panels to a common height that fits the stage, preserving each aspect ratio. */
function layoutPanels(els, W, H) {
  const gap = 12;
  const aspects = els.map((e) => Number(e.dataset.aspect) || 0.68);
  const sum = aspects.reduce((a, b) => a + b, 0);
  const height = Math.min(H, (W - gap * (els.length - 1)) / sum);
  els.forEach((e, j) => {
    e.style.height = Math.floor(height) + 'px';
    e.style.width = Math.floor(height * aspects[j]) + 'px';
    const vp = e.querySelector('.vpage');
    if (vp) vp.style.transform = `scale(${height / 900})`;
  });
}

function paintHead(it) {
  const saved = state.saved.includes(it.id);
  $('#item-head').replaceChildren(
    h('h1', { title: it.t, textContent: it.t }),
    h('div', { className: 'meta' },
      h('span', { className: 'lane', textContent: LANES[it.lane] || it.lane }),
      it.a ? h('span', { textContent: it.a }) : null,
      it.y ? h('span', { textContent: String(it.y) }) : null,
      saved ? h('span', { className: 'star', textContent: '★ saved' }) : null),
    h('span', { className: 'pos', id: 'pos' }),
  );
}
function paintPos(it, s, c, n) {
  const el = $('#pos'); if (!el) return;
  el.textContent = `${state.pos + 1} / ${state.order.length}  ·  pp. ${s + 1}–${Math.min(n, s + c)} of ${n}${state.zoom ? '  ·  zoom' : ''}`;
}

// ---------- scrubber ----------
let scrubObs = null; let scrubFor = null;
function paintScrub(i, s, c) {
  const it = items[i]; const box = $('#scrub');
  const n = it.n || 0;
  if (scrubFor !== it.id) {
    scrubFor = it.id;
    scrubObs?.disconnect();
    scrubObs = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting || e.target.dataset.done) continue;
        e.target.dataset.done = '1'; fillThumb(it, e.target);
      }
    }, { root: box, rootMargin: '0px 400px' });
    const thumbs = [];
    for (let k = 0; k < Math.min(n, 1500); k++) {
      const t = h('div', { className: 'th', title: `p. ${k + 1}` }, h('span', { className: 'tn', textContent: String(k + 1) }));
      t.dataset.k = k;
      t.onclick = () => { state.start.set(i, k); showFeed(); };
      thumbs.push(t); scrubObs.observe(t);
    }
    box.replaceChildren(...thumbs);
  }
  const kp = new Set((summaries.get(it.id)?.key_points || []).map((x) => x.page - 1));
  for (const t of box.children) {
    const k = Number(t.dataset.k);
    t.classList.toggle('cur', k >= s && k < s + c);
    t.classList.toggle('kp', kp.has(k));
  }
  box.children[s]?.scrollIntoView({ block: 'nearest', inline: 'center' });
}
async function fillThumb(it, t) {
  const k = Number(t.dataset.k);
  if (it.kind === 'scan') { t.prepend(h('img', { loading: 'lazy', src: P(scanUrl(it, k, 120)), alt: '' })); return; }
  const d = await openDoc(it).catch(() => null);
  if (!d) return;
  if (it.kind === 'pdf') {
    const page = await d.pdf.getPage(k + 1);
    const vp0 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 74 * 2 / vp0.height });
    const c = h('canvas', { width: Math.floor(vp.width), height: Math.floor(vp.height) });
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    t.prepend(c);
  } else t.prepend(h('div', { className: 'tt', textContent: (d.texts?.[k] || '').slice(0, 160) }));
}

// ---------- panel: why, summary, outline, notes, related, trail ----------
const summaries = new Map(); // id -> summary object
let dwellTimer = null; let notes = {};
let serverStatus = {};

function paintPanel(i) {
  const it = items[i];
  const panel = $('#panel');
  const liked = tokens(it).filter((w) => (state.aff.tok[w] || 0) >= 1).slice(0, 2);
  const links = [['Original', it.page || it.url]];
  if (it.kind === 'pdf') links.push(['PDF', it.url]);
  if (it.id.startsWith('arxiv:')) links.push(['HTML', `https://arxiv.org/html/${it.id.slice(6)}`]);
  panel.replaceChildren(
    h('section', {},
      h('h3', { textContent: 'Why this' }),
      h('div', { className: 'why' }, h('b', { textContent: it.why || LANES[it.lane] || '' }), liked.length ? ` · you liked “${liked.join('”, “')}”` : ''),
      h('div', { className: 'links', style: 'margin-top:6px' }, ...links.map(([l, u]) => h('a', { href: u, target: '_blank', rel: 'noopener', textContent: l + ' ↗' })))),
    h('section', { id: 'sum-sec' }, h('h3', { textContent: 'Summary' }), h('div', { id: 'sum' })),
    h('section', { id: 'ol-sec' }, h('h3', { textContent: 'Outline' }), h('ol', { className: 'outline', id: 'outline' })),
    h('section', {}, h('h3', { textContent: 'Note' }), noteBox(it)),
    h('section', {}, h('h3', { textContent: 'Related' }), h('ol', { className: 'rel' }, ...related(i).map((j) => h('li', { onclick: () => jumpTo(j) }, items[j].t, h('span', { className: 'l', textContent: (LANES[items[j].lane] || '').split(' ')[0] }))))),
    h('section', {}, h('h3', { textContent: 'Today' }), h('ol', { className: 'trail', id: 'trail' })),
    h('label', { className: 'toggle' }, h('input', { type: 'checkbox', id: 'presum', checked: state.presum, onchange: (e) => { state.presum = e.target.checked; store.set('presum', state.presum); } }), 'Also summarize the next two items in the background'),
  );
  paintSummary(it);
  paintOutline(it);
  paintTrail();
  clearTimeout(dwellTimer);
  const cached = summaries.get(it.id);
  if (cached) return;
  fetch('/summary?id=' + encodeURIComponent(it.id)).then((r) => r.json()).then((s) => {
    if (s) { summaries.set(it.id, s); if (state.panelItem === it.id) { paintSummary(it); paintScrubMarks(); } }
    else if (state.panelItem === it.id) {
      paintSummary(it, 'countdown');
      dwellTimer = setTimeout(() => { if (state.panelItem === it.id) summarizeItem(i, true); }, 5000);
    }
  }).catch(() => {});
}
function paintScrubMarks() { const i = state.order[state.pos]; paintScrub(i, startOf(i), state.shown); }

function paintSummary(it, mode) {
  const box = $('#sum'); if (!box) return;
  const s = summaries.get(it.id);
  if (s && !s.error) {
    box.replaceChildren(h('div', { className: 'sum' },
      h('div', { className: 'verdict' }, h('span', { className: 'pill ' + s.verdict, textContent: s.verdict }), `${s.minutes} min`),
      h('div', { className: 'care', textContent: s.why_care }),
      h('div', { className: 'gist', textContent: s.gist }),
      h('ul', {}, ...(s.key_points || []).map((kp) => h('li', {}, kp.point, kp.page ? h('span', { className: 'pl', textContent: 'p. ' + kp.page, onclick: () => goPage(kp.page - 1) }) : null))),
      s.this_spread ? h('div', { className: 'spread', textContent: 'On the pages first shown: ' + s.this_spread }) : null,
      h('div', { className: 'ai-note', textContent: `AI-generated by ${s.model} · may be wrong · cached` })));
    return;
  }
  if (s?.error) {
    box.replaceChildren(h('div', { className: 'sum-state', textContent: s.error }));
    return;
  }
  if (mode === 'working') box.replaceChildren(h('div', { className: 'sum-state working' }, 'Summarizing…', h('span', { className: 'bar' })));
  else if (serverStatus.summariesEnabled === false) box.replaceChildren(h('div', { className: 'sum-state', textContent: 'Summaries are off. Start the server with ANTHROPIC_API_KEY set (and run npm install once).' }));
  else box.replaceChildren(h('div', { className: 'sum-state' }, 'Summary in 5 s if you stay (a: now)', h('span', { className: 'bar' })));
}

/** Extract text with [p. N] markers, around where the reader is, for the summarizer. */
async function extractText(it, s) {
  const d = await openDoc(it);
  const parts = [];
  if (it.kind === 'pdf') {
    const pages = new Set([...Array(Math.min(d.n, 10)).keys(), ...[0, 1, 2].map((j) => s + j).filter((k) => k < d.n)]);
    for (const k of [...pages].sort((a, b) => a - b)) {
      const tc = await (await d.pdf.getPage(k + 1)).getTextContent();
      parts.push(`[p. ${k + 1}] ` + tc.items.map((x) => x.str).join(' '));
      if (parts.join('').length > 70000) break;
    }
  } else if (it.kind === 'scan') {
    const r = await fetch(P(`https://archive.org/download/${it.ia}/${it.ia}_djvu.txt`));
    if (!r.ok) throw new Error('No OCR text for this scan');
    const t = await r.text();
    const at = Math.floor((s / Math.max(1, it.n)) * t.length);
    parts.push('[opening pages]\n' + t.slice(0, 15000), `\n[around p. ${s + 1}]\n` + t.slice(Math.max(15000, at - 8000), at + 25000));
  } else {
    d.texts.forEach((x, k) => parts.push(`[p. ${k + 1}] ${x}`));
  }
  return parts.join('\n').slice(0, 85000);
}
async function summarizeItem(i, visible) {
  const it = items[i];
  if (summaries.has(it.id) && !summaries.get(it.id).error) return;
  if (visible) paintSummary(it, 'working');
  const s = startOf(i);
  try {
    const text = await extractText(it, s);
    const r = await fetch('/summarize', { method: 'POST', body: JSON.stringify({ id: it.id, title: it.t, authors: it.a, year: it.y, lane: LANES[it.lane], text, spread: `${s + 1}-${s + state.per}` }) });
    const j = await r.json();
    summaries.set(it.id, j.error ? { error: j.code === 'no_key' || j.code === 'no_sdk' ? j.error : 'Summary failed: ' + j.error } : j);
  } catch (e) { summaries.set(it.id, { error: 'Summary failed: ' + e.message }); }
  if (state.panelItem === it.id) { paintSummary(it); paintScrubMarks(); }
  if (visible && state.presum && !summaries.get(it.id).error) {
    for (const ii of state.order.slice(state.pos + 1, state.pos + 3)) summarizeItem(ii, false);
  }
}

async function paintOutline(it) {
  const box = $('#outline'); if (!box) return;
  let ol = [];
  if (it.kind !== 'scan') {
    try { const d = await openDoc(it); ol = it.kind === 'pdf' ? await pdfOutline(d) : d.outline; } catch { /* none */ }
  }
  if (state.panelItem !== it.id) return;
  $('#ol-sec').hidden = !ol.length;
  box.replaceChildren(...ol.map((o) => h('li', { style: `--d:${o.depth}`, onclick: () => o.page != null && goPage(o.page) }, o.title, o.page != null ? h('span', { className: 'op', textContent: String(o.page + 1) }) : null)));
}

function noteBox(it) {
  const ta = h('textarea', { id: 'note', placeholder: 'Notes on this item (saved to your disk; export from Saved)', value: notes[it.id]?.text || '' });
  let t = null;
  ta.oninput = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const note = { text: ta.value, title: it.t, authors: it.a, year: it.y, link: it.page || it.url };
      notes[it.id] = note;
      fetch('/notes', { method: 'POST', body: JSON.stringify({ id: it.id, note }) }).catch(() => {});
    }, 500);
  };
  ta.onkeydown = (e) => { if (e.key === 'Escape') ta.blur(); };
  return ta;
}
function related(i) {
  const it = items[i]; const tk = new Set(tokens(it));
  return items.map((x, j) => [j, x.lane === it.lane ? 0.2 : 0, tokens(x).filter((w) => tk.has(w)).length])
    .filter(([j, , m]) => j !== i && m > 0).sort((a, b) => b[2] + b[1] - (a[2] + a[1])).slice(0, 6).map(([j]) => j);
}

// Session trail: what you looked at today and for how long.
let trailCur = null;
function trailTick(it) {
  const trail = store.get('trail:' + today, []);
  if (trailCur) { const e = trail.find((x) => x.id === trailCur.id); if (e) e.sec += Math.round((Date.now() - trailCur.at) / 1000); }
  if (!trail.find((x) => x.id === it.id)) trail.unshift({ id: it.id, sec: 0 });
  store.set('trail:' + today, trail.slice(0, 200));
  trailCur = { id: it.id, at: Date.now() };
}
function paintTrail() {
  const trail = store.get('trail:' + today, []);
  $('#trail')?.replaceChildren(...trail.slice(0, 12).map((e) => {
    const j = byId.get(e.id); if (j == null) return null;
    return h('li', { onclick: () => jumpTo(j) }, items[j].t, h('span', { className: 's', textContent: e.sec >= 60 ? Math.round(e.sec / 60) + 'm' : e.sec + 's' }));
  }));
}

// ---------- navigation ----------
function go(pos) { state.pos = Math.max(0, Math.min(pos, state.order.length - 1)); state.zoom = false; showFeed(); }
function jumpTo(j) { state.order.splice(state.pos + 1, 0, j); setView('feed'); go(state.pos + 1); }
function goPage(k) { const i = state.order[state.pos]; state.start.set(i, Math.max(0, k)); showFeed(); }
function turn(dir) {
  const i = state.order[state.pos];
  const step = Math.max(1, state.shown || state.per);
  state.turns.push({ at: Date.now(), dir });
  state.start.set(i, Math.max(0, Math.min((items[i].n || 1) - 1, startOf(i) + dir * step)));
  showFeed();
}
function randomSpot() {
  const i = state.order[state.pos]; const n = items[i].n || 1;
  const k = randomTarget.get(i) ?? Math.floor(Math.random() * Math.max(1, n - state.per));
  randomTarget.delete(i);
  state.start.set(i, k); showFeed();
}
function toggleZoom(on) { state.zoom = on ?? !state.zoom; showFeed(); }
function toggleSave() {
  const it = items[state.order[state.pos]];
  const k = state.saved.indexOf(it.id);
  if (k >= 0) state.saved.splice(k, 1); else { state.saved.unshift(it.id); learn(it, 1); buildOrder(); }
  store.set('saved', state.saved); $('#saved-n').textContent = state.saved.length; paintSaved(); paintHead(it);
  showFeed();
}
function lessLikeThis() { learn(items[state.order[state.pos]], -1); buildOrder(); go(state.pos + 1); }
function moreLikeThis() {
  const i = state.order[state.pos]; const it = items[i];
  learn(it, 0.7);
  const rel = related(i);
  state.order.splice(state.pos + 1, 0, ...rel.filter((j) => !state.order.slice(state.pos, state.pos + 10).includes(j)));
  go(state.pos + 1);
}

// Dwell: lingering is a signal of interest.
setInterval(() => {
  if (state.view !== 'feed' || document.hidden) return;
  const i = state.order[state.pos]; if (i == null) return;
  if (trailCur && trailCur.id === items[i].id && Date.now() - trailCur.at > 8000 && !trailCur.learned) { trailCur.learned = true; learn(items[i], 0.2); }
}, 2000);

// ---------- wall ----------
let wallShown = 0;
const wallObs = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) addTiles(48); }, { root: $('#wall'), rootMargin: '600px' });
function showWall() { wallShown = 0; $('#grid').replaceChildren(); addTiles(72); wallObs.observe($('#grid-more')); }
function typoFace(it) {
  return h('div', { className: 'typo', style: `--c:${LANE_COLORS[it.lane] || '#6b5a3a'}` },
    h('div', { className: 'tt', textContent: it.t }),
    h('div', { className: 'aa', textContent: [it.a, it.y].filter(Boolean).join(' · ') }),
    h('div', { className: 'xx', textContent: it.why || '' }));
}
function addTiles(n) {
  const from = state.pos + wallShown;
  for (const i of state.order.slice(from, from + n)) {
    const it = items[i];
    const face = h('div', { className: 'face' });
    if (it.kind === 'scan') face.append(h('img', { loading: 'lazy', alt: it.t, src: P(`https://archive.org/services/img/${it.ia}`) }));
    else face.append(typoFace(it));
    const tile = h('div', { className: 'tile', tabIndex: 0 }, face, h('div', { className: 'cap', textContent: it.t }), h('div', { className: 'sub', textContent: [LANES[it.lane], it.y].filter(Boolean).join(' · ') }));
    tile.onclick = () => { state.pos = state.order.indexOf(i); setView('feed'); showFeed(); };
    let timer = null; let f = 0;
    tile.onmouseenter = async () => {
      if (timer) return;
      const d = it.kind === 'scan' ? { n: it.n } : await openDoc(it).catch(() => null);
      if (!d) return; it.n ||= d.n;
      const ks = [0, 0.1, 0.25, 0.4, 0.6, 0.8].map((x) => Math.min(d.n - 1, Math.floor(d.n * x)));
      const step = async () => {
        const k = ks[f++ % ks.length];
        const panels = await renderPage(it, k).catch(() => null);
        const pnl = panels?.find((x) => x.canvas || x.html != null);
        if (!pnl || !timer) return;
        face.querySelectorAll('.rf').forEach((x) => x.remove());
        const el = pnl.canvas ? pnl.canvas.cloneNode() : h('div', { className: 'vpage' });
        if (pnl.canvas) el.getContext('2d').drawImage(pnl.canvas, 0, 0);
        else { el.innerHTML = pnl.html; el.style.transform = `scale(${face.clientWidth / 640})`; }
        el.classList.add('rf'); Object.assign(el.style, { position: 'absolute', inset: '0', width: pnl.canvas ? '100%' : '640px', height: pnl.canvas ? '100%' : '900px', objectFit: 'cover' });
        face.append(el);
      };
      timer = setInterval(step, 700); step();
    };
    tile.onmouseleave = () => { clearInterval(timer); timer = null; };
    $('#grid').append(tile);
  }
  wallShown += n;
}

// ---------- search ----------
const hay = items.map((it) => [it.t, it.a, LANES[it.lane], it.why, it.y].join(' ').toLowerCase());
let results = []; let sel = 0;
function runSearch() {
  const q = $('#s-input').value.toLowerCase().split(/\s+/).filter(Boolean);
  results = q.length ? hay.map((x, i) => [x, i]).filter(([x]) => q.every((w) => x.includes(w))).map(([, i]) => i) : [];
  results.sort((a, b) => (items[b].score || 0) - (items[a].score || 0)); sel = 0; paintResults();
}
function paintResults() {
  $('#s-results').replaceChildren(...results.slice(0, 40).map((i, r) => h('li', { className: r === sel ? 'sel' : '', onclick: () => pick(i) },
    h('span', { className: 'st', textContent: items[i].t }), h('span', { className: 'sm', textContent: [LANES[items[i].lane], items[i].y].filter(Boolean).join(' · ') }))));
}
function pick(i, all = false) {
  $('#search').hidden = true;
  if (all && results.length) { state.order = results.slice(); state.pos = 0; setView('feed'); showFeed(); } else jumpTo(i);
}
function openSearch() { $('#search').hidden = false; $('#s-input').select(); $('#s-input').focus(); }

// ---------- chrome ----------
function paintLanes() {
  const counts = corpus.counts || {};
  const all = [['all', 'All', items.length], ...Object.entries(LANES).map(([k, v]) => [k, v, counts[k] || 0]).filter(([, , c]) => c)];
  $('#lanes').replaceChildren(...all.map(([k, label, c], d) => h('button', {
    className: state.lane === k ? 'on' : '', title: d < 10 ? `Key ${d}` : '',
    onclick: () => setLane(k),
  }, label, h('span', { className: 'n', textContent: String(c) }))));
}
function setLane(k) { state.lane = k; store.set('lane', k); buildOrder(false); paintLanes(); refresh(); }
function paintSaved() {
  $('#saved-list').replaceChildren(...state.saved.map((id) => { const i = byId.get(id); return i == null ? null : h('li', { textContent: items[i].t, onclick: () => jumpTo(i) }); }));
}
function setView(v) {
  state.view = v;
  $('#main').classList.toggle('wall', v === 'wall');
  $('#stage').hidden = v !== 'feed'; $('#panel').hidden = v !== 'feed'; $('#wall').hidden = v !== 'wall';
  $('#v-feed').classList.toggle('on', v === 'feed'); $('#v-wall').classList.toggle('on', v === 'wall');
}
function refresh() { if (state.view === 'feed') showFeed(); else showWall(); }

$('#v-feed').onclick = () => { setView('feed'); showFeed(); };
$('#v-wall').onclick = () => { setView('wall'); showWall(); };
$('#search-btn').onclick = openSearch;
$('#keys-btn').onclick = () => { $('#keys').hidden = !$('#keys').hidden; };
$('#keys').onclick = () => { $('#keys').hidden = true; };
function applyChrome() { $('#main').classList.toggle('nopanel', !state.panel); $('#scrub').classList.toggle('pinned', state.pin); }
$('#saved-btn').onclick = () => { $('#saved').hidden = !$('#saved').hidden; };
$('#s-input').oninput = runSearch;
$('#s-input').onkeydown = (e) => {
  if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, Math.min(results.length, 40) - 1); paintResults(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paintResults(); e.preventDefault(); }
  else if (e.key === 'Enter' && results.length) pick(results[sel], e.shiftKey);
  else if (e.key === 'Escape') $('#search').hidden = true;
};
$('#search').onclick = (e) => { if (e.target.id === 'search') $('#search').hidden = true; };

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === '?') { $('#keys').hidden = !$('#keys').hidden; return; }
  if (!$('#keys').hidden && k === 'Escape') { $('#keys').hidden = true; return; }
  if (k === '/') { e.preventDefault(); openSearch(); return; }
  if (k === 'f') { setView('feed'); showFeed(); return; }
  if (k === 'w') { setView('wall'); showWall(); return; }
  if (k === 'b') { $('#saved').hidden = !$('#saved').hidden; return; }
  if (/^[0-9]$/.test(k)) { const lanes = ['all', ...Object.keys(LANES)]; if (lanes[Number(k)]) setLane(lanes[Number(k)]); return; }
  if (state.view !== 'feed') return;
  const i = state.order[state.pos];
  const map = {
    j: () => go(state.pos + 1), ArrowDown: () => go(state.pos + 1), ' ': () => go(state.pos + 1),
    k: () => go(state.pos - 1), ArrowUp: () => go(state.pos - 1),
    l: () => turn(1), ArrowRight: () => turn(1), h: () => turn(-1), ArrowLeft: () => turn(-1),
    z: () => toggleZoom(), Enter: () => toggleZoom(), Escape: () => toggleZoom(false),
    r: randomSpot, t: () => goPage(0), s: toggleSave, x: lessLikeThis, m: moreLikeThis,
    a: () => summarizeItem(i, true), n: () => { if (!state.panel) { state.panel = true; store.set('panel', true); applyChrome(); showFeed(); } setTimeout(() => $('#note')?.focus(), 50); },
    i: () => { state.panel = !state.panel; store.set('panel', state.panel); applyChrome(); showFeed(); },
    p: () => { state.pin = !state.pin; store.set('pin', state.pin); applyChrome(); showFeed(); },
    c: () => { state.cols = !state.cols; store.set('cols', state.cols); showFeed(); },
    C: () => { state.crop = !state.crop; store.set('crop', state.crop); showFeed(); },
    '+': () => { state.per = Math.min(6, state.per + 1); store.set('per', state.per); showFeed(); },
    '=': () => { state.per = Math.min(6, state.per + 1); store.set('per', state.per); showFeed(); },
    '-': () => { state.per = Math.max(1, state.per - 1); store.set('per', state.per); showFeed(); },
    g: () => { const v = Number(window.prompt(`Go to page (1-${items[i].n})`)); if (v >= 1) goPage(v - 1); },
    o: () => window.open(items[i].page || items[i].url, '_blank', 'noopener'),
  };
  if (map[k]) { e.preventDefault(); map[k](); }
});
let rz = null;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => state.view === 'feed' && showFeed(), 150); });

setInterval(async () => {
  try {
    const s = serverStatus = await (await fetch('/status')).json();
    const hit = s.hits + s.misses ? Math.round((100 * s.hits) / (s.hits + s.misses)) : 0;
    $('#net').textContent = `${hit}% cached · q${s.queue + s.active}${s.summariesEnabled ? '' : ' · AI off'}`;
    $('#net').title = `cache hits ${hit}% · ${(s.bytes / 1e6).toFixed(0)} MB fetched · queue ${s.queue + s.active} · ${s.summariesEnabled ? s.summaries + ' summaries (' + s.model + ')' : 'summaries off: set ANTHROPIC_API_KEY'}`;
  } catch { $('#net').textContent = 'server offline'; }
}, 2000);

try { notes = await (await fetch('/notes')).json(); } catch { notes = {}; }
try { serverStatus = await (await fetch('/status')).json(); } catch { /* offline */ }
$('#saved-n').textContent = state.saved.length;
applyChrome(); paintSaved(); paintLanes(); buildOrder(false); setView('feed'); showFeed();
