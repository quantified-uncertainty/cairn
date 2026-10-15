// Web pages: open web articles, the HTML version of arXiv papers, and live
// pages for the N-up view (ui/js/features/webview.js).
//
//   GET /web/final?u=URL   -> {url}  the URL after redirects (relative links
//                                     in the page resolve against it)
//   GET /web/arxiv?id=ID   -> {url, via}  arxiv.org/html/ID, else ar5iv; the
//                                     page is fetched into the cache
//   GET /web/live?u=URL    -> the original page with <base href> and a small
//                                     controller script, for live iframes
//   GET /web/test-items.json  dev-only test items (?webtest=1 in the UI)
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Open-access hosts the web lanes use (Distill and Transformer Circuits are
// CC-BY; ar5iv is arXiv's LaTeXML mirror; ar5iv.labs.arxiv.org is already
// covered by arxiv.org).
const HOSTS = ['distill.pub', 'transformer-circuits.pub', 'ar5iv.org'];

// Test items for ?webtest=1: one of each kind of page this module handles.
const TEST = [
  { id: 'webtest:momentum', kind: 'web', t: 'Why Momentum Really Works', a: 'Gabriel Goh', y: 2017, url: 'https://distill.pub/2017/momentum/', src: 'Distill' },
  { id: 'webtest:framework', kind: 'web', t: 'A Mathematical Framework for Transformer Circuits', a: 'Elhage et al.', y: 2021, url: 'https://transformer-circuits.pub/2021/framework/index.html', src: 'Transformer Circuits' },
  { id: 'webtest:biology', kind: 'web', t: 'On the Biology of a Large Language Model', a: 'Lindsey et al.', y: 2025, url: 'https://transformer-circuits.pub/2025/attribution-graphs/biology.html', src: 'Transformer Circuits' },
  { id: 'webtest:metr', kind: 'web', t: 'Measuring AI Ability to Complete Long Tasks', a: 'METR', y: 2025, url: 'https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/', src: 'METR' },
  { id: 'webtest:alphaevolve', kind: 'web', t: 'AlphaEvolve: a Gemini-powered coding agent', a: 'Google DeepMind', y: 2025, url: 'https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/', src: 'Google DeepMind' },
  { id: 'webtest:medium', kind: 'web', t: 'Software 2.0', a: 'Andrej Karpathy', y: 2017, url: 'https://karpathy.medium.com/software-2-0-a64152b37c35', src: 'Medium' },
  { id: 'arxiv:1706.03762', kind: 'pdf', t: 'Attention Is All You Need', a: 'Vaswani et al.', y: 2017, url: 'https://arxiv.org/pdf/1706.03762', page: 'https://arxiv.org/abs/1706.03762', src: 'arXiv' },
  { id: 'arxiv:2401.04088', kind: 'pdf', t: 'Mixtral of Experts', a: 'Jiang et al.', y: 2024, url: 'https://arxiv.org/pdf/2401.04088', page: 'https://arxiv.org/abs/2401.04088', src: 'arXiv' },
];
const TEST_HOSTS = ['metr.org', 'deepmind.google', 'medium.com'];

/** The controller injected into live pages. It runs inside each iframe
 *  (a different origin from the app), so it talks to the app only through
 *  postMessage: the app scrolls it; it reports its height and forwards the
 *  reader's wheel, keys and link clicks so all the views move together.
 *  Serialized with toString(), so it must be self-contained ASCII. */
function controller() {
  var j = Number((/^wv(\d+)/.exec(window.name) || [])[1] || 0);
  var post = function (m) { m.wv = 1; m.j = j; parent.postMessage(m, '*'); };
  var se = function () { return document.scrollingElement || document.documentElement; };
  // The page's own URL is not ours to change: its base is another origin, so
  // pushState/replaceState would throw and break the page's scripts.
  ['pushState', 'replaceState'].forEach(function (k) {
    var f = history[k];
    history[k] = function () { try { return f.apply(this, arguments); } catch (e) { return undefined; } };
  });
  // Requests to the page's own host go through the app's caching proxy, which
  // is same-origin here (no CORS) and serves allowlisted hosts only.
  var host = new URL(document.baseURI).hostname;
  var via = function (u) {
    try {
      var x = new URL(u, document.baseURI);
      if (x.hostname === host && /^https?:$/.test(x.protocol)) return location.origin + '/proxy?u=' + encodeURIComponent(x.href);
    } catch (e) { /* leave it */ }
    return u;
  };
  var F = window.fetch;
  if (F) window.fetch = function (input, init) {
    var m = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (m === 'GET') {
      if (typeof input === 'string' || input instanceof URL) input = via(String(input));
      else if (input && input.url) { var nu = via(input.url); if (nu !== input.url) input = new Request(nu, input); }
    }
    return F.call(this, input, init);
  };
  var XO = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) {
    var a = Array.prototype.slice.call(arguments);
    if (String(m).toUpperCase() === 'GET') a[1] = via(String(u));
    return XO.apply(this, a);
  };

  // Scrolling belongs to the app: no scrollbars, and blank space after the end
  // so the last views can scroll past it instead of repeating the end.
  var style = document.createElement('style');
  var pad = 0, want = null;
  // No scroll anchoring: a view stays exactly where the app put it when
  // content above it changes size (the other views see the same change).
  var setPad = function (px) { pad = px; style.textContent = 'html{overflow:hidden!important;scrollbar-width:none!important;overflow-anchor:none!important}html::-webkit-scrollbar{display:none}html::after{content:"";display:block;height:' + px + 'px}'; };
  setPad(3 * innerHeight);
  (document.head || document.documentElement).appendChild(style);
  var lastH = -1, lastVh = 0;
  var report = function () {
    var h = Math.max(0, se().scrollHeight - pad);
    if (Math.abs(h - lastH) < 4 && innerHeight === lastVh) return;
    lastH = h; lastVh = innerHeight;
    post({ type: 'metrics', h: h, vh: innerHeight });
  };
  addEventListener('message', function (e) {
    var m = e.data;
    if (e.source !== parent || !m || m.wv !== 1) return;
    if (m.type === 'scroll') { want = m.y; se().scrollTo({ top: m.y, behavior: 'instant' }); }
    else if (m.type === 'pad') { setPad(m.px); report(); }
  });
  var settle = 0;
  addEventListener('scroll', function () {
    clearTimeout(settle);
    settle = setTimeout(function () {
      var y = se().scrollTop, max = se().scrollHeight - innerHeight;
      // A scroll the app did not ask for (the page's own script, find in
      // page): re-sync the others. A position clamped by a page still
      // loading is not one.
      if (want == null || (Math.abs(y - want) > 3 && !(want > max && y >= max - 2))) post({ type: 'scrolled', y: y });
      want = y;
    }, 120);
  }, { passive: true });
  // Every view loads every image, so all copies have the same layout (lazy
  // loading would load different images in each view and shift them apart).
  var eager = function (root) { root.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]').forEach(function (el) { el.loading = 'eager'; }); };
  // How wide the text needs to be, when the page does not fit this view
  // (its text runs past the right edge): the app then shows fewer, wider
  // views, or scales them down a little.
  var need = function () {
    var els = document.querySelectorAll('p, h1, h2, h3, blockquote'), lo = innerWidth, hi = 0;
    for (var i = 0; i < els.length && i < 800; i++) {
      var el = els[i];
      if (el.closest('nav, header, footer, aside, [aria-hidden="true"]') || !el.textContent.trim()) continue;
      var r = el.getBoundingClientRect();
      if (!r.width) continue;
      if (r.right > hi) hi = r.right;
      if (r.left < lo) lo = r.left;
    }
    return hi > innerWidth + 4 ? Math.ceil(hi + Math.max(12, Math.min(lo, 60))) : 0;
  };
  var started = false;
  var start = function () {
    if (started) return;
    started = true;
    if (window.MutationObserver) new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && (n.tagName === 'IMG' || n.tagName === 'IFRAME' || n.firstElementChild)) { if (n.loading === 'lazy') n.loading = 'eager'; if (n.firstElementChild) eager(n); } }); });
    }).observe(document.documentElement, { childList: true, subtree: true });
    if (window.ResizeObserver) new ResizeObserver(report).observe(document.body);
    report();
    post({ type: 'ready' });
  };
  // Ready as soon as there is a body, so the view shows the page as it loads.
  (function wait() { if (document.body) start(); else setTimeout(wait, 30); })();
  addEventListener('DOMContentLoaded', function () { eager(document); report(); });
  addEventListener('load', function () { report(); setTimeout(function () { report(); post({ type: 'fit', need: need() }); }, 700); });
  addEventListener('resize', function () { setTimeout(report, 100); });

  // An inner scroller (code block, wide table, widget) keeps its own wheel.
  var scrolls = function (el, dx, dy) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      var cs = getComputedStyle(el);
      if (dy && /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1 && (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0)) return true;
      if (dx && /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1 && (dx > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0)) return true;
    }
    return false;
  };
  addEventListener('wheel', function (e) {
    if (e.defaultPrevented || e.ctrlKey || scrolls(e.target, e.deltaX, e.deltaY)) return;
    e.preventDefault();
    post({ type: 'wheel', dx: e.deltaX, dy: e.deltaY, mode: e.deltaMode, shift: e.shiftKey });
  }, { passive: false });
  addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab') return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    post({ type: 'key', key: e.key, shift: e.shiftKey });
  });
  addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || !e.target.closest) return;
    var a = e.target.closest('a[href]');
    if (!a || /^javascript:/i.test(a.getAttribute('href'))) return;
    var u = new URL(a.href), here = new URL(document.baseURI);
    if (u.hash && u.origin + u.pathname === here.origin + here.pathname) {
      // In-page link: move every view so the target starts the first one.
      var id = decodeURIComponent(u.hash.slice(1));
      var t = document.getElementById(id) || document.getElementsByName(id)[0];
      if (t) { e.preventDefault(); post({ type: 'goto', y: t.getBoundingClientRect().top + se().scrollTop - 12 }); }
      return;
    }
    e.preventDefault();
    post({ type: 'open', href: u.href });
  });
}

export default function (app) {
  const { cache } = app;
  for (const h of HOSTS) cache.ALLOW.add(h);

  // Small JSON memos in the cache folder.
  const memo = (name) => {
    const file = join(app.CACHE, name);
    let data = {};
    try { data = JSON.parse(readFileSync(file, 'utf-8')); } catch { /* new */ }
    let t = null;
    return { data, save() { clearTimeout(t); t = setTimeout(() => { try { writeFileSync(file, JSON.stringify(data)); } catch { /* read-only */ } }, 500); } };
  };
  const finals = memo('web-final.json');
  const arx = memo('web-arxiv.json');
  const arxMiss = new Map(); // id -> time of a failed lookup (retry after an hour)

  /** Follow redirects with HEAD requests (no body), up to 6 hops. */
  async function finalUrl(u) {
    if (finals.data[u]) return finals.data[u];
    try { const m = cache.cached(u) && cache.meta(u); if (m?.final) return m.final; } catch { /* no meta */ }
    let cur = u;
    for (let hop = 0; hop < 6; hop++) {
      const res = await fetch(cur, { method: 'HEAD', redirect: 'manual', headers: { 'User-Agent': app.UA }, signal: AbortSignal.timeout(5000) });
      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) { cur = new URL(loc, cur).href; continue; }
      break;
    }
    finals.data[u] = cur; finals.save();
    return cur;
  }
  app.route('GET', '/web/final', async (req, res, url) => {
    const u = url.searchParams.get('u');
    if (!u || !cache.allowed(u)) return app.json(res, { url: u }, 403);
    try { app.json(res, { url: await finalUrl(u) }); } catch { app.json(res, { url: u }); }
  });

  /** arXiv's own HTML (LaTeXML), else ar5iv; only a real LaTeXML page counts. */
  async function resolveArxiv(id) {
    if (arx.data[id]) return arx.data[id];
    if (Date.now() - (arxMiss.get(id) || 0) < 3600e3) throw new Error('No HTML version of this paper');
    for (const [via, u] of [['arXiv', `https://arxiv.org/html/${id}`], ['ar5iv', `https://ar5iv.labs.arxiv.org/html/${id}`]]) {
      try {
        await cache.ensure(u);
        if (/ltx_document|LaTeXML/.test(cache.read(u).toString('utf-8', 0, 200000))) {
          arx.data[id] = { url: u, via }; arx.save();
          return arx.data[id];
        }
      } catch { /* try the next */ }
    }
    arxMiss.set(id, Date.now());
    throw new Error('No HTML version of this paper');
  }
  app.route('GET', '/web/arxiv', async (req, res, url) => {
    const id = String(url.searchParams.get('id') || '').replace(/^arxiv:/, '');
    if (!/^[\w./-]{4,40}$/.test(id)) return app.json(res, { error: 'bad id' }, 400);
    try { app.json(res, await resolveArxiv(id)); } catch (e) { app.json(res, { error: e.message }, 404); }
  });

  // Live pages. The response is the cached original with, first thing in
  // <head>, a <base href> (so its relative URLs load from the real site) and
  // the controller. Bytes are kept as they are (latin1 round trip), so the
  // page's own charset still applies.
  const CTRL = `<script>(${controller.toString()})();</script>`;
  const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  app.route('GET', '/web/live', async (req, res, url) => {
    const u = url.searchParams.get('u');
    if (!u || !cache.allowed(u)) return app.send(res, 403, 'host not allowed');
    try { await cache.ensure(u); } catch (e) { return app.send(res, 502, 'Could not fetch the page: ' + e.message); }
    const m = cache.meta(u);
    let base = await finalUrl(u).catch(() => u);
    let html = cache.read(u).toString('latin1');
    // The page's own <base> (often relative) is resolved and replaced by ours.
    html = html.replace(/<base\b[^>]*>/gi, (tag) => {
      const h = /href\s*=\s*["']?([^"'\s>]+)/i.exec(tag);
      if (h) try { base = new URL(h[1], base).href; } catch { /* keep */ }
      return '';
    });
    // A CSP meta tag would block the controller (it is inline).
    html = html.replace(/<meta[^>]+http-equiv\s*=\s*["']?content-security-policy[^>]*>/gi, '');
    const inject = `<base href="${attr(base)}">${CTRL}`;
    const at = html.search(/<head\b[^>]*>/i);
    if (at >= 0) { const end = html.indexOf('>', at) + 1; html = html.slice(0, end) + inject + html.slice(end); }
    else html = inject + html;
    const type = /html/i.test(m.type) ? m.type : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'Referrer-Policy': 'no-referrer' });
    res.end(Buffer.from(html, 'latin1'));
  });

  app.route('GET', '/web/test-items.json', (req, res) => {
    for (const h of TEST_HOSTS) cache.ALLOW.add(h);
    app.json(res, TEST.map((x) => ({ lane: 'web-test', why: 'Web reading test item', score: 1, ...x })));
  });
}
