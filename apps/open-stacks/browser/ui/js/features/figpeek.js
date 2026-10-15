// Figure peek: rest the pointer on a figure, table or plate on a raster page
// (PDF or scan) and it opens enlarged over the neighbouring page(s), with its
// caption. Pages to the right are covered when the figure is on the left or
// middle page, pages to the left when it is on the right-most one; a wide
// figure spans two pages, and the figure itself is never covered. Move into
// the enlargement to inspect it: the wheel zooms further, a drag pans, a
// double-click fits it again. A click on a figure (or in the enlargement)
// pins it; Esc, × or a click elsewhere closes it. Z turns peeking on or off.
//
// Finding figures happens lazily: in idle time after 'spread:settled', or on
// the first hover over a page; never during a turn. A page becomes:
//  - text runs: pdf.js text items (OCR lines for scans) joined along a line
//    and split at wide gaps. Long body-size runs are prose; runs that start
//    "Figure 3:", "Table 2.", "Fig. 4 |", "PLATE IV" … begin captions;
//  - image placements: the operator list's paintImage* ops under the current
//    transform (PDFs);
//  - an ink grid, about 240 cells across, from the page as rendered on screen
//    (the panels' canvases through their crop boxes).
// Ink that is not text, plus placed images, is graphics. Graphics grow by
// about a line, never through prose or captions (nor across the gutter of a
// two-column page), into connected regions, which take in the small text
// around them (axis labels, legends, sub-figure letters) but not prose or
// their caption. Captions then claim the regions beside them (above for
// figures, below for tables; sub-figures unite), and a caption with no region
// proposes one: the ink between it and the prose above (or below). Regions
// with no caption stay only when they are clearly graphics. Regions are kept
// in fractions of the page, so they serve every crop, column split and zoom.
//
// The enlargement is sharp: PDFs re-render just the region from the PDF at
// the size shown (an offset viewport), again for each zoom; scans crop the
// full-size page image. The panel's own canvas, scaled, shows until then.
import { $, h, P, on, store, toast, lru, registerKey } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { openDoc, pdfjs, scanUrl } from '../docs.js';
import { loadImg, analyze } from '../render.js';

const REST_MS = 150; // pointer rest before the enlargement opens
const GRACE_MS = 450; // time to move from the figure into the enlargement
const SMAX = 4.5; // largest enlargement over the size on the page
const raster = (it) => !!it && (it.kind === 'pdf' || it.kind === 'scan');
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 900 }) : setTimeout(fn, 80));
const FULL = { x0: 0, y0: 0, x1: 1, y1: 1 };
let enabled = store.get('figpeek', true);
let tlMod = null; // features/textlayer.js, when present: its page text is shared
const textlayer = () => (tlMod ||= import('./textlayer.js').catch(() => null));
/** Diagnostics: per opened enlargement, ms from the pointer arriving on the
 *  figure to the enlargement on screen and to its sharp render; per page, ms to detect. */
export const peekTimes = [];
export const detectTimes = [];
export const debug = { on: false };

const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const pct = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.max(0, Math.min(s.length - 1, Math.floor(q * (s.length - 1))))]; };
function wmedian(pairs) {
  if (!pairs.length) return 0;
  pairs.sort((a, b) => a[0] - b[0]);
  const tot = pairs.reduce((s, p) => s + p[1], 0); let acc = 0;
  for (const [v, w] of pairs) { acc += w; if (acc >= tot / 2) return v; }
  return pairs[pairs.length - 1][0];
}
const ovX = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
const ovY = (a, b) => Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
const near = (a, b, mx, my) => a.x0 <= b.x1 + mx && a.x1 >= b.x0 - mx && a.y0 <= b.y1 + my && a.y1 >= b.y0 - my;
const grow = (a, b) => { a.x0 = Math.min(a.x0, b.x0); a.y0 = Math.min(a.y0, b.y0); a.x1 = Math.max(a.x1, b.x1); a.y1 = Math.max(a.y1, b.y1); };

// ---------- page text as runs ----------
/** pdf.js text items to runs in page units (the scale-1 viewport, y down). */
function pdfRuns(tc, vp) {
  const its = [];
  for (const x of tc.items) {
    if (!x.str || !x.str.trim() || !x.transform) continue;
    const [a, b, c, d, e, f] = x.transform;
    const fs = Math.hypot(c, d) || Math.hypot(a, b) || x.height;
    if (!(fs > 0)) continue;
    const la = Math.hypot(a, b) || fs, lc = Math.hypot(c, d) || fs;
    const ux = a / la, uy = b / la, vx = c / lc, vy = d / lc;
    const w = x.width > 0 ? x.width : fs * 0.5 * x.str.length;
    let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
    for (const s of [0, w]) for (const t of [-0.21 * fs, 0.79 * fs]) {
      const [px, py] = vp.convertToViewportPoint(e + ux * s + vx * t, f + uy * s + vy * t);
      X0 = Math.min(X0, px); X1 = Math.max(X1, px); Y0 = Math.min(Y0, py); Y1 = Math.max(Y1, py);
    }
    const [bx, by] = vp.convertToViewportPoint(e, f), [qx, qy] = vp.convertToViewportPoint(e + ux * fs, f + uy * fs);
    const rot = Math.abs(qy - by) > 0.15 * Math.abs(qx - bx);
    its.push({ x0: X0, y0: Y0, x1: X1, y1: Y1, fs, base: by, n: x.str.length, str: x.str, rot });
  }
  const runs = its.filter((t) => t.rot);
  // Lines by baseline, then runs split at gaps wider than about a character.
  const hz = its.filter((t) => !t.rot).sort((p, q) => p.base - q.base);
  const lines = [];
  for (const t of hz) {
    const L = lines[lines.length - 1];
    if (L && t.base - L.base < 0.45 * Math.max(L.fs, t.fs)) { L.items.push(t); L.fs = Math.max(L.fs, t.fs); } else lines.push({ base: t.base, fs: t.fs, items: [t] });
  }
  for (const L of lines) {
    L.items.sort((p, q) => p.x0 - q.x0);
    const fsl = median(L.items.map((t) => t.fs));
    let S = null;
    for (const t of L.items) {
      const gap = S ? t.x0 - S.x1 : Infinity;
      // A caption beside wrapped text starts a run of its own.
      if (S && gap < 0.9 * fsl && !(gap > 0.3 * fsl && /^\s*(fig(ure)?s?\.?|table)\s*\d/i.test(t.str))) {
        S.str += (gap > 0.12 * fsl ? ' ' : '') + t.str; S.fsw += t.fs * t.n; S.nw += t.n; S.n += t.n + 1; grow(S, t);
      } else { S = { ...t, fsw: t.fs * t.n, nw: t.n }; runs.push(S); }
    }
  }
  for (const s of runs) if (s.fsw) { s.fs = s.fsw / Math.max(1, s.nw); delete s.fsw; delete s.nw; }
  return runs;
}
/** OCR words to runs in page-image pixels. Words much taller than the
 *  page's words, or with no letters or digits, are OCR noise (often read
 *  from inside a picture) and are left out. */
function ocrRuns(o) {
  const hs = median(o.words.map((w) => w.y1 - w.y0)) || 20;
  const byL = new Map();
  for (const w of o.words) {
    if (w.y1 - w.y0 > hs * 3 || !/[\p{L}\p{N}]/u.test(w.t)) continue;
    (byL.get(w.l) || byL.set(w.l, []).get(w.l)).push(w);
  }
  const runs = [];
  for (const ws of byL.values()) {
    ws.sort((a, b) => a.x0 - b.x0);
    const hl = median(ws.map((w) => w.y1 - w.y0));
    let S = null;
    for (const w of ws) {
      // One run per line, except that "Fig. 35. … Fig. 36." under two drawings are two captions.
      if (S && w.x0 - S.x1 < 3 * hl && !(w.x0 - S.x1 > hl && /^(fig|plate|table)/i.test(w.t))) { S.str += ' ' + w.t; S.n += w.t.length + 1; grow(S, w); S.base = S.y1; } else {
        S = { x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1, fs: hl, n: w.t.length, str: w.t, rot: false, base: w.y1 };
        runs.push(S);
      }
    }
  }
  return runs;
}

// ---------- image placements (PDF operator list) ----------
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
function imageBoxes(ol, OPS, vp) {
  const fa = ol.fnArray, aa = ol.argsArray, out = [], st = [];
  let m = [1, 0, 0, 1, 0, 0], annot = 0;
  const unit = (mm) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const [px, py] = vp.convertToViewportPoint(mm[0] * u + mm[2] * v + mm[4], mm[1] * u + mm[3] * v + mm[5]);
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    if (!annot) out.push({ x0, y0, x1, y1 });
  };
  const IMG = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject, OPS.paintSolidColorImageMask, OPS.paintJpegXObject].filter((x) => x != null));
  for (let i = 0; i < fa.length; i++) {
    const op = fa[i], a = aa[i];
    if (op === OPS.save) st.push(m);
    else if (op === OPS.restore) m = st.pop() || m;
    else if (op === OPS.transform) m = mul(m, a);
    else if (op === OPS.paintFormXObjectBegin) { st.push(m); if (Array.isArray(a?.[0]) && a[0].length === 6) m = mul(m, a[0]); } else if (op === OPS.paintFormXObjectEnd) m = st.pop() || m;
    else if (op === OPS.beginGroup) { st.push(m); if (a?.[0]?.matrix) m = mul(m, a[0].matrix); } else if (op === OPS.endGroup) m = st.pop() || m;
    else if (op === OPS.beginAnnotation) { annot++; st.push(m); } else if (op === OPS.endAnnotation) { annot = Math.max(0, annot - 1); m = st.pop() || m; } else if (IMG.has(op)) unit(m);
    else if (op === OPS.paintImageXObjectRepeat) { const [, sx, sy, pos] = a; for (let j = 0; j + 1 < (pos?.length || 0); j += 2) unit(mul(m, [sx, 0, 0, sy, pos[j], pos[j + 1]])); }
  }
  return out;
}

// ---------- ink ----------
/** The panels on screen that show page k of `it`. */
function panelsOf(it, k) {
  if (state.view !== 'feed' || items[current()]?.id !== it.id) return [];
  return [...document.querySelectorAll('#spread > .pg')].filter((e) => e._pnl?.canvas && Number(e.dataset.k) === k).map((e) => e._pnl);
}
/** A page that is not on screen (tests, or a turn under way): render or load it small. */
async function pageSource(it, k) {
  if (it.kind === 'scan') { const im = await loadImg(P(scanUrl(it, k, 1000))); return [{ src: im, box: FULL }]; }
  const page = await (await openDoc(it)).pdf.getPage(k + 1);
  const vp1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 960 / vp1.width });
  const c = h('canvas', { width: Math.round(vp.width), height: Math.round(vp.height) });
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: g, viewport: vp }).promise;
  return [{ src: c, box: FULL }];
}
/** Ink per grid cell (1 = ink), the grid about 240 cells across (300 for scans). */
async function inkGrid(it, k, W, H, scan) {
  let srcs = panelsOf(it, k).map((p) => ({ src: p.canvas, box: p.box }));
  if (!srcs.length) srcs = await pageSource(it, k);
  const GW = scan ? 300 : 240, cs = W / GW, GH = Math.max(8, Math.round(H / cs));
  const c = h('canvas', { width: GW, height: GH });
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, GW, GH);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const cover = scan ? new Uint8Array(GW * GH) : null;
  for (const { src, box: b } of srcs) {
    const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    g.drawImage(src, 0, 0, sw, sh, b.x0 * GW, b.y0 * GH, (b.x1 - b.x0) * GW, (b.y1 - b.y0) * GH);
    if (scan) {
      // Only the printed area counts: not scanner beds, page edges or shadows.
      const a = analyze(src);
      if (a.blank) continue;
      const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
      const x0 = Math.floor((b.x0 + a.box.x0 * bw) * GW), x1 = Math.ceil((b.x0 + a.box.x1 * bw) * GW), y0 = Math.floor((b.y0 + a.box.y0 * bh) * GH), y1 = Math.ceil((b.y0 + a.box.y1 * bh) * GH);
      for (let y = Math.max(0, y0); y < Math.min(GH, y1); y++) cover.fill(1, y * GW + Math.max(0, x0), y * GW + Math.min(GW, x1));
    }
  }
  const px = g.getImageData(0, 0, GW, GH).data, ink = new Uint8Array(GW * GH);
  const lum = (i) => 0.3 * px[4 * i] + 0.59 * px[4 * i + 1] + 0.11 * px[4 * i + 2];
  if (!scan) {
    for (let i = 0; i < GW * GH; i++) {
      const r = px[4 * i], gg = px[4 * i + 1], bb = px[4 * i + 2];
      ink[i] = lum(i) < 238 || Math.max(r, gg, bb) - Math.min(r, gg, bb) > 36 ? 1 : 0;
    }
  } else {
    const ls = []; for (let i = 0; i < GW * GH; i += 3) if (cover[i]) ls.push(lum(i));
    const bg = ls.length ? pct(ls, 0.8) : 230, thr = bg - Math.max(26, bg * 0.13);
    for (let i = 0; i < GW * GH; i++) ink[i] = cover[i] && lum(i) < thr ? 1 : 0;
  }
  return { gw: GW, gh: GH, cs, ink };
}

// ---------- finding regions ----------
const CAP = /^\s*(fig(?:ure)?s?\.?|table|tab\.|algorithm|alg\.|listing|plate|chart|exhibit|diagram|box)\s*(S?\d+|[IVXLC]+\b)((?:[.\-–]\d+)?[a-z]?)(\s*[:.|—–]|\s*$|\s+(?=[A-Z]))/i;
/** "FIGURE 3", "fig 3" -> "Figure 3", "Fig. 3". */
function capLabel(m) {
  const w = m[1].replace(/\.$/, ''), word = w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w;
  return `${word}${/^(figs?|tab|alg)$/i.test(w) ? '.' : ''} ${m[2]}${m[3] || ''}`;
}
const capKind = (w) => (/^(tab|alg|list)/i.test(w) ? 'table' : 'figure');
/** Separable box dilation of a 0/1 grid by rx, ry cells. */
function dilate(src, gw, gh, rx, ry) {
  const tmp = new Uint8Array(src.length), out = new Uint8Array(src.length);
  for (let y = 0; y < gh; y++) {
    let last = -1e9; const o = y * gw;
    for (let x = 0; x < gw; x++) { if (src[o + x]) last = x; if (x - last <= rx) tmp[o + x] = 1; }
    last = 1e9;
    for (let x = gw - 1; x >= 0; x--) { if (src[o + x]) last = x; if (last - x <= rx) tmp[o + x] = 1; }
  }
  for (let x = 0; x < gw; x++) {
    let last = -1e9;
    for (let y = 0; y < gh; y++) { if (tmp[y * gw + x]) last = y; if (y - last <= ry) out[y * gw + x] = 1; }
    last = 1e9;
    for (let y = gh - 1; y >= 0; y--) { if (tmp[y * gw + x]) last = y; if (last - y <= ry) out[y * gw + x] = 1; }
  }
  return out;
}

/** The figure regions of one page, from its text runs, image boxes and ink.
 *  W, H: the page in its own units (PDF points or image pixels). */
export function findRegions({ W, H, runs, imgs = [], grid, scan = false }) {
  const { gw, gh, cs, ink } = grid;
  const ci = (x) => Math.max(0, Math.min(gw - 1, Math.floor(x / cs)));
  const cj = (y) => Math.max(0, Math.min(gh - 1, Math.floor(y / cs)));
  const fill = (m, b, v = 1) => { const a = ci(b.x0), z = ci(b.x1); for (let j = cj(b.y0); j <= cj(b.y1); j++) m.fill(v, j * gw + a, j * gw + z + 1); };
  const letters = (s) => { const t = s.str.replace(/\s+/g, ''); return t.length ? (t.match(/\p{L}/gu) || []).length / t.length : 0; };
  const textLike = (s) => s.str.replace(/\s+/g, '').length >= 2 && letters(s) >= (scan ? 0.7 : 0.55);

  // 1. Body text size, the text block, and two columns or one.
  const hz = runs.filter((s) => !s.rot);
  const body = wmedian(hz.filter((s) => s.n >= 12 && textLike(s)).map((s) => [s.fs, s.n])) || wmedian(hz.map((s) => [s.fs, s.n])) || H * 0.012;
  const fsOk = (s) => s.fs > body * (scan ? 0.7 : 0.8) && s.fs < body * (scan ? 1.45 : 1.25);
  const long = hz.filter((s) => fsOk(s) && s.n >= 25 && textLike(s));
  let two = false, gL = 0, gR = 0, bx0 = W * 0.08, bx1 = W * 0.92;
  if (long.length >= 4) {
    bx0 = pct(long.map((s) => s.x0), 0.05); bx1 = pct(long.map((s) => s.x1), 0.95);
    const mid = (bx0 + bx1) / 2;
    const L = long.filter((s) => s.x1 < mid + body), R = long.filter((s) => s.x0 > mid - body), X = long.filter((s) => s.x0 < mid - 2 * body && s.x1 > mid + 2 * body);
    // (Full-width captions and figures may span the gutter on a page whose text is in two columns.)
    if (L.length >= 3 && R.length >= 3 && (X.length < 0.2 * long.length || L.length + R.length >= Math.max(8, X.length))) {
      gL = pct(L.map((s) => s.x1), 0.9); gR = pct(R.map((s) => s.x0), 0.1);
      two = gR - gL > 0.3 * body;
    }
  }
  const gm = (gL + gR) / 2;
  const colOf = (x0, x1) => (!two ? [bx0, bx1] : x1 <= gm + body ? [bx0, gL] : x0 >= gm - body ? [gR, bx1] : [bx0, bx1]);

  // 2. Prose: long body-size lines, and the short last lines of their paragraphs.
  for (const s of hz) { const [c0, c1] = colOf(s.x0, s.x1); s.prose = fsOk(s) && s.n >= 15 && textLike(s) && s.x1 - s.x0 >= 0.62 * (c1 - c0); }
  const byY = hz.slice().sort((a, b) => a.y0 - b.y0);
  // Text wrapped beside a figure is narrow but justified: lines that share both edges with the lines around them.
  for (const s of byY) {
    if (s.prose || !fsOk(s) || !textLike(s) || s.n < 15) continue;
    const mates = byY.filter((o) => o !== s && Math.abs(o.x0 - s.x0) < 0.5 * body && Math.abs(o.x1 - s.x1) < 0.5 * body && Math.abs(o.y0 - s.y0) < 4 * body && fsOk(o));
    if (mates.length >= 2) s.prose = true;
  }
  for (const s of byY) {
    if (s.prose || !fsOk(s) || !textLike(s)) continue;
    const c0 = colOf(s.x0, s.x1)[0];
    if (byY.some((p) => p.prose && p !== s && s.y0 - p.y1 > -0.3 * body && s.y0 - p.y1 < 0.8 * body && (Math.abs(s.x0 - p.x0) < 1.2 * body || Math.abs(s.x0 - c0) < 1.2 * body))) s.prose = true;
  }
  // Running heads and page numbers: the edges of the page, and a topmost line in small type.
  const top = Math.min(...hz.map((s) => s.y0), H);
  for (const s of runs) s.margin = s.y1 < 0.065 * H || s.y0 > 0.94 * H || (!s.rot && s.y1 < 0.1 * H && s.y0 - top < body && s.fs <= 0.92 * body);
  const heads = runs.filter((s) => s.margin && !s.rot && s.y1 < 0.5 * H);
  const headY = Math.max(0.075 * H, ...heads.map((s) => s.y1 + 1.2 * body));

  // 3. Captions: a line-starting run "Figure 3:" and the lines that follow it.
  const caps = [];
  for (const s of byY) {
    const m = CAP.exec(s.str);
    if (!m || s.cap || s.margin) continue;
    // "Figure 3 shows …" is body text ("Figure 3 Loss curves" a caption; the i flag lets [A-Z] match any letter).
    const rest = s.str.slice(m.index + m[0].length);
    if (!m[4].trim() && rest.trim() && !/^[A-Z]/.test(rest)) continue;
    const [c0] = colOf(s.x0, s.x1);
    if (hz.some((o) => o !== s && Math.abs(o.base - s.base) < 0.5 * body && o.x1 <= s.x0 + 1 && o.x1 > c0 - body && s.x0 - o.x1 < 3 * body)) continue; // not at a line start
    const blk = { x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, runs: [s], kind: capKind(m[1]), label: capLabel(m) };
    s.cap = blk;
    let last = s;
    // A caption stays in its column on a two-column page (unless its label starts across both).
    const inCol = !two ? () => true : s.x1 <= gm + body ? (o) => o.x1 <= gm + body : s.x0 >= gm - body ? (o) => o.x0 >= gm - body : () => true;
    // The rest of the label's line first (a bold label is often a run of its own).
    for (const o of byY.filter((o) => !o.cap && !o.margin && inCol(o) && Math.abs(o.base - s.base) < 0.5 * body && o.x0 >= s.x0).sort((a, b) => a.x0 - b.x0)) {
      if (o.x0 - blk.x1 > 3 * body || CAP.test(o.str)) break;
      o.cap = blk; blk.runs.push(o); grow(blk, o);
    }
    // A bare label ("Fig. 39.") is followed by body text, not more caption (nor, in scans, is any label).
    const bare = blk.runs.reduce((n, o) => n + o.str.trim().length, 0) <= m[0].trim().length + 2;
    for (let more = true; more && blk.runs.length < 24;) {
      more = false;
      for (const o of byY) {
        // A line that starts "Figure 7." continues a caption whose line breaks mid-sentence ("… are shown in").
        if (o.cap || o.margin || !inCol(o) || (CAP.test(o.str) && /[.!?:]["”)]?\s*$/.test(last.str)) || ((bare || scan) && o.prose)) continue;
        const sameLine = Math.abs(o.base - last.base) < 0.5 * body && o.x0 >= blk.x0 - body && o.x0 - blk.x1 < 3 * body && o.y0 >= blk.y0 - body;
        const next = o.y0 - last.y1 > -0.5 * s.fs && o.y0 - last.y1 < 0.75 * s.fs && ovX(o, blk) > 0 && Math.abs(o.fs - s.fs) < 0.2 * s.fs;
        if (sameLine || next) { o.cap = blk; blk.runs.push(o); grow(blk, o); if (o.y0 > last.y0) last = o; more = true; }
      }
    }
    for (const o of blk.runs) o.prose = false;
    const txt = blk.runs.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0).map((o) => o.str).join(' ').replace(/(\w)- (\w)/g, '$1$2').replace(/\s+/g, ' ').trim();
    blk.text = txt.replace(CAP, '').replace(/^[\s:.|—–]+/, '').trim();
    caps.push(blk);
  }

  // 4. Grids: barriers (prose, captions, running heads), text, graphics.
  const N = gw * gh, B = new Uint8Array(N), T = new Uint8Array(N), G = new Uint8Array(N);
  const isBar = (s) => s.prose || s.cap || (s.margin && !s.rot);
  // Scans: OCR boxes miss ascenders, descenders and the smear of the print,
  // so text masks reach further and prose bars close the gaps between lines.
  const ex = (scan ? 0.5 : 0.12), ey = (scan ? 0.35 : 0.12), by = scan ? -0.3 : 0.08;
  for (const s of runs) {
    fill(T, { x0: s.x0 - ex * s.fs, y0: s.y0 - ey * s.fs, x1: s.x1 + ex * s.fs, y1: s.y1 + ey * s.fs });
    if (isBar(s)) fill(B, { x0: s.x0, y0: s.y0 + by * s.fs, x1: s.x1, y1: s.y1 - by * s.fs });
  }
  for (const c of caps) {
    fill(B, c);
    // Scans: a caption line closes off its whole column (drawings must not leak round it).
    if (scan) { const [c0, c1] = colOf(c.x0, c.x1); fill(B, { x0: Math.min(c.x0, c0) - 0.03 * W, y0: c.y0 + 0.2 * (c.y1 - c.y0), x1: Math.max(c.x1, c1) + 0.03 * W, y1: c.y1 - 0.2 * (c.y1 - c.y0) }); }
  }
  for (let i = 0; i < N; i++) G[i] = ink[i] && !T[i] ? 1 : 0;
  // The rule under a running head (or over the footer) is a barrier, not a figure.
  for (let j = 0; j < gh; j++) {
    if (j * cs > headY && (j + 1) * cs < 0.93 * H) continue;
    let run = 0, best = 0, end = 0;
    for (let x = 0; x < gw; x++) if (ink[j * gw + x]) { if (++run > best) { best = run; end = x; } } else run = 0;
    if (best * cs < 0.6 * (bx1 - bx0)) continue;
    const a = end - best + 1;
    let g = 0; for (let x = a; x <= end; x++) g += G[j * gw + x];
    if (g < 0.3 * best) continue; // a line of text, not a rule
    // Right under the running head it is its rule; elsewhere only when nothing touches it.
    const underHead = heads.some((s) => s.y1 <= (j + 1) * cs && j * cs - s.y1 < 1.2 * body);
    const thick = !underHead && [-2, 2].some((dj) => { const jj = j + dj; if (jj < 0 || jj >= gh) return false; let n = 0; for (let x = a; x <= end; x++) n += G[jj * gw + x]; return n > 0.3 * best; });
    if (!thick) for (let x = a; x <= end; x++) { G[j * gw + x] = 0; B[j * gw + x] = 1; }
  }
  const pics = imgs.filter((b) => b.x1 - b.x0 > 0.03 * W && b.y1 - b.y0 > 0.02 * H && !(b.x1 - b.x0 > 0.92 * W && b.y1 - b.y0 > 0.92 * H));
  // An image counts where it has ink (placements often carry white margins), never over a barrier.
  for (const b of pics) {
    let x0 = gw, y0 = gh, x1 = -1, y1 = -1;
    for (let j = cj(b.y0); j <= cj(b.y1); j++) for (let x = ci(b.x0); x <= ci(b.x1); x++) if (ink[j * gw + x] && !B[j * gw + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
    if (x1 < 0) { b.dead = true; continue; }
    Object.assign(b, { x0: Math.max(b.x0, x0 * cs), y0: Math.max(b.y0, y0 * cs), x1: Math.min(b.x1, (x1 + 1) * cs), y1: Math.min(b.y1, (y1 + 1) * cs) });
    fill(G, b);
  }
  if (scan && long.length >= 4) { // page edges, shadows and the next page's bleed lie outside the text block
    const a = ci(bx0 - 0.006 * W), z = ci(bx1 + 0.006 * W);
    for (let y = 0; y < gh; y++) { B.fill(1, y * gw, y * gw + a); B.fill(1, y * gw + z + 1, (y + 1) * gw); }
    // A page edge or binding shadow just beside the text: a tall column of ink outside the text block.
    for (let x = Math.max(0, a); x <= Math.min(gw - 1, z); x++) {
      if (x * cs >= bx0 && (x + 1) * cs <= bx1) continue;
      let n = 0; for (let y = 0; y < gh; y++) n += G[y * gw + x];
      if (n >= 0.3 * gh) for (let y = 0; y < gh; y++) B[y * gw + x] = 1;
    }
  }
  for (let i = 0; i < N; i++) if (B[i]) G[i] = 0;
  if (scan) { // specks and stray print: graphics cells with almost no graphics around them
    const K = G.slice();
    for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
      const i = y * gw + x; if (!K[i]) continue;
      const n = K[i - 1] + K[i + 1] + K[i - gw] + K[i + gw] + K[i - gw - 1] + K[i - gw + 1] + K[i + gw - 1] + K[i + gw + 1];
      if (n < 2) G[i] = 0;
    }
  }
  // 5. Grow the graphics by about a line, but not through barriers, nor across the gutter.
  const r = Math.max(2, Math.round((1.05 * body) / cs));
  const D = dilate(G, gw, gh, r, r);
  for (let i = 0; i < N; i++) if (B[i]) D[i] = 0;
  if (two) {
    // Only graphics that run across the gutter join the columns (not a rule or a speck in it).
    const a = ci(gL + 0.15 * (gR - gL)), z = Math.max(a, ci(gR - 0.15 * (gR - gL)));
    for (let y = 0; y < gh; y++) {
      let n = 0; for (let x = a; x <= z; x++) n += G[y * gw + x];
      const across = n >= 0.6 * (z - a + 1);
      for (let x = a; x <= z; x++) D[y * gw + x] = across && G[y * gw + x] ? 1 : 0;
    }
  }
  // 6. Connected regions of grown graphics; each keeps the box of its own graphics.
  const lab = new Int32Array(N).fill(-1), regs = [];
  const q = new Int32Array(N);
  for (let i0 = 0; i0 < N; i0++) {
    if (!D[i0] || lab[i0] >= 0) continue;
    const id = regs.length; let qh = 0, qt = 0; q[qt++] = i0; lab[i0] = id;
    const R = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, gc: 0 };
    while (qh < qt) {
      const i = q[qh++], x = i % gw, y = (i / gw) | 0;
      if (G[i]) { R.gc++; R.x0 = Math.min(R.x0, x); R.x1 = Math.max(R.x1, x); R.y0 = Math.min(R.y0, y); R.y1 = Math.max(R.y1, y); }
      if (x > 0 && D[i - 1] && lab[i - 1] < 0) { lab[i - 1] = id; q[qt++] = i - 1; }
      if (x < gw - 1 && D[i + 1] && lab[i + 1] < 0) { lab[i + 1] = id; q[qt++] = i + 1; }
      if (y > 0 && D[i - gw] && lab[i - gw] < 0) { lab[i - gw] = id; q[qt++] = i - gw; }
      if (y < gh - 1 && D[i + gw] && lab[i + gw] < 0) { lab[i + gw] = id; q[qt++] = i + gw; }
    }
    regs.push(R);
  }
  let rs = regs.filter((R) => R.gc >= 4).map((R) => ({ x0: R.x0 * cs, y0: R.y0 * cs, x1: (R.x1 + 1) * cs, y1: (R.y1 + 1) * cs, gc: R.gc }));
  for (const b of pics) { if (b.dead) continue; const R = rs.find((x) => ovX(x, b) > 0 && ovY(x, b) > 0); if (R) { grow(R, b); R.img = true; } }
  // 7. Each region takes in nearby small text (labels, legends) and touching regions.
  rs.sort((a, b) => b.gc - a.gc);
  const lab2 = runs.filter((s) => !s.prose && !s.cap && !s.margin && s.fs < 3 * body);
  for (const R of rs) {
    if (R.dead) continue;
    for (let changed = true; changed;) {
      changed = false;
      // Labels from the region's own column only (unless it spans both).
      const side = !two ? 0 : R.x1 <= gm + body ? -1 : R.x0 >= gm - body ? 1 : 0;
      for (const s of lab2) if (!s.used && near(s, R, 1.6 * body, 1.25 * body) && (side === 0 || (side < 0 ? s.x1 <= gm + body : s.x0 >= gm - body))) { grow(R, s); s.used = R; changed = true; }
      for (const Q of rs) if (Q !== R && !Q.dead && near(Q, R, 0.4 * body, 0.4 * body)) { grow(R, Q); R.gc += Q.gc; R.img ||= Q.img; Q.dead = true; changed = true; }
    }
  }
  rs = rs.filter((R) => !R.dead);
  const proseIn = (R) => { let a = 0; for (const s of hz) if (s.prose) { const w = ovX(s, R), hh = ovY(s, R); if (w > 0 && hh > 0) a += w * hh; } return a / Math.max(1, (R.x1 - R.x0) * (R.y1 - R.y0)); };
  for (const R of rs) {
    const w = R.x1 - R.x0, hh = R.y1 - R.y0, cells = (w * hh) / (cs * cs);
    R.ok = w >= 0.06 * W && hh >= 0.03 * H && R.gc >= 16 && R.gc >= 0.012 * cells && !(hh < 0.02 * H);
    R.boxed = proseIn(R) > 0.18; // a framed text box: a figure only with a caption
    R.strong = R.ok && !R.boxed && ((R.gc >= 60 && hh >= 0.05 * H && w >= 0.1 * W) || (R.img && w >= 0.1 * W && hh >= 0.05 * H));
  }

  // 8. Captions claim regions beside them; a caption with none proposes one.
  const bars = runs.filter(isBar).concat(caps);
  const between = (a, b, x0, x1, skip) => bars.some((s) => s !== skip && !(skip?.runs || []).includes(s) && s.y0 >= a - 0.2 * body && s.y1 <= b + 0.2 * body && Math.min(s.x1, x1) - Math.max(s.x0, x0) > 0.25 * Math.min(s.x1 - s.x0, x1 - x0));
  const out = [];
  const spanOf = (C) => { const [c0, c1] = colOf(C.x0, C.x1); return [Math.min(c0, C.x0), Math.max(c1, C.x1)]; };
  const profile = (C, sx0, sx1, below) => {
    // The ink beside a caption: walk away from it, over a small gap, through
    // the ink, until a blank band or a barrier.
    const a = ci(sx0), z = ci(sx1);
    const rowInk = (j) => { let n = 0; for (let x = a; x <= z; x++) { const i = j * gw + x; if (B[i]) return -1; if (ink[i]) n++; } return n; };
    const step = below ? 1 : -1, maxGap = Math.round((4 * body) / cs), blank = Math.round((2.2 * body) / cs);
    let j = below ? cj(C.y1) + 1 : cj(C.y0) - 1, gap = 0;
    while (j >= 0 && j < gh && gap <= maxGap) { const n = rowInk(j); if (n < 0) return null; if (n > 0) break; gap++; j += step; }
    if (gap > maxGap || j < 0 || j >= gh) return null;
    let first = j, lastInk = j, run = 0;
    for (; j >= 0 && j < gh; j += step) {
      const n = rowInk(j);
      if (n < 0) break;
      if (n > 0) { lastInk = j; run = 0; } else if (++run > blank) break;
    }
    const y0 = Math.min(first, lastInk), y1 = Math.max(first, lastInk);
    let x0 = Infinity, x1 = -Infinity;
    for (let y = y0; y <= y1; y++) for (let x = a; x <= z; x++) if (ink[y * gw + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    if (x1 < x0) return null;
    const R = { x0: x0 * cs, y0: y0 * cs, x1: (x1 + 1) * cs, y1: (y1 + 1) * cs, gc: 0, proposed: true };
    return R.y1 - R.y0 >= 1.5 * body && R.x1 - R.x0 >= 0.06 * W ? R : null;
  };
  for (const C of caps) {
    const [sx0, sx1] = spanOf(C);
    const S = { x0: sx0, x1: sx1 };
    const sideOf = (R) => (R.y1 <= C.y0 + 0.5 * body ? 'above' : R.y0 >= C.y1 - 0.5 * body ? 'below' : null);
    // A caption vouches for small drawings too.
    const fits = (R) => R.ok || R.boxed || (R.x1 - R.x0 >= 0.025 * W && R.y1 - R.y0 >= 0.025 * H && R.gc >= 12);
    const cand = rs.filter((R) => fits(R) && !R.cap && ovX(R, S) > 0.3 * Math.min(R.x1 - R.x0, sx1 - sx0)).map((R) => {
      const side = sideOf(R); if (!side) return null;
      const d = side === 'above' ? C.y0 - R.y1 : R.y0 - C.y1;
      if (d > 0.45 * H) return null;
      if (side === 'above' ? between(R.y1, C.y0, Math.max(R.x0, sx0), Math.min(R.x1, sx1), C) : between(C.y1, R.y0, Math.max(R.x0, sx0), Math.min(R.x1, sx1), C)) return null;
      // Prefer the figure on the caption's side, then the one right above (or below) the caption.
      const al = Math.max(0, ovX(R, C)) / Math.max(1, Math.min(R.x1 - R.x0, C.x1 - C.x0));
      return { R, side, al, d: d + ((side === 'below') === (C.kind === 'figure') ? 0.02 * H : 0) + 0.25 * H * (1 - Math.min(1, al)) };
    }).filter(Boolean).sort((a, b) => a.d - b.d);
    let F = null;
    if (cand.length && (cand[0].side === 'above' ? C.y0 - cand[0].R.y1 : cand[0].R.y0 - C.y1) <= 0.15 * H) {
      const side = cand[0].side;
      // Sub-figures: every region on that side up to the barrier beyond the nearest.
      F = { ...cand[0].R };
      // Sub-figures side by side, or pieces close together, become one region;
      // sub-figures stacked further apart stay apart (each enlarges more) and share the caption.
      const wide = C.x1 - C.x0 > 0.5 * (sx1 - sx0);
      cand[0].R.cap = C;
      for (const c of cand.slice(1).sort((a, b) => a.d - b.d)) {
        if (c.side !== side || !(wide || c.al > 0.3) || c.d > 0.45 * H) continue;
        const R = c.R, gapY = Math.max(R.y0 - F.y1, F.y0 - R.y1);
        if ((ovY(R, F) > 0.3 * Math.min(R.y1 - R.y0, F.y1 - F.y0) && c.d < 0.12 * H) || gapY < 0.04 * H) { grow(F, R); R.cap = C; } else { R.cap = C; out.push({ ...R, cap: C, kind: C.kind }); }
      }
    } else {
      const order = C.kind === 'table' ? [true, false] : [false, true];
      for (const below of order) if ((F = profile(C, sx0, sx1, below))) break;
    }
    if (F) { F.cap = C; F.kind = C.kind; out.push(F); }
  }
  for (const R of rs) if (!R.cap && R.strong && !(scan && ((R.y0 + R.y1) / 2 < 0.07 * H || (R.y0 + R.y1) / 2 > 0.95 * H))) {
    R.kind = 'figure'; out.push(R);
    // A plate's legend: the short centred line or two right under it, numbered or not.
    if (scan && (R.x1 - R.x0) * (R.y1 - R.y0) > 0.3 * W * H) {
      const cx = (R.x0 + R.x1) / 2;
      const leg = hz.filter((s) => !s.prose && !s.margin && s.y0 >= R.y1 - 0.5 * body && s.y0 - R.y1 < 3 * body && Math.abs((s.x0 + s.x1) / 2 - cx) < 0.12 * (R.x1 - R.x0)).sort((a, b) => a.y0 - b.y0).slice(0, 2);
      if (leg.length) R.cap = { label: '', text: leg.map((s) => s.str).join(' ').replace(/\s+/g, ' ').trim() };
    }
  }

  // 9. Merge overlaps; pad a little; keep the page's figures in reading order.
  out.sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0));
  const fin = [];
  for (const R of out) {
    const A = (R.x1 - R.x0) * (R.y1 - R.y0);
    const o = fin.find((F) => { const w = ovX(F, R), hh = ovY(F, R); return w > 0 && hh > 0 && w * hh > 0.5 * Math.min(A, (F.x1 - F.x0) * (F.y1 - F.y0)); });
    if (o) { if (!o.cap || !R.cap || o.cap === R.cap) { grow(o, R); o.cap ||= R.cap; } continue; }
    fin.push(R);
  }
  const p = 0.35 * body;
  const res = fin.filter((R) => (R.x1 - R.x0) * (R.y1 - R.y0) < 0.92 * W * H || R.cap || scan).map((R) => ({
    x0: Math.max(0, (R.x0 - p) / W), y0: Math.max(0, (R.y0 - p) / H), x1: Math.min(1, (R.x1 + p) / W), y1: Math.min(1, (R.y1 + p) / H),
    kind: R.cap?.kind || (scan && (R.x1 - R.x0) * (R.y1 - R.y0) > 0.45 * W * H ? 'plate' : 'figure'),
    cap: R.cap ? { label: R.cap.label, text: R.cap.text } : null,
  }));
  res.sort((a, b) => (Math.abs(a.y0 - b.y0) < 0.02 ? a.x0 - b.x0 : a.y0 - b.y0));
  const out2 = { regions: res, body: body / H, two, gutter: two ? [gL / W, gR / W] : null, caps: caps.length };
  if (debug.on && typeof document !== 'undefined') {
    const c = document.createElement('canvas'); c.width = gw; c.height = gh; const g = c.getContext('2d'); const im = g.createImageData(gw, gh);
    for (let i = 0; i < N; i++) { const o = 4 * i; im.data[o] = G[i] ? 230 : D[i] ? 120 : 255; im.data[o + 1] = T[i] ? 200 : G[i] ? 40 : 255; im.data[o + 2] = B[i] ? 220 : G[i] ? 40 : 255; im.data[o + 3] = 255; if (ink[i] && !G[i] && !T[i] && !B[i]) { im.data[o] = im.data[o + 1] = im.data[o + 2] = 0; } }
    g.putImageData(im, 0, 0); debug.grid = c.toDataURL();
  }
  if (debug.on) out2.dbg = { runs: runs.map((s) => ({ b: [s.x0 / W, s.y0 / H, s.x1 / W, s.y1 / H].map((v) => +v.toFixed(3)), fs: +(s.fs / body).toFixed(2), str: s.str.slice(0, 40), f: (s.prose ? 'P' : '') + (s.cap ? 'C' : '') + (s.margin ? 'M' : '') + (s.used ? 'U' : '') })), rs: rs.map((R) => ({ b: [R.x0 / W, R.y0 / H, R.x1 / W, R.y1 / H].map((v) => +v.toFixed(3)), gc: R.gc, ok: R.ok, boxed: R.boxed, strong: R.strong, cap: R.cap?.label })), caps: caps.map((c) => ({ b: [c.x0 / W, c.y0 / H, c.x1 / W, c.y1 / H].map((v) => +v.toFixed(3)), label: c.label, n: c.runs.length })) };
  return out2;
}

// ---------- regions per page, cached ----------
const found = new Map(); // `${id}|${k}` -> Promise<{W, H, regions}>
const ready = new Map(); // the same, once resolved
const keyOf = (it, k) => it.id + '|' + k;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
/** The figure regions of page k (0-based): { W, H, regions: [{x0, y0, x1, y1 (page fractions), kind, cap}] }. */
export function regionsOf(it, k) {
  return lru(found, keyOf(it, k), async () => {
    const t0 = performance.now();
    let res;
    if (it.kind === 'pdf') {
      const [d, lib, tl] = await Promise.all([openDoc(it), pdfjs(), textlayer()]);
      const page = await d.pdf.getPage(k + 1);
      const vp = page.getViewport({ scale: 1 });
      const tc = tl?.pageModel ? (await tl.pageModel(it, k).catch(() => null))?.tc : null;
      const [text, ol] = await Promise.all([tc || page.getTextContent(), withTimeout(page.getOperatorList(), 2500).catch(() => null)]);
      const grid = await inkGrid(it, k, vp.width, vp.height, false);
      res = { W: vp.width, H: vp.height, ...findRegions({ W: vp.width, H: vp.height, runs: pdfRuns(text, vp), imgs: ol ? imageBoxes(ol, lib.OPS, vp) : [], grid }) };
    } else {
      const tl = await textlayer();
      const m = tl?.pageModel ? await tl.pageModel(it, k).catch(() => null) : null;
      let W = m?.o?.w, H = m?.o?.h;
      if (!W) { const p = panelsOf(it, k)[0]; W = p?.srcW || 1000; H = p?.srcH || 1500; }
      const grid = await inkGrid(it, k, W, H, true);
      const runs = m?.o ? ocrRuns(m.o) : inkRuns(grid);
      res = { W, H, ...findRegions({ W, H, runs, grid, scan: true }) };
    }
    for (const r of res.regions) r.k = k;
    res.ms = Math.round(performance.now() - t0);
    detectTimes.push(res.ms); if (detectTimes.length > 200) detectTimes.shift();
    ready.set(keyOf(it, k), res); while (ready.size > 160) ready.delete(ready.keys().next().value);
    return res;
  }, 120);
}
/** Scans without OCR: text lines are thin blobs of ink a line high; call them runs. */
function inkRuns(grid) {
  const { gw, gh, cs, ink } = grid;
  const D = dilate(ink, gw, gh, 2, 0), lab = new Int32Array(gw * gh).fill(-1), q = new Int32Array(gw * gh), bl = [];
  for (let i0 = 0; i0 < gw * gh; i0++) {
    if (!D[i0] || lab[i0] >= 0) continue;
    let qh = 0, qt = 0; q[qt++] = i0; lab[i0] = bl.length;
    const b = { x0: gw, y0: gh, x1: 0, y1: 0 };
    while (qh < qt) {
      const i = q[qh++], x = i % gw, y = (i / gw) | 0;
      b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y);
      for (const j of [x > 0 ? i - 1 : -1, x < gw - 1 ? i + 1 : -1, y > 0 ? i - gw : -1, y < gh - 1 ? i + gw : -1]) if (j >= 0 && D[j] && lab[j] < 0) { lab[j] = bl.length; q[qt++] = j; }
    }
    bl.push(b);
  }
  const lh = median(bl.filter((b) => b.x1 - b.x0 > 3 * (b.y1 - b.y0 + 1)).map((b) => b.y1 - b.y0 + 1)) || 3;
  return bl.filter((b) => b.y1 - b.y0 + 1 <= 2.2 * lh && b.x1 - b.x0 + 1 >= 2 * lh).map((b) => {
    const n = Math.round((b.x1 - b.x0 + 1) / (lh * 0.45));
    return { x0: b.x0 * cs, y0: b.y0 * cs, x1: (b.x1 + 1) * cs, y1: (b.y1 + 1) * cs, fs: lh * cs, base: (b.y1 + 1) * cs, n, str: 'x'.repeat(n), rot: false };
  });
}

// ---------- outlines on the pages ----------
const resOf = (el) => { const it = items[current()]; return it && el?._pnl ? ready.get(keyOf(it, Number(el.dataset.k))) : null; };
function paintBoxes(it, k, res) {
  if (items[current()]?.id !== it.id) return;
  for (const el of document.querySelectorAll('#spread > .pg')) {
    const p = el._pnl;
    if (!p?.canvas || Number(el.dataset.k) !== k || el._fpRes === res) continue;
    el._fpRes = res;
    el.querySelectorAll(':scope > .fp-r').forEach((x) => x.remove());
    const b = p.box, bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    res.regions.forEach((r, j) => {
      const l = (r.x0 - b.x0) / bw, t = (r.y0 - b.y0) / bh, w = (r.x1 - r.x0) / bw, hh = (r.y1 - r.y0) / bh;
      if (l + w <= 0.01 || l >= 0.99 || t + hh <= 0.01 || t >= 0.99) return;
      const d = h('div', { className: 'fp-r' }); d.dataset.j = j;
      d.style.cssText = `left:${(l * 100).toFixed(3)}%;top:${(t * 100).toFixed(3)}%;width:${(w * 100).toFixed(3)}%;height:${(hh * 100).toFixed(3)}%`;
      el.insertBefore(d, el.querySelector(':scope > .pno'));
    });
  }
}
function markRegion(reg, cls) {
  for (const d of document.querySelectorAll(`#spread .fp-r.${cls}`)) d.classList.remove(cls);
  if (!reg) return;
  for (const el of document.querySelectorAll('#spread > .pg')) {
    const res = resOf(el); const j = res ? res.regions.indexOf(reg) : -1;
    if (j >= 0) el.querySelector(`:scope > .fp-r[data-j="${j}"]`)?.classList.add(cls);
  }
}
let settleGen = 0;
on('spread:settled', ({ it, els }) => {
  const gen = ++settleGen;
  if (!enabled || !raster(it)) return;
  const ks = [...new Set(els.filter((e) => e._pnl?.canvas).map((e) => Number(e.dataset.k)))];
  // Pages already done paint at once; the rest are found one at a time in idle time.
  const todo = [];
  for (const k of ks) { const r = ready.get(keyOf(it, k)); if (r) paintBoxes(it, k, r); else todo.push(k); }
  const step = () => {
    if (gen !== settleGen || !todo.length) return;
    const k = todo.shift();
    regionsOf(it, k).then((r) => { if (gen === settleGen) paintBoxes(it, k, r); }).catch(() => {}).finally(() => idle(step));
  };
  if (todo.length) idle(step);
});

// ---------- hovering ----------
const spread = $('#spread');
let hoverEl = null, pending = null, enterAt = 0, showT = 0, closeT = 0, lastPt = null, swallowUntil = 0;
const S = { reg: null, el: null, it: null, pinned: false, lay: null, z: 1, ox: 0, oy: 0, t0: 0 };
function hitAt(el, x, y) {
  const res = resOf(el); if (!res) return null;
  const b = el._pnl.box, R = el.getBoundingClientRect();
  const fx = b.x0 + ((x - R.left) / R.width) * (b.x1 - b.x0), fy = b.y0 + ((y - R.top) / R.height) * (b.y1 - b.y0);
  let best = null;
  for (const r of res.regions) if (fx >= r.x0 && fx <= r.x1 && fy >= r.y0 && fy <= r.y1 && (!best || (r.x1 - r.x0) * (r.y1 - r.y0) < (best.x1 - best.x0) * (best.y1 - best.y0))) best = r;
  return best;
}
function setHoverPage(el) {
  if (el === hoverEl) return;
  hoverEl?.classList.remove('fp-on', 'fp-over');
  hoverEl = el;
  el?.classList.add('fp-on');
}
function onMove(e) {
  if (!enabled || state.view !== 'feed' || e.buttons) return;
  lastPt = { x: e.clientX, y: e.clientY };
  const el = e.target.closest?.('.pg');
  setHoverPage(el?._pnl?.canvas ? el : null);
  const it = items[current()];
  if (!hoverEl || !raster(it)) { leaveRegion(); return; }
  const k = Number(hoverEl.dataset.k);
  if (!ready.has(keyOf(it, k))) {
    leaveRegion();
    regionsOf(it, k).then((r) => {
      paintBoxes(it, k, r);
      if (hoverEl && Number(hoverEl.dataset.k) === k && lastPt && items[current()]?.id === it.id) onMove({ clientX: lastPt.x, clientY: lastPt.y, target: document.elementFromPoint(lastPt.x, lastPt.y) || hoverEl, buttons: 0 });
    }).catch(() => {});
    return;
  }
  const reg = hitAt(hoverEl, e.clientX, e.clientY);
  if (reg) enterRegion(reg, hoverEl, it); else leaveRegion();
}
function enterRegion(reg, el, it) {
  clearTimeout(closeT); closeT = 0;
  el.classList.add('fp-over');
  if (S.pinned) { markRegion(reg, 'hot'); return; }
  markRegion(reg, 'hot');
  if ((S.reg === reg && ov && !ov.hidden) || pending?.reg === reg) return;
  clearTimeout(showT);
  dropPending();
  enterAt = performance.now();
  pending = prepare(reg, el, it);
  showT = setTimeout(() => { if (pending?.reg === reg) { pending.fired = performance.now(); open(reg, el, it, false); } }, REST_MS);
}
function leaveRegion() {
  hoverEl?.classList.remove('fp-over');
  if (pending && !(S.reg === pending.reg && ov && !ov.hidden)) { clearTimeout(showT); dropPending(); }
  markRegion(ov && !ov.hidden ? S.reg : null, 'hot');
  if (ov && !ov.hidden && !S.pinned && !closeT) closeT = setTimeout(closeOv, GRACE_MS);
}
function dropPending() { if (pending && pending !== S.prep) pending.job?.cancel(); pending = null; }
spread.addEventListener('pointermove', onMove, { passive: true });
spread.addEventListener('pointerleave', () => { setHoverPage(null); leaveRegion(); });
// A click on a figure pins its enlargement instead of zooming the page.
spread.addEventListener('click', (e) => {
  // A click that only closed a pinned enlargement does not also zoom the page.
  if (performance.now() < swallowUntil) { swallowUntil = 0; e.stopPropagation(); e.preventDefault(); return; }
  if (!enabled || state.view !== 'feed' || getSelection().toString()) return;
  const el = e.target.closest?.('.pg'); if (!el?._pnl?.canvas) return;
  const reg = hitAt(el, e.clientX, e.clientY); if (!reg) return;
  e.stopPropagation(); e.preventDefault();
  if (S.reg === reg && ov && !ov.hidden) { pin(true); return; }
  open(reg, el, items[current()], true);
}, true);

// ---------- where the enlargement goes ----------
function rectOn(el, r) {
  const b = el._pnl.box, R = el.getBoundingClientRect();
  const sx = R.width / (b.x1 - b.x0), sy = R.height / (b.y1 - b.y0);
  return { l: R.left + (r.x0 - b.x0) * sx, t: R.top + (r.y0 - b.y0) * sy, r: R.left + (r.x1 - b.x0) * sx, b: R.top + (r.y1 - b.y0) * sy };
}
const capChars = (reg) => (reg.cap ? reg.cap.label.length + 1 + reg.cap.text.length : 0);
function footH(reg, w) {
  const meta = 20, n = capChars(reg);
  if (!n) return meta + 12;
  const lines = Math.min(7, Math.ceil((n * 6.9) / Math.max(120, w - 26)));
  return meta + 14 + lines * 19;
}
/** Choose the enlargement's place and size: over the page(s) beside the figure. */
function layout(reg, el) {
  const pgs = [...spread.children].filter((e) => e.classList.contains('pg') && e._pnl?.canvas);
  if (!pgs.length) return null;
  // The stage's width (zoomed pages leave room at the sides), the pages' height.
  const sp = spread.getBoundingClientRect(), pr = pgs.map((e) => e.getBoundingClientRect());
  const A = { l: Math.max(sp.left, 0) + 8, t: Math.max(sp.top, 0, Math.min(...pr.map((r) => r.top))), r: Math.min(sp.right, innerWidth) - 8, b: Math.min(sp.bottom, innerHeight, Math.max(...pr.map((r) => r.bottom))) };
  const F = rectOn(el, reg); // the whole figure as it is drawn (it may run past a split panel)
  const fw = F.r - F.l, fh = F.b - F.t;
  if (fw < 4 || fh < 4) return null;
  // What of the figure is on screen, in every panel showing it.
  let V = null;
  for (const e of pgs) {
    if (Number(e.dataset.k) !== Number(el.dataset.k)) continue;
    const q = rectOn(e, reg), R = e.getBoundingClientRect();
    const c = { l: Math.max(q.l, R.left), t: Math.max(q.t, R.top), r: Math.min(q.r, R.right), b: Math.min(q.b, R.bottom) };
    if (c.r - c.l > 2 && c.b - c.t > 2) V = V ? { l: Math.min(V.l, c.l), t: Math.min(V.t, c.t), r: Math.max(V.r, c.r), b: Math.max(V.b, c.b) } : c;
  }
  V ||= F;
  const P = el.getBoundingClientRect(), gap = 12;
  const cands = [];
  const add = (name, l, t, r, b) => { if (r - l > 120 && b - t > 120) cands.push({ name, l, t, r, b }); };
  add('right', Math.max(P.right, V.r) + gap, A.t, A.r, A.b);
  add('left', A.l, A.t, Math.min(P.left, V.l) - gap, A.b);
  add('right-in', V.r + gap, A.t, A.r, A.b);
  add('left-in', A.l, A.t, V.l - gap, A.b);
  add('below', A.l, V.b + gap, A.r, A.b);
  add('above', A.l, A.t, A.r, V.t - gap);
  for (const c of cands) {
    const cw = c.r - c.l, ch = c.b - c.t;
    let s = Math.min(cw / fw, (ch - footH(reg, cw)) / fh, SMAX);
    s = Math.min(cw / fw, (ch - footH(reg, fw * s)) / fh, SMAX);
    c.s = s;
  }
  if (!cands.length) return null;
  // The page(s) to the right, unless the figure is on the right-most page.
  const first = pgs[0], last = pgs[pgs.length - 1];
  const side = el === last && el !== first ? 'left' : el === first && el === last ? (A.r - P.right >= P.left - A.l ? 'right' : 'left') : 'right';
  // The neighbouring page(s) whenever they give a real enlargement; else the
  // best of the rest (beside the figure on its own page, or above or below it
  // across the spread, which is how a wide figure gets two pages).
  const best = cands.reduce((a, b) => (b.s > a.s ? b : a));
  const byName = (n) => cands.find((c) => c.name === n);
  const nb = byName(side) || byName(side === 'left' ? 'right' : 'left');
  const c = nb && (nb.s >= 2 || nb.s >= 0.6 * best.s) ? nb : [byName(side + '-in')].find((x) => x && x.s >= 0.8 * best.s) || best;
  if (c.s < 1.08) return null; // already about as large as it can be
  const vw = Math.round(fw * c.s), vh = Math.round(fh * c.s), fH = footH(reg, vw);
  const w = vw + 2, hgt = vh + fH + 2;
  const cy = (F.t + F.b) / 2, cx = (F.l + F.r) / 2;
  const clampV = (v, a, b) => Math.max(a, Math.min(b, v));
  let x, y;
  if (c.name.startsWith('right')) { x = c.l; y = clampV(cy - hgt / 2, c.t, c.b - hgt); } else if (c.name.startsWith('left')) { x = c.r - w; y = clampV(cy - hgt / 2, c.t, c.b - hgt); } else { x = clampV(cx - w / 2, c.l, c.r - w); y = c.name === 'below' ? c.t : c.b - hgt; }
  return { x: Math.round(x), y: Math.round(y), vw, vh, fH, s: c.s, where: c.name, origin: c.name.startsWith('right') ? 'left center' : c.name.startsWith('left') ? 'right center' : c.name === 'below' ? 'center top' : 'center bottom' };
}

// ---------- rendering the enlargement ----------
const bigs = new Map(); // full-size scan page images, a few
const bigImg = (it, k) => lru(bigs, it.ia + '|' + k, () => new Promise((res, rej) => {
  const im = new Image(); im.decoding = 'async';
  im.onload = () => im.decode().then(() => res(im), () => res(im)); im.onerror = () => rej(new Error('image unavailable'));
  im.src = P(scanUrl(it, k, 2000));
}), 3);
/** Render the part `win` (page fractions) of page k at cw x ch pixels. */
function renderWin(it, k, res, win, cw, ch) {
  let task = null, dead = false;
  const promise = (async () => {
    const c = h('canvas', { width: cw, height: ch });
    const g = c.getContext('2d');
    if (it.kind === 'pdf') {
      const page = await (await openDoc(it)).pdf.getPage(k + 1);
      if (dead) throw new Error('cancelled');
      const sc = cw / ((win.x1 - win.x0) * res.W);
      const vp = page.getViewport({ scale: sc, offsetX: -win.x0 * res.W * sc, offsetY: -win.y0 * res.H * sc });
      g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch);
      task = page.render({ canvasContext: g, viewport: vp });
      await task.promise;
    } else {
      const im = await bigImg(it, k);
      if (dead) throw new Error('cancelled');
      const W = im.naturalWidth, H = im.naturalHeight;
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, win.x0 * W, win.y0 * H, (win.x1 - win.x0) * W, (win.y1 - win.y0) * H, 0, 0, cw, ch);
    }
    return c;
  })();
  promise.catch(() => {});
  return { promise, cancel() { dead = true; task?.cancel(); } };
}
/** The region drawn at once from the canvases already on screen (soft, but instant). */
function drawQuick(c, it, reg) {
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingQuality = 'high';
  const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0;
  for (const p of panelsOf(it, reg.k)) {
    const b = p.box, x0 = Math.max(b.x0, reg.x0), x1 = Math.min(b.x1, reg.x1), y0 = Math.max(b.y0, reg.y0), y1 = Math.min(b.y1, reg.y1);
    if (x1 <= x0 || y1 <= y0) continue;
    const sx = p.canvas.width / (b.x1 - b.x0), sy = p.canvas.height / (b.y1 - b.y0);
    g.drawImage(p.canvas, (x0 - b.x0) * sx, (y0 - b.y0) * sy, (x1 - x0) * sx, (y1 - y0) * sy,
      ((x0 - reg.x0) / rw) * c.width, ((y0 - reg.y0) / rh) * c.height, ((x1 - x0) / rw) * c.width, ((y1 - y0) / rh) * c.height);
  }
}
const dprOf = (vw, vh) => { const d = Math.min(3, devicePixelRatio || 1); return Math.min(d, Math.sqrt(16e6 / Math.max(1, vw * vh))); };
/** Work out the place and start the sharp render as soon as the pointer arrives. */
function prepare(reg, el, it) {
  const k = Number(el.dataset.k); reg.k = k;
  const lay = layout(reg, el);
  const res = ready.get(keyOf(it, k));
  if (!lay || !res) return { reg, lay };
  const d = dprOf(lay.vw, lay.vh);
  return { reg, lay, d, job: renderWin(it, k, res, reg, Math.round(lay.vw * d), Math.round(lay.vh * d)) };
}

// ---------- the enlargement ----------
let ov = null, view, base, detail, capEl, metaEl;
function buildOv() {
  base = h('canvas', { className: 'fp-base' }); detail = h('canvas', { className: 'fp-detail', hidden: true });
  view = h('div', { className: 'fp-view' }, base, detail);
  capEl = h('div', { className: 'fp-cap' }); metaEl = h('div', { className: 'fp-meta' });
  ov = h('div', { id: 'fp-ov', hidden: true, role: 'dialog', ariaLabel: 'Enlarged figure' }, view, h('div', { className: 'fp-foot' }, capEl, metaEl),
    h('button', { className: 'fp-x', title: 'Close (Esc)', ariaLabel: 'Close', textContent: '×', onclick: (e) => { e.stopPropagation(); closeOv(); } }));
  document.body.append(ov);
  ov.addEventListener('pointerenter', () => { clearTimeout(closeT); closeT = 0; });
  ov.addEventListener('pointerleave', () => { if (!S.pinned && !drag && !closeT) closeT = setTimeout(closeOv, 260); });
  ov.addEventListener('click', (e) => { if (!moved) pin(true); e.stopPropagation(); });
  ov.addEventListener('wheel', onWheel, { passive: false });
  view.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, ox: S.ox, oy: S.oy }; moved = false;
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (S.z <= 1) return;
    S.ox = clamp01(drag.ox - dx / (S.lay.vw * S.z), 1 - 1 / S.z); S.oy = clamp01(drag.oy - dy / (S.lay.vh * S.z), 1 - 1 / S.z);
    applyView();
  });
  view.addEventListener('pointerup', () => { drag = null; setTimeout(() => { moved = false; }, 0); });
  view.addEventListener('dblclick', (e) => { e.stopPropagation(); S.z = 1; S.ox = S.oy = 0; applyView(); });
}
let drag = null, moved = false, detailJob = null, detailT = 0;
const clamp01 = (v, hi) => Math.max(0, Math.min(hi, v));
function onWheel(e) {
  e.preventDefault(); e.stopPropagation();
  if (!S.lay) return;
  const r = view.getBoundingClientRect();
  const px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
  const u = S.ox + px / S.z, v = S.oy + py / S.z;
  const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
  const z = Math.max(1, Math.min(16, S.z * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0022))));
  S.ox = clamp01(u - px / z, 1 - 1 / z); S.oy = clamp01(v - py / z, 1 - 1 / z); S.z = z;
  applyView();
}
function applyView() {
  const { vw, vh } = S.lay;
  base.style.transform = `translate(${-S.ox * vw * S.z}px, ${-S.oy * vh * S.z}px) scale(${S.z})`;
  view.classList.toggle('zoomed', S.z > 1.01);
  const key = `${S.z.toFixed(4)}|${S.ox.toFixed(5)}|${S.oy.toFixed(5)}`;
  detail.hidden = detail._key !== key;
  paintMeta();
  clearTimeout(detailT); detailJob?.cancel(); detailJob = null;
  if (S.z <= 1.01) return;
  // Once the zoom rests, render just the visible part at full sharpness.
  detailT = setTimeout(() => {
    const reg = S.reg, rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0;
    const win = { x0: reg.x0 + S.ox * rw, y0: reg.y0 + S.oy * rh, x1: reg.x0 + (S.ox + 1 / S.z) * rw, y1: reg.y0 + (S.oy + 1 / S.z) * rh };
    const d = dprOf(vw, vh), res = ready.get(keyOf(S.it, reg.k));
    if (!res) return;
    const job = detailJob = renderWin(S.it, reg.k, res, win, Math.round(vw * d), Math.round(vh * d));
    job.promise.then((c) => {
      if (detailJob !== job || S.reg !== reg) return;
      detail.width = c.width; detail.height = c.height; detail.getContext('2d').drawImage(c, 0, 0);
      detail._key = key; detail.hidden = false;
    }).catch(() => {});
  }, 140);
}
function paintMeta() {
  if (!S.reg) return;
  const z = ` · ${(S.lay.s * S.z).toFixed(1)}×`;
  metaEl.replaceChildren(h('span', { textContent: `p. ${S.reg.k + 1}${z}` }),
    h('span', { textContent: S.pinned ? 'pinned · wheel zooms · Esc closes' : 'wheel zooms · click pins' }));
}
function open(reg, el, it, pinIt) {
  const k = Number(el.dataset.k); reg.k = k;
  let prep = pending?.reg === reg ? pending : prepare(reg, el, it);
  if (!prep.lay) { if (pinIt) toast('This figure is already shown about as large as it can be'); return; }
  if (!ov) buildOv();
  if (S.prep && S.prep !== prep) S.prep.job?.cancel();
  const t0 = enterAt || performance.now();
  const { lay } = prep;
  Object.assign(S, { reg, el, it, lay, prep, pinned: !!pinIt, z: 1, ox: 0, oy: 0 });
  pending = null; clearTimeout(closeT); closeT = 0;
  // Size and place it.
  ov.style.left = lay.x + 'px'; ov.style.top = lay.y + 'px'; ov.style.width = lay.vw + 2 + 'px';
  ov.style.transformOrigin = lay.origin;
  view.style.width = lay.vw + 'px'; view.style.height = lay.vh + 'px';
  capEl.style.maxHeight = Math.max(20, lay.fH - 34) + 'px';
  capEl.replaceChildren(...(reg.cap ? [reg.cap.label ? h('b', { textContent: reg.cap.label }) : null, reg.cap.label ? ' ' : null, reg.cap.text].filter(Boolean) : []));
  capEl.hidden = !reg.cap;
  ov.classList.toggle('nocap', !reg.cap);
  // The soft copy at once, then the sharp one.
  const d = prep.d || dprOf(lay.vw, lay.vh);
  base.width = Math.round(lay.vw * d); base.height = Math.round(lay.vh * d);
  base.style.width = lay.vw + 'px'; base.style.height = lay.vh + 'px'; base.style.transform = '';
  detail.hidden = true; detail._key = null; detail.style.width = lay.vw + 'px'; detail.style.height = lay.vh + 'px';
  drawQuick(base, it, reg);
  view.classList.add('soft'); view.classList.remove('zoomed');
  const fresh = ov.hidden;
  ov.hidden = false; ov.classList.toggle('pinned', S.pinned);
  if (fresh) { ov.classList.remove('on'); void ov.offsetWidth; }
  ov.classList.add('on');
  paintMeta();
  markRegion(reg, 'src'); markRegion(reg, 'hot');
  const shown = performance.now();
  const job = prep.job || (prep.job = renderWin(it, k, ready.get(keyOf(it, k)), reg, base.width, base.height));
  const rec = { shown: Math.round(shown - t0), fired: prep.fired ? Math.round(prep.fired - t0) : null, sharp: null, kind: it.kind, s: +lay.s.toFixed(2), where: lay.where };
  peekTimes.push(rec); if (peekTimes.length > 100) peekTimes.shift();
  job.promise.then((c) => {
    if (S.prep !== prep) return;
    base.getContext('2d').drawImage(c, 0, 0, base.width, base.height);
    view.classList.remove('soft');
    rec.sharp = Math.round(performance.now() - t0);
  }).catch(() => {});
}
function pin(v) { if (!ov || ov.hidden) return; S.pinned = v; ov.classList.toggle('pinned', v); paintMeta(); }
export function closeOv() {
  clearTimeout(showT); clearTimeout(closeT); clearTimeout(detailT); closeT = 0;
  detailJob?.cancel(); detailJob = null; dropPending();
  if (S.prep) S.prep.job?.cancel();
  if (ov && !ov.hidden) { ov.hidden = true; ov.classList.remove('on'); }
  Object.assign(S, { reg: null, el: null, prep: null, pinned: false, lay: null, z: 1, ox: 0, oy: 0 });
  markRegion(null, 'src'); markRegion(null, 'hot');
}
// Esc and clicks elsewhere close a pinned enlargement; moving on closes any.
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !ov || ov.hidden || e.metaKey || e.ctrlKey) return;
  e.preventDefault(); e.stopImmediatePropagation(); closeOv();
}, true);
addEventListener('pointerdown', (e) => {
  if (!ov || ov.hidden || ov.contains(e.target)) return;
  const el = e.target.closest?.('#spread .pg');
  if (el?._pnl?.canvas && hitAt(el, e.clientX, e.clientY)) return; // a click on a figure pins that one
  if (S.pinned) { closeOv(); if (el) swallowUntil = performance.now() + 700; }
}, true);
on('spread:rendered', closeOv);
on('nav', closeOv);
on('view:changed', closeOv);
on('item:shown', closeOv);
addEventListener('resize', closeOv);

// ---------- on / off ----------
function applyEnabled() { document.body.classList.toggle('fp-off', !enabled); }
applyEnabled();
registerKey('Z', () => {
  enabled = !enabled; store.set('figpeek', enabled); applyEnabled();
  if (!enabled) { closeOv(); setHoverPage(null); toast('Figure peek off · Z turns it back on'); return; }
  toast('Figure peek on: rest the pointer on a figure');
  const it = items[current()];
  if (raster(it)) for (const el of spread.children) if (el._pnl?.canvas) { const k = Number(el.dataset.k); regionsOf(it, k).then((r) => paintBoxes(it, k, r)).catch(() => {}); }
}, { help: ['Z', 'figure peek: rest the pointer on a figure to enlarge it, click to pin (on/off)'], order: 12 });
