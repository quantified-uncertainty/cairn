// Prediction: what will the reader look at next? Render it in the browser
// now, and have the server fetch further ahead into its disk cache.
import { items } from './corpus.js';
import { state } from './state.js';
import { openDoc, peekDoc, isFlow, scanUrl } from './docs.js';
import { renderPage, SCAN_W, RENDER_H, serverRender, serverCount } from './render.js';
import { on } from './util.js';
import { profileOf, loadProfiles, snapStart, spreadAt, preloadSprite, cropKey } from './profile.js';

// A small client-side scheduler: tasks run 4 at a time, highest priority
// first, and every navigation replaces the plan with one centred on where
// you are now.
const sched = { q: new Map(), running: 0 };
export function plan(tasks) {
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
/** Prepared-ahead work queued or running (the benchmark waits for it to finish). */
export const schedBusy = () => sched.running + [...sched.q.values()].filter((t) => !t.started).length;
export function serverPrefetch(urls, pri, group) {
  if (urls.length) fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls, pri, group }) }).catch(() => {});
}

export function velocity() {
  const now = Date.now();
  state.turns = state.turns.filter((t) => now - t.at < 4000);
  const last = state.turns.at(-1);
  if (!last) return { dir: 1, v: 0 };
  return { dir: last.dir, v: state.turns.filter((t) => t.dir === last.dir).length };
}

export const randomTarget = new Map(); // item index -> next random start page, chosen in advance

/** Where an item reopens when nothing has placed it this session, in state.start units: hooks
 *  fn(i, it) → a page, or for a flow document a column (asked by flow.js once its layout is
 *  measured), or null. features/memory.js: where you left it. */
export const reopeners = [];
export function reopenAt(i, it = items[i]) { for (const fn of reopeners) { const k = fn(i, it); if (k != null) return k; } return null; }

/** Where an item opens: where you left it, else its best page (enrichment), else a heuristic. */
export function startOf(i) {
  if (state.start.has(i)) return state.start.get(i);
  const it = items[i];
  if (isFlow(it)) return 0;
  const back = reopenAt(i, it); if (back != null) return back;
  if (Array.isArray(it.best) && it.best.length && (!it.n || it.best[0] < it.n)) return it.best[0];
  // A profile knows where the front matter ends (feed.js snaps this to a spread).
  const pf = profileOf(it);
  if (pf?.ranges?.front && pf.ranges.body) return pf.ranges.body[0];
  if (it.kind === 'scan') return Math.max(0, Math.min(Math.round(it.n * 0.08) + 3, it.n - state.per));
  if (it.kind === 'pdf' && it.n && (it.lane === 'ttrpg' || it.lane === 'textbooks' || it.n > 60)) return Math.min(Math.round(it.n * 0.05), it.n - 1);
  return 0;
}

/** Pages of a scan on the server's disk at the size the feed reads: item id -> '0101…' (feed.js pollLoaded keeps it). */
export const onDisk = new Map();
const isOnDisk = (it, k) => onDisk.get(it.id)?.[k] === '1';

export function planAround(i, s) {
  const it = items[i];
  const per = Math.max(1, state.shown || state.per);
  const { dir, v } = velocity();
  const tasks = [];
  // A scan page not yet on the server's disk is only prepared here when it is
  // in the next two spreads: preparing it means a request that waits on the
  // Internet Archive (~1 s) and holds one of the browser's six connections to
  // the server, which a jump elsewhere then waits behind. The server fetches
  // the rest ('near' and 'mid' below), and the next plan prepares them once
  // they are on disk.
  const render = (ii, k, pri) => {
    if (ii === i && it.kind === 'scan' && pri < 80 && !isOnDisk(it, k)) return;
    tasks.push({ key: `r|${items[ii].id}|${k}|${state.crop}|${state.cols}`, pri, fn: () => renderPage(items[ii], k, { lane: 'near' }) });
  };
  const n = it.n || null;
  const pf = profileOf(it);
  if (!isFlow(it) && pf) {
    // With a profile, the spreads ahead are known exactly (blank pages and pages
    // shown alone included), so exactly their pages are prepared.
    const sp = state.zoom ? 1 : state.per;
    const ahead = 2 + 2 * Math.min(v, 3);
    const step = (a, d) => (d > 0 ? spreadAt(pf, a, sp).at(-1) + 1 : a > 0 ? snapStart(pf, a - 1, sp) : -1);
    let a = s;
    for (let d = 1; d <= ahead; d++) { a = step(a, dir); if (a < 0 || a >= pf.n) break; spreadAt(pf, a, sp).forEach((k, j) => render(i, k, 90 - d * 4 - j * 0.1)); }
    const b = step(s, -dir);
    if (b >= 0 && b < pf.n) spreadAt(pf, b, sp).forEach((k, j) => render(i, k, 78 - j * 0.1));
  } else if (!isFlow(it)) {
    // Ahead in the direction you are paging; further the faster you go.
    const ahead = 2 + 2 * Math.min(v, 3);
    for (let d = 1; d <= ahead; d++) for (let j = 0; j < per; j++) {
      const k = s + dir * d * per + (dir > 0 ? j : -j - 1 + per);
      if (k >= 0 && (!n || k < n)) render(i, k, 90 - d * 4 - j * 0.1);
    }
    // One spread the other way, for a reversal.
    for (let j = 0; j < per; j++) { const k = s - dir * per + j; if (k >= 0 && (!n || k < n)) render(i, k, 78 - j * 0.1); }
  }
  if (!isFlow(it)) {
    // The best pages and the random jump you have not made yet.
    if (n) {
      for (const b of (it.best || []).slice(0, 3)) for (let j = 0; j < per; j++) if (b + j < n) render(i, b + j, 72);
      if (!randomTarget.has(i)) randomTarget.set(i, Math.floor(Math.random() * Math.max(1, n - per)));
      for (let j = 0; j < per; j++) render(i, randomTarget.get(i) + j, 70);
    }
  }
  // The next items' first spreads.
  state.order.slice(state.pos + 1, state.pos + 4).forEach((ii, d) => {
    const x = items[ii];
    // A profile knows the page count: no need to open (parse) a PDF before
    // preparing its first spread, and with display images it is never opened.
    const px = profileOf(x);
    if (px && !x.n) x.n = px.n;
    const s0 = startOf(ii);
    if (isFlow(x)) tasks.push({ key: `o|${x.id}`, pri: 66 - d * 5, fn: () => openDoc(x) });
    else if (px) spreadAt(px, snapStart(px, Math.min(s0, px.n - 1), state.per), state.per).forEach((k, j) => render(ii, k, 65 - d * 5 - j * 0.1));
    else if (x.kind === 'scan' || x.n) for (let j = 0; j < state.per; j++) render(ii, s0 + j, 65 - d * 5 - j * 0.1);
    // Not opened yet: open it, then render its first spread, so moving to it
    // shows decoded pages rather than a spinner.
    // With the render server on, its page count stands in for the parse (server/routes/16-render.mjs).
    else tasks.push({ key: `o|${x.id}`, pri: 64 - d * 5, fn: async () => {
      if (!(await serverCount(x))) { const d2 = await openDoc(x); x.n ||= d2.n; }
      const s1 = startOf(ii);
      for (let j = 0; j < state.per && s1 + j < x.n; j++) await renderPage(x, s1 + j, { lane: 'near' });
    } });
  });
  plan(tasks);
  // The next items' profiles, in one request (when they arrive, 'profile:updated'
  // below plans again, so their first spreads are prepared the profile's way).
  loadProfiles(state.order.slice(state.pos + 1, state.pos + 11).map((ii) => items[ii]).filter((x) => x && !isFlow(x))).catch(() => {});
  // The server works further ahead, into its disk cache, in priority bands:
  // sharp pages near you, then the next few items' first spreads, then sharp
  // pages further out, then the later items. Once you stay on a scan, the
  // whole book follows behind these (feed.js warmBook).
  // An Internet Archive page costs ~0.6 s of the datanode's time whatever its
  // size (measured), so each page is fetched once, at w1000, and the smaller
  // sizes (the strip's w120, the track's w200, a w400) are served from it
  // (cache.mjs alias(); merge() folds queued small ones into it). Pages go in
  // the order you will reach them.
  const near = [], mid = [], nextItems = [], laterItems = [];
  if (it.kind === 'scan') {
    // From the spread on screen in the direction you are paging, then back the other way.
    const run = (to, w, ahead, back) => {
      const a = dir > 0 ? s : s + per - 1, b = dir > 0 ? s - 1 : s + per;
      for (let j = 0; j < ahead; j++) { const k = a + dir * j; if (k >= 0 && k < it.n) to.push(scanUrl(it, k, w)); }
      for (let j = 0; j < back; j++) { const k = b - dir * j; if (k >= 0 && k < it.n) to.push(scanUrl(it, k, w)); }
    };
    const ahead = per * (6 + 4 * v);
    run(near, SCAN_W, ahead, 2 * per);
    for (const b of (it.best || []).slice(0, 4)) for (let j = 0; j < per; j++) if (b + j < it.n) near.push(scanUrl(it, b + j, SCAN_W));
    if (randomTarget.has(i)) for (let j = 0; j < per; j++) if (randomTarget.get(i) + j < it.n) near.push(scanUrl(it, randomTarget.get(i) + j, SCAN_W));
    const have = new Set(near);
    const far = []; run(far, SCAN_W, Math.max(60, 2 * ahead), 10);
    for (const u of far) if (!have.has(u)) mid.push(u);
  }
  state.order.slice(state.pos + 1, state.pos + 25).forEach((ii, d) => {
    const x = items[ii], to = d < 4 ? nextItems : laterItems;
    if (x.kind === 'scan') { const s0 = startOf(ii) ?? 0; for (let j = 0; j < state.per; j++) to.push(scanUrl(x, s0 + j, SCAN_W)); } else to.push(x.url);
  });
  serverPrefetch(near, 60, 'near');
  serverPrefetch(nextItems, 55, 'next-items');
  serverPrefetch(mid, 40, 'mid');
  serverPrefetch(laterItems, 35, 'later-items');
  sendHint();
}

// The render server works ahead of the reader (server/render.mjs): where you are and the next PDFs
// in the stack, sent as a hint that replaces its plan, at most every 150 ms while you move. Its reply
// carries page counts of PDFs on its disk, so they need no pdf.js parse to be shown.
on('render:ready', () => sendHint());
const isWebPdf = (x) => x && x.kind === 'pdf' && /^https?:\/\//.test(x.url || '');
let hintT = null;
export function sendHint() {
  if (!serverRender.on) return;
  clearTimeout(hintT);
  hintT = setTimeout(() => {
    const i = state.order[state.pos], it = items[i];
    if (!it || state.view !== 'feed') return;
    const open = isWebPdf(it) ? { u: it.url, k: state.start.get(i) ?? startOf(i), n: it.n || undefined, per: Math.max(1, state.shown || state.per) } : null;
    const next = [], byUrl = new Map();
    for (const ii of state.order.slice(state.pos + 1, state.pos + 13)) { const x = items[ii]; if (!isWebPdf(x)) continue; next.push({ u: x.url, k: startOf(ii) }); byUrl.set(x.url, x); }
    if (open) byUrl.set(it.url, it);
    fetch('/render/hint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ open, next, w: RENDER_H }) })
      .then((r) => r.json()).then((j) => { for (const [u, n] of Object.entries(j.n || {})) { const x = byUrl.get(u); if (x && n > 0) x.n ||= n; } })
      .catch(() => {});
  }, 150);
}

// The profile of the current item, or of one of the next three, arrived or
// changed how it crops: prepare those pages again (renders are keyed by the
// crop, so what was prepared before would not be found).
let planned = new Map(); // id -> cropKey last planned with
let replanT = null;
on('profile:updated', ({ id, profile }) => {
  const i = state.order[state.pos]; const it = items[i];
  if (!it || state.view !== 'feed') return;
  if (it.id !== id && !state.order.slice(state.pos + 1, state.pos + 4).some((ii) => items[ii]?.id === id)) return;
  const ck = cropKey(profile);
  if (planned.get(id) === ck) return;
  planned.set(id, ck); if (planned.size > 50) planned = new Map([...planned].slice(-25));
  clearTimeout(replanT);
  replanT = setTimeout(() => { if (state.order[state.pos] === i) planAround(i, state.start.get(i) ?? 0); }, 50);
});
// Settled on an item with a profile: its sprite comes in (one small image), and
// a PDF shown from display images is opened in idle time, so the first turn past
// them does not wait for a parse.
on('item:settled', ({ it }) => {
  const pf = profileOf(it); if (!pf) return;
  preloadSprite(pf);
  const open = () => { if (items[state.order[state.pos]] === it) openDoc(it).catch(() => {}); };
  if (it.kind === 'pdf' && !peekDoc(it)) { if (window.requestIdleCallback) requestIdleCallback(open, { timeout: 3000 }); else setTimeout(open, 500); }
});
