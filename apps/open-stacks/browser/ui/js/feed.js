// The feed: one item at a time, a few real pages of it filling the stage.
import { $, h, P, PI, on, emit, emitQuiet, fmtDate, lru } from './util.js';
import { items, LANES } from './corpus.js';
import { state, current } from './state.js';
import { openDoc, isFlow, scanUrl } from './docs.js';
import { renderPage, cachedRender, renderedNow, previewScan, SCAN_W } from './render.js';
import { planAround, startOf, serverPrefetch, onDisk } from './prefetch.js';
import { showFlow, dropLive, live, vpToCol, flowRange } from './flow.js';
import { goPage, toggleZoom } from './nav.js';
import { itemIcon } from './icons.js';
import { profileOf, loadProfile, snapStart, spreadAt, cropOf, pageAspect, itemAspect, spriteCell, spriteAspect, assetUrl } from './profile.js';

// An item's profile, if the server has one: asked once per item (a loopback
// GET of a few ms; planAround usually has it already), never waited on long.
const profileSoon = (it) => {
  const P = profileOf(it);
  if (P !== undefined || !(it.kind === 'pdf' || it.kind === 'scan')) return P ?? null;
  return Promise.race([loadProfile(it), new Promise((r) => setTimeout(r, 60))]).then(() => profileOf(it) ?? null);
};

export async function showFeed() {
  const gen = ++state.gen;
  const i = current();
  const spread = $('#spread');
  if (i == null) { $('#item-head').textContent = 'Nothing in this lane.'; spread.replaceChildren(); return; }
  const it = items[i];
  paintHead(it);
  if (state.panelItem !== it.id) { state.panelItem = it.id; emit('item:shown', { i, it }); emitQuiet('item:settled', { i, it }, 300); }
  spread.classList.toggle('flowmode', isFlow(it));
  if (isFlow(it)) {
    let d;
    try { d = await openDoc(it); } catch (e) { if (gen === state.gen) showError(e); return; }
    if (gen !== state.gen) return;
    it.n = d.n;
    showFlow(i, it, d);
    planAround(i, state.start.get(i) ?? 0);
    return;
  }
  dropLive();
  let n = it.n;
  // With a profile the page count, shapes and blank pages are known before the
  // PDF is even opened (and its display images may make opening it unnecessary).
  let pf = profileOf(it);
  // Not asked yet (planAround usually has asked): ask now, but do not wait when
  // the opening pages are already in memory, so that spread still shows at once.
  if (pf === undefined && n && renderedNow(it, Math.max(0, Math.min(startOf(i), n - 1)))) loadProfile(it);
  else if (pf === undefined) { pf = await profileSoon(it); if (gen !== state.gen) return; }
  if (!n && pf?.n) n = it.n = pf.n;
  if (!n) {
    const stop = it.kind === 'pdf' ? showDownload(it, gen) : () => {};
    try { n = it.n = (await openDoc(it)).n; } catch (e) { stop(); if (gen === state.gen) showError(e); return; }
    stop();
    if (gen !== state.gen) return;
  }
  pf = profileOf(it);
  const boxH = spread.clientHeight - 8, boxW = spread.clientWidth - 24;
  if (state.perAuto) state.per = fitPer(it, boxW, boxH);
  const per = state.zoom ? 1 : state.per;
  let s = Math.max(0, Math.min(startOf(i), n - 1));
  // Profile: spreads start where the layout says (facing pages, pages shown alone, blanks riding along).
  if (pf) s = snapStart(pf, s, per);
  state.start.set(i, s);
  const hint = aspectOf(it);
  if (pf) { showProfiled(gen, i, it, pf, s, n, per, boxW, boxH); return; }
  // Fast path: every page of the spread is already rendered, so show it now,
  // in this frame, with no placeholders (this is what makes flipping smooth).
  {
    const ready = [], ks = []; let kk = s, content = 0;
    while (content < per && kk < n) { const v = renderedNow(it, kk); if (!v) break; ready.push(v); ks.push({ k: kk }); kk++; if (!(v.length === 1 && v[0].blank)) content++; }
    if (content >= per || (kk >= n && ready.length)) {
      planAround(i, s);
      state.fastHits = (state.fastHits || 0) + 1;
      finish(i, it, s, n, ready, ks, boxW, boxH);
      return;
    }
  }
  state.slowHits = (state.slowHits || 0) + 1;
  // Lay out panels until the spread is full. Blank pages collapse to a thin
  // strip and do not count, so a spread always shows `per` pages of content.
  const slots = []; let k = s;
  while (slots.length < per && k < n) { const kk = k++; slots.push({ el: h('div', { className: 'pg loading' }), k: kk, p: renderPage(it, kk) }); }
  spread.replaceChildren(...slots.map((x) => x.el));
  for (const x of slots) x.el.dataset.aspect = String(hint);
  // Placeholders take the shape the pages are expected to have, so the
  // spread does not jump when they arrive.
  layoutPanels(slots.map((x) => x.el), boxW, boxH);
  if (it.kind === 'scan') progressive(gen, it, slots, boxW, boxH);
  state.shown = slots.length;
  paintPos(it, s, slots.length, n);
  paintScrub(i, s, slots.length);
  planAround(i, s);
  const stopWait = waitingNote(it, slots, gen);
  const results = await Promise.all(slots.map((x) => x.p.catch((e) => [{ err: e.message, k: x.k }])));
  stopWait();
  if (gen !== state.gen) return;
  let extra = results.filter((r) => r.length === 1 && r[0].blank).length;
  while (extra > 0 && k < n) {
    const kk = k++; const p = await renderPage(it, kk).catch((e) => [{ err: e.message, k: kk }]);
    if (gen !== state.gen) return;
    results.push(p); slots.push({ k: kk }); if (!(p.length === 1 && p[0].blank)) extra--;
  }
  finish(i, it, s, n, results, slots, boxW, boxH);
}
/** Scans: each page goes up as soon as it can, not when the whole spread is in:
 *  its sharp render, or before that a preview (render.js previewScan: a small
 *  image already on disk, or one fetched beside the sharp one), cut exactly as
 *  the sharp page will be and sized by the same aspect, which the sharp page
 *  then replaces in place. The spread is laid out again only when a page's
 *  shape first differs from the guess. finish() then puts up the same pages. */
export const scanPreview = { fetch: true }; // fetch a preview for cold pages (the benchmark switches it)
function progressive(gen, it, slots, boxW, boxH) {
  const one = (p) => (p && p.length === 1 && p[0].canvas ? p[0] : null); // not blank, not split into columns
  const put = (x, pnl, sharp) => {
    if (gen !== state.gen || !x.el.isConnected || x.sharp || (!sharp && x.shown)) return;
    x.shown = true; if (sharp) x.sharp = true;
    x.el.replaceChildren(pnl.canvas, h('span', { className: 'pno', textContent: String(x.k + 1) }));
    x.el.classList.remove('loading');
    x.el.classList.toggle('preview', !sharp); x.el.classList.toggle('lowres', !sharp);
    const a = pnl.aspect ?? pnl.canvas.width / pnl.canvas.height;
    // The first page shape seen of this item may change how many pages fit
    // (finish() would find out only when the slowest page is in): lay out again now.
    if (!aspects.has(it.id) && !profileOf(it)) {
      aspects.set(it.id, a);
      if (state.perAuto && !state.zoom && fitPer(it, boxW, boxH) !== state.per) { showFeed(); return; }
    }
    if (Math.abs(a / Number(x.el.dataset.aspect) - 1) > 0.002) { x.el.dataset.aspect = String(a); layoutPanels(slots.map((y) => y.el), boxW, boxH); }
  };
  for (const x of slots) {
    x.p.then((p) => { const pnl = one(p); if (pnl) put(x, pnl, true); }, () => {}); // finish() moves the same canvas on
    // Not when the page is about to be there anyway (on disk; the render is a decode away).
    setTimeout(() => {
      if (gen !== state.gen || x.shown) return;
      previewScan(it, x.k, { fetch: scanPreview.fetch }).then((p) => { const pnl = one(p); if (pnl) put(x, pnl, false); }, () => {});
    }, 40);
  }
}
/** A spread of an item with a profile: its pages and their shapes are known, so
 *  placeholders are exact and blank pages need no render to be found. */
async function showProfiled(gen, i, it, pf, s, n, per, boxW, boxH) {
  const spread = $('#spread');
  const ks = spreadAt(pf, s, per);
  const ready = ks.map((k) => renderedNow(it, k));
  if (ready.every(Boolean)) {
    planAround(i, s);
    state.fastHits = (state.fastHits || 0) + 1;
    finish(i, it, s, n, ready, ks.map((k) => ({ k })), boxW, boxH);
    return;
  }
  state.slowHits = (state.slowHits || 0) + 1;
  const slots = ks.map((k) => ({ el: h('div', { className: pf.pages[k]?.blank ? 'pg blank' : 'pg loading' }), k, p: renderPage(it, k) }));
  spread.replaceChildren(...slots.map((x) => x.el));
  for (const x of slots) {
    const a = pageAspect(pf, x.k);
    if (!a) { x.el.dataset.aspect = '0.06'; continue; }
    x.el.dataset.aspect = String(a);
  }
  layoutPanels(slots.map((x) => x.el), boxW, boxH);
  // Until the page arrives: the page's cell of the sprite (body pages, whose
  // cells they fill), else for a scan a small image of it (on disk, or fetched
  // beside the sharp one: routes/13-ia.mjs), cropped as the page will be.
  for (const x of slots) {
    if (!pageAspect(pf, x.k)) continue;
    const cell = state.crop !== false && pf.pages[x.k]?.cg !== 'own' && spriteCell(pf, x.k, parseFloat(x.el.style.height) || 0);
    if (cell) { Object.assign(x.el.style, cell); continue; }
    if (it.kind === 'scan') {
      const im = h('img', { alt: '' }); im.onerror = () => im.remove();
      im.src = `/ia/preview?u=${encodeURIComponent(scanUrl(it, x.k, SCAN_W))}&w=600,400,200${scanPreview.fetch ? '&fetch=1' : ''}`;
      x.el.append(im); x.el.classList.add('lowres'); placeLowres(x.el, pf, x.k);
    }
  }
  state.shown = slots.length;
  paintPos(it, s, slots.length, n);
  paintScrub(i, s, slots.length);
  planAround(i, s);
  const stopWait = waitingNote(it, slots.filter((x) => !pf.pages[x.k]?.blank), gen);
  const results = await Promise.all(slots.map((x) => x.p.catch((e) => [{ err: e.message, k: x.k }])));
  stopWait();
  if (gen !== state.gen) return;
  finish(i, it, s, n, results, slots, boxW, boxH);
}
/** Show a full-page placeholder image cropped like the page will be. */
function placeLowres(el, pf, k) {
  const im = el.querySelector(':scope > img'); const b = state.crop !== false && cropOf(pf, k);
  if (!im || !b) return;
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  im.style.cssText = `position:absolute;width:${(100 / bw).toFixed(3)}%;height:${(100 / bh).toFixed(3)}%;left:${((-100 * b.x0) / bw).toFixed(3)}%;top:${((-100 * b.y0) / bh).toFixed(3)}%;max-width:none`;
}
/** Put rendered panels on the stage and tell everyone. */
function finish(i, it, s, n, results, slots, boxW, boxH) {
  const spread = $('#spread');
  const els = [];
  results.forEach((panels, j) => {
    for (const pnl of panels) {
      const el = h('div', { className: 'pg' });
      el.dataset.k = pnl.k ?? slots[j].k;
      el._pnl = pnl;
      if (pnl.blank) { el.className = 'pg blank'; el.textContent = 'blank'; el.dataset.aspect = '0.06'; }
      else if (pnl.err) { el.className = 'pg err'; el.textContent = pnl.err; el.dataset.aspect = '0.68'; }
      else { el.append(pnl.canvas); el.dataset.aspect = String(pnl.aspect ?? pnl.canvas.width / pnl.canvas.height); }
      el.append(h('span', { className: 'pno', textContent: String(Number(el.dataset.k) + 1) + (pnl.part || '') }));
      el.onclick = (e) => { if (!state.zoom && !e.target.closest('.tl, a') && !getSelection().toString()) toggleZoom(true, Number(el.dataset.k)); };
      els.push(el);
    }
  });
  // Remember this item's page shape; if it differs enough to change how many
  // pages fit, lay the spread out again (once, when the item first opens).
  const asp = els.filter((e) => e._pnl?.canvas).map((e) => Number(e.dataset.aspect) * (e._pnl.part ? 2 : 1)).sort((a, b) => a - b);
  if (asp.length && !profileOf(it)) {
    const first = !aspects.has(it.id);
    aspects.set(it.id, asp[Math.floor(asp.length / 2)]);
    if (first && state.perAuto && !state.zoom && fitPer(it, boxW, boxH) !== state.per) { showFeed(); return; }
  }
  spread.replaceChildren(...els);
  state.shown = slots.length;
  layoutPanels(els, boxW, boxH);
  paintPos(it, s, slots.length, n);
  paintScrub(i, s, slots.length);
  emit('spread:rendered', { i, it, s, els, doc: null });
  emitQuiet('spread:settled', { i, it, s, els, doc: null }, 160);
}
function showError(e) {
  const it = items[current()]; if (it) it.err = e.message; // Advance may then move on (nav.js)
  emit('item:error', { i: current(), it, msg: e.message });
  $('#spread').replaceChildren(h('div', { className: 'pg err', textContent: 'Could not open: ' + e.message, style: 'width:420px;height:300px' }));
}

// ---------- how many pages fit ----------
// Page shape (width / height) per item, learned from rendered pages.
const aspects = new Map();
// A profile knows the shape before anything is drawn; a shape already learned on
// this visit wins, so the number of pages does not change when a profile arrives.
const aspectOf = (it) => aspects.get(it.id) ?? (itemAspect(profileOf(it)) || (it.kind === 'scan' ? 0.66 : 0.74));
/** Pages per spread in auto mode: as many as fit at (nearly) full height, 1 to 3,
 *  so a laptop shows two and a large screen three, with little empty space. */
export function fitPer(it, W, H) {
  const gap = state.pageGap ?? 10; // Settings: gap between pages
  if (state.fit === 'width') return 1; // Settings 'fit width': one page across the stage
  return Math.max(1, Math.min(3, Math.floor((W + gap) / (H * aspectOf(it) * 0.8 + gap))));
}

/** Size panels to a common height that fits the stage, preserving each aspect ratio. */
export function layoutPanels(els, W, H) {
  const gap = state.pageGap ?? 10; // Settings: gap between pages
  const aspects = els.map((e) => Number(e.dataset.aspect) || 0.68);
  const sum = aspects.reduce((a, b) => a + b, 0);
  // Settings 'fit width': pages fill the width and the spread scrolls (features/settings.js).
  const height = state.fit === 'width' ? (W - gap * (els.length - 1)) / sum : Math.min(H, (W - gap * (els.length - 1)) / sum);
  els.forEach((e, j) => {
    e.style.height = Math.floor(height) + 'px';
    e.style.width = Math.floor(height * aspects[j]) + 'px';
  });
}

// The original: its landing page (an abstract page, the post) and, when the file is
// somewhere else (a PDF), the file too. Links open in a new tab.
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const isGraphql = (u) => /\/graphql\b/.test(u || '');
function sourceLinks(it) {
  const page = it.page || (isGraphql(it.url) ? null : it.url);
  if (!page || !/^https?:/.test(page)) return [];
  const out = [h('a', { className: 'src', href: page, target: '_blank', rel: 'noopener', title: `Open the original: ${page} (o)`, textContent: hostOf(page) + ' ↗' })];
  if (it.url && it.url !== page && /^https?:/.test(it.url) && !isGraphql(it.url) && (it.kind === 'pdf' || /\.pdf($|[?#])/i.test(it.url)))
    out.push(h('a', { className: 'src', href: it.url, target: '_blank', rel: 'noopener', title: it.url, textContent: 'pdf ↗' }));
  return out;
}
export function paintHead(it) {
  const saved = state.saved.includes(it.id);
  const page = sourceLinks(it)[0]?.href;
  $('#item-head').replaceChildren(
    h('span', { id: 'loadpct', hidden: true }),
    h('h1', { title: it.t }, itemIcon(it, 14), page ? h('a', { className: 'ttl', href: page, target: '_blank', rel: 'noopener', title: `${it.t}\nOpen the original (o)`, textContent: it.t }) : it.t),
    h('div', { className: 'meta' },
      h('span', { className: 'lane', textContent: LANES[it.lane] || it.lane }),
      it.a ? h('span', { className: 'au', textContent: it.a }) : null,
      fmtDate(it) ? h('span', { className: 'dt', textContent: fmtDate(it) }) : null,
      ...sourceLinks(it),
      saved ? h('span', { className: 'star', textContent: '★' }) : null),
    h('span', { className: 'pos', id: 'pos' }),
  );
}
export function paintPos(it, s, c, n, flow = false) {
  const el = $('#pos'); if (!el) return;
  const unit = flow ? 'p.' : 'pp.';
  // On the last spread, say what Advance does next (flow documents count columns).
  const last = flow ? !!live && (state.start.get(current()) ?? 0) + live.g.cols >= live.n : s + c >= n;
  const nx = last ? items[state.order[state.pos + 1]] : null;
  const next = !last ? '' : nx ? ` · ▸ next: ${nx.t.length > 48 ? nx.t.slice(0, 46) + '…' : nx.t}` : ' · end of lane';
  el.textContent = `${state.pos + 1}/${state.order.length} · ${unit} ${s + 1}–${Math.min(n, s + c)} of ${n}${state.zoom ? ' · zoom' : ''}`;
  if (next) el.append(h('span', { className: 'pos-next', textContent: next })); // its own span: a narrow header drops it (style.css)
  el.title = nx ? `Space goes on to: ${nx.t}` : '';
}

// ---------- page strip ----------
let scrubObs = null; let scrubFor = null;
// One thumbnail of the pinned strip (p), filled as it scrolls into view.
async function fillThumb(it, t) {
  const k = Number(t.dataset.k);
  // A cell of the item's sprite sheet (profile.js): one image for the whole strip, no rendering.
  const cell = spriteCell(profileOf(it), k, 74);
  if (cell) {
    const d = h('div', { className: 'spr' });
    Object.assign(d.style, cell, { position: 'absolute', top: '0', left: '50%', height: '74px', width: `${(74 * spriteAspect(profileOf(it))).toFixed(1)}px`, transform: 'translateX(-50%)' });
    t.prepend(d); return;
  }
  if (it.kind === 'scan') { t.prepend(h('img', { loading: 'lazy', crossOrigin: 'anonymous', src: PI(scanUrl(it, k, 120)), alt: '' })); return; }
  const d = await openDoc(it).catch(() => null);
  if (!d) return;
  if (d.pdf) {
    const page = await d.pdf.getPage(k + 1);
    const vp0 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 74 * 2 / vp0.height });
    const c = h('canvas', { width: Math.floor(vp.width), height: Math.floor(vp.height) });
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    t.prepend(c);
  } else t.prepend(h('div', { className: 'tt', textContent: (d.texts?.[k] || '').slice(0, 160) }));
}
export function paintScrub(i, s, c) {
  const it = items[i]; const box = $('#scrub');
  const n = it.n || 0;
  if (scrubFor !== it.id + '|' + n) {
    scrubFor = it.id + '|' + n;
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
      t.onclick = () => goPage(k);
      thumbs.push(t); scrubObs.observe(t);
    }
    box.replaceChildren(...thumbs);
  }
  const kp = new Set((state.marks?.get(it.id) || []).map((p) => p - 1));
  for (const t of box.children) {
    const k = Number(t.dataset.k);
    t.classList.toggle('cur', k >= s && k < s + c);
    t.classList.toggle('kp', kp.has(k));
  }
  if (state.pin) box.children[s]?.scrollIntoView({ block: 'nearest', inline: 'center' });
  paintTrack(i, s, c, n);
}

// ---------- track: the whole item as one bar ----------
// The bright part is what is on screen; dots are the summary's key points.
// Hovering shows the page under the pointer (for posts, the columns move
// there live) and clicking goes there; leaving puts everything back.
const track = $('#track'), peek = $('#peek');
let tr = null; // { i, it, n, s }
let peekK = -1;
export function paintTrack(i, s, c, n) {
  const it = items[i];
  if (tr?.it !== it) { loaded = null; paintLoaded(); }
  tr = { i, it, n: Math.max(1, n), s };
  pollLoaded();
  const fill = track.querySelector('.tr-fill');
  fill.style.left = (100 * s) / tr.n + '%';
  fill.style.width = (100 * Math.max(1, c)) / tr.n + '%';
  const kp = state.marks?.get(it.id) || [];
  track.querySelector('.tr-marks').replaceChildren(...kp.map((p) => h('i', { style: `left:${(100 * (p - 0.5)) / tr.n}%` })));
  paintLayers(c);
}
// Track layers (docs/profiles/spec.md 9.3): registerTrackLayer(name, fn) — fn({ i, it, n, s, c, el })
// paints inside el, a div.tr-layer[data-layer=name] in .tr-bar, emptied when the item changes.
// Called on every paintTrack (so a layer returns at once when it has nothing new) and on repaintTrack().
const trackLayers = new Map(); // name -> { fn, el, id }
export function registerTrackLayer(name, fn) { trackLayers.set(name, { fn, el: null, id: null }); if (tr) paintLayers(); }
export function repaintTrack() { paintLayers(); }
let trC = 1;
function paintLayers(c = trC) {
  trC = c;
  if (!tr) return;
  const bar = track.querySelector('.tr-bar');
  for (const [name, L] of trackLayers) {
    if (!L.el || !L.el.isConnected) { L.el = h('div', { className: 'tr-layer' }); L.el.dataset.layer = name; bar.append(L.el); }
    if (L.id !== tr.it.id) { L.el.replaceChildren(); L.id = tr.it.id; }
    try { L.fn({ i: tr.i, it: tr.it, n: tr.n, s: tr.s, c, el: L.el }); } catch (e) { console.error('track layer', name, e); }
  }
}
/** While a PDF downloads (big ones take a while), show how far it has got. */
function showDownload(it, gen) {
  let alive = true;
  const tick = async () => {
    if (!alive || gen !== state.gen) return;
    try {
      const p = await (await fetch('/progress?u=' + encodeURIComponent(it.url))).json();
      const el = document.getElementById('loadpct');
      if (el && p && !p.done && alive) {
        el.hidden = false;
        el.textContent = p.total ? `↓ ${Math.floor((100 * p.got) / p.total)}% of ${(p.total / 1e6).toFixed(1)} MB` : p.got ? `↓ ${(p.got / 1e6).toFixed(1)} MB` : '↓ waiting…';
        el.title = 'Downloading this PDF to your disk (once; after that it opens instantly)';
      }
    } catch { /* ignore */ }
    if (alive) setTimeout(tick, 300);
  };
  setTimeout(tick, 250);
  return () => { alive = false; const el = document.getElementById('loadpct'); if (el && el.textContent.startsWith('↓')) el.hidden = true; };
}

// ---------- waiting for a page ----------
// If pages are not ready within 250 ms, say where they come from, how long
// that source usually takes (measured by the server), and count the seconds.
const SOURCE = (it) => it.kind === 'scan' ? ['archive.org', 'Internet Archive'] : (() => { try { const h = new URL(it.url).hostname.replace(/^www\./, ''); return [h, h]; } catch { return ['', 'the source']; } })();
export function sourceSpeed(it) {
  const [host, name] = SOURCE(it);
  const st = state.status?.hosts?.[host];
  return { name, p50: st?.p50 ? st.p50 / 1000 : null, perMin: st?.perMin || 0 };
}
function waitingNote(it, slots, gen) {
  const t0 = performance.now();
  let iv = 0;
  const to = setTimeout(() => {
    const { name, p50 } = sourceSpeed(it);
    const tick = () => {
      if (gen !== state.gen) return;
      const sec = (performance.now() - t0) / 1000;
      for (const x of slots) {
        if (!x.el?.isConnected || !x.el.classList.contains('loading')) continue;
        let w = x.el.querySelector('.pg-wait');
        if (!w) { w = h('div', { className: 'pg-wait' }); x.el.append(w); }
        w.textContent = `Loading p. ${x.k + 1} from ${name} · ${sec.toFixed(1)} s` + (p50 ? ` (usually ${p50.toFixed(1)} s)` : '');
      }
    };
    tick(); iv = setInterval(tick, 250);
  }, 250);
  return () => { clearTimeout(to); clearInterval(iv); };
}

// ---------- how much of the item is ready ----------
// Scans: which page images are in the server's disk cache (the rest come from
// the Internet Archive at about a second a page); PDFs and posts are whole
// files, ready once opened. Shown as a lighter band under the track and, while
// incomplete, as a percentage before the title. Staying on a scan for a moment
// asks the server to fetch the whole book in the background (warmBook).
let loaded = null; // { id, bits: '0101…', pct }
let pollT = null, bookT = null;
function paintLoaded() {
  const bar = track.querySelector('.tr-bar');
  let el = bar.querySelector('.tr-load');
  if (!el) { el = h('div', { className: 'tr-load' }); bar.prepend(el); }
  const pctEl = document.getElementById('loadpct');
  if (!loaded) { el.style.background = 'none'; if (pctEl) pctEl.hidden = true; return; }
  const { bits } = loaded; const n = bits.length;
  const stops = []; let j = 0;
  while (j < n) { let e = j; while (e < n && bits[e] === bits[j]) e++; if (bits[j] === '1') stops.push(`transparent ${(100 * j) / n}%, var(--ink-3) ${(100 * j) / n}% ${(100 * e) / n}%, transparent ${(100 * e) / n}%`); j = e; }
  el.style.background = stops.length ? `linear-gradient(90deg, ${stops.join(', ')})` : 'none';
  if (pctEl) {
    const have = [...bits].filter((b) => b === '1').length, n2 = bits.length;
    const s0 = tr ? (state.start.get(tr.i) ?? 0) + Math.max(1, state.shown || 1) : 0;
    let ahead = 0; while (s0 + ahead < n2 && bits[s0 + ahead] === '1') ahead++;
    const rate = loaded.rate || 0; // pages per second, measured between polls
    const eta = rate > 0.05 ? (n2 - have) / rate : null;
    const fmt = (x) => (x < 90 ? `${Math.round(x)} s` : `${Math.round(x / 60)} min`);
    pctEl.hidden = loaded.pct >= 100;
    // The details in their own span: a narrow header (one bar) shows the percentage alone (style.css).
    pctEl.replaceChildren(`${loaded.pct}%`, h('span', { className: 'lp-x', textContent: ` · ${ahead >= n2 - s0 ? 'rest ready' : ahead + ' ready ahead'}${eta ? ' · ~' + fmt(eta) : ''}` }));
    const { p50 } = sourceSpeed(tr?.it || {});
    pctEl.title = `${have} of ${n2} pages are on your disk. ${ahead} pages after these are ready to turn to instantly.`
      + ` The rest come from the Internet Archive${p50 ? `, about ${p50.toFixed(1)} s a page` : ''}${rate ? `; downloading ${rate.toFixed(1)} pages a second in the background` : ''}${eta ? `, about ${fmt(eta)} to go` : ''}.`;
  }
}
async function pollLoaded() {
  clearTimeout(pollT);
  const t = tr; if (!t) return;
  const it = t.it;
  if (it.kind !== 'scan') { if (loaded?.id !== it.id) { loaded = { id: it.id, bits: '1'.repeat(Math.min(t.n, 1500)), pct: 100 }; paintLoaded(); } return; }
  const urls = Array.from({ length: Math.min(t.n, 1500) }, (_, k) => scanUrl(it, k, SCAN_W));
  try {
    const bits = await (await fetch('/cached', { method: 'POST', body: JSON.stringify({ urls }) })).text();
    onDisk.set(it.id, bits); if (onDisk.size > 20) onDisk.delete(onDisk.keys().next().value);
    if (tr?.it !== it) return;
    const have = [...bits].filter((b) => b === '1').length;
    const prev = loaded?.id === it.id ? loaded : null, now = performance.now();
    const rate = prev && now > prev.at + 500 ? Math.max(0, (have - prev.have) / ((now - prev.at) / 1000)) : prev?.rate || 0;
    loaded = { id: it.id, bits, have, at: now, rate: prev ? 0.6 * rate + 0.4 * (prev.rate || rate) : 0, pct: Math.floor((100 * have) / Math.max(1, bits.length)) };
    paintLoaded();
    if (loaded.pct < 100) pollT = setTimeout(pollLoaded, 2000);
  } catch { /* offline */ }
}
// The whole book at the size the feed reads (w1000; smaller sizes are served
// from it), nearest pages first, pages ahead before pages behind (two ahead
// for each one behind), behind everything more urgent. A page costs the
// Internet Archive's datanode the same at any size, so this is the fastest way
// to have every page sharp: about 10 pages a second (cache.mjs: 12 at a time),
// two minutes for a 1,200-page book. It starts 1.5 s after you settle on a scan
// and starts over from where you are when you jump within it.
let warmed = null; // id of the book being warmed
function warmBook(it) {
  if (tr?.it !== it) return;
  const s = state.start.get(tr.i) ?? 0, s1 = s + Math.max(1, state.shown || state.per);
  const d = (k) => (k >= s ? Math.max(0, k - s1 + 1) : 2 * (s - k));
  const ks = Array.from({ length: Math.min(it.n, 1500) }, (_, k) => k).sort((a, b) => d(a) - d(b) || a - b);
  serverPrefetch(ks.map((k) => scanUrl(it, k, SCAN_W)), 20, 'book');
  warmed = it.id;
  pollLoaded();
}
on('item:settled', ({ it }) => {
  clearTimeout(bookT); warmed = null;
  if (it.kind !== 'scan' || !it.n) return;
  bookT = setTimeout(() => warmBook(it), 1500);
});
on('nav', ({ type, it }) => {
  if ((type !== 'page' && type !== 'random') || !it || it.id !== warmed || (loaded?.id === it.id && loaded.pct >= 100)) return;
  clearTimeout(bookT); bookT = setTimeout(() => warmBook(it), 400);
});

// Scrubbing redraws the main spread at the page under the pointer from
// whatever is fastest: a full render already in memory, else a quick
// low-resolution one (PDFs) or the small page image (scans).
const quick = new Map(); // `${id}|${k}` -> Promise<canvas>, low-res PDF pages
/** How many quick pdf.js renders scrubbing has made (the benchmark counts them; drop() forgets them). */
export const scrubStats = { quick: 0, drop: () => quick.clear() };
function quickPdf(it, k, H) {
  return lru(quick, `${it.id}|${k}`, async () => {
    scrubStats.quick++;
    const d = await openDoc(it);
    const page = await d.pdf.getPage(k + 1);
    const vp0 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: H / vp0.height });
    const c = h('canvas', { width: Math.floor(vp.width), height: Math.floor(vp.height) });
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    return c;
  }, 120);
}
let want = null; // the spread the pointer asks for: { k, els }
async function fillScrub(it, k, el) {
  const full = cachedRender(it, k);
  if (full) { const p = await full.catch(() => null); const pnl = p?.find((x) => x.canvas); if (pnl && el.isConnected) { el.replaceChildren(cloneCanvas(pnl.canvas)); el.dataset.aspect = String(pnl.canvas.width / pnl.canvas.height); return; } }
  // The page's cell of the sprite sheet: a CSS background, in this frame. If the
  // pointer stays, the page comes in sharper (its display image, else a quick render).
  const pf = profileOf(it);
  const cell = pf && spriteCell(pf, k, parseFloat(el.style.height) || el.clientHeight);
  if (cell) {
    Object.assign(el.style, cell); el.classList.add('sprite');
    // Scrubbing replaces these elements whenever the page under the pointer
    // changes, so a page the pointer has left is never sharpened.
    const swap = (node) => { if (!el.isConnected) return; node.style.objectFit = 'contain'; el.style.backgroundImage = 'none'; el.replaceChildren(node); };
    const sharpen = () => {
      if (!el.isConnected) return;
      if (it.kind === 'scan') { loadThumb(it, k, () => swap(h('img', { crossOrigin: 'anonymous', src: PI(scanUrl(it, k, 200)), alt: '' }))); return; }
      const u = pf.assets?.display?.[k] ? assetUrl(pf, 'display', k) : null;
      if (u) { const im = h('img', { alt: '', decoding: 'async' }); im.src = u; im.decode().then(() => swap(im), () => {}); return; }
      quickPdf(it, k, 700).then((c) => c && swap(cloneCanvas(c)), () => {});
    };
    setTimeout(sharpen, it.kind === 'scan' ? 60 : 250);
    return;
  }
  if (it.kind === 'scan') {
    // Show the page if its small image is here; otherwise the nearest page that
    // is, dimmed, until this one arrives (Internet Archive pages take 1-3 s).
    const key = (kk) => `${it.id}|${kk}`;
    let near = null;
    for (let d = 0; d <= 40 && near == null; d++) { if (thumbOk.has(key(k - d))) near = k - d; else if (thumbOk.has(key(k + d))) near = k + d; }
    if (near != null) { el.replaceChildren(h('img', { crossOrigin: 'anonymous', src: PI(scanUrl(it, near, 200)), alt: '' })); el.classList.toggle('approx', near !== k); }
    if (near !== k) loadThumb(it, k, () => { if (el.isConnected) { el.replaceChildren(h('img', { crossOrigin: 'anonymous', src: PI(scanUrl(it, k, 200)), alt: '' })); el.classList.remove('approx'); } });
    return;
  }
  const c = await quickPdf(it, k, 700).catch(() => null);
  if (c && el.isConnected) el.replaceChildren(cloneCanvas(c));
}
// Small scan page images the browser already holds, by `${id}|${k}`.
const thumbOk = new Set();
function loadThumb(it, k, done) {
  const im = new Image(); im.crossOrigin = 'anonymous';
  im.onload = () => { thumbOk.add(`${it.id}|${k}`); done?.(); };
  im.src = PI(scanUrl(it, k, 200));
}
const cloneCanvas = (c) => { const x = h('canvas', { width: c.width, height: c.height }); x.getContext('2d').drawImage(c, 0, 0); return x; };
function scrubSpread(k) {
  const { it, n } = tr;
  const per = state.zoom ? 1 : Math.max(1, state.shown || state.per);
  const k0 = Math.max(0, Math.min(k, n - per));
  const spread = $('#spread');
  const els = [];
  const sa = spriteAspect(profileOf(it)); // with a sprite, every cell has the same shape
  for (let j = 0; j < per && k0 + j < n; j++) {
    const el = h('div', { className: 'pg scrubbing' });
    el.dataset.k = k0 + j; el.dataset.aspect = String(sa || aspectOf(it));
    el.append(h('span', { className: 'pno', textContent: String(k0 + j + 1) }));
    els.push(el);
  }
  spread.replaceChildren(...els);
  layoutPanels(els, spread.clientWidth - 24, spread.clientHeight - 8);
  want = { k: k0, els };
  els.forEach((el, j) => fillScrub(it, k0 + j, el));
}
function placeLabel(x) {
  const r = track.getBoundingClientRect();
  peek.style.left = Math.min(innerWidth - 140, Math.max(8, x - 60)) + 'px';
  // Under the track when it sits at the top (header.js; the default), above it at the bottom.
  peek.style.top = (r.top < innerHeight / 2 ? r.bottom + 6 : r.top - 30) + 'px';
}
// ---------- riffle: hold a page key to thumb through the item ----------
// Called by riffle.js. Uses the same quick pages as track scrubbing.
let riff = null;
export function riffleStart() {
  const i = current(); if (i == null) return false;
  const it = items[i]; const n = it.n || 0;
  if (!n || (isFlow(it) && live?.id !== it.id)) return false;
  riff = { i, it, n, k: isFlow(it) ? (state.start.get(i) ?? 0) : (state.start.get(i) ?? startOf(i)) };
  tr = tr && tr.it === it ? tr : { i, it, n, s: riff.k };
  if (it.kind === 'scan') serverPrefetch(coarseToFine(Math.min(n, 1200)).map((k) => scanUrl(it, k, 200)), 50, 'track');
  peek.classList.add('textonly'); peek.hidden = false;
  return true;
}
export function riffleStep(dir) {
  if (!riff) return;
  const { it, n } = riff;
  if (isFlow(it)) {
    riff.k = Math.max(0, Math.min(live.n - 1, riff.k + dir));
    live.flow.style.transform = `translateX(${-riff.k * live.g.pitch}px)`;
    const [a] = flowRange(riff.k);
    peek.querySelector('.pk-label').textContent = `p. ${a + 1} / ${it.n}`;
  } else {
    riff.k = Math.max(0, Math.min(n - 1, riff.k + dir));
    if (it.kind === 'scan') serverPrefetch(Array.from({ length: 30 }, (_, j) => riff.k + dir * j).filter((x) => x >= 0 && x < n).map((x) => scanUrl(it, x, 200)), 75, 'track-near');
    scrubSpread(riff.k);
    peek.querySelector('.pk-label').textContent = `p. ${riff.k + 1} / ${n}`;
  }
  const r = track.getBoundingClientRect();
  const f = (riff.k + 0.5) / (isFlow(it) ? live.n : n);
  placeLabel(r.left + f * r.width);
  track.querySelector('.tr-hover').style.left = f * 100 + '%';
}
export function riffleEnd() {
  if (!riff) return;
  const { i, it, k } = riff; riff = null; want = null; peek.hidden = true;
  if (isFlow(it)) { state.start.set(i, k); showFeed(); } else goPage(k);
}

// Pages spread over the whole item, coarse to fine (every 64th, then every
// 32nd between them, …), so wherever the pointer lands a page near it is in.
function coarseToFine(n) {
  const out = [], seen = new Uint8Array(n);
  for (let step = 64; step >= 1; step >>= 1) for (let k = 0; k < n; k += step) if (!seen[k]) { seen[k] = 1; out.push(k); }
  return out;
}
track.addEventListener('pointerenter', () => {
  if (!tr) return;
  const { it, n } = tr;
  // Get the whole item's small page images coming for scans (served from the
  // book's w1000s where those are on disk or queued: cache.mjs merge()).
  if (it.kind === 'scan') {
    serverPrefetch(coarseToFine(Math.min(n, 1200)).map((k) => scanUrl(it, k, 200)), 50, 'track');
    // And pull an evenly spaced set into the browser first, so any hover lands near a page.
    for (let j = 0; j < 40; j++) { const k = Math.floor((j * n) / 40); if (!thumbOk.has(`${it.id}|${k}`)) loadThumb(it, k); }
  }
});
track.addEventListener('pointermove', (e) => {
  if (!tr) return;
  const r = track.getBoundingClientRect();
  const f = Math.min(0.9999, Math.max(0, (e.clientX - r.left) / r.width));
  const k = Math.floor(f * tr.n);
  track.querySelector('.tr-hover').style.left = f * 100 + '%';
  peek.classList.add('textonly');
  peek.hidden = false;
  placeLabel(e.clientX);
  if (k === peekK) return;
  peekK = k;
  peek.querySelector('.pk-label').textContent = `p. ${k + 1} / ${tr.n}`;
  if (isFlow(tr.it)) {
    // Posts: move the live columns there.
    if (live?.id === tr.it.id) live.flow.style.transform = `translateX(${-vpToCol(k) * live.g.pitch}px)`;
  } else {
    if (tr.it.kind === 'scan') serverPrefetch(Array.from({ length: 24 }, (_, j) => k - 8 + j).filter((x) => x >= 0 && x < tr.n).map((x) => scanUrl(tr.it, x, 200)), 75, 'track-near');
    scrubSpread(k);
  }
});
// Leaving puts the spread back where you were (renders are cached, so this is instant).
track.addEventListener('pointerleave', () => {
  peek.hidden = true;
  if (peekK < 0 || !tr) return;
  peekK = -1; want = null;
  if (isFlow(tr.it)) { if (live?.id === tr.it.id) live.flow.style.transform = `translateX(${-(state.start.get(tr.i) ?? 0) * live.g.pitch}px)`; }
  else showFeed();
});
track.addEventListener('click', () => {
  if (peekK < 0 || !tr) return;
  const k = isFlow(tr.it) ? peekK : Math.max(0, Math.min(peekK, tr.n - Math.max(1, state.shown || state.per)));
  peekK = -1; want = null; peek.hidden = true;
  goPage(k);
});
