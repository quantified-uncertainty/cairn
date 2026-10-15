// Flow documents (posts, web articles, plain text) laid out live in CSS
// columns across the whole stage: dense, selectable, links and footnotes
// still work. A turn moves the column strip; nothing is re-rendered.
import { $, h, emit } from './util.js';
import { state } from './state.js';
import { paintPos, paintScrub } from './feed.js';

const built = new Map(); // `${id}|${geom}` -> layout, a few kept for quick returns
export let live = null;  // the layout on screen
export const dropLive = () => { live = null; };

export function flowGeom(spread = $('#spread')) {
  const font = state.font + (state.zoom ? 2 : 0);
  const W = spread.clientWidth - 24, H = spread.clientHeight - 6;
  const padX = Math.round(font * 1.5), padY = Math.round(font * 1.1);
  const gap = Math.round(font * 2.2);
  const innerW = W - 2 * padX, innerH = H - 2 * padY;
  let cols = state.zoom ? 1 : state.flowCols || Math.max(1, Math.round((innerW + gap) / (font * 31 + gap)));
  cols = Math.max(1, Math.min(cols, Math.floor((innerW + gap) / (font * 12 + gap))));
  let colw = Math.floor((innerW - gap * (cols - 1)) / cols);
  if (state.zoom) colw = Math.min(innerW, Math.round(font * 40));
  const visW = cols * colw + (cols - 1) * gap;
  return { font, padX, padY, gap, cols, colw, visW, innerH, pitch: colw + gap, key: [font, cols, colw, innerH].join('|') };
}

function build(it, d, g) {
  const flow = h('div', { className: 'flow' });
  flow.innerHTML = d.html;
  Object.assign(flow.style, { columnCount: g.cols, columnGap: g.gap + 'px', width: g.visW + 'px', height: g.innerH + 'px', fontSize: g.font + 'px' });
  const port = h('div', { className: 'flowport' }, flow);
  Object.assign(port.style, { width: g.visW + 'px', height: g.innerH + 'px' });
  port.addEventListener('scroll', () => { port.scrollLeft = 0; port.scrollTop = 0; }); // selection drags must not scroll it
  const sheet = h('div', { className: 'pg sheet' }, port);
  sheet.style.padding = `${g.padY}px ${g.padX}px`;
  const L = { id: it.id, it, d, g, sheet, port, flow, n: 1, first: [], running: [], vpCol: [] };
  wireLinks(L);
  return L;
}

/** Count columns and map stable pages (data-vp) to columns. */
function measure(L) {
  const { flow, port, g } = L;
  const prev = flow.style.transform; flow.style.transform = 'none';
  L.n = Math.max(1, Math.round((port.scrollWidth + g.gap) / g.pitch));
  const fr = flow.getBoundingClientRect();
  const first = [], last = [], vpCol = [];
  for (const b of flow.querySelectorAll('[data-vp]')) {
    const r = b.getClientRects()[0]; if (!r) continue;
    const c = Math.max(0, Math.floor((r.left - fr.left + g.gap / 2) / g.pitch));
    const vp = Number(b.dataset.vp);
    if (first[c] == null) first[c] = vp;
    last[c] = vp;
    if (vpCol[vp] == null) vpCol[vp] = c;
  }
  const running = []; let run = 0;
  for (let c = 0; c < L.n; c++) { if (last[c] != null) run = last[c]; running[c] = run; }
  Object.assign(L, { first, running, vpCol });
  flow.style.transform = prev;
}

export function showFlow(i, it, d) {
  const spread = $('#spread');
  const g = flowGeom(spread);
  const k = `${it.id}|${g.key}`;
  let L = built.get(k);
  if (!L) {
    L = build(it, d, g);
    built.set(k, L);
    while (built.size > 4) built.delete(built.keys().next().value);
  }
  if (live !== L || !L.sheet.isConnected) {
    spread.replaceChildren(L.sheet);
    measure(L);
    // Images and fonts arriving late reflow the columns; re-measure then.
    let t = null;
    const again = () => { clearTimeout(t); t = setTimeout(() => { if (live === L && L.sheet.isConnected) { measure(L); place(i); } }, 120); };
    L.flow.querySelectorAll('img').forEach((im) => { if (!im.complete) im.addEventListener('load', again, { once: true }); });
    document.fonts?.ready.then(again);
  }
  live = L;
  place(i);
}
function place(i) {
  const L = live; const it = L.it;
  let s = Math.max(0, Math.min(state.start.get(i) ?? 0, L.n - 1));
  state.start.set(i, s);
  L.flow.style.transform = `translateX(${-s * L.g.pitch}px)`;
  state.shown = L.g.cols;
  const [a, b] = flowRange(s);
  paintPos(it, a, b - a + 1, L.d.n, true);
  paintScrub(i, a, b - a + 1);
  emit('spread:rendered', { i, it, s, els: [L.sheet], doc: L.d, flow: L });
}

/** The stable pages visible when the strip starts at column s. */
export function flowRange(s) {
  const L = live; if (!L) return [0, 0];
  const e = Math.min(L.n - 1, s + L.g.cols - 1);
  const a = L.first[s] ?? L.running[s] ?? 0;
  const b = Math.max(a, L.running[e] ?? a);
  return [a, b];
}
/** The column where a stable page starts. */
export const vpToCol = (vp) => live?.vpCol[vp] ?? live?.vpCol.findIndex((c, j) => j >= vp && c != null) ?? 0;
/** The column that contains an element of the flow. */
export function elToCol(el) {
  const L = live; if (!L) return 0;
  const prev = L.flow.style.transform; L.flow.style.transform = 'none';
  const r = el.getClientRects()[0]; const fr = L.flow.getBoundingClientRect();
  L.flow.style.transform = prev;
  return r ? Math.max(0, Math.floor((r.left - fr.left + L.g.gap / 2) / L.g.pitch)) : 0;
}

// Internal links (footnotes, section links) preview on hover and jump on click.
let pop = null;
function wireLinks(L) {
  const target = (a) => {
    const id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
    if (!id) return null;
    return L.flow.querySelector(`[id="${CSS.escape(id)}"], [name="${CSS.escape(id)}"]`);
  };
  L.flow.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    e.preventDefault();
    const t = target(a); if (!t) return;
    emit('flow:jump', { col: elToCol(t), el: t });
  });
  L.flow.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = target(a); if (!t) return;
    const body = t.closest('li, p, div, section') || t;
    pop ||= document.body.appendChild(h('div', { id: 'fn-pop' }));
    pop.innerHTML = body.innerHTML;
    const r = a.getBoundingClientRect();
    pop.style.left = Math.min(innerWidth - 440, Math.max(8, r.left - 40)) + 'px';
    pop.style.top = (r.bottom + 6 + 260 > innerHeight ? r.top - 266 : r.bottom + 6) + 'px';
    pop.hidden = false;
    a.addEventListener('mouseleave', () => { pop.hidden = true; }, { once: true });
  });
}
