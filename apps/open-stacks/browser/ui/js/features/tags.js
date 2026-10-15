// Tags: clusters you can stay in. At the top of the side panel, just under the
// Item | Library tabs (so it shows on both), a compact "Stay in" row offers the
// current item's tags as chips: a kind glyph, the label and how many items it
// holds. Click one and you stay on this page, but j/k (↓ ↑, the wheel, Space
// after the last page) now walk only that tag's items, in the current sort
// (stack.js stayIn). The active chip shows where you are ("3/9") and ✕ leaves
// (so does u, or clicking the chip again); Back undoes either. On the next item
// the chips change to its tags, and the stack stays until you leave it or pick
// another chip. ; stays in the item's next tag (: the previous one), with a
// notice each press; past the last tag it leaves.
//
// Where the tags come from:
// - /tags.json (server/routes/46-tags.mjs: data/tags.json): clusters a model
//   made from the corpus, {id, label, kind, desc, items: [ids]}, kind one of
//   topic, method, org, series, benchmark, genre, era, community;
// - derived here, once, in idle time: the first author when two or more items
//   share them ("Zhihong Shao et al." → Zhihong Shao), each library folder level
//   of it.path, the year and "Last 12 months" (from it.d) within the lane, the
//   source (it.src) when it narrows the lane, and the lane itself (in All).
// Order, most useful first: model tags of 3-60 items, smallest first (then 2),
// the author, folders (deepest first), bigger model tags, recent and year,
// source, lane. Tags with the same items show once; tags that would not narrow
// the lane, or hold one item, not at all. One or two rows; +n shows the rest.
// Hover a chip for what it is and the members around this item (click one to
// stay in the tag there).
//
// Speed: nothing here runs on a page turn or as an item opens; the chips are
// made on 'item:settled' (and 'stack:changed' for the active one), measured
// with a canvas instead of reading layout.
import { $, h, on, store, registerKey, toast, fmtDate } from '../util.js';
import { items, byId, LANES, LANE_COLORS, COUNTS } from '../corpus.js';
import { state, current, SORTERS, score, dateKey } from '../state.js';
import { stayIn, leave, goTo, folderStack } from '../stack.js';
import { itemIcon } from '../icons.js';

const KINDS = {
  topic: 'Topic', method: 'Method', org: 'Organisation', series: 'Series', benchmark: 'Benchmark', genre: 'Genre', era: 'Era', community: 'Community',
  author: 'First author', folder: 'Library folder', year: 'Year', recent: 'Recent', source: 'Source', lane: 'Lane',
};
// Ties between model tags of one size: the more specific kinds first.
const KIND_RANK = { org: 0, series: 1, benchmark: 2, method: 3, topic: 4, community: 5, genre: 6, era: 7 };
// Line icons from Lucide (ISC licence, lucide.dev; lucide 0.562), drawn in currentColor.
const ICON = {
  topic: '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="m16 3-2 18"/>',
  method: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',
  org: '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
  series: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
  benchmark: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  genre: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  era: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  community: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
  author: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  year: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  recent: '<path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>',
  source: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
};
const svg = (kind, size) => `<svg viewBox="0 0 24 24"${size ? ` width="${size}" height="${size}"` : ''} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[kind] || ICON.topic}</svg>`;
const glyphs = new Map();
function glyph(c) {
  if (c.kind === 'lane') return h('span', { className: 'tg-dot', style: `background:${LANE_COLORS[c.lane] || 'var(--ink-3)'}` });
  if (!glyphs.has(c.kind)) { const t = document.createElement('template'); t.innerHTML = svg(c.kind, 11); glyphs.set(c.kind, t.content.firstChild); }
  return glyphs.get(c.kind).cloneNode(true);
}

// ---------- the index: derived tags, and the model's tags by item ----------
/** "Zhihong Shao et al." → "Zhihong Shao"; "A, B and C" → "A". */
export function firstAuthor(a) {
  if (typeof a !== 'string') return null;
  const s = a.replace(/\s+et\s+al\.?\s*$/i, '').split(/\s*(?:,|;|&|\band\b)\s*/)[0].trim();
  return s.length >= 2 && !/^(anonymous|unknown|various|n\/?a)$/i.test(s) ? s : null;
}
const push = (m, k, i) => { const a = m.get(k); if (a) a.push(i); else m.set(k, [i]); };
let IX = null;
function index() {
  if (IX) return IX;
  const au = new Map(), yr = new Map(), rec = new Map(), src = new Map(), lane = new Map();
  const d = new Date(Date.now() - 365 * 864e5), cut = d.getFullYear() * 1e4 + (d.getMonth() + 1) * 100 + d.getDate();
  items.forEach((it, i) => {
    push(lane, it.lane, i);
    const a = firstAuthor(it.a);
    if (a) push(au, a.toLowerCase(), i);
    const dk = dateKey(i), y = it.y || (dk === dk ? Math.floor(dk / 1e4) : 0);
    if (y) push(yr, it.lane + '|' + y, i);
    if (it.d && dk >= cut) push(rec, it.lane, i);
    if (it.src) push(src, it.lane + '|' + it.src, i);
  });
  IX = { au, yr, rec, src, lane, folders: new Map(), llm: [], llmOf: new Map(), since: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}` };
  return IX;
}
/** The model's tags (from /tags.json): members by item index, each tag once per item.
 *  An item in none of them joins those its own it.tags name by id (items an agent added
 *  later carry tag ids there; jobs/README.md). */
function setTags(list) {
  const ix = index();
  ix.llm = []; ix.llmOf = new Map();
  const raw = (Array.isArray(list) ? list : []).filter((t) => t && Array.isArray(t.items));
  const mems = raw.map((t) => [...new Set(t.items.map((id) => byId.get(id)).filter((i) => i != null))]);
  const covered = new Set(mems.flat()), byTag = new Map(raw.map((t, k) => [String(t.id ?? t.label), k]));
  items.forEach((it, i) => {
    if (covered.has(i) || !Array.isArray(it.tags)) return;
    for (const id of it.tags) { const k = byTag.get(id); if (k != null && !mems[k].includes(i)) mems[k].push(i); }
  });
  for (const [k, t] of raw.entries()) {
    const mem = mems[k];
    if (mem.length < 2) continue;
    const tag = { id: String(t.id ?? t.label), label: String(t.label || t.id), kind: KIND_RANK[t.kind] != null ? t.kind : 'topic', desc: t.desc || '', items: mem };
    ix.llm.push(tag);
    for (const i of mem) push(ix.llmOf, i, tag);
  }
}
let loaded = false;
async function loadTags() {
  let list = null;
  try {
    const r = await fetch('/tags.json');
    if (r.ok) list = (await r.json()).tags;
  } catch { /* no tags yet: the derived ones still show */ }
  // The index is made when the browser is idle (or within 800 ms), not while the first item opens.
  await new Promise((res) => (window.requestIdleCallback ? requestIdleCallback(res, { timeout: 800 }) : setTimeout(res, 50)));
  setTags(list);
  loaded = true;
}
const folderOf = (lane, path) => {
  const ix = index(), id = [lane, ...path].join('/');
  if (!ix.folders.has(id)) ix.folders.set(id, folderStack(lane, path));
  return ix.folders.get(id);
};
const laneName = (l) => LANES[l] || l;

// ---------- the chips for an item ----------
// chip: { key, kind, label, desc, items: [i], g (group: lower shows first), ai?, lane?, folder? (a stack.js folder descriptor), stackLabel? }
/** A cheap signature of an item set, to show tags with the same items once. */
const sig = (a) => { let s = 0, x = 0; for (const i of a) { s += i; x ^= Math.imul(i + 1, 2654435761); } return `${a.length}:${s}:${x}`; };
/** The current item's tags, most useful first. */
export function chipsFor(i) {
  const it = items[i]; if (!it) return [];
  const ix = index(), out = [], ln = laneName(it.lane), laneN = ix.lane.get(it.lane)?.length || 0;
  for (const t of ix.llmOf.get(i) || []) {
    const n = t.items.length;
    out.push({ key: 'tag:' + t.id, kind: t.kind, label: t.label, desc: t.desc, items: t.items, ai: true, g: n > 60 ? 3 : n >= 3 ? 0 : 0.5 });
  }
  // A derived chip named like one of the model's tags for this item ("Eric Neyman" the series and the author) shows once, as the model's.
  const named = new Set(out.map((c) => c.label.toLowerCase()));
  const a = firstAuthor(it.a), am = a && !named.has(a.toLowerCase()) && ix.au.get(a.toLowerCase());
  if (am && am.length >= 2) out.push({ key: 'author:' + a.toLowerCase(), kind: 'author', label: a, desc: `${am.length} items with ${a} as first author`, items: am, g: 1 });
  const path = Array.isArray(it.path) ? it.path : [];
  for (let d = path.length; d >= 1; d--) {
    const f = folderOf(it.lane, path.slice(0, d));
    if (named.has(String(f.label).toLowerCase())) continue;
    out.push({ key: 'folder:' + f.id, kind: 'folder', label: f.label, desc: `In the library: ${f.crumb.join(' › ')}`, items: f.items, folder: f, g: 2 + (path.length - d) / 100 });
  }
  const rec = ix.rec.get(it.lane);
  if (rec?.includes(i)) out.push({ key: `recent:${it.lane}`, kind: 'recent', label: 'Last 12 months', stackLabel: `${ln} · last 12 months`, desc: `${ln} since ${ix.since}`, items: rec, g: 4 });
  const dk = dateKey(i), y = it.y || (dk === dk ? Math.floor(dk / 1e4) : 0), ym = y && ix.yr.get(it.lane + '|' + y);
  if (ym) out.push({ key: `year:${it.lane}|${y}`, kind: 'year', label: String(y), stackLabel: `${ln} · ${y}`, desc: `${ln} from ${y}`, items: ym, g: 4.1 });
  const sm = it.src && ix.src.get(it.lane + '|' + it.src);
  if (sm && sm.length <= laneN * 0.8) out.push({ key: `source:${it.lane}|${it.src}`, kind: 'source', label: it.src, stackLabel: `${ln} · ${it.src}`, desc: `${ln} from ${it.src}`, items: sm, g: 5 });
  if (state.lane !== it.lane) out.push({ key: 'lane:' + it.lane, kind: 'lane', lane: it.lane, label: ln, desc: `The whole ${ln} lane, in this sort`, items: ix.lane.get(it.lane) || [], g: 6 });
  // Not worth a chip: one item, or the whole lane you are in (a stack must narrow it).
  const base = state.lane === 'all' ? items.length : COUNTS[state.lane] || ix.lane.get(state.lane)?.length || items.length;
  const keep = out.filter((c) => c.items.length >= 2 && !(c.items.length >= base && (state.lane === 'all' || c.items.every((j) => items[j].lane === state.lane))));
  keep.sort((x, y) => x.g - y.g || (x.g < 1 || x.g === 3 ? x.items.length - y.items.length : 0) || (KIND_RANK[x.kind] ?? 9) - (KIND_RANK[y.kind] ?? 9) || x.label.localeCompare(y.label));
  const seen = new Set();
  return keep.filter((c) => { const s = sig(c.items); if (seen.has(s)) return false; seen.add(s); return true; });
}
/** The stack.js descriptor for a chip. */
const descOf = (c) => c.folder || { kind: 'tag', id: c.key, label: c.stackLabel || c.label, crumb: [c.stackLabel || c.label], items: c.items };
const isActive = (c) => { if (!state.scope || !state.stack) return false; const d = descOf(c); return state.stack.kind === d.kind && state.stack.id === d.id; };
/** The stack you are in, as a chip, when it is not one of this item's (you stayed in it elsewhere). */
function activeChip() {
  const st = state.stack; if (!state.scope || !st) return null;
  const tag = st.kind === 'tag' && String(st.id).startsWith('tag:') ? index().llm.find((t) => 'tag:' + t.id === st.id) : null;
  const kind = st.kind === 'folder' ? 'folder' : tag ? tag.kind : (String(st.id).split(':')[0] in KINDS ? String(st.id).split(':')[0] : 'topic');
  return { key: st.kind === 'folder' ? 'folder:' + st.id : st.id, kind, lane: kind === 'lane' ? String(st.id).slice(5) : null, label: tag?.label || st.label, desc: tag?.desc || (st.crumb || []).join(' › '), items: [...state.scope], ai: !!tag, g: -1, pinned: true, folder: st.kind === 'folder' ? { kind: 'folder', id: st.id, label: st.label, crumb: st.crumb, items: [...state.scope] } : null, stackLabel: st.label };
}

// ---------- staying in ----------
function enter(c, opts) {
  if (!stayIn(descOf(c), opts)) return false;
  say(c);
  return true;
}
function say(c) {
  const n = state.order.length;
  toast(`In: ${c.label} · ${c.items.length}`, { icon: svg(c.kind === 'lane' ? 'folder' : c.kind), kind: 'mode', sub: `${KINDS[c.kind] || 'Tag'} · ${state.pos + 1} of ${n} · j/k walk it · ; next tag · u leaves` });
}
function toggle(c) {
  if (isActive(c)) { leave(); return; }
  enter(c);
}
/** ; (dir 1) and : (dir -1): the item's next or previous tag, in the order the chips show
 *  (kept while you stay on the item, so the presses go round once); past either end, the whole lane again. */
let cyc = null; // { i, keys }
function cycle(dir) {
  const i = current(); if (i == null) return;
  const own = chipsFor(i), byKey = new Map(own.map((c) => [c.key, c]));
  if (!cyc || cyc.i !== i) cyc = { i, keys: (shownFor === i ? chips : own).map((c) => c.key).filter((k) => byKey.has(k)) };
  const list = cyc.keys.map((k) => byKey.get(k)).filter(Boolean);
  if (!list.length) { toast('No tags here', { icon: 'info', kind: 'edge', sub: 'Nothing else shares this item’s author, folder, year or a tag' }); return; }
  const k = list.findIndex(isActive);
  const next = k < 0 ? (dir > 0 ? 0 : list.length - 1) : k + dir;
  if (next < 0 || next >= list.length) { if (!leave()) toast('Not in a tag', { icon: 'info', kind: 'edge' }); paintSoon(); return; }
  enter(list[next]);
  paintSoon();
}

// ---------- the block ----------
const box = h('div', { className: 'tg', hidden: true, role: 'group', ariaLabel: 'Stay in: tags of this item' });
const row = h('div', { className: 'tg-chips' });
box.append(row);
/** Under the Item | Library tabs (features/library.js moves them between the panel and the Library), else first in the panel. */
function place() {
  const tabs = document.querySelector('#main .lib-tabs');
  if (tabs?.parentElement) { if (tabs.nextElementSibling !== box) tabs.after(box); }
  else { const p = $('#panel'); if (p && p.firstElementChild !== box) p.prepend(box); }
}
on('panel:painted', place);
// The tabs move when the Library is switched on or off: follow them.
const mo = new MutationObserver(() => { const t = document.querySelector('#main .lib-tabs'); if (t ? t.nextElementSibling !== box : !box.isConnected) place(); });
for (const el of [$('#panel'), $('#lib')]) if (el) mo.observe(el, { childList: true });

let open = store.get('tagsOpen', false); // +n pressed: every chip shows
let shownFor = null, chips = [], fit = 0; // the item the chips are for; the chips; fit: how many show when closed (-1 all)

// Widths from a canvas, so deciding what fits never reads layout.
let cx = null, fonts = null;
const wcache = new Map();
function textW(s, mono) {
  if (!fonts) {
    const cs = getComputedStyle(document.documentElement);
    fonts = [`11px ${cs.getPropertyValue('--sans').trim() || 'sans-serif'}`, `10px ${cs.getPropertyValue('--mono').trim() || 'monospace'}`, `600 9.5px ${cs.getPropertyValue('--mono').trim() || 'monospace'}`];
  }
  const f = fonts[mono], k = mono + s;
  if (!wcache.has(k)) { cx ||= document.createElement('canvas').getContext('2d'); cx.font = f; wcache.set(k, cx.measureText(s).width); }
  return wcache.get(k);
}
// Sizes in px, as tags.css draws them.
const GAP = 4, PADX = 7, ICONW = 11, INNER = 4, LMAX = 150, XW = 14, MOREW = 30, BORDER = 2;
// The rows are packed as if no chip were active, so staying in or leaving moves no chip; when the active
// chip ("3/9" and ✕) no longer fits its row, the last other chip of that row waits behind +n instead.
const chipW = (c) => BORDER + 2 * PADX + ICONW + INNER + Math.min(LMAX, textW(c.label, 0)) + INNER + textW(String(c.items.length), 1);
let boxW = 0, tight = 0; // tight: px taken off the width after the idle check found a row too full
let lay = null; // the packing, kept while the item, its chips and the width stay: { k, rows: [[keys], [keys]], hidden: [keys] }
const width = () => boxW || (box.parentElement?.id === 'lib' ? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-w')) || 330) - 20 : (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--panel-w')) || 330) - 36);
/** Two rows, filled first-fit in order of use (a short chip may fill the gap at the end of
 *  row one), with the "Stay in" label first and +n last; the rest wait behind +n. */
function packed(list) {
  const W = width() - 1 - tight, head = textW('STAY IN', 2) + 0.08 * 9.5 * 7 + 2;
  const ws = list.map(chipW);
  const fill = (more) => {
    const rows = [[], []], used = [head + GAP, 0], room = [W, W - (more ? MOREW + GAP : 0)], hidden = [];
    ws.forEach((w, k) => { const r = used[0] + w <= room[0] ? 0 : used[1] + w <= room[1] ? 1 : -1; if (r < 0) hidden.push(list[k]); else { rows[r].push(list[k]); used[r] += w + GAP; } });
    return { rows, hidden };
  };
  const p = fill(false);
  return p.hidden.length ? fill(true) : p;
}

let paintMs = 0, paints = 0; // the last paint's cost, and how many (for tests)
function paint() {
  const t0 = performance.now(); paints++;
  try { paintNow(); } finally { paintMs = performance.now() - t0; }
}
function paintNow() {
  const i = current();
  if (i == null || state.view !== 'feed') return;
  index();
  let list = chipsFor(i);
  if (state.scope && !list.some(isActive)) { const a = activeChip(); if (a) list = [a, ...list]; }
  shownFor = i;
  box.classList.remove('stale');
  // No tags: gone from the Item panel; in the Library the block keeps its room, so the list does not jump.
  box.hidden = false;
  box.classList.toggle('none', !list.length);
  const label = h('span', { className: 'tg-h', textContent: 'Stay in', title: 'Click a tag to stay in it: you stay on this page, and j/k then walk only its items (; next tag, u leaves)' });
  if (!list.length) { chips = []; row.replaceChildren(); return; }
  box.classList.toggle('open', open);
  if (open) {
    chips = list; fit = -1;
    // − (back to two rows) sits by the label, so it costs no row of its own.
    row.replaceChildren(h('div', { className: 'tg-r wrap' }, label, h('button', { type: 'button', className: 'tg-more tg-less', textContent: '−', title: 'Fewer: one or two rows' }), ...list.map(chipEl)));
    return;
  }
  const k = `${i}|${list.map((c) => c.key).join('|')}|${width()}|${tight}`;
  if (lay?.k !== k) { const q = packed(list); lay = { k, rows: q.rows.map((r) => r.map((c) => c.key)), hidden: q.hidden.map((c) => c.key) }; }
  const byKey = new Map(list.map((c) => [c.key, c])), get = (keys) => keys.map((x) => byKey.get(x));
  let p = { rows: lay.rows.map(get), hidden: get(lay.hidden) };
  // The stack you are in always shows: when it would wait behind +n, it goes first.
  if (p.hidden.some(isActive)) { const a = list.find(isActive); p = packed([a, ...list.filter((c) => c !== a)]); }
  roomForActive(p);
  chips = [...p.rows[0], ...p.rows[1], ...p.hidden]; // ; cycles in this order: as they show, then the rest
  fit = p.hidden.length ? p.rows[0].length + p.rows[1].length : -1;
  const more = p.hidden.length ? h('button', { type: 'button', className: 'tg-more', textContent: `+${p.hidden.length}`, title: `${p.hidden.map((c) => `${c.label} (${c.items.length})`).join('\n')}\n\nClick to show them all` }) : null;
  row.replaceChildren(
    h('div', { className: 'tg-r' }, label, ...p.rows[0].map(chipEl), p.rows[1].length ? null : more),
    p.rows[1].length ? h('div', { className: 'tg-r' }, ...p.rows[1].map(chipEl), more) : null);
  check();
}
/** The active chip is wider ("3/9" and ✕): if its row no longer fits, the row's last other chip waits behind +n. */
function roomForActive(p) {
  const r = p.rows.findIndex((row) => row.some(isActive)); if (r < 0) return;
  const W = width() - 1 - tight, head = r === 0 ? textW('STAY IN', 2) + 0.08 * 9.5 * 7 + 2 + GAP : 0;
  const a = p.rows[r].find(isActive), extra = textW(`${state.pos + 1}/${state.order.length}`, 1) - textW(String(a.items.length), 1) + XW;
  const need = () => head + p.rows[r].reduce((s, c) => s + chipW(c) + GAP, 0) + extra + (r === 1 && p.hidden.length ? MOREW + GAP : 0);
  while (need() > W) {
    const k = p.rows[r].findLastIndex((c) => !isActive(c)); if (k < 0) break;
    p.hidden.unshift(...p.rows[r].splice(k, 1));
    if (r === 0 && p.rows[1].length) { // +n lives on the second row: make room for it there too
      while (p.rows[1].length && p.rows[1].reduce((s, c) => s + chipW(c) + GAP, 0) + MOREW + GAP > W) p.hidden.unshift(p.rows[1].pop());
    }
  }
}
function chipEl(c) {
  const act = isActive(c);
  const el = h('span', { className: `tg-c k-${c.kind}${act ? ' on' : ''}` },
    h('button', { type: 'button', className: 'tg-b', ariaPressed: String(act) }, glyph(c), h('span', { className: 'tg-l', textContent: c.label }),
      h('span', { className: 'tg-n', textContent: act ? `${state.pos + 1}/${state.order.length}` : String(c.items.length) })),
    act ? h('button', { type: 'button', className: 'tg-x', textContent: '✕', title: 'Leave: the whole lane again, same item (u) · Back undoes', ariaLabel: `Leave ${c.label}` }) : null);
  el.dataset.key = c.key;
  return el;
}
// The canvas widths are close, not exact: once the browser is idle (layout is then
// clean, so reading it costs nothing), make sure no row ran out of room.
let checkT = 0;
function check() {
  if (checkT || tight > 40) return;
  checkT = (window.requestIdleCallback || setTimeout)(() => {
    checkT = 0;
    if (box.hidden || open || !chips.length) return;
    if ([...row.children].some((r) => r.scrollWidth > r.clientWidth + 1)) { tight += 10; lay = null; paint(); }
  });
}
let raf = 0;
const paintSoon = () => { raf ||= requestAnimationFrame(() => { raf = 0; paint(); }); };

// Clicks: a chip stays in its tag (again: leaves), ✕ leaves, +n shows the rest.
box.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); }); // no focus: Space stays Advance
box.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  hideCard(true); quiet = b.closest('.tg-c')?.dataset.key || null;
  if (b.classList.contains('tg-more')) { open = !b.classList.contains('tg-less'); store.set('tagsOpen', open); paint(); return; }
  const c = chips.find((x) => x.key === b.closest('.tg-c')?.dataset.key); if (!c) return;
  if (b.classList.contains('tg-x')) leave(); else toggle(c);
  b.blur();
  paintSoon();
});

// ---------- hover: what the tag is, and the members around this item ----------
const card = h('div', { id: 'tg-card', hidden: true, role: 'tooltip' });
document.body.append(card);
let cardFor = null, showT = 0, hideT = 0;
/** The tag's members in the order j/k would walk them (the current sort), and where this item is. */
function walkOrder(c, i) {
  const arr = c.items.slice();
  if (state.sort === 'ranked' || !SORTERS[state.sort]) { const sc = new Map(arr.map((j) => [j, score(j)])); arr.sort((a, b) => sc.get(b) - sc.get(a)); const k = arr.indexOf(i); if (k > 0) { arr.splice(k, 1); arr.unshift(i); } }
  else { if (!arr.includes(i)) arr.push(i); arr.sort(SORTERS[state.sort]); }
  return arr;
}
function fillCard(c) {
  const i = current(), act = isActive(c);
  const arr = act ? state.order : walkOrder(c, i);
  const k = Math.max(0, act ? state.pos : arr.indexOf(i)), N = 6;
  const a = Math.max(0, Math.min(k - 1, arr.length - N));
  const win = arr.slice(a, a + N);
  card.replaceChildren(
    h('div', { className: 'tc-h' }, glyph(c), h('span', { className: 'tc-l', textContent: c.label }), h('span', { className: 'tc-n', textContent: `${c.items.length} items` })),
    h('div', { className: 'tc-k', textContent: `${KINDS[c.kind] || 'Tag'}${c.ai ? ' · suggested by AI' : ''}` }),
    c.desc ? h('div', { className: 'tc-d', textContent: c.desc }) : null,
    h('ol', {}, ...win.map((j, r) => {
      const it = items[j], li = h('li', { className: j === i ? 'here' : a + r < k ? 'before' : '', title: j === i ? 'This item' : `Stay in “${c.label}” at this item` }, itemIcon(it, 11), h('span', { className: 't', textContent: it.t }), h('span', { className: 'y', textContent: j === i ? 'here' : fmtDate(it) || it.y || '' }));
      li.dataset.i = j; return li;
    })),
    h('div', { className: 'tc-f', textContent: act ? `${state.pos + 1} of ${state.order.length} · click again or ✕ to leave (u)` : `${arr.length > N ? `…and ${arr.length - win.length} more · ` : ''}click: stay in, and j/k walk ${arr.length > N ? 'them' : 'these'} · ; cycles tags` }));
}
function showCard(chip) {
  const c = chips.find((x) => x.key === chip.dataset.key); if (!c) return;
  cardFor = chip; fillCard(c);
  card.hidden = false;
  const r = chip.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
  card.style.left = Math.max(8, Math.min(r.left, innerWidth - cw - 8)) + 'px';
  card.style.top = (r.bottom + ch + 8 < innerHeight ? r.bottom + 4 : Math.max(8, r.top - ch - 4)) + 'px';
}
function hideCard(now) { clearTimeout(showT); clearTimeout(hideT); if (now) { card.hidden = true; cardFor = null; } else hideT = setTimeout(() => { card.hidden = true; cardFor = null; }, 220); }
let quiet = null; // the chip just clicked: no card for it until the pointer goes elsewhere
box.addEventListener('pointerleave', () => { quiet = null; });
box.addEventListener('pointerover', (e) => {
  const chip = e.target.closest('.tg-c'); if (!chip) return;
  if (quiet && chip.dataset.key === quiet) return;
  quiet = null;
  clearTimeout(hideT);
  if (chip === cardFor && !card.hidden) return;
  clearTimeout(showT);
  showT = setTimeout(() => showCard(chip), card.hidden ? 380 : 60);
});
box.addEventListener('pointerout', (e) => { const chip = e.target.closest('.tg-c'); if (chip && chip.contains(e.relatedTarget)) return; hideCard(); });
card.addEventListener('pointerover', () => clearTimeout(hideT));
card.addEventListener('pointerleave', () => hideCard());
card.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-i]'); if (!li || !cardFor) return;
  const c = chips.find((x) => x.key === cardFor.dataset.key), j = Number(li.dataset.i);
  hideCard(true);
  if (!c) return;
  if (isActive(c)) { if (j !== current()) goTo(j, 'open from tag'); return; }
  enter(c, j === current() ? undefined : { at: j });
  paintSoon();
});

// ---------- when to paint ----------
// While you skip, the chips are the last item's: dim them until it settles.
const dim = ({ i }) => { if (shownFor != null && i !== shownFor) box.classList.add('stale'); if (!card.hidden) hideCard(true); };
on('item:shown', dim);
on('item:skim', dim); // holding j/k (riffle.js): the items passed are not visits, and the chips wait for the one you land on
on('item:settled', () => { if (loaded) paint(); else tagsP?.then(paintSoon); });
on('stack:changed', () => { if (shownFor != null && shownFor === current()) paintSoon(); });
on('nav', (d) => { if (d.type === 'back') paintSoon(); });
on('settings:changed', () => { fonts = null; wcache.clear(); paintSoon(); });
on('view:changed', ({ view }) => { if (view === 'feed') paintSoon(); else hideCard(true); });
new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w && w !== boxW) { boxW = w; if (!open && chips.length) paintSoon(); } }).observe(box);
let tagsP = null;
on('boot', () => {
  place();
  // The model's tags arrive before the first item settles (a small local file); the index waits for idle time.
  tagsP = loadTags().then(paintSoon);
});

// ---------- keys ----------
registerKey(';', () => cycle(1), { help: ['; :', 'stay in this item’s next / previous tag (the chips at the top of the side panel): j/k then walk only its items · past the last, the whole lane · u leaves'], order: 52.6 });
registerKey(':', () => cycle(-1));

// For tests and other features: the chips as drawn, and the tags of any item.
window.__tags = {
  chips: () => chips.map((c) => ({ key: c.key, kind: c.kind, label: c.label, n: c.items.length, on: isActive(c), shown: fit < 0 || chips.indexOf(c) < fit })),
  of: (i) => chipsFor(i).map((c) => ({ key: c.key, label: c.label, n: c.items.length })),
  loaded: () => loaded, fit: () => fit, ms: () => paintMs, paints: () => paints,
};
