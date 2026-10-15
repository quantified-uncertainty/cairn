#!/usr/bin/env node
/**
 * Build the prototypes' paper set from the arXiv API (metadata is CC0).
 *
 *   node scripts/fetch-arxiv.mjs     # writes public/prototypes/data/papers.json
 *
 * One query per theme, sorted by relevance, with the 3-second pause between
 * calls that arXiv's API terms ask for.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(APP, 'public/prototypes/data/papers.json');

const THEMES = [
  ['forecasting', 'abs:forecasting AND (abs:"language model" OR abs:LLM OR abs:"prediction market" OR abs:superforecast*)'],
  ['scoring-rules', 'abs:"scoring rule" OR abs:"proper scoring" OR ti:calibration AND cat:stat.*'],
  ['uncertainty', 'abs:"uncertainty quantification" AND (cat:cs.LG OR cat:stat.ML)'],
  ['ai-evaluation', 'abs:"LLM-as-a-judge" OR abs:"LLM as a judge" OR ti:"evaluating large language models"'],
  ['alignment', 'abs:"AI alignment" OR ti:"scalable oversight" OR ti:"reward hacking"'],
  ['scholarly-search', 'abs:"scientific literature" AND (abs:retrieval OR abs:"literature review") AND abs:"language model"'],
  ['science-mapping', 'abs:"science mapping" OR abs:"citation network" AND abs:visualization'],
  ['reading-interfaces', 'abs:"reading interface" OR abs:"scholarly reading" OR ti:"skimming"'],
  ['summarization', 'abs:"book-length" AND abs:summarization'],
  ['decision-theory', 'abs:"decision theory" AND (cat:cs.AI OR cat:econ.TH OR cat:stat.ME)'],
];
const PER_THEME = 200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unxml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const clean = (s) => unxml(s).replace(/\s+/g, ' ').trim();

const papers = new Map();
for (const [theme, q] of THEMES) {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(q)}&start=0&max_results=${PER_THEME}&sortBy=relevance`;
  let xml = null;
  for (let i = 0; i < 4 && !xml; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) xml = await res.text();
      else console.warn(`HTTP ${res.status} for ${theme}`);
    } catch (e) { console.warn(e.message); }
    if (!xml) await sleep(5000 * 2 ** i);
  }
  await sleep(3500);
  if (!xml) continue;
  const entries = xml.split('<entry>').slice(1);
  for (const e of entries) {
    const pick = (tag) => (e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || '';
    const id = pick('id').replace('http://arxiv.org/abs/', '').replace(/v\d+$/, '');
    if (!id) continue;
    if (papers.has(id)) { papers.get(id).th.push(theme); continue; }
    papers.set(id, {
      id,
      t: clean(pick('title')),
      a: [...e.matchAll(/<name>([^<]+)<\/name>/g)].map((m) => clean(m[1])).slice(0, 6),
      y: pick('published').slice(0, 10),
      c: (e.match(/<arxiv:primary_category[^>]*term="([^"]+)"/) || [])[1] || '',
      ab: clean(pick('summary')),
      th: [theme],
    });
  }
  console.log(`${theme}: ${entries.length} entries, ${papers.size} unique`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  source: 'arXiv API (metadata CC0), https://info.arxiv.org/help/api/',
  fetched: new Date().toISOString().slice(0, 10),
  fields: { id: 'arXiv id', t: 'title', a: 'authors', y: 'first version date', c: 'primary category', ab: 'abstract', th: 'themes' },
  papers: [...papers.values()],
}));
console.log(`Wrote ${papers.size} papers to ${OUT}`);
