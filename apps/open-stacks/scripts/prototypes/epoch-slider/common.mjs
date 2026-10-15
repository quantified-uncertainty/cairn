// Shared loading, topic selection and author-date helpers for the Epoch Slider
// data build (see ../epoch-slider.mjs for the full description).

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const APP = join(HERE, '../../..');
export const DATA = join(APP, 'public/prototypes/data');
export const OUTDIR = join(DATA, 'epoch-slider');
export const UA = 'OpenStacksPrototypes/0.1 (https://github.com/quantified-uncertainty/cairn)';
export const CACHE_DIR = process.env.EPOCH_CACHE || '/tmp/epoch-slider-cache';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const readJson = (p) => JSON.parse(readFileSync(p, 'utf-8'));

export function loadBase() {
  return {
    catalog: readJson(join(DATA, 'catalog.json')).works,
    gut: readJson(join(DATA, 'gutenberg.json')).books,
    papers: readJson(join(DATA, 'papers.json')).papers,
    texts: readJson(join(DATA, 'texts/index.json')).books,
  };
}

// ---------- Gutenberg catalog CSV (author life dates) ----------
export async function loadPgCatalog(localPath) {
  let text;
  const cached = join(CACHE_DIR, 'pg_catalog.csv');
  if (localPath && existsSync(localPath)) text = readFileSync(localPath, 'utf-8');
  else if (existsSync(cached)) text = readFileSync(cached, 'utf-8');
  else {
    const res = await fetch('https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz', { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`pg_catalog HTTP ${res.status}`);
    text = gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf-8');
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cached, text);
  }
  const rows = parseCsv(text);
  const header = rows.shift();
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const meta = new Map();
  for (const r of rows) {
    const id = Number(r[col['Text#']]);
    if (Number.isFinite(id)) meta.set(id, { authors: r[col.Authors] || '', title: r[col.Title] || '' });
  }
  return meta;
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function yv(s) {
  if (!s) return null;
  const bce = /BCE/.test(s);
  const v = Number(s.replace(/[^\d]/g, ''));
  if (!s.replace(/[^\d]/g, '') || !Number.isFinite(v)) return null;
  return bce ? -v : v;
}

/** First credited (non-translator/editor) author with life dates, from a pg_catalog Authors cell. */
export function pgAuthorDates(authorsCell) {
  const parts = (authorsCell || '').split(';').map((s) => s.trim()).filter(Boolean);
  const main = parts.filter((p) => !p.includes('['));
  for (const p of main) {
    const m = p.match(/,\s*((?:\d{1,4}\??(?:\s*BCE)?)?)\s*-\s*((?:\d{1,4}\??(?:\s*BCE)?)?)\s*$/);
    if (m && (m[1] || m[2])) return { name: p.replace(/,\s*[^,]*\d[^,]*$/, ''), b: yv(m[1]), d: yv(m[2]), credited: true };
  }
  return main.length ? { name: main[0], b: null, d: null, credited: true } : null;
}

// ---------- topic selection ----------
// A work "touches" a question when its Open Library subject-query tags, title or
// subject headings match the question's topic vocabulary. Gutenberg books match on
// subject headings or titles; noisy headings (spiritualism, success manuals...) and
// the religion classes are excluded. arXiv papers match on the theme tags assigned
// in papers.json plus a keyword test on title and abstract.

const RELIGION = /^(BL|BM|BP|BQ|BR|BS|BT|BV|BX)/;
const NOISE = /Spiritualism|Telepathy|New Thought|Occult|Phrenology|Clairvoyance|Hypnotism|Mental suggestion|Success|Conduct of life|Psychical|Mental healing|Fortune|Astrology|Juvenile|Periodicals|Census|Immortality|Psychoanalysis|Precognition|Witchcraft|Linux|Operating systems|Microcomputers|TRS-80|hackers|Humor|Machine-shop|Lathe|Sewing|Machine design|Mechanical movements|Electric apparatus|Induction coils/i;

export const QUESTIONS = [
  {
    id: 'rare',
    q: 'How should we reason about the probability of a rare event?',
    short: 'rare events',
    catTags: ['probabilities', 'risk assessment', 'risk management', 'forecasting', 'statistical decision', 'bayesian statistical decision theory', 'mathematical statistics', 'decision making', 'judgment', 'technological forecasting', 'behavioral economics'],
    catRe: /probabilit|\bchances?\b|\brisks?\b|uncertain|rare event|extreme value|catastroph|disaster|black swan|insurance|actuar|forecast|predict|induction \(logic\)|miracle|bayes|statistical inference|\bodds\b|lotter|gambl/i,
    gutSubj: /Probabilit|\bChance\b|Insurance|\bRisk|Annuit|\bMortality|Lotter|Gambling|Induction \(Logic\)|Errors, Theory of|Least squares|Uncertainty|Belief and doubt|Forecast|Miracles|Science -- Methodology|^(?=.*\b(?:Mathematical|Vital|Medical) statistics)/i,
    gutTitle: /probabilit|\bchances?\b|\brisks?\b|insurance|annuit|uncertain|forecast|lotter|miracle/i,
    gutClasses: /^(B|BC|BD|BF|BJ|H|HA|HB|HC|HD|HF|HG|HJ|HM|HN|HV|Q|QA|QB|QC|R|RA|T|TA)$/,
    paperThemes: ['forecasting', 'uncertainty', 'scoring-rules', 'decision-theory'],
    paperRe: /rare|tail|extreme|low[- ]probability|catastroph|black swan|\brisk|calibrat|probabilit|uncertain|forecast/i,
    // Works shelved in by name: the local full texts that bear on the question.
    pinned: ['g:9662', 'g:5827', 'g:65274', 'g:74864', 'g:39713', 'g:58881', 'g:57359'],
  },
  {
    id: 'machines',
    q: 'Can machines reason?',
    short: 'machine reasoning',
    catTags: ['artificial intelligence', 'philosophy of mind', 'reasoning', 'logic', 'neural networks (computer science)', 'machine learning', 'cognitive psychology'],
    catRe: /artificial intelligence|thinking machine|machine theory|automat|cybernet|robot|calculating machine|computing machinery|machine intelligence|neural net|cognitive science|logic machine|reasoning|machine learning/i,
    gutSubj: /\bLogic\b|Reasoning|Thought and thinking|Machine theory|Automat|Robots|Calculat|Computers|Artificial intelligence|Cybernetics|Mind and body|Intellect|Cognition|Difference engines|Analytical engine/i,
    gutTitle: /thinking machine|machines that think|automat|calculating|analytical engine|reasoning|\blogic\b|man a machine/i,
    gutClasses: /^(AC|B|BC|BD|BF|BJ|Q|QA|QP|T|TJ|TK)$/,
    paperThemes: ['ai-evaluation', 'alignment'],
    paperRe: /reason|logic|chain[- ]of[- ]thought|deduct|inference|planning|mathematic/i,
    pinned: ['g:74864', 'g:5827', 'g:39713', 'g:9662', 'g:3207', 'g:59', 'g:75107', 'g:52090', 'g:18269', 'g:57532'],
  },
];

export function catHay(w) {
  return [w.t || '', w.st || '', (w.s || []).join(' ; '), w.fs || ''].join(' | ');
}

export function catMatches(Q, w) {
  if ((w.q || []).some((t) => Q.catTags.includes(t))) return true;
  return Q.catRe.test([w.t || '', w.st || '', (w.s || []).join(' ; ')].join(' | '));
}

export function gutMatches(Q, b) {
  const c = b.c || '';
  if (RELIGION.test(c)) return false;
  const subj = (b.s || []).join(' ; ');
  if (NOISE.test(subj) || NOISE.test(b.t)) return false;
  if (!Q.gutClasses.test(c)) return false;
  return Q.gutSubj.test(subj) || Q.gutTitle.test(b.t);
}

export function paperMatches(Q, p) {
  if (!(p.th || []).some((t) => Q.paperThemes.includes(t))) return false;
  return Q.paperRe.test(p.t + ' ' + p.ab);
}
