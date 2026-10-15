// Learning from reading (docs/learning/spec.md §4-6): the profile service. It reads
// reading memory (app.memory, from 45-memory.mjs), the corpus, data/meta.json and
// data/tags.json, and recomputes the learned profile (server/learn.mjs) after
// judgments, while reading, when the corpus changes, and every 6 hours.
//
//   GET  /learn/profile.json?part=rank[&since=<at>]   what the feed needs (pre-serialized)
//   GET  /learn/profile.json                          the full profile (the Dashboard)
//   GET  /learn/why?id=<id> | ?ids=<id,…>             explanations
//   GET  /learn/features?q=<text>&limit=20            features by id or label
//   GET  /learn/history.json?days=30                  one line per local day
//   GET  /learn/reading.json?days=90                  time, items, pages per day; streaks; best reads
//   GET  /learn/finds.json                            items added by agent jobs, with their state
//   POST /learn/control {f, mode}                     boost | mute | ignore | null
//   POST /learn/import {aff, saved}                   the one-time state.aff migration
//   POST /learn/finds/mark {ids | all, st}            seen | new
//
// Everything lives under CACHE/learn/ (never the repo): profile.json, history.jsonl,
// opens.jsonl, controls.json, finds.json, import.json. STACKS_LEARN=0 turns it off.
// Other routes use app.learn (the current profile, the index, the corpus).
import { readFileSync, writeFileSync, renameSync, statSync, mkdirSync, appendFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import * as L from '../learn.mjs';

const ON = process.env.STACKS_LEARN !== '0';
const DAY = 864e5;
const r2 = (x) => Math.round(x * 100) / 100;
const FLOW = new Set(['html', 'web', 'text']);
const readJson = (f, dflt) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return dflt; } };
function writeJson(f, obj) { writeFileSync(f + '.tmp', typeof obj === 'string' ? obj : JSON.stringify(obj)); renameSync(f + '.tmp', f); }
const mtime = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };
const tick = () => new Promise((r) => setImmediate(r));
/** YYYY-MM-DD of the local day k days before t (calendar arithmetic, safe across DST). */
const dayBefore = (t, k) => { const d = new Date(t); return L.localDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - k, 12).getTime()); };

export default function (app) {
  const DIR = join(app.CACHE, 'learn');
  mkdirSync(DIR, { recursive: true });
  const F = (n) => join(DIR, n);
  const CORPUS = join(app.HERE, 'corpus.json');
  const META = join(app.HERE, 'data', 'meta.json'), META_DIR = join(app.HERE, 'data', 'meta');
  const TAGS = process.env.STACKS_TAGS ? resolve(process.env.STACKS_TAGS) : join(app.HERE, 'data', 'tags.json');

  // ---- state
  let items = [], lanes = {}, corpusAt = 0, index = null, sig = '';
  let controls = readJson(F('controls.json'), { v: 1, feat: {} });
  let finds = readJson(F('finds.json'), { v: 1, marks: {} });
  let imp = readJson(F('import.json'), null);
  let profile = readJson(F('profile.json'), null);
  if (profile && profile.gen !== L.GEN) profile = null; // a formula changed: recompute before serving
  let rankBody = null, fullBody = null, memoryAt = 0, lastMs = 0;
  const history = [];
  try { for (const l of readFileSync(F('history.jsonl'), 'utf-8').split('\n')) if (l) try { history.push(JSON.parse(l)); } catch { /* torn line */ } } catch { /* none yet */ }
  const opens = [], logged = new Set();
  try {
    const since = Date.now() - 40 * DAY;
    for (const l of readFileSync(F('opens.jsonl'), 'utf-8').split('\n')) {
      if (!l) continue;
      try { const o = JSON.parse(l); if (o.t >= since) { opens.push(o); logged.add(o.id + '|' + L.localDay(o.t)); } } catch { /* torn line */ }
    }
  } catch { /* none yet */ }
  const corpusHooks = [], updateHooks = [];

  const memory = () => app.memory?.index || new Map();
  const empty = () => ({ v: 1, gen: L.GEN, at: 0, on: true, params: {}, mu0: L.LEARN.mu0prior, exposures: 0, weight: 0, feat: {}, items: {}, pred: {}, phi: {}, lanes: {}, laneFactor: {}, seeds: [], new: [], calib: { rho: null, n: 0, byLane: {} } });
  function serialize() {
    const p = profile || empty();
    rankBody = JSON.stringify({ v: 1, gen: p.gen, at: p.at, on: true, B: L.LEARN.B, corpusAt: p.corpusAt ?? corpusAt, exposures: p.exposures, pred: p.pred, phi: p.phi, lanes: p.lanes, laneFactor: p.laneFactor, new: p.new });
    fullBody = JSON.stringify(p);
  }
  serialize();

  // ---- the corpus, metadata and tags
  function readMeta() {
    if (existsSync(META)) return readJson(META, {})?.items || null;
    // Until the parts are merged into data/meta.json, read them directly.
    try {
      const out = {};
      for (const f of readdirSync(META_DIR).filter((x) => /^part-\d+\.json$/.test(x)).sort()) Object.assign(out, readJson(join(META_DIR, f), {})?.items || {});
      return Object.keys(out).length ? out : null;
    } catch { return null; }
  }
  function metaSig() {
    if (existsSync(META)) return 'm' + mtime(META);
    try { return readdirSync(META_DIR).filter((x) => /^part-\d+\.json$/.test(x)).map((x) => mtime(join(META_DIR, x))).join(','); } catch { return ''; }
  }
  const signature = () => `${mtime(CORPUS)}|${metaSig()}|${mtime(TAGS)}`;
  let building = null;
  function rebuild() {
    if (building) return building;
    building = (async () => {
      const s = signature();
      let c;
      try { c = JSON.parse(readFileSync(CORPUS, 'utf-8')); } catch (e) { console.warn('learn: corpus.json unreadable:', e.message); return; }
      const tags = readJson(TAGS, null);
      const meta = readMeta();
      const b = L.indexBuilder(c.items || [], { tags, meta, lanes: c.lanes || {} });
      while (!b.step(2000)) await tick();
      const ix = b.result();
      await tick();
      items = c.items || []; lanes = c.lanes || {}; index = ix; corpusAt = Math.floor(mtime(CORPUS)); sig = s;
      for (const fn of corpusHooks) { try { fn(items); } catch (e) { console.warn('learn: corpus hook:', e.message); } }
    })().catch((e) => console.warn('learn: index failed:', e.message)).finally(() => { building = null; });
    return building;
  }

  // ---- body pages from compiled profiles (at most 50 new reads per recompute)
  let readProfile = null;
  import('../profile.mjs').then((m) => { readProfile = m.readProfile; }).catch(() => {});
  const bodies = new Map(); // id -> {n, at}
  let reads = 0;
  function nBodyOf(id) {
    const c = bodies.get(id);
    if (c && Date.now() - c.at < 3600e3) return c.n;
    if (!readProfile || reads >= 50) return c?.n ?? null;
    reads++;
    let n = null;
    try {
      const P = readProfile(id);
      if (P?.kind === 'pdf' && Array.isArray(P.pages) && P.pages.length) n = P.pages.filter((p) => p.role === 'body').length || null;
    } catch { /* unreadable */ }
    bodies.set(id, { n, at: Date.now() });
    return n;
  }

  // ---- recompute
  const pseudo = () => {
    if (!imp) return [];
    const out = [];
    for (const [l, a] of Object.entries(imp.lanes || {})) out.push({ f: 'lane:' + l, g: 'lane', W: 0.5 * Math.min(3, Math.abs(a)), y: a > 0 ? 0.8 : 0, t: imp.at });
    for (const [w, a] of Object.entries(imp.toks || {})) out.push({ f: 'w:' + w, g: 'tok', W: 0.5 * Math.min(1.5, Math.abs(a)), y: a > 0 ? 0.8 : 0, t: imp.at });
    return out;
  };
  let running = false, again = false, writeT = null, lastWrite = 0;
  function persist() {
    const go = () => { writeT = null; lastWrite = Date.now(); try { writeJson(F('profile.json'), fullBody); } catch (e) { console.warn('learn: could not write profile.json:', e.message); } };
    if (writeT) return;
    const wait = Math.max(0, lastWrite + 10e3 - Date.now());
    if (!wait) go(); else { writeT = setTimeout(go, wait); writeT.unref?.(); }
  }
  async function recompute() {
    if (!ON) return;
    if (running) { again = true; return; }
    running = true;
    try {
      if (!index || signature() !== sig) await rebuild();
      if (!index) return;
      reads = 0;
      const t0 = performance.now(), now = Date.now();
      const p = L.computeProfile({ items, index, memory: memory(), now, controls, pseudo: pseudo(), nBodyOf, errOf: (id) => !!app.jobs?.errorOf?.(id), marks: finds.marks || {}, opens });
      p.ms = Math.round(performance.now() - t0);
      p.memoryAt = memoryAt; p.corpusAt = corpusAt;
      profile = p; lastMs = p.ms;
      serialize();
      persist();
      const today = L.localDay(now);
      if (history.at(-1)?.d !== today) {
        const line = { d: today, at: now, mu0: p.mu0, exposures: p.exposures, lanes: p.lanes, top: Object.fromEntries(L.topFeatures(p, 80).map(([f, x]) => [f, x.l])) };
        history.push(line);
        try { appendFileSync(F('history.jsonl'), JSON.stringify(line) + '\n'); } catch (e) { console.warn('learn: history:', e.message); }
      }
      for (const fn of updateHooks) { try { fn(p); } catch (e) { console.warn('learn: update hook:', e.message); } }
    } catch (e) {
      console.warn('learn: recompute failed:', e.stack || e.message);
    } finally {
      running = false;
      if (again) { again = false; setImmediate(recompute); }
    }
  }
  let soonT = null, readT = null, readFirst = 0;
  function soon(ms = 250) {
    clearTimeout(soonT);
    soonT = setTimeout(() => { soonT = null; clearTimeout(readT); readT = null; recompute(); }, ms);
    soonT.unref?.();
  }
  function whileReading() {
    const now = Date.now();
    if (!readT) readFirst = now;
    clearTimeout(readT);
    readT = setTimeout(() => { readT = null; recompute(); }, Math.min(10e3, Math.max(0, readFirst + 60e3 - now)));
    readT.unref?.();
  }

  // ---- memory ops: judgments soon, reading in batches; the first open of an item each day is logged
  function logOpen(op) {
    const r = memory().get(op.id);
    if (!r || !Number.isFinite(op.s)) return;
    const d = L.localDay(op.s), key = op.id + '|' + d;
    if (logged.has(key)) return;
    if (r.v.some((v) => v[0] < op.s && L.localDay(v[0]) === d)) { logged.add(key); return; }
    logged.add(key);
    const i = index?.byId.get(op.id);
    const I = i != null && profile?._I ? profile._I[i] : profile?.pred?.[op.id] ?? 0;
    const row = r.v.find((v) => v[0] === op.s);
    const o = { id: op.id, t: op.s, I: Math.round(I * 1000) / 1000, via: op.via || row?.[4] || 'feed' };
    opens.push(o);
    try { appendFileSync(F('opens.jsonl'), JSON.stringify(o) + '\n'); } catch { /* read-only */ }
  }
  if (ON) app.memory?.subscribe((ops) => {
    let judge = false, read = false;
    for (const op of ops) {
      if (op.t > memoryAt) memoryAt = op.t;
      if (op.o === 'judge' || op.o === 'forget') judge = true; else read = true;
      if (op.o === 'visit') logOpen(op);
    }
    if (judge) soon(250); else if (read) whileReading();
  });

  // ---- explanations
  const lamOf = (p) => p._lam || new Map(Object.entries(p.feat || {}).map(([f, x]) => [f, x.l]));
  const ctlOf = (p) => p._ctl || new Map(Object.entries(controls.feat || {}).map(([f, x]) => [f, x.mode]));
  function findOf(it) {
    if (!it?.added) return null;
    const st = L.findState(it, memory().get(it.id), finds.marks?.[it.id], Date.now());
    return st ? { added: it.added, job: it.job || null, via: it.via || null, st } : null;
  }
  function why(id) {
    const i = index?.byId.get(id);
    if (i == null) return null;
    const p = profile || empty();
    const x = L.explainItem(index.feats[i], lamOf(p), index.labels, (f) => p.feat?.[f]?.c, ctlOf(p));
    const phi = p.phi?.[id] || 0, e = p.items?.[id];
    return { id, I: r2(x.I), term: r2(L.LEARN.B * x.I + phi), phi, state: e ? e.label : 'unread', chips: x.chips, rest: x.rest, read: e ? { label: e.label, y: e.y, j: e.j } : null, find: findOf(items[i]) };
  }

  // ---- reading statistics
  function reading(days) {
    const now = Date.now(), mem = memory(), today = L.localDay(now);
    const per = new Map();
    const at = (d) => { let x = per.get(d); if (!x) per.set(d, (x = { ms: 0, items: new Set(), finished: new Set(), pages: 0 })); return x; };
    const lanes30 = {}, since30 = now - 30 * DAY, best = [];
    const ex = profile?._ex;
    for (const [id, r] of mem) {
      const i = index?.byId.get(id), it = i != null ? items[i] : { id, kind: r.kind, lane: r.lane };
      const lane = it.lane || r.lane || 'other';
      for (const v of r.v || []) {
        const x = at(L.localDay(v[0]));
        x.ms += v[2] || 0;
        if ((v[2] || 0) >= 30e3) x.items.add(id);
        if (v[0] >= since30) lanes30[lane] = (lanes30[lane] || 0) + (v[2] || 0);
      }
      const tau = (FLOW.has(it.kind) ? L.LEARN.tau.flow : it.kind === 'scan' ? L.LEARN.tau.scan : L.LEARN.tau.pdf) * 1000;
      for (const s of r.seq || []) at(L.localDay(s[2] * 1000)).pages += Math.min(s[1] || 0, (s[3] || 0) / tau);
      const e = ex?.get(id)?.e || (i != null ? L.engagement(it, r) : null);
      if (e && L.isDone(e, r, it) && r.last) at(L.localDay(r.last)).finished.add(id);
      if (e && i != null && r.last >= now - 90 * DAY && !e.unopened) best.push({ id, t: it.t, lane, V: r2(e.y), label: e.label, j: e.L ? 'less' : e.S ? 'save' : e.M ? 'more' : null, last: r.last });
    }
    const list = [];
    for (let k = days - 1; k >= 0; k--) {
      const d = dayBefore(now, k), x = per.get(d);
      list.push({ d, ms: x ? Math.round(x.ms) : 0, items: x ? x.items.size : 0, finished: x ? x.finished.size : 0, pages: x ? Math.round(x.pages * 10) / 10 : 0 });
    }
    // Streaks: days with at least 10 minutes; the current one runs to today, or to yesterday while today is short.
    const MIN = 600e3, good = new Set([...per].filter(([, x]) => x.ms >= MIN).map(([d]) => d));
    let cur = 0;
    for (let k = good.has(today) ? 0 : 1; good.has(dayBefore(now, k)); k++) cur++;
    let bestRun = 0, run = 0, prev = null;
    for (const d of [...good].sort()) {
      run = prev && dayBefore(L.dateAt(d) + 12 * 3600e3, 1) === prev ? run + 1 : 1;
      prev = d; bestRun = Math.max(bestRun, run);
    }
    const total = (n) => {
      const ds = new Set(Array.from({ length: n }, (_, k) => dayBefore(now, k)));
      const o = { ms: 0, items: new Set(), finished: new Set(), pages: 0 };
      for (const [d, x] of per) if (ds.has(d)) { o.ms += x.ms; for (const id of x.items) o.items.add(id); for (const id of x.finished) o.finished.add(id); o.pages += x.pages; }
      return { ms: Math.round(o.ms), items: o.items.size, finished: o.finished.size, pages: Math.round(o.pages) };
    };
    best.sort((a, b) => b.V - a.V || b.last - a.last);
    for (const l of Object.keys(lanes30)) lanes30[l] = Math.round(lanes30[l]);
    return { days: list, lanes30, streak: { current: cur, best: bestRun, minMs: MIN }, totals: { week: total(7), month: total(30) }, best: best.slice(0, 8) };
  }

  // ---- finds
  function findsList() {
    const now = Date.now(), mem = memory(), out = [], counts = { new: 0, seen: 0, kept: 0, dismissed: 0 }, byJob = {};
    for (const it of items) {
      if (!it.added) continue;
      const st = L.findState(it, mem.get(it.id), finds.marks?.[it.id], now);
      if (!st) continue;
      counts[st]++;
      const j = it.job || 'manual';
      (byJob[j] ||= { new: 0, seen: 0, kept: 0, dismissed: 0 })[st]++;
      out.push({ id: it.id, t: it.t, a: it.a || '', lane: it.lane, kind: it.kind, added: it.added, job: it.job || null, via: it.via || null, why: it.why || '', st, I: profile?.pred?.[it.id] ?? 0 });
    }
    out.sort((a, b) => (a.added < b.added ? 1 : a.added > b.added ? -1 : b.I - a.I));
    return { at: profile?.at || 0, corpusAt, items: out, counts, byJob };
  }

  // ---- routes
  const off = (res) => app.json(res, { on: false });
  app.route('GET', '/learn/profile.json', (req, res, url) => {
    if (!ON) return off(res);
    const part = url.searchParams.get('part');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    if (part === 'rank') {
      const since = url.searchParams.get('since');
      const at = profile?.at || 0;
      if (since != null && Number(since) === at) return res.end(JSON.stringify({ same: true, at }));
      return res.end(rankBody);
    }
    res.end(fullBody);
  });
  app.route('GET', '/learn/why', (req, res, url) => {
    if (!ON) return off(res);
    const ids = url.searchParams.get('ids');
    if (ids != null) {
      const out = {};
      for (const id of ids.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)) out[id] = why(id);
      return app.json(res, { items: out });
    }
    const w = why(url.searchParams.get('id') || '');
    return w ? app.json(res, w) : app.json(res, { error: 'unknown item (or the index is still building)' }, 404);
  });
  app.route('GET', '/learn/features', (req, res, url) => {
    if (!ON) return off(res);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 20));
    const p = profile || empty(), score = (x) => Math.abs(x.l) * Math.sqrt(x.W);
    const row = (f, x) => ({ f, label: x?.label || index?.labels.get(f) || L.labelOf(f), g: x?.g || L.groupOf(f), l: x?.l ?? 0, l0: x?.l0 ?? 0, W: x?.W ?? 0, c: x?.c || null, ex: x?.ex || [], ctl: x?.ctl || null });
    if (!q) return app.json(res, { items: Object.entries(p.feat).filter(([, x]) => x.ctl !== 'ignore').sort((a, b) => score(b[1]) - score(a[1])).slice(0, limit).map(([f, x]) => row(f, x)) });
    const hit = (f, label) => f.toLowerCase().includes(q) || String(label || '').toLowerCase().includes(q);
    const known = Object.entries(p.feat).filter(([f, x]) => hit(f, x.label)).sort((a, b) => score(b[1]) - score(a[1])).map(([f, x]) => row(f, x));
    const seen = new Set(known.map((x) => x.f)), rest = [];
    if (index) for (const [f, label] of index.labels) if (!seen.has(f) && hit(f, label)) rest.push([f, index.inv.get(f)?.length || 0]);
    rest.sort((a, b) => b[1] - a[1]);
    app.json(res, { items: [...known, ...rest.map(([f]) => row(f, null))].slice(0, limit) });
  });
  app.route('GET', '/learn/history.json', (req, res, url) => {
    if (!ON) return off(res);
    const days = Math.max(1, Math.min(3660, Number(url.searchParams.get('days')) || 30));
    const from = dayBefore(Date.now(), days - 1);
    app.json(res, { days: history.filter((h) => h.d >= from) });
  });
  app.route('GET', '/learn/reading.json', (req, res, url) => {
    if (!ON) return off(res);
    const days = Math.max(1, Math.min(730, Number(url.searchParams.get('days')) || 90));
    app.json(res, reading(days));
  });
  app.route('GET', '/learn/finds.json', (req, res) => (ON ? app.json(res, findsList()) : off(res)));
  app.route('POST', '/learn/control', async (req, res) => {
    if (!ON) return off(res);
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON' }, 400); }
    const f = typeof b?.f === 'string' ? b.f.trim() : '';
    if (!/^[a-z]+:.{1,300}$/s.test(f)) return app.json(res, { error: 'f must be a feature id such as tag:reasoning-models' }, 400);
    if (b.mode != null && !['boost', 'mute', 'ignore'].includes(b.mode)) return app.json(res, { error: 'mode must be boost, mute, ignore or null' }, 400);
    controls.feat ||= {};
    if (b.mode) controls.feat[f] = { mode: b.mode, at: Date.now() }; else delete controls.feat[f];
    try { writeJson(F('controls.json'), controls); } catch (e) { return app.json(res, { error: e.message }, 500); }
    soon(250);
    app.json(res, { ok: true, ctl: controls.feat });
  });
  app.route('POST', '/learn/import', async (req, res) => {
    if (!ON) return off(res);
    if (imp) return app.json(res, { ok: true, already: true });
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON' }, 400); }
    if (!index) await rebuild();
    const now = Date.now(), mem = memory(), ops = [];
    const saved = (Array.isArray(b?.saved) ? b.saved : []).filter((x) => typeof x === 'string' && x && x.length <= 300).slice(0, 5000);
    for (const id of new Set(saved)) {
      const r = mem.get(id);
      if (r && L.replay(r.jl).S) continue;
      ops.push({ o: 'judge', id, t: r ? Math.max(r.first || 0, now - 30 * DAY) : now - 30 * DAY, j: 'save' });
    }
    const known = new Set(items.map((it) => it.lane));
    const laneA = {}, tokA = {};
    for (const [l, a] of Object.entries(b?.aff?.lane || {})) if (known.has(l) && Number.isFinite(+a) && +a !== 0) laneA[l] = +a;
    for (const [w, a] of Object.entries(b?.aff?.tok || {})) if (Number.isFinite(+a) && Math.abs(+a) >= 0.5 && index?.fidOf?.has('w:' + w)) tokA[w] = +a;
    imp = { at: now, saves: ops.length, lanes: laneA, toks: tokA };
    try { writeJson(F('import.json'), imp); } catch (e) { imp = null; return app.json(res, { error: e.message }, 500); }
    if (ops.length) app.memory?.take(ops);
    soon(250);
    app.json(res, { ok: true, imported: { saves: ops.length, lanes: Object.keys(laneA).length, toks: Object.keys(tokA).length } });
  });
  app.route('POST', '/learn/finds/mark', async (req, res) => {
    if (!ON) return off(res);
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON' }, 400); }
    if (!['seen', 'new'].includes(b?.st)) return app.json(res, { error: 'st must be seen or new' }, 400);
    const ids = b.all ? findsList().items.map((x) => x.id) : (Array.isArray(b.ids) ? b.ids : []).filter((x) => typeof x === 'string').slice(0, 5000);
    finds.marks ||= {};
    for (const id of ids) finds.marks[id] = { st: b.st, at: Date.now() };
    // Marks of items no longer finds are dropped.
    const live = new Set(items.filter((it) => it.added).map((it) => it.id));
    for (const id of Object.keys(finds.marks)) if (!live.has(id)) delete finds.marks[id];
    try { writeJson(F('finds.json'), finds); } catch (e) { return app.json(res, { error: e.message }, 500); }
    soon(250);
    app.json(res, { ok: true, n: ids.length });
  });

  app.status(() => (ON
    ? { learn: { on: true, at: profile?.at || 0, ms: lastMs || profile?.ms || 0, exposures: profile?.exposures || 0, features: Object.keys(profile?.feat || {}).length }, corpusAt }
    : { learn: { on: false }, corpusAt }));

  /** For other routes (96-jobs): the current profile, index and corpus, and hooks. */
  app.learn = {
    on: ON,
    get profile() { return profile; },
    get index() { return index; },
    get items() { return items; },
    get lanes() { return lanes; },
    get corpusAt() { return corpusAt; },
    ready: () => rebuild(),
    onCorpus(fn) { corpusHooks.push(fn); },
    onUpdate(fn) { updateHooks.push(fn); },
    why, recompute,
  };

  if (!ON) return;
  // ---- start: build the index, then recompute; watch the corpus; decay every 6 h and after midnight
  app.onStart(() => {
    rebuild().then(() => recompute());
    const watch = setInterval(() => { if (!building && signature() !== sig) recompute(); }, 30e3);
    watch.unref?.();
    const six = setInterval(() => recompute(), 6 * 3600e3);
    six.unref?.();
    const midnight = () => {
      const d = new Date(), next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 1).getTime();
      const t = setTimeout(() => { recompute(); midnight(); }, next - Date.now());
      t.unref?.();
    };
    midnight();
  });
}
