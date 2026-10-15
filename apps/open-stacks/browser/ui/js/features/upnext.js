// Up next: the next items of the stack (stack.js: state.order, which j, ↓ and
// the wheel walk) as a strip in the empty band under the pages, when there is
// one. Wall covers (wall.js coverFor) with a two-line title, the type icon and
// the date, the item before this one dimmed at the left. A click goes there
// (stack.js goTo: Back returns, k walks back through what was skipped); j
// still goes to the first tile. The header names the stack and the place in
// it ("Up next in LLM papers › Reasoning · 7/10 · By topic").
//
// Its size follows the free space under the pages, measured after the spread
// settles: 120 px or more, tiles (the strip at most 220 px tall, at the bottom
// of the band); 40-120 px, one line of titles; less, nothing (posts fill the
// stage, so they never have one). It never moves the pages: it is placed
// absolutely in #stage, before #spread in the document, so pages
// (position: relative) paint over it if a new spread is taller, until it
// measures again.
//
// Work: only on 'item:settled', 'stack:changed', 'spread:settled' and resizes,
// in idle time, nothing on the way to a page or item. Covers come from what is
// known (the wall's cover data); their images (a book's cover scan, a post's
// lead image) load at most 2 at a time, low priority, 2 per paint (and 2 more
// every few seconds of rest), and wait while you move.
// U, or Settings › Navigation › Up next, hides it (store 'upnext').
import { $, h, on, emit, store, fmtDate, registerKey, toast } from '../util.js';
import { items, LANES, LANE_COLORS } from '../corpus.js';
import { state, current } from '../state.js';
import { stack, upNext, upPrev, goTo, leave, narrowed, SORTS } from '../stack.js';
import { coverFor } from '../wall.js';
import { itemIcon } from '../icons.js';
import { openDoc, scanUrl } from '../docs.js';
import { startOf, serverPrefetch } from '../prefetch.js';
import { SCAN_W } from '../render.js';

const TILES_MIN = 120, LINE_MIN = 40, MAX_H = 220, LINE_H = 24;
const HEAD_H = 14, CAP_H = 48, GAP_V = 6, GAP_X = 12, SEP_W = 15; // keep in step with upnext.css
let shown = store.get('upnext', true) !== false;

// ---------- the strip ----------
const root = h('nav', { id: 'upnext', hidden: true, ariaLabel: 'Up next' });
const label = h('button', { type: 'button', className: 'un-in', title: 'Show this stack in the Library', onclick: () => emit('stack:show', { stack: stack() }) });
const count = h('span', { className: 'un-n' });
const sortEl = h('span', { className: 'un-sort' });
const head = h('div', { className: 'un-head' }, h('span', { className: 'un-k', textContent: 'Up next' }), label, count, sortEl,
  h('button', { type: 'button', className: 'un-x', textContent: '✕', title: 'Hide up next (U) · Settings › Navigation shows it again', onclick: () => setShown(false) }));
const row = h('div', { className: 'un-row' });
root.append(head, row);
// Before #spread: the pages paint over it (see above).
$('#stage').insertBefore(root, $('#spread'));

/** The stack's name as the header gives it. */
function where(st) {
  if (st.kind === 'folder') return (st.crumb?.length ? st.crumb : [st.label]).join(' › ');
  if (st.kind === 'tag') return st.label;
  if (st.kind === 'all') return 'All lanes';
  return st.label || LANES[state.lane] || '';
}
const tip = (it, prev) => [it.t, it.a, [LANES[it.lane], fmtDate(it), it.n ? it.n + ' pp' : ''].filter(Boolean).join(' · '),
  prev ? 'Click: back to it (k)' : 'Click: read it now · Back returns'].filter(Boolean).join('\n');

// ---------- reading memory (features/memory.js, when it is loaded) ----------
let progressOf = null;
on('boot', async () => {
  try {
    const f = await (await fetch('/features.json')).json();
    if ((f.js || []).some((m) => /\/memory\.js$/.test(m))) ({ progressOf } = await import('./memory.js'));
  } catch { /* no reading memory */ }
});

// ---------- tiles ----------
const tiles = new Map(); // item index -> tile element (reused while it stays in view)
function makeTile(i) {
  const it = items[i];
  const cv = h('div', { className: 'un-cv' });
  const c = coverFor(i);
  if (c) { holdImages(c); cv.append(c); }
  const el = h('div', { className: 'un-t', role: 'button', title: tip(it) },
    cv,
    h('div', { className: 'un-tt' }, itemIcon(it, 11), it.t),
    h('div', { className: 'un-m' }, h('span', { className: 'un-dt', textContent: fmtDate(it) || (it.n ? it.n + ' pp' : '') }), h('span', { className: 'un-rd' }), h('kbd', { className: 'un-key' })));
  el.style.setProperty('--c', LANE_COLORS[it.lane] || '#7a6f60');
  el.dataset.i = i;
  return el;
}
function tile(i, role) {
  let el = tiles.get(i);
  if (!el) { el = makeTile(i); tiles.set(i, el); }
  el.classList.toggle('prev', role === 'prev');
  el.classList.toggle('first', role === 'first');
  el.title = tip(items[i], role === 'prev');
  el.querySelector('.un-key').textContent = role === 'prev' ? 'k' : role === 'first' ? 'j' : '';
  // How far you have read it (memory.js): a bar along the cover's foot, or read.
  const p = progressOf?.(items[i].id);
  const done = !!p?.done, frac = !done && p?.frac > 0.02 ? p.frac : 0;
  el.classList.toggle('read', done);
  el.querySelector('.un-rd').textContent = done ? '✓ read' : frac ? Math.round(frac * 100) + '%' : '';
  let bar = el.querySelector('.un-bar');
  if (frac) { if (!bar) el.firstChild.append(bar = h('i', { className: 'un-bar' })); bar.style.width = (frac * 100).toFixed(1) + '%'; } else bar?.remove();
  return el;
}
function endTile(st) {
  const inside = narrowed();
  const name = inside ? where(st) : st.kind === 'all' ? 'all the lanes' : where(st);
  return h('div', { className: 'un-end' },
    h('div', { className: 'un-end-t', textContent: inside ? `Last in ${st.label}` : `End of ${name}` }),
    h('div', { className: 'un-end-s' }, inside
      ? [h('button', { type: 'button', textContent: 'Leave · u', title: 'The whole lane again, on this item (u) · Back undoes', onclick: () => leave() }), h('div', { textContent: 'the whole lane, from here' })]
      : '0–9: another lane'));
}
function lineItem(i, role) {
  const it = items[i];
  const el = h('span', { className: 'un-l' + (role ? ' ' + role : ''), role: 'button', title: tip(it, role === 'prev') },
    role === 'prev' ? h('span', { className: 'un-arr', textContent: '‹' }) : null, itemIcon(it, 11), h('span', { className: 'un-lt', textContent: it.t }));
  el.dataset.i = i;
  return el;
}

// ---------- images: few, late, low priority ----------
// A cover's image (a book's cover scan through the proxy, a post's lead image)
// waits here unless this page already loaded it; 2 load per paint, one or two
// at a time, never while you are moving.
const okImg = new Set();
let budget = 0, active = 0, moving = false, restT = 0;
function holdImages(c) {
  for (const im of c.querySelectorAll('img')) {
    const src = im.getAttribute('src'); if (!src) continue;
    im.loading = 'eager'; im.decoding = 'async';
    if (okImg.has(src)) continue;
    im.removeAttribute('src'); im.dataset.src = src; // before the fetch starts (it waits for a microtask)
  }
}
function pumpImages() {
  if (moving || root.hidden) return;
  for (const im of row.querySelectorAll('img[data-src]')) { // left to right: nearest first
    if (budget <= 0 || active >= 2) break;
    const src = im.dataset.src; delete im.dataset.src;
    budget--; active++;
    const done = (ok) => { active = Math.max(0, active - 1); if (ok) okImg.add(src); };
    im.addEventListener('load', () => done(true), { once: true });
    im.addEventListener('error', () => done(false), { once: true });
    im.fetchPriority = 'low'; im.src = src;
  }
  // Resting on a page: a couple more every few seconds.
  clearTimeout(restT);
  if (row.querySelector('img[data-src]')) restT = setTimeout(() => { budget = Math.max(budget, 2); idle(pumpImages); }, 3000);
}
on('nav', () => { moving = true; clearTimeout(restT); }); // only a flag: nothing else on the way to a page or item

// ---------- where it goes and how big ----------
/** The free band under the pages, from layout that is settled by now. */
function measure() {
  const stage = $('#stage'), spread = $('#spread');
  if (!stage || stage.hidden || !spread || stage.classList.contains('wv-on')) return null;
  let bottom = -Infinity;
  for (const el of spread.children) {
    if (!el.classList.contains('pg')) continue;
    const r = el.getBoundingClientRect();
    if (r.height) bottom = Math.max(bottom, r.bottom);
  }
  if (bottom === -Infinity) return null;
  const sr = stage.getBoundingClientRect(), pr = spread.getBoundingClientRect();
  const end = Math.min(pr.bottom, sr.bottom) - 2; // above the strip, the track and the read-aloud bar
  geo = { top: pr.top + 3, ch: spread.clientHeight - 6, end }; // #spread's content box (padding 3px), for the 'spread:rendered' check below
  return { band: Math.floor(end - bottom - 8), end: end - sr.top, width: sr.width - 32 };
}
// A new spread taller than the last (a bigger page, zoom, a post) would cover the
// strip until it measures again, which can be a second away while pages render
// ahead. So when a spread goes up, its pages' heights (inline styles feed.js sets:
// no layout is read) are checked against the place the strip has, and the strip
// steps aside until the next paint. Pages are centred in #spread.
let geo = null, stripH = 0;
on('spread:rendered', () => {
  if (root.hidden || !geo) return;
  let ph = 0;
  for (const el of $('#spread').children) {
    if (!el.classList.contains('pg')) continue;
    const x = parseFloat(el.style.height);
    if (!(x > 0)) { ph = Infinity; break; } // a post's sheet fills the stage
    if (x > ph) ph = x;
  }
  if (geo.top + (geo.ch + ph) / 2 + 4 > geo.end - stripH) root.classList.add('under');
});

let sig = '';
function hide() { if (!root.hidden) root.hidden = true; sig = ''; }
function paint() {
  if (!shown || state.view !== 'feed' || current() == null) return hide();
  const m = measure();
  const mode = !m ? null : m.band >= TILES_MIN ? 'tiles' : m.band >= LINE_MIN ? 'line' : null;
  if (!mode) return hide();
  const st = stack();
  const H = mode === 'tiles' ? Math.min(MAX_H, m.band) : LINE_H;
  const coverH = H - HEAD_H - GAP_V - CAP_H - 5;
  let tw = Math.max(112, Math.min(160, Math.round(coverH * 0.78)));
  const prev = upPrev(1)[0];
  let next, slots = 0;
  if (mode === 'tiles') {
    // As many tiles as fit; when they fill the row, widened to fill it exactly.
    const room = m.width - (prev != null ? SEP_W : 0);
    slots = Math.max(1, Math.min(30, Math.floor((room + GAP_X) / (tw + GAP_X))));
    next = upNext(slots - (prev != null ? 1 : 0));
    const used = next.length + (prev != null ? 1 : 0) + (st.pos + 1 + next.length >= st.n ? 1 : 0);
    if (used >= slots) tw = Math.floor((room + GAP_X) / slots - GAP_X);
  } else next = upNext(12);
  root.style.top = Math.round(m.end - H) + 'px';
  root.style.height = H + 'px';
  stripH = H;
  root.classList.remove('under');
  const s = [mode, H, tw, prev, next.join(), st.kind, st.id, st.pos, st.n, st.sort].join('|');
  if (root.hidden) root.hidden = false;
  if (s === sig) { moving = false; idle(pumpImages); return; } // same tiles: the rest of this paint's budget
  sig = s;
  root.className = 'un ' + mode;
  root.style.setProperty('--un-w', tw + 'px');
  root.style.setProperty('--un-ch', coverH + 'px');
  label.textContent = 'in ' + where(st);
  label.title = `${st.crumb?.join(' › ') || where(st)} · show it in the Library`;
  count.textContent = `${st.pos + 1}/${st.n}`;
  sortEl.textContent = SORTS[st.sort] || '';
  if (mode === 'tiles') {
    const kids = [];
    if (prev != null) kids.push(tile(prev, 'prev'), h('i', { className: 'un-sep' }));
    next.forEach((i, j) => kids.push(tile(i, j === 0 ? 'first' : '')));
    if (st.pos + 1 + next.length >= st.n && kids.length - (prev != null ? 1 : 0) < slots) kids.push(endTile(st)); // the stack ends in view
    row.replaceChildren(...kids);
    // Forget tiles far from here (they are cheap to make again).
    if (tiles.size > 90) { const keep = new Set([prev, ...next]); for (const k of tiles.keys()) if (!keep.has(k)) tiles.delete(k); }
  } else {
    const kids = [h('span', { className: 'un-k', textContent: 'Up next' }), h('span', { className: 'un-n', textContent: `${st.pos + 1}/${st.n}` })];
    if (prev != null) kids.push(lineItem(prev, 'prev'));
    next.forEach((i, j) => kids.push(lineItem(i, j === 0 ? 'first' : '')));
    if (!next.length) kids.push(h('span', { className: 'un-l end', textContent: narrowed() ? `Last in ${st.label} · u leaves it` : `End of ${where(st)}` }));
    row.replaceChildren(...kids);
  }
  budget = 2; moving = false;
  idle(pumpImages);
}

const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 60));
let queued = false;
const cost = { n: 0, ms: 0 }; // time spent painting, for window.__upnext()
function soon() {
  if (queued) return;
  queued = true;
  idle(() => {
    queued = false;
    const t0 = performance.now();
    try { paint(); } catch (e) { console.error('upnext', e); hide(); }
    cost.n++; cost.ms += performance.now() - t0;
  });
}
on('item:settled', soon);
on('spread:settled', soon);
on('stack:changed', soon);
on('boot', soon);
on('view:changed', ({ view }) => { if (view === 'feed') soon(); else hide(); });
on('settings:changed', ({ key }) => {
  if (key !== 'upnext' && key !== '*') return;
  shown = store.get('upnext', true) !== false;
  if (shown) soon(); else hide(); // off at once: it is your own key or click
});
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(soon, 250); });

// ---------- clicks ----------
root.addEventListener('mousedown', (e) => { if (e.button === 0 && e.target.closest('[data-i]')) e.preventDefault(); }); // no focus, no selection
root.addEventListener('click', (e) => {
  const t = e.target.closest('[data-i]'); if (!t) return;
  const prev = t.classList.contains('prev');
  goTo(Number(t.dataset.i), prev ? 'previous item' : 'up next');
});
// Resting the pointer on a tile gets the item ready (as the wall does), so the click opens at once.
let warmT = 0, warmed = -1;
root.addEventListener('pointerover', (e) => {
  const t = e.target.closest('[data-i]'); if (!t) return;
  const i = Number(t.dataset.i); if (i === warmed) return;
  clearTimeout(warmT);
  warmT = setTimeout(() => {
    warmed = i;
    const it = items[i];
    if (it.kind === 'scan') { const s = startOf(i); serverPrefetch([0, 1, 2].map((j) => scanUrl(it, Math.min((it.n || 1e6) - 1, s + j), SCAN_W)), 70, 'upnext'); }
    else openDoc(it).catch(() => {});
  }, 350);
});
root.addEventListener('pointerleave', () => clearTimeout(warmT));

// ---------- on and off ----------
function setShown(v) {
  shown = v; store.set('upnext', v);
  emit('settings:changed', { key: 'upnext', value: v });
  toast(v ? 'Up next shown' : 'Up next hidden', { icon: 'skip-forward', kind: 'mode', sub: v ? 'Under the pages when there is room · U hides it' : 'U shows it again' });
}
registerKey('U', () => setShown(!shown), { view: 'feed', help: ['U', 'up next: the next items of the stack under the pages, when there is room (click one to go there; Back returns) · U hides or shows it'], order: 10.5 });

/** For tests: what the strip shows. */
window.__upnext = () => ({ shown, hidden: root.hidden, mode: root.hidden ? null : root.classList.contains('tiles') ? 'tiles' : 'line', band: measure()?.band ?? null,
  h: root.offsetHeight, paints: cost.n, paintMs: Math.round(cost.ms * 10) / 10, items: [...row.querySelectorAll('[data-i]')].map((x) => ({ i: Number(x.dataset.i), prev: x.classList.contains('prev') })) });
