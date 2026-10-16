#!/usr/bin/env node
/**
 * Threads for the Feeds view: one short thread per item (a hook, then what was
 * found, how, the figure, what it changes, the caveat and what to read),
 * written by Claude Haiku from the item's whole text, with every post anchored
 * to a quote that software finds again in that text. Design, format and rules:
 * docs/feeds/threads.md. Output: data/threads.json, served by
 * server/routes/67-threads.mjs to the Threads feed and the side panel.
 *
 *   node threads.mjs [--lanes a,b] [--ids x,y] [--kinds arxiv,post,web,scan,pdf] [--limit 50]
 *                    [--model claude-haiku-5-5] [--concurrency 3] [--dry-run] [--yes]
 *                    [--redo] [--retry] [--port 4747] [--out data/threads.json]
 *   node threads.mjs verify [--ids x,y] [--lanes a,b] [--mode strict|quotes] [--port 4747] [--out …]
 *   node threads.mjs merge <file.json>… [--no-fetch] [--port 4747] [--out …]
 *
 * Write (the default): items with no thread yet (--redo: again; threads written
 * by hand are never replaced), in corpus order, narrowed by --lanes, --ids,
 * --kinds and --limit. For each: the source text as marked blocks, the same
 * input as the highlights (highlights-batch.mjs: arXiv LaTeXML, post htmlBody,
 * a web page's main content, a scan's OCR pages; and PDFs as pdftotext pages,
 * when poppler is installed); one call with the rules and three hand-written
 * exemplar threads first, marked for prompt caching (byte-identical in every
 * request, so after the first request they cost a tenth); then the verifier
 * (verifyThread, section 4 of the design): quotes found again (exact, then
 * with OCR hyphenation joined, then on letters and digits) in the block the
 * post names or anywhere, pages computed from where each quote sits in the PDF
 * text, numbers, number words and quoted phrases checked against the full
 * text, figures resolved; a post that fails is dropped, and a thread without
 * its hook or with fewer than 4 posts is not written (the reason goes to
 * CACHE/threads/failed.json, and the item is skipped for 7 days unless
 * --retry). Each accepted thread is merged into the file at once (the file is
 * re-read first, so other writers' edits stay).
 *
 * Cost: the plan and an estimate come first (typical document sizes per kind;
 * Haiku at about a third of a cent an item); when the estimate is more than
 * what is left of today's AI budget (STACKS_DAILY_BUDGET, default $3, minus
 * today's spend in CACHE/spend.json) it stops unless --yes. --dry-run prints
 * the plan and stops. Calls go through the summaries' model plumbing
 * (server/routes/30-summarize.mjs: ANTHROPIC_API_KEY, streaming, spend), as
 * tag-corpus.mjs does; run it with the server stopped if the spend record
 * matters (the server keeps its own copy of today's spend).
 *
 * Sources come through a Stacks server on --port (default 4747, so its disk
 * cache and politeness rules apply); without one, one is started on a spare
 * port and stopped at the end. STACKS_MOCK_AI=1 writes deterministic threads
 * built from the source's own sentences, without the API, to
 * CACHE/threads/mock-threads.json unless --out is given.
 *
 * verify: re-checks threads already in the file against freshly fetched
 * sources (what an agent runs after writing threads by hand; the `thread`
 * agent job asks for it). --mode strict (default) applies the writing rules;
 * --mode quotes drops only posts whose quote is not found and flags the rest.
 * merge: validates thread files (the format of data/threads.json), re-checks
 * their quotes (--mode quotes) unless --no-fetch, and merges them in.
 *
 * The module exports the pieces (prompt, schema, source builder, verifier,
 * mock), which test/threads-core.test.mjs exercises.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execFile } from 'child_process';
import { createHash } from 'crypto';
import { connect, sourceOf, fit, findQuote as blockQuote, sq, skel, CAP } from './highlights-batch.mjs';
import { clean as cleanFile, cleanThread, KINDS } from './server/routes/67-threads.mjs';
import { decode } from './server/routes/65-figures.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const VERSION = 'threads-v1';
const MOCK = /^(1|true|yes)$/i.test(process.env.STACKS_MOCK_AI || '');
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const today = () => new Date().toLocaleDateString('en-CA');
const readJson = (f, d = null) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return d; } };
const usd = (x) => '$' + Number(x || 0).toFixed(x < 0.1 ? 4 : 2);
const fail = (code, msg) => Object.assign(new Error(msg || code), { code });

// ------------------------------------------------------------------ prompt ----
/** The rules: docs/feeds/threads.md section 5, standalone (not appended to the highlights prompt). */
export const SYSTEM = `You write a short thread about one document for a reader who runs a forecasting and epistemics research institute and reads AI safety, machine learning, forecasting, rationality and old technical books. They know these fields, dislike hype, and want precise, checkable statements with uncertainty stated. The thread lets them decide in seconds whether to open the document, and leaves them with the result if they don't.

The document arrives as blocks, each opening with a marker in square brackets:
- [abstract], [S3.SS2.p3]: the abstract and paragraphs of an arXiv paper (the LaTeXML id encodes the section, here §3.2); [S1.F2], [S2.T1]: figure and table captions.
- [p41]: the 42nd paragraph of a post or wiki page; [img6]: its 7th image, with its caption or "no caption"; [tbl0]: a table, with its header row.
- [k120 p.100]: page 120 of a scanned book (OCR text), printed page 100; [k27 plate]: a page that is mostly a picture.
- [p. 7]: page 7 of a PDF, as text extracted from it; its figures are not shown, so cite a figure by the page it is on.
Lines starting with # are section headings, there for orientation. Refer to places only by these markers, copied exactly without the brackets (k120, not k120 p.100; p. 7 for a PDF page).

Before writing, find in the document: (a) the result a reader who knows the field would not have predicted; (b) every hedge attached to it ("we expect", "we hypothesise", "illustrative", "suggests", "in one example"); (c) its own limitations, footnotes and alternative explanations.

Posts, in this order:
1. hook (always): the single most interesting true thing, which is (a), not the known result the document builds on. State the result itself, with the condition it depends on (the model, the sample, the assumption, "in a toy model"). If it rests on one example, call it one example and give the aggregate if the document has one. At most 3 sentences and 260 characters.
2. finding (always): what they found, with numbers and conditions. Give an overall or pooled estimate before a subgroup's, and keep "not significant" when the document says it.
3. method: how, in one or two sentences, starting "How:". Say "a model, not data" when it is one.
4. figure: the figure, table or plate that carries the result, cited by its marker, and what to see in it. Values you read off a chart rather than from the text: say "about", end with "Values read off the chart.", and set approx to true. If a reading disagrees with a number the text states, say so. Leave this post out when nothing is worth looking at, or when you cannot see the figure (PDF pages).
5. implication: start "What it changes:" and name the decision, practice or belief that should change, and when. Never "anyone who".
6. caveat (always): start "Caveat:" or "Limits:". One caveat: the one that, if true, most weakens the hook. Prefer one from (c). No asides.
7. read (always): "Read it if" and a specific reader, then which sections or pages are worth the time, and what to skip; give spans as marker pairs for the recommended ranges only.
Every post adds a fact no earlier post gave; a number comes back only to add its interval, or in the caveat that qualifies it. Cut a post rather than pad one: four posts (hook, finding, caveat, read) are fine. Posts after the hook: at most 280 characters.

Every post cites one place: loc, the marker of the block its quote comes from; fig, for the figure post, the marker of the figure, table, image or page it describes ("" otherwise); quote, a contiguous piece of that one block of at most 25 words, copied character for character (no ellipses, no stitching, no markers; in scans you may join a word hyphenated across a line). Choose the quote that best supports the post's main claim.

Words:
- Plain words, short sentences. No hype words, emoji, hashtags or "a thread". No questions you don't answer, no cliffhangers.
- Every number, and every number word (half, twice, a tenth, hundreds, thousands, nine-tenths), must appear in the document, except chart readings in the figure post. No size words the document does not use ("short", "large pool"). Do not compute new numbers. If the document gives two values for the same thing, give both, each with where it comes from, or neither; prefer neither when the post does not need it.
- Paraphrase may shorten, never strengthen. Keep the direction of a rule ("if not A then B" is not "if A then not B"), its units, its scope and its comparisons. Describe a selection as it was done.
- Keep every hedge from (b) in the sentence that makes the claim, in the document's own word. What the authors expect, hypothesise or illustrate is not what they showed.
- Put words in quotation marks only when they are copied exactly from the document.
- Use only the document; say who did the work, and spell names, only as it does.
- Write for someone who knows the field but not this document; define a term in a few words the first time it appears.
Software checks every quote, number, number word and quoted phrase against the document and deletes any post that fails. It flags any post whose cited block hedges when the post does not.

tags: 3 to 5 lowercase topic tags.

Three example threads follow, written by hand for other documents and checked against them. Match their judgment, density and form; take nothing from their content.`;

/** The exemplars shown to the model (docs/feeds/threads.md section 5): a contrast hook from a paper's footnoted
 *  caveat, the unpredicted result over the textbook one in a post, and a scanned book. */
export const EXEMPLARS = ['arxiv:2312.10029', 'lw:nnDTgmzRrzDMiPF9B', 'ia:manualforsolutio00hittrich'];
// The arXiv exemplar's read spans as section markers (the stored form has 0-based PDF pages, which the model never sees).
const SPAN_MARKERS = { 'arxiv:2312.10029': [['S4.SS1', 'S4.SS3'], ['S3', 'S3'], ['S6', 'S6']] };
const KIND_LABEL = { arxiv: 'arXiv paper (from its HTML)', post: 'post', web: 'web page', scan: 'scanned book (OCR text)', pdf: 'PDF (text extracted from it)' };
const kindOfId = (id) => (id.startsWith('arxiv:') ? 'arxiv' : /^(lw|eaf):/.test(id) ? 'post' : id.startsWith('web:') ? 'web' : /^(ia|bstj):/.test(id) ? 'scan' : 'pdf');
/** A stored thread in the form the model answers in. */
export function asAnswer(id, th) {
  const k = kindOfId(id);
  const mark = (x) => (typeof x !== 'number' ? x : k === 'scan' ? `k${x}` : `p. ${x + 1}`);
  return {
    posts: th.posts.map((p) => {
      const c = p.cite || {};
      const loc = c.loc || (c.page != null ? mark(c.page) : '');
      const spans = p.kind === 'read' ? (SPAN_MARKERS[id] || (c.spans || []).map((s) => s.map(mark))) : [];
      return { kind: p.kind, t: p.t, approx: !!p.approx, cite: { loc, fig: c.fig ? String(c.fig) : '', quote: c.quote, spans } };
    }),
    tags: th.tags || [],
  };
}
/** The cached prefix: the rules, then the exemplars (byte-identical across a run). */
export function prefixOf(data) {
  const ex = EXEMPLARS.map((id) => {
    const th = data?.items?.[id];
    if (!th) return null;
    return `<example kind="${KIND_LABEL[kindOfId(id)]}" title="${String(th.title || id).replace(/"/g, "'")}">\n${JSON.stringify(asAnswer(id, th))}\n</example>`;
  }).filter(Boolean);
  return `${SYSTEM}\n\n${ex.join('\n\n')}`;
}

const str = (description) => ({ type: 'string', description });
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
/** Structured output (every field required; optional ones are "" or []). */
export const SCHEMA = obj({
  posts: {
    type: 'array', description: '4 to 7 posts in order, hook first.',
    items: obj({
      kind: { type: 'string', enum: KINDS },
      t: str('One paragraph. Hook at most 260 characters, others at most 280.'),
      approx: { type: 'boolean', description: 'True only for a figure post giving values read off a chart.' },
      cite: obj({
        loc: str('The marker of the block the quote comes from, copied exactly without brackets: S5.SS3.p1, abstract, p52, img6, k72, p. 7.'),
        fig: str('Figure post: the marker of the figure, table, image or page it describes (S1.F4, img6, tbl0, k27, p. 7); otherwise "".'),
        quote: str('At most 25 words copied exactly from the block named by loc.'),
        spans: { type: 'array', description: 'Read post: [from, to] marker pairs of the recommended ranges; otherwise [].', items: { type: 'array', items: { type: 'string' } } },
      }),
    }),
  },
  tags: { type: 'array', items: { type: 'string' }, description: '3 to 5 lowercase topic tags.' },
});

// ---------------------------------------------------------------- sources ----
/** Which source an item has: arxiv, post, web, scan, pdf, or null (plain text, your own files: none yet). */
export const srcKind = (it) => (it.id.startsWith('arxiv:') ? 'arxiv'
  : it.kind === 'html' && /\/graphql\?/.test(it.url || '') ? 'post'
    : it.kind === 'web' || (it.kind === 'html' && it.url) ? 'web'
      : it.kind === 'scan' && it.ia ? 'scan'
        : it.kind === 'pdf' && /^https?:\/\//.test(it.url || '') && it.lane !== 'local' ? 'pdf' : null);
const proxied = (u) => `/proxy?u=${encodeURIComponent(u)}`;
const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, { maxBuffer: 256 << 20, timeout: 120000 }, (e, out) => (e ? rej(e) : res(out))));
let popplerP = null;
const hasPdftotext = () => (popplerP ||= new Promise((r) => execFile('pdftotext', ['-v'], { timeout: 5000 }, (e) => r(!e || e.code !== 'ENOENT'))));
/** A PDF's text, one string per page (pdftotext, reading order), fetched through the server's cache; null without poppler. */
export async function pdfPages(srv, url) {
  if (!(await hasPdftotext())) return null;
  const r = await fetch(srv.base + proxied(url), { signal: AbortSignal.timeout(180e3) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for the PDF`);
  const buf = Buffer.from(await r.arrayBuffer());
  const at = buf.indexOf('%PDF-');
  if (at < 0 || at > 1024) throw fail('not-pdf', 'not a PDF');
  const f = join(tmpdir(), `stacks-threads-${process.pid}-${sha1(url).slice(0, 12)}.pdf`);
  writeFileSync(f, buf);
  try {
    const out = await run('pdftotext', ['-enc', 'UTF-8', f, '-']);
    const pages = out.split('\f').map((t) => t.replace(/\s+/g, ' ').trim());
    while (pages.length && !pages.at(-1)) pages.pop();
    return pages;
  } finally { try { unlinkSync(f); } catch { /* gone */ } }
}
/** Visible text of an HTML page, plus its aria-labels (charts drawn as inline SVG state their numbers there). */
export function htmlText(html) {
  const s = String(html || '');
  const aria = [...s.matchAll(/aria-label="([^"]{3,})"/g)].map((m) => decode(m[1]));
  return sq(decode(s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')) + ' ' + aria.join(' '));
}
/**
 * The item's blocks (as the highlights see them) and what the verifier needs: `full` (every
 * number and phrase the document holds: block text, plus the PDF text for arXiv papers, the
 * raw page for posts and web pages, tables and chart labels included) and `pages` (PDF page
 * texts, to compute the page of each quote). Throws {code} when there is no source.
 */
export async function sourceFor(it, srv, { pdf = true } = {}) {
  let kind = srcKind(it);
  if (!kind) throw fail('unsupported');
  const meta = { id: it.id, t: it.t, a: it.a, y: it.y || (it.d ? String(it.d).slice(0, 4) : null), lane: it.lane };
  let D = null;
  if (kind === 'arxiv') {
    try { D = await sourceOf(it, srv); } catch (e) { if (e.code !== 'no-html') throw e; kind = 'pdf'; } // no LaTeXML HTML: the PDF's text, as for any PDF
  }
  if (kind === 'pdf') {
    const pages = await pdfPages(srv, it.url);
    if (!pages) throw fail('no-pdftotext', 'PDFs without HTML need poppler (pdftotext)');
    if (pages.join('').replace(/\s+/g, '').length < 800) throw fail('no-text', 'the PDF has no text layer');
    const blocks = pages.map((t, k) => ({ m: `p. ${k + 1}`, t, kind: 'page', page: k })).filter((b) => b.t.length >= 8);
    return { kind: 'pdf', meta, blocks, pages, n: pages.length, full: pages.join('\n') };
  }
  D ||= await sourceOf(it, srv);
  const extra = [];
  try {
    if (kind === 'arxiv' && pdf) { D.pages = await pdfPages(srv, it.url); if (D.pages) extra.push(D.pages.join('\n')); }
    else if (kind === 'post') extra.push(htmlText(JSON.parse(await srv.get(proxied(it.url), 'text'))?.data?.post?.result?.htmlBody));
    else if (kind === 'web') extra.push(htmlText(await srv.get(proxied(it.url || it.page), 'text')));
  } catch (e) { D.extraErr = e.message; }
  D.full = D.blocks.map((b) => b.raw ?? b.t).join('\n') + '\n' + extra.join('\n');
  return D;
}

const line = (b) => (b.kind === 'h' && !/^p\d/.test(b.m) ? `${'#'.repeat(Math.min(3, b.level || 1))} ${b.t}` : `[${b.head || b.m}] ${b.t}`);
/** The user message: the document as marked blocks, within CAP characters (section 5 of llm-highlights.md). */
export function docText(D, cap = CAP) {
  const it = D.meta;
  const blocks = D.kind === 'pdf' ? fit({ ...D, kind: 'scan' }, cap) : fit(D, cap); // long PDFs: the front, the end and evenly between, as scans
  const kind = D.kind === 'post' ? `${D.site || 'forum'} post` : D.kind === 'web' ? `web page (${D.host})` : D.kind === 'scan' ? `scanned book (OCR text, ${D.n} pages)` : D.kind === 'pdf' ? `PDF (text extracted from it, ${D.n} pages)` : KIND_LABEL[D.kind];
  return `<document>\nTitle: ${it.t}\nAuthors: ${it.a || 'unknown'}\nYear: ${it.y || 'unknown'}\nKind: ${kind}\nShelf: ${D.shelf || it.lane}\n<text>\n${blocks.map(line).join('\n')}\n</text>\n</document>\n\nWrite the thread about this document.`;
}

// ----------------------------------------------------------- verification ----
/** Page (0-based) where a piece of text starts in the PDF page texts, or null. A quote that runs over a page
 *  break (a running head or page number in between) is placed by its longest prefix found, at least 24 letters. */
export function pageOfText(D, text) {
  if (!D.pages?.length) return null;
  if (!D._pix) { let sk = ''; const at = []; for (const t of D.pages) { at.push(sk.length); sk += skel(t); } D._pix = { sk, at }; }
  const q = skel(text);
  if (q.length < 12) return null;
  let i = D._pix.sk.indexOf(q);
  if (i < 0 && q.length > 24) {
    let lo = 24, hi = q.length - 1; // the longest prefix found: found(L) implies found(L - 1)
    if (D._pix.sk.indexOf(q.slice(0, lo)) >= 0) { while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (D._pix.sk.indexOf(q.slice(0, mid)) >= 0) lo = mid; else hi = mid - 1; } i = D._pix.sk.indexOf(q.slice(0, lo)); }
    else { const tail = q.slice(-24); i = D._pix.sk.indexOf(tail); } // the start is garbled (math, ligatures): the end's page
  }
  if (i < 0) return null;
  let k = 0; while (k + 1 < D._pix.at.length && D._pix.at[k + 1] <= i) k++;
  return k;
}
/** Page of a block marker (an arXiv section or paragraph id; a scan's k<N>; a PDF's p. N): its first (or last) paragraph's page. */
export function pageOfMarker(D, m, end = false) {
  if (typeof m === 'number') return m;
  const s = String(m || '').trim();
  let x;
  if ((x = /^k(\d+)\b/.exec(s))) return Number(x[1]);
  if (D.kind === 'pdf' && (x = /^p\.?\s*(\d+)$/i.exec(s))) return Number(x[1]) - 1;
  if (D.kind !== 'arxiv') return null;
  const inside = D.blocks.filter((b) => (b.m === s || b.m.startsWith(s + '.')) && b.kind === 'p');
  const b = end ? inside.at(-1) : inside[0];
  return b ? pageOfText(D, (b.raw ?? b.t).slice(0, 160)) : null;
}
/** The block a cite names: its loc (normalized), else its page as a block marker. */
function claimedOf(D, c) {
  let loc = typeof c.loc === 'string' ? c.loc.trim().replace(/^\[|\]$/g, '') : '';
  if (D.kind === 'scan') loc = loc.split(/\s/)[0];
  const pm = /^p\.?\s*(\d+)$/i.exec(loc);
  if (D.kind === 'pdf' && pm) loc = `p. ${pm[1]}`;
  if (!loc && Number.isInteger(c.page)) loc = D.kind === 'pdf' ? `p. ${c.page + 1}` : D.kind === 'scan' ? `k${c.page}` : '';
  return loc;
}
function placeOf(D, b, quote) {
  const o = {};
  if (D.kind === 'pdf') o.page = b.page;
  else if (D.kind === 'scan') { o.loc = b.m; o.page = b.page; if (b.label) o.label = String(b.label); }
  else { o.loc = b.m; if (b.sec) o.sec = b.sec; }
  if (D.kind === 'arxiv') { const k = pageOfText(D, quote); if (k != null) o.page = k; }
  return o;
}
const ws = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const joinHyph = (s) => ws(s).replace(/(\p{L})[-¬]\s+(\p{Ll})/gu, '$1$2');
/** Found anywhere in the full text (tables, chart labels, the PDF): exact, joined or skeleton. */
function inFull(D, q) {
  if (!D._full) D._full = { ws: ws(D.full), j: joinHyph(D.full), sk: skel(D.full || '') };
  if (D._full.ws.includes(ws(q))) return 'exact';
  if (D._full.j.includes(joinHyph(q))) return 'joined';
  const s = skel(q);
  return s.length >= 12 && D._full.sk.includes(s) ? 'skel' : null;
}
// Numbers (section 4, check 3): every number in a post must be in the source, section and page references aside.
export function numbersIn(t) {
  const t2 = String(t).replace(/§\s?[\d.–-]+/g, ' ').replace(/\bpp?\. [\dvixlc]+(?:[–-]\d+)?/g, ' ').replace(/\b(?:img|fig|tbl|k|p|T|S)\d+\b/g, ' ').replace(/\bT5\b/g, ' ');
  const out = [];
  for (const m of t2.matchAll(/(?<![A-Za-z\d.])[−-]?\d[\d,]*(?:\.\d+)?/g)) {
    let s = m[0].replace(/,/g, '').replace(/−/g, '-');
    if (s.startsWith('-') && m.index > 0 && /[\p{L}\p{N}]/u.test(t2[m.index - 1])) s = s.slice(1);
    s = s.replace(/\.$/, '');
    if (s) out.push(s);
  }
  return out;
}
// Two forms of the text: thousands separators (commas) removed with every space kept, so a table's "48.0 21.0"
// does not run together; and with spaces before three digits joined too ("10 000"). A number may be in either.
const numText = (full) => { const a = ws(full).replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/−/g, '-'); return [a, a.replace(/(\d)[ \u2009\u202f](?=\d{3}(?!\d))/g, '$1')]; };
const numIn = (n, srcs) => { const re = new RegExp('(?<![\\d.])' + n.replace(/^-/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\d]|\\.\\d)'); return srcs.some((s) => re.test(s)); };
const NUMW = ['half', 'halve', 'third', 'quarter', 'tenth', 'twice', 'double', 'triple', 'dozen', 'hundred', 'thousand', 'million', 'billion'];
const NUMW_VAL = { half: /\b(?:50 ?%|50 percent|fifty percent|0\.5)\b/i, tenth: /\b(?:10 ?%|10 percent|0\.1)\b/i, quarter: /\b(?:25 ?%|0\.25)/i, third: /\b(?:33 ?%|1\/3)/i, twice: /\b(?:2 ?x|2×|two times)/i, double: /\b(?:2 ?x|2×|two times)/i };
const QUOTED = /(?:(?<=[\s(])|^)['‘“"]([^'’”"]+?)['’”"](?=[\s,.;:)]|$)/g;
const LEAD = { method: /^How\b/, implication: /^What it changes:/, caveat: /^(Caveat|Limits):/, read: /^Read it if/ };
const BANNED = /\b(groundbreaking|game-changing|revolutionary|huge|stunning|breakthrough)\b|(^|\s)#\w|\ba thread\b|^\d+\/|\p{Extended_Pictographic}/iu;
const HEDGE_SRC = /\b(?:we|they|I|authors?) (?:expect|hypothesi[sz]e|speculate|suspect|conjecture)|\billustrative|\bsuggests?\b|\bcandidate\b/i;
const HEDGE_POST = /\b(expect|hypothes|speculat|illustrat|suggest|seems?|may|might|perhaps|probably|candidate|authors? (?:say|call|read|report|take|note|list)|in (?:one|the page)|toy|example|could)/i;
const SUBSTANCE = new Set(['finding', 'figure', 'implication', 'caveat']);

/** A figure marker resolved against the source: {fig, img?, page?, label?}, or null. */
function figureOf(D, ref) {
  const r = String(ref || '').trim().replace(/^\[|\]$/g, '');
  if (!r) return null;
  let x;
  if (D.kind === 'arxiv') {
    const g = (D.figs || []).find((f) => f.id === r);
    if (!g) return null;
    const page = pageOfText(D, String(g.caption || '').slice(0, 200));
    return { fig: r, ...(g.img ? { img: g.img } : {}), ...(page != null ? { page } : {}) };
  }
  if (D.kind === 'scan') { if ((x = /^k(\d+)\b/.exec(r)) && Number(x[1]) < (D.n || Infinity)) { const k = Number(x[1]); const label = D.labels?.[k]; return { fig: `k${k}`, page: k, ...(label ? { label: String(label) } : {}) }; } return null; }
  if (D.kind === 'pdf') { if ((x = /^p\.?\s*(\d+)$/i.exec(r)) && Number(x[1]) >= 1 && Number(x[1]) <= D.n) return { fig: `p. ${x[1]}`, page: Number(x[1]) - 1 }; if ((x = /^(\d+)\.\d+$/.exec(r)) && Number(x[1]) < D.n) return { fig: r, page: Number(x[1]) }; return null; }
  const b = D.blocks.find((y) => y.m === r && (y.kind === 'img' || y.kind === 'tbl'));
  if (!b) return null;
  return b.kind === 'img' ? { fig: r, img: b.img } : { fig: r };
}

/**
 * Check a thread against its source (docs/feeds/threads.md section 4) and give the stored form.
 * `raw`: the model's answer ({posts, tags}) or a stored thread (its places are re-derived).
 * A quote is looked for in the block its loc names, then in every block, then anywhere in the
 * document's full text (match 'full': table cells, footnotes, chart labels).
 * mode 'strict' (written by a model or an agent): a post whose quote, a number, a number word or a
 * quoted phrase is not found, or whose figure does not resolve, is dropped; 'quotes' (re-checking
 * hand-checked threads, whose checks saw text this fetch may lack): only a post whose quote is found
 * nowhere is dropped, and the rest become flags.
 * → {thread | null, reasons, flags, dropped: [{n, kind, why}]}
 */
export function verifyThread(D, raw, { mode = 'strict', keep = null } = {}) {
  const strict = mode === 'strict';
  const flags = [], dropped = [], posts = [];
  const fullN = numText(D.full || '');
  let nTot = 0, nOk = 0, figure = null;
  const inp = Array.isArray(raw?.posts) ? raw.posts : [];
  inp.forEach((p, j) => {
    const n = j + 1, kind = p?.kind, t = ws(p?.t);
    const c = p?.cite && typeof p.cite === 'object' ? p.cite : {};
    const drop = (why) => { dropped.push({ n, kind, why }); };
    const flag = (why) => flags.push(`post ${n} (${kind}): ${why}`);
    if (!KINDS.includes(kind) || !t) return drop('malformed');
    const quote = ws(c.quote);
    if (!quote) return drop('no quote');
    const words = quote.split(' ').length;
    if (words > 25) { if (strict) return drop(`quote of ${words} words`); flag(`quote of ${words} words`); }
    // 1. the quote, in the block it names, then anywhere; 2. its place.
    const claimed = claimedOf(D, c);
    const hit = blockQuote(D, quote, claimed);
    let cite;
    if (hit) {
      cite = { quote: hit.quote, ...placeOf(D, hit.b, hit.quote), ok: true, match: hit.match };
      if (claimed && hit.b.m !== claimed && !(D.kind === 'scan' && claimed.split(/\s/)[0] === hit.b.m)) flag(`quote found in ${hit.b.m}, not ${claimed}`);
    } else {
      // Not in a block, but in the document: a table cell, a footnote (the blocks leave notes out), a chart's labels.
      const m = inFull(D, quote);
      if (!m) return drop('quote not found');
      cite = { quote, ...(c.loc ? { loc: c.loc } : {}), ...(c.sec ? { sec: c.sec } : {}), ...(Number.isInteger(c.page) ? { page: c.page } : {}), ok: true, match: 'full' };
      if (D.kind === 'arxiv') { const k = pageOfText(D, quote); if (k != null) cite.page = k; }
    }
    if (Number.isInteger(c.page) && cite.page != null && c.page !== cite.page) flag(`page ${c.page + 1} → ${cite.page + 1}, where the quote is`);
    if (cite.page == null && Number.isInteger(c.page) && D.kind === 'arxiv') { cite.page = c.page; flag(`page ${c.page + 1} kept: the quote was not found in the PDF text`); }
    if (c.label && !cite.label && cite.page === c.page) cite.label = String(c.label);
    // 5. figures
    if (kind === 'figure' || (c.fig && String(c.fig).trim())) {
      const f = figureOf(D, c.fig || (kind === 'figure' ? claimed : ''));
      if (f) { cite.fig = f.fig; figure ||= f; } else if (kind === 'figure') { if (strict) return drop(`figure ${c.fig || '?'} does not resolve`); if (c.fig) { cite.fig = String(c.fig); flag(`figure ${c.fig} not found in this fetch`); } }
    }
    // Read spans: recommended ranges as pages where they can be (block markers otherwise).
    if (kind === 'read' && Array.isArray(c.spans) && c.spans.length) {
      cite.spans = c.spans.filter((s) => Array.isArray(s) && s.length === 2).slice(0, 6).map(([a, b]) => {
        const pa = pageOfMarker(D, a), pb = pageOfMarker(D, b, true);
        return pa != null && pb != null && pb >= pa ? [pa, pb] : [a, b];
      });
    }
    // 3. numbers and number words; 4. quoted phrases.
    const nums = p.approx ? [] : numbersIn(t);
    const miss = nums.filter((x) => !numIn(x, fullN));
    nTot += nums.length; nOk += nums.length - miss.length;
    if (miss.length) { if (strict) return drop(`number ${miss.join(', ')} not in the source`); flag(`number ${miss.join(', ')} not in the fetched text`); }
    for (const w of NUMW) {
      for (const m of t.matchAll(new RegExp('\\b' + w + '\\w*', 'gi'))) {
        if (new RegExp('\\b' + w, 'i').test(D.full || '') || (NUMW_VAL[w] && NUMW_VAL[w].test(D.full || ''))) continue;
        if (strict) return drop(`number word "${m[0]}" not in the source`);
        flag(`number word "${m[0]}" not in the fetched text`);
      }
    }
    if (dropped.at(-1)?.n === n) return;
    for (const m of t.matchAll(QUOTED)) {
      const ph = m[1];
      if (ph.split(/\s+/).length < 3 || inFull(D, ph)) continue;
      if (strict) return drop(`quoted phrase "${ph}" not in the source`);
      flag(`quoted phrase "${ph}" not in the fetched text`);
    }
    if (dropped.at(-1)?.n === n) return;
    // 6. shape and words.
    const lim = kind === 'hook' ? 260 : 280;
    if (t.length > 320 && strict) return drop(`${t.length} characters`);
    if (t.length > lim) flag(`${t.length} characters (at most ${lim})`);
    if (LEAD[kind] && !LEAD[kind].test(t)) flag('lead-in missing');
    if (BANNED.test(t)) flag('hype word, hashtag, emoji or numbering');
    // 8. lost hedges (a flag): the cited block hedges, the post does not.
    if (hit && kind !== 'read' && kind !== 'method') {
      const src = ws(hit.b.raw ?? hit.b.t), at = Math.max(0, src.indexOf(ws(quote).slice(0, 40)));
      const ctx = D.kind === 'post' || D.kind === 'web' ? src : src.slice(Math.max(0, at - 400), at + quote.length + 400);
      const h = HEDGE_SRC.exec(ctx);
      if (h && !HEDGE_POST.test(t)) flag(`HEDGE? the cited block has "${h[0]}"`);
    }
    posts.push({ kind, t, cite, ...(p.approx === true ? { approx: true } : {}) });
  });
  // 9. repeats (a flag): a number of two or more characters in two posts other than figure and read posts.
  const seen = new Map();
  posts.forEach((p, j) => {
    if (p.kind === 'figure' || p.kind === 'read') return;
    for (const n of new Set(p.t.match(/(?<![A-Za-z\d.])\d(?:[\d,]*\d)?(?:\.\d+)?(?![\dA-Za-z])/g) || [])) if (n.length >= 2) seen.set(n, [...(seen.get(n) || []), j + 1]);
  });
  for (const [n, at] of seen) if (at.length > 1) flags.push(`repeat: ${n} in posts ${at.join(', ')}`);
  // 7. the whole thread.
  const reasons = [];
  if (posts[0]?.kind !== 'hook') reasons.push(inp[0]?.kind === 'hook' ? `the hook was dropped (${dropped.find((d) => d.n === 1)?.why || '?'})` : 'no hook first');
  if (strict && posts.length < 4) reasons.push(`${posts.length} posts survived (at least 4)`);
  if (strict && posts.length > 7) { flags.push(`${posts.length} posts; kept 7`); posts.length = 7; }
  if (!posts.some((p) => SUBSTANCE.has(p.kind))) reasons.push('no finding, figure, implication or caveat survived');
  const order = posts.map((p) => KINDS.indexOf(p.kind));
  if (order.some((o, j) => j && o < order[j - 1])) flags.push('posts out of order');
  const tags = [...new Set((Array.isArray(raw?.tags) ? raw.tags : []).map((x) => ws(x).toLowerCase()).filter(Boolean))].slice(0, 5);
  const base = keep || {};
  const thread = reasons.length ? null : cleanThread({
    title: base.title || D.meta?.t, posts,
    figure: base.figure || (figure ? { fig: figure.fig, ...(figure.img ? { img: figure.img } : {}), ...(figure.page != null ? { page: figure.page } : {}), ...(figure.label ? { label: figure.label } : {}) } : undefined),
    tags: base.tags || tags, model: base.model || 'unknown', basis: base.basis || (D.kind === 'scan' || D.kind === 'pdf' ? 'fulltext' : 'html'), written: base.written || today(),
    checks: { quotes: [posts.length, inp.length], numbers: [nOk, nTot], flags: [...new Set(flags)], dropped: dropped.length, src: D.kind, at: today() },
    usd: base.usd, tok: base.tok,
  });
  return { thread, reasons, flags, dropped };
}

// ------------------------------------------------------------------- mock ----
/** A deterministic thread from the source's own sentences (STACKS_MOCK_AI=1): exercises the pipeline, says nothing. */
export function mockThread(D) {
  const paras = D.blocks.filter((b) => (b.kind === 'p' || b.kind === 'page') && ws(b.raw ?? b.t).length > 60);
  const sents = (b) => (ws(b.raw ?? b.t).match(/[^.!?]+[.!?]+(?=\s|$)/g) || []).map((s) => s.trim()).filter((s) => s.split(' ').length >= 6 && s.length <= 230 && !/["“”]/.test(s));
  const used = new Set();
  const find = (test, from = 0) => {
    for (const b of paras.slice(from)) for (const s of sents(b)) if (!used.has(s) && (!test || test(s))) { used.add(s); return { b, s }; }
    return null;
  };
  const cut = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '.');
  const post = (kind, lead, x, n) => x && ({ kind, t: cut(lead + x.s, n), approx: false, cite: { loc: x.b.m, fig: '', quote: x.s.split(' ').slice(0, 18).join(' '), spans: [] } });
  const mid = Math.floor(paras.length / 3);
  const hook = post('hook', '', find(), 260);
  const finding = post('finding', '', find((s) => /\d/.test(s), 1) || find(null, 1), 280);
  const method = post('method', 'How: ', find((s) => /\b(we|using|method|approach|model)\b/i.test(s), 1), 280);
  const caveat = post('caveat', 'Caveat: ', find((s) => /\b(however|limit|limitation|caveat|may not|future work|cannot|only)\b/i.test(s), mid) || find(null, mid), 280);
  const lastP = paras.at(-1);
  const read = post('read', 'Read it if you work on this: ', find(null, Math.max(0, paras.length - 3)) || find(), 280);
  if (read && paras[0] && lastP) read.cite.spans = [[paras[0].m, lastP.m]];
  return { posts: [hook, finding, method, caveat, read].filter(Boolean), tags: ['mock', D.kind] };
}

// ------------------------------------------------------------------ files ----
export const defaultOut = (CACHE) => (process.env.STACKS_THREADS ? resolve(process.env.STACKS_THREADS) : MOCK ? join(CACHE, 'threads', 'mock-threads.json') : join(HERE, 'data', 'threads.json'));
function readRaw(f) {
  if (!existsSync(f)) return { built: today(), version: VERSION, items: {} };
  const d = readJson(f, null);
  if (!d || typeof d.items !== 'object') throw new Error(`${f} is not {"items": {...}}; not touching it.`);
  return d;
}
/** Write the file: header fields, then one item per line, in corpus order (so a diff shows the items that changed). */
export function writeThreads(f, data, order = new Map()) {
  const { items, ...head } = data;
  const big = 1e9;
  const ids = Object.keys(items).sort((a, b) => (order.get(a) ?? big) - (order.get(b) ?? big) || (a < b ? -1 : a > b ? 1 : 0));
  const lines = ['{', ...Object.entries(head).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)},`), ' "items": {'];
  ids.forEach((id, k) => lines.push(`  ${JSON.stringify(id)}: ${JSON.stringify(items[id])}${k < ids.length - 1 ? ',' : ''}`));
  lines.push(' }', '}');
  mkdirSync(dirname(f), { recursive: true });
  const tmp = `${f}.${process.pid}.tmp`;
  writeFileSync(tmp, lines.join('\n') + '\n');
  renameSync(tmp, f);
}
/** Re-read the file and apply `updates` ({id: thread}), so what other writers changed meanwhile stays. */
export function mergeInto(f, updates, order, head = {}) {
  const cur = readRaw(f);
  for (const [id, th] of Object.entries(updates)) if (th) cur.items[id] = th; else delete cur.items[id];
  cur.built = today(); cur.version ||= VERSION;
  Object.assign(cur, head);
  writeThreads(f, cur, order);
  return cur;
}

// ------------------------------------------------------------------- CLI ----
const argv = process.argv.slice(2);
const flag = (k) => argv.includes('--' + k);
const opt = (k, d = null) => { const j = argv.indexOf('--' + k); return j >= 0 && argv[j + 1] && !argv[j + 1].startsWith('--') ? argv[j + 1] : d; };
const list = (k) => (opt(k) ? opt(k).split(',').map((s) => s.trim()).filter(Boolean) : null);

async function plumbing(model) {
  const { CACHE, hasKey } = await import('./server/config.mjs');
  const S = await import('./server/routes/30-summarize.mjs');
  const cache = { key: (u) => createHash('sha1').update(u).digest('hex') }; // all 30-summarize needs
  const app = { HERE, CACHE, MODEL: model, hasKey, cache, port: null, route() {}, status() {}, onStart() {}, json() {}, send() {}, body() {} };
  S.default(app);
  return { ai: app.ai, PRICES: S.PRICES, setBudget: S.setBudget, parsePartial: S.parsePartial, hasKey, CACHE };
}
function corpusOf() {
  const c = readJson(join(HERE, 'corpus.json'), null);
  if (!c || !Array.isArray(c.items)) throw new Error('Cannot read corpus.json');
  return { items: c.items, byId: new Map(c.items.map((it) => [it.id, it])), order: new Map(c.items.map((it, k) => [it.id, k])), lanes: c.lanes || {} };
}
/** Run `fn` over `xs`, `n` at a time. */
async function pool(xs, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, xs.length) }, async () => { while (i < xs.length) { const k = i++; await fn(xs[k], k); } }));
}

async function cmdMerge(files, out, C) {
  if (!files.length) throw new Error('merge: name the thread files to merge');
  const incoming = {};
  for (const f of files) {
    const d = readJson(resolve(f), null);
    if (!d || typeof d.items !== 'object') throw new Error(`${f} is not {"items": {...}}`);
    const cleaned = cleanFile(d).items;
    const lost = Object.keys(d.items).filter((id) => !cleaned[id]);
    if (lost.length) console.warn(`${f}: ${lost.length} malformed thread(s) left out: ${lost.join(', ')}`);
    for (const [id, th] of Object.entries(cleaned)) {
      if (!C.byId.has(id)) console.warn(`${f}: ${id} is not in corpus.json (kept; the feed shows it once the item exists)`);
      if (incoming[id]) console.warn(`${id} is in more than one file; the later one wins`);
      incoming[id] = th;
    }
  }
  console.log(`${Object.keys(incoming).length} threads from ${files.length} file(s).`);
  if (flag('no-fetch')) { mergeInto(out, incoming, C.order); console.log(`Merged without re-checking quotes (--no-fetch) into ${out}.`); return; }
  await verifyMany(Object.entries(incoming), out, C, 'quotes');
}

/** Re-check threads against fresh sources and write the results. */
async function verifyMany(pairs, out, C, mode) {
  const srv = await connect(Number(opt('port', process.env.STACKS_PORT || 4747)));
  const updates = {}, report = [];
  try {
    await pool(pairs, 2, async ([id, th]) => {
      const it = C.byId.get(id);
      let D;
      try { if (!it) throw fail('not-in-corpus'); D = await sourceFor(it, srv); } catch (e) {
        updates[id] = { ...th, checks: { ...(th.checks || {}), flags: [...new Set([...(th.checks?.flags || []), `not re-checked ${today()}: ${e.code || e.message}`])] } };
        report.push(`${id}: source unavailable (${e.code || e.message}); kept as written, marked not re-checked`);
        return;
      }
      const r = verifyThread(D, th, { mode, keep: th });
      const before = th.posts.length;
      if (r.thread) {
        updates[id] = { ...r.thread, checks: { ...r.thread.checks, flags: [...new Set([...(th.checks?.flags || []).filter((x) => !/^not re-checked/.test(x)), ...r.thread.checks.flags])] } };
        report.push(`${id}: ${r.thread.posts.length}/${before} posts kept${r.dropped.length ? ' · dropped ' + r.dropped.map((d) => `${d.n} ${d.kind} (${d.why})`).join('; ') : ''}${r.flags.length ? ` · ${r.flags.length} flag(s)` : ''}`);
      } else {
        report.push(`${id}: REJECTED (${r.reasons.join('; ')}); ${mode === 'quotes' ? 'kept as written, marked unverified' : 'left out'}`);
        if (mode === 'quotes') updates[id] = { ...th, posts: th.posts.map((p) => ({ ...p, cite: { ...p.cite, ok: false } })), checks: { ...(th.checks || {}), flags: [...new Set([...(th.checks?.flags || []), `re-check ${today()} rejected: ${r.reasons.join('; ')}`])] } };
        else updates[id] = null;
      }
      for (const f of r.flags) report.push(`    ${f}`);
    });
  } finally { srv.close(); }
  mergeInto(out, updates, C.order);
  console.log(report.join('\n'));
  console.log(`Wrote ${Object.values(updates).filter(Boolean).length} thread(s) to ${out}.`);
}

async function cmdWrite(out, C, P, model) {
  const data = readRaw(out);
  const ref = readRaw(join(HERE, 'data', 'threads.json')); // the exemplars live in the shipped file
  const PREFIX = prefixOf(ref.items && Object.keys(ref.items).length ? ref : data);
  const failedF = join(P.CACHE, 'threads', 'failed.json');
  const failed = readJson(failedF, {});
  const ids = list('ids'), lanes = list('lanes'), kinds = list('kinds');
  const LIMIT = opt('limit') != null ? Math.max(1, Number(opt('limit')) || 1) : Infinity;
  const hand = (th) => /hand|exemplar|editor/i.test(th?.model || '');
  let chosen = ids ? ids.map((id) => C.byId.get(id) || (console.warn(`Not in the corpus, skipped: ${id}`), null)).filter(Boolean) : C.items.filter((it) => !lanes || lanes.includes(it.lane));
  chosen = chosen.filter((it) => srcKind(it) && (!kinds || kinds.includes(srcKind(it))));
  chosen = chosen.filter((it) => !hand(data.items[it.id]) && !hand(ref.items?.[it.id]) && (flag('redo') || !data.items[it.id]));
  const recent = (id) => failed[id] && Date.now() - Date.parse(failed[id].at) < 7 * 864e5;
  const skippedFailed = flag('retry') || ids ? 0 : chosen.filter((it) => recent(it.id)).length;
  if (!flag('retry') && !ids) chosen = chosen.filter((it) => !recent(it.id));
  chosen = chosen.slice(0, LIMIT);

  const price = P.PRICES[model];
  if (!price) throw new Error(`Unknown model ${model}; one of ${Object.keys(P.PRICES).join(', ')}`);
  const TYPICAL = { arxiv: 70000, pdf: 60000, post: 30000, web: 16000, scan: 85000 }; // characters of document text, before the cap
  const CPT = 3.2, OUT = 2500; // characters per token; output tokens per item (the thread is ~1,100, plus thinking)
  const preTok = PREFIX.length / CPT;
  const estOf = (it, first) => { const [pi, po] = price; return (((Math.min(CAP, TYPICAL[srcKind(it)]) / CPT) + preTok * (first ? 1.25 : 0.1)) * pi + OUT * po) / 1e6; };
  const est = chosen.reduce((a, it, k) => a + estOf(it, k === 0), 0);
  const sp = P.ai.spendInfo(), left = Math.max(0, sp.budget - sp.today);
  const per = {}; for (const it of chosen) { const k = `${it.lane}/${srcKind(it)}`; per[k] = (per[k] || 0) + 1; }
  console.log(`Threads file: ${out} (${Object.keys(data.items).length} threads)`);
  console.log(`${chosen.length} item${chosen.length === 1 ? '' : 's'} to write${skippedFailed ? ` (${skippedFailed} that failed in the last 7 days skipped; --retry)` : ''}` + (chosen.length ? ': ' + Object.entries(per).map(([k, n]) => `${k} ${n}`).join(', ') : ''));
  if (!chosen.length) return;
  console.log(`${model}${MOCK ? ' (STACKS_MOCK_AI: mock threads, nothing is spent)' : ''}; rules and ${EXEMPLARS.length} exemplars about ${Math.round(preTok).toLocaleString()} tokens, cached after the first request.`);
  console.log(`Estimated cost ${usd(est)} (typical document sizes; about ${usd(est / chosen.length)} an item); today's AI budget ${usd(sp.budget)}, ${usd(sp.today)} spent, ${usd(left)} left.`);
  if (flag('dry-run') || flag('dry')) { console.log('Dry run: nothing fetched, sent or written.'); return; }
  if (!MOCK && est > left) {
    if (!flag('yes')) { console.error('Stopping: the estimate is more than what is left of today\'s budget (STACKS_DAILY_BUDGET). Run again with --yes to go ahead, or narrow it with --lanes, --kinds or --limit.'); process.exitCode = 2; return; }
    P.setBudget(sp.today + est * 2 + 0.01);
    console.log('--yes: going past the daily budget for this run.');
  }
  if (!MOCK && !P.hasKey()) { console.error('Set ANTHROPIC_API_KEY (or run with STACKS_MOCK_AI=1).'); process.exitCode = 1; return; }

  const srv = await connect(Number(opt('port', process.env.STACKS_PORT || 4747)));
  const stats = { ok: 0, rejected: 0, nosrc: 0, failed: 0, cost: 0, cacheRead: 0, cacheWrite: 0, posts: 0, dropped: 0 };
  let stop = false, fails = 0;
  const saveFailed = () => { mkdirSync(dirname(failedF), { recursive: true }); writeFileSync(failedF, JSON.stringify(failed, null, 1)); };
  try {
    await pool(chosen, Math.max(1, Math.min(6, Number(opt('concurrency', 3)) || 3)), async (it, k) => {
      if (stop) return;
      const tag = `[${k + 1}/${chosen.length}] ${it.id}`;
      let D;
      try { D = await sourceFor(it, srv); } catch (e) {
        stats.nosrc++; failed[it.id] = { at: new Date().toISOString(), why: `source: ${e.code || e.message}` }; saveFailed();
        console.log(`${tag}: no source (${e.code || e.message})`); return;
      }
      const doc = docText(D);
      const content = [{ type: 'text', text: PREFIX, cache_control: { type: 'ephemeral' } }, { type: 'text', text: doc }];
      let raw, cost = 0, usage = null;
      try {
        if (MOCK) raw = mockThread(D);
        else {
          const release = P.ai.reserve(model, PREFIX.length * 0.1 + doc.length, OUT);
          try {
            const r = await P.ai.generate({ model, content, schema: SCHEMA, maxTokens: 12000, mock: () => JSON.stringify(mockThread(D)) }, () => {});
            usage = r.usage; cost = P.ai.costOf(r.model, r.usage); P.ai.charge(r.model, cost);
            stats.cacheRead += r.usage?.cache_read_input_tokens || 0; stats.cacheWrite += r.usage?.cache_creation_input_tokens || 0;
            if (r.stop === 'refusal') throw fail('refusal', 'the model declined');
            raw = JSON.parse(r.text);
          } finally { release(); }
        }
        fails = 0;
      } catch (e) {
        stats.failed++; fails++;
        failed[it.id] = { at: new Date().toISOString(), why: `model: ${e.code || e.message}` }; saveFailed();
        console.error(`${tag}: failed: ${e.message}`);
        if (['budget', 'no_key', 'no_sdk'].includes(e.code) || fails >= 3) { stop = true; console.error('Stopping.'); }
        return;
      }
      stats.cost += cost;
      const r = verifyThread(D, raw, { mode: 'strict', keep: { model: MOCK ? `${model} (mock)` : model, usd: cost ? +cost.toFixed(5) : undefined, tok: usage ? [usage.input_tokens + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0), usage.output_tokens] : undefined } });
      stats.dropped += r.dropped.length;
      if (!r.thread) {
        stats.rejected++; failed[it.id] = { at: new Date().toISOString(), why: r.reasons.join('; '), dropped: r.dropped }; saveFailed();
        console.log(`${tag}: rejected (${r.reasons.join('; ')})`); return;
      }
      delete failed[it.id];
      stats.ok++; stats.posts += r.thread.posts.length;
      mergeInto(out, { [it.id]: r.thread }, C.order);
      console.log(`${tag}: ${r.thread.posts.length} posts${r.dropped.length ? `, ${r.dropped.length} dropped (${r.dropped.map((d) => d.why).join('; ')})` : ''}${r.flags.length ? `, ${r.flags.length} flag(s)` : ''}${MOCK ? '' : `, ${usd(cost)}`}`);
    });
  } finally { srv.close(); saveFailed(); }
  console.log(`\nWrote ${stats.ok} thread(s) (${stats.posts} posts; ${stats.dropped} posts dropped by the verifier); ${stats.rejected} rejected, ${stats.nosrc} without a source, ${stats.failed} failed calls.`);
  if (!MOCK) console.log(`Spent ${usd(stats.cost)} (cache: ${stats.cacheWrite.toLocaleString()} tokens written, ${stats.cacheRead.toLocaleString()} read).`);
  console.log(`File: ${out}`);
}

async function main() {
  if (flag('help') || flag('h')) {
    console.log('node threads.mjs [--lanes a,b] [--ids x,y] [--kinds arxiv,post,web,scan,pdf] [--limit N] [--model m] [--concurrency 3] [--dry-run] [--yes] [--redo] [--retry] [--port 4747] [--out file]\nnode threads.mjs verify [--ids x,y] [--lanes a,b] [--mode strict|quotes] [--port 4747] [--out file]\nnode threads.mjs merge <file.json>… [--no-fetch] [--port 4747] [--out file]      (see the comment at the top of this file)');
    return;
  }
  const model = opt('model', 'claude-haiku-5-5');
  const P = await plumbing(model);
  const out = resolve(opt('out') || defaultOut(P.CACHE));
  const C = corpusOf();
  const cmd = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'write';
  if (cmd === 'merge') return cmdMerge(argv.slice(1).filter((a, k, xs) => !a.startsWith('--') && !(k > 0 && xs[k - 1].startsWith('--') && ['port', 'out', 'model'].includes(xs[k - 1].slice(2)))), out, C);
  if (cmd === 'verify') {
    const data = readRaw(out), ids = list('ids'), lanes = list('lanes');
    const pairs = Object.entries(data.items).filter(([id]) => (!ids || ids.includes(id)) && (!lanes || lanes.includes(C.byId.get(id)?.lane)));
    if (!pairs.length) { console.log('Nothing to verify.'); return; }
    return verifyMany(pairs, out, C, opt('mode', 'strict') === 'quotes' ? 'quotes' : 'strict');
  }
  if (cmd !== 'write') throw new Error(`unknown command ${cmd} (write, verify or merge)`);
  return cmdWrite(out, C, P, model);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(() => process.exit(process.exitCode || 0), (e) => { console.error(e.message || e); process.exit(1); });
}
