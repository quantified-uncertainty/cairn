#!/usr/bin/env node
/**
 * Relevance, hooks and best entry pages for every corpus item, with Claude
 * Haiku: the fields `rel`, `hook` and `best` that the app merges into items
 * from /enrich.json (ui/js/corpus.js; server/routes/19-enrich.mjs serves it).
 *
 *   node enrich-batch.mjs [--all] [--lanes a,b] [--ids x,y] [--limit N] [--batch 20]
 *                         [--model claude-haiku-5-5] [--max-usd X] [--dry-run] [--yes]
 *                         [--redo] [--concurrency 3] [--out <file>] [--corpus corpus.json]
 *
 * What each item gets:
 * - rel, 0-1: how much this reader wants it (state.js baseScore: +-0.4 in
 *   every ranking; the warm-up and compile.mjs order by it too). The reader is
 *   described in READER below, with the lanes, and with the top interests the
 *   app learned from reading (CACHE/learn/profile.json, labels only) if any.
 * - hook: one line that makes you want to open it, unless the item already
 *   has a hook this script did not write (kept).
 * - best: 1-3 entry pages, best first, 0-based (prefetch.js startOf opens a
 *   PDF or scan at best[0]; `r` walks them; prefetch and compile.mjs prepare
 *   them first). Posts get stable ~280-word pages (docs.js prepareFlow), which
 *   nothing reads yet. Only from an outline: the compiled profile's contents,
 *   ranges and printed page labels; a reading guide's sections and stops;
 *   a post's headings in the cached HTML; a scan's contents page in its cached
 *   OCR, answered in printed page numbers and mapped through the page labels.
 *   An item with no outline gets no best (nothing is guessed); pages in the
 *   front matter, references or index, and pages not offered, are dropped.
 *
 * Which items: all of them, minus those already done with the same input
 * (CACHE/enrich/done.json keeps a hash of each item's block), so a run that
 * stops resumes where it was, and an item whose outline appeared since (it
 * was compiled, or got a reading guide) is done again. --redo: all again
 * (after the learned interests moved, say). --lanes, --ids and --limit narrow.
 *
 * How: about 20 items per request after the rules, the reader and the lanes,
 * which are marked for prompt caching (byte-identical in every request, so
 * after the first they cost a tenth); JSON out (output_config.format).
 *
 * Cost: the plan and an estimate first (about $0.0001 an item); stops when the
 * estimate is more than what is left of today's AI budget (STACKS_DAILY_BUDGET,
 * default $3, minus today's spend in CACHE/spend.json) unless --yes; --max-usd
 * cuts the plan to fit and stops the run there. --dry-run prints the plan only.
 * Calls go through the summaries' model plumbing (server/routes/30-summarize.mjs),
 * as tag-corpus.mjs does; the server keeps its own copy of today's spend.
 *
 * Output: CACHE/enrich.json, {built, source, items: {id: {rel, hook?, best?}}},
 * one item per line, re-read and merged after every request (atomic writes).
 * It lives in the cache folder, not the repository, because rel follows the
 * reader's own learned interests; a hand-made enrich.json in the browser
 * folder is used when the cache has none, and its hooks are kept. --out
 * writes elsewhere (what it did is kept beside it, in <file>.done.json). STACKS_MOCK_AI=1: deterministic answers without the API,
 * written to CACHE/enrich.mock.json (and done.mock.json) unless --out.
 */
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return d; } };
const clip = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const usd = (x) => '$' + Number(x || 0).toFixed(x < 0.1 ? 4 : 2);
const FLOW = new Set(['html', 'web', 'text']);
export const VERSION = 'enrich-v1';

// ---------------------------------------------------------------- the reader ----
export const READER = `The reader runs a small research institute on forecasting and epistemics. They read AI safety and alignment (agendas, evaluations, interpretability, governance), language models (capabilities, reasoning, scaling, evaluation), forecasting (methods, prediction markets, calibration, judgmental and quantitative forecasting, aggregation), rationality and decision-making, and the tools of their trade: probability, statistics, Bayesian modelling, information theory, estimation. They also keep shelves of old technical books, cybernetics and tabletop game manuals, for ideas rather than for work: those matter less unless an item bears on modelling, uncertainty, estimation or how people reason.`;

export const RULES = `You enrich items in a personal research library for one reader, described below. For each item, answer:

1. rel: how much this reader would want to open it, 0-100. 90+: central to their work and strong (a landmark paper, a key report, the best post on a topic they work on). 70-89: squarely in their interests. 40-69: related or useful background. 20-39: a side interest. Under 20: hardly relevant to them. Judge the item, not the shelf: a weak post on a central topic scores below a strong paper on a side topic. Spread the scores; do not give everything 60-80.
2. hook: one line, at most 110 characters, that makes this reader want to open it: the specific claim, result, number or idea inside, said plainly. Not the title again, not the note again, no hype words, no "This paper". When the item says "hook: keep", answer "".
3. best: 1 to 3 places worth opening the item at, best first, only when the item lists an outline, reading-guide stops or a contents page. The first is where the reader lands when opening it, so pick the page that shows best what the item has: the main result, the key figure or table, the summary of the argument, the chapter the book is known for. For a short paper whose first page carries the title, the abstract and the claim, that first page is usually the right first entry; then the result and the key figure. Never front matter (cover, title page, copyright, contents, lists, preface, foreword, acknowledgements), never references, index or appendix lists. Use only pages the item lists: answer with the "p." number exactly as shown, or, for a contents page with printed page numbers, with that printed number as "printed". Leave best empty when no outline is listed.

Answer for every item, keyed by its number k.`;

/** The cached prefix: rules, reader, lanes and (optionally) learned interests. Byte-stable within a run. */
export function readerBlock({ lanes = {}, counts = {}, interests = null } = {}) {
  const L = [RULES, '', '<reader>', READER, '</reader>', '', 'Shelves (lanes) and how many items each holds:'];
  for (const [k, v] of Object.entries(lanes)) L.push(`- ${k}: ${v}${counts[k] ? ` (${counts[k]})` : ''}`);
  if (interests && (interests.more.length || interests.less.length)) {
    L.push('', 'What the app learned from their reading so far (labels of features of items they read deeply or skipped; use as evidence beside the description):');
    if (interests.more.length) L.push('Reads more of: ' + interests.more.join('; '));
    if (interests.less.length) L.push('Skips or reads less of: ' + interests.less.join('; '));
  }
  return L.join('\n');
}

/** Top learned features from CACHE/learn/profile.json, as labels, or null. */
export function learnedInterests(cacheDir, n = 24) {
  const p = readJson(join(cacheDir, 'learn', 'profile.json'), null);
  const feats = Object.entries(p?.feat || {}).filter(([, x]) => x && x.ctl !== 'ignore' && Number.isFinite(x.l));
  if (!feats.length) return null;
  const w = ([, x]) => Math.abs(x.l) * Math.sqrt(Math.max(0, x.W || 0)) + (x.ctl === 'boost' || x.ctl === 'mute' ? 10 : 0);
  const lab = ([f, x]) => clip(x.label || f, 60) + (x.ctl === 'boost' ? ' (boosted)' : x.ctl === 'mute' ? ' (muted)' : '');
  const sorted = feats.sort((a, b) => w(b) - w(a) || (a[0] < b[0] ? -1 : 1));
  const more = sorted.filter(([, x]) => x.ctl === 'boost' || (x.ctl !== 'mute' && x.l > 0.05)).slice(0, n).map(lab);
  const less = sorted.filter(([, x]) => x.ctl === 'mute' || (x.ctl !== 'boost' && x.l < -0.05)).slice(0, Math.round(n / 2)).map(lab);
  return more.length || less.length ? { more, less } : null;
}

// ------------------------------------------------------------- the outlines ----
const BLOCKS = new Set('p li h1 h2 h3 h4 h5 h6 pre table figure blockquote dt dd img iframe hr'.split(' '));
const VOID = new Set(['img', 'hr']);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m));
/** A post's headings with their stable pages, as ui/js/docs.js prepareFlow() cuts them
 *  (outermost blocks; a new page after 280 words): {n, outline: [{t, k, d}]}. An approximation
 *  of the client's cut (its flow filters run first), so pages may be off by one. */
export function flowOutline(html, words = 280) {
  const s = String(html || '').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|form|object|embed)\b[\s\S]*?<\/\1>/gi, ' ');
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  const outline = [];
  let depth = 0, start = -1, tag = null, vp = 0, count = 0, m;
  const close = (end) => {
    const t = decode(s.slice(start, end).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const w = t ? t.split(' ').length : 0;
    if (count >= words && w) { vp++; count = 0; }
    count += w;
    if (/^h[1-4]$/.test(tag) && t) outline.push({ t: t.slice(0, 90), k: vp, d: Math.max(0, Math.min(2, Number(tag[1]) - 1)) });
  };
  while ((m = re.exec(s))) {
    const name = m[2].toLowerCase();
    if (!BLOCKS.has(name)) continue;
    if (!m[1]) {
      if (depth === 0) { start = m.index; tag = name; }
      if (VOID.has(name)) { if (depth === 0) close(re.lastIndex); continue; }
      depth++;
    } else if (depth > 0 && !VOID.has(name)) {
      depth--;
      if (depth === 0) close(re.lastIndex);
    }
  }
  return { n: vp + 1, outline };
}

/** The first page of the body from printed labels: the first of three consecutive arabic labels (or "1"). */
export function bodyStartOf(labels) {
  if (!Array.isArray(labels)) return null;
  for (let k = 0; k + 2 < labels.length; k++) {
    const a = Number(labels[k]);
    if (/^\d+$/.test(labels[k] || '') && Number(labels[k + 1]) === a + 1 && Number(labels[k + 2]) === a + 2) return k;
  }
  const one = labels.indexOf('1');
  return one >= 0 ? one : null;
}

/**
 * What the model is shown about an item's places, and what its answers are checked
 * against: {n, lines: [text], cand: Set of 0-based pages, labels, front: last front page or
 * -1, bad: Set of pages never to use, contents: text or null, src: [what it came from]}.
 * src: {profile, guide, html, ocrText, labels} as read from the cache (any may be null).
 */
export function placesOf(it, src = {}) {
  const P = src.profile || null, G = src.guide || null;
  const flow = FLOW.has(it.kind);
  const out = { n: P?.n || (flow ? null : it.n) || null, lines: [], cand: new Set(), labels: null, front: -1, bad: new Set(), contents: null, src: [] };
  const pages = Array.isArray(P?.pages) ? P.pages : [];
  out.labels = pages.some((p) => p?.lab) ? pages.map((p) => (p?.lab ? String(p.lab) : null)) : Array.isArray(src.labels) ? src.labels : null;
  const R = P?.ranges || {};
  if (Array.isArray(R.front)) out.front = R.front[1];
  else if (!flow && out.labels) { const b = bodyStartOf(out.labels); if (b != null) out.front = b - 1; }
  for (const [k, x] of pages.entries()) if (['cover', 'front', 'toc', 'refs', 'index', 'blank'].includes(x?.role)) out.bad.add(x.k ?? k);
  for (const r of [R.refs, R.index]) if (Array.isArray(r)) for (let k = r[0]; k <= r[1]; k++) out.bad.add(k);
  const lab = (k) => (out.labels?.[k] && out.labels[k] !== String(k + 1) ? ` [printed ${out.labels[k]}]` : '');
  const add = (k, text) => {
    if (!Number.isInteger(k) || k < 0 || (out.n && k >= out.n)) return;
    out.lines.push(`p. ${k + 1}${lab(k)} ${text}`);
    if (k > out.front && !out.bad.has(k) && !(flow && k === 0)) out.cand.add(k);
  };
  let toc = (P?.toc || []).filter((e) => e && e.t && e.k != null);
  if (flow && !toc.length && src.html) { const F = flowOutline(src.html); toc = F.outline; out.n ||= F.n; if (toc.length) out.src.push('headings'); }
  else if (toc.length) out.src.push('contents');
  if (!toc.length && Array.isArray(G?.sections)) { toc = G.sections.filter((s) => s && s.t && Number.isInteger(s.k)); if (toc.length) out.src.push('guide sections'); }
  for (const e of toc.slice(0, 45)) add(e.k, `${'  '.repeat(Math.min(2, e.d || 0))}${clip(e.t, 80)}`);
  const stops = (Array.isArray(G?.plan) ? G.plan : []).filter((s) => Number.isInteger(s?.k)).slice(0, 8);
  if (stops.length) {
    out.src.push('guide stops');
    out.lines.push('reading-guide stops: ' + stops.map((s) => `p. ${s.k + 1}${s.kind ? ` (${s.kind})` : ''}${s.why ? ` ${clip(s.why, 60)}` : ''}`).join('; '));
    for (const s of stops) if (s.k > out.front && !out.bad.has(s.k) && (!out.n || s.k < out.n) && !(flow && s.k === 0)) out.cand.add(s.k);
  }
  // A scan with no outline: its contents page from the OCR, answered in printed numbers.
  if (it.kind === 'scan' && !toc.length && out.labels && Array.isArray(src.ocrText)) {
    const lim = Math.min(src.ocrText.length, Math.max(12, Math.round(src.ocrText.length * 0.15)));
    for (let k = 0; k < lim; k++) {
      if (!/\bCONTENTS\b|^\s*Contents\b|TABLE OF CONTENTS/.test(String(src.ocrText[k] || ''))) continue;
      out.contents = clip(String(src.ocrText[k]) + ' ' + String(src.ocrText[k + 1] || ''), 1800);
      out.src.push('contents page (OCR)');
      break;
    }
  }
  return out;
}

/** Map the model's best answers to checked 0-based pages (at most 3, unique, best first). */
export function checkBest(answers, places, flow = false) {
  const out = [];
  for (const a of Array.isArray(answers) ? answers : []) {
    let k = null;
    if (a && a.printed != null && String(a.printed).trim() && places.labels) {
      const want = String(a.printed).trim().toLowerCase();
      const j = places.labels.findIndex((l, q) => l != null && String(l).toLowerCase() === want && q > places.front);
      if (j >= 0 && !places.bad.has(j) && places.contents) k = j;
    } else if (a && Number.isInteger(a.page)) {
      const q = a.page - 1;
      if (places.cand.has(q)) k = q;
    }
    if (k == null || out.includes(k) || (flow && k === 0)) continue;
    out.push(k);
    if (out.length >= 3) break;
  }
  return out;
}

/** The item's block in a request: what the model reads about it. Its hash marks it done. */
export function itemBlock(it, k, places, { keepHook = false, laneName = it.lane } = {}) {
  const head = [laneName, it.kind, it.y, clip(it.a, 80)].filter(Boolean).join('; ');
  const L = [`[${k}] ${clip(it.t, 220)}`, `  ${head}`];
  if (it.path?.length) L.push(`  folder: ${clip(it.path.join(' / '), 120)}`);
  if (it.why) L.push(`  note: ${clip(it.why, 260)}`);
  if (it.ab) L.push(`  abstract: ${clip(it.ab, 650)}`);
  if (places.lines.length || places.contents) {
    const parts = [places.n ? `${places.n} pages${FLOW.has(it.kind) ? ' of about 280 words' : ''}` : ''];
    if (places.front >= 0) parts.push(`front matter to p. ${places.front + 1}`);
    L.push(`  places (${parts.filter(Boolean).join(', ') || 'pages as listed'}):`);
    for (const x of places.lines) L.push(`    ${x}`);
    if (places.contents) L.push(`    contents page (OCR, printed page numbers): ${places.contents}`);
  }
  if (keepHook) L.push('  hook: keep');
  return L.join('\n');
}

export const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['items'],
  properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['k', 'rel', 'hook', 'best'], properties: {
      k: { type: 'integer' }, rel: { type: 'integer' }, hook: { type: 'string' },
      best: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['page', 'printed'], properties: { page: { type: ['integer', 'null'] }, printed: { type: ['string', 'null'] } } } },
    } } },
  },
};

// ------------------------------------------------------------------ mock ----
const LANE_REL = { forecasting: 85, 'ai-safety': 80, 'deepmind-safety': 75, llm: 75, lesswrong: 70, quri: 70, textbooks: 55, 'information-theory': 50, cybernetics: 45, ttrpg: 30, oddities: 30 };
/** Deterministic answers (STACKS_MOCK_AI): rel by lane plus a jitter from the id, the note's
 *  first clause as the hook, the first two offered pages as best. */
export function mockAnswer(batch) {
  return JSON.stringify({ items: batch.map(({ it, places, keepHook }, k) => {
    const j = parseInt(sha1(it.id).slice(0, 4), 16) % 21 - 10;
    const best = [...places.cand].sort((a, b) => a - b).slice(0, 2).map((q) => ({ page: q + 1, printed: null }));
    return { k, rel: Math.max(0, Math.min(100, (LANE_REL[it.lane] ?? 50) + j)), hook: keepHook ? '' : clip(String(it.ab || it.why || it.t).split(/(?<=[.;])\s/)[0], 110), best };
  }) });
}

// ------------------------------------------------------------ the output ----
/** Merge this run's entries into the file's (re-read first). The model's hook is only asked for
 *  when the item has none from elsewhere; a best this script did not write before is kept. */
export function mergeOut(base, add, meta) {
  const items = { ...(base?.items || {}) };
  for (const [id, e] of Object.entries(add)) {
    const old = items[id] || {};
    const next = { ...old, rel: e.rel };
    if (e.hook) next.hook = e.hook;
    if (e.best?.length) next.best = e.best; else if (e.ours) delete next.best;
    items[id] = next;
  }
  return { built: new Date().toLocaleDateString('en-CA'), source: meta.source, items };
}
export function writeOut(file, data, order) {
  const ids = Object.keys(data.items).sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9) || (a < b ? -1 : 1));
  const lines = ['{', ` "built": ${JSON.stringify(data.built)},`, ` "source": ${JSON.stringify(data.source)},`, ' "items": {'];
  ids.forEach((id, k) => lines.push(`  ${JSON.stringify(id)}: ${JSON.stringify(data.items[id])}${k < ids.length - 1 ? ',' : ''}`));
  lines.push(' }', '}');
  mkdirSync(dirname(file), { recursive: true });
  const tmp = file + '.' + process.pid + '.tmp';
  writeFileSync(tmp, lines.join('\n') + '\n');
  renameSync(tmp, file);
}

// ------------------------------------------------------- the cache's files ----
/** What the cache holds about an item's places: profile, guide, post HTML, scan OCR and labels. */
export function sourcesOf(it, CACHE, { profIndex = null, models = [] } = {}) {
  const body = (u) => { const k = sha1(u); const f = join(CACHE, k.slice(0, 2), k); return existsSync(f) ? readFileSync(f) : null; };
  const src = {};
  const srcKey = it.kind === 'scan' && it.ia ? 'ia:' + it.ia : it.url || '';
  let pid = sha1(it.id + '|' + srcKey);
  if (profIndex && !profIndex[pid]) { const alt = Object.entries(profIndex).find(([, r]) => r?.id === it.id); if (alt) pid = alt[0]; }
  const P = readJson(join(CACHE, 'profiles', pid, 'profile.json'), null);
  if (P && P.id === it.id) src.profile = P;
  for (const m of models) { const g = readJson(join(CACHE, 'augment', sha1(it.id + '|' + m) + '.json'), null); if (g && !g.error && (g.sections || g.plan)) { src.guide = g; break; } }
  if (FLOW.has(it.kind) && it.kind !== 'text' && it.url && !src.profile?.toc?.length) {
    const b = body(it.url);
    if (b) { let html = b.toString('utf-8'); if (/^\s*\{/.test(html)) { try { html = JSON.parse(html)?.data?.post?.result?.htmlBody || ''; } catch { /* not JSON */ } } src.html = html; }
  }
  if (it.kind === 'scan' && it.ia) {
    src.ocrText = readJson(join(CACHE, 'ocr', it.ia, 'text.json'), null)?.pages || null;
    const pn = body(`https://archive.org/download/${it.ia}/${it.ia}_page_numbers.json`);
    if (pn) { try { src.labels = JSON.parse(pn.toString('utf-8')).pages?.map((p) => (p.pageNumber ? String(p.pageNumber) : null)) || null; } catch { /* not JSON */ } }
  }
  return src;
}

// ------------------------------------------------------------------ main ----
async function plumbing(MODEL) {
  const { CACHE, hasKey } = await import('./server/config.mjs');
  const S = await import('./server/routes/30-summarize.mjs');
  const cache = { key: (u) => sha1(u) }; // all 30-summarize needs; cache.mjs would start its index and eviction timers
  const app = { HERE, CACHE, MODEL, hasKey, cache, port: null, route() {}, status() {}, onStart() {}, json() {}, send() {}, body() {} };
  S.default(app);
  return { ai: app.ai, PRICES: S.PRICES, setBudget: S.setBudget, parsePartial: S.parsePartial, hasKey, CACHE };
}
async function pool(list, n, fn) { let next = 0; await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (next < list.length) { const j = next++; await fn(list[j], j); } })); }

async function main() {
  const argv = process.argv.slice(2);
  const flag = (k) => argv.includes('--' + k);
  const opt = (k, d = null) => { const j = argv.indexOf('--' + k); return j >= 0 && argv[j + 1] && !argv[j + 1].startsWith('--') ? argv[j + 1] : d; };
  const list = (k) => (opt(k) ? opt(k).split(',').map((s) => s.trim()).filter(Boolean) : null);
  if (flag('help') || flag('h')) {
    console.log('node enrich-batch.mjs [--all] [--lanes a,b] [--ids x,y] [--limit N] [--batch 20] [--model claude-haiku-5-5] [--max-usd X]\n                       [--dry-run] [--yes] [--redo] [--concurrency 3] [--out file] [--corpus corpus.json]   (see the comment at the top of this file)');
    return;
  }
  const MOCK = /^(1|true|yes)$/i.test(process.env.STACKS_MOCK_AI || '');
  const MODEL = opt('model', 'claude-haiku-5-5');
  const BATCH = Math.max(5, Math.min(60, Number(opt('batch', 20)) || 20));
  const LIMIT = opt('limit') != null ? Math.max(1, Number(opt('limit')) || 1) : Infinity;
  const MAXUSD = opt('max-usd') != null ? Math.max(0, Number(opt('max-usd')) || 0) : null;
  const DRY = flag('dry-run') || flag('dry');
  const P = await plumbing(MODEL);
  const price = P.PRICES[MODEL];
  if (!price) throw new Error(`Unknown model ${MODEL}; one of ${Object.keys(P.PRICES).join(', ')}`);
  const OUT = resolve(opt('out') || join(P.CACHE, MOCK ? 'enrich.mock.json' : 'enrich.json'));
  // What was done goes with the file it went into: an --out run of its own is not skipped for what went elsewhere.
  const DONE = opt('out') ? OUT.replace(/(\.json)?$/, '.done.json') : join(P.CACHE, 'enrich', MOCK ? 'done.mock.json' : 'done.json');
  const corpus = readJson(resolve(opt('corpus') || join(HERE, 'corpus.json')), null);
  if (!corpus?.items) throw new Error('Cannot read corpus.json');
  const items = corpus.items, order = new Map(items.map((it, k) => [it.id, k])), byId = new Map(items.map((it) => [it.id, it]));
  const LANES = corpus.lanes || {}, COUNTS = corpus.counts || {};

  // The current output (or the repository's hand-made enrich.json), and what this script wrote before.
  const seed = existsSync(OUT) ? readJson(OUT, { items: {} }) : readJson(join(HERE, 'enrich.json'), { items: {} });
  const done = readJson(DONE, {});
  const interests = learnedInterests(P.CACHE);
  const PREFIX = readerBlock({ lanes: LANES, counts: COUNTS, interests });

  // Which items, and their blocks.
  const ids = list('ids'), lanes = list('lanes');
  let chosen = ids ? ids.map((id) => byId.get(id) || (console.warn(`Not in the corpus, skipped: ${id}`), null)).filter(Boolean) : items.filter((it) => !lanes || lanes.includes(it.lane));
  const profIndex = readJson(join(P.CACHE, 'profiles', 'index.json'), {})?.profiles || null;
  const models = [...new Set([MODEL, ...Object.keys(P.PRICES)])];
  const prepared = [];
  let skipped = 0;
  const srcCount = {};
  for (const it of chosen) {
    if (prepared.length >= LIMIT) break;
    const places = placesOf(it, sourcesOf(it, P.CACHE, { profIndex, models }));
    const old = seed.items?.[it.id];
    const keepHook = !!(old?.hook && !done[it.id]?.hook);
    const block = itemBlock(it, 0, places, { keepHook, laneName: LANES[it.lane] || it.lane });
    const h = sha1(VERSION + '|' + MODEL + '|' + block).slice(0, 16);
    if (!flag('redo') && done[it.id]?.h === h) { skipped++; continue; }
    for (const s of places.src) srcCount[s] = (srcCount[s] || 0) + 1;
    prepared.push({ it, places, keepHook, h, chars: block.length });
  }
  const batches = [];
  for (let i = 0; i < prepared.length; i += BATCH) batches.push(prepared.slice(i, i + BATCH));

  // Estimate: the prefix (written once, read at a tenth after), the blocks, the answers.
  const tok = (c) => c / 3.5, OUT_PER = 70, OUT_FIXED = 150;
  const estOf = (b, first) => { const [pi, po] = price; return ((tok(PREFIX.length) * (first ? 1.25 : 0.1) + tok(b.reduce((a, x) => a + x.chars + 12, 0)) + 60) * pi + (b.length * OUT_PER + OUT_FIXED) * po) / 1e6; };
  let est = 0, cut = 0;
  const plan = [];
  for (const [k, b] of batches.entries()) {
    const e = estOf(b, k === 0);
    if (MAXUSD != null && est + e > MAXUSD) { cut += b.length; continue; }
    est += e; plan.push(b);
  }
  const sp = P.ai.spendInfo(), left = Math.max(0, sp.budget - sp.today);
  const withBest = prepared.filter((x) => x.places.cand.size || x.places.contents).length;
  console.log(`Output: ${OUT} (${Object.keys(seed.items || {}).length} items)${interests ? `; learned interests: ${interests.more.length} more, ${interests.less.length} less` : '; no learned interests yet'}`);
  console.log(`${prepared.length} item${prepared.length === 1 ? '' : 's'} to enrich${skipped ? ` (${skipped} already done with the same input; --redo)` : ''}; ${withBest} with an outline for best pages` + (Object.keys(srcCount).length ? ` (${Object.entries(srcCount).map(([s, n]) => `${s} ${n}`).join(', ')})` : '') + '.');
  if (!prepared.length) return;
  console.log(`${plan.length} request${plan.length === 1 ? '' : 's'} of up to ${BATCH} items to ${MODEL}${MOCK ? ' (STACKS_MOCK_AI: mock answers, nothing is spent)' : ''}; prefix about ${Math.round(tok(PREFIX.length)).toLocaleString()} tokens, cached after the first request.`);
  console.log(`Estimated cost ${usd(est)} (about ${usd(est / Math.max(1, prepared.length - cut))} an item)${cut ? `; ${cut} items left out to stay under --max-usd ${usd(MAXUSD)}` : ''}; today's AI budget ${usd(sp.budget)}, ${usd(sp.today)} spent, ${usd(left)} left.`);
  if (DRY) { console.log('Dry run: nothing sent, nothing written.'); return; }
  if (!MOCK && est > left) {
    if (!flag('yes')) { console.error('Stopping: the estimate is more than what is left of today\'s budget (STACKS_DAILY_BUDGET). Run again with --yes to go ahead, or narrow it with --lanes, --limit or --max-usd.'); process.exitCode = 2; return; }
    P.setBudget(sp.today + est * 2 + 0.01);
    console.log('--yes: going past the daily budget for this run.');
  }
  if (!MOCK && !P.hasKey()) { console.error('Set ANTHROPIC_API_KEY (or run with STACKS_MOCK_AI=1).'); process.exitCode = 1; return; }

  const stats = { items: 0, best: 0, hooks: 0, unanswered: 0, failed: 0, cost: 0, cacheRead: 0, cacheWrite: 0, dropped: 0 };
  const source = `enrich-batch.mjs (${MODEL}${MOCK ? ', mock' : ''})`;
  let stop = false, fails = 0;
  const runOne = async (batch, bi) => {
    if (stop) return;
    if (MAXUSD != null && stats.cost >= MAXUSD) { stop = true; console.log(`Stopping: --max-usd ${usd(MAXUSD)} reached.`); return; }
    const text = `<items count="${batch.length}">\n${batch.map((x, k) => itemBlock(x.it, k, x.places, { keepHook: x.keepHook, laneName: LANES[x.it.lane] || x.it.lane })).join('\n\n')}\n</items>\n\nReturn JSON: "items", one entry per item above with its number k, rel, hook and best.`;
    const content = [{ type: 'text', text: PREFIX, cache_control: { type: 'ephemeral' } }, { type: 'text', text }];
    const outTok = batch.length * OUT_PER + OUT_FIXED;
    let raw, cost = 0;
    try {
      if (MOCK) raw = mockAnswer(batch);
      else {
        const release = P.ai.reserve(MODEL, PREFIX.length * 0.1 + text.length, outTok);
        try {
          const r = await P.ai.generate({ model: MODEL, content, schema: SCHEMA, maxTokens: Math.max(4000, outTok * 3), mock: () => mockAnswer(batch) }, () => {});
          cost = P.ai.costOf(r.model, r.usage); P.ai.charge(r.model, cost);
          stats.cacheRead += r.usage?.cache_read_input_tokens || 0; stats.cacheWrite += r.usage?.cache_creation_input_tokens || 0;
          if (r.stop === 'refusal') throw Object.assign(new Error('the model declined this batch'), { code: 'refusal' });
          raw = r.text;
        } finally { release(); }
      }
      fails = 0;
    } catch (e) {
      stats.failed += batch.length; fails++;
      console.error(`request ${bi + 1}/${plan.length}: failed: ${e.message}`);
      if (['budget', 'no_key', 'no_sdk'].includes(e.code) || fails >= 3) { stop = true; console.error('Stopping.'); }
      return;
    }
    stats.cost += cost;
    let out; try { out = JSON.parse(raw); } catch { out = P.parsePartial(raw) || {}; }
    const add = {}, seen = new Set();
    for (const row of Array.isArray(out.items) ? out.items : []) {
      const x = batch[row?.k];
      if (!x || seen.has(row.k) || !Number.isFinite(row.rel)) continue;
      seen.add(row.k);
      const best = checkBest(row.best, x.places, FLOW.has(x.it.kind));
      stats.dropped += Math.max(0, (Array.isArray(row.best) ? row.best.length : 0) - best.length);
      const hook = x.keepHook ? '' : clip(row.hook, 120);
      add[x.it.id] = { rel: Math.round(Math.max(0, Math.min(100, row.rel))) / 100, hook, best, ours: !!done[x.it.id] };
      done[x.it.id] = { h: x.h, at: new Date().toISOString(), model: MODEL, ...(hook || done[x.it.id]?.hook ? { hook: true } : {}) };
      stats.items++; if (best.length) stats.best++; if (hook) stats.hooks++;
    }
    stats.unanswered += batch.length - seen.size;
    writeOut(OUT, mergeOut(readJson(OUT, seed), add, { source }), order); // re-read: keep what others wrote meanwhile
    mkdirSync(dirname(DONE), { recursive: true }); writeFileSync(DONE + '.tmp', JSON.stringify(done)); renameSync(DONE + '.tmp', DONE);
    console.log(`request ${bi + 1}/${plan.length}: ${seen.size}/${batch.length} items, ${Object.values(add).filter((a) => a.best.length).length} with best pages${MOCK ? '' : `, ${usd(cost)}`}`);
  };
  // The first request alone (it writes the prompt cache), then the rest a few at a time.
  if (plan.length) await runOne(plan[0], 0);
  await pool(plan.slice(1), Math.max(1, Math.min(6, Number(opt('concurrency', 3)) || 3)), (b, j) => runOne(b, j + 1));
  console.log(`\nEnriched ${stats.items} of ${prepared.length} items: ${stats.hooks} hooks, ${stats.best} with best pages${stats.dropped ? ` (${stats.dropped} pages dropped: front matter, references or not offered)` : ''}.`);
  if (stats.unanswered) console.log(`No answer for ${stats.unanswered} items; run again to retry them.`);
  if (stats.failed) console.log(`${stats.failed} items in failed requests; run again to retry them.`);
  if (!MOCK) console.log(`Spent ${usd(stats.cost)} (cache: ${stats.cacheWrite.toLocaleString()} tokens written, ${stats.cacheRead.toLocaleString()} read).`);
  console.log(`File: ${OUT}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(() => process.exit(process.exitCode || 0), (e) => { console.error(e.message || e); process.exit(1); });
}
