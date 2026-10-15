// The header: the top bar (#bar) and the item header (#item-head), in one of
// three layouts, with the position bar (#track) under them.
//
//   Two bars  the top bar, then the item header over the pages (feed.js paintHead).
//   One bar   the item header moves into the top bar, between the lane picker
//             and the tools; views and lanes become pickers, and the tools used
//             less often go into the ⋯ menu.
//   Focus     (d) no bars and no side panel: the pages, and the position bar as
//             a thin line at the very top. Pointing at the top edge, or d again,
//             shows the one-bar header over the pages (they do not move); Esc
//             leaves. Settings › Appearance can make it go full screen as well.
//
// Settings › Appearance › Header picks Auto, Two bars or One bar. Auto is one
// bar in a window narrower than 1500 or lower than 900 CSS px (a laptop: a
// 14-inch MacBook at 100 % leaves about 1512 × 880 for the page, at 120 %
// about 1260 × 790), two bars above. The choice and Focus are kept per screen
// (state.head, state.focus: state.js SCREEN_PREFS). Views other than the
// Reader have no item header: they get the top bar alone.
//
// Features keep adding to #bar and #item-head as before: #item-head is the
// same element wherever it sits, and #bar's children are placed by CSS
// `order` (style.css), whatever order they were added in. A fit pass makes the
// bar fit its width, giving up, in order: the lane chips (for a lane picker:
// chips are shown only when every one of them fits, never cut), the status
// text, the view tabs (for a view picker), button labels, then the tools used
// less often (into ⋯). It runs on resizes, layout changes and changes to the
// bar's own buttons, never on a page turn or an item change: the item header
// takes what is left and drops its own details by width (container queries).
//
// The layout is on <html>: data-head="two" | "one", .focus, .head-peek (Focus
// with the header shown over the pages), .hd-feed (the Reader is showing).
// A change of layout lays the stage out once (chrome.js refresh) and emits
// 'header:changed' {head, focus, peek}. --bar-h on :root is the bar's height.
import { $, h, on, emit, store, registerKey, keymap, views, toast } from './util.js';
import { items, LANES, COUNTS, LANE_COLORS } from './corpus.js';
import { state, current, saveScreenPref, isScreenPref, screenKey } from './state.js';
import { setView, setLane, refresh, applyChrome } from './chrome.js';
import { live } from './flow.js';

const AUTO_W = 1500, AUTO_H = 900; // Auto: one bar below either (CSS px)
const EDGE = 4; // Focus: the pointer this close to the top edge shows the header
const R = document.documentElement, bar = $('#bar'), stage = $('#stage');
const svg = (d, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const CARET = svg('<path d="m6 9 6 6 6-6"/>', 'caret');
const MAX = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
const MIN = '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>';

// The bar's own controls are in index.html; made here only if an old page lacks them.
function ensure(id, make) { let el = document.getElementById(id); if (!el) { el = make(); el.id = id; bar.append(el); } return el; }
const viewPick = ensure('view-pick', () => h('button', { className: 'ghost pick', type: 'button' }));
const lanePick = ensure('lane-pick', () => h('button', { className: 'ghost pick', type: 'button' }));
const focusBtn = ensure('focus-btn', () => h('button', { className: 'ghost', type: 'button', innerHTML: svg(MAX) }));
const moreBtn = ensure('more-btn', () => h('button', { className: 'ghost', type: 'button', textContent: '⋯', hidden: true }));
const more = ensure('more', () => h('div', { hidden: true }));
more.setAttribute('role', 'menu');
for (const b of [viewPick, lanePick, moreBtn]) { b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false'); }

// ---------------------------------------------------------------- the choice, per screen
const pref = () => (['two', 'one'].includes(state.head) ? state.head : 'auto');
function keep(k, v) { state[k] = v; if (isScreenPref(k)) saveScreenPref(k); else store.set(`${k}@${screenKey()}`, v); }
for (const [k, d] of [['head', 'auto'], ['focus', false]]) if (!isScreenPref(k) && state[k] === undefined) state[k] = store.get(`${k}@${screenKey()}`, d);
const inFeed = () => state.view === 'feed';
const focusOn = () => !!state.focus && inFeed();
/** The layout the window asks for now. */
export function headMode() {
  if (!inFeed()) return 'two';
  if (focusOn()) return 'one';
  const p = pref();
  if (p !== 'auto') return p;
  return innerWidth < AUTO_W || innerHeight < AUTO_H ? 'one' : 'two';
}
export const headState = () => ({ head: shown.head, pref: pref(), focus: focusOn(), peek: R.classList.contains('head-peek') });

// ---------------------------------------------------------------- applying a layout
let shown = { head: null, focus: null };
/** Put the header in the layout it should have; true when it changed. relayout:
 *  lay the stage out now (otherwise the caller is about to). */
function apply(relayout = true) {
  R.classList.toggle('hd-feed', inFeed());
  const head = headMode(), foc = focusOn();
  if (head === shown.head && foc === shown.focus) return false;
  const was = shown.focus;
  R.dataset.head = head;
  R.classList.toggle('focus', foc);
  if (!foc) setPeek(false);
  const ih = $('#item-head');
  if (ih) {
    if (head === 'one') { if (ih.parentNode !== bar) bar.insertBefore(ih, more); }
    else if (ih.parentNode !== stage) stage.prepend(ih);
  }
  // Focus hides the side panel without storing that: leaving it brings back the stored choice.
  if (foc && !was && state.panel) { state.panel = false; applyChrome(); }
  if (!foc && was) { const p = store.get('panel', true); if (p !== state.panel) { state.panel = p; applyChrome(); } }
  shown = { head, focus: foc };
  paintFocusBtn();
  keepFlowPlace();
  fit(true); // the bar's final shape before the stage is measured
  if (relayout && inFeed()) {
    refresh();
    if (stage.classList.contains('wv-on')) dispatchEvent(new Event('resize')); // features/webview.js places its live view on resize
  }
  emit('header:changed', headState());
  return true;
}
/** Posts are typeset again for the new stage: keep the same text in view (as settings.js does). */
function keepFlowPlace() {
  const i = current(); if (i == null || !live || live.id !== items[i]?.id) return;
  state.pendingVp = live.first[state.start.get(i) ?? 0] ?? 0;
  state.hist.set(i, []);
}
// The Reader checks the header before it lays out, so a view switch or a screen
// change lays the stage out once, in its final shape.
{
  const feed = views.get('feed');
  if (feed?.show) { const show = feed.show; feed.show = (...a) => { apply(false); return show(...a); }; }
}

// ---------------------------------------------------------------- fitting the bar
// Steps given up in order when the bar does not fit (cumulative).
const STEPS = { two: ['chips', 'net', 'tabs', 'labels', 'tools', 'all'], one: ['new', 'labels', 'narrow', 'all'] };
const ONE_MORE = ['wheel-btn', 'saved-btn', 'xp-btn', 'keys-btn', 'net']; // one bar: always in ⋯
const TOOLS = ['wheel-btn', 'xp-btn', 'net'], REST = ['saved-btn', 'keys-btn', 'new-chip'];
// Known children; anything else a feature adds stays in the bar with two bars and goes into ⋯ with one.
const KNOWN = new Set(['panel-btn', 'views', 'view-pick', 'new-chip', 'lanes', 'lane-pick', 'item-head', 'wheel-btn', 'ra-pill',
  'search-btn', 'saved-btn', 'xp-btn', 'keys-btn', 'focus-btn', 'st-btn', 'more-btn', 'more', 'net']);
const ST_HIDE = { 'wheel-btn': 'wheel', 'search-btn': 'search', 'saved-btn': 'saved', 'keys-btn': 'keys', net: 'net', 'focus-btn': 'focus' };
function config(mode, L) {
  const st = STEPS[mode], has = (s) => { const j = st.indexOf(s); return j >= 0 && j < L; };
  if (mode === 'one') {
    return { lanes: 'pick', views: 'pick', net: true, compact: has('labels'), narrow: has('narrow'), extras: true,
      ovf: new Set([...ONE_MORE, ...(has('new') ? ['new-chip'] : []), ...(has('all') ? ['ra-pill'] : [])]) };
  }
  return { lanes: has('chips') ? 'pick' : 'chips', views: has('tabs') ? 'pick' : 'tabs', net: !has('net'), compact: has('labels'), narrow: false,
    extras: has('tools'), ovf: new Set([...(has('tools') ? TOOLS : []), ...(has('all') ? REST : [])]) };
}
function setConfig(c) {
  bar.dataset.lanes = c.lanes; bar.dataset.views = c.views;
  bar.classList.toggle('no-net', !c.net); bar.classList.toggle('compact', c.compact); bar.classList.toggle('narrow', c.narrow);
  for (const n of [...bar.children, ...more.children]) {
    if (n === more || n.id === 'item-head') continue;
    const out = n.id ? c.ovf.has(n.id) || (c.extras && !KNOWN.has(n.id)) : c.extras;
    if (out && n.parentNode !== more) more.append(n);
    else if (!out && n.parentNode !== bar) bar.insertBefore(n, more);
  }
  moreBtn.hidden = ![...more.children].some((n) => !n.hidden && !R.classList.contains('st-hide-' + ST_HIDE[n.id]));
}
function fits(c) {
  if (bar.scrollWidth > bar.clientWidth + 1) return false;
  const l = $('#lanes'), n = $('#net');
  if (c.lanes === 'chips' && l && l.scrollWidth > l.clientWidth + 1) return false; // chips only when all of them show
  if (c.net && n?.parentNode === bar && n.scrollWidth > n.clientWidth + 1) return false; // the status squeezed: hide it instead
  return true;
}
let fitQ = 0, barH = 37, fitLater = false;
/** Make the bar fit: the first step at which nothing overflows. A few layouts of
 *  the bar; on resizes and changes to the bar, never per page or item. While a
 *  menu is open it waits (its buttons would move under the pointer). */
export function fit(force = false) {
  cancelAnimationFrame(fitQ); fitQ = 0;
  if (!force && (menu || !more.hidden)) { fitLater = true; return; }
  fitLater = false;
  closeMenu(); closeMore();
  const mode = R.dataset.head === 'one' ? 'one' : 'two', st = STEPS[mode];
  let L = 0;
  for (; L <= st.length; L++) { const c = config(mode, L); setConfig(c); if (L === st.length || fits(c)) break; }
  bar.dataset.fit = String(L);
  const l = $('#lanes'); l?.classList.toggle('scrolls', bar.dataset.lanes === 'chips' && l.scrollWidth > l.clientWidth + 1);
  barH = bar.offsetHeight || barH;
  R.style.setProperty('--bar-h', barH + 'px');
  mo.takeRecords(); watchKids(); ao.takeRecords();
}
export function fitSoon() { if (!fitQ) fitQ = requestAnimationFrame(fit); }
// What changes the bar's width: buttons a feature adds, shows or hides, and their counts.
// Not the item header (it absorbs), and not the status text (it shrinks).
const mo = new MutationObserver(fitSoon), ao = new MutationObserver(fitSoon);
mo.observe(bar, { childList: true }); mo.observe(more, { childList: true });
function watchKids() {
  for (const n of [...bar.children, ...more.children]) {
    if (n._hdWatch || n.id === 'item-head' || n.id === 'net' || n === more || n === moreBtn) continue;
    n._hdWatch = true;
    ao.observe(n, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: n.id !== 'lanes' && n.id !== 'views' });
  }
}
// The pickers follow what chrome.js paints into #views and #lanes.
new MutationObserver(() => { paintLanePick(); fitSoon(); }).observe($('#lanes'), { childList: true });
new MutationObserver(() => { paintViewPick(); fitSoon(); }).observe($('#views'), { childList: true });
document.fonts?.ready.then(fitSoon);

// ---------------------------------------------------------------- pickers
const laneList = () => [['all', 'All', items.length], ...Object.entries(LANES).map(([k, v]) => [k, v, COUNTS[k] || 0]).filter(([, , c]) => c)];
const dot = (k) => h('i', { className: 'hd-dot', style: k === 'all' ? '' : `--c:${LANE_COLORS[k] || 'var(--ink-3)'}` });
const viewList = () => [...views.entries()].sort((a, b) => (a[1].order ?? 50) - (b[1].order ?? 50));
function paintViewPick() {
  const v = views.get(state.view);
  viewPick.replaceChildren(h('span', { className: 'pk-t', textContent: v?.label || state.view }));
  viewPick.insertAdjacentHTML('beforeend', CARET);
  viewPick.title = 'View: ' + viewList().map(([, x]) => (x.key ? `${x.label} (${x.key})` : x.label)).join(' · ');
}
function paintLanePick() {
  const all = laneList(), d = all.findIndex(([k]) => k === state.lane), [k, label, c] = all[Math.max(0, d)];
  lanePick.replaceChildren(dot(k), h('span', { className: 'pk-t', textContent: label }), h('span', { className: 'n', textContent: String(c) }));
  lanePick.insertAdjacentHTML('beforeend', CARET);
  lanePick.title = `Lane: ${label}${d >= 0 && d < 10 ? ` (key ${d})` : ''} · click for the others · 0–9 switch lanes`;
}

let menu = null; // { el, anchor }
function openMenu(anchor, rows, label) {
  closeMenu(); closeMore();
  const el = h('div', { className: 'hd-menu' });
  el.setAttribute('role', 'menu'); el.setAttribute('aria-label', label);
  for (const r of rows) {
    const b = h('button', { type: 'button', className: r.on ? 'on' : '', tabIndex: -1, title: r.title || '' }, ...r.kids);
    b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', String(!!r.on));
    b.onclick = () => { closeMenu(); r.act(); };
    el.append(b);
  }
  menuKeys(el, () => { closeMenu(); anchor.focus(); });
  document.body.append(el);
  const a = anchor.getBoundingClientRect();
  el.style.left = Math.round(Math.max(6, Math.min(a.left, innerWidth - el.offsetWidth - 6))) + 'px';
  el.style.top = Math.round(a.bottom + 4) + 'px';
  anchor.setAttribute('aria-expanded', 'true'); anchor.classList.add('open');
  menu = { el, anchor };
  (el.querySelector('.on') || el.firstElementChild)?.focus({ preventScroll: true });
}
function closeMenu() {
  if (!menu) return;
  const { el, anchor } = menu; menu = null;
  el.remove(); anchor.setAttribute('aria-expanded', 'false'); anchor.classList.remove('open');
  if (fitLater) fitSoon();
}
/** Arrows, Home and End move in a menu; Enter and Space choose; Esc and Tab close. Keys stay in it. */
function menuKeys(el, esc) {
  el.addEventListener('keydown', (e) => {
    const bs = [...el.querySelectorAll(':scope > button')].filter((b) => !b.hidden && b.offsetParent);
    const j = bs.indexOf(document.activeElement);
    const go = (k) => { e.preventDefault(); bs[(k + bs.length) % bs.length]?.focus(); };
    if (e.key === 'ArrowDown') go(j + 1);
    else if (e.key === 'ArrowUp') go(j < 0 ? -1 : j - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(-1);
    else if (e.key === 'Escape') { e.preventDefault(); esc(); }
    else if (e.key === 'Tab') esc();
    else if (e.key !== 'Enter' && e.key !== ' ') return; // other keys go on to the page (0–9 still switch lanes)
    e.stopPropagation();
  });
}
viewPick.onclick = () => (menu?.anchor === viewPick ? closeMenu() : openMenu(viewPick, viewList().map(([name, v]) => ({
  on: name === state.view, act: () => setView(name), title: v.key ? `${v.label} (${v.key})` : v.label,
  kids: [h('span', { className: 'mt', textContent: v.label }), v.key ? h('kbd', { textContent: v.key }) : null],
})), 'Views'));
lanePick.onclick = () => (menu?.anchor === lanePick ? closeMenu() : openMenu(lanePick, laneList().map(([k, label, c], d) => ({
  on: k === state.lane, act: () => { if (k !== state.lane) setLane(k); },
  kids: [dot(k), h('span', { className: 'mt', textContent: label }), h('span', { className: 'n', textContent: String(c) }), d < 10 ? h('kbd', { textContent: String(d) }) : null],
})), 'Lanes'));

// ---------- the ⋯ menu: the bar's own buttons, moved into it by fit() ----------
function openMore() {
  closeMenu();
  more.style.right = Math.round(bar.getBoundingClientRect().right - moreBtn.getBoundingClientRect().right) + 'px';
  more.hidden = false; moreBtn.setAttribute('aria-expanded', 'true'); moreBtn.classList.add('open');
  [...more.querySelectorAll(':scope > button')].find((b) => !b.hidden && b.offsetParent)?.focus({ preventScroll: true });
}
function closeMore() {
  if (more.hidden) return;
  more.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); moreBtn.classList.remove('open');
  if (fitLater) fitSoon();
}
moreBtn.onclick = () => (more.hidden ? openMore() : closeMore());
menuKeys(more, () => { closeMore(); moreBtn.focus(); });
// A choice closes it; the wheel button opens its own menu beside it, so that one stays.
more.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.parentNode === more && b.id !== 'wheel-btn') closeMore(); });
document.addEventListener('pointerdown', (e) => {
  const t = e.target;
  if (menu && !menu.el.contains(t) && !menu.anchor.contains(t)) closeMenu();
  if (!more.hidden && !more.contains(t) && !moreBtn.contains(t) && !t.closest?.('#wheel-menu')) closeMore();
}, true);
// Esc closes an open menu before anything else hears it.
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || (!menu && more.hidden)) return;
  e.preventDefault(); e.stopPropagation();
  const a = menu ? menu.anchor : moreBtn; closeMenu(); closeMore(); if (a.isConnected) a.focus();
}, true);

// ---------------------------------------------------------------- Focus
let fsOurs = false; // the browser went full screen because Focus asked
const fullToo = () => !!store.get('settings', {})?.focusFull; // Settings › Appearance › Focus
/** Focus on or off. gesture: called from a key or a click, so full screen may be asked for. */
export function setFocus(on, { gesture = false, quiet = false } = {}) {
  if (!inFeed() && on) setView('feed');
  if (!!state.focus === on) return;
  keep('focus', on);
  if (on && gesture && fullToo() && !document.fullscreenElement && R.requestFullscreen) {
    R.requestFullscreen({ navigationUI: 'hide' }).then(() => { fsOurs = true; }, () => {});
  }
  if (!on && fsOurs) { fsOurs = false; if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }
  apply(true);
  if (!quiet) toast(on ? 'Focus' : 'Bars back', on ? { icon: 'maximize', kind: 'mode', sub: 'd shows the bars over the pages · Esc leaves' } : { icon: 'maximize', kind: 'edge' });
}
// Esc in full screen belongs to the browser: it leaves full screen, and Focus with it.
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && fsOurs) { fsOurs = false; if (state.focus) setFocus(false, { quiet: true }); } });
function paintFocusBtn() {
  const f = focusOn();
  focusBtn.innerHTML = svg(f ? MIN : MAX);
  focusBtn.classList.toggle('on', f);
  focusBtn.setAttribute('aria-pressed', String(f));
  focusBtn.title = f ? 'Leave Focus (Esc or this button)' : 'Focus: only the pages, no bars or side panel (d) · Esc leaves';
  focusBtn.setAttribute('aria-label', f ? 'Leave Focus' : 'Focus');
}
focusBtn.onclick = (e) => { e.currentTarget.blur(); setFocus(!focusOn(), { gesture: true }); };

// The header over the pages: pointing at the top edge (or leaving the window
// through it), or d. It goes again once the pointer is well below it, unless a
// menu, a sheet or keyboard focus holds it.
let peekBy = null, peekAt = null, hideT = 0, lastXY = null;
const isOpen = (s) => { const el = document.querySelector(s); return !!el && !el.hidden; };
const held = () => !!menu || !more.hidden || !!$('#wheel-menu') || !!bar.querySelector(':focus-visible')
  || isOpen('#st') || isOpen('#saved') || isOpen('#xp');
function setPeek(on, by = null) {
  clearTimeout(hideT); hideT = 0;
  if (on && !focusOn()) on = false;
  peekBy = on ? by : null; peekAt = on ? lastXY : null;
  if (on === R.classList.contains('head-peek')) return;
  R.classList.toggle('head-peek', on);
  if (!on) { closeMenu(); closeMore(); }
  emit('header:changed', headState());
}
addEventListener('pointermove', (e) => {
  if (!R.classList.contains('focus') || e.pointerType === 'touch') return;
  lastXY = [e.clientX, e.clientY];
  const y = e.clientY;
  if (!R.classList.contains('head-peek')) { if (y <= EDGE) setPeek(true, 'pointer'); return; }
  if (y <= barH + 18 + 30) { clearTimeout(hideT); hideT = 0; return; } // on the bar, the track, or just under them
  if (peekBy === 'key' && peekAt && Math.hypot(e.clientX - peekAt[0], y - peekAt[1]) < 40) return; // shown by d: a nudge does not hide it
  if (!hideT) hideT = setTimeout(() => { hideT = 0; if (!held()) setPeek(false); }, 350);
}, { passive: true });
document.addEventListener('mouseout', (e) => {
  if (!e.relatedTarget && R.classList.contains('focus') && !R.classList.contains('head-peek') && e.clientY <= 40) setPeek(true, 'pointer');
});
// Keyboard focus moving into the bar (Tab) shows it.
bar.addEventListener('focusin', () => { if (R.classList.contains('focus') && !R.classList.contains('head-peek')) setPeek(true, 'key'); });

if (keymap.has('d')) console.warn('header: d is taken; Focus has only its button');
else registerKey('d', () => (focusOn() ? setPeek(!R.classList.contains('head-peek'), 'key') : setFocus(true, { gesture: true })),
  { help: ['d', 'focus: only the pages, no bars or side panel · d again shows the bars over the pages · Esc leaves'], order: 50.5 });
// Esc leaves Focus, after what it already does first (the wheel menu, zoom, Saved; overlays take it before that).
function wrapEsc() {
  const b = keymap.get('Escape'); if (!b || b.fn._hd) return;
  const orig = b.fn;
  b.fn = Object.assign((e) => {
    if (focusOn() && !$('#wheel-menu') && !state.zoom && !isOpen('#saved')) { setFocus(false); return; }
    return orig(e);
  }, { _hd: true });
}
wrapEsc();

// ---------------------------------------------------------------- when things change
addEventListener('resize', () => {
  // Auto crosses its threshold: the classes now, the stage when chrome.js lays it out (150 ms).
  if (headMode() !== shown.head) apply(false); else fitSoon();
});
on('view:changed', () => { apply(true); paintFocusBtn(); });
on('settings:changed', ({ key }) => {
  if (key === 'head' || key === '*') apply(true);
  if (key === 'density' || key === 'hide' || key === '*') fitSoon();
});
on('boot', () => { wrapEsc(); paintViewPick(); paintLanePick(); fit(); });

/** Settings › Appearance › Header (features/settings.js sets state.head with its own setter). */
export function setHeadPref(v) { keep('head', ['two', 'one'].includes(v) ? v : 'auto'); apply(true); }

paintViewPick(); paintLanePick(); paintFocusBtn();
apply(false);
