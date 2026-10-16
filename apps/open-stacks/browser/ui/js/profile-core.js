// Profiles, the pure part: how a document's pages are analysed and laid out.
// No DOM and no imports, so the browser loads it as a module and Node imports
// it from server/profile.mjs, compile.mjs and the tests. See
// docs/profiles/spec.md (sections 4 and 5) for the format and the rules.
//
// Pages are 0-based `k`. Boxes in a profile are arrays [x0, y0, x1, y1],
// fractions of the full page with 4 decimals; render.js works with objects
// {x0, y0, x1, y1} (toBox / toArr convert).

export const SCHEMA = 1;
/** Analysis generation: bump whenever an algorithm below changes, so stored profiles recompile lazily. */
export const GEN = 5; // 2: born-digital pages are not scanner beds; full-bleed pages show whole; shared crops never cut ink. 3: a thin strip alone in a side margin (arXiv's stamp, line numbers) is not part of the ink box. 4: running heads and feet (the same band on most pages) are left out of the ink box. 5: a band's shape alone counts only in a slot whose bands mostly repeat (widely spaced body text kept its first line); faint text between a cut band and the page stays
/** Display hints both layers may give (analysis here, the augmentation from the model). */
export const HINTS = {
  'one-up': 'One page at a time reads best (slides, landscape reports).',
  'two-up': 'Two pages per spread reads best.',
  'three-up': 'Three pages per spread reads best.',
  'split-columns': 'Two-column pages: split them into columns (key c).',
  'facing-pages': 'A printed book: facing pages pair as printed.',
  'skip-front': 'Long front matter: the body starts later.',
  landscape: 'Has landscape pages; they are shown alone.',
  'zoom-figures': 'The figures carry the content: zoom into them.',
  sequential: 'Read in order; skipping loses the thread.',
  'ocr-poor': 'Little or no usable text layer.',
};
export const HINT_CODES = Object.keys(HINTS);
export const DEFAULT_PAD = 0.012;
const KiB = 1024, MiB = 1024 * 1024;
/** Disk budget of one profile, in bytes: 1 MiB + 70 KiB a page, at most 12 MiB. */
export const budgetFor = (n) => Math.min(12 * MiB, MiB + 70 * KiB * Math.max(0, Math.floor(n) || 0));

const r4 = (v) => Math.round(v * 1e4) / 1e4;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const toBox = (a) => (a ? { x0: a[0], y0: a[1], x1: a[2], y1: a[3] } : null);
export const toArr = (b) => (b ? [r4(b.x0), r4(b.y0), r4(b.x1), r4(b.y1)] : null);
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };
const union = (a, b) => (!a ? b : !b ? a : [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
const fits = (a, b, tol) => a[0] >= b[0] - tol && a[1] >= b[1] - tol && a[2] <= b[2] + tol && a[3] <= b[3] + tol;
const ar = (p) => (p.w > 0 && p.h > 0 ? p.w / p.h : 0.75);

// ---------------------------------------------------------------- 5.1 ink ----
/**
 * Ink box, blank page and two-column gutter from a page's luminance (0-255),
 * row-major, W wide (240 in every producer) and H high. Returns
 * {blank, ink: Box | null (unpadded), gut: x fraction | null, dens}.
 * scan: the page is a scan (dark scanner-bed bands at the borders are stepped past).
 * A born-digital page (scan false) whose edges are not white paper — a dark page,
 * full-bleed art, colour bands — is shown whole: its edges are the design.
 * bands (born-digital pages only, for the compilers): also `bands: {top, bot, both}`,
 * the page's first and last bands (see bandsOf) and its ink box without them.
 */
export function analyzeLum(lum, W, H, { scan = true, bands = false } = {}) {
  const N = W * H;
  if (!scan) {
    const m = Math.max(1, Math.round(Math.min(W, H) * 0.02));
    const ring = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < m || y < m || x >= W - m || y >= H - m) ring.push(lum[y * W + x]);
    ring.sort((a, b) => a - b);
    const dark = ring.findIndex((v) => v >= 200);
    const darkFrac = (dark < 0 ? ring.length : dark) / Math.max(1, ring.length);
    if (ring[ring.length >> 1] < 200 || darkFrac > 0.3) return { blank: false, ink: [0, 0, 1, 1], gut: null, dens: 1 };
  }
  const sorted = Float32Array.from(lum.length === N ? lum : lum.subarray(0, N)).sort();
  const bg = sorted[Math.floor(N * 0.8)];
  const thr = bg - Math.max(45, bg * 0.25);
  const rows = new Uint16Array(H), cols = new Uint16Array(W);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (lum[y * W + x] < thr) { rows[y]++; cols[x]++; }
  // Scanner beds and page edges show up as nearly solid dark bands at the
  // borders: step past them before looking for the text block.
  let x0 = 0, x1 = W - 1, y0 = 0, y1 = H - 1;
  const mxB = Math.round(W * 0.12), myB = Math.round(H * 0.12);
  if (scan) { // born-digital pages have no scanner bed: a dark band at an edge is part of the page
    while (x0 < mxB && cols[x0] > H * 0.35) x0++;
    while (W - 1 - x1 < mxB && cols[x1] > H * 0.35) x1--;
    while (y0 < myB && rows[y0] > W * 0.35) y0++;
    while (H - 1 - y1 < myB && rows[y1] > W * 0.35) y1--;
  }
  // Then ignore a thin margin past the border, where shadows and specks live.
  x0 += Math.round(W * 0.015); x1 -= Math.round(W * 0.015); y0 += Math.round(H * 0.01); y1 -= Math.round(H * 0.01);
  let ink = 0;
  const rws = new Uint16Array(H), cls = new Uint16Array(W);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (lum[y * W + x] < thr) { rws[y]++; cls[x]++; ink++; }
  const frac = ink / Math.max(1, (x1 - x0) * (y1 - y0));
  if (!(frac >= 0.0025)) return { blank: true, ink: null, gut: null, dens: 0 };
  const rmin = Math.max(1, W * 0.004), cmin = Math.max(1, H * 0.004);
  while (y0 < y1 && rws[y0] < rmin) y0++;
  while (y1 > y0 && rws[y1] < rmin) y1--;
  const xa = x0, xb = x1; // the columns before trimming, for bandsOf
  while (x0 < x1 && cls[x0] < cmin) x0++;
  while (x1 > x0 && cls[x1] < cmin) x1--;
  if (!scan) [x0, x1] = dropMarginStrips(cls, x0, x1, W, cmin);
  let inBox = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (lum[y * W + x] < thr) inBox++;
  // Gutter: an ink-free vertical run in the middle third of the box.
  let gut = null;
  const bw = x1 - x0;
  if (bw > 40) {
    let run = 0, best = 0, at = 0;
    for (let x = Math.round(x0 + bw * 0.38); x <= Math.round(x0 + bw * 0.62); x++) {
      if (cls[x] <= (y1 - y0) * 0.004) { run++; if (run > best) { best = run; at = x - run / 2; } } else run = 0;
    }
    if (best >= Math.max(2, bw * 0.012)) gut = r4(at / W);
  }
  const out = {
    blank: false,
    ink: [r4(x0 / W), r4(y0 / H), r4(Math.min(1, (x1 + 1) / W)), r4(Math.min(1, (y1 + 1) / H))],
    gut, dens: r4(inBox / Math.max(1, (x1 - x0 + 1) * (y1 - y0 + 1))),
  };
  if (bands && !scan) out.bands = bandsOf(lum, W, H, thr, rws, rmin, cmin, xa, xb, y0, y1);
  return out;
}
/** Born-digital pages: the page's first and last bands, the candidates for a running head
 *  and a running foot (finalize decides with runningBands). A band is the first (last) run
 *  of ink rows, gaps inside it under 1.5% of the page (a rule just under a header's text
 *  belongs to it), then a clear gap of at least 1.5% before the rest of the page, and at
 *  most 6% of the page high. Each is {y0, y1, next | prev (where the rest starts or ends),
 *  ink (the ink box without the band), tight?}; `both` is the ink box without either. Fractions.
 *  Rows are the ones analyzeLum counted (rws: ink pixels per row inside the margins). */
function bandsOf(lum, W, H, thr, rws, rmin, cmin, xa, xb, y0, y1) {
  const tall = Math.round(H * 0.06);
  const run = (from, step, end, gap) => {
    const inside = (y) => (step > 0 ? y <= end : y >= end);
    let y = from, last = from, g = 0;
    for (; inside(y); y += step) { if (rws[y] >= rmin) { last = y; g = 0; } else if (++g >= gap) break; }
    if (g < gap || Math.abs(last - from) + 1 > tall) return null; // no clear gap, or too tall to be a band
    while (inside(y) && rws[y] < rmin) y += step;
    return inside(y) ? { a: Math.min(from, last), b: Math.max(from, last), rest: y } : null;
  };
  // The ink box of rows ya..yb: columns trimmed and margin strips dropped as analyzeLum does.
  const boxOf = (ya, yb) => {
    const c = new Uint16Array(W);
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) if (lum[y * W + x] < thr) c[x]++;
    let a = xa, b = xb;
    while (a < b && c[a] < cmin) a++;
    while (b > a && c[b] < cmin) b--;
    [a, b] = dropMarginStrips(c, a, b, W, cmin);
    return [r4(a / W), r4(ya / H), r4(Math.min(1, (b + 1) / W)), r4(Math.min(1, (yb + 1) / H))];
  };
  // Failing a clear gap, a narrower one (1%: a figure set close under the header) gives a
  // `tight` band, which runningBands takes only when it has the running band's shape.
  const gap = Math.max(3, Math.round(H * 0.015)), narrow = Math.max(2, Math.round(H * 0.01));
  const find = (from, step, end) => { const r = run(from, step, end, gap); if (r) return r; const n = narrow < gap ? run(from, step, end, narrow) : null; return n && { ...n, tight: true }; };
  const t = find(y0, 1, y1), b = find(y1, -1, y0);
  const top = t ? { y0: r4(t.a / H), y1: r4((t.b + 1) / H), next: r4(t.rest / H), ink: boxOf(t.rest, y1), ...(t.tight ? { tight: true } : {}) } : null;
  const bot = b ? { y0: r4(b.a / H), y1: r4((b.b + 1) / H), prev: r4((b.rest + 1) / H), ink: boxOf(y0, b.rest), ...(b.tight ? { tight: true } : {}) } : null;
  const both = t && b && t.rest < b.rest ? boxOf(t.rest, b.rest) : null;
  return { top, bot, both };
}
/** Born-digital pages: a thin strip of ink alone in a side margin, as arXiv's vertical
 *  "arXiv:…v1 [cs.AI] 28 Nov 2025" stamp or a review copy's line numbers, is not part of what
 *  is read. Left in the ink box it keeps a wide margin on that page and gives it its own crop.
 *  A strip at most 5% of the page wide, then at least 2.5% with no ink, with at least half the
 *  page wide still beyond it, is dropped (either side). */
function dropMarginStrips(cls, x0, x1, W, cmin) {
  const maxStrip = W * 0.05, minGap = Math.max(2, W * 0.025);
  const strip = (from, step, end) => {
    let x = from;
    while ((step > 0 ? x <= end : x >= end) && cls[x] >= cmin) x += step; // the strip
    const sw = Math.abs(x - from);
    let g = 0;
    while ((step > 0 ? x <= end : x >= end) && cls[x] < cmin) { x += step; g++; } // the gap after it
    return sw > 0 && sw <= maxStrip && g >= minGap && Math.abs(end - x) >= W * 0.5 ? x : null;
  };
  const l = strip(x0, 1, x1); if (l != null) x0 = l;
  const r = strip(x1, -1, x0); if (r != null) x1 = r;
  return [x0, x1];
}
/** Pad an unpadded box (array) by `pad` on every side, clamped to the page; returns an object box. */
export const padBox = (a, pad = DEFAULT_PAD) => (a ? { x0: clamp01(a[0] - pad), y0: clamp01(a[1] - pad), x1: clamp01(a[2] + pad), y1: clamp01(a[3] + pad) } : null);

// ------------------------------------------------------------ 5.2 text ----
const NUMBERED = /^(\d+(\.\d+){0,2}|[A-H](\.\d+)*|[IVX]+)\.?\s+\p{Lu}/u;
const NAMED = /^(abstract|introduction|background|related work|methods?|results|discussion|conclusions?|limitations|references|bibliography|acknowledge?ments|appendix|appendices)\.?$/i;
const REFS = /^(\d+\.?\s*)?(references|bibliography|works cited|literature cited)\b/i;
const APPX = /^(appendix|appendices|supplementary (material|information))\b/i;
const LETTERED = /^[A-H](\.\d+)*\.?\s+\p{Lu}/u;
const FRONT_END = /^(chapter|part)\s+(1|i|one)\b|^introduction$/i;
const TOC_HEAD = /^(contents|table of contents)$/i;
export const INDEX_LINE = /,\s*\d+([–-]\d+)?(,\s*\d+([–-]\d+)?)*$/;
const BOLD = /Bold|Black|Semibold|Heavy/i;
const words = (s) => (String(s).match(/\S+/g) || []).length;

/**
 * Lines of one PDF page from pdf.js getTextContent() items, top to bottom:
 * [{t, size, bold, y, x, block}] where block is true for the first line of a
 * block (a gap of more than 1.4 lines above it, or a change of size).
 * fontOf(fontName) → {name, bold} | null, optional (pdf.js commonObjs).
 */
export function textLines(items, fontOf = () => null) {
  const lines = [];
  let cur = null;
  for (const it of items || []) {
    if (typeof it.str !== 'string') continue;
    const tr = it.transform || [1, 0, 0, 1, 0, 0];
    const size = Math.hypot(tr[2], tr[3]) || Math.abs(tr[3]) || 10;
    const y = tr[5], x = tr[4];
    if (!cur || Math.abs(y - cur.y) > size * 0.5) {
      if (cur && cur.t.trim()) lines.push(cur);
      cur = { t: '', size: 0, chars: 0, bold: true, y, x, font: it.fontName };
    }
    if (it.str.trim()) {
      const f = fontOf(it.fontName);
      const b = !!(f && (f.bold || f.black || BOLD.test(f.name || '')));
      cur.bold &&= b;
      cur.size = Math.max(cur.size, size); cur.chars += it.str.length;
      cur.x = Math.min(cur.x, x);
    }
    cur.t += it.str;
    if (it.hasEOL) { if (cur.t.trim()) lines.push(cur); cur = null; }
  }
  if (cur && cur.t.trim()) lines.push(cur);
  // Content-stream order is (nearly always) reading order, column by column;
  // pdf.js gives y upwards from the bottom, so a jump up starts a new column.
  for (const [j, l] of lines.entries()) {
    l.t = l.t.replace(/\s+/g, ' ').trim();
    const prev = lines[j - 1];
    const dy = prev ? prev.y - l.y : 0;
    l.block = !prev || dy > 1.4 * Math.max(l.size, prev.size) || dy < -0.5 * l.size || Math.abs(prev.size - l.size) > 0.15 * l.size;
    l.second = !!prev && prev.block && !l.block;
  }
  return lines;
}
/** The document's body text size: the median line size weighted by characters. */
export function bodySize(pagesLines) {
  const w = [];
  for (const ls of pagesLines) for (const l of ls) if (l.size > 0) w.push([l.size, l.chars || l.t.length]);
  if (!w.length) return 10;
  w.sort((a, b) => a[0] - b[0]);
  const tot = w.reduce((s, x) => s + x[1], 0);
  let acc = 0; for (const [s, c] of w) { acc += c; if (acc >= tot / 2) return s; }
  return w.at(-1)[0];
}
/**
 * The interesting lines of page k for roles and contents: heading candidates
 * ({t, k, head: true}) and short lines that name the references, an appendix
 * or a contents page ({t, k, head: false}). `body` is the body text size
 * (0 when sizes are unknown, as from pdftotext or OCR: then short lines that
 * match a pattern count as headings).
 */
export function headsOf(lines, k, body = 0) {
  const out = [];
  for (const l of lines) {
    const t = String(l.t || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length > 90) continue;
    const pat = (NUMBERED.test(t) && !/^0[.\s]/.test(t)) || NAMED.test(t.replace(/^(\d+(\.\d+)*|[A-H]|[IVX]+)\.?\s+/, ''));
    const styled = body > 0 ? (l.size >= 1.15 * body || l.bold) && (l.block || l.second) : t.length <= 60;
    if (pat && styled) out.push({ t, k, head: true });
    else if (t.length <= 40 && (REFS.test(t) || APPX.test(t) || TOC_HEAD.test(t) || FRONT_END.test(t))) out.push({ t, k, head: false });
  }
  return out;
}
/**
 * The text in a page's bands (analyzeLum with bands: true), for runningBands: lines
 * [{t, x, y0, y1}] in fractions of the page, y down (pdf.js items through the viewport,
 * pdftotext -bbox-layout lines). A line that reaches into a band (±0.4%) or lies beyond
 * it, toward the page's edge, with its middle on the band's side of the gap, is that
 * band's: a thin page number or rule may show on the grid as one row, or not at all.
 * Each band gets `t` (its lines left to right, top to bottom) and `ty` (the top of its
 * first line), and keeps neither when no line is in it; and `tx`, the outer edge of the
 * other lines (three words or more) that lie wholly in the gap between the rest of the
 * page and the band: text too faint for the grid, kept when the band is cut. Changes
 * `bands` in place.
 */
export function bandTexts(bands, lines) {
  if (!bands) return bands;
  for (const b of [bands.top, bands.bot]) {
    if (!b) continue;
    const e = 0.004, top = b === bands.top;
    const ls = (lines || []).filter((l) => {
      if (!l?.t || !Number.isFinite(l.y0) || !Number.isFinite(l.y1)) return false;
      const m = (l.y0 + l.y1) / 2;
      return top ? l.y0 <= b.y1 + e && m < b.next : l.y1 >= b.y0 - e && m > b.prev;
    }).sort((a, c) => (Math.abs(a.y0 - c.y0) < 0.005 ? a.x - c.x : a.y0 - c.y0));
    const t = ls.map((l) => String(l.t)).join(' ').replace(/\s+/g, ' ').trim();
    if (t) { b.t = t.slice(0, 200); b.ty = r4(Math.min(...ls.map((l) => l.y0))); }
    // Other lines wholly in the gap between the rest of the page and the band: text too faint to
    // show on the grid (a grey footnote over a running foot). Cutting the band keeps them: `tx`,
    // their outer edge. Three words at least (of two letters or more), so the pieces of a formula
    // that pdf.js sets apart do not count.
    const gap = (lines || []).filter((l) => l?.t && (String(l.t).match(/\p{L}{2,}/gu) || []).length >= 3 && Number.isFinite(l.y0) && Number.isFinite(l.y1) && !ls.includes(l) && (top ? l.y0 > b.y1 + e && l.y1 < b.next : l.y0 > b.prev && l.y1 < b.y0 - e));
    if (gap.length) b.tx = r4(top ? Math.min(...gap.map((l) => l.y0)) : Math.max(...gap.map((l) => l.y1)));
  }
  return bands;
}
/** What has to match for a band to repeat: letters, digits as # (page numbers), roman page numbers at either end as #. */
export const bandKey = (t) => String(t || '').toLowerCase().trim().replace(/^[ivxlc]+(?=\s|$)|(?<=\s)[ivxlc]+$/g, '#').replace(/\d+/g, '#').replace(/[^\p{L}#]+/gu, '');
/** Fraction of a page's lines that look like index entries ("Entropy, 12, 40–42"). */
export const indexFrac = (texts) => { const ls = texts.filter((t) => t.trim()); return ls.length < 5 ? 0 : ls.filter((t) => INDEX_LINE.test(t.trim())).length / ls.length; };
export { words as countWords };

// ----------------------------------------------------------- 5.3 roles ----
/**
 * Roles per page: 'cover' | 'front' | 'toc' | 'body' | 'refs' | 'appendix' | 'index' | 'blank'.
 * pages: [{k, blank, lab?}], heads: from headsOf(), ixf: index-line fraction per page.
 */
export function pageRoles(pages, heads = [], kind = 'pdf', ixf = []) {
  const n = pages.length;
  const role = new Array(n).fill(null);
  for (const p of pages) if (p.blank) role[p.k] = 'blank';
  const hs = [...heads].filter((l) => l.k >= 0 && l.k < n).sort((a, b) => a.k - b.k);
  const tx = (l) => l.t.trim();
  if (kind === 'scan' && n) {
    if (!role[0]) role[0] = 'cover';
    let fe = pages.findIndex((p) => p.lab === '1');
    // Page 1 often carries no printed number (a chapter opening): count back from
    // the first run of three consecutive arabic labels.
    if (fe < 0) {
      const num = (k) => (pages[k]?.lab && /^\d+$/.test(pages[k].lab) ? Number(pages[k].lab) : null);
      const k0 = pages.findIndex((p) => { const L = num(p.k); return L != null && L < 40 && num(p.k + 1) === L + 1 && num(p.k + 2) === L + 2; });
      if (k0 >= 0 && k0 - (num(k0) - 1) >= 1) fe = k0 - (num(k0) - 1);
    }
    if (fe < 0) { const lim = Math.ceil(n * 0.15); const l = hs.find((x) => x.k <= lim && FRONT_END.test(tx(x))); fe = l ? l.k : 0; }
    for (let k = 1; k < fe; k++) if (!role[k]) role[k] = hs.some((l) => l.k === k && TOC_HEAD.test(tx(l))) ? 'toc' : 'front';
  }
  // From 40% of the document on; papers with long appendices put their references
  // earlier, so failing that, from 15% on.
  const isRef = (l) => (l.head || tx(l).length <= 40) && REFS.test(tx(l));
  const refL = hs.find((l) => l.k >= Math.floor(n * 0.4) && isRef(l)) || hs.find((l) => l.k >= Math.floor(n * 0.15) && isRef(l));
  const refs = refL ? refL.k : -1;
  const a0 = refs >= 0 ? refs + 1 : Math.floor(n * 0.5);
  const appL = hs.find((l) => l.k >= a0 && l.head && (APPX.test(tx(l)) || (refs >= 0 && LETTERED.test(tx(l)))));
  const app = appL ? appL.k : -1;
  let idx = -1;
  if (kind === 'scan' || n >= 100) {
    let k = n - 1;
    while (k >= 0 && (role[k] === 'blank' || (ixf[k] ?? 0) >= 0.4)) k--;
    const first = pages.slice(k + 1).find((p) => !p.blank);
    if (first && n - (k + 1) >= 2) idx = first.k;
  }
  for (let k = 0; k < n; k++) {
    if (role[k]) continue;
    role[k] = idx >= 0 && k >= idx ? 'index' : app >= 0 && k >= app ? 'appendix' : refs >= 0 && k >= refs ? 'refs' : 'body';
  }
  return role;
}
const span = (pages, roles) => { const ks = pages.filter((p) => roles.includes(p.role)).map((p) => p.k); return ks.length ? [Math.min(...ks), Math.max(...ks)] : null; };
/** Inclusive page ranges of the front matter, body, references, appendix and index. */
export function rangesOf(pages) {
  const n = pages.length;
  const front = span(pages, ['cover', 'front', 'toc']);
  const refs = span(pages, ['refs']), appendix = span(pages, ['appendix']), index = span(pages, ['index']);
  const stop = Math.min(...[refs, appendix, index].filter(Boolean).map((r) => r[0]), n);
  const bodyKs = pages.filter((p) => p.role === 'body' && p.k < stop).map((p) => p.k);
  const body = bodyKs.length ? [bodyKs[0], bodyKs.at(-1)] : [0, Math.max(0, n - 1)];
  return { front, body, refs, appendix, index };
}

// ------------------------------------------------------ 5.4 crop groups ----
const GROUP_ROLES = new Set(['body', 'refs', 'appendix', 'index']);
const RUN_AT = 0.005; // "the same place": within half a percent of the page height

/**
 * Running heads and feet (born-digital PDFs): which pages' first (last) band repeats,
 * so the crop leaves it out. pages: [{k, w, h, ink, blank, role, bands}], bands from
 * analyzeLum and bandTexts. Looked at in three scopes, every page, the even pages and
 * the odd pages (journals alternate), over the portrait pages that are not blank and
 * have a crop-group role:
 *   - the slot: the place (the band's text top, ±0.5%) where the most bands of the
 *     scope are; it counts only when at least half the scope's pages have one there;
 *   - a band in the slot is running when its text (bandKey: digits as #, so page
 *     numbers match) is that of another band in the slot (a paper's one running head;
 *     a book's chapter head on the pages of its chapter), or when the slot holds at
 *     least 3/4 of the scope, at least half of its bands repeat so, and the band has the
 *     slot's shape (its outer edge, and its inner edge or the start of the rest of the
 *     page, within 0.5% of the slot's: a book's section head, the same line and rule with
 *     other words), except on the first page, whose own header (a journal's) may sit just
 *     where the running head does. Without repeats the shape says nothing: the first line
 *     of the body text has the same place and height on every page (widely spaced lines
 *     are bands of their own).
 * A tight band (a figure set close under the header) counts only with its outer and
 * inner edges within 0.5% of the slot's. A page's own header (a first page's), section
 * titles, figures that reach the top, and a header on only some pages are not in a
 * slot, or not repeated. Bands with no text are never running (scanned PDFs, a rule alone).
 * Returns {head: Map k → band, foot: Map k → band}.
 */
export function runningBands(pages) {
  const elig = pages.filter((p) => !p.blank && p.ink && p.bands && p.w <= p.h && GROUP_ROLES.has(p.role ?? 'body'));
  const first = pages.find((p) => !p.blank)?.k; // its own header may sit where the running head does
  const out = { head: new Map(), foot: new Map() };
  for (const [side, name] of [['top', 'head'], ['bot', 'foot']]) {
    for (const scope of ['all', 0, 1]) {
      const S = scope === 'all' ? elig : elig.filter((p) => p.k % 2 === scope);
      if (S.length < 3) continue;
      const bs = [];
      for (const p of S) {
        const b = p.bands[side], key = b?.t ? bandKey(b.t) : '';
        if (b && key && key.length <= 120 && Number.isFinite(b.ty)) bs.push({ p, b, key });
      }
      bs.sort((a, c) => a.b.ty - c.b.ty);
      let slot = [];
      for (let i = 0, j = 0; i < bs.length; i++) {
        while (bs[i].b.ty - bs[j].b.ty > 2 * RUN_AT) j++;
        if (i - j + 1 > slot.length) slot = bs.slice(j, i + 1);
      }
      if (slot.length < Math.max(3, Math.ceil(0.5 * S.length))) continue;
      const count = new Map();
      for (const x of slot) count.set(x.key, (count.get(x.key) || 0) + 1);
      // The shape alone says nothing in a slot whose bands do not repeat: there the first (last)
      // line of the body text sits in the same place, at the same height, on every page.
      const strong = slot.length >= 0.75 * S.length && slot.filter((x) => count.get(x.key) >= 2).length >= 0.5 * slot.length;
      // The shape: the band's outer edge, and its inner edge or where the rest of the page
      // starts (ends), so a rule a little higher on one page, or a figure that starts lower,
      // does not count; a band that took in more of the page moves both.
      const [o, i, r] = side === 'top' ? ['y0', 'y1', 'next'] : ['y1', 'y0', 'prev'];
      const m = (f) => median(slot.map((x) => x.b[f]));
      const mo = m(o), mi = m(i), mr = m(r), near = (x, f, v) => Math.abs(x.b[f] - v) <= RUN_AT;
      for (const x of slot) {
        // A tight band (only a narrow gap under it) counts only with both its edges where the slot's are.
        if (x.b.tight ? !(near(x, o, mo) && near(x, i, mi)) : false) continue;
        const shaped = strong && x.p.k !== first && near(x, o, mo) && (near(x, i, mi) || near(x, r, mr));
        if (count.get(x.key) >= 2 || shaped) out[name].set(x.p.k, x.b);
      }
    }
  }
  return out;
}

/**
 * One crop box shared by the body pages (recto and verso for scans with enough
 * pages, plus a group of landscape pages); pages that would lose ink under it
 * get their own box. pages: [{k, w, h, ink, blank, dens, role}].
 * Returns {groups: {body?, recto?, verso?, land?}, cg: [name per page], crop: {k: Box}}.
 */
export function cropGroups(pages, kind = 'pdf', pair = null, q = 0.1) {
  const nb = pages.filter((p) => !p.blank && p.ink);
  const roleOk = (p) => GROUP_ROLES.has(p.role ?? 'body');
  const med = median(nb.filter(roleOk).map(ar)) ?? median(nb.map(ar)) ?? 0.75;
  const isLand = (p) => ar(p) > 1.15 * med;
  const lands = nb.filter(isLand);
  const cands = nb.filter((p) => roleOk(p) && Math.abs(ar(p) / med - 1) <= 0.04 && p.dens < 0.6);
  let split = false;
  if (kind === 'scan') { const even = cands.filter((p) => p.k % 2 === 0).length; split = even >= 8 && cands.length - even >= 8; }
  const verso = (k) => k % 2 === (pair ?? 0);
  const nat = (p) => (split ? (verso(p.k) ? 'verso' : 'recto') : 'body');
  const groupOf = (p) => (isLand(p) ? (lands.length >= 2 ? 'land' : 'own') : nat(p));
  const seed = {};
  for (const g of ['body', 'recto', 'verso', 'land']) {
    const ps = g === 'land' ? (lands.length >= 2 ? lands : []) : cands.filter((p) => !isLand(p) && nat(p) === g);
    if (!ps.length) continue;
    seed[g] = ps.length >= 3
      ? [pct(ps.map((p) => p.ink[0]), q), pct(ps.map((p) => p.ink[1]), q), pct(ps.map((p) => p.ink[2]), 1 - q), pct(ps.map((p) => p.ink[3]), 1 - q)]
      : ps.reduce((u, p) => union(u, p.ink), null);
  }
  const cg = new Array(pages.length).fill('body'), crop = {}, members = {};
  const own = [];
  for (const p of pages) {
    if (p.blank || !p.ink) { cg[p.k] = isLand(p) ? 'body' : nat(p); continue; }
    const g = groupOf(p);
    if (g !== 'own' && seed[g] && fits(p.ink, seed[g], 0.01)) { cg[p.k] = g; (members[g] ||= []).push(p); } else own.push(p);
  }
  // A group's box is the union of its members' ink: within 0.01 of the seed,
  // and nothing of a member is ever cut off.
  const groups = {};
  for (const [g, ps] of Object.entries(members)) groups[g] = ps.reduce((u, p) => union(u, p.ink), null).map(r4);
  for (const p of own) {
    const g = groupOf(p);
    cg[p.k] = 'own';
    crop[p.k] = union(g !== 'own' ? groups[g] : null, p.ink).map(r4);
  }
  return { groups, cg, crop };
}
/** The box to show page k: its own crop or its group's, padded and clamped; null for blank pages. */
export function cropOf(P, k, pad = DEFAULT_PAD) {
  const p = P?.pages?.[k];
  if (!p || p.blank) return null;
  let a = p.cg === 'own' ? p.crop || p.ink : P.crop?.groups?.[p.cg] || p.ink;
  // A shared box keeps a spread's pages the same shape, but it must never cut into this
  // page's own ink (full-bleed art and dark pages, wide tables, marginal notes): any side
  // where the page's ink reaches more than 1% of the page beyond the box takes the ink in.
  if (a && p.ink && p.cg !== 'own') {
    const t = 0.01, n = p.ink;
    if (n[0] < a[0] - t || n[1] < a[1] - t || n[2] > a[2] + t || n[3] > a[3] + t)
      a = [n[0] < a[0] - t ? n[0] : a[0], n[1] < a[1] - t ? n[1] : a[1], n[2] > a[2] + t ? n[2] : a[2], n[3] > a[3] + t ? n[3] : a[3]];
  }
  return a ? padBox(a, pad) : null;
}
/** Shown width / height of page k with the crop applied (crop off: the page's own shape). */
export function pageAspect(P, k, pad = DEFAULT_PAD, crop = true) {
  const p = P?.pages?.[k];
  if (!p) return null;
  if (!crop) return ar(p);
  const b = cropOf(P, k, pad);
  return b ? ((b.x1 - b.x0) * p.w) / Math.max(1e-6, (b.y1 - b.y0) * p.h) : null;
}

// ----------------------------------------------------------- 5.5 layout ----
function pairOf(pages, kind) {
  if (kind !== 'scan') return null;
  const c = [0, 0];
  for (const p of pages) if (p.lab && /^\d+$/.test(p.lab)) c[(((p.k - Number(p.lab)) % 2) + 2) % 2]++;
  if (c[0] + c[1] === 0) return 1;
  return c[0] >= c[1] ? 0 : 1;
}
/** skip (blank pages), alone (shown by themselves), pair (facing pages) and the spread starts at 2 and 3 per spread. */
export function layoutOf(P) {
  const pages = P.pages || [];
  const nb = pages.filter((p) => !p.blank);
  const med = median(nb.map(ar)) ?? 0.75;
  const skip = pages.filter((p) => p.blank).map((p) => p.k);
  const alone = new Set();
  const body = P.aspect?.body || null;
  for (const p of nb) {
    if (med < 1 && ar(p) > 1.15 * med) alone.add(p.k);
    if (p.cg === 'own' && body) { const a = pageAspect(P, p.k); if (a && a > 1.3 * body) alone.add(p.k); }
  }
  if (P.kind === 'scan' && pages[0] && !pages[0].blank) alone.add(0);
  const L = { alone: [...alone].sort((a, b) => a - b), skip, pair: pairOf(pages, P.kind) };
  const Q = { n: P.n, layout: L };
  L.starts = { 2: spreadStarts(Q, 2), 3: spreadStarts(Q, 3) };
  return L;
}
/** First page of every spread at `per` pages per spread, walking skip, alone and pair. */
export function spreadStarts(P, per) {
  const n = P.n || 0, L = P.layout || {};
  const skip = new Set(L.skip || []), alone = new Set(L.alone || []);
  const pair = L.pair ?? null;
  const starts = [];
  let k = 0;
  while (k < n) {
    starts.push(k);
    let count = 0;
    if (per === 2 && pair != null && k % 2 !== pair && !skip.has(k)) {
      k += 1;
      while (k < n && skip.has(k)) k++;
      continue;
    }
    while (k < n && count < per) {
      if (skip.has(k)) { k++; continue; }
      if (alone.has(k)) { if (count === 0) { k++; count = per; } else break; } else { k++; count++; }
    }
    while (k < n && skip.has(k)) k++;
  }
  return starts;
}
const startsMemo = new WeakMap();
function startsFor(P, per) {
  per = Math.max(1, Math.round(per) || 1);
  if ((per === 2 || per === 3) && P.layout?.starts?.[per]) return P.layout.starts[per];
  let m = startsMemo.get(P); if (!m) { m = new Map(); startsMemo.set(P, m); }
  if (!m.has(per)) m.set(per, spreadStarts(P, per));
  return m.get(per);
}
/** The largest spread start not after page s. */
export function snapStart(P, s, per) {
  const st = startsFor(P, per);
  if (!st.length) return s;
  let lo = 0, hi = st.length - 1;
  if (s <= st[0]) return st[0];
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (st[mid] <= s) lo = mid; else hi = mid - 1; }
  return st[lo];
}
/** The pages of the spread that starts at (or contains) page s. */
export function spreadAt(P, s, per) {
  const st = startsFor(P, per);
  const a = snapStart(P, s, per);
  let lo = 0, hi = st.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (st[mid] <= a) lo = mid; else hi = mid - 1; }
  const end = st[lo + 1] ?? P.n;
  const out = []; for (let k = a; k < end; k++) out.push(k);
  return out;
}

// ------------------------------------------------------------- 5.6 toc ----
/** Contents from detected headings: numbered or named ones, deduplicated, in page order. */
export function tocFromHeads(heads) {
  const out = [], seen = new Set();
  for (const l of [...heads].filter((x) => x.head).sort((a, b) => a.k - b.k)) {
    const t = l.t.replace(/\s+/g, ' ').trim();
    const m = t.match(NUMBERED);
    const bare = t.replace(/^(\d+(\.\d+)*|[A-H]|[IVX]+)\.?\s+/, '');
    if (!m && !NAMED.test(bare)) continue;
    const key = t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (seen.has(key)) continue;
    seen.add(key);
    const num = m ? m[1] : '';
    const d = num && /^[\d.A-H]+$/.test(num) ? Math.min(2, (num.match(/\./g) || []).length) : 0;
    out.push({ t: t.slice(0, 120), k: l.k, d, src: 'heads' });
    if (out.length >= 80) break;
  }
  return out;
}

// ----------------------------------------------------------- 5.8 hints ----
export function hintsOf(P) {
  const out = [];
  const pages = P.pages || [];
  const nb = pages.filter((p) => !p.blank);
  const med = median(nb.map(ar)) ?? 0.75;
  if (nb.length && med >= 1.25) out.push({ code: 'one-up', why: 'Landscape pages (slides or a report): one at a time.' });
  if (P.kind === 'scan' && P.layout?.pair != null && pages.length && pages.filter((p) => p.lab).length >= 0.7 * pages.length) out.push({ code: 'facing-pages', why: 'Printed page numbers say which pages face each other.' });
  const body = nb.filter((p) => p.role === 'body');
  if (body.length && body.filter((p) => p.gut != null).length >= 0.6 * body.length) out.push({ code: 'split-columns', why: 'Most body pages have two columns.' });
  const f = P.ranges?.front;
  if (f && f[1] - f[0] + 1 >= 4) out.push({ code: 'skip-front', why: `${f[1] - f[0] + 1} pages of front matter.` });
  if ((P.layout?.alone || []).some((k) => pages[k] && ar(pages[k]) > 1.15 * med)) out.push({ code: 'landscape', why: 'Some pages are landscape and are shown alone.' });
  if ((P.kind === 'pdf' && P.text?.layer === 'none') || (P.kind === 'scan' && !(P.text?.words > 0))) out.push({ code: 'ocr-poor', why: P.kind === 'pdf' ? 'Most pages have no text layer.' : 'No OCR text.' });
  return out;
}

// -------------------------------------------------------------- finalize ----
const FLOW = new Set(['html', 'web', 'text']);
/**
 * Build a profile (without rev, pid, assets, stale: the server sets those)
 * from a producer's raw analysis:
 *   {id, kind, src, by, at, ms, n,
 *    pages: [{k, w, h, rot?, ink, blank, gut, dens, words, lab?, fig?}],
 *    heads: from headsOf(), ixf: [index-line fraction per page],
 *    outline: [{t, k, d}] (PDF outline or flow outline), figures?, labels?,
 *    flowWords?: [words per stable page]}
 */
export function finalize(raw) {
  const kind = raw.kind;
  const base = { schema: SCHEMA, gen: GEN, id: raw.id, kind, src: raw.src || {}, by: raw.by || 'browser', at: raw.at || new Date().toISOString(), ms: Math.round(raw.ms || 0) };
  const outline = (raw.outline || []).filter((o) => o && o.t).slice(0, 80);
  if (FLOW.has(kind)) {
    const fw = raw.flowWords || [];
    const n = raw.n || fw.length || 0;
    return {
      ...base, n, pages: [], crop: { pad: DEFAULT_PAD, groups: {} }, aspect: { page: 0, body: 0 },
      layout: { alone: [], skip: [], pair: null, starts: { 2: [], 3: [] } },
      toc: outline.map((o) => ({ t: String(o.t).slice(0, 120), k: o.k ?? null, d: Math.max(0, Math.min(2, o.d | 0)), src: 'flow' })),
      ranges: { front: null, body: [0, Math.max(0, n - 1)], refs: null, appendix: null, index: null },
      text: { layer: 'html', pages: fw.length ? r4(fw.filter((w) => w >= 30).length / fw.length) : 0, words: fw.length ? fw.reduce((a, b) => a + b, 0) : -1 },
      labels: null, figures: null, hints: [],
    };
  }
  const pages = (raw.pages || []).map((p, k) => {
    const q = { k, w: +p.w || 0, h: +p.h || 0, ink: p.blank ? null : p.ink ? p.ink.map(r4) : null, blank: !!p.blank || !p.ink, gut: p.gut ?? null, dens: r4(p.dens || 0), cg: 'body', words: Number.isFinite(p.words) ? p.words : -1, role: 'body' };
    if (p.rot) q.rot = p.rot;
    if (p.lab) q.lab = String(p.lab).slice(0, 16);
    if (Array.isArray(p.fig)) q.fig = p.fig;
    return q;
  });
  const n = pages.length;
  const roles = pageRoles(pages, raw.heads || [], kind, raw.ixf || []);
  pages.forEach((p, k) => { p.role = roles[k]; });
  // Running heads and feet are left out of the ink box before the crop groups are
  // found, so the shared box leaves them out and cropOf does not take them back in.
  if (kind === 'pdf') {
    const rb = (raw.pages || []).map((p) => (p?.bands && typeof p.bands === 'object' ? p.bands : null));
    const R = runningBands(pages.map((p, k) => ({ ...p, bands: rb[k] })));
    for (const p of pages) {
      const b = rb[p.k], h = R.head.get(p.k), f = R.foot.get(p.k);
      if (!h && !f) continue;
      let ink = h && f ? b.both : h ? b.top.ink : b.bot.ink;
      if (!isBox(ink)) continue; // a page that is nothing but its head and foot keeps them
      // Faint text between the rest of the page and a band that goes (bandTexts' tx) stays in.
      ink = [ink[0], h && Number.isFinite(h.tx) ? Math.min(ink[1], h.tx) : ink[1], ink[2], f && Number.isFinite(f.tx) ? Math.max(ink[3], f.tx) : ink[3]];
      p.ink = ink.map(r4);
      if (h) p.head = [r4(h.y0), r4(h.y1)];
      if (f) p.foot = [r4(f.y0), r4(f.y1)];
    }
  }
  const pair = pairOf(pages, kind);
  const G = cropGroups(pages, kind, pair);
  pages.forEach((p, k) => { p.cg = G.cg[k]; if (G.crop[k]) p.crop = G.crop[k]; });
  const P = { ...base, n, pages, crop: { pad: DEFAULT_PAD, groups: G.groups } };
  const nb = pages.filter((p) => !p.blank);
  const bodyPages = nb.filter((p) => p.role === 'body');
  const pageAr = median((bodyPages.length ? bodyPages : nb).map(ar)) ?? 0.75;
  const gb = ['body', 'verso', 'recto'].map((g) => G.groups[g]).filter(Boolean);
  const boxAr = (a) => ((a[2] - a[0] + 2 * DEFAULT_PAD) / (a[3] - a[1] + 2 * DEFAULT_PAD)) * pageAr;
  const bodyAr = gb.length ? gb.reduce((s, a) => s + boxAr(a), 0) / gb.length : median(nb.map((p) => pageAspect(P, p.k)).filter(Boolean)) ?? pageAr;
  P.aspect = { page: r4(pageAr), body: r4(bodyAr) };
  P.layout = layoutOf(P);
  const heads = tocFromHeads(raw.heads || []);
  // Scans get no contents from analysis (running heads look like headings); the augmentation's section map fills in.
  P.toc = outline.length >= 3 ? outline.map((o) => ({ t: String(o.t).slice(0, 120), k: o.k ?? null, d: Math.max(0, Math.min(2, o.d | 0)), src: 'outline' })) : kind === 'scan' ? [] : heads;
  P.ranges = rangesOf(pages);
  const known = pages.filter((p) => p.words >= 0);
  const wordy = known.filter((p) => p.words >= 30).length;
  const layer = kind === 'scan' ? 'ocr' : known.length && wordy >= 0.3 * n ? 'pdf' : 'none';
  P.text = { layer, pages: n ? r4(wordy / n) : 0, words: known.length ? known.reduce((s, p) => s + p.words, 0) : -1 };
  P.labels = raw.labels !== undefined ? raw.labels : pages.some((p) => p.lab) ? (kind === 'scan' ? 'ia' : 'pdf') : null;
  P.figures = raw.figures !== undefined ? raw.figures : pages.some((p) => p.fig) ? pages.reduce((s, p) => s + (p.fig?.length || 0), 0) : null;
  P.hints = hintsOf(P);
  return P;
}

// -------------------------------------------------------------- validate ----
const isBox = (b) => Array.isArray(b) && b.length === 4 && b.every((v) => typeof v === 'number' && v >= 0 && v <= 1) && b[0] < b[2] && b[1] < b[3];
const isSpan = (s) => Array.isArray(s) && s.length === 2 && s.every((v) => typeof v === 'number' && v >= 0 && v <= 1) && s[0] < s[1];
const KINDS = new Set(['pdf', 'scan', 'html', 'web', 'text']);
const ROLES = new Set(['cover', 'front', 'toc', 'body', 'refs', 'appendix', 'index', 'blank']);
const CGS = new Set(['body', 'recto', 'verso', 'land', 'own']);
/** null when P is a well-formed analysis upload, else a short reason. */
export function validate(P) {
  if (!P || typeof P !== 'object') return 'not an object';
  if (P.schema !== SCHEMA) return 'schema';
  if (!Number.isInteger(P.gen) || P.gen < 1) return 'gen';
  if (typeof P.id !== 'string' || !P.id) return 'id';
  if (!KINDS.has(P.kind)) return 'kind';
  if (!Number.isInteger(P.n) || P.n < 0 || P.n > 20000) return 'n';
  if (!Array.isArray(P.pages)) return 'pages';
  const raster = P.kind === 'pdf' || P.kind === 'scan';
  if (raster && P.pages.length !== P.n) return 'n does not match pages';
  for (const [j, p] of P.pages.entries()) {
    if (!p || p.k !== j) return `pages[${j}].k`;
    if (!(p.w > 0 && p.h > 0)) return `pages[${j}] size`;
    if (p.ink != null && !isBox(p.ink)) return `pages[${j}].ink`;
    if (p.crop != null && !isBox(p.crop)) return `pages[${j}].crop`;
    if (!CGS.has(p.cg)) return `pages[${j}].cg`;
    if (p.cg === 'own' && !p.blank && !p.crop) return `pages[${j}] own without crop`;
    if (!ROLES.has(p.role)) return `pages[${j}].role`;
    if (p.gut != null && !(p.gut > 0 && p.gut < 1)) return `pages[${j}].gut`;
    for (const f of ['head', 'foot']) if (p[f] != null && !isSpan(p[f])) return `pages[${j}].${f}`;
    if (p.head && p.ink && p.head[1] > p.ink[1]) return `pages[${j}].head overlaps ink`;
    if (p.foot && p.ink && p.foot[0] < p.ink[3]) return `pages[${j}].foot overlaps ink`;
    for (const f of p.fig || []) if (!isBox(f.b)) return `pages[${j}].fig`;
  }
  for (const [g, b] of Object.entries(P.crop?.groups || {})) if (!CGS.has(g) || !isBox(b)) return `crop.groups.${g}`;
  const L = P.layout;
  if (!L || !Array.isArray(L.alone) || !Array.isArray(L.skip)) return 'layout';
  const inRange = (k) => Number.isInteger(k) && k >= 0 && k < Math.max(1, P.n);
  if (raster && ![...L.alone, ...L.skip].every(inRange)) return 'layout pages';
  for (const per of ['2', '3']) if (L.starts?.[per] && !L.starts[per].every(inRange)) return `layout.starts.${per}`;
  if (!Array.isArray(P.toc) || P.toc.some((t) => typeof t.t !== 'string' || (t.k != null && !inRange(t.k)))) return 'toc';
  const R = P.ranges;
  if (!R || !Array.isArray(R.body)) return 'ranges';
  for (const r of Object.values(R)) if (r != null && !(Array.isArray(r) && r.length === 2 && r[0] <= r[1] && inRange(r[0]) && inRange(r[1]))) return 'ranges values';
  if (!P.aspect || !(P.aspect.body >= 0) || !(P.aspect.page >= 0)) return 'aspect';
  return null;
}
