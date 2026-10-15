#!/usr/bin/env node
/**
 * Fetch a small shelf of public-domain full texts from Project Gutenberg for
 * the reading prototypes (concept search across whole books, multi-resolution
 * reading). Strips the Project Gutenberg header and footer and writes
 * public/prototypes/data/texts/<id>.txt plus an index.json.
 *
 *   node scripts/fetch-texts.mjs
 *
 * The shelf is chosen around one question the prototypes can demo end to end:
 * what is probability, and how do we reason under uncertainty?
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(APP, 'public/prototypes/data/texts');

const SHELF = [
  { id: 58881, t: 'A Philosophical Essay on Probabilities', a: 'Pierre-Simon Laplace', y: 1814 },
  { id: 57359, t: 'The Logic of Chance (3rd ed.)', a: 'John Venn', y: 1888 },
  { id: 65274, t: 'Chance, Love, and Logic', a: 'Charles Sanders Peirce', y: 1923 },
  { id: 74864, t: 'The Principles of Science', a: 'William Stanley Jevons', y: 1874 },
  { id: 39713, t: 'The Foundations of Science', a: 'Henri Poincaré', y: 1913 },
  { id: 5827, t: 'The Problems of Philosophy', a: 'Bertrand Russell', y: 1912 },
  { id: 9662, t: 'An Enquiry Concerning Human Understanding', a: 'David Hume', y: 1748 },
  { id: 34901, t: 'On Liberty', a: 'John Stuart Mill', y: 1859 },
  { id: 1228, t: 'On the Origin of Species (1st ed.)', a: 'Charles Darwin', y: 1859 },
];

function strip(text) {
  const start = text.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n/i);
  const end = text.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
  let body = text.slice(start >= 0 ? text.indexOf('\n', start) + 1 : 0, end >= 0 ? end : undefined);
  return body.replace(/\r\n/g, '\n').trim() + '\n';
}

mkdirSync(OUT, { recursive: true });
const index = [];
for (const b of SHELF) {
  const res = await fetch(`https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`);
  if (!res.ok) { console.warn(`HTTP ${res.status} for ${b.id}`); continue; }
  const body = strip(await res.text());
  writeFileSync(join(OUT, `${b.id}.txt`), body);
  index.push({ ...b, file: `texts/${b.id}.txt`, chars: body.length, words: body.split(/\s+/).length });
  console.log(`${b.id} ${b.t}: ${body.length} chars`);
  await new Promise((r) => setTimeout(r, 1500));
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify({
  source: 'Project Gutenberg (public domain in the US), https://www.gutenberg.org/',
  fetched: new Date().toISOString().slice(0, 10),
  books: index,
}, null, 1));
