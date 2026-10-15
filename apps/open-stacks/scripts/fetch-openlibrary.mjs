#!/usr/bin/env node
/**
 * Build the prototypes' book catalog from the Open Library Search API.
 *
 *   node scripts/fetch-openlibrary.mjs            # writes public/prototypes/data/catalog.json
 *
 * Open Library metadata is CC0. The script queries one subject at a time,
 * keeps the fields the prototypes use (call numbers for shelf order, access
 * status for "where to read", reader counts for popularity), dedupes by work
 * key, and sorts the result by Library of Congress call number so the file
 * is already in shelf order. It identifies itself with a User-Agent, as the
 * API asks, and waits between requests.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(APP, 'public/prototypes/data/catalog.json');
const UA = 'OpenStacksPrototypes/0.1 (https://github.com/quantified-uncertainty/cairn)';

// Subjects chosen to cover the reading interests the wiki discusses: uncertainty,
// forecasting, decision-making, AI, and the sciences and humanities around them.
const SUBJECTS = [
  'probabilities', 'mathematical statistics', 'bayesian statistical decision theory', 'statistical decision',
  'decision making', 'forecasting', 'game theory', 'information theory', 'machine learning',
  'artificial intelligence', 'neural networks (computer science)', 'computer programming', 'algorithms',
  'computer science', 'mathematics', 'mathematical analysis', 'linear algebra', 'economics',
  'microeconomics', 'econometrics', 'behavioral economics', 'philosophy of science', 'knowledge, theory of',
  'logic', 'ethics', 'philosophy of mind', 'cognitive psychology', 'reasoning', 'judgment',
  'history of science', 'science', 'evolution (biology)', 'physics', 'epidemiology', 'risk assessment',
  'risk management', 'complexity (philosophy)', 'systems theory', 'political science', 'history',
  'world history', 'sociology', 'anthropology', 'futurology', 'technological forecasting',
  'social choice', 'public policy', 'operations research', 'cryptography', 'biology',
];
const FIELDS = [
  'key', 'title', 'subtitle', 'author_name', 'first_publish_year', 'subject', 'lcc', 'ddc',
  'number_of_pages_median', 'ebook_access', 'ia', 'isbn', 'cover_i', 'edition_count',
  'want_to_read_count', 'readinglog_count', 'ratings_average', 'ratings_count', 'first_sentence',
  'id_project_gutenberg', 'id_standard_ebooks', 'id_librivox', 'id_wikidata', 'language',
].join(',');
const PER_PAGE = 100;
const PAGES = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) return await res.json();
      console.warn(`  HTTP ${res.status} for ${url}`);
    } catch (e) {
      console.warn(`  ${e.message} for ${url}`);
    }
    await sleep(2000 * 2 ** i);
  }
  return null;
}

/** Open Library stores LCC as a padded sort key ("QA-0273.00000000.R83 2002"); make it readable. */
function readableLcc(raw) {
  if (!raw) return null;
  const m = raw.match(/^([A-Z]{1,3})-*0*(\d+(?:\.\d+)?)?(?:\.0+)?(.*)$/);
  if (!m) return raw;
  const cls = m[1];
  const num = m[2] ? String(parseFloat(m[2])) : '';
  const rest = (m[3] || '').replace(/^\.0+/, '').trim();
  return `${cls}${num}${rest ? ' ' + rest.replace(/^\./, '.') : ''}`.trim();
}

function pickLcc(list) {
  if (!list || !list.length) return null;
  // Prefer the most specific entry (with a cutter), else the first.
  const withCutter = list.find((x) => /\.[A-Z]\d/.test(x));
  return withCutter || list[0];
}

const works = new Map();
for (const subject of SUBJECTS) {
  for (let page = 1; page <= PAGES; page++) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(`subject:"${subject}"`)}&fields=${FIELDS}&limit=${PER_PAGE}&page=${page}&sort=readinglog`;
    const data = await get(url);
    await sleep(1100);
    if (!data?.docs) continue;
    for (const d of data.docs) {
      if (!d.title || !d.key) continue;
      if (d.language && !d.language.includes('eng')) continue;
      const prev = works.get(d.key);
      if (prev) { prev.q.push(subject); continue; }
      const lccSort = pickLcc(d.lcc);
      works.set(d.key, {
        id: d.key.replace('/works/', ''),
        t: d.title,
        st: d.subtitle || undefined,
        a: (d.author_name || []).slice(0, 3),
        y: d.first_publish_year || null,
        s: (d.subject || []).filter((x) => x.length < 60).slice(0, 10),
        lcc: lccSort,
        call: readableLcc(lccSort),
        ddc: (d.ddc || [])[0] || null,
        pp: d.number_of_pages_median || null,
        acc: d.ebook_access || 'no_ebook',
        ia: (d.ia || [])[0] || undefined,
        isbn: (d.isbn || []).find((x) => x.length === 13) || (d.isbn || [])[0] || undefined,
        cov: d.cover_i || undefined,
        ed: d.edition_count || 0,
        wtr: d.want_to_read_count || 0,
        rl: d.readinglog_count || 0,
        r: d.ratings_average ? Math.round(d.ratings_average * 100) / 100 : undefined,
        rc: d.ratings_count || undefined,
        fs: (d.first_sentence || [])[0] || undefined,
        pg: (d.id_project_gutenberg || [])[0] || undefined,
        se: (d.id_standard_ebooks || [])[0] || undefined,
        lv: (d.id_librivox || [])[0] || undefined,
        wd: (d.id_wikidata || [])[0] || undefined,
        q: [subject],
      });
    }
    console.log(`${subject} p${page}: ${data.docs.length} docs, ${works.size} unique works`);
    if (data.docs.length < PER_PAGE) break;
  }
}

// Popularity sorting drags in bestselling fiction through broad subjects like
// "history"; the shelves are for nonfiction, so drop the literature classes
// (keeping P, PE: language and linguistics) and anything tagged as fiction.
const FICTION_CLASS = /^(PZ|PS|PR|PQ|PT|PL|PG|PH|PJ|PK|PN)/;
const isFiction = (w) =>
  (w.lcc && FICTION_CLASS.test(w.lcc)) ||
  w.s.some((s) => /\bfiction\b|juvenile|novel(s)?$|fantasy|stories/i.test(s));
for (const [k, w] of works) if (isFiction(w)) works.delete(k);

const list = [...works.values()].sort((a, b) => {
  if (a.lcc && b.lcc) return a.lcc < b.lcc ? -1 : a.lcc > b.lcc ? 1 : 0;
  if (a.lcc) return -1;
  if (b.lcc) return 1;
  return a.t.localeCompare(b.t);
});
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({
    source: 'Open Library Search API (CC0), https://openlibrary.org/developers/api',
    fetched: new Date().toISOString().slice(0, 10),
    fields: {
      id: 'Open Library work id', t: 'title', st: 'subtitle', a: 'authors', y: 'first publish year',
      s: 'subjects', lcc: 'LC call number sort key', call: 'readable LC call number', ddc: 'Dewey',
      pp: 'median pages', acc: 'ebook access: public | borrowable | printdisabled | no_ebook',
      ia: 'Internet Archive id', isbn: 'an ISBN', cov: 'cover id', ed: 'edition count',
      wtr: 'want-to-read count', rl: 'reading-log count', r: 'mean rating', rc: 'rating count',
      fs: 'first sentence', pg: 'Project Gutenberg id', se: 'Standard Ebooks id', lv: 'LibriVox id',
      wd: 'Wikidata id', q: 'subject queries that returned it',
    },
    works: list,
  }),
);
console.log(`Wrote ${list.length} works to ${OUT}`);
