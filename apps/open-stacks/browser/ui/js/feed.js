// The feed: one item at a time, a few real pages of it filling the stage.
import { $, h, P, emit, emitQuiet, fmtDate } from './util.js';
import { items, LANES } from './corpus.js';
import { state, current } from './state.js';
import { openDoc, isFlow, scanUrl } from './docs.js';
import { renderPage } from './render.js';
import { planAround, startOf } from './prefetch.js';
import { showFlow, dropLive, live } from './flow.js';
import { goPage, toggleZoom } from './nav.js';

export async function showFeed() {
  const gen = ++state.gen;
  const i = current();
  const spread = $('#spread');
  if (i == null) { $('#item-head').textContent = 'Nothing in this lane.'; spread.replaceChildren(); return; }
  const it = items[i];
  paintHead(it);
  if (state.panelItem !== it.id) { state.panelItem = it.id; emit('item:shown', { i, it }); emitQuiet('item:settled', { i, it }, 300); }
  spread.classList.toggle('flowmode', isFlow(it));
  if (isFlow(it)) {
    let d;
    try { d = await openDoc(it); } catch (e) { if (gen === state.gen) showError(e); return; }
    if (gen !== state.gen) return;
    it.n = d.n;
    showFlow(i, it, d);
    planAround(i, state.start.get(i) ?? 0);
    return;
  }
  dropLive();
  let n = it.n;
  if (!n) {
    try { n = it.n = (await openDoc(it)).n; } catch (e) { if (gen === state.gen) showError(e); return; }
    if (gen !== state.gen) return;
  }
  const s = Math.max(0, Math.min(startOf(i), n - 1));
  state.start.set(i, s);
  const boxH = spread.clientHeight - 8, boxW = spread.clientWidth - 24;
  if (state.perAuto) state.per = fitPer(it, boxW, boxH);
  const per = state.zoom ? 1 : state.per;
  const hint = aspectOf(it);
  // Lay out panels until the spread is full. Blank pages collapse to a thin
  // strip and do not count, so a spread always shows `per` pages of content.
  const slots = []; let k = s;
  while (slots.length < per && k < n) { const kk = k++; slots.push({ el: h('div', { className: 'pg loading' }), k: kk, p: renderPage(it, kk) }); }
  spread.replaceChildren(...slots.map((x) => x.el));
  for (const x of slots) {
    if (it.kind === 'scan') { x.el.append(h('img', { src: P(scanUrl(it, x.k, 400)), alt: '' })); x.el.classList.add('lowres'); }
    x.el.dataset.aspect = String(hint);
  }
  // Placeholders take the shape the pages are expected to have, so the
  // spread does not jump when they arrive.
  layoutPanels(slots.map((x) => x.el), boxW, boxH);
  state.shown = slots.length;
  paintPos(it, s, slots.length, n);
  paintScrub(i, s, slots.length);
  planAround(i, s);
  const results = await Promise.all(slots.map((x) => x.p.catch((e) => [{ err: e.message, k: x.k }])));
  if (gen !== state.gen) return;
  let extra = results.filter((r) => r.length === 1 && r[0].blank).length;
  while (extra > 0 && k < n) {
    const kk = k++; const p = await renderPage(it, kk).catch((e) => [{ err: e.message, k: kk }]);
    if (gen !== state.gen) return;
    results.push(p); slots.push({ k: kk }); if (!(p.length === 1 && p[0].blank)) extra--;
  }
  const els = [];
  results.forEach((panels, j) => {
    for (const pnl of panels) {
      const el = h('div', { className: 'pg' });
      el.dataset.k = pnl.k ?? slots[j].k;
      el._pnl = pnl;
      if (pnl.blank) { el.className = 'pg blank'; el.textContent = 'blank'; el.dataset.aspect = '0.06'; }
      else if (pnl.err) { el.className = 'pg err'; el.textContent = pnl.err; el.dataset.aspect = '0.68'; }
      else { el.append(pnl.canvas); el.dataset.aspect = String(pnl.canvas.width / pnl.canvas.height); }
      el.append(h('span', { className: 'pno', textContent: String(Number(el.dataset.k) + 1) + (pnl.part || '') }));
      el.onclick = (e) => { if (!state.zoom && !e.target.closest('.tl, a') && !getSelection().toString()) toggleZoom(true, Number(el.dataset.k)); };
      els.push(el);
    }
  });
  // Remember this item's page shape; if it differs enough to change how many
  // pages fit, lay the spread out again (once, when the item first opens).
  const asp = els.filter((e) => e._pnl?.canvas).map((e) => Number(e.dataset.aspect) * (e._pnl.part ? 2 : 1)).sort((a, b) => a - b);
  if (asp.length) {
    const first = !aspects.has(it.id);
    aspects.set(it.id, asp[Math.floor(asp.length / 2)]);
    if (first && state.perAuto && !state.zoom && fitPer(it, boxW, boxH) !== state.per) { showFeed(); return; }
  }
  spread.replaceChildren(...els);
  state.shown = slots.length;
  layoutPanels(els, boxW, boxH);
  paintPos(it, s, slots.length, n);
  paintScrub(i, s, slots.length);
  emit('spread:rendered', { i, it, s, els, doc: null });
  emitQuiet('spread:settled', { i, it, s, els, doc: null }, 160);
}
function showError(e) {
  const it = items[current()]; if (it) it.err = e.message; // Advance may then move on (nav.js)
  $('#spread').replaceChildren(h('div', { className: 'pg err', textContent: 'Could not open: ' + e.message, style: 'width:420px;height:300px' }));
}

// ---------- how many pages fit ----------
// Page shape (width / height) per item, learned from rendered pages.
const aspects = new Map();
const aspectOf = (it) => aspects.get(it.id) ?? (it.kind === 'scan' ? 0.66 : 0.74);
/** Pages per spread in auto mode: as many as fit at (nearly) full height, 1 to 3,
 *  so a laptop shows two and a large screen three, with little empty space. */
export function fitPer(it, W, H) {
  const gap = 10;
  return Math.max(1, Math.min(3, Math.floor((W + gap) / (H * aspectOf(it) * 0.8 + gap))));
}

/** Size panels to a common height that fits the stage, preserving each aspect ratio. */
export function layoutPanels(els, W, H) {
  const gap = 10;
  const aspects = els.map((e) => Number(e.dataset.aspect) || 0.68);
  const sum = aspects.reduce((a, b) => a + b, 0);
  const height = Math.min(H, (W - gap * (els.length - 1)) / sum);
  els.forEach((e, j) => {
    e.style.height = Math.floor(height) + 'px';
    e.style.width = Math.floor(height * aspects[j]) + 'px';
  });
}

export function paintHead(it) {
  const saved = state.saved.includes(it.id);
  $('#item-head').replaceChildren(
    h('h1', { title: it.t, textContent: it.t }),
    h('div', { className: 'meta' },
      h('span', { className: 'lane', textContent: LANES[it.lane] || it.lane }),
      it.a ? h('span', { className: 'au', textContent: it.a }) : null,
      fmtDate(it) ? h('span', { textContent: fmtDate(it) }) : null,
      saved ? h('span', { className: 'star', textContent: '★' }) : null),
    h('span', { className: 'pos', id: 'pos' }),
  );
}
export function paintPos(it, s, c, n, flow = false) {
  const el = $('#pos'); if (!el) return;
  const unit = flow ? 'p.' : 'pp.';
  // On the last spread, say what Advance does next (flow documents count columns).
  const last = flow ? !!live && (state.start.get(current()) ?? 0) + live.g.cols >= live.n : s + c >= n;
  const nx = last ? items[state.order[state.pos + 1]] : null;
  const next = !last ? '' : nx ? ` · ▸ next: ${nx.t.length > 48 ? nx.t.slice(0, 46) + '…' : nx.t}` : ' · end of lane';
  el.textContent = `${state.pos + 1}/${state.order.length} · ${unit} ${s + 1}–${Math.min(n, s + c)} of ${n}${state.zoom ? ' · zoom' : ''}${next}`;
  el.title = nx ? `Space goes on to: ${nx.t}` : '';
}

// ---------- page strip ----------
let scrubObs = null; let scrubFor = null;
export function paintScrub(i, s, c) {
  const it = items[i]; const box = $('#scrub');
  const n = it.n || 0;
  if (scrubFor !== it.id + '|' + n) {
    scrubFor = it.id + '|' + n;
    scrubObs?.disconnect();
    scrubObs = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting || e.target.dataset.done) continue;
        e.target.dataset.done = '1'; fillThumb(it, e.target);
      }
    }, { root: box, rootMargin: '0px 400px' });
    const thumbs = [];
    for (let k = 0; k < Math.min(n, 1500); k++) {
      const t = h('div', { className: 'th', title: `p. ${k + 1}` }, h('span', { className: 'tn', textContent: String(k + 1) }));
      t.dataset.k = k;
      t.onclick = () => goPage(k);
      thumbs.push(t); scrubObs.observe(t);
    }
    box.replaceChildren(...thumbs);
  }
  const kp = new Set((state.marks?.get(it.id) || []).map((p) => p - 1));
  for (const t of box.children) {
    const k = Number(t.dataset.k);
    t.classList.toggle('cur', k >= s && k < s + c);
    t.classList.toggle('kp', kp.has(k));
  }
  box.children[s]?.scrollIntoView({ block: 'nearest', inline: 'center' });
}
async function fillThumb(it, t) {
  const k = Number(t.dataset.k);
  if (it.kind === 'scan') { t.prepend(h('img', { loading: 'lazy', src: P(scanUrl(it, k, 120)), alt: '' })); return; }
  const d = await openDoc(it).catch(() => null);
  if (!d) return;
  if (d.pdf) {
    const page = await d.pdf.getPage(k + 1);
    const vp0 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 74 * 2 / vp0.height });
    const c = h('canvas', { width: Math.floor(vp.width), height: Math.floor(vp.height) });
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    t.prepend(c);
  } else t.prepend(h('div', { className: 'tt', textContent: (d.texts?.[k] || '').slice(0, 160) }));
}
