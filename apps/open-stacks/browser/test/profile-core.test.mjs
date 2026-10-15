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
