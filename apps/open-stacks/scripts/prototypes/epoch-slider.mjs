#!/usr/bin/env node
/**
 * Precompute the data for the "Epoch Slider" prototype.
 *
 *   node scripts/prototypes/epoch-slider.mjs --fetch [pg_catalog.csv]   # network step (slow, polite, resumable)
 *   node scripts/prototypes/epoch-slider.mjs [pg_catalog.csv]           # offline build + verification
 *
 * Inputs
 *   public/prototypes/data/catalog.json    7,127 Open Library works (CC0)
 *   public/prototypes/data/gutenberg.json  29,007 Gutenberg nonfiction books (y = year ADDED to Gutenberg)
 *   public/prototypes/data/papers.json     1,457 arXiv papers (dated)
 *   public/prototypes/data/texts/          nine public-domain full texts
 *   pg_catalog.csv                         Gutenberg catalog feed, for author life dates (downloaded if absent)
 *   epoch-slider/ol-cache.json             Open Library author dates and title matches (written by --fetch)
 *   epoch-slider/curated.mjs               hand-checked dates for the works the answers lean on, and sense-drift notes
 *   epoch-slider/content.mjs               the precomputed answers (AI-generated, Claude, October 2026)
 *   $EPOCH_CACHE/texts/pg<ID>.txt          extra Gutenberg texts used only to verify quotations (downloaded if absent)
 *
 * Outputs (public/prototypes/data/epoch-slider/)
 *   epochs.json   questions, shelves, rivers, answers, lexicon, date audit (loaded at first paint)
 *   corpus.json   every dated work with search fields, for live "ask at this year" generation (loaded lazily)
 *
 * Dating policy (deterministic, conservative where it matters):
 *   - Catalog works use Open Library's first-publish year, checked against the first author's life dates
 *     (Open Library author records). A year earlier than birth + 15 is impossible: the work is re-dated to the
 *     edition year in its call number when that is plausible, otherwise dropped from the timeline. Years of
 *     exactly 1900 for authors born after 1880 are treated the same way (a placeholder in the source data).
 *   - Gutenberg books carry only the year the e-text was added, so the original year comes from an Open Library
 *     title + author match when it falls inside the author's life, else an estimate from life dates
 *     (birth + 0.65 x lifespan); estimates are flagged and never count as citable before the author's death.
 *   - arXiv papers use their submission date. Curated dates (curated.mjs) override everything and carry a note.
 *   - Catalog and Gutenberg records of the same work are merged (catalog pg links, normalized title + surname,
 *     and a short hand list).
 *
 * Verification (the build fails on any error):
 *   - every work cited in a precomputed answer exists and was published strictly before that answer's epoch;
 *   - every quotation is an exact substring of its source text after whitespace normalization;
 *   - no term in an answer is first attested in the corpus after that answer's epoch (red flag).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { runFetch } from './epoch-slider/fetch.mjs';
import { HERE, DATA, OUTDIR, CACHE_DIR, UA, sleep, readJson, loadBase, loadPgCatalog, pgAuthorDates, QUESTIONS, catMatches, gutMatches, paperMatches } from './epoch-slider/common.mjs';
import { CURATED, SAME_WORK, SENSE_DRIFT, TEXT_SOURCES } from './epoch-slider/curated.mjs';
import { ANSWERS, PROVENANCE } from './epoch-slider/content.mjs';

const args = process.argv.slice(2);
if (args.includes('--fetch')) { await runFetch(args.find((a) => a.endsWith('.csv'))); process.exit(0); }

const EPOCHS = [1750, 1820, 1880, 1920, 1960, 2000, 2026];
const Y0 = 1700, Y1 = 2026, BIN = 5;
const { catalog, gut, papers, texts } = loadBase();
const ol = existsSync(join(HERE, 'ol-cache.json')) ? readJson(join(HERE, 'ol-cache.json')) : { works: {}, authors: {}, gut: {} };
const pgMeta = await loadPgCatalog(args.find((a) => a.endsWith('.csv')));

// ---------------------------------------------------------------- lanes
// Eight river lanes, in the validated categorical order (see the page's palette).
const LANES = [
  { id: 'phil', label: 'Philosophy', lc: 'B · BD · BH · BJ' },
  { id: 'logic', label: 'Logic', lc: 'BC' },
  { id: 'psych', label: 'Psychology', lc: 'BF' },
  { id: 'social', label: 'Social sciences & statistics', lc: 'H · J · K' },
  { id: 'math', label: 'Mathematics & probability', lc: 'QA' },
  { id: 'sci', label: 'Science, medicine & engineering', lc: 'Q · QB–QR · R · S · T' },
  { id: 'comp', label: 'Computing & AI', lc: 'QA76 · Q300–390' },
  { id: 'other', label: 'Other classes', lc: 'A · C–G · L–P · U–Z' },
];
const L = Object.fromEntries(LANES.map((l, i) => [l.id, i]));

function laneFromLC(call) {
  if (!call) return null;
  const m = String(call).toUpperCase().match(/^([A-Z]{1,3})\s*-?\s*0*(\d+(?:\.\d+)?)?/);
  if (!m) return null;
  const cls = m[1], num = m[2] ? parseFloat(m[2]) : null;
  if (cls === 'QA' && num != null && num >= 75 && num < 77) return L.comp;
  if (cls === 'Q' && num != null && num >= 300 && num < 391) return L.comp;
  if (cls === 'BC') return L.logic;
  if (cls === 'BF') return L.psych;
  if (/^B[A-Z]?$/.test(cls) && !/^B[LMPQRSTVX]$/.test(cls)) return L.phil;
  if (/^(H|J|K)/.test(cls)) return L.social;
  if (cls === 'QA') return L.math;
  if (/^(Q|R|S|T)/.test(cls)) return L.sci;
  return L.other;
}
function laneFromDDC(ddc) {
  const n = parseFloat(ddc);
  if (!Number.isFinite(n)) return null;
  if (n >= 4 && n < 7) return L.comp;
  if (n >= 150 && n < 160) return L.psych;
  if (n >= 160 && n < 170) return L.logic;
  if (n >= 100 && n < 200) return L.phil;
  if (n >= 300 && n < 400) return L.social;
  if (n >= 510 && n < 520) return L.math;
  if (n >= 500 && n < 700) return L.sci;
  return L.other;
}
function laneFromArxiv(c) {
  if (/^(stat|math)\./.test(c)) return L.math;
  if (/^(econ|q-fin)/.test(c)) return L.social;
  if (/^(physics|q-bio|astro|cond-mat|quant)/.test(c)) return L.sci;
  return L.comp;
}

// ---------------------------------------------------------------- helpers
const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['a', 'an', 'the', 'of', 'on', 'and', 'or', 'in', 'to', 'for', 'its', 'with']);
const titleKey = (t) => norm(t).split(' ').filter((w) => !STOP.has(w)).slice(0, 3).join(' ');
const surname = (a) => norm((a || '').split(',')[0].split(' ').filter(Boolean).slice(-1)[0] || (a || '').split(',')[0]);
function callYear(call) {
  const ys = String(call || '').match(/\b(1[5-9]\d\d|20[0-2]\d)[a-z]?\b/g);
  return ys ? Number(ys[ys.length - 1].slice(0, 4)) : null;
}
function shortAuthors(list) {
  const a = (list || []).filter(Boolean);
  if (!a.length) return '';
  const fix = (s) => (s.includes(',') ? s.split(',').slice(0, 2).reverse().join(' ').trim() : s).replace(/\s*\(.*?\)\s*/g, ' ').trim();
  return fix(a[0]) + (a.length > 1 ? (a.length === 2 ? ' & ' + fix(a[1]) : ' et al.') : '');
}
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s || '');

// ---------------------------------------------------------------- 1. records
const records = new Map();
const audit = { catalog: { total: 0, checked: 0, corrected: 0, dropped: 0, placeholder: 0, late: 0, curated: 0 }, gutenberg: { total: 0, ol: 0, estimated: 0, undated: 0, viaCatalog: 0, curated: 0 }, papers: 0, merged: 0, examples: [] };

function olAuthorDates(id) {
  const w = ol.works[id];
  if (!w) return null;
  for (const k of (w.ak || []).slice(0, 3)) {
    const a = ol.authors[k];
    if (a && (a.b || a.d)) return { b: a.b && a.b > 1000 ? a.b : null, d: a.d && a.d > 1000 ? a.d : null, n: a.n };
  }
  return null;
}

function isolatedEarly(id, y) {
  const eds = (ol.eds || {})[id];
  if (!eds || !eds.length) return null;
  const next = eds.find((e) => e > y);
  return next && next - y > 60 ? next : null;
}

for (const w of catalog) {
  audit.catalog.total++;
  const key = 'c:' + w.id;
  const lane = laneFromLC(w.lcc && w.lcc.replace(/-/, '')) ?? laneFromLC(w.call) ?? laneFromDDC(w.ddc) ?? L.other;
  let y = w.y || null, yc = 'c', note = '';
  const ad = olAuthorDates(w.id);
  const cy = callYear(w.call);
  if (CURATED[key]) {
    ({ y } = CURATED[key]); yc = 'v'; note = CURATED[key].note; audit.catalog.curated++;
  } else if (!y) {
    if (cy) { y = cy; yc = 'x'; note = 'No first-publish year; dated by the edition year in its call number.'; audit.catalog.corrected++; }
    else { audit.catalog.dropped++; continue; }
  } else if (ad && ad.b && y < ad.b + 15) {
    const was = y;
    if (cy && cy >= ad.b + 15) { y = cy; yc = 'x'; note = `Catalog says ${was}, but the author was born in ${ad.b}; re-dated to the ${cy} edition in its call number.`; audit.catalog.corrected++; }
    else { audit.catalog.dropped++; if (audit.examples.length < 40) audit.examples.push({ t: w.t, a: shortAuthors(w.a), was, why: `author born ${ad.b}`, now: null }); continue; }
    if (audit.examples.length < 40) audit.examples.push({ t: w.t, a: shortAuthors(w.a), was, why: `author born ${ad.b}`, now: y });
  } else if (!(ad && (ad.b || ad.d)) && y < 1930 && isolatedEarly(w.id, y)) {
    const was = y, next = isolatedEarly(w.id, y);
    y = next; yc = 'x'; note = `Catalog says ${was}, but Open Library holds no other edition within 60 years of it and no author dates; re-dated to its next edition (${next}).`;
    audit.catalog.corrected++;
    if (audit.examples.length < 40) audit.examples.push({ t: w.t, a: shortAuthors(w.a), was, why: 'isolated early year', now: y });
  } else if ((y === 1900 || y === 1899) && !(ad && ad.b && ad.b < 1880)) {
    const was = y;
    if (cy && cy > 1900) { y = cy; yc = 'x'; note = `Catalog says ${was}, a common placeholder; re-dated to the ${cy} edition in its call number.`; audit.catalog.placeholder++; }
    else { audit.catalog.dropped++; continue; }
    if (audit.examples.length < 40) audit.examples.push({ t: w.t, a: shortAuthors(w.a), was, why: 'placeholder year', now: y });
  } else {
    if (ad) audit.catalog.checked++;
    if (ad && ad.d && y > ad.d + 1) { yc = 'l'; audit.catalog.late++; note = `Published after the author's death (${ad.d}): a posthumous work, translation or later edition.`; }
  }
  if (y > Y1) continue;
  records.set(key, {
    k: key, t: clip(w.t + (w.st && w.t.length < 40 ? ': ' + w.st : ''), 110), a: shortAuthors(w.a), y, yc, note,
    ln: lane, cl: w.call || (w.lcc ? w.lcc.split('.')[0].replace(/-0*/, '') : '') || (w.ddc ? 'DDC ' + w.ddc : ''),
    pp: w.pp || null, f: w.acc === 'public' ? 1 : w.acc === 'borrowable' ? 2 : 0, ia: w.ia || null, pg: w.pg || null,
    s: (w.s || []).filter((s) => !/nyt:|bestseller|open_syllabus|accessible book|protected daisy|in library|lending library/i.test(s)).slice(0, 5).join('; '),
    fs: w.fs ? clip(w.fs, 220) : null, au: ad || null, src: 'catalog',
  });
}

// Gutenberg: core classes plus anything touching a showcase question.
const CORE = /^(AC|AZ|B|BC|BD|BF|BH|BJ|H|HA|HB|HC|HD|HF|HG|HJ|HM|HN|Q|QA|QB|QC|QH|QP|R|RA|T|TA|TJ|TK)$/;
const catByPg = new Map(catalog.filter((w) => w.pg).map((w) => [Number(w.pg), 'c:' + w.id]));
const catByTitle = new Map();
for (const r of records.values()) catByTitle.set(titleKey(r.t) + '|' + surname(r.a.split(' & ')[0].split(' et al.')[0]), r.k);
const sameWork = new Map(Object.entries(SAME_WORK));

for (const b of gut) {
  const key = 'g:' + b.id;
  const pinned = QUESTIONS.some((Q) => Q.pinned.includes(key));
  const topical = QUESTIONS.some((Q) => gutMatches(Q, b));
  if (!pinned && !topical && !CORE.test(b.c || '')) continue;
  audit.gutenberg.total++;
  const meta = pgMeta.get(b.id);
  const ad = pgAuthorDates(meta?.authors);
  const lane = laneFromLC(b.c) ?? L.other;
  const authorName = ad?.name || (b.a || [])[0] || '';
  const rec = {
    k: key, t: clip(b.t.replace(/\s*\n\s*/g, ': ').replace(/\r/g, ''), 110), a: shortAuthors([authorName, ...(b.a || []).slice(1).filter((x) => !x.includes(authorName.split(',')[0]))].slice(0, 2)),
    y: null, yc: 'e', note: '', ln: lane, cl: b.c || '', pp: null, f: 1, pg: b.id, ia: null,
    s: (b.s || []).slice(0, 5).join('; '), fs: null, au: ad && (ad.b || ad.d) ? { b: ad.b, d: ad.d } : null, src: 'gutenberg',
  };
  // merge with a catalog record of the same work
  const viaPg = catByPg.get(b.id) || sameWork.get(key);
  const viaTitle = catByTitle.get(titleKey(rec.t) + '|' + surname(authorName));
  const target = viaPg || viaTitle;
  if (target && records.has(target) && !CURATED[key]?.keepSeparate) {
    const r = records.get(target);
    r.pg = r.pg || b.id; r.f = 1; r.alt = key; audit.merged++; audit.gutenberg.viaCatalog++;
    if (CURATED[key] && r.yc !== 'v') { r.y = CURATED[key].y; r.yc = 'v'; r.note = CURATED[key].note; }
    continue;
  }
  if (CURATED[key]) { rec.y = CURATED[key].y; rec.yc = 'v'; rec.note = CURATED[key].note; audit.gutenberg.curated++; }
  else {
    const m = ol.gut[b.id];
    const lo = ad?.b ? ad.b + 15 : null, hi = ad?.d ? ad.d + 1 : null;
    if (m && m.fy && (lo == null || m.fy >= lo) && (hi == null || m.fy <= hi) && (lo != null || hi != null)) {
      rec.y = m.fy; rec.yc = 'o'; rec.note = `Dated by an Open Library title match (${m.key}), inside the author's life.`; audit.gutenberg.ol++;
    } else if (ad && ad.b && ad.d) {
      rec.y = Math.round(ad.b + 0.65 * (ad.d - ad.b)); rec.yc = 'e'; rec.lo = ad.b + 18; rec.hi = ad.d;
      rec.note = `Estimated from the author's life (${ad.b}–${ad.d}); citable only from ${ad.d}.`; audit.gutenberg.estimated++;
    } else if (ad && ad.d) {
      rec.y = ad.d - 15; rec.yc = 'e'; rec.hi = ad.d; rec.note = `Estimated: the author died in ${ad.d}; citable only from then.`; audit.gutenberg.estimated++;
    } else { audit.gutenberg.undated++; continue; }
  }
  if (rec.y > Y1) continue;
  records.set(key, rec);
}

for (const p of papers) {
  audit.papers++;
  const y = Number(p.y.slice(0, 4));
  records.set('a:' + p.id, {
    k: 'a:' + p.id, t: clip(p.t.replace(/\s+/g, ' '), 140), a: shortAuthors(p.a), y, yc: 'd', note: '', date: p.y,
    ln: laneFromArxiv(p.c), cl: p.c, pp: null, f: 1, pg: null, ia: null, s: (p.th || []).join('; '), fs: clip(p.ab.replace(/\s+/g, ' '), 260), src: 'arxiv',
  });
}

// local full texts
const TEXT_IDS = new Map(texts.map((t) => [t.id, t]));
for (const r of records.values()) {
  const id = r.pg || (r.alt && Number(r.alt.slice(2)));
  if (id && TEXT_IDS.has(Number(id))) r.tx = Number(id);
}

// aliases: Gutenberg keys merged into catalog records
const ALIAS = new Map();
for (const r of records.values()) if (r.alt) ALIAS.set(r.alt, r.k);
const canon = (k) => (records.has(k) ? k : ALIAS.get(k) || k);
for (const v of Object.values(TEXT_SOURCES)) v.key = canon(v.key);
for (const sd of SENSE_DRIFT) for (const l of sd.kwic) l.key = canon(l.key);

// citable-from year: estimates are only citable once the author was dead (conservative)
for (const r of records.values()) r.cy = r.yc === 'e' ? Math.max(r.y, r.hi || r.y) : r.y;

// ---------------------------------------------------------------- 2. question shelves and rivers
const nBins = Math.ceil((Y1 + 1 - Y0) / BIN);
const binStart = (i) => Y0 + i * BIN;
const outQuestions = [];
const shelfKeys = new Set();
for (const Q of QUESTIONS) {
  const keys = new Set(Q.pinned.filter((k) => records.has(k)));
  for (const w of catalog) if (catMatches(Q, w) && records.has('c:' + w.id)) keys.add('c:' + w.id);
  for (const b of gut) if (gutMatches(Q, b)) { const k = 'g:' + b.id; if (records.has(k)) keys.add(k); else if (ALIAS.has(k)) keys.add(ALIAS.get(k)); }
  for (const p of papers) if (paperMatches(Q, p)) keys.add('a:' + p.id);
  for (const k of Q.pinned) if (ALIAS.has(k)) keys.add(ALIAS.get(k));
  const shelf = [...keys].map((k) => records.get(k)).filter(Boolean).sort((a, b) => a.y - b.y || a.k.localeCompare(b.k));
  shelf.forEach((r) => shelfKeys.add(r.k));
  const lanes = LANES.map(() => ({ books: new Array(nBins).fill(0), papers: new Array(nBins).fill(0) }));
  let before = new Array(LANES.length).fill(0);
  for (const r of shelf) {
    if (r.y < Y0) { before[r.ln]++; continue; }
    const i = Math.min(nBins - 1, Math.floor((r.y - Y0) / BIN));
    lanes[r.ln][r.src === 'arxiv' ? 'papers' : 'books'][i]++;
  }
  const answers = ANSWERS[Q.id];
  outQuestions.push({
    id: Q.id, q: Q.q, short: Q.short, shelf: shelf.map((r) => r.k),
    river: { y0: Y0, bin: BIN, n: nBins, before, lanes },
    answers,
  });
}

// ---------------------------------------------------------------- 3. texts for quotations and the lexicon
const textCache = new Map();
async function getText(id) {
  if (textCache.has(id)) return textCache.get(id);
  let raw = null;
  const local = join(DATA, 'texts', id + '.txt');
  if (existsSync(local)) raw = readFileSync(local, 'utf-8');
  else {
    const p = join(CACHE_DIR, 'texts', 'pg' + id + '.txt');
    if (!existsSync(p)) {
      mkdirSync(join(CACHE_DIR, 'texts'), { recursive: true });
      for (const url of [`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`, `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`, `https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.html`]) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': UA } });
          if (!res.ok) continue;
          let t = await res.text();
          if (/^\s*<!DOCTYPE|<html/i.test(t.slice(0, 200))) {
            if (/404 \| Project Gutenberg/.test(t)) continue;
            t = t.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '').replace(/<br\s*\/?>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&nbsp;/g, ' ');
          }
          writeFileSync(p, t);
          break;
        } catch { /* try next */ }
        await sleep(2000);
      }
    }
    if (existsSync(p)) raw = readFileSync(p, 'utf-8');
  }
  if (raw) {
    const a = raw.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG/i), b = raw.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i);
    if (a >= 0) raw = raw.slice(raw.indexOf('\n', a) + 1, b > a ? b : undefined);
  }
  const flat = raw ? raw.replace(/_/g, '').replace(/\s+/g, ' ') : null;
  textCache.set(id, flat);
  return flat;
}
const flatQuote = (s) => s.replace(/_/g, '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- 4. lexicon (first attestation in the corpus)
const LEX = (await import('./epoch-slider/curated.mjs')).LEXICON;
const lexicon = [];
{
  // evidence pool: titles and first sentences of dated records, abstracts, and full texts at their TEXT year
  const pool = [];
  for (const r of records.values()) {
    if (r.yc === 'e') continue; // estimated dates are too loose to date a word
    pool.push({ y: r.y, k: r.k, src: r.src === 'arxiv' ? 'abstract' : 'title', text: r.t + (r.src === 'arxiv' ? ' ' + (r.fs || '') : '') });
    if (r.fs && r.src === 'catalog') pool.push({ y: r.y, k: r.k, src: 'first sentence', text: r.fs });
  }
  const fullTexts = [];
  for (const [id, info] of Object.entries(TEXT_SOURCES)) {
    const t = await getText(Number(id));
    if (t) fullTexts.push({ id: Number(id), y: info.textYear, k: info.key, text: t });
  }
  for (const term of LEX) {
    const re = new RegExp(term.re, term.cs ? '' : 'i');
    let best = null;
    for (const e of pool) if ((!best || e.y < best.y) && re.test(e.text)) best = { y: e.y, k: e.k, src: e.src, snip: snippet(e.text, re) };
    for (const ft of fullTexts) {
      if (best && ft.y >= best.y) continue;
      if (re.test(ft.text)) best = { y: ft.y, k: ft.k, src: 'full text', snip: snippet(ft.text, re) };
    }
    lexicon.push({ term: term.term, re: term.re, ...(term.cs ? { cs: 1 } : {}), first: best ? best.y : null, ev: best });
  }
}
function snippet(text, re) {
  const m = text.match(re);
  if (!m) return '';
  const i = m.index;
  const s = Math.max(0, i - 70), e = Math.min(text.length, i + m[0].length + 70);
  return (s > 0 ? '…' : '') + text.slice(s, e).trim() + (e < text.length ? '…' : '');
}

// sense drift: verify every KWIC line verbatim
const amber = [];
for (const sd of SENSE_DRIFT) {
  const kwic = [];
  for (const line of sd.kwic) {
    const t = await getText(line.text);
    if (t && t.includes(flatQuote(line.line))) kwic.push({ k: line.key, y: line.y, line: line.line });
    else console.warn(`  sense-drift KWIC dropped (not verbatim): ${sd.term} / ${line.line.slice(0, 50)}`);
  }
  if (kwic.length) amber.push({ term: sd.term, re: sd.re, until: sd.until, gloss: sd.gloss, now: sd.now, kwic });
}

// ---------------------------------------------------------------- 5. verify the precomputed answers
const errors = [], warnings = [];
const CITE = /\[\[([cga]:[^\]]+)\]\]/g;
for (const Qo of outQuestions) {
  for (const ep of EPOCHS) {
    const ans = Qo.answers[ep];
    if (!ans) { errors.push(`${Qo.id} ${ep}: missing answer`); continue; }
    if (ans.newNotes) for (const n of ans.newNotes) { n.k = canon(n.k); if (!records.has(n.k)) errors.push(`${Qo.id} ${ep}: note cites unknown ${n.k}`); }
    const cited = new Set();
    const plain = [];
    for (const b of ans.blocks) {
      if (b.p) b.p = b.p.replace(CITE, (m, k) => `[[${canon(k)}]]`);
      if (b.k) b.k = canon(b.k);
      if (b.notes) for (const n of b.notes) n.k = canon(n.k);
      if (b.p) { for (const m of b.p.matchAll(CITE)) cited.add(m[1]); plain.push(b.p.replace(CITE, '')); }
      if (b.q) {
        cited.add(b.k);
        const src = TEXT_SOURCES[b.text];
        if (!src) { errors.push(`${Qo.id} ${ep}: quote text ${b.text} has no TEXT_SOURCES entry`); continue; }
        const t = await getText(b.text);
        if (!t) { errors.push(`${Qo.id} ${ep}: cannot load text ${b.text}`); continue; }
        if (!t.includes(flatQuote(b.q))) errors.push(`${Qo.id} ${ep}: quote not verbatim in ${b.text}: "${b.q.slice(0, 60)}…"`);
        b.textYear = src.textYear; b.textNote = src.note; b.verified = true;
      }
    }
    for (const k of cited) {
      const r = records.get(k);
      if (!r) { errors.push(`${Qo.id} ${ep}: cited work ${k} not in corpus`); continue; }
      if (!(r.cy < ep)) errors.push(`${Qo.id} ${ep}: cites ${k} (${r.t.slice(0, 40)}, ${r.y}${r.yc === 'e' ? ' est., citable ' + r.cy : ''}) not before ${ep}`);
      shelfKeys.add(k);
      if (!Qo.shelf.includes(k)) Qo.shelf.push(k);
    }
    ans.cites = [...cited];
    const text = plain.join(' ');
    for (const lx of lexicon) {
      const re = new RegExp(lx.re, lx.cs ? 'g' : 'gi');
      if (re.test(text) && (lx.first == null || lx.first > ep)) errors.push(`${Qo.id} ${ep}: red-flag term "${lx.term}" (first attested ${lx.first ?? 'never'})`);
    }
    for (const am of amber) if (ep < am.until && new RegExp(am.re, 'i').test(text)) warnings.push(`${Qo.id} ${ep}: amber term "${am.term}" (sense shifts ${am.until})`);
  }
  // re-sort the shelf after adding cited works
  Qo.shelf.sort((a, b) => records.get(a).y - records.get(b).y || a.localeCompare(b));
}

// ---------------------------------------------------------------- 6. write
const works = {};
for (const k of shelfKeys) {
  const r = records.get(k);
  works[k] = { t: r.t, a: r.a, y: r.y, yc: r.yc, ...(r.note ? { n: r.note } : {}), ln: r.ln, cl: r.cl, ...(r.pp ? { pp: r.pp } : {}), f: r.f, ...(r.pg ? { pg: r.pg } : {}), ...(r.ia ? { ia: r.ia } : {}), ...(r.tx ? { tx: r.tx } : {}), ...(r.cy !== r.y ? { cy: r.cy } : {}), ...(r.date ? { d: r.date } : {}) };
}
const yearsOf = (keys) => keys.map((k) => records.get(k).y);
const out = {
  generated: '2026-10-15',
  provenance: PROVENANCE,
  sources: {
    catalog: 'Open Library works (CC0), fetched 2026-10-15; dates checked against Open Library author records',
    gutenberg: 'Project Gutenberg catalog (public domain texts in the US), fetched 2026-10-15; original years from Open Library title matches or author life dates',
    arxiv: 'arXiv metadata (CC0), fetched 2026-10-15',
  },
  epochs: EPOCHS, y0: Y0, y1: Y1, lanes: LANES,
  questions: outQuestions,
  works,
  lexicon: lexicon.filter((l) => l.first != null),
  amber,
  textSources: TEXT_SOURCES,
  audit,
};
mkdirSync(OUTDIR, { recursive: true });
writeFileSync(join(OUTDIR, 'epochs.json'), JSON.stringify(out));

// corpus for live search: everything dated, compact
const corpus = [...records.values()].map((r) => [r.k, r.t, r.a, r.y, r.yc, r.ln, r.cl, r.f, clip(r.s, 120), r.src === 'arxiv' ? clip(r.fs, 200) : clip(r.fs || '', 140), r.cy, r.tx || 0]);
writeFileSync(join(OUTDIR, 'corpus.json'), JSON.stringify({ fields: ['k', 't', 'a', 'y', 'yc', 'ln', 'cl', 'f', 's', 'x', 'cy', 'tx'], rows: corpus }));

console.log(`records: ${records.size} (catalog ${audit.catalog.total - audit.catalog.dropped}, gutenberg ${[...records.values()].filter((r) => r.src === 'gutenberg').length}, arxiv ${audit.papers}; merged ${audit.merged})`);
console.log('date audit:', JSON.stringify(audit.catalog), JSON.stringify(audit.gutenberg));
for (const Qo of outQuestions) console.log(`${Qo.id}: shelf ${Qo.shelf.length}; by epoch`, EPOCHS.map((e) => `${e}:${Qo.shelf.filter((k) => records.get(k).y <= e).length}`).join(' '));
console.log(`lexicon: ${lexicon.filter((l) => l.first != null).length}/${lexicon.length} terms attested; amber: ${amber.length}`);
for (const w of warnings) console.log('  note: ' + w);
if (errors.length) { console.error(`\n${errors.length} verification error(s):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log('verification passed: all citations precede their epochs, all quotations verbatim, no red-flag terms');
console.log(`wrote ${join(OUTDIR, 'epochs.json')} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB) and corpus.json (${(JSON.stringify(corpus).length / 1024).toFixed(0)} KB)`);
void yearsOf;
