// Settings: ⌘, (or Ctrl+,) or the gear in the top bar opens a sheet on the
// right with every option, grouped: appearance, text, pages, navigation, side
// panel, AI and cost, read-aloud, data. A change applies at once (the page
// stays visible beside the sheet) and is kept in this browser; each group has
// "Reset", and the header resets everything (both can be undone).
//
// Options the core already had keep their own store keys and state fields
// (font, per, perAuto, crop, cols, flowCols, pin, panel, panelSide, presum,
// wheelMouse, wheelPad, wheelDevice; summodel, autoSum, sumDelay, readaloud,
// wheelTune), so every module and key (+ - [ ] c C p i I W) stays in step.
// The rest live in store 'settings' and reach the page as CSS custom
// properties on :root (ui/features/settings.css reads them; the defaults are
// style.css's), data-st-* attributes and st-hide-* classes on <html>, and a few
// state fields the core reads: state.measure (column width in em, flow.js),
// state.cropPad (render.js), state.pageGap and state.fit (feed.js).
// The daily AI budget lives on the server (routes/85-settings.mjs).
import { $, h, on, emit, store, toast, today, keymap, keyHelp, sections, registerStepper } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { refresh, applyChrome } from '../chrome.js';
import { live, dropLive } from '../flow.js';
import { paintWheel, advance, back, toggleZoom } from '../nav.js';
import { paintPanel } from '../panel.js';
import { MODELS, summaries } from '../summary.js';
import { tune } from '../gesture.js';
import { plan } from '../prefetch.js';

// ---------------------------------------------------------------- options
const DEF = {
  theme: 'reading', bgCustom: '#25282c', accent: '', paper: 'cream', filter: 'none', density: 'comfortable', hide: [],
  fontFamily: 'iowan', lineHeight: 1.5, paraSpace: 0.65, justify: true, hyphens: true, measureCh: 0, imgMax: 42,
  cropPad: 1.2, pageGap: 10, fit: 'page', lowres: true,
  middle: 'wheel', repeat: 'off',
  panelW: 330, secHidden: [], secOrder: [], showSpend: true,
};
// Core options: state field and store key of the same name. The defaults must
// match state.js (and STORE summary.js, RA_DEF readaloud.js, TUNE_DEF gesture.js):
// Reset puts these values back.
const CORE = { font: 15, per: 3, perAuto: true, crop: true, cols: false, flowCols: 0, pin: false, panel: true, panelSide: 'left', presum: true, wheelMouse: 'continue', wheelPad: 'continue', wheelDevice: 'auto' };
// Read straight from the store by summary.js.
const STORE = { autoSum: true, sumDelay: 5000, summodel: 'claude-haiku-5-5' };
const RA_DEF = { rate: 1.5, engine: 'browser', browserVoice: '', geminiVoice: 'Kore' };
const TUNE_DEF = { rate: 14, stroke: 40 };

let S = { ...DEF, ...store.get('settings', {}) };
const save = () => store.set('settings', S);

const TOKENS = ['bg', 'bg-2', 'bg-3', 'line', 'ink', 'ink-2', 'ink-3'];
const THEMES = {
  reading: { label: 'Reading room', bg: '#15130f', 'bg-2': '#1d1a15', 'bg-3': '#26221b', line: '#34302a', ink: '#ece6da', 'ink-2': '#a79f91', 'ink-3': '#6f685d' },
  black: { label: 'Near-black', bg: '#0b0b0b', 'bg-2': '#121212', 'bg-3': '#1b1b1b', line: '#2b2b2b', ink: '#e6e4e0', 'ink-2': '#a09d98', 'ink-3': '#69665f' },
  grey: { label: 'Dark grey', bg: '#26272b', 'bg-2': '#2d2e33', 'bg-3': '#36373d', line: '#45464d', ink: '#e8e8ea', 'ink-2': '#abacb2', 'ink-3': '#7a7b82' },
  warm: { label: 'Warm dark', bg: '#211912', 'bg-2': '#2a2018', 'bg-3': '#33281e', line: '#47382b', ink: '#f2e4cd', 'ink-2': '#bba78b', 'ink-3': '#85735d' },
  // Light themes: the faint text (ink-3) keeps 4:1 on every surface, more than the dark themes' 3:1, for a bright room.
  sepia: { label: 'Sepia', light: true, bg: '#eee3cb', 'bg-2': '#e6d9bd', 'bg-3': '#ddcfb0', line: '#cbb994', ink: '#3a2e1f', 'ink-2': '#584a36', 'ink-3': '#6e5f49' },
  light: { label: 'Light', light: true, bg: '#f6f5f2', 'bg-2': '#ecebe7', 'bg-3': '#e3e1dc', line: '#d2cfc8', ink: '#1e1c19', 'ink-2': '#57534c', 'ink-3': '#6f6b64' },
};
// On light backgrounds: status colours dark enough to read as text (4.5:1), and
// a darker amber for the default accent.
const LIGHT_STATUS = { ok: '#286a2a', warn: '#7a5000', bad: '#983626' };
const ACCENT0 = '#e2a54a', ACCENT0_LIGHT = '#86490f';
const ACCENTS = [['#e2a54a', 'Amber'], ['#6aa6e8', 'Blue'], ['#7fb37a', 'Green'], ['#4fb3a9', 'Teal'], ['#a98bdf', 'Violet'], ['#d9776a', 'Red']];
const PAPER_VARS = ['paper', 'paper-ink', 'paper-head', 'paper-ink-2', 'paper-ink-3', 'paper-rule', 'paper-rule-2', 'paper-quote', 'paper-code', 'paper-link'];
const PAPERS = {
  cream: { label: 'Cream', v: ['#f4efe4', '#26211a', '#1a1611', '#4a4236', '#5d5446', '#d8cfbd', '#e2dacb', '#cfc4ad', '#ebe4d6', '#7a4f12'] },
  white: { label: 'White', v: ['#ffffff', '#1b1b1b', '#000000', '#454545', '#666666', '#dddddd', '#e6e6e6', '#cccccc', '#f1f1f1', '#1f57b8'] },
  grey: { label: 'Grey', v: ['#d6d6d2', '#1d1d1b', '#111111', '#3f3f3c', '#5c5c58', '#b6b6b1', '#c2c2bd', '#a6a6a1', '#c8c8c3', '#5e3a0c'] },
  dark: { label: 'Dark, light text', v: ['#22201c', '#d9d2c4', '#ece5d7', '#b1a99b', '#8c8476', '#3b3731', '#34312c', '#4d473f', '#2c2924', '#e2a54a'] },
};
const FONTS = {
  iowan: ['Iowan Old Style', null],
  palatino: ['Palatino', 'Palatino, "Palatino Linotype", "Book Antiqua", "URW Palladio L", serif'],
  charter: ['Charter', 'Charter, "Bitstream Charter", "Charis SIL", Cambria, Georgia, serif'],
  georgia: ['Georgia', 'Georgia, "DejaVu Serif", serif'],
  baskerville: ['Baskerville', 'Baskerville, "Libre Baskerville", "Baskerville Old Face", Georgia, serif'],
  sans: ['Sans', '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif'],
  mono: ['Mono', 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace'],
};
const BAR = [['brand', 'Stacks'], ['views', 'Feed · Wall'], ['lanes', 'Lanes'], ['wheel', 'Wheel mode'], ['search', 'Search'], ['saved', 'Saved'], ['keys', '?'], ['net', 'Status']];

// ---------------------------------------------------------------- colour
const rgb = (x) => { const n = parseInt(x.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, j) => v + (B[j] - v) * t)); };
const lum = (x) => { const [r, g, b] = rgb(x).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/** `from` moved toward `to` just far enough to reach `want` contrast on `on`. */
const reach = (from, to, on, want) => { let c = from; for (let t = 0.05; t <= 1.001 && contrast(c, on) < want; t += 0.05) c = mix(from, to, t); return c; };
/** A full set of tokens from one background colour. Text is black or white,
 *  whichever contrasts more, and fades toward the background only as far as
 *  it stays readable (ink 7:1, ink-2 4.5:1, ink-3 3.2:1 or 4:1 on light, on bg-3). */
function derive(bg) {
  const light = contrast(bg, '#000000') >= contrast(bg, '#ffffff'), to = light ? '#000000' : '#ffffff';
  const b3 = mix(bg, to, 0.08);
  const ink = (t, want) => reach(mix(to, bg, t), to, b3, want);
  return { light, bg, 'bg-2': mix(bg, to, 0.04), 'bg-3': b3, line: mix(bg, to, 0.16), ink: ink(0.1, 7), 'ink-2': ink(0.38, 4.5), 'ink-3': ink(0.58, light ? 4 : 3.2) };
}
/** The accent, moved toward the text colour as needed to read at 4.5:1 on bg-3. */
function accentOf(th) {
  const a = S.accent || (th.light ? ACCENT0_LIGHT : ACCENT0);
  return reach(a, th.light ? '#000000' : '#ffffff', th['bg-3'], 4.5);
}
const themeOf = () => (S.theme === 'custom' ? derive(S.bgCustom) : THEMES[S.theme] || THEMES.reading);

/** Average character width of the column font, in em (for "characters per line"). */
const cem = new Map();
function charEm() {
  const fam = FONTS[S.fontFamily]?.[1] || getComputedStyle(document.documentElement).getPropertyValue('--serif') || 'serif';
  if (!cem.has(fam)) {
    const g = document.createElement('canvas').getContext('2d'); g.font = `100px ${fam}`;
    const t = 'The reader turns a page and the next one is already there, decoded and cropped in memory.';
    cem.set(fam, g.measureText(t).width / t.length / 100 || 0.48);
  }
  return cem.get(fam);
}
const defaultCh = () => Math.round(31 / charEm());

// ---------------------------------------------------------------- applying
function cssVar(name, val) { const st = document.documentElement.style; if (val == null) st.removeProperty(name); else st.setProperty(name, String(val)); }
function applyAll() {
  const R = document.documentElement;
  const th = themeOf();
  for (const t of TOKENS) cssVar('--' + t, S.theme === 'reading' ? null : th[t]);
  R.style.colorScheme = th.light ? 'light' : '';
  R.toggleAttribute('data-st-light', !!th.light);
  const acc = accentOf(th);
  cssVar('--accent', acc === ACCENT0 ? null : acc);
  for (const k of ['ok', 'warn', 'bad']) cssVar('--' + k, th.light ? LIGHT_STATUS[k] : null);
  const pp = S.paper !== 'cream' && PAPERS[S.paper];
  PAPER_VARS.forEach((v, j) => cssVar('--' + v, pp ? pp.v[j] : null));
  R.dataset.stPaper = S.paper; R.dataset.stFilter = S.filter; R.dataset.stDensity = S.density;
  R.dataset.stFit = S.fit; R.dataset.stLowres = S.lowres ? 'on' : 'off';
  for (const [id] of BAR) R.classList.toggle('st-hide-' + id, S.hide.includes(id));
  R.classList.toggle('st-hide-spend', !S.showSpend);
  const d = (k, v) => (S[k] === DEF[k] ? null : v);
  cssVar('--flow-font', FONTS[S.fontFamily]?.[1] || null);
  cssVar('--flow-lh', d('lineHeight', S.lineHeight));
  cssVar('--flow-para', d('paraSpace', S.paraSpace + 'em'));
  cssVar('--flow-align', S.justify ? null : 'left');
  cssVar('--flow-hyphens', S.hyphens ? null : 'manual');
  cssVar('--flow-img-h', d('imgMax', S.imgMax + 'vh'));
  cssVar('--page-gap', d('pageGap', S.pageGap + 'px'));
  cssVar('--panel-w', d('panelW', S.panelW + 'px'));
  const sd = store.get('sumDelay', 5000); cssVar('--sum-delay', sd === 5000 ? null : sd / 1000 + 's');
  state.measure = S.measureCh ? S.measureCh * charEm() : undefined;
  state.cropPad = S.cropPad === DEF.cropPad ? undefined : S.cropPad / 100;
  state.pageGap = S.pageGap; state.fit = S.fit;
  const barB = Math.round($('#bar').getBoundingClientRect().bottom);
  cssVar('--st-bar-h', S.density === 'comfortable' ? null : barB + 'px'); // Saved and the export tray sit under the bar
  if (sheet) sheet.style.top = barB + 'px';
}

/** Lay the stage out again: flow documents are typeset afresh at the same place. */
let rlT = 0;
function relayout(now = false) {
  clearTimeout(rlT);
  rlT = setTimeout(() => {
    dropLive();
    if (state.view !== 'feed') return; // the feed lays itself out when it is shown again
    const i = current(); if (i == null) return;
    if (live && live.id === items[i]?.id) state.pendingVp = live.first[state.start.get(i) ?? 0] ?? 0;
    state.hist.set(i, []);
    refresh();
  }, now ? 0 : 110);
}
let ppT = 0;
const repaintPanel = () => { clearTimeout(ppT); ppT = setTimeout(() => { const i = current(); if (i != null && state.view === 'feed' && state.panel) paintPanel(i); }, 60); };

const LAYOUT = new Set(['fontFamily', 'lineHeight', 'paraSpace', 'justify', 'hyphens', 'measureCh', 'imgMax', 'cropPad', 'pageGap', 'fit', 'panelW', 'density']);
function setS(k, v) {
  S[k] = v; save(); applyAll();
  if (LAYOUT.has(k)) relayout();
  if (k === 'secHidden' || k === 'secOrder') { applySections(); repaintPanel(); }
  if (k === 'repeat') applyRepeat();
  emit('settings:changed', { key: k, value: v });
}
function setCore(k, v, quiet = false) {
  state[k] = v; store.set(k, v);
  if (quiet) return;
  if (k.startsWith('wheel')) paintWheel();
  if (k === 'pin' || k === 'panel' || k === 'panelSide') { applyChrome(); relayout(); }
  if (['font', 'flowCols', 'per', 'perAuto', 'crop', 'cols'].includes(k)) relayout();
  if (k === 'presum') repaintPanel();
  emit('settings:changed', { key: k, value: v });
}

// ---------- side panel sections: shown or not, and their order ----------
const ORIG = new Map(); // id -> { order, render }
function applySections() {
  for (const s of sections) {
    if (ORIG.has(s.id)) continue;
    const o = { order: s.order ?? 50, render: s.render };
    ORIG.set(s.id, o);
    s.render = function (it, i) { return S.secHidden.includes(s.id) ? null : o.render.call(this, it, i); };
  }
  const listed = S.secOrder.filter((id) => ORIG.has(id));
  const slots = listed.map((id) => ORIG.get(id).order).sort((a, b) => a - b);
  for (const s of sections) s.order = ORIG.get(s.id).order;
  listed.forEach((id, j) => { sections.find((s) => s.id === id).order = slots[j] + j * 0.001; });
  sections.sort((a, b) => a.order - b.order);
}

// ---------- key auto-repeat ----------
const REPEAT = {
  off: [],
  pages: ['l', 'h', 'ArrowRight', 'ArrowLeft'],
  items: ['l', 'h', 'ArrowRight', 'ArrowLeft', 'j', 'k', 'ArrowDown', 'ArrowUp', ' ', 'PageDown', '[', ']', '+', '=', '-'],
};
const repOrig = new Map(); // binding -> its own repeat flag
function applyRepeat() {
  const on = new Set(REPEAT[S.repeat] || []);
  for (const [k, b] of keymap) { if (!repOrig.has(b)) repOrig.set(b, !!b.repeat); b.repeat = repOrig.get(b) || on.has(k); }
}

// ---------- middle click ----------
addEventListener('mousedown', (e) => {
  if (e.button !== 1 || S.middle === 'wheel' || !e.target.closest?.('#stage') || e.target.closest('a')) return;
  e.preventDefault(); e.stopPropagation();
  if (state.view !== 'feed') return;
  if (S.middle === 'advance') advance({ fresh: true });
  else if (S.middle === 'back') back({});
  else if (S.middle === 'zoom') {
    if (state.zoom) toggleZoom(false);
    else { const pg = e.target.closest('#spread .pg[data-k]'); toggleZoom(true, pg ? Number(pg.dataset.k) : undefined); }
  }
}, true);

// ---------- fit width: the spread scrolls; Advance and the wheel scroll first ----------
const scroller = () => {
  const sp = $('#spread');
  return S.fit === 'width' && state.view === 'feed' && sp && !sp.classList.contains('flowmode') && sp.scrollHeight > sp.clientHeight + 4 ? sp : null;
};
registerStepper((dir) => {
  const sp = scroller(); if (!sp) return false;
  const room = dir > 0 ? sp.scrollHeight - sp.clientHeight - sp.scrollTop : sp.scrollTop;
  if (room < 8) return false;
  sp.scrollTop += dir * Math.min(room, Math.round(sp.clientHeight * 0.85));
  return true;
}, 5);
let wsT = 0;
$('#spread').addEventListener('wheel', (e) => {
  const sp = scroller(); if (!sp || e.ctrlKey) return;
  const dy = e.shiftKey ? 0 : e.deltaY;
  if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return; // sideways: pages, as always
  const can = dy > 0 ? sp.scrollTop + sp.clientHeight < sp.scrollHeight - 2 : sp.scrollTop > 1;
  const now = performance.now();
  if (can) { wsT = now; e.stopPropagation(); return; } // a native scroll within the pages
  if (now - wsT < 220) { wsT = now; e.stopPropagation(); e.preventDefault(); } // the rest of a scroll that hit the edge: a pause, then the wheel steps again
}, { passive: false });
let lastSpread = '';
on('spread:rendered', ({ i, s }) => {
  const k = i + '|' + s;
  if (k !== lastSpread && S.fit === 'width') $('#spread').scrollTop = 0;
  lastSpread = k;
});

// ---------------------------------------------------------------- the sheet
let sheet = null, gear = null, serverInfo = null, gem = { enabled: false, voices: [] }, RA = null, undoSnap = null;
const ups = []; // control updaters
const upd = (fn) => { ups.push(fn); try { fn(); } catch (e) { console.error(e); } };
function sync() { for (const f of ups) { try { f(); } catch (e) { console.error('settings', e); } } }

const kb = (k) => h('kbd', { textContent: k });
function row(label, hint, ...controls) {
  const r = h('div', { className: 'st-row' },
    h('div', { className: 'st-l' }, h('div', { className: 'st-lt', textContent: label }), hint ? h('div', { className: 'st-hint' }, ...[].concat(hint)) : null),
    h('div', { className: 'st-c' }, ...controls));
  return r;
}
function seg(opts, get, set, { disabled } = {}) {
  const bs = opts.map(([v, label, tip]) => h('button', { type: 'button', textContent: label, title: tip || '', onclick: () => { set(v); sync(); } }));
  upd(() => bs.forEach((b, j) => {
    const on = get() === opts[j][0];
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    if (disabled) b.disabled = !!disabled(opts[j][0]);
  }));
  return h('div', { className: 'st-seg', role: 'group' }, ...bs);
}
function tog(get, set, words = ['On', 'Off']) {
  const b = h('button', { type: 'button', className: 'st-tog', role: 'switch', onclick: () => { set(!get()); sync(); } });
  const l = h('span', { className: 'st-togl' });
  upd(() => { const on = !!get(); b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); l.textContent = on ? words[0] : words[1]; });
  return [b, l];
}
function slider([min, max, step], get, set, fmt) {
  const r = h('input', { type: 'range', min, max, step });
  const out = h('span', { className: 'st-val' });
  r.oninput = () => { set(Number(r.value)); out.textContent = fmt(Number(r.value)); };
  r.onchange = () => sync();
  upd(() => { if (document.activeElement !== r) r.value = String(get()); out.textContent = fmt(get()); });
  return [r, out];
}
/** Grey out a row while `off()` holds. */
function dim(r, off) { upd(() => { const o = !!off(); r.classList.toggle('off', o); r.querySelectorAll('input, button, select').forEach((x) => { x.disabled = o; }); }); return r; }
const swatch = (cls, color, label, title, onclick, inner = '') => h('button', { type: 'button', className: 'st-sw ' + cls, title: title || label, onclick }, h('i', { style: color, textContent: inner }), label ? h('span', { textContent: label }) : null);

// ---------- sections ----------
function secAppearance() {
  const themes = Object.entries(THEMES).map(([k, t]) => {
    const b = swatch('', `background:${t.bg};color:${t.ink}`, t.label, '', () => { setS('theme', k); sync(); }, 'Aa');
    upd(() => b.classList.toggle('on', S.theme === k));
    return b;
  });
  const custom = h('input', { type: 'color', oninput: (e) => { S.bgCustom = e.target.value; setS('theme', 'custom'); sync(); } });
  const cb = h('label', { className: 'st-sw st-cust', title: 'Pick any background colour' }, custom, h('span', { textContent: 'Custom' }));
  upd(() => { custom.value = S.bgCustom; cb.classList.toggle('on', S.theme === 'custom'); });
  const accents = [['', 'Theme'], ...ACCENTS].map(([c, label]) => {
    const b = swatch('dot', `background:${c || 'linear-gradient(135deg,#e2a54a 50%,#a8631a 50%)'}`, '', label + (c ? '' : ' (amber; darker on light backgrounds)'), () => { setS('accent', c); sync(); });
    upd(() => b.classList.toggle('on', S.accent === c));
    return b;
  });
  const accIn = h('input', { type: 'color', oninput: (e) => { setS('accent', e.target.value); sync(); } });
  const accL = h('label', { className: 'st-sw st-cust', title: 'Pick any accent colour' }, accIn, h('span', { textContent: 'Custom' }));
  upd(() => { accIn.value = S.accent || '#e2a54a'; accL.classList.toggle('on', !!S.accent && !ACCENTS.some(([c]) => c === S.accent)); });
  const papers = Object.entries(PAPERS).map(([k, p]) => {
    const b = swatch('', `background:${p.v[0]};color:${p.v[1]}`, p.label, '', () => { setS('paper', k); sync(); }, 'Aa');
    upd(() => b.classList.toggle('on', S.paper === k));
    return b;
  });
  const chips = BAR.map(([id, label]) => {
    const b = h('button', { type: 'button', className: 'st-chip', textContent: label, title: 'Show or hide in the top bar', onclick: () => { setS('hide', S.hide.includes(id) ? S.hide.filter((x) => x !== id) : [...S.hide, id]); sync(); } });
    upd(() => b.classList.toggle('on', !S.hide.includes(id)));
    return b;
  });
  return {
    id: 'appearance', title: 'Appearance',
    keys: ['theme', 'bgCustom', 'accent', 'paper', 'filter', 'density', 'hide'],
    rows: [
      row('Background', 'The room around the pages.', ...themes, cb),
      row('Accent', 'Highlights, the current page, links.', ...accents, accL),
      row('Paper for posts', 'Posts and web pages laid out in columns.', ...papers),
      row('Scanned and PDF pages', 'Dim or invert page images for a dark room. Inverting keeps colours roughly right (hue turned back).',
        seg([['none', 'As they are'], ['dim', 'Dimmed'], ['invert', 'Inverted']], () => S.filter, (v) => setS('filter', v)),
        h('div', { className: 'st-pages' }, h('i'), h('i'))),
      row('Density', 'Spacing of the top bar and the side panel.', seg([['compact', 'Compact'], ['comfortable', 'Comfortable'], ['roomy', 'Roomy']], () => S.density, (v) => setS('density', v))),
      row('Top bar', 'Click to show or hide. The gear always stays.', ...chips),
    ],
  };
}

function secText() {
  const sample = h('div', { className: 'st-sample' }, h('div', { className: 'in' },
    h('h4', { textContent: 'The map is not the territory' }),
    h('p', { textContent: 'A summary is a compression of a document, and like every compression it throws something away. The question is never whether to lose information but which information to lose, and whether the reader would have chosen the same.' }),
    h('blockquote', { textContent: 'Read the best page first; decide in a minute whether the rest deserves an hour.' }),
    h('p', {}, 'Typesetting matters more on a large screen: long lines tire the eye, and ', h('a', { href: '#', onclick: (e) => e.preventDefault(), textContent: 'columns' }), ' bring the measure back to something a reader can follow.')));
  upd(() => {
    sample.style.fontSize = state.font + 'px';
    sample.firstChild.style.maxWidth = (state.measure || 31) + 'em';
  });
  const fonts = Object.entries(FONTS).map(([k, [label, stack]]) => {
    const b = h('button', { type: 'button', className: 'st-font', title: label, onclick: () => { setS('fontFamily', k); sync(); } }, h('b', { textContent: 'Aa', style: `font-family:${stack || 'var(--serif)'}` }), label);
    upd(() => b.classList.toggle('on', S.fontFamily === k));
    return b;
  });
  const measure = dim(row('Column width', 'When columns are automatic: about this many characters per line.',
    ...slider([36, 110, 2], () => S.measureCh || defaultCh(), (v) => setS('measureCh', v), (v) => `${v} chars${S.measureCh ? '' : ' (default)'}`)), () => state.flowCols);
  return {
    id: 'text', title: 'Text', note: 'posts and web pages, laid out in columns',
    keys: ['fontFamily', 'lineHeight', 'paraSpace', 'justify', 'hyphens', 'measureCh', 'imgMax'], core: ['font', 'flowCols'],
    rows: [
      sample,
      row('Font', null, ...fonts),
      row('Size', ['Same as ', kb('['), ' ', kb(']'), '.'], ...slider([11, 24, 1], () => state.font, (v) => setCore('font', v), (v) => v + ' px')),
      row('Line height', null, ...slider([1.2, 2.0, 0.05], () => S.lineHeight, (v) => setS('lineHeight', v), (v) => v.toFixed(2))),
      row('Paragraph spacing', null, ...slider([0, 1.5, 0.05], () => S.paraSpace, (v) => setS('paraSpace', v), (v) => v.toFixed(2) + ' em')),
      row('Justify', 'Even right edges; off: ragged right.', ...tog(() => S.justify, (v) => setS('justify', v), ['Justified', 'Ragged right'])),
      row('Hyphenation', null, ...tog(() => S.hyphens, (v) => setS('hyphens', v))),
      row('Columns', ['Automatic fits as many as the width allows; ', kb('+'), ' ', kb('-'), ' change it.'],
        seg([[0, 'Auto'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']], () => state.flowCols || 0, (v) => setCore('flowCols', v))),
      measure,
      row('Largest image', 'Tallest an image or figure may be, as a share of the screen.', ...slider([20, 90, 2], () => S.imgMax, (v) => setS('imgMax', v), (v) => v + '% height')),
    ],
  };
}

function secPages() {
  return {
    id: 'pages', title: 'Pages', note: 'PDFs and scans',
    keys: ['cropPad', 'pageGap', 'fit', 'lowres'], core: ['per', 'perAuto', 'crop', 'cols'],
    rows: [
      row('Pages per spread', ['Fit shows 1 to 3, whatever fills the screen; ', kb('+'), ' ', kb('-'), ' ', kb('='), ' change it.'],
        seg([['fit', 'Fit'], ...[1, 2, 3, 4, 5, 6].map((n) => [n, String(n)])], () => (state.perAuto ? 'fit' : state.per), (v) => {
          if (v === 'fit') setCore('perAuto', true); else { setCore('perAuto', false, true); setCore('per', v); }
        })),
      row('Fit', 'Width: pages fill the width and scroll; Space and the wheel scroll down before turning.',
        seg([['page', 'Whole page'], ['width', 'Width']], () => S.fit, (v) => setS('fit', v))),
      row('Crop margins', ['Trim the white border around the text. ', kb('C')], ...tog(() => state.crop, (v) => setCore('crop', v))),
      dim(row('Crop padding', 'White kept around the text when cropping.', ...slider([0, 6, 0.2], () => S.cropPad, (v) => setS('cropPad', v), (v) => v.toFixed(1) + '%')), () => !state.crop),
      row('Split two-column pages', ['Show each column of a two-column page as its own panel. ', kb('c')], ...tog(() => state.cols, (v) => setCore('cols', v))),
      row('Gap between pages', null, ...slider([0, 48, 2], () => S.pageGap, (v) => setS('pageGap', v), (v) => v + ' px')),
      row('Low-res previews', 'A blurry preview of a scanned page while the sharp one loads; off: a blank page.', ...tog(() => S.lowres, (v) => setS('lowres', v))),
    ],
  };
}

function secNav() {
  return {
    id: 'nav', title: 'Navigation and input',
    keys: ['middle', 'repeat'], core: ['wheelMouse', 'wheelPad', 'wheelDevice', 'pin'], tune: true,
    rows: [
      row('Mouse wheel', ['Continue: down Advances (next spread, then next item), up goes Back. ', kb('W'), ' cycles.'],
        seg([['continue', 'Continue'], ['items', 'Items'], ['pages', 'Pages']], () => state.wheelMouse, (v) => setCore('wheelMouse', v))),
      row('Trackpad', 'Two-way: vertical strokes move between items, sideways strokes turn pages.',
        seg([['2d', 'Two-way'], ['continue', 'Continue']], () => state.wheelPad, (v) => setCore('wheelPad', v))),
      row('Which device', 'Detect tells a notched wheel from a trackpad per gesture.',
        seg([['auto', 'Detect'], ['mouse', 'Always mouse'], ['pad', 'Always trackpad']], () => state.wheelDevice, (v) => setCore('wheelDevice', v))),
      row('Wheel pace', 'At most this many steps a second while the wheel spins.',
        ...slider([2, 12, 1], () => tune.rate, (v) => setTune('rate', v), (v) => v + ' / s')),
      row('Trackpad stroke', 'How far a stroke travels before it counts; shorter is more sensitive.',
        ...slider([16, 120, 4], () => tune.stroke, (v) => setTune('stroke', v), (v) => v + ' px')),
      row('Middle click', 'On the pages.',
        seg([['wheel', 'Cycle wheel mode'], ['advance', 'Next page'], ['back', 'Go back'], ['zoom', 'Zoom'], ['none', 'Nothing']], () => S.middle, (v) => setS('middle', v))),
      row('Holding a key', 'Off: one press, one step. Otherwise a held key repeats.',
        seg([['off', 'One step'], ['pages', 'Repeat page turns'], ['items', 'Repeat turns and items']], () => S.repeat, (v) => setS('repeat', v))),
      row('Page strip', ['Keep the thumbnails open under the pages. ', kb('p')], ...tog(() => state.pin, (v) => setCore('pin', v), ['Pinned', 'Hidden'])),
    ],
  };
}
function setTune(k, v) { tune[k] = v; const t = store.get('wheelTune', {}); if (v === TUNE_DEF[k]) delete t[k]; else t[k] = v; store.set('wheelTune', t); }

function secPanel() {
  const list = h('div', { className: 'st-secs' });
  let sig = '';
  const paintList = () => {
    applySections();
    const ids = sections.map((s) => s.id);
    const now = ids.join() + '|' + S.secHidden.join();
    if (now === sig) return;
    sig = now;
    list.replaceChildren(...sections.map((s, j) => {
      const shown = !S.secHidden.includes(s.id);
      const move = (d) => { const o = ids.slice(); [o[j], o[j + d]] = [o[j + d], o[j]]; setS('secOrder', o); paintList(); };
      return h('div', { className: shown ? '' : 'hid' },
        h('input', { type: 'checkbox', checked: shown, title: shown ? 'Shown' : 'Hidden', onchange: () => { setS('secHidden', shown ? [...S.secHidden, s.id] : S.secHidden.filter((x) => x !== s.id)); paintList(); } }),
        h('span', { className: 't', textContent: s.title || s.id }),
        h('button', { type: 'button', textContent: '↑', title: 'Move up', disabled: j === 0, onclick: () => move(-1) }),
        h('button', { type: 'button', textContent: '↓', title: 'Move down', disabled: j === sections.length - 1, onclick: () => move(1) }));
    }));
  };
  upd(paintList);
  return {
    id: 'panel', title: 'Side panel',
    keys: ['panelW', 'secHidden', 'secOrder'], core: ['panel', 'panelSide', 'presum'], store: ['autoSum', 'sumDelay'],
    rows: [
      row('Side panel', [kb('i'), ' hides and shows it.'], ...tog(() => state.panel, (v) => setCore('panel', v), ['Shown', 'Hidden'])),
      row('Side', [kb('I'), ' moves it.'], seg([['left', 'Left'], ['right', 'Right']], () => state.panelSide, (v) => setCore('panelSide', v))),
      row('Width', null, ...slider([240, 640, 10], () => S.panelW, (v) => setS('panelW', v), (v) => v + ' px')),
      row('Sections', 'Untick to hide; arrows reorder. A hidden section is not computed (hiding Summary stops summaries).', list),
      row('Automatic summaries', ['Summarize an item after you stay on it; off: only on ', kb('a'), '.'], ...tog(() => store.get('autoSum', true), (v) => { store.set('autoSum', v); repaintPanel(); })),
      dim(row('After', null, ...slider([1, 30, 1], () => store.get('sumDelay', 5000) / 1000, (v) => { store.set('sumDelay', v * 1000); applyAll(); repaintPanel(); }, (v) => v + ' s')), () => !store.get('autoSum', true)),
      row('Summarize ahead', 'Also summarize the next two items in the background (stops near the daily budget).', ...tog(() => state.presum, (v) => setCore('presum', v))),
    ],
  };
}

const cents = (usd) => (usd < 0.01 ? '<1¢' : usd < 1 ? Math.round(usd * 100) + '¢' : '$' + usd.toFixed(2));
function secAI() {
  const est = (id) => { const p = serverInfo?.prices?.[id]; return p ? ` ≈ ${cents((20000 * p[0] + 1500 * p[1]) / 1e6)}` : ''; };
  const models = seg(MODELS.map(([id, label]) => [id, label + est(id), 'Per summary of about 20,000 words read']),
    () => store.get('summodel', null) || state.status.model || STORE.summodel, setModel);
  const num = h('input', { type: 'number', min: 0, max: 1000, step: 0.5, title: 'US dollars a day', onchange: () => setBudget(num.value === '' ? null : Number(num.value)) });
  const quick = [1, 3, 10, 25].map((v) => h('button', { type: 'button', className: 'st-btn', textContent: '$' + v, onclick: () => setBudget(v) }));
  const dflt = h('button', { type: 'button', className: 'st-btn', onclick: () => setBudget(null) });
  const spent = h('span', { className: 'st-msg' });
  upd(() => {
    const b = serverInfo?.budget ?? state.status.spend?.budget;
    if (document.activeElement !== num && b != null) num.value = String(b);
    dflt.textContent = `Default ($${serverInfo?.envBudget ?? 3})`;
    dflt.classList.toggle('on', serverInfo ? !serverInfo.override : false);
    const sp = state.status.spend;
    spent.textContent = sp ? `Today: $${sp.today.toFixed(2)} of $${Number(sp.budget).toFixed(2)} · ${sp.calls} call${sp.calls === 1 ? '' : 's'}` : '';
  });
  return {
    id: 'ai', title: 'AI and cost', store: ['summodel'], keys: ['showSpend'], server: true,
    rows: [
      row('Model', 'For summaries and questions. Haiku is cheapest; the estimate is per summary.', models),
      row('Daily budget', 'Summaries stop for the day when it is reached. Kept on the server.', h('span', {}, '$'), num, ...quick, dflt),
      row('Spent', null, spent),
      row('Show spend', 'Today’s spend under the summary.', ...tog(() => S.showSpend, (v) => setS('showSpend', v))),
    ],
  };
}
function setModel(m) {
  store.set('summodel', m);
  const i = current(); const it = items[i];
  if (it) { summaries.delete(it.id); state.marks.delete(it.id); }
  repaintPanel(); sync();
}
async function setBudget(usd) {
  try {
    const r = await fetch('/settings/budget', { method: 'POST', body: JSON.stringify({ usd }) });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    serverInfo = j;
    if (state.status.spend) state.status.spend.budget = j.budget;
    toast(`AI budget: $${j.budget} a day`, { icon: 'wallet', kind: 'ok', sub: j.override ? '' : 'the default' });
  } catch (e) { toast('Budget not changed', 3000, { icon: 'circle-alert', kind: 'bad', sub: e.message }); }
  sync(); repaintPanel();
}

let voicesFill = null, voicesHooked = false;
function secVoice() {
  if (!RA?.readAloudPrefs) return { id: 'voice', title: 'Read-aloud', rows: [row('Read-aloud', 'The read-aloud feature did not load.')] };
  const P = RA.readAloudPrefs;
  const SPEEDS = RA.SPEEDS || [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  const voice = h('select', { title: 'Voice', onchange: () => { RA.setReadVoice(voice.value); sync(); } });
  let sig = '';
  const fill = () => {
    const all = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : [];
    const base = (navigator.language || 'en').slice(0, 2).toLowerCase();
    const mine = all.filter((v) => v.lang.toLowerCase().startsWith(base) || v.voiceURI === P.browserVoice);
    const now = [P.engine, P.geminiVoice, P.browserVoice, all.length, gem.voices?.length].join('|');
    if (now === sig) return;
    sig = now;
    const opts = P.engine === 'gemini'
      ? (gem.voices?.length ? gem.voices : ['Kore', 'Puck', 'Charon', 'Aoede', 'Gacrux', 'Achird', 'Autonoe', 'Erinome']).map((n) => h('option', { value: 'g:' + n, textContent: n }))
      : [h('option', { value: 'b:', textContent: 'The browser’s default voice' }), ...mine.map((v) => h('option', { value: 'b:' + v.voiceURI, textContent: v.name + (v.localService ? '' : ' (online)') }))];
    voice.replaceChildren(...opts);
    voice.value = P.engine === 'gemini' ? 'g:' + P.geminiVoice : 'b:' + (mine.some((v) => v.voiceURI === P.browserVoice) ? P.browserVoice : '');
  };
  voicesFill = fill; // one listener for the life of the page, filling the current sheet's list
  if (!voicesHooked && typeof speechSynthesis !== 'undefined') { voicesHooked = true; speechSynthesis.addEventListener?.('voiceschanged', () => voicesFill?.()); }
  upd(fill);
  const msg = h('span', { className: 'st-msg' });
  const hear = h('button', { type: 'button', className: 'st-btn', textContent: 'Hear it', onclick: () => sample(msg) });
  return {
    id: 'voice', title: 'Read-aloud', readaloud: true,
    rows: [
      row('Voice engine', gem.enabled ? 'Gemini voices sound better and cost a little; the browser’s are free and instant.' : 'Gemini voices need GEMINI_API_KEY set where the server runs.',
        seg([['browser', 'This browser'], ['gemini', 'Gemini']], () => P.engine, (v) => RA.setReadVoice(v === 'gemini' ? 'g:' + P.geminiVoice : 'b:' + P.browserVoice), { disabled: (v) => v === 'gemini' && !gem.enabled })),
      row('Voice', null, voice, hear, msg),
      row('Speed', [kb('<'), ' ', kb('>'), ' change it while reading.'], seg(SPEEDS.map((v) => [v, v + '×']), () => P.rate, (v) => RA.setReadRate(v))),
    ],
  };
}
async function sample(msg) {
  const P = RA.readAloudPrefs;
  const text = `This is how the reading voice sounds, at ${P.rate} times.`;
  msg.textContent = ''; msg.className = 'st-msg';
  try {
    if (P.engine === 'gemini') {
      msg.textContent = 'Fetching…';
      const r = await fetch('/tts', { method: 'POST', body: JSON.stringify({ text, voice: P.geminiVoice, priority: 'now' }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'HTTP ' + r.status);
      const a = new Audio(URL.createObjectURL(await r.blob())); a.playbackRate = P.rate; await a.play(); msg.textContent = '';
    } else {
      if (typeof speechSynthesis === 'undefined') throw new Error('this browser has no voices');
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = speechSynthesis.getVoices().find((x) => x.voiceURI === P.browserVoice); if (v) u.voice = v;
      u.rate = Math.min(P.rate, 4); speechSynthesis.speak(u);
    }
  } catch (e) { msg.textContent = 'Could not play: ' + e.message; msg.className = 'st-msg bad'; }
}

const size = (b) => (b >= 1024 ** 3 ? (b / 1024 ** 3).toFixed(1) + ' GB' : (b / 1024 ** 2).toFixed(0) + ' MB');
function secData() {
  const meter = h('div', { className: 'st-meter' }, h('i'));
  const used = h('span', { className: 'st-msg' });
  const q = h('span', { className: 'st-msg' });
  const qmsg = h('span', { className: 'st-msg' });
  upd(() => {
    const s = state.status;
    if (s.cacheBytes != null) {
      used.textContent = `${size(s.cacheBytes)} of ${size(s.cacheMax)} · ${(s.cacheEntries || 0).toLocaleString()} files`;
      meter.firstChild.style.width = Math.min(100, (100 * s.cacheBytes) / (s.cacheMax || 1)) + '%';
    } else used.textContent = 'No cache figures from the server.';
    q.textContent = `${s.queue || 0} queued · ${s.active || 0} fetching`;
  });
  const file = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async () => {
    const f = file.files[0]; file.value = ''; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!j || typeof j !== 'object' || !('settings' in j)) throw new Error('not a settings file'); undoSnap = snapshot(); await restore(j); flash('Settings imported.', true); } catch (e) { flash('Could not import: ' + e.message); }
  } });
  return {
    id: 'data', title: 'Data and cache',
    rows: [
      row('Disk cache', 'Everything opened is kept on disk; past the limit (STACKS_CACHE_MAX) the oldest files go first.', meter, used),
      row('Prefetch queue', 'Pages and items the server is fetching ahead of you.', q,
        h('button', { type: 'button', className: 'st-btn', textContent: 'Clear the queue', onclick: () => clearQueue(qmsg) }), qmsg),
      row('Settings file', 'Everything on this sheet, to keep or to move to another browser.',
        h('button', { type: 'button', className: 'st-btn', textContent: 'Export…', onclick: exportJson }),
        h('button', { type: 'button', className: 'st-btn', textContent: 'Import…', onclick: () => file.click() }), file),
      row('Reading stats', null, h('a', { href: '/stats.html', target: '_blank', rel: 'noopener', textContent: 'Open the stats page ↗' })),
    ],
  };
}
async function clearQueue(msg) {
  plan([]); // the page's own render plan
  try {
    const j = await (await fetch('/settings/clear-queue', { method: 'POST' })).json();
    Object.assign(state.status, { queue: j.queue, active: j.active });
    msg.textContent = `Dropped ${j.dropped}.`; msg.className = 'st-msg ok';
  } catch (e) { msg.textContent = 'Failed: ' + e.message; msg.className = 'st-msg bad'; }
  sync();
}

// ---------- snapshot, reset, export ----------
function snapshot() {
  return {
    app: 'stacks-browser', kind: 'settings', version: 1, at: new Date().toISOString(),
    settings: { ...S },
    core: Object.fromEntries(Object.keys(CORE).map((k) => [k, state[k]])),
    store: { ...Object.fromEntries(Object.keys(STORE).map((k) => [k, store.get(k, STORE[k])])), readaloud: { ...RA_DEF, ...store.get('readaloud', {}) }, wheelTune: store.get('wheelTune', {}) },
    server: { dailyBudget: serverInfo?.override ? serverInfo.budget : null },
  };
}
/** Apply a snapshot (or parts of one): import, reset and undo all come here. */
async function restore(j, only = null) {
  if (j.settings) { for (const k of Object.keys(DEF)) if (!only || only.k?.includes(k)) S[k] = j.settings[k] ?? DEF[k]; save(); }
  if (j.core) for (const k of Object.keys(CORE)) if (!only || only.core?.includes(k)) setCore(k, j.core[k] ?? CORE[k], true);
  if (j.store) {
    for (const k of Object.keys(STORE)) if (!only || only.store?.includes(k)) { const v = j.store[k] ?? STORE[k]; if (k === 'summodel') setModel(v); else store.set(k, v); }
    if ((!only || only.readaloud) && RA?.readAloudPrefs) { Object.assign(RA.readAloudPrefs, RA_DEF, j.store.readaloud || {}); store.set('readaloud', RA.readAloudPrefs); RA.setReadRate?.(RA.readAloudPrefs.rate); }
    if (!only || only.tune) { const t = j.store.wheelTune || {}; for (const k of Object.keys(TUNE_DEF)) tune[k] = t[k] ?? TUNE_DEF[k]; store.set('wheelTune', t); }
  }
  if (j.server && (!only || only.server)) await setBudget(j.server.dailyBudget ?? null);
  cem.clear();
  applyAll(); applyChrome(); paintWheel(); applySections(); applyRepeat();
  relayout(true); repaintPanel(); sync();
  emit('settings:changed', { key: '*' });
}
const DEFAULTS = () => ({ settings: { ...DEF }, core: { ...CORE }, store: { ...STORE, readaloud: { ...RA_DEF }, wheelTune: {} }, server: { dailyBudget: null } });
async function resetSection(sec) {
  undoSnap = snapshot();
  await restore(DEFAULTS(), { k: sec.keys || [], core: sec.core || [], store: sec.store || [], readaloud: !!sec.readaloud, tune: !!sec.tune, server: !!sec.server });
  flash(`${sec.title}: back to the defaults.`, true);
}
let resetArmed = 0;
async function resetAll(btn) {
  if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); btn.textContent = 'Click again to reset everything'; setTimeout(() => { btn.textContent = 'Reset all'; }, 3000); return; }
  resetArmed = 0; btn.textContent = 'Reset all';
  undoSnap = snapshot();
  await restore(DEFAULTS());
  flash('Everything is back to the defaults.', true);
}
function exportJson() {
  const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' })), download: `stacks-settings-${today}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
let flashT = 0;
function flash(text, undo = false) {
  const box = $('.st-flash', sheet); if (!box) return;
  box.replaceChildren(text, undo && undoSnap ? h('button', { type: 'button', className: 'st-btn', textContent: 'Undo', onclick: async () => { const s = undoSnap; undoSnap = null; await restore(s); flash('Undone.'); } }) : '');
  clearTimeout(flashT); flashT = setTimeout(() => box.replaceChildren(), 9000);
}

// ---------- build, open, close ----------
function build() {
  ups.length = 0;
  const secs = [secAppearance(), secText(), secPages(), secNav(), secPanel(), secAI(), secVoice(), secData()];
  const main = h('div', { className: 'st-main', tabIndex: -1 });
  const nav = h('nav', { className: 'st-nav', ariaLabel: 'Settings sections' });
  let picked = -1; // the section last clicked in the list: the last ones cannot scroll to the top
  secs.forEach((s, j) => {
    const el = h('section', { className: 'st-sec', id: 'st-' + s.id },
      h('div', { className: 'st-sh' }, h('h3', { textContent: s.title }), s.note ? h('span', { className: 'st-note', textContent: s.note }) : null,
        s.id === 'data' ? null : h('button', { type: 'button', className: 'st-reset', textContent: 'Reset', title: `Put ${s.title} back to the defaults`, onclick: () => resetSection(s) })),
      ...s.rows);
    main.append(el);
    nav.append(h('button', { type: 'button', textContent: s.title, onclick: () => { picked = j; main.scrollTop = el.offsetTop - 4; } }));
  });
  main.addEventListener('scroll', () => {
    let cur = 0;
    [...main.children].forEach((el, j) => { if (el.offsetTop - 30 <= main.scrollTop) cur = j; });
    if (main.scrollTop + main.clientHeight >= main.scrollHeight - 2) cur = Math.max(cur, picked >= 0 ? picked : main.children.length - 1);
    [...nav.children].forEach((b, j) => b.classList.toggle('cur', j === cur));
  });
  for (const ev of ['wheel', 'keydown', 'pointerdown']) main.addEventListener(ev, () => { picked = -1; }, { passive: true });
  const all = h('button', { type: 'button', className: 'st-btn', textContent: 'Reset all', title: 'Every setting back to the defaults (asks once more)' });
  all.onclick = () => resetAll(all);
  const el = h('aside', { id: 'st', role: 'dialog', ariaLabel: 'Settings', hidden: true },
    h('div', { className: 'st-head' }, h('h2', { textContent: 'Settings' }), h('span', { className: 'st-sub', textContent: 'changes apply at once · Esc closes' }),
      h('span', { className: 'st-sp' }), h('span', { className: 'st-flash st-msg' }), all,
      h('button', { type: 'button', className: 'st-x', title: 'Close (Esc or ,)', ariaLabel: 'Close settings', textContent: '×', onclick: () => toggleSheet(false) })),
    h('div', { className: 'st-body' }, nav, main));
  nav.firstChild?.classList.add('cur');
  return el;
}
let section0 = store.get('settings:at', 0);
let opening = null; // a second press while the sheet is being built does nothing
export async function toggleSheet(show) {
  if (opening) return opening;
  const open = sheet && !sheet.hidden;
  show = show ?? !open;
  if (show === open) return;
  if (show) { opening = openSheet().finally(() => { opening = null; }); return opening; }
  return closeSheet();
}
function closeSheet() {
  section0 = sheet.querySelector('.st-main').scrollTop; store.set('settings:at', section0);
  const had = sheet.contains(document.activeElement);
  sheet.hidden = true; gear?.classList.remove('on');
  if (had) document.activeElement?.blur?.(); // keys go to the page again
}
async function openSheet() {
  // What the server and the read-aloud module know, before building.
  const [si, g] = await Promise.all([
    fetch('/settings/server').then((r) => r.json()).catch(() => null),
    fetch('/tts').then((r) => r.json()).catch(() => null),
    import('./readaloud.js').then((m) => { RA = m; }).catch(() => { RA = null; }),
  ]);
  serverInfo = si; if (g) gem = g;
  applySections(); applyRepeat();
  if (sheet) sheet.remove();
  sheet = build();
  document.body.append(sheet);
  sheet.hidden = false; gear?.classList.add('on');
  applyAll();
  const main = sheet.querySelector('.st-main');
  main.style.scrollBehavior = 'auto'; main.scrollTop = section0; main.style.scrollBehavior = '';
  main.dispatchEvent(new Event('scroll'));
  main.focus({ preventScroll: true }); // keys stay in the sheet; arrows and PgDn scroll it
}
on('status', () => { if (sheet && !sheet.hidden) sync(); });
on('spread:rendered', () => { if (sheet && !sheet.hidden) sync(); }); // [ ] + - c C changed by key while the sheet is open

// ⌘, or Ctrl+, anywhere, and , alone wherever no view uses it (the wall does:
// , . move depth there). Firefox on a Mac keeps ⌘, for its own settings and
// never passes it to the page, so , alone or the gear is the way in there.
// While the sheet is open, Esc closes it and keys pressed in it stay in it
// (keys pressed on the page still work, to look).
const typing = (t) => /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName) || t?.isContentEditable;
const commaFree = () => { const b = keymap.get(','); return !b || (b.view && b.view !== state.view); };
addEventListener('keydown', (e) => {
  const chord = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;
  const bare = !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target) && commaFree();
  if (e.key === ',' && (chord || bare)) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) toggleSheet(); return; }
  if (!sheet || sheet.hidden) return;
  if (e.key === 'Escape' && $('#search')?.hidden !== false && $('#keys')?.hidden !== false) { e.preventDefault(); e.stopPropagation(); toggleSheet(false); return; }
  if (sheet.contains(e.target)) e.stopPropagation();
}, true);

// The gear, beside ?.
gear = h('button', { id: 'st-btn', className: 'ghost', type: 'button', title: 'Settings (, or Ctrl+,)', ariaLabel: 'Settings', onclick: () => toggleSheet() });
gear.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
if ($('#keys-btn')) $('#keys-btn').after(gear); else $('#bar').append(gear);
keyHelp.push({ label: ', Ctrl+, ⌘,', text: 'settings: colours, text, pages, wheel, side panel, AI budget, voice (Firefox on a Mac keeps ⌘, for itself)', order: 66 });

// Apply what was saved now, before the first page is laid out; sections and
// keys registered by later modules are picked up at boot.
applyAll();
applySections(); applyRepeat();
on('boot', () => { applySections(); applyRepeat(); applyAll(); });
