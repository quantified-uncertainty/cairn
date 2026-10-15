// Test helper (not a test): synthetic reading as memory ops, the way
// ui/js/features/memory.js sends them, and records built by replaying those ops
// through server/routes/45-memory.mjs apply(). Mirrors the design simulation's
// readRec/quickRec (docs/learning/spec.md §11.1).
//
//   readOps(id, {mins, frac, days, at, judge, exit, via, n, kind}) → ops
//   quickOps(id, {secs, at, exit, via, judge, n}) → ops
//   recordsOf(ops) → Map id → record
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { apply } from '../server/routes/45-memory.mjs';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DAY = 864e5;
let corpus = null;
const itemOf = (id) => {
  if (!corpus) corpus = new Map(JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8')).items.map((it) => [it.id, it]));
  return corpus.get(id) || {};
};
const FLOW = new Set(['html', 'web', 'text']);

/** A read of mins minutes over `days` days (one visit a day, the last ending at `at`), covering frac of the pages. */
export function readOps(id, { mins, frac = 1, days = 1, at = Date.now() - DAY, judge = [], exit = 'next', via = 'feed', n, kind, it } = {}) {
  it = it || itemOf(id);
  kind = kind || it.kind || 'pdf';
  const N = n || it.n || (FLOW.has(kind) ? Math.ceil((it.words || 2500) / 280) : 14);
  const c = kind === 'pdf' || kind === 'scan' ? 2 : 3;
  const per = (mins * 60e3) / days;
  const ops = [];
  const pagesRead = Math.max(1, Math.round(N * frac));
  const spreads = Math.ceil(pagesRead / c);
  const ms = (mins * 60e3) / spreads;
  for (let d = 0; d < days; d++) {
    const s = at - (days - 1 - d) * DAY, e = s + per * 1.1;
    ops.push({ o: 'visit', id, t: s + 1000, s, e: s + 1000, a: Math.min(1000, per), via, lane: it.lane, kind });
    ops.push({ o: 'visit', id, t: e, s, e, a: per, ...(d === days - 1 ? { x: exit } : { x: 'next' }) });
  }
  // The spreads, spread evenly over the reading time.
  const first = at - (days - 1) * DAY;
  for (let k = 0; k < spreads; k++) {
    const day = Math.floor((k * days) / spreads);
    const s = first + day * DAY + (k - Math.floor((day * spreads) / days)) * ms;
    const kk = k * c;
    ops.push({ o: 'at', id, t: s, k: kk, c, n: N, f: FLOW.has(kind) ? 1 : 0 });
    ops.push({ o: 'saw', id, t: s + ms, k: kk, c, s, ms, seen: true });
  }
  for (const j of judge) ops.push({ o: 'judge', id, t: at + 1000, j });
  return ops;
}

/** A quick look: secs seconds on the first spread, then away (exit). */
export function quickOps(id, { secs = 3, at = Date.now() - DAY, exit = 'next', via = 'feed', judge = [], n, it } = {}) {
  it = it || itemOf(id);
  const N = n || it.n || 14;
  const ops = [
    { o: 'visit', id, t: at + secs * 1000, s: at, e: at + secs * 1000, a: secs * 1000, x: exit, via, lane: it.lane, kind: it.kind },
    { o: 'at', id, t: at + 300, k: 0, c: 2, n: N, f: 0 },
    { o: 'saw', id, t: at + secs * 1000, k: 0, c: 2, s: at, ms: secs * 1000, seen: secs >= 2 },
  ];
  for (const j of judge) ops.push({ o: 'judge', id, t: at + 500, j });
  return ops;
}

/** Replay ops through the memory route's apply() into records. */
export function recordsOf(ops, index = new Map()) {
  for (const op of [...ops].sort((a, b) => a.t - b.t)) apply(index, op);
  return index;
}
