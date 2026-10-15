// Reader state, and the ranking that decides what comes next.
import { store } from './util.js';
import { items, LANE_WEIGHTS, tokens, laneMax } from './corpus.js';

export const state = {
  view: 'feed', lane: store.get('lane', 'all'),
  aff: store.get('aff', { lane: {}, tok: {} }), saved: store.get('saved', []),
  order: [], pos: 0, start: new Map(), hist: new Map(), shown: 0, gen: 0,
  per: store.get('per', 3), zoom: false, crop: store.get('crop', true), cols: store.get('cols', false),
  font: store.get('font', 15), flowCols: store.get('flowCols', 0),
  presum: store.get('presum', true), turns: [], panel: store.get('panel', true), panelSide: store.get('panelSide', 'left'),
  pin: store.get('pin', false), wheel: store.get('wheel', 'items'),
  status: {}, marks: new Map(), // id -> page numbers to mark on the strip (summary key points)
};
const seed = store.get('seed', Math.floor(Math.random() * 1e9));
store.set('seed', seed);
const noise = (i) => { let x = (i + 1) * 2654435761 ^ seed; x = Math.imul(x ^ (x >>> 15), 2246822507); x ^= x >>> 13; return ((x >>> 0) % 10000) / 10000; };

export const current = () => state.order[state.pos];

export function score(i) {
  const it = items[i];
  const lane = state.aff.lane[it.lane] || 0;
  const tok = Math.max(-2, Math.min(2, tokens(it).reduce((s, w) => s + (state.aff.tok[w] || 0), 0)));
  const q = Math.log(1 + (it.score || 0)) / Math.log(1 + laneMax[it.lane]);
  const rel = it.rel ?? 0.5; // enrichment relevance, 0-1
  return noise(i) * 0.9 + 0.5 * lane + 0.25 * tok + 0.8 * q + 0.8 * (rel - 0.5);
}
export function buildOrder(keepHead = true) {
  let pool = items.map((_, i) => i).filter((i) => state.lane === 'all' || items[i].lane === state.lane);
  pool.sort((a, b) => score(b) - score(a));
  if (state.lane === 'all') {
    // Round-robin across lanes, weighted by the corpus's lane weights and what you like.
    const buckets = {};
    for (const i of pool) (buckets[items[i].lane] ||= []).push(i);
    const lanes = Object.keys(buckets);
    const weight = (l) => Math.max(0.1, (LANE_WEIGHTS[l] ?? 1) * (1 + (state.aff.lane[l] || 0) * 0.5));
    const total = lanes.reduce((s, l) => s + weight(l), 0);
    const out = []; const credit = Object.fromEntries(lanes.map((l) => [l, 0]));
    while (out.length < pool.length) {
      for (const l of lanes) credit[l] += weight(l) / total;
      const l = lanes.filter((x) => buckets[x].length).sort((a, b) => credit[b] - credit[a])[0];
      if (!l) break;
      credit[l] -= 1; out.push(buckets[l].shift());
    }
    pool = out;
  }
  if (keepHead && state.order.length) {
    const head = state.order.slice(0, state.pos + 3);
    const hs = new Set(head);
    state.order = head.concat(pool.filter((i) => !hs.has(i)));
  } else { state.order = pool; state.pos = 0; }
}
export function learn(it, w) {
  state.aff.lane[it.lane] = (state.aff.lane[it.lane] || 0) + w;
  for (const t of tokens(it)) state.aff.tok[t] = (state.aff.tok[t] || 0) + w * 0.5;
  store.set('aff', state.aff);
}
