// Library: the stack you are walking, in the side panel, always in the order
// j/k go (stack.js).
//
// The side panel gets two tabs at its top, Item (the usual sections) and
// Library (this list); L switches between them (and, while the list is shown
// but not focused, puts the keyboard in it). At the top: the stack (the lane, or
// the folder or tag you stay in, with ✕ to leave it) and where you are in it
// ("7 / 70"), and the sort: By topic · For you · Newest · Oldest (S cycles).
//
// - By topic: the whole corpus as a tree, lanes, then folders (a wiki's own
//   sidebar sections, topics, years, eras), then items, in exactly the order the
//   feed walks (state.js topicRank). A tag stack shows the tree pruned to it.
// - For you, Newest, Oldest (and any order made by hand: search results, more
//   like this): a flat list of state.order itself; items before the current one
//   are dimmed, and the current one sits about a quarter from the top so what
//   comes next shows.
// So j moves the highlight to the next item row below, k to the one above; a
// closed folder on the way opens (the folders you walk through stay open).
//
// In the list: type to filter titles, ↑ ↓ move, → opens a folder (or steps
// into it), ← closes it (or steps out), Enter opens an item, or on a folder
// stays in it (stack.js stayIn: at the current item when it is in the folder,
// else at the folder's first item); Esc goes back to the page. Opening a wiki
// page from another lane stays in its site, so Space goes on through the site.
//
// Data: build-corpus.mjs gives every item `path` (folder names under its lane)
// and `ord` (tree order); items without them sit directly under their lane.
// Scale: only the rows in view exist (a virtual list), lanes and folders start
// closed with the current item's branch open, and nothing here runs on a page
// turn; on an item switch the list follows on 'item:shown' (once a frame), and
// only while it is showing.
import { $, h, on, store, registerKey, keyHelp, fmtDate } from '../util.js';
import { items, byId, LANES, COUNTS, LANE_COLORS, LANE_ORDERED } from '../corpus.js';
import { state, current, topicRank, SORTERS, buildOrder } from '../state.js';
import { jumpTo, goPage, before } from '../nav.js';
import { openDoc, pdfOutline, isFlow } from '../docs.js';
import { flowRange } from '../flow.js';
import { profileOf } from '../profile.js';
import { registerTrackLayer, repaintTrack } from '../feed.js';
import { setView, setLane, togglePanel, paintLanes } from '../chrome.js';
import { SORTS, setSort, stayIn, leave, goTo } from '../stack.js';

const RH = 24; // row height, px (matches library.css)
const SEP = '\u0001';

// ---------- the tree ----------
// node: { key, fid, label, lane, path, depth, parent, kids: [{node} | {i}] in tree order, n, o, items: [i] (all below) }
let T = null; // { lanes: [lane nodes, in chip order], byKey: Map key → node, byFid: Map stack id → folder node }
const parentOf = new Map(); // item index → its folder node
function build() {
  if (T) return T;
  const R = topicRank(); // the feed's topic order: the tree below is drawn in it
  const byKey = new Map(), byFid = new Map();
  const node = (key, label, lane, parent) => {
    const path = parent ? [...parent.path, label] : [];
    const n = { key, label, lane, parent, path, fid: [lane, ...path].join('/'), depth: parent ? parent.depth + 1 : 0, kids: [], sub: new Map(), n: 0, o: Infinity, items: [] };
    byKey.set(key, n); if (parent) byFid.set(n.fid, n);
    if (parent) { parent.sub.set(label, n); parent.kids.push({ node: n }); }
    return n;
  };
  const lanes = Object.keys(LANES).filter((l) => COUNTS[l]).map((l) => node(l, LANES[l], l, null));
  const laneOf = new Map(lanes.map((n) => [n.lane, n]));
  items.forEach((it, i) => {
    let p = laneOf.get(it.lane);
    if (!p) { p = node(it.lane, LANES[it.lane] || it.lane, it.lane, null); lanes.push(p); laneOf.set(it.lane, p); }
    for (const name of Array.isArray(it.path) ? it.path : []) p = p.sub.get(name) || node(p.key + SEP + name, name, it.lane, p);
    p.kids.push({ i });
    parentOf.set(i, p);
    for (let a = p; a; a = a.parent) { a.n++; a.items.push(i); if (R[i] < a.o) a.o = R[i]; }
  });
  const ordOf = (k) => (k.node ? k.node.o : R[k.i]);
  for (const n of byKey.values()) n.kids.sort((a, b) => ordOf(a) - ordOf(b));
  T = { lanes, byKey, byFid };
  return T;
}
const ancestors = (i) => { const out = []; for (let a = parentOf.get(i); a; a = a.parent) out.push(a); return out; };
const crumbOf = (n) => { const out = []; for (let a = n; a; a = a.parent) out.unshift(a.label); return out; };
/** A folder as a stack.js stayIn() descriptor. */
const folderDesc = (n) => ({ kind: 'folder', id: n.fid, label: n.label, crumb: crumbOf(n), items: n.items, lane: n.lane });
/** The folder node of the stack you stay in, if it is a library folder. */
const stackNode = () => (state.scope && state.stack?.kind === 'folder' ? build().byFid.get(state.stack.id) || null : null);

// ---------- which list: the tree, or the order itself ----------
let flat = false; // true: a flat list of state.order
let custom = false; // the order was made by hand (search results…), not by the sort: shown flat, as it is
const member = (i) => (state.scope ? state.scope.has(i) : state.lane === 'all' || items[i].lane === state.lane);
/** The order is in its sort: its members (each once; detours inserted between them aside) follow the sort. */
function inSort() {
  const cmp = SORTERS[state.sort]; if (!cmp) return true; // the ranking keeps what you have seen first: any order is its own
  const o = state.order, seen = new Map();
  for (const i of o) seen.set(i, (seen.get(i) || 0) + 1);
  let last = null;
  for (const i of o) {
    if (seen.get(i) > 1 || !member(i)) continue;
    if (last != null && cmp(last, i) > 0) return false;
    last = i;
  }
  return true;
}
function pickMode() {
  custom = !inSort();
  flat = state.sort !== 'topic' || custom;
}

// ---------- open folders, filter, rows ----------
const userOpen = new Set(), userClosed = new Set();
let autoOpen = new Set(); // the current item's branch
let words = [], hay = null, match = null; // filter words; lowercase titles; Uint8Array of the items shown (filter, tag stack)
let prune = null; // topic order in a tag stack: the tree shows only the stack's items
const fClosed = new Set(); // folders closed by hand while filtering or pruned
let multiLane = false; // the flat list spans several lanes
let rows = []; // tree: { node, d } | { i, d }; flat: { i, r } (r: the place in state.order)
let sel = null; // the cursor: 'n' + key or 'i' + index
const q = () => words.length > 0;
const rowId = (r) => (r.node ? 'n' + r.node.key : r.here ? 'h' + (r.here === 'pos' ? 'p' : r.j) : 'i' + r.i);
const isOpen = (n) => (match ? !fClosed.has(n.key) : userOpen.has(n.key) || (autoOpen.has(n.key) && !userClosed.has(n.key)));
const hit = (i) => words.every((w) => hay[i].includes(w));

function setFilter(text) {
  words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) hay ||= items.map((it) => `${it.t} ${it.a || ''}`.toLowerCase());
  fClosed.clear();
  remask();
}
/** Which tree items show: the filter's matches, within a tag stack's items. */
function remask() {
  elVer++;
  const tag = !flat && state.scope && !stackNode();
  const p = tag ? new Set(state.order) : null;
  if (!!p !== !!prune || (p && [...p].some((i) => !prune.has(i)))) fClosed.clear();
  prune = p;
  if (flat || (!q() && !prune)) { match = null; flatten(); return; }
  build();
  match = new Uint8Array(items.length);
  // A folder whose name matches brings all its items along.
  const mark = (n, all) => {
    const named = all || (q() && words.every((w) => n.label.toLowerCase().includes(w)));
    n.m = 0;
    for (const k of n.kids) {
      if (k.node) n.m += mark(k.node, named);
      else if ((!prune || prune.has(k.i)) && (named || hit(k.i))) { match[k.i] = 1; n.m++; }
    }
    return n.m;
  };
  for (const ln of T.lanes) mark(ln, false);
  flatten();
}
// The list is rebuilt when folders open or close, the current item changes (its position and
// section rows move with it) or a filter changes. One row keeps its place on screen across a
// rebuild: the row you just clicked or moved to, else the keyboard's row, else the current item.
let anchor = null; // { id, t }: a row you pointed at, held still for a few seconds
const anchored = () => anchor && performance.now() - anchor.t < 3000;
function heldRow() {
  if (anchored()) return anchor.id;
  if (browsing() && sel) return sel;
  const c = current(); return c != null ? 'i' + c : null;
}
function flatten() {
  const id = heldRow();
  const r0 = id ? rows.findIndex((x) => rowId(x) === id) : -1, y = r0 >= 0 ? r0 * RH - list.scrollTop : null;
  rowsNow();
  if (y == null) return;
  const r1 = rows.findIndex((x) => rowId(x) === id);
  if (r1 >= 0 && r1 !== r0) { sizePad(); list.scrollTop = Math.max(0, r1 * RH - y); }
}
function rowsNow() {
  if (!T) return;
  if (flat) {
    const o = state.order, out = [], lanes = new Set();
    for (let r = 0; r < o.length; r++) { lanes.add(items[o[r]].lane); if (!q() || hit(o[r])) out.push({ i: o[r], r }); }
    // A lane dot tells lanes apart when the stack spans several.
    multiLane = lanes.size > 1;
    rows = withHere(out); return;
  }
  const out = [];
  const walk = (n) => {
    for (const k of n.kids) {
      if (k.node) { if (match && !k.node.m) continue; out.push({ node: k.node, d: k.node.depth }); if (isOpen(k.node)) walk(k.node); }
      else if (!match || match[k.i]) out.push({ i: k.i, d: n.depth + 1 });
    }
  };
  for (const ln of T.lanes) { if (match && !ln.m) continue; out.push({ node: ln, d: 0 }); if (isOpen(ln)) walk(ln); }
  rows = withHere(out);
}
const selIndex = () => { if (sel == null) return -1; for (let r = 0; r < rows.length; r++) if (rowId(rows[r]) === sel) return r; return -1; };
/** The current item's row: in the flat list its place in the order, in the tree its item. */
const curIndex = () => {
  const c = current(); if (c == null) return -1;
  if (flat) { for (let r = 0; r < rows.length; r++) if (rows[r].r === state.pos) return r; return -1; }
  for (let r = 0; r < rows.length; r++) if (rows[r].i === c) return r;
  return -1;
};

// ---------- acting from the list (stack.js does the moving) ----------
/** Enter on a lane: that lane; on a folder: stay in it, at the current item when it is in it, else at its first. */
function browse(n, at) {
  if (!n.parent) {
    if (state.lane === n.lane) { if (state.scope) leave(); }
    else setLane(n.lane);
    if (at != null) goTo(at, 'open from library');
    done(); return;
  }
  const cur = current();
  if (stackNode() === n) { if (at != null) goTo(at, 'open from library'); done(); return; }
  if (state.view !== 'feed') setView('feed');
  const here = at ?? (cur != null && n.items.includes(cur) ? cur : null);
  stayIn(folderDesc(n), here != null ? { at: here } : { first: true });
  done();
}
/** Open an item: in its place when it is in the stack; a wiki page from elsewhere stays in its site; otherwise it comes next. */
function openItem(i, r) {
  const it = items[i];
  if (r != null && state.order[r] === i) { if (r !== state.pos || state.view !== 'feed') goTo(i, 'open from library'); }
  else if (state.order.includes(i)) goTo(i, 'open from library');
  else {
    // Outside what you are walking (another folder, tag or lane): stop staying in it and
    // walk this item's own lane from its place, so the next item is the next row here.
    if (state.scope) leave();
    if (state.lane !== 'all' && it.lane !== state.lane) {
      before('lane switch', { lane: state.lane, order: state.order.slice() });
      state.lane = it.lane; store.set('lane', it.lane);
      buildOrder(false, i); paintLanes();
    }
    if (state.order.includes(i)) goTo(i, 'open from library'); else jumpTo(i);
  }
  done();
}
/** After acting from the list, keys go back to the page; the filter stays for arrowing on, but typing starts a new one. */
let stale = false;
let keepKeys = false; // a preview from the arrow keys keeps them in the list
function done() { stale = q(); if (keepKeys) return; if (list?.contains(document.activeElement) || document.activeElement === input) document.activeElement.blur(); }

// ---------- the pane ----------
const main = $('#main');
const tabs = h('div', { className: 'lib-tabs', role: 'tablist', ariaLabel: 'Side panel' },
  h('button', { type: 'button', role: 'tab', className: 'lt-item', textContent: 'Item', title: 'About this item (L switches)', onclick: () => setMode(false) }),
  h('button', { type: 'button', role: 'tab', className: 'lt-lib', textContent: 'Library', title: 'The stack you are walking, in its order: every lane as a tree of folders, or a list (L)', onclick: () => setMode(true, true) }),
  h('kbd', { className: 'lt-key', textContent: 'L', title: 'L switches between Item and Library' }));
const input = h('input', { type: 'search', className: 'lib-q', placeholder: 'Filter titles…', autocomplete: 'off', spellcheck: false, ariaLabel: 'Filter the library by title' });
const qn = h('span', { className: 'lib-qn' });
const SORT_SAY = { topic: 'the lanes’ folders, in order, as the tree shows', ranked: 'the ranking: quality, relevance and what you liked', newest: 'by date, the latest first', oldest: 'by date, the earliest first' };
const sortBar = h('div', { className: 'lib-sort', role: 'radiogroup', ariaLabel: 'Sort' },
  ...Object.entries(SORTS).map(([k, label]) => {
    const b = h('button', { type: 'button', role: 'radio', textContent: label, title: `${label}: ${SORT_SAY[k]} (S cycles)`, onclick: () => { b.blur(); setSort(k); paintTop(); } });
    b.dataset.sort = k; return b;
  }),
  h('span', { className: 'ls-n', title: 'Where you are in this stack' }),
  h('span', { className: 'ls-c', hidden: true, textContent: 'own order', title: 'Search results or “more like this” made this order; the list shows it as it is. Pick a sort to put it back in order.' }));
const pad = h('div', { className: 'lib-pad' });
const slice = h('div', { className: 'lib-slice' });
const list = h('div', { className: 'lib-list', tabIndex: 0, role: 'tree', ariaLabel: 'Library' }, pad, slice);
const pane = h('aside', { id: 'lib', ariaLabel: 'Library' }, h('div', { className: 'lib-top' }, sortBar, h('div', { className: 'lib-qbox' }, input, qn)), list);
$('#panel').after(pane);
let on_ = store.get('libOn', false);
const showing = () => on_ && state.view === 'feed' && state.panel;
/** The keyboard is in the list or the filter box (browsing it), so the list does not move under you. */
const browsing = () => list.contains(document.activeElement) || document.activeElement === input;

on('panel:painted', () => { if (!on_) $('#panel').prepend(tabs); });
function placeTabs() { if (on_) pane.prepend(tabs); else $('#panel').prepend(tabs); tabs.querySelector('.lt-item').classList.toggle('on', !on_); tabs.querySelector('.lt-lib').classList.toggle('on', on_); }

/** Show the Library (true) or the Item sections (false); focus: put the keyboard in the list. */
function setMode(lib, focus = false) {
  if (lib && state.view !== 'feed') setView('feed');
  if (lib && !state.panel) togglePanel();
  on_ = lib; store.set('libOn', lib);
  main.classList.toggle('lib-on', lib);
  placeTabs();
  if (lib) {
    build();
    follow(current(), true);
    if (focus) list.focus({ preventScroll: true });
  } else if (pane.contains(document.activeElement)) document.activeElement.blur();
}
registerKey('L', () => {
  if (!showing()) setMode(true, true);
  else if (!pane.contains(document.activeElement)) { list.focus({ preventScroll: true }); follow(current(), true); }
  else setMode(false);
}, { view: null, help: ['L', 'library: the stack you are walking, in its order (a tree of folders by topic, a list otherwise; again: back to the item) · type to filter · ↑↓ →← · Enter opens, or stays in a folder · Esc'], order: 52 });

// ---------- painting ----------
let raf = 0, paintedTop = -1;
const paint = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paintNow(); }); };
let progressOf = null; // memory.js, when it is loaded
// Reading progress per item and read counts per folder, kept until memory.js says an item changed.
const prog = new Map(), readN = new Map();
const progress = (i) => { if (!progressOf) return null; if (!prog.has(i)) prog.set(i, progressOf(items[i].id)); return prog.get(i); };
const readCount = (n) => { if (!progressOf) return 0; if (!readN.has(n.key)) { let k = 0; for (const i of n.items) if (progress(i)?.done) k++; readN.set(n.key, k); } return readN.get(n.key); };
const icons = new Map(); // item -> its icon, cloned for each paint
const icon = (i) => { if (!itemIcon) return h('span', { className: 'lr-b' }); if (!icons.has(i)) icons.set(i, itemIcon(items[i], 12)); return icons.get(i).cloneNode(true); };
// Room below the last row, so the current row can stay a quarter from the top even near the end.
const sizePad = () => { pad.style.height = rows.length * RH + Math.max(0, Math.round((list.clientHeight || 600) * 0.75) - RH) + 'px'; };
function paintNow() {
  if (!showing() || !T) return;
  paintTop();
  qn.textContent = q() ? String(flat ? rows.length : match.reduce((s, x) => s + x, 0)) : '';
  sizePad();
  const top = list.scrollTop, H = list.clientHeight || 600;
  const a = Math.max(0, Math.floor(top / RH) - 6), b = Math.min(rows.length, Math.ceil((top + H) / RH) + 6);
  slice.style.transform = `translateY(${a * RH}px)`;
  paintedTop = top;
  const cur = current(), s = sel;
  const dates = flat && (state.sort === 'newest' || state.sort === 'oldest');
  const ctx = { cur, s, dots: flat && multiLane, dates, anc: new Set(cur != null ? ancestors(cur) : []), sn: stackNode() };
  // Rows already drawn are kept (walking the list redraws only the marks on them).
  const pre = `${elVer}|${+flat}${+ctx.dots}${+dates}|`, next = new Map(), els = [];
  for (let r = a; r < b; r++) {
    const row = rows[r], key = pre + rowId(row) + '|' + r + (row.node ? `|${+isOpen(row.node)}|${match ? row.node.m : ''}` : '');
    const el = drawn.get(key) || rowEl(row, r, ctx);
    marks(el, row, r, ctx);
    next.set(key, el); els.push(el);
  }
  drawn = next;
  if (els.length !== slice.children.length || els.some((el, k) => slice.children[k] !== el)) slice.replaceChildren(...els);
  list.classList.toggle('flat', flat);
  list.setAttribute('role', flat ? 'listbox' : 'tree');
  list.setAttribute('aria-activedescendant', s ? 'lib-sel' : '');
}
/** What changes as you walk: the cursor, the current item, what is behind you, the folder you stay in. */
function marks(el, row, r, { cur, s, anc, sn }) {
  const sel = rowId(row) === s;
  el.classList.toggle('sel', sel); if (sel) el.id = 'lib-sel'; else el.removeAttribute('id'); el.setAttribute('aria-selected', String(sel));
  if (row.node) {
    el.classList.toggle('scoped', row.node === sn);
    el.classList.toggle('has-cur', !isOpen(row.node) && anc.has(row.node));
  } else {
    el.classList.toggle('cur', flat ? row.r === state.pos : row.i === cur);
    el.classList.toggle('before', flat && row.r < state.pos);
  }
}
let drawn = new Map(), elVer = 0; // rows on screen by what they show; elVer: bumped when rows must be drawn anew
function rowEl(row, r, { dots, dates }) {
  const el = h('div', { className: 'lr', role: flat ? 'option' : 'treeitem' });
  el.dataset.r = r;
  el.style.setProperty('--d', row.d ?? 0);
  if (!flat) el.setAttribute('aria-level', row.d + 1);
  if (row.here) return hereEl(row, el);
  if (row.node) {
    const n = row.node, open = isOpen(n);
    el.classList.add(n.parent ? 'lr-f' : 'lr-l');
    el.setAttribute('aria-expanded', String(open));
    el.append(h('span', { className: 'lr-c', textContent: open ? '▾' : '▸' }));
    if (!n.parent) el.append(h('span', { className: 'lr-dot', style: `background:${LANE_COLORS[n.lane] || 'var(--ink-3)'}` }));
    el.append(h('span', { className: 'lr-t', textContent: n.label }));
    const read = readCount(n);
    el.append(h('span', { className: 'lr-n', title: match ? `${n.m} of ${n.n} ${q() ? 'match' : 'in this stack'}` : read ? `${read} of ${n.n} read` : `${n.n} items` },
      match ? `${n.m}/${n.n}` : [read ? h('span', { className: 'lr-r' }, h('i', { style: `width:${Math.max(10, Math.round((read / n.n) * 100))}%` })) : '', h('span', { className: 'lr-k', textContent: String(n.n) })]));
    el.append(h('button', { type: 'button', className: 'lr-go', tabIndex: -1, textContent: '▶', title: n.parent ? `Stay in “${n.label}”: j/k walk only its items (Enter)` : `The ${n.label} lane (Enter)` }));
    el.title = crumbOf(n).join(' › ');
  } else {
    const it = items[row.i];
    el.classList.add('lr-i');
    el.dataset.i = row.i;
    if (dots) el.append(h('span', { className: 'lr-dot', title: LANES[it.lane] || it.lane, style: `background:${LANE_COLORS[it.lane] || 'var(--ink-3)'}` }));
    el.append(icon(row.i));
    el.append(h('span', { className: 'lr-t', textContent: it.t }));
    if (dates) { const d = fmtDate(it); if (d) el.append(h('span', { className: 'lr-d', textContent: d })); }
    // On disk or not: an item whose opening spread is not fetched yet is dimmed; a book
    // partly fetched (5% or more) says how much.
    const rd = readyOf(row.i);
    if (rd) {
      if (!rd[0] && rd[1] < 0.995) el.classList.add('lr-cold');
      if (it.kind === 'scan' && rd[1] >= 0.05 && rd[1] < 0.995) el.append(h('span', { className: 'lr-ld', textContent: Math.max(1, Math.floor(rd[1] * 100)) + '%', title: `${Math.round(rd[1] * 100)}% of the pages are on disk` }));
    }
    const p = progress(row.i);
    if (p) el.append(p.done ? h('span', { className: 'lr-p done', textContent: '✓', title: 'Read' })
      : h('span', { className: 'lr-p', title: p.n ? `${Math.round(p.frac * 100)}% seen` : 'Opened' }, h('i', { style: `width:${Math.max(12, Math.round(p.frac * 100))}%` })));
    el.title = [it.t, [it.a, fmtDate(it) || it.y].filter(Boolean).join(', '), flat && !dots ? '' : crumbOf(parentOf.get(row.i) || { label: LANES[it.lane] }).join(' › ')].filter(Boolean).join('\n');
  }
  return el;
}
/** The stack line and the sort switch. */
let topKey = '';
function paintTop() {
  // Where you are (lane, folder or tag, n / total, ✕) is in the item header (stack.js); here only the sort.
  const key = [state.sort, custom, state.pos, state.order.length].join('|');
  if (key === topKey) return;
  topKey = key;
  sortBar.querySelector('.ls-n').textContent = `${state.pos + 1} / ${state.order.length}`;
  for (const b of sortBar.querySelectorAll('button')) { const on = b.dataset.sort === state.sort && !custom; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }
  sortBar.querySelector('.ls-c').hidden = !custom;
}

// ---------- where you are in the current item ----------
// Under the current item's row: a position row (the whole document as a bar, the pages on
// screen lit, "5–6 / 40", section ticks; click to go there) and its main sections, the one
// on screen lit (click or Enter goes there). Outlines load after the item settles, from the
// PDF's own outline, the post's headings, or the compiled profile's contents.
const outlines = new Map(); // item id → [{t, k, d}] (k: 0-based page; stable page for posts), or null while loading
let here = { i: null, s: 0, c: 1, n: 1 }; // pages on screen: first, count, total (stable pages for posts)
const SEC_MAX = 12;
/** The sections to list: the shallowest level with 2 or more, at most SEC_MAX around the one on screen. */
function sections(i) {
  const ol = outlines.get(items[i]?.id) || [];
  if (!ol.length) return [];
  const depths = [...new Set(ol.map((o) => o.d))].sort((a, b) => a - b);
  const d = depths.find((x) => ol.filter((o) => o.d === x).length >= 2) ?? depths[0];
  const top = ol.filter((o) => o.d === d);
  if (top.length <= SEC_MAX) return top;
  const at = Math.max(0, top.findLastIndex((o) => o.k <= here.s));
  const a = Math.max(0, Math.min(top.length - SEC_MAX, at - 4));
  return top.slice(a, a + SEC_MAX);
}
let secKey = '';
function withHere(out) {
  const c = current(); if (c == null) return out;
  const r = flat ? out.findIndex((x) => x.r === state.pos) : out.findIndex((x) => x.i === c);
  if (r < 0) return out;
  const d = (out[r].d ?? 0) + 1, secs = sections(c);
  secKey = c + ':' + secs.map((o) => o.k).join(',');
  out.splice(r + 1, 0, { here: 'pos', of: c, d }, ...secs.map((o, j) => ({ here: 'sec', o, j, of: c, d })));
  return out;
}
const pagesText = () => (here.c > 1 ? `${here.s + 1}–${Math.min(here.n, here.s + here.c)}` : `${here.s + 1}`) + ` / ${here.n}`;
function hereEl(row, el) {
  el.classList.add(row.here === 'pos' ? 'lr-pos' : 'lr-sec');
  const ok = here.i === row.of, n = Math.max(1, here.n);
  if (row.here === 'pos') {
    const bar = h('span', { className: 'lh-bar', title: 'Where you are in this item · click to go there' });
    if (ok) {
      for (const o of outlines.get(items[row.of].id) || []) if (o.k != null && o.d === (sections(row.of)[0]?.d ?? 0)) bar.append(h('b', { style: `left:${(100 * o.k) / n}%` }));
      bar.append(h('i', { style: `left:${(100 * here.s) / n}%;width:${Math.max(2, (100 * here.c) / n)}%` }));
    }
    bar.onclick = (e) => { e.stopPropagation(); const b = bar.getBoundingClientRect(); goPage(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - b.left) / b.width) * n)))); };
    el.append(bar, h('span', { className: 'lh-n', textContent: ok ? pagesText() : '…' }));
    return el;
  }
  const o = row.o, secs = sections(row.of);
  // The section on screen: the last one starting on or before the last page shown.
  if (ok && row.j === secs.findLastIndex((x) => x.k != null && x.k <= here.s + here.c - 1)) el.classList.add('on');
  el.append(h('span', { className: 'lr-t', textContent: o.t }), h('span', { className: 'lh-k', textContent: o.k != null ? String(o.k + 1) : '' }));
  el.title = o.t + (o.k != null ? ` · p. ${o.k + 1}` : '');
  return el;
}
async function loadOutline(i) {
  const it = items[i];
  if (!it || outlines.has(it.id)) return;
  outlines.set(it.id, null);
  let ol = [];
  try {
    if (it.kind !== 'scan') { const d = await openDoc(it); ol = (d.pdf ? await pdfOutline(d) : d.outline || []).map((o) => ({ t: o.title, k: o.page, d: o.depth || 0 })); }
  } catch { /* none */ }
  const toc = profileOf(it)?.toc;
  if (!ol.length && Array.isArray(toc)) ol = toc.map((o) => ({ t: o.t, k: o.k, d: o.d || 0 }));
  outlines.set(it.id, ol.filter((o) => o.t && o.k != null && o.k >= 0).slice(0, 80));
  if (current() === i) { repaintTrack(); if (showing()) { flatten(); paint(); } }
}
on('item:settled', ({ i }) => { loadOutline(i); });
on('spread:rendered', ({ i, it, s, flow }) => {
  if (flow) { const [a, b] = flowRange(s); here = { i, s: a, c: Math.max(1, b - a + 1), n: Math.max(1, it.n || b + 1) }; }
  else here = { i, s, c: Math.max(1, state.shown || 1), n: Math.max(1, it.n || s + 1) };
  if (!showing()) return;
  // The listed sections shift only for long outlines; otherwise a repaint of the rows in view.
  const key = current() + ':' + sections(current()).map((o) => o.k).join(',');
  if (key !== secKey) flatten();
  paint();
});
// The same section ticks on the track under the pages.
registerTrackLayer('sections', ({ it, n, el }) => {
  const ol = outlines.get(it.id) || [];
  const d = ol.length ? ([...new Set(ol.map((o) => o.d))].sort((a, b) => a - b).find((x) => ol.filter((o) => o.d === x).length >= 2) ?? 0) : 0;
  const ks = ol.filter((o) => o.d === d && o.k > 0).map((o) => o.k);
  const sig = it.id + ':' + n + ':' + ks.join(',');
  if (el.dataset.sig === sig) return;
  el.dataset.sig = sig;
  el.replaceChildren(...ks.map((k) => h('b', { style: `left:${(100 * k) / Math.max(1, n)}%` })));
});

// ---------- what is on disk ----------
// For the item rows in view: [first spread on disk, fraction of the item on disk], asked of
// the server (GET /ready) a batch at a time and kept for 20 s (the current item's for 4 s).
const ready = new Map(); // item index → { v: [first, frac], t }
let readyT = 0, readyAsk = new Set();
function readyOf(i) {
  const r = ready.get(i), now = Date.now();
  if (!r || now - r.t > (i === current() ? 4000 : 20000)) { readyAsk.add(i); if (!readyT) readyT = setTimeout(askReady, 250); }
  return r?.v || null;
}
async function askReady() {
  readyT = 0;
  const want = [...readyAsk].slice(0, 120); readyAsk = new Set([...readyAsk].slice(120));
  if (!want.length) return;
  for (const i of want) { const r = ready.get(i); ready.set(i, { v: r?.v || null, t: Date.now() }); } // no repeat asks while this one is out
  let fresh = false;
  try {
    const res = await fetch('/ready?ids=' + want.map((i) => encodeURIComponent(items[i].id)).join(','));
    if (res.ok) { const o = await res.json(); for (const i of want) if (o[items[i].id]) { if (String(ready.get(i)?.v) !== String(o[items[i].id])) fresh = true; ready.set(i, { v: o[items[i].id], t: Date.now() }); } }
  } catch { /* the server is older: no marks */ }
  if (readyAsk.size && !readyT) readyT = setTimeout(askReady, 250);
  if (fresh) elVer++; // rows drawn before the answer are drawn again, with their marks
  if (showing()) paint();
}
// While the list shows, look again every few seconds: the background fills things in.
setInterval(() => { if (showing() && !document.hidden) paint(); }, 5000);

// ---------- following the current item ----------
let mk = {}; // what the list was made for: the order (and its length), sort, scope and lane
/** Show the current item: open its branch (and close the ones walked out of),
 *  highlight it and keep it about a quarter from the top. force: also move the cursor while the list has the keyboard. */
function follow(i, force = false) {
  if (i == null || !T) return;
  // The list is made again only when the stack, its sort or its order changed.
  const fresh = mk.o !== state.order || mk.n !== state.order.length || mk.s !== state.sort || mk.sc !== state.scope || mk.l !== state.lane;
  if (fresh) { mk = { o: state.order, n: state.order.length, s: state.sort, sc: state.scope, l: state.lane }; pickMode(); remask(); }
  if (!flat) {
    const anc = ancestors(i);
    // Only the current item's branch is opened for you: folders you walk out of close behind
    // you (ones you opened by hand stay open). The current row keeps its height on screen
    // (below), so a folder closing above it does not move it.
    const keep = new Set();
    let reopened = false;
    for (const a of anc) { keep.add(a.key); if (userClosed.delete(a.key) | fClosed.delete(a.key)) reopened = true; }
    if (reopened || keep.size !== autoOpen.size || [...keep].some((k) => !autoOpen.has(k))) { autoOpen = keep; flatten(); }
  }
  if (!browsing() || force) sel = 'i' + i;
  const r = curIndex();
  if (anchored() && anchor.id === 'i' + i && !force) { paint(); return; } // you clicked it: it stays under the pointer
  if (r >= 0 && (!browsing() || force)) {
    const H = list.clientHeight || 600;
    sizePad(); // before scrolling: the rows may have just changed
    list.scrollTop = Math.max(0, r * RH - Math.round(H * 0.25));
  }
  paint();
}
function revealNode(n) {
  if (flat) return;
  if (q()) { input.value = ''; setFilter(''); }
  for (let a = n.parent; a; a = a.parent) { userOpen.add(a.key); userClosed.delete(a.key); fClosed.delete(a.key); }
  flatten(); sel = 'n' + n.key; scrollTo(selIndex(), true); paint();
  list.focus({ preventScroll: true });
}
function scrollTo(r, center) {
  if (r < 0) return;
  const H = list.clientHeight || 600, y = r * RH;
  if (center) { if (y < list.scrollTop + RH || y > list.scrollTop + H - 2 * RH) list.scrollTop = Math.max(0, y - H / 2 + RH / 2); }
  else if (y < list.scrollTop) list.scrollTop = y;
  else if (y + RH > list.scrollTop + H) list.scrollTop = y + RH - H;
}
// Follow the current item the moment it changes, so holding j/k moves the highlight
// row by row with the pages (one flatten and ~40 rows, at most once a frame).
let followI = null, followRaf = 0;
const followSoon = (i) => {
  if (!showing()) return;
  followI = i;
  followRaf ||= requestAnimationFrame(() => {
    followRaf = 0;
    follow(followI);
    if (raf) { cancelAnimationFrame(raf); raf = 0; paintNow(); } // this frame, not the next
  });
};
on('item:shown', ({ i }) => followSoon(i));
on('item:skim', ({ i }) => followSoon(i)); // holding j/k (riffle.js)
on('stack:changed', () => { topKey = ''; mk = {}; followSoon(current()); });
on('nav', (d) => { if (d.type === 'back') { topKey = ''; mk = {}; followSoon(current()); } });
on('stack:show', () => { if (!showing()) setMode(true); const n = stackNode(); if (n) revealNode(n); else follow(current(), true); });
on('view:changed', () => { if (showing()) follow(current()); });
on('memory:updated', ({ id } = {}) => { prog.delete(byId.get(id)); readN.clear(); elVer++; if (showing()) paint(); });
// Items added or changed (features/local.js: a file appeared in your folder): the tree is built again.
on('corpus:changed', ({ changed = [] } = {}) => {
  T = null; parentOf.clear(); hay = null; icons.clear(); prog.clear(); readN.clear(); for (const i of changed) ready.delete(i);
  elVer++; mk = {}; topKey = '';
  if (showing()) { build(); follow(current()); }
});
list.addEventListener('scroll', () => { if (list.scrollTop !== paintedTop) paint(); }, { passive: true });
addEventListener('resize', paint);

// ---------- acting on rows ----------
function toggle(n, open = !isOpen(n)) {
  if (match) { if (open) fClosed.delete(n.key); else fClosed.add(n.key); }
  else if (open) { userOpen.add(n.key); userClosed.delete(n.key); }
  else { userOpen.delete(n.key); if (autoOpen.has(n.key)) userClosed.add(n.key); }
  flatten(); paint();
}
function activate(r) {
  const row = rows[r]; if (!row) return;
  sel = rowId(row);
  if (row.here) { if (row.here === 'sec' && row.o.k != null) goPage(row.o.k); return paint(); }
  if (row.node) browse(row.node); else openItem(row.i, row.r);
  paint();
}
// Moving the cursor onto an item opens it in the main view, after a short pause so that
// holding an arrow does not load every item it passes; the keys stay in the list.
let previewT = 0;
function preview(row) {
  clearTimeout(previewT);
  if (!row || row.node || row.here) return;
  previewT = setTimeout(() => {
    if (sel !== rowId(row) || current() === row.i) return;
    keepKeys = true;
    try { openItem(row.i, row.r ?? null); } finally { keepKeys = false; }
  }, 140);
}
function move(r) {
  if (!rows.length) return;
  r = Math.max(0, Math.min(rows.length - 1, r));
  sel = rowId(rows[r]); scrollTo(r, false); paint();
  anchor = { id: sel, t: performance.now() };
  preview(rows[r]);
}
list.addEventListener('click', (e) => {
  const el = e.target.closest('.lr'); if (!el) return;
  const r = Number(el.dataset.r), row = rows[r]; if (!row) return;
  sel = rowId(row);
  anchor = { id: sel, t: performance.now() };
  if (e.target.closest('.lr-go')) { activate(r); return; }
  if (row.node) toggle(row.node); else activate(r);
});
list.addEventListener('dblclick', (e) => { const el = e.target.closest('.lr-f, .lr-l'); if (el) activate(Number(el.dataset.r)); });
list.addEventListener('focus', () => { if (selIndex() < 0) { const k = curIndex(); sel = k >= 0 ? rowId(rows[k]) : rows[0] ? rowId(rows[0]) : null; } paint(); });
list.addEventListener('blur', paint);

const page = () => Math.max(1, Math.floor((list.clientHeight || 600) / RH) - 1);
function treeKey(e) {
  const r = selIndex(), row = rows[r];
  switch (e.key) {
    case 'ArrowDown': move(r + 1); break;
    case 'ArrowUp': move(r < 0 ? 0 : r - 1); break;
    case 'PageDown': move(r + page()); break;
    case 'PageUp': move(r - page()); break;
    case 'Home': move(0); break;
    case 'End': move(rows.length - 1); break;
    case 'ArrowRight':
      if (row?.node) { if (!isOpen(row.node)) toggle(row.node, true); else move(r + 1); }
      break;
    case 'ArrowLeft':
      if (row?.node && isOpen(row.node)) toggle(row.node, false);
      else if (!flat) { const p = row?.node ? row.node.parent : row ? parentOf.get(row.i) : null; if (p) { const k = rows.findIndex((x) => x.node === p); if (k >= 0) move(k); } }
      break;
    case 'Enter': activate(r); break;
    case 'Escape': // clear the filter, then give the keys back to the page
      if (q()) { input.value = ''; setFilter(''); follow(current(), true); } else done();
      break;
    default: return false;
  }
  return true;
}
list.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (treeKey(e)) { e.preventDefault(); e.stopPropagation(); return; }
  // Type to filter. Space still reaches the page (it is Advance), and so do Shift+letter
  // commands (L back to the item, I moves the panel, S sorts…).
  if (e.key.length === 1 && e.key !== ' ' && !/[A-Z]/.test(e.key)) { e.preventDefault(); e.stopPropagation(); input.focus(); input.value = (stale ? '' : input.value) + e.key; onInput(); }
  else if (e.key === 'Backspace' && q()) { e.preventDefault(); e.stopPropagation(); input.focus(); input.value = input.value.slice(0, -1); onInput(); }
});
function onInput() {
  stale = false;
  setFilter(input.value);
  // The cursor goes to the first matching item.
  const k = q() ? rows.findIndex((x) => x.i != null) : -1;
  if (k >= 0) sel = rowId(rows[k]);
  list.scrollTop = 0;
  if (!q()) follow(current(), true); else paint();
}
input.addEventListener('input', onInput);
input.addEventListener('keydown', (e) => {
  const r = selIndex();
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp') { treeKey(e); e.preventDefault(); }
  else if (e.key === 'Enter') { e.preventDefault(); activate(r < 0 ? rows.findIndex((x) => x.i != null) : r); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (input.value) { input.value = ''; onInput(); list.focus({ preventScroll: true }); } else done(); }
  else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); list.focus(); }
});

// ---------- optional helpers from other modules ----------
let itemIcon = null; // icons.js: a small type icon per item
async function helpers() {
  try { ({ itemIcon } = await import('../icons.js')); } catch { /* no icons */ }
  try {
    const f = await (await fetch('/features.json')).json();
    if ((f.js || []).some((m) => /\/memory\.js$/.test(m))) ({ progressOf } = await import('./memory.js'));
  } catch { /* no reading memory */ }
  elVer++; paint();
}

on('boot', () => {
  main.classList.toggle('lib-on', on_);
  placeTabs();
  // Build when the browser is idle, so the first Library press is instant.
  (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(() => { build(); pickMode(); remask(); helpers().then(() => { if (showing()) follow(current(), true); }); });
});
keyHelp.push({ label: '→ ← ↵', text: 'library tree: open / close a folder · Enter opens an item, or stays in a folder (j/k walk only its items; u leaves)', order: 53 });

// For tests: the rows as drawn ({f: folder key} | {i, r}) and which list shows.
window.__lib = { rows: () => rows.map((x) => (x.node ? { f: x.node.key } : { i: x.i, r: x.r })), flat: () => flat, custom: () => custom, cur: curIndex };
