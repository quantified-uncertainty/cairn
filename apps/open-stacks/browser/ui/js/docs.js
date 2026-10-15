// Opening documents. Scans and PDFs are rasters (rendered page by page);
// posts, web articles and plain texts become "flow" documents that are laid
// out live in columns (flow.js).
import { P, PDFJS, h, esc, lru } from './util.js';

let pdfjsP = null;
export const pdfjs = () => (pdfjsP ||= import(P(PDFJS + 'pdf.min.mjs')).then((m) => { m.GlobalWorkerOptions.workerSrc = P(PDFJS + 'pdf.worker.min.mjs'); return m; }));
const PDFJS_ROOT = location.origin + P(PDFJS.replace(/build\/$/, ''));
export const PDF_ASSETS = { standardFontDataUrl: PDFJS_ROOT + 'standard_fonts%2F', cMapUrl: PDFJS_ROOT + 'cmaps%2F', cMapPacked: true };
export const isFlow = (it) => it.kind === 'html' || it.kind === 'web' || it.kind === 'text';
export const scanUrl = (it, k, w) => `https://archive.org/download/${it.ia}/page/n${k}_w${w}.jpg`;

// Extractors turn a fetched response into article HTML, by item kind. A
// feature module can replace one (e.g. a better web extractor).
export const extractors = {
  async html(it, r) { const j = await r.json(); return j?.data?.post?.result?.htmlBody || '<p>(empty)</p>'; },
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
      const [lib, buf] = await Promise.all([pdfjs(), fetch(P(it.url)).then((r) => { if (!r.ok) throw new Error('PDF ' + r.status); return r.arrayBuffer(); })]);
      // Standard fonts and character maps let pdf.js draw PDFs that do not embed
      // their fonts (many reports and older papers) with the right glyphs.
      const pdf = await lib.getDocument({ data: buf, isEvalSupported: false, ...PDF_ASSETS }).promise;
      return { n: pdf.numPages, pdf, outline: null };
    }
    const r = await fetch(P(it.url));
    if (!r.ok) throw new Error('fetch ' + r.status);
    const html = await (extractors[it.kind] || extractors.web)(it, r);
    return prepareFlow(it, html);
  }, 16);
}
/** The cached document if it is already open (no fetch). */
export const peekDoc = (it) => docs.get(docKey(it));

const VP_WORDS = 280; // words per stable "page" of a flow document
const BLOCKS = 'p,li,h1,h2,h3,h4,h5,h6,pre,table,figure,blockquote,dt,dd,img,iframe,hr';

/** Clean article HTML and cut it into stable virtual pages of ~280 words.
 *  Pages are what summaries cite and the strip shows; columns are layout. */
export function prepareFlow(it, html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,noscript,form,object,embed,link,meta,.sl-anchor-link,.sr-only,.visually-hidden,.screen-reader-text,.anchor-link,.headerlink').forEach((x) => x.remove());
  doc.querySelectorAll('[style]').forEach((x) => { x.style.removeProperty('width'); x.style.removeProperty('max-width'); x.style.removeProperty('float'); });
  doc.querySelectorAll('img').forEach((img) => { img.removeAttribute('loading'); img.decoding = 'async'; img.removeAttribute('width'); img.removeAttribute('height'); });
  doc.querySelectorAll('iframe').forEach((f) => { f.setAttribute('loading', 'lazy'); f.removeAttribute('width'); f.removeAttribute('height'); });
  doc.querySelectorAll('a[href]').forEach((a) => { if (!a.getAttribute('href').startsWith('#')) { a.target = '_blank'; a.rel = 'noopener'; } });
  const title = doc.createElement('header');
  title.className = 'flow-title';
  title.innerHTML = `<div class="t">${esc(it.t)}</div><div class="m">${esc([it.a, it.d || it.y, it.src].filter(Boolean).join(' · '))}</div>`;
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
