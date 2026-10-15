// GET /figures?id=arxiv:<id> → the paper's figures, read from arXiv's HTML
// version (LaTeXML), falling back to ar5iv:
//   [{ id, n, label, img, w, h, caption, at, href, parts?, lay?, table?, html?, rows?, cols?, inline? }]
// `img` is the figure's main image (absolute URL; inline SVG pictures are
// served from /figures/svg), `w`/`h` the whole figure's size, `at` where the
// figure sits in the document (0-1, a hint for finding its PDF page). With
// several images, `parts` lists them and `lay` arranges them (see arrange()).
// Tables come with `table: true` and, when they are HTML tables rather than
// images, sanitized `html` plus `rows`/`cols` counts.
// Lists are cached as JSON in CACHE/figures/; the HTML goes through the disk cache.
import { mkdirSync, existsSync, readFileSync, writeFileSync, createReadStream } from 'fs';
import { join } from 'path';

const VER = 7; // bump when the parser changes, to re-extract cached lists
const SOURCES = (id) => [`https://arxiv.org/html/${id}`, `https://ar5iv.labs.arxiv.org/html/${id}`];
const ID_RE = /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/;
const safe = (s) => String(s).replace(/[^\w.-]+/g, '_');

// ---- a small HTML parser: enough for LaTeXML's well-formed output ----
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\/([a-zA-Z][\w:.-]*)\s*>|<([a-zA-Z][\w:.-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>|[^<]+|</g;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', times: '×', minus: '−' };
const decode = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const c = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)); try { return String.fromCodePoint(c); } catch { return m; } }
  return NAMED[e.toLowerCase()] ?? m;
});

/** Parse HTML into {tag, a, kids, s, e, p} elements (s/e: source offsets) and text strings. */
function parse(html) {
  const root = { tag: '#root', a: {}, kids: [], s: 0, e: html.length };
  let cur = root;
  TOKEN.lastIndex = 0;
  for (let m; (m = TOKEN.exec(html));) {
    const [tok, close, open, attrs, selfClose] = m;
    if (open) {
      const tag = open.toLowerCase();
      const a = {};
      if (attrs) for (const am of attrs.matchAll(ATTR)) a[am[1].toLowerCase()] = decode(am[2] ?? am[3] ?? am[4] ?? '');
      const el = { tag, a, kids: [], s: m.index, e: m.index + tok.length, p: cur };
      cur.kids.push(el);
      if (RAW.has(tag)) {
        const end = html.indexOf(`</${tag}`, TOKEN.lastIndex);
        const stop = end < 0 ? html.length : html.indexOf('>', end) + 1;
        el.e = stop; TOKEN.lastIndex = stop;
      } else if (!VOID.has(tag) && !selfClose) cur = el;
    } else if (close) {
      const tag = close.toLowerCase();
      let n = cur;
      while (n !== root && n.tag !== tag) n = n.p;
      if (n === root) continue; // stray close tag
      for (let x = cur; x !== n.p; x = x.p) x.e = m.index + tok.length;
      cur = n.p;
    } else if (tok[0] !== '<' || tok.length === 1) cur.kids.push(tok);
  }
  return root;
}
const hasClass = (el, c) => (' ' + (el.a.class || '') + ' ').includes(' ' + c + ' ');
/** Descendants in document order; `stop(el)` true skips an element's subtree (after yielding it). */
function* walk(el, stop) {
  for (const k of el.kids) {
    if (typeof k === 'string') continue;
    yield k;
    if (!stop || !stop(k)) yield* walk(k, stop);
  }
}
const isFig = (el) => el.tag === 'figure';

// ---- caption text ----
const TEX = [[/\\(?:text|mathrm|mathbf|mathit|mathsf|mathtt|textbf|textit|textsc|emph|operatorname|mathcal|mathbb|mathscr|mathfrak|boldsymbol|bm)\s*\{([^{}]*)\}/g, '$1'],
  [/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2'],
  ...Object.entries({ hat: '\u0302', tilde: '\u0303', bar: '\u0304', vec: '\u20d7', dot: '\u0307' }).map(([k, v]) => [new RegExp('\\\\' + k + '\\s*\\{([^{}]*)\\}', 'g'), '$1' + v]),
  ...Object.entries({ alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', omega: 'ω', eta: 'η', kappa: 'κ', xi: 'ξ', psi: 'ψ', chi: 'χ', nu: 'ν', zeta: 'ζ', Delta: 'Δ', Gamma: 'Γ', Theta: 'Θ', Lambda: 'Λ', Sigma: 'Σ', Pi: 'Π', Phi: 'Φ', Omega: 'Ω', pm: '±', times: '×', cdot: '·', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', approx: '≈', sim: '~', infty: '∞', to: '→', rightarrow: '→', leftarrow: '←', in: '∈', notin: '∉', sum: 'Σ', prod: 'Π', ldots: '…', cdots: '…', dots: '…', log: 'log', exp: 'exp', setminus: '∖', mid: '|', cup: '∪', cap: '∩', subset: '⊂', subseteq: '⊆', forall: '∀', exists: '∃', nabla: '∇', partial: '∂', ell: 'ℓ', top: '⊤', prime: '′', circ: '∘', star: '⋆', sqrt: '√', langle: '⟨', rangle: '⟩', neg: '¬', wedge: '∧', vee: '∨', Rightarrow: '⇒', leftrightarrow: '↔', propto: '∝', equiv: '≡', ll: '≪', gg: '≫', mapsto: '↦', odot: '⊙', otimes: '⊗', oplus: '⊕', min: 'min', max: 'max', arg: 'arg', quad: ' ', qquad: ' ' })
    .map(([k, v]) => [new RegExp('\\\\' + k + '(?![a-zA-Z])', 'g'), v]),
  [/\\[,;:! ]/g, ' '], [/\\%/g, '%'], [/\\([&_#$])/g, '$1'], [/\\(?:left|right|big|Big|bigg|Bigg)\b/g, ''], [/\\([a-zA-Z]+)/g, '$1'], [/[{}]/g, '']];
const WRAP = TEX[0][0];
const tex = (s) => {
  s = s.replace(/\\\{/g, '\u0001').replace(/\\\}/g, '\u0002') // \{ \} are literal braces (sets)
    .replace(/\\(?:tiny|scriptsize|footnotesize|small|normalsize|large|Large|displaystyle|textstyle|scriptstyle|mathstrut|limits|nolimits)(?![a-zA-Z])/g, '');
  // Unwrap \mathbf{…} and friends (nested too), with a space after a command
  // or word so \in\mathbb{N} does not run together.
  for (let prev = ''; prev !== s;) { prev = s; s = s.replace(WRAP, (m, x, at, all) => (/[a-zA-Z]$/.test(all.slice(0, at)) ? ' ' : '') + x); }
  for (const [re, to] of TEX) s = s.replace(re, to);
  return s.replace(/\u0001/g, '{').replace(/\u0002/g, '}').trim();
};
const SKIP_TEXT = (el) => el.tag === 'annotation' || el.tag === 'annotation-xml' || el.tag === 'button' || hasClass(el, 'ltx_note_outer') || hasClass(el, 'ltx_tag');
function text(el) {
  let out = '';
  const rec = (n) => {
    for (const k of n.kids) {
      if (typeof k === 'string') { out += decode(k); continue; }
      if (k.tag === 'math') { const x = tex(k.a.alttext || ''); out += (/^[_^]/.test(x) ? '' : ' ') + x + ' '; continue; } // GPT3<math>_{x}</math> stays joined
      if (k.tag === 'br') { out += ' '; continue; }
      if (SKIP_TEXT(k) || RAW.has(k.tag)) continue;
      rec(k);
    }
  };
  rec(el);
  return out.replace(/\s+/g, ' ').replace(/\s+([,.;:)])/g, '$1').replace(/\(\s+/g, '(').trim();
}
/** The figure's own caption: a figcaption whose nearest figure is `fig`. */
const ownCaption = (fig) => { for (const el of walk(fig, isFig)) if (el.tag === 'figcaption') return el; return null; };
const tagOf = (cap) => { if (!cap) return ''; for (const el of walk(cap)) if (hasClass(el, 'ltx_tag')) return text({ kids: el.kids }).replace(/[:.]\s*$/, '').trim(); return ''; };

// ---- sanitized tables (an allowlist re-serialization, so safe to innerHTML) ----
const KEEP = new Set(('table thead tbody tfoot tr td th span div p sub sup b i em strong br small cite ' +
  'math semantics mrow mi mo mn ms msub msup msubsup mfrac msqrt mroot mtext mspace mover munder munderover mtable mtr mtd mstyle mpadded mphantom menclose mmultiscripts mprescripts none').split(' '));
const DROP = new Set(['annotation', 'annotation-xml', 'script', 'style', 'iframe', 'object', 'embed', 'svg', 'img', 'video', 'audio', 'figcaption', 'button', 'input', 'form']);
const KEEP_ATTR = new Set(['colspan', 'rowspan', 'mathvariant', 'display', 'stretchy', 'fence', 'separator', 'lspace', 'rspace', 'movablelimits', 'accent', 'accentunder', 'linethickness', 'columnalign', 'scriptlevel']);
const escT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function clean(el) {
  if (typeof el === 'string') return escT(decode(el));
  if (DROP.has(el.tag) || hasClass(el, 'ltx_note_outer')) return '';
  const inner = el.kids.map(clean).join('');
  if (!KEEP.has(el.tag)) return inner;
  const tag = el.tag === 'cite' ? 'span' : el.tag;
  let attrs = '';
  const cls = (el.a.class || '').split(/\s+/).filter((c) => /^ltx_[\w-]+$/.test(c)).join(' ');
  if (cls) attrs += ` class="${cls}"`;
  for (const [k, v] of Object.entries(el.a)) if (KEEP_ATTR.has(k) && /^[\w .%-]*$/.test(v)) attrs += ` ${k}="${v}"`;
  return VOID.has(tag) ? `<${tag}${attrs}>` : `<${tag}${attrs}>${inner}</${tag}>`;
}

// ---- inline SVG pictures, made standalone so an <img> can show them ----
function standaloneSvg(src) {
  let s = src.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)([a-z]+);/gi, (m, e) => { const c = decode(m); return c === m ? '' : `&#${c.codePointAt(0)};`; });
  if (!/^<svg[^>]*\sxmlns=/.test(s)) s = s.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
  s = s.replace(/(<foreignObject\b[^>]*>\s*<)([a-zA-Z][\w-]*)/g, '$1$2 xmlns="http://www.w3.org/1999/xhtml"');
  s = s.replace(/<math\b(?![^>]*xmlns)/g, '<math xmlns="http://www.w3.org/1998/Math/MathML"');
  s = s.replace(/<(br|img|hr|wbr|input|col)\b([^>]*?)\/?>/g, '<$1$2/>');
  // The drawing's units are TeX points; text sized in CSS pt would come out a third too big.
  s = s.replace(/font-size:\s*([\d.]+)pt/g, 'font-size:$1px');
  // LaTeXML colours text through CSS variables its stylesheet resolves; do the same here.
  const style = '<style>*{font-family:"Times New Roman",serif}[style*="--ltx-fg-color"]{color:var(--ltx-fg-color)}[style*="--ltx-bg-color"]{background:var(--ltx-bg-color)}</style>';
  return s.replace(/^(<svg[^>]*>)/, `$1${style}`);
}

const num = (v) => { const x = parseFloat(v); return Number.isFinite(x) && x > 0 ? x : null; };
function graphicSize(el) {
  let w = num(el.a.width), h = num(el.a.height);
  if (!(w && h)) { const ar = /aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/.exec(el.a.style || ''); if (ar) { w = num(ar[1]); h = num(ar[2]); } }
  if (!(w && h) && el.a.viewbox) { const v = el.a.viewbox.split(/[\s,]+/).map(Number); if (v[2] > 0 && v[3] > 0) { w = v[2]; h = v[3]; } }
  return { w: w ? Math.round(w) : null, h: h ? Math.round(h) : null };
}

// Arrangement of a figure's graphics: a part index, or ['r', ...] (side by
// side at a common height) or ['c', ...] (stacked at a common width).
// LaTeXML lays sub-figures out as flex rows split by ltx_flex_break; tables
// stack rows of cells; other blocks stack, inline content runs in a row.
const STACK = new Set(['table', 'thead', 'tbody', 'tfoot', 'ul', 'ol']);
const BLOCK = new Set(['p', 'div', 'figure', 'table', 'ul', 'ol', 'li', 'section', 'blockquote', 'pre']);
const pack = (d, xs) => {
  xs = xs.filter((x) => x != null);
  if (xs.length < 2) return xs[0] ?? null;
  return [d, ...xs.flatMap((x) => (Array.isArray(x) && x[0] === d ? x.slice(1) : [x]))];
};
function arrange(el, leaf) {
  const g = leaf(el);
  if (g !== undefined) return g;
  if (el.tag === 'figcaption' || el.tag === 'math' || RAW.has(el.tag)) return null;
  const kids = el.kids.filter((k) => typeof k !== 'string');
  if (STACK.has(el.tag)) return pack('c', kids.map((k) => arrange(k, leaf)));
  const rows = [[]];
  for (const k of kids) {
    if (k.tag === 'br' || (k.tag === 'div' && hasClass(k, 'ltx_flex_break'))) { rows.push([]); continue; }
    const x = arrange(k, leaf);
    if (BLOCK.has(k.tag) && !hasClass(k, 'ltx_flex_cell')) { rows.push([x], []); continue; }
    rows.at(-1).push(x);
  }
  return pack('c', rows.map((r) => pack('r', r)));
}
/** Width over height of an arrangement. */
const aspect = (n, parts) => {
  if (typeof n === 'number') return parts[n].w / parts[n].h;
  const a = n.slice(1).map((x) => aspect(x, parts));
  return n[0] === 'r' ? a.reduce((s, x) => s + x, 0) : 1 / a.reduce((s, x) => s + 1 / x, 0);
};

/** All figures (and tables) of a LaTeXML page. */
export function extract(html, base, aid) {
  const root = parse(html);
  const docStart = Math.max(0, html.indexOf('<article'));
  const span = Math.max(1, html.length - docStart);
  const out = [];
  const svgs = [];
  const figs = [];
  for (const el of walk(root, isFig)) if (isFig(el)) figs.push(el);
  const visit = (fig) => {
    if (hasClass(fig, 'ltx_float_algorithm') || (hasClass(fig, 'ltx_float') && !hasClass(fig, 'ltx_figure') && !hasClass(fig, 'ltx_table'))) return;
    const cap = ownCaption(fig);
    const label = tagOf(cap);
    // A wrapper with no caption whose panels are numbered figures (side-by-side
    // minipages): each panel is a figure of its own.
    if (!label) {
      const panels = [...walk(fig, isFig)].filter((x) => isFig(x) && /^(Figure|Fig|Table|Tab)\b/i.test(tagOf(ownCaption(x))));
      if (panels.length) { panels.forEach(visit); return; }
    }
    const table = hasClass(fig, 'ltx_table') || /^Tab/i.test(label);
    let caption = cap ? text(cap) : '';
    if (!caption) caption = [...walk(fig)].filter((x) => x.tag === 'figcaption').map(text).filter(Boolean).join(' ');
    caption = caption.replace(/^(Figure|Fig\.?|Table)\s*[\w.]+\s*[:.]\s*/i, '').trim();
    // Graphics, and how they are arranged: a tree of rows and columns.
    const parts = [];
    const leaf = (el) => {
      let src = null; let inline = false;
      if (el.tag === 'img') { if (hasClass(el, 'ltx_Math')) return null; src = el.a.src; }
      else if (el.tag === 'object') { if (!el.a.data || !/svg|image/.test(el.a.type || 'image')) return null; src = el.a.data; }
      else if (el.tag === 'embed') { if (!/\.(svg|png|jpe?g|gif)$/i.test(el.a.src || '')) return null; src = el.a.src; }
      else if (el.tag === 'svg') inline = true;
      else return undefined; // not a graphic: look inside
      const { w, h } = graphicSize(el);
      if ((w && h && w < 24 && h < 24) || parts.length >= 16) return null; // icons and glyphs
      if (src && src.startsWith('data:') && src.length > 100000) return null;
      let img;
      if (inline) {
        const k = svgs.length;
        svgs.push({ f: fig.a.id || `fig${out.length}`, k, svg: standaloneSvg(html.slice(el.s, el.e)) });
        img = `/figures/svg?id=${encodeURIComponent('arxiv:' + aid)}&f=${encodeURIComponent(svgs[k].f)}&k=${k}`;
      } else { try { img = new URL(src, base).href; } catch { return null; } }
      parts.push({ img, w: w || 400, h: h || 300, ...(inline ? { inline: true } : {}) });
      return parts.length - 1;
    };
    const tree = arrange(fig, leaf);
    const n = label.replace(/^(Figure|Fig\.?|Table|Tab\.?)\s*/i, '').trim() || null;
    const f = { id: fig.a.id || null, n, label: label || (table ? 'Table' : 'Figure'), caption, at: +((fig.s - docStart) / span).toFixed(4), href: fig.a.id ? `${base}#${fig.a.id}` : base };
    if (table) f.table = true;
    if (parts.length) {
      // The whole figure's size: its aspect from the arrangement, its area
      // about that of its parts.
      const ar = aspect(tree, parts);
      const area = parts.reduce((s, p) => s + p.w * p.h, 0);
      const main = parts.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
      Object.assign(f, { img: main.img, w: Math.round(Math.sqrt(area * ar)), h: Math.round(Math.sqrt(area / ar)) });
      if (main.inline) f.inline = true;
      if (parts.length > 1) Object.assign(f, { parts, lay: tree });
    } else {
      // No graphics: a table, or a "figure" typeset as a table (prompt
      // examples and the like). Shown as HTML, flagged as a table.
      const tabs = [...walk(fig, (x) => x.tag === 'table')].filter((x) => x.tag === 'table');
      if (!tabs.length) return; // nothing we can show (e.g. a failed conversion)
      f.table = true;
      const htmlT = tabs.map(clean).join('');
      if (htmlT.length > 60000) return;
      const trs = tabs.flatMap((t) => [...walk(t)].filter((x) => x.tag === 'tr'));
      f.html = htmlT; f.rows = trs.length;
      f.cols = Math.max(1, ...trs.map((tr) => [...walk(tr, (x) => x.tag === 'td' || x.tag === 'th')].filter((x) => x.tag === 'td' || x.tag === 'th').reduce((s, c) => s + (Number(c.a.colspan) || 1), 0)));
    }
    out.push(f);
  };
  figs.forEach(visit);
  return { figures: out, svgs };
}

export default function (app) {
  const { cache, CACHE } = app;
  cache.ALLOW.add('ar5iv.labs.arxiv.org');
  cache.ALLOW.add('ar5iv.org');
  const DIR = join(CACHE, 'figures');
  mkdirSync(join(DIR, 'svg'), { recursive: true });
  const stats = { lists: 0, built: 0, none: 0 };

  // Fetching goes through the cache's per-host politeness (arXiv: a couple of
  // requests at a time). The river's prefetches ask with bg=1, so they never
  // hold up the page the reader is waiting for; a foreground ask for a paper
  // already being fetched in the background promotes that fetch.
  const building = new Map(); // aid -> { p, url (the source being fetched) }
  async function build(aid, job) {
    const file = join(DIR, safe(aid) + '.json');
    if (existsSync(file)) {
      try { const j = JSON.parse(readFileSync(file, 'utf-8')); if (j.v === VER) return j.figures; } catch { /* rebuild */ }
    }
    let lastErr = null;
    for (const url of SOURCES(aid)) {
      job.url = url;
      try { await cache.ensure(url, { fg: job.fg }); } catch (e) { lastErr = e; continue; }
      const html = cache.read(url).toString('utf-8');
      const { figures, svgs } = extract(html, url, aid);
      if (svgs.length) {
        const d = join(DIR, 'svg', safe(aid));
        mkdirSync(d, { recursive: true });
        for (const s of svgs) writeFileSync(join(d, `${safe(s.f)}-${s.k}.svg`), s.svg);
      }
      writeFileSync(file, JSON.stringify({ v: VER, at: Date.now(), src: url, figures }));
      stats.built++;
      return figures;
    }
    // Neither source has the paper as HTML: remember that (only for 404s,
    // so a network blip does not hide a paper's figures for good).
    if (/HTTP 404/.test(lastErr?.message || '')) { writeFileSync(file, JSON.stringify({ v: VER, at: Date.now(), src: null, figures: [] })); stats.none++; return []; }
    throw lastErr || new Error('no source');
  }

  app.route('GET', '/figures', async (req, res, url) => {
    const aid = String(url.searchParams.get('id') || '').replace(/^arxiv:/, '');
    if (!ID_RE.test(aid)) return app.json(res, { error: 'expected id=arxiv:<arXiv id>' }, 400);
    const fg = url.searchParams.get('bg') !== '1';
    stats.lists++;
    let job = building.get(aid);
    if (!job) {
      job = { fg, url: null };
      job.p = build(aid, job).finally(() => setTimeout(() => building.delete(aid), 1000));
      building.set(aid, job);
    } else if (fg && !job.fg) { job.fg = true; if (job.url) cache.ensure(job.url, { fg: true }).catch(() => {}); }
    try { app.json(res, await job.p); } catch (e) { app.json(res, { error: String(e.message || e) }, 502); }
  });

  app.route('GET', '/figures/svg', async (req, res, url) => {
    const aid = String(url.searchParams.get('id') || '').replace(/^arxiv:/, '');
    const file = join(DIR, 'svg', safe(aid), `${safe(url.searchParams.get('f'))}-${Number(url.searchParams.get('k')) || 0}.svg`);
    if (!ID_RE.test(aid) || !existsSync(file)) return app.send(res, 404, 'not found');
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
    createReadStream(file).pipe(res);
  });

  app.status(() => ({ figures: stats }));
}
