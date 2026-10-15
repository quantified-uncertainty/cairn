// Disk cache for open sources, the prioritised prefetch queue that fills it,
// per-host politeness, and size-capped least-recently-used eviction.
//
// Layout: CACHE/<k[0:2]>/<k> (body) and <k>.json (meta), where k = sha1(url).
// Eviction only ever touches these sha1-named entries; summaries/, notes.json,
// events.jsonl and every other feature folder are left alone.
//
// Index: CACHE/cache-index.log is an append-only log of "k bytes atSec" lines
// (a write or a touch) and "k -" lines (a removal). It is replayed at startup
// and compacted when it grows to twice the live entry count, so hits and
// writes cost one buffered line rather than a scan of the tree. A background
// pass at startup reconciles it with what is actually on disk.
import { createHash } from 'crypto';
import { existsSync, readFileSync, appendFileSync, writeFileSync, renameSync, mkdirSync, linkSync, copyFileSync, unlinkSync } from 'fs';
import { mkdir, writeFile, unlink, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { HERE, CACHE, UA } from './config.mjs';
import * as ia from './ia.mjs';

// Only open sources; the proxy is not a general-purpose fetcher. Hosts of every
// item in corpus.json are added at startup.
export const ALLOW = new Set([
  'archive.org', 'arxiv.org', 'gutenberg.org', 'standardebooks.org', 'openlibrary.org', 'cdn.jsdelivr.net',
  'lesswrong.com', 'alignmentforum.org', 'forum.effectivealtruism.org',
]);
try {
  const { items } = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
  for (const it of items) for (const u of [it.url, it.page]) {
    try { if (u) ALLOW.add(new URL(u).hostname.replace(/^www\./, '')); } catch { /* skip */ }
  }
} catch { console.warn('corpus.json not found: run node build-corpus.mjs'); }
export const allowed = (u) => {
  try {
    const h = new URL(u).hostname.replace(/^www\./, '');
    return [...ALLOW].some((d) => h === d || h.endsWith('.' + d));
  } catch { return false; }
};

export const key = (u) => createHash('sha1').update(u).digest('hex');
const pathsK = (k) => { const d = join(CACHE, k.slice(0, 2)); return { d, body: join(d, k), meta: join(d, k + '.json') }; };
export const paths = (u) => pathsK(key(u));
export const cached = (u) => existsSync(paths(u).meta);
/** Metadata of a cached URL ({url, type, size, at}); counts as an access for eviction. */
export const meta = (u) => { const k = key(u); const m = JSON.parse(readFileSync(pathsK(k).meta, 'utf-8')); touch(k); return m; };
/** Body of a cached URL; counts as an access for eviction. */
export const read = (u) => { const k = key(u); const b = readFileSync(pathsK(k).body); touch(k); return b; };

export const stats = { hits: 0, misses: 0, fetched: 0, failed: 0, bytes: 0, throttled: 0, evicted: 0, evictedBytes: 0, aliased: 0, iaDirect: 0, merged: 0, hedged: 0 };

// ---------------------------------------------------------------- index ----

/** "8G", "500MB", "1.5t" or plain bytes. */
export function parseSize(s, dflt) {
  const m = String(s ?? '').trim().match(/^([\d.]+)\s*([kmgt]?)i?b?$/i);
  return m ? Math.round(Number(m[1]) * 1024 ** ' kmgt'.indexOf((m[2] || ' ').toLowerCase())) : dflt;
}
export const MAX = parseSize(process.env.STACKS_CACHE_MAX, 8 * 1024 ** 3);
const INDEX = join(CACHE, 'cache-index.log');
const idx = new Map(); // k -> { s: bytes on disk (body + meta), a: last access, seconds }
let total = 0, logLines = 0, pend = [];
const nowSec = () => Math.floor(Date.now() / 1000);
const isKey = (k) => k.length === 40 && /^[0-9a-f]{40}$/.test(k);

function put(k, s, a) { const e = idx.get(k); if (e) total -= e.s; idx.set(k, { s, a }); total += s; pend.push(`${k} ${s} ${a}`); }
function drop(k) { const e = idx.get(k); if (!e) return; total -= e.s; idx.delete(k); pend.push(`${k} -`); }
// Touches are logged at most once a minute per entry; within that the LRU
// order still updates in memory.
function touch(k) {
  const e = idx.get(k), now = nowSec();
  if (!e) { learn(k); return; }
  if (now - e.a >= 60) pend.push(`${k} ${e.s} ${now}`);
  e.a = now;
}
// An entry the index does not know (written before the index existed, or by
// another module through paths()): add it from disk.
async function learn(k) {
  try {
    const p = pathsK(k); const [b, m] = await Promise.all([stat(p.body), stat(p.meta)]);
    if (!idx.has(k)) put(k, b.size + m.size, nowSec());
  } catch { /* gone */ }
}
function flush() {
  if (!pend.length) return;
  try { appendFileSync(INDEX, pend.join('\n') + '\n'); logLines += pend.length; } catch { /* read-only disk: keep going in memory */ }
  pend = [];
  if (logLines > Math.max(20000, idx.size * 2)) {
    try {
      writeFileSync(INDEX + '.tmp', [...idx].map(([k, e]) => `${k} ${e.s} ${e.a}`).join('\n') + '\n');
      renameSync(INDEX + '.tmp', INDEX); logLines = idx.size;
    } catch (e) { console.warn('cache index compaction failed:', e.message); }
  }
}
function loadIndex() {
  let txt; try { txt = readFileSync(INDEX, 'utf-8'); } catch { return false; }
  for (const line of txt.split('\n')) {
    const [k, s, a] = line.split(' ');
    if (!k || !isKey(k)) continue;
    logLines++;
    if (s === '-') { const e = idx.get(k); if (e) { total -= e.s; idx.delete(k); } continue; }
    const e = idx.get(k); if (e) total -= e.s;
    idx.set(k, { s: Number(s) || 0, a: Number(a) || 0 }); total += Number(s) || 0;
  }
  return true;
}

/** Walk the sha1 folders once: add entries the index lacks, drop ones gone from disk, remove stale partial writes. */
let scanned = false;
export async function reconcile() {
  const t0 = nowSec(), seen = new Set();
  let dirs = [];
  try { dirs = (await readdir(CACHE)).filter((d) => /^[0-9a-f]{2}$/.test(d)); } catch { return; }
  for (const d of dirs) {
    let files; try { files = await readdir(join(CACHE, d)); } catch { continue; }
    const set = new Set(files);
    for (const f of files) {
      const k = f.endsWith('.json') ? f.slice(0, -5) : f;
      if (!isKey(k) || seen.has(k)) continue;
      seen.add(k);
      const hasBody = set.has(k), hasMeta = set.has(k + '.json'), p = pathsK(k);
      if (hasBody && hasMeta) {
        if (!idx.has(k)) try { const [b, m] = await Promise.all([stat(p.body), stat(p.meta)]); put(k, b.size + m.size, Math.floor(m.mtimeMs / 1000)); } catch { /* raced */ }
        continue;
      }
      // Half an entry: a crash mid-write (body, no meta) or an eviction cut short.
      // Leave anything recent alone; a write may be in progress.
      try { const st = await stat(hasBody ? p.body : p.meta); if (Date.now() - st.mtimeMs > 3600e3) { await unlink(hasBody ? p.body : p.meta); drop(k); } } catch { /* gone */ }
    }
  }
  for (const [k, e] of idx) if (!seen.has(k) && e.a < t0 - 1) drop(k);
  scanned = true; flush(); evictSoon();
}

// ------------------------------------------------------------- eviction ----
let evicting = false, evictT = null;
const evictSoon = () => { if (total + tenantBytes() > MAX && !evictT) evictT = setTimeout(() => { evictT = null; evict(); }, 1500); };
// Tenants: other stores (server/profile.mjs) join the size cap and the LRU order.
// registerTenant(name, { entries: () => [{ k, s, a }], remove: async (k) => bytesFreed, bytes?: () => total })
// k: the tenant's own key; s: bytes; a: last access (epoch seconds).
const tenants = new Map();
export function registerTenant(name, t) { tenants.set(name, t); }
export function tenantGrew() { evictSoon(); }
function tenantBytes() { let n = 0; for (const t of tenants.values()) { try { n += t.bytes ? t.bytes() : t.entries().reduce((m, e) => m + e.s, 0); } catch { /* a tenant's trouble is not the cache's */ } } return n; }
/** Delete least-recently-used entries until the cache is under 90% of STACKS_CACHE_MAX. */
export async function evict() {
  if (evicting || total + tenantBytes() <= MAX) return 0;
  evicting = true;
  const target = MAX * 0.9, now = nowSec();
  // Anything touched in the last few seconds may be streaming to the reader right now.
  const lru = [...idx].filter(([, e]) => now - e.a > 5).map(([k, e]) => [k, e.a]);
  let recent = idx.size - lru.length;
  for (const t of tenants.values()) { try { for (const e of t.entries()) { if (now - e.a > 5) lru.push([e.k, e.a, t, e.s]); else if (e.a <= now) recent++; } } catch { /* skip this tenant */ } }
  lru.sort((a, b) => a[1] - b[1]);
  let tb = tenantBytes();
  let n = 0, freed = 0, i = 0;
  try {
    while (i < lru.length && total + tb > target) {
      const chunk = [], their = []; let f = 0;
      while (i < lru.length && chunk.length + their.length < 32 && total + tb - f > target) {
        const [k, , t, s] = lru[i++];
        if (t) { their.push([t, k]); f += s; continue; }
        const e = idx.get(k);
        if (!e || nowSec() - e.a <= 5) continue; // read again since the pass began
        chunk.push(k); f += e.s;
      }
      // Meta first: cached() looks at the meta file, so the entry disappears atomically.
      await Promise.all(chunk.map(async (k) => { const p = pathsK(k); await unlink(p.meta).catch(() => {}); await unlink(p.body).catch(() => {}); drop(k); }));
      for (const [t, k] of their) { try { await t.remove(k); } catch { /* skip */ } }
      if (their.length) tb = tenantBytes();
      n += chunk.length + their.length; freed += f;
    }
  } finally { evicting = false; }
  stats.evicted += n; stats.evictedBytes += freed;
  // Still over, with entries spared only because they were just used: look again soon.
  if (total + tenantBytes() > MAX && recent > 0) setTimeout(evictSoon, 6000).unref?.();
  if (n) console.log(`cache: evicted ${n} entries (${(freed / 1e6).toFixed(1)} MB), now ${(total / 1e6).toFixed(1)} of ${(MAX / 1e6).toFixed(0)} MB`);
  flush();
  return n;
}
export const cacheState = () => ({ cacheBytes: total, cacheEntries: idx.size, cacheMax: MAX, cacheIndexed: scanned, tenantBytes: tenantBytes() });

if (!loadIndex()) setTimeout(reconcile, 200).unref(); // first run: build the index now
else setTimeout(reconcile, 60e3).unref();             // later runs: a quiet check a minute in
setInterval(flush, 3000).unref();
setInterval(() => { if (total + tenantBytes() > MAX) evict(); }, 10 * 60e3).unref();
setTimeout(() => { if (total + tenantBytes() > MAX) evict(); }, 5000).unref();
process.on('exit', flush);

// ----------------------------------------------------------- politeness ----
// Per-host concurrency and request-rate limits. Foreground requests (the
// reader waiting on /proxy) take the next free slot; background prefetch
// leaves slots free for them (see bgCap), never starts while a foreground
// request is waiting for that host, and narrows overall while any foreground
// request is in flight. 429 and 503 pause the host, honouring Retry-After.
// archive.org: page images go straight to the item's datanodes (ia.mjs), ~0.6 s
// each whatever their size; measured (2026-10-15), w1000 pages per second went
// 2.1 / 3.5 / 5.5 / 8.6 / 12.7 at 2 / 4 / 6 / 8 / 12 at a time and no further at
// 16 (slow outliers), with no 429 or 503, and a page took as long at 12 at a
// time as at 2. So 12, of which the background keeps 4 free while the reader
// is pulling pages (reserve) rather than half: the cost is the datanode's time
// per request, not bandwidth, so the reader's pages do not wait on the
// background's and the background need not yield to them overall (pump()).
// Pacing (adaptive): if the datanodes slow down (time to first byte averaging
// over 2.5 s, about 3x normal) the background narrows, 2 slots at a time down
// to 4, and widens again one slot at a time once they are back under 1.5 s.
const LIMITS = {
  'archive.org': { conc: 12, reserve: 4, adaptive: true },
  'arxiv.org': { conc: 2, rps: 2 },
  'lesswrong.com': { conc: 3 },
  'alignmentforum.org': { conc: 3 },
};
const DEFAULT_LIMIT = { conc: 4 };
const TIMEOUT = 180e3;
const LOG_HOSTS = !!process.env.STACKS_LOG_HOSTS;
const hosts = new Map();
let fgActive = 0, fgWaiting = 0;

function hostOf(u) {
  let name = '?'; try { name = new URL(u).hostname.replace(/^www\./, ''); } catch { /* bad url */ }
  const base = Object.keys(LIMITS).find((d) => name === d || name.endsWith('.' + d)) || name;
  let h = hosts.get(base);
  if (!h) {
    const L = LIMITS[base] || DEFAULT_LIMIT;
    h = { name: base, conc: L.conc, gap: L.rps ? 1000 / L.rps : 0, active: 0, fg: 0, peak: 0, next: 0, pause: 0, strikes: 0, waiting: [], timer: null, n: 0, throttled: 0, lastFg: 0,
      reserve: L.reserve || 0, adaptive: !!L.adaptive, lim: L.conc, ttfb: 0, adjAt: 0 };
    hosts.set(base, h);
  }
  return h;
}
// Background may use all but one slot; while the reader is pulling pages from
// this host (a foreground request in the last 10 s), only half (or all but the
// host's reserve), so a whole spread of cache misses starts at once.
const bgCap = (h) => {
  const c = Math.min(h.conc, h.lim), reading = Date.now() - h.lastFg < 10e3;
  return Math.max(1, reading ? (h.reserve ? c - h.reserve : Math.floor(c / 2)) : c - 1);
};
// Adaptive pacing: follow the host's time to first byte (page images only).
function pace(h, ms) {
  if (!h.adaptive) return;
  h.ttfb = h.ttfb ? 0.85 * h.ttfb + 0.15 * ms : ms;
  const now = Date.now();
  if (h.ttfb > 2500 && h.lim > 4 && now - h.adjAt > 2000) {
    h.lim = Math.max(4, h.lim - 2); h.adjAt = now;
    console.warn(`[host] ${h.name}: answering slowly (${(h.ttfb / 1000).toFixed(1)} s to first byte), background down to ${bgCap(h)} at a time`);
  } else if (h.ttfb < 1500 && h.lim < h.conc && now - h.adjAt > 5000) { h.lim++; h.adjAt = now; }
}
function ready(h, fg) {
  const now = Date.now();
  if (now < h.pause || now < h.next) return false;
  // Foreground never queues behind background: it may run up to 2 over the
  // limit while background requests hold slots (not on rate-limited hosts;
  // on hosts with a reserve, up to the reserve: a jump to a cold spread, its
  // previews and the pages planned around it all start at once).
  if (fg) return h.fg < h.conc && h.active < h.conc + (h.gap ? 0 : h.reserve || 2);
  return h.active < bgCap(h) && !h.waiting.some((w) => w.job.fg);
}
function take(h, job) {
  h.active++; h.n++; job.slotFg = job.fg;
  if (job.fg) { h.fg++; fgActive++; h.lastFg = Date.now(); }
  h.next = Date.now() + h.gap; h.peak = Math.max(h.peak, h.active);
  if (LOG_HOSTS) console.log(`[host] ${Date.now() % 1e6} ${h.name} +${job.fg ? 'fg' : 'bg'} active=${h.active} fg=${h.fg} waiting=${h.waiting.length} queue=${queue.length} waited=${job.since ? Date.now() - job.since : 0}`);
  job.since = 0;
}
function release(h, job) {
  h.active--;
  if (job.slotFg) { h.fg--; fgActive--; }
  if (LOG_HOSTS) console.log(`[host] ${Date.now() % 1e6} ${h.name} -${job.slotFg ? 'fg' : 'bg'} active=${h.active} fg=${h.fg} waiting=${h.waiting.length} queue=${queue.length}`);
  grant(h); pump();
}
function acquire(h, job) {
  if (!h.waiting.length && ready(h, job.fg)) { take(h, job); return Promise.resolve(); }
  job.since = Date.now();
  if (job.fg) h.lastFg = job.since;
  return new Promise((resolve) => { h.waiting.push({ job, resolve }); if (job.fg) fgWaiting++; grant(h); });
}
/** Hand free slots to waiters: foreground first, then background, each in arrival order. */
function grant(h) {
  while (h.waiting.length) {
    const w = h.waiting.find((x) => x.job.fg) || h.waiting[0];
    if (!(w.job.fg ? ready(h, true) : ready(h, false))) break;
    h.waiting.splice(h.waiting.indexOf(w), 1);
    if (w.job.fg) fgWaiting--;
    take(h, w.job); w.resolve();
  }
  arm(h);
}
// Wake up when a time gate (rate limit or backoff pause) opens.
function arm(h) {
  clearTimeout(h.timer); h.timer = null;
  const wait = Math.max(h.pause, h.next) - Date.now();
  if (wait > 0 && h.waiting.length) h.timer = setTimeout(() => { h.timer = null; grant(h); }, wait + 2);
}
function retryAfter(v) {
  if (!v) return 0;
  const s = Number(v); if (Number.isFinite(s)) return s * 1000;
  const t = Date.parse(v); return Number.isFinite(t) ? Math.max(0, t - Date.now()) : 0;
}
/** Per-host activity for /status: concurrency now and at peak, pauses, totals,
 *  and how fast the host has been (hostTimes(): p50, p90, perMin, kb), which the
 *  reader quotes while a page loads (feed.js sourceSpeed). */
export const hostState = () => { const t = hostTimes(); return Object.fromEntries([...hosts.values()].map((h) => [h.name, {
  active: h.active, fg: h.fg, peak: h.peak, waiting: h.waiting.length, requests: h.n, throttled: h.throttled,
  ...(h.pause > Date.now() ? { pausedMs: h.pause - Date.now() } : {}),
  ...(h.lim < h.conc ? { limit: bgCap(h) } : {}),
  ...(t[h.name] || {}),
}])); };

// ---------------------------------------------------------------- fetch ----
const inflight = new Map(); // url -> job { fg, p, group? }

/**
 * Fetch a URL into the cache unless it is already there. Foreground by
 * default (someone is waiting); pass {fg: false} for background work.
 */
/** Download progress of a URL: {done} when cached, {got, total} while fetching, else null. */
export function progressOf(u) {
  if (cached(u)) return { done: true };
  const j = inflight.get(u);
  return j ? { got: j.got || 0, total: j.total || 0, waiting: j.got == null } : null;
}
// A smaller size of an Internet Archive page image already on disk (the feed's
// w400 placeholder for a page whose w1000 is cached, the strip's w120 for a
// w200): the cached image stands in, hard-linked, with no request (ia.larger).
function alias(u) {
  if (inflight.has(u)) return false;
  // Only an image fetched at that size stands in, never another stand-in (a w400
  // that is really a w1000 must not answer for a w200).
  const own = (v) => { try { return cached(v) && !JSON.parse(readFileSync(paths(v).meta, 'utf-8')).alias; } catch { return false; } };
  const big = ia.larger(u, own);
  if (!big) return false;
  try {
    const from = paths(big), k = key(u), to = pathsK(k);
    const m0 = JSON.parse(readFileSync(from.meta, 'utf-8'));
    mkdirSync(to.d, { recursive: true });
    try { unlinkSync(to.body); } catch { /* none */ }
    try { linkSync(from.body, to.body); } catch { copyFileSync(from.body, to.body); }
    const m = JSON.stringify({ url: u, type: m0.type, size: m0.size, at: Date.now(), alias: big });
    writeFileSync(to.meta, m); // last: cached() means the body is complete
    put(k, m0.size + m.length, nowSec());
    stats.aliased++;
    return true;
  } catch { return false; } // evicted meanwhile: fetch it
}
export function ensure(u, { fg = true, exact = false, ifFree = false } = {}) {
  if (cached(u) || alias(u)) return Promise.resolve();
  const cur = inflight.get(u);
  if (cur) { if (fg && !cur.fg) promote(cur); return cur.p; }
  // ifFree: only if the host can start it right now (a preview must not hold up the page itself).
  if (ifFree) { const h = hostOf(u); if (h.waiting.length || !ready(h, fg)) return Promise.reject(new Error('busy')); return start(u, { fg, noHedge: true }, false); }
  // One image per Internet Archive page: a smaller size of a page whose w1000
  // is on its way or queued comes from that w1000 (alias()), fetched now if it
  // was only queued. `exact` asks for the size itself (a preview, routes/13-ia.mjs).
  const big = !exact && ia.bigOf(u);
  if (big && (inflight.has(big) || queued.has(big))) {
    stats.merged++;
    const own = () => (cached(u) || alias(u) ? undefined : ensure(u, { fg, exact: true }));
    return ensure(big, { fg }).then(own, own);
  }
  return start(u, { fg }, false);
}
function promote(job) {
  job.fg = true;
  const h = hostOf(job.u);
  if (h.waiting.some((w) => w.job === job)) { fgWaiting++; grant(h); }
}
function start(u, job, held) {
  job.u = u;
  job.p = fetchInto(u, job, held).finally(() => inflight.delete(u));
  inflight.set(u, job);
  return job.p;
}
// Dead documents: onDead(fn) lets server/rescue.mjs replace a response that
// failed for good, or a placeholder page, with an archived copy:
// fn(url, {status, error?, type?, buf?, fg}) -> {buf, type, meta} | null.
let deadHook = null;
export const onDead = (fn) => { deadHook = fn; };
// The reader is waiting for an Internet Archive page image and the datanode
// has not answered in HEDGE_MS (about the slowest one in five; measured times
// to first byte: median ~0.6 s, p90 1.2-1.7 s, the odd one 7 s): ask the
// item's other node too (or archive.org, which picks one), keep whichever
// answers first, and cancel the other. Background fetches never hedge; one that
// the reader starts waiting for (promote) does once it is late.
const HEDGE_MS = 1100;
function firstOk(ps) {
  return new Promise((resolve) => {
    let left = ps.length, first = null;
    const miss = (x) => { first ??= x; if (--left === 0) resolve(first); };
    ps.forEach((p, i) => p.then((r) => (r.ok ? resolve({ i, r }) : miss({ i, r })), (e) => miss({ i, e })));
  });
}
async function fetchSource(u, src, job) {
  const opts = (signal) => ({ headers: { 'User-Agent': UA }, redirect: 'follow', signal });
  const limit = AbortSignal.timeout(TIMEOUT), a1 = new AbortController();
  const p1 = fetch(src || u, opts(AbortSignal.any([a1.signal, limit])));
  if (!ia.pageOf(u) || job.noHedge) return { res: await p1, src };
  const late = await new Promise((resolve) => {
    let t = null; const done = (v) => { clearTimeout(t); resolve(v); };
    p1.then(() => done(false), () => done(false));
    const check = () => { if (job.fg) done(true); else t = setTimeout(check, 200); };
    t = setTimeout(check, src ? HEDGE_MS : HEDGE_MS + 450); // through the 302: its ~0.45 s on top
  });
  if (!late) return { res: await p1, src };
  stats.hedged++;
  const src2 = ia.direct(u, src), a2 = new AbortController();
  const p2 = fetch(src2 || u, opts(AbortSignal.any([a2.signal, limit])));
  const w = await firstOk([p1, p2]);
  (w.i === 0 ? a2 : a1).abort();
  if (w.e) throw w.e;
  return { res: w.r, src: w.i === 0 ? src : src2 };
}
async function fetchInto(u, job, held) {
  const h = hostOf(u);
  let viaIA = true; // Internet Archive page images may go straight to the datanode (ia.mjs)
  for (let attempt = 0; ; attempt++) {
    if (!held) await acquire(h, job);
    held = false;
    let res, buf, err, src = null;
    try {
      job.t0 = Date.now();
      src = viaIA ? ia.direct(u) : null;
      if (src) stats.iaDirect++;
      ({ res, src } = await fetchSource(u, src, job));
      if (ia.pageOf(u)) pace(h, Date.now() - job.t0);
      if (res.ok) {
        // Read in chunks so the reader can see the download's progress (/progress).
        job.total = Number(res.headers.get('content-length')) || 0; job.got = 0;
        const chunks = [];
        for await (const ch of res.body) { chunks.push(ch); job.got += ch.length; }
        buf = Buffer.concat(chunks);
      }
      else await res.body?.cancel().catch(() => {});
    } catch (e) { err = e; } finally { release(h, job); }
    const store = async (body, type, extra) => {
      const k = key(u), p = pathsK(k);
      await mkdir(p.d, { recursive: true });
      await writeFile(p.body, body);
      const m = JSON.stringify({ url: u, type, size: body.length, at: Date.now(), ...extra });
      await writeFile(p.meta, m); // last: cached() means the body is complete
      put(k, body.length + m.length, nowSec());
      stats.fetched++; stats.bytes += body.length;
      timing(u, Date.now() - job.t0, body.length);
      evictSoon();
    };
    if (buf) {
      h.strikes = 0;
      if (!src) ia.learn(u, res.url); // where archive.org's 302 sent a page image
      const type = res.headers.get('content-type') || 'application/octet-stream';
      // A document that now serves a placeholder page: its archived copy instead (onDead).
      const alt = deadHook && await deadHook(u, { status: res.status, type, buf, fg: job.fg }).catch(() => null);
      if (alt) return store(alt.buf, alt.type, alt.meta);
      return store(buf, type, res.url && res.url !== u ? { final: res.url } : {});
    }
    // Straight to a datanode, and it failed (404 once the item has moved, a node
    // that is down): forget that node and go through archive.org's 302 at once.
    if (src && !(res && (res.status === 429 || res.status === 503))) { ia.forget(u, src); viaIA = false; attempt--; continue; }
    // Rate limited or overloaded: pause the whole host, with exponential backoff.
    if (res && (res.status === 429 || res.status === 503)) {
      stats.throttled++; h.throttled++; h.strikes++;
      const wait = Math.min(300e3, Math.max(retryAfter(res.headers.get('retry-after')), 1000 * 2 ** Math.min(h.strikes, 8))) * (1 + Math.random() * 0.2);
      h.pause = Math.max(h.pause, Date.now() + wait);
      console.warn(`[host] ${h.name}: HTTP ${res.status}, pausing ${(wait / 1000).toFixed(1)} s`);
      // The reader is waiting: retry if the pause is short; background work just drops it.
      if (job.fg && attempt < 2 && wait < 20e3) continue;
      throw new Error(`HTTP ${res.status} (${h.name} is rate limiting; paused ${Math.round(wait / 1000)} s)`);
    }
    // Transient gateway errors and dropped connections: one quick retry.
    if (attempt < 1 && (err || res.status === 502 || res.status === 504)) { await new Promise((r) => setTimeout(r, 400 + Math.random() * 400)); continue; }
    // Gone for good (404, 410, 451, a vanished host): an archived copy if there is one (onDead).
    const alt = deadHook && await deadHook(u, { status: res?.status || 0, error: err && (err.cause?.code || err.code || err.message), fg: job.fg }).catch(() => null);
    if (alt) return store(alt.buf, alt.type, alt.meta);
    throw err || new Error(`HTTP ${res.status}`);
  }
}

// ---------------------------------------------------------------- queue ----
// Prefetch queue: highest priority first; a new request for a group replaces
// that group's older entries, so the queue follows what the reader sees now.
// Jobs only start when their host has a background slot, so a slow host
// never holds up the others.
let queue = [];
const queued = new Map(); // url -> its queued job (the highest priority one)
const reindex = () => { queued.clear(); for (const j of queue) if (!queued.has(j.u)) queued.set(j.u, j); }; // queue is sorted
// Background fetches overall, and fewer while the reader waits on a host whose
// downloads share the reader's bandwidth (hosts with a reserve, archive.org,
// keep slots for the reader per host instead: bgCap).
const WORKERS = 16, WORKERS_YIELD = 4;
const readerWaiting = () => fgActive + fgWaiting > 0 && [...hosts.values()].some((h) => !h.reserve && (h.fg > 0 || h.waiting.some((w) => w.job.fg)));
let bgActive = 0, pumpT = null, pumpAt = 0;
function pump() {
  const cap = readerWaiting() ? WORKERS_YIELD : WORKERS;
  if (bgActive >= cap || !queue.length) return;
  let wake = Infinity;
  const keep = [];
  for (const job of queue) {
    if (bgActive >= cap) { keep.push(job); continue; }
    if (inflight.has(job.u)) continue;
    const big = ia.bigOf(job.u);
    if (big && inflight.has(big)) { stats.merged++; continue; } // served from that w1000 (ensure)
    const h = hostOf(job.u);
    if (!ready(h, false)) {
      keep.push(job);
      const t = Math.max(h.pause, h.next) - Date.now();
      if (t > 0) wake = Math.min(wake, t);
      continue;
    }
    if (cached(job.u) || alias(job.u)) continue;
    bgActive++; take(h, job);
    start(job.u, job, true).catch(() => { stats.failed++; }).finally(() => { bgActive--; pump(); });
  }
  queue = keep; reindex();
  // Some jobs wait on a time gate: come back when the earliest one opens.
  if (wake < Infinity && (!pumpT || Date.now() + wake < pumpAt)) {
    clearTimeout(pumpT); pumpAt = Date.now() + wake;
    pumpT = setTimeout(() => { pumpT = null; pump(); }, wake + 2);
  }
}
/** Replace a group's queued URLs; earlier URLs in the list go first. */
export function enqueue(urls, pri = 1, group = 'default') {
  queue = queue.filter((j) => j.group !== group);
  urls.forEach((u, i) => { if (allowed(u) && !cached(u)) queue.push({ u, pri: pri - i * 0.001, group, fg: false }); });
  merge();
  queue.sort((a, b) => b.pri - a.pri);
  reindex();
  pump();
  return queue.length;
}
// One image per Internet Archive page (a page costs the datanode ~0.6 s at any
// size): a smaller size of a page whose w1000 is queued or on its way is not
// fetched on its own; ensure() serves it from the w1000 once that is on disk.
// If the small one was wanted sooner (the track under the pointer, the riffle),
// the w1000 moves up to its priority; a little sooner (the profile compiler's
// w200s at 25 against the whole book's w1000s at 20) does not reorder the book.
function merge() {
  const bigs = new Map();
  for (const j of queue) if (ia.pageOf(j.u) && !ia.bigOf(j.u)) { const b = bigs.get(j.u); if (!b || b.pri < j.pri) bigs.set(j.u, j); }
  if (!bigs.size && !inflight.size) return;
  queue = queue.filter((j) => {
    const big = ia.bigOf(j.u); if (!big) return true;
    const b = bigs.get(big);
    if (!b && !inflight.has(big)) return true;
    if (b && j.pri > b.pri + 5) b.pri = j.pri;
    stats.merged++; return false;
  });
}
// How fast each source is: recent fetch times per host (median, 90th
// percentile, bytes), so the reader can say how long a page will take.
const times = new Map(); // host -> [{ms, bytes, at}]
function timing(u, ms, bytes) {
  let h; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch { return; }
  const a = times.get(h) || []; a.push({ ms, bytes, at: Date.now() }); if (a.length > 200) a.shift(); times.set(h, a);
}
export function hostTimes() {
  const out = {};
  for (const [h, a] of times) {
    const ms = a.map((x) => x.ms).sort((x, y) => x - y);
    const recent = a.filter((x) => Date.now() - x.at < 60e3).length;
    out[h] = { n: a.length, p50: ms[Math.floor(ms.length / 2)], p90: ms[Math.floor(ms.length * 0.9)], perMin: recent, kb: Math.round(a.reduce((s, x) => s + x.bytes, 0) / a.length / 1024) };
  }
  return out;
}
export const queueState = () => ({ queue: queue.length, active: bgActive + fgActive, foreground: fgActive });
/** Drop every queued prefetch (fetches in flight finish); returns how many were dropped. (Settings, routes/85-settings.mjs) */
export function clearQueue() { const n = queue.length; queue = []; reindex(); return n; }
/**
 * Where each URL stands, without counting as an access: states[j] is 'c'
 * (cached), 'p' (queued or in flight) or '-' (neither: failed or never
 * queued); sizes[j] is the cached body size. For warm-up progress.
 */
export function inspect(urls) {
  const queued = new Set(queue.map((j) => j.u));
  const states = [], sizes = [];
  for (const u of urls) {
    let st = '-', size = 0;
    if (cached(u)) { st = 'c'; try { size = JSON.parse(readFileSync(paths(u).meta, 'utf-8')).size || 0; } catch { /* evicted just now */ } }
    else if (inflight.has(u) || queued.has(u)) st = 'p';
    states.push(st); sizes.push(size);
  }
  return { states, sizes };
}
