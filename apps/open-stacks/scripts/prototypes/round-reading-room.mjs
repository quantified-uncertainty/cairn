#!/usr/bin/env node
/**
 * Precompute the shelf list for "The Round Reading Room" prototype.
 *
 *   node scripts/prototypes/round-reading-room.mjs [path/to/pg_catalog.csv]
 *
 * Inputs (all already in the repo, except the Gutenberg catalog CSV, which is
 * downloaded from gutenberg.org when no local path is given):
 *   public/prototypes/data/catalog.json      7,127 Open Library works (CC0)
 *   public/prototypes/data/gutenberg.json    29,007 Gutenberg nonfiction books
 *   public/prototypes/data/lcc-outline.json  LC Classification Outline
 *   pg_catalog.csv                           Gutenberg's catalog feed (for author life dates)
 *
 * Output: public/prototypes/data/round-reading-room/room.json
 *
 * What it does, deterministically (no AI, no network except the CSV):
 *   1. Dedupe: a catalog work and a Gutenberg book with the same first-author
 *      surname and the same first three significant title words become one
 *      shelf item (the catalog record keeps its call number and gains the
 *      Gutenberg id, which is a free reading route).
 *   2. Dates: catalog works use Open Library's first-publish year. gutenberg.json
 *      only has the year a book was *added* to Gutenberg, so each Gutenberg book
 *      gets an estimated year of writing from its first author's life dates in
 *      pg_catalog.csv: birth + 0.65 x lifespan (calibrated on 153 catalog works whose authors
 *      have Gutenberg life dates: median absolute error about 10 years), death - 15 when only
 *      death is known, birth + 50 when only birth is known, the middle of "active ..." spans, else a
 *      four-digit year in the title (periodical issues, reports). Each estimate keeps
 *      a band (birth + 18 .. death) and a method code so the UI can say how it was dated.
 *      Books with none of these stay undated and sit on the bottom plinth.
 *   3. Shelf order: catalog works sort by their LC call number. Gutenberg books carry
 *      only a class (QA, BC, E456...), so within a subclass they are shelved next to
 *      catalog works that share their main subject heading (median class number), or at
 *      the start of the narrowest LC outline range whose caption matches a subject, or
 *      at the front of the subclass. These positions are marked as estimated.
 *   4. Subjects: main headings (text before " -- "), lower-cased for matching, with
 *      catalogue noise removed (bestseller lists, "Textbooks", BISAC caps...). Headings
 *      used by at least two works form the vocabulary for the whisper's ripple.
 *   5. Year tiers: 26 shelves from the plinth (undated) to 2020-2026, with bounds set
 *      by hand so each tier holds a readable share of the collection.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = join(APP, 'public/prototypes/data');
const OUTDIR = join(DATA, 'round-reading-room');

const catalog = JSON.parse(readFileSync(join(DATA, 'catalog.json'), 'utf-8'));
const gut = JSON.parse(readFileSync(join(DATA, 'gutenberg.json'), 'utf-8'));
const outline = JSON.parse(readFileSync(join(DATA, 'lcc-outline.json'), 'utf-8'));

async function loadCsv() {
  const local = process.argv[2];
  if (local) return readFileSync(local, 'utf-8');
  const res = await fetch('https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz', {
    headers: { 'User-Agent': 'OpenStacksPrototypes/0.1 (https://github.com/quantified-uncertainty/cairn)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf-8');
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---------- 1. Gutenberg author life dates ----------
const csvRows = parseCsv(await loadCsv());
const header = csvRows.shift();
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const pgMeta = new Map();
for (const r of csvRows) {
  const id = Number(r[col['Text#']]);
  if (Number.isFinite(id)) pgMeta.set(id, { authors: r[col.Authors] || '', issued: r[col.Issued] || '', title: r[col.Title] || '' });
}

function yv(s) {
  if (!s) return null;
  const bce = /BCE/.test(s);
  const v = Number(s.replace(/[^\d]/g, ''));
  if (!Number.isFinite(v)) return null;
  return bce ? -v : v;
}
function lifeDates(p) {
  let m = p.match(/,\s*((?:\d{1,4}\??(?:\s*BCE)?)?)\s*-\s*((?:\d{1,4}\??(?:\s*BCE)?)?)\s*(\[.*\])?\s*$/);
  if (m && (m[1] || m[2])) return { b: yv(m[1]), d: yv(m[2]) };
  m = p.match(/active (\d{1,2})(?:st|nd|rd|th) century( B\.C\.)?/);
  if (m) { const v = (Number(m[1]) - 1) * 100 + 50; return { act: m[2] ? -v : v }; }
  m = p.match(/active (\d{3,4})(?:-(\d{3,4}))?/);
  if (m) return { act: m[2] ? Math.round((Number(m[1]) + Number(m[2])) / 2) : Number(m[1]) };
  return null;
}
function estimateGutenbergYear(id) {
  const meta = pgMeta.get(id);
  if (!meta) return { y: null, how: 'u' };
  const issued = Number((meta.issued || '').slice(0, 4)) || 2026;
  const parts = meta.authors.split(';').map((s) => s.trim()).filter(Boolean);
  let ld = null, how = 'a', who = '';
  for (const p of parts) if (!p.includes('[')) { ld = lifeDates(p); if (ld) { who = p; break; } }
  if (!ld) for (const p of parts) { ld = lifeDates(p); if (ld) { how = 'r'; who = p; break; } }
  if (ld) {
    let y, lo, hi;
    if (ld.act != null) { y = ld.act; lo = y - 20; hi = y + 20; }
    else if (ld.b != null && ld.d != null) { y = Math.round(ld.b + 0.65 * (ld.d - ld.b)); lo = ld.b + 18; hi = ld.d; }
    else if (ld.d != null) { y = ld.d - 15; lo = ld.d - 50; hi = ld.d; }
    else { y = ld.b + 50; lo = ld.b + 18; hi = Math.min(issued, ld.b + 90); }
    y = Math.min(y, issued); hi = Math.min(hi, issued); lo = Math.min(lo, y);
    const life = who.match(/,\s*([^,]*\d[^,]*?)\s*(\[.*\])?\s*$/);
    return { y, lo, hi, how, life: life ? life[1].trim() : '' };
  }
  const tm = (meta.title || '').match(/\b(1[5-9]\d\d|20[0-2]\d)\b/g);
  if (tm) { const y = Math.min(Number(tm[tm.length - 1]), issued); return { y, lo: y, hi: y, how: 't' }; }
  return { y: null, how: 'u' };
}

// ---------- 2. Subjects ----------
const JUNK = new Set([
  'nonfiction', 'general', 'textbooks', 'new york times bestseller', 'new york times reviewed', 'open_syllabus_project',
  'popular works', 'problems, exercises', 'problems, exercises, etc', 'congresses', 'social aspects', 'psychological aspects',
  'science/mathematics', 'early works to 1800', 'methodology', 'research', 'accessible book', 'protected daisy', 'in library',
  'lending library', 'large type books', 'fiction', 'juvenile literature', 'case studies', 'handbooks, manuals, etc',
  'textbook', 'study and teaching', 'history and criticism', 'addresses, essays, lectures', 'collected works', 'english',
  'translations into english', 'biography', 'criticism and interpretation', 'long now manual for civilization', 'philosophy',
  'reading level-grade 11', 'reading level-grade 12', 'bibliography', 'miscellanea', 'sources', 'statistics', 'history',
]);
// 'history', 'philosophy' etc. are kept as *display* subjects on cards but are too broad to carry a ripple.
const BROAD_KEEP_ON_CARD = new Set(['history', 'philosophy', 'statistics', 'biography']);
function normSubject(s) {
  let m = String(s).split(' -- ')[0].trim().replace(/\.$/, '').replace(/\s+/g, ' ');
  if (!m || m.length < 3 || m.length > 80) return null;
  if (/[:_]/.test(m) && !/\(/.test(m)) return null; // nyt:..., collectionID:..., open_syllabus_project
  if (m === m.toUpperCase() && /[A-Z]{4}/.test(m)) return null; // BISAC "BUSINESS & ECONOMICS"
  const key = m.toLowerCase();
  if (JUNK.has(key) && !BROAD_KEEP_ON_CARD.has(key)) return null;
  return { key, disp: m };
}

// ---------- 3. Parse and merge works ----------
const LCC_RE = /^([A-Z]+)-*(\d+(?:\.\d+)?)(?:\.(.*))?$/;
const subclassNames = outline.subclasses;
const sig = (t) => String(t).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ')
  .split(/\s+/).filter((w) => w && !['a', 'an', 'the', 'of', 'on', 'and', 'in', 'to'].includes(w)).slice(0, 3).join(' ');
const surnameCat = (a) => (a || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, ' ').trim().split(/\s+/).pop() || '';
const surnamePg = (a) => (a || '').split(',')[0].toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, ' ').trim().split(/\s+/).pop() || '';
const pgDisplayName = (a) => {
  const [last, rest] = String(a).split(/,\s*/);
  if (!rest) return last;
  return `${rest.replace(/\s*\(.*?\)\s*/g, ' ').trim()} ${last}`.replace(/\s+/g, ' ');
};

const items = [];
const pgById = new Map(gut.books.map((b) => [b.id, b]));
const pgUsed = new Set();
const pgKey = new Map();
for (const b of gut.books) {
  const k = `${surnamePg(b.a?.[0])}|${sig(b.t)}`;
  if (!pgKey.has(k)) pgKey.set(k, b.id);
}

let merged = 0;
for (const w of catalog.works) {
  let pg = w.pg && pgById.has(Number(w.pg)) ? Number(w.pg) : null;
  if (!pg) {
    const k = `${surnameCat(w.a?.[0])}|${sig(w.t)}`;
    if (sig(w.t).split(' ').length >= 2 && pgKey.has(k) && !pgUsed.has(pgKey.get(k))) pg = pgKey.get(k);
  }
  if (pg) { pgUsed.add(pg); merged++; }
  const m = w.lcc ? w.lcc.match(LCC_RE) : null;
  const pgb = pg ? pgById.get(pg) : null;
  const subjects = [...(w.s || []), ...(pgb ? pgb.s : [])];
  items.push({
    src: 0, id: w.id, t: w.st ? `${w.t}: ${w.st}` : w.t, a: (w.a || []).slice(0, 2).join(' & '),
    y: w.y ?? null, lo: w.y ?? null, hi: w.y ?? null, how: w.y ? 'p' : 'u',
    sub: m ? m[1] : null, num: m ? Number(m[2]) : null, cut: m ? (m[3] || '') : '', call: w.call || '',
    acc: w.acc, rl: w.rl || 0, pp: w.pp || 0, ia: w.ia || '', pg: pg || (w.pg ? Number(w.pg) : 0), se: w.se || '', lv: w.lv || '',
    ed: w.ed || 0, subjects, estPos: false,
  });
}

// subject → class-number map from catalog works, for shelving Gutenberg books
const subjNums = new Map();
for (const it of items) {
  if (!it.sub) continue;
  for (const s of it.subjects) {
    const n = normSubject(s);
    if (!n) continue;
    const k = `${it.sub}|${n.key}`;
    if (!subjNums.has(k)) subjNums.set(k, []);
    subjNums.get(k).push(it.num);
  }
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const rangesBySub = new Map();
for (const r of outline.ranges) {
  if (r.d < 1) continue;
  if (!rangesBySub.has(r.c)) rangesBySub.set(r.c, []);
  rangesBySub.get(r.c).push({ ...r, toks: new Set(sig(r.n).split(' ').concat(r.n.toLowerCase().split(/[^a-z]+/)).filter((x) => x.length > 3)) });
}
function guessNumber(sub, subjects) {
  for (const s of subjects) {
    const n = normSubject(s);
    if (!n) continue;
    const hit = subjNums.get(`${sub}|${n.key}`);
    if (hit && hit.length) return median(hit);
  }
  const rs = rangesBySub.get(sub) || [];
  let best = null;
  for (const s of subjects) {
    const toks = String(s).split(' -- ')[0].toLowerCase().split(/[^a-z]+/).filter((x) => x.length > 3);
    if (!toks.length) continue;
    for (const r of rs) {
      let hit = 0;
      for (const t of toks) if (r.toks.has(t) || r.toks.has(t.replace(/s$/, '')) || r.toks.has(t + 's')) hit++;
      const score = hit / toks.length;
      if (score >= 0.6) {
        const span = r.hi - r.lo;
        if (!best || score > best.score || (score === best.score && span < best.span)) best = { score, span, lo: r.lo };
      }
    }
    if (best) break;
  }
  return best ? best.lo : null;
}

let guessed = 0;
for (const b of gut.books) {
  if (pgUsed.has(b.id)) continue;
  const cm = String(b.c || '').match(/^([A-Z]+)(\d+(?:\.\d+)?)?$/);
  const sub = cm ? cm[1] : null;
  let num = cm && cm[2] ? Number(cm[2]) : null;
  let estPos = false;
  if (sub && num == null) {
    num = guessNumber(sub, b.s || []);
    if (num != null) { guessed++; estPos = true; } else num = 0;
  }
  const est = estimateGutenbergYear(b.id);
  items.push({
    src: 1, id: b.id, t: b.t, a: (b.a || []).slice(0, 2).map(pgDisplayName).join(' & '),
    y: est.y, lo: est.lo ?? est.y, hi: est.hi ?? est.y, how: est.how, life: est.life || '',
    sub, num, cut: surnamePg(b.a?.[0]).toUpperCase(), call: b.c || '',
    acc: 'public', rl: 0, pp: 0, ia: '', pg: b.id, se: '', lv: '', ed: 0, subjects: b.s || [], estPos,
  });
}

// ---------- 4. Sort into shelf order ----------
const CLASS_ORDER = 'ABCDEFGHJKLMNPQRSTUVWZ';
const classIdx = (sub) => (sub && CLASS_ORDER.includes(sub[0]) ? CLASS_ORDER.indexOf(sub[0]) : 99);
items.sort((A, B) => {
  const ca = classIdx(A.sub), cb = classIdx(B.sub);
  if (ca !== cb) return ca - cb;
  if (A.sub !== B.sub) return (A.sub || '').localeCompare(B.sub || '');
  if ((A.num ?? 0) !== (B.num ?? 0)) return (A.num ?? 0) - (B.num ?? 0);
  return String(A.cut).localeCompare(String(B.cut)) || String(A.t).localeCompare(String(B.t));
});

// ---------- 5. Year tiers ----------
// [lo, hi] inclusive; tier 0 is the plinth for undated books.
const TIERS = [
  [null, null, 'Undated'],
  [-3000, 1599, 'Before 1600'], [1600, 1699, '1600s'], [1700, 1749, '1700–49'], [1750, 1799, '1750–99'],
  [1800, 1819, '1800–19'], [1820, 1839, '1820–39'], [1840, 1854, '1840–54'], [1855, 1864, '1855–64'],
  [1865, 1874, '1865–74'], [1875, 1884, '1875–84'], [1885, 1894, '1885–94'], [1895, 1904, '1895–1904'],
  [1905, 1914, '1905–14'], [1915, 1930, '1915–30'], [1931, 1949, '1931–49'], [1950, 1964, '1950–64'],
  [1965, 1979, '1965–79'], [1980, 1989, '1980s'], [1990, 1997, '1990–97'], [1998, 2003, '1998–2003'],
  [2004, 2008, '2004–08'], [2009, 2012, '2009–12'], [2013, 2016, '2013–16'], [2017, 2020, '2017–20'], [2021, 2026, '2021–26'],
];
const tierOf = (y) => {
  if (y == null) return 0;
  for (let i = 1; i < TIERS.length; i++) if (y <= TIERS[i][1]) return i;
  return TIERS.length - 1;
};

// ---------- 6. Subject vocabulary ----------
const df = new Map(), disp = new Map();
const itemSubj = items.map((it) => {
  const seen = new Set();
  for (const s of it.subjects) {
    const n = normSubject(s);
    if (!n || seen.has(n.key)) continue;
    seen.add(n.key);
    if (!disp.has(n.key)) disp.set(n.key, new Map());
    disp.get(n.key).set(n.disp, (disp.get(n.key).get(n.disp) || 0) + 1);
  }
  for (const k of seen) df.set(k, (df.get(k) || 0) + 1);
  return [...seen];
});
const vocabKeys = [...df.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([k]) => k);
const vocabIdx = new Map(vocabKeys.map((k, i) => [k, i]));
const vocab = vocabKeys.map((k) => [...disp.get(k).entries()].sort((a, b) => b[1] - a[1])[0][0]);
const vocabDf = vocabKeys.map((k) => df.get(k));

// ---------- 7. Emit (columnar, to keep the file small) ----------
const ACC = ['public', 'borrowable', 'printdisabled', 'no_ebook', 'unclassified'];
const HOW = { p: 0, a: 1, r: 2, t: 3, u: 4 };
const tierCounts = TIERS.map(() => 0);
const W = { src: [], id: [], t: [], a: [], y: [], tier: [], sub: [], call: [], acc: [], rl: [], s: [], how: [], life: {}, ep: [], pp: {}, ia: {}, pg: {}, se: {}, lv: {}, ed: {} };
items.forEach((it, i) => {
  const tier = tierOf(it.y);
  tierCounts[tier]++;
  let title = String(it.t).replace(/\s+/g, ' ').trim();
  if (title.length > 120) title = title.slice(0, 117).replace(/\s+\S*$/, '') + '…';
  W.src.push(it.src); W.id.push(it.id); W.t.push(title); W.a.push(String(it.a || '').slice(0, 70));
  W.y.push(it.y); W.tier.push(tier); W.sub.push(it.sub || ''); W.call.push(it.call || '');
  W.acc.push(ACC.indexOf(it.acc)); W.rl.push(it.rl);
  W.s.push(itemSubj[i].map((k) => vocabIdx.get(k)).filter((x) => x != null).slice(0, 8));
  W.how.push(HOW[it.how]);
  if (it.life) W.life[i] = it.life;
  if (it.estPos) W.ep.push(i);
  if (it.pp) W.pp[i] = it.pp;
  if (it.ia) W.ia[i] = it.ia;
  if (it.src === 0 && it.pg) W.pg[i] = it.pg;
  if (it.se) W.se[i] = it.se;
  if (it.lv) W.lv[i] = it.lv;
  if (it.ed > 1) W.ed[i] = it.ed;
});
const rows = W.src;

// Subclasses and outline ranges that appear on the wall (for labels).
const subCounts = new Map();
for (const it of items) if (it.sub) subCounts.set(it.sub, (subCounts.get(it.sub) || 0) + 1);
const subclasses = {};
for (const [s] of subCounts) subclasses[s] = subclassNames[s] || outline.classes[s[0]] || (s === 'W' ? 'Medicine (NLM classification)' : s);
const ranges = [];
for (const r of outline.ranges) {
  if (r.d < 1 || r.d > 2 || !subCounts.has(r.c)) continue;
  let n = 0;
  for (const it of items) if (it.sub === r.c && it.src === 0 && it.num >= r.lo && it.num <= r.hi) n++;
  if (n >= 4) ranges.push([r.c, r.lo, r.hi, r.d, r.n]);
}

// ---------- 8. A precomputed librarian trail (AI-written captions, validated ids) ----------
// Captions were written by Claude in October 2026 from the records shown and general knowledge
// of the history of statistics; they contain no quotations. Every ref must resolve to a row
// in this file or the script fails.
const TRAILS = [
  {
    q: 'Where do I start on the history of Bayesian thought?',
    title: 'Bayes, from the 1763 essay to the working textbook',
    stops: [
      ['OL16059512W', 'Start with the story: a narrative history of Bayes\' rule from its 18th-century origins to code-breaking and modern computing. It gives you the map before the primary sources.'],
      ['OL14986078W', 'The seed. Bayes\' essay, published posthumously by Richard Price in 1763, asks how to infer an unknown chance from observed frequencies.'],
      [58881, 'Laplace turns inverse probability into a general method and explains it for a lay reader, including his sunrise example. Its year here is estimated from his life dates.'],
      ['OL2630376W', 'Boole recasts logic as algebra and applies it to probability, and he objects to assuming equal priors when nothing is known.'],
      [57359, 'The frequentist reply: Venn defines probability as a proportion in a long series and rejects inverse probability. This is the third edition.'],
      [74864, 'Jevons keeps the Laplacean line alive, treating scientific induction as inverse probability.'],
      ['OL35949W', 'Keynes treats probability as a logical relation between propositions, a bridge from the 19th-century logicians to 20th-century subjectivism.'],
      ['OL5911565W', 'Jaynes rebuilds probability as extended logic, from Cox\'s theorem to maximum entropy, in a textbook published after his death.'],
      ['OL12630389W', 'The standard applied text: hierarchical models, model checking and computation.'],
      ['OL20743446W', 'A teaching-first course in Bayesian modelling with code, where many practitioners now begin.'],
    ],
  },
];
const rowOf = new Map(W.id.map((id, i) => [String(id), i]));
const trails = TRAILS.map((t) => ({
  q: t.q, title: t.title,
  stops: t.stops.map(([ref, caption]) => {
    if (!rowOf.has(String(ref))) throw new Error(`trail ref ${ref} does not resolve`);
    return { ref: String(ref), caption };
  }),
}));

mkdirSync(OUTDIR, { recursive: true });
const out = {
  source: 'Open Library Search API (CC0) catalog.json, Project Gutenberg catalog feed (gutenberg.json + pg_catalog.csv author dates), LC Classification Outline',
  built: '2026-10-15',
  method: 'See scripts/prototypes/round-reading-room.mjs. Gutenberg years are estimates from author life dates; Gutenberg shelf positions within a subclass are estimated from shared subject headings.',
  counts: { works: rows.length, catalog: catalog.works.length, gutenberg: gut.books.length, merged, guessedPositions: guessed, tiers: tierCounts },
  classes: { ...outline.classes, W: 'Medicine (NLM)' },
  subclasses,
  tiers: TIERS.map(([lo, hi, label]) => ({ lo, hi, label })),
  acc: ACC,
  how: ['first published (Open Library)', "estimated from the author's life dates", "estimated from a contributor's life dates", 'from a date in the title', 'undated'],
  cols: 'works is columnar: src (0 Open Library, 1 Gutenberg), id, t(itle), a(uthor), y(ear or estimate), tier, sub(class), call, acc (index into acc), rl (reading-log count), s (subject ids), how (index into how); sparse maps by row index: life (author life dates), pp, ia, pg, se, lv, ed; ep = rows whose shelf position is estimated',
  subjects: vocab,
  subjectDf: vocabDf,
  ranges,
  trails: { provenance: 'Precomputed by Claude, October 2026 (AI-generated; spot-check before relying on it)', list: trails },
  works: W,
};
writeFileSync(join(OUTDIR, 'room.json'), JSON.stringify(out));
const bytes = JSON.stringify(out).length;
console.log(`round-reading-room: ${rows.length} works (${merged} catalog/Gutenberg merges, ${guessed} estimated Gutenberg positions), ${vocab.length} subjects, ${ranges.length} ranges, ${(bytes / 1e6).toFixed(2)} MB`);
console.log('tiers:', TIERS.map((t, i) => `${t[2]}=${tierCounts[i]}`).join('  '));
