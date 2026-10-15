#!/usr/bin/env node
/**
 * Sieve — precompute the pile names for the first two sievings.
 *
 *   node scripts/prototypes/sieve.mjs --dump     # print the 9 + 81 piles (terms, LC classes, typical titles)
 *   node scripts/prototypes/sieve.mjs            # validate the authored names and write sieve.json
 *
 * The page (prototypes/sieve.html) clusters ../catalog.json in the browser: TF-IDF over subject
 * headings, titles and LC class letters, spherical k-means with k = 9, seeded from a hash of the
 * gathered set. This script runs the page's own clustering code (the <script id="sieve-worker">
 * block, extracted verbatim) in Node, so the piles here are byte-for-byte the piles the page
 * computes: level 0 (the whole catalog) and level 1 (each of the nine piles gathered on its own).
 * Each pile is identified by a hash of its sorted member ids, which is how the page looks up a
 * precomputed name.
 *
 * Names and one-line descriptions for those 90 piles were written by Claude (October 2026) from
 * the --dump output and are kept in scripts/prototypes/sieve-labels.json, keyed by pile hash.
 * This script checks that every authored hash still matches a pile (it warns and drops stale ones,
 * e.g. after a change to the clustering code or the catalog), and writes
 * public/prototypes/data/sieve/sieve.json: the names with their provenance, plus LC class and
 * subclass names from ../lcc-outline.json for the page's tooltips and prompts.
 *
 * No network access. Deterministic.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(APP, 'public/prototypes/data');
const html = readFileSync(join(APP, 'prototypes/sieve.html'), 'utf8');
const m = /<script type="text\/plain" id="sieve-worker">([\s\S]*?)<\/script>/.exec(html);
if (!m) throw new Error('sieve.html: no <script id="sieve-worker"> block');
const SIEVE = new Function(m[1] + '\nreturn SIEVE;')();

const W = JSON.parse(readFileSync(join(DATA, 'catalog.json'), 'utf8')).works;
SIEVE.init(W.map((w) => ({ t: w.t, st: w.st, s: w.s, lcc: w.lcc })));
const lcc = JSON.parse(readFileSync(join(DATA, 'lcc-outline.json'), 'utf8'));
const lcNames = { ...lcc.classes, ...lcc.subclasses };

function surname(w) {
  const a = (w.a && w.a[0]) || '';
  if (!a) return 'anon.';
  if (a.includes(',')) return a.split(',')[0].trim();
  const parts = a.replace(/\(.*?\)/g, '').trim().split(/\s+/);
  return parts[parts.length - 1].replace(/[.,]$/, '');
}
function brief(p, i) {
  const n = p.ids.length;
  const terms = p.terms.slice(0, 8).map((t) => `${t.t} (${Math.round(t.f * 100)}%)`).join(', ');
  const lc = p.lc.slice(0, 3).map(([c, k]) => `${c} ${lcNames[c] || ''} ${Math.round((100 * k) / n)}%`).join('; ');
  const pool = p.ids.slice(0, Math.max(12, Math.min(60, Math.ceil(n * 0.3))));
  const byRl = [...pool].sort((a, b) => (W[b].rl || 0) - (W[a].rl || 0)).slice(0, 6);
  const central = p.ids.slice(0, 6).filter((id) => !byRl.includes(id));
  const titles = [...byRl, ...central].map((id) => `${W[id].t}${W[id].st ? ': ' + W[id].st : ''} (${surname(W[id])}, ${W[id].y || 'n.d.'})`.slice(0, 120));
  return `  [${i + 1}] ${p.h}  n=${n}\n      terms: ${terms}\n      LC: ${lc}\n      titles: ${titles.join(' | ')}`;
}

const all = W.map((_, i) => i);
const L0 = SIEVE.scatter(all);
const tree = [{ path: '', res: L0 }];
L0.piles.forEach((p, i) => tree.push({ path: `${i + 1}`, res: SIEVE.scatter(p.ids) }));

if (process.argv.includes('--dump')) {
  for (const node of tree) {
    console.log(`\n=== ${node.path ? 'Gather pile ' + node.path : 'Whole catalog'}  (${node.res.n} works, ${node.res.ms} ms)`);
    node.res.piles.forEach((p, i) => console.log(brief(p, i)));
  }
  process.exit(0);
}

const authored = JSON.parse(readFileSync(join(APP, 'scripts/prototypes/sieve-labels.json'), 'utf8'));
const live = new Map();
for (const node of tree) node.res.piles.forEach((p, i) => live.set(p.h, `${node.path ? node.path + '>' : ''}${i + 1}`));
const labels = {};
let stale = 0;
for (const [h, v] of Object.entries(authored.labels)) {
  if (!live.has(h)) { console.warn(`stale label ${h} (${v.path}: ${v.name}) — no pile has this hash any more`); stale++; continue; }
  if (typeof v.name !== 'string' || !v.name.trim()) throw new Error(`label ${h} has no name`);
  labels[h] = { path: live.get(h), name: v.name.trim(), line: (v.line || '').trim() };
}
const missing = [...live.keys()].filter((h) => !labels[h]);
if (missing.length) console.warn(`${missing.length} pile(s) without a precomputed name: ${missing.map((h) => live.get(h)).join(', ')}`);

const out = {
  source: 'Pile names for the first two sievings of prototypes/sieve.html; LC names from lcc-outline.json',
  provenance: authored.provenance,
  generated_by: 'scripts/prototypes/sieve.mjs',
  clustering: 'TF-IDF (subjects, titles, LC class letters) + spherical k-means, k = 9, k-means++ seeded by a hash of the gathered set',
  labels,
  lc: lcNames,
};
mkdirSync(join(DATA, 'sieve'), { recursive: true });
writeFileSync(join(DATA, 'sieve/sieve.json'), JSON.stringify(out));
console.log(`sieve.json: ${Object.keys(labels).length} names (${stale} stale dropped, ${missing.length} missing), ${Object.keys(lcNames).length} LC names`);
