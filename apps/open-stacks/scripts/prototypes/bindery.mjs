#!/usr/bin/env node
/**
 * The Bindery: resolve the precomputed volumes to real records and write the
 * prototype's data.
 *
 *   node scripts/prototypes/bindery.mjs
 *   node scripts/prototypes/bindery.mjs --cache /some/dir   # HTTP cache (default: $TMPDIR/bindery-cache)
 *
 *   reads  public/prototypes/data/{catalog,papers,openstax,gutenberg}.json, texts/*
 *          scripts/prototypes/bindery/editorial.mjs (AI-written notes; see its header)
 *   writes public/prototypes/data/bindery/bindery.json   volumes, routes, records, search index
 *          public/prototypes/data/bindery/extra/*.txt     Gutenberg excerpts read inline
 *
 * What it does, in order (network calls are cached; Open Library ~1/s, arXiv one batched call):
 *
 * 1. Chapter index. Each of the nine full texts in data/texts/ is split into
 *    chapters with a per-book heading rule; each chapter keeps character offsets
 *    into the served file, a word count and a short lead. Three further
 *    excerpts (Pascal's wager, Clifford's "Ethics of Belief", FitzRoy's "How to
 *    Foretell Weather") are fetched from Project Gutenberg, cut at fixed
 *    headings and saved under extra/.
 * 2. Records. Every reference in the editorial file is resolved: Open Library
 *    works against catalog.json, with chapters and page ranges taken from a
 *    fetched edition's table of contents; the language of each linked Internet
 *    Archive scan is checked, so "borrowable" is downgraded when the only
 *    lendable copy is a translation; arXiv ids against papers.json, with page
 *    counts from the arXiv API's comments field; OpenStax sections against the
 *    OpenStax archive (title verified, words counted); free textbooks against
 *    the R01 list in the editorial file.
 * 3. Checks. The build fails if a reference does not resolve, a quotation is
 *    not verbatim in its source (after whitespace normalisation), a "not in
 *    this corpus" claim is contradicted by the data, or a route names a record
 *    that is not resolved. Every check is written to the volume's bench log.
 * 4. Shelving. Each volume's call number is placed among its real
 *    call-number neighbours in catalog.json.
 * 5. Search index for live binding: the chapter index, OpenStax sections of the
 *    books used, the free-textbook list and Open Library tables of contents
 *    fetched here. (catalog.json and papers.json are searched in the page.)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import { VOLUMES, FREE_TEXTS, EXTRA_TEXTS, PROVENANCE } from './bindery/editorial.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = join(APP, 'public/prototypes/data');
const OUT = join(DATA, 'bindery');
const UA = 'OpenStacksPrototypes/0.1 (https://github.com/quantified-uncertainty/cairn)';
const argVal = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const CACHE = argVal('--cache') || join(tmpdir(), 'bindery-cache');
mkdirSync(CACHE, { recursive: true });
mkdirSync(join(OUT, 'extra'), { recursive: true });

// ---------------------------------------------------------------- helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastCall = {};
async function cachedFetch(url, { kind = 'json', gap = 1100 } = {}) {
  const key = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const file = join(CACHE, key + (kind === 'json' ? '.json' : '.txt'));
  if (existsSync(file)) {
    const t = readFileSync(file, 'utf-8');
    return kind === 'json' ? JSON.parse(t) : t;
  }
  const host = new URL(url).host;
  const wait = (lastCall[host] || 0) + gap - Date.now();
  if (wait > 0) await sleep(wait);
  let res;
  for (let attempt = 0; attempt < 4; attempt++) {
    lastCall[host] = Date.now();
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) break;
      if (res.status === 404) throw new Error(`404 ${url}`);
    } catch (e) {
      if (String(e.message).startsWith('404')) throw e;
      res = null;
    }
    await sleep(2000 * (attempt + 1));
  }
  if (!res || !res.ok) throw new Error(`fetch failed: ${url}`);
  const t = await res.text();
  writeFileSync(file, t);
  return kind === 'json' ? JSON.parse(t) : t;
}
const norm = (s) => String(s).replace(/[\s ]+/g, ' ').trim();
const words = (s) => (s.match(/\S+/g) || []).length;
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'upon', 'which', 'with']);
function titleCase(s) {
  s = norm(s).replace(/^_|_$/g, '').replace(/_/g, '').replace(/\[\d+\]/g, '').replace(/[.,;:]+$/, '');
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().split(' ').map((w, i) => {
    if (i > 0 && SMALL.has(w)) return w;
    if (/^[ivxlc]+$/.test(w) && w.length < 5 && i > 0) return w.toUpperCase();
    return w.replace(/^(["'“‘(]?)(\p{L})/u, (m, p, c) => p + c.toUpperCase());
  }).join(' ');
}
const roman = (s) => /^[IVXLC]+$/.test(s);
const log = (...a) => console.log('bindery:', ...a);

// ---------------------------------------------------------------- data
const catalog = JSON.parse(readFileSync(join(DATA, 'catalog.json'), 'utf-8'));
const CAT = new Map(catalog.works.map((w) => [w.id, w]));
const papersAll = JSON.parse(readFileSync(join(DATA, 'papers.json'), 'utf-8')).papers;
const PAP = new Map(papersAll.map((p) => [p.id, p]));
const openstax = JSON.parse(readFileSync(join(DATA, 'openstax.json'), 'utf-8')).books;
const OXBOOK = new Map(openstax.map((b) => [b.url.split('/books/')[1].split('/')[0], b]));
const gutenberg = JSON.parse(readFileSync(join(DATA, 'gutenberg.json'), 'utf-8')).books;
const PG = new Map(gutenberg.map((b) => [b.id, b]));
const textsIndex = JSON.parse(readFileSync(join(DATA, 'texts/index.json'), 'utf-8')).books;

// ---------------------------------------------------------------- 1. chapters
const ORIG_YEAR = { 58881: 1814, 57359: 1888, 65274: 1878, 74864: 1874, 39713: 1902, 5827: 1912, 9662: 1748, 34901: 1859, 1228: 1859 };

/** Per-book heading rules. Each returns [{key,label,title,line}] in body order. */
function headings(id, lines) {
  const out = [];
  const nextText = (i, n = 1) => {
    const got = [];
    for (let j = i + 1; j < lines.length && got.length < n; j++) {
      const t = lines[j].trim();
      if (t) got.push({ t, j }); else if (got.length) break;
    }
    return got;
  };
  const multiTitle = (i) => {
    // consecutive non-empty lines after the heading, up to the first blank line
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    const parts = [];
    while (j < lines.length && lines[j].trim()) { parts.push(lines[j].trim()); j++; }
    return parts.join(' ');
  };
  if (id === 58881 || id === 74864 || id === 1228) {
    lines.forEach((l, i) => {
      const m = l.match(/^CHAPTER ([IVXL]+)\.$/);
      if (m) out.push({ key: m[1], label: `Ch. ${m[1]}`, title: titleCase(multiTitle(i)), line: i });
    });
  } else if (id === 57359) {
    lines.forEach((l, i) => {
      const m = l.match(/^CHAPTER ([IVXL]+)\.(\[\d+\])?$/);
      if (!m) return;
      const t = multiTitle(i);
      if (!t.startsWith('_')) return; // the table of contents repeats headings without italics
      out.push({ key: m[1], label: `Ch. ${m[1]}`, title: titleCase(t), line: i });
    });
  } else if (id === 34901) {
    let seenFirst = 0;
    lines.forEach((l, i) => {
      const m = l.match(/^CHAPTER ([IVXL]+)\.$/);
      if (!m) return;
      if (m[1] === 'I') seenFirst++;
      if (seenFirst < 2) return; // skip the table of contents
      out.push({ key: m[1], label: `Ch. ${m[1]}`, title: titleCase(multiTitle(i)), line: i });
    });
  } else if (id === 5827) {
    lines.forEach((l, i) => {
      const m = l.match(/^CHAPTER ([IVXL]+)\. (.+)$/);
      if (m) out.push({ key: m[1], label: `Ch. ${m[1]}`, title: titleCase(m[2]), line: i });
    });
  } else if (id === 9662) {
    lines.forEach((l, i) => {
      const m = l.match(/^SECTION ([IVXL]+)\.$/);
      if (!m) return;
      const t = nextText(i, 3).map((x) => x.t).find((x) => !/^PART /.test(x)) || '';
      out.push({ key: m[1], label: `Sect. ${m[1]}`, title: titleCase(t), line: i });
    });
  } else if (id === 65274) {
    const ORD = { FIRST: 1, SECOND: 2, THIRD: 3, FOURTH: 4, FIFTH: 5, SIXTH: 6 };
    let part2 = -1;
    lines.forEach((l, i) => {
      if (/^\s+LOVE AND CHANCE$/.test(l) && /^\s+PART II$/.test(lines[i - 1] || '')) part2 = i;
      let m = l.match(/^\s+(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH) PAPER$/);
      if (m) {
        const t = nextText(i)[0]?.t || '';
        out.push({ key: `I.${ORD[m[1]]}`, label: `Part I, paper ${ORD[m[1]]}`, title: titleCase(t), line: i });
        return;
      }
      m = l.match(/^\s+(I|II|III|IV|V)\. ([A-Z’' ]+?)(\[\d+\])?$/);
      if (m && part2 > 0 && i > part2) {
        out.push({ key: `II.${m[1]}`, label: `Part II, ${m[1]}`, title: titleCase(m[2]), line: i });
      }
    });
  } else if (id === 39713) {
    const SEG = [['SH', 'Science and Hypothesis'], ['VS', 'The Value of Science'], ['SM.I', 'Science and Method, Book I'], ['SM.II', 'Science and Method, Book II'], ['SM.III', 'Science and Method, Book III'], ['SM.IV', 'Science and Method, Book IV']];
    let seg = -1;
    lines.forEach((l, i) => {
      const m = l.match(/^CHAPTER ([IVXL]+)$/);
      if (!m) return;
      if (m[1] === 'I') seg++;
      const [code, name] = SEG[seg];
      out.push({ key: `${code}.${m[1]}`, label: `${name}, ch. ${m[1]}`, title: titleCase(nextText(i)[0]?.t || ''), line: i });
    });
  }
  return out;
}
const END_MARK = /^\s*(INDEX\.?|FOOTNOTES?:?|THE END\.?|SUPPLEMENTARY ESSAY.*|THE PRAGMATISM OF PEIRCE|End of (the )?Project Gutenberg.*)\s*$/;

const chapters = [];
const TEXTS = new Map(); // id -> text
for (const b of textsIndex) {
  const text = readFileSync(join(DATA, b.file), 'utf-8');
  TEXTS.set(b.id, text);
  const lines = text.split('\n');
  const offs = [];
  let o = 0;
  for (const l of lines) { offs.push(o); o += l.length + 1; }
  const hs = headings(b.id, lines);
  hs.forEach((h, k) => {
    let endLine = k + 1 < hs.length ? hs[k + 1].line : lines.length;
    if (k + 1 === hs.length) {
      for (let j = h.line + 5; j < lines.length; j++) if (END_MARK.test(lines[j])) { endLine = j; break; }
    }
    if (b.id === 65274) {
      // Part I paper 6 ends at the "PART II" heading; Part II ends before Dewey's essay
      for (let j = h.line + 5; j < endLine; j++) if (/^\s+PART II$/.test(lines[j]) || /^\s+THE PRAGMATISM OF PEIRCE$/.test(lines[j])) { endLine = j; break; }
    }
    const start = offs[h.line];
    const end = endLine < lines.length ? offs[endLine] : text.length;
    const body = text.slice(start, end);
    const lead = norm(body.split('\n').slice(1).join(' ').replace(/_/g, '').replace(/\[\d+\]/g, '')).replace(/^(?:[A-Z][A-Z’'.,;:-]*\s+|[IVX]+\s+)+/, '').slice(0, 220);
    chapters.push({
      id: `pg:${b.id}#${h.key}`, book: b.id, key: h.key, label: h.label, title: h.title,
      work: b.t, by: b.a, year: ORIG_YEAR[b.id] || b.y, file: b.file, start, end, words: words(body), lead,
    });
  });
  log(`chapters: ${b.id} ${b.t}: ${hs.length}`);
}

// Gutenberg excerpts fetched at build time
for (const [key, ex] of Object.entries(EXTRA_TEXTS)) {
  if (!PG.has(ex.book)) throw new Error(`extra text ${key}: Gutenberg ${ex.book} not in gutenberg.json`);
  const raw = (await cachedFetch(`https://www.gutenberg.org/cache/epub/${ex.book}/pg${ex.book}.txt`, { kind: 'text', gap: 1500 })).replace(/\r\n/g, '\n');
  const s = raw.search(ex.start);
  if (s < 0) throw new Error(`extra text ${key}: start marker not found`);
  const rest = raw.slice(s + 1);
  const e = rest.search(ex.end);
  if (e < 0) throw new Error(`extra text ${key}: end marker not found`);
  const body = raw.slice(s, s + 1 + e).replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
  const file = `bindery/extra/pg${key.replace('#', '-')}.txt`;
  writeFileSync(join(DATA, file), body);
  TEXTS.set(`x:${key}`, body);
  chapters.push({
    id: `pgx:${key}`, book: ex.book, key: key.split('#')[1], label: key.split('#')[1].match(/^\d+$/) ? `No. ${key.split('#')[1]}` : (/^[IVX]+$/.test(key.split('#')[1]) ? `Essay ${key.split('#')[1]}` : 'Excerpt'),
    title: ex.title, work: ex.work, by: ex.by, year: ex.year, file, start: 0, end: body.length, words: words(body),
    lead: norm(body.split('\n').slice(1).join(' ').replace(/_/g, '')).slice(0, 220), extra: true,
  });
  log(`extra: ${key} ${ex.title} (${words(body)} words)`);
}
const CH = new Map(chapters.map((c) => [c.id, c]));

// ---------------------------------------------------------------- 2. resolvers
const iaLang = new Map();
async function iaLanguage(ia) {
  if (!ia) return null;
  if (iaLang.has(ia)) return iaLang.get(ia);
  let lang = null;
  try {
    const d = await cachedFetch(`https://archive.org/metadata/${ia}/metadata`, { gap: 600 });
    const l = d?.result?.language;
    lang = Array.isArray(l) ? l[0] : l || null;
  } catch { lang = null; }
  iaLang.set(ia, lang);
  return lang;
}
const LANG = { eng: 'English', dut: 'Dutch', chi: 'Chinese', ger: 'German', fre: 'French', spa: 'Spanish', kor: 'Korean', jpn: 'Japanese', ita: 'Italian', por: 'Portuguese', rus: 'Russian', nor: 'Norwegian', dan: 'Danish', swe: 'Swedish', English: 'English', english: 'English' };

function normToc(entries) {
  return (entries || []).map((e) => {
    if (typeof e === 'string') return { label: '', title: e, page: null };
    let label = norm(e.label || '');
    let title = norm(e.title || '');
    let page = e.pagenum != null ? norm(e.pagenum) : null;
    if (!page && /^[0-9ivxlc]+$/i.test(title)) { page = title; title = ''; }
    if (!title && label) {
      const m = label.match(/^((?:\d+|[IVXLC]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen)\.?)\s+(.*)$/);
      if (m) { label = m[1].replace(/\.$/, ''); title = m[2]; } else { title = label; label = ''; }
    }
    return { label, title, page: page && /^\d+$/.test(page) ? Number(page) : null, level: e.level ?? 0 };
  });
}
const tocCache = new Map();
async function editionToc(workId) {
  if (tocCache.has(workId)) return tocCache.get(workId);
  const d = await cachedFetch(`https://openlibrary.org/works/${workId}/editions.json?limit=50`);
  let best = null;
  for (const e of d.entries || []) {
    const toc = e.table_of_contents;
    if (!toc || toc.length < 3) continue;
    const langs = (e.languages || []).map((l) => l.key);
    if (langs.length && !langs.includes('/languages/eng')) continue;
    const n = normToc(toc);
    const paged = n.filter((x) => x.page).length;
    const score = toc.length + paged * 2;
    if (!best || score > best.score) best = { score, edition: e.key.replace('/books/', ''), toc: n, publish_date: e.publish_date, publishers: e.publishers, pages: e.number_of_pages };
  }
  tocCache.set(workId, best);
  return best;
}

const oxCache = new Map();
let rex = null;
async function oxBook(slug) {
  if (oxCache.has(slug)) return oxCache.get(slug);
  if (!OXBOOK.has(slug)) throw new Error(`OpenStax book not in openstax.json: ${slug}`);
  rex ||= await cachedFetch('https://openstax.org/rex/release.json');
  const cms = await cachedFetch(`https://openstax.org/apps/cms/api/v2/pages/?type=books.Book&fields=title,cnx_id,slug&limit=250`);
  const item = cms.items.find((it) => it.meta?.slug === slug);
  if (!item) throw new Error(`OpenStax CMS has no book ${slug}`);
  const uuid = item.cnx_id;
  const rb = rex.books[uuid];
  const arch = rb.archiveOverride || rex.archiveUrl;
  const ver = rb.defaultVersion;
  const tree = await cachedFetch(`https://openstax.org${arch}/contents/${uuid}@${ver}.json`);
  const sections = [];
  const strip = (h) => norm(String(h).replace(/<[^>]+>/g, ' '));
  (function walk(t, chapter) {
    for (const c of t.contents || []) {
      const title = strip(c.title);
      if (c.contents) walk(c, /^Chapter|^Unit/.test(title) ? title.replace(/^Chapter \d+\s*/, '') : chapter);
      else if (/^\d+\.\d+ /.test(title)) sections.push({ id: `ox:${slug}/${c.slug}`, slug: c.slug, title, chapter, page: c.id.split('@')[0] });
    }
  })(tree.tree, '');
  const b = { slug, uuid, arch, ver, sections, book: OXBOOK.get(slug) };
  oxCache.set(slug, b);
  return b;
}

let arxivMeta = new Map();
async function loadArxivMeta(ids) {
  const want = ids.filter((i) => !arxivMeta.has(i));
  for (let k = 0; k < want.length; k += 40) {
    const chunk = want.slice(k, k + 40).sort();
    const xml = await cachedFetch(`https://export.arxiv.org/api/query?id_list=${chunk.join(',')}&max_results=${chunk.length}`, { kind: 'text', gap: 3200 });
    for (const entry of xml.split('<entry>').slice(1)) {
      const id = (entry.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<]+?)(v\d+)?<\/id>/) || [])[1];
      const comment = norm((entry.match(/<arxiv:comment[^>]*>([\s\S]*?)<\/arxiv:comment>/) || [])[1] || '');
      const pages = Number((comment.match(/(\d+)\s*(?:pages|pp)/i) || [])[1]) || null;
      if (id) arxivMeta.set(id, { comment, pages });
    }
  }
}

function accessFor(w, lang) {
  const ol = `https://openlibrary.org/works/${w.id}`;
  const langName = lang ? LANG[lang] || lang : null;
  switch (w.acc) {
    case 'public':
      if (lang && lang !== 'eng') return { tier: 'buy', label: 'Buy or library', url: ol, note: `Open Library's free scan is the ${langName} edition; no free English copy.` };
      return { tier: 'open', label: 'Free scan · Internet Archive', url: w.ia ? `https://archive.org/details/${w.ia}` : ol, note: lang === 'eng' ? 'Public scan; English checked against the Internet Archive record.' : 'Public scan.' };
    case 'borrowable':
      if (lang && lang !== 'eng') return { tier: 'buy', label: 'Buy or library', url: ol, note: `Listed as borrowable, but the lendable copy is the ${langName} translation; the English edition is print-disabled only.` };
      return { tier: 'loan', label: 'Borrow · Open Library', url: ol, note: 'Controlled digital lending: free account, waitlists and one-hour or 14-day loans.' };
    case 'printdisabled':
      return { tier: 'buy', label: 'Buy or library', url: ol, note: 'Scan restricted to print-disabled readers; otherwise buy or use a library.' };
    case 'no_ebook':
      return { tier: 'buy', label: 'Buy or library', url: ol, note: 'No ebook in Open Library.' };
    default:
      return { tier: 'buy', label: 'Buy or library', url: ol, note: 'Open Library gives no access status.' };
  }
}

const records = new Map(); // ref -> record
const benchLines = new Map(); // ref -> [lines]
async function resolve(ref) {
  if (records.has(ref)) return records.get(ref);
  const checks = [];
  let r;
  const [kind, rest] = [ref.slice(0, ref.indexOf(':')), ref.slice(ref.indexOf(':') + 1)];
  if (kind === 'pg' || kind === 'pgx') {
    const c = CH.get(ref);
    if (!c) throw new Error(`unresolved chapter ${ref}`);
    const bookMeta = PG.get(c.book);
    if (!bookMeta) throw new Error(`${ref}: Gutenberg ${c.book} not in gutenberg.json`);
    checks.push(`gutenberg.json #${c.book} "${bookMeta.t.slice(0, 60)}"`);
    checks.push(`${c.label} "${c.title}" = ${c.file} chars ${c.start.toLocaleString('en')}–${c.end.toLocaleString('en')}, ${c.words.toLocaleString('en')} words`);
    r = {
      ref, kind: 'pd', genre: 'classic', piece: c.title, label: c.label, work: c.work, by: Array.isArray(c.by) ? c.by.join(', ') : c.by, year: c.year,
      words: c.words, pages: Math.max(2, Math.round(c.words / 330)),
      access: { tier: 'open', label: 'Public domain · read here', url: `https://www.gutenberg.org/ebooks/${c.book}`, note: 'Full text in this prototype (Project Gutenberg).' },
      inline: { file: c.file, start: c.start, end: c.end },
    };
  } else if (kind === 'arxiv') {
    const p = PAP.get(rest);
    if (!p) throw new Error(`unresolved arXiv ${rest}`);
    const meta = arxivMeta.get(rest) || {};
    checks.push(`papers.json ${rest} "${p.t.slice(0, 70)}" (${p.y})`);
    if (meta.comment) checks.push(`arXiv API comment: "${meta.comment.slice(0, 80)}"`);
    const pages = meta.pages && meta.pages < 120 ? meta.pages : null;
    r = {
      ref, kind: 'arxiv', genre: 'paper', piece: p.t, work: `arXiv ${rest}`, by: p.a.slice(0, 3).join(', ') + (p.a.length > 3 ? ' et al.' : ''), year: Number(p.y.slice(0, 4)), date: p.y,
      cat: p.c, pages: pages || 14, pagesEstimated: !pages, words: (pages || 14) * 520,
      access: { tier: 'open', label: 'arXiv', url: `https://arxiv.org/abs/${rest}`, note: pages ? `${pages} pages (arXiv comment).` : 'Length not stated; 14 pages assumed.' },
      inline: { abstract: p.ab },
    };
  } else if (kind === 'ol') {
    const [wid, ch] = rest.split('#');
    const w = CAT.get(wid);
    if (!w) throw new Error(`unresolved catalog work ${wid}`);
    checks.push(`catalog.json ${wid} "${w.t.slice(0, 60)}" (${w.y}), ${w.acc}, call ${w.call || '—'}`);
    const lang = await iaLanguage(w.ia);
    if (w.ia) checks.push(`archive.org/metadata/${w.ia}: language ${lang || 'unknown'}`);
    const access = accessFor(w, lang);
    let piece = w.t, label = null, pages = w.pp || 300, range = null, edition = null;
    if (ch) {
      const toc = await editionToc(wid);
      if (!toc) throw new Error(`${ref}: no table of contents found`);
      const want = ch.toLowerCase();
      const idx = toc.toc.findIndex((e) => e.label.toLowerCase().replace(/\.$/, '') === want || e.title.toLowerCase().startsWith(want + ' ') || e.title.toLowerCase() === want);
      if (idx < 0) throw new Error(`${ref}: chapter "${ch}" not in TOC of ${toc.edition}`);
      const e = toc.toc[idx];
      const next = toc.toc.slice(idx + 1).find((x) => x.page && (!e.level || x.level <= e.level));
      piece = e.title || e.label;
      label = /^\d+$/.test(e.label) || /^[IVXLC]+$/.test(e.label) ? `Ch. ${e.label}` : (e.label && e.label !== piece ? e.label : null);
      const WORDNUM = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen'];
      if (WORDNUM.includes(e.label)) label = `Ch. ${WORDNUM.indexOf(e.label) + 1}`;
      if (/^Chapter \d+$/i.test(e.label)) label = `Ch. ${e.label.split(' ')[1]}`;
      if (e.page && next?.page) { range = [e.page, next.page - 1]; pages = next.page - e.page; }
      else pages = Math.round((w.pp || 300) / Math.max(8, toc.toc.length));
      edition = toc.edition;
      checks.push(`openlibrary.org/books/${toc.edition} TOC: "${piece}"${range ? ` pp. ${range[0]}–${range[1]}` : ' (no page numbers)'}`);
      if (/[A-Z]{4}/.test(piece) && piece === piece.toUpperCase()) piece = titleCase(piece);
    } else {
      checks.push(`whole book, ${pages} pp (median of editions); no chapter chosen`);
    }
    r = {
      ref, kind: 'ol', genre: 'book', piece: ch ? piece : w.t.split(':')[0], label, work: w.t.split(':')[0], workFull: w.t, by: (w.a || []).slice(0, 2).join(', '), year: w.y,
      pages, range, edition, wholeBook: !ch, words: pages * 340, call: w.call, olid: wid, ia: w.ia || null, acc: w.acc, iaLang: lang,
      access, inline: { firstSentence: w.fs || null, subjects: (w.s || []).slice(0, 6) },
    };
  } else if (kind === 'ox') {
    const [slug, sec] = rest.split('/');
    const b = await oxBook(slug);
    const s = b.sections.find((x) => x.slug === sec);
    if (!s) throw new Error(`${ref}: section not in OpenStax archive`);
    const page = await cachedFetch(`https://openstax.org${b.arch}/contents/${b.uuid}@${b.ver}:${s.page}.json`, { gap: 400 });
    const text = norm(String(page.content).replace(/<[^>]+>/g, ' '));
    const heads = [...String(page.content).matchAll(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/g)].map((m) => norm(m[1].replace(/<[^>]+>/g, ''))).filter(Boolean).slice(0, 8);
    checks.push(`openstax.json "${b.book.t}"; archive section "${s.title}", ${words(text).toLocaleString('en')} words`);
    r = {
      ref, kind: 'ox', genre: 'textbook', piece: s.title.replace(/^\d+\.\d+ /, ''), label: `§${s.title.split(' ')[0]}`, work: `${b.book.t} (OpenStax)`, by: 'OpenStax', year: Number(b.book.d.slice(0, 4)),
      words: words(text), pages: Math.max(2, Math.round(words(text) / 450)),
      access: { tier: 'open', label: 'OpenStax · free online', url: `https://openstax.org/books/${slug}/pages/${sec}`, note: 'Open textbook; CC licensed.' },
      inline: { headings: heads, lead: text.slice(0, 420) },
    };
  } else if (kind === 'ft') {
    const f = FREE_TEXTS[rest];
    if (!f) throw new Error(`unresolved free text ${rest}`);
    const pages = f.pages || (f.pageRange ? f.pageRange[1] - f.pageRange[0] + 1 : Math.max(2, Math.round((f.words || 9000) / 450)));
    checks.push(`R01 open-textbook list: ${f.work}; ${f.measured}`);
    if (f.catalog) {
      const w = CAT.get(f.catalog);
      if (!w) throw new Error(`${ref}: catalog cross-reference ${f.catalog} missing`);
      checks.push(`also catalog.json ${f.catalog} "${w.t.slice(0, 50)}" (${w.acc})`);
    }
    r = {
      ref, kind: 'ft', genre: 'textbook', piece: f.piece.replace(/^(Ch\. [\d–]+|§[\d.]+) /, ''), label: (f.piece.match(/^(Ch\. [\d–]+|§[\d.]+)/) || [])[1] || null,
      work: f.work, by: f.by, year: f.year, words: f.words || pages * 450, pages, range: f.pageRange || null,
      access: { tier: 'open', label: 'Free from the author', url: f.url, note: f.terms }, olid: f.catalog || null,
      inline: { terms: f.terms },
    };
  } else {
    throw new Error(`unknown reference kind: ${ref}`);
  }
  records.set(ref, r);
  benchLines.set(ref, checks);
  return r;
}

// ---------------------------------------------------------------- 3. volumes
const allRefs = new Set();
for (const v of VOLUMES) {
  for (const p of v.parts) for (const t of p.tracks) { allRefs.add(t.ref); if (t.sub?.ref) allRefs.add(t.sub.ref); }
  for (const c of v.route.concepts) for (const n of c.nodes) allRefs.add(n.ref);
  allRefs.add(v.route.target);
}
await loadArxivMeta([...allRefs].filter((r) => r.startsWith('arxiv:')).map((r) => r.slice(6)));
for (const ref of allRefs) await resolve(ref);
log(`resolved ${records.size} records`);

function verifyNote(note, where) {
  const out = [];
  for (const seg of note) {
    if (typeof seg === 'string') { out.push(seg); continue; }
    const key = seg.src.startsWith('pgx:') ? `x:${Object.keys(EXTRA_TEXTS).find((k) => k.startsWith(seg.src.slice(4) + '#'))}` : Number(seg.src.slice(3));
    const text = TEXTS.get(key);
    if (!text) throw new Error(`${where}: quotation source ${seg.src} not loaded`);
    if (!norm(text).includes(norm(seg.q))) throw new Error(`${where}: quotation not verbatim in ${seg.src}: "${seg.q}"`);
    out.push({ q: seg.q, src: seg.src });
  }
  return out;
}

function absentCheck(spec) {
  const hits = [];
  if (spec.catalog) for (const w of catalog.works) {
    if (!(w.t + ' ' + (w.st || '')).toLowerCase().includes(spec.catalog)) continue;
    if (spec.author && !(w.a || []).some((a) => a.toLowerCase().includes(spec.author))) continue;
    hits.push(`catalog ${w.id} ${w.t}`);
  }
  if (spec.papers) for (const p of papersAll) if (p.t.toLowerCase().includes(spec.papers)) hits.push(`paper ${p.id}`);
  if (spec.gutenberg) for (const b of gutenberg) if (b.t.toLowerCase().includes(spec.gutenberg)) hits.push(`gutenberg ${b.id}`);
  return hits;
}

const LCC_KEY = (call) => {
  const m = call.match(/^([A-Z]{1,3})(\d+)(?:\.(\d+))?\s*(.*)$/);
  if (!m) return null;
  return `${m[1].padEnd(3, '-')}${m[2].padStart(4, '0')}.${(m[3] || '').padEnd(8, '0')}.${m[4].replace(/^\./, '')}`;
};
const shelved = catalog.works.filter((w) => w.lcc).sort((a, b) => (a.lcc < b.lcc ? -1 : a.lcc > b.lcc ? 1 : 0));

const volumes = [];
for (const v of VOLUMES) {
  const bench = [];
  const seen = new Set();
  const line = (kind, text, ok = true) => bench.push({ kind, text, ok });
  line('brief', v.brief);
  const parts = v.parts.map((p, pi) => ({
    title: p.title,
    note: verifyNote(p.note, `${v.id} part ${pi + 1}`),
    tracks: p.tracks.map((t) => {
      if (seen.has(t.ref)) throw new Error(`${v.id}: duplicate track ${t.ref}`);
      seen.add(t.ref);
      return { ref: t.ref, imp: t.imp, core: !!t.core, diff: t.diff, why: t.why, sub: t.sub || null };
    }),
  }));
  for (const p of parts) for (const t of p.tracks) {
    const r = records.get(t.ref);
    line('resolve', `${t.ref} → ${r.label ? r.label + ' ' : ''}“${r.piece}”`);
    for (const c of benchLines.get(t.ref) || []) line('check', c);
    if (r.iaLang && r.iaLang !== 'eng' && r.acc === 'borrowable') line('access', `${t.ref}: borrowable copy is ${LANG[r.iaLang] || r.iaLang}; downgraded to buy-or-library`, false);
    if (t.sub?.ref) {
      const s = records.get(t.sub.ref);
      line('substitute', `${t.ref} → ${t.sub.ref} “${s.piece}” when it cannot be reached`);
    }
    if (t.sub?.covered && !parts.some((pp) => pp.tracks.some((tt) => tt.ref === t.sub.covered || tt.sub?.ref === t.sub.covered))) {
      throw new Error(`${v.id}: ${t.ref} is "covered by" ${t.sub.covered}, which is not in the volume`);
    }
  }
  for (const p of v.parts) for (const seg of p.note) if (typeof seg !== 'string') line('quote', `verbatim in ${seg.src}: “${seg.q.slice(0, 70)}${seg.q.length > 70 ? '…' : ''}”`);
  const rejected = v.rejected.map((rj) => {
    if (rj.absent) {
      const hits = absentCheck(rj.absent);
      if (hits.length) throw new Error(`${v.id}: "${rj.title}" claimed absent but found: ${hits.join('; ')}`);
      line('reject', `${rj.title}: searched ${Object.entries(rj.absent).filter(([k]) => k !== 'author').map(([k, q]) => `${k} for “${q}”${k === 'catalog' && rj.absent.author ? ` by “${rj.absent.author}”` : ''}`).join(', ')}; no match`, false);
    }
    if (rj.present) {
      if (!CAT.has(rj.present)) throw new Error(`${v.id}: "${rj.title}" claimed present but ${rj.present} missing`);
      line('reject', `${rj.title}: resolves to ${rj.present}; dropped by the editor`, false);
    }
    return { title: rj.title, reason: rj.reason, id: rj.present || null };
  });
  // route
  const route = {
    target: v.route.target,
    concepts: v.route.concepts.map((c) => ({
      key: c.key, name: c.name, needed: c.needed,
      nodes: c.nodes.map((n) => {
        if (!records.has(n.ref)) throw new Error(`${v.id} route: ${n.ref} unresolved`);
        for (const k of n.needs || []) if (!v.route.concepts.some((cc) => cc.key === k)) throw new Error(`${v.id} route: unknown concept ${k}`);
        return { ref: n.ref, adds: n.adds, needs: n.needs || [] };
      }),
      uncharted: c.uncharted || [],
    })),
  };
  for (const c of route.concepts) line('route', `${c.name}: ${c.nodes.length} layer(s) resolved${c.uncharted.length ? `, ${c.uncharted.length} uncharted` : ''}`);
  // shelving among real neighbours
  const key = LCC_KEY(v.call);
  let pos = shelved.findIndex((w) => w.lcc > key);
  if (pos < 0) pos = shelved.length;
  const neighbours = [...shelved.slice(Math.max(0, pos - 3), pos), { phantom: true }, ...shelved.slice(pos, pos + 3)]
    .map((w) => (w.phantom ? { phantom: true } : { id: w.id, t: w.t.split(':')[0], a: (w.a || [])[0] || '', y: w.y, call: w.call, acc: w.acc }));
  line('shelve', `${v.call} → between ${neighbours[2]?.call} and ${neighbours[4]?.call} in catalog.json call-number order`);
  volumes.push({
    id: v.id, numeral: v.numeral, title: v.title, subtitle: v.subtitle, cloth: v.cloth, nominalHours: v.nominalHours,
    call: v.call, brief: v.brief, preface: v.preface, capstone: v.capstone, parts, rejected, route, neighbours, bench,
  });
  log(`volume ${v.numeral} ${v.title}: ${parts.reduce((s, p) => s + p.tracks.length, 0)} tracks, ${bench.length} bench lines`);
}

// ---------------------------------------------------------------- 5. search index for live binding
const oxIndex = [];
for (const slug of ['introductory-statistics-2e', 'psychology-2e', 'principles-data-science', 'principles-microeconomics-3e', 'introduction-philosophy', 'principles-economics-3e', 'statistics', 'introductory-business-statistics-2e', 'principles-finance-2e']) {
  try {
    const b = await oxBook(slug);
    for (const s of b.sections) oxIndex.push({ id: s.id, t: s.title, ch: s.chapter, book: b.book.t, y: Number(b.book.d.slice(0, 4)) });
  } catch (e) { log(`openstax index: skipped ${slug} (${e.message})`); }
}
const tocs = {};
for (const [wid, t] of tocCache) if (t) tocs[wid] = { edition: t.edition, toc: t.toc.map((e) => [e.label, e.title, e.page]) };
const freeTexts = Object.entries(FREE_TEXTS).map(([k, f]) => ({ id: `ft:${k}`, work: f.work, piece: f.piece, by: f.by, year: f.year, url: f.url, terms: f.terms, words: f.words || null, pages: f.pages || (f.pageRange ? f.pageRange[1] - f.pageRange[0] + 1 : null), range: f.pageRange || null, catalog: f.catalog || null }));

const out = {
  source: 'The Bindery prototype data. Records resolved against catalog.json (Open Library, CC0), papers.json (arXiv, CC0), openstax.json and the OpenStax archive, gutenberg.json and the full texts in texts/, and the open-textbook list in research/R01-open-books.md.',
  generated: new Date().toISOString().slice(0, 10),
  provenance: PROVENANCE,
  volumes,
  records: Object.fromEntries(records),
  chapters: chapters.map(({ lead, ...c }) => ({ ...c, lead })),
  openstax: oxIndex,
  freeTexts,
  tocs,
};
writeFileSync(join(OUT, 'bindery.json'), JSON.stringify(out));
log(`wrote data/bindery/bindery.json (${(JSON.stringify(out).length / 1024).toFixed(0)} KB): ${volumes.length} volumes, ${records.size} records, ${chapters.length} chapters, ${oxIndex.length} OpenStax sections, ${Object.keys(tocs).length} TOCs`);
