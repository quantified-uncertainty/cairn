// Shared helpers and the extension hooks feature modules use: an event bus,
// a key registry, panel sections and top-level views.
import { hudIcon } from './hud-icons.js';

export const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
// Your own files (/local/…, server/routes/17-local.mjs) come straight from this server, not through the proxy.
export const P = (u) => (/^\/local\//.test(u) ? u : '/proxy?u=' + encodeURIComponent(u));
// Page images come from a second origin. A browser opens at most 6 connections to a host,
// and slow Internet Archive pages would otherwise queue the app's own calls behind them;
// localhost and 127.0.0.1 are the same server and two hosts to the browser. Images loaded
// this way set crossOrigin 'anonymous' (the proxy answers with Access-Control-Allow-Origin),
// so canvases they are drawn on can still be read. stacks2:shard = false turns it off.
const ALT = { localhost: '127.0.0.1', '127.0.0.1': 'localhost' }[location.hostname];
export const SHARD = ALT && (() => { try { return localStorage.getItem('stacks2:shard') !== 'false'; } catch { return true; } })() ? `${location.protocol}//${ALT}:${location.port}` : '';
/** A proxied image (or a background fetch of one) from the second origin; P() for everything else. */
export const PI = (u) => { const p = P(u); return SHARD && p.startsWith('/proxy') ? SHARD + p : p; };
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
  if (v && v.catch) v.catch(() => { if (map.get(key) === v) map.delete(key); }); // not a newer entry under the same key
  map.set(key, v);
  while (map.size > cap) {
    const [k, old] = map.entries().next().value;
    map.delete(k);
    if (old && old.then) old.then((d) => d?.pdf?.destroy?.()).catch(() => {});
  }
  return v;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** [year, month, day?] as strings: from it.d (corpus.js fills it from new-style arXiv
 *  ids at load), else the month an arXiv id gives (YYMM: old style math/0406077 too) or
 *  a dated web address (metr.org/blog/2025-06-05-…), when that agrees with the item's
 *  year (a paper sent on 31 December gets a January id). null when only the year, or
 *  nothing, is known. */
export function dateOf(it) {
  let m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(it.d ? String(it.d) : '');
  if (m) return [m[1], m[2], m[3]];
  const ok = (y, mo) => mo >= 1 && mo <= 12 && (!it.y || +it.y === +y);
  if ((m = /^arxiv:(?:[a-z-]+(?:\.[A-Za-z-]+)?\/)?(\d{2})(\d{2})/.exec(it.id || ''))) {
    const y = String((+m[1] >= 91 ? 1900 : 2000) + +m[1]);
    return ok(y, +m[2]) ? [y, m[2]] : null;
  }
  m = /^https?:\/\/[^?#]*?\/((?:19|20)\d\d)-(\d\d)-(\d\d)(?=[-._/]|$)/.exec(it.url || '');
  return m && ok(m[1], +m[2]) ? [m[1], m[2], m[3]] : null;
}
/** "Oct 3, 2026" for the last two months, "Mar 2025" when the month is known, else the year. */
export function fmtDate(it) {
  const m = dateOf(it);
  if (!m) return it.y ? String(it.y) : '';
  const [y, mo, da] = m;
  if (da && Date.now() - Date.parse(`${y}-${mo}-${da}`) < 62 * 864e5) return `${MONTHS[mo - 1]} ${Number(da)}, ${y}`;
  return `${MONTHS[mo - 1]} ${y}`;
}

// ---- event bus ----
// Events: 'item:shown' {i, it}, 'spread:rendered' {i, it, s, els, doc}, and their
// debounced twins 'item:settled' (300 ms) and 'spread:settled' (160 ms);
// 'summary:updated' {id}, 'view:changed' {view}, 'nav' {type, i, it, s}, 'boot' {},
// 'nav:before' {label, i, pos, s, hist, zoom, order?, aff?, saved?, lane?} (where
// you were, just before a move or judgment), 'gesture:step', 'gesture:pinch' (gesture.js),
// 'item:error' {i, it, msg} (feed.js: the item could not open).
const bus = new EventTarget();
export const on = (name, fn) => bus.addEventListener(name, (e) => fn(e.detail));
export const emit = (name, detail = {}) => bus.dispatchEvent(new CustomEvent(name, { detail }));
/** Emit `name` once things go quiet: each call within `ms` replaces the last,
 *  so skipping quickly through items or pages emits only where you stop.
 *  Core emits 'item:settled' and 'spread:settled' this way; put work that the
 *  next page or item does not need (panels, text layers, network lookups)
 *  there instead of on 'item:shown' / 'spread:rendered'. */
const quietT = new Map();
export function emitQuiet(name, detail, ms) {
  clearTimeout(quietT.get(name));
  quietT.set(name, setTimeout(() => { quietT.delete(name); emit(name, detail); }, ms));
}

// ---- keys ----
// registerKey('l', fn, { help: ['l h', 'turn pages'], view: 'feed' }); view null = everywhere.
// Key auto-repeat is ignored (one press, one step) unless the binding says { repeat: true }.
export const keymap = new Map();
export const keyHelp = [];
export function registerKey(keys, fn, { help, view = 'feed', order = 50, repeat = false } = {}) {
  for (const k of [].concat(keys)) keymap.set(k, { fn, view, repeat });
  if (help) keyHelp.push({ label: help[0], text: help[1], order });
}

// ---- steppers ----
// registerStepper(fn, order): fn(dir, e) returns true when it handled the step.
// dir 1 is Advance (Space, PageDown, the wheel in continue mode), -1 is Back
// (Backspace, Shift+Space, PageUp). features/back.js answers Back from its undo
// stack; tour stops and the conveyor can plug in here. Unhandled, Advance turns
// the page and then moves to the next item, and Back turns back a page.
export const steppers = [];
export function registerStepper(fn, order = 50) { steppers.push({ fn, order }); steppers.sort((a, b) => a.order - b.order); }

// ---- panel sections ----
// registerSection({ id, title, order, render(it, i) -> Node|null }); the panel
// re-renders all sections when the item changes. Sections may update
// themselves later through document.getElementById('sec-' + id).
export const sections = [];
export function registerSection(s) { sections.push(s); sections.sort((a, b) => (a.order ?? 50) - (b.order ?? 50)); }

// ---- why lines ----
// registerWhyLine(fn): fn(it, i) → Node | null, added to the panel's "Why this" section
// after the why line. While any is registered, the section drops its "you liked …" line.
export const whyLines = [];
export function registerWhyLine(fn) { whyLines.push(fn); }

// ---- views ----
// registerView('figures', { label, key, show(root), hide() }); each view gets
// its own root element inside #main. Feed and Wall are views too.
export const views = new Map();
export function registerView(name, v) { views.set(name, v); emit('views:changed'); }

// ---- HUD notices ----
// toast(text, ms?, { icon, sub, kind, fill }): a notice low in the middle of
// the stage: a big icon, a few words (keep the main line short: 2-5 words) and
// an optional smaller second line. One at a time: a new one replaces the old.
//   toast('Saved')                                     plain text still works
//   toast('Saved', { icon: 'star', kind: 'ok' })       options may come second
//   toast('Wheel: pages', 2600, { icon: 'mouse+book-open', sub: 'Down: next page', kind: 'mode' })
// icon: a name from hud-icons.js ('a+b' puts two side by side).
// kind: 'mode' (a setting changed: accent, shown longer), 'ok' (done: accent),
// 'edge' (the start or end of something: dim), 'bad' (failed: red, longer),
// 'busy' (under way: the icon moves; shown until replaced, at most 4 s).
// fill: 0-1 fills the card from the left (the pull to the next item, nav.js).
// ms: 1.2 s by default, 1.8 s with a second line, longer for mode, bad and busy.
const HUD_MS = { mode: 2600, bad: 2600, busy: 4000 };
let toastT = null;
export function toast(text, ms, opts = {}) {
  if (ms && typeof ms === 'object') { opts = ms; ms = opts.ms; }
  const { icon = '', sub = '', kind = '', fill = null } = opts || {};
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast' }, h('div', { className: 'hud-f' }), h('div', { className: 'hud-i' }),
      h('div', { className: 'hud-t' }, h('div', { className: 'hud-m' }), h('div', { className: 'hud-s' })));
    el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  // Low and centred on the stage (the pages) while it shows, else on the window.
  // It lives inside #stage so CSS places it: nothing here reads layout, so a
  // notice never forces a layout of the page in the middle of a page turn.
  const st = document.getElementById('stage');
  const host = st && !st.hidden ? st : document.body;
  if (el.parentNode !== host) host.append(el);
  const ic = el.querySelector('.hud-i'), m = el.querySelector('.hud-m'), s = el.querySelector('.hud-s');
  const changed = m.textContent !== String(text) || ic.dataset.icon !== icon;
  if (ic.dataset.icon !== icon) { ic.innerHTML = hudIcon(icon); ic.dataset.icon = icon; }
  ic.hidden = !ic.innerHTML;
  m.textContent = text; s.textContent = sub || ''; s.hidden = !sub;
  const was = el.classList.contains('on');
  el.className = 'on' + (kind ? ' k-' + kind : '') + (fill != null ? ' fill' : '');
  el.querySelector('.hud-f').style.width = fill != null ? Math.round(Math.max(0, Math.min(1, fill)) * 100) + '%' : '0';
  // Replacing a notice on screen: a small bump says the message changed.
  if (was && changed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.animate?.([{ scale: '.96' }, { scale: '1' }], { duration: 140, easing: 'ease-out' });
  }
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), ms ?? HUD_MS[kind] ?? (sub ? 1800 : 1200));
}
