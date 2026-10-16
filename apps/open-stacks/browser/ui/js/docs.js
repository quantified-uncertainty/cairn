// Opening documents. Scans and PDFs are rasters (rendered page by page);
// posts, web articles and plain texts become "flow" documents that are laid
// out live in columns (flow.js).
import { P, PDFJS, h, esc, lru } from './util.js';
import { applyPageSvgStyles } from './svgstyle.js';

let pdfjsP = null;
export const pdfjs = () => (pdfjsP ||= import(P(PDFJS + 'pdf.min.mjs')).then((m) => { m.GlobalWorkerOptions.workerSrc = P(PDFJS + 'pdf.worker.min.mjs'); return m; }));
const PDFJS_ROOT = location.origin + P(PDFJS.replace(/build\/$/, ''));
export const PDF_ASSETS = { standardFontDataUrl: PDFJS_ROOT + 'standard_fonts%2F', cMapUrl: PDFJS_ROOT + 'cmaps%2F', cMapPacked: true };
export const isFlow = (it) => it.kind === 'html' || it.kind === 'web' || it.kind === 'text';
export const scanUrl = (it, k, w) => `https://archive.org/download/${it.ia}/page/n${k}_w${w}.jpg`;

// Extractors turn a fetched response into article HTML, by item kind. A
// feature module can replace one (e.g. a better web extractor).
export const extractors = {
  // Forum posts come as GraphQL JSON; anything else marked html is a web page.
  async html(it, r) {
    if (!/\/graphql\b/.test(it.url)) return extractors.web(it, r);
    const j = await r.json(); return j?.data?.post?.result?.htmlBody || '<p>(empty)</p>';
  },
  async text(it, r) {
    let txt = (await r.text()).replace(/\r\n/g, '\n');
    const s = txt.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i);
    if (s >= 0) txt = txt.slice(txt.indexOf('\n', s) + 1);
    const e = txt.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i);
    if (e >= 0) txt = txt.slice(0, e);
    return txt.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => {
      const one = p.replace(/\s*\n\s*/g, ' ');
      return /^(CHAPTER|BOOK|PART|SECTION)\b/i.test(one) || (one.length < 70 && one === one.toUpperCase() && /[A-Z]/.test(one)) ? `<h3>${esc(one)}</h3>` : `<p>${esc(one)}</p>`;
    }).join('');
  },
  async web(it, r) {
    // A plain reader-mode extraction: the main content element, minus page chrome.
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    const base = it.url;
    applyPageSvgStyles(doc); // the page's own CSS onto its SVG diagrams, before styles are dropped
    markWidgets(doc, it.page || it.url);
    for (const [sel, attr] of [['img', 'src'], ['a', 'href'], ['source', 'srcset'], ['img', 'srcset']]) {
      doc.querySelectorAll(`${sel}[${attr}]`).forEach((el) => {
        const v = el.getAttribute(attr);
        if (attr === 'srcset') { el.removeAttribute('srcset'); return; }
        if (v && !v.startsWith('#') && !/^(data|javascript):/.test(v)) { try { el.setAttribute(attr, new URL(v, base).href); } catch { /* keep */ } }
      });
    }
    doc.querySelectorAll('nav, header, footer, aside, form, [role=navigation], [role=banner], [class*=sidebar], [class*=comments], [id*=comments], .ltx_page_footer, .ltx_page_header').forEach((x) => x.remove());
    const main = doc.querySelector('article, .ltx_page_main, main, [role=main], .post-content, .entry-content, #content') || doc.body;
    return main.innerHTML;
  },
};

const docs = new Map();
// Keyed by id and URL: an item can switch source (an arXiv PDF read as its HTML version).
const docKey = (it) => it.id + '|' + (it.url || '');
export function openDoc(it) {
  if (it.kind === 'scan') return Promise.resolve({ n: it.n, outline: [] });
  return lru(docs, docKey(it), async () => {
    if (it.kind === 'pdf') {
      // Your own files (features/local.js) can be books of hundreds of MB: past 8 MB pdf.js
      // reads them in ranges, only the parts the pages shown need (the server answers Range).
      // Not one still in iCloud (it.cloud): macOS fetches it whole on the first read anyway.
      const ranged = /^\/local\/file\//.test(it.url) && it.size > 8e6 && !it.cloud;
      const [lib, buf] = await Promise.all([pdfjs(), ranged ? null : fetch(P(it.url)).then((r) => { if (!r.ok) throw new Error('PDF ' + r.status); return r.arrayBuffer(); })]);
      // Standard fonts and character maps let pdf.js draw PDFs that do not embed
      // their fonts (many reports and older papers) with the right glyphs.
      const src = ranged ? { url: it.url, rangeChunkSize: 256 * 1024, disableAutoFetch: true, disableStream: true } : { data: buf };
      const pdf = await lib.getDocument({ ...src, isEvalSupported: false, ...PDF_ASSETS }).promise;
      return { n: pdf.numPages, pdf, outline: null };
    }
    const r = await fetch(P(it.url));
    if (!r.ok) throw new Error('fetch ' + r.status);
    const html = await (extractors[it.kind] || extractors.web)(it, r);
    let d = prepareFlow(it, html);
    for (const f of flowAfter) { try { d = (await f(d, it)) || d; } catch (e) { console.warn('flow step failed', e); } }
    return d;
  }, 16);
}
/** The cached document if it is already open (no fetch). */
export const peekDoc = (it) => docs.get(docKey(it));
/** Close one item's open document, or all of them (the profile benchmark measures cold opens). */
export function dropDocs(it = null) {
  for (const [k, v] of [...docs]) {
    if (it && k !== docKey(it)) continue;
    docs.delete(k); Promise.resolve(v).then((d) => d?.pdf?.destroy?.()).catch(() => {});
  }
}

/** Feature hooks fn(doc, it) that edit a flow document's parsed HTML before layout and
 *  paging, with img width/height still present (features/rescue.js routes images through /img). */
// Interactive components (calculators, sliders, live charts) cannot run in the reader,
// and extraction (Readability drops inputs and buttons) would flatten them into stray
// labels and numbers. markWidgets finds them in the page as served — an Astro island or a
// framework mount holding controls or a chart, or the largest block around 3+ form controls
// that is not the article itself — and puts one short note in their place, naming the
// widget, with a link to it on the original page.
const CONTROLS = 'input:not([type=hidden]), select, textarea, [role=slider]';
const CHROME = 'header, nav, aside, footer, [role=navigation], [role=banner], [role=search]';
// Site furniture that is not an interactive part of the piece: search boxes and sign-up forms.
const FORMISH = (c) => /^(search|email)$/i.test(c.type || '') || !!c.closest('form[role=search], form[action*=search i], form[action*=subscribe i], form[action*=newsletter i], [class*=newsletter i], [class*=subscribe i], [class*=search i]');
const wordsIn = (el) => (el.textContent.match(/\S+/g) || []).length;
const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase());
export function markWidgets(doc, page) {
  const roots = new Set();
  for (const el of doc.querySelectorAll('astro-island, [data-reactroot], [data-v-app], [data-svelte-h], [data-widget]'))
    if (el.querySelector(CONTROLS + ', canvas, button') && !el.closest(CHROME)) roots.add(el);
  const controls = [...doc.querySelectorAll(CONTROLS)].filter((c) => !c.closest(CHROME) && !FORMISH(c));
  const total = Math.max(1, wordsIn(doc.body));
  for (const c of controls) {
    let el = c.parentElement, k = 0;
    const count = (x) => controls.filter((y) => x.contains(y)).length;
    while (el && el !== doc.body && k++ < 12 && count(el) < 3) el = el.parentElement;
    if (!el || el === doc.body || count(el) < 3) continue;
    // Grow to take in the widget's outputs and chart, but not the article around it.
    while (el.parentElement && el.parentElement !== doc.body && !/^(MAIN|ARTICLE)$/.test(el.parentElement.tagName)
      && !el.parentElement.querySelector('h1, h2') && el.parentElement.textContent.length < 4000) el = el.parentElement;
    roots.add(el);
  }
  let n = 0;
  for (const el of roots) {
    if (!el.isConnected || [...roots].some((o) => o !== el && o.isConnected && o.contains(el))) continue;
    // Never the piece itself: a "widget" holding most of the page's words is the article around some controls.
    if (wordsIn(el) > Math.max(400, total * 0.4)) continue;
    const inputs = el.querySelectorAll(CONTROLS).length, charts = el.querySelectorAll('canvas, svg').length;
    const comp = /([A-Za-z][\w-]*?)(?:\.[\w-]+)?\.(?:m?js|tsx?|jsx|svelte|vue)/.exec(el.getAttribute('component-url') || '')?.[1];
    let head = null;
    for (let p = el; p && !head; p = p.parentElement) { let s = p.previousElementSibling; while (s && !/^H[1-4]$/.test(s.tagName)) s = s.previousElementSibling; head = s; }
    const name = el.getAttribute('aria-label') || (comp && comp.length > 3 ? titleCase(comp) : '') || head?.textContent.trim() || '';
    const what = [inputs ? `${inputs} input${inputs > 1 ? 's' : ''}` : '', charts ? (charts > 1 ? `${charts} charts or diagrams` : 'a chart or diagram') : ''].filter(Boolean).join(', ');
    const p = doc.createElement('p');
    p.className = 'wv-widget';
    const b = doc.createElement('b'); b.textContent = `Interactive${name ? ': ' + name : ' widget'}.`;
    p.append(b, ` This part of the page is a live component${what ? ` (${what})` : ''}; it only runs on the original page. `);
    if (page) { const a = doc.createElement('a'); a.href = page + (head?.id ? '#' + head.id : ''); a.textContent = 'Open it ↗'; p.append(a, ' · N shows the live page here.'); }
    el.replaceWith(p); n++;
  }
  return n;
}
export const flowFilters = [];
/** Async hooks fn(d, it) → d after prepareFlow, when a document opens for reading (openDoc; not
 *  the wall's digests), before it is laid out: they may change d.html, not its stable pages
 *  (features/flowblocks.js draws Mermaid diagrams here). */
export const flowAfter = [];

const VP_WORDS = 280; // words per stable "page" of a flow document
const BLOCKS = 'p,li,h1,h2,h3,h4,h5,h6,pre,table,figure,blockquote,dt,dd,img,iframe,hr';

/** Clean article HTML and cut it into stable virtual pages of ~280 words.
 *  Pages are what summaries cite and the strip shows; columns are layout. */
export function prepareFlow(it, html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,noscript,form,object,embed,link,meta,.sl-anchor-link,.sr-only,.visually-hidden,.screen-reader-text,.anchor-link,.headerlink').forEach((x) => x.remove());
  doc.querySelectorAll('[style]').forEach((x) => { x.style.removeProperty('width'); x.style.removeProperty('max-width'); x.style.removeProperty('float'); });
  for (const f of flowFilters) { try { f(doc, it); } catch (e) { console.warn('flow filter failed', e); } }
  doc.querySelectorAll('img').forEach((img) => { img.removeAttribute('loading'); img.decoding = 'async'; img.removeAttribute('width'); img.removeAttribute('height'); });
  doc.querySelectorAll('iframe').forEach((f) => { f.setAttribute('loading', 'lazy'); f.removeAttribute('width'); f.removeAttribute('height'); });
  doc.querySelectorAll('a[href]').forEach((a) => { if (!a.getAttribute('href').startsWith('#')) { a.target = '_blank'; a.rel = 'noopener'; } });
  const title = doc.createElement('header');
  title.className = 'flow-title';
  const orig = it.page || (/\/graphql\b/.test(it.url || '') ? '' : it.url || '');
  const tt = /^https?:/.test(orig) ? `<a href="${esc(orig)}" target="_blank" rel="noopener" title="Open the original">${esc(it.t)}</a>` : esc(it.t);
  title.innerHTML = `<div class="t">${tt}</div><div class="m">${esc([it.a, it.d || it.y, it.src].filter(Boolean).join(' · '))}</div>`;
  doc.body.prepend(title);
  const blocks = [...doc.body.querySelectorAll(BLOCKS)].filter((b) => !b.parentElement.closest(BLOCKS));
  const texts = ['']; const outline = [];
  let vp = 0, words = 0;
  for (const b of blocks) {
    const t = b.textContent.replace(/\s+/g, ' ').trim();
    const w = t ? t.split(' ').length : 0;
    if (words >= VP_WORDS && w) { vp++; words = 0; texts.push(''); }
    b.dataset.vp = vp;
    texts[vp] += (texts[vp] ? '\n' : '') + t;
    words += w;
    if (/^H[1-4]$/.test(b.tagName) && t) outline.push({ title: t.slice(0, 90), page: vp, depth: Number(b.tagName[1]) - 1 });
  }
  return { flow: true, html: doc.body.innerHTML, n: texts.length, texts, outline };
}

export async function pdfOutline(d) {
  if (d.outline) return d.outline;
  const out = [];
  try {
    const ol = await d.pdf.getOutline();
    const visit = async (nodes, depth) => {
      for (const n of nodes || []) {
        if (out.length > 80) return;
        let page = null;
        try {
          const dest = typeof n.dest === 'string' ? await d.pdf.getDestination(n.dest) : n.dest;
          if (dest) page = await d.pdf.getPageIndex(dest[0]);
        } catch { /* unresolvable */ }
        out.push({ title: n.title, page, depth });
        if (depth < 1) await visit(n.items, depth + 1);
      }
    };
    await visit(ol, 0);
  } catch { /* no outline */ }
  d.outline = out;
  return out;
}
export { h };
