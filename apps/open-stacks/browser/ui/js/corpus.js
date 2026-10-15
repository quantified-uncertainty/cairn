// The corpus (corpus.json) plus optional per-item enrichment (enrich.json:
// relevance, hooks and best pages), merged by id.
const corpus = await (await fetch('/corpus.json')).json();
export const { items } = corpus;
export const LANES = corpus.lanes || {};
export const COUNTS = corpus.counts || {};
export const LANE_WEIGHTS = corpus.laneWeights || {};
export const LANE_ORDERED = corpus.laneOrdered || {}; // lanes whose order matters (wikis): the feed follows tree order (it.ord)
export const LANE_COLORS = {
  lesswrong: '#5a7a4b', 'ai-safety': '#a0442f', 'deepmind-safety': '#3f6fb5', forecasting: '#b5833f', llm: '#3c5a7a',
  textbooks: '#7a3c5a', 'information-theory': '#6b4f8a', cybernetics: '#2f7a76', ttrpg: '#8a5a2b', oddities: '#7a6f60',
};
try {
  const r = await fetch('/enrich.json');
  if (r.ok) {
    const e = (await r.json()).items || {};
    for (const it of items) if (e[it.id]) Object.assign(it, e[it.id]);
  }
} catch { /* no enrichment */ }
for (const it of items) {
  // arXiv IDs carry the submission month.
  if (!it.d && /^arxiv:\d{4}\./.test(it.id)) it.d = `20${it.id.slice(6, 8)}-${it.id.slice(8, 10)}`;
}
export const byId = new Map(items.map((it, i) => [it.id, i]));
const STOP = new Set('the and for with from that this into over under about their your what when where which while using towards toward between through against without within paper part book books volume introduction theory study notes edition'.split(' '));
const tokCache = new Map();
export const tokens = (it) => {
  if (!tokCache.has(it.id)) tokCache.set(it.id, [...new Set(String(it.t + ' ' + (it.tags || []).join(' ')).toLowerCase().match(/[a-z][a-z-]{3,}/g) || [])].filter((w) => !STOP.has(w)));
  return tokCache.get(it.id);
};
export const laneMax = {};
for (const it of items) laneMax[it.lane] = Math.max(laneMax[it.lane] || 1, it.score || 0);

/** Items sharing title words (and lane), best first. */
export function related(i, n = 6) {
  const it = items[i]; const tk = new Set(tokens(it));
  return items.map((x, j) => [j, x.lane === it.lane ? 0.2 : 0, tokens(x).filter((w) => tk.has(w)).length])
    .filter(([j, , m]) => j !== i && m > 0).sort((a, b) => b[2] + b[1] - (a[2] + a[1])).slice(0, n).map(([j]) => j);
}
