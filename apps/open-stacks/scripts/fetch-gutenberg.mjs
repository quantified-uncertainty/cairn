#!/usr/bin/env node
/**
 * Build the public-domain shelf from Project Gutenberg's catalog feed.
 *
 *   node scripts/fetch-gutenberg.mjs [path/to/pg_catalog.csv]
 *
 * Downloads https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz (or
 * reads a local copy), keeps English texts outside the fiction and juvenile
 * classes (LoCC P*, which is most of Gutenberg and would swamp everything
 * else), and writes public/prototypes/data/gutenberg.json sorted by call class.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(APP, 'public/prototypes/data/gutenberg.json');

async function load() {
  const local = process.argv[2];
  if (local) return readFileSync(local, 'utf-8');
  const res = await fetch('https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf-8');
}

/** Minimal RFC 4180 parser: quoted fields may contain commas, quotes ("") and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const shortAuthor = (s) =>
  s.split(';').map((a) => a.trim().replace(/,\s*\d{3,4}\??-\d{0,4}\??.*$/, '').replace(/\s*\[.*?\]/g, ''))
    .filter(Boolean).slice(0, 2);

const rows = parseCsv(await load());
const header = rows.shift();
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const books = [];
for (const r of rows) {
  if (r[col.Type] !== 'Text' || r[col.Language] !== 'en') continue;
  const locc = (r[col.LoCC] || '').split(';').map((x) => x.trim()).filter(Boolean);
  if (!locc.length || locc.every((c) => c.startsWith('P'))) continue;
  books.push({
    id: Number(r[col['Text#']]),
    t: r[col.Title].replace(/\s+/g, ' ').trim(),
    a: shortAuthor(r[col.Authors] || ''),
    y: (r[col.Issued] || '').slice(0, 4),
    c: locc[0],
    s: (r[col.Subjects] || '').split(';').map((x) => x.trim()).filter(Boolean).slice(0, 4),
    b: (r[col.Bookshelves] || '').split(';').map((x) => x.trim().replace(/^Category: /, ''))
      .filter(Boolean).slice(0, 4),
  });
}
books.sort((x, y) => (x.c < y.c ? -1 : x.c > y.c ? 1 : x.t.localeCompare(y.t)));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  source: 'Project Gutenberg catalog feed, https://www.gutenberg.org/cache/epub/feeds/',
  note: 'English texts, fiction/literature classes (LoCC P*) excluded. y = year added to Gutenberg, not year written.',
  fetched: new Date().toISOString().slice(0, 10),
  fields: { id: 'Gutenberg ebook number', t: 'title', a: 'authors', y: 'year added', c: 'LoC class', s: 'subjects', b: 'bookshelves' },
  books,
}));
console.log(`Wrote ${books.length} books to ${OUT}`);
