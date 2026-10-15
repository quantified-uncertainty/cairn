// The learning client (docs/learning/spec.md §8): what the server learned from your
// reading, put to work in the reader.
//
// - The score term: For you adds B·I + Φ per item (predicted interest and familiarity,
//   server/learn.mjs), and All's round-robin tilts by the lane factors. Both come from
//   GET /learn/profile.json?part=rank; nothing is computed here. Registered through
//   state.js registerScoreTerm / registerLaneFactor; while none is registered (server
//   without /learn, or learning switched off) the old in-browser affinities rank.
// - Refresh: after a judgment (1.2 s, again at 3 s), when /status says the profile
//   changed (at most every 20 s), and on an item shown more than 60 s after the last
//   fetch. A change big enough to matter re-ranks with buildOrder(true): the item on
//   screen and the next 3 stay put.
// - Why lines in the panel: the features that moved this item, how far it moved in
//   All, where a new find came from (Keep / Dismiss), and how you read it.
// - NEW badges on items agent jobs added that you have not read (header, wall tiles,
//   library rows, Up Next), the NEW chip in the top bar (walks them; Shift: Dashboard),
//   a toast when a batch arrives, and a reload pill when the corpus grew underneath.
//   A badge clears after 20 s of reading, 2 pages seen, or a judgment.
// - Once: the old state.aff affinities and saved list are imported (POST /learn/import).
//
// Budget: item:shown does O(1) work (the header attribute, the badge timer); page turns
// nothing. Fetches, re-ranking and the rank arrays run in idle time.
import { $, h, on, emit, store, sleep, toast, registerWhyLine } from '../util.js';
import { items, byId, LANES } from '../corpus.js';
import { state, current, buildOrder, registerScoreTerm, registerLaneFactor, scoreTerms, laneFactors, baseScore, score } from '../state.js';
import { stayIn, stack, upNext } from '../stack.js';
import { setView, paintSaved } from '../chrome.js';
import { paintHead } from '../feed.js';

const mem = await import('./memory.js').catch(() => null); // memoryOf(id): the reading record, when memory is loaded
const memoryOf = (id) => mem?.memoryOf?.(id) || null;
const idle = (fn, timeout = 2000) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 30));

// ---------------------------------------------------------------- state
const L = {
  on: false, at: 0, B: 0.8, corpusAt: 0, exposures: 0,
  pred: new Map(), phi: new Map(), laneFactor: {}, lanes: {},
  newIds: new Set(), cleared: new Set(), // cleared: read here, before the server's next recompute
  fetchedAt: 0, booted: false,
};
const SEEN = { a: 20e3, sc: 2 };
const toMap = (o) => new Map(Object.entries(o || {}).map(([k, v]) => [k, Number(v) || 0]));
const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { status: r.status });
  return r.json();
}
const post = (url, body) => getJSON(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

// ---------------------------------------------------------------- the score term
const term = (i, it) => L.B * (L.pred.get(it.id) || 0) + (L.phi.get(it.id) || 0);
const laneOf = (l) => L.laneFactor[l] ?? 1;
const learnOn = () => store.get('learnOn', true) !== false;
const registered = () => scoreTerms.includes(term);
function register() {
  if (!L.on || !learnOn() || registered()) return false;
  registerScoreTerm(term); registerLaneFactor(laneOf);
  return true;
}
function unregister() {
  const a = scoreTerms.indexOf(term); if (a >= 0) scoreTerms.splice(a, 1);
  const b = laneFactors.indexOf(laneOf); if (b >= 0) laneFactors.splice(b, 1);
}
/** Re-rank For you (the item on screen and the next 3 stay), in idle time. */
let reorderQ = false;
function reorder() {
  if (!L.booted || reorderQ) return;
  reorderQ = true;
  idle(() => {
    reorderQ = false;
    if (state.sort !== 'ranked' || !state.order.length) return;
    buildOrder(true);
    emit('stack:changed', { stack: stack() }); // the Library follows the new order
  });
}

// ---------------------------------------------------------------- loading
let inflight = null;
/** Fetch the rank part (since the last one); resolves true when it changed. */
function refresh({ force = false } = {}) {
  if (inflight) return inflight;
  const since = L.at && !force ? '&since=' + L.at : '';
  inflight = getJSON('/learn/profile.json?part=rank' + since)
    .then((p) => { L.fetchedAt = Date.now(); return apply(p); })
    .catch(() => { L.fetchedAt = Date.now(); if (!L.at) off(); return false; }) // a 404 or an error: learning off
    .finally(() => { inflight = null; });
  return inflight;
}
function off() {
  const was = registered();
  L.on = false; unregister();
  if (L.newIds.size) { L.newIds.clear(); paintNew(); }
  if (was) reorder();
}
function apply(p) {
  if (!p || p.same) return false;
  if (p.on === false) { off(); emit('learn:updated', { at: 0, on: false }); return false; }
  const prevPred = L.pred, prevPhi = L.phi, prevNew = L.newIds, wasOn = registered();
  Object.assign(L, { on: true, at: p.at || Date.now(), B: p.B ?? 0.8, exposures: p.exposures ?? 0, laneFactor: p.laneFactor || {}, lanes: p.lanes || {} });
  if (!L.corpusAt) L.corpusAt = p.corpusAt || 0;
  L.pred = toMap(p.pred); L.phi = toMap(p.phi);
  const fresh = new Set(p.new || []);
  for (const id of L.cleared) if (!fresh.has(id)) L.cleared.delete(id); // the server caught up
  L.newIds = new Set([...fresh].filter((id) => byId.has(id) && !L.cleared.has(id)));
  const nowOn = register();
  const newChanged = !sameSet(prevNew, L.newIds);
  if (newChanged) paintNew();
  if (registered()) {
    // Re-rank when the change would be seen: the next 50 items, or a big move anywhere.
    let moved = newChanged || (nowOn && !wasOn);
    const d = (id) => Math.abs(L.B * ((L.pred.get(id) || 0) - (prevPred.get(id) || 0)) + (L.phi.get(id) || 0) - (prevPhi.get(id) || 0));
    if (!moved) for (const i of state.order.slice(state.pos + 1, state.pos + 51)) if (d(items[i].id) > 0.08) { moved = true; break; }
    if (!moved) for (const id of new Set([...L.pred.keys(), ...prevPred.keys(), ...L.phi.keys()])) if (d(id) > 0.25) { moved = true; break; }
    if (moved) reorder();
  }
  emit('learn:updated', { at: L.at, on: true });
  return true;
}

// First load: the first item ranks with what was learned, but a slow server never holds up the start.
const first = refresh({ force: true });
await Promise.race([first, sleep(300)]);

on('boot', () => {
  L.booted = true;
  if (registered()) reorder(); // arrived between the race and boot: boot built the order already, so this is cheap
  first.then(() => { if (L.on) setTimeout(() => idle(() => { announce(); migrate(); }), 1500); });
});
on('status', (s) => {
  const ls = s?.learn;
  if (ls && !L.on) { if (ls.on && !inflight && Date.now() - L.fetchedAt > 10e3) refresh({ force: true }).then((ch) => { if (ch) { announce(); migrate(); } }); return; }
  if (!L.on) return;
  if (ls?.at && ls.at > L.at && Date.now() - L.fetchedAt > 20e3 && (state.view === 'feed' || state.view === 'dashboard')) idle(() => refresh());
  const ca = s.corpusAt ?? ls?.corpusAt;
  if (ca && L.corpusAt && ca > L.corpusAt) checkReload(ca);
});
// After a judgment, the server recomputes within about a second.
const JUDGED = new Set(['save', 'unsave', 'less like this', 'more like this']);
let soonT = null;
function soon(ms = 1200) {
  if (!L.on) return;
  clearTimeout(soonT);
  soonT = setTimeout(async () => { const ch = await refresh(); if (!ch) soonT = setTimeout(() => refresh(), 1800); }, ms);
}
on('nav:before', ({ label }) => { if (JUDGED.has(label)) soon(); });
on('nav', (d) => { if (d.type === 'back' && JUDGED.has(d.undone)) soon(); });

// ---------------------------------------------------------------- NEW badges
const PILL = 'font: 600 9px var(--mono); letter-spacing: .08em; padding: 0 4px; border-radius: 2px; background: var(--accent); color: var(--bg); line-height: 14px; display: inline-block; vertical-align: 1px;';
const styleEl = h('style', { id: 'learn-new' });
document.head.append(styleEl);
export const isNew = (id) => L.newIds.has(id);
function paintNew() {
  const idx = [...L.newIds].map((id) => byId.get(id)).filter((i) => i != null);
  styleEl.textContent = idx.length
    ? `:is(.tile, .lr-i):is(${idx.map((i) => `[data-i="${i}"]`).join(', ')}) :is(.meta, .lr-t)::before { content: "NEW"; ${PILL} margin-right: 6px; flex: none; }`
    : '';
  headBadge();
  paintChip();
  upNextBadges();
  emit('learn:new', { n: L.newIds.size });
}
function headBadge(i = current()) {
  const head = $('#item-head'); if (!head) return;
  const id = i != null ? items[i]?.id : null;
  if (id && L.newIds.has(id)) head.dataset.badges = 'new'; else delete head.dataset.badges;
}
/** True once you have really read the item (the server's rule, §2.9): clear its badge now. */
function checkClear(id) {
  if (!L.newIds.has(id)) return false;
  const r = memoryOf(id);
  if (!r || !((r.a || 0) >= SEEN.a || (r.sc || 0) >= SEEN.sc || r.saved || r.more || r.less)) return false;
  L.newIds.delete(id); L.cleared.add(id);
  paintNew();
  return true;
}
let clearT = null;
on('item:shown', ({ i, it }) => {
  headBadge(i);
  clearInterval(clearT); clearT = null;
  if (L.newIds.has(it.id)) clearT = setInterval(() => { if (checkClear(it.id) || items[current()]?.id !== it.id) { clearInterval(clearT); clearT = null; } }, 5000);
  if (L.on && Date.now() - L.fetchedAt > 60e3 && !inflight) { L.fetchedAt = Date.now(); idle(() => refresh()); }
});
on('memory:updated', ({ id }) => { if (L.newIds.size && L.newIds.has(id)) checkClear(id); });

// Up Next tiles (another feature; markup unknown): a pill on children that carry data-i or data-id.
const UPNEXT = '[id*="upnext" i], [class*="upnext" i], [id*="up-next" i], [class*="up-next" i]';
let unEl = null, unObs = null;
function upNextBadges() {
  if (!unEl?.isConnected) {
    unObs?.disconnect(); unObs = null;
    unEl = document.querySelector(UPNEXT);
    if (!unEl) return;
    unObs = new MutationObserver(() => pillUpNext());
    unObs.observe(unEl, { childList: true, subtree: true });
  }
  pillUpNext();
}
function pillUpNext() {
  if (!unEl) return;
  for (const el of unEl.querySelectorAll('[data-i], [data-id]')) {
    const id = el.dataset.id || items[Number(el.dataset.i)]?.id;
    const pill = el.querySelector(':scope > .new-pill');
    if (id && L.newIds.has(id)) { if (!pill) el.append(h('span', { className: 'new-pill', textContent: 'NEW' })); }
    else pill?.remove();
  }
}
on('item:settled', () => { if (L.newIds.size && !unEl?.isConnected) upNextBadges(); });

// ---------------------------------------------------------------- the chip, the walk, the toast
let reloadN = 0;
const chip = h('button', { id: 'new-chip', type: 'button', hidden: true });
$('#views')?.after(chip);
chip.onclick = (e) => {
  if (reloadN) { location.reload(); return; }
  if (e.shiftKey) { setView('dashboard'); return; }
  walkNew();
};
function paintChip() {
  const n = L.newIds.size;
  chip.hidden = !n && !reloadN;
  chip.classList.toggle('reload', !!reloadN);
  chip.replaceChildren(h('b', { textContent: 'NEW' }), reloadN ? ` +${reloadN} · reload` : ` ${n}`);
  chip.title = reloadN ? `${reloadN} new item${reloadN === 1 ? '' : 's'} arrived in the corpus: reload to see them (you stay on this item and page)`
    : `${n} item${n === 1 ? '' : 's'} agent jobs added that you have not read: click to walk them · Shift+click: the Dashboard (Y)`;
}
/** Stay in the new items (the current sort: For you in All, so the strongest finds first). */
export function walkNew() {
  const idx = [...L.newIds].map((id) => byId.get(id)).filter((i) => i != null);
  if (!idx.length) { toast('No new items', { icon: 'inbox', kind: 'edge', sub: 'Agents add them by doing open jobs' }); return false; }
  const ok = stayIn({ kind: 'new', id: 'new', label: 'New', crumb: ['New'], items: idx }, { first: true });
  if (ok && state.view !== 'feed') setView('feed');
  return ok;
}
async function announce() {
  if (!L.newIds.size) return;
  const f = await loadFinds().catch(() => null); if (!f) return;
  const fresh = (f.items || []).filter((x) => L.newIds.has(x.id));
  if (!fresh.length) return;
  const newest = fresh.map((x) => x.added || '').sort().at(-1);
  if (!newest || newest <= store.get('learn:toasted', '')) return;
  store.set('learn:toasted', newest);
  let sub = 'From agent jobs · Y: Dashboard · click NEW to walk them';
  if (new Set(fresh.map((x) => x.job)).size === 1) {
    const s = fresh.flatMap((x) => x.via?.seeds || []).map((id) => byId.get(id)).find((i) => i != null);
    if (s != null) sub = `Like ${clip(items[s].t, 32)} · Y: Dashboard`;
  }
  toast(`${fresh.length} new item${fresh.length === 1 ? '' : 's'}`, { icon: 'sparkles', kind: 'ok', sub, ms: 4500 });
}
let reloadAt = 0;
async function checkReload(ca) {
  if (ca <= reloadAt) return;
  reloadAt = ca;
  const f = await loadFinds(true).catch(() => null); if (!f) return;
  const n = (f.items || []).filter((x) => !byId.has(x.id)).length;
  if (!n || n === reloadN) return;
  reloadN = n; paintChip();
  toast('New items arrived', { icon: 'sparkles', kind: 'ok', sub: 'Reload to see them · click NEW', ms: 4000 });
}

// ---------------------------------------------------------------- data for the panel and the Dashboard
export const learnState = () => ({ on: L.on, at: L.at, exposures: L.exposures, corpusAt: L.corpusAt, newIds: new Set(L.newIds), registered: registered(), learnOn: learnOn(), laneFactor: L.laneFactor });
let fullP = null, fullAt = -1;
/** The full profile (§4.1), cached by its `at`. */
export function loadFull(force = false) {
  if (!fullP || force || fullAt !== L.at) {
    fullAt = L.at;
    fullP = getJSON('/learn/profile.json');
    fullP.catch(() => { fullP = null; });
  }
  return fullP;
}
let findsP = null, findsAt = 0;
/** GET /learn/finds.json, cached 30 s. */
export function loadFinds(force = false) {
  if (!findsP || force || Date.now() - findsAt > 30e3) {
    findsAt = Date.now();
    findsP = getJSON('/learn/finds.json');
    findsP.catch(() => { findsP = null; });
  }
  return findsP;
}
const whyC = new Map(); // id -> {at, p}
/** {id: why} for ids, batched (30 per request) and cached per profile. */
export function whyOf(ids) {
  const need = [];
  for (const id of new Set(ids)) { const c = whyC.get(id); if (!c || c.at !== L.at) need.push(id); }
  for (let k = 0; k < need.length; k += 30) {
    const chunk = need.slice(k, k + 30);
    const p = getJSON('/learn/why?ids=' + chunk.map(encodeURIComponent).join(','))
      .then((j) => j.items || (j.id ? { [j.id]: j } : {}));
    for (const id of chunk) {
      const e = { at: L.at, p: p.then((m) => m[id] || null) };
      e.p.catch(() => { if (whyC.get(id) === e) whyC.delete(id); });
      whyC.set(id, e);
    }
  }
  const ps = [...new Set(ids)].map((id) => whyC.get(id).p.then((v) => [id, v], () => [id, null]));
  return Promise.all(ps).then((kv) => Object.fromEntries(kv.filter(([, v]) => v)));
}

// ---------------------------------------------------------------- Keep and Dismiss (§8.6)
const judge = (id, j) => post('/memory', { ops: [{ o: 'judge', id, t: Date.now(), j }] }).catch(() => null);
function settleLocal(id, fields) {
  const r = memoryOf(id);
  if (r) { for (const [k, v] of Object.entries(fields)) { if (v == null) delete r[k]; else r[k] = v; } emit('memory:updated', { id }); }
  if (L.newIds.delete(id)) L.cleared.add(id);
  findsP = null;
  paintNew();
  setTimeout(() => refresh(), 300);
}
function repaintHead(id) { const i = current(); if (i != null && items[i].id === id && state.view === 'feed') paintHead(items[i]); }
/** Keep = save (Saved list, memory, the profile). Not a move: Back does not undo it. */
export function keep(id) {
  if (!state.saved.includes(id)) { state.saved.unshift(id); store.set('saved', state.saved); paintSaved(); }
  judge(id, 'save'); settleLocal(id, { saved: 1 }); repaintHead(id);
}
export function unkeep(id) {
  const k = state.saved.indexOf(id);
  if (k >= 0) { state.saved.splice(k, 1); store.set('saved', state.saved); paintSaved(); }
  judge(id, 'unsave'); settleLocal(id, { saved: null }); repaintHead(id);
}
/** Dismiss = less like this: the item sinks (Φ −0.8). */
export function dismiss(id) { judge(id, 'less'); settleLocal(id, { less: Date.now() }); }
export function undismiss(id) { judge(id, 'unless'); settleLocal(id, { less: null }); }
/** Mark finds seen (or new again): ids, or 'all'. */
export async function markSeen(ids, st = 'seen') {
  const body = ids === 'all' ? { all: true, st } : { ids: [].concat(ids), st };
  const list = ids === 'all' ? [...L.newIds] : [].concat(ids);
  for (const id of list) { if (st === 'seen') { if (L.newIds.delete(id)) L.cleared.add(id); } else L.cleared.delete(id); }
  paintNew();
  const r = await post('/learn/finds/mark', body).catch(() => null);
  findsP = null;
  setTimeout(() => refresh(), 400);
  return r;
}
export function setLearnOn(on) {
  store.set('learnOn', !!on);
  if (on) register(); else unregister();
  ranks = null;
  if (L.booted && state.sort === 'ranked') { buildOrder(true); emit('stack:changed', { stack: stack() }); }
  emit('learn:updated', { at: L.at, on: L.on });
}
/** POST /learn/control: boost, mute, ignore, or null to reset. */
export async function setControl(f, mode) {
  const r = await post('/learn/control', { f, mode: mode || null });
  fullP = null;
  setTimeout(() => refresh(), 400);
  return r;
}

// ---------------------------------------------------------------- rank movement (§8.3)
let ranks = null; // {b, f, sb, sf, at, t}
function buildRanks() {
  const n = items.length;
  const b = new Float64Array(n), f = new Float64Array(n);
  for (let i = 0; i < n; i++) { b[i] = baseScore(i); f[i] = score(i); }
  ranks = { b, f, sb: Float64Array.from(b).sort(), sf: Float64Array.from(f).sort(), at: L.at, t: Date.now() };
  return ranks;
}
const above = (sorted, v) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] > v) hi = m; else lo = m + 1; } return sorted.length - lo; };
const ranksFresh = () => ranks && (ranks.at === L.at || Date.now() - ranks.t < 10e3);
let ranksQ = null;
/** Resolves when the rank arrays are ready (built in idle time, at most once per 10 s). */
function ranksReady() {
  if (!registered()) return Promise.resolve(null);
  if (ranksFresh()) return Promise.resolve(ranks);
  return (ranksQ ||= new Promise((res) => idle(() => { ranksQ = null; res(registered() ? buildRanks() : null); })));
}
/** Places item i gained in All from what was learned (negative: lost); null when not ready. */
export function placesOf(i) {
  if (!ranks || !registered()) return null;
  return above(ranks.sb, ranks.b[i]) - above(ranks.sf, ranks.f[i]);
}
const unread = (id) => { const r = memoryOf(id); return !r || ((r.a || 0) < 5e3 && !r.saved && !r.less && !r.more); };
/** {up: [{i, places, I}], down: […]}: unread items that moved most in All. Builds the arrays now (call it in idle time). */
export function rankMoves(nUp = 12, nDown = 8) {
  if (!registered()) return null;
  if (!ranksFresh()) buildRanks();
  const all = [];
  for (let i = 0; i < items.length; i++) {
    if (!unread(items[i].id)) continue;
    const p = placesOf(i);
    if (p) all.push({ i, places: p, I: L.pred.get(items[i].id) || 0 });
  }
  all.sort((a, b) => b.places - a.places);
  return { up: all.slice(0, nUp).filter((x) => x.places > 0), down: all.slice(-nDown).reverse().filter((x) => x.places < 0) };
}

// ---------------------------------------------------------------- formatting
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
/** 'YYYY-MM-DD' → 'Oct 16' (with the year when not this year). */
export function fmtDay(d) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(d || ''); if (!m) return d || '';
  return `${MONTHS[m[2] - 1]}${m[3] ? ' ' + Number(m[3]) : ''}${Number(m[1]) !== new Date().getFullYear() ? ', ' + m[1] : ''}`;
}
export const SOURCES = { arxiv: 'arXiv', 'semantic-scholar': 'Semantic Scholar', openalex: 'OpenAlex', lesswrong: 'LessWrong', 'alignment-forum': 'Alignment Forum',
  eaforum: 'EA Forum', 'internet-archive': 'Internet Archive', quri: 'QURI', publisher: 'the publisher', 'author-site': 'the author’s site', wayback: 'the Wayback Machine', manual: 'by hand', other: 'elsewhere' };
/** Seed titles of a find, short: ['s1', 'DeepSeek-R1']. */
export const seedTitles = (via, n = 2) => (via?.seeds || []).map((id) => byId.get(id)).filter((i) => i != null).slice(0, n).map((i) => clip(items[i].t.split(/[:—–(]/)[0].trim() || items[i].t, 28));
export const READ = { deep: 'You read this deeply', skim: 'You skimmed this', glance: 'You glanced at this', skip: 'You skipped this' };
export const fmtD = (d) => (Math.abs(d) < 0.005 ? '0' : (d > 0 ? '+' : '−') + Math.abs(d).toFixed(2));
/** A chip: "+0.25 LLM papers › Reasoning", the evidence in the tooltip. */
export function chipEl(c) {
  return h('span', { className: 'lw-c' + (c.d < 0 ? ' neg' : ''), title: [c.label, c.text].filter(Boolean).join(': ') }, h('b', { textContent: fmtD(c.d) }), c.label);
}

// ---------------------------------------------------------------- the why line (§8.3)
function findLine(it, f) {
  const src = SOURCES[f.via?.source] || f.via?.source || '';
  const seeds = seedTitles(f.via);
  const kids = [];
  if (f.st === 'new') kids.push(h('span', { className: 'new-pill', textContent: 'NEW' }), ' ');
  kids.push(`${f.st === 'new' ? 'added' : 'Added'} ${fmtDay(f.added)}`);
  if (f.job) kids.push(' by job ', h('code', { textContent: f.job }));
  if (src) kids.push(` · via ${src}`);
  if (seeds.length) kids.push(' (like ', ...seeds.flatMap((t, k) => [k ? ', ' : '', h('i', { textContent: t })]), ')');
  const acts = h('span', { className: 'lw-acts' });
  const paint = (state0) => {
    acts.replaceChildren();
    if (state0 === 'kept') acts.append(h('span', { className: 'lw-done', textContent: '★ kept' }));
    else if (state0 === 'dismissed') acts.append(h('span', { className: 'lw-done', textContent: 'dismissed' }));
    else acts.append(
      h('button', { type: 'button', className: 'lw-btn', textContent: 'Keep ★', title: 'Save it (Saved list); it stops being new', onclick: () => undoable(acts, () => keep(it.id), () => unkeep(it.id), paint, 'kept') }),
      h('button', { type: 'button', className: 'lw-btn', textContent: 'Dismiss −', title: 'Less like this: it sinks in For you', onclick: () => undoable(acts, () => dismiss(it.id), () => undismiss(it.id), paint, 'dismissed') }));
  };
  paint(f.st);
  return h('div', { className: 'lw-find' }, h('span', {}, ...kids), acts);
}
/** Run `act`; the buttons become "Undo" for 6 s, which runs `undo`. */
export function undoable(box, act, undo, paint, done) {
  act();
  let t = null;
  const btn = h('button', { type: 'button', className: 'lw-btn undo', textContent: 'Undo', onclick: () => { clearTimeout(t); undo(); paint('new'); } });
  box.replaceChildren(h('span', { className: 'lw-done', textContent: done === 'kept' ? '★ kept' : 'dismissed' }), btn);
  t = setTimeout(() => paint(done), 6000);
}
function fillWhy(box, it, i, v) {
  const kids = [];
  const chips = (v.chips || []).filter((c) => Math.abs(c.d) >= 0.005);
  if (chips.length) kids.push(h('div', { className: 'lw-chips' }, ...chips.map(chipEl)));
  const rank = h('div', { className: 'lw-rank', hidden: true });
  kids.push(rank);
  if (v.find) kids.push(findLine(it, v.find));
  if (v.read) {
    const j = v.read.j;
    kids.push(h('div', { className: 'lw-read' }, READ[v.read.label] || 'You opened this', j === 'save' ? ' · ★' : j === 'more' ? ' · more like this' : j === 'less' ? ' · less like this' : ''));
  }
  box.replaceChildren(...kids);
  box.hidden = !kids.some((k) => k !== rank);
  ranksReady().then((r) => {
    if (!r || !box.isConnected) return;
    const p = placesOf(i);
    if (!p || Math.abs(p) < 1) return;
    rank.textContent = `${p > 0 ? '▲' : '▼'} ${Math.abs(p)} place${Math.abs(p) === 1 ? '' : 's'} in All`;
    rank.title = 'How far what it learned from your reading moved this item, against the ranking with nothing learned';
    rank.classList.toggle('up', p > 0);
    rank.hidden = false; box.hidden = false;
  });
}
registerWhyLine((it, i) => {
  if (!L.on) return null;
  const box = h('div', { className: 'lw', hidden: true });
  const ids = [it.id, ...(i === current() ? upNext(4).map((j) => items[j].id) : [])]; // the next few, warm
  whyOf(ids).then((w) => { const v = w[it.id]; if (v) fillWhy(box, it, i, v); }).catch(() => {});
  return box;
});

// ---------------------------------------------------------------- the one-time import (§6.6)
function migrate() {
  if (!L.on || store.get('affImported', false)) return;
  const aff = store.get('aff', null) || {}, saved = store.get('saved', []) || [];
  const has = Object.keys(aff.lane || {}).length || Object.keys(aff.tok || {}).length || saved.length;
  if (!has) { store.set('affImported', true); return; }
  post('/learn/import', { aff: { lane: aff.lane || {}, tok: aff.tok || {} }, saved })
    .then((j) => { if (j?.ok) { store.set('affImported', true); if (!j.already) soon(600); } })
    .catch(() => {});
}

// For tests and the console.
window.__stacksLearn = { L, refresh, apply, walkNew, isNew, rankMoves, placesOf, whyOf, setLearnOn };
