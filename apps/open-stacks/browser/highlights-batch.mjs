#!/usr/bin/env node
/**
 * Highlights for the whole corpus through the Message Batches API, at half
 * price: for each item, the best figure (or best few), the claim in a line,
 * the most interesting passage, the most surprising number and a question
 * (design: docs/feeds/llm-highlights.md; file format in its section 4, prompt
 * in section 5, batch job in section 6). Output: data/highlights.json, which
 * the Feeds view (server/routes/66-extract.mjs) and reading guides read.
 *
 *   node highlights-batch.mjs [--lanes ai-safety,llm] [--ids id1,id2] [--kinds arxiv,post,web,scan]
 *                             [--limit 2000] [--model haiku|sonnet|opus|<model id>] [--effort low]
 *                             [--max-usd 3] [--lean] [--redo] [--redo-hand] [--count-tokens 20]
 *                             [--dry] [--yes] [--no-wait] [--status] [--retry-refused]
 *                             [--port 4747] [--out data/highlights.json]
 *
 * What it does:
 *   1. Finishes any batch a previous run left open (ids in data/highlights.batch.json;
 *      results stay downloadable for 29 days), so a stopped run resumes where it was.
 *   2. Builds each remaining item's text: arXiv papers from their HTML (LaTeXML), posts
 *      from the GraphQL htmlBody, web pages from their main content, scans from their
 *      OCR text. Non-arXiv PDFs have no server-side text yet and are skipped.
 *   3. Prints the number of requests, the input size and the estimated cost at batch
 *      prices, then asks before submitting (--yes skips the question, --dry stops there).
 *      --max-usd caps the batch (default: what is left of today's AI budget,
 *      STACKS_DAILY_BUDGET, default $3); items past the cap wait for the next run.
 *   4. Polls every minute (most batches end within the hour), verifies every quote
 *      against the text the model saw, fills in figure captions and images, and writes
 *      data/highlights.json. Errored and expired items are picked up by the next run;
 *      refusals are recorded and re-run with --retry-refused (interactive calls,
 *      Sonnet 5.5 by default, with server-side fallback).
 *
 * Items already in the file for the current prompt version are skipped (--redo
 * re-runs them); entries picked by hand (`by` starting "hand") are never replaced
 * unless --redo-hand. Sources come through a running Stacks server on --port
 * (default 4747, so its disk cache and politeness rules apply); without one, the
 * script starts its own on a spare port and stops it at the end.
 * STACKS_MOCK_AI=1 answers every item at once from the text alone, without the
 * API, and writes to CACHE/highlights/mock-highlights.json unless --out is given.
 *
 * The module also exports the pieces (block builders, prompt, schema, verifier),
 * which is how the hand-made entries in data/highlights.json were checked.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { parse, text, clean, hasClass } from './server/routes/65-figures.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PROMPT = 'highlights-v1';
export const CAP = 100000; // characters of document text per request (section 5)
export const LEAN_CAP = 40000; // --lean: papers and web pages (scans keep CAP)
const OUT_TOKENS = 1500; // planning figure per item: ~450 answer + thinking at low effort (section 7)
const CPT = 2.7; // characters per token for planning, until --count-tokens measures it
// $ per million tokens, input / output (as of October 2026). Haiku 5.5 doubles back to
// $0.50 / $2.50 above 100K input tokens, which the 100,000-character cap never reaches.
export const PRICES = { 'claude-haiku-5-5': [0.1, 0.5], 'claude-sonnet-5-5': [2, 10], 'claude-opus-5-5': [4, 20], 'claude-fable-5-1': [10, 50] };
const LONG = { 'claude-haiku-5-5': [0.5, 2.5] };
const ALIAS = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5', opus: 'claude-opus-5-5', fable: 'claude-fable-5-1' };

// ------------------------------------------------------------------ prompt ----
export const SYSTEM = `You pick out the highlights of one document for a researcher who skims a great deal of AI safety, machine learning, forecasting and older technical writing. Your picks become cards in a feed: the best figure, one passage, one number and the claim in a line. They want what a careful, well-read reader would point to, the places worth looking at, not a summary.

The document arrives as blocks, each opening with a marker in square brackets:
- [abstract], [S3.SS2.p3]: the abstract and paragraphs of an arXiv paper (the LaTeXML id encodes the section); [S1.F2], [S2.T1]: figure and table captions.
- [p41]: the 42nd paragraph of a post or wiki page; [img6]: its 7th image, with its caption or "no caption"; [tbl0]: a table, with its header row.
- [k120 p.100]: page 120 of a scanned book, printed page 100; [k27 plate]: a page that is mostly a picture.
Lines starting with # are section headings, there for orientation. Refer to places only by these markers, copied exactly, without the brackets.

Fill in:
claim: the main claim or contribution in one plain sentence of at most 30 words, as you would put it to a colleague.
passage: the single most interesting passage, one to three consecutive sentences from one block. Prefer what is surprising, concrete or quotable (a finding with its number, a vivid example, a sharp argument, a prediction that can be checked) over a restatement of the abstract. why says in at most 30 words why a careful reader would point to it.
number: the most surprising number, one that changes how you see the topic, usually against a baseline or an expectation. value is the number as written; what says in a few words what it measures; quote is the whole sentence that contains it. Skip years, citation and section numbers, sample sizes and hyperparameters unless they are the surprise. Use null when no number qualifies, as in most essays.
figures: up to three figures, tables or pictures most worth looking at, best first, by marker. A plot of the main result beats a diagram of the setup, which beats sample outputs; the main text beats the appendix. You see only captions and the sentences that cite figures, so judge by those: the figure the argument leans on is usually the one, and a figure cited many times only as a lookup table is not. why is at most 20 words. Use an empty list when nothing is worth a look.
show: "one" when the first figure tells the story alone, "few" when the others add something it lacks, "none" when figures is empty.
question: one question the document answers, as a reader would ask it before reading, in at most 20 words.

Quotes (passage.quote and number.quote) are copied character for character from a single block: no paraphrase, no ellipses, no stitching across blocks, no markers. In scanned books you may join a word hyphenated across a line break ("con- vinced" becomes "convinced"); otherwise keep the OCR's spelling. Software checks every quote against the text and drops any it cannot find.

Stay faithful to the document: claim, passage and number come from it alone. A why may add well-established outside context, such as a later result that revised this one, when you are sure of it.`;

const str = (description) => ({ type: 'string', description });
const locS = str('Block marker, copied exactly without brackets, e.g. S3.SS2.p3, S1.F2, p41, img6, tbl0, k120.');
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const SCHEMA = obj({
  claim: str('The main claim or contribution, one plain sentence, at most 30 words.'),
  passage: obj({
    quote: str('One to three consecutive sentences copied exactly from one block.'),
    loc: locS,
    why: str('Why a careful reader would point to it, at most 30 words.'),
  }),
  number: {
    anyOf: [obj({
      value: str('The number as written, e.g. "5-18x", "35–80%", "thirteen years".'),
      what: str('What it measures, a few words.'),
      quote: str('The whole sentence containing it, copied exactly.'),
      loc: locS,
    }), { type: 'null' }],
  },
  figures: {
    type: 'array',
    description: 'Up to three, best first; empty when nothing is worth a look.',
    items: obj({
      ref: locS,
      kind: { type: 'string', enum: ['result', 'diagram', 'example', 'table', 'picture'] },
      why: str('Why look at it, at most 20 words.'),
    }),
  },
  show: { type: 'string', enum: ['one', 'few', 'none'] },
  question: str('A question the document answers, as a reader would ask it, at most 20 words.'),
});

export const params = (model, userText, effort = 'low') => ({
  model,
  max_tokens: 8000, // the answer is about 450 tokens; the rest is room for thinking
  system: SYSTEM,
  messages: [{ role: 'user', content: userText }],
  output_config: { effort, format: { type: 'json_schema', schema: SCHEMA } },
});

// ------------------------------------------------------------- helpers ----
export const sq = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
/** Letters and digits only (as server/routes/30-summarize.mjs and the UI match quotes). */
export const skel = (s) => String(s).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const isEl = (k) => typeof k !== 'string';
function collect(el, stop, out = []) {
  for (const k of el.kids) { if (!isEl(k)) continue; out.push(k); if (!stop || !stop(k)) collect(k, stop, out); }
  return out;
}
function up(el, pred) { for (let x = el.p; x; x = x.p) if (pred(x)) return x; return null; }
function prune(el, drop) {
  if (!isEl(el)) return el;
  return { ...el, kids: el.kids.filter((k) => !isEl(k) || !drop(k)).map((k) => prune(k, drop)) };
}
const cutAt = (s, n) => { s = sq(s); if (s.length <= n) return s; const c = s.slice(0, n); const e = c.search(/[.!?](?=\s)[^.!?]*$/); return e > n * 0.4 ? c.slice(0, e + 1) : c.replace(/\s+\S*$/, '') + '…'; };
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const today = () => new Date().toLocaleDateString('en-CA');
const readJson = (f, d = null) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return d; } };
function writeAtomic(f, s) { mkdirSync(dirname(f), { recursive: true }); const t = `${f}.${process.pid}.tmp`; writeFileSync(t, s); renameSync(t, f); }

// ------------------------------------------------------ arXiv (LaTeXML) ----
const BACK = /acknowledg|author contributions?|contributions statement|funding|impact statement|broader impacts?|reproducibility|checklist|ethics statement|competing interests/i;
const tagText = (h) => { for (const el of collect(h)) if (hasClass(el, 'ltx_tag')) return sq(text({ kids: el.kids })); return ''; };

/**
 * Blocks of a LaTeXML page: the abstract, section headings, paragraphs (one per
 * `ltx_para` id) and the captions of the figures in `figs` (the /figures list),
 * in document order. `main` is false in appendices and back matter. Returns null
 * for ar5iv's abstract-only page and for stubs with almost no body text.
 */
export function arxivBlocks(html, figs = []) {
  const root = parse(html);
  const all = collect(root);
  const doc = all.find((e) => hasClass(e, 'ltx_document'));
  if (!doc) return null;
  const figById = new Map(figs.filter((f) => f.id).map((f) => [f.id, f]));
  const blocks = [];
  const abs = all.find((e) => hasClass(e, 'ltx_abstract'));
  if (abs) {
    const t = sq(text(prune(abs, (x) => /^h\d$/.test(x.tag) || hasClass(x, 'ltx_title'))));
    if (t) blocks.push({ m: 'abstract', t, kind: 'p', main: true, sec: null });
  }
  const skip = (e) => e.tag === 'nav' || e.tag === 'header' || e.tag === 'footer' || e.tag === 'script' || e.tag === 'style' || hasClass(e, 'ltx_bibliography') || hasClass(e, 'ltx_abstract')
    || hasClass(e, 'ltx_authors') || hasClass(e, 'ltx_title_document') || hasClass(e, 'ltx_TOC') || hasClass(e, 'ltx_page_footer') || hasClass(e, 'ltx_page_header') || hasClass(e, 'ltx_dates');
  const isFigEl = (e) => e.tag === 'figure' || hasClass(e, 'ltx_figure') || hasClass(e, 'ltx_table') && e.tag !== 'table';
  const visit = (el, ctx) => {
    for (const k of el.kids) {
      if (!isEl(k) || skip(k)) continue;
      let c = ctx;
      const id = k.a.id || '';
      if (k.tag === 'section' && id) {
        const h = k.kids.find((x) => isEl(x) && /^h[1-6]$/.test(x.tag));
        const title = h ? sq([tagText(h), text(h)].filter(Boolean).join(' ')) : '';
        const app = /^A[\dA-Z]?/.test(id) && !/^Abs/i.test(id) || hasClass(k, 'ltx_appendix') || ctx.app;
        c = { ...ctx, sec: id, app, main: ctx.main && !app && !BACK.test(title) };
        if (title) blocks.push({ m: id, t: title, kind: 'h', main: c.main, sec: id, level: Number(h.tag[1]) });
        visit(k, c);
        continue;
      }
      if (id && (hasClass(k, 'ltx_paragraph') || hasClass(k, 'ltx_subparagraph'))) c = { ...ctx, sec: id };
      if (isFigEl(k)) {
        const f = figById.get(id);
        if (f) { blocks.push({ m: id, t: sq(`${f.label}: ${f.caption || ''}`).replace(/:$/, ''), kind: 'cap', main: ctx.main && !/^A/.test(id), sec: ctx.sec, fig: f }); continue; }
        visit(k, { ...c, inFig: true }); // a wrapper of numbered panels
        continue;
      }
      if (hasClass(k, 'ltx_para') && id && !ctx.inFig) {
        const t = sq(text(prune(k, (x) => isFigEl(x) || hasClass(x, 'ltx_para') || hasClass(x, 'ltx_note'))));
        if (t) blocks.push({ m: id, t, kind: 'p', main: ctx.main, sec: ctx.sec });
      }
      visit(k, c);
    }
  };
  visit(doc, { sec: null, main: true, app: false, inFig: false });
  const body = blocks.filter((b) => b.kind === 'p' && b.main).reduce((n, b) => n + b.t.length, 0);
  if (body < 2500) return null; // a stub that points elsewhere (e.g. Transformer Circuits papers)
  return blocks;
}

// --------------------------------------------- posts and web pages ----
// The leaf-block rule of llm-highlights.md section 3, as server/lib/extract.mjs
// numbers blocks, images and tables (the Feeds view resolves refs by these numbers).
const LEAF = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'pre', 'td', 'th', 'dt', 'dd']);
const HEAD = /^h[1-6]$/;
const FOOT = (x) => hasClass(x, 'footnote-section') || hasClass(x, 'footnotes') || hasClass(x, 'footnote-item') || x.tag === 'section' && x.a.role === 'doc-endnotes';
const BAD_IMG = /emoji|icon|avatar|logo|gravatar|latex|codecogs|badge|favicon|flourish|divider|separator|spacer|ornament|sprite|pixel\.|1x1|blank\.|placeholder/i;
function leafBlocks(root) {
  const blocks = [], imgs = [], tables = [];
  const memo = new Map();
  const hasLeaf = (el) => {
    if (memo.has(el)) return memo.get(el);
    let r = false;
    for (const k of el.kids) if (isEl(k) && (LEAF.has(k.tag) || hasLeaf(k))) { r = true; break; }
    memo.set(el, r);
    return r;
  };
  let head = null;
  const addLeaf = (el) => {
    const segs = [[]]; let brs = 0; // a double <br> breaks a paragraph
    for (const k of el.kids) {
      if (isEl(k) && k.tag === 'br') { brs++; continue; }
      if (!isEl(k) && !k.trim()) { segs.at(-1).push(k); continue; }
      if (brs >= 2 && segs.at(-1).length) segs.push([]);
      else if (brs === 1) segs.at(-1).push({ tag: 'br', a: {}, kids: [] });
      brs = 0; segs.at(-1).push(k);
    }
    for (const kids of segs) {
      const seg = segs.length === 1 ? el : { ...el, kids };
      const t = text(seg);
      if (!t) continue;
      const b = { k: blocks.length, el, t, s: el.s, tag: el.tag, head };
      if (HEAD.test(el.tag)) { head = { t, id: el.a.id || up(el, (x) => !!x.a.id && hasClass(x, 'sl-heading-wrapper'))?.a.id || null }; b.head = head; }
      blocks.push(b);
    }
  };
  const visit = (el) => {
    for (const k of el.kids) {
      if (!isEl(k)) continue;
      if (k.tag === 'img') imgs.push(k);
      if (k.tag === 'table') tables.push(k);
      if (LEAF.has(k.tag) && !hasLeaf(k)) { addLeaf(k); for (const x of collect(k)) { if (x.tag === 'img') imgs.push(x); if (x.tag === 'table') tables.push(x); } continue; }
      visit(k);
    }
  };
  visit(root);
  return { blocks, imgs, tables };
}
function imgSrc(el, base) {
  let src = el.a.src || '';
  if (!src || /^data:image\/(?:gif|svg\+xml);/i.test(src) && src.length < 400) src = el.a['data-src'] || el.a['data-lazy-src'] || (el.a.srcset || el.a['data-srcset'] || '').split(/\s+/)[0] || src;
  if (!src) return null;
  if (src.startsWith('data:')) { src = src.replace(/\s+/g, ''); return src.length > 100000 ? null : src; }
  try { return new URL(src, base).href; } catch { return null; }
}
const dim = (v) => { const x = parseFloat(v); return Number.isFinite(x) && x > 0 && !/%/.test(v) ? Math.round(x) : null; };
function tableOk(tbl, web) {
  let rows = 0, cols = 0, cells = 0, digits = 0, chars = 0;
  for (const tr of collect(tbl)) {
    if (tr.tag !== 'tr') continue;
    rows++; let c = 0;
    for (const td of collect(tr)) {
      if (td.tag !== 'td' && td.tag !== 'th') continue;
      c += Number(td.a.colspan) || 1;
      const t = text(td); if (!t) continue;
      cells++; chars += t.length; if (/\d/.test(t)) digits++;
    }
    cols = Math.max(cols, c);
  }
  const wordy = (cells ? digits / cells : 0) < 0.15;
  return rows >= 2 && rows <= 25 && cols >= 2 && cols <= 10 && chars >= 20 && (!wordy || web) && clean(tbl).length <= 40000;
}
/** Blocks of a post or web page's content root: p<k> leaf blocks, img<k> and tbl<k> in text order. */
function flowBlocks(root, base, web) {
  const { blocks, imgs, tables } = leafBlocks(root);
  const out = blocks.map((b) => ({ m: `p${b.k}`, t: HEAD.test(b.tag) ? `${'#'.repeat(Number(b.tag[1]))} ${b.t}` : b.t, raw: b.t, kind: HEAD.test(b.tag) ? 'h' : 'p', sec: web ? b.head?.id || null : null, s: b.s }));
  imgs.forEach((el, k) => {
    const src = imgSrc(el, base);
    if (!src || BAD_IMG.test(src) || up(el, FOOT)) return;
    const w = dim(el.a.width), h = dim(el.a.height);
    if ((w && w < 60) || (h && h < 60)) return;
    const fig = up(el, (x) => x.tag === 'figure');
    const capEl = fig && collect(fig).find((x) => x.tag === 'figcaption');
    const caption = capEl ? text(capEl) : (el.a.alt && el.a.alt.length > 12 ? sq(el.a.alt) : null);
    out.push({ m: `img${k}`, t: `(image) ${caption ? cutAt(caption, 600) : 'no caption'}`, kind: 'img', img: src, caption: caption ? cutAt(caption, 600) : null, s: el.s });
  });
  tables.forEach((tbl, k) => {
    if (up(tbl, (x) => x.tag === 'table') || up(tbl, FOOT) || !tableOk(tbl, web)) return;
    const tr = collect(tbl).find((x) => x.tag === 'tr');
    const headRow = tr ? collect(tr).filter((x) => x.tag === 'td' || x.tag === 'th').map((x) => text(x)).filter(Boolean).join(' | ') : '';
    const capEl = tbl.kids.find((x) => isEl(x) && x.tag === 'caption');
    out.push({ m: `tbl${k}`, t: `(table) ${capEl ? text(capEl) + ' — ' : ''}${cutAt(headRow, 300)}`, kind: 'tbl', caption: capEl ? text(capEl) : null, s: tbl.s });
  });
  out.sort((a, b) => a.s - b.s);
  return out;
}
/** A post's htmlBody (LessWrong, Alignment Forum, EA Forum). */
export function postBlocks(htmlBody, page) {
  const root = parse(htmlBody || '');
  for (const el of collect(root)) if (hasClass(el, 'footnote-reference')) el.kids = [];
  return flowBlocks(root, page, false);
}
const ROOTS = [(e) => hasClass(e, 'sl-markdown-content'), (e) => e.tag === 'd-article', (e) => e.tag === 'article', (e) => e.tag === 'main', (e) => e.a.role === 'main',
  (e) => hasClass(e, 'post-content'), (e) => hasClass(e, 'entry-content'), (e) => e.a.id === 'content', (e) => e.tag === 'body'];
const COMMENTS = /(?:^|[\s_-])(?:comments?|commentlist|comment-list|comments-area|disqus_thread|disqus|responses|replies|respond)(?:$|[\s_-])/i;
const JUNK = (e) => ['script', 'style', 'noscript', 'nav', 'form', 'button', 'template', 'iframe', 'select'].includes(e.tag) || hasClass(e, 'sr-only') || hasClass(e, 'sl-anchor-link') || hasClass(e, 'pagination-links')
  || COMMENTS.test(e.a.id || '') || COMMENTS.test(e.a.class || '');
/** A web page: its main content element, pruned as server/lib/extract.mjs prunes it. */
export function webBlocks(html, url) {
  const root = parse(html);
  const all = collect(root);
  let content = null;
  for (const pred of ROOTS) { content = all.find(pred); if (content) break; }
  content ||= root;
  let priors = false; try { priors = /(^|\.)priors\.quantifieduncertainty\.org$/.test(new URL(url).hostname); } catch { /* keep */ }
  const drop = (e) => JUNK(e) || (priors && e.tag === 'aside' && hasClass(e, 'starlight-aside')) || (content.tag === 'body' && (e.tag === 'header' || e.tag === 'footer' || e.tag === 'aside'));
  const pruneIn = (el) => { el.kids = el.kids.filter((k) => !isEl(k) || !drop(k)); for (const k of el.kids) if (isEl(k)) pruneIn(k); };
  pruneIn(content);
  return flowBlocks(content, url, true);
}

// ----------------------------------------------------------------- scans ----
export const plateImg = (ia, k, w = 400) => `https://archive.org/download/${ia}/page/n${k}_w${w}.jpg`;
/** One block per OCR page: [k<N> p.<printed>], pages with 8-100 characters marked as plates. */
export function scanBlocks(pages = [], labels = []) {
  const out = [];
  pages.forEach((p, k) => {
    const t = sq(p);
    if (t.length < 8) return;
    const plate = t.length <= 100;
    const label = labels?.[k] ?? null;
    out.push({ m: `k${k}`, head: `k${k}${plate ? ' plate' : label ? ` p.${label}` : ''}`, t, kind: plate ? 'plate' : 'page', page: k, label });
  });
  return out;
}

// --------------------------------------------------------- the request ----
const KIND = { arxiv: 'arXiv paper (from its HTML)', post: 'post', web: 'web page', scan: 'scanned book (OCR text)' };
const line = (b) => b.kind === 'h' && !/^p\d/.test(b.m) ? `${'#'.repeat(Math.min(3, b.level || 1))} ${b.t}` : `[${b.head || b.m}] ${b.t}`;
/** The blocks that fit in `cap` characters, in document order (section 5's rules). */
export function fit(D, cap = CAP) {
  const B = D.blocks;
  const len = (b) => line(b).length + 1;
  const total = B.reduce((n, b) => n + len(b), 0);
  if (D.kind === 'arxiv') {
    const body = B.filter((b) => b.kind !== 'cap' && b.main);
    const capsMain = B.filter((b) => b.kind === 'cap' && b.main), capsApp = B.filter((b) => b.kind === 'cap' && !b.main);
    const sum = (xs) => xs.reduce((n, b) => n + len(b), 0);
    const keep = new Set();
    if (sum(body) + sum(capsMain) + sum(capsApp) <= cap) { for (const b of [...body, ...capsMain, ...capsApp]) keep.add(b); }
    else {
      const capBudget = Math.max(0.3 * cap, cap - sum(body));
      let used = 0;
      for (const b of [...capsMain, ...capsApp]) { if (used + len(b) > capBudget) break; keep.add(b); used += len(b); }
      for (const b of body) { if (used + len(b) > cap) break; keep.add(b); used += len(b); }
    }
    // Appendix captions go last, after the main text.
    return [...B.filter((b) => keep.has(b) && b.main), ...B.filter((b) => keep.has(b) && !b.main)];
  }
  if (total <= cap) return B;
  if (D.kind === 'scan') {
    // Every plate page, then 40% of what is left from the front, 30% from the back
    // (conclusions) and the rest spread evenly through the middle.
    const keep = new Set(B.filter((b) => b.kind === 'plate'));
    let left = cap - [...keep].reduce((n, b) => n + len(b), 0);
    const pages = B.filter((b) => !keep.has(b));
    const take = (xs, budget) => { let u = 0; for (const b of xs) { if (u + len(b) > budget) break; keep.add(b); u += len(b); } return u; };
    const front = take(pages, left * 0.4);
    const back = take([...pages].reverse(), left * 0.3);
    left -= front + back;
    const mid = pages.filter((b) => !keep.has(b));
    const avg = mid.length ? mid.reduce((n, b) => n + len(b), 0) / mid.length : 1;
    const n = Math.max(0, Math.floor(left / avg));
    for (let i = 0; i < n && mid.length; i++) { const b = mid[Math.floor((i + 0.5) * mid.length / n)]; if (b) keep.add(b); }
    return B.filter((b) => keep.has(b));
  }
  const out = []; let used = 0;
  for (const b of B) { if (used + len(b) > cap) break; out.push(b); used += len(b); }
  return out;
}
/** The user message for one item (section 5's input format). */
export function userText(D, cap = CAP) {
  const it = D.meta;
  const kind = D.kind === 'post' ? `${D.site || 'forum'} post` : D.kind === 'web' ? `web page (${D.host})` : D.kind === 'scan' ? `scanned book (OCR text, ${D.n} pages)` : KIND[D.kind];
  const body = fit(D, cap).map(line).join('\n');
  return `<document>\nTitle: ${it.t}\nAuthors: ${it.a || 'unknown'}\nYear: ${it.y || 'unknown'}\nKind: ${kind}\nShelf: ${D.shelf || it.lane}\n<text>\n${body}\n</text>\n</document>\n\nPick the highlights of this document.`;
}

// ---------------------------------------------------------- verification ----
/** Map each skeleton character of `t` to its index in `t`. */
function skelMap(t) {
  let sk = ''; const at = [];
  for (let i = 0; i < t.length;) {
    const cp = t.codePointAt(i), ch = String.fromCodePoint(cp);
    for (const c of skel(ch)) { sk += c; at.push(i); }
    i += ch.length;
  }
  return { sk, at };
}
/** The span of `t` that `q` matches on its skeleton, widened to the quote's own edge punctuation. */
function snap(t, q) {
  const { sk, at } = skelMap(t);
  const qs = skel(q);
  const i = sk.indexOf(qs);
  if (i < 0 || !qs) return null;
  let s = at[i], e = at[i + qs.length - 1] + 1;
  while (e < t.length && /[^\p{L}\p{N}\s]/u.test(t[e]) && /[^\p{L}\p{N}\s]$/u.test(q.trim())) e++;
  while (s > 0 && /[^\p{L}\p{N}\s]/u.test(t[s - 1]) && /^[^\p{L}\p{N}\s]/u.test(q.trim())) s--;
  return t.slice(s, e);
}
const joinHyph = (s) => sq(s).replace(/(\p{L})[-¬]\s+(\p{Ll})/gu, '$1$2');
/**
 * Find a quote in the blocks: the claimed block first, then the rest; exact
 * (after collapsing whitespace), joined (OCR hyphenation undone), then skel.
 * A skel match outside scans is snapped to the source's own characters.
 */
export function findQuote(D, quote, claimed) {
  const q = sq(quote);
  if (!q) return null;
  const textual = D.blocks.filter((b) => b.kind !== 'img' && b.kind !== 'tbl');
  const order = [...textual.filter((b) => b.m === claimed), ...textual.filter((b) => b.m !== claimed)];
  const src = (b) => b.raw ?? b.t;
  for (const b of order) if (sq(src(b)).includes(q)) return { b, match: 'exact', quote: q };
  for (const b of order) if (joinHyph(src(b)).includes(joinHyph(q))) return { b, match: 'joined', quote: q };
  const qs = skel(q);
  if (qs.length < 15) return null;
  for (const b of order) {
    if (!skel(src(b)).includes(qs)) continue;
    const s = D.kind === 'scan' ? null : snap(sq(src(b)), q);
    return { b, match: 'skel', quote: s || q };
  }
  return null;
}
function placeOf(D, b) {
  const o = { loc: b.m };
  if (D.kind === 'arxiv' && b.sec) o.sec = b.sec;
  if (D.kind === 'web' && b.sec) o.sec = b.sec;
  if (D.kind === 'scan') { o.page = b.page; if (b.label) o.label = String(b.label); }
  return o;
}
function checkQuote(D, q) {
  const hit = findQuote(D, q.quote, q.loc);
  if (!hit) return { quote: sq(q.quote), loc: q.loc, ok: false };
  return { quote: hit.quote, ...placeOf(D, hit.b), ok: true, match: hit.match };
}
/** The figures a pick names, resolved: arXiv figure ids, img<k>/tbl<k> of posts and pages, k<N> of scans. */
function figureOf(D, f) {
  const ref = sq(f.ref).replace(/^\[|\]$/g, '').split(/\s/)[0];
  const base = { ref, kind: f.kind, why: sq(f.why) };
  if (D.kind === 'arxiv') {
    const g = D.figs.find((x) => x.id === ref);
    if (!g || (!g.img && !(g.table && g.html))) return null;
    return { ...base, label: g.label, caption: g.caption ? cutAt(g.caption, 300) : null, ...(g.img ? { img: g.img } : {}), ...(g.table ? { table: true } : {}) };
  }
  if (D.kind === 'scan') {
    const b = D.blocks.find((x) => x.m === ref) || (/^k\d+$/.test(ref) && Number(ref.slice(1)) < D.n ? { page: Number(ref.slice(1)), t: '' } : null);
    if (!b) return null;
    const label = D.labels?.[b.page];
    return { ...base, ...(label ? { label: `p. ${label}` } : {}), caption: b.t ? cutAt(b.t, 120) : null, img: plateImg(D.ia, b.page), page: b.page };
  }
  const b = D.blocks.find((x) => x.m === ref && (x.kind === 'img' || x.kind === 'tbl'));
  if (!b) return null;
  return b.kind === 'img' ? { ...base, caption: b.caption, img: b.img } : { ...base, caption: b.caption, table: true };
}
/**
 * Picks (as the schema gives them) to a stored Highlight: quotes checked and
 * located, numbers whose value is not in their quote dropped, figures
 * resolved (unknown refs dropped), `show` made consistent.
 */
export function verify(D, picks, extra = {}) {
  const passage = picks.passage ? { ...checkQuote(D, picks.passage), why: sq(picks.passage.why) } : null;
  let number = null;
  const n = picks.number;
  if (n && n.value && n.quote) {
    const v = sq(n.value);
    const q = checkQuote(D, n);
    if (sq(q.quote).includes(v) || skel(q.quote).includes(skel(v))) number = { quote: q.quote, loc: q.loc, ...(q.sec ? { sec: q.sec } : {}), ...(q.page != null ? { page: q.page, label: q.label } : {}), value: v, what: sq(n.what), ok: q.ok, ...(q.match ? { match: q.match } : {}) };
  }
  const seen = new Set();
  const figures = [];
  for (const f of picks.figures || []) {
    const g = figureOf(D, f);
    if (g && !seen.has(g.ref) && figures.length < 3) { seen.add(g.ref); figures.push(g); }
  }
  let show = picks.show;
  if (!figures.length) show = 'none';
  else if (show === 'few' && figures.length < 2) show = 'one';
  else if (show === 'none') show = 'one';
  const p = passage && { quote: passage.quote, loc: passage.loc, ...(passage.sec ? { sec: passage.sec } : {}), ...(passage.page != null ? { page: passage.page, label: passage.label } : {}), why: passage.why, ok: passage.ok, ...(passage.match ? { match: passage.match } : {}) };
  return { claim: sq(picks.claim), passage: p, number, figures, show, question: sq(picks.question), ...extra };
}

// ---------------------------------------------------------------- sources ----
/** A Stacks server to read sources through: the one on `port`, or a child started on a spare port. */
export async function connect(port = 4747, { start = true, log = console.log } = {}) {
  const alive = async (p) => { try { const r = await fetch(`http://127.0.0.1:${p}/status`, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; } };
  let child = null, base = `http://127.0.0.1:${port}`;
  if (!(await alive(port))) {
    if (!start) throw new Error(`no Stacks server on port ${port}`);
    const p = port + 37;
    log(`No server on port ${port}; starting one on ${p} for the sources.`);
    child = spawn(process.execPath, [join(HERE, 'server.mjs'), '--port', String(p)], { cwd: HERE, stdio: 'ignore', env: process.env });
    base = `http://127.0.0.1:${p}`;
    let ok = false;
    for (let i = 0; i < 60 && !ok; i++) { await new Promise((r) => setTimeout(r, 500)); ok = await alive(p); }
    if (!ok) { child.kill(); throw new Error('could not start a Stacks server'); }
  }
  const get = async (path, type = 'json') => {
    for (let k = 0; ; k++) {
      const r = await fetch(base + path, { signal: AbortSignal.timeout(180e3) });
      if (r.ok) return type === 'json' ? r.json() : r.text();
      // A source that answered slowly or not at all: try twice more before giving up.
      if (r.status < 500 || k >= 2) throw new Error(`HTTP ${r.status} for ${path.slice(0, 120)}`);
      await new Promise((res) => setTimeout(res, 3000 * (k + 1)));
    }
  };
  return { base, get, close: () => { if (child) child.kill(); } };
}
const proxied = (u) => `/proxy?u=${encodeURIComponent(u)}`;
let lastArxiv = 0;
/** An item's blocks and what the verifier needs, read through the server. Throws with .code when unsupported. */
export async function sourceOf(it, srv, { shelf } = {}) {
  const fail = (code) => Object.assign(new Error(code), { code });
  const meta = { id: it.id, t: it.t, a: it.a, y: it.y || (it.d ? String(it.d).slice(0, 4) : null), lane: it.lane };
  if (it.id.startsWith('arxiv:')) {
    const aid = it.id.slice(6);
    // arXiv: at most about one request a second for pages not yet cached.
    const wait = lastArxiv + 1100 - Date.now(); if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const t0 = Date.now();
    const figs = await srv.get(`/figures?id=${encodeURIComponent(it.id)}&bg=1`);
    if (!Array.isArray(figs)) throw fail('no-html');
    let html = null;
    for (const u of [`https://arxiv.org/html/${aid}`, `https://ar5iv.labs.arxiv.org/html/${aid}`]) {
      try { html = await srv.get(proxied(u), 'text'); if (/ltx_document/.test(html)) break; html = null; } catch { /* next source */ }
    }
    if (Date.now() - t0 > 300) lastArxiv = Date.now(); // it went to the network
    if (!html) throw fail('no-html');
    const blocks = arxivBlocks(html, figs);
    if (!blocks) throw fail('no-html');
    return { kind: 'arxiv', meta, shelf, blocks, figs: figs.map(({ id, label, caption, img, table, html: h }) => ({ id, label, caption, img, table, html: h ? 1 : undefined })) };
  }
  if (it.kind === 'html' && /\/graphql\?/.test(it.url || '')) {
    const j = JSON.parse(await srv.get(proxied(it.url), 'text'));
    const body = j?.data?.post?.result?.htmlBody;
    if (!body) throw fail('no-body');
    const host = new URL(it.url).hostname.replace(/^www\./, '');
    const site = /effectivealtruism/.test(host) ? 'EA Forum' : /alignmentforum/.test(host) ? 'Alignment Forum' : 'LessWrong';
    return { kind: 'post', meta, shelf, site, blocks: postBlocks(body, it.page) };
  }
  if (it.kind === 'web' || (it.kind === 'html' && it.url)) {
    const u = it.url || it.page;
    const html = await srv.get(proxied(u), 'text');
    return { kind: 'web', meta, shelf, host: new URL(u).hostname.replace(/^www\./, ''), blocks: webBlocks(html, u) };
  }
  if (it.kind === 'scan' && it.ia) {
    const [{ pages = [] } = {}, { labels = [] } = {}] = await Promise.all([srv.get(`/ocr/text?ia=${encodeURIComponent(it.ia)}`), srv.get(`/ocr/labels?ia=${encodeURIComponent(it.ia)}`).catch(() => ({}))]);
    if (!pages.some((p) => sq(p).length > 200)) throw fail('no-ocr');
    return { kind: 'scan', meta, shelf, ia: it.ia, n: pages.length || it.n, labels, blocks: scanBlocks(pages, labels) };
  }
  throw fail('unsupported'); // non-arXiv PDFs and plain text: no server-side text yet
}

// ----------------------------------------------------------- batch job ----
const cid = (id) => 'h' + sha1(id).slice(0, 24); // custom_id allows only [A-Za-z0-9_-]{1,64}
const priceOf = (model, inTok) => (LONG[model] && inTok > 100000 ? LONG[model] : PRICES[model] || PRICES['claude-opus-5-5']);
const costOf = (model, u = {}) => { const [pi, po] = priceOf(model, u.input_tokens || 0); return ((u.input_tokens || 0) * pi + (u.cache_creation_input_tokens || 0) * 1.25 * pi + (u.cache_read_input_tokens || 0) * 0.1 * pi + (u.output_tokens || 0) * po) / 1e6; };
const usd = (x) => '$' + Number(x || 0).toFixed(x < 0.1 ? 4 : 2);

/** Today's spend in CACHE/spend.json, shared with summaries (re-read before each write). */
function spendFile(CACHE) { return join(CACHE, 'spend.json'); }
function spentToday(CACHE) { return readJson(spendFile(CACHE), {})[today()]?.usd || 0; }
function charge(CACHE, model, cost, calls) {
  const f = spendFile(CACHE);
  const spend = readJson(f, {});
  const t = (spend[today()] ||= { usd: 0, calls: 0, models: {} });
  t.usd += cost; t.calls += calls;
  const m = (t.models[model] ||= { usd: 0, calls: 0 }); m.usd += cost; m.calls += calls;
  const keep = Object.keys(spend).sort().slice(-90);
  writeAtomic(f, JSON.stringify(Object.fromEntries(keep.map((d) => [d, spend[d]])), null, 1));
}

/** Mock picks from the text alone (STACKS_MOCK_AI=1), to exercise the pipeline without the API. */
function mockPicks(D) {
  const paras = D.blocks.filter((b) => b.kind === 'p' || b.kind === 'page');
  const first = paras[0]?.raw ?? paras[0]?.t ?? '';
  const sent = (t) => (sq(t).match(/[^.!?]+[.!?]/) || [sq(t).slice(0, 200)])[0].trim();
  const withNum = paras.find((b) => /\d+(\.\d+)?\s?(%|x|×|times)/.test(b.raw ?? b.t));
  const numSent = withNum ? (sq(withNum.raw ?? withNum.t).match(/[^.!?]*\d+(\.\d+)?\s?(%|x|×|times)[^.!?]*[.!?]/) || [])[0] : null;
  const cands = D.kind === 'arxiv' ? D.blocks.filter((b) => b.kind === 'cap' && b.main && b.fig?.img).map((b) => b.m) : D.blocks.filter((b) => b.kind === 'img' || b.kind === 'plate').map((b) => b.m);
  return {
    claim: sent(first).slice(0, 220), passage: { quote: sent(paras[Math.min(2, paras.length - 1)]?.raw ?? first), loc: paras[Math.min(2, paras.length - 1)]?.m || 'p0', why: 'Mock pick (STACKS_MOCK_AI): the third paragraph\'s first sentence.' },
    number: numSent ? { value: (numSent.match(/\d+(\.\d+)?\s?(%|x|×|times)/) || [''])[0], what: 'mock', quote: numSent.trim(), loc: withNum.m } : null,
    figures: cands.slice(0, 2).map((ref) => ({ ref, kind: 'result', why: 'Mock pick: an early figure.' })), show: cands.length > 1 ? 'few' : cands.length ? 'one' : 'none',
    question: `What does "${D.meta.t}" find?`,
  };
}

function argsOf(argv) {
  const flag = (k) => argv.includes('--' + k);
  const opt = (k, d = null) => { const j = argv.indexOf('--' + k); return j >= 0 && argv[j + 1] && !argv[j + 1].startsWith('--') ? argv[j + 1] : d; };
  const list = (k) => (opt(k) ? opt(k).split(',').map((s) => s.trim()).filter(Boolean) : null);
  return { flag, opt, list };
}
const ask = (q) => new Promise((r) => { const rl = createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, (a) => { rl.close(); r(a); }); });
const kindOf = (it) => (it.id.startsWith('arxiv:') ? 'arxiv' : it.kind === 'html' && /\/graphql\?/.test(it.url || '') ? 'post' : it.kind === 'web' ? 'web' : it.kind === 'scan' ? 'scan' : 'other');

async function main() {
  const { flag, opt, list } = argsOf(process.argv.slice(2));
  if (flag('help') || flag('h')) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf-8').split('*/')[0].replace(/^#!.*\n\/\*\*?/, '').replace(/^ \* ?/gm, '')); return; }
  const { CACHE } = await import('./server/config.mjs');
  const MOCK = /^(1|true|yes)$/i.test(process.env.STACKS_MOCK_AI || '');
  const model = ALIAS[opt('model')] || opt('model') || process.env.STACKS_HL_MODEL || 'claude-haiku-5-5';
  if (!PRICES[model]) console.warn(`Unknown price for ${model}; estimating at Opus prices.`);
  const effort = opt('effort', 'low');
  const out = resolve(opt('out') || (MOCK ? join(CACHE, 'highlights', 'mock-highlights.json') : join(HERE, 'data', 'highlights.json')));
  const stateF = MOCK ? join(CACHE, 'highlights', 'mock-batch.json') : join(HERE, 'data', 'highlights.batch.json');
  const blocksF = (id) => join(CACHE, 'highlights', `${id}.blocks.json.gz`);
  const state = readJson(stateF, { v: 1, batches: [], refused: {} });
  const saveState = () => writeAtomic(stateF, JSON.stringify(state, null, 1));
  const corpus = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
  const byId = new Map(corpus.items.map((it) => [it.id, it]));
  const shelfOf = (it) => corpus.lanes?.[it.lane] || it.lane;
  const file = () => readJson(out, null) || { v: 1, prompt: PROMPT, built: today(), items: {} };
  const save = (F) => {
    F.prompt = PROMPT; F.built = today();
    F.note ||= 'loc is the block marker the model saw: an arXiv LaTeXML id (S3.SS2.p3, S1.F1), p<N> (the N-th leaf block of a post or wiki page, 0-based), img<N>/tbl<N> (the N-th image or table) or k<N> (a scan page, 0-based). ok: the quote was found in that text; match: exact (after collapsing whitespace), joined (after joining words hyphenated across OCR lines) or skel (letters and digits only; the stored quote is then the source\'s own wording). by/at/usd/tok: model, date, cost at batch prices and tokens in and out.';
    writeAtomic(out, JSON.stringify(F, null, 1) + '\n');
  };

  if (flag('status')) {
    const F = file();
    const n = Object.keys(F.items).length, hand = Object.values(F.items).filter((h) => /^hand/.test(h.by || '')).length;
    console.log(`${out}: ${n} items (${hand} picked by hand), prompt ${F.prompt}.`);
    for (const b of state.batches) console.log(`${b.id}  ${b.done ? 'ended' : b.status}  ${b.model}  ${b.n} items  est ${usd(b.est)}  cost ${usd(b.cost)}  ${b.at}${b.failed?.length ? `  ${b.failed.length} failed` : ''}`);
    console.log(`${Object.keys(state.refused || {}).length} refused (re-run them with --retry-refused).`);
    return;
  }

  const port = Number(opt('port', process.env.STACKS_PORT || 4747));
  let client = null;
  const api = async () => {
    if (client) return client;
    if (!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) throw new Error('Set ANTHROPIC_API_KEY (or run with STACKS_MOCK_AI=1 to try the pipeline without the API).');
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    return (client = new Anthropic());
  };
  let srv = null;
  const source = async () => (srv ||= await connect(port));
  /** Blocks of an item: from the batch's saved copy, or rebuilt from the source. */
  const blocksFor = async (it, saved) => saved?.[it.id] || sourceOf(it, await source(), { shelf: shelfOf(it) });

  /** Store one model answer. Returns a failure reason or null. */
  const store = async (F, it, D, msg, cost, batch) => {
    if (msg.stop_reason === 'refusal') { state.refused[it.id] = { model: msg.model, category: msg.stop_details?.category || null, at: today() }; return 'refusal'; }
    if (msg.stop_reason === 'max_tokens') return 'max_tokens';
    const t = (msg.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    let picks; try { picks = JSON.parse(t); } catch { return 'unparsable'; }
    const u = msg.usage || {};
    F.items[it.id] = verify(D, picks, { by: msg.model + (batch ? '' : ' (interactive)'), at: today(), usd: +cost.toFixed(6), tok: [u.input_tokens || 0, u.output_tokens || 0] });
    delete state.refused[it.id];
    return null;
  };

  /** Collect an ended batch into the output file. */
  async function collect(rec) {
    const F = file();
    let saved = null;
    try { saved = JSON.parse(gunzipSync(readFileSync(blocksF(rec.id))).toString('utf-8')); } catch { /* rebuild from sources */ }
    const c = await api();
    rec.failed = []; let cost = 0, okN = 0;
    for await (const r of await c.messages.batches.results(rec.id)) {
      const id = rec.map[r.custom_id]; const it = id && byId.get(id); if (!it) continue;
      if (r.result?.type !== 'succeeded') { rec.failed.push({ id, why: r.result?.type === 'errored' ? r.result.error?.error?.type || r.result.error?.type || 'errored' : r.result?.type }); continue; }
      const msg = r.result.message;
      const k = 0.5 * costOf(msg.model || rec.model, msg.usage); cost += k;
      let D; try { D = await blocksFor(it, saved); } catch (e) { rec.failed.push({ id, why: 'source: ' + e.message }); continue; }
      const why = await store(F, it, D, msg, k, true);
      if (why) rec.failed.push({ id, why }); else okN++;
    }
    charge(CACHE, rec.model, cost, okN + rec.failed.length);
    Object.assign(rec, { done: true, status: 'ended', cost: +cost.toFixed(4), ended: new Date().toISOString() });
    save(F); saveState();
    console.log(`Batch ${rec.id}: ${okN} highlights written to ${out}, ${rec.failed.length} failed, cost ${usd(cost)}.`);
    const why = {}; for (const f of rec.failed) why[f.why] = (why[f.why] || 0) + 1;
    if (rec.failed.length) console.log('  ' + Object.entries(why).map(([w, n]) => `${n} ${w}`).join(', ') + ' (errored and expired items go into the next run; refusals: --retry-refused)');
  }
  async function wait(rec) {
    const c = await api();
    for (;;) {
      const b = await c.messages.batches.retrieve(rec.id);
      rec.status = b.processing_status; rec.counts = b.request_counts; saveState();
      console.log(`${new Date().toLocaleTimeString()}  ${rec.id}  ${b.processing_status}  ok ${b.request_counts.succeeded} · errored ${b.request_counts.errored} · expired ${b.request_counts.expired} · processing ${b.request_counts.processing}`);
      if (b.processing_status === 'ended') return collect(rec);
      if (flag('no-wait')) { console.log('Not waiting: run this script again later to collect the results.'); return; }
      await new Promise((r) => setTimeout(r, 60e3));
    }
  }

  try {
    // 1. Batches a previous run left open.
    for (const rec of state.batches.filter((b) => !b.done && !b.mock)) {
      console.log(`Resuming batch ${rec.id} (${rec.n} items, submitted ${rec.at}).`);
      await wait(rec);
      if (!rec.done) return;
    }

    // 2. What to do.
    const F0 = file();
    const pending = new Set(state.batches.filter((b) => !b.done).flatMap((b) => Object.values(b.map)));
    const lanes = list('lanes'), ids = list('ids'), kinds = list('kinds') || ['arxiv', 'post', 'web', 'scan'];
    const rank = (a, b) => ((corpus.laneWeights?.[b.lane] ?? 1) * (b.q ?? 0.5) - (corpus.laneWeights?.[a.lane] ?? 1) * (a.q ?? 0.5)) || ((b.score || 0) - (a.score || 0));
    let cands = ids ? ids.map((id) => byId.get(id)).filter(Boolean) : corpus.items.filter((it) => !lanes || lanes.includes(it.lane)).sort(rank);
    const skipped = {};
    const skip = (w) => { skipped[w] = (skipped[w] || 0) + 1; };
    const retry = flag('retry-refused');
    cands = cands.filter((it) => {
      if (!kinds.includes(kindOf(it))) { skip(kindOf(it) === 'other' ? 'without server-side text (non-arXiv PDFs, plain text)' : 'other kinds'); return false; }
      const have = F0.items[it.id];
      if (have && /^hand/.test(have.by || '') && !flag('redo-hand')) { skip('picked by hand'); return false; }
      if (have && F0.prompt === PROMPT && !flag('redo') && !(retry && state.refused[it.id])) { skip('done'); return false; }
      if (pending.has(it.id)) { skip('in an open batch'); return false; }
      if (state.refused[it.id] && !retry) { skip('refused before (--retry-refused)'); return false; }
      if (retry && !state.refused[it.id]) return false;
      return true;
    }).slice(0, Number(opt('limit', 100000)));
    if (!cands.length) { console.log('Nothing to do.' + (Object.keys(skipped).length ? ' Skipped: ' + Object.entries(skipped).map(([w, n]) => `${n} ${w}`).join(', ') + '.' : '')); return; }

    // 3. Texts.
    console.log(`Reading ${cands.length} items through ${(await source()).base} ...`);
    const reqs = [], docs = {};
    let i = 0;
    for (const it of cands) {
      i++;
      try {
        const D = await sourceOf(it, srv, { shelf: shelfOf(it) });
        const cap = flag('lean') && D.kind !== 'scan' ? LEAN_CAP : CAP;
        const u = userText(D, cap);
        reqs.push({ it, D, u, chars: u.length + SYSTEM.length + JSON.stringify(SCHEMA).length });
        docs[it.id] = D;
      } catch (e) { skip(e.code ? `no text (${e.code})` : `source error`); if (!e.code) console.warn(`  ${it.id}: ${e.message}`); }
      if (i % 50 === 0) console.log(`  ${i}/${cands.length}`);
    }

    // 4. Estimate.
    let cpt = CPT;
    const nCount = Number(opt('count-tokens', 0));
    if (nCount > 0 && !MOCK && reqs.length) {
      const c = await api(); let ch = 0, tok = 0;
      for (const r of reqs.slice(0, nCount)) {
        const p = params(model, r.u, effort);
        const t = await c.messages.countTokens({ model, system: p.system, messages: p.messages });
        ch += r.chars - JSON.stringify(SCHEMA).length; tok += t.input_tokens;
      }
      cpt = ch / tok;
      console.log(`Measured ${cpt.toFixed(2)} characters a token on ${Math.min(nCount, reqs.length)} requests.`);
    }
    for (const r of reqs) { r.inTok = Math.round(r.chars / cpt); const [pi, po] = priceOf(model, r.inTok); r.est = 0.5 * (r.inTok * pi + OUT_TOKENS * po) / 1e6; }
    const budget = Number.isFinite(parseFloat(process.env.STACKS_DAILY_BUDGET)) ? parseFloat(process.env.STACKS_DAILY_BUDGET) : 3;
    const cap = opt('max-usd') != null ? Number(opt('max-usd')) : retry ? Infinity : Math.max(0, budget - spentToday(CACHE));
    let sum = 0; const send = [];
    for (const r of reqs) { if (sum + r.est > cap) { skip('over --max-usd'); continue; } sum += r.est; send.push(r); }
    const byKind = {}; for (const r of send) byKind[r.D.kind] = (byKind[r.D.kind] || 0) + 1;
    const inTok = send.reduce((n, r) => n + r.inTok, 0);
    console.log(`\n${send.length} requests on ${model} (${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ')}), about ${(inTok / 1e6).toFixed(2)}M input tokens at ${cpt.toFixed(1)} characters a token and ${OUT_TOKENS} output tokens each.`);
    console.log(`Estimated cost: ${usd(sum)}${retry ? ' (interactive calls at standard prices: double this)' : ' at batch prices'}${Number.isFinite(cap) ? `; cap ${usd(cap)}` : ''}.`);
    if (Object.keys(skipped).length) console.log('Left out: ' + Object.entries(skipped).map(([w, n]) => `${n} ${w}`).join(', ') + '.');
    if (!send.length || flag('dry')) return;
    if (!flag('yes') && !MOCK) {
      const a = await ask(`Submit ${send.length} requests for about ${usd(retry ? 2 * sum : sum)}? [y/N] `);
      if (!/^y(es)?$/i.test(a.trim())) { console.log('Not submitted.'); return; }
    }

    // 5a. Mock: answer at once.
    if (MOCK) {
      const F = file();
      for (const r of send) F.items[r.it.id] = verify(r.D, mockPicks(r.D), { by: 'mock', at: today(), usd: 0, tok: [Math.round(r.chars / cpt), 0] });
      save(F);
      console.log(`Mock: ${send.length} entries written to ${out}.`);
      return;
    }
    // 5b. Refusals: one at a time on the interactive API, with server-side fallback.
    if (retry) {
      const c = await api(); const F = file(); let cost = 0, n = 0;
      const m = opt('model') ? model : 'claude-sonnet-5-5';
      for (const r of send) {
        const p = params(m, r.u, effort);
        const fb = m !== 'claude-haiku-5-5' ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {};
        try {
          const msg = await c.beta.messages.create({ ...p, ...fb });
          const k = costOf(msg.model || m, msg.usage); cost += k;
          const why = await store(F, r.it, r.D, msg, k, false);
          console.log(`  ${r.it.id}: ${why || 'ok'}`); if (!why) n++;
        } catch (e) { console.log(`  ${r.it.id}: ${e.message}`); }
      }
      charge(CACHE, m, cost, send.length); save(F); saveState();
      console.log(`${n} of ${send.length} refused items now have highlights; cost ${usd(cost)}.`);
      return;
    }
    // 5c. Submit, in pieces well inside the 100,000-request / 256 MB limits.
    const c = await api();
    const pieces = []; let cur = [], bytes = 0;
    for (const r of send) {
      const b = Buffer.byteLength(r.u) + 12000;
      if (cur.length && (cur.length >= 10000 || bytes + b > 180e6)) { pieces.push(cur); cur = []; bytes = 0; }
      cur.push(r); bytes += b;
    }
    if (cur.length) pieces.push(cur);
    for (const piece of pieces) {
      const batch = await c.messages.batches.create({ requests: piece.map((r) => ({ custom_id: cid(r.it.id), params: params(model, r.u, effort) })) });
      const rec = { id: batch.id, model, effort, prompt: PROMPT, at: new Date().toISOString(), n: piece.length, est: +piece.reduce((n, r) => n + r.est, 0).toFixed(4), cost: 0, status: batch.processing_status, map: Object.fromEntries(piece.map((r) => [cid(r.it.id), r.it.id])), done: false };
      // The blocks each request saw, to check its quotes against when the results come back.
      mkdirSync(join(CACHE, 'highlights'), { recursive: true });
      writeFileSync(blocksF(batch.id), gzipSync(JSON.stringify(Object.fromEntries(piece.map((r) => [r.it.id, docs[r.it.id]])))));
      state.batches.push(rec); saveState();
      console.log(`Submitted ${batch.id}: ${piece.length} requests, estimated ${usd(rec.est)}.`);
    }
    for (const rec of state.batches.filter((b) => !b.done)) { await wait(rec); if (!rec.done) break; }
  } finally { srv?.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(() => process.exit(0), (e) => { console.error(e.message || e); process.exit(1); });
}
