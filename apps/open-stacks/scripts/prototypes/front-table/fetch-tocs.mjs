#!/usr/bin/env node
/**
 * Fetch tables of contents for The Front Table's curated works from Open Library.
 *
 *   node scripts/prototypes/front-table/fetch-tocs.mjs
 *
 * For each work id listed in ../front-table.curation.mjs (plus any ids passed
 * on the command line) this asks Open Library for up to 100 editions and keeps
 * the longest English-looking table_of_contents it finds, with the edition key.
 * Results are cached in tocs.json next to this file, so re-runs only fetch new
 * ids. ~1 request per second, with the project User-Agent.
 * The shelf-talkers only name a chapter when that chapter title appears here
 * (or in a full public-domain text); front-table.mjs enforces that.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'tocs.json');
const UA = 'OpenStacksPrototypes/0.1 (https://github.com/quantified-uncertainty/cairn)';
const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf-8')) : {};

const { TABLES, EXTRA_IDS = [] } = await import(join(HERE, '..', 'front-table.curation.mjs'));
const ids = new Set([...TABLES.flatMap((t) => t.books.map((b) => b.id)), ...EXTRA_IDS, ...process.argv.slice(2)]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) return await r.json();
    } catch (e) { /* retry */ }
    await sleep(2500);
  }
  return null;
}

let n = 0;
for (const id of ids) {
  if (cache[id] && cache[id].fetched) continue;
  const d = await get(`https://openlibrary.org/works/${id}/editions.json?limit=100`);
  await sleep(1100);
  if (!d) { console.log('fail', id); continue; }
  let best = null;
  for (const e of d.entries || []) {
    const toc = (e.table_of_contents || []).map((t) => ({ l: (t.label || '').trim(), t: (t.title || t.value || '').trim(), p: (t.pagenum || '').trim() })).filter((t) => t.t);
    if (toc.length < 3) continue;
    const langs = (e.languages || []).map((l) => l.key);
    const eng = !langs.length || langs.includes('/languages/eng');
    if (!eng) continue;
    if (!best || toc.length > best.toc.length) best = { ed: e.key.replace('/books/', ''), title: e.title, date: e.publish_date || '', pages: e.number_of_pages || null, toc };
  }
  cache[id] = { fetched: '2026-10-15', editions: (d.entries || []).length, best };
  n++;
  console.log(id, best ? `${best.toc.length} entries (${best.ed})` : 'no toc');
  if (n % 10 === 0) writeFileSync(OUT, JSON.stringify(cache, null, 1));
}
writeFileSync(OUT, JSON.stringify(cache, null, 1));
console.log('done', Object.keys(cache).length, 'works cached');
