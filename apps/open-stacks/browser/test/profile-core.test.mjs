// Unit tests for ui/js/profile-core.js (node --test test/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../ui/js/profile-core.js';

// A synthetic page: white with a dark text block [x0, y0, x1, y1] (fractions), optional gutter.
function page(W, H, box, gutter = null) {
  const lum = new Float32Array(W * H).fill(250);
  const [x0, y0, x1, y1] = box.map((v, i) => Math.round(v * (i % 2 ? H : W)));
  for (let y = y0; y < y1; y++) {
    if ((y - y0) % 4 > 1) continue; // text lines
    for (let x = x0; x < x1; x++) {
      if (gutter && Math.abs(x / W - gutter) < 0.03) continue;
      lum[y * W + x] = 20;
    }
  }
  return lum;
}

test('analyzeLum finds the ink box, blank pages and gutters', () => {
  const W = 240, H = 310;
  const a = core.analyzeLum(page(W, H, [0.15, 0.1, 0.85, 0.9]), W, H);
  assert.equal(a.blank, false);
  assert.ok(Math.abs(a.ink[0] - 0.15) < 0.01 && Math.abs(a.ink[2] - 0.85) < 0.01, JSON.stringify(a.ink));
  assert.ok(Math.abs(a.ink[1] - 0.1) < 0.01 && Math.abs(a.ink[3] - 0.9) < 0.02, JSON.stringify(a.ink));
  assert.equal(a.gut, null);
  assert.equal(core.analyzeLum(new Float32Array(W * H).fill(250), W, H).blank, true);
  const g = core.analyzeLum(page(W, H, [0.1, 0.1, 0.9, 0.9], 0.5), W, H);
  assert.ok(g.gut > 0.47 && g.gut < 0.53, String(g.gut));
});

test('analyzeLum leaves out a thin strip alone in a side margin on born-digital pages', () => {
  const W = 240, H = 310;
  const withStrip = (x0, x1, y0 = 0.3, y1 = 0.75) => {
    const lum = page(W, H, [0.15, 0.1, 0.85, 0.9]);
    for (let y = Math.round(H * y0); y < Math.round(H * y1); y++) for (let x = Math.round(W * x0); x < Math.round(W * x1); x++) lum[y * W + x] = 20;
    return lum;
  };
  const arxiv = core.analyzeLum(withStrip(0.04, 0.07), W, H, { scan: false }); // arXiv's stamp
  assert.ok(Math.abs(arxiv.ink[0] - 0.15) < 0.01, JSON.stringify(arxiv.ink));
  const right = core.analyzeLum(withStrip(0.93, 0.96), W, H, { scan: false });
  assert.ok(Math.abs(right.ink[2] - 0.85) < 0.01, JSON.stringify(right.ink));
  const near = core.analyzeLum(withStrip(0.12, 0.14), W, H, { scan: false }); // too close to the text: kept
  assert.ok(near.ink[0] < 0.13, JSON.stringify(near.ink));
  const wide = core.analyzeLum(withStrip(0.02, 0.09), W, H, { scan: false }); // too wide to be a stamp: kept
  assert.ok(wide.ink[0] < 0.05, JSON.stringify(wide.ink));
  const scan = core.analyzeLum(withStrip(0.04, 0.07), W, H); // scans keep marginal notes
  assert.ok(scan.ink[0] < 0.08, JSON.stringify(scan.ink));
});

function raw(n, opts = {}) {
  const pages = [];
  for (let k = 0; k < n; k++) {
    const blank = opts.blank?.includes(k);
    const ink = blank ? null : opts.ink?.[k] || [0.15 + (k % 3) * 0.003, 0.1, 0.85 - (k % 2) * 0.004, k === n - 1 ? 0.5 : 0.9];
    pages.push({ w: opts.land?.includes(k) ? 792 : 612, h: opts.land?.includes(k) ? 612 : 792, ink, blank, gut: null, dens: 0.1, words: blank ? 0 : 400, lab: opts.labels?.[k] });
  }
  return { id: 'x', kind: opts.kind || 'pdf', pages, heads: opts.heads || [], outline: opts.outline || [] };
}

test('one crop box for the body pages; nothing is ever cut (C1, C2)', () => {
  const P = core.finalize(raw(20));
  assert.equal(core.validate(P), null);
  const body = P.pages.filter((p) => p.cg === 'body');
  assert.ok(body.length >= 18, 'most pages share the body box');
  const aspects = new Set(body.map((p) => core.pageAspect(P, p.k).toFixed(3)));
  assert.equal(aspects.size, 1, 'body pages share one aspect');
  for (const p of P.pages) {
    if (p.blank) continue;
    const c = core.cropOf(P, p.k, 0);
    assert.ok(c.x0 <= p.ink[0] + 1e-9 && c.y0 <= p.ink[1] + 1e-9 && c.x1 >= p.ink[2] - 1e-9 && c.y1 >= p.ink[3] - 1e-9, `page ${p.k} cut`);
  }
  // The short last page is not scaled up: it shows through the same box.
  assert.equal(P.pages[19].cg, 'body');
});

test('property: random ink boxes are never cut by cropOf(P, k, 0)', () => {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let t = 0; t < 50; t++) {
    const n = 3 + Math.floor(rnd() * 30);
    const ink = Array.from({ length: n }, () => { const x0 = rnd() * 0.4, y0 = rnd() * 0.4; return [x0, y0, x0 + 0.1 + rnd() * (0.9 - x0 - 0.1), y0 + 0.1 + rnd() * (0.9 - y0 - 0.1)].map((v) => Math.round(v * 1e4) / 1e4); });
    const P = core.finalize(raw(n, { ink, kind: rnd() < 0.3 ? 'scan' : 'pdf' }));
    assert.equal(core.validate(P), null);
    for (const p of P.pages) { const c = core.cropOf(P, p.k, 0); assert.ok(c.x0 <= p.ink[0] + 1e-6 && c.y0 <= p.ink[1] + 1e-6 && c.x1 >= p.ink[2] - 1e-6 && c.y1 >= p.ink[3] - 1e-6); }
  }
});

test('an outlier page gets its own box; landscape pages are alone', () => {
  const ink = {}; ink[4] = [0.02, 0.02, 0.98, 0.98];
  const P = core.finalize(raw(12, { ink, land: [7, 8] }));
  assert.equal(P.pages[4].cg, 'own');
  assert.ok(P.pages[4].crop[0] <= 0.02);
  assert.equal(P.pages[7].cg, 'land');
  assert.ok(P.layout.alone.includes(7) && P.layout.alone.includes(8));
  assert.ok(P.hints.some((h) => h.code === 'landscape'));
});

test('spreads: blanks ride along, alone pages stand alone, facing pages pair', () => {
  const P = { n: 10, layout: { skip: [3], alone: [6], pair: null } };
  assert.deepEqual(core.spreadStarts(P, 2), [0, 2, 5, 6, 7, 9]);
  assert.deepEqual(core.spreadAt(P, 2, 2), [2, 3, 4]);
  assert.deepEqual(core.spreadAt(P, 6, 2), [6]);
  assert.equal(core.snapStart(P, 4, 2), 2);
  assert.equal(core.snapStart(P, 8, 2), 7);
  const Q = { n: 7, layout: { skip: [], alone: [0], pair: 1 } };
  assert.deepEqual(core.spreadStarts(Q, 2), [0, 1, 3, 5]);
  const R = { n: 9, layout: { skip: [], alone: [], pair: null } };
  assert.deepEqual(core.spreadStarts(R, 3), [0, 3, 6]);
  assert.deepEqual(core.spreadAt(R, 7, 3), [6, 7, 8]);
});

test('scans: printed labels give facing pages and the front matter', () => {
  const labels = {}; for (let k = 6; k < 40; k++) labels[k] = String(k - 5); // page 6 is printed "1"
  const r = raw(40, { kind: 'scan', labels });
  const P = core.finalize(r);
  assert.equal(P.pages[0].role, 'cover');
  assert.equal(P.pages[3].role, 'front');
  assert.equal(P.pages[6].role, 'body');
  assert.deepEqual(P.ranges.front, [0, 5]);
  assert.equal(P.ranges.body[0], 6);
  // label 2 (even, a verso) is page 7, so spreads start on odd pages
  assert.equal(P.layout.pair, 1);
  assert.ok(P.layout.starts[2].includes(7) && P.layout.starts[2].includes(9));
  assert.ok(P.hints.some((h) => h.code === 'facing-pages'));
  assert.ok(P.hints.some((h) => h.code === 'skip-front'));
});

test('roles: references and appendix from headings; contents from headings', () => {
  const heads = [
    { t: '1 Introduction', k: 0, head: true }, { t: '2 Method', k: 2, head: true }, { t: '2.1 Data', k: 3, head: true },
    { t: '3 Results', k: 5, head: true }, { t: 'References', k: 9, head: true }, { t: 'A Proofs', k: 12, head: true },
  ];
  const P = core.finalize(raw(15, { heads }));
  assert.deepEqual(P.ranges.refs, [9, 11]);
  assert.deepEqual(P.ranges.appendix, [12, 14]);
  assert.deepEqual(P.ranges.body, [0, 8]);
  assert.equal(P.toc[0].t, '1 Introduction');
  assert.equal(P.toc.find((t) => t.t === '2.1 Data').d, 1);
  assert.equal(P.toc[0].src, 'heads');
  const O = core.finalize(raw(15, { heads, outline: [{ t: 'Intro', k: 0, d: 0 }, { t: 'Method', k: 2, d: 0 }, { t: 'Results', k: 5, d: 0 }] }));
  assert.equal(O.toc[0].src, 'outline');
});

test('headings from pdf.js text: size and bold', () => {
  const it = (str, size, y, font = 'f1') => ({ str, transform: [size, 0, 0, size, 72, y], fontName: font, hasEOL: true });
  const items = [it('1 Introduction', 12, 700, 'b'), it('The body of the text goes here and on.', 10, 680), it('more text in the body', 10, 668), it('3 Results', 10, 600)];
  const lines = core.textLines(items, (f) => (f === 'b' ? { name: 'X+Times-Bold', bold: true } : { name: 'X+Times-Roman' }));
  const body = core.bodySize([lines]);
  assert.equal(body, 10);
  const heads = core.headsOf(lines, 0, body);
  assert.deepEqual(heads.filter((x) => x.head).map((x) => x.t), ['1 Introduction']);
});

test('validate rejects bad uploads; budget', () => {
  const P = core.finalize(raw(5));
  assert.equal(core.validate({ ...P, n: 6 }), 'n does not match pages');
  assert.match(core.validate({ ...P, pages: P.pages.map((p, k) => (k === 1 ? { ...p, ink: [0.5, 0.1, 0.4, 0.9] } : p)) }), /ink/);
  assert.equal(core.budgetFor(30), 1024 * 1024 + 70 * 1024 * 30);
  assert.equal(core.budgetFor(1000), 12 * 1024 * 1024);
});

test('flow documents', () => {
  const P = core.finalize({ id: 'lw:x', kind: 'html', n: 4, flowWords: [280, 280, 280, 40], outline: [{ t: 'Intro', k: 0, d: 0 }] });
  assert.equal(core.validate(P), null);
  assert.equal(P.text.layer, 'html');
  assert.equal(P.toc[0].src, 'flow');
});

test('scans: front matter ends where printed page 1 would be, even when it bears no number', () => {
  const labels = {}; for (let k = 14; k < 60; k++) labels[k] = String(k - 11); // page 14 is printed "3"
  const P = core.finalize(raw(60, { kind: 'scan', labels }));
  assert.deepEqual(P.ranges.front, [0, 11]);
  assert.equal(P.ranges.body[0], 12);
});

// ------------------------------------------------- running heads and feet ----
// A synthetic born-digital page, 240 × 310 (letter): bands of ink [y0, y1] across [x0, x1],
// and the text lines a producer would give bandTexts ({t, x, y0, y1}, fractions).
function sheet(parts) {
  const W = 240, H = 310, lum = new Float32Array(W * H).fill(250), lines = [];
  const fill = (x0, y0, x1, y1, step = 1) => {
    for (let y = Math.round(y0 * H); y < Math.round(y1 * H); y++) {
      if (step > 1 && (y - Math.round(y0 * H)) % step > 1) continue;
      for (let x = Math.round(x0 * W); x < Math.round(x1 * W); x++) lum[y * W + x] = 20;
    }
  };
  for (const p of parts) {
    if (p.text != null) { fill(p.x0 ?? 0.18, p.y0, p.x1 ?? 0.6, p.y1); lines.push({ t: p.text, x: p.x0 ?? 0.18, y0: p.y0, y1: p.y1 }); }
    else if (p.rule) fill(0.17, p.y0, 0.83, p.y0 + 1 / H + 1e-6);
    else if (p.body) { fill(0.17, p.y0, 0.83, p.y1, 4); for (let y = p.y0; y < p.y1 - 0.01; y += 0.05) lines.push({ t: p.body + ' ' + y.toFixed(2), x: 0.17, y0: y, y1: y + 0.008 }); }
    else fill(p.x0 ?? 0.17, p.y0, p.x1 ?? 0.83, p.y1); // a figure: solid ink
  }
  const a = core.analyzeLum(lum, W, H, { scan: false, bands: true });
  core.bandTexts(a.bands, lines);
  return { w: 612, h: 792, ...a, words: 400 };
}
const HEAD = (t) => [{ text: t, y0: 0.035, y1: 0.046 }, { rule: true, y0: 0.052 }];
const FOOT = (k) => [{ text: String(k + 1), x0: 0.49, x1: 0.52, y0: 0.948, y1: 0.958 }];
const BODY = [{ body: 'text', y0: 0.1, y1: 0.9 }];
const doc = (n, pageOf, kind = 'pdf') => core.finalize({ id: 'x', kind, pages: Array.from({ length: n }, (_, k) => sheet(pageOf(k))) });
const top = (P, k) => core.cropOf(P, k, 0).y0;
const bottom = (P, k) => core.cropOf(P, k, 0).y1;
const notCut = (P) => { for (const p of P.pages) { if (p.blank) continue; const c = core.cropOf(P, p.k, 0); assert.ok(c.x0 <= p.ink[0] + 1e-9 && c.y0 <= p.ink[1] + 1e-9 && c.x1 >= p.ink[2] - 1e-9 && c.y1 >= p.ink[3] - 1e-9, `page ${p.k} cut`); } };

test('analyzeLum reports the first and last bands and the ink box without them', () => {
  const a = sheet([...HEAD('A running head'), ...BODY, ...FOOT(2)]);
  assert.ok(Math.abs(a.bands.top.y0 - 0.035) < 0.005 && Math.abs(a.bands.top.y1 - 0.055) < 0.005, JSON.stringify(a.bands.top)); // the rule belongs to the band
  assert.ok(Math.abs(a.bands.top.next - 0.1) < 0.005 && Math.abs(a.bands.top.ink[1] - 0.1) < 0.005);
  assert.equal(a.bands.top.t, 'A running head');
  assert.ok(Math.abs(a.bands.bot.y0 - 0.948) < 0.005 && Math.abs(a.bands.bot.prev - 0.9) < 0.01, JSON.stringify(a.bands.bot));
  assert.equal(a.bands.bot.t, '3');
  assert.ok(Math.abs(a.bands.both[1] - 0.1) < 0.005 && Math.abs(a.bands.both[3] - 0.9) < 0.01, JSON.stringify(a.bands.both));
  // A page number too faint to show on the grid, under a footer rule that does: still the band's text.
  const f = { y0: 0.93, y1: 0.934, prev: 0.9 };
  core.bandTexts({ top: null, bot: f }, [{ t: '7', x: 0.5, y0: 0.94, y1: 0.95 }, { t: 'last line', x: 0.17, y0: 0.89, y1: 0.898 }]);
  assert.equal(f.t, '7');
  // Not asked for: no bands (render.js); text from the top: no top band (no clear gap, or too tall).
  const W = 240, H = 310;
  assert.equal(core.analyzeLum(new Float32Array(W * H).fill(250).map((v, i) => (Math.floor(i / W) > 30 && Math.floor(i / W) < 280 && Math.floor(i / W) % 4 < 2 && i % W > 40 && i % W < 200 ? 20 : v)), W, H, { scan: false }).bands, undefined);
  assert.equal(sheet([{ body: 'text', y0: 0.1, y1: 0.9 }]).bands.top, null);
  assert.equal(sheet([{ y0: 0.05, y1: 0.4 }, ...BODY]).bands.top, null);
});

test('a repeating header and page-number footer are left out of the crop', () => {
  const P = doc(12, (k) => [...HEAD('Published as a conference paper at ICLR 2015'), ...BODY, ...FOOT(k)]);
  assert.equal(core.validate(P), null);
  assert.equal(P.gen, core.GEN);
  assert.equal(P.pages.filter((p) => p.head && p.foot).length, 12);
  for (const p of P.pages) assert.equal(p.cg, 'body');
  assert.ok(top(P, 3) > 0.095 && bottom(P, 3) < 0.905, JSON.stringify(core.cropOf(P, 3, 0)));
  assert.ok(Math.abs(P.pages[3].head[0] - 0.035) < 0.005 && Math.abs(P.pages[3].foot[0] - 0.948) < 0.005);
  // Without the bands (a profile from before, or a producer that gives none): the crop keeps them.
  const Q = core.finalize({ id: 'x', kind: 'pdf', pages: Array.from({ length: 12 }, (_, k) => { const { bands, ...p } = sheet([...HEAD('Published'), ...BODY, ...FOOT(k)]); return p; }) });
  assert.ok(top(Q, 3) < 0.04 && bottom(Q, 3) > 0.95);
  notCut(P);
});

test('alternating headers (per parity); the first page keeps its own header', () => {
  const P = doc(14, (k) => [...HEAD(k === 0 ? 'The Annals of Statistics 2012, Vol. 40, No. 1' : k % 2 ? `${k + 1} M. PARRY, A. P. DAWID AND S. LAURITZEN` : `PROPER LOCAL SCORING RULES ${k + 1}`), ...BODY]);
  assert.equal(core.validate(P), null);
  assert.equal(P.pages[0].head, undefined, 'its own first-page header');
  for (let k = 1; k < 14; k++) assert.ok(P.pages[k].head, `page ${k}`);
  assert.ok(top(P, 5) > 0.095);
  assert.ok(top(P, 0) < 0.04, 'page 0 shows its header');
  notCut(P);
  // Two headers that alternate, on pages that are only half the document each, still repeat.
  const R = doc(9, (k) => [...HEAD(k % 2 ? 'Odd' : 'Even'), ...BODY]);
  assert.equal(R.pages.filter((p) => p.head).length, 9);
});

test('never cut: a header on the first page only, on a few pages, section titles, a figure at the top', () => {
  const first = doc(10, (k) => [...(k === 0 ? HEAD('Preprint. Under review.') : []), ...BODY]);
  assert.equal(first.pages.filter((p) => p.head).length, 0);
  assert.ok(top(first, 0) < 0.04);
  const few = doc(12, (k) => [...(k >= 9 ? HEAD('Supplementary material') : []), ...BODY]);
  assert.equal(few.pages.filter((p) => p.head).length, 0);
  // Section titles at the top of some pages: not repeated, and not where a running head is.
  const sec = doc(10, (k) => (k % 3 === 0 ? [{ text: `${k / 3 + 1} Section ${'abc'[k % 3]}`, y0: 0.1, y1: 0.115 }, { body: 'text', y0: 0.14, y1: 0.9 }] : BODY));
  assert.equal(sec.pages.filter((p) => p.head).length, 0);
  // A figure that reaches the top of one page, under the same running head as the rest:
  // the head is cut where it is a band, the figure never.
  const fig = doc(10, (k) => (k === 4 ? [{ y0: 0.035, y1: 0.3 }, { body: 'text', y0: 0.33, y1: 0.9 }] : k === 6 ? [{ text: 'Figure 1: a plot', y0: 0.035, y1: 0.046 }, { y0: 0.07, y1: 0.4 }, { body: 'text', y0: 0.43, y1: 0.9 }] : [...HEAD('A running head'), ...BODY]));
  assert.equal(fig.pages[4].head, undefined);
  assert.equal(fig.pages[6].head, undefined, 'same place, other words, other shape');
  assert.ok(top(fig, 4) < 0.04 && top(fig, 6) < 0.04);
  assert.ok(fig.pages[3].head && top(fig, 3) > 0.095);
  notCut(fig);
});

test('page-number footers alone; scans are left alone', () => {
  const P = doc(10, (k) => [...BODY, ...FOOT(k)]);
  assert.equal(P.pages.filter((p) => p.foot && !p.head).length, 10);
  assert.ok(bottom(P, 2) < 0.905 && top(P, 2) < 0.105);
  const S = doc(10, (k) => [...HEAD('A running head'), ...BODY, ...FOOT(k)], 'scan');
  assert.equal(S.pages.filter((p) => p.head || p.foot).length, 0);
  assert.ok(top(S, 2) < 0.04);
  // A page that is nothing but its head and foot keeps them.
  const E = doc(6, (k) => [...HEAD('A running head'), ...(k === 3 ? [] : BODY), ...FOOT(k)]);
  assert.equal(E.pages[3].head, undefined);
  notCut(E);
});

test('books: chapter heads that change by chapter, section heads seen once, a figure close under the head', () => {
  // Even pages: "<n> <chapter>", odd pages: "<section> <n>"; the 7th page's section is on that page only.
  const sect = (k) => (k === 7 ? '2.4 Only here' : `${1 + Math.floor(k / 10)}.${1 + Math.floor((k % 10) / 4)} A section`);
  const P = doc(30, (k) => {
    if (k % 10 === 0) return [{ text: `Chapter ${k / 10 + 1}`, y0: 0.2, y1: 0.22 }, { body: 'text', y0: 0.3, y1: 0.9 }]; // chapter openings: no running head
    const h = HEAD(k % 2 ? `${k + 1} Chapter ${1 + Math.floor(k / 10)} title` : `${sect(k)} ${k + 1}`);
    if (k === 13) return [...h, { y0: 0.064, y1: 0.4 }, { body: 'text', y0: 0.43, y1: 0.9 }]; // a figure 1.2% under the rule
    return [...h, ...BODY];
  });
  assert.equal(core.validate(P), null);
  for (const p of P.pages) assert.equal(!!p.head, p.k % 10 !== 0, `page ${p.k}`);
  assert.ok(top(P, 7) > 0.095, 'a section head seen once has the running head shape');
  assert.ok(Math.abs(P.pages[13].ink[1] - 0.064) < 0.005, 'the figure is kept whole');
  notCut(P);
});

test('bandKey: page numbers match, words do not', () => {
  assert.equal(core.bandKey('PROPER LOCAL SCORING RULES 3'), core.bandKey('Proper local scoring rules 27'));
  assert.equal(core.bandKey('iv Contents'), core.bandKey('xii   Contents'));
  assert.notEqual(core.bandKey('2.1 Linear models'), core.bandKey('2.2 Kernels'));
  assert.equal(core.bandKey('— 12 —'), '#');
  assert.equal(core.bandKey(''), '');
});

test('validate checks head and foot', () => {
  const P = doc(6, (k) => [...HEAD('A running head'), ...BODY, ...FOOT(k)]);
  assert.equal(core.validate(P), null);
  assert.match(core.validate({ ...P, pages: P.pages.map((p, k) => (k === 1 ? { ...p, head: [0.2, 0.1] } : p)) }), /head/);
  assert.match(core.validate({ ...P, pages: P.pages.map((p, k) => (k === 1 ? { ...p, head: [0.02, 0.3] } : p)) }), /head overlaps ink/);
  assert.match(core.validate({ ...P, pages: P.pages.map((p, k) => (k === 1 ? { ...p, foot: [0.5, 0.96] } : p)) }), /foot overlaps ink/);
});
