// Stacks Browser — feed, wall and reader over a corpus of openable texts.
// Everything remote goes through the local server's /proxy (disk cache) and
// /prefetch (priority queue). The UI's job is to ask for the right things early.

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
const P = (u) => '/proxy?u=' + encodeURIComponent(u);
const $ = (s) => document.querySelector(s);
const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k != null) el.append(k);
  return el;
};
const clean = (s) => String(s || '').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('stacks:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('stacks:' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

// ---------- corpus and ordering ----------
const { items } = await (await fetch('/corpus.json')).json();
for (const it of items) { it.t = clean(it.t); it.a = clean(it.a); }
const byId = new Map(items.map((it, i) => [it.id, i]));

const SOURCES = [['all', 'All'], ['scan', 'Old scans'], ['arXiv', 'arXiv'], ['text', 'Gutenberg'], ['book', 'Textbooks']];
const srcKey = (it) => (it.kind === 'scan' ? 'scan' : it.src === 'arXiv' ? 'arXiv' : it.kind === 'text' ? 'text' : 'book');
const shelfOf = (it) => String(it.q || 'other').split(/\. | - /)[0];

const state = {
  view: 'feed', source: store.get('source', 'all'), shelf: null,
  aff: store.get('aff', {}), saved: store.get('saved', []),
  order: [], pos: 0, spread: new Map(), // item index -> first page of current spread
  per: store.get('per', 3), // pages per spread
};

// Deterministic per-item noise so the mix is stable across reloads.
const seed = store.get('seed', Math.floor(Math.random() * 1e9));
store.set('seed', seed);
const noise = (i) => { let x = (i + 1) * 2654435761 ^ seed; x = Math.imul(x ^ (x >>> 15), 2246822507); x ^= x >>> 13; return ((x >>> 0) % 10000) / 10000; };

function score(i) {
  const it = items[i];
  const a = state.aff[shelfOf(it)] || 0;
  const pop = it.kind === 'scan' ? Math.min(1, Math.log10(1 + (it.pop || 0)) / 5) * 0.25 : 0.12;
  return noise(i) + 0.35 * a + pop;
}

function buildOrder(keepCurrent = true) {
  const current = state.order[state.pos];
  let pool = items.map((_, i) => i).filter((i) => {
    const it = items[i];
    if (state.source !== 'all' && srcKey(it) !== state.source) return false;
    if (state.shelf && shelfOf(it) !== state.shelf) return false;
    return true;
  });
  pool.sort((a, b) => score(b) - score(a));
  if (state.source === 'all' && !state.shelf) pool = interleave(pool);
  if (keepCurrent && current != null) {
    // Keep what is already on screen and prefetched; re-rank only the tail.
    const head = state.order.slice(0, state.pos + 4);
    const headSet = new Set(head);
    state.order = head.concat(pool.filter((i) => !headSet.has(i)));
  } else { state.order = pool; state.pos = 0; }
}

// Alternate sources so the feed feels like a mixed table, not one long run of arXiv.
function interleave(pool) {
  const buckets = { scan: [], arXiv: [], text: [], book: [] };
  for (const i of pool) buckets[srcKey(items[i])].push(i);
  const pattern = ['scan', 'arXiv', 'scan', 'text', 'scan', 'arXiv', 'text', 'book'];
  const out = []; let k = 0;
  while (out.length < pool.length) {
    const b = buckets[pattern[k++ % pattern.length]];
    if (b.length) out.push(b.shift());
    else if (!Object.values(buckets).some((x) => x.length)) break;
  }
  return out;
}

// ---------- page sources ----------
let pdfjsP = null;
const pdfjs = () => (pdfjsP ||= import(P(PDFJS + 'pdf.min.mjs')).then((m) => {
  m.GlobalWorkerOptions.workerSrc = P(PDFJS + 'pdf.worker.min.mjs');
  return m;
}));

const docs = new Map(); // id -> Promise<{n, kind, ...}>
function lru(id, make) {
  if (docs.has(id)) { const v = docs.get(id); docs.delete(id); docs.set(id, v); return v; }
  const v = make().catch((e) => { docs.delete(id); throw e; });
  docs.set(id, v);
  while (docs.size > 14) {
    const [k, old] = docs.entries().next().value;
    docs.delete(k);
    old.then((d) => d.pdf?.destroy?.()).catch(() => {});
  }
  return v;
}

const scanUrl = (it, k, w = 900) => `https://archive.org/download/${it.ia}/page/n${k}_w${w}.jpg`;

function openDoc(it) {
  if (it.kind === 'scan') return Promise.resolve({ n: it.n });
  if (it.kind === 'pdf') return lru(it.id, async () => {
    const [lib, buf] = await Promise.all([pdfjs(), fetch(P(it.url)).then((r) => { if (!r.ok) throw new Error('PDF ' + r.status); return r.arrayBuffer(); })]);
    const pdf = await lib.getDocument({ data: buf, isEvalSupported: false }).promise;
    return { n: pdf.numPages, pdf };
  });
  return lru(it.id, async () => {
    const r = await fetch(P(it.url));
    if (!r.ok) throw new Error('text ' + r.status);
    let txt = (await r.text()).replace(/\r\n/g, '\n');
    const s = txt.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i);
    if (s >= 0) txt = txt.slice(txt.indexOf('\n', s) + 1);
    const e = txt.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i);
    if (e >= 0) txt = txt.slice(0, e);
    const pages = []; let cur = '';
    for (const para of txt.split(/\n\s*\n/)) {
      const p = para.replace(/\s*\n\s*/g, ' ').trim();
      if (!p) continue;
      if (cur.length + p.length > 1500 && cur) { pages.push(cur); cur = ''; }
      cur += (cur ? '\n\n' : '') + p;
      while (cur.length > 2200) { pages.push(cur.slice(0, 1500)); cur = cur.slice(1500); }
    }
    if (cur) pages.push(cur);
    return { n: pages.length, pages };
  });
}

function startPage(it, n) {
  if (it.kind === 'scan') return Math.max(0, Math.min(Math.round(n * 0.1) + 4, n - 4));
  if (it.src === 'arXiv') return 0;
  if (it.kind === 'pdf') return Math.min(Math.round(n * 0.08), Math.max(0, n - 4));
  return Math.min(1, Math.max(0, n - 1));
}

/** Render page k of item into a sized .page element. Returns the element immediately. */
function pageEl(it, k, height, { lazyText = false } = {}) {
  const el = h('div', { className: 'page loading' });
  el.style.height = height + 'px';
  el.style.width = Math.round(height * 0.7) + 'px';
  el.append(h('span', { className: 'pno', textContent: String(k + 1) }));
  const done = () => el.classList.remove('loading');
  const fail = (msg) => { el.className = 'page err'; el.textContent = msg; };
  if (it.kind === 'scan') {
    const img = h('img', { alt: `${it.t}, page ${k + 1}`, decoding: 'async' });
    img.onload = done; img.onerror = () => fail('Page image unavailable');
    img.src = P(scanUrl(it, k, height > 500 ? 900 : 400));
    el.prepend(img);
  } else {
    openDoc(it).then(async (d) => {
      if (k >= d.n) return fail('—');
      if (it.kind === 'pdf') {
        const page = await d.pdf.getPage(k + 1);
        const vp0 = page.getViewport({ scale: 1 });
        el.style.width = Math.round(height * vp0.width / vp0.height) + 'px';
        const scale = (height * (window.devicePixelRatio || 1)) / vp0.height;
        const vp = page.getViewport({ scale });
        const c = h('canvas', { width: Math.floor(vp.width), height: Math.floor(vp.height) });
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        el.prepend(c);
      } else {
        el.prepend(h('div', { className: 'textpage', textContent: d.pages[k] }));
      }
      done();
    }).catch((e) => fail(lazyText ? '' : `Could not open: ${e.message}`));
  }
  return el;
}

// ---------- prefetching ----------
const ready = new Map(); // id -> 'loading' | 'ready'
function prefetch(urls, pri, group) {
  if (!urls.length) return;
  fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls, pri, group }) }).catch(() => {});
}
function warmImage(u) { const i = new Image(); i.decoding = 'async'; i.src = P(u); return i.decode().catch(() => {}); }

/** Make the first spread of an item instant: images into the browser cache, documents parsed. */
function warm(i, depth) {
  const it = items[i];
  if (ready.get(it.id) === 'ready') return;
  ready.set(it.id, 'loading');
  let p;
  if (it.kind === 'scan') {
    const s = startPage(it, it.n);
    p = Promise.all([0, 1, 2, 3].map((d) => warmImage(scanUrl(it, s + d))));
  } else p = openDoc(it);
  p.then(() => { ready.set(it.id, 'ready'); paintUpNext(); }).catch(() => ready.set(it.id, 'error'));
}

function lookAhead() {
  // The browser opens only ~6 connections to localhost, so it warms just the
  // next two items itself; the server's queue (12 parallel upstream fetches,
  // nearest item first) works further ahead into its disk cache.
  const ahead = state.order.slice(state.pos + 1, state.pos + 31);
  ahead.slice(0, 2).forEach((i, d) => warm(i, d + 1));
  const urls = [];
  for (const i of ahead) {
    const it = items[i];
    if (it.kind === 'scan') {
      const s = state.spread.get(i) ?? startPage(it, it.n);
      for (let d = 0; d < 4; d++) urls.push(scanUrl(it, s + d, 900));
    } else urls.push(it.url);
  }
  prefetch(urls, 60, 'ahead');
  // Once the server has them, items 3-6 are cheap to warm in the browser too.
  setTimeout(() => ahead.slice(2, 6).forEach((i, d) => warm(i, d + 3)), 2500);
}

// Dwell: if the reader lingers on an item, they may open it, so fetch more of it.
let dwellTimer = null;
function onDwell(i) {
  clearTimeout(dwellTimer);
  dwellTimer = setTimeout(() => {
    const it = items[i];
    if (it.kind === 'scan') {
      const s = state.spread.get(i) ?? startPage(it, it.n);
      const urls = [];
      for (let k = Math.max(0, s - 4); k < Math.min(it.n, s + 24); k++) urls.push(scanUrl(it, k));
      prefetch(urls, 90, 'dwell');
    }
    state.aff[shelfOf(it)] = (state.aff[shelfOf(it)] || 0) + 0.15;
    store.set('aff', state.aff);
  }, 1500);
}

// ---------- feed ----------
function spreadCount() { return state.per; }
/** Page height that fits `per` pages side by side in the spread area. */
function spreadHeight() {
  const box = $('#spread');
  const byH = box.clientHeight - 16;
  const byW = (box.clientWidth - 48 - 14 * (state.per - 1)) / state.per / 0.7;
  return Math.max(220, Math.floor(Math.min(byH, byW)));
}

async function showFeed() {
  const i = state.order[state.pos];
  if (i == null) { $('#item-head').textContent = 'Nothing matches this filter.'; $('#spread').replaceChildren(); return; }
  const it = items[i];
  const saved = state.saved.includes(it.id);
  $('#item-head').replaceChildren(...[
    h('h1', { title: it.t, textContent: it.t }),
    h('div', { className: 'meta' },
      h('span', { className: 'src', textContent: it.src }),
      it.a ? h('span', { textContent: it.a }) : null,
      it.y ? h('span', { textContent: String(it.y) }) : null,
      saved ? h('span', { className: 'saved-mark', textContent: '★ saved' }) : null),
    h('span', { className: 'pos', textContent: `${state.pos + 1} / ${state.order.length.toLocaleString()}` }),
  ].filter(Boolean));
  const hgt = spreadHeight();
  const count = spreadCount();
  const spread = $('#spread');
  spread.replaceChildren();
  let n = it.n;
  if (!n) { try { n = (await openDoc(it)).n; } catch (e) { spread.append(h('div', { className: 'page err', textContent: `Could not open: ${e.message}`, style: `height:${hgt}px;width:${Math.round(hgt * 0.7)}px` })); return; } }
  if (state.order[state.pos] !== i) return; // moved on while loading
  if (!state.spread.has(i)) state.spread.set(i, startPage(it, n));
  const s = Math.max(0, Math.min(state.spread.get(i), Math.max(0, n - count)));
  state.spread.set(i, s);
  for (let k = s; k < Math.min(n, s + count); k++) {
    const pe = pageEl(it, k, hgt);
    pe.onclick = () => openReader(i, k);
    spread.append(pe);
  }
  // Warm the next spread of this item, too.
  if (it.kind === 'scan') for (let k = s + count; k < Math.min(n, s + 2 * count); k++) warmImage(scanUrl(it, k));
  $('#item-head').querySelector('.pos').textContent += `  ·  pp. ${s + 1}–${Math.min(n, s + count)} of ${n}`;
  paintUpNext();
  lookAhead();
  onDwell(i);
}

function paintUpNext() {
  const box = $('#upnext');
  box.replaceChildren(...state.order.slice(state.pos + 1, state.pos + 7).map((i, d) => {
    const it = items[i];
    const st = ready.get(it.id);
    return h('div', { className: 'next', title: it.t, onclick: () => go(state.pos + 1 + d) },
      h('span', { className: 'dot ' + (st || '') }), h('span', { className: 't', textContent: it.t }));
  }));
}

function go(pos) {
  if (!$('#info').hidden) setTimeout(() => toggleInfo(true));
  state.pos = Math.max(0, Math.min(pos, state.order.length - 1));
  if (state.view === 'feed') showFeed();
}
function turn(dir) {
  const i = state.order[state.pos];
  const count = spreadCount();
  state.spread.set(i, Math.max(0, (state.spread.get(i) || 0) + dir * count));
  showFeed();
}
async function randomSpot() {
  const i = state.order[state.pos];
  const it = items[i];
  const n = it.n || (await openDoc(it)).n;
  state.spread.set(i, Math.floor(Math.random() * Math.max(1, n - spreadCount())));
  showFeed();
}

function toggleSave() {
  const id = items[state.order[state.pos]].id;
  const k = state.saved.indexOf(id);
  if (k >= 0) state.saved.splice(k, 1);
  else {
    state.saved.unshift(id);
    const sh = shelfOf(items[state.order[state.pos]]);
    state.aff[sh] = (state.aff[sh] || 0) + 1; store.set('aff', state.aff);
    buildOrder();
  }
  store.set('saved', state.saved);
  $('#saved-n').textContent = state.saved.length;
  paintSaved(); showFeed();
}
function lessLikeThis() {
  const sh = shelfOf(items[state.order[state.pos]]);
  state.aff[sh] = (state.aff[sh] || 0) - 1; store.set('aff', state.aff);
  buildOrder(); go(state.pos + 1);
}

// ---------- wall ----------
let wallShown = 0;
const wallObs = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) addTiles(48); }, { root: $('#wall'), rootMargin: '600px' });

function showWall() {
  wallShown = 0;
  $('#grid').replaceChildren();
  addTiles(72);
  wallObs.observe($('#grid-more'));
  $('#grid').firstElementChild?.focus();
}

function typoFace(it) {
  const cls = it.src === 'arXiv' ? 'arxiv' : it.kind === 'text' ? 'pg' : 'book';
  return h('div', { className: 'typo ' + cls },
    h('div', { className: 'tt', textContent: it.t }),
    h('div', { className: 'aa', textContent: [it.a, it.y].filter(Boolean).join(' · ') }),
    it.ab ? h('div', { className: 'xx', textContent: it.ab }) : null);
}

function addTiles(n) {
  const grid = $('#grid');
  const from = state.pos + wallShown;
  for (const i of state.order.slice(from, from + n)) {
    const it = items[i];
    const face = h('div', { className: 'face' });
    if (it.kind === 'scan') {
      // Internet Archive's own thumbnail is usually the title page, not a blank leaf.
      face.append(h('img', { loading: 'lazy', decoding: 'async', alt: it.t, src: P(`https://archive.org/services/img/${it.ia}`) }));
    } else face.append(typoFace(it));
    const tile = h('div', { className: 'tile', tabIndex: 0 }, face,
      h('div', { className: 'cap', textContent: it.t }),
      h('div', { className: 'sub', textContent: [it.src, it.y].filter(Boolean).join(' · ') }));
    tile.onclick = () => { state.pos = state.order.indexOf(i); setView('feed'); };
    tile.onkeydown = (e) => { if (e.key === 'Enter') { e.stopPropagation(); openReader(i, null); } };
    let timer = null; let f = 0;
    const riffle = async () => {
      // Thumb through the book: a few pages spread across it, preloaded on first hover.
      const d = it.kind === 'scan' ? { n: it.n } : await openDoc(it).catch(() => null);
      if (!d) return;
      const ks = [0.04, 0.12, 0.25, 0.4, 0.55, 0.7].map((x) => Math.min(d.n - 1, Math.floor(d.n * x)));
      const bar = h('div', { className: 'riffle-bar' }); face.append(bar);
      const step = () => {
        const k = ks[f++ % ks.length];
        bar.style.width = ((f % ks.length) / ks.length) * 100 + '%';
        const pe = pageEl(it, k, face.clientHeight, { lazyText: true });
        pe.style.position = 'absolute'; pe.style.inset = '0'; pe.style.width = '100%'; pe.style.height = '100%'; pe.style.boxShadow = 'none';
        face.querySelectorAll('.page').forEach((x) => x.remove());
        face.insertBefore(pe, bar);
      };
      step(); timer = setInterval(step, 650);
    };
    const stop = () => { clearInterval(timer); timer = null; };
    tile.onmouseenter = () => { if (!timer) riffle(); };
    tile.onmouseleave = stop; tile.onblur = stop;
    tile.onfocus = () => { if (!timer) riffle(); };
    grid.append(tile);
  }
  wallShown += n;
}

// ---------- reader ----------
let readerObs = null;
async function openReader(i, k) {
  const it = items[i];
  $('#reader').hidden = false;
  $('#r-title').textContent = [it.t, it.a, it.y].filter(Boolean).join(' — ');
  $('#r-orig').href = original(it);
  const box = $('#r-pages'); box.replaceChildren();
  let n = it.n;
  try { n ||= (await openDoc(it)).n; } catch (e) { box.append(h('p', { textContent: 'Could not open: ' + e.message })); return; }
  const start = k ?? state.spread.get(i) ?? startPage(it, n);
  const hgt = Math.min(1100, Math.round(window.innerHeight * 0.92));
  readerObs?.disconnect();
  readerObs = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting || e.target.dataset.done) continue;
      e.target.dataset.done = '1';
      const kk = Number(e.target.dataset.k);
      e.target.replaceWith(Object.assign(pageEl(it, kk, hgt), { id: 'rp' + kk }));
      if (it.kind === 'scan') prefetch(Array.from({ length: 8 }, (_, d) => kk + 1 + d).filter((x) => x < n).map((x) => scanUrl(it, x)), 95, 'reader');
    }
  }, { root: box, rootMargin: '150% 0px' });
  for (let kk = 0; kk < n; kk++) {
    const slot = h('div', { className: 'page loading' });
    slot.dataset.k = kk; slot.id = 'rp' + kk;
    slot.style.height = hgt + 'px'; slot.style.width = Math.round(hgt * 0.7) + 'px';
    box.append(slot); readerObs.observe(slot);
  }
  requestAnimationFrame(() => document.getElementById('rp' + start)?.scrollIntoView({ block: 'start' }));
}
function closeReader() { $('#reader').hidden = true; readerObs?.disconnect(); $('#r-pages').replaceChildren(); }
function original(it) {
  if (it.kind === 'scan') return `https://archive.org/details/${it.ia}`;
  if (it.src === 'arXiv') return `https://arxiv.org/abs/${it.id.slice(6)}`;
  if (it.kind === 'text') return `https://www.gutenberg.org/ebooks/${it.id.slice(3)}`;
  return it.url;
}

// ---------- quick look ----------
function toggleInfo(force) {
  const box = $('#info');
  box.hidden = force === undefined ? !box.hidden : !force;
  if (box.hidden) return;
  const i = state.order[state.pos]; const it = items[i];
  const links = [['Original', original(it)]];
  if (it.kind === 'pdf') links.push(['PDF', it.url]);
  if (it.html) links.push(['HTML', it.html]);
  box.replaceChildren(...[
    h('h2', { textContent: it.t }),
    h('p', { className: 'im', textContent: [it.a, it.y, it.src, it.n ? it.n + ' pages' : null].filter(Boolean).join(' · ') }),
    it.ab ? h('p', { className: 'ab', textContent: it.ab + '…' }) : null,
    (it.s || []).length ? h('p', { className: 'subj' }, ...(it.s || []).map((x) => h('span', { textContent: x }))) : null,
    h('p', { className: 'il' }, ...links.map(([l, u]) => h('a', { href: u, target: '_blank', rel: 'noopener', textContent: l + ' ↗' }))),
    h('button', { textContent: 'More like this (m)', onclick: moreLikeThis }),
  ].filter(Boolean));
}
function moreLikeThis() {
  const it = items[state.order[state.pos]];
  state.shelf = shelfOf(it); state.source = 'all';
  const keep = state.order[state.pos];
  buildOrder(false);
  state.order = [keep, ...state.order.filter((x) => x !== keep)];
  state.pos = 0; paintChips(); toggleInfo(false); showFeed();
}
async function gotoPage() {
  const i = state.order[state.pos]; const it = items[i];
  const n = it.n || (await openDoc(it)).n;
  const v = window.prompt(`Go to page (1-${n})`);
  const k = Number(v);
  if (k >= 1 && k <= n) { state.spread.set(i, k - 1); showFeed(); }
}
function setPer(d) {
  state.per = Math.max(1, Math.min(6, state.per + d)); store.set('per', state.per); showFeed();
}

// ---------- search ----------
const hay = items.map((it) => [it.t, it.a, (it.s || []).join(' '), it.src, it.y].join(' ').toLowerCase());
let results = []; let sel = 0;
function runSearch() {
  const q = $('#s-input').value.toLowerCase().split(/\s+/).filter(Boolean);
  results = q.length ? hay.map((x, i) => [x, i]).filter(([x]) => q.every((w) => x.includes(w))).map(([, i]) => i) : [];
  results.sort((a, b) => (items[b].pop || 0) - (items[a].pop || 0));
  sel = 0; paintResults();
}
function paintResults() {
  $('#s-results').replaceChildren(...results.slice(0, 40).map((i, r) => {
    const it = items[i];
    return h('li', { className: r === sel ? 'sel' : '', onclick: () => pick(i) },
      h('span', { className: 'st', textContent: it.t }),
      h('span', { className: 'sm', textContent: [it.src, it.a.split(',')[0], it.y].filter(Boolean).join(' · ') }));
  }));
}
function pick(i, all = false) {
  $('#search').hidden = true;
  if (all && results.length) { state.order = results.slice(); state.pos = 0; }
  else { state.order.splice(state.pos + 1, 0, i); state.pos += 1; }
  setView('feed');
}

// ---------- chrome ----------
function paintChips() {
  $('#sources').replaceChildren(...SOURCES.map(([k, label]) => h('button', {
    className: state.source === k ? 'on' : '', textContent: label,
    onclick: () => { state.source = k; state.shelf = null; store.set('source', k); buildOrder(false); paintChips(); refresh(); },
  })));
  const counts = {};
  for (const it of items) if (state.source === 'all' || srcKey(it) === state.source) counts[shelfOf(it)] = (counts[shelfOf(it)] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => (state.aff[b[0]] || 0) - (state.aff[a[0]] || 0) || b[1] - a[1]).slice(0, 18);
  $('#shelves').replaceChildren(...top.map(([k]) => h('button', {
    className: state.shelf === k ? 'on' : '', textContent: k,
    onclick: () => { state.shelf = state.shelf === k ? null : k; buildOrder(false); paintChips(); refresh(); },
  })));
}
function paintSaved() {
  $('#saved-list').replaceChildren(...state.saved.map((id) => {
    const i = byId.get(id); if (i == null) return null;
    return h('li', { textContent: items[i].t, onclick: () => { state.order.splice(state.pos + 1, 0, i); go(state.pos + 1); } });
  }));
}
function setView(v) {
  state.view = v;
  $('#feed').hidden = v !== 'feed'; $('#wall').hidden = v !== 'wall';
  $('#v-feed').classList.toggle('on', v === 'feed'); $('#v-wall').classList.toggle('on', v === 'wall');
  refresh();
}
function refresh() { if (state.view === 'feed') showFeed(); else showWall(); }

$('#v-feed').onclick = () => setView('feed');
$('#v-wall').onclick = () => setView('wall');
$('#search-btn').onclick = () => openSearch();
$('#saved-btn').onclick = () => { $('#saved').hidden = !$('#saved').hidden; };
$('#r-close').onclick = closeReader;
$('#s-input').oninput = runSearch;
$('#s-input').onkeydown = (e) => {
  if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, Math.min(results.length, 40) - 1); paintResults(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paintResults(); e.preventDefault(); }
  else if (e.key === 'Enter' && results.length) pick(results[sel], e.shiftKey);
  else if (e.key === 'Escape') $('#search').hidden = true;
};
$('#search').onclick = (e) => { if (e.target.id === 'search') $('#search').hidden = true; };
function openSearch() { $('#search').hidden = false; $('#s-input').select(); $('#s-input').focus(); }

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (!$('#reader').hidden) { if (e.key === 'Escape') closeReader(); return; }
  const k = e.key;
  if (k === '/') { e.preventDefault(); openSearch(); return; }
  if (k === 'f') return setView('feed');
  if (k === 'w') return setView('wall');
  if (k === 'b') { $('#saved').hidden = !$('#saved').hidden; return; }
  if (state.view === 'wall') {
    if (k.startsWith('Arrow')) {
      const tiles = [...$('#grid').children]; const cur = tiles.indexOf(document.activeElement);
      const cols = Math.round($('#grid').clientWidth / (tiles[0]?.offsetWidth + 14 || 160));
      const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[k];
      tiles[Math.max(0, Math.min(tiles.length - 1, cur + d))]?.focus(); e.preventDefault();
    }
    return;
  }
  const map = {
    j: () => go(state.pos + 1), ArrowDown: () => go(state.pos + 1),
    k: () => go(state.pos - 1), ArrowUp: () => go(state.pos - 1),
    l: () => turn(1), ArrowRight: () => turn(1), h: () => turn(-1), ArrowLeft: () => turn(-1),
    r: randomSpot, t: () => { state.spread.set(state.order[state.pos], 0); showFeed(); },
    Enter: () => openReader(state.order[state.pos], null), ' ': () => go(state.pos + 1),
    s: toggleSave, x: lessLikeThis,
    o: () => window.open(original(items[state.order[state.pos]]), '_blank', 'noopener'),
    i: () => toggleInfo(), m: moreLikeThis, g: gotoPage,
    '+': () => setPer(1), '=': () => setPer(1), '-': () => setPer(-1),
  };
  if (map[k]) { e.preventDefault(); map[k](); }
});
window.addEventListener('resize', () => { if (state.view === 'feed') showFeed(); });

// Network status: how much is coming from the local cache.
setInterval(async () => {
  try {
    const s = await (await fetch('/status')).json();
    const hit = s.hits + s.misses ? Math.round((100 * s.hits) / (s.hits + s.misses)) : 0;
    $('#net').textContent = `cache hits ${hit}% · fetched ${s.fetched} (${(s.bytes / 1e6).toFixed(0)} MB) · queue ${s.queue + s.active}`;
  } catch { $('#net').textContent = 'server offline'; }
}, 2000);

$('#saved-n').textContent = state.saved.length;
paintSaved();
buildOrder(false);
paintChips();
setView('feed');
