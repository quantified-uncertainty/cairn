// Typed parts of a corpus item, for the Feeds view (server/routes/66-extract.mjs;
// spec in docs/feeds/spec.md, section 3). Pure functions over documents that
// were already fetched: no I/O, so the route can run them in a worker thread.
//
//   run(job)            -> { ex, svgs? }  dispatch on job.src (latexml | post | web | ocr)
//   fromLatexml(job)    arXiv HTML (LaTeXML) plus the paper's /figures list
//   fromPost(job)       a LessWrong / Alignment Forum / EA Forum htmlBody
//   fromWeb(job)        a web page (Starlight wikis, blogs, Distill, ...)
//   fromOcr(job)        an Internet Archive scan's OCR text: plate candidates
//   serveView(ex, hl, verdicts)  the lead with highlights and plate verdicts applied
//   cardsFor(feed, ex, per)      the cards one item gives one feed
//
// A part is { pid, type, text, html?, label?, caption?, value?, cue?, sec?,
// ctx?, loc: {anchor?, page?, label?, quote?, href?}, at, score, ... }.
import { parse, walk, text, clean, hasClass, extract as figuresOf } from '../routes/65-figures.mjs';

export const VER = 1;
export const PER_TYPE = 12; // parts of one type stored per item

/** The feeds: the part types each one takes and its default per-item cap. */
export const FEEDS = {
  pictures: { types: ['lead'], per: 1 },
  findings: { types: ['finding', 'claims'], per: 3 },
  numbers: { types: ['number'], per: 3 },
  tables: { types: ['table'], per: 3 },
  equations: { types: ['equation'], per: 3 },
  definitions: { types: ['definition', 'theorem'], per: 4 },
  limits: { types: ['limitation', 'question'], per: 3 },
  posts: { types: ['tldr', 'status', 'pull', 'opener', 'quote'], per: 3 },
  highlights: { types: ['highlight'], per: 1 },
};

// ---------------------------------------------------------------- rules ----
export const RE = {
  skipSec: /related work|background|preliminar|notation|acknowledg|reference|author contribution|checklist|reproducib/i,
  intro: /intro|overview|motivation/i,
  concl: /conclu|summary|discussion/i,
  finding: /\b(?:we|our (?:results|experiments|analysis|findings|evaluations?))\s+(?:also\s+)?(?:find|found|show|showed|demonstrate|observe|observed|discover|conclude|confirm|reveal|establish)(?:s|es)?\b|\bour results (?:suggest|indicate|show)\b|\b(?:surprisingly|counterintuitively|strikingly|contrary to (?:prior|previous|common))\b/i,
  surprise: /\b(?:surprisingly|counterintuitively|strikingly|contrary to)\b/i,
  findingNot: /\b(?:as we (?:will )?show|we will show|we hope|shown in (?:Figure|Table|Section))\b|^(?:In|See|As (?:shown|seen) in) (?:§|Sections?\b|Sec\.|Figures?\b|Fig\.|Tables?\b|Appendix\b)|\bwe (?:show|demonstrate)s? (?:the|an?|our|some|several|examples?|how|in)\b/i,
  // extraction-yields.md section 2 ("Results"), with ranges ("5-18x") and a few more comparatives.
  result: /\b(?:improv|reduc|increas|outperform|achiev|boost|decreas|gain|drop|exceed|surpass|match|cut|lower|rais|speed|accelerat|beat|recover|halv|doubl)\w*\b[^.;]{0,90}?(?:\d+(?:\.\d+)?\s?(?:%|×|x\b|-fold|fold\b|points?\b|pp\b|percentage points)|by (?:a factor of|an order of magnitude))|\d+(?:\.\d+)?\s?% of\b|\b\d+(?:\.\d+)?(?:\s?[-–]\s?\d+(?:\.\d+)?)?\s?[×x]\s+(?:faster|slower|more|fewer|larger|bigger|smaller|less|cheaper|higher|lower|longer|shorter|better|worse)\b/i,
  prob: /\b\d+(?:\.\d+)?\s?% (?:chance|probability|likely|confiden)|(?:probability|chance|odds) (?:of|that)[^.]{0,60}\d+\s?%|\bp\s?=\s?0?\.\d+/i,
  setup: /\b(?:learning rate|batch size|epochs?|warm-?up|weight decay|dropout|seeds?|hyperparameters?|we (?:use|set) )/i,
  contrib: /\b(?:(?:our|main|key|primary|two|three|four|several|following|this paper.s|this work.s|the) (?:\w+ )?contributions|contributions (?:are|of this|include)|we (?:make|offer) the following|we summari[sz]e our (?:main |key )?(?:findings|results)|in summary, (?:we|our)|this paper makes)/i,
  contribNot: /\b(?:equal|authors?)\W+contribution/i,
  contribHead: /contributions|key (?:findings|takeaways)|summary of results/i,
  claimHead: /\b(?:claims?|takeaways?|summary|key points|in short|main points|conclusions?)\b/i,
  // extraction-yields.md section 2 ("Definitions"), without "we denote".
  definition: /\b(?:we define|we call|is defined as|are defined as|we refer to [^.]{1,60}? as|we term|we say that|we introduce the (?:notion|concept|term)|we use the term|refers to|is called|are called|which we call|we coin)\b/i,
  eqCue: /\b(?:objective|loss|we define|defined as|bound|minimi[sz]e|maximi[sz]e|update rule|reward|expected)\b/i,
  limitSec: /limitation|threats to validity|caveat|weakness/i,
  limit: /\b(?:a limitation of|one limitation|limited to|we do not (?:address|study|evaluate|consider)|does not (?:generalize|account for))\b/i,
  limitGeneric: /\b(?:other|more|additional|different|larger) (?:datasets|models|tasks|domains|languages|benchmarks)\b/i,
  futureSec: /future work|future direction|open (?:problem|question)s?|outstanding questions|unsolved|cruxes/i,
  question: /\b(?:remains? (?:unclear|open|unknown)|an open question|we leave .{0,60}(?:to|for) future work|future work (?:should|could|might)|is not yet (?:known|clear))\b/i,
  futureLine: /\b(?:future|further|remains?|open|unclear|unknown|could|should|would be|interesting|we plan|we hope|next steps?)\b/i,
  tldr: /^\W{0,3}(?:tl;?dr|tldr|summary|in short|short version|bottom line|key takeaways?|executive summary|abstract|overview)\b(?:\W|$)/i,
  status: /^\W{0,3}(?:epistemic (?:status|state|effort)|confidence)\b/i,
  notOpener: /^\W{0,3}(?:Originally posted|Cross-?posted|This is a linkpost|Epistemic)/i,
  pullNot: /^(?:figure|fig\.|table|chart)\b/i,
  badImg: /emoji|icon|avatar|logo|gravatar|latex|codecogs|badge|favicon/i,
  resultWords: /\b(?:accuracy|performance|loss|rates?|scaling|vs\.?|versus|compared|improv\w*|outperform\w*|increas\w*|decreas\w*|over training|as a function of)\b|%|×/i,
  exampleWords: /\b(?:examples?|prompts?|transcripts?|screenshots?|sample outputs?|interface|illustrat\w*)/i,
};

// ---------------------------------------------------------------- utils ----
const sq = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const skel = (s) => sq(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
const wordsOf = (s) => sq(s).split(' ').filter(Boolean);
const firstWords = (s, n = 40) => wordsOf(s).slice(0, n).join(' ');
const lastWords = (s, n = 40) => wordsOf(s).slice(-n).join(' ');
const cut = (s, n) => { s = sq(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const cutEnd = (s, n) => { s = sq(s); return s.length > n ? '…' + s.slice(s.length - n + 1).replace(/^\S*\s+/, '') : s; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const isEl = (k) => typeof k !== 'string';
const kidsOf = (el) => el.kids.filter(isEl);
const r2 = (x) => Math.round(x * 100) / 100;
function up(el, pred) { for (let x = el.p; x; x = x.p) if (pred(x)) return x; return null; }
const upSelf = (el, pred) => (pred(el) ? el : up(el, pred));
/** A copy of el's subtree without the elements `drop` rejects (clean() and text() take it). */
function prune(el, drop) {
  if (!isEl(el)) return el;
  return { ...el, kids: el.kids.filter((k) => !isEl(k) || !drop(k)).map((k) => prune(k, drop)) };
}
const tagText = (h) => { if (!h) return ''; for (const el of walk(h)) if (hasClass(el, 'ltx_tag')) return sq(text({ kids: el.kids })); return ''; };
const BOLD = (el) => el.tag === 'b' || el.tag === 'strong' || hasClass(el, 'ltx_font_bold');
const EMPH = (el) => el.tag === 'em' || el.tag === 'i' || BOLD(el) || hasClass(el, 'ltx_emph') || hasClass(el, 'ltx_font_italic');
/** LaTeXML's bold and italic spans as <b> and <i>, which clean() keeps and any stylesheet shows. */
function inl(el) {
  if (!isEl(el)) return el;
  const tag = el.tag !== 'span' ? el.tag : hasClass(el, 'ltx_font_bold') ? 'b' : hasClass(el, 'ltx_font_italic') || hasClass(el, 'ltx_emph') ? 'i' : 'span';
  return { ...el, tag, kids: el.kids.map(inl) };
}
const unwrapBlocks = (h) => h.replace(/<\/?(?:div|p)\b[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** The bold run an element's text starts with, or ''. Tags (bullets) are skipped. */
function leadBold(el) {
  let out = null;
  const rec = (n, bold) => {
    for (const k of n.kids) {
      if (out !== null) return;
      if (!isEl(k)) {
        if (!k.trim()) { if (bold) acc += ' '; continue; }
        if (bold) { acc += k; continue; }
        out = acc; return;
      }
      if (hasClass(k, 'ltx_tag') || k.tag === 'annotation' || k.tag === 'annotation-xml' || hasClass(k, 'footnote-reference')) continue;
      if (k.tag === 'math') { if (bold) { acc += ' ' + (k.a.alttext || '') + ' '; continue; } out = acc; return; }
      rec(k, bold || BOLD(k));
    }
  };
  let acc = '';
  rec(el, BOLD(el));
  if (out === null) out = acc;
  return sq(out.replace(/&nbsp;/g, ' '));
}
/** Share of an element's text that sits inside bold. */
function boldShare(el) {
  let all = 0, b = 0;
  const rec = (n, bold) => {
    for (const k of n.kids) {
      if (!isEl(k)) { const L = k.replace(/\s+/g, '').length; all += L; if (bold) b += L; continue; }
      if (k.tag === 'annotation' || k.tag === 'script' || k.tag === 'style') continue;
      rec(k, bold || BOLD(k));
    }
  };
  rec(el, BOLD(el));
  return all ? b / all : 0;
}

const NOSPLIT = /(?:\b(?:e\.g|i\.e|et al|Figs?|Eqs?|Secs?|Sects?|vs|cf|Tabs?|approx|Refs?|resp|Nos?|Dr|Mr|Mrs|Ms|Prof|Jr|Sr|St|Vol|pp|Ch|Thm|Def|Lem|Prop|Alg|Apps?|Corp|Inc|Ltd)|(?:^|[\s(])[A-Z])\.$/;
/** Sentences of collapsed text, without splitting after common abbreviations or initials. */
export function sentences(t) {
  const out = [];
  for (const piece of sq(t).split(/(?<=[.!?])\s+(?=[A-Z(\["“‘])/)) {
    if (out.length && NOSPLIT.test(out[out.length - 1])) out[out.length - 1] += ' ' + piece;
    else if (piece) out.push(piece);
  }
  return out;
}

// Numbers: the quantity as written, and whether it is a multiple or a big change.
const QTY = /(?:\d+(?:[.,]\d+)?\s?[-–]\s?)?\d+(?:[.,]\d+)?\s?(?:%|(?:×|x\b)(?!\s?10\b)|-fold|fold\b|percentage points|points?\b|pp\b)/i;
function numValue(s, m) {
  const ft = /\bfrom\s+(\d+(?:\.\d+)?\s?%?)\s+to\s+(\d+(?:\.\d+)?\s?%?)/i.exec(s);
  if (ft) {
    const a = parseFloat(ft[1]), b = parseFloat(ft[2]);
    return { value: `${ft[1].trim()} → ${ft[2].trim()}`, big: a > 0 && b > 0 && Math.max(a / b, b / a) >= 2, mult: false };
  }
  const om = /a factor of [\d.,]+|an order of magnitude/i.exec(s.slice(m.index ?? 0));
  if (om && /factor|magnitude/i.test(m[0])) return { value: om[0], mult: true, big: true };
  const q = QTY.exec(m[0]) || QTY.exec(s);
  if (q) {
    const v = q[0].trim();
    const mult = /×|x\b|fold/i.test(v);
    const n = parseFloat(v.replace(/^.*[-–]\s?/, ''));
    return { value: v, mult, big: mult && n >= 2 };
  }
  const p = /\d+(?:\.\d+)?\s?%|p\s?=\s?0?\.\d+/i.exec(m[0]) || /\d+(?:\.\d+)?\s?%/.exec(s);
  return { value: p ? p[0] : m[0].slice(0, 24), mult: false, big: false };
}
const HAS_NUM = /\d+(?:\.\d+)?\s?(?:%|×|x\b|-fold|fold\b|points?\b|pp\b)|\b\d+\.\d+\b/;

const texClean = (s) => sq(String(s || '').replace(/\\(?:displaystyle|textstyle|scriptstyle|penalty|nobreak|allowbreak)(?![a-zA-Z])/g, ' ').replace(/\\ /g, ' '));
const mathInner = (m) => `<mrow>${clean(m).replace(/^<math\b[^>]*>/, '').replace(/<\/math>$/, '').replace(/<\/?semantics>/g, '')}</mrow>`;

// ---------------------------------------------------------------- parts ----
/** Collects parts; finish() dedupes, keeps the best 12 of each type and orders them by position. */
class Parts {
  constructor() { this.list = []; }
  add(p) {
    if (!p || !p.text) return;
    p.text = cut(p.text, 1200);
    if (p.ctx) { if (p.ctx.before) p.ctx.before = cutEnd(p.ctx.before, 360); else delete p.ctx.before; if (p.ctx.after) p.ctx.after = cut(p.ctx.after, 360); else delete p.ctx.after; if (!p.ctx.before && !p.ctx.after) delete p.ctx; }
    if (p.loc?.quote) p.loc.quote = firstWords(p.loc.quote, 40);
    if (p.sec) p.sec = cut(p.sec, 80);
    p.score = r2(Math.max(0, Math.min(1, p.score)));
    p.at = +Math.max(0, Math.min(1, p.at || 0)).toFixed(4);
    this.list.push(p);
  }
  finish() {
    const byType = new Map();
    for (const p of this.list) (byType.get(p.type) || byType.set(p.type, []).get(p.type)).push(p);
    const keep = [];
    for (const list of byType.values()) {
      list.sort((a, b) => b.score - a.score || a.at - b.at);
      const kept = [];
      for (const p of list) {
        if (kept.length >= PER_TYPE) break;
        if (!/^(figure|image|plate|table|equation)$/.test(p.type) && kept.some((q) => dup(p, q))) continue;
        kept.push(p);
      }
      keep.push(...kept);
    }
    keep.sort((a, b) => a.at - b.at);
    const seen = new Set();
    for (const p of keep) { let id = p.pid, k = 2; while (seen.has(id)) id = `${p.pid}~${k++}`; p.pid = id; seen.add(id); }
    return keep;
  }
}
function dup(a, b) {
  const sa = skel(a.text), sb = skel(b.text);
  if (sa.slice(0, 60) === sb.slice(0, 60)) return true;
  const wa = new Set(wordsOf(a.text.toLowerCase()).filter((w) => w.length > 2)), wb = new Set(wordsOf(b.text.toLowerCase()).filter((w) => w.length > 2));
  if (!wa.size || !wb.size) return false;
  let n = 0; for (const w of wa) if (wb.has(w)) n++;
  return n / Math.min(wa.size, wb.size) > 0.7;
}

/** A list (ul/ol) as card HTML: at most 5 items of at most 220 characters, bold lead-ins kept. */
function listHtml(items, intro) {
  const lis = items.slice(0, 5).map((li) => {
    const t = text(li);
    if (t.length <= 220) {
      const h = unwrapBlocks(clean(inl(prune(li, (x) => hasClass(x, 'ltx_tag') || hasClass(x, 'footnote-reference') || x.tag === 'ul' || x.tag === 'ol'))));
      if (h.length <= 4000) return `<li>${h}</li>`;
    }
    const lead = leadBold(li);
    if (lead && lead.length < 120 && t.startsWith(lead)) return `<li><b>${esc(lead)}</b> ${esc(cut(t.slice(lead.length), Math.max(40, 220 - lead.length)))}</li>`;
    return `<li>${esc(cut(t, 220))}</li>`;
  });
  return (intro ? `<p>${esc(cut(intro, 400))}</p>` : '') + `<ul>${lis.join('')}</ul>`;
}
const itemsOf = (list) => kidsOf(list).filter((k) => k.tag === 'li');
const LABEL = /^([^:.!?]{3,60}):\s+\S/;
/** Nearly all items start with bold or a "Label:". */
function boldLed(items) {
  const n = items.filter((li) => { const b = leadBold(li); return (b.length >= 2 && b.length <= 200) || LABEL.test(text(li)); }).length;
  return n >= Math.max(2, Math.ceil(items.length * 0.8));
}
/** Table stats for scoring: numeric share and bold cells. */
function tableStats(tbl) {
  let cells = 0, num = 0, rows = 0, cols = 0;
  for (const tr of walk(tbl)) {
    if (tr.tag !== 'tr') continue;
    rows++;
    let c = 0;
    for (const td of walk(tr)) {
      if (td.tag !== 'td' && td.tag !== 'th') continue;
      c += Number(td.a.colspan) || 1;
      const t = text(td);
      if (!t) continue;
      cells++;
      if (/\d/.test(t) && /^[\s\d.,%±+\-−–()×x$€£~<>≤≥*†‡/:]+$/i.test(t)) num++;
    }
    cols = Math.max(cols, c);
  }
  return { rows, cols, numeric: cells ? num / cells : 0 };
}
function tableScore(html, numeric, main) {
  return 0.3 + (numeric >= 0.3 ? 0.3 : 0) + (/ltx_font_bold|<b>|<strong>/.test(html) ? 0.2 : 0) + (main ? 0.2 : 0);
}

// ------------------------------------------------------------- LaTeXML ----
/** Section-2 score of each image figure, and which may lead. */
export function scoreFigures(figures, cites) {
  return figures.filter((f) => !f.table && f.img).map((f) => {
    const cap = f.caption || '';
    const isF1 = /^fig/i.test(f.label || '') && f.n === '1';
    const appendix = /^A[\d.]/.test(f.id || '');
    let s = 0;
    if (isF1 && f.at < 0.15) s += 2;
    s += Math.min(3, cites(f.id));
    if (RE.resultWords.test(cap)) s += 0.5;
    if (RE.exampleWords.test(cap)) s -= 0.7;
    if ((f.parts?.length || 1) > 6) s -= 1;
    if ((f.w || 0) < 250 && (f.h || 0) < 250) s -= 2;
    return { f, s, main: !appendix && f.at < 0.7, ok: !appendix && (cap.length >= 20 || isF1) };
  });
}
function figPic(f, url, score) {
  const pic = { pid: `figure:${f.id || f.label}`, type: 'figure', img: f.img, w: f.w ?? null, h: f.h ?? null };
  if (f.parts) { pic.parts = f.parts; pic.lay = f.lay; }
  if (f.inline) pic.inline = true;
  Object.assign(pic, { label: f.label, caption: f.caption || null, loc: { anchor: f.id || undefined, quote: f.caption ? firstWords(f.caption, 40) : undefined, href: f.id ? `${url}#${f.id}` : url }, at: f.at });
  if (score != null) pic.score = score;
  return pic;
}
/** arXiv lead, section 2 step 2. */
function arxivLead(scored, url) {
  let cands = scored.filter((x) => x.ok && x.main);
  if (!cands.length) cands = scored.filter((x) => x.ok); // late main-text figures (long appendices push `at` past 0.7)
  if (!cands.length) return { show: 'none', pics: [], by: 'score' };
  cands = [...cands].sort((a, b) => b.s - a.s || a.f.at - b.f.at);
  const [a, b, c] = cands;
  const one = !b || a.s - b.s >= 1.5;
  const pick = one ? [a] : [a, b, ...(c && c.s >= a.s - 1.0 ? [c] : [])];
  return { show: one ? 'one' : 'few', pics: pick.map((x) => figPic(x.f, url, rescale(x.s))), by: 'score' };
}
const rescale = (s) => r2(Math.max(0, Math.min(1, (s + 3.7) / 9.2)));

export function fromLatexml({ html, url, figures = [] }) {
  const root = parse(html);
  const article = [...walk(root, (x) => x.tag === 'article')].find((x) => x.tag === 'article') || root;
  const docStart = Math.max(0, html.indexOf('<article'));
  const span = Math.max(1, html.length - docStart);
  const at = (el) => (el.s - docStart) / span;
  const P = new Parts();
  const href = (anchor) => (anchor ? `${url}#${anchor}` : url);

  // Sections: title ("4.2 Results"), appendix, skipped (related work…), intro/conclusion.
  const secs = new Map();
  const ABSTRACT = { id: 'abstract', title: 'Abstract', abstract: true, appendix: false, skip: false, intro: true, concl: false };
  for (const el of walk(article)) {
    if (el.tag !== 'section') continue;
    const h = kidsOf(el).find((k) => /^h[1-6]$/.test(k.tag));
    const title = h ? sq(`${tagText(h)} ${text(h)}`).replace(/[.:]\s*$/, '') : '';
    const parent = up(el, (x) => x.tag === 'section');
    const pi = parent ? secs.get(parent) : null;
    const top = pi ? pi.top : el;
    const info = {
      id: el.a.id || '', title, el, top, topTitle: pi ? pi.topTitle : title,
      appendix: !!(pi?.appendix || hasClass(el, 'ltx_appendix') || /^A[\d.]/.test(el.a.id || '')),
      skip: !!(pi?.skip || RE.skipSec.test(title) || hasClass(el, 'ltx_bibliography')),
    };
    info.intro = RE.intro.test(info.topTitle) && !info.appendix;
    info.concl = RE.concl.test(title) || RE.concl.test(info.topTitle);
    secs.set(el, info);
  }
  const NONE = { id: '', title: '', appendix: false, skip: false, intro: false, concl: false, top: null };
  const secOf = (el) => {
    const s = up(el, (x) => x.tag === 'section' || hasClass(x, 'ltx_abstract'));
    if (!s) return NONE;
    return hasClass(s, 'ltx_abstract') ? ABSTRACT : secs.get(s) || NONE;
  };
  const topId = (el) => { const s = secOf(el); return s === ABSTRACT ? 'abstract' : s.top?.a?.id || s.id || ''; };

  // Cross-references: target id -> distinct top-level sections that cite it, and a count.
  const refSecs = new Map(), refN = new Map();
  for (const a of walk(article, (x) => x.tag === 'figure' || x.tag === 'figcaption' || hasClass(x, 'ltx_bibliography') || hasClass(x, 'ltx_TOC'))) {
    if (a.tag !== 'a' || !hasClass(a, 'ltx_ref')) continue;
    const h = a.a.href || '';
    const i = h.lastIndexOf('#');
    if (i < 0) continue;
    const id = h.slice(i + 1);
    if (!id || id.startsWith('bib')) continue;
    (refSecs.get(id) || refSecs.set(id, new Set()).get(id)).add(topId(a));
    refN.set(id, (refN.get(id) || 0) + 1);
  }
  const citeSecs = (id) => { if (!id) return 0; const s = new Set(refSecs.get(id) || []); const par = id.replace(/\.fig\d+$|\.sf\d+$/, ''); if (par !== id) for (const x of refSecs.get(par) || []) s.add(x); return s.size; };

  // Paragraph sentences, in document order.
  const STOP = (x) => x.tag === 'figure' || x.tag === 'figcaption' || x.tag === 'nav' || x.tag === 'footer' || hasClass(x, 'ltx_bibliography') || hasClass(x, 'ltx_note') || hasClass(x, 'ltx_theorem') || hasClass(x, 'ltx_equation') || hasClass(x, 'ltx_equationgroup') || hasClass(x, 'ltx_TOC') || hasClass(x, 'ltx_authors') || hasClass(x, 'ltx_listing');
  const S = [];
  const perAnchor = new Map();
  for (const p of walk(article, STOP)) {
    if (p.tag !== 'p' || !hasClass(p, 'ltx_p') || STOP(p)) continue;
    const t = text(p);
    if (t.length < 20) continue;
    const para = upSelf(p, (x) => hasClass(x, 'ltx_para') && !!x.a.id);
    const anchor = para?.a.id || upSelf(p, (x) => !!x.a.id)?.a.id || '';
    const sec = secOf(p);
    const inList = !!up(p, (x) => x.tag === 'li');
    const pAt = at(p);
    for (const st of sentences(t)) {
      const n = perAnchor.get(anchor) || 0; perAnchor.set(anchor, n + 1);
      S.push({ t: st, anchor, n, sec, at: pAt, p, para, inList });
    }
  }
  const ctxOf = (i) => {
    const s = S[i], b = S[i - 1], a = S[i + 1];
    return { before: b && b.sec === s.sec ? b.t : '', after: a && a.sec === s.sec ? a.t : '' };
  };
  const sentPart = (type, i, extra) => {
    const s = S[i];
    return { pid: `${type}:${s.anchor}:${s.n}`, type, text: s.t, sec: s.sec.title || undefined, ctx: ctxOf(i), loc: { anchor: s.anchor || undefined, quote: s.t, href: href(s.anchor) }, at: s.at, ...extra };
  };
  const sizeOk = (t) => t.length >= 50 && t.length <= 320;

  // Emphasized phrases of a paragraph, for definitional sentences.
  const emphCache = new Map();
  const emphOf = (p) => {
    if (!emphCache.has(p)) {
      const out = [];
      for (const el of walk(p)) if (EMPH(el)) { const t = sq(text(el)).replace(/^[“"'‘]|[”"'’.,:;]$/g, ''); const w = wordsOf(t).length; if (t.length >= 2 && t.length <= 60 && w <= 6 && /[a-z]/i.test(t)) out.push(t); }
      emphCache.set(p, out);
    }
    return emphCache.get(p);
  };

  for (let i = 0; i < S.length; i++) {
    const s = S[i], t = s.t;
    if (s.sec.skip || !sizeOk(t)) continue;
    const main = !s.sec.appendix;
    const lead = s.sec.abstract || s.sec.intro || s.sec.concl;
    // finding
    let m;
    if (main && (m = RE.finding.exec(t)) && !RE.findingNot.test(t)) {
      P.add(sentPart('finding', i, { cue: m[0], score: 0.4 + (lead ? 0.2 : 0) + (HAS_NUM.test(t) ? 0.2 : 0) + (RE.surprise.test(m[0]) ? 0.1 : 0) }));
    }
    // number
    if (main && (m = RE.result.exec(t)) && !RE.setup.test(t)) {
      const v = numValue(t, m);
      P.add(sentPart('number', i, { value: v.value, cue: m[0], score: 0.5 + (s.sec.abstract || s.sec.intro ? 0.2 : 0) + (v.mult ? 0.2 : 0) + (v.big ? 0.1 : 0) }));
    }
    // definition (b)
    if ((m = RE.definition.exec(t))) {
      const terms = emphOf(s.p).filter((x) => t.includes(x));
      const q = /[“"‘]([^”"’]{2,60})[”"’]/.exec(t);
      let term = null;
      if (terms.length) term = terms.sort((a, b) => Math.abs(t.indexOf(a) - m.index) - Math.abs(t.indexOf(b) - m.index))[0];
      else if (q && wordsOf(q[1]).length <= 6) term = q[1];
      if (term) P.add(sentPart('definition', i, { label: term, cue: m[0], score: 0.5 }));
    }
    // limitation (b), main text only
    if (main && (m = RE.limit.exec(t)) && !(wordsOf(t).length < 18 && RE.limitGeneric.test(t))) {
      P.add(sentPart('limitation', i, { cue: m[0], score: 0.5 }));
    }
    // question (b)
    if ((m = RE.question.exec(t))) P.add(sentPart('question', i, { cue: m[0], score: 0.5 }));
  }

  // Section-level parts: limitations (a) and future work / open questions (a).
  const sentsIn = (info) => { const out = []; for (let i = 0; i < S.length; i++) { const x = S[i].sec; if (x === info || (x.el && info.el && up(x.el, (y) => y === info.el))) out.push(i); } return out; };
  for (const info of secs.values()) {
    if (info.skip || !info.title) continue;
    if (RE.limitSec.test(info.title)) {
      const idx = sentsIn(info);
      const take = [];
      let len = 0;
      for (const i of idx) { const L = S[i].t.length; if (take.length >= 3 || (take.length && len + L > 420)) break; take.push(i); len += L + 1; }
      if (take.length) {
        const s0 = S[take[0]];
        const t = cut(take.map((i) => S[i].t).join(' '), 420);
        const after = S[take.at(-1) + 1];
        P.add({ pid: `limitation:${info.id || s0.anchor}`, type: 'limitation', text: t, label: info.title, sec: info.title, ctx: { after: after && after.sec === s0.sec ? after.t : '' }, loc: { anchor: info.id || s0.anchor, quote: s0.t, href: href(info.id || s0.anchor) }, at: s0.at, score: 0.8 });
      }
    }
    if (RE.futureSec.test(info.title)) {
      // List items first; otherwise the first 2 sentences (in a "Conclusion and future
      // work" section, the first 2 that look forward).
      const lis = [];
      for (const el of walk(info.el, (x) => x.tag === 'section' && x !== info.el || x.tag === 'figure')) if (el.tag === 'li' && !up(el, (x) => x.tag === 'li')) lis.push(el);
      const good = lis.map((li) => ({ li, t: text(li) })).filter((x) => x.t.length >= 25 && x.t.length <= 300);
      if (good.length) {
        good.slice(0, 4).forEach(({ li, t }, k) => {
          const anchor = upSelf(li, (x) => !!x.a.id)?.a.id || info.id;
          P.add({ pid: `question:${info.id}:li${k}`, type: 'question', text: t, label: info.title, sec: info.title, loc: { anchor, quote: t, href: href(anchor) }, at: at(li), score: 0.8 - k * 0.02 });
        });
      } else {
        let idx = sentsIn(info);
        if (RE.concl.test(info.title)) idx = idx.filter((i) => RE.futureLine.test(S[i].t));
        const take = idx.slice(0, 2);
        if (take.length) {
          const s0 = S[take[0]];
          P.add({ pid: `question:${info.id || s0.anchor}`, type: 'question', text: cut(take.map((i) => S[i].t).join(' '), 600), label: info.title, sec: info.title, loc: { anchor: s0.anchor, quote: s0.t, href: href(s0.anchor) }, at: s0.at, score: 0.8 });
        }
      }
    }
  }

  // Claims (a): contributions in the introduction.
  const listAfter = (p, para) => {
    // A list in the same paragraph after p, or leading the next paragraph.
    if (para) {
      const ks = kidsOf(para); const i = ks.indexOf(upSelf(p, (x) => x.p === para) || p);
      for (const k of ks.slice(i + 1)) { if (k.tag === 'ul' || k.tag === 'ol') return k; if (k.tag === 'p' && text(k).length > 30) break; }
      const sib = kidsOf(para.p || { kids: [] });
      const next = sib[sib.indexOf(para) + 1];
      if (next) {
        if (next.tag === 'ul' || next.tag === 'ol') return next;
        const first = kidsOf(next)[0];
        if (first && (first.tag === 'ul' || first.tag === 'ol')) return first;
      }
    }
    return null;
  };
  let contribDone = false;
  for (let i = 0; i < S.length && !contribDone; i++) {
    const s = S[i];
    if (!s.sec.intro || s.sec.abstract || s.inList) continue;
    const m = RE.contrib.exec(s.t);
    if (!m || RE.contribNot.test(s.t)) continue;
    const list = listAfter(s.p, s.para);
    const items = list ? itemsOf(list) : [];
    if (items.length >= 2 && items.length <= 8) {
      const its = items.map((li) => text(li));
      P.add({ pid: `claims:${s.anchor}`, type: 'claims', label: 'Contributions', text: [s.t, ...its].join(' · '), html: listHtml(items, s.t), cue: m[0], sec: s.sec.title, loc: { anchor: s.anchor, quote: s.t, href: href(s.anchor) }, at: s.at, score: 0.9 });
      contribDone = true;
    } else {
      // Inline: "First, … Second, …" in the sentences that follow.
      const rest = [];
      for (let j = i + 1; j < S.length && S[j].para === s.para && rest.length < 4; j++) rest.push(S[j].t);
      if (rest.length && /\b(?:First|Firstly|Second|Secondly|Third|Finally)\b/.test(rest.join(' '))) {
        const t = cut([s.t, ...rest].join(' '), 900);
        P.add({ pid: `claims:${s.anchor}`, type: 'claims', label: 'Contributions', text: t, html: `<p>${esc(t)}</p>`, cue: m[0], sec: s.sec.title, loc: { anchor: s.anchor, quote: s.t, href: href(s.anchor) }, at: s.at, score: 0.9 });
        contribDone = true;
      }
    }
  }
  // Claims (a), by heading: "Our contributions.", "Key findings", "Summary of results".
  for (const info of secs.values()) {
    if (contribDone || info.appendix || info.skip || !RE.contribHead.test(info.title)) continue;
    const list = [...walk(info.el, (x) => x.tag === 'figure' || x.tag === 'li')].find((x) => x.tag === 'ul' || x.tag === 'ol');
    const items = list ? itemsOf(list) : [];
    if (items.length >= 2 && items.length <= 8) {
      const anchor = upSelf(list, (x) => !!x.a.id)?.a.id || info.id;
      P.add({ pid: `claims:${anchor}`, type: 'claims', label: info.title, text: items.map((li) => text(li)).join(' · '), html: listHtml(items), cue: info.title, sec: info.title, loc: { anchor, quote: text(items[0]), href: href(anchor) }, at: at(list), score: 0.9 });
      contribDone = true;
    }
  }
  // Claims (b): bold-led lists outside the appendix.
  for (const list of walk(article, (x) => x.tag === 'figure' || hasClass(x, 'ltx_theorem') || hasClass(x, 'ltx_bibliography') || hasClass(x, 'ltx_note') || x.tag === 'li' || hasClass(x, 'ltx_TOC'))) {
    if ((list.tag !== 'ul' && list.tag !== 'ol') || hasClass(list, 'ltx_toclist')) continue;
    const sec = secOf(list);
    if (sec.appendix || sec.skip) continue;
    const items = itemsOf(list);
    if (items.length < 2 || items.length > 10 || !boldLed(items)) continue;
    const anchor = upSelf(list, (x) => !!x.a.id)?.a.id || '';
    const para = upSelf(list, (x) => hasClass(x, 'ltx_para'));
    const prevP = para ? kidsOf(para).filter((k) => k.tag === 'p' && k.e <= list.s).at(-1) : null;
    const before = prevP ? sentences(text(prevP)).at(-1) : '';
    const its = items.map((li) => text(li));
    P.add({ pid: `claims:${anchor}`, type: 'claims', text: its.join(' · '), html: listHtml(items), sec: sec.title || undefined, ctx: { before }, loc: { anchor: anchor || undefined, quote: its[0], href: href(anchor) }, at: at(list), score: 0.7 });
  }

  // Equations: numbered or cited display equations that look key.
  const eqTables = [];
  for (const el of walk(article, (x) => x.tag === 'figure' || hasClass(x, 'ltx_theorem') || hasClass(x, 'ltx_note') || hasClass(x, 'ltx_equationgroup'))) {
    if (el.tag === 'table' && (hasClass(el, 'ltx_equationgroup') || hasClass(el, 'ltx_equation'))) eqTables.push(el);
  }
  for (const eq of eqTables) {
    const sec = secOf(eq);
    if (sec.skip) continue;
    const rows = [...walk(eq)].filter((x) => x.tag === 'tr' && hasClass(x, 'ltx_equation'));
    const rowMaths = rows.map((tr) => [...walk(tr)].filter((x) => x.tag === 'math')).filter((ms) => ms.length);
    if (!rowMaths.length || rowMaths.length > 8) continue;
    const rowTex = rowMaths.map((ms) => texClean(ms.map((m) => m.a.alttext || '').join(' ')));
    const total = rowTex.join(' ').length;
    if (total < 15 || rowTex.some((x) => x.length > 400) || total > 900) continue;
    const ids = [eq.a.id, ...[...walk(eq)].map((x) => x.a.id).filter((id) => id && /\.E[x\d]/.test(id) && !/\.m\d+$/.test(id))].filter(Boolean);
    const cites = ids.reduce((n, id) => n + (refN.get(id) || 0), 0);
    const para = up(eq, (x) => hasClass(x, 'ltx_para'));
    const ks = para ? kidsOf(para) : [];
    const pos = ks.indexOf(upSelf(eq, (x) => x.p === para));
    const prevP = ks.slice(0, Math.max(0, pos)).filter((k) => k.tag === 'p').at(-1);
    const nextP = ks.slice(pos + 1).find((k) => k.tag === 'p');
    const before = prevP ? sentences(text(prevP)).at(-1) || '' : '';
    const afterS = nextP ? sentences(text(nextP))[0] || '' : '';
    const after = /^(?:where|here|with|in which)\b/i.test(afterS) ? afterS : '';
    const cue = RE.eqCue.test(before);
    if (!cites && !cue) continue;
    const labels = [...walk(eq)].filter((x) => hasClass(x, 'ltx_tag_equation')).map((x) => sq(text({ kids: x.kids })));
    const mathHtml = rowMaths.map((ms) => `<math display="block">${ms.map(mathInner).join('')}</math>`).join('');
    if (mathHtml.length > 30000) continue;
    const anchor = eq.a.id || ids[0] || para?.a.id || '';
    P.add({ pid: `equation:${anchor}`, type: 'equation', text: rowTex.join(' \\\\ '), html: mathHtml, label: labels.slice(0, 2).join(' ') || undefined, sec: sec.title || undefined, ctx: { before, after }, loc: { anchor, quote: before ? lastWords(before, 30) : undefined, href: href(anchor) }, at: at(eq), score: 0.4 + Math.min(0.4, 0.2 * cites) + (cue ? 0.2 : 0) });
  }

  // Theorem-like blocks: definitions and assumptions; theorems, propositions, corollaries, claims; cited lemmas.
  for (const div of walk(article, (x) => hasClass(x, 'ltx_theorem') || x.tag === 'figure')) {
    if (div.tag !== 'div' || !hasClass(div, 'ltx_theorem')) continue;
    const sec = secOf(div);
    if (sec.skip) continue;
    const kind = ((div.a.class || '').split(/\s+/).find((c) => c.startsWith('ltx_theorem_')) || '').slice(12).toLowerCase();
    const h = kidsOf(div).find((k) => /^h[1-6]$/.test(k.tag));
    const label = sq(sq(`${tagText(h)} ${h ? text(h) : ''}`).replace(/[.:]\s*$/, ''));
    const body = prune(div, (x) => x === h);
    const t = text(body);
    if (t.length < 30) continue;
    const n = citeSecs(div.a.id);
    let type = null, score = 0;
    if (/^(?:defin|assum)/.test(kind)) { type = 'definition'; score = 0.9 + 0.1 * n; }
    else if (/^(?:theorem|thm|prop|corollary|cor\b|claim)/.test(kind) || (/^lem/.test(kind) && n >= 2)) { type = 'theorem'; score = 0.6 + 0.1 * n; }
    if (!type) continue;
    let bh = clean(inl(body));
    bh = bh.length <= 4096 ? bh.trim().replace(/^<div[^>]*>|<\/div>$/g, '').trim() : undefined;
    P.add({ pid: `${type}:${div.a.id}`, type, kind, text: t, html: bh, label: label || undefined, sec: sec.title || undefined, loc: { anchor: div.a.id, quote: t, href: href(div.a.id) }, at: at(div), score });
  }

  // Tables and figures from /figures.
  const figSec = new Map();
  for (const el of walk(article)) if (el.tag === 'figure' && el.a.id) figSec.set(el.a.id, secOf(el).title || undefined);
  for (const f of figures) {
    if (!f.table || !f.html) continue;
    if (!(f.rows >= 2 && f.rows <= 25 && f.cols >= 2 && f.cols <= 10) || f.html.length > 40000 || /^Fig/i.test(f.label || '') || f.at >= 0.9 || /^A[\d.]/.test(f.id || '')) continue;
    const st = tableStats(parse(f.html));
    const main = f.at < 0.7;
    const cap = f.caption || '';
    P.add({ pid: `table:${f.id || f.label}`, type: 'table', text: cap ? `${f.label}: ${cap}` : f.label, html: f.html, label: f.label, caption: cap || null, rows: f.rows, cols: f.cols, sec: figSec.get(f.id), loc: { anchor: f.id || undefined, quote: cap || undefined, href: href(f.id) }, at: f.at, score: tableScore(f.html, st.numeric, main) });
  }
  const scored = scoreFigures(figures, citeSecs);
  for (const x of scored) {
    const pic = figPic(x.f, url);
    P.add({ ...pic, text: x.f.caption ? `${x.f.label}: ${x.f.caption}` : x.f.label, sec: figSec.get(x.f.id), score: rescale(x.s) });
  }
  return { src: 'latexml', url, lead: arxivLead(scored, url), parts: P.finish() };
}

// ------------------------------------------------------ posts and pages ----
const LEAF = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'pre', 'td', 'th', 'dt', 'dd']);
const HEAD = /^h[1-6]$/;
const FOOT = (x) => hasClass(x, 'footnote-section') || hasClass(x, 'footnotes') || hasClass(x, 'footnote-item') || x.tag === 'section' && x.a.role === 'doc-endnotes';

/** Leaf text blocks (llm-highlights.md section 3), images and tables of a content root. */
function blocksOf(root) {
  const blocks = [], imgs = [], tables = [];
  const leafInside = new Map();
  const hasLeaf = (el) => {
    if (leafInside.has(el)) return leafInside.get(el);
    let r = false;
    for (const k of el.kids) if (isEl(k) && (LEAF.has(k.tag) || hasLeaf(k))) { r = true; break; }
    leafInside.set(el, r);
    return r;
  };
  let head = null;
  const addLeaf = (el) => {
    // A double <br> breaks a paragraph.
    const segs = [[]]; let brs = 0;
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
      const b = { k: blocks.length, el, seg, tag: el.tag, t, s: el.s, head };
      if (HEAD.test(el.tag)) { b.level = Number(el.tag[1]); head = { t, id: el.a.id || up(el, (x) => !!x.a.id && hasClass(x, 'sl-heading-wrapper'))?.a.id || null, level: b.level, k: b.k }; b.head = head; }
      b.foot = !!up(el, FOOT);
      b.quote = up(el, (x) => x.tag === 'blockquote');
      b.list = el.tag === 'li' ? el.p : null;
      blocks.push(b);
    }
  };
  const visit = (el) => {
    for (const k of el.kids) {
      if (!isEl(k)) continue;
      if (k.tag === 'img') imgs.push(k);
      if (k.tag === 'table') tables.push(k);
      if (LEAF.has(k.tag) && !hasLeaf(k)) { addLeaf(k); for (const x of walk(k)) { if (x.tag === 'img') imgs.push(x); if (x.tag === 'table') tables.push(x); } continue; }
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
  if (src.startsWith('data:')) return src.length > 100000 ? null : src;
  try { return new URL(src, base).href; } catch { return null; }
}
const dim = (v) => { const x = parseFloat(v); return Number.isFinite(x) && x > 0 && !/%/.test(v) ? Math.round(x) : null; };

/** Parts shared by posts and web pages. `kind`: 'post' | 'web'. */
function fromBlocks(root, { kind, base, page, docLen }) {
  const P = new Parts();
  const { blocks, imgs, tables } = blocksOf(root);
  const at = (el) => Math.max(0, Math.min(1, el.s / Math.max(1, docLen)));
  const hrefOf = (b, quote) => {
    if (kind === 'web' && b?.head?.id) return `${page}#${b.head.id}`;
    const w = wordsOf(quote).slice(0, 8).join(' ');
    return w ? `${page}#:~:text=${encodeURIComponent(w)}` : page;
  };
  const prose = (b) => !b.foot && (b.tag === 'p' || b.tag === 'li' || b.tag === 'dd');
  const secOf = (b) => b.head?.t || undefined;

  // Sentences.
  const S = [];
  for (const b of blocks) {
    if (!prose(b)) continue;
    const ss = sentences(b.t);
    ss.forEach((t, n) => S.push({ t, b, n, anchor: `p${b.k}` }));
  }
  const ctxOf = (i) => { const s = S[i], p = S[i - 1], a = S[i + 1]; return { before: p && p.b.head === s.b.head ? p.t : '', after: a && a.b.head === s.b.head ? a.t : '' }; };
  const sentPart = (type, i, extra) => {
    const s = S[i];
    return { pid: `${type}:${s.anchor}:${s.n}`, type, text: s.t, sec: secOf(s.b), ctx: ctxOf(i), loc: { anchor: s.anchor, quote: s.t, href: hrefOf(s.b, s.t) }, at: at(s.b.el), ...extra };
  };
  const nb = blocks.length || 1;
  for (let i = 0; i < S.length; i++) {
    const s = S[i], t = s.t;
    if (t.length < 50 || t.length > 320) continue;
    const early = s.b.k < Math.max(15, nb * 0.1);
    let m;
    if ((m = RE.finding.exec(t)) && !RE.findingNot.test(t)) P.add(sentPart('finding', i, { cue: m[0], score: 0.4 + (early ? 0.2 : 0) + (HAS_NUM.test(t) ? 0.2 : 0) + (RE.surprise.test(m[0]) ? 0.1 : 0) }));
    if (((m = RE.result.exec(t)) || (m = RE.prob.exec(t))) && !RE.setup.test(t)) {
      const v = numValue(t, m);
      P.add(sentPart('number', i, { value: v.value, cue: m[0], score: 0.5 + (early ? 0.2 : 0) + (v.mult ? 0.2 : 0) + (v.big ? 0.1 : 0) }));
    }
    if ((m = RE.limit.exec(t)) && !(wordsOf(t).length < 18 && RE.limitGeneric.test(t))) P.add(sentPart('limitation', i, { cue: m[0], score: 0.5 }));
    if ((m = RE.question.exec(t))) P.add(sentPart('question', i, { cue: m[0], score: 0.5 }));
  }

  // Lists: claims (c), open questions (c).
  const lists = new Map(); // ul/ol -> blocks of its items
  for (const b of blocks) if (b.list && !b.foot && (b.list.tag === 'ul' || b.list.tag === 'ol')) (lists.get(b.list) || lists.set(b.list, []).get(b.list)).push(b);
  for (const [list, bs] of lists) {
    if (up(list, (x) => x.tag === 'li')) continue; // top-level lists only
    const items = itemsOf(list);
    const first = bs[0];
    const prev = blocks[first.k - 1];
    const quoteIn = up(list, (x) => x.tag === 'blockquote');
    if (quoteIn) continue;
    const its = items.map((li) => text(li)).filter(Boolean);
    const under = first.head && RE.futureSec.test(first.head.t);
    if (under) {
      its.slice(0, 4).forEach((t, k) => {
        if (t.length < 15 || t.length > 300) return;
        P.add({ pid: `question:p${first.k}:li${k}`, type: 'question', text: t, label: first.head.t, sec: first.head.t, loc: { anchor: `p${first.k}`, quote: t, href: hrefOf(first, t) }, at: at(list), score: 0.8 - k * 0.02 });
      });
      continue;
    }
    const afterHead = prev && (HEAD.test(prev.tag) || prev.tag === 'p') && RE.claimHead.test(prev.tag === 'p' ? prev.t.slice(0, 80) : prev.t);
    const ok = (items.length >= 2 && items.length <= 10 && boldLed(items)) || (afterHead && items.length >= 3 && items.length <= 12);
    if (!ok || its.join('').length < 60) continue;
    P.add({ pid: `claims:p${first.k}`, type: 'claims', text: its.join(' · '), html: listHtml(items), label: afterHead && HEAD.test(prev.tag) ? prev.t : undefined, sec: secOf(first), ctx: { before: prev && prev.tag === 'p' ? sentences(prev.t).at(-1) : '' }, loc: { anchor: `p${first.k}`, quote: its[0], href: hrefOf(first, its[0]) }, at: at(list), score: 0.6 });
  }

  // Definitions (c): dt/dd pairs and "<strong>Term</strong>: gloss".
  for (const b of blocks) {
    if (b.foot) continue;
    if (b.tag === 'dt') {
      const d = blocks[b.k + 1];
      if (d && d.tag === 'dd' && d.t.length >= 20 && d.t.length <= 400 && b.t.length <= 80) P.add({ pid: `definition:p${b.k}`, type: 'definition', label: b.t, text: d.t, sec: secOf(b), loc: { anchor: `p${b.k}`, quote: d.t, href: hrefOf(b, d.t) }, at: at(b.el), score: 0.6 });
      continue;
    }
    if (b.tag !== 'p' && b.tag !== 'li') continue;
    const lead = leadBold(b.seg);
    if (!lead || lead.length > 70 || wordsOf(lead).length > 8) continue;
    const rest = b.t.slice(b.t.indexOf(lead) + lead.length);
    const term = lead.replace(/[:.\s]+$/, '');
    const gloss = /:\s*$/.test(lead) ? rest.trim() : /^\s*[:—–]\s*/.test(rest) ? rest.replace(/^\s*[:—–]\s*/, '') : null;
    if (!gloss || gloss.length < 20 || gloss.length > 300 || term.length < 2) continue;
    P.add({ pid: `definition:p${b.k}`, type: 'definition', label: term, text: gloss, sec: secOf(b), loc: { anchor: `p${b.k}`, quote: b.t, href: hrefOf(b, b.t) }, at: at(b.el), score: 0.6 });
  }

  // Limitations (a): the first 2-3 sentences under a "Limitations" heading.
  for (const h of blocks) {
    if (!HEAD.test(h.tag) || h.foot) continue;
    const isLim = RE.limitSec.test(h.t), isFut = RE.futureSec.test(h.t);
    if (!isLim && !isFut) continue;
    const idx = [];
    for (let i = 0; i < S.length; i++) if (S[i].b.head === h && !S[i].b.list) idx.push(i);
    if (!idx.length) continue;
    if (isLim) {
      const take = []; let len = 0;
      for (const i of idx) { const L = S[i].t.length; if (take.length >= 3 || (take.length && len + L > 420)) break; take.push(i); len += L + 1; }
      const s0 = S[take[0]];
      P.add({ pid: `limitation:p${h.k}`, type: 'limitation', text: cut(take.map((i) => S[i].t).join(' '), 420), label: h.t, sec: h.t, loc: { anchor: h.head?.id || `p${s0.b.k}`, quote: s0.t, href: hrefOf(s0.b, s0.t) }, at: at(s0.b.el), score: 0.8 });
    }
    if (isFut && !lists.size || isFut && ![...lists.values()].some((bs) => bs[0].head === h)) {
      const take = idx.slice(0, 2);
      const s0 = S[take[0]];
      P.add({ pid: `question:p${h.k}`, type: 'question', text: take.map((i) => S[i].t).join(' '), label: h.t, sec: h.t, loc: { anchor: `p${s0.b.k}`, quote: s0.t, href: hrefOf(s0.b, s0.t) }, at: at(s0.b.el), score: 0.8 });
    }
  }

  // Tables.
  tables.forEach((tbl, k) => {
    if (up(tbl, (x) => x.tag === 'table') || up(tbl, FOOT)) return;
    const st = tableStats(tbl);
    if (st.rows < 2 || st.rows > 25 || st.cols < 2 || st.cols > 10) return;
    const html = clean(tbl);
    if (html.length > 40000) return;
    const capEl = kidsOf(tbl).find((x) => x.tag === 'caption');
    const prev = [...blocks].reverse().find((b) => b.s < tbl.s && b.tag === 'p');
    const caption = capEl ? text(capEl) : prev && prev.t.length <= 300 ? prev.t : prev ? sentences(prev.t).at(-1) : '';
    const head = [...blocks].reverse().find((b) => b.s < tbl.s)?.head;
    P.add({ pid: `table:tbl${k}`, type: 'table', text: caption ? cut(caption, 300) : `Table ${k + 1}`, html, label: `Table ${k + 1}`, caption: caption || null, rows: st.rows, cols: st.cols, sec: head?.t, loc: { anchor: `tbl${k}`, quote: caption || undefined, href: kind === 'web' && head?.id ? `${page}#${head.id}` : page }, at: at(tbl), score: tableScore(html, st.numeric, true) });
  });

  // Images (body); pids number every <img>, kept or not.
  const images = [];
  imgs.forEach((el, k) => {
    const src = imgSrc(el, base);
    if (!src || RE.badImg.test(src) || up(el, FOOT)) return;
    const w = dim(el.a.width), h = dim(el.a.height);
    if ((w && w < 60) || (h && h < 60)) return;
    const fig = up(el, (x) => x.tag === 'figure');
    const capEl = fig && [...walk(fig)].find((x) => x.tag === 'figcaption');
    const caption = capEl ? text(capEl) : (el.a.alt && el.a.alt.length > 12 ? sq(el.a.alt) : null);
    const prev = [...blocks].reverse().find((b) => b.s < el.s && (b.tag === 'p' || b.tag === 'li'));
    const quote = prev ? lastWords(prev.t, 30) : undefined;
    const pic = { pid: `image:img${k}`, type: 'image', img: src, w: w && h ? w : null, h: w && h ? h : null, label: null, caption: caption ? cut(caption, 600) : null, loc: { anchor: `img${k}`, quote, href: prev ? hrefOf(prev, prev.t) : page }, at: at(el) };
    images.push(pic);
    P.add({ ...pic, text: caption || quote || `Image ${k + 1}`, score: 1 - Math.min(images.length - 1, 20) / 40 });
  });

  return { P, blocks, S, images, at, hrefOf, secOf };
}

/** A post (htmlBody): blocks, posts-only parts, and the lead (preview image, then body images). */
export function fromPost({ htmlBody, page, preview }) {
  const root = parse(htmlBody || '');
  for (const el of walk(root)) if (hasClass(el, 'footnote-reference')) el.kids = [];
  const { P, blocks, images, at, hrefOf, secOf } = fromBlocks(root, { kind: 'post', base: page, page, docLen: (htmlBody || '').length });
  const prose = blocks.filter((b) => !b.foot);
  const part = (type, b, t, extra) => ({ pid: `${type}:p${b.k}`, type, text: t, sec: secOf(b), loc: { anchor: `p${b.k}`, quote: t, href: hrefOf(b, t) }, at: at(b.el), ...extra });
  const blockHtml = (bs) => {
    let out = '', inList = null;
    for (const b of bs) {
      const h = unwrapBlocks(clean(prune(b.seg, (x) => hasClass(x, 'footnote-reference'))));
      if (b.tag === 'li') { if (inList !== b.list) { if (inList) out += '</ul>'; out += '<ul>'; inList = b.list; } out += `<li>${h}</li>`; continue; }
      if (inList) { out += '</ul>'; inList = null; }
      out += `<p>${h}</p>`;
    }
    return out + (inList ? '</ul>' : '');
  };

  // TL;DR: a labelled paragraph (or heading) in the first 40 blocks, and what follows.
  let tldr = null;
  for (const b of prose.slice(0, 40)) {
    if (!RE.tldr.test(b.t) || b.quote) continue;
    const isHead = HEAD.test(b.tag);
    if (!isHead && b.tag !== 'p' && b.tag !== 'li') continue;
    if (isHead && b.t.length > 40) continue;
    const label = isHead ? b.t : (/^\W{0,3}[\w ;'’-]{2,30}?[:.—–-]+/.exec(b.t) || [''])[0];
    const restT = isHead ? '' : sq(b.t.slice(label.length));
    const take = isHead || restT.length < 15 ? [] : [b];
    let len = take.length ? restT.length : 0;
    for (let k = b.k + 1; k < blocks.length && len < 900; k++) {
      const n = blocks[k];
      if (HEAD.test(n.tag) || n.foot) break;
      if (!take.length && !(n.tag === 'p' || n.tag === 'li')) continue;
      if (take.length && !isHead && restT.length >= 15 && n.tag === 'p' && take.at(-1).tag === 'p' && len > 200) break;
      if (!isHead && restT.length < 15 && take.length && take[0].tag === 'p' && n.tag !== 'li') break; // label + one paragraph
      if (take.length && take.at(-1).tag === 'li' && n.tag !== 'li') break; // the list ended
      take.push(n); len += n.t.length;
    }
    if (!take.length) continue;
    const t = cut([restT || '', ...take.filter((x) => x !== b).map((x) => x.t)].filter(Boolean).join(' '), 1200);
    const html = (take[0] === b ? `<p>${esc(restT)}</p>` + blockHtml(take.slice(1)) : blockHtml(take)).replace(/^<p><\/p>/, '');
    tldr = part('tldr', b, t, { label: sq(label.replace(/[:.—–-]+\s*$/, '')) || 'TL;DR', cue: sq(label), html, score: 1 });
    tldr.loc.quote = take[0] === b ? restT : take[0].t;
    break;
  }
  if (tldr) P.add(tldr);
  // Epistemic status.
  for (const b of prose.slice(0, 30)) {
    const m = RE.status.exec(b.t);
    if (m && b.t.length >= 20) { P.add(part('status', b, b.t, { cue: m[0].trim(), score: 0.9 })); break; }
  }
  // Pull lines: a bold paragraph, or a paragraph led by a bold run.
  for (const b of prose) {
    if (b.tag !== 'p' || b.quote || RE.pullNot.test(b.t) || RE.tldr.test(b.t) || RE.status.test(b.t)) continue;
    const share = boldShare(b.seg);
    if (b.t.length >= 20 && b.t.length <= 250 && share >= 0.8) { P.add(part('pull', b, b.t, { html: `<p>${unwrapBlocks(clean(b.seg))}</p>`, score: 0.7 })); continue; }
    const lead = leadBold(b.seg);
    if (b.t.length <= 400 && lead.length >= 15 && lead.length <= 200 && b.t.startsWith(lead.slice(0, 10))) P.add(part('pull', b, b.t, { html: `<p>${unwrapBlocks(clean(b.seg))}</p>`, cue: lead, score: 0.7 - 0.05 }));
  }
  // Opening paragraph, when there is no TL;DR.
  if (!tldr) {
    const b = prose.find((x) => x.tag === 'p' && !x.quote && x.t.length >= 120 && x.t.length <= 400 && !RE.notOpener.test(x.t) && !RE.status.test(x.t));
    if (b) P.add(part('opener', b, b.t, { score: 0.5 }));
  }
  // One blockquote.
  for (const q of walk(root)) {
    if (q.tag !== 'blockquote' || up(q, (x) => x.tag === 'blockquote') || up(q, FOOT)) continue;
    const t = text(q);
    if (t.length < 40 || t.length > 600) continue;
    const b = blocks.find((x) => x.quote === q || (x.s >= q.s && x.s < q.e));
    if (!b) continue;
    const h = unwrapBlocks(clean(prune(q, (x) => hasClass(x, 'footnote-reference'))));
    P.add({ ...part('quote', b, t, { score: 0.4 }), html: h.length <= 8000 ? `<p>${h}</p>` : undefined });
    break;
  }

  const pics = [];
  if (preview) pics.push({ pid: 'image:preview', type: 'image', img: preview, w: null, h: null, label: null, caption: null, loc: { href: page }, at: 0 });
  for (const im of images) { if (pics.length >= 3) break; if (im.img !== preview) pics.push(im); }
  const show = !pics.length ? 'none' : preview ? 'one' : images.length >= 2 ? 'few' : 'one';
  return { src: 'post', url: page, lead: { show, pics, by: 'post' }, parts: P.finish() };
}

const ROOTS = [(e) => hasClass(e, 'sl-markdown-content'), (e) => e.tag === 'd-article', (e) => e.tag === 'article', (e) => e.tag === 'main', (e) => e.a.role === 'main',
  (e) => hasClass(e, 'post-content'), (e) => hasClass(e, 'entry-content'), (e) => e.a.id === 'content', (e) => e.tag === 'body'];
const JUNK = (e) => ['script', 'style', 'noscript', 'nav', 'form', 'button', 'template', 'iframe', 'select'].includes(e.tag) || hasClass(e, 'sr-only') || hasClass(e, 'sl-anchor-link') || hasClass(e, 'pagination-links');

/** A web page: content root, og:image, then the shared block parts. */
export function fromWeb({ html, url }) {
  const root = parse(html);
  let og = null;
  for (const m of walk(root, (x) => x.tag === 'body')) {
    if (m.tag !== 'meta') continue;
    const k = (m.a.property || m.a.name || '').toLowerCase();
    if (!og && (k === 'og:image' || k === 'og:image:url' || k === 'twitter:image' || k === 'twitter:image:src') && m.a.content) { try { og = new URL(m.a.content, url).href; } catch { /* skip */ } }
  }
  let content = null;
  const all = [...walk(root)];
  for (const pred of ROOTS) { content = all.find(pred); if (content) break; }
  content ||= root;
  const priors = /(^|\.)priors\.quantifieduncertainty\.org$/.test(new URL(url).hostname);
  const drop = (e) => JUNK(e) || (priors && e.tag === 'aside' && hasClass(e, 'starlight-aside')) || (content.tag === 'body' && (e.tag === 'header' || e.tag === 'footer' || e.tag === 'aside'));
  const pruneIn = (el) => { el.kids = el.kids.filter((k) => !isEl(k) || !drop(k)); for (const k of el.kids) if (isEl(k)) pruneIn(k); };
  pruneIn(content);
  const { P, images } = fromBlocks(content, { kind: 'web', base: url, page: url, docLen: html.length });
  const pics = [];
  if (og && !RE.badImg.test(og)) pics.push({ pid: 'image:og', type: 'image', img: og, w: null, h: null, label: null, caption: null, loc: { href: url }, at: 0 });
  for (const im of images) { if (pics.length >= 3) break; if (im.img !== og) pics.push(im); }
  return { src: 'web', url, lead: { show: pics.length ? 'one' : 'none', pics, by: 'web' }, parts: P.finish() };
}

// ---------------------------------------------------------------- scans ----
const PLATE = /\b(?:fig\.?|figure|plate|pl\.|frontispiece)\b/i;
export const plateImg = (ia, k, w = 400) => `https://archive.org/download/${ia}/page/n${k}_w${w}.jpg`;

/** Plate candidates: nearly wordless leaves away from the covers, captioned ones first. */
export function fromOcr({ pages = [], labels = null, ia, n }) {
  const P = new Parts();
  const N = pages.length || n || 0;
  const cands = [];
  for (let k = 4; k < N - 8; k++) {
    const t = sq(pages[k] || '');
    const w = t ? t.split(' ').length : 0;
    if (w >= 25) continue;
    const rank = PLATE.test(t) ? 0 : t.length >= 8 && t.length <= 100 ? 1 : 2;
    cands.push({ k, t, rank });
  }
  cands.sort((a, b) => a.rank - b.rank || a.k - b.k);
  const pics = cands.slice(0, 12).map(({ k, t, rank }) => {
    const label = labels?.[k] ?? null;
    const caption = t ? cut(t, 120) : null;
    const pic = { pid: `plate:k${k}`, type: 'plate', img: plateImg(ia, k), w: null, h: null, label: label ? `p. ${label}` : null, caption, loc: { page: k, label: label || undefined, quote: t && wordsOf(t).length >= 3 ? t : undefined, href: `https://archive.org/details/${ia}/page/n${k}` }, at: N ? k / N : 0, verify: true };
    P.add({ ...pic, text: caption || `Page ${k + 1}`, score: 1 - rank / 3 });
    return pic;
  });
  return { src: 'ocr', url: `https://archive.org/details/${ia}`, lead: { show: pics.length ? 'one' : 'none', pics, by: 'plate' }, parts: P.finish() };
}

// ------------------------------------------------------------ dispatch ----
/** Run one extraction job (in the route's worker). */
export function run(job) {
  if (job.src === 'latexml') {
    let figures = job.figures, svgs = null;
    if (!figures) ({ figures, svgs } = figuresOf(job.html, job.base || job.url, job.aid));
    return { ex: fromLatexml({ ...job, figures }), svgs, figures: job.figures ? undefined : figures };
  }
  if (job.src === 'post') return { ex: fromPost(job) };
  if (job.src === 'web') return { ex: fromWeb(job) };
  if (job.src === 'ocr') return { ex: fromOcr(job) };
  throw new Error('unknown source ' + job.src);
}

// ------------------------------------------------------------- serving ----
/** Map a highlights block marker to a Loc. */
export function locOf(q, ex, item) {
  if (!q) return {};
  const loc = {};
  const m = String(q.loc || '');
  if (/^k\d+$/.test(m) || q.page != null) { loc.page = q.page ?? Number(m.slice(1)); if (q.label) loc.label = String(q.label); if (item?.ia) loc.href = `https://archive.org/details/${item.ia}/page/n${loc.page}`; }
  else if (m) loc.anchor = m;
  if (q.quote) loc.quote = firstWords(q.quote, 40);
  if (!loc.href) {
    if (ex?.src === 'latexml' && loc.anchor) loc.href = `${ex.url}#${loc.anchor}`;
    else if (item?.page && loc.quote) loc.href = `${item.page}#:~:text=${encodeURIComponent(wordsOf(loc.quote).slice(0, 8).join(' '))}`;
  }
  return loc;
}

/** The pictures a highlight names, resolved against the item's parts (and `figures`, the full /figures list, when given). */
export function hlPics(ex, hl, item, figures) {
  const out = [];
  for (const f of hl?.figures || []) {
    const ref = String(f.ref || '');
    let pic = null;
    if (/^k\d+$/.test(ref) && item?.ia) {
      const k = Number(ref.slice(1));
      pic = { pid: `plate:${ref}`, type: 'plate', img: plateImg(item.ia, k), w: null, h: null, label: f.label || null, caption: f.caption || null, loc: { page: k, href: `https://archive.org/details/${item.ia}/page/n${k}` }, at: item.n ? k / item.n : 0 };
    } else {
      const part = ex?.parts?.find((p) => p.loc?.anchor === ref && (p.type === 'figure' || p.type === 'image' || p.type === 'table'));
      if (part) {
        const { score, text: _t, ctx, cue, sec, ...rest } = part;
        pic = { ...rest };
      } else if (figures) {
        const fig = figures.find((x) => x.id === ref);
        if (fig && fig.img && !fig.table) pic = figPic(fig, ex.url);
        else if (fig && fig.table && fig.html) pic = { pid: `table:${ref}`, type: 'table', html: fig.html, rows: fig.rows, cols: fig.cols, label: fig.label, caption: fig.caption || null, loc: { anchor: ref, href: `${ex.url}#${ref}` }, at: fig.at };
      }
    }
    if (pic) { if (f.why) pic.why = f.why; out.push(pic); }
  }
  return out;
}

/**
 * What /extract serves: the stored result with the highlight's pictures as
 * the lead (when any resolve) and plate verdicts applied. `verdicts`:
 * Map 'id#pid' -> boolean. Returns a new object; `ex` is not changed.
 */
export function serveView(ex, { hl = null, verdicts = null, item = null, figures = null } = {}) {
  const out = { ...ex, hl: hl || null };
  let lead = ex.lead || { show: 'none', pics: [], by: 'score' };
  if (hl) {
    const pics = hlPics(ex, hl, item, figures);
    if (pics.length) lead = { show: hl.show === 'few' && pics.length > 1 ? 'few' : 'one', pics, by: 'hl' };
  }
  if (verdicts && (lead.by === 'plate' || ex.parts?.some((p) => p.type === 'plate'))) {
    const v = (pid) => verdicts.get(`${ex.id}#${pid}`);
    const fix = (p) => {
      if (p.type !== 'plate' || !p.verify) return p;
      const ok = v(p.pid);
      if (ok === true) { const { verify, ...rest } = p; return { ...rest, verdict: true }; }
      return p;
    };
    const keep = (p) => !(p.type === 'plate' && p.verify && v(p.pid) === false);
    if (lead.by === 'plate') {
      const pics = lead.pics.filter(keep).map(fix);
      pics.sort((a, b) => (b.verdict ? 1 : 0) - (a.verdict ? 1 : 0));
      lead = { ...lead, pics, show: pics.length ? lead.show : 'none' };
    }
    out.parts = ex.parts.filter(keep).map(fix);
  }
  out.lead = lead;
  return out;
}

/** The small picture shown on an item's text cards: the lead's first picture (not unverified plates). */
export function avatarOf(view) {
  const p = view?.lead?.pics?.find((x) => x.img && (x.type !== 'plate' || !x.verify));
  if (!p || view.lead.show === 'none') return null;
  const a = { img: p.img, w: p.w ?? null, h: p.h ?? null };
  if (p.inline) a.inline = true;
  return a;
}

/** The cards one item gives a feed (best first, at most `per`). */
export function cardsFor(feed, view, per, { item = null, sample = false } = {}) {
  const F = FEEDS[feed];
  if (!F || !view) return [];
  const id = view.id;
  if (feed === 'pictures') {
    const L = view.lead;
    if (!L || L.show === 'none' || !L.pics.length) return [];
    return [{ cid: `${id}#lead`, id, type: 'lead', show: L.show, pics: L.pics, by: L.by, score: L.pics[0].score ?? 1 }];
  }
  if (feed === 'highlights') {
    const hl = view.hl;
    if (!hl) return [];
    let pics = view.lead?.by === 'hl' ? view.lead.pics : [];
    if (!pics.length) pics = (hl.figures || []).filter((f) => f.img).map((f) => ({ pid: `image:${f.ref}`, type: 'image', img: f.img, w: null, h: null, label: f.label || null, caption: f.caption || null, loc: { anchor: f.ref }, at: 0, ...(f.why ? { why: f.why } : {}) }));
    const q = hl.passage || {};
    const num = hl.number;
    return [{
      cid: `${id}#hl`, id, type: 'highlight', claim: hl.claim || '', question: hl.question || '',
      passage: { quote: q.quote || '', why: q.why || '', ok: q.ok !== false, loc: locOf(q, view, item) },
      number: num ? { value: num.value, what: num.what || '', quote: num.quote || '', ok: num.ok !== false, loc: locOf(num, view, item) } : null,
      pics, show: pics.length ? (hl.show === 'few' && pics.length > 1 ? 'few' : hl.show === 'none' ? 'one' : hl.show) : 'none',
      sample: !!sample,
    }];
  }
  const types = new Set(F.types);
  const parts = (view.parts || []).filter((p) => types.has(p.type));
  parts.sort((a, b) => b.score - a.score || a.at - b.at);
  return parts.slice(0, per ?? F.per).map((p) => ({ ...p, cid: `${id}#${p.pid}`, id }));
}
