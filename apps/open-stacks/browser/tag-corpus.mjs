#!/usr/bin/env node
/**
 * Tag corpus items with Claude Haiku and merge the result into data/tags.json
 * (the "Stay in" tags: server/routes/46-tags.mjs, ui/js/features/tags.js).
 *
 *   node tag-corpus.mjs [--all] [--lanes a,b] [--ids x,y] [--limit 400] [--batch 40]
 *                       [--model claude-haiku-5-5] [--dry-run] [--yes]
 *                       [--tags data/tags.json] [--corpus corpus.json]
 *
 * Which items: by default those in no tag's items yet, e.g. items a corpus
 * rebuild added (the UI also files an item under tags its own it.tags name;
 * this puts such items into the file properly); --all sends every item
 * (memberships are only ever added, never removed). --lanes, --ids and --limit
 * narrow the choice.
 *
 * How: about 40 items per request. Each request starts with the whole current
 * vocabulary (id, label, kind, description of every tag) and the rules, marked
 * for prompt caching, so after the first request that block is read from the
 * cache at a tenth of the input price; the items follow it. Tags the model
 * proposes in this run go after the cached block, so later batches can reuse
 * them without invalidating the cache. The model answers in JSON
 * (output_config.format), 2-4 tags per item; unknown ids are dropped.
 *
 * Cost: it prints the plan and an estimate first; when the estimate is more than
 * what is left of today's AI budget (STACKS_DAILY_BUDGET, default $3, minus
 * today's spend in CACHE/spend.json) it stops unless --yes. --dry-run prints the
 * plan and stops. Calls go through the summaries' model plumbing
 * (server/routes/30-summarize.mjs): same API key (ANTHROPIC_API_KEY), streaming
 * and spend accounting. With the server running, its in-memory spend can
 * overwrite what this script records, as with augment-batch.mjs.
 *
 * Merge: after every batch the tags file is read again from disk and this run's
 * additions are applied to it (so edits other agents made meanwhile are kept),
 * then it is written atomically: existing tags are never dropped, new tags are
 * written once they hold 2 or more items (proposals left with one item are
 * reported at the end), item ids in corpus order, tags sorted by kind then
 * label, one tag per line.
 *
 * STACKS_MOCK_AI=1: no API calls and no spend; each item gets the vocabulary
 * tags whose label and description share the most words with its title, note
 * and abstract (deterministic), and a "mock-<lane>" tag when fewer than two match.
 */
import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (k) => argv.includes('--' + k);
const opt = (k, d = null) => { const j = argv.indexOf('--' + k); return j >= 0 && argv[j + 1] && !argv[j + 1].startsWith('--') ? argv[j + 1] : d; };
const list = (k) => (opt(k) ? opt(k).split(',').map((s) => s.trim()).filter(Boolean) : null);
if (flag('help') || flag('h')) {
  console.log('node tag-corpus.mjs [--all] [--lanes a,b] [--ids x,y] [--limit N] [--batch 40] [--model claude-haiku-5-5]\n                     [--dry-run] [--yes] [--tags data/tags.json] [--corpus corpus.json]   (see the comment at the top of this file)');
  process.exit(0);
}

const KINDS = ['topic', 'method', 'org', 'series', 'benchmark', 'genre', 'era', 'community'];
const MODEL = opt('model', 'claude-haiku-5-5');
const BATCH = Math.max(5, Math.min(100, Number(opt('batch', 40)) || 40));
const LIMIT = opt('limit') != null ? Math.max(1, Number(opt('limit')) || 1) : Infinity;
const DRY = flag('dry-run') || flag('dry');
const MOCK = /^(1|true|yes)$/i.test(process.env.STACKS_MOCK_AI || '');
const TAGS_FILE = resolve(opt('tags') || process.env.STACKS_TAGS || join(HERE, 'data', 'tags.json'));
const CORPUS_FILE = resolve(opt('corpus') || join(HERE, 'corpus.json'));
const MAX_NEW_PER_BATCH = 3;
const usd = (x) => '$' + Number(x || 0).toFixed(x < 0.1 ? 4 : 2);
const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return d; } };
const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const clip = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

// ---------- corpus and current tags ----------
const corpus = readJson(CORPUS_FILE, null);
if (!corpus || !Array.isArray(corpus.items)) { console.error(`Cannot read ${CORPUS_FILE}`); process.exit(1); }
const items = corpus.items;
const LANES = corpus.lanes || {};
const laneIds = new Set(items.map((it) => it.lane));
const order = new Map(items.map((it, k) => [it.id, k]));
const byId = new Map(items.map((it) => [it.id, it]));
const loadTags = () => {
  if (!existsSync(TAGS_FILE)) return { built: null, source: null, tags: [] };
  const d = readJson(TAGS_FILE, null);
  if (!d || !Array.isArray(d.tags)) { console.error(`${TAGS_FILE} is not {"tags": [...]}; not touching it.`); process.exit(1); }
  return d;
};
const start = loadTags();
const vocab = start.tags.filter((t) => t && t.id && Array.isArray(t.items));
const vocabIds = new Set(vocab.map((t) => String(t.id)));

// ---------- which items ----------
function untagged() {
  const inTag = new Set(vocab.flatMap((t) => t.items));
  return (it) => !inTag.has(it.id);
}
let chosen;
const ids = list('ids'), lanes = list('lanes');
if (ids) {
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) console.warn(`Not in the corpus, skipped: ${missing.join(', ')}`);
  chosen = ids.map((id) => byId.get(id)).filter(Boolean);
} else {
  const need = flag('all') ? () => true : untagged();
  chosen = items.filter((it) => (!lanes || lanes.includes(it.lane)) && need(it));
}
chosen = chosen.slice(0, LIMIT);

// ---------- the prompt ----------
const RULES = `You tag items in a personal research library: papers, blog and forum posts, wiki pages, rules texts and old scanned books, on shelves ("lanes") such as AI safety, forecasting and old technical oddities. A tag gathers items a reader would want to browse together.

Rules:
- Give each item 2 to 4 tags: the most specific tags that truly fit, from the vocabulary below, using their ids exactly.
- Judge from the title, note and abstract what the item is about. Use an org or series tag (a lab, an author, a model family) only when the item is by or about it. Use an era tag only when the item's year fits it.
- Prefer an existing tag. Propose a new tag only when no existing tag fits and at least two items in this request share the subject; never a near-synonym of an existing tag. At most ${MAX_NEW_PER_BATCH} new tags per request. A new tag needs an id (lowercase words joined by hyphens), a label (2-4 words), a kind (${KINDS.join(', ')}) and a one-sentence desc saying what belongs in it.
- Answer for every item, keyed by its number k.`;
function vocabBlock() {
  const lines = vocab.slice().sort((a, b) => (`${a.kind}|${a.label}` < `${b.kind}|${b.label}` ? -1 : 1)) // stable bytes: the cached prefix
    .map((t) => `${t.id} | ${t.label} | ${t.kind || 'topic'} | ${clip(t.desc, 240)}`);
  return `${RULES}\n\nShelves: ${Object.entries(LANES).map(([k, v]) => `${k} (${v})`).join(', ')}\n\n<vocabulary count="${lines.length}">\nid | label | kind | description\n${lines.join('\n') || '(empty: propose tags)'}\n</vocabulary>`;
}
function itemText(it, k) {
  const head = [LANES[it.lane] || it.lane, it.kind, it.y, clip(it.a, 120)].filter(Boolean).join('; ');
  return [`[${k}] ${clip(it.t, 300)}`, `  ${head}`, it.path?.length ? `  folder: ${clip(it.path.join(' / '), 160)}` : '', it.why ? `  note: ${clip(it.why, 300)}` : '', it.ab ? `  abstract: ${clip(it.ab, 700)}` : '']
    .filter(Boolean).join('\n');
}
function itemsBlock(batch, proposed) {
  const prev = [...proposed.values()];
  return (prev.length ? `Tags proposed earlier in this run (use them like vocabulary tags):\n${prev.map((t) => `${t.id} | ${t.label} | ${t.kind} | ${t.desc}`).join('\n')}\n\n` : '')
    + `<items count="${batch.length}">\n${batch.map((it, k) => itemText(it, k)).join('\n\n')}\n</items>\n\nReturn JSON: "items", one entry per item above with its number k and its tag ids; "new_tags", the tags you introduced (an empty list if none).`;
}
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['items', 'new_tags'],
  properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['k', 'tags'], properties: { k: { type: 'integer' }, tags: { type: 'array', items: { type: 'string' } } } } },
    new_tags: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'label', 'kind', 'desc'], properties: { id: { type: 'string' }, label: { type: 'string' }, kind: { type: 'string', enum: KINDS }, desc: { type: 'string' } } } },
  },
};

// ---------- mock answers: deterministic word overlap ----------
const STOP = new Set('about after also among and are because been being between both but can could does each even from have into item items its many more most much must not only other over same some such than that their them then there these they this those through under used uses using very were what when where which while with within without work works would your shelf model models paper papers post posts book books part'.split(' '));
const words = (s) => new Set(String(s || '').toLowerCase().match(/[a-z][a-z0-9-]{3,}/g)?.filter((w) => !STOP.has(w)) || []);
let mockIndex = null;
function mockAnswer(batch) {
  if (!mockIndex) mockIndex = vocab.map((t) => ({ id: String(t.id), w: words(`${t.label} ${t.desc}`), lw: words(t.label), lanes: new Set(t.items.map((x) => byId.get(x)?.lane).filter(Boolean)) }));
  const out = { items: [], new_tags: [] }, fresh = new Map();
  batch.forEach((it, k) => {
    const w = words(`${it.t} ${it.why || ''} ${it.ab || ''} ${(it.path || []).join(' ')}`), tw = words(it.t);
    const scored = mockIndex.map((t) => {
      let s = 0; for (const x of t.w) if (w.has(x)) s++;
      for (const x of t.lw) if (tw.has(x)) s += 2;
      if (t.lanes.has(it.lane)) s += 0.5;
      return [s, t.id];
    }).filter(([s]) => s >= 2).sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : 1));
    const tags = scored.slice(0, 3).map(([, id]) => id);
    if (tags.length < 2) {
      const id = 'mock-' + it.lane;
      if (!fresh.has(id)) fresh.set(id, { id, label: `Mock: ${LANES[it.lane] || it.lane}`, kind: 'topic', desc: `Mock tag (STACKS_MOCK_AI) for ${LANES[it.lane] || it.lane} items no vocabulary tag matched.` });
      tags.push(id);
    }
    out.items.push({ k, tags });
  });
  out.new_tags = [...fresh.values()];
  return JSON.stringify(out);
}

// ---------- model plumbing (routes/30-summarize.mjs on a stand-in app, as augment-batch.mjs does) ----------
async function plumbing() {
  const { CACHE, hasKey } = await import('./server/config.mjs');
  const S = await import('./server/routes/30-summarize.mjs');
  const cache = { key: (u) => createHash('sha1').update(u).digest('hex') }; // all 30-summarize needs; cache.mjs would start its index and eviction timers
  const app = { HERE, CACHE, MODEL, hasKey, cache, port: null, route() {}, status() {}, onStart() {}, json() {}, send() {}, body() {} };
  S.default(app);
  return { ai: app.ai, PRICES: S.PRICES, setBudget: S.setBudget, parsePartial: S.parsePartial, hasKey, CACHE };
}

// ---------- merge into the tags file ----------
function mergeInto(base, add, proposals) {
  const tags = (Array.isArray(base.tags) ? base.tags : []).map((t) => ({ ...t }));
  const have = new Map(tags.map((t) => [String(t.id), t]));
  for (const [id, p] of proposals) {
    if (have.has(id) || (add.get(id)?.size || 0) < 2) continue;
    const t = { id, label: p.label, kind: p.kind, desc: p.desc, items: [] };
    tags.push(t); have.set(id, t);
  }
  for (const [id, set] of add) {
    const t = have.get(id);
    if (!t) continue;
    const old = Array.isArray(t.items) ? t.items : [];
    const fresh = [...set].filter((x) => !old.includes(x));
    if (!fresh.length) continue;
    const all = old.concat(fresh), known = all.filter((x) => order.has(x)), rest = all.filter((x) => !order.has(x));
    t.items = known.sort((a, b) => order.get(a) - order.get(b)).concat(rest);
  }
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0); // code-point order, as the file was first written
  tags.sort((a, b) => cmp(String(a.kind || ''), String(b.kind || '')) || cmp(String(a.label || '').toLowerCase(), String(b.label || '').toLowerCase()));
  const mark = `tag-corpus.mjs (${MODEL}${MOCK ? ', mock' : ''})`;
  let source = base.source || `LLM pass (${mark}) over titles, abstracts and notes`;
  if (!source.includes(mark)) source += `; later items: ${mark}`;
  return { ...base, built: new Date().toLocaleDateString('en-CA'), source, tags };
}
function writeTags(data) {
  const { tags, ...head } = data;
  const lines = ['{', ...Object.entries(head).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)},`), ' "tags": ['];
  tags.forEach((t, k) => lines.push('  ' + JSON.stringify(t) + (k < tags.length - 1 ? ',' : '')));
  lines.push(' ]', '}');
  const tmp = TAGS_FILE + '.' + process.pid + '.tmp';
  writeFileSync(tmp, lines.join('\n') + '\n');
  renameSync(tmp, TAGS_FILE);
}

// ---------- plan ----------
const P = await plumbing();
const price = P.PRICES[MODEL];
if (!price) { console.error(`Unknown model ${MODEL}; one of ${Object.keys(P.PRICES).join(', ')}`); process.exit(1); }
const batches = [];
for (let i = 0; i < chosen.length; i += BATCH) batches.push(chosen.slice(i, i + BATCH));
const VOCAB = vocabBlock();
const tok = (chars) => chars / 3.5;
const OUT_PER_ITEM = 45, OUT_FIXED = 400; // JSON per item, new tags and a little thinking at effort low
const estOf = (b, first) => {
  const [pi, po] = price;
  const vin = tok(VOCAB.length) * (first ? 1.25 : 0.1), iin = tok(itemsBlock(b, new Map()).length) + 40 * MAX_NEW_PER_BATCH;
  return ((vin + iin) * pi + (b.length * OUT_PER_ITEM + OUT_FIXED) * po) / 1e6;
};
const est = batches.reduce((a, b, k) => a + estOf(b, k === 0), 0);
const sp = P.ai.spendInfo(), left = Math.max(0, sp.budget - sp.today);
const perLane = {};
for (const it of chosen) perLane[it.lane] = (perLane[it.lane] || 0) + 1;
console.log(`Tags file: ${TAGS_FILE} (${vocab.length} tags${existsSync(TAGS_FILE) ? '' : ', new file'})`);
console.log(`Corpus: ${CORPUS_FILE} (${items.length} items)`);
console.log(`${chosen.length} item${chosen.length === 1 ? '' : 's'} to tag (${flag('all') ? 'all' : ids ? '--ids' : 'in no tag yet'}${lanes ? ', lanes ' + lanes.join(',') : ''}${Number.isFinite(LIMIT) ? ', limit ' + LIMIT : ''})` + (chosen.length ? ': ' + Object.entries(perLane).map(([l, n]) => `${l} ${n}`).join(', ') : ''));
if (!chosen.length) process.exit(0);
console.log(`${batches.length} request${batches.length === 1 ? '' : 's'} of up to ${BATCH} items to ${MODEL}${MOCK ? ' (STACKS_MOCK_AI: mock answers, nothing is spent)' : ''}; vocabulary block about ${Math.round(tok(VOCAB.length)).toLocaleString()} tokens, cached after the first request.`);
console.log(`Estimated cost ${usd(est)}; today's AI budget ${usd(sp.budget)}, ${usd(sp.today)} spent, ${usd(left)} left.`);
if (DRY) {
  for (const [k, b] of batches.entries()) console.log(`  request ${k + 1}: ${b.length} items, about ${usd(estOf(b, k === 0))} (from ${clip(b[0].t, 60)})`);
  console.log('Dry run: nothing sent, nothing written.');
  process.exit(0);
}
if (est > left) {
  if (!flag('yes')) { console.error(`Stopping: the estimate is more than what is left of today's budget (STACKS_DAILY_BUDGET). Run again with --yes to go ahead, or narrow it with --lanes or --limit.`); process.exit(2); }
  P.setBudget(sp.today + est * 2 + 0.01); // --yes: let this process spend past the daily cap, by this run's estimate
  console.log('--yes: going past the daily budget for this run.');
}
if (!MOCK && !P.hasKey()) { console.error('Set ANTHROPIC_API_KEY (or run with STACKS_MOCK_AI=1).'); process.exit(1); }

// ---------- run ----------
const add = new Map();      // tag id -> Set of item ids this run added
const proposals = new Map(); // new tag id -> {id, label, kind, desc}
const known = () => new Set([...vocabIds, ...proposals.keys()]);
const stats = { cost: 0, tagged: 0, assigned: 0, unanswered: [], dropped: 0, failed: 0, cacheRead: 0, cacheWrite: 0 };
let fails = 0, wrote = false;
for (const [bi, batch] of batches.entries()) {
  const content = [
    { type: 'text', text: VOCAB, cache_control: { type: 'ephemeral' } }, // the shared prefix: byte-identical in every request of the run
    { type: 'text', text: itemsBlock(batch, proposals) },
  ];
  const chars = content.reduce((a, c) => a + c.text.length, 0), outTok = batch.length * OUT_PER_ITEM + OUT_FIXED;
  let text, cost = 0, note = '';
  try {
    if (MOCK) {
      text = mockAnswer(batch);
    } else {
      const release = P.ai.reserve(MODEL, chars, outTok);
      try {
        const r = await P.ai.generate({ model: MODEL, content, schema: SCHEMA, maxTokens: Math.max(4000, outTok * 3), mock: () => mockAnswer(batch) }, () => {});
        cost = P.ai.costOf(r.model, r.usage); P.ai.charge(r.model, cost);
        stats.cacheRead += r.usage?.cache_read_input_tokens || 0; stats.cacheWrite += r.usage?.cache_creation_input_tokens || 0;
        if (r.stop === 'refusal') throw Object.assign(new Error('the model declined this batch'), { code: 'refusal' });
        text = r.text;
        if (r.stop === 'max_tokens') note = ' (cut off: answers so far kept)';
      } finally { release(); }
    }
    fails = 0;
  } catch (e) {
    stats.failed += batch.length; fails++;
    console.error(`request ${bi + 1}/${batches.length}: failed: ${e.message}`);
    if (e.code === 'budget' || e.code === 'no_key' || e.code === 'no_sdk' || fails >= 3) { console.error('Stopping.'); break; }
    continue;
  }
  stats.cost += cost;
  let out; try { out = JSON.parse(text); } catch { out = P.parsePartial(text) || {}; }
  // New tags first: clean ids; one that names an existing tag is that tag.
  const alias = new Map();
  for (const t of (Array.isArray(out.new_tags) ? out.new_tags : []).slice(0, MAX_NEW_PER_BATCH)) {
    const id = slug(t?.id || t?.label);
    if (!id || laneIds.has(id)) continue;
    alias.set(String(t.id), id);
    if (known().has(id)) continue;
    proposals.set(id, { id, label: clip(t.label || id, 80), kind: KINDS.includes(t.kind) ? t.kind : 'topic', desc: clip(t.desc, 400) });
  }
  const ok = known(), seen = new Set();
  let assigned = 0;
  for (const row of Array.isArray(out.items) ? out.items : []) {
    const it = batch[row?.k];
    if (!it || seen.has(row.k)) continue;
    seen.add(row.k);
    const tags = [...new Set((Array.isArray(row.tags) ? row.tags : []).map((x) => (ok.has(x) ? x : alias.get(x) || slug(x))))];
    const good = tags.filter((x) => ok.has(x)).slice(0, 4);
    stats.dropped += tags.length - good.length;
    for (const x of good) { if (!add.has(x)) add.set(x, new Set()); add.get(x).add(it.id); }
    if (good.length) { stats.tagged++; assigned += good.length; }
  }
  const missed = batch.filter((_, k) => !seen.has(k));
  stats.unanswered.push(...missed.map((it) => it.id));
  stats.assigned += assigned;
  writeTags(mergeInto(loadTags(), add, proposals)); wrote = true; // re-read: keep what others wrote meanwhile
  console.log(`request ${bi + 1}/${batches.length}: ${batch.length - missed.length}/${batch.length} items, ${assigned} tags${proposals.size ? `, ${proposals.size} proposed so far` : ''}${MOCK ? '' : `, ${usd(cost)}`}${note}`);
}

// ---------- report ----------
const kept = [...proposals.keys()].filter((id) => (add.get(id)?.size || 0) >= 2);
const lone = [...proposals.keys()].filter((id) => (add.get(id)?.size || 0) < 2);
console.log(`\nTagged ${stats.tagged} of ${chosen.length} items (${stats.assigned} tag assignments${stats.dropped ? `, ${stats.dropped} unknown tag ids dropped` : ''}).`);
if (kept.length) console.log(`New tags written: ${kept.map((id) => `${id} (${add.get(id).size})`).join(', ')}`);
if (lone.length) console.log(`Proposed but left with one item, not written: ${lone.join(', ')}`);
if (stats.unanswered.length) console.log(`No answer for ${stats.unanswered.length} items; run again to retry them.`);
if (stats.failed) console.log(`${stats.failed} items in failed requests; run again to retry them.`);
if (!MOCK) console.log(`Spent ${usd(stats.cost)} (cache: ${stats.cacheWrite.toLocaleString()} tokens written, ${stats.cacheRead.toLocaleString()} read).`);
console.log(wrote ? `Wrote ${TAGS_FILE}.` : 'Nothing written.');
