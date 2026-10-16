// Threads: one short, model-written thread per item (a hook, then what was
// found, how, the figure, what it changes, the caveat and what to read), every
// post anchored to a verbatim quote that software found in the source. Written
// by `node threads.mjs` (or by hand, or by an agent job of type `thread`) into
// data/threads.json (STACKS_THREADS points elsewhere, e.g. a sample for tests);
// the format is docs/feeds/threads.md, section 3. Read by the Threads feed and
// the side panel's Thread section (ui/js/features/threads.js, feeds.js).
//
//   GET /threads.json                 -> {built, version, n, lanes: {lane: count}, items: {id: Thread}} (404 while there is no file)
//   GET /threads.json?lane=<lane>     -> only that lane's threads, in corpus order
//   GET /threads.json?ids=a,b         -> only those items (missing ids are left out)
//
// The file is read at startup and again when its mtime changes (checked at
// most once a second), so a new file is picked up without a restart; a file
// that does not parse keeps what was served before. Items not in corpus.json
// are served too (after the corpus's items), so a thread written for an item a
// later corpus build adds is not lost.
import { readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

export const KINDS = ['hook', 'finding', 'method', 'figure', 'implication', 'caveat', 'read'];
export const BASES = ['html', 'fulltext', 'abstract'];
const str = (x, n) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, n) : '');
const num = (x) => (Number.isInteger(x) && x >= 0 && x < 1e6 ? x : undefined);
const frac = (x) => typeof x === 'number' && x >= 0 && x <= 1;
const marker = (x) => (typeof x === 'string' && x.length <= 80 ? x.trim() : typeof x === 'number' ? num(x) : undefined);
const http = (u) => (typeof u === 'string' && /^https?:\/\/\S+$/.test(u) && u.length <= 2000 ? u : undefined);
const prune = (o) => { for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === '') delete o[k]; return o; };

/** One post: a known kind, its text, and its cite (quote required; the verifier's fields kept as they are). */
function cleanPost(p) {
  if (!p || typeof p !== 'object' || !KINDS.includes(p.kind)) return null;
  const t = str(p.t, 600);
  const c = p.cite && typeof p.cite === 'object' ? p.cite : {};
  const quote = str(c.quote, 600);
  if (!t || !quote) return null;
  const spans = Array.isArray(c.spans) ? c.spans.filter((s) => Array.isArray(s) && s.length === 2 && s.every((x) => marker(x) !== undefined)).slice(0, 8).map((s) => s.map(marker)) : undefined;
  const cite = prune({
    quote, loc: str(c.loc, 120), page: num(c.page), label: str(c.label, 20), sec: str(c.sec, 160), fig: str(c.fig, 80),
    spans: spans?.length ? spans : undefined, ok: typeof c.ok === 'boolean' ? c.ok : undefined, match: ['exact', 'joined', 'skel', 'full'].includes(c.match) ? c.match : undefined,
  });
  return prune({ kind: p.kind, t, cite, approx: p.approx === true ? true : undefined });
}
function cleanFigure(f) {
  if (!f || typeof f !== 'object') return undefined;
  const box = Array.isArray(f.box) && f.box.length === 4 && f.box.every(frac) && f.box[2] > f.box[0] && f.box[3] > f.box[1] ? f.box.map(Number) : undefined;
  const out = prune({ fig: str(f.fig, 80), part: num(f.part), img: http(f.img), page: num(f.page), label: str(f.label, 20), box });
  return Object.keys(out).length ? out : undefined;
}
/** A thread: posts with the hook first (else none), and its metadata. */
export function cleanThread(th) {
  if (!th || typeof th !== 'object' || !Array.isArray(th.posts)) return null;
  const posts = th.posts.map(cleanPost).filter(Boolean).slice(0, 9);
  if (!posts.length || posts[0].kind !== 'hook') return null;
  const ch = th.checks && typeof th.checks === 'object' ? th.checks : null;
  const pair = (x) => (Array.isArray(x) && x.length === 2 && x.every((v) => Number.isInteger(v) && v >= 0) ? x : undefined);
  const checks = ch ? prune({ quotes: pair(ch.quotes), numbers: pair(ch.numbers), flags: Array.isArray(ch.flags) ? ch.flags.filter((x) => typeof x === 'string').slice(0, 20).map((x) => x.slice(0, 200)) : undefined, dropped: num(ch.dropped), src: str(ch.src, 40), at: str(ch.at, 40) }) : undefined;
  return prune({
    title: str(th.title, 300), posts, figure: cleanFigure(th.figure),
    tags: Array.isArray(th.tags) ? th.tags.filter((x) => typeof x === 'string' && x.trim()).slice(0, 6).map((x) => x.trim().toLowerCase().slice(0, 40)) : undefined,
    model: str(th.model, 120) || 'unknown', basis: BASES.includes(th.basis) ? th.basis : undefined, written: str(th.written, 30),
    checks: checks && Object.keys(checks).length ? checks : undefined,
    usd: typeof th.usd === 'number' && th.usd >= 0 ? th.usd : undefined,
    tok: Array.isArray(th.tok) && th.tok.length === 2 && th.tok.every((v) => Number.isInteger(v) && v >= 0) ? th.tok : undefined,
  });
}
/** The whole file, cleaned: unknown fields and malformed threads dropped. */
export function clean(raw) {
  const items = {};
  const src = raw && typeof raw.items === 'object' && raw.items ? raw.items : {};
  for (const [id, th] of Object.entries(src)) {
    if (!id || id.length > 400 || /[\u0000-\u001f]/.test(id)) continue;
    const c = cleanThread(th);
    if (c) items[id] = c;
  }
  return { built: str(raw?.built, 40) || null, version: str(raw?.version, 40) || null, items };
}

export default function (app) {
  const file = process.env.STACKS_THREADS ? resolve(process.env.STACKS_THREADS) : join(app.HERE, 'data', 'threads.json');
  const S = { mtime: -1, bad: -1, check: 0, data: null, etag: '', ordered: null, corpusAt: -1, laneOf: new Map(), order: new Map() };
  function corpus() {
    // Item → lane and corpus position, for ?lane= and the order threads are served in.
    let mt = 0; try { mt = statSync(join(app.HERE, 'corpus.json')).mtimeMs; } catch { return; }
    if (mt === S.corpusAt) return;
    try {
      const items = JSON.parse(readFileSync(join(app.HERE, 'corpus.json'), 'utf-8')).items || [];
      S.laneOf = new Map(items.map((it) => [it.id, it.lane]));
      S.order = new Map(items.map((it, k) => [it.id, k]));
      S.corpusAt = mt; S.ordered = null;
    } catch (e) { console.warn('threads: corpus.json unreadable:', e.message); }
  }
  function load() {
    if (Date.now() - S.check < 1000) return S.data;
    S.check = Date.now();
    let m;
    try { m = statSync(file).mtimeMs; } catch { S.mtime = -1; S.data = null; return null; }
    if (m === S.mtime || m === S.bad) return S.data;
    try {
      S.data = clean(JSON.parse(readFileSync(file, 'utf-8')));
      S.mtime = m; S.ordered = null;
      S.etag = '"' + createHash('sha1').update(String(m) + Object.keys(S.data.items).length).digest('hex').slice(0, 16) + '"';
    } catch (e) {
      // Half-written or malformed: keep what was served before, and read it again once it changes.
      S.bad = m; console.warn('threads.json:', e.message);
    }
    return S.data;
  }
  load();
  /** Item ids in corpus order (items outside the corpus last, by id). */
  function ordered() {
    corpus();
    if (S.ordered) return S.ordered;
    const big = 1e9;
    S.ordered = Object.keys(S.data.items).sort((a, b) => (S.order.get(a) ?? big) - (S.order.get(b) ?? big) || (a < b ? -1 : a > b ? 1 : 0));
    return S.ordered;
  }

  app.route('GET', '/threads.json', async (req, res, url) => {
    const d = load();
    if (!d) return app.send(res, 404, 'no threads yet (node threads.mjs writes data/threads.json)');
    const q = url.searchParams;
    const lane = q.get('lane') || '', ids = (q.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 500);
    const tag = S.etag.slice(0, -1) + '-' + createHash('sha1').update(lane + '|' + ids.join(',')).digest('hex').slice(0, 8) + '"';
    if (req.headers['if-none-match'] === tag) { res.writeHead(304, { ETag: tag, 'Cache-Control': 'no-cache' }); return res.end(); }
    const all = ordered();
    const lanes = {};
    for (const id of all) { const l = S.laneOf.get(id) || 'other'; lanes[l] = (lanes[l] || 0) + 1; }
    let pick = all;
    if (ids.length) { const want = new Set(ids); pick = all.filter((id) => want.has(id)); }
    else if (lane && lane !== 'all') pick = all.filter((id) => S.laneOf.get(id) === lane);
    const items = {};
    for (const id of pick) items[id] = d.items[id];
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ETag: tag });
    res.end(JSON.stringify({ built: d.built, version: d.version, n: all.length, lanes, items }));
  });
  app.status(() => ({ threads: S.data ? Object.keys(S.data.items).length : 0 }));
}
