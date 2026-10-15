// Reading memory: where you were in everything, and how you read it.
//
// Per item it records visits (start, end and active time: the window shown and
// some input in the last minute, or reading aloud), every spread you settled on
// in order with the time spent there, the pages seen (a spread on screen for
// 1.2 s of active time), where you left it, the furthest page, the layout, and
// save / less / more. The server keeps it (server/routes/45-memory.mjs:
// CACHE/memory.json plus an append-only log), so it survives restarts.
//
// - Resume: an item you come back to opens where you left it, if that is past
//   its first few pages (prefetch.js reopeners, so prefetching for the next
//   items warms that spread too; flow documents reopen at the same column, or
//   where the same stable page starts when the layout has changed),
//   with a chip in the header: "Resumed at p. 47 · last read 2 days ago ·
//   ⟲ start t". t (or the chip) goes to the first page; Back returns.
// - The track under the pages shows what you have seen as a faint fill.
// - History (y): everything you have read, by day, with time spent, progress
//   and the last page; Enter or a click resumes. Export as JSON or CSV.
// - For other modules (wall and library tiles): progressOf(id), memoryOf(id),
//   and the 'memory:updated' {id} event.
//
// Nothing here is on the way to a page: item:shown and spread:rendered only
// start a visit and place the chip; the rest waits for the settled events, a
// 1 s tick, or idle time. Telemetry (features/telemetry.js) keeps the raw
// event log; this is the per-item state, stored once, on the server.
import { $, h, on, emit, sleep, toast, registerView, keyHelp } from '../util.js';
import { items, byId, LANES, LANE_COLORS } from '../corpus.js';
import { state, current } from '../state.js';
import { isFlow } from '../docs.js';
import { startOf, reopeners } from '../prefetch.js';
import { goPage, jumpTo } from '../nav.js';
import { setView } from '../chrome.js';
import { live, vpToCol } from '../flow.js';

const SEEN_MS = 1200;      // a spread on screen this long (active) counts its pages as seen
const SEQ_MS = 500;        // shorter stops are not worth a place in the reading path
const IDLE_MS = 60e3;      // no input for this long: not reading (unless reading aloud)
const SPLIT_MS = 10 * 60e3; // a gap this long starts a new visit
const BEAT_MS = 30e3;      // resend the open visit this often, so a crash loses little
const RESUME_FROM = { page: 4, flow: 3 }; // resume only past the first few pages

// ---------- the memory ----------
// id -> the server's brief record (server/routes/45-memory.mjs brief()), kept
// current here as you read: {first, last, a, nv, far, sc, n?, f?, k?, c?, col?, g?, at?, seen?, saved?, less?, more?, ti?}
const mem = new Map();
const blank = () => ({ first: Date.now(), last: Date.now(), a: 0, nv: 0, far: -1, sc: 0 });
const rec = (id) => { let r = mem.get(id); if (!r) mem.set(id, (r = blank())); return r; };

/** Add pages a..b to sorted, disjoint ranges. */
function addRange(rs = [], a, b) {
  const out = []; let placed = false;
  for (const [x, y] of rs) {
    if (y < a - 1) out.push([x, y]);
    else if (x > b + 1) { if (!placed) { out.push([a, b]); placed = true; } out.push([x, y]); }
    else { a = Math.min(a, x); b = Math.max(b, y); }
  }
  if (!placed) out.push([a, b]);
  return out;
}
const countRanges = (rs = []) => rs.reduce((s, [a, b]) => s + b - a + 1, 0);

const loaded = fetch('/memory').then((r) => r.json()).then(({ items: all = {} }) => {
  for (const [id, b] of Object.entries(all)) {
    const loc = mem.get(id);
    if (!loc) { mem.set(id, b); continue; }
    // Read before the load finished (a slow start): add what this session did to what was stored.
    let seen = b.seen || [];
    for (const [x, y] of loc.seen || []) seen = addRange(seen, x, y);
    mem.set(id, { ...b, ...loc, first: Math.min(b.first, loc.first), a: b.a + loc.a, nv: b.nv + loc.nv, far: Math.max(b.far, loc.far), seen, sc: countRanges(seen), saved: loc.saved ?? b.saved });
  }
}).catch(() => {});
// The first item should open where you left it, but a slow server never holds up the start.
await Promise.race([loaded, sleep(400)]);

/** For wall and library tiles: how far you got, or null for an item never opened. */
export function progressOf(id) {
  const r = mem.get(id); if (!r) return null;
  const n = r.n || 0;
  return { seen: r.sc || 0, n, frac: n ? Math.min(1, (r.sc || 0) / n) : 0, far: r.far, at: r.k ?? null, flow: !!r.f,
    last: r.last, ms: r.a, visits: r.nv, saved: !!r.saved, done: finished(r) };
}
/** The brief record (see above), or null. */
export const memoryOf = (id) => mem.get(id) || null;
const finished = (r) => !!r.n && (r.far >= r.n - 1 || (r.sc || 0) >= r.n * 0.9);

// ---------- sending ----------
let ops = [];
const op = (o, id, x) => ops.push({ o, id, t: Date.now(), ...x });
function flush(beacon = false) {
  if (!ops.length) return;
  const batch = ops; ops = [];
  const body = JSON.stringify({ ops: batch });
  if (beacon && navigator.sendBeacon && navigator.sendBeacon('/memory', new Blob([body], { type: 'text/plain' }))) return;
  fetch('/memory', { method: 'POST', body, keepalive: body.length < 60e3 })
    .then((r) => { if (!r.ok) throw new Error(r.status); })
    .catch(() => { ops = batch.concat(ops).slice(-5000); }); // server down: try again later
}
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 50));
setInterval(() => { if (ops.length) idle(() => flush()); }, 5000);

// ---------- activity ----------
let lastInput = Date.now();
for (const ev of ['keydown', 'wheel', 'pointermove', 'pointerdown', 'touchstart']) addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true });
const aloud = () => !!document.querySelector('#ra-bar.playing') || !!window.speechSynthesis?.speaking;
const active = () => !document.hidden && state.view === 'feed' && (Date.now() - lastInput < IDLE_MS || aloud());

// ---------- visits and spreads ----------
let visit = null;  // { id, i, s, a, last (last active, ms), settled, sent, sentAt }
let spread = null; // { id, k, c, s, ms, seen }
const newVisit = (i, settled) => ({ id: items[i].id, i, s: Date.now(), t0: performance.now(), a: 0, last: Date.now(), settled, sent: false, sentAt: 0, via: reached() });

// How a visit ended (x) and how it was reached (via), from the last 'nav:before' label
// (the learning model weighs a quick exit by them: server/learn.mjs). The first label
// of a synchronous burst wins: 'less like this' is followed at once by go()'s 'next item'.
const EXIT = { 'next item': 'next', 'previous item': 'prev', 'less like this': 'less', 'more like this': 'more',
  'open item': 'jump', 'browse results': 'jump', 'stay in': 'jump', 'leave stack': 'jump', 'link jump': 'jump', 'lane switch': 'lane' };
let lastBefore = null, burst = false;
const recent = () => (lastBefore && Date.now() - lastBefore.t < 2000 ? lastBefore.label : null);
const exitMove = () => EXIT[recent()] || 'next';
const reached = () => (EXIT[recent()] === 'jump' ? 'jump' : 'feed');

function sendVisit(x) {
  const v = visit; if (!v?.settled) return;
  const it = items[v.i], r = rec(v.id);
  op('visit', v.id, { s: v.s, e: Math.max(v.s, v.last), a: Math.round(v.a), ...(v.sent ? {} : { ti: it.t, lane: it.lane, kind: it.kind, via: v.via || 'feed' }), ...(x ? { x } : {}) });
  if (!v.sent) { r.nv++; r.ti ||= it.t; }
  v.sent = true; v.sentAt = Date.now();
  r.last = Math.max(r.last, v.last);
}
function sendSpread() {
  const p = spread; if (!p || (p.ms < SEQ_MS && !p.seen)) return;
  op('saw', p.id, { k: p.k, c: p.c, s: p.s, ms: Math.round(p.ms), seen: p.seen ? 1 : 0 });
}
const endSpread = () => { sendSpread(); spread = null; };
function endVisit(x) { endSpread(); sendVisit(x); visit = null; }

function markSeen() {
  const p = spread; p.seen = true;
  const r = rec(p.id);
  r.seen = addRange(r.seen, p.k, p.k + p.c - 1); r.sc = countRanges(r.seen); r.far = Math.max(r.far, p.k + p.c - 1);
  sendSpread();
  const i = current();
  if (items[i]?.id === p.id) paintSeen(p.id, items[i].n || r.n);
  emit('memory:updated', { id: p.id });
}

let tickAt = performance.now();
setInterval(() => {
  const now = performance.now(), dt = Math.min(2000, now - tickAt); tickAt = now;
  if (!visit || !active()) return;
  // Back after a long gap (the window hidden, or away from the keyboard): a new visit.
  if (Date.now() - visit.last > SPLIT_MS) { const i = visit.i; endSpread(); sendVisit(); visit = newVisit(i, true); }
  visit.last = Date.now();
  const va = Math.min(dt, now - visit.t0); // a tick counts only the time since the visit or spread began
  visit.a += va;
  if (visit.settled) rec(visit.id).a += va;
  if (spread?.id === visit.id) { spread.ms += Math.min(dt, now - spread.t0); if (!spread.seen && spread.ms >= SEEN_MS) markSeen(); }
  if (visit.settled && Date.now() - visit.sentAt > BEAT_MS) sendVisit();
}, 1000);

on('item:shown', ({ i, it }) => {
  endVisit(exitMove());
  visit = newVisit(i, false);
  resumeChip(i, it);
  paintSeen(it.id, it.n || mem.get(it.id)?.n);
});
// A visit counts once you stop on the item (skipping through items is not visiting them).
on('item:settled', ({ it }) => { if (visit?.id === it.id && !visit.settled) { visit.settled = true; sendVisit(); } });

/** The pages on screen: rasters from the panels, flow documents from the columns (as stable pages). */
function onScreen({ s, els, flow, it }) {
  if (flow) {
    const e = Math.min(flow.n - 1, s + flow.g.cols - 1);
    const a = flow.first[s] ?? flow.running[s] ?? 0, b = Math.max(a, flow.running[e] ?? a);
    return { k: a, c: b - a + 1, n: flow.d?.n || it.n || 0, col: s, g: flow.g.key, lay: { cols: flow.g.cols, font: flow.g.font, z: state.zoom ? 1 : 0 } };
  }
  const ks = [...new Set((els || []).map((e) => Number(e.dataset?.k)).filter((k) => Number.isFinite(k)))];
  const k = ks.length ? Math.min(...ks) : s;
  return { k, c: Math.max(1, ks.length ? Math.max(...ks) - k + 1 : 1), n: it.n || 0, lay: { per: ks.length || 1, z: state.zoom ? 1 : 0, crop: state.crop ? 1 : 0, split: state.cols ? 1 : 0 } };
}
on('spread:settled', (d) => {
  if (state.view !== 'feed' || !visit || visit.id !== d.it.id) return;
  if (!visit.settled && visit.ret) { visit.settled = true; sendVisit(); }
  const p = onScreen(d);
  if (spread?.id === d.it.id && spread.k === p.k && spread.c === p.c) return; // the same pages, laid out again
  endSpread();
  spread = { id: d.it.id, k: p.k, c: p.c, s: Date.now(), t0: performance.now(), ms: 0, seen: false };
  const f = d.flow ? 1 : 0;
  op('at', d.it.id, { k: p.k, c: p.c, n: p.n, f, ...(f ? { col: p.col, g: p.g } : {}), lay: p.lay });
  const r = rec(d.it.id);
  Object.assign(r, { k: p.k, c: p.c, at: Date.now(), last: Date.now(), f, far: Math.max(r.far, p.k + p.c - 1) });
  if (p.n) r.n = p.n;
  if (f) { r.col = p.col; r.g = p.g; } else { delete r.col; delete r.g; }
  paintSeen(d.it.id, p.n);
  emit('memory:updated', { id: d.it.id });
});

// Leaving the feed ends the visit; coming back starts one when the pages settle.
on('view:changed', ({ view }) => {
  if (view !== 'feed') { endVisit('view'); hideChip(); flush(); return; }
  const i = current();
  if (i != null && visit?.id !== items[i].id) { endVisit(); visit = { ...newVisit(i, false), ret: true }; }
});
// Hidden or closed: send what we have (the visit goes on if you come back soon).
const save = () => { sendSpread(); sendVisit(); flush(true); };
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);

// Judgments, from nav.js's 'nav:before' labels.
const JUDGE = { save: 'save', unsave: 'unsave', 'less like this': 'less', 'more like this': 'more' };
function judge(i, j) {
  const id = items[i].id, r = rec(id);
  op('judge', id, { j });
  if (j === 'save') r.saved = 1; else if (j === 'unsave') delete r.saved;
  else if (j === 'unless') delete r.less; else if (j === 'unmore') delete r.more; else r[j] = Date.now();
  emit('memory:updated', { id });
}
on('nav:before', ({ label, i }) => {
  if (!burst) { lastBefore = { label, t: Date.now() }; burst = true; queueMicrotask(() => { burst = false; }); }
  const j = JUDGE[label]; if (!j || i == null) return;
  judge(i, j);
});
// Back undid a judgment: retract it (the server replays jl, so 'unless' cancels 'less').
const RETRACT = { save: 'unsave', unsave: 'save', 'less like this': 'unless', 'more like this': 'unmore' };
on('nav', (d) => { if (d.type === 'back' && RETRACT[d.undone] && d.i != null && items[d.i]) judge(d.i, RETRACT[d.undone]); });

// ---------- resume ----------
// prefetch.js asks where an item opens when nothing has placed it this session.
let bypass = false;
function resumeAt(i, it, r) {
  if (!r || r.k == null || !!r.f !== isFlow(it)) return null; // a PDF read as HTML (webview H) has other units
  if (r.f) return r.k >= RESUME_FROM.flow ? r.k : null;
  if (r.k < RESUME_FROM.page || (it.n && r.k >= it.n)) return null;
  return r.k;
}
reopeners.push((i, it) => {
  if (bypass) return null;
  const r = mem.get(it.id), k = resumeAt(i, it, r);
  if (k == null || !r.f) return k; // a page
  // A flow document: flow.js asks once its columns are measured. The same layout as last
  // time (screen, text size): the very column; otherwise where that stable page starts.
  if (live?.id !== it.id) return null;
  return r.g === live.g.key && r.col != null ? r.col : vpToCol(k);
});
/** Where the item would open without its memory. */
function defaultStart(i) { bypass = true; try { return startOf(i); } finally { bypass = false; } }

// The chip: shown while you are still on the spread it reopened at.
const chipEl = h('span', { className: 'mem-chip', role: 'status' });
let chip = null; // { id, s (the start it opened at, once rendered), k }
function resumeChip(i, it) {
  chip = null;
  const r = mem.get(it.id), k = resumeAt(i, it, r);
  if (k == null) return;
  // Placed this session: only when it is still where you left it, and you were away a while
  // (flipping j/k is not coming back). Not placed: it opens at k, unless that is where it opens anyway.
  if (state.start.has(i) ? state.start.get(i) !== (r.f ? r.col : r.k) || Date.now() - r.last < 120e3 : !r.f && defaultStart(i) === k) return;
  chip = { id: it.id, s: null, k };
  chipEl.replaceChildren(
    h('span', { textContent: `Resumed at p. ${k + 1}` }),
    h('span', { className: 'mem-dim', textContent: `· last read ${ago(r.last)} ·` }),
    h('button', { className: 'mem-start', title: 'Go to the first page (t); Back returns here', onclick: toStart }, '⟲ start ', h('kbd', { textContent: 't' })));
  chipEl.title = progressLine(r);
  placeChip();
}
function placeChip() {
  const head = $('#item-head'); if (!head || chipEl.parentNode === head) return;
  head.insertBefore(chipEl, $('#pos', head));
}
function hideChip() { chip = null; chipEl.remove(); }
const toStart = () => goPage(0); // the 'nav' listener below says how to come back
// t already goes to the first page (nav.js); note when it leaves a resumed spread.
on('nav', ({ type, k }) => { if (type === 'page' && k === 0 && chip?.s != null) { const kk = chip.k; hideChip(); toast('First page', 2200, { icon: 'arrow-up-to-line', sub: `Backspace returns to p. ${kk + 1}` }); } });
on('spread:rendered', ({ it, s }) => {
  if (!chip) return;
  if (chip.id !== it.id) { hideChip(); return; }
  if (chip.s == null) chip.s = s;
  if (s !== chip.s) { hideChip(); return; } // moved on: the chip has done its job
  placeChip(); // paintHead rebuilt the header
});

// ---------- the track: pages seen ----------
const seenEl = h('div', { className: 'tr-seen' });
{ const bar = $('#track .tr-bar'); bar?.insertBefore(seenEl, bar.querySelector('.tr-fill')); } // above feed.js's 'ready' band, under the bright part
/** Seen ranges merged to what the bar can show, as a gradient under the bright part. */
function seenGradient(rs, n, color) {
  if (!rs?.length || !n) return 'none';
  const pc = (x) => (Math.min(100, (100 * x) / n)).toFixed(2) + '%';
  const gap = n / 400; const parts = []; let prev = 0;
  const merged = [];
  for (const [a, b] of rs) { const m = merged.at(-1); if (m && a - m[1] - 1 <= gap) m[1] = b; else merged.push([a, b]); }
  for (const [a, b] of merged) { parts.push(`transparent ${pc(prev)} ${pc(a)}`, `${color} ${pc(a)} ${pc(b + 1)}`); prev = b + 1; }
  parts.push(`transparent ${pc(prev)} 100%`);
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}
let seenKey = '';
function paintSeen(id, n) {
  const r = mem.get(id);
  const key = `${id}|${n}|${r?.sc}|${r?.seen?.length}`;
  if (key === seenKey) return;
  seenKey = key;
  seenEl.style.background = seenGradient(r?.seen, n, 'var(--mem-seen)');
}

// ---------- formatting ----------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const midnight = (t) => new Date(t).setHours(0, 0, 0, 0);
const daysAgo = (t) => Math.round((midnight(Date.now()) - midnight(t)) / 864e5);
const dateStr = (t) => { const d = new Date(t); return `${MONTHS[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : ''}`; };
const clock = (t) => { const d = new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
function ago(t) {
  const s = (Date.now() - t) / 1000, d = daysAgo(t);
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (d === 0) return `${Math.round(s / 3600)} h ago`;
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  return 'on ' + dateStr(t);
}
function dur(ms) {
  if (!ms) return '–';
  if (ms < 60e3) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const m = Math.round(ms / 60e3);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}
function dayLabel(t) {
  const d = daysAgo(t);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  const w = new Date(t).toLocaleDateString('en', { weekday: 'long' });
  return d < 7 ? `${w}, ${dateStr(t)}` : dateStr(t);
}
const progressLine = (r) => [r.n ? `${r.sc || 0} of ${r.n} pages seen` : null, r.a ? `${dur(r.a)} read` : null, r.nv ? `${r.nv} visit${r.nv === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ');

// ---------- History ----------
const root = h('section', { id: 'history', hidden: true });
$('#main').append(root);
const H = { filter: '', tab: 'all', brief: false, hidden: 0, rows: [], shown: 0, sel: -1, days: {}, io: null };
const BRIEF_MS = 10e3; // less reading than this, and no judgment: a brief look, hidden unless asked for
const briefLook = (r, id) => (r.a || 0) < BRIEF_MS && !r.saved && !r.more && !r.less && !state.saved.includes(id);
const TABS = { all: 'All', reading: 'In progress', done: 'Finished', saved: 'Saved' };

function entries() {
  const q = H.filter.trim().toLowerCase();
  const out = []; H.hidden = 0;
  for (const [id, r] of mem) {
    const i = byId.get(id), it = i != null ? items[i] : null;
    if (!r.last) continue;
    if (H.tab === 'reading' && (finished(r) || r.k == null)) continue;
    if (H.tab === 'done' && !finished(r)) continue;
    if (H.tab === 'saved' && !(r.saved || (it && state.saved.includes(id)))) continue;
    if (q && !`${it?.t || r.ti || id} ${it?.a || ''}`.toLowerCase().includes(q)) continue;
    if (!H.brief && !q && briefLook(r, id)) { H.hidden++; continue; }
    out.push({ id, r, i, it });
  }
  return out.sort((a, b) => b.r.last - a.r.last);
}

function row(e) {
  const { id, r, i, it } = e;
  const n = r.n || it?.n || 0;
  const frac = n ? Math.min(1, (r.sc || 0) / n) : 0;
  const bar = h('div', { className: 'hy-bar', title: n ? `${r.sc || 0} of ${n} ${r.f ? 'stable pages' : 'pages'} seen${r.far >= 0 ? ` · furthest p. ${r.far + 1}` : ''}` : 'not opened far enough to know its length' });
  if (n && r.seen) bar.style.backgroundImage = seenGradient(r.seen, n, 'var(--mem-bar)');
  if (n && r.k != null) bar.append(h('b', { style: `left:${Math.min(100, (100 * (r.k + 0.5)) / n)}%` }));
  const marks = [r.saved || state.saved.includes(id) ? h('span', { className: 'hy-j star', textContent: '★', title: 'saved' }) : null,
    r.more ? h('span', { className: 'hy-j', textContent: '+', title: 'more like this' }) : null,
    r.less ? h('span', { className: 'hy-j less', textContent: '−', title: 'less like this' }) : null];
  const el = h('div', { className: 'hy-row' + (i == null ? ' gone' : '') + (finished(r) ? ' done' : ''), tabIndex: 0 },
    h('i', { className: 'hy-dot', style: `--c:${LANE_COLORS[it?.lane || r.lane] || '#7a6f60'}`, title: LANES[it?.lane] || '' }),
    h('div', { className: 'hy-main' },
      h('div', { className: 'hy-t', textContent: it?.t || r.ti || id }),
      h('div', { className: 'hy-sub' }, ...marks, h('span', { textContent: [it?.a, LANES[it?.lane] || it?.lane, r.nv > 1 ? `${r.nv} visits` : null].filter(Boolean).join(' · ') }))),
    h('div', { className: 'hy-prog' }, bar, h('span', { className: 'hy-n', textContent: n ? (finished(r) ? 'done' : `${Math.round(frac * 100)}%`) : '' })),
    h('div', { className: 'hy-at', textContent: r.k != null ? `p. ${r.k + 1}${n ? ` / ${n}` : ''}` : '–' }),
    h('div', { className: 'hy-time', textContent: dur(r.a), title: 'active reading time' }),
    h('div', { className: 'hy-when', textContent: daysAgo(r.last) < 2 ? clock(r.last) : ago(r.last), title: new Date(r.last).toLocaleString() }));
  el.dataset.id = id;
  if (i != null) el.onclick = () => openRow(e);
  return el;
}
function openRow(e) {
  if (e.i == null) return;
  if (current() === e.i) { setView('feed'); return; }
  jumpTo(e.i); // opens where you left it (the reopeners hook)
}

function paintHistory() {
  const all = entries();
  H.rows = all; H.shown = 0; H.sel = -1;
  const total = [...mem.values()].reduce((s, r) => s + (r.a || 0), 0);
  const since = Math.min(...[...mem.values()].map((r) => r.first || Infinity));
  const head = h('div', { className: 'hy-head' },
    h('h2', { textContent: 'History' }),
    h('span', { className: 'hy-sum', textContent: mem.size ? `${mem.size} items · ${dur(total)} read${Number.isFinite(since) ? ` since ${dateStr(since)}` : ''}` : '' }),
    H.hidden || H.brief ? h('button', { className: 'hy-brief' + (H.brief ? ' on' : ''), title: `Items you looked at for less than ${BRIEF_MS / 1000} s`,
      textContent: H.brief ? 'hide brief looks' : `+ ${H.hidden} brief look${H.hidden === 1 ? '' : 's'}`, onclick: () => { H.brief = !H.brief; paintHistory(); } }) : null,
    h('div', { className: 'hy-tabs' }, ...Object.entries(TABS).map(([k, label]) => h('button', { className: H.tab === k ? 'on' : '', textContent: label, onclick: () => { H.tab = k; paintHistory(); } }))),
    h('input', { className: 'hy-filter', type: 'search', placeholder: 'Filter by title or author', value: H.filter, spellcheck: false,
      oninput: (ev) => { H.filter = ev.target.value; const pos = ev.target.selectionStart; paintHistory(); const f = $('.hy-filter', root); f.focus(); f.setSelectionRange(pos, pos); } }),
    h('span', { className: 'hy-exp' }, 'Export ',
      h('a', { href: '/memory/export.json', title: 'Everything: visits, pages in order, positions, judgments', textContent: 'JSON' }), ' · ',
      h('a', { href: '/memory/export.csv', title: 'One row per item', textContent: 'CSV' }), ' ',
      h('a', { href: '/memory/export.csv?rows=visits', className: 'hy-x', title: 'One row per visit', textContent: 'visits' }), ' ',
      h('a', { href: '/memory/export.csv?rows=pages', className: 'hy-x', title: 'One row per spread, in reading order', textContent: 'pages' })));
  const list = h('div', { className: 'hy-list' });
  const more = h('div', { className: 'hy-more' });
  const empty = !all.length ? h('p', { className: 'hy-empty', textContent: mem.size ? 'Nothing matches.' : 'Nothing read yet. Items you stop on show up here, with where you left them.' }) : null;
  root.replaceChildren(h('div', { className: 'hy' }, head, empty, list, more));
  H.list = list;
  H.io?.disconnect();
  H.io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) addRows(150); }, { root, rootMargin: '600px' });
  addRows(120);
  H.io.observe(more);
}
function addRows(n) {
  const frag = document.createDocumentFragment();
  let lastDay = H.shown ? midnight(H.rows[H.shown - 1].r.last) : null;
  for (const e of H.rows.slice(H.shown, H.shown + n)) {
    const d = midnight(e.r.last);
    if (d !== lastDay) {
      lastDay = d;
      const key = new Date(d); const k = `${key.getFullYear()}-${String(key.getMonth() + 1).padStart(2, '0')}-${String(key.getDate()).padStart(2, '0')}`;
      const dt = h('span', { className: 'hy-dt', textContent: H.days[k] ? `${dur(H.days[k])} read` : '' });
      dt.dataset.day = k;
      frag.append(h('h3', { className: 'hy-day' }, dayLabel(d), dt));
    }
    frag.append(row(e));
  }
  H.shown = Math.min(H.rows.length, H.shown + n);
  H.list.append(frag);
}
// Day totals (active time, by visit) come from the server; painted when they arrive.
function paintDays() {
  fetch('/memory/days').then((r) => r.json()).then(({ days }) => {
    H.days = days || {};
    for (const el of root.querySelectorAll('.hy-dt')) { const ms = H.days[el.dataset.day]; el.textContent = ms ? `${dur(ms)} read` : ''; }
  }).catch(() => {});
}
function showHistory() {
  sendVisit(); // what you just read is in the list
  paintHistory(); paintDays();
  root.scrollTop = 0;
  requestAnimationFrame(() => focusRow(0));
}
function focusRow(j) {
  const rows = root.querySelectorAll('.hy-row');
  if (!rows.length) return;
  H.sel = Math.max(0, Math.min(rows.length - 1, j));
  rows[H.sel].focus({ preventScroll: true });
  rows[H.sel].scrollIntoView({ block: 'nearest' });
  if (H.sel >= rows.length - 8 && H.shown < H.rows.length) addRows(150);
}
registerView('history', { label: 'History', key: 'y', order: 3, roots: () => [root], show: showHistory, hide() { H.io?.disconnect(); } });
keyHelp.push({ label: 'y', text: 'history: what you read, by day, with time and progress (Enter resumes; export JSON / CSV)', order: 64 });

// Keys in the History view (the global ones stay: / search, f feed, w wall, ? keys).
document.addEventListener('keydown', (e) => {
  if (state.view !== 'history' || e.metaKey || e.ctrlKey || e.altKey) return;
  const inFilter = e.target.classList?.contains('hy-filter');
  if (inFilter) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (H.filter) { H.filter = ''; paintHistory(); } else focusRow(0); }
    else if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); focusRow(0); }
    return;
  }
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const rows = () => root.querySelectorAll('.hy-row');
  const sel = () => { const j = [...rows()].indexOf(document.activeElement); return j >= 0 ? j : H.sel; };
  const act = {
    j: () => focusRow(sel() + 1), ArrowDown: () => focusRow(sel() + 1),
    k: () => focusRow(sel() - 1), ArrowUp: () => focusRow(sel() - 1),
    Home: () => focusRow(0), End: () => focusRow(1e9),
    Enter: () => rows()[sel()]?.click(), l: () => rows()[sel()]?.click(), ArrowRight: () => rows()[sel()]?.click(),
    Escape: () => setView('feed'),
  }[e.key];
  if (!act) return;
  e.preventDefault(); e.stopPropagation();
  if (!e.repeat || /^(j|k|Arrow)/.test(e.key)) act();
}, true);
