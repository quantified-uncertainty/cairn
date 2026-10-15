#!/usr/bin/env node
/**
 * Build corpus.json for the Stacks Browser: a few thousand items that can be
 * opened instantly because they are open and their pages are fetchable.
 *
 *   node build-corpus.mjs            # writes ./corpus.json
 *
 * Three kinds of item:
 *   scan  Internet Archive public-domain scans (page images, pre-1929, English)
 *   pdf   arXiv papers and author-hosted free textbooks (rendered with pdf.js)
 *   text  Project Gutenberg plain text (paginated in the browser)
 *
 * Sources: Internet Archive advanced search API, the Open Stacks datasets in
 * ../public/prototypes/data/ (arXiv metadata, Gutenberg catalogue), and a short
 * hand-checked list of free textbooks from the Open-Access Books chapter.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '../public/prototypes/data');
const UA = 'OpenStacksBrowser/0.1 (https://github.com/quantified-uncertainty/cairn)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Subject queries for public-domain scans: the technical and odd corners of a
// research library, which is the browsing experience we are after.
const SCAN_SUBJECTS = [
  'probabilities', 'mathematics', 'statistics', 'calculus', 'geometry', 'algebra', 'mechanics',
  'physics', 'astronomy', 'logic', 'philosophy', 'political economy', 'economics', 'insurance',
  'engineering', 'electricity', 'chemistry', 'navigation', 'surveying', 'machinery', 'cryptography',
  'psychology', 'evolution', 'natural history', 'mathematical recreations', 'slide rule', 'telegraph',
];
const PER_SUBJECT = 160;

const FREE_TEXTBOOKS = [
  ['Information Theory, Inference, and Learning Algorithms', 'David MacKay', 2003, 'https://www.inference.org.uk/itprnn/book.pdf'],
  ['Pattern Recognition and Machine Learning', 'Christopher Bishop', 2006, 'https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf'],
  ['Convex Optimization', 'Stephen Boyd, Lieven Vandenberghe', 2004, 'https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf'],
  ['Reinforcement Learning: An Introduction (2nd ed.)', 'Richard Sutton, Andrew Barto', 2018, 'http://incompleteideas.net/book/RLbook2020.pdf'],
  ['Algorithms', 'Jeff Erickson', 2019, 'https://jeffe.cs.illinois.edu/teaching/algorithms/book/Algorithms-JeffE.pdf'],
  ['Mathematics for Machine Learning', 'Deisenroth, Faisal, Ong', 2020, 'https://mml-book.github.io/book/mml-book.pdf'],
  ['Understanding Deep Learning', 'Simon Prince', 2023, 'https://github.com/udlbook/udlbook/releases/download/v5.0.2/UnderstandingDeepLearning_08_28_24_C.pdf'],
  ['Introduction to Probability (2nd ed.)', 'Joseph Blitzstein, Jessica Hwang', 2019, 'https://drive.google.com/uc?export=download&id=1VmkAAGOYCTORq1wxSQqy255qLJjTNvBI'],
];

async function getJson(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) return await r.json();
      console.warn(`HTTP ${r.status} ${url}`);
    } catch (e) { console.warn(e.message); }
    await sleep(2000 * 2 ** i);
  }
  return null;
}

const items = [];
const seen = new Set();
const add = (it) => { if (!seen.has(it.id)) { seen.add(it.id); items.push(it); } };
const one = (v) => (Array.isArray(v) ? v[0] : v) || '';

// 1. Internet Archive public-domain scans.
for (const subject of SCAN_SUBJECTS) {
  const q = `mediatype:texts AND subject:("${subject}") AND year:[1700 TO 1928] AND language:(eng OR English) AND imagecount:[40 TO 1500] AND -collection:ericarchive AND -collection:microfilm`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=imagecount&fl[]=subject&fl[]=downloads&sort[]=downloads+desc&rows=${PER_SUBJECT}&output=json`;
  const d = await getJson(url);
  await sleep(1000);
  for (const x of d?.response?.docs || []) {
    add({
      id: `ia:${x.identifier}`, kind: 'scan', src: 'Internet Archive',
      t: String(one(x.title)).replace(/\s*\[microform\]/i, '').slice(0, 200),
      a: String(one(x.creator)).replace(/,\s*\d{4}-?\d{0,4}\.?$/, '').slice(0, 80),
      y: Number(String(x.year).slice(0, 4)) || null,
      s: [].concat(x.subject || []).slice(0, 5),
      n: x.imagecount, ia: x.identifier, pop: x.downloads || 0, q: subject,
    });
  }
  console.log(`scans/${subject}: ${d?.response?.docs?.length ?? 0} (total ${items.length})`);
}

// 2. arXiv papers (metadata already fetched for the prototypes).
const papers = JSON.parse(readFileSync(join(DATA, 'papers.json'), 'utf-8')).papers;
for (const p of papers) {
  add({
    id: `arxiv:${p.id}`, kind: 'pdf', src: 'arXiv', t: p.t, a: p.a.slice(0, 3).join(', '),
    y: Number(p.y.slice(0, 4)), s: p.th, url: `https://arxiv.org/pdf/${p.id}`,
    html: `https://arxiv.org/html/${p.id}`, ab: p.ab.slice(0, 600), q: p.th[0],
  });
}

// 3. Free textbooks (author or publisher hosted).
for (const [t, a, y, url] of FREE_TEXTBOOKS) {
  add({ id: `book:${t}`, kind: 'pdf', src: 'Author-hosted', t, a, y, s: ['textbook'], url, q: 'textbook' });
}

// 4. Project Gutenberg nonfiction in technical and philosophical classes.
const pg = JSON.parse(readFileSync(join(DATA, 'gutenberg.json'), 'utf-8')).books;
// Exact LC classes: science, mathematics, logic, philosophy of mind, economics, technology.
const PG_CLASSES = /^(Q|QA|QB|QC|QD|QE|QH|QK|QL|QM|QP|B|BC|BD|BF|BH|BJ|HA|HB|HC|HD|HF|HG|HM|T|TA|TC|TJ|TK|TL|TN|TP|TS|TT|U|Z)$/;
const outline = JSON.parse(readFileSync(join(DATA, 'lcc-outline.json'), 'utf-8')).subclasses;
for (const b of pg) {
  const cls = (b.c || '').replace(/[^A-Z].*$/, '');
  if (!PG_CLASSES.test(cls)) continue;
  add({
    id: `pg:${b.id}`, kind: 'text', src: 'Project Gutenberg', t: b.t.slice(0, 200), a: (b.a[0] || '').replace(/,\s*\d.*$/, ''),
    y: null, s: b.s.slice(0, 4), c: cls, url: `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`, q: (outline[cls] || cls).toLowerCase(),
  });
}

writeFileSync(join(HERE, 'corpus.json'), JSON.stringify({
  built: new Date().toISOString().slice(0, 10),
  counts: items.reduce((m, x) => ((m[x.src] = (m[x.src] || 0) + 1), m), {}),
  items,
}));
console.log(`Wrote ${items.length} items`);
