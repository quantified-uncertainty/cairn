// Reader state, and the ranking that decides what comes next.
import { store } from './util.js';
import { items, LANES, COUNTS, LANE_WEIGHTS, tokens, laneMax } from './corpus.js';

export const state = {
  view: 'feed', lane: store.get('lane', 'all'),
  aff: store.get('aff', { lane: {}, tok: {} }), saved: store.get('saved', []),
  order: [], pos: 0, start: new Map(), hist: new Map(), shown: 0, gen: 0,
  per: store.get('per', 3), perAuto: store.get('perAuto', true), // perAuto: fit 1-3 pages to the screen
  zoom: false, crop: store.get('crop', true), cols: store.get('cols', false),
  font: store.get('font', 15), flowCols: store.get('flowCols', 0),
  presum: store.get('presum', true), turns: [], panel: store.get('panel', true), panelSide: store.get('panelSide', 'left'),
  pin: store.get('pin', false),
  // The wheel map, per device (gesture.js tells them apart): a notched mouse wheel
  // is 'continue' (down = Advance, up = Back), 'items' or 'pages'; a trackpad is
  // '2d' (vertical strokes = items, horizontal = pages) or 'continue'.
  // wheelDevice 'auto' guesses the device per gesture; 'mouse' or 'pad' fixes it.
  wheelMouse: store.get('wheelMouse', store.get('wheel') === 'pages' ? 'pages' : 'continue'),
  // vertical strokes page through the item; at the end, keep scrolling to move on
  wheelPad: store.get('wheelPad', 'continue'), wheelDevice: store.get('wheelDevice', 'auto'),
  status: {}, marks: new Map(), // id -> page numbers to mark on the strip (summary key points)
  // The stack (stack.js): state.order is what j/k walk; state.sort orders it (per lane,
  // store 'sort:<lane>'), state.scope (a Set of item indexes, or null) narrows it,
  // state.stack describes it ({kind, id, label, crumb, size}).
  sort: null, scope: null, stack: null,
};
const seed = store.get('seed', Math.floor(Math.random() * 1e9));
store.set('seed', seed);
const noise = (i) => { let x = (i + 1) * 2654435761 ^ seed; x = Math.imul(x ^ (x >>> 15), 2246822507); x ^= x >>> 13; return ((x >>> 0) % 10000) / 10000; };

export const current = () => state.order[state.pos];

export function score(i) {
  const it = items[i];
  const lane = state.aff.lane[it.lane] || 0;
  const tok = Math.max(-2, Math.min(2, tokens(it).reduce((s, w) => s + (state.aff.tok[w] || 0), 0)));
  const q = it.q ?? Math.log(1 + (it.score || 0)) / Math.log(1 + laneMax[it.lane]); // quality percentile in lane
  const rel = it.rel ?? 0.5; // enrichment relevance, 0-1
  const doc = it.kind === 'pdf' ? 0.35 : 0; // the reader prefers technical PDFs
  return noise(i) * 0.9 + 0.5 * lane + 0.25 * tok + 0.8 * q + 0.8 * (rel - 0.5) + doc;
}
// ---------- sorts (stack.js shows and switches them) ----------
export const SORT_KEYS = ['topic', 'ranked', 'newest', 'oldest'];
/** The lane's sort: chosen per lane (store 'sort:<lane>'); All is ranked, a single lane follows its topics. */
export function sortFor(lane) { const s = store.get('sort:' + lane, null); return SORT_KEYS.includes(s) ? s : lane === 'all' ? 'ranked' : 'topic'; }
let RANK = null, DATE = null;
/** Each item's place in the library tree, depth first: lanes in chip order, then folders
 *  (it.path) by their first item, items by it.ord. features/library.js draws this tree. */
export function topicRank() {
  if (RANK) return RANK;
  const o = (i) => items[i].ord ?? 1e6 + (1 - (items[i].q ?? 0.5)) * 1e4 + i * 1e-4;
  const node = () => ({ o: Infinity, sub: new Map(), kids: [] });
  const lanes = new Map(Object.keys(LANES).filter((l) => COUNTS[l]).map((l) => [l, node()]));
  items.forEach((it, i) => {
    let n = lanes.get(it.lane); if (!n) lanes.set(it.lane, (n = node()));
    const chain = [n];
    for (const name of Array.isArray(it.path) ? it.path : []) { let c = n.sub.get(name); if (!c) { c = node(); n.sub.set(name, c); n.kids.push(c); } n = c; chain.push(n); }
    n.kids.push(i);
    const k = o(i); for (const a of chain) if (k < a.o) a.o = k;
  });
  RANK = new Float64Array(items.length); let r = 0;
  const key = (k) => (typeof k === 'number' ? o(k) : k.o);
  const walk = (n) => { n.kids.sort((a, b) => key(a) - key(b)); for (const k of n.kids) if (typeof k === 'number') RANK[k] = r++; else walk(k); };
  for (const n of lanes.values()) walk(n);
  return RANK;
}
/** yyyymmdd from it.d, else the year (it.y); NaN when undated. */
export function dateKey(i) {
  if (!DATE) DATE = Float64Array.from(items, (it) => { const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(it.d || ''); return m ? +m[1] * 1e4 + (+m[2] || 0) * 100 + (+m[3] || 0) : it.y ? +it.y * 1e4 : NaN; });
  return DATE[i];
}
const byDate = (dir) => (a, b) => { const x = dateKey(a), y = dateKey(b), R = topicRank(); if (x !== x || y !== y) return (x !== x) - (y !== y) || R[a] - R[b]; return dir * (x - y) || R[a] - R[b]; };
const SORTERS = { topic: (a, b) => topicRank()[a] - topicRank()[b], newest: byDate(-1), oldest: byDate(1) };

/** Build state.order in state.sort (set from the lane): the lane, or state.scope when set.
 *  keepHead: ranked keeps where you are and what you have seen; the other sorts are
 *  fixed, so the current item just keeps its place. keep: an item to include and stay
 *  on (in the ranking it leads, the best of the rest after it). */
export function buildOrder(keepHead = true, keep = null) {
  const sort = state.sort = sortFor(state.lane);
  const fixed = sort !== 'ranked';
  if (fixed && keepHead && keep == null && state.order.length) keep = current() ?? null;
  let pool = state.scope ? [...state.scope] // a narrowed stack (stack.js): a folder, a tag
    : items.map((_, i) => i).filter((i) => state.lane === 'all' || items[i].lane === state.lane);
  if (fixed) {
    if (keep != null && !pool.includes(keep)) pool.push(keep);
    pool.sort(SORTERS[sort]);
  } else {
    const sc = new Map(pool.map((i) => [i, score(i)]));
    pool.sort((a, b) => sc.get(b) - sc.get(a));
  }
  if (!fixed && state.lane === 'all') {
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
  if (keep != null && fixed) { state.order = pool; state.pos = Math.max(0, pool.indexOf(keep)); }
  else if (keep != null) { state.order = [keep, ...pool.filter((i) => i !== keep)]; state.pos = 0; }
  else if (keepHead && state.order.length) {
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
