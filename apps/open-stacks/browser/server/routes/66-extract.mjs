// Feeds: the typed parts of every item, and feeds of one part type across a
// lane (docs/feeds/spec.md, section 3; the UI is ui/js/features/feeds.js).
//
//   GET  /extract?id=<item id>[&bg=1]   -> Extract: {v, id, at, ms, src, url, err?, lead, parts, hl}
//   GET  /extract/feed?type=&lane=&offset=&limit=[&per=][&wait=]
//                                       -> {v, type, lane, offset, next, cards, leads, walked, total, done, pending, ms}
//   POST /extract/verdict {id, pid, ok}  -> {ok: true}  (the UI's ink test for a scan plate)
//
// Results are cached as CACHE/extract/<id>.json while their `v` equals VER in
// server/lib/extract.mjs; failures that look permanent (no HTML, unsupported,
// empty) are cached too, network failures are not. Parsing runs in one worker
// thread, one item at a time, so the main thread keeps serving pages.
//
// Politeness: uncached arXiv HTML passes a shared gate of one fetch a second;
// LessWrong and EA Forum see at most 2 fetches at a time from here, a web host
// 2, archive.org 2 books. Background work (read-ahead, bg=1) runs 2 items at a
// time and waits while the reader has page loads in flight.
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, statSync, readdirSync } from 'fs';
import { join } from 'path';
import http from 'http';
import { createHash } from 'crypto';
import { Worker } from 'worker_threads';
import { HOST } from '../config.mjs';
import { VER, FEEDS, serveView, cardsFor, avatarOf } from '../lib/extract.mjs';

const LIB = new URL('../lib/extract.mjs', import.meta.url).href;
const safe = (s) => String(s).replace(/[^\w.-]+/g, '_'); // as in 65-figures.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tick = () => new Promise((r) => setImmediate(r));

/** A counting semaphore; waiting foreground jobs go first. `promote` lets a waiting job through at once. */
class Sem {
  constructor(n) { this.n = n; this.active = 0; this.q = []; }
  acquire(job) {
    if (this.active < this.n) { this.active++; return Promise.resolve(true); }
    return new Promise((r) => this.q.push({ job, r }));
  }
  release(held) {
    if (!held) return;
    const i = this.q.findIndex((w) => w.job.fg);
    const w = this.q.splice(i < 0 ? 0 : i, 1)[0];
    if (w) w.r(true); else this.active--;
  }
  promote(job) { const i = this.q.findIndex((w) => w.job === job); if (i >= 0) this.q.splice(i, 1)[0].r(false); }
  async run(job, fn) { const held = await this.acquire(job); try { return await fn(); } finally { this.release(held); } }
  get waiting() { return this.q.length; }
}

export default function (app) {
  const { cache, CACHE, HERE } = app;
  const DIR = join(CACHE, 'extract');
  mkdirSync(DIR, { recursive: true });
  const FIG_DIR = join(CACHE, 'figures');
  const LOOP = `http://${HOST === '0.0.0.0' || HOST === '::' ? '127.0.0.1' : HOST}:${app.PORT}`;
  const stats = { hits: 0, built: 0, failed: 0, served: 0, feedRequests: 0, cpuMs: 0, cpuMax: 0, files: 0 };
  try { stats.files = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'verdicts.json').length; } catch { /* empty */ }

  // ------------------------------------------------------------ corpus ----
  let corpus = null, corpusCheck = 0, corpusMtime = 0;
  function loadCorpus() {
    if (corpus && Date.now() - corpusCheck < 5000) return corpus;
    corpusCheck = Date.now();
    const f = join(HERE, 'corpus.json');
    const mt = statSync(f).mtimeMs;
    if (corpus && mt === corpusMtime) return corpus;
    const j = JSON.parse(readFileSync(f, 'utf-8'));
    const items = j.items || [];
    corpus = { items, byId: new Map(items.map((it) => [it.id, it])), weights: j.laneWeights || {}, lanes: new Set(items.map((it) => it.lane)), lists: new Map() };
    corpusMtime = mt;
    feeds.clear();
    return corpus;
  }
  /** Item ids of a lane, in feed order: corpus order in one lane; a weighted round-robin for 'all'. */
  function laneList(lane) {
    const c = loadCorpus();
    if (c.lists.has(lane)) return c.lists.get(lane);
    let out;
    if (lane !== 'all') out = c.items.filter((it) => it.lane === lane).map((it) => it.id);
    else {
      // buildOrder in ui/js/state.js, without the reader's affinities or noise.
      const buckets = {};
      for (const it of c.items) (buckets[it.lane] ||= []).push(it.id);
      const lanes = Object.keys(buckets);
      const weight = (l) => Math.max(0.1, c.weights[l] ?? 1);
      const total = lanes.reduce((s, l) => s + weight(l), 0);
      const credit = Object.fromEntries(lanes.map((l) => [l, 0]));
      const pos = Object.fromEntries(lanes.map((l) => [l, 0]));
      out = [];
      while (out.length < c.items.length) {
        for (const l of lanes) credit[l] += weight(l) / total;
        const l = lanes.filter((x) => pos[x] < buckets[x].length).sort((a, b) => credit[b] - credit[a])[0];
        if (!l) break;
        credit[l] -= 1; out.push(buckets[l][pos[l]++]);
      }
    }
    c.lists.set(lane, out);
    return out;
  }

  // -------------------------------------------------------- highlights ----
  const HL = { file: null, mtime: 0, items: {}, sample: false, check: 0 };
  function highlights() {
    if (Date.now() - HL.check < 1000) return HL;
    HL.check = Date.now();
    const real = join(HERE, 'data', 'highlights.json'), sample = join(HERE, 'data', 'highlights.sample.json');
    const f = existsSync(real) ? real : existsSync(sample) ? sample : null;
    let mt = 0; try { mt = f ? statSync(f).mtimeMs : 0; } catch { /* gone */ }
    if (f === HL.file && mt === HL.mtime) return HL;
    let items = {};
    try { if (f) items = JSON.parse(readFileSync(f, 'utf-8')).items || {}; } catch (e) { console.warn('extract: highlights file unreadable:', e.message); }
    Object.assign(HL, { file: f, mtime: mt, items, sample: f === sample });
    feeds.clear(); // a new file changes leads and the highlights feed
    return HL;
  }

  // ---------------------------------------------------------- verdicts ----
  const VFILE = join(DIR, 'verdicts.json');
  const verdicts = new Map();
  try { for (const [k, v] of Object.entries(JSON.parse(readFileSync(VFILE, 'utf-8')))) verdicts.set(k, !!v); } catch { /* none yet */ }
  let vTimer = null;
  const saveVerdicts = () => {
    clearTimeout(vTimer);
    vTimer = setTimeout(() => {
      try { writeFileSync(VFILE + '.tmp', JSON.stringify(Object.fromEntries(verdicts))); renameSync(VFILE + '.tmp', VFILE); } catch (e) { console.warn('extract: verdicts not saved:', e.message); }
    }, 400);
  };

  // ------------------------------------------------------- disk cache ----
  const fileOf = (id) => {
    let s = safe(id);
    if (s.length > 180) s = s.slice(0, 120) + '_' + createHash('sha1').update(id).digest('hex').slice(0, 16);
    return join(DIR, s + '.json');
  };
  const mem = new Map(); // id -> stored result, the most recent 400
  const remember = (ex) => { mem.delete(ex.id); mem.set(ex.id, ex); if (mem.size > 400) mem.delete(mem.keys().next().value); };
  function stored(id) {
    const m = mem.get(id);
    if (m) { mem.delete(id); mem.set(id, m); return m; }
    try {
      const j = JSON.parse(readFileSync(fileOf(id), 'utf-8'));
      if (j.v === VER && j.id === id) { remember(j); return j; }
    } catch { /* not cached */ }
    return null;
  }
  const onDisk = (id) => mem.has(id) || existsSync(fileOf(id));
  function save(ex) {
    const f = fileOf(ex.id);
    const fresh = !existsSync(f);
    writeFileSync(f + '.tmp', JSON.stringify(ex)); renameSync(f + '.tmp', f);
    if (fresh) stats.files++;
    remember(ex);
  }

  // ----------------------------------------------------------- worker ----
  // One worker thread runs the parsers, one job at a time (foreground first).
  const WSRC = `const { parentPort } = require('worker_threads');
import(${JSON.stringify(LIB)}).then((X) => {
  parentPort.on('message', ({ n, job }) => {
    const t0 = performance.now(); let out = null, err = null;
    try { out = X.run(job); } catch (e) { err = String((e && e.stack) || e); }
    parentPort.postMessage({ n, out, err, cpu: performance.now() - t0 });
  });
  parentPort.postMessage({ ready: true });
}, (e) => parentPort.postMessage({ fatal: String(e && e.stack || e) }));`;
  let worker = null, wBusy = null, wSeq = 0, wIdleT = null;
  const wQueue = [];
  function startWorker() {
    const w = new Worker(WSRC, { eval: true });
    w.on('message', (m) => {
      if (m.fatal) { console.warn('extract worker:', m.fatal); return; }
      if (m.ready || !wBusy || m.n !== wBusy.n) return;
      const j = wBusy; wBusy = null; clearTimeout(j.timer);
      stats.cpuMs += m.cpu; stats.cpuMax = Math.max(stats.cpuMax, m.cpu);
      if (m.err) j.reject(new Error('extract: ' + m.err.split('\n')[0])); else j.resolve({ ...m.out, cpu: m.cpu });
      setImmediate(pumpWorker);
    });
    const dead = (e) => {
      if (worker !== w) return;
      worker = null;
      if (wBusy) { const j = wBusy; wBusy = null; clearTimeout(j.timer); j.reject(e instanceof Error ? e : new Error('extract worker exited')); }
      setImmediate(pumpWorker);
    };
    w.on('error', dead);
    w.on('exit', () => dead(new Error('extract worker exited')));
    w.unref();
    return w;
  }
  function pumpWorker() {
    if (wBusy || !wQueue.length) {
      clearTimeout(wIdleT);
      if (!wBusy && !wQueue.length && worker) wIdleT = setTimeout(() => { if (!wBusy && !wQueue.length && worker) { const w = worker; worker = null; w.terminate(); } }, 60e3);
      return;
    }
    const i = wQueue.findIndex((j) => j.owner.fg);
    const j = wQueue.splice(i < 0 ? 0 : i, 1)[0];
    worker ||= startWorker();
    wBusy = j; j.n = ++wSeq;
    j.timer = setTimeout(() => { // a runaway parse: start over without it
      if (wBusy !== j) return;
      const w = worker; worker = null; wBusy = null; w?.terminate();
      j.reject(new Error('extract: parse timed out')); setImmediate(pumpWorker);
    }, 60e3);
    worker.postMessage({ n: j.n, job: j.job });
  }
  const parseJob = (job, owner) => new Promise((resolve, reject) => { wQueue.push({ job, owner, resolve, reject }); pumpWorker(); });

  // ------------------------------------------------------- politeness ----
  const gate = { last: 0, q: [], timer: null, waits: 0 };
  function arxivGate(job) {
    gate.waits++;
    return new Promise((resolve) => { gate.q.push({ job, resolve }); pumpGate(); });
  }
  function pumpGate() {
    if (gate.timer || !gate.q.length) return;
    const wait = gate.last + 1000 - Date.now();
    if (wait > 0) { gate.timer = setTimeout(() => { gate.timer = null; pumpGate(); }, wait); return; }
    const i = gate.q.findIndex((w) => w.job.fg);
    const w = gate.q.splice(i < 0 ? 0 : i, 1)[0];
    gate.last = Date.now();
    w.resolve();
    pumpGate();
  }
  const forum = new Sem(2), books = new Sem(2), hosts = new Map();
  const hostSem = (u) => { const h = new URL(u).hostname; if (!hosts.has(h)) hosts.set(h, new Sem(2)); return hosts.get(h); };
  /** Background work waits while the reader has page loads in flight (up to 5 s at a time). */
  async function idle(job) {
    if (job.fg) return;
    for (const until = Date.now() + 5000; cache.queueState().foreground > 0 && Date.now() < until && !job.fg;) await sleep(100);
  }
  const missing = (e) => /HTTP (?:403|404|410)\b/.test(e?.message || '');
  const netErr = (e) => Object.assign(new Error(e?.message || String(e)), { net: true });
  async function fetchArxiv(u, job) {
    if (!cache.cached(u)) { await idle(job); if (!cache.cached(u)) await arxivGate(job); }
    await cache.ensure(u, { fg: job.fg });
    return cache.read(u).toString('utf-8');
  }
  function loop(path) {
    return new Promise((resolve, reject) => {
      const r = http.get(LOOP + path, { timeout: 180e3 }, (res) => {
        let b = ''; res.setEncoding('utf8');
        res.on('data', (c) => { b += c; });
        res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* not JSON */ } if (res.statusCode === 200 && j) resolve(j); else reject(new Error(j?.error || `HTTP ${res.statusCode}`)); });
      });
      r.on('timeout', () => r.destroy(new Error('timeout')));
      r.on('error', reject);
    });
  }

  // ------------------------------------------------------------ build ----
  const isArxiv = (it) => /^arxiv:/.test(it.id);
  function srcOf(it) {
    if (isArxiv(it)) return 'latexml';
    if (it.kind === 'html' && /\/graphql\?/.test(it.url || '')) return 'post';
    if (it.kind === 'web' && it.url) return 'web';
    if (it.kind === 'scan' && it.ia) return 'ocr';
    return 'none';
  }
  const NO_LEAD = { show: 'none', pics: [], by: 'score' };
  const failed = (src, url, err) => ({ src, url, err, lead: NO_LEAD, parts: [] });

  async function buildArxiv(it, job) {
    const aid = it.id.slice(6);
    let html = null, used = null;
    for (const u of [`https://arxiv.org/html/${aid}`, `https://ar5iv.labs.arxiv.org/html/${aid}`]) {
      try { html = await fetchArxiv(u, job); } catch (e) { if (missing(e)) continue; throw netErr(e); }
      // ar5iv answers 200 with the abstract page for papers it lacks.
      if (html.includes('ltx_document')) { used = u; break; }
      html = null;
    }
    if (!used) return failed('latexml', null, 'no-html');
    let url = used; try { url = cache.meta(used).final || used; } catch { /* evicted */ }
    let figures = null;
    try { const j = JSON.parse(readFileSync(join(FIG_DIR, safe(aid) + '.json'), 'utf-8')); if (j.src && Array.isArray(j.figures)) figures = j.figures; } catch { /* not built yet */ }
    await idle(job);
    const r = await parseJob({ src: 'latexml', html, url, base: used, aid, figures }, job);
    // Inline SVG pictures are served by /figures/svg (65-figures.mjs) from these files.
    if (r.svgs?.length) {
      const d = join(FIG_DIR, 'svg', safe(aid));
      mkdirSync(d, { recursive: true });
      for (const s of r.svgs) { const f = join(d, `${safe(s.f)}-${s.k}.svg`); if (!existsSync(f)) writeFileSync(f, s.svg); }
    }
    return { ...r.ex, cpu: r.cpu };
  }
  async function buildPost(it, job) {
    const host = new URL(it.url).host;
    const pid = (/_id:"([\w-]+)"/.exec(decodeURIComponent(it.url)) || [])[1] || it.id.replace(/^\w+:/, '');
    const pre = `https://${host}/graphql?query=${encodeURIComponent(`{post(input:{selector:{_id:"${pid}"}}){result{socialPreviewImageUrl}}}`)}`;
    await forum.run(job, async () => { await idle(job); try { await cache.ensure(it.url, { fg: job.fg }); } catch (e) { if (!missing(e)) throw netErr(e); } });
    if (!cache.cached(it.url)) return failed('post', it.page || null, 'empty');
    let preview = null;
    await forum.run(job, async () => { await idle(job); try { await cache.ensure(pre, { fg: job.fg }); } catch (e) { if (!missing(e) && !/HTTP 400/.test(e.message)) throw netErr(e); } });
    try { if (cache.cached(pre)) preview = JSON.parse(cache.read(pre).toString('utf-8'))?.data?.post?.result?.socialPreviewImageUrl || null; } catch { /* no preview */ }
    let htmlBody = null;
    try { htmlBody = JSON.parse(cache.read(it.url).toString('utf-8'))?.data?.post?.result?.htmlBody || null; } catch { /* not JSON */ }
    if (!htmlBody) return failed('post', it.page || null, 'empty');
    await idle(job);
    const r = await parseJob({ src: 'post', htmlBody, page: it.page || it.url, preview }, job);
    return { ...r.ex, cpu: r.cpu };
  }
  async function buildWeb(it, job) {
    await hostSem(it.url).run(job, async () => { await idle(job); try { await cache.ensure(it.url, { fg: job.fg }); } catch (e) { if (!missing(e)) throw netErr(e); } });
    if (!cache.cached(it.url)) return failed('web', it.url, 'empty');
    let m = {}; try { m = cache.meta(it.url); } catch { /* evicted */ }
    if (m.type && !/html|xml/i.test(m.type)) return failed('web', it.url, 'unsupported');
    const html = cache.read(it.url).toString('utf-8');
    await idle(job);
    const r = await parseJob({ src: 'web', html, url: m.final || it.url }, job);
    return { ...r.ex, cpu: r.cpu };
  }
  async function buildScan(it, job) {
    let pages = null, labels = null;
    await books.run(job, async () => {
      await idle(job);
      const enc = encodeURIComponent(it.ia);
      const [t, l] = await Promise.allSettled([loop(`/ocr/text?ia=${enc}`), loop(`/ocr/labels?ia=${enc}`)]);
      if (t.status === 'rejected') { if (/no OCR|no such page|HTTP 40[34]\b|bad id/i.test(t.reason?.message || '')) return; throw netErr(t.reason); }
      pages = t.value.pages || [];
      if (l.status === 'fulfilled') labels = l.value.labels || null;
    });
    if (!pages) return failed('ocr', `https://archive.org/details/${it.ia}`, 'empty');
    const r = await parseJob({ src: 'ocr', pages, labels, ia: it.ia, n: it.n }, job);
    return { ...r.ex, cpu: r.cpu };
  }

  const building = new Map(); // id -> job {fg, p}
  const bgSem = new Sem(2);
  async function build(it, job) {
    const t0 = Date.now();
    const src = srcOf(it);
    let res;
    if (src === 'none') res = failed('none', null, isArxiv(it) ? 'no-html' : 'unsupported');
    else if (src === 'latexml') res = await buildArxiv(it, job);
    else if (src === 'post') res = await buildPost(it, job);
    else if (src === 'web') res = await buildWeb(it, job);
    else res = await buildScan(it, job);
    const { cpu, ...rest } = res;
    const ex = { v: VER, id: it.id, at: Date.now(), ms: Date.now() - t0, ...(cpu != null ? { cpu: Math.round(cpu) } : {}), ...rest };
    if (!ex.err && !ex.parts.length && ex.lead.show === 'none') ex.err = 'empty';
    save(ex);
    stats.built++;
    return ex;
  }
  /** The stored extract of an item, building it (once, shared) when needed. */
  function getExtract(it, { fg }) {
    const hit = stored(it.id);
    if (hit) { stats.hits++; return Promise.resolve(hit); }
    let job = building.get(it.id);
    if (job) { if (fg && !job.fg) promote(job); return job.p; }
    job = { fg, id: it.id, urls: [] };
    const run = async () => {
      let held = false;
      if (!job.fg) held = await bgSem.acquire(job);
      try { return await build(it, job); } finally { bgSem.release(held); }
    };
    job.p = run().catch((e) => { stats.failed++; throw e; }).finally(() => building.delete(it.id));
    building.set(it.id, job);
    return job.p;
  }
  function promote(job) {
    job.fg = true;
    bgSem.promote(job); forum.promote(job); books.promote(job); for (const s of hosts.values()) s.promote(job);
    // A fetch already in flight in cache.mjs moves up (ensure() on a URL in flight only promotes it).
    const it = corpus?.byId.get(job.id);
    if (!it) return;
    const urls = isArxiv(it) ? [`https://arxiv.org/html/${it.id.slice(6)}`, `https://ar5iv.labs.arxiv.org/html/${it.id.slice(6)}`] : [it.url];
    for (const u of urls) if (u && !cache.cached(u) && cache.progressOf(u)) cache.ensure(u, { fg: true }).catch(() => {});
  }

  // The served view: highlights and plate verdicts applied, `hl` attached.
  const unresolved = new Set();
  function viewOf(ex, it) {
    const H = highlights();
    const hl = H.items[ex.id] || null;
    let figures = null;
    if (hl && ex.src === 'latexml') {
      const missingRef = (hl.figures || []).some((f) => !ex.parts.some((p) => p.loc?.anchor === f.ref));
      if (missingRef) try { figures = JSON.parse(readFileSync(join(FIG_DIR, safe(ex.id.slice(6)) + '.json'), 'utf-8')).figures; } catch { /* none */ }
    }
    const view = serveView(ex, { hl, verdicts, item: it, figures });
    if (hl) for (const f of hl.figures || []) {
      const ok = view.lead.by === 'hl' && view.lead.pics.some((p) => p.loc?.anchor === f.ref || p.pid === `plate:${f.ref}`);
      const key = `${ex.id}#${f.ref}`;
      if (!ok && !unresolved.has(key)) { unresolved.add(key); console.warn(`extract: highlight figure ${f.ref} of ${ex.id} does not resolve`); }
    }
    return view;
  }

  // ------------------------------------------------------------ feeds ----
  const feeds = new Map(); // `${type}|${lane}|${per}` -> state
  function feedState(type, lane, per) {
    loadCorpus(); highlights(); // either may clear the states
    const key = `${type}|${lane}|${per}`;
    let st = feeds.get(key);
    if (!st) {
      let list = laneList(lane);
      if (type === 'highlights') list = list.filter((id) => HL.items[id]);
      st = { key, type, lane, per, list, pos: 0, cards: [], leads: new Map(), retry: [], retried: new Set(), done: false, want: 0, wantUntil: 0, walking: null, inflight: new Set(), waiters: [], failedIds: 0 };
      feeds.set(key, st);
    }
    return st;
  }
  async function cardsOf(st, id) {
    const it = corpus.byId.get(id);
    if (!it) return { cards: [] };
    st.inflight.add(id);
    try {
      const ex = await getExtract(it, { fg: true });
      const view = viewOf(ex, it);
      return { cards: cardsFor(st.type, view, st.per, { item: it, sample: HL.sample }), avatar: avatarOf(view) };
    } catch (e) { return { failed: true, err: e }; } finally { st.inflight.delete(id); }
  }
  const settle = (st) => {
    st.waiters = st.waiters.filter((w) => { if (st.cards.length >= w.need || st.done) { w.resolve(); return false; } return true; });
  };
  function walkFeed(st) {
    if (st.walking) return st.walking;
    st.walking = (async () => {
      const win = [];
      const wanted = () => st.cards.length < st.want && Date.now() < st.wantUntil;
      const next = () => {
        if (st.pos < st.list.length) return st.list[st.pos++];
        const id = st.retry.shift(); // network failures, once each, after the end of the list
        if (id) st.retried.add(id);
        return id;
      };
      let lastYield = Date.now();
      for (;;) {
        while (win.length < 3 && wanted() && (st.pos < st.list.length || st.retry.length)) { const id = next(); win.push({ id, p: cardsOf(st, id) }); }
        if (!win.length) break;
        const w = win.shift();
        const r = await w.p;
        if (r.failed) { if (!st.retried.has(w.id) && r.err?.net) st.retry.push(w.id); else st.failedIds++; }
        else {
          for (const c of r.cards) st.cards.push(c);
          if (r.cards.length) st.leads.set(w.id, r.avatar ?? null);
        }
        if (st.pos >= st.list.length && !st.retry.length && !win.length) st.done = true;
        settle(st);
        if (Date.now() - lastYield > 8) { await tick(); lastYield = Date.now(); } // items read from disk resolve at once
      }
      if (st.pos >= st.list.length && !st.retry.length) st.done = true;
      settle(st);
    })().finally(() => { st.walking = null; });
    return st.walking;
  }
  const waitFor = (st, need, ms) => new Promise((resolve) => {
    if (st.cards.length >= need || st.done) return resolve();
    const w = { need, resolve };
    st.waiters.push(w);
    setTimeout(() => { st.waiters = st.waiters.filter((x) => x !== w); resolve(); }, ms);
  });

  // Read-ahead: background extraction of the next items of a list, 2 at a time.
  let bgQueue = []; // [{id, group}]
  let bgRunning = 0;
  const bgBusy = new Map(); // group -> running count
  function readAhead(st) {
    const ids = [];
    for (let i = st.pos; i < st.list.length && ids.length < 24; i++) { const id = st.list[i]; if (!onDisk(id) && !building.has(id)) ids.push(id); }
    bgQueue = bgQueue.filter((x) => x.group !== st.key).concat(ids.map((id) => ({ id, group: st.key })));
    pumpBg();
  }
  function pumpBg() {
    while (bgRunning < 2 && bgQueue.length) {
      const { id, group } = bgQueue.shift();
      const it = corpus?.byId.get(id);
      if (!it || onDisk(id) || building.has(id)) continue;
      bgRunning++; bgBusy.set(group, (bgBusy.get(group) || 0) + 1);
      getExtract(it, { fg: false }).catch(() => {}).finally(() => { bgRunning--; bgBusy.set(group, bgBusy.get(group) - 1); pumpBg(); });
    }
  }

  // ----------------------------------------------------------- routes ----
  const bad = (id) => !id || id.length > 400 || /[\u0000-\u001f]/.test(id);
  app.route('GET', '/extract', async (req, res, url) => {
    const id = url.searchParams.get('id') || '';
    if (bad(id)) return app.json(res, { error: 'expected id=<item id>' }, 400);
    const it = loadCorpus().byId.get(id);
    if (!it) return app.json(res, { error: 'unknown id' }, 404);
    try {
      const ex = await getExtract(it, { fg: url.searchParams.get('bg') !== '1' });
      stats.served++;
      app.json(res, viewOf(ex, it));
    } catch (e) { app.json(res, { error: String(e.message || e) }, 502); }
  });

  app.route('GET', '/extract/feed', async (req, res, url) => {
    const t0 = Date.now();
    const q = url.searchParams;
    const type = q.get('type') || '';
    if (!FEEDS[type]) return app.json(res, { error: `type must be one of ${Object.keys(FEEDS).join(', ')}` }, 400);
    const lane = q.get('lane') || 'all';
    if (lane !== 'all' && !loadCorpus().lanes.has(lane)) return app.json(res, { error: 'unknown lane' }, 400);
    const int = (k, d, lo, hi) => { const v = q.has(k) ? Math.floor(Number(q.get(k))) : d; return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
    const offset = int('offset', 0, 0, 1e6), limit = int('limit', 40, 1, 100), per = int('per', FEEDS[type].per, 1, 10), wait = int('wait', 1500, 0, 8000);
    stats.feedRequests++;
    const st = feedState(type, lane, per);
    const need = offset + limit;
    st.want = Math.max(st.want, need);
    st.wantUntil = Math.max(st.wantUntil, Date.now() + wait + 4000);
    if (st.cards.length < need && !st.done) { walkFeed(st); await waitFor(st, need, wait); }
    const cards = st.cards.slice(offset, offset + limit);
    const leads = {};
    for (const c of cards) if (!(c.id in leads)) leads[c.id] = st.leads.get(c.id) ?? null;
    const nextOff = offset + cards.length;
    app.json(res, {
      v: VER, type, lane, offset, next: nextOff, cards, leads,
      walked: st.pos, total: st.list.length, done: st.done && nextOff >= st.cards.length,
      pending: st.inflight.size + (bgBusy.get(st.key) || 0), ms: Date.now() - t0,
    });
    readAhead(st);
  });

  app.route('POST', '/extract/verdict', async (req, res) => {
    let b;
    try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON' }, 400); }
    const { id, pid, ok } = b || {};
    if (typeof id !== 'string' || !loadCorpus().byId.has(id) || !/^plate:k\d+$/.test(pid || '') || typeof ok !== 'boolean') return app.json(res, { error: 'expected {id, pid: "plate:k<page>", ok: boolean}' }, 400);
    verdicts.set(`${id}#${pid}`, ok);
    saveVerdicts();
    app.json(res, { ok: true });
  });

  app.status(() => ({
    extract: {
      cached: stats.files, hits: stats.hits, built: stats.built, failed: stats.failed,
      queue: bgQueue.length + bgSem.waiting, fg: [...building.values()].filter((j) => j.fg).length, bg: [...building.values()].filter((j) => !j.fg).length,
      gateWaits: gate.waits, cpu: { jobs: wQueue.length + (wBusy ? 1 : 0), ms: Math.round(stats.cpuMs), maxMs: Math.round(stats.cpuMax) },
      feeds: Object.fromEntries([...feeds.values()].map((st) => [st.per === FEEDS[st.type].per ? `${st.type}|${st.lane}` : st.key, { cards: st.cards.length, walked: st.pos, done: st.done }])),
    },
  }));
}
