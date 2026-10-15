// The learning model's maths (server/learn.mjs), against docs/learning/spec.md §2 and §11.1.
// Run: node --test test/learn-core.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as L from '../server/learn.mjs';
import { readOps, quickOps, recordsOf } from './learn-ops.mjs';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const C = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
const items = C.items;
const byId = new Map(items.map((it) => [it.id, it]));
const NOW = Date.parse('2026-10-15T12:00:00Z'), DAY = 864e5, at = NOW - DAY;
const rec = (ops) => recordsOf(ops).get(ops[0].id);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} not within ${tol} of ${b}`);

// A small synthetic corpus for the profile tests: three topics in two lanes.
const SYN = [];
for (let k = 0; k < 30; k++) {
  const topic = ['alpha', 'beta', 'gamma'][k % 3];
  SYN.push({ id: `syn:${k}`, kind: k % 2 ? 'pdf' : 'web', t: `Paper ${k} on ${topic} matters`, a: `Author${k % 5} Person`, y: 2020 + (k % 6), lane: k < 15 ? 'one' : 'two', path: [topic], tags: [topic], n: 10, words: 2000 });
}
const synIndex = L.buildIndex(SYN, { lanes: { one: 'Lane one', two: 'Lane two' } });
const profileOf = (ops, extra = {}) => L.computeProfile({ items: SYN, index: synIndex, memory: recordsOf(ops), now: NOW, ...extra });

test('engagement on DeepSeekMath matches the worked values (model §1.9)', () => {
  const it = byId.get('arxiv:2402.03300');
  const rows = [
    ['3 s then j', quickOps(it.id, { secs: 3, at }), 0, 0.35],
    ['20 s, one spread', readOps(it.id, { mins: 20 / 60, frac: 0.15, at }), 0.06, 1],
    ['2 min skim', readOps(it.id, { mins: 2, frac: 1, at }), 0.33, 1],
    ['6 min, first half', readOps(it.id, { mins: 6, frac: 0.5, at }), 0.56, 1],
    ['18 min, 90%', readOps(it.id, { mins: 18, frac: 0.9, at }), 0.85, 1],
    ['18 min over 3 days', readOps(it.id, { mins: 18, frac: 0.9, days: 3, at }), 1.0, 1],
    ['3 s then save', quickOps(it.id, { secs: 3, judge: ['save'], at }), 0.9, 2],
    ['10 min then less', readOps(it.id, { mins: 10, frac: 0.6, judge: ['less'], at }), 0, 3],
  ];
  for (const [label, ops, y, w] of rows) {
    const e = L.engagement(it, rec(ops));
    near(e.y, y, 0.03, label);
    assert.equal(e.w, w, label + ' w');
  }
  const lw = items.find((x) => x.lane === 'lesswrong' && x.words > 4000 && x.words < 6000);
  near(L.engagement(lw, rec(readOps(lw.id, { mins: 8, frac: 0.7, at }))).y, 0.59, 0.03, 'LW post, 8 min, 70%');
  const scan = items.find((x) => x.lane === 'oddities' && x.n > 300);
  near(L.engagement(scan, rec(readOps(scan.id, { mins: 4, frac: 40 / scan.n, at }))).y, 0.45, 0.03, 'old scan, 4 min over 40 pages');
  // A window left open for 3 h with 60 s of input.
  const att = byId.get('arxiv:1706.03762');
  const idle = rec([
    { o: 'visit', id: att.id, t: at + 3 * 3600e3, s: at, e: at + 3 * 3600e3, a: 60e3, x: 'next', via: 'feed' },
    { o: 'at', id: att.id, t: at, k: 0, c: 2, n: 15 },
    { o: 'saw', id: att.id, t: at + 60e3, k: 0, c: 2, s: at, ms: 3 * 3600e3, seen: true },
  ]);
  assert.ok(L.engagement(att, idle).y <= 0.15, 'idle window');
});

test('quick exits weigh by exit and route; failures and glimpses are not exposures', () => {
  const it = byId.get('arxiv:2402.03300');
  const w = (o) => L.engagement(it, rec(quickOps(it.id, { secs: 3, at, ...o }))).w;
  assert.equal(w({ exit: 'next' }), 0.35);
  assert.equal(w({ exit: 'prev' }), 0.2);
  assert.equal(w({ exit: 'lane' }), 0.2);
  assert.equal(w({ exit: 'next', via: 'jump' }), 0.1);
  // Old rows without x or via: the "other" weight.
  assert.equal(L.engagement(it, { nv: 1, v: [[at, at + 3000, 3000]], a: 3000, sc: 2, far: 1, seq: [], jl: [], last: at + 3000, n: 14 }).w, 0.2);
  // Load failure: an error report and nothing seen; or no page count, nothing seen and 15 s waited.
  const r = rec(readOps(it.id, { mins: 1, frac: 0.2, at }));
  assert.equal(L.engagement(it, { ...r, sc: 0 }, { err: true }), null);
  const scan = items.find((x) => x.kind === 'scan' && x.n);
  assert.equal(L.engagement({ ...scan, n: undefined }, { nv: 1, v: [[at, at + 30e3, 30e3]], a: 30e3, sc: 0, far: -1, seq: [], jl: [], last: at + 30e3 }), null);
  // A glimpse (no settled visit), and a judgment on an item never opened.
  assert.equal(L.engagement(it, { nv: 0, v: [], seq: [], sc: 0, far: 1, jl: [], last: at, n: 14 }), null);
  const kept = L.engagement(it, { nv: 0, v: [], seq: [], sc: 0, far: -1, jl: [['save', at]], last: at });
  assert.equal(kept.y, 0.9); assert.equal(kept.w, 1);
  const tossed = L.engagement(it, { nv: 0, v: [], seq: [], sc: 0, far: -1, jl: [['less', at]], last: at });
  assert.equal(tossed.y, 0); assert.equal(tossed.w, 1);
});

test('judgments replay in order, with every retraction', () => {
  assert.deepEqual(L.replay([]), { S: null, M: null, L: null });
  assert.deepEqual(L.replay([['save', 1], ['unsave', 2]]), { S: null, M: null, L: null });
  assert.deepEqual(L.replay([['more', 1], ['less', 2]]), { S: null, M: null, L: 2 });
  assert.deepEqual(L.replay([['less', 1], ['more', 2]]), { S: null, M: 2, L: null });
  assert.deepEqual(L.replay([['less', 1], ['unless', 2]]), { S: null, M: null, L: null });
  assert.deepEqual(L.replay([['more', 1], ['unmore', 2], ['save', 3]]), { S: 3, M: null, L: null });
  assert.deepEqual(L.replay([['save', 1], ['less', 2], ['unless', 3]]), { S: 1, M: null, L: null });
});

test('S6: x then Back (unless) gives the profile from before, λ bit for bit', () => {
  const ops = [];
  for (let k = 0; k < 12; k++) ops.push(...(k % 3 ? readOps(`syn:${k}`, { mins: 3 + k, frac: 0.6, at, it: SYN[k] }) : quickOps(`syn:${k}`, { secs: 3, at, it: SYN[k] })));
  const before = profileOf(ops);
  const after = profileOf([...ops, { o: 'judge', id: 'syn:4', t: at + 5000, j: 'less' }, { o: 'judge', id: 'syn:4', t: at + 6000, j: 'unless' }]);
  assert.deepEqual([...after._lam], [...before._lam]);
  assert.deepEqual(after.pred, before.pred);
  assert.deepEqual(after.phi, before.phi);
  const mid = profileOf([...ops, { o: 'judge', id: 'syn:4', t: at + 5000, j: 'less' }]);
  assert.notDeepEqual([...mid._lam], [...before._lam]);
});

test('λ: one deep read gives about +0.36; one less alone stays above −0.85', () => {
  const one = profileOf(readOps('syn:1', { mins: 30, frac: 1, days: 3, at, it: SYN[1] }));
  const { e, wd } = one._ex.get('syn:1');
  const mu0 = (wd * e.y + 5 * 0.25) / (wd + 5);
  const expect = Math.log2((wd * e.y + 4 * mu0) / (wd + 4) / mu0);
  near(one._lam.get('tag:beta'), expect, 1e-12, 'formula');
  const deep = profileOf(readOps('syn:1', { mins: 18, frac: 0.9, at, it: SYN[1] }));
  near(deep._lam.get('tag:beta'), 0.36, 0.03, 'one deep read');
  const less = profileOf(quickOps('syn:2', { secs: 3, at, judge: ['less'], it: SYN[2] }));
  assert.ok(less._lam.get('tag:gamma') >= -0.85 && less._lam.get('tag:gamma') < -0.7, `one less: ${less._lam.get('tag:gamma')}`);
});

test('controls: boost, mute and ignore (spec §2.6)', () => {
  const ops = [...readOps('syn:1', { mins: 18, frac: 0.9, at, it: SYN[1] }), ...quickOps('syn:2', { secs: 3, at, judge: ['less'], it: SYN[2] })];
  const base = profileOf(ops);
  const lb = base._lam.get('tag:beta'), lg = base._lam.get('tag:gamma');
  assert.ok(lb > 0 && lg < 0);
  const p = profileOf(ops, { controls: { v: 1, feat: { 'tag:beta': { mode: 'mute', at: 1 }, 'tag:gamma': { mode: 'boost', at: 1 }, 'tag:alpha': { mode: 'boost', at: 1 }, 'lane:one': { mode: 'ignore', at: 1 } } } });
  near(p._lam.get('tag:beta'), Math.max(-2, Math.min(lb, 0) - 1.5), 1e-12, 'mute');
  near(p._lam.get('tag:gamma'), Math.min(2, Math.max(lg, 0) + 1), 1e-12, 'boost a negative feature');
  assert.equal(p._lam.get('tag:alpha'), 1, 'a never-seen boosted feature gets +1');
  assert.equal(p._lam.get('lane:one'), 0, 'ignore');
  assert.equal(p.feat['tag:alpha'].ctl, 'boost');
  assert.equal(p.feat['tag:beta'].l0, Math.round(lb * 1000) / 1000);
  assert.equal(p.laneFactor.one, 1, 'an ignored lane feature leaves the lane factor at 1');
});

// A random record for property tests.
function rnd(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32); }
function randomRecord(R, n = 12) {
  const visits = 1 + Math.floor(R() * 3), v = [], seq = [];
  let a = 0;
  for (let k = 0; k < visits; k++) { const s = at - k * DAY, ms = Math.floor(R() * 30 * 60e3); v.push([s, s + ms, ms, R() < 0.5 ? 'next' : 'prev', R() < 0.2 ? 'jump' : 'feed']); a += ms; }
  v.sort((x, y) => x[0] - y[0]);
  const sp = Math.floor(R() * 8);
  for (let k = 0; k < sp; k++) seq.push([k * 2, 2, Math.floor(at / 1000), Math.floor(R() * 120e3)]);
  const sc = Math.min(n, Math.floor(R() * (n + 1)));
  const jl = R() < 0.15 ? [[['save', 'more', 'less'][Math.floor(R() * 3)], at]] : [];
  return { n, nv: visits, v, a, sc, far: sc - 1, seq, jl, last: at + 1000, first: at - 3 * DAY };
}

test('S7: more time or more pages never lowers y', () => {
  const R = rnd(7);
  const it = { id: 'x', kind: 'pdf', n: 12 };
  for (let k = 0; k < 1000; k++) {
    const r = randomRecord(R);
    const y = L.engagement(it, r)?.y ?? 0;
    const more = structuredClone(r); more.v[0][2] += Math.floor(R() * 600e3) + 1; more.a += 1;
    const pages = structuredClone(r); pages.seq.push([20, 2, 0, Math.floor(R() * 60e3) + 1000]); pages.sc = Math.min(r.n, r.sc + 1); pages.far = Math.max(r.far, pages.sc - 1);
    assert.ok((L.engagement(it, more)?.y ?? 0) >= y - 1e-12, `time lowered y (record ${k})`);
    assert.ok((L.engagement(it, pages)?.y ?? 0) >= y - 1e-12, `pages lowered y (record ${k})`);
  }
});

test('S7: a deep read of X never lowers I for an item with a superset of X\'s features', () => {
  const R = rnd(11);
  // Synthetic items over a small vocabulary; the probe items add features no one has read.
  const vocab = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const mk = (id, tags, lane = 'l1') => ({ id, kind: 'pdf', t: 'x', lane, tags, n: 10 });
  for (let trial = 0; trial < 60; trial++) {
    const pool = Array.from({ length: 24 }, (_, k) => mk(`p${k}`, vocab.filter(() => R() < 0.35), R() < 0.5 ? 'l1' : 'l2'));
    const X = pool[0];
    const probe = mk('probe', [...X.tags, 'zz-unread'], X.lane);
    const its = [...pool, probe];
    const idx = L.buildIndex(its, {});
    const ops = [];
    for (let k = 1; k < 14; k++) {
      const it = pool[k];
      ops.push(...(R() < 0.5 ? quickOps(it.id, { secs: 3, at, it }) : readOps(it.id, { mins: 1 + Math.floor(R() * 20), frac: R(), at, it, n: 10 })));
    }
    const p0 = L.computeProfile({ items: its, index: idx, memory: recordsOf(ops), now: NOW });
    const p1 = L.computeProfile({ items: its, index: idx, memory: recordsOf([...ops, ...readOps(X.id, { mins: 30, frac: 1, days: 3, at, it: X, n: 10 })]), now: NOW });
    for (const target of [X, probe]) {
      const i = idx.byId.get(target.id);
      assert.ok(p1._I[i] >= p0._I[i] - 1e-12, `trial ${trial}: I fell for ${target.id} (${p0._I[i]} → ${p1._I[i]})`);
    }
  }
});

test('S8: bounds on λ, I, the lane factor, Φ and the term', () => {
  const R = rnd(3);
  const index = L.buildIndex(items, { lanes: C.lanes });
  const memory = new Map();
  for (let k = 0; k < 400; k++) {
    const it = items[Math.floor(R() * items.length)];
    const r = randomRecord(R, it.n || 12);
    if (R() < 0.3) r.jl = [['less', at]];
    memory.set(it.id, r);
  }
  const p = L.computeProfile({ items, index, memory, now: NOW, controls: { 'lane:llm': 'boost', 'lane:ttrpg': 'mute' } });
  for (const [, l] of p._lam) assert.ok(Math.abs(l) <= 2);
  for (const v of p._I) assert.ok(Math.abs(v) < 1);
  for (const v of Object.values(p.laneFactor)) assert.ok(v >= 0.44 && v <= 2.3, `lane factor ${v}`);
  for (const v of Object.values(p.phi)) assert.ok(v >= -0.8 && v <= 0.3, `Φ ${v}`);
  for (const it of items) { const t = 0.8 * (p.pred[it.id] || 0) + (p.phi[it.id] || 0); assert.ok(t > -1.6 && t < 1.1); }
});

test('explanations: the shares add up to B·I', () => {
  const ops = [...readOps('syn:1', { mins: 18, frac: 0.9, at, it: SYN[1] }), ...readOps('syn:4', { mins: 9, frac: 0.6, at, it: SYN[4] }), ...quickOps('syn:2', { secs: 3, at, judge: ['less'], it: SYN[2] })];
  const p = profileOf(ops);
  for (let i = 0; i < SYN.length; i++) {
    const x = L.explainItem(synIndex.feats[i], p._lam, synIndex.labels, (f) => p.feat[f]?.c);
    const sum = x.all.reduce((s, c) => s + c.d, 0);
    near(sum, 0.8 * x.I, 1e-9, 'Σ Δ');
    near(x.I, p._I[i], 1e-12, 'same I as the profile');
    near(x.chips.reduce((s, c) => s + c.d, 0) + x.rest, 0.8 * x.I, 0.002, 'chips + rest');
    assert.ok(x.chips.filter((c) => c.d > 0).length <= 2 && x.chips.filter((c) => c.d < 0).length <= 1);
  }
  const i = synIndex.byId.get('syn:7');
  const x = L.explainItem(synIndex.feats[i], p._lam, synIndex.labels, (f) => p.feat[f]?.c);
  const chip = x.chips.find((c) => c.f === 'tag:beta');
  assert.ok(chip, JSON.stringify(x.chips));
  assert.equal(chip.label, 'Beta');
  assert.match(chip.text, /^you read 2 deeply/);
});

test('firstAuthor on the corpus formats', () => {
  const cases = {
    'Rohin Shah, Alex Irpan, Alexander Matt Turner et al.': 'shah',
    'Tomas Mikolov et al.': 'mikolov',
    'Tilmann Gneiting, Adrian E. Raftery': 'gneiting',
    'Jones, Samuel I. (Samuel Isaac), b. 1880': 'jones',
    'Venn, John': 'venn',
    'TurnTrout': 'turntrout',
    'deepseek-ai': 'deepseek-ai',
    'Harry Nyquist': 'nyquist',
    'Dario Amodei and Chris Olah': 'amodei',
    'Smith; Jones': 'smith',
    'Martin Luther King Jr.': 'king',
    'J.': null,
    '': null,
  };
  for (const [a, want] of Object.entries(cases)) assert.equal(L.firstAuthor(a), want, a);
  assert.equal(L.firstAuthorName('Jones, Samuel I. (Samuel Isaac), b. 1880'), 'Samuel I Jones');
  assert.equal(L.firstAuthorName('Rohin Shah, Alex Irpan et al.'), 'Rohin Shah');
  let nulls = 0; for (const it of items) if (it.a && !L.firstAuthor(it.a)) nulls++;
  assert.ok(nulls < items.length * 0.02, `${nulls} authors unparsed`);
  assert.equal(L.yearBand(1899), '<1900'); assert.equal(L.yearBand(2021), '2020-22'); assert.equal(L.yearBand(2026), '2026'); assert.equal(L.yearBand(null), null);
});

test('find states: dismissed, kept, marks, seen, new', () => {
  const today = L.localDay(NOW);
  const it = { id: 'f', added: today };
  assert.equal(L.findState({ id: 'g' }, null, null, NOW), null, 'not a find');
  assert.equal(L.findState({ id: 'h', added: L.localDay(NOW - 120 * DAY) }, null, null, NOW), null, 'too old');
  assert.equal(L.findState(it, null, null, NOW), 'new');
  assert.equal(L.findState(it, { a: 5000, sc: 1, jl: [] }, null, NOW), 'new', 'a flick past');
  assert.equal(L.findState(it, { a: 21000, sc: 0, jl: [] }, null, NOW), 'seen');
  assert.equal(L.findState(it, { a: 0, sc: 2, jl: [] }, null, NOW), 'seen');
  assert.equal(L.findState(it, { a: 0, sc: 0, jl: [['more', 1]] }, null, NOW), 'seen');
  assert.equal(L.findState(it, { a: 99e3, sc: 9, jl: [] }, { st: 'new' }, NOW), 'new', 'an explicit mark');
  assert.equal(L.findState(it, null, { st: 'seen' }, NOW), 'seen');
  assert.equal(L.findState(it, { a: 0, jl: [['save', 1]] }, { st: 'new' }, NOW), 'kept');
  assert.equal(L.findState(it, { a: 0, jl: [['save', 1], ['less', 2]] }, null, NOW), 'dismissed');
});

test('spearman', () => {
  assert.equal(L.spearman([1, 2, 3], [1, 2, 3]), null);
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  near(L.spearman(xs, [1, 2, 3, 4, 5, 6, 7, 8, 10, 9]), 1 - (6 * 2) / (10 * 99), 1e-12, 'one swap');
  near(L.spearman(xs, xs.map((x) => -x)), -1, 1e-12, 'reversed');
  near(L.spearman(xs, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]), 0.9847, 1e-3, 'ties');
  assert.equal(L.spearman(xs, xs.map(() => 1)), 0);
});

test('labels', () => {
  const index = L.buildIndex(items, { lanes: C.lanes });
  assert.equal(index.labels.get('path:llm/Reasoning'), 'LLM papers › Reasoning');
  assert.equal(index.labels.get('lane:llm'), 'LLM papers');
  assert.equal(index.labels.get('au:shah'), 'Rohin Shah');
  assert.equal(index.labels.get('w:reasoning'), '“reasoning”');
  assert.equal(index.labels.get('kind:pdf'), 'PDFs');
  assert.equal(index.labels.get('yr:2020-22'), '2020–22');
  assert.equal(L.labelOf('tech:4'), 'Technicality 4/5');
  assert.equal(L.labelOf('formal:2'), 'Formal: central');
  assert.equal(L.labelOf('aud:researcher'), 'For researchers');
  assert.equal(L.labelOf('len:l'), 'Length: long');
  assert.equal(L.labelOf('field:AI/Alignment/Oversight'), 'Oversight');
  assert.equal(L.labelOf('tag:reasoning-models'), 'Reasoning models');
  // Metadata features.
  const it = { id: 'm', kind: 'pdf', t: 'x', lane: 'llm', meta: { field: ['AI', 'Language models', 'Post-training'], also: [['AI', 'Alignment']], genre: 'empirical', tech: 4, math: 3, mathAreas: ['probability'], formal: 1, len: 'l', era: 'frontier', audience: 'researcher' } };
  const f = new Map(L.buildIndex([it]).feats[0].map(([g, f, m]) => [f, [g, m]]));
  assert.deepEqual(f.get('field:AI'), ['field', 0.25]);
  assert.deepEqual(f.get('field:AI/Language models/Post-training'), ['field', 0.75]);
  assert.deepEqual(f.get('field:AI/Alignment'), ['field', 0.25], 'an also path at half weight');
  assert.deepEqual(f.get('field:AI'), ['field', 0.25], 'the larger m of the main path and the also path');
  assert.deepEqual(f.get('tech:4'), ['level', 1]); assert.deepEqual(f.get('tech:5'), ['level', 0.5]); assert.deepEqual(f.get('math:2'), ['level', 0.5]);
  assert.deepEqual(f.get('ma:probability'), ['level', 0.5]);
  assert.deepEqual(f.get('len:l'), ['form', 0.5]); assert.deepEqual(f.get('era:frontier'), ['era', 0.5]); assert.deepEqual(f.get('aud:researcher'), ['style', 1]);
});
