#!/usr/bin/env node
/**
 * Terra Incognita: lay the Library of Congress Classification out as a world map.
 *
 *   node scripts/prototypes/terra-incognita.mjs
 *   # reads  public/prototypes/data/{catalog,gutenberg,lcc-outline}.json
 *   # writes public/prototypes/data/terra-incognita/world.json
 *   # checks public/prototypes/data/terra-incognita/field-guides.json (ids must resolve)
 *
 * Method (deterministic; no network, no randomness without a fixed seed):
 *
 * 1. Every call-numbered Open Library work (catalog.json) and every Project
 *    Gutenberg title with an LoC class (gutenberg.json) is counted against its
 *    LC subclass (QA, HB, BF, ...). Classes E and F have no subclasses in the
 *    outline, so they act as their own subclass.
 * 2. Subclasses are sorted in LC order and given a run of hexes proportional to
 *    (catalog works + Gutenberg titles), at least one hex each, using the
 *    largest-remainder method, so the runs fill exactly 7^4 = 2,401 hexes.
 * 3. The runs are laid along a level-4 Gosper curve (flowsnake), a space-filling
 *    curve on the hexagonal lattice whose consecutive cells always touch. So
 *    shelf neighbours are map neighbours, and each subclass is one connected
 *    "province"; classes are "continents".
 * 4. Inside a province, catalog works are placed in call-number order along the
 *    run (one hex holds about 15 items in all), each on a sunflower spiral inside
 *    its hex. Gutenberg titles have only a subclass, so they are spread evenly
 *    over the province as "hinterland" (drawn as forest).
 * 5. Region outlines are traced from hex edges, jittered by a hash of each lattice
 *    vertex (so shared borders stay shared) and Chaikin-smoothed into coastlines.
 * 6. Outline ranges (lcc-outline.json) become "towns": each work belongs to the
 *    deepest range that contains its class number; a town's label sits at the
 *    median position of its works.
 * 7. The 609 works without a call number wash up on six "Uncharted Isles",
 *    grouped by the subject search that found them.
 * 8. An example reader (synthetic, clearly labelled in the UI): about 150 works
 *    from probability, decision theory, machine learning, economics and the
 *    philosophy of science: 22 hand-picked anchors plus a seeded, popularity-
 *    weighted sample, with synthetic read dates and a synthetic search history.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = join(APP, 'public/prototypes/data');
const OUTDIR = join(DATA, 'terra-incognita');
mkdirSync(OUTDIR, { recursive: true });

const catalog = JSON.parse(readFileSync(join(DATA, 'catalog.json'), 'utf8')).works;
const gutenberg = JSON.parse(readFileSync(join(DATA, 'gutenberg.json'), 'utf8')).books;
const outline = JSON.parse(readFileSync(join(DATA, 'lcc-outline.json'), 'utf8'));

// ---------- helpers ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(u, v) {
  let h = Math.imul(u | 0, 374761393) ^ Math.imul(v | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const round1 = (x) => Math.round(x * 10) / 10;
const parseKey = (lcc) => {
  const m = /^([A-Z]+)-*(\d+(?:\.\d+)?)/.exec(lcc || '');
  return m ? { sc: m[1], num: parseFloat(m[2]) } : null;
};

// ---------- 1. subclasses ----------
const SUBS = { ...outline.subclasses, E: outline.classes.E, F: outline.classes.F };
const subCodes = Object.keys(SUBS).sort();
function resolveSub(code) {
  if (!code) return null;
  const letters = (/^[A-Z]+/.exec(code) || [''])[0];
  if (SUBS[letters]) return letters;
  if (SUBS[letters[0]]) return letters[0];
  // nearest preceding known subclass in the same class
  const prev = subCodes.filter((c) => c[0] === letters[0] && c < letters).pop();
  return prev || null;
}

const catInfo = catalog.map((w, i) => {
  const k = parseKey(w.lcc);
  const sc = k ? resolveSub(k.sc) : null;
  return { i, sc, num: k ? k.num : null, lcc: w.lcc || null };
});
const C = {}, G = {};
for (const ci of catInfo) if (ci.sc) C[ci.sc] = (C[ci.sc] || 0) + 1;
let gutUnclassed = 0;
for (const b of gutenberg) {
  const sc = resolveSub(b.c);
  if (sc) G[sc] = (G[sc] || 0) + 1; else gutUnclassed++;
}
const used = subCodes.filter((s) => (C[s] || 0) + (G[s] || 0) > 0);

// ---------- 2. allocation ----------
const N = 2401;
const W = used.reduce((a, s) => a + (C[s] || 0) + (G[s] || 0), 0);
let alloc = used.map((s) => {
  const exact = (((C[s] || 0) + (G[s] || 0)) * N) / W;
  return { s, exact, n: Math.max(1, Math.floor(exact)) };
});
let total = alloc.reduce((a, x) => a + x.n, 0);
const byRem = [...alloc].sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)));
for (let i = 0; total < N; i = (i + 1) % byRem.length) { byRem[i].n++; total++; }
const byBig = [...alloc].sort((a, b) => b.n - a.n);
for (let i = 0; total > N; i = (i + 1) % byBig.length) { if (byBig[i].n > 1) { byBig[i].n--; total--; } }

// ---------- 3. Gosper curve ----------
function gosperPoints(level) {
  let s = 'XF';
  for (let i = 0; i < level; i++) {
    let o = '';
    for (const c of s) o += c === 'X' ? 'X+YF++YF-FX--FXFX-YF+' : c === 'Y' ? '-FX+YFYF++YF+FX--FX-Y' : c;
    s = o;
  }
  const dirs = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
  let d = 0, a = 0, b = 0;
  const pts = [[0, 0]];
  for (const ch of s) {
    if (ch === 'F') { a += dirs[d][0]; b += dirs[d][1]; pts.push([a, b]); }
    else if (ch === '+') d = (d + 1) % 6;
    else if (ch === '-') d = (d + 5) % 6;
  }
  return pts;
}
const lat = gosperPoints(4).slice(0, N); // axial lattice coords, curve order
const SQ3 = Math.sqrt(3);
const S = 10; // world units between hex centres
const axToXY = (a, b) => [a + b / 2, (b * SQ3) / 2];

// rotate so the long axis is horizontal (PCA), then centre
let mx = 0, my = 0;
const raw = lat.map(([a, b]) => axToXY(a, b));
raw.forEach(([x, y]) => { mx += x; my += y; });
mx /= raw.length; my /= raw.length;
let sxx = 0, syy = 0, sxy = 0;
raw.forEach(([x, y]) => { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); });
const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
const ROT = -theta;
const cosR = Math.cos(ROT), sinR = Math.sin(ROT);
function toWorld(x, y) {
  const dx = x - mx, dy = y - my;
  return [(dx * cosR - dy * sinR) * S, (dx * sinR + dy * cosR) * S];
}
const hexXY = raw.map(([x, y]) => toWorld(x, y));
const latIndex = new Map(lat.map(([a, b], i) => [a + ',' + b, i]));

// hex -> subclass
const hexSub = new Int16Array(N);
const subRuns = [];
{
  let h = 0;
  alloc.forEach((x, si) => {
    subRuns.push({ s: x.s, h0: h, h1: h + x.n });
    for (let k = 0; k < x.n; k++) hexSub[h++] = si;
  });
}
const subClassLetter = used.map((s) => s[0]);
const classLetters = [...new Set(subClassLetter)];
const hexClass = Array.from(hexSub, (si) => classLetters.indexOf(subClassLetter[si]));

// ---------- 5. outlines ----------
const CORNER = [[1, 1], [-1, 2], [-2, 1], [-1, -1], [1, -2], [2, -1]]; // thirds of axial units, CCW from 30deg
const NDIR = [[0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1], [1, 0]];   // neighbour across edge k (corner k -> k+1)
function vertexWorld(u, v, jitter) {
  const a = u / 3, b = v / 3;
  let [x, y] = axToXY(a, b);
  if (jitter) {
    const j = jitter * 0.34;
    x += (hash2(u, v) - 0.5) * j;
    y += (hash2(v + 7919, u - 104729) - 0.5) * j;
  }
  return toWorld(x, y);
}
function traceLoops(hexes, labelOf, label, jitter = 1) {
  const edges = new Map();
  for (const i of hexes) {
    const [a, b] = lat[i];
    for (let k = 0; k < 6; k++) {
      const n = latIndex.get(a + NDIR[k][0] + ',' + (b + NDIR[k][1]));
      if (n !== undefined && labelOf(n) === label) continue;
      const c0 = CORNER[k], c1 = CORNER[(k + 1) % 6];
      const p = [3 * a + c0[0], 3 * b + c0[1]], q = [3 * a + c1[0], 3 * b + c1[1]];
      edges.set(p.join(','), q);
    }
  }
  const loops = [];
  while (edges.size) {
    const [startKey] = edges.keys();
    const loop = [];
    let key = startKey;
    while (edges.has(key)) {
      const q = edges.get(key);
      edges.delete(key);
      const [u, v] = key.split(',').map(Number);
      loop.push([u, v]);
      key = q.join(',');
    }
    loops.push(loop.map(([u, v]) => vertexWorld(u, v, jitter)));
  }
  return loops;
}
function chaikin(loop, iters = 2) {
  let p = loop;
  for (let t = 0; t < iters; t++) {
    const o = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      o.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
      o.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    p = o;
  }
  return p;
}
const flat = (loop) => loop.flatMap(([x, y]) => [round1(x), round1(y)]);

// label anchor: hex deepest inside the region (multi-source BFS from the border)
function anchorOf(hexes, labelOf, label) {
  const dist = new Map();
  const queue = [];
  for (const i of hexes) {
    const [a, b] = lat[i];
    let border = false;
    for (const [da, db] of NDIR) {
      const n = latIndex.get(a + da + ',' + (b + db));
      if (n === undefined || labelOf(n) !== label) { border = true; break; }
    }
    if (border) { dist.set(i, 0); queue.push(i); }
  }
  for (let qi = 0; qi < queue.length; qi++) {
    const i = queue[qi];
    const [a, b] = lat[i];
    for (const [da, db] of NDIR) {
      const n = latIndex.get(a + da + ',' + (b + db));
      if (n !== undefined && labelOf(n) === label && !dist.has(n)) { dist.set(n, dist.get(i) + 1); queue.push(n); }
    }
  }
  let cx = 0, cy = 0;
  hexes.forEach((i) => { cx += hexXY[i][0]; cy += hexXY[i][1]; });
  cx /= hexes.length; cy /= hexes.length;
  let best = hexes[0], bd = -1, bc = Infinity;
  for (const i of hexes) {
    const d = dist.get(i) ?? 0;
    const c = Math.hypot(hexXY[i][0] - cx, hexXY[i][1] - cy);
    if (d > bd || (d === bd && c < bc)) { best = i; bd = d; bc = c; }
  }
  return { x: round1(hexXY[best][0]), y: round1(hexXY[best][1]), depth: bd };
}
function bboxOf(hexes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const i of hexes) {
    const [x, y] = hexXY[i];
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const r = S * 0.6;
  return [round1(x0 - r), round1(y0 - r), round1(x1 + r), round1(y1 + r)];
}

const subOf = (i) => hexSub[i];
const classOf = (i) => hexClass[i];
const subclasses = subRuns.map((run, si) => {
  const hexes = [];
  for (let h = run.h0; h < run.h1; h++) hexes.push(h);
  const loops = traceLoops(hexes, subOf, si).map((l) => flat(chaikin(l)));
  const anc = anchorOf(hexes, subOf, si);
  return {
    c: run.s, n: SUBS[run.s], k: classLetters.indexOf(run.s[0]),
    cat: C[run.s] || 0, gut: G[run.s] || 0, h0: run.h0, h1: run.h1,
    lx: anc.x, ly: anc.y, ld: anc.depth, bb: bboxOf(hexes), loops,
  };
});
const classes = classLetters.map((L, ki) => {
  const hexes = [];
  for (let h = 0; h < N; h++) if (hexClass[h] === ki) hexes.push(h);
  const loops = traceLoops(hexes, classOf, ki).map((l) => flat(chaikin(l)));
  const anc = anchorOf(hexes, classOf, ki);
  return { c: L, n: outline.classes[L], lx: anc.x, ly: anc.y, ld: anc.depth, bb: bboxOf(hexes), loops, nh: hexes.length };
});
// whole-land outline (for water-lining)
const landLoops = traceLoops([...Array(N).keys()], () => 0, 0).map((l) => flat(chaikin(l)));

// ---------- 4. works on hexes ----------
const GOLD = Math.PI * (3 - Math.sqrt(5));
const workPos = new Array(catalog.length).fill(null); // [x, y, hex]
const hexWorks = Array.from({ length: N }, () => []);
const bySub = {};
catInfo.filter((c) => c.sc).sort((a, b) => (a.lcc < b.lcc ? -1 : a.lcc > b.lcc ? 1 : a.i - b.i))
  .forEach((c) => (bySub[c.sc] = bySub[c.sc] || []).push(c.i));
subRuns.forEach((run) => {
  const list = bySub[run.s] || [];
  const nh = run.h1 - run.h0;
  list.forEach((wi, j) => {
    const h = run.h0 + Math.min(nh - 1, Math.floor((j * nh) / list.length));
    hexWorks[h].push(wi);
  });
});
const R = S / SQ3; // hex circumradius
hexWorks.forEach((list, h) => {
  const n = list.length;
  list.forEach((wi, j) => {
    const rr = n === 1 ? 0 : 0.66 * R * Math.sqrt((j + 0.5) / n);
    const ang = j * GOLD + h * 0.7;
    workPos[wi] = [round1(hexXY[h][0] + rr * Math.cos(ang)), round1(hexXY[h][1] + rr * Math.sin(ang)), h];
  });
});

// ---------- 6. towns ----------
const rangesBySub = {};
outline.ranges.forEach((r, ri) => (rangesBySub[r.c] = rangesBySub[r.c] || []).push(ri));
const levelOf = new Map();
for (const [sc, list] of Object.entries(rangesBySub)) {
  const ds = [...new Set(list.map((ri) => outline.ranges[ri].d))].sort((a, b) => a - b);
  // a subclass-spanning range at the top is level 0; others count from 1
  for (const ri of list) {
    const r = outline.ranges[ri];
    let lv = ds.indexOf(r.d);
    if (ds[0] !== 0 && r.d === ds[0]) lv = 1; // E/F have no level-0 row
    else if (ds[0] !== 0) lv = ds.indexOf(r.d) + 1;
    levelOf.set(ri, lv);
  }
}
const townMembers = new Map();
const workTown = new Array(catalog.length).fill(-1);
catInfo.forEach((ci) => {
  if (!ci.sc || ci.num == null) return;
  const code = parseKey(ci.lcc).sc;
  const list = rangesBySub[code] || rangesBySub[ci.sc] || [];
  let best = -1, bestLv = -1, bestSpan = Infinity;
  for (const ri of list) {
    const r = outline.ranges[ri];
    if (ci.num < r.lo || ci.num > r.hi) continue;
    const lv = levelOf.get(ri);
    if (lv < 1) continue;
    (townMembers.get(ri) || townMembers.set(ri, []).get(ri)).push(ci.i);
    const span = r.hi - r.lo;
    if (lv > bestLv || (lv === bestLv && span < bestSpan)) { best = ri; bestLv = lv; bestSpan = span; }
  }
  workTown[ci.i] = best;
});
const townList = [...townMembers.entries()]
  .map(([ri, members]) => {
    const r = outline.ranges[ri];
    const xs = members.map((wi) => workPos[wi][0]).sort((a, b) => a - b);
    const ys = members.map((wi) => workPos[wi][1]).sort((a, b) => a - b);
    // anchor: the member closest to the median point
    const mx2 = xs[xs.length >> 1], my2 = ys[ys.length >> 1];
    let best = members[0], bd = Infinity;
    for (const wi of members) {
      const d = Math.hypot(workPos[wi][0] - mx2, workPos[wi][1] - my2);
      if (d < bd) { bd = d; best = wi; }
    }
    return { ri, c: r.c, lo: r.lo, hi: r.hi, n: r.n, lv: levelOf.get(ri), k: members.length, x: workPos[best][0], y: workPos[best][1] };
  })
  .sort((a, b) => (a.c < b.c ? -1 : a.c > b.c ? 1 : a.lo - b.lo || b.hi - a.hi));
const townIdx = new Map(townList.map((t, i) => [t.ri, i]));

// ---------- 7. Uncharted Isles ----------
const ISLES = [
  { n: 'Isle of Machines', q: ['machine learning', 'neural networks (computer science)', 'artificial intelligence', 'algorithms', 'computer programming', 'computer science', 'cryptography', 'information theory'] },
  { n: 'Isle of Chance', q: ['bayesian statistical decision theory', 'probabilities', 'mathematical statistics', 'statistical decision', 'econometrics', 'risk management', 'risk assessment', 'forecasting', 'technological forecasting', 'futurology', 'operations research', 'game theory', 'decision making', 'judgment'] },
  { n: 'Isle of Philosophers', q: ['philosophy of science', 'philosophy of mind', 'knowledge, theory of', 'logic', 'reasoning', 'complexity (philosophy)', 'systems theory'] },
  { n: 'Isle of Markets', q: ['microeconomics', 'economics', 'behavioral economics', 'social choice', 'public policy', 'political science', 'sociology', 'anthropology', 'cognitive psychology'] },
  { n: 'Isle of Numbers', q: ['linear algebra', 'mathematical analysis', 'mathematics', 'physics'] },
  { n: 'Isle of Histories', q: [] },
];
const unclassed = catInfo.filter((c) => !c.sc).map((c) => c.i);
const isleOf = (wi) => {
  const q = (catalog[wi].q || [])[0] || '';
  const k = ISLES.findIndex((s) => s.q.includes(q));
  return k < 0 ? ISLES.length - 1 : k;
};
const isleWorks = ISLES.map(() => []);
unclassed.forEach((wi) => isleWorks[isleOf(wi)].push(wi));
// main bbox
let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
hexXY.forEach(([x, y]) => { X0 = Math.min(X0, x); Y0 = Math.min(Y0, y); X1 = Math.max(X1, x); Y1 = Math.max(Y1, y); });
const smallGosper = gosperPoints(2); // 50 cells, compact prefixes
// place isles along the south-east, outside the main island
const isleHexes = [];
const isles = ISLES.map((isle, k) => {
  const works = isleWorks[k].sort((a, b) => (catalog[b].ed || 0) - (catalog[a].ed || 0));
  const nh = Math.max(3, Math.round(works.length / 14));
  return { ...isle, works, nh };
});
{
  // Place the archipelago in the open sea off the north-east coast: aim at fixed
  // fractions of the main island's bounding box, then step outward until each
  // isle is clear of land and of the isles already placed.
  const Wd = X1 - X0, Hd = Y1 - Y0;
  const targets = [[-0.06, 0.03], [0.05, 0.11], [-0.07, 0.22], [0.04, 0.31], [-0.06, 0.41], [0.05, 0.50]];
  const fromWorld = (X, Y) => {
    const dx = (X * cosR + Y * sinR) / S + mx, dy = (-X * sinR + Y * cosR) / S + my;
    const b = Math.round(dy / (SQ3 / 2));
    return [Math.round(dx - b / 2), b];
  };
  const landXY = lat.map(([a, b]) => axToXY(a, b));
  const placed = [];
  const clear = (cells) => cells.every(([a, b]) => {
    const [x, y] = axToXY(a, b);
    if (landXY.some(([lx, ly]) => Math.hypot(lx - x, ly - y) < 4.5)) return false;
    return placed.every(([pa, pb]) => { const [px, py] = axToXY(pa, pb); return Math.hypot(px - x, py - y) >= 2.6; });
  });
  isles.forEach((isle, k) => {
    const [fx, fy] = targets[k % targets.length];
    let cells = null;
    for (let step = 0; step < 60 && !cells; step++) {
      const [a0, b0] = fromWorld(X1 + (fx + step * 0.01) * Wd, Y0 + fy * Hd);
      const c = smallGosper.slice(0, isle.nh).map(([a, b]) => [a0 + a, b0 + b]);
      if (clear(c)) cells = c;
    }
    isle.cells = cells;
    placed.push(...cells);
  });
}
const isleOut = isles.map((isle) => {
  const local = isle.cells;
  const idx = new Map(local.map(([a, b], i) => [a + ',' + b, i]));
  // trace outline on the isle's own cells
  const edges = new Map();
  local.forEach(([a, b]) => {
    for (let k = 0; k < 6; k++) {
      if (idx.has(a + NDIR[k][0] + ',' + (b + NDIR[k][1]))) continue;
      const c0 = CORNER[k], c1 = CORNER[(k + 1) % 6];
      edges.set([3 * a + c0[0], 3 * b + c0[1]].join(','), [3 * a + c1[0], 3 * b + c1[1]]);
    }
  });
  const loops = [];
  while (edges.size) {
    const [startKey] = edges.keys();
    const loop = [];
    let key = startKey;
    while (edges.has(key)) { const q = edges.get(key); edges.delete(key); loop.push(key.split(',').map(Number)); key = q.join(','); }
    loops.push(flat(chaikin(loop.map(([u, v]) => vertexWorld(u, v, 1.4)), 3)));
  }
  const centres = local.map(([a, b]) => toWorld(...axToXY(a, b)));
  // works on the isle's cells
  const per = Math.ceil(isle.works.length / local.length);
  isle.works.forEach((wi, j) => {
    const h = Math.min(local.length - 1, Math.floor(j / per));
    const jj = j - h * per;
    const n = Math.min(per, isle.works.length - h * per);
    const rr = n === 1 ? 0 : 0.66 * R * Math.sqrt((jj + 0.5) / n);
    const ang = jj * GOLD + h;
    workPos[wi] = [round1(centres[h][0] + rr * Math.cos(ang)), round1(centres[h][1] + rr * Math.sin(ang)), -1];
  });
  let cx = 0, cy = 0;
  centres.forEach(([x, y]) => { cx += x; cy += y; });
  return { n: isle.n, k: isle.works.length, lx: round1(cx / centres.length), ly: round1(cy / centres.length), loops, cells: centres.map(([x, y]) => [round1(x), round1(y)]) };
});

// ---------- 8. example reader ----------
const byId = new Map(catalog.map((w, i) => [w.id, i]));
const ANCHORS = [
  'OL18233878W', // Tetlock, Superforecasting
  'OL15992072W', // Kahneman, Thinking, Fast and Slow
  'OL5911565W', // Jaynes, Probability Theory
  'OL146759W', // Feller, Intro to Probability Theory
  'OL2963587W', // Bishop, PRML
  'OL17801809W', // Goodfellow et al., Deep Learning
  'OL2896994W', // Russell & Norvig, AI
  'OL4624596W', // Pearl, Causality
  'OL17872278W', // Pearl, The Book of Why
  'OL16700318W', // Silver, The Signal and the Noise
  'OL1204974W', // von Neumann & Morgenstern
  'OL24340933W', // Pinker, Rationality
  'OL12630389W', // Gelman, BDA
  'OL8325677W', // MacKay, ITILA (no call number: an Uncharted Isle)
  'OL4147338W', // Hastie et al., ESL
  'OL3294011W', // Bernstein, Against the Gods
  'OL3295030W', // Taleb, The Black Swan
  'OL3295029W', // Taleb, Fooled by Randomness
  'OL19167522W', // Wheelan, Naked Statistics
  'OL1984581W', // Popper, Conjectures and Refutations
  'OL1829825W', // Hammond et al., Smart Choices
  'OL4039298W', // Berger, Statistical Decision Theory and Bayesian Analysis
];
const GROUPS = [
  { g: 'probability', n: 28, q: ['probabilities', 'mathematical statistics'] },
  { g: 'decision', n: 28, q: ['statistical decision', 'bayesian statistical decision theory', 'decision making', 'judgment', 'game theory'] },
  { g: 'ml', n: 30, q: ['machine learning', 'neural networks (computer science)', 'artificial intelligence', 'information theory'] },
  { g: 'economics', n: 30, q: ['economics', 'microeconomics', 'econometrics', 'behavioral economics'] },
  { g: 'philsci', n: 26, q: ['philosophy of science', 'knowledge, theory of', 'history of science', 'reasoning'] },
  { g: 'forecasting', n: 8, q: ['forecasting'] },
];
const groupOf = (w) => GROUPS.findIndex((G) => (w.q || []).some((q) => G.q.includes(q)));
const latinTitle = (t) => /^[\x20-\x7EÀ-ɏ‘-”–—]+$/.test(t);
const read = new Set();
const readGroup = new Map();
for (const id of ANCHORS) {
  const i = byId.get(id);
  if (i === undefined) throw new Error('anchor missing: ' + id);
  read.add(i);
  readGroup.set(i, Math.max(0, groupOf(catalog[i])));
}
const rand = mulberry32(20261015);
const KEEP_UNREAD = new Set(['OL2620278W']); // Raiffa stays on the frontier
for (let gi = 0; gi < GROUPS.length; gi++) {
  const G = GROUPS[gi];
  let have = [...readGroup.values()].filter((g) => g === gi).length;
  const pool = catalog
    .map((w, i) => ({ w, i }))
    .filter(({ w, i }) => !read.has(i) && groupOf(w) === gi && latinTitle(w.t) && !KEEP_UNREAD.has(w.id) && (w.rl || 0) < 5000 && (w.ed || 0) >= 1);
  const weight = (w) => Math.pow((w.rl || 0) + 1, 0.75) * Math.pow((w.ed || 0) + 1, 0.25);
  while (have < G.n && pool.length) {
    const tot = pool.reduce((a, p) => a + weight(p.w), 0);
    let r = rand() * tot, k = 0;
    for (; k < pool.length - 1; k++) { r -= weight(pool[k].w); if (r <= 0) break; }
    const pick = pool.splice(k, 1)[0];
    read.add(pick.i); readGroup.set(pick.i, gi); have++;
  }
}
// synthetic reading history: 2017-03 .. 2026-09, anchors and popular works tend to come first
const readList = [...read].map((i) => ({ i, key: rand() * 0.75 + (ANCHORS.includes(catalog[i].id) ? 0 : 0.25) - Math.min(0.2, Math.log10((catalog[i].rl || 0) + 1) / 20) }))
  .sort((a, b) => a.key - b.key);
const t0 = Date.UTC(2017, 2, 1), t1 = Date.UTC(2026, 8, 30);
const readOut = readList.map((r, k) => {
  const t = t0 + ((t1 - t0) * (k + rand() * 0.8)) / readList.length;
  return [catalog[r.i].id, new Date(t).toISOString().slice(0, 7), GROUPS[readGroup.get(r.i)]?.g || 'other'];
});
// the example reader's own subject searches (synthetic history)
const SEARCHES = [
  ['2017-05', 'probabilities'], ['2017-11', 'mathematical statistics'], ['2018-06', 'bayesian statistical decision theory'],
  ['2019-01', 'machine learning'], ['2019-09', 'game theory'], ['2020-04', 'philosophy of science'],
  ['2020-11', 'forecasting'], ['2021-06', 'econometrics'], ['2022-02', 'neural networks (computer science)'],
  ['2022-10', 'judgment'], ['2023-07', 'microeconomics'], ['2024-03', 'statistical decision'],
  ['2025-01', 'information theory'], ['2025-09', 'decision making'], ['2026-05', 'knowledge, theory of'],
];

// ---------- output ----------
const world = {
  provenance: 'Layout computed by scripts/prototypes/terra-incognita.mjs from catalog.json (Open Library, CC0, fetched 2026-10-15), gutenberg.json (Project Gutenberg catalog, fetched 2026-10-15) and lcc-outline.json (Library of Congress Classification Outline).',
  generated: '2026-10-15',
  S, R: round1(R * 100) / 100, N,
  hex: hexXY.map(([x, y]) => [round1(x), round1(y)]),
  hexLat: lat,
  hexSub: Array.from(hexSub),
  classes,
  subclasses,
  land: landLoops,
  towns: townList.map(({ ri, ...t }) => t),
  works: catalog.map((w, i) => workPos[i] ? [workPos[i][0], workPos[i][1], workPos[i][2], workTown[i] >= 0 ? townIdx.get(workTown[i]) : -1] : null),
  isles: isleOut,
  gutUnclassed,
  reader: {
    label: 'Example reader (synthetic profile)',
    note: 'A made-up forecasting researcher: 22 hand-picked anchor books plus a seeded, popularity-weighted sample from five interests. Dates and searches are invented.',
    read: readOut,
    searches: SEARCHES,
  },
};
const out = JSON.stringify(world);
writeFileSync(join(OUTDIR, 'world.json'), out);
console.log(`world.json: ${(out.length / 1024).toFixed(0)} KB · ${used.length} provinces · ${classes.length} continents · ${townList.length} towns · ${read.size} read · isles ${isles.map((i) => i.works.length).join('/')}`);
console.log('gutenberg titles without a usable class:', gutUnclassed);
const groupsCount = {};
readOut.forEach(([, , g]) => (groupsCount[g] = (groupsCount[g] || 0) + 1));
console.log('reader groups', groupsCount);

// ---------- check precomputed field guides ----------
const fgPath = join(OUTDIR, 'field-guides.json');
if (existsSync(fgPath)) {
  const fg = JSON.parse(readFileSync(fgPath, 'utf8'));
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  let bad = 0;
  for (const g of fg.guides) {
    const ids = [...g.text.matchAll(/\[(OL\d+W)\]/g)].map((m) => m[1]);
    for (const id of ids) {
      const i = byId.get(id);
      if (i === undefined) { console.log(`  field guide ${g.sc}: unknown id ${id}`); bad++; continue; }
      const sc = catInfo[i].sc;
      if (sc !== g.sc && !(g.allow || []).includes(id)) console.log(`  field guide ${g.sc}: ${id} is in ${sc || 'no subclass'} (allowed as a neighbour?)`);
    }
    for (const m of g.text.matchAll(/“([^”]+)”\s*\[(OL\d+W)\]/g)) {
      const w = catalog[byId.get(m[2])];
      if (!w || !w.fs || !norm(w.fs).includes(norm(m[1]))) { console.log(`  field guide ${g.sc}: quote not verbatim for ${m[2]}: ${m[1].slice(0, 60)}`); bad++; }
    }
  }
  console.log(`field-guides.json: ${fg.guides.length} guides checked, ${bad} problems`);
  if (bad) process.exitCode = 1;
}
