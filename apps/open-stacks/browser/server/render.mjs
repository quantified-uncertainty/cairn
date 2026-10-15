// The render service (docs/performance/prerender.md, section 3, first version): PDF pages rendered on
// the server with a native engine (server/pdfnative.mjs) by a pool of worker processes, ahead of the
// reader, into a disk store of JPEGs the browser decodes instead of drawing pages with pdf.js.
//
// - Pages are rendered from the PDF already in the disk cache (server/cache.mjs), whole (the browser
//   crops them as it crops scans), at a size class (1400, 1800 or 2200: render.js RENDER_H, rounded
//   up), into CACHE/render/<sha1 of url>/<k>_<w>.jpg, beside info.json (page count and sizes).
// - Three lanes. fg: a request is waiting (GET /render/page). near: the next spreads of the open
//   document and the first spreads of the next three items. ahead: the rest of the open document
//   and the next items' first spreads. Background lanes together never hold the last worker, so a
//   foreground page starts at once. A hint (POST /render/hint) replaces the background plan: queued
//   jobs it no longer names are dropped; running ones finish.
// - The store is LRU by bytes, capped at STACKS_RENDER_MAX (default 6 GiB), and joins the cache's
//   own cap and LRU as a tenant (cache.registerTenant), one entry per document.
//
// createService() returns an object, so tests can run several with fake engines (test/render-*.test.mjs).
import os from 'os';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, renameSync, unlinkSync, rmSync, readFileSync, writeFileSync, statSync } from 'fs';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import * as native from './pdfnative.mjs';

export const LANES = ['fg', 'near', 'ahead'];
/** Workers each lane may hold, for W workers: background never takes the last slot. */
export function laneCaps(W) {
  const bg = Math.max(1, W - 1);
  return { slots: Math.max(W, bg + 1), bg, near: Math.max(1, W - 1), ahead: Math.max(1, W - 2) };
}
export function parseSize(s, dflt) {
  const m = String(s ?? '').trim().match(/^([\d.]+)\s*([kmgt]?)i?b?$/i);
  return m ? Math.round(Number(m[1]) * 1024 ** ' kmgt'.indexOf((m[2] || ' ').toLowerCase())) : dflt;
}
export const defaultWorkers = () => Math.max(1, (os.availableParallelism?.() || os.cpus().length) - 1);
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const FILE = /^(\d+)_(\d+)\.jpg$/;
const pct = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

/**
 * dir: the store (CACHE/render). cache: server/cache.mjs or a stand-in with {allowed, cached, paths, ensure,
 * key?, meta?, registerTenant?, tenantGrew?}. workers, max: STACKS_RENDER_WORKERS, STACKS_RENDER_MAX.
 * prefer: STACKS_RENDER_ENGINE. engines: a ready list (tests); otherwise start() finds them.
 */
export function createService({ dir, cache, workers = defaultWorkers(), max = 6 * 1024 ** 3, prefer, engines = null, build = true, log = (m) => console.log(m) } = {}) {
  mkdirSync(dir, { recursive: true });
  const W = Math.max(1, Math.round(workers));
  const caps = laneCaps(W);
  const keyOf = (u) => (cache.key ? cache.key(u) : sha1(u));
  let chain = engines ? [...engines] : []; // engines that passed the self-test, the active one first
  let report = {}, detecting = !engines, off = native.engineOrder(prefer).length === 0;
  const fails = new Map(); // engine name -> failures in a row that a later engine then rendered

  // ---------------------------------------------------------------- store ----
  const docs = new Map(); // sha -> {s: bytes, a: last use (ms), files: Map(name -> {s, a}), info, infoP}
  let total = 0;
  const docOf = (sha) => { let d = docs.get(sha); if (!d) { d = { s: 0, a: 0, files: new Map(), info: null, infoP: null }; docs.set(sha, d); } return d; };
  const docDir = (sha) => join(dir, sha);
  const pagePath = (sha, k, w) => join(dir, sha, `${k}_${w}.jpg`);
  function addFile(sha, name, s, a = Date.now()) {
    const d = docOf(sha), old = d.files.get(name);
    if (old) { d.s -= old.s; total -= old.s; }
    d.files.set(name, { s, a }); d.s += s; total += s; d.a = Math.max(d.a, a);
  }
  function dropFile(sha, name) {
    const d = docs.get(sha); const f = d?.files.get(name); if (!f) return 0;
    d.files.delete(name); d.s -= f.s; total -= f.s;
    try { unlinkSync(join(dir, sha, name)); } catch { /* gone */ }
    return f.s;
  }
  function dropDoc(sha) {
    const d = docs.get(sha); if (!d) return 0;
    const s = d.s; total -= s; docs.delete(sha);
    try { rmSync(docDir(sha), { recursive: true, force: true }); } catch { /* gone */ }
    return s;
  }
  /** The stored page, or null; counts as a use. */
  function have(u, k, w) {
    const sha = keyOf(u), d = docs.get(sha), name = `${k}_${w}.jpg`, f = d?.files.get(name);
    if (!f) return null;
    const p = pagePath(sha, k, w);
    if (!existsSync(p)) { dropFile(sha, name); return null; }
    f.a = d.a = Date.now();
    return p;
  }
  /** Least recently used pages go first, down to 90% of the cap. */
  let evicting = false;
  function evict() {
    if (evicting || total <= max) return 0;
    evicting = true;
    let freed = 0;
    try {
      const all = [];
      for (const [sha, d] of docs) for (const [name, f] of d.files) all.push([f.a, sha, name]);
      all.sort((a, b) => a[0] - b[0]);
      const target = max * 0.9;
      const busy = new Set([...jobs.values()].filter((j) => j.state === 'running').map((j) => j.sha));
      for (const [, sha, name] of all) {
        if (total <= target) break;
        freed += dropFile(sha, name);
        const d = docs.get(sha);
        if (d && !d.files.size && !busy.has(sha)) dropDoc(sha);
      }
      stats.evicted += freed;
    } finally { evicting = false; }
    return freed;
  }
  async function scan() {
    let names = [];
    try { names = (await readdir(dir)).filter((x) => /^[0-9a-f]{40}$/.test(x)); } catch { return; }
    for (const sha of names) {
      let files; try { files = await readdir(docDir(sha)); } catch { continue; }
      for (const f of files) {
        const p = join(docDir(sha), f);
        if (FILE.test(f)) { try { const st = await stat(p); if (!docs.get(sha)?.files.has(f)) addFile(sha, f, st.size, st.mtimeMs); } catch { /* raced */ } }
        else if (f.startsWith('.')) { try { const st = await stat(p); if (Date.now() - st.mtimeMs > 600e3) await unlink(p); } catch { /* gone */ } } // a render cut short
      }
      if (!docs.get(sha)?.files.size) docOf(sha);
    }
    evict();
  }

  // Page count and sizes per document, from the engine, kept in <sha>/info.json beside the pages.
  const bad = new Map(); // sha or job key -> {error, at}: not tried again for 10 minutes
  const isBad = (k) => { const b = bad.get(k); if (b && Date.now() - b.at < 600e3) return b; if (b) bad.delete(k); return null; };
  function srcSize(u) { try { return cache.meta ? cache.meta(u).size : statSync(cache.paths(u).body).size; } catch { return null; } }
  /** The document's info.json, read once. */
  function loadInfo(sha) {
    const d = docOf(sha);
    if (!d.info && !d.infoRead) {
      d.infoRead = true;
      try { const j = JSON.parse(readFileSync(join(docDir(sha), 'info.json'), 'utf8')); if (j.n > 0 && Array.isArray(j.pages)) d.info = j; } catch { /* none yet */ }
    }
    return d;
  }
  function infoOf(u) {
    const sha = keyOf(u), d = loadInfo(sha);
    const size = srcSize(u);
    if (d.info && (size == null || d.info.size == null || d.info.size === size)) return Promise.resolve(d.info);
    if (d.infoP) return d.infoP;
    if (!cache.cached(u)) return Promise.reject(new Error('not on disk'));
    if (!chain.length) return Promise.reject(new Error('no engine'));
    if (d.info) { for (const name of [...d.files.keys()]) dropFile(sha, name); d.info = null; } // the PDF changed: its pages are stale
    d.infoP = (async () => {
      let lastErr;
      for (const eng of chain) {
        try {
          const r = await eng.info(cache.paths(u).body);
          const info = { url: u, size, n: r.n, pages: r.pages.map((p) => ({ w: +p.w.toFixed(3), h: +p.h.toFixed(3) })) };
          mkdirSync(docDir(sha), { recursive: true });
          writeFileSync(join(docDir(sha), 'info.json'), JSON.stringify(info));
          d.info = info;
          return info;
        } catch (err) { lastErr = err; }
      }
      bad.set(sha, { error: String(lastErr?.message || lastErr), at: Date.now() });
      throw lastErr;
    })().finally(() => { d.infoP = null; });
    return d.infoP;
  }
  const knownN = (u) => { const sha = keyOf(u); return docs.has(sha) || existsSync(docDir(sha)) ? loadInfo(sha).info?.n ?? null : null; };

  // ---------------------------------------------------------------- jobs ----
  const jobs = new Map(); // key -> job
  const queues = { fg: [], near: [], ahead: [] };
  const running = { fg: 0, near: 0, ahead: 0 };
  const freeSlots = Array.from({ length: caps.slots }, (_, i) => i);
  const srcWait = new Map(); // url -> Set(job): background jobs whose PDF is not on disk yet
  const asked = new Map(); // url -> when a background download was last asked for
  const stats = { done: 0, failed: 0, dropped: 0, hits: 0, evicted: 0, fellThrough: 0 };
  const times = []; // engine ms per page, the last 200
  let seq = 0, planSeq = 0, lastHint = null;

  const jobKey = (sha, k, w) => `${sha}:${k}:${w}`;
  function newJob(u, k, w, lane, pri) {
    const sha = keyOf(u), key = jobKey(sha, k, w);
    let res; const promise = new Promise((r) => { res = r; });
    const job = { key, u, sha, k, w, lane, pri, seq: ++seq, plan: planSeq, state: 'new', waiters: 0, promise, res };
    jobs.set(key, job);
    return job;
  }
  function enqueue(job) {
    if (!cache.cached(job.u)) { // background only: the routes never queue a page whose PDF is not on disk
      job.state = 'src';
      let s = srcWait.get(job.u); if (!s) srcWait.set(job.u, (s = new Set()));
      s.add(job);
      if (job.lane !== 'ahead') askSource(job.u);
      pollSoon();
      return;
    }
    job.state = 'queued';
    queues[job.lane].push(job);
  }
  function unqueue(job) {
    if (job.state === 'queued') { const q = queues[job.lane]; const i = q.indexOf(job); if (i >= 0) q.splice(i, 1); }
    if (job.state === 'src') srcWait.get(job.u)?.delete(job);
  }
  function settle(job, out) { jobs.delete(job.key); job.res(out); }
  function drop(job) { unqueue(job); stats.dropped++; settle(job, { ok: false, error: 'dropped' }); }
  /** Move a job that is not running to `lane` at `pri` (a hint or a waiting request). */
  function move(job, lane, pri, plan = job.plan) {
    if (job.state === 'running') return;
    const was = job.state;
    unqueue(job);
    job.lane = lane; job.pri = pri; job.plan = plan;
    if (was === 'src') enqueue(job); else { job.state = 'queued'; queues[lane].push(job); }
  }
  // A background download for a planned document (near lane: the open document, the next three items).
  function askSource(u) {
    const t = asked.get(u);
    if (t && Date.now() - t < 60e3) return;
    asked.set(u, Date.now());
    if (asked.size > 500) asked.delete(asked.keys().next().value);
    Promise.resolve().then(() => cache.ensure(u, { fg: false })).then(() => landed(u), () => {
      const s = srcWait.get(u); if (!s) return;
      for (const j of [...s]) { s.delete(j); settle(j, { ok: false, error: 'download failed' }); }
      srcWait.delete(u);
    });
  }
  function landed(u) {
    const s = srcWait.get(u); if (!s || !cache.cached(u)) return;
    srcWait.delete(u);
    for (const j of s) { j.state = 'queued'; queues[j.lane].push(j); }
    pump();
  }
  let pollT = null;
  function pollSoon() {
    if (pollT) return;
    pollT = setTimeout(() => { pollT = null; for (const u of [...srcWait.keys()]) landed(u); if (srcWait.size) pollSoon(); }, 2000);
    pollT.unref?.();
  }
  // Highest priority first, then the newest plan, then first come.
  function take(lane) {
    const q = queues[lane]; let b = 0;
    for (let i = 1; i < q.length; i++) { const x = q[i], y = q[b]; if (x.pri > y.pri || (x.pri === y.pri && (x.plan > y.plan || (x.plan === y.plan && x.seq < y.seq)))) b = i; }
    return q.splice(b, 1)[0];
  }
  function pump() {
    if (!chain.length) return;
    for (;;) {
      const busy = running.fg + running.near + running.ahead, bg = running.near + running.ahead;
      if (busy >= caps.slots || !freeSlots.length) return;
      let lane = null;
      if (queues.fg.length) lane = 'fg';
      else if (bg < caps.bg && queues.near.length && running.near < caps.near) lane = 'near';
      else if (bg < caps.bg && queues.ahead.length && running.ahead < caps.ahead) lane = 'ahead';
      if (!lane) return;
      runJob(take(lane), lane, freeSlots.shift());
    }
  }
  async function runJob(job, lane, slot) {
    job.state = 'running'; job.runLane = lane; running[lane]++;
    const t0 = Date.now();
    let out;
    try {
      const done = have(job.u, job.k, job.w);
      if (done) { out = { ok: true, file: done }; return; }
      if (isBad(job.sha)) throw new Error(isBad(job.sha).error);
      const info = await infoOf(job.u);
      if (job.k >= info.n) throw new Error(`no page ${job.k + 1} (${info.n} pages)`);
      const file = cache.paths(job.u).body;
      mkdirSync(docDir(job.sha), { recursive: true });
      const tmp = join(docDir(job.sha), `.${job.k}_${job.w}.${process.pid}.${job.seq}.jpg`);
      let r = null, lastErr = null;
      for (const e of [...chain]) {
        try {
          r = await native.renderTo(e, { file, k: job.k, w: job.w, out: tmp, info, lane, slot, timeout: lane === 'fg' ? 8000 : 20000 });
          break;
        } catch (err) { lastErr = err; try { unlinkSync(tmp); } catch { /* none */ } }
      }
      if (!r) throw lastErr || new Error('no engine');
      if (r.by !== chain[0]?.name) fellThrough(chain[0], r.by); else fails.delete(r.by);
      const name = `${job.k}_${job.w}.jpg`;
      renameSync(tmp, join(docDir(job.sha), name));
      addFile(job.sha, name, r.bytes);
      times.push(r.ms); if (times.length > 200) times.shift();
      stats.done++;
      out = { ok: true, file: pagePath(job.sha, job.k, job.w), r };
      if (total > max) evict();
      cache.tenantGrew?.();
    } catch (e) {
      stats.failed++;
      const error = String(e.message || e);
      bad.set(job.key, { error, at: Date.now() });
      if (bad.size > 5000) bad.delete(bad.keys().next().value);
      out = { ok: false, error };
    } finally {
      running[job.runLane]--; freeSlots.push(slot);
      settle(job, out || { ok: false, error: 'failed' });
      job.ms = Date.now() - t0;
      pump();
    }
  }
  // The active engine failed pages a later engine then rendered: after 5 in a row it steps aside.
  function fellThrough(e, by) {
    stats.fellThrough++;
    if (!e) return;
    const n = (fails.get(e.name) || 0) + 1; fails.set(e.name, n);
    if (n >= 5 && chain.length > 1 && chain[0] === e) { chain.push(chain.shift()); fails.delete(e.name); log(`render: ${e.name} failed ${n} pages in a row that ${by} rendered; using ${chain[0].name} first`); }
  }

  /** A page for a waiting request (lane fg, or near for the browser's prefetch). → {job} to wait on, or
   *  {now: {ok, file}} when it is on disk, or {now: {ok: false, error, code}} at once. */
  function request(u, k, w, lane = 'fg') {
    const sha = keyOf(u);
    const file = have(u, k, w);
    if (file) { stats.hits++; return { now: { ok: true, file } }; }
    if (!chain.length) return { now: { ok: false, error: detecting ? 'starting' : 'off', code: 204 } };
    const b = isBad(sha) || isBad(jobKey(sha, k, w));
    if (b) return { now: { ok: false, error: b.error, code: 422 } };
    const n = knownN(u);
    if (n != null && k >= n) return { now: { ok: false, error: `no page ${k + 1} (${n} pages)`, code: 404 } };
    if (!cache.cached(u)) return { now: { ok: false, error: 'not on disk', code: 503 } };
    const pri = lane === 'fg' ? 100 : 96;
    let job = jobs.get(jobKey(sha, k, w));
    if (!job) { job = newJob(u, k, w, lane, pri); enqueue(job); }
    else if (job.state !== 'running' && (LANES.indexOf(lane) < LANES.indexOf(job.lane) || (lane === job.lane && pri > job.pri))) move(job, lane, pri);
    job.waiters++;
    pump();
    return { job };
  }
  /** A waiting request gave up: a foreground job nobody waits for drops to near (still worth having). */
  function release(job) {
    job.waiters = Math.max(0, job.waiters - 1);
    if (!job.waiters && job.lane === 'fg' && job.state === 'queued') move(job, 'near', 94);
  }

  /** Replace the background plan from the reader's position. h: {open: {u, k, w, n?, per?}, next: [{u, k}]}.
   *  → {seq, n: {url: pages}} for the documents whose page count is known. */
  async function hint(h = {}) {
    const my = ++planSeq;
    const open = h.open && typeof h.open.u === 'string' ? h.open : null;
    const w = native.sizeClass(open?.w ?? h.w);
    const per = Math.max(1, Math.min(4, Math.round(Number(open?.per ?? h.per) || 2)));
    const ok = (u) => typeof u === 'string' && /^https?:/.test(u) && cache.allowed(u);
    const next = (Array.isArray(h.next) ? h.next : []).filter((x) => x && ok(x.u)).slice(0, 12);
    const docsIn = [...(open && ok(open.u) ? [open.u] : []), ...next.map((x) => x.u)];
    lastHint = { at: Date.now(), open: open?.u || null, next: next.length };
    // Page counts of the documents on disk (pdfinfo, a few ms each), at most 400 ms.
    const ns = {};
    if (chain.length) await Promise.race([Promise.all(docsIn.map((u) => (cache.cached(u) && !isBad(keyOf(u)) ? infoOf(u).catch(() => null) : null))), new Promise((r) => setTimeout(r, 400))]);
    for (const u of docsIn) { const n = knownN(u); if (n) ns[u] = n; }
    if (my !== planSeq) return { seq: my, stale: true, n: ns };
    if (!chain.length) return { seq: my, engine: null, n: ns };
    const want = new Map(); // key -> [u, k, lane, pri]
    const add = (u, k, lane, pri) => {
      const n = ns[u];
      if (!(k >= 0) || (n != null && k >= n) || (n == null && k > 60)) return;
      const key = jobKey(keyOf(u), k, w), cur = want.get(key);
      if (!cur || LANES.indexOf(lane) < LANES.indexOf(cur[2]) || (lane === cur[2] && pri > cur[3])) want.set(key, [u, k, lane, pri]);
    };
    if (open && ok(open.u)) {
      const u = open.u, k0 = Math.max(0, Math.round(Number(open.k) || 0)), n = ns[u] ?? (Number(open.n) || null);
      if (n && !ns[u]) ns[u] = n;
      for (let j = 0; j < per; j++) add(u, k0 + j, 'near', 96 - j * 0.1); // on screen: usually asked for already
      for (let d = 1; d <= 2; d++) for (let j = 0; j < per; j++) add(u, k0 + d * per + j, 'near', 95 - 3 * d - j * 0.1);
      for (let j = 0; j < per; j++) add(u, k0 - per + j, 'near', 86 - j * 0.1);
      for (let k = k0 + 3 * per, d = 0; k < k0 + 40 && (!n || k < n); k++, d++) add(u, k, 'ahead', 79 - d * 0.2);
      for (let k = k0 - per - 1, d = 0; k >= Math.max(0, k0 - 20); k--, d++) add(u, k, 'ahead', 71 - d * 0.2);
      if (n) for (let k = 0; k < Math.min(n, 600); k++) add(u, k, 'ahead', 55);
    }
    next.forEach((x, j) => {
      const k0 = Math.max(0, Math.round(Number(x.k) || 0));
      for (let i = 0; i < per; i++) add(x.u, k0 + i, j < 3 ? 'near' : 'ahead', (j < 3 ? 90 - 3 * j : 76 - j) - i * 0.1);
    });
    // Queued background jobs the new plan does not name are dropped; the rest move to their new place.
    for (const job of [...jobs.values()]) {
      if (job.state === 'running' || job.waiters || job.lane === 'fg') continue;
      const wnt = want.get(job.key);
      if (!wnt) drop(job); else { move(job, wnt[2], wnt[3], my); want.delete(job.key); }
    }
    for (const [key, [u, k, lane, pri]] of want) {
      const sha = keyOf(u);
      if (jobs.has(key) || isBad(sha) || isBad(key) || docs.get(sha)?.files.has(`${k}_${w}.jpg`)) continue;
      enqueue(newJob(u, k, w, lane, pri));
    }
    pump();
    return { seq: my, n: ns };
  }

  /** Which pages of a document are on disk at class w, for the badge. */
  function stateOf(u, w) {
    const sha = keyOf(u), d = docs.has(sha) ? loadInfo(sha) : null, n = d?.info?.n ?? null, cls = native.sizeClass(w);
    const have = new Set();
    if (d) for (const name of d.files.keys()) { const m = name.match(FILE); if (m && Number(m[2]) === cls) have.add(Number(m[1])); }
    const mine = [...jobs.values()].filter((j) => j.sha === sha && j.w === cls);
    return {
      engine: chain[0]?.name || null, n, w: cls,
      bits: n ? Array.from({ length: Math.min(n, 5000) }, (_, k) => (have.has(k) ? '1' : '0')).join('') : null,
      ready: n ? have.size : [...have].sort((a, b) => a - b),
      running: mine.filter((j) => j.state === 'running').map((j) => j.k),
      queued: mine.filter((j) => j.state !== 'running').length,
      src: cache.cached(u) ? 'disk' : 'missing',
    };
  }
  function forget(u) {
    const sha = keyOf(u);
    for (const j of [...jobs.values()]) if (j.sha === sha && j.state !== 'running') drop(j);
    bad.delete(sha);
    for (const k of [...bad.keys()]) if (k.startsWith(sha + ':')) bad.delete(k);
    return dropDoc(sha);
  }
  function summary() {
    const q = (l) => queues[l].length;
    return {
      engine: chain[0]?.name || null, engines: chain.map((e) => e.name), pending: detecting, off,
      workers: W, slots: caps.slots,
      running: { ...running }, queued: { fg: q('fg'), near: q('near'), ahead: q('ahead'), src: [...srcWait.values()].reduce((m, s) => m + s.size, 0) },
      ...stats, p50: pct(times, 0.5), p90: pct(times, 0.9),
      bytes: total, max, docs: docs.size, hint: lastHint, report,
    };
  }

  async function start() {
    await scan();
    if (cache.registerTenant) {
      cache.registerTenant('render', {
        entries: () => [...docs].filter(([, d]) => d.s > 0).map(([sha, d]) => ({ k: sha, s: d.s, a: Math.floor(d.a / 1000) })),
        remove: async (sha) => dropDoc(sha),
        bytes: () => total,
      });
    }
    if (engines || off) { detecting = false; if (off) log('render: off (STACKS_RENDER_ENGINE)'); return chain[0]?.name || null; }
    // Engines that need nothing built first; the Quartz helper may take a minute to compile the first
    // time, so it is built in the background and put first when it passes its self-test.
    const order = native.engineOrder(prefer);
    const quick = order.filter((x) => x !== 'quartz');
    const found = await native.findEngines({ dir, only: quick, build });
    report = { ...found.report };
    chain = found.engines;
    if (order.includes('quartz')) {
      const q = await native.findEngines({ dir, only: ['quartz'], build: false });
      if (q.engines.length) { chain.unshift(q.engines[0]); report.quartz = q.report.quartz; }
      else if (build && process.platform === 'darwin') {
        report.quartz = { ok: false, why: 'building' };
        native.findEngines({ dir, only: ['quartz'], build: true }).then((b) => {
          report.quartz = b.report.quartz;
          if (b.engines.length) { chain.unshift(b.engines[0]); log('render: Quartz helper built and tested; using quartz'); pump(); }
        }).catch((e) => { report.quartz = { ok: false, why: String(e.message || e) }; });
      } else report.quartz = q.report.quartz;
    }
    detecting = false;
    const why = Object.entries(report).filter(([, r]) => !r.ok).map(([n, r]) => `${n}: ${r.why}`).join('; ');
    log(`render: ${chain.length ? chain.map((e) => e.name).join(' → ') : 'no engine (pdf.js in the browser)'}, ${W} workers${why ? ` (${why})` : ''}`);
    pump();
    return chain[0]?.name || null;
  }
  function stop() { for (const e of chain) e.close?.(); clearTimeout(pollT); }

  return {
    start, stop, request, release, hint, have, stateOf, forget, summary, infoOf, evict,
    /** Page count and sizes when known (info.json), without starting any work. */
    infoNow: (u) => (docs.has(keyOf(u)) ? loadInfo(keyOf(u)).info : null),
    get engine() { return chain[0]?.name || null; },
    get pending() { return detecting; },
    get bytes() { return total; },
    caps, W, max, dir, queues, running, jobs, docs, pathOf: pagePath, keyOf,
  };
}
