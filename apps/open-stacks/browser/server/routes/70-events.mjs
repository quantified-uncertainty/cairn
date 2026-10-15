// Local telemetry. The UI (ui/js/features/telemetry.js) posts batches of
// events to POST /events; they are appended to CACHE/events.jsonl and never
// leave this machine. GET /events/summary aggregates them for /stats.html.
//
// Event types (each line also has t, epoch ms):
//   session {vw, vh}           a page load
//   shown   {id, lane, kind}   an item came on screen
//   dwell   {id, lane, ms, turns}   active time on an item (visible, not idle)
//   lat     {nav, id, kind, ms}     navigation (key or click) to spread rendered
//   boot    {ms}               page load to the first spread
//   view    {view}, summary {id}, keys {counts}
//   cache   {hits, misses, fetched, bytes}   server-side deltas since the last batch
import { appendFileSync, statSync, renameSync, readdirSync, createReadStream, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { join } from 'path';

const MAX_FILE = 64 * 1024 * 1024; // rotate to events-YYYY-MM-DD.jsonl beyond this
const day = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const pct = (sorted, p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : null;
function percentiles(arr) {
  const s = Float64Array.from(arr).sort();
  return { n: s.length, p50: pct(s, 50), p90: pct(s, 90), p99: pct(s, 99) };
}

export default function (app) {
  const { CACHE, cache } = app;
  const FILE = join(CACHE, 'events.jsonl');
  const last = { hits: 0, misses: 0, fetched: 0, bytes: 0 };

  app.route('POST', '/events', async (req, res) => {
    let list;
    try { list = await app.body(req); } catch { return app.json(res, { ok: false }, 400); }
    if (!Array.isArray(list)) list = list?.events;
    if (!Array.isArray(list)) return app.json(res, { ok: false }, 400);
    const now = Date.now();
    const lines = [];
    for (const e of list.slice(0, 1000)) {
      if (!e || typeof e.type !== 'string' || e.type.length > 24) continue;
      const line = JSON.stringify({ t: Number(e.t) || now, ...e });
      if (line.length < 4096) lines.push(line);
    }
    // What the cache did for this reader since the last batch.
    const d = {}; let any = false;
    for (const k of Object.keys(last)) { d[k] = (cache.stats[k] || 0) - last[k]; last[k] = cache.stats[k] || 0; any ||= d[k] > 0; }
    if (any) lines.push(JSON.stringify({ t: now, type: 'cache', ...d }));
    if (lines.length) {
      try { if (statSync(FILE).size > MAX_FILE) renameSync(FILE, join(CACHE, `events-${day(now)}.jsonl`)); } catch { /* no file yet */ }
      appendFileSync(FILE, lines.join('\n') + '\n');
    }
    app.json(res, { ok: true, n: lines.length });
  });

  // Titles for the summary, reloaded when corpus.json changes.
  let corpus = { mtime: 0, map: new Map(), lanes: {} };
  function titles() {
    try {
      const f = join(app.HERE, 'corpus.json'); const m = statSync(f).mtimeMs;
      if (m !== corpus.mtime) { const c = JSON.parse(readFileSync(f, 'utf-8')); corpus = { mtime: m, map: new Map(c.items.map((it) => [it.id, it])), lanes: c.lanes || {} }; }
    } catch { /* keep the old map */ }
    return corpus.map;
  }

  /** ?days=30 (0 = everything). */
  app.route('GET', '/events/summary', async (req, res, url) => {
    const days = Number(url.searchParams.get('days') ?? 30);
    const since = days > 0 ? new Date(new Date().setHours(0, 0, 0, 0) - (days - 1) * 864e5).getTime() : 0;
    const files = readdirSync(CACHE).filter((f) => /^events(-[\d-]+)?\.jsonl$/.test(f))
      .filter((f) => { try { return statSync(join(CACHE, f)).mtimeMs >= since; } catch { return false; } }).sort();
    const perDay = {}, lanes = {}, items = {}, keys = {}, views = {}, hours = new Array(24).fill(0);
    const lat = { all: [], nav: {}, kind: {} }, latDay = {};
    const boot = [];
    let sessions = 0, summaries = 0, first = null, lastT = null;
    const D = (t) => (perDay[day(t)] ||= { items: new Set(), ms: 0, turns: 0, hits: 0, misses: 0, lat: [] });
    for (const f of files) {
      const rl = createInterface({ input: createReadStream(join(CACHE, f)), crlfDelay: Infinity });
      for await (const line of rl) {
        let e; try { e = JSON.parse(line); } catch { continue; }
        if (!(e.t >= since)) continue;
        first ??= e.t; lastT = e.t;
        switch (e.type) {
          case 'session': sessions++; break;
          case 'shown': D(e.t).items.add(e.id); { const x = (items[e.id] ||= { ms: 0, visits: 0, lane: e.lane }); x.visits++; x.last = e.t; } break;
          case 'dwell': {
            const ms = Math.max(0, Math.min(Number(e.ms) || 0, 6 * 3600e3));
            D(e.t).ms += ms; D(e.t).turns += e.turns || 0; hours[new Date(e.t).getHours()] += ms;
            lanes[e.lane || '?'] = (lanes[e.lane || '?'] || 0) + ms;
            const x = (items[e.id] ||= { ms: 0, visits: 0, lane: e.lane }); x.ms += ms; x.turns = (x.turns || 0) + (e.turns || 0); x.last = Math.max(x.last || 0, e.t);
            break;
          }
          case 'lat': {
            const ms = Number(e.ms); if (!(ms >= 0 && ms < 120e3)) break;
            lat.all.push(ms); (lat.nav[e.nav] ||= []).push(ms); (lat.kind[e.kind] ||= []).push(ms); D(e.t).lat.push(ms);
            break;
          }
          case 'boot': if (e.ms > 0 && e.ms < 120e3) boot.push(e.ms); break;
          case 'cache': D(e.t).hits += e.hits || 0; D(e.t).misses += e.misses || 0; break;
          case 'summary': summaries++; break;
          case 'view': views[e.view] = (views[e.view] || 0) + 1; break;
          case 'keys': for (const [k, n] of Object.entries(e.counts || {})) keys[k] = (keys[k] || 0) + n; break;
        }
      }
    }
    const T = titles();
    const top = Object.entries(items).filter(([, x]) => x.ms > 0).sort((a, b) => b[1].ms - a[1].ms).slice(0, 25)
      .map(([id, x]) => { const it = T.get(id); return { id, ...x, t: it?.t || id, a: it?.a, y: it?.y, page: it?.page, lane: x.lane || it?.lane }; });
    const hist = [50, 100, 200, 400, 800, 1600, 3200, Infinity].map((hi, i, a) => ({ lo: i ? a[i - 1] : 0, hi: hi === Infinity ? null : hi, n: lat.all.filter((v) => v >= (i ? a[i - 1] : 0) && v < hi).length }));
    const tot = Object.values(perDay).reduce((s, d) => ({ hits: s.hits + d.hits, misses: s.misses + d.misses }), { hits: 0, misses: 0 });
    app.json(res, {
      days, since, first, last: lastT, sessions, summaries,
      perDay: Object.entries(perDay).sort().map(([date, d]) => ({ date, items: d.items.size, minutes: +(d.ms / 60e3).toFixed(1), turns: d.turns, hits: d.hits, misses: d.misses, lat: d.lat.length ? percentiles(d.lat) : null })),
      hours: hours.map((ms) => +(ms / 60e3).toFixed(2)),
      lanes: Object.entries(lanes).sort((a, b) => b[1] - a[1]).map(([lane, ms]) => ({ lane, minutes: +(ms / 60e3).toFixed(1) })),
      top,
      latency: {
        all: percentiles(lat.all),
        nav: Object.fromEntries(Object.entries(lat.nav).map(([k, v]) => [k, percentiles(v)])),
        kind: Object.fromEntries(Object.entries(lat.kind).map(([k, v]) => [k, percentiles(v)])),
        hist, boot: percentiles(boot),
      },
      cache: { ...tot, rate: tot.hits + tot.misses ? tot.hits / (tot.hits + tot.misses) : null },
      keys: Object.entries(keys).sort((a, b) => b[1] - a[1]).slice(0, 20),
      views,
      itemsViewed: Object.keys(items).length,
      laneNames: corpus.lanes,
    });
  });
}
