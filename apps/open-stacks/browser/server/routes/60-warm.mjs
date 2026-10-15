// Warm-up: a few seconds after the server starts, quietly fetch the first
// spreads of every item at low priority, so whatever you open is already on disk:
// first the next 80 items of the stack you are walking ('ahead' in the hint),
// then every lane in its own order. Capped by STACKS_WARM_MB (default 3000; 0
// turns it off) and by the room left under STACKS_CACHE_MAX.
//
// The ranking follows the reader's own feed when the UI has sent a hint
// (POST /warm/hint, from ui/js/features/telemetry.js: per lane, the first
// items in the order the reader will actually see them, with start pages);
// otherwise popularity and enrichment relevance.
//
// Also: cache size and warm-up progress in /status, and POST /warm/check,
// which warm.mjs uses to follow an overnight fill sent through /prefetch.
//
// planWarm() and fill() are shared with warm.mjs; this module must not
// import cache.mjs itself (warm.mjs may talk to a running server instead).
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { HERE, CACHE } from '../config.mjs';

const MB = 1024 * 1024;
const PER = 3; // pages per spread, as in the UI's default
const HINT = join(CACHE, 'warm-hint.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const scanUrl = (it, k, w) => `https://archive.org/download/${it.ia}/page/n${k}_w${w}.jpg`;
const coverUrl = (it) => `https://archive.org/services/img/${it.ia}`;

/** corpus.json with enrich.json merged in. */
export function loadCorpus() {
  const { items = [] } = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
  try {
    const e = JSON.parse(readFileSync(join(HERE, 'enrich.json'), 'utf-8')).items || {};
    for (const it of items) if (e[it.id]) Object.assign(it, e[it.id]);
  } catch { /* no enrichment */ }
  return items;
}

// Where an item opens, as ui/js/prefetch.js startOf() decides for a first visit.
export function startOf(it, per = PER) {
  if (Array.isArray(it.best) && it.best.length && (!it.n || it.best[0] < it.n)) return it.best[0];
  if (it.kind === 'scan') return Math.max(0, Math.min(Math.round(it.n * 0.08) + 3, it.n - per));
  if (it.kind === 'pdf' && it.n && (it.lane === 'ttrpg' || it.lane === 'textbooks' || it.n > 60)) return Math.min(Math.round(it.n * 0.05), it.n - 1);
  return 0;
}

/**
 * The URLs to warm, best first, round-robin across lanes so a byte budget is
 * shared fairly. Scans: the cover, then `pages` pages from the start page at
 * each width. Everything else: the document URL. Light things (covers, w400
 * pages the feed paints first, posts) for every item come before heavy ones
 * (sharp pages, PDFs), so a small budget still touches every item.
 */
export function planWarm({ lanes = null, items: perLane = 20, pages = PER, widths = [200, 1000], thumbs = false, covers = true, hint = readHint() } = {}) {
  // What the reader will see next ('ahead' in the hint), whole, before anything else.
  const first = [];
  const all = loadCorpus();
  const byId = new Map(all.map((it) => [it.id, it]));
  const laneMax = {};
  for (const it of all) laneMax[it.lane] = Math.max(laneMax[it.lane] || 1, it.score || 0);
  const rank = (it) => 0.8 * Math.log(1 + (it.score || 0)) / Math.log(1 + laneMax[it.lane]) + 0.8 * ((it.rel ?? 0.5) - 0.5);
  const lists = {};
  for (const it of all) if (!lanes || lanes.includes(it.lane)) (lists[it.lane] ||= []).push(it);
  for (const [lane, list] of Object.entries(lists)) {
    list.sort((a, b) => rank(b) - rank(a));
    // The reader's actual order first, then the rest by popularity.
    const h = hint?.lanes?.[lane];
    if (h?.length) {
      const first = h.map(([id, s, per]) => byId.has(id) && { ...byId.get(id), _s: s, _per: per }).filter(Boolean);
      const seen = new Set(first.map((x) => x.id));
      lists[lane] = first.concat(list.filter((x) => !seen.has(x.id)));
    }
    lists[lane] = lists[lane].slice(0, perLane);
  }
  const light = [], heavy = [];
  const add = (it, L, H) => {
    if (it.kind === 'scan' && it.ia && it.n) {
      if (covers) L.push(coverUrl(it));
      const s = Math.max(0, Math.min(it._s ?? startOf(it), it.n - 1));
      const np = Math.max(pages, it._per || 0);
      for (const w of widths) for (let k = s; k < Math.min(it.n, s + np); k++) (w <= 400 ? L : H).push(scanUrl(it, k, w));
      if (thumbs) for (let k = 0; k < it.n; k++) L.push(scanUrl(it, k, 120));
    } else if (it.url) (it.kind === 'pdf' ? H : L).push(it.url);
  };
  for (const [id, s, per] of Array.isArray(hint?.ahead) ? hint.ahead : []) {
    const it = byId.get(id); if (!it || (lanes && !lanes.includes(it.lane))) continue;
    add({ ...it, _s: s, _per: per }, first, first);
  }
  const order = Object.keys(lists);
  for (let r = 0; r < perLane; r++) for (const lane of order) {
    const it = lists[lane][r]; if (!it) continue;
    add(it, light, heavy);
  }
  return [...new Set(first.concat(light, heavy))];
}
function readHint() { try { return JSON.parse(readFileSync(HINT, 'utf-8')); } catch { return null; } }

/**
 * Keep a sliding window of URLs in the prefetch queue (so one slow host does
 * not hold up the rest) until all are done or `budget` new bytes have
 * arrived. `enqueue(urls)` replaces the group's queued URLs; `check(urls)`
 * returns cache.inspect(urls). Both are local calls or HTTP calls.
 */
export async function fill(urls, { enqueue, check, budget = Infinity, window = 12, poll = 500, onProgress = () => {}, stop = () => false }) {
  const p = { total: urls.length, done: 0, had: 0, fetched: 0, failed: 0, bytes: 0, t0: Date.now() };
  let i = 0, win = [], cut = false;
  const recent = []; // sizes of the last few fetches
  while (!stop()) {
    // Top up the window; what is already cached counts as done straight away.
    // Near the budget, narrow it so the requests in flight do not overshoot much.
    const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const w = avg ? Math.max(1, Math.min(window, Math.floor((budget - p.bytes) / avg))) : window;
    while (win.length < w && i < urls.length && p.bytes < budget) {
      const next = urls.slice(i, i + w - win.length); i += next.length;
      const st = await check(next);
      next.forEach((u, j) => { if (st.states[j] === 'c') { p.had++; p.done++; } else win.push(u); });
    }
    if (!win.length) break;
    if (!cut) await enqueue(win);
    await sleep(poll);
    const st = await check(win);
    const keep = [];
    win.forEach((u, j) => {
      if (st.states[j] === 'p') return keep.push(u);
      p.done++;
      if (st.states[j] === 'c') { p.fetched++; p.bytes += st.sizes[j]; recent.push(st.sizes[j]); if (recent.length > 8) recent.shift(); } else if (!cut) p.failed++;
    });
    win = keep;
    onProgress(p);
    // Over budget: drop what has not started, and count what was in flight as it lands.
    if (!cut && p.bytes >= budget) { cut = true; await enqueue([]); }
  }
  return p;
}

export default function (app) {
  const { cache } = app;
  const WARM = Number(process.env.STACKS_WARM_MB ?? 3000) * MB;
  const warm = { state: WARM > 0 ? 'waiting' : 'off', planned: 0, done: 0, fetched: 0, failed: 0, bytes: 0, budget: 0 };
  let runs = 0;

  async function run() {
    const me = ++runs;
    const room = cache.MAX * 0.9 - cache.cacheState().cacheBytes;
    const left = WARM - warm.bytes;
    if (left <= 0 || room <= 0) { warm.state = 'done'; return; }
    let urls; try { urls = planWarm({ items: 100000 }); } catch (e) { warm.state = 'error: ' + e.message; return; }
    Object.assign(warm, { state: 'running', planned: urls.length, done: 0, budget: warm.bytes + Math.min(left, room) });
    const base = { fetched: warm.fetched, failed: warm.failed, bytes: warm.bytes };
    const p = await fill(urls, {
      budget: Math.min(left, room),
      enqueue: (b) => cache.enqueue(b, 2, 'warm'),
      check: (b) => cache.inspect(b),
      stop: () => me !== runs,
      onProgress: (q) => { if (me === runs) Object.assign(warm, { done: q.done, fetched: base.fetched + q.fetched, failed: base.failed + q.failed, bytes: base.bytes + q.bytes }); },
    });
    if (me !== runs) return;
    warm.state = 'done';
    console.log(`warm-up: ${p.fetched} fetched (${(p.bytes / 1e6).toFixed(0)} MB), ${p.had} already cached, ${p.failed} failed, ${((Date.now() - p.t0) / 1000).toFixed(0)} s`);
  }

  app.onStart(() => { if (WARM > 0) setTimeout(run, 4000); });

  // The UI's ranking: { lanes: { lane: [[id, startPage, perSpread], ...] } }.
  // A changed hint restarts the warm-up with what is left of its budget.
  app.route('POST', '/warm/hint', async (req, res) => {
    const hint = await app.body(req);
    if (!hint || typeof hint.lanes !== 'object') return app.json(res, { ok: false }, 400);
    const ahead = Array.isArray(hint.ahead) ? hint.ahead.slice(0, 200) : [];
    const before = existsSync(HINT) ? readFileSync(HINT, 'utf-8') : '';
    const text = JSON.stringify({ at: new Date().toISOString(), lanes: hint.lanes, ahead });
    const changed = before.replace(/"at":"[^"]*",/, '') !== text.replace(/"at":"[^"]*",/, '');
    writeFileSync(HINT, text);
    if (changed && WARM > 0 && warm.state !== 'waiting') run();
    app.json(res, { ok: true, changed });
  });
  // warm.mjs: how far along a batch sent through /prefetch is.
  app.route('POST', '/warm/check', async (req, res) => {
    const { urls = [] } = await app.body(req);
    app.json(res, cache.inspect(urls.slice(0, 1000)));
  });

  app.status(() => ({
    ...cache.cacheState(),
    evicted: cache.stats.evicted,
    warm: { ...warm, mb: +(warm.bytes / 1e6).toFixed(1), capMb: +(WARM / 1e6).toFixed(0) },
    hosts: cache.hostState(),
  }));
}
