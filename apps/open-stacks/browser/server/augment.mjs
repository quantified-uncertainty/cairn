// Reading guides: the augmentation layer of a compiled document
// (docs/profiles/spec.md, section 8).
//
// One model call per item writes a skim path, skip ranges, a section map with
// one-line summaries, a glossary, margin notes anchored to verbatim quotes,
// explanations of the figures the analysis found, display hints, a hook and
// tags. It complements the summary (routes/30-summarize.mjs), whose gist and
// key points it is shown, and the feeds' highlights (data/highlights.json),
// whose passages it is offered as candidate stops; it repeats neither.
//
// Every quote is checked against the text the model saw, with the summaries'
// skel() matching. A note whose quote is not found is thrown away; other
// unverified quotes are removed. Pages are 0-based `k` in the stored form; the
// model answers with the 1-based [p. N] markers. Stored in
// CACHE/augment/<sha1(id|model)>.json and never evicted (they cost money and
// are about 10 KB). The call goes through app.ai (30-summarize.mjs): same
// streaming, mock mode and daily budget as summaries.
//
// Used by server/routes/91-augment.mjs (HTTP) and augment-batch.mjs (CLI).
// Profiles (server/profile.mjs, ui/js/profile-core.js) are optional: without
// one there are no figures, no table of contents and no analysis hints.
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { execFile } from 'child_process';
import { HERE, CACHE, MODEL, PORT } from './config.mjs';
import { skel, indexText, findQuote, familyOf, parsePartial, PRICES } from './routes/30-summarize.mjs';
import { loadCorpus } from './routes/60-warm.mjs';

/** Bump with any change to AUG_PROMPT or the output schema: older augmentations are then served with stale: true. */
export const PROMPT = 1;
export const SCHEMA = 1;
export const AUG_CHARS = Math.max(20000, Number(process.env.STACKS_AUG_CHARS) || 90000);
export const DIR = join(CACHE, 'augment');
export const BATCH_DIR = join(DIR, 'batches');
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
export const augPath = (id, model) => join(DIR, sha1(id + '|' + model) + '.json');
/** Batch custom ids allow only [A-Za-z0-9_-]; item ids contain ':' and '.'. */
export const customId = (id, model) => 'a' + sha1(id + '|' + model).slice(0, 40);
const readJson = (f, d = null) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return d; } };
function writeAtomic(f, data) { const t = f + '.' + process.pid + '.tmp'; writeFileSync(t, data); renameSync(t, f); }

// ---- display hint codes: from profile-core.js when it is there, else the ten of spec section 4 ----
const FALLBACK_HINTS = ['one-up', 'two-up', 'three-up', 'split-columns', 'facing-pages', 'skip-front', 'landscape', 'zoom-figures', 'sequential', 'ocr-poor'];
let HINT_CODES = FALLBACK_HINTS;
try {
  const core = await import('../ui/js/profile-core.js');
  const H = core.HINTS;
  const codes = Array.isArray(H) ? H.map((x) => (typeof x === 'string' ? x : x?.code)).filter(Boolean) : H && typeof H === 'object' ? Object.keys(H) : [];
  if (codes.length) HINT_CODES = [...new Set(codes)];
} catch { /* not built yet */ }
export const hintCodes = () => HINT_CODES;

// ---- profiles (optional) ----
let profMod, profTried = 0;
async function profileApi() {
  if (profMod) return profMod;
  if (Date.now() - profTried < 60e3) return null;
  profTried = Date.now();
  try { profMod = await import('./profile.mjs'); } catch { profMod = null; }
  return profMod;
}
/** The item's profile (schema 1), or null. */
export async function profileFor(id) {
  const m = await profileApi();
  try { const p = await m?.readProfile?.(id); return p && p.schema === 1 ? p : null; } catch { return null; }
}
async function profileText(id) {
  const m = await profileApi();
  try { const f = await m?.profileTextPath?.(id); return f && existsSync(f) ? readFileSync(f, 'utf-8') : null; } catch { return null; }
}
/** Figures the analysis found, with the ids augmentations use ("<k>.<j>"). */
export function figureList(P) {
  return (P?.pages || []).flatMap((pg, idx) => (Array.isArray(pg?.fig) ? pg.fig : []).map((f, j) => ({ fid: `${pg.k ?? idx}.${j}`, k: pg.k ?? idx, lab: f?.lab, cap: f?.cap, kind: f?.kind })));
}

// ---- corpus ----
let corpus = { mtime: -1, list: [], byId: new Map() };
export function corpusItems() {
  let mt = 0; try { mt = statSync(join(HERE, 'corpus.json')).mtimeMs; } catch { /* missing */ }
  if (mt !== corpus.mtime) {
    let list = []; try { list = loadCorpus(); } catch { /* unreadable */ }
    corpus = { mtime: mt, list, byId: new Map(list.map((it) => [it.id, it])) };
  }
  return corpus;
}
export const itemOf = (id) => corpusItems().byId.get(id) || null;

// ---- text: [p. N] markers, N = k + 1 ----
/** Split marked text into pages [{p, t}] (1-based p). Text before the first marker counts as page 1. */
export function pagesOf(text) {
  const out = []; const re = /\[p\. (\d+)\][ \t]?/g;
  let m, last = 0, cur = null;
  while ((m = re.exec(text))) {
    const before = text.slice(last, m.index).trim();
    if (cur) cur.t = before; else if (before) out.push({ p: 1, t: before });
    cur = { p: Number(m[1]), t: '' }; out.push(cur); last = re.lastIndex;
  }
  const rest = text.slice(last).trim();
  if (cur) cur.t = rest; else if (rest) out.push({ p: 1, t: rest });
  return out;
}
const joinPages = (pages) => pages.map((x) => `[p. ${x.p}] ${x.t}`).join('\n');
/** Indices 0..n-1 in an evenly spreading order (bit-reversal), for sampling pages. */
function evenOrder(n) {
  let bits = 0; while ((1 << bits) < n) bits++;
  const out = [];
  for (let i = 0; i < (1 << bits); i++) {
    let r = 0; for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b);
    if (r < n) out.push(r);
  }
  return out;
}
/** Cap the text at `max` characters (section 8.2): the first 30,000 characters, then each later
 *  page's first characters (its headings), then evenly spaced whole pages. */
export function capText(text, max = AUG_CHARS) {
  text = String(text || '');
  if (text.length <= max) return { text, coverage: 1 };
  const pages = pagesOf(text);
  const total = pages.reduce((a, x) => a + x.t.length, 0) || 1;
  const HEAD = Math.min(30000, Math.floor(max / 3));
  const out = pages.map((x) => ({ p: x.p, t: '' }));
  const MK = 10; // "[p. 123] " and the newline
  let used = 0, j = 0;
  for (; j < pages.length && used < HEAD; j++) { out[j].t = pages[j].t.slice(0, Math.max(0, HEAD - used)); used += out[j].t.length + MK; }
  const later = []; for (let q = j; q < pages.length; q++) later.push(q);
  const room = max - used;
  if (later.length && room > 0) {
    let per = Math.min(600, Math.floor((room * 0.6) / later.length) - MK);
    let pick = later;
    if (per < 120) { per = 120; const cnt = Math.max(1, Math.floor((room * 0.6) / (per + MK))); pick = evenOrder(later.length).slice(0, cnt).sort((a, b) => a - b).map((x) => later[x]); }
    for (const q of pick) { out[q].t = pages[q].t.slice(0, per); used += out[q].t.length + MK; }
    let left = max - used;
    for (const x of evenOrder(later.length)) {
      const q = later[x]; const extra = pages[q].t.length - out[q].t.length + (out[q].t ? 0 : MK);
      if (extra <= 0 || extra > left) continue;
      out[q].t = pages[q].t; left -= extra;
    }
  }
  const kept = out.filter((x) => x.t);
  const sent = kept.reduce((a, x) => a + x.t.length, 0);
  return { text: joinPages(kept).slice(0, max), coverage: +Math.min(1, sent / total).toFixed(3) };
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', minus: '−', times: '×' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m));
/** Posts and web pages: tags stripped, blocks grouped into ~280-word pages as prepareFlow() does (pages are hints; quotes anchor). */
export function htmlPages(html, words = 280) {
  let s = String(html).replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|button)\b[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<\/(p|li|h[1-6]|pre|blockquote|tr|dt|dd|figcaption|div|section|article|table|ul|ol)>|<br\s*\/?>|<(p|li|h[1-6]|tr|dt|dd)\b[^>]*>/gi, '\n');
  const blocks = decode(s.replace(/<[^>]+>/g, ' ')).split(/\n+/).map((b) => b.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return groupBlocks(blocks, words);
}
function groupBlocks(blocks, words = 280) {
  const pages = ['']; let n = 0;
  for (const b of blocks) {
    const w = b.split(' ').length;
    if (n >= words) { pages.push(''); n = 0; }
    pages[pages.length - 1] += (pages[pages.length - 1] ? '\n' : '') + b; n += w;
  }
  return pages.filter(Boolean);
}
function plainPages(txt) {
  let t = String(txt).replace(/\r\n/g, '\n');
  const a = t.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i);
  if (a >= 0) t = t.slice(t.indexOf('\n', a) + 1);
  const e = t.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i);
  if (e >= 0) t = t.slice(0, e);
  return groupBlocks(t.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean));
}

let pdftotext = null;
const hasPdftotext = () => (pdftotext ||= new Promise((r) => execFile('pdftotext', ['-v'], { timeout: 5000 }, (e) => r(!e || e.code !== 'ENOENT'))));
const run = (cmd, args, opts = {}) => new Promise((res, rej) => execFile(cmd, args, { maxBuffer: 64 << 20, timeout: 60000, ...opts }, (e, out) => (e ? rej(e) : res(out))));

/**
 * The model's text, in the order of section 8.2: what the client sent, the
 * profile's text.txt, pdftotext on the cached PDF, the scan's OCR, the cached
 * post or page with its tags stripped. Throws {code: 'no_text'}.
 * ctx: { cache (server/cache.mjs), port (this server, for /ocr/text) }.
 */
export async function textFor(b, it, ctx) {
  if (typeof b.text === 'string' && b.text.replace(/\s+/g, '').length >= 200) return { text: b.text, src: 'client' };
  const pt = await profileText(it.id);
  if (pt && pt.replace(/\s+/g, '').length >= 200) return { text: pt, src: 'profile' };
  const { cache } = ctx;
  try {
    if (it.kind === 'pdf' && it.url && cache?.cached(it.url) && await hasPdftotext()) {
      // Reading order (no -layout): two-column papers come out a column at a time, so sentences stay whole for the quotes.
      const out = await run('pdftotext', ['-enc', 'UTF-8', cache.paths(it.url).body, '-']);
      const pages = out.split('\f').map((t) => t.replace(/\s+/g, ' ').trim());
      while (pages.length && !pages.at(-1)) pages.pop();
      if (pages.join('').length >= 200) return { text: joinPages(pages.map((t, k) => ({ p: k + 1, t }))), src: 'pdftotext' };
    }
    if (it.kind === 'scan' && it.ia && ctx.port) {
      const r = await fetch(`http://127.0.0.1:${ctx.port}/ocr/text?ia=${encodeURIComponent(it.ia)}`, { signal: AbortSignal.timeout(90000) });
      const j = r.ok ? await r.json() : null;
      if (Array.isArray(j?.pages) && j.pages.join('').length >= 200) return { text: joinPages(j.pages.map((t, k) => ({ p: k + 1, t: String(t || '').replace(/\s+/g, ' ').trim() }))), src: 'ocr' };
    }
    if (['html', 'web', 'text'].includes(it.kind) && it.url && cache?.cached(it.url)) {
      const raw = cache.read(it.url).toString('utf-8');
      let pages;
      if (it.kind === 'text') pages = plainPages(raw);
      else {
        let html = raw;
        if (/^\s*\{/.test(raw)) { try { html = JSON.parse(raw)?.data?.post?.result?.htmlBody || ''; } catch { /* not JSON */ } }
        pages = htmlPages(html);
      }
      if (pages.join('').length >= 200) return { text: joinPages(pages.map((t, k) => ({ p: k + 1, t }))), src: 'html-approx' };
    }
  } catch (e) { if (e.code === 'no_text') throw e; /* fall through */ }
  throw Object.assign(new Error('No text for this item yet: open it once (or compile its profile) so its text can be read'), { code: 'no_text' });
}

// ---- what the model is told besides the text ----
const KIND = { pdf: 'PDF', scan: 'scanned book (OCR text)', html: 'post', web: 'web page', text: 'plain-text book' };
const rng = (x) => (Array.isArray(x) ? (x[0] === x[1] ? `p. ${x[0] + 1}` : `pp. ${x[0] + 1}-${x[1] + 1}`) : null);
/** The cached summary for this item (the augmentation model's, else any), or null. */
export function summaryOf(id, model) {
  for (const m of [...new Set([model, MODEL, ...Object.keys(PRICES)])]) {
    const s = readJson(join(CACHE, 'summaries', sha1(id + '|' + m) + '.json'));
    if (s && !s.error) return s;
  }
  return null;
}
let hl = { f: null, mtime: 0, items: {} };
/** The item's entry in data/highlights.json (the feeds' LLM highlights), or the sample's, or null. */
export function highlightsOf(id) {
  for (const name of ['highlights.json', 'highlights.sample.json']) {
    const f = join(HERE, 'data', name);
    let mt; try { mt = statSync(f).mtimeMs; } catch { continue; }
    if (hl.f !== f || hl.mtime !== mt) hl = { f, mtime: mt, items: readJson(f, {})?.items || {} };
    return hl.items[id] || null;
  }
  return null;
}
export function facts({ kind, n, profile, summary, highlight, ix }) {
  const L = ['Facts about the document above, from automatic analysis. Pages use its [p. N] numbering.'];
  const flow = ['html', 'web', 'text'].includes(kind);
  L.push(`- Kind: ${KIND[kind] || kind || 'document'}, ${n} page${n === 1 ? '' : 's'}${flow ? ' (pages here are stretches of about 280 words)' : ''}.`);
  const toc = (profile?.toc || []).filter((e) => e && e.t).slice(0, 60);
  if (toc.length >= 3) {
    L.push('- Table of contents:');
    for (const e of toc) L.push(`  ${'  '.repeat(Math.min(2, e.d || 0))}${e.k != null ? `[p. ${e.k + 1}]` : '[p. ?]'} ${e.t}`);
  }
  const r = profile?.ranges || {};
  const parts = [['Front matter', r.front], ['References', r.refs], ['Appendix', r.appendix], ['Index', r.index]].filter(([, x]) => Array.isArray(x));
  if (parts.length) L.push(`- ${parts.map(([l, x]) => `${l}: ${rng(x)}`).join('. ')}.`);
  const figs = figureList(profile).slice(0, 30);
  if (figs.length) {
    L.push('- Detected figures (id | page | label | caption):');
    for (const f of figs) L.push(`  ${f.fid} | p. ${f.k + 1} | ${f.lab || '-'} | ${String(f.cap || '-').replace(/\s+/g, ' ').slice(0, 160)}`);
  } else L.push('- Detected figures: none are listed, so return an empty figures list.');
  if (summary) {
    L.push('- The reader already sees this summary. Complement it; do not repeat it:');
    if (summary.gist) L.push(`  Gist: ${summary.gist}`);
    for (const kp of (summary.key_points || []).slice(0, 6)) if (kp?.point) L.push(`  Key point${kp.page ? ` (p. ${kp.page})` : ''}: ${kp.point}`);
  }
  if (highlight) {
    const at = (q) => { const hit = q && ix ? findQuote(ix, q) : null; return hit?.page ? ` (p. ${hit.page})` : ''; };
    const lines = [];
    if (highlight.claim) lines.push(`  Claim: ${highlight.claim}`);
    if (highlight.passage?.quote) lines.push(`  Passage${at(highlight.passage.quote)}: "${highlight.passage.quote}"`);
    if (highlight.number?.quote) lines.push(`  Number ${highlight.number.value || ''}${at(highlight.number.quote)}: "${highlight.number.quote}"`);
    if (highlight.question) lines.push(`  Question it answers: ${highlight.question}`);
    if (lines.length) L.push('- Passages another pass already picked; good candidate skim stops (do not copy their wording):', ...lines);
  }
  return L.join('\n');
}

export const AUG_PROMPT = `You are preparing a reading guide for a researcher who skims many documents on a large screen and decides in seconds where to look. The document above has page markers [p. N]. Using the document and the facts above, write:

1. plan: a skim path of 4-8 stops in page order. Each stop is a page worth looking at and why, in under 18 words: the main claim, the key figure or table, the method in a nutshell, the main result, the most important limitation, the conclusion. Prefer pages where the point is visible (a figure, a results table, a summary box). Never stop in the references. When one sentence on that page carries the point, copy it as quote; otherwise leave quote empty.
2. skip: page ranges a skimmer can safely skip (boilerplate, long proofs, hyperparameter tables, references, acknowledgements), each with a short reason.
3. sections: the sections in order, with the first page of each and one line (under 20 words) on what the section establishes, not what it "discusses". If a table of contents is given above, use exactly its titles and pages.
4. glossary: 3-12 terms a reader new to this area needs, each defined in under 20 words as this document uses it, with the page where it is defined or first used, and the defining sentence copied as quote when there is one.
5. notes: up to 12 margin notes, at places where a careful reader would want a short explanation: an unstated assumption, notation, a step that is easy to misread, a number that needs context. Anchor each note with one sentence copied from that page as quote, and say in under 35 words something the sentence does not say. Do not restate the sentence.
6. figures: for each figure id listed above (and only those), what it shows and what to look for, each in under 20 words.
7. display: up to 3 codes from the list in the schema that would help show this document, each with a reason.
8. hook: one specific line under 110 characters that would make this reader want to open it, without hype. tags: 3-6 lowercase topic tags.

Every quote is checked character for character against the text, and a note whose quote cannot be found is thrown away. Copy quotes exactly: no paraphrase, no joined sentences, no ellipses, no [p. N] markers. Be faithful to the text and do not invent content.`;

/** The structured-output schema (pages 1-based). Bounds are in the descriptions and enforced in checkAugment(). */
export function augSchema() {
  const page = { type: 'integer', description: 'page number from the [p. N] markers' };
  const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
  const list = (items, description) => ({ type: 'array', items, description });
  return obj({
    hook: { type: 'string', description: 'One line, under 110 characters.' },
    tags: list({ type: 'string' }, '3-6 lowercase topic tags.'),
    minutes: { type: 'integer', description: 'Minutes to follow the skim path.' },
    plan: list(obj({
      page, why: { type: 'string' },
      kind: { type: 'string', enum: ['start', 'claim', 'method', 'result', 'figure', 'limit', 'conclusion', 'example', 'definition'] },
      quote: { type: 'string', description: 'One verbatim sentence from that page, or "".' },
    }), '4-8 stops in page order.'),
    skip: list(obj({ from: page, to: page, why: { type: 'string' } }), 'Ranges safe to skip.'),
    sections: list(obj({ title: { type: 'string' }, page, depth: { type: 'integer', enum: [0, 1, 2] }, summary: { type: 'string', description: 'Under 20 words.' } }), 'Sections in order.'),
    glossary: list(obj({ term: { type: 'string' }, definition: { type: 'string' }, page, quote: { type: 'string', description: 'The defining sentence, verbatim, or "".' } }), '3-12 terms.'),
    notes: list(obj({ page, quote: { type: 'string' }, note: { type: 'string', description: 'Under 35 words.' } }), 'Up to 12.'),
    figures: list(obj({ fid: { type: 'string' }, what: { type: 'string' }, look: { type: 'string' } }), 'Only the listed figure ids.'),
    display: list(obj({ code: { type: 'string', enum: HINT_CODES }, why: { type: 'string' } }), 'Up to 3.'),
  });
}
/** The same <document> block the summarizer sends, without its 90,000-character cut (the text is capped already). */
export const docBlock = (b) => `<document>\nTitle: ${b.title}\nAuthors: ${b.authors || 'unknown'}\nYear: ${b.year || 'unknown'}\nShelf: ${b.lane || b.laneId || 'unknown'}\n<text>\n${String(b.text || '')}\n</text>\n</document>`;

// ---- checks: the model's answer -> the stored augmentation (section 8.4) ----
const cut = (s, max) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,;:.\s]+$/, '') + '…'; };
const arr = (x) => (Array.isArray(x) ? x.filter((e) => e && typeof e === 'object') : []);
const PLAN_KINDS = new Set(['start', 'claim', 'method', 'result', 'figure', 'limit', 'conclusion', 'example', 'definition']);
/**
 * o: { id, model, family, n, ix (indexText of the text the model saw), profile, partial,
 *      textSrc, textChars, coverage, srcSha1, cost, batch }.
 * With o.partial, quotes are not checked (ok: null) and notes are left out.
 */
export function checkAugment(raw, o) {
  raw = raw && typeof raw === 'object' ? raw : {};
  const n = Math.max(1, Math.round(o.n) || 1);
  const clampK = (p) => Math.max(0, Math.min(n - 1, (Number.isFinite(Number(p)) ? Math.round(Number(p)) : 1) - 1));
  const dropped = { notes: 0, quotes: 0, figs: 0, stops: 0 };
  const check = (q) => {
    if (o.partial || !o.ix) return { ok: null };
    const hit = findQuote(o.ix, q);
    return hit ? { ok: true, k: hit.page ? Math.max(0, Math.min(n - 1, hit.page - 1)) : null } : { ok: false };
  };
  // Skip ranges first: the plan avoids them.
  const skip = [];
  for (const x of arr(raw.skip).map((x) => { let a = clampK(x.from), b = clampK(x.to ?? x.from); if (a > b) [a, b] = [b, a]; return { a, b, why: cut(x.why, 140) }; }).sort((p, q) => p.a - q.a)) {
    const last = skip.at(-1);
    if (last && x.a <= last.b + 1) { last.b = Math.max(last.b, x.b); if (x.why && !last.why.includes(x.why)) last.why = cut(`${last.why}; ${x.why}`, 200); } else skip.push(x);
  }
  // A "skip" over (nearly) the whole document is no guidance.
  for (let j = skip.length - 1; j >= 0; j--) if (n >= 5 && skip[j].b - skip[j].a + 1 >= 0.9 * n) skip.splice(j, 1);
  const refs = Array.isArray(o.profile?.ranges?.refs) ? o.profile.ranges.refs : null;
  const inSkip = (k) => skip.some((x) => k >= x.a && k <= x.b) || (refs && k >= refs[0] && k <= refs[1]);

  const plan = [];
  for (const x of arr(raw.plan)) {
    let k = clampK(x.page);
    const st = { k, why: cut(x.why, 160), kind: PLAN_KINDS.has(x.kind) ? x.kind : 'claim' };
    const q = typeof x.quote === 'string' ? x.quote.trim() : '';
    if (q) {
      const c = check(q);
      if (c.ok === false) dropped.quotes++;
      else { st.quote = q; st.ok = c.ok; if (c.k != null) st.k = k = c.k; }
    }
    plan.push(st);
  }
  plan.sort((p, q) => p.k - q.k);
  const stops = [];
  for (const st of plan) {
    if (stops.some((x) => x.k === st.k) || (st.kind !== 'figure' && inSkip(st.k)) || stops.length >= 8) { if (!o.partial) dropped.stops++; continue; }
    stops.push(st);
  }

  const toc = (o.profile?.toc || []).filter((e) => e && e.t);
  const sections = [];
  for (const x of arr(raw.sections)) {
    const t = cut(x.title, 140); if (!t) continue;
    let k = clampK(x.page), fromToc = false;
    const sk = skel(t);
    if (sk.length >= 3 && toc.length) {
      const e = toc.find((e) => { const es = skel(e.t); return es && (es === sk || (Math.min(es.length, sk.length) >= 4 && (es.startsWith(sk) || sk.startsWith(es)))); });
      if (e) { fromToc = true; if (Number.isInteger(e.k)) k = Math.max(0, Math.min(n - 1, e.k)); }
    }
    if (sections.length && k < sections.at(-1).k) continue; // pages never go backwards
    sections.push({ t, k, d: [0, 1, 2].includes(x.depth) ? x.depth : 0, sum: cut(x.summary, 160), toc: fromToc });
    if (sections.length >= 80) break;
  }

  const glossary = [];
  for (const x of arr(raw.glossary)) {
    const term = cut(x.term, 60), def = cut(x.definition, 200);
    if (!term || !def || glossary.some((g) => skel(g.term) === skel(term))) continue;
    const g = { term, def, k: clampK(x.page), ok: false };
    const q = typeof x.quote === 'string' ? x.quote.trim() : '';
    if (q) {
      const c = check(q);
      if (c.ok === false) dropped.quotes++;
      else { g.quote = q; g.ok = c.ok; if (c.k != null) g.k = c.k; }
    } else if (o.partial) g.ok = null;
    glossary.push(g);
    if (glossary.length >= 12) break;
  }

  const notes = [];
  if (!o.partial) {
    const perPage = new Map(); const seen = new Set();
    for (const x of arr(raw.notes)) {
      const q = typeof x.quote === 'string' ? x.quote.trim() : '';
      const note = cut(x.note, 300);
      const c = q && note ? check(q) : { ok: false };
      const key = skel(q);
      if (c.ok !== true || seen.has(key)) { dropped.notes++; continue; }
      const k = c.k ?? clampK(x.page);
      if ((perPage.get(k) || 0) >= 4 || notes.length >= 12) { dropped.notes++; continue; }
      perPage.set(k, (perPage.get(k) || 0) + 1); seen.add(key);
      notes.push({ k, quote: q, note, ok: true });
    }
    notes.sort((a, b) => a.k - b.k);
  }

  const known = new Map(figureList(o.profile).map((f) => [f.fid, f.k]));
  const figs = [];
  for (const x of arr(raw.figures)) {
    const fid = String(x.fid ?? '').trim();
    if (!known.has(fid) || figs.some((f) => f.fid === fid)) { if (!o.partial) dropped.figs++; continue; }
    figs.push({ fid, k: known.get(fid), what: cut(x.what, 160), look: cut(x.look, 160) });
  }

  const display = [];
  for (const x of arr(raw.display)) if (HINT_CODES.includes(x.code) && !display.some((d) => d.code === x.code) && display.length < 3) display.push({ code: x.code, why: cut(x.why, 160) });
  const tags = [...new Set((Array.isArray(raw.tags) ? raw.tags : []).map((t) => String(t).toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')).filter(Boolean))].slice(0, 6);
  const minutes = Number.isFinite(Number(raw.minutes)) ? Math.max(1, Math.min(600, Math.round(Number(raw.minutes)))) : Math.max(1, Math.round(n * 0.4));

  const out = {
    schema: SCHEMA, prompt: PROMPT, id: o.id, model: o.model, family: o.family || null,
    at: new Date().toISOString(), cost: +(o.cost || 0).toFixed(5), ...(o.batch && { batch: true }),
    textSrc: o.textSrc || null, textChars: o.textChars || 0, coverage: o.coverage ?? 1, srcSha1: o.srcSha1 ?? null, n,
    hook: cut(raw.hook, 120), tags, minutes,
    plan: stops, skip, sections, glossary, notes, figs, display, dropped,
  };
  if (o.partial) out.partial = true;
  return out;
}

/** Structural check of a stored augmentation: { ok, errors }. */
export function validateAugment(a) {
  const e = [];
  const t = (cond, msg) => { if (!cond) e.push(msg); };
  if (!a || typeof a !== 'object') return { ok: false, errors: ['not an object'] };
  const n = a.n;
  const isK = (k) => Number.isInteger(k) && k >= 0 && k < n;
  t(a.schema === SCHEMA, 'schema'); t(Number.isInteger(a.prompt), 'prompt'); t(typeof a.id === 'string' && a.id, 'id');
  t(typeof a.model === 'string' && a.model, 'model'); t(Number.isInteger(n) && n >= 1, 'n');
  t(typeof a.hook === 'string' && a.hook.length <= 120, 'hook');
  t(Array.isArray(a.tags) && a.tags.length <= 6 && a.tags.every((x) => typeof x === 'string' && x === x.toLowerCase() && !/\s/.test(x)), 'tags');
  t(Number.isInteger(a.minutes) && a.minutes >= 1, 'minutes');
  t(Array.isArray(a.plan) && a.plan.length <= 8, 'plan');
  (a.plan || []).forEach((s, j) => { t(isK(s.k), `plan[${j}].k`); t(PLAN_KINDS.has(s.kind), `plan[${j}].kind`); if (j) t(s.k > a.plan[j - 1].k, `plan[${j}] order`); if (s.quote != null) t(typeof s.quote === 'string' && s.ok !== false, `plan[${j}].quote`); });
  t(Array.isArray(a.skip), 'skip');
  (a.skip || []).forEach((s, j) => { t(isK(s.a) && isK(s.b) && s.a <= s.b, `skip[${j}]`); if (j) t(s.a > a.skip[j - 1].b, `skip[${j}] overlap`); });
  t(Array.isArray(a.sections), 'sections');
  (a.sections || []).forEach((s, j) => { t(isK(s.k) && typeof s.t === 'string' && s.t, `sections[${j}]`); t(typeof s.sum === 'string' && s.sum.length <= 160, `sections[${j}].sum`); t([0, 1, 2].includes(s.d), `sections[${j}].d`); if (j) t(s.k >= a.sections[j - 1].k, `sections[${j}] order`); });
  t(Array.isArray(a.glossary) && a.glossary.length <= 12, 'glossary');
  (a.glossary || []).forEach((g, j) => { t(isK(g.k) && g.term && g.def, `glossary[${j}]`); if (g.quote != null) t(g.ok === true || g.ok === null, `glossary[${j}].quote`); });
  t(Array.isArray(a.notes) && a.notes.length <= 12, 'notes');
  (a.notes || []).forEach((x, j) => { t(isK(x.k) && x.ok === true && typeof x.quote === 'string' && x.note, `notes[${j}]`); });
  t(Array.isArray(a.figs), 'figs');
  (a.figs || []).forEach((f, j) => { t(/^\d+\.\d+$/.test(f.fid) && isK(f.k) && Number(f.fid.split('.')[0]) === f.k, `figs[${j}]`); });
  t(Array.isArray(a.display) && a.display.length <= 3 && a.display.every((d) => HINT_CODES.includes(d.code)), 'display');
  t(a.dropped && ['notes', 'quotes', 'figs', 'stops'].every((k) => Number.isInteger(a.dropped[k])), 'dropped');
  return { ok: !e.length, errors: e };
}

// ---- mock output (STACKS_MOCK_AI=1): deterministic, built from the item's own sentences ----
function seeded(str) { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function sentencesOf(t) {
  return String(t).split(/(?<=[.!?])["”’)]?\s+(?=["“(]?[A-Z])/).map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => { const w = s.split(' ').length; return w >= 9 && w <= 38 && /^[“"(]?[A-Z]/.test(s) && /[.!?]["”’)]?$/.test(s) && !/https?:|\[|\]|\||\\/.test(s); });
}
const words = (s, n) => String(s).split(' ').slice(0, n).join(' ').replace(/[,;:.]$/, '');
const STOP = new Set('the a an and or of to in on for with from by at as is are was were be this that these those its it into over under about between their our we you they he she his her not can may will would should could than then also more most such each other which what when where how why using use based new paper post book'.split(' '));
/** A model-shaped answer (a JSON string) from the text: stops at round(n × [0, .12, .3, .5, .7, .9]),
 *  sections from the table of contents or every fifth page, glossary from capitalized phrases,
 *  notes on real sentences with one quote deliberately altered (so the drop path runs). */
export function mockAugment(text, { id, title = '', n, profile, kind } = {}) {
  const rnd = seeded(id || title);
  const pages = pagesOf(text);
  const N = Math.max(1, n || pages.at(-1)?.p || 1);
  const byP = new Map(pages.map((x) => [x.p, sentencesOf(x.t)]));
  const near = (p, which = 0) => { for (let d = 0; d < 4; d++) for (const q of [p + d, p - d]) { const ss = byP.get(q); if (ss?.length) return { p: q, s: ss[Math.min(which, ss.length - 1)] }; } return null; };
  const KINDS = [['start', 'Where the argument starts'], ['claim', 'The central claim'], ['method', 'How they do it'], ['result', 'The main result'], ['limit', 'The main limitation'], ['conclusion', 'What they conclude']];
  const plan = [];
  [0, 0.12, 0.3, 0.5, 0.7, 0.9].forEach((f, j) => {
    const p = Math.min(N, Math.round(N * f) + 1);
    if (plan.some((x) => x.page === p)) return;
    const hit = near(p);
    plan.push({ page: p, why: `(mock) ${KINDS[j][1]}${hit ? ': ' + words(hit.s, 9).toLowerCase() + '…' : ''}`, kind: KINDS[j][0], quote: hit && hit.p === p ? hit.s : '' });
  });
  const toc = (profile?.toc || []).filter((e) => e?.t && Number.isInteger(e.k));
  const sections = toc.length >= 3
    ? toc.slice(0, 40).map((e) => ({ title: e.t, page: e.k + 1, depth: Math.min(2, e.d || 0), summary: `(mock) ${words(near(e.k + 1)?.s || e.t, 12)}…` }))
    : Array.from({ length: Math.ceil(N / 5) }, (_, j) => j * 5 + 1).map((p) => ({ title: `Pages ${p}–${Math.min(N, p + 4)}`, page: p, depth: 0, summary: `(mock) ${words(near(p)?.s || 'This stretch continues the argument', 12)}…` }));
  // Capitalized phrases (two or more words) and acronyms, most frequent first.
  const count = new Map();
  for (const { p, t } of pages) for (const m of t.matchAll(/\b([A-Z][a-z]{2,}(?:[ -][A-Z][a-z]{2,})+|[A-Z]{2,6}s?)\b/g)) {
    const term = m[1]; if (/^(The|This|In|We|It|A|An|For|On|Of|And)\b/.test(term)) continue;
    const e = count.get(term) || { n: 0, p }; e.n++; count.set(term, e);
  }
  const glossary = [...count].sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1)).slice(0, 6).map(([term, e]) => {
    const s = (byP.get(e.p) || []).find((x) => x.includes(term)) || '';
    return { term, definition: `(mock) A term this document uses ${e.n} times, first on p. ${e.p}.`, page: e.p, quote: s };
  });
  const NOTES = ['A careful reader would check the assumption behind this before relying on it.', 'The number here needs a baseline to mean much; look for one nearby.', 'This step is easy to misread as a general claim; it holds only in the setting above.', 'The notation here is defined earlier; skim back if it is unfamiliar.', 'This is where the argument leans hardest on the previous section.'];
  const notes = [];
  for (const f of [0.15, 0.35, 0.55, 0.75, 0.95]) {
    const hit = near(Math.min(N, Math.round(N * f) + 1), 1);
    if (!hit || notes.some((x) => x.quote === hit.s || x.page === hit.p)) continue;
    notes.push({ page: hit.p, quote: hit.s, note: `(mock) ${NOTES[Math.floor(rnd() * NOTES.length)]}` });
  }
  // One quote is altered on purpose, so the "not found, dropped" path is exercised.
  if (notes.length) { const x = notes[Math.min(1, notes.length - 1)]; x.quote = x.quote.replace(/^(\S+)/, '$1 notably'); }
  const figures = figureList(profile).slice(0, 30).map((f) => ({ fid: f.fid, what: `(mock) ${f.lab || 'The figure'} on p. ${f.k + 1}${f.cap ? ': ' + words(f.cap.replace(/^(Figure|Fig\.|Table)\s*\d+[:.]?\s*/i, ''), 8).toLowerCase() : ''}`, look: '(mock) Compare the main curve or column with its baseline.' }));
  const display = (profile?.hints || []).filter((h) => HINT_CODES.includes(h?.code)).slice(0, 3).map((h) => ({ code: h.code, why: `(mock) ${h.why || 'from the page analysis'}` }));
  if (!display.length && kind === 'pdf' && N >= 8) display.push({ code: 'two-up', why: '(mock) Dense text pages read best two at a time.' });
  let skip = [];
  const refs = profile?.ranges?.refs;
  if (Array.isArray(refs)) skip = [{ from: refs[0] + 1, to: refs[1] + 1, why: '(mock) References' }];
  else {
    const r = pages.find((x) => x.p > N * 0.5 && /(^|\s)(\d+\.?\s*)?(References|Bibliography)\s/.test(x.t));
    if (r && r.p < N) skip = [{ from: r.p, to: N, why: '(mock) References and back matter' }];
  }
  const tw = String(title).toLowerCase().match(/\p{L}{4,}/gu) || [];
  const tags = [...new Set(tw.filter((w) => !STOP.has(w)))].slice(0, 4).concat('mock');
  const first = near(1)?.s || title;
  return JSON.stringify({
    hook: cut(`(mock) ${words(first, 12)}`, 108), tags, minutes: Math.max(2, Math.round(N * 0.4)),
    plan, skip, sections, glossary, notes, figures, display,
  });
}

// ---- the augmenter: jobs, the HTTP-facing calls and batches ----
const est = (model, chars) => { const [pi, po] = PRICES[model] || PRICES['claude-opus-5-5']; return ((chars / 3.5) * pi + 3500 * po) / 1e6; };

/**
 * app: the server's app (or a stand-in, for augment-batch.mjs without a server):
 * { ai (from 30-summarize.mjs), cache, port? }.
 */
export function createAugmenter(app) {
  const ai = app.ai; const cache = app.cache;
  if (!ai) throw new Error('app.ai is missing: 30-summarize.mjs must load first');
  mkdirSync(BATCH_DIR, { recursive: true });
  const ctx = { cache, port: app.port ?? PORT };
  const jobs = new Map(); // file -> { listeners, last, promise }
  const holds = new Map(); // batch id -> release() of its reservation
  let made = 0, cachedN = null, cachedAt = 0;

  /** Everything a call needs: the capped text, the facts and the message content. */
  async function prepare(b, it, model) {
    const profile = await profileFor(it.id);
    const { text: full, src } = await textFor(b, it, ctx);
    const { text, coverage } = capText(full);
    const pages = pagesOf(text);
    const n = Math.max(1, profile?.n || (it.kind === 'scan' || it.kind === 'pdf' ? it.n || Number(b.n) || 0 : Number(b.n) || 0) || pagesOf(full).at(-1)?.p || pages.at(-1)?.p || 1);
    const ix = indexText(text);
    const meta = { title: b.title || it.t, authors: b.authors || it.a, year: b.year || it.y, lane: b.lane, laneId: b.laneId || it.lane, kind: it.kind };
    const summary = summaryOf(it.id, model);
    const factsText = facts({ kind: it.kind, n, profile, summary, highlight: highlightsOf(it.id), ix });
    const content = [{ type: 'text', text: docBlock({ ...meta, text }) }, { type: 'text', text: factsText + '\n\n' + AUG_PROMPT }];
    const o = { id: it.id, family: familyOf({ laneId: meta.laneId, kind: it.kind }), n, ix, profile, textSrc: src, textChars: text.length, coverage, srcSha1: profile?.src?.sha1 ?? null };
    return { text, n, content, o, meta, chars: content.reduce((a, c) => a + c.text.length, 0) };
  }

  function augment(b, onPartial) {
    const model = ai.pickModel(b.model);
    const f = augPath(b.id, model);
    if (!b.force && !jobs.has(f) && existsSync(f)) return Promise.resolve(readJson(f));
    let job = jobs.get(f);
    if (!job) {
      job = { listeners: new Set(), last: null };
      job.promise = runJob(b, model, f, job).finally(() => jobs.delete(f));
      jobs.set(f, job);
    }
    if (onPartial) { job.listeners.add(onPartial); if (job.last) onPartial(job.last); }
    return job.promise.finally(() => job.listeners.delete(onPartial));
  }
  const running = (id, model) => jobs.has(augPath(id, ai.pickModel(model)));
  /** Join a job in flight: { promise } with partials to onPartial, or null. */
  function attach(id, model, onPartial) {
    const job = jobs.get(augPath(id, ai.pickModel(model)));
    if (!job) return null;
    job.listeners.add(onPartial); if (job.last) onPartial(job.last);
    return job.promise.finally(() => job.listeners.delete(onPartial));
  }

  async function runJob(b, model, f, job) {
    const it = itemOf(b.id);
    if (!it) throw Object.assign(new Error('unknown id'), { code: 'unknown_id' });
    const P = await prepare(b, it, model);
    const release = ai.reserve(model, P.chars, 3500);
    let lastSent = 0, lastJson = '';
    const push = (a, force) => {
      if (!force && Date.now() - lastSent < 120) return;
      const j = JSON.stringify(a);
      if (j === lastJson) return;
      lastSent = Date.now(); lastJson = j; job.last = a;
      for (const fn of job.listeners) fn(a);
    };
    try {
      const r = await ai.generate({
        model, schema: augSchema(), maxTokens: 12000, content: P.content,
        mock: () => mockAugment(P.text, { id: it.id, title: P.meta.title, n: P.n, profile: P.o.profile, kind: it.kind }),
      }, (t) => {
        if (Date.now() - lastSent < 120) return;
        const p = parsePartial(t);
        if (p && typeof p === 'object') push(checkAugment(p, { ...P.o, model, partial: true }));
      });
      const cost = ai.costOf(r.model, r.usage);
      ai.charge(r.model, cost);
      if (r.stop === 'refusal') throw Object.assign(new Error('The model declined to write a reading guide for this item'), { code: 'refusal' });
      let parsed, complete = true;
      try { parsed = JSON.parse(r.text); } catch { parsed = parsePartial(r.text); complete = false; }
      if (!parsed) throw new Error(r.stop === 'max_tokens' ? 'The reading guide was cut off' : 'No reading guide returned');
      const out = checkAugment(parsed, { ...P.o, model: r.model + (r.mock ? ' (mock)' : ''), cost });
      if (complete) { writeAtomic(f, JSON.stringify(out)); made++; cachedN = null; } else out.truncated = true;
      push(out, true);
      return out;
    } finally { release(); }
  }

  /** The cached augmentation with `stale`, or null. Never calls the model. */
  async function read(id, model) {
    const a = readJson(augPath(id, ai.pickModel(model)));
    if (!a) return null;
    const P = await profileFor(id);
    a.stale = (a.prompt || 0) < PROMPT || !!(P?.src?.sha1 && a.srcSha1 && P.src.sha1 !== a.srcSha1);
    return a;
  }
  function forget(id, model) { const f = augPath(id, ai.pickModel(model)); if (existsSync(f)) { unlinkSync(f); cachedN = null; return true; } return false; }

  // ---- batches (section 8.6) ----
  const batchFile = (id) => join(BATCH_DIR, id + '.json');
  const textsFile = (id) => join(BATCH_DIR, id + '.texts.json');
  const brief = (r) => ({ id: r.id, status: r.status, model: r.model, n: r.n, counts: r.counts, est: r.est, cost: +(r.cost || 0).toFixed(4), at: r.at, ended: r.ended || null, mock: !!r.mock, failed: r.failed?.length || 0 });
  function listBatches() {
    let fs = []; try { fs = readdirSync(BATCH_DIR).filter((f) => f.endsWith('.json') && !f.endsWith('.texts.json')); } catch { /* none */ }
    return fs.map((f) => readJson(join(BATCH_DIR, f))).filter(Boolean).sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  /** Items for a batch: the reader's order first (warm hint), then by relevance and popularity. */
  function batchOrder(lanes) {
    const { list, byId } = corpusItems();
    const hint = readJson(join(CACHE, 'warm-hint.json'));
    const out = [], seen = new Set();
    const hinted = Object.entries(hint?.lanes || {}).filter(([l]) => !lanes || lanes.includes(l)).map(([, xs]) => xs);
    for (let r = 0; hinted.some((xs) => r < xs.length); r++) for (const xs of hinted) { const it = byId.get(xs[r]?.[0]); if (it && !seen.has(it.id)) { seen.add(it.id); out.push(it); } }
    const rest = list.filter((it) => !seen.has(it.id) && (!lanes || lanes.includes(it.lane)));
    rest.sort((a, b) => ((b.rel ?? 0.5) - (a.rel ?? 0.5)) || ((b.score || 0) - (a.score || 0)));
    return out.concat(rest);
  }
  const isCurrent = (id, model) => { const a = readJson(augPath(id, model)); return !!a && (a.prompt || 0) >= PROMPT; };

  /** Choose, estimate and (unless dry) submit. { batch, n, est, skipped }. */
  async function submitBatch({ ids, lanes, limit = 500, model, maxUsd, dry = false } = {}) {
    model = ai.pickModel(model);
    limit = Math.max(1, Math.min(100000, Number(limit) || 500));
    const skipped = []; const chosen = [];
    const cands = Array.isArray(ids) && ids.length ? ids.map((id) => itemOf(id) || { id, missing: true }) : batchOrder(Array.isArray(lanes) && lanes.length ? lanes : null);
    for (const it of cands) {
      if (chosen.length >= limit) break;
      if (it.missing) { skipped.push({ id: it.id, why: 'unknown id' }); continue; }
      if (isCurrent(it.id, model)) { if (ids?.length) skipped.push({ id: it.id, why: 'current' }); continue; }
      let P;
      try { P = await prepare({ id: it.id }, it, model); } catch (e) { skipped.push({ id: it.id, why: e.code || e.message }); continue; }
      chosen.push({ it, P, est: est(model, P.chars) * 0.5 });
    }
    const sp = ai.spendInfo();
    const cap = Number.isFinite(Number(maxUsd)) && maxUsd !== null && maxUsd !== '' ? Number(maxUsd) : Math.max(0, sp.budget - sp.today);
    let sum = 0; const fit = [];
    for (const c of chosen) { if (sum + c.est > cap) { skipped.push({ id: c.it.id, why: 'over max-usd' }); continue; } sum += c.est; fit.push(c); }
    const res = { batch: null, n: fit.length, est: +sum.toFixed(4), cap: +cap.toFixed(4), skipped };
    if (dry || !fit.length) return res;
    // Reserve the estimate now, at its half price, against today's budget.
    const [pi] = PRICES[model] || PRICES['claude-opus-5-5'];
    const release = ai.reserve(model, (sum * 1e6 * 3.5) / pi, 0);
    const rec = { id: null, model, at: new Date().toISOString(), est: res.est, n: fit.length, status: 'submitted', counts: null, cost: 0, map: {}, items: {}, failed: [], done: false };
    for (const c of fit) { const cid = customId(c.it.id, model); rec.map[cid] = c.it.id; const { ix, profile, ...o } = c.P.o; rec.items[c.it.id] = o; }
    if (ai.MOCK) {
      // Mock mode: no API; every item is answered at once, at the batch price.
      rec.id = 'mock_' + Date.now().toString(36); rec.mock = true;
      for (const c of fit) {
        const raw = mockAugment(c.P.text, { id: c.it.id, title: c.P.meta.title, n: c.P.n, profile: c.P.o.profile, kind: c.it.kind });
        const cost = 0.5 * ai.costOf(model, { input_tokens: Math.round(c.P.chars / 3.6), output_tokens: Math.round(raw.length / 3.2) + 180 });
        ai.charge(model, cost); rec.cost += cost;
        writeAtomic(augPath(c.it.id, model), JSON.stringify(checkAugment(JSON.parse(raw), { ...c.P.o, model: model + ' (mock)', cost, batch: true })));
        made++;
      }
      Object.assign(rec, { status: 'ended', ended: new Date().toISOString(), done: true, counts: { processing: 0, succeeded: fit.length, errored: 0, canceled: 0, expired: 0 } });
      release(); cachedN = null;
      writeAtomic(batchFile(rec.id), JSON.stringify(rec));
      return { ...res, batch: rec.id };
    }
    let batch;
    try {
      const client = await ai.client();
      const schema = augSchema();
      batch = await client.messages.batches.create({
        requests: fit.map((c) => ({
          custom_id: customId(c.it.id, model),
          params: { model, max_tokens: 12000, output_config: { effort: 'low', format: { type: 'json_schema', schema } }, messages: [{ role: 'user', content: c.P.content }] },
        })),
      });
    } catch (e) { release(); throw e; }
    Object.assign(rec, { id: batch.id, status: batch.processing_status, counts: batch.request_counts });
    // The text each request saw, to check its quotes when the results come back (deleted then).
    writeAtomic(textsFile(rec.id), JSON.stringify(Object.fromEntries(fit.map((c) => [customId(c.it.id, model), c.P.text]))));
    writeAtomic(batchFile(rec.id), JSON.stringify(rec));
    holds.set(rec.id, release);
    return { ...res, batch: rec.id };
  }

  const polling = new Set();
  /** Check one batch; when it has ended, store its results. Returns the record. */
  async function pollBatch(id) {
    const rec = readJson(batchFile(id));
    if (!rec || rec.done || rec.mock || polling.has(id)) return rec;
    polling.add(id);
    try {
      const client = await ai.client();
      const b = await client.messages.batches.retrieve(id);
      rec.status = b.processing_status; rec.counts = b.request_counts;
      if (b.processing_status === 'ended') {
        const texts = readJson(textsFile(id), {});
        for await (const r of await client.messages.batches.results(id)) {
          const itemId = rec.map[r.custom_id]; if (!itemId) continue;
          const o = rec.items[itemId] || { id: itemId, n: 1 };
          const type = r.result?.type;
          if (type === 'succeeded') {
            const msg = r.result.message;
            const cost = 0.5 * ai.costOf(msg.model || rec.model, msg.usage);
            ai.charge(msg.model || rec.model, cost); rec.cost += cost;
            const text = (msg.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
            let parsed = null; try { parsed = JSON.parse(text); } catch { parsed = parsePartial(text); }
            if (msg.stop_reason === 'refusal' || !parsed) { rec.failed.push({ id: itemId, why: msg.stop_reason === 'refusal' ? 'refusal' : 'unparsable', retry: msg.stop_reason !== 'refusal' }); continue; }
            const profile = await profileFor(itemId);
            const src = texts[r.custom_id];
            const out = checkAugment(parsed, { ...o, profile, ix: src ? indexText(src) : null, model: msg.model || rec.model, cost, batch: true });
            if (!src) { out.notes = []; } // nothing to check against: keep no notes
            writeAtomic(augPath(itemId, rec.model), JSON.stringify(out)); made++;
          } else {
            const et = r.result?.error?.error?.type || r.result?.error?.type || type;
            rec.failed.push({ id: itemId, why: type === 'errored' ? et : type, retry: !(type === 'errored' && /invalid_request/.test(String(et))) });
          }
        }
        rec.done = true; rec.ended = new Date().toISOString(); cachedN = null;
        try { unlinkSync(textsFile(id)); } catch { /* gone */ }
        holds.get(id)?.(); holds.delete(id);
      }
      writeAtomic(batchFile(id), JSON.stringify(rec));
      return rec;
    } finally { polling.delete(id); }
  }
  /** Resume polling every batch still open (on server start; state lives in CACHE/augment/batches/). */
  let timer = null;
  function resume(ms = 60e3) {
    if (timer) return;
    const tick = async () => { for (const r of listBatches()) if (!r.done && !r.mock) await pollBatch(r.id).catch((e) => console.warn('augment batch', r.id, e.message)); };
    timer = setInterval(tick, ms); timer.unref?.();
    tick();
  }
  function status() {
    if (cachedN == null || Date.now() - cachedAt > 30e3) { try { cachedN = readdirSync(DIR).filter((f) => /^[0-9a-f]{40}\.json$/.test(f)).length; } catch { cachedN = 0; } cachedAt = Date.now(); }
    const open = listBatches().filter((r) => !r.done);
    return { made, cached: cachedN, batches: { active: open.length, items: open.reduce((a, r) => a + (r.n || 0), 0) }, mockAI: !!ai.MOCK, prompt: PROMPT };
  }
  return { augment, attach, running, read, forget, prepare, submitBatch, pollBatch, listBatches, brief, resume, status, itemOf };
}
