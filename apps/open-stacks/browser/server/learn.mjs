// The learning model (docs/learning/spec.md, section 2): an engagement score per
// item from reading memory, an interest weight per feature (tag, field, folder,
// author, lane, title word…), predicted interest for every item, a familiarity
// term, the lane factor in All, explanations, seeds for agent jobs, the state
// of items added by jobs, and a calibration check.
//
// Pure: no fs, no timers, no app state. server/routes/47-learn.mjs feeds it the
// corpus, memory and controls; the tests import it directly. All numbers live
// in LEARN; GEN changes when a formula does.

export const GEN = 1;

const STOP = ('the and for with from that this into over under about their your what when where which while using towards toward ' +
  'between through against without within paper part book books volume introduction theory study notes edition more than less some ' +
  'most many much very also just only even does doing done have having been being were will would could should can cannot whose them ' +
  'they these those other others another each every such same here there then thus like make makes made making because after before ' +
  'during first second third new old one two three four five parts vol model models large language system systems approach approaches ' +
  'via based case use used learning research human method methods problems science').split(' ');

export const LEARN = {
  B: 0.8, rho: 0.75, kappa: 4, kappa0: 5, mu0prior: 0.25, H: 60, Hj: 180,
  laneExp: 0.6, lamMax: 2, tau: { pdf: 20, flow: 30, scan: 6 }, Tmin: 2, Tmax: 40,
  quick: { a: 5e3, a0: 15e3 }, wQuick: { next: 0.35, other: 0.2, jump: 0.1 },
  beta: { tag: 1, field: 1, path: 0.8, author: 0.6, lane: 0.6, tok: 0.4, style: 0.4, level: 0.4, form: 0.3, era: 0.3 },
  phi: { done: -0.8, quick: -0.4, glance: -0.25, progress: 0.15, fresh: 0.3, half: 30, progressDays: 21, freshDays: 14 },
  findDays: 90, seen: { a: 20e3, sc: 2 }, seeds: { n: 30, minV: 0.6, perFolder: 3, half: 30 },
  tok: { minDf: 3, maxFrac: 0.08, maxAbs: 20 }, stop: STOP,
};

const DAY = 864e5;
const LN5 = Math.log(5);
const FLOW = new Set(['html', 'web', 'text']);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const STOPSET = new Set(STOP);
const GROUPS = Object.keys(LEARN.beta);
const GI = Object.fromEntries(GROUPS.map((g, k) => [g, k]));
const BETA = GROUPS.map((g) => LEARN.beta[g]);

/** Local calendar date of an epoch-ms time, YYYY-MM-DD. */
export function localDay(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** Local midnight of a YYYY-MM-DD date, epoch ms; null when it is not one. */
export function dateAt(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null;
}

// ------------------------------------------------------------- authors ----
const PARTICLE = /^(van|von|de|der|den|du|da|del|della|di|le|la|al|el|bin|ibn|st\.?|ter|ten)$/i;
const SUFFIX = /^(jr|sr|ii|iii|iv)\.?$/i;
/** The first author's name as written: "(…)" and "b. 1880" stripped, cut at "et al", ";", "&" and " and ". */
function cutFirst(a) {
  let s = String(a || '').replace(/\([^)]*\)/g, ' ').replace(/\b(?:b|d|fl)\.\s*\d{3,4}.*$/i, ' ');
  s = s.split(/\s+et\.?\s+al\b|;|&|\s+and\s+/i)[0];
  return s.replace(/\s+/g, ' ').replace(/^[\s,.;]+|[\s,;]+$/g, '').trim();
}
/** "Last, First" → [last, first]; null when the string is a list of names or has no comma. */
function lastFirst(s) {
  const m = /^([^,]+),\s*([^,]+?)\.?$/.exec(s);
  if (!m) return null;
  const last = m[1].trim(), first = m[2].trim(), lw = last.split(' ');
  if (lw.length > 1 && !(lw.length <= 3 && lw.slice(0, -1).every((w) => PARTICLE.test(w)))) return null;
  if (!/^[A-ZÀ-ɏ]/.test(first) || SUFFIX.test(first)) return null;
  return [last, first];
}
/** The first author's surname, lowercased ('shah'); org names give one token; null when there is none. */
export function firstAuthor(a) {
  const s = cutFirst(a); if (!s) return null;
  const lf = lastFirst(s);
  let w;
  if (lf) w = lf[0];
  else {
    const ws = s.split(',')[0].trim().split(' ').filter(Boolean);
    while (ws.length > 1 && SUFFIX.test(ws.at(-1))) ws.pop();
    w = ws.at(-1) || '';
  }
  w = w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  return w.length > 1 ? w : null;
}
/** The first author's full name for labels: "Rohin Shah", "Samuel I. Jones". */
export function firstAuthorName(a) {
  const s = cutFirst(a); if (!s) return '';
  const lf = lastFirst(s);
  return lf ? `${lf[1]} ${lf[0]}` : s.split(',')[0].trim();
}

// ------------------------------------------------------------ features ----
/** The year band of a year: '<1900', '1900-49', '1950-89', '1990-2010', '2011-19', '2020-22', '2023-24', then each year. */
export function yearBand(y) {
  y = Number(y);
  if (!y || !Number.isFinite(y)) return null;
  if (y < 1900) return '<1900'; if (y < 1950) return '1900-49'; if (y < 1990) return '1950-89'; if (y < 2011) return '1990-2010';
  if (y < 2020) return '2011-19'; if (y < 2023) return '2020-22'; if (y < 2025) return '2023-24'; return String(Math.floor(y));
}
const yearOf = (it) => {
  if (it.y) return Number(it.y);
  const m = /^(\d{4})/.exec(it.d || ''); if (m) return +m[1];
  const a = /^arxiv:(\d{2})(\d{2})\./.exec(it.id || ''); return a ? 2000 + +a[1] : null;
};
const words = (it) => [...new Set(String((it.t || '') + ' ' + (it.tags || []).join(' ')).toLowerCase().match(/[a-z][a-z-]{3,}/g) || [])].filter((w) => !STOPSET.has(w));
const tagId = (t) => String(t || '').toLowerCase().trim().replace(/\s+/g, '-');

const KIND_LABEL = { pdf: 'PDFs', html: 'Forum posts', web: 'Web pages', scan: 'Scans', text: 'Plain texts' };
const LEN_LABEL = { xs: 'very short', s: 'short', m: 'medium', l: 'long', xl: 'very long', xxl: 'book-length' };
const AUD_LABEL = { general: 'For general readers', enthusiast: 'For enthusiasts', student: 'For students', practitioner: 'For practitioners', researcher: 'For researchers', policymaker: 'For policymakers' };
const LEVEL3 = ['none', 'some', 'central'];
const YR_LABEL = { '<1900': 'Before 1900', '1900-49': '1900–49', '1950-89': '1950–89', '1990-2010': '1990–2010', '2011-19': '2011–19', '2020-22': '2020–22', '2023-24': '2023–24' };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** The group of a feature id, from its prefix. */
export function groupOf(f) {
  const p = String(f).slice(0, String(f).indexOf(':'));
  return { tag: 'tag', field: 'field', path: 'path', au: 'author', lane: 'lane', w: 'tok', genre: 'style', stance: 'style', aud: 'style',
    tech: 'level', math: 'level', ma: 'level', formal: 'level', emp: 'level', code: 'level', kind: 'form', src: 'form', len: 'form', yr: 'era', era: 'era' }[p] || 'tok';
}
/** A readable label for a feature (spec §2.4). ctx: {tagLabels: Map, lanes: {lane: name}, authors: Map surname → name}. */
export function labelOf(f, ctx = {}) {
  const i = f.indexOf(':'), p = f.slice(0, i), v = f.slice(i + 1);
  switch (p) {
    case 'tag': return ctx.tagLabels?.get(v) || cap(v.replace(/-/g, ' '));
    case 'field': return v.split('/').at(-1);
    case 'path': { const [lane, ...folders] = v.split('/'); return [ctx.lanes?.[lane] || lane, ...folders.slice(-2)].join(' › '); }
    case 'au': return ctx.authors?.get(v) || cap(v);
    case 'lane': return ctx.lanes?.[v] || v;
    case 'w': return `“${v}”`;
    case 'genre': return `Genre: ${v}`;
    case 'stance': return `Stance: ${v}`;
    case 'aud': return AUD_LABEL[v] || `Audience: ${v}`;
    case 'tech': return `Technicality ${v}/5`;
    case 'math': return `Maths ${v}/5`;
    case 'ma': return `Maths: ${v}`;
    case 'formal': return `Formal: ${LEVEL3[+v] || v}`;
    case 'emp': return `Empirical: ${LEVEL3[+v] || v}`;
    case 'code': return `Code: ${LEVEL3[+v] || v}`;
    case 'kind': return KIND_LABEL[v] || v;
    case 'src': return v;
    case 'len': return `Length: ${LEN_LABEL[v] || v}`;
    case 'yr': return YR_LABEL[v] || v;
    case 'era': return `Era: ${v}`;
    default: return f;
  }
}

/**
 * The feature index, built in steps so a server can yield between them:
 * const b = indexBuilder(items, opts); while (!b.step(2000)) await tick(); b.result().
 * opts: {tags: parsed tags.json or null, meta: {id: record} or null, lanes: {lane: name}}.
 */
export function indexBuilder(items, { tags = null, meta = null, lanes = {} } = {}) {
  const N = items.length;
  const tagsOf = new Map(), tagLabels = new Map();
  for (const t of Array.isArray(tags?.tags) ? tags.tags : []) {
    if (!t || !t.id) continue;
    const id = tagId(t.id);
    if (t.label) tagLabels.set(id, String(t.label));
    for (const x of Array.isArray(t.items) ? t.items : []) { if (!tagsOf.has(x)) tagsOf.set(x, []); tagsOf.get(x).push(id); }
  }
  const laneIds = new Set(items.map((it) => it.lane).filter(Boolean));
  for (const l of Object.keys(lanes || {})) laneIds.add(l);
  const df = new Map(), W = new Array(N);
  for (let i = 0; i < N; i++) { W[i] = words(items[i]); for (const w of W[i]) df.set(w, (df.get(w) || 0) + 1); }
  const maxDf = Math.max(LEARN.tok.maxAbs, LEARN.tok.maxFrac * N);
  const feats = new Array(N), inv = new Map(), names = new Map(), byId = new Map();
  const dropTag = (t) => !t || laneIds.has(t) || t === 'alignment-forum' || t === 'advised';
  let i = 0;
  function featuresOf(it, k) {
    const F = new Map();
    const add = (g, f, m = 1) => { const o = F.get(f); if (!o) F.set(f, [g, f, m]); else if (m > o[2]) o[2] = m; };
    for (const t of tagsOf.get(it.id) || []) if (!dropTag(t)) add('tag', 'tag:' + t);
    for (const t0 of Array.isArray(it.tags) ? it.tags : []) { const t = tagId(t0); if (!dropTag(t)) add('tag', 'tag:' + t); }
    const mt = (meta && meta[it.id]) || it.meta || null;
    if (mt) {
      const paths = [[mt.field, 1], ...(Array.isArray(mt.also) ? mt.also : []).map((p) => [p, 0.5])];
      for (const [p, h] of paths) if (Array.isArray(p)) for (let d = 1; d <= p.length; d++) add('field', 'field:' + p.slice(0, d).join('/'), Math.min(1, d / 4) * h);
    }
    const lane = it.lane || 'none';
    const path = Array.isArray(it.path) ? it.path : [];
    for (let d = 1; d <= path.length; d++) add('path', 'path:' + [lane, ...path.slice(0, d)].join('/'), d === path.length ? 1 : 0.5);
    const au = firstAuthor(it.a);
    if (au) {
      add('author', 'au:' + au);
      const nm = firstAuthorName(it.a); if (nm) { let c = names.get(au); if (!c) names.set(au, (c = new Map())); c.set(nm, (c.get(nm) || 0) + 1); }
    }
    add('lane', 'lane:' + lane);
    for (const w of W[k]) { const d = df.get(w); if (d >= LEARN.tok.minDf && d <= maxDf) add('tok', 'w:' + w); }
    if (mt) {
      if (mt.genre) add('style', 'genre:' + mt.genre);
      if (mt.stance) add('style', 'stance:' + mt.stance);
      if (mt.audience) add('style', 'aud:' + mt.audience);
      const lvl = (key, f, lo, hi) => { const n = Number(mt[key]); if (mt[key] == null || !Number.isFinite(n)) return; add('level', `${f}:${n}`); for (const x of [n - 1, n + 1]) if (x >= lo && x <= hi) add('level', `${f}:${x}`, 0.5); };
      lvl('tech', 'tech', 1, 5); lvl('math', 'math', 0, 5);
      for (const a of Array.isArray(mt.mathAreas) ? mt.mathAreas : []) add('level', 'ma:' + a, 0.5);
      for (const [key, f] of [['formal', 'formal'], ['empirical', 'emp'], ['code', 'code']]) if (Number.isFinite(Number(mt[key])) && mt[key] != null) add('level', `${f}:${Number(mt[key])}`);
      if (mt.len) add('form', 'len:' + mt.len, 0.5);
      if (mt.era) add('era', 'era:' + mt.era, 0.5);
    }
    if (it.kind) add('form', 'kind:' + it.kind);
    if (it.src) add('form', 'src:' + it.src, 0.5);
    const yb = yearBand(yearOf(it)); if (yb) add('era', 'yr:' + yb);
    return [...F.values()];
  }
  return {
    /** Index the next n items; true when every item is done. */
    step(n = Infinity) {
      const end = Math.min(N, i + n);
      for (; i < end; i++) {
        const it = items[i]; byId.set(it.id, i);
        const F = featuresOf(it, i); feats[i] = F;
        for (const [, f] of F) { let a = inv.get(f); if (!a) inv.set(f, (a = [])); a.push(i); }
      }
      return i >= N;
    },
    result() {
      const authors = new Map();
      for (const [au, c] of names) authors.set(au, [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]);
      const ctx = { tagLabels, lanes, authors };
      const labels = new Map(), invA = new Map();
      for (const [f, a] of inv) { labels.set(f, labelOf(f, ctx)); invA.set(f, Int32Array.from(a)); }
      // A packed copy of feats for the hot loops: feature k of item i is fid[j], m[j], grp[j] for j in off[i]..off[i+1].
      const fnames = [...inv.keys()], fidOf = new Map(fnames.map((f, k) => [f, k]));
      let total = 0; for (const F of feats) total += F.length;
      const off = new Int32Array(N + 1), fid = new Int32Array(total), mm = new Float64Array(total), grp = new Uint8Array(total);
      let j = 0;
      for (let k = 0; k < N; k++) { off[k] = j; for (const [g, f, m] of feats[k]) { fid[j] = fidOf.get(f); mm[j] = m; grp[j] = GI[g]; j++; } }
      off[N] = j;
      return { feats, labels, inv: invA, df, byId, ctx, n: N, fnames, fidOf, packed: { off, fid, m: mm, g: grp } };
    },
  };
}
/** Pack an index that lacks the packed arrays (built by an older caller). */
function packIndex(index) {
  if (!index.fnames) { index.fnames = [...new Set(index.feats.flatMap((F) => F.map((x) => x[1])))]; index.fidOf = new Map(index.fnames.map((f, k) => [f, k])); }
  let total = 0; for (const F of index.feats) total += F.length;
  const N = index.feats.length, off = new Int32Array(N + 1), fid = new Int32Array(total), m = new Float64Array(total), g = new Uint8Array(total);
  let j = 0;
  for (let k = 0; k < N; k++) { off[k] = j; for (const [gg, f, mm] of index.feats[k]) { fid[j] = index.fidOf.get(f); m[j] = mm; g[j] = GI[gg]; j++; } }
  off[N] = j;
  return (index.packed = { off, fid, m, g });
}
/** The feature index in one go: {feats: [[g, f, m]] per item, labels: Map f → label, inv: Map f → Int32Array, df: Map word → n, byId}. */
export function buildIndex(items, opts = {}) {
  const b = indexBuilder(items, opts);
  b.step(Infinity);
  return b.result();
}

// ---------------------------------------------------------- engagement ----
/** Replay judgments in order (spec §2.2): {S, M, L}, each a time or null. */
export function replay(jl) {
  let S = null, M = null, L = null;
  for (const x of Array.isArray(jl) ? jl : []) {
    const [j, t] = x;
    if (j === 'save') S = t; else if (j === 'unsave') S = null;
    else if (j === 'more') { M = t; L = null; } else if (j === 'less') { L = t; M = null; }
    else if (j === 'unmore') M = null; else if (j === 'unless') L = null;
  }
  return { S, M, L };
}

/**
 * Engagement of one item from its memory record (spec §2.1-2.3).
 * nBody: body pages from the compiled profile (pdf); err: the item failed to open.
 * → null (not an exposure) | {y, y0, w, T, D, R, A, p, t, H, quick, label, S, M, L, unopened}
 */
export function engagement(it, r, { nBody = null, err = false } = {}) {
  if (!r || !it) return null;
  const J = replay(r.jl);
  const judged = !!(J.S || J.M || J.L);
  const nv = r.nv || 0;
  const flow = FLOW.has(it.kind), scan = it.kind === 'scan', pdf = !flow && !scan;
  const n = r.n || it.n || 0;
  const nb = pdf ? (nBody > 0 ? nBody : 0.85 * (n || 14)) : 0;
  const mins = it.meta?.mins > 0 ? it.meta.mins : flow ? (it.words || (n || 8) * 280) / 230 : scan ? 0.5 * (n || 200) : 1.5 * nb;
  const Tref = clamp(mins, LEARN.Tmin, LEARN.Tmax) * 60e3;
  const v = Array.isArray(r.v) ? r.v : [];
  let A = 0;
  for (const x of v) A += Math.min(Math.max(0, x[2] || 0), 2 * Tref);
  A = Math.min(3 * Tref, A);
  const T = Math.min(1, Math.log(1 + (4 * A) / Tref) / LN5);
  const tau = (flow ? LEARN.tau.flow : scan ? LEARN.tau.scan : LEARN.tau.pdf) * 1000;
  let p = 0;
  for (const s of Array.isArray(r.seq) ? r.seq : []) p += Math.min(s[1] || 0, Math.max(0, s[3] || 0) / tau);
  const body = pdf ? nb : flow ? n || 8 : n || 200;
  const den = Math.max(1, Math.min(0.8 * body, 40));
  const sc = r.sc || 0, far = r.far ?? -1;
  const D = Math.min(1, Math.max(p, 0.25 * sc, 0.15 * (far + 1)) / den);
  const days = new Set();
  for (const x of v) if ((x[2] || 0) >= 30e3) days.add(localDay(x[0]));
  const R = Math.min(1, Math.max(0, days.size - 1) / 2);
  let y0 = 0.5 * T + 0.35 * D + 0.15 * R, w = 1, quick = false, unopened = false, label;
  if (nv === 0 || (err && sc === 0) || (!n && sc === 0 && A >= LEARN.quick.a0)) {
    // A glimpse (never settled) or an item that failed to open: no evidence, unless the
    // reader judged it, which then counts as a verdict on the title alone.
    if (!judged) return null;
    y0 = 0; unopened = true; label = 'glance';
  } else if (A < LEARN.quick.a || (sc === 0 && A < LEARN.quick.a0)) {
    quick = true; y0 = 0; label = 'skip';
    const last = v.at(-1) || [];
    w = last[4] === 'jump' ? LEARN.wQuick.jump : last[3] === 'next' ? LEARN.wQuick.next : LEARN.wQuick.other;
  } else label = y0 >= 0.6 ? 'deep' : y0 >= 0.3 ? 'skim' : 'glance';
  let y = y0;
  if (J.S) { y = Math.max(y, 0.9); w = Math.max(w, 1) + 1; }
  if (J.M) { y = Math.max(y, 0.8); w = Math.max(w, 1) + (J.S ? 0.5 : 1); }
  if (J.L) { y = 0; w = 3; }
  w = Math.min(w, 3);
  if (unopened) w = 1;
  let t = r.last || r.first || 0, H = LEARN.H;
  if (judged) { t = J.L ? J.L : Math.max(t, J.S || 0, J.M || 0); H = LEARN.Hj; }
  return { y, y0, w, T, D, R, A, p, t, H, quick, unopened, label, S: J.S, M: J.M, L: J.L };
}

/** Finished: y ≥ 0.75, or D ≥ 0.8, or (n known) far ≥ n − 1 or sc ≥ 0.9·n. */
export function isDone(e, r, it) {
  if (!e) return false;
  if (e.y >= 0.75 || e.D >= 0.8) return true;
  const n = r?.n || it?.n || 0;
  // Reaching the end counts only for a read (y0 ≥ 0.3): a short page fits one spread, so a 2 s flick past it reaches its end.
  return n > 0 && !e.unopened && e.y0 >= 0.3 && ((r.far ?? -1) >= n - 1 || (r.sc || 0) >= 0.9 * n);
}

/** Familiarity Φ (spec §2.7). e: engagement or null; added: epoch ms of a find's `added`; state: its find state. */
export function phiOf(e, r, it, { now = Date.now(), state = null, added = null } = {}) {
  const P = LEARN.phi;
  if (e) {
    const age = Math.max(0, (now - (r?.last || e.t || now)) / DAY);
    if (e.L) return P.done;
    if (isDone(e, r, it)) return P.done;
    if (e.quick) return P.quick * 2 ** (-age / P.half);
    if (e.y < 0.3) return P.glance * 2 ** (-age / P.half);
    if (e.y < 0.75 && e.D < 0.8 && age < P.progressDays) return P.progress;
  }
  if (state === 'new' && added != null) {
    const a = Math.max(0, (now - added) / DAY);
    if (a <= P.freshDays) return P.fresh * (1 - a / P.freshDays);
  }
  return 0;
}

/** A find's state (spec §2.9): 'new' | 'seen' | 'kept' | 'dismissed', or null when the item is not a find. */
export function findState(it, r, mark, now = Date.now(), err = false) {
  const at = dateAt(it?.added);
  if (at == null || now - at > LEARN.findDays * DAY) return null;
  const J = r ? replay(r.jl) : { S: null, M: null, L: null };
  if (J.L) return 'dismissed';
  if (J.S) return 'kept';
  const st = typeof mark === 'string' ? mark : mark?.st;
  if (st === 'seen' || st === 'new') return st;
  // Pages count once more were seen than the spread on screen holds (r.pos.c): one 2-up spread on screen for 1.2 s is a flick.
  // Time on an item whose document failed to open, with no page seen (err), is not reading (as in engagement()).
  if (r && (((r.a || 0) >= LEARN.seen.a && !(err && !(r.sc > 0))) || ((r.sc || 0) >= LEARN.seen.sc && (r.sc || 0) > (r.pos?.c || 0)) || J.M)) return 'seen';
  return 'new';
}

// ------------------------------------------------------------- interest ----
const gS = new Float64Array(GROUPS.length), gM = new Float64Array(GROUPS.length);
/** Predicted interest of an item (spec §2.7): feats [[g, f, m]], lam Map f → λ (controls applied) → {I, r}. */
export function interestOf(feats, lam) {
  gS.fill(0); gM.fill(0);
  for (const [g, f, m] of feats) { const k = GI[g]; if (k == null) continue; gS[k] += m * (lam.get(f) || 0); gM[k] += m; }
  let num = 0, den = 0;
  for (let k = 0; k < GROUPS.length; k++) if (gM[k] > 0) { num += (BETA[k] * gS[k]) / Math.sqrt(gM[k]); den += BETA[k]; }
  const r = den ? num / den : 0;
  return { I: Math.tanh(r / LEARN.rho), r };
}

const PHRASES = {
  deep: (n) => `read ${n} deeply`, skim: (n) => `skimmed ${n}`, save: (n) => `saved ${n}`,
  more: (n) => `marked ${n} more like this`, skip: (n) => `skipped ${n}`, less: (n) => `marked ${n} less like this`,
};
const POS_ORDER = ['deep', 'save', 'more', 'skim', 'skip', 'less'];
const NEG_ORDER = ['less', 'skip', 'skim', 'deep', 'save', 'more'];
/** "you read 3 deeply, saved 1": at most two phrases from a feature's counters. Local wording only. */
export function evidenceText(c, positive = true, ctl = null) {
  if (ctl === 'boost') return 'you boosted this';
  if (ctl === 'mute') return 'you muted this';
  const out = [];
  for (const k of positive ? POS_ORDER : NEG_ORDER) if (c?.[k] > 0 && out.length < 2) out.push(PHRASES[k](c[k]));
  return out.length ? 'you ' + out.join(', ') : '';
}

/**
 * Why an item ranks where it does (spec §2.8). Each feature's share Δ adds up to B·I.
 * counters: {f: {deep, skim, …}} or (f) → counters; ctls: {f: mode} or Map.
 * → {I, r, chips: [{f, label, g, d, text, ctl?}], rest (Σ Δ not in chips), all: [{f, g, d}]}; ctl: the reader's
 * boost or mute on the chip's feature (the panel offers Reset then).
 */
export function explainItem(feats, lam, labels = new Map(), counters = {}, ctls = null) {
  const M = new Float64Array(GROUPS.length);
  for (const [g, , m] of feats) if (GI[g] != null) M[GI[g]] += m;
  let den = 0; for (let k = 0; k < GROUPS.length; k++) if (M[k] > 0) den += BETA[k];
  const c = [];
  for (const [g, f, m] of feats) {
    const k = GI[g]; if (k == null || !den) continue;
    c.push({ f, g, v: (BETA[k] * m * (lam.get(f) || 0)) / (Math.sqrt(M[k]) * den) });
  }
  const r = c.reduce((s, x) => s + x.v, 0);
  const kf = Math.abs(r) < 1e-9 ? 1 / LEARN.rho : Math.tanh(r / LEARN.rho) / r;
  const all = c.map((x) => ({ f: x.f, g: x.g, d: LEARN.B * x.v * kf }));
  const cnt = (f) => (typeof counters === 'function' ? counters(f) : counters?.[f]);
  const ctl = (f) => (ctls instanceof Map ? ctls.get(f) : ctls?.[f]) || null;
  // Title words merge into one chip.
  const ws = all.filter((x) => x.f.startsWith('w:') && x.d !== 0).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  const cands = all.filter((x) => !x.f.startsWith('w:') && ctl(x.f) !== 'ignore').map((x) => ({ ...x, label: labels.get(x.f) || labelOf(x.f) }));
  if (ws.length) {
    const d = ws.reduce((s, x) => s + x.d, 0);
    cands.push({ f: 'w:' + ws.map((x) => x.f.slice(2)).join(','), g: 'tok', d, label: 'title words: ' + ws.slice(0, 4).map((x) => x.f.slice(2)).join(', '), lead: ws[0].f });
  }
  const pos = cands.filter((x) => x.d >= 0.05).sort((a, b) => b.d - a.d).slice(0, 2);
  const neg = cands.filter((x) => x.d <= -0.05).sort((a, b) => a.d - b.d).slice(0, 1);
  const chips = [...pos, ...neg].sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).map((x) => {
    const key = x.lead || x.f;
    const c = ctl(key);
    return { f: x.f, label: x.label, g: x.g, d: r3(x.d), text: evidenceText(cnt(key), x.d >= 0, c), ...(c ? { ctl: c } : {}) };
  });
  const shown = chips.reduce((s, x) => s + x.d, 0);
  return { I: Math.tanh(r / LEARN.rho), r, chips, rest: r3(LEARN.B * Math.tanh(r / LEARN.rho) - shown), all };
}

// -------------------------------------------------------------- profile ----
const ZERO = () => ({ deep: 0, skim: 0, glance: 0, skip: 0, save: 0, more: 0, less: 0 });
/** Controls as a Map f → 'boost' | 'mute' | 'ignore', from {v, feat: {f: {mode}}} or {f: mode | {mode}}. */
export function controlMap(controls) {
  const src = controls?.feat && typeof controls.feat === 'object' ? controls.feat : controls || {};
  const out = new Map();
  for (const [f, x] of src instanceof Map ? src : Object.entries(src)) {
    const mode = typeof x === 'string' ? x : x?.mode;
    if (mode === 'boost' || mode === 'mute' || mode === 'ignore') out.set(f, mode);
  }
  return out;
}
/** λ after a control (spec §2.6). */
export function applyControl(l, mode) {
  if (mode === 'boost') return Math.min(LEARN.lamMax, Math.max(l, 0) + 1);
  if (mode === 'mute') return Math.max(-LEARN.lamMax, Math.min(l, 0) - 1.5);
  if (mode === 'ignore') return 0;
  return l;
}
/** Spearman's rank correlation; null when n < 10, 0 when either side is constant. */
export function spearman(xs, ys) {
  const n = Math.min(xs?.length || 0, ys?.length || 0);
  if (n < 10) return null;
  const rank = (a) => {
    const o = a.slice(0, n).map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
    const r = new Array(n);
    for (let i = 0; i < n;) { let j = i; while (j + 1 < n && o[j + 1][0] === o[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[o[k][1]] = avg; i = j + 1; }
    return r;
  };
  const a = rank(xs), b = rank(ys), m = (n + 1) / 2;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { sab += (a[i] - m) * (b[i] - m); saa += (a[i] - m) ** 2; sbb += (b[i] - m) ** 2; }
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
}

/**
 * The learned profile (spec §4.1) from the corpus, its index and reading memory.
 * memory: Map id → record (45-memory.mjs). controls: controls.json. pseudo: the one-time
 * import's pseudo-exposures [{f, W, y, t}]. marks: finds.json marks. opens: opens.jsonl rows.
 * The result also carries, not enumerable (so not serialized): _lam (Map f → λ), _ex
 * (Map id → {i, e, d}), _finds ([{i, id, st, at}]), _ctl (Map f → mode), _I (Float64Array).
 */
export function computeProfile({ items, index, memory, now = Date.now(), controls = {}, pseudo = [], nBodyOf = () => null, errOf = () => false, marks = {}, opens = [] }) {
  const ex = [], exById = new Map();
  let SW = 0, SY = 0;
  for (const [id, r] of memory instanceof Map ? memory : Object.entries(memory || {})) {
    const i = index.byId.get(id); if (i == null) continue;
    const it = items[i];
    const e = engagement(it, r, { nBody: nBodyOf(id), err: !!errOf(id) });
    if (!e || !(e.w > 0)) continue;
    const d = Math.min(1, 2 ** (-(now - e.t) / (e.H * DAY)));
    const x = { i, id, r, e, d, wd: e.w * d };
    ex.push(x); exById.set(id, x);
    SW += x.wd; SY += x.wd * e.y;
  }
  const ps = (Array.isArray(pseudo) ? pseudo : []).filter((p) => p && p.f && p.W > 0).map((p) => ({ ...p, wd: p.W * Math.min(1, 2 ** (-(now - (p.t || now)) / (LEARN.H * DAY))) }));
  for (const p of ps) { SW += p.wd; SY += p.wd * (p.y || 0); }
  const mu0 = Math.max(0.05, (SY + LEARN.kappa0 * LEARN.mu0prior) / (SW + LEARN.kappa0));

  // Sums per feature, over the packed index (features the index lacks, from the import, go in `extra`).
  const { off, fid, m: MM, g: GG } = index.packed || packIndex(index);
  const F = index.fnames.length, WW = new Float64Array(F), YY = new Float64Array(F), info = new Array(F);
  const since = now - 180 * DAY;
  for (const x of ex) {
    const recent = x.e.t >= since, s = x.wd * x.e.y, y = x.e.y;
    for (let j = off[x.i], end = off[x.i + 1]; j < end; j++) {
      const k = fid[j], m = MM[j];
      WW[k] += x.wd * m; YY[k] += x.wd * m * y;
      let a = info[k];
      if (!a) info[k] = a = { c: ZERO(), ex: [] };
      if (recent) { a.c[x.e.label]++; if (x.e.S) a.c.save++; if (x.e.M) a.c.more++; if (x.e.L) a.c.less++; }
      if (a.ex.length < 3 || s > a.ex[2][1]) { a.ex.push([x.id, s]); a.ex.sort((u, v) => v[1] - u[1] || (u[0] < v[0] ? -1 : 1)); if (a.ex.length > 3) a.ex.pop(); }
    }
  }
  const extra = new Map();
  for (const p of ps) {
    const k = index.fidOf.get(p.f);
    if (k != null) { WW[k] += p.wd; YY[k] += p.wd * (p.y || 0); if (!info[k]) info[k] = { c: ZERO(), ex: [] }; continue; }
    let a = extra.get(p.f); if (!a) extra.set(p.f, (a = { g: p.g || groupOf(p.f), W: 0, Y: 0, c: ZERO(), ex: [] }));
    a.W += p.wd; a.Y += p.wd * (p.y || 0);
  }
  const lamOf = (W, Y) => clamp(Math.log2((Y + LEARN.kappa * mu0) / (W + LEARN.kappa) / mu0), -LEARN.lamMax, LEARN.lamMax);
  const lam0 = new Map(), lam = new Map(), LA = new Float64Array(F);
  for (let k = 0; k < F; k++) if (info[k]) { const l = lamOf(WW[k], YY[k]); lam0.set(index.fnames[k], l); lam.set(index.fnames[k], l); LA[k] = l; }
  for (const [f, a] of extra) { const l = lamOf(a.W, a.Y); lam0.set(f, l); lam.set(f, l); }
  const ctl = controlMap(controls);
  for (const [f, mode] of ctl) { const l = applyControl(lam0.get(f) ?? 0, mode); lam.set(f, l); const k = index.fidOf.get(f); if (k != null) LA[k] = l; }

  const feat = {};
  const label = (f) => index.labels.get(f) || labelOf(f, index.ctx);
  const put = (f, g, W, Y, a) => { if (W >= 0.05 || ctl.has(f)) feat[f] = { l: r3(lam.get(f) ?? 0), l0: r3(lam0.get(f) ?? 0), W: r3(W), Y: r3(Y), g, label: label(f), c: a ? a.c : ZERO(), ex: a ? a.ex.map((x) => x[0]) : [], ctl: ctl.get(f) || null }; };
  for (let k = 0; k < F; k++) if (info[k]) put(index.fnames[k], groupOf(index.fnames[k]), WW[k], YY[k], info[k]);
  for (const [f, a] of extra) put(f, a.g, a.W, a.Y, a);
  for (const f of ctl.keys()) if (!feat[f]) put(f, groupOf(f), 0, 0, null);

  // Predicted interest for every item (spec §2.7, as interestOf), familiarity, finds.
  const N = items.length, I = new Float64Array(N), pred = {}, phi = {}, finds = [], newIds = [];
  const NG = GROUPS.length, gs = new Float64Array(NG), gm = new Float64Array(NG);
  for (let i = 0; i < N; i++) {
    gs.fill(0); gm.fill(0);
    for (let j = off[i], end = off[i + 1]; j < end; j++) { const g = GG[j]; gs[g] += MM[j] * LA[fid[j]]; gm[g] += MM[j]; }
    let num = 0, den = 0;
    for (let g = 0; g < NG; g++) if (gm[g] > 0) { num += (BETA[g] * gs[g]) / Math.sqrt(gm[g]); den += BETA[g]; }
    const v = Math.tanh((den ? num / den : 0) / LEARN.rho);
    I[i] = v;
    if (Math.abs(v) >= 0.01) pred[items[i].id] = r2(v);
  }
  const markOf = (id) => marks?.[id] || marks?.marks?.[id] || null;
  for (let i = 0; i < N; i++) {
    const it = items[i];
    if (!it.added) continue;
    const st = findState(it, memory instanceof Map ? memory.get(it.id) : memory?.[it.id], markOf(it.id), now, !!errOf(it.id));
    if (!st) continue;
    finds.push({ i, id: it.id, st, at: dateAt(it.added) });
    if (st === 'new') newIds.push(it.id);
  }
  const findBy = new Map(finds.map((x) => [x.id, x]));
  for (const x of ex) {
    const fd = findBy.get(x.id);
    const v = phiOf(x.e, x.r, items[x.i], { now, state: fd?.st, added: fd?.at });
    if (v) phi[x.id] = r2(v);
  }
  for (const fd of finds) if (!exById.has(fd.id)) { const v = phiOf(null, null, items[fd.i], { now, state: fd.st, added: fd.at }); if (v) phi[fd.id] = r2(v); }

  // Lanes.
  const lanes = {}, laneFactor = {};
  for (const l of new Set(items.map((it) => it.lane))) {
    const v = lam.get('lane:' + l) || 0;
    lanes[l] = r3(v); laneFactor[l] = r2(2 ** (LEARN.laneExp * v));
  }

  // Seeds: the best recent reads, at most 3 per library folder.
  const S = LEARN.seeds, per = new Map(), seeds = [];
  const cands = ex.filter((x) => x.e.y >= S.minV && !x.e.L).map((x) => ({ x, s: x.e.y * 2 ** (-(now - x.e.t) / (S.half * DAY)) }))
    .sort((a, b) => b.s - a.s || (a.x.id < b.x.id ? -1 : 1));
  for (const { x } of cands) {
    if (seeds.length >= S.n) break;
    const it = items[x.i], folder = it.lane + '/' + (Array.isArray(it.path) ? it.path.join('/') : '');
    if ((per.get(folder) || 0) >= S.perFolder) continue;
    per.set(folder, (per.get(folder) || 0) + 1); seeds.push(x.id);
  }

  // Items read.
  const its = {};
  for (const x of ex) {
    const e = x.e;
    its[x.id] = { y: r3(e.y), y0: r3(e.y0), T: r3(e.T), D: r3(e.D), R: r3(e.R), w: r3(e.w), label: e.label, j: e.L ? 'less' : e.S ? 'save' : e.M ? 'more' : null, t: e.t };
  }

  // Calibration: I at open against y now, one open per item over 30 days.
  const firstOpen = new Map();
  for (const o of Array.isArray(opens) ? opens : []) {
    if (!o || !(o.t >= now - 30 * DAY) || !exById.has(o.id)) continue;
    const p = firstOpen.get(o.id); if (!p || o.t < p.t) firstOpen.set(o.id, o);
  }
  const rows = [...firstOpen.values()].map((o) => ({ I: Number(o.I) || 0, y: exById.get(o.id).e.y, lane: items[exById.get(o.id).i].lane }));
  const corr = (rs) => { const v = spearman(rs.map((x) => x.I), rs.map((x) => x.y)); return { rho: v == null ? null : r2(v), n: rs.length }; };
  const byLane = {};
  for (const l of new Set(rows.map((x) => x.lane))) byLane[l] = corr(rows.filter((x) => x.lane === l));
  const calib = { ...corr(rows), byLane };

  const out = {
    v: 1, gen: GEN, at: now, on: true,
    params: { B: LEARN.B, rho: LEARN.rho, kappa: LEARN.kappa, kappa0: LEARN.kappa0, mu0prior: LEARN.mu0prior, H: LEARN.H, Hj: LEARN.Hj, laneExp: LEARN.laneExp },
    mu0: r3(mu0), exposures: ex.length, weight: r3(SW),
    feat, items: its, pred, phi, lanes, laneFactor, seeds, new: newIds, calib,
  };
  const hide = (k, v) => Object.defineProperty(out, k, { value: v, enumerable: false });
  hide('_lam', lam); hide('_lam0', lam0); hide('_ex', exById); hide('_finds', finds); hide('_ctl', ctl); hide('_I', I); hide('_mu0', mu0);
  return out;
}

/** The features with the largest |λ|·√W (history lines, the Dashboard's lists). */
export function topFeatures(profile, n = 80) {
  return Object.entries(profile.feat || {}).filter(([, x]) => x.ctl !== 'ignore')
    .sort((a, b) => Math.abs(b[1].l) * Math.sqrt(b[1].W) - Math.abs(a[1].l) * Math.sqrt(a[1].W)).slice(0, n);
}
