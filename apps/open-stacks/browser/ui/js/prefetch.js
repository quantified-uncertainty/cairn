// Prediction: what will the reader look at next? Render it in the browser
// now, and have the server fetch further ahead into its disk cache.
import { items } from './corpus.js';
import { state } from './state.js';
import { openDoc, isFlow, scanUrl } from './docs.js';
import { renderPage } from './render.js';

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

/** Where an item opens: where you left it, else its best page (enrichment), else a heuristic. */
export function startOf(i) {
  if (state.start.has(i)) return state.start.get(i);
  const it = items[i];
  if (isFlow(it)) return 0;
  if (Array.isArray(it.best) && it.best.length && (!it.n || it.best[0] < it.n)) return it.best[0];
  if (it.kind === 'scan') return Math.max(0, Math.min(Math.round(it.n * 0.08) + 3, it.n - state.per));
  if (it.kind === 'pdf' && it.n && (it.lane === 'ttrpg' || it.lane === 'textbooks' || it.n > 60)) return Math.min(Math.round(it.n * 0.05), it.n - 1);
  return 0;
}

export function planAround(i, s) {
  const it = items[i];
  const per = Math.max(1, state.shown || state.per);
  const { dir, v } = velocity();
  const tasks = [];
  const render = (ii, k, pri) => tasks.push({ key: `r|${items[ii].id}|${k}|${state.crop}|${state.cols}`, pri, fn: () => renderPage(items[ii], k) });
  const n = it.n || null;
  if (!isFlow(it)) {
    // Ahead in the direction you are paging; further the faster you go.
    const ahead = 2 + 2 * Math.min(v, 3);
    for (let d = 1; d <= ahead; d++) for (let j = 0; j < per; j++) {
      const k = s + dir * d * per + (dir > 0 ? j : -j - 1 + per);
      if (k >= 0 && (!n || k < n)) render(i, k, 90 - d * 4 - j * 0.1);
    }
    // One spread the other way, for a reversal.
    for (let j = 0; j < per; j++) { const k = s - dir * per + j; if (k >= 0 && (!n || k < n)) render(i, k, 78 - j * 0.1); }
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
    const s0 = startOf(ii);
    if (isFlow(x)) tasks.push({ key: `o|${x.id}`, pri: 66 - d * 5, fn: () => openDoc(x) });
    else if (x.kind === 'scan' || x.n) for (let j = 0; j < state.per; j++) render(ii, s0 + j, 65 - d * 5 - j * 0.1);
    // Not opened yet: open it, then render its first spread, so moving to it
    // shows decoded pages rather than a spinner.
    else tasks.push({ key: `o|${x.id}`, pri: 64 - d * 5, fn: async () => {
      const d2 = await openDoc(x); x.n ||= d2.n;
      const s1 = startOf(ii);
      for (let j = 0; j < state.per && s1 + j < x.n; j++) await renderPage(x, s1 + j);
    } });
  });
  plan(tasks);
  // The server works further ahead, into its disk cache, in priority bands:
  // sharp pages near you, then the next items' first spreads, then legible
  // mid-res pages a little further out, then thumbnails for the page strip.
  const near = [], mid = [], thumbs = [], nextItems = [];
  if (it.kind === 'scan') {
    const lo = Math.max(0, s - 2 * per), hi = Math.min(it.n, s + per * (6 + 4 * v));
    for (let k = lo; k < hi; k++) near.push(scanUrl(it, k, 1000));
    for (const b of (it.best || []).slice(0, 4)) for (let j = 0; j < per; j++) near.push(scanUrl(it, b + j, 1000));
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
