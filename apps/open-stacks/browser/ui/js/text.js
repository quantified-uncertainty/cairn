// The text on screen as words, for read-aloud, find and quoting. Flow
// documents provide DOM words here; feature modules register sources for
// raster pages (pdf.js text layers, OCR word boxes).
//
// A Word is { text, page, range?, el?, box? }: `page` is the 0-based page
// (stable page for flow documents), `range` a DOM Range over live text,
// `el` an overlay element (text-layer span) for raster pages.
import { items } from './corpus.js';
import { state, current } from './state.js';
import { isFlow } from './docs.js';
import { live, elToCol } from './flow.js';
import { showFeed } from './feed.js';

const sources = [];
/** fn({ i, it }) -> Promise<{ words: Word[], start: number } | null> */
export function registerTextSource(fn) { sources.push(fn); }

/** Words of the current item, with `start` = index of the first word on screen. */
export async function currentWords() {
  const i = current(); const it = items[i];
  for (const src of sources) {
    const r = await src({ i, it });
    if (r && r.words.length) return r;
  }
  return null;
}

registerTextSource(async ({ i, it }) => {
  if (!isFlow(it) || live?.id !== it.id) return null;
  const words = [];
  const walker = document.createTreeWalker(live.flow, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('pre, script, style, .flow-title .m, sup') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const vpEl = n.parentElement.closest('[data-vp]');
    const page = vpEl ? Number(vpEl.dataset.vp) : 0;
    for (const m of n.data.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
      words.push({ text: m[0], page, range, block: vpEl });
    }
  }
  const s = state.start.get(i) ?? 0;
  const startVp = live.first[s] ?? live.running[s] ?? 0;
  let start = words.findIndex((w) => w.page >= startVp);
  // Prefer the first word actually inside the visible columns.
  const firstVisible = words.findIndex((w, j) => j >= Math.max(0, start) && w.block && elToCol(w.block) >= s);
  if (firstVisible >= 0) start = firstVisible;
  return { words, start: Math.max(0, start) };
});

/** Paint words with a named highlight (CSS Custom Highlight API for ranges, a class for elements). */
const hlEls = new Map();
export function highlight(name, words) {
  for (const el of hlEls.get(name) || []) el.classList.remove('hl-' + name);
  const els = words.filter((w) => w.el).map((w) => w.el);
  els.forEach((el) => el.classList.add('hl-' + name));
  hlEls.set(name, els);
  if (globalThis.CSS?.highlights) {
    const ranges = words.filter((w) => w.range).map((w) => w.range);
    if (ranges.length) CSS.highlights.set(name, new Highlight(...ranges)); else CSS.highlights.delete(name);
  }
}

/** Bring a word on screen: turn the flow strip or go to its page. */
export function reveal(w) {
  const i = current(); const it = items[i];
  if (w.range && live?.id === it.id) {
    const el = w.range.startContainer.parentElement;
    const col = elToCol(el);
    const s = state.start.get(i) ?? 0;
    if (col < s || col >= s + live.g.cols) {
      const ns = Math.floor(col / live.g.cols) * live.g.cols;
      const hist = state.hist.get(i) || []; if (ns > s) hist.push(s); state.hist.set(i, hist);
      state.start.set(i, ns); showFeed();
    }
    return;
  }
  const s = state.start.get(i) ?? 0;
  if (w.page < s || w.page >= s + (state.shown || 1)) { state.start.set(i, w.page); showFeed(); }
}
