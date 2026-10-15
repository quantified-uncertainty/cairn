// Shared helpers and the extension hooks feature modules use: an event bus,
// a key registry, panel sections and top-level views.

export const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
export const P = (u) => '/proxy?u=' + encodeURIComponent(u);
export const $ = (s, root = document) => root.querySelector(s);
export const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k);
  return el;
};
export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('stacks2:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('stacks2:' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const today = new Date().toISOString().slice(0, 10);
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const css = (text) => document.head.append(h('style', { textContent: text }));

/** Least-recently-used cache of promises; destroys evicted pdf.js documents. */
export function lru(map, key, make, cap) {
  if (map.has(key)) { const v = map.get(key); map.delete(key); map.set(key, v); return v; }
  const v = make();
  if (v && v.catch) v.catch(() => map.delete(key));
  map.set(key, v);
  while (map.size > cap) {
    const [k, old] = map.entries().next().value;
    map.delete(k);
    if (old && old.then) old.then((d) => d?.pdf?.destroy?.()).catch(() => {});
  }
  return v;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Oct 3, 2026" for the last two months, "Mar 2025" when the month is known, else the year. */
export function fmtDate(it) {
  const d = it.d ? String(it.d) : '';
  const m = d.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return it.y ? String(it.y) : '';
  const [, y, mo, da] = m;
  if (da && Date.now() - Date.parse(`${y}-${mo}-${da}`) < 62 * 864e5) return `${MONTHS[mo - 1]} ${Number(da)}, ${y}`;
  return `${MONTHS[mo - 1]} ${y}`;
}

// ---- event bus ----
// Events: 'item:shown' {i, it}, 'spread:rendered' {i, it, s, els, doc},
// 'summary:updated' {id}, 'view:changed' {view}, 'nav' {type, i, it, s}, 'boot' {}.
const bus = new EventTarget();
export const on = (name, fn) => bus.addEventListener(name, (e) => fn(e.detail));
export const emit = (name, detail = {}) => bus.dispatchEvent(new CustomEvent(name, { detail }));

// ---- keys ----
// registerKey('l', fn, { help: ['l h', 'turn pages'], view: 'feed' }); view null = everywhere.
export const keymap = new Map();
export const keyHelp = [];
export function registerKey(keys, fn, { help, view = 'feed', order = 50 } = {}) {
  for (const k of [].concat(keys)) keymap.set(k, { fn, view });
  if (help) keyHelp.push({ label: help[0], text: help[1], order });
}

// ---- panel sections ----
// registerSection({ id, title, order, render(it, i) -> Node|null }); the panel
// re-renders all sections when the item changes. Sections may update
// themselves later through document.getElementById('sec-' + id).
export const sections = [];
export function registerSection(s) { sections.push(s); sections.sort((a, b) => (a.order ?? 50) - (b.order ?? 50)); }

// ---- views ----
// registerView('figures', { label, key, show(root), hide() }); each view gets
// its own root element inside #main. Feed and Wall are views too.
export const views = new Map();
export function registerView(name, v) { views.set(name, v); emit('views:changed'); }

/** A small transient message at the bottom of the screen. */
let toastT = null;
export function toast(text, ms = 1600) {
  let el = document.getElementById('toast');
  if (!el) { el = h('div', { id: 'toast' }); document.body.append(el); }
  el.textContent = text; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms);
}
