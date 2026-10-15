// The learning model on the real corpus.json: the scenarios and pass bands of
// docs/learning/spec.md §11.1 (from the design simulation, model §5.2). Ranking is
// All with the round-robin of ui/js/state.js, noise as there with seed 12345.
// Two variants: the corpus's own tags, and a tags.json fixture that adds
// reasoning-models, rl-training, tabletop-rpg and wargames by the simulation's regexes.
// Run: node --test test/learn-sim.test.mjs   (LEARN_SIM_LOG=1 prints the numbers)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as L from '../server/learn.mjs';
import { readOps, quickOps, recordsOf } from './learn-ops.mjs';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const C = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
const items = C.items, LW = C.laneWeights || {};
const NOW = Date.parse('2026-10-15T12:00:00Z'), DAY = 864e5, at = NOW - DAY;
const log = (...a) => { if (process.env.LEARN_SIM_LOG) console.log(...a); };

const seed = 12345;
const noise = (i) => { let x = (i + 1) * 2654435761 ^ seed; x = Math.imul(x ^ (x >>> 15), 2246822507); x ^= x >>> 13; return ((x >>> 0) % 10000) / 10000; };
const laneMax = {}; for (const it of items) laneMax[it.lane] = Math.max(laneMax[it.lane] || 1, it.score || 0);
const base = items.map((it, i) => noise(i) * 0.9 + 0.8 * (it.q ?? Math.log(1 + (it.score || 0)) / Math.log(1 + laneMax[it.lane])) + 0.8 * ((it.rel ?? 0.5) - 0.5) + (it.kind === 'pdf' ? 0.35 : 0));

const TAGS = { tags: [
  { id: 'reasoning-models', label: 'Reasoning models', items: items.filter((it) => /reasoning|chain[- ]of[- ]thought|test-time|grpo|deepseek-?r1|thinking|^s1:|^star:|verifiers|process- and outcome/i.test(it.t)).map((it) => it.id) },
  { id: 'rl-training', label: 'RL training', items: items.filter((it) => /reinforcement|\brl\b|rlhf|reward/i.test(it.t + ' ' + (it.tags || []).join(' '))).map((it) => it.id) },
  { id: 'tabletop-rpg', label: 'Tabletop RPGs', items: items.filter((it) => it.lane === 'ttrpg').map((it) => it.id) },
  { id: 'wargames', label: 'Wargames', items: items.filter((it) => /wargame|kriegs|war-game|little wars/i.test(it.t)).map((it) => it.id) },
] };
const REASONING = new Set(items.filter((it) => (it.lane === 'llm' && (it.path || [])[0] === 'Reasoning') || /reasoning|test-time|chain[- ]of[- ]thought|grpo|deepseek/i.test(it.t)).map((it) => it.id));
const TTRPG = items.filter((it) => it.lane === 'ttrpg').map((it) => it.id);

/** All, ranked: the score with the learned term (as features/learn.js registers it), then the weighted round-robin. */
function rank(prof) {
  const sc = items.map((it, i) => base[i] + (prof ? L.LEARN.B * (prof.pred[it.id] || 0) + (prof.phi[it.id] || 0) : 0));
  const pool = items.map((_, i) => i).sort((a, b) => sc[b] - sc[a]);
  const buckets = {}; for (const i of pool) (buckets[items[i].lane] ||= []).push(i);
  const lanes = Object.keys(buckets);
  const weight = (l) => Math.max(0.1, (LW[l] ?? 1) * (prof ? prof.laneFactor[l] ?? 1 : 1));
  const total = lanes.reduce((s, l) => s + weight(l), 0);
  const out = [], credit = Object.fromEntries(lanes.map((l) => [l, 0]));
  while (out.length < pool.length) {
    for (const l of lanes) credit[l] += weight(l) / total;
    const l = lanes.filter((x) => buckets[x].length).sort((a, b) => credit[b] - credit[a])[0];
    if (!l) break;
    credit[l] -= 1; out.push(buckets[l].shift());
  }
  return out;
}
const COLD = rank(null);
const sd = (a) => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };

function sessionA() {
  const ops = [
    ...readOps('arxiv:2402.03300', { mins: 18, frac: 0.9, at }),
    ...readOps('arxiv:2501.12948', { mins: 35, frac: 0.8, days: 2, judge: ['save'], at }),
    ...readOps('arxiv:2501.19393', { mins: 14, frac: 0.9, at }),
    ...readOps('arxiv:2408.03314', { mins: 20, frac: 0.7, judge: ['more'], at }),
    ...readOps('arxiv:2503.11926', { mins: 9, frac: 0.5, at }),
  ];
  for (const id of TTRPG.slice(0, 6)) ops.push(...quickOps(id, { secs: 3, at }));
  ops.push(...quickOps(TTRPG[6], { secs: 4, judge: ['less'], at }));
  const taken = new Set(ops.map((o) => o.id));
  let skipped = 0;
  for (const i of COLD) {
    const it = items[i];
    if (taken.has(it.id) || REASONING.has(it.id) || it.lane === 'ttrpg') continue;
    if (skipped++ >= 25) break;
    ops.push(...quickOps(it.id, { secs: 2 + (skipped % 4), at }));
  }
  for (const it of items.filter((x) => x.lane === 'lesswrong').slice(0, 5)) ops.push(...readOps(it.id, { mins: 4, frac: 0.6, at }));
  return ops;
}
const shift = (ops, d) => ops.map((o) => ({ ...o, t: o.t - d * DAY, ...(o.s != null ? { s: o.s - d * DAY } : {}), ...(o.e != null ? { e: o.e - d * DAY } : {}) }));

function metrics(prof, memory) {
  const order = rank(prof);
  const unread = (o) => o.filter((i) => !memory.has(items[i].id));
  const u50 = unread(order).slice(0, 50), c50 = unread(COLD).slice(0, 50);
  const inTop = (k) => unread(order).slice(0, k).filter((i) => REASONING.has(items[i].id)).length;
  return {
    order, top20: inTop(20), top50: inTop(50),
    ttrpg: unread(order).slice(0, 100).filter((i) => items[i].lane === 'ttrpg').length,
    lanes: new Set(order.slice(0, 50).map((i) => items[i].lane)).size,
    jaccard: u50.filter((i) => c50.includes(i)).length / new Set([...u50, ...c50]).size,
    sdBI: sd(items.map((it) => L.LEARN.B * (prof.pred[it.id] || 0))), sdBase: sd(base),
  };
}
const topLam = (p) => Math.max(...Object.values(p.feat).map((x) => x.l));

for (const [variant, tags] of [['corpus tags', null], ['tags fixture', TAGS]]) {
  const index = L.buildIndex(items, { tags, lanes: C.lanes });
  const prof = (ops, extra = {}) => { const memory = recordsOf(ops); return { p: L.computeProfile({ items, index, memory, now: NOW, ...extra }), memory }; };
  const fx = variant === 'tags fixture';

  test(`S0 cold start (${variant}): I ≡ 0 and the order is the base order`, () => {
    const { p } = prof([]);
    assert.deepEqual(p.pred, {}); assert.deepEqual(p.phi, {});
    assert.ok(p._I.every((v) => v === 0));
    assert.deepEqual(rank(p), COLD);
  });

  test(`S1 one deep read of DeepSeekMath (${variant})`, () => {
    const { p, memory } = prof(readOps('arxiv:2402.03300', { mins: 18, frac: 0.9, at }));
    const gains = items.map((it, i) => [i, memory.has(it.id) ? -9 : L.LEARN.B * p._I[i]]).sort((a, b) => b[1] - a[1]);
    const m = metrics(p, memory);
    log(`S1 ${variant}: biggest +${gains[0][1].toFixed(3)} (${items[gains[0][0]].t.slice(0, 40)}), jaccard ${m.jaccard.toFixed(2)}`);
    assert.ok(gains[0][1] <= 0.3, `biggest change ${gains[0][1]}`);
    assert.ok(m.jaccard >= 0.75, `jaccard ${m.jaccard}`);
    for (const [i] of gains.slice(0, 3)) assert.ok(items[i].lane === 'llm' && items[i].path?.[0] === 'Reasoning', items[i].t);
  });

  const A = sessionA();
  test(`S2 session A (${variant})`, () => {
    const { p, memory } = prof(A);
    const m = metrics(p, memory);
    log(`S2 ${variant}: reasoning ${m.top20}/${m.top50}, ttrpg ${m.ttrpg}, lanes ${m.lanes}, jaccard ${m.jaccard.toFixed(2)}, sd B·I ${m.sdBI.toFixed(3)} vs ${m.sdBase.toFixed(3)}; llm ×${p.laneFactor.llm}, ttrpg ×${p.laneFactor.ttrpg}`);
    if (fx) { assert.ok(m.top20 >= 5 && m.top50 >= 9, `reasoning ${m.top20}/${m.top50}`); }
    else assert.ok(m.top20 >= 3 && m.top50 >= 5, `reasoning ${m.top20}/${m.top50}`);
    assert.ok(m.ttrpg <= 3, `ttrpg ${m.ttrpg}`);
    assert.ok(m.lanes >= 8, `lanes ${m.lanes}`);
    assert.ok(m.sdBI <= 0.5 * m.sdBase, `sd ${m.sdBI}`);
    assert.ok(m.jaccard >= 0.3 && m.jaccard <= 0.7, `jaccard ${m.jaccard}`);
    if (fx) {
      const i = index.byId.get('ttrpg:fate-core');
      if (i != null) { log(`   Fate Core I = ${p._I[i].toFixed(2)}`); assert.ok(p._I[i] < -0.3, `Fate Core ${p._I[i]}`); }
    }
  });

  test(`S3 session A aged 90 days (${variant})`, () => {
    const now = prof(A).p, later = prof(shift(A, 90)).p;
    const a = topLam(now), b = topLam(later);
    log(`S3 ${variant}: top λ ${a.toFixed(2)} → ${b.toFixed(2)} (${(100 * (1 - b / a)).toFixed(0)}% lower)`);
    assert.ok(b <= a * 0.85 && b >= a * 0.6, `top λ ${a} → ${b}`);
    assert.ok(b > 0);
  });

  test(`S4 drift to forecasting (${variant})`, () => {
    const ops = shift(A, 14);
    items.filter((it) => it.lane === 'forecasting').slice(0, 10).forEach((it, k) => ops.push(...readOps(it.id, { mins: 8 + k, frac: 0.8, at: NOW - (k + 1) * DAY })));
    [...REASONING].filter((id) => !ops.some((o) => o.id === id)).slice(0, 4).forEach((id, k) => ops.push(...quickOps(id, { secs: 3, at: NOW - (k + 1) * DAY })));
    const { p } = prof(ops);
    log(`S4 ${variant}: forecasting ×${p.laneFactor.forecasting}, llm ×${p.laneFactor.llm}`);
    assert.ok(p.laneFactor.forecasting >= 1.2 && p.laneFactor.forecasting >= p.laneFactor.llm - 0.05);
  });

  test(`S5 one save after the TTRPG skips (${variant})`, () => {
    const before = prof(A).p;
    const { p } = prof([...A, ...readOps('ttrpg:blades-srd', { mins: 12, frac: 0.3, judge: ['save'], at })]);
    log(`S5 ${variant}: lane:ttrpg ${before.feat['lane:ttrpg'].l} → ${p.feat['lane:ttrpg'].l}`);
    assert.ok(before.feat['lane:ttrpg'].l < -0.8);
    assert.ok(p.feat['lane:ttrpg'].l >= -0.4);
  });
}

test('S9 cost: the corpus ×5, 5,000 exposures', () => {
  const big = [];
  for (let r = 0; r < 5; r++) for (const it of items) big.push({ ...it, id: it.id + '#' + r });
  const best = (fn) => { let t = Infinity, out; for (let k = 0; k < 2; k++) { const t0 = performance.now(); out = fn(); t = Math.min(t, performance.now() - t0); } return [t, out]; };
  const [tIndex, index] = best(() => L.buildIndex(big, { tags: TAGS, lanes: C.lanes }));
  const memory = new Map();
  for (let k = 0; k < 5000; k++) {
    const it = big[(k * 7919) % big.length];
    for (const [id, r] of recordsOf(k % 3 ? readOps(it.id, { mins: 1 + (k % 20), frac: (k % 10) / 10 + 0.05, at: at - (k % 50) * DAY, it }) : quickOps(it.id, { secs: 3, at, it }))) memory.set(id, r);
  }
  const [tProf, p] = best(() => L.computeProfile({ items: big, index, memory, now: NOW }));
  log(`S9: buildIndex ${tIndex.toFixed(0)} ms for ${big.length} items; recompute ${tProf.toFixed(0)} ms for ${p.exposures} exposures, ${Object.keys(p.feat).length} features`);
  assert.ok(tIndex <= 1500, `buildIndex ${tIndex} ms`);
  assert.ok(tProf <= 300, `recompute ${tProf} ms`);
  assert.ok(p.exposures >= 4000);
});

test('S10 new finds: +0.3 while new, then the read rules once seen', () => {
  const today = L.localDay(NOW);
  const its = items.map((it) => ({ ...it }));
  const picks = its.filter((it) => it.lane === 'ai-safety').slice(0, 10);
  for (const it of picks) Object.assign(it, { added: today, job: 'discover-0001' });
  const index = L.buildIndex(its, { lanes: C.lanes });
  const p = L.computeProfile({ items: its, index, memory: new Map(), now: NOW });
  for (const it of picks) assert.equal(p.phi[it.id], 0.3, it.id);
  assert.equal(p.new.length, 10);
  const memory = recordsOf(readOps(picks[0].id, { mins: 0.5, frac: 0.2, at: NOW - 60e3, it: picks[0] }));
  const q = L.computeProfile({ items: its, index, memory, now: NOW });
  assert.equal(q._finds.find((x) => x.id === picks[0].id).st, 'seen');
  assert.ok(!q.new.includes(picks[0].id) && q.new.length === 9);
  assert.ok((q.phi[picks[0].id] || 0) <= 0, `Φ ${q.phi[picks[0].id]}`);
  // Older finds fade: half the bonus at 7 days.
  const half = L.computeProfile({ items: its, index, memory: new Map(), now: NOW + 7 * DAY });
  assert.ok(Math.abs(half.phi[picks[1].id] - 0.15) <= 0.011, String(half.phi[picks[1].id]));
});
