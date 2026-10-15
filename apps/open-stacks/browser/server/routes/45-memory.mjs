// Reading memory: for every item you have opened, where you left it, how long
// you spent, which pages you saw and in what order, and your judgments. The UI
// (ui/js/features/memory.js) posts small ops in batches; each is applied to an
// in-memory index and appended to CACHE/memory.log. Now and then the index is
// written to CACHE/memory.json and the log starts over, so a start loads one
// snapshot and replays a short log: nothing is lost across restarts or a
// crash, and 10k items cost a few MB. Telemetry (70-events.mjs) keeps the raw
// event log; this is the per-item state built from what you did. On the very
// first run, time spent and visits are backfilled from that event log.
//
//   GET  /memory              -> {now, items: {id: brief}}  (the UI loads this at start)
//   GET  /memory/item?id=     -> one item's full record
//   GET  /memory/days         -> {days: {YYYY-MM-DD: active ms}}
//   POST /memory {ops: [...]} -> {ok, n}
//   GET  /memory/export.json              everything, with titles
//   GET  /memory/export.csv[?rows=items|visits|pages]
//
// Ops (each has id and t, epoch ms):
//   visit {s, e, a, ti?, lane?, kind?}  a visit: start, end so far, active ms (window shown, not
//                                       idle); upserted by s, so it is sent again as it grows
//   at    {k, c, n, f, col?, g?, lay?}  the spread on screen settled: first page k (0-based;
//                                       for flow documents f=1, a stable page), c pages of n
//   saw   {k, c, s, ms, seen}           time on that spread (started at s); seen: long enough
//                                       to count its pages as seen. Upserted by s.
//   judge {j}                           save | unsave | less | more
//   forget                              drop the item's record
//
// A record: {n, f, first, last, a (active ms), nv (visits), v: [[s, e, a]...] (latest 80),
//   pos: {k, c, t, col?, g?, lay?}, far (furthest page), seen: [[a, b]...] (page ranges),
//   sc (pages seen), seq: [[k, c, sSec, ms]...] (spreads in order, latest 600), j: {judgment: t},
//   jl: [[j, t]...], ti, lane, kind}
import { readFileSync, writeFileSync, appendFileSync, renameSync, existsSync, readdirSync, createReadStream, statSync } from 'fs';
import { writeFile, rename } from 'fs/promises';
import { createInterface } from 'readline';
import { join } from 'path';

const MAX_V = 80, MAX_SEQ = 600, MAX_JL = 20, COMPACT_AT = 4000;
const day = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const num = (x, d = 0) => (Number.isFinite(Number(x)) ? Number(x) : d);
const int = (x, d = 0) => Math.round(num(x, d));

/** Add pages a..b to sorted, disjoint ranges; returns the new ranges. */
export function addRange(rs, a, b) {
  const out = []; let placed = false;
  for (const [x, y] of rs) {
    if (y < a - 1) out.push([x, y]);
    else if (x > b + 1) { if (!placed) { out.push([a, b]); placed = true; } out.push([x, y]); }
    else { a = Math.min(a, x); b = Math.max(b, y); }
  }
  if (!placed) out.push([a, b]);
  return out;
}
const count = (rs) => rs.reduce((s, [a, b]) => s + b - a + 1, 0);

/** Apply one op to the index (a Map id -> record). Ops are replayed at start, so this must not look at the clock. */
export function apply(index, op) {
  const id = op.id, t = num(op.t);
  if (op.o === 'forget') { index.delete(id); return; }
  let r = index.get(id);
  if (!r) { r = { first: t, last: t, a: 0, nv: 0, v: [], far: -1, seen: [], sc: 0, seq: [], j: {}, jl: [] }; index.set(id, r); }
  switch (op.o) {
    case 'visit': {
      const s = num(op.s, t), e = Math.max(s, num(op.e, t)), a = Math.max(0, Math.min(int(op.a), e - s + 2000));
      const v = r.v.find((x) => x[0] === s);
      if (v) { r.a += a - v[2]; v[1] = e; v[2] = a; }
      else if (r.v.length < MAX_V || s > r.v[0][0]) { r.v.push([s, e, a]); r.v.sort((x, y) => x[0] - y[0]); if (r.v.length > MAX_V) r.v.shift(); r.nv++; r.a += a; }
      r.first = Math.min(r.first, s); r.last = Math.max(r.last, e);
      for (const k of ['ti', 'lane', 'kind']) if (typeof op[k] === 'string' && op[k]) r[k] = op[k].slice(0, 300);
      break;
    }
    case 'at': {
      const k = Math.max(0, int(op.k)), c = Math.max(1, int(op.c, 1));
      if (op.n > 0) r.n = int(op.n);
      r.f = op.f ? 1 : 0;
      r.pos = { k, c, t };
      if (op.col != null) r.pos.col = int(op.col);
      if (op.g) r.pos.g = String(op.g).slice(0, 60);
      if (op.lay && typeof op.lay === 'object') r.pos.lay = op.lay;
      r.far = Math.max(r.far, k + c - 1);
      r.last = Math.max(r.last, t);
      break;
    }
    case 'saw': {
      const k = Math.max(0, int(op.k)), c = Math.max(1, int(op.c, 1)), s = Math.round(num(op.s, t) / 1000), ms = Math.max(0, int(op.ms));
      const last = r.seq.at(-1);
      if (last && last[2] === s && last[0] === k && last[1] === c) last[3] = Math.max(last[3], ms);
      else { r.seq.push([k, c, s, ms]); if (r.seq.length > MAX_SEQ) r.seq.shift(); }
      if (op.seen) { r.seen = addRange(r.seen, k, k + c - 1); r.sc = count(r.seen); r.far = Math.max(r.far, k + c - 1); }
      r.last = Math.max(r.last, t);
      break;
    }
    case 'judge': {
      const j = String(op.j || '').slice(0, 12); if (!j) break;
      r.j[j] = t; r.jl.push([j, t]); if (r.jl.length > MAX_JL) r.jl.shift();
      break;
    }
  }
}

/** What the UI keeps for every item: enough to resume, paint progress and list history. */
export function brief(r) {
  const b = { last: r.last, first: r.first, a: r.a, nv: r.nv, far: r.far, sc: r.sc };
  if (r.n) b.n = r.n;
  if (r.f) b.f = 1;
  if (r.pos) { b.k = r.pos.k; b.c = r.pos.c; if (r.pos.col != null) b.col = r.pos.col; if (r.pos.g) b.g = r.pos.g; b.at = r.pos.t; }
  if (r.seen.length) b.seen = r.seen;
  const saved = r.j.save && !(r.j.unsave > r.j.save);
  if (saved) b.saved = 1;
  if (r.j.less) b.less = r.j.less;
  if (r.j.more) b.more = r.j.more;
  if (r.ti) b.ti = r.ti;
  return b;
}

export default function (app) {
  const SNAP = join(app.CACHE, 'memory.json'), LOG = join(app.CACHE, 'memory.log');
  const index = new Map();
  let logLines = 0, meta = {};
  const fresh = !existsSync(SNAP) && !existsSync(LOG);

  // ---- load: the snapshot, then the log written since
  try {
    const snap = JSON.parse(readFileSync(SNAP, 'utf-8'));
    meta = snap.meta || {};
    for (const [id, r] of Object.entries(snap.items || {})) index.set(id, r);
  } catch (e) { if (existsSync(SNAP)) console.warn('memory: could not read memory.json:', e.message); }
  try {
    for (const line of readFileSync(LOG, 'utf-8').split('\n')) {
      if (!line) continue;
      logLines++;
      try { apply(index, JSON.parse(line)); } catch { /* a torn last line after a crash */ }
    }
  } catch { /* no log yet */ }

  // ---- compaction: write the index as one snapshot, a few hundred items per
  // tick so a big index never holds up the proxy; ops that arrive meanwhile are
  // logged, then applied once the snapshot is down.
  let compacting = null, held = [];
  async function compact() {
    if (compacting) return compacting;
    compacting = (async () => {
      const parts = [], ids = [...index.keys()];
      for (let j = 0; j < ids.length; j += 400) {
        for (const id of ids.slice(j, j + 400)) parts.push(JSON.stringify(id) + ':' + JSON.stringify(index.get(id)));
        await new Promise((r) => setImmediate(r));
      }
      const body = `{"v":1,"meta":${JSON.stringify({ ...meta, at: Date.now() })},"items":{\n${parts.join(',\n')}\n}}\n`;
      await writeFile(SNAP + '.tmp', body);
      await rename(SNAP + '.tmp', SNAP);
      // The log now holds only what arrived while writing.
      writeFileSync(LOG, held.map((op) => JSON.stringify(op) + '\n').join(''));
      logLines = held.length;
    })().catch((e) => console.warn('memory: compaction failed:', e.message)).finally(() => {
      for (const op of held) apply(index, op);
      held = []; compacting = null;
    });
    return compacting;
  }

  function take(ops) {
    const lines = [];
    for (const op of ops) {
      if (!op || typeof op.id !== 'string' || !op.id || op.id.length > 300 || typeof op.o !== 'string') continue;
      if (!['visit', 'at', 'saw', 'judge', 'forget'].includes(op.o)) continue;
      const line = JSON.stringify(op);
      if (line.length > 4000) continue;
      lines.push(line);
      if (compacting) held.push(op); else apply(index, op);
    }
    if (lines.length) {
      try { appendFileSync(LOG, lines.join('\n') + '\n'); logLines += lines.length; } catch (e) { console.warn('memory: log write failed:', e.message); }
    }
    if (logLines > COMPACT_AT && !compacting) setTimeout(compact, 2000);
    return lines.length;
  }

  app.route('POST', '/memory', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { ok: false }, 400); }
    const ops = Array.isArray(b) ? b : b?.ops;
    if (!Array.isArray(ops)) return app.json(res, { ok: false }, 400);
    app.json(res, { ok: true, n: take(ops.slice(0, 2000)) });
  });

  app.route('GET', '/memory', (req, res) => {
    const out = {};
    for (const [id, r] of index) out[id] = brief(r);
    app.json(res, { now: Date.now(), items: out });
  });

  app.route('GET', '/memory/item', (req, res, url) => {
    const r = index.get(url.searchParams.get('id') || '');
    app.json(res, r ? { ...r, ...corpusInfo(url.searchParams.get('id')) } : null, r ? 200 : 404);
  });

  app.route('GET', '/memory/days', (req, res) => {
    const days = {};
    for (const r of index.values()) for (const [s, , a] of r.v) { const d = day(s); days[d] = (days[d] || 0) + a; }
    app.json(res, { days });
  });

  // ---- export, with titles from corpus.json (reloaded when it changes)
  let corpus = { mtime: 0, map: new Map() };
  function corpusInfo(id) {
    try {
      const f = join(app.HERE, 'corpus.json'); const m = statSync(f).mtimeMs;
      if (m !== corpus.mtime) corpus = { mtime: m, map: new Map(JSON.parse(readFileSync(f, 'utf-8')).items.map((it) => [it.id, it])) };
    } catch { /* keep the old map */ }
    const it = corpus.map.get(id);
    return it ? { title: it.t, author: it.a || '', year: it.y || '', lane: it.lane, kind: it.kind, url: it.page || it.url } : {};
  }
  const iso = (t) => (t ? new Date(t).toISOString() : '');
  function rowsOf(kind) {
    const list = [...index].sort((a, b) => b[1].last - a[1].last);
    if (kind === 'visits') {
      const rows = [['id', 'title', 'start', 'end', 'active_seconds']];
      for (const [id, r] of list) { const c = corpusInfo(id); for (const [s, e, a] of r.v) rows.push([id, c.title || r.ti || '', iso(s), iso(e), Math.round(a / 1000)]); }
      return rows;
    }
    if (kind === 'pages') {
      const rows = [['id', 'title', 'unit', 'first_page', 'pages', 'at', 'seconds']];
      for (const [id, r] of list) { const c = corpusInfo(id); for (const [k, n, s, ms] of r.seq) rows.push([id, c.title || r.ti || '', r.f ? 'stable page' : 'page', k + 1, n, iso(s * 1000), (ms / 1000).toFixed(1)]); }
      return rows;
    }
    const rows = [['id', 'title', 'author', 'year', 'lane', 'kind', 'url', 'unit', 'pages', 'pages_seen', 'seen_pct', 'furthest_page', 'last_page', 'active_minutes', 'visits', 'first_read', 'last_read', 'saved', 'less', 'more']];
    for (const [id, r] of list) {
      const c = corpusInfo(id), b = brief(r);
      rows.push([id, c.title || r.ti || '', c.author || '', c.year || '', c.lane || r.lane || '', c.kind || r.kind || '', c.url || '', r.f ? 'stable page' : 'page',
        r.n || '', r.sc, r.n ? Math.round((100 * r.sc) / r.n) : '', r.far >= 0 ? r.far + 1 : '', r.pos ? r.pos.k + 1 : '', (r.a / 60e3).toFixed(1), r.nv,
        iso(r.first), iso(r.last), b.saved ? 1 : 0, r.j.less ? 1 : 0, r.j.more ? 1 : 0]);
    }
    return rows;
  }
  const csvCell = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  app.route('GET', '/memory/export.csv', (req, res, url) => {
    const kind = url.searchParams.get('rows') || 'items';
    const csv = rowsOf(kind).map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="stacks-reading-${kind}-${day(Date.now())}.csv"` });
    res.end('﻿' + csv);
  });
  app.route('GET', '/memory/export.json', (req, res) => {
    const items = {};
    for (const [id, r] of [...index].sort((a, b) => b[1].last - a[1].last)) items[id] = { ...corpusInfo(id), ...r };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="stacks-reading-${day(Date.now())}.json"` });
    res.end(JSON.stringify({ exported: iso(Date.now()), units: 'pages are 0-based; for flow documents (f: 1) they are stable pages', items }, null, 1));
  });

  app.status(() => ({ memoryItems: index.size }));

  // ---- first run: time spent and visits from the telemetry log, so history starts full
  async function backfill() {
    let files = [];
    try { files = readdirSync(app.CACHE).filter((f) => /^events(-[\d-]+)?\.jsonl$/.test(f)).sort(); } catch { return; }
    if (!files.length) return;
    const ops = [];
    for (const f of files) {
      const rl = createInterface({ input: createReadStream(join(app.CACHE, f)), crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line.includes('"dwell"')) continue;
        let e; try { e = JSON.parse(line); } catch { continue; }
        const ms = Math.max(0, Math.min(num(e.ms), 6 * 3600e3));
        if (e.type === 'dwell' && typeof e.id === 'string' && ms > 0) ops.push({ o: 'visit', id: e.id, t: e.t, s: e.t - ms, e: e.t, a: ms, lane: e.lane });
      }
    }
    ops.sort((a, b) => a.s - b.s);
    for (const op of ops) if (!index.get(op.id)?.v.some((v) => v[0] === op.s)) apply(index, op);
    meta.backfilled = { from: 'events.jsonl', visits: ops.length, at: Date.now() };
    if (ops.length) { console.log(`memory: backfilled ${ops.length} visits from the telemetry log`); await compact(); }
  }
  app.onStart(() => {
    if (fresh) setTimeout(() => backfill().catch((e) => console.warn('memory: backfill failed:', e.message)), 3000);
    else if (logLines > COMPACT_AT / 4) setTimeout(compact, 20e3);
  });
}
