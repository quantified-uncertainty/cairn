#!/usr/bin/env node
/**
 * Feeds: warm the extraction cache overnight, and report what it holds
 * (docs/feeds/spec.md, sections 3.8 and 5).
 *
 *   node extract-warm.mjs                          # every lane, feed order, every item (needs the server)
 *   node extract-warm.mjs --lanes ai-safety,llm --items 200 --conc 2
 *   node extract-warm.mjs --report                 # yields per feed and source, from CACHE/extract (no server, no network)
 *   node extract-warm.mjs --sample 40 --feed findings [--seed 7] [--lane ai-safety]   # random cards as text, for hand labelling
 *
 * Warming asks the running server for GET /extract?id=…&bg=1, at most 3 at a
 * time (default 2); the server's politeness rules apply (arXiv HTML one fetch a
 * second, forums 2 at a time, archive.org 2 books), and its background work
 * yields to whatever the reader is loading. Items already cached are skipped.
 * --port N (or STACKS_PORT) picks the server; STACKS_CACHE the cache folder.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import http from 'http';
import { HERE, CACHE, PORT, HOST } from './server/config.mjs';
import { VER, FEEDS, serveView, cardsFor } from './server/lib/extract.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true; };
const DIR = join(CACHE, 'extract');
const safe = (s) => String(s).replace(/[^\w.-]+/g, '_');

const corpusJson = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
const items = corpusJson.items || [];
const byId = new Map(items.map((it) => [it.id, it]));

/** Source kind for reporting: arxiv, pdf (other PDFs), post, quri, web, scan, other. */
function kindOf(it) {
  if (/^arxiv:/.test(it.id)) return 'arxiv';
  if (it.kind === 'html' && /graphql/.test(it.url || '')) return 'post';
  if (it.kind === 'web') return it.lane === 'quri' || /quantifieduncertainty\.org/.test(it.url || '') ? 'quri' : 'web';
  if (it.kind === 'scan') return 'scan';
  if (it.kind === 'pdf') return 'pdf';
  return 'other';
}

/** Feed order across lanes: the server's weighted round-robin (routes/66-extract.mjs). */
function order(lanes, perLane) {
  const buckets = {};
  for (const it of items) if (!lanes || lanes.includes(it.lane)) (buckets[it.lane] ||= []).push(it);
  for (const l of Object.keys(buckets)) buckets[l] = buckets[l].slice(0, perLane);
  const ls = Object.keys(buckets);
  const W = corpusJson.laneWeights || {};
  const weight = (l) => Math.max(0.1, W[l] ?? 1);
  const total = ls.reduce((s, l) => s + weight(l), 0);
  const credit = Object.fromEntries(ls.map((l) => [l, 0])), pos = Object.fromEntries(ls.map((l) => [l, 0]));
  const n = ls.reduce((s, l) => s + buckets[l].length, 0);
  const out = [];
  while (out.length < n) {
    for (const l of ls) credit[l] += weight(l) / total;
    const l = ls.filter((x) => pos[x] < buckets[x].length).sort((a, b) => credit[b] - credit[a])[0];
    if (!l) break;
    credit[l] -= 1; out.push(buckets[l][pos[l]++]);
  }
  return out;
}

function readStored(id) {
  let s = safe(id);
  if (s.length > 180) return null; // long ids: let the server decide
  try { const j = JSON.parse(readFileSync(join(DIR, s + '.json'), 'utf-8')); return j.v === VER && j.id === id ? j : null; } catch { return null; }
}
function allStored() {
  const out = [];
  let files = [];
  try { files = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'verdicts.json' && f !== 'index.json'); } catch { return out; }
  for (const f of files) {
    try { const j = JSON.parse(readFileSync(join(DIR, f), 'utf-8')); if (j.v === VER && byId.has(j.id)) out.push(j); } catch { /* partial write */ }
  }
  return out;
}
function highlights() {
  for (const [f, sample] of [[join(HERE, 'data', 'highlights.json'), false], [join(HERE, 'data', 'highlights.sample.json'), true]]) {
    if (existsSync(f)) try { return { items: JSON.parse(readFileSync(f, 'utf-8')).items || {}, sample }; } catch { /* unreadable */ }
  }
  return { items: {}, sample: false };
}
function verdicts() {
  const m = new Map();
  try { for (const [k, v] of Object.entries(JSON.parse(readFileSync(join(DIR, 'verdicts.json'), 'utf-8')))) m.set(k, !!v); } catch { /* none */ }
  return m;
}
const viewOf = (ex, H, V) => serveView(ex, { hl: H.items[ex.id] || null, verdicts: V, item: byId.get(ex.id) });

// ----------------------------------------------------------------- report ----
function report() {
  const H = highlights(), V = verdicts();
  const lanes = typeof opt('lanes') === 'string' ? opt('lanes').split(',') : null;
  const exs = allStored().filter((ex) => !lanes || lanes.includes(byId.get(ex.id).lane));
  if (!exs.length) { console.log(`No extracts in ${DIR} yet (v${VER}). Run node extract-warm.mjs first.`); return; }
  const kinds = ['arxiv', 'post', 'quri', 'web', 'scan', 'pdf', 'other'];
  const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '-');
  const views = exs.map((ex) => ({ ex, it: byId.get(ex.id), k: kindOf(byId.get(ex.id)), v: viewOf(ex, H, V) }));
  const n = (k) => views.filter((x) => x.k === k).length;
  console.log(`Extracts v${VER} in ${DIR}: ${exs.length} items (${kinds.map((k) => `${k} ${n(k)}`).filter((s) => !/ 0$/.test(s)).join(', ')}); corpus ${items.length}\n`);

  // Errors.
  const err = {};
  for (const x of views) if (x.ex.err) { err[x.k] ||= {}; err[x.k][x.ex.err] = (err[x.k][x.ex.err] || 0) + 1; }
  const arx = views.filter((x) => x.k === 'arxiv');
  const noHtml = arx.filter((x) => x.ex.err === 'no-html').length;
  console.log(`arXiv without HTML: ${noHtml} of ${arx.length} (${pct(noHtml, arx.length)})`);
  console.log('Errors by source:', JSON.stringify(err), '\n');

  // Yields per feed and source.
  console.log(`${pad('feed', 12)}${pad('source', 8)}${lpad('items', 7)}${lpad('usable', 8)}${lpad('w/ card', 9)}${lpad('share', 7)}${lpad('cards', 7)}${lpad('capped', 8)}${lpad('mean', 6)}`);
  const totals = {};
  for (const feed of Object.keys(FEEDS)) {
    for (const k of kinds) {
      const xs = views.filter((x) => x.k === k);
      if (!xs.length) continue;
      const usable = xs.filter((x) => !x.ex.err).length;
      let withCard = 0, before = 0, after = 0;
      for (const x of xs) {
        const all = cardsFor(feed, x.v, 99, { item: x.it, sample: H.sample });
        const capped = cardsFor(feed, x.v, undefined, { item: x.it, sample: H.sample });
        if (capped.length) withCard++;
        before += all.length; after += capped.length;
      }
      if (!before && feed !== 'pictures') continue;
      (totals[feed] ||= { items: 0, withCard: 0, after: 0 });
      totals[feed].items += xs.length; totals[feed].withCard += withCard; totals[feed].after += after;
      console.log(`${pad(feed, 12)}${pad(k, 8)}${lpad(xs.length, 7)}${lpad(usable, 8)}${lpad(withCard, 9)}${lpad(pct(withCard, usable), 7)}${lpad(before, 7)}${lpad(after, 8)}${lpad(withCard ? (after / withCard).toFixed(1) : '-', 6)}`);
    }
  }
  console.log('\nTotals (cards after the cap):', Object.entries(totals).map(([f, t]) => `${f} ${t.after} from ${t.withCard} items`).join(' · '));

  // Posts feed by part type.
  const ptypes = {};
  const posts = views.filter((x) => x.k === 'post' && !x.ex.err);
  for (const x of posts) for (const t of new Set(x.ex.parts.map((p) => p.type))) ptypes[t] = (ptypes[t] || 0) + 1;
  console.log(`\nPosts with each part type (of ${posts.length} usable posts):`, ['tldr', 'status', 'pull', 'opener', 'quote', 'claims', 'finding', 'number', 'image', 'table', 'definition'].map((t) => `${t} ${pct(ptypes[t] || 0, posts.length)}`).join(' · '));

  // The lead: show and by, per source.
  console.log('\nLead (top picture):');
  for (const k of kinds) {
    const xs = views.filter((x) => x.k === k && !x.ex.err);
    if (!xs.length) continue;
    const show = {}, by = {};
    for (const x of xs) { show[x.v.lead.show] = (show[x.v.lead.show] || 0) + 1; by[x.v.lead.by] = (by[x.v.lead.by] || 0) + 1; }
    const shown = xs.length - (show.none || 0);
    console.log(`  ${pad(k, 6)} usable ${xs.length}: one ${show.one || 0}, few ${show.few || 0} (${pct(show.few || 0, shown)} of shown), none ${show.none || 0} · by ${JSON.stringify(by)}`);
  }
  // Figure 1 in the lead (section 5.3), arXiv with a Figure 1 near the start.
  let f1 = 0, f1in = 0, f1first = 0;
  for (const x of arx) {
    if (x.ex.err) continue;
    const fig1 = x.ex.parts.find((p) => p.type === 'figure' && p.label === 'Figure 1' && p.at < 0.15);
    if (!fig1) continue;
    f1++;
    const lead = serveView(x.ex, { verdicts: V }).lead; // heuristic only
    const i = lead.pics.findIndex((p) => p.pid === fig1.pid);
    const shownN = lead.show === 'few' ? lead.pics.length : 1;
    if (i >= 0 && i < shownN) f1in++;
    if (i === 0) f1first++;
  }
  console.log(`  arXiv Figure 1 (at < 0.15) shown in the heuristic lead: ${f1in} of ${f1} (${pct(f1in, f1)}); first: ${f1first}`);
  // Plates verified.
  const scans = views.filter((x) => x.k === 'scan' && !x.ex.err);
  const verified = scans.filter((x) => x.v.lead.pics.some((p) => p.verdict)).length;
  console.log(`  scans with a verified plate: ${verified} of ${scans.length} (${pct(verified, scans.length)}); verdicts stored: ${V.size}`);

  // Build time.
  const cpu = (k) => views.filter((x) => x.k === k && x.ex.cpu != null).map((x) => x.ex.cpu).sort((a, b) => a - b);
  const q = (a, p) => (a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : '-');
  console.log('\nParse time in the worker (ms), p50 / p90 / max:', kinds.map((k) => { const a = cpu(k); return a.length ? `${k} ${q(a, 0.5)} / ${q(a, 0.9)} / ${a.at(-1)}` : null; }).filter(Boolean).join(' · '));
}

// ----------------------------------------------------------------- sample ----
function sample() {
  const N = Number(opt('sample')) || 40;
  const feed = opt('feed', 'findings');
  if (!FEEDS[feed]) { console.log(`--feed must be one of ${Object.keys(FEEDS).join(', ')}`); process.exit(1); }
  let seed = Number(opt('seed', 7)) >>> 0;
  const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const H = highlights(), V = verdicts();
  const lane = opt('lane');
  const cards = [];
  for (const ex of allStored()) {
    const it = byId.get(ex.id);
    if (typeof lane === 'string' && it.lane !== lane) continue;
    for (const c of cardsFor(feed, viewOf(ex, H, V), undefined, { item: it, sample: H.sample })) cards.push({ c, it });
  }
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  console.log(`${Math.min(N, cards.length)} random ${feed} cards of ${cards.length} (seed ${opt('seed', 7)}). Judge each: worth a glance, or not.\n`);
  const one = (s, n = 600) => String(s || '').replace(/\s+/g, ' ').slice(0, n);
  cards.slice(0, N).forEach(({ c, it }, k) => {
    console.log(`#${k + 1}  [${c.type}${c.label ? ' · ' + one(c.label, 80) : ''}${c.value ? ' · ' + c.value : ''}]  ${one(it.t, 90)} (${it.y || ''}, ${it.lane})${c.sec ? '  §' + one(c.sec, 60) : ''}`);
    if (c.type === 'lead') for (const p of c.pics.slice(0, c.show === 'few' ? 3 : 1)) console.log(`    ${p.label || p.pid}: ${p.img}${p.caption ? '\n      ' + one(p.caption, 300) : ''}${p.verify ? '  (needs the ink test)' : ''}`);
    else if (c.type === 'highlight') console.log(`    ${one(c.claim)}\n    Q: ${one(c.question)}`);
    else {
      if (c.ctx?.before) console.log(`    … ${one(c.ctx.before, 200)}`);
      console.log(`    ${one(c.text, 700)}`);
      if (c.cue) console.log(`    cue: ${one(c.cue, 80)}`);
    }
    console.log(`    ${c.loc?.href || it.page || it.url || ''}\n`);
  });
}

// ------------------------------------------------------------------ warm ----
const base = `http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${Number(opt('port', PORT))}`;
function get(path, timeout = 300e3) {
  return new Promise((resolve, reject) => {
    const r = http.get(base + path, { timeout }, (res) => {
      let b = ''; res.setEncoding('utf8');
      res.on('data', (c) => { b += c; });
      res.on('end', () => { try { resolve({ code: res.statusCode, j: JSON.parse(b) }); } catch { resolve({ code: res.statusCode, j: null }); } });
    });
    r.on('timeout', () => r.destroy(new Error('timeout')));
    r.on('error', reject);
  });
}
async function warm() {
  try { await get('/status', 3000); } catch {
    console.log(`No Stacks server at ${base}. Start it first:\n  node server.mjs${opt('port') ? ' --port ' + opt('port') : ''}\nthen run this again. (--report and --sample work without a server.)`);
    process.exit(1);
  }
  const lanes = typeof opt('lanes') === 'string' ? opt('lanes').split(',') : null;
  const perLane = Number(opt('items')) || Infinity;
  const conc = Math.max(1, Math.min(3, Number(opt('conc')) || 2));
  const list = order(lanes, perLane);
  const todo = list.filter((it) => !readStored(it.id));
  console.log(`Warming ${todo.length} of ${list.length} items (${list.length - todo.length} already cached) through ${base}, ${conc} at a time. Ctrl-C stops cleanly.`);
  let stop = false, done = 0, ok = 0, failed = 0;
  const errs = {};
  process.on('SIGINT', () => { if (stop) process.exit(130); stop = true; console.log('\nStopping after the items in flight…'); });
  const t0 = Date.now();
  const line = () => {
    const s = (Date.now() - t0) / 1000;
    const rate = done / Math.max(1, s);
    const eta = rate ? Math.round((todo.length - done) / rate / 60) : '?';
    console.log(`${done}/${todo.length} · ${rate.toFixed(2)} items/s · ok ${ok} · ${Object.entries(errs).map(([k, v]) => `${k} ${v}`).join(', ') || 'no errors'} · failed ${failed} · eta ${eta} min`);
  };
  let next = 0;
  const workerFn = async () => {
    while (!stop && next < todo.length) {
      const it = todo[next++];
      try {
        const { code, j } = await get(`/extract?id=${encodeURIComponent(it.id)}&bg=1`);
        if (code === 200 && j) { if (j.err) errs[j.err] = (errs[j.err] || 0) + 1; else ok++; }
        else { failed++; if (opt('verbose')) console.log(`  ${it.id}: ${j?.error || 'HTTP ' + code}`); }
      } catch (e) { failed++; if (opt('verbose')) console.log(`  ${it.id}: ${e.message}`); }
      done++;
      if (done % 10 === 0) line();
    }
  };
  await Promise.all(Array.from({ length: conc }, workerFn));
  line();
  console.log(`Done in ${Math.round((Date.now() - t0) / 1000)} s. node extract-warm.mjs --report for the yields.`);
}

if (opt('report')) report();
else if (opt('sample')) sample();
else await warm();
