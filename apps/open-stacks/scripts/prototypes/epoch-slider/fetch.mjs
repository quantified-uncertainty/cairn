// Network step for the Epoch Slider data build: fetch the date evidence that the
// shipped datasets lack, and cache it in ol-cache.json next to this file so the
// build itself runs offline and reproducibly.
//
//   node scripts/prototypes/epoch-slider.mjs --fetch [path/to/pg_catalog.csv]
//
// 1. Open Library work records (author keys) for every catalog work, 100 per
//    search request.
// 2. Open Library author records (birth and death dates), 100 per request.
// 3. For each Gutenberg book that touches one of the two showcase questions, an
//    Open Library title + author search, keeping the best title match's
//    first_publish_year (Gutenberg's own year is the year the e-text was added).
// About one request per second, with the project User-Agent. Resumable.

import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { HERE, UA, sleep, readJson, loadBase, loadPgCatalog, pgAuthorDates, QUESTIONS, gutMatches } from './common.mjs';

const CACHE = join(HERE, 'ol-cache.json');

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (res.ok) return await res.json();
      if (res.status === 429 || res.status >= 500) { await sleep(5000 * (attempt + 1)); continue; }
      throw new Error(`HTTP ${res.status} ${url}`);
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(4000 * (attempt + 1));
    }
  }
}

function yearOf(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{3,4})(?!.*\d{3,4})/);
  return m ? Number(m[1]) : null;
}

export async function runFetch(pgPath) {
  const cache = existsSync(CACHE) ? readJson(CACHE) : { works: {}, authors: {}, gut: {} };
  const save = () => writeFileSync(CACHE, JSON.stringify(cache));
  const { catalog, gut } = loadBase();

  // 1. works -> author keys
  const todoW = catalog.map((w) => w.id).filter((id) => /W$/.test(id) && !(id in cache.works));
  console.log(`works to fetch: ${todoW.length}`);
  for (let i = 0; i < todoW.length; i += 100) {
    const ids = todoW.slice(i, i + 100);
    const q = 'key:(' + ids.map((id) => '/works/' + id).join(' OR ') + ')';
    const url = 'https://openlibrary.org/search.json?' + new URLSearchParams({ q, fields: 'key,author_key,first_publish_year', limit: '200' });
    const j = await getJson(url);
    const got = new Map((j.docs || []).map((d) => [d.key.replace('/works/', ''), d]));
    for (const id of ids) {
      const d = got.get(id);
      cache.works[id] = d ? { ak: d.author_key || [], fy: d.first_publish_year ?? null } : { ak: [], fy: null, missing: true };
    }
    save();
    process.stdout.write(`  works ${Math.min(i + 100, todoW.length)}/${todoW.length}\r`);
    await sleep(1100);
  }

  // 2. authors -> life dates
  const allA = new Set(Object.values(cache.works).flatMap((w) => w.ak.slice(0, 3)));
  const todoA = [...allA].filter((k) => !(k in cache.authors));
  console.log(`\nauthors to fetch: ${todoA.length}`);
  for (let i = 0; i < todoA.length; i += 100) {
    const ks = todoA.slice(i, i + 100);
    const q = 'key:(' + ks.map((k) => '/authors/' + k).join(' OR ') + ')';
    const url = 'https://openlibrary.org/search/authors.json?' + new URLSearchParams({ q, fields: 'key,name,birth_date,death_date', limit: '200' });
    const j = await getJson(url);
    const got = new Map((j.docs || []).map((d) => [d.key.replace('/authors/', ''), d]));
    for (const k of ks) {
      const d = got.get(k);
      cache.authors[k] = d ? { n: d.name, b: yearOf(d.birth_date), d: yearOf(d.death_date) } : { missing: true };
    }
    save();
    process.stdout.write(`  authors ${Math.min(i + 100, todoA.length)}/${todoA.length}\r`);
    await sleep(1100);
  }

  // 2b. edition years for early-dated catalog works (to catch placeholder first-publish years)
  cache.eds = cache.eds || {};
  const todoE = catalog.filter((w) => w.y && w.y < 1930 && !(w.id in cache.eds)).map((w) => w.id);
  console.log(`\nearly works needing edition years: ${todoE.length}`);
  for (let i = 0; i < todoE.length; i += 100) {
    const ids = todoE.slice(i, i + 100);
    const q = 'key:(' + ids.map((id) => '/works/' + id).join(' OR ') + ')';
    const url = 'https://openlibrary.org/search.json?' + new URLSearchParams({ q, fields: 'key,publish_year', limit: '200' });
    const j = await getJson(url);
    const got = new Map((j.docs || []).map((d) => [d.key.replace('/works/', ''), d]));
    for (const id of ids) cache.eds[id] = [...new Set(got.get(id)?.publish_year || [])].sort((a, b) => a - b);
    save();
    await sleep(1100);
  }

  // 3. Gutenberg books on the two questions -> Open Library first-publish year
  const pgMeta = await loadPgCatalog(pgPath);
  const todoG = gut.filter((b) => QUESTIONS.some((Q) => gutMatches(Q, b) || Q.pinned.includes('g:' + b.id))).filter((b) => !(b.id in cache.gut));
  console.log(`\ngutenberg books to match: ${todoG.length}`);
  let n = 0;
  for (const b of todoG) {
    const ad = pgAuthorDates(pgMeta.get(b.id)?.authors);
    const surname = (ad?.name || (b.a || [])[0] || '').split(',')[0].trim();
    const title = b.t.split(/[:;\n]| — /)[0].replace(/\((?:Vol|Volume)[^)]*\)|,? (?:Vol|Volume) [^,]*$/i, '').trim();
    const params = { title, fields: 'key,title,first_publish_year,author_name', limit: '8' };
    if (surname) params.author = surname;
    try {
      const j = await getJson('https://openlibrary.org/search.json?' + new URLSearchParams(params));
      const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      const want = norm(title);
      let best = null;
      for (const d of j.docs || []) {
        const t = norm(d.title);
        const score = t === want ? 3 : t.startsWith(want) || want.startsWith(t) ? 2 : t.includes(want.split(' ').slice(0, 3).join(' ')) ? 1 : 0;
        if (score && d.first_publish_year && (!best || score > best.score || (score === best.score && d.first_publish_year < best.fy))) {
          best = { score, fy: d.first_publish_year, key: d.key, t: d.title };
        }
      }
      cache.gut[b.id] = best ? { fy: best.fy, key: best.key.replace('/works/', ''), t: best.t, sc: best.score } : { none: true };
    } catch (e) {
      console.log(`\n  ${b.id}: ${e.message}`);
    }
    if (++n % 10 === 0) { save(); process.stdout.write(`  gutenberg ${n}/${todoG.length}\r`); }
    await sleep(1050);
  }
  save();
  console.log(`\nol-cache.json: ${Object.keys(cache.works).length} works, ${Object.keys(cache.authors).length} authors, ${Object.keys(cache.gut).length} gutenberg matches`);
}
