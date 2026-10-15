// Images inside posts and web articles, and the rescue of broken images and
// documents (the engine is server/rescue.mjs).
//
//   GET  /img?u=URL[&alt=URL]   the image, fetched once into the disk cache. A broken one
//                               (HTTP error, a web page, a known placeholder) is looked for
//                               elsewhere: the post's other copies (alt), mirrors, the Wayback
//                               Machine. 200 with X-Stacks-Via / -From / -Archived when rescued;
//                               302 to the original over 15 MB; when there is nothing to show, a
//                               1x1 GIF with X-Stacks-Status: unavailable | pending (still looking)
//                               | refused, and X-Stacks-Why. This app's pages only (all routes here).
//   POST /img/info {item, page, title, imgs: [{u, alt, w, h, alts}], warm}
//                            -> {url: {st: ok|rescued|bad|big|pending, w, h, via, ts, why, sug}}
//                               for what is known; warm fetches the rest in the background.
//   POST /rescue/report {item, page, title, imgs: [{u, alt, w, h, alts, flag}]}
//                               context for broken images; flag: 'placeholder' when the reader
//                               says an image it shows is wrong (learned, then looked for again)
//   POST /rescue/manual {u, from}  a copy found by hand (checked before it is used)
//   POST /rescue/run {wait, force}  run the scavenger now (it also runs every few hours)
//   GET  /rescue/doc?u=URL[&kind=web|pdf&t=title]  -> {st, via, archived, date, from, why} for
//                               the reader's header (kind registers an allowlisted document)
//   GET  /rescue/state       -> counts, what is broken or rescued, the log and the runs
//
// Settings (environment): STACKS_RESCUE_EVERY hours between scavenger runs (4);
// STACKS_RESCUE_AI=1 lets the scavenger ask Claude (STACKS_RESCUE_MODEL,
// default claude-haiku-5-5, with web search) for items the archive lacks,
// within the daily AI budget; STACKS_WAYBACK / STACKS_WAYBACK_API point at
// another Wayback Machine.
import { readFile } from 'fs/promises';
import * as R from '../rescue.mjs';

const EVERY = (Number(process.env.STACKS_RESCUE_EVERY) || 4) * 3600e3;
// The browser keeps six connections to this server, shared by every image and
// every other request of the app, so an image never holds one for long: the
// reader waits at most FG_WAIT for the original address (a slow host), and
// RESCUE_WAIT once the original has failed and mirrors and the archive are
// being asked. The chip then says it is still looking, and the image comes
// back when found.
const FG_WAIT = 10e3;
const RESCUE_WAIT = 1500;
// "No image" is a 1x1 transparent GIF with status 200 (an error status would
// put a red line in the console for every broken image); X-Stacks-Status says
// which (unavailable, pending, refused), and the reader turns it into a chip.
const NONE = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export default function (app) {
  const { cache } = app;
  // Dead documents (404, 410, 451, gone hosts, placeholder pages) fall back to the archive inside cache.ensure.
  cache.onDead?.(R.deadHook);

  // Only this app's own pages: a web page elsewhere could otherwise use the
  // reader's server to fetch, flag or replace images (cross-site requests carry
  // an Origin or Sec-Fetch-Site header). A DNS-rebound name is not loopback.
  function ownPage(req) {
    if (req.headers['sec-fetch-site'] === 'cross-site') return false;
    const o = req.headers.origin;
    if (!o) return true;
    try {
      const x = new URL(o);
      return x.host === req.headers.host && /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|\d+\.\d+\.\d+\.\d+)$/.test(x.hostname);
    } catch { return false; }
  }

  const ascii = (s) => String(s ?? '').replace(/[^\x20-\x7e]/g, '');
  async function serve(req, res, u, m) {
    const etag = `"${m.sha1 || m.size + '-' + m.at}"`;
    const hdr = {
      ETag: etag, 'Cache-Control': 'private, max-age=3600', 'Access-Control-Allow-Origin': '*',
      // Images only: never a page that could run script on this origin (an SVG opened directly).
      'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Access-Control-Expose-Headers': 'X-Stacks-Via, X-Stacks-From, X-Stacks-Archived',
      ...(m.via ? { 'X-Stacks-Via': ascii(m.via), 'X-Stacks-From': ascii(m.from) } : {}),
      ...(m.ts ? { 'X-Stacks-Archived': ascii(m.ts) } : {}),
    };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, hdr); return res.end(); }
    let buf;
    try { buf = await readFile(cache.paths(u).body); } catch { return false; } // evicted just now
    res.writeHead(200, { ...hdr, 'Content-Type': m.type, 'Content-Length': buf.length });
    res.end(buf);
    return true;
  }
  const unavailable = (res, why, st = 'unavailable') => {
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': NONE.length, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-Stacks-Status, X-Stacks-Why', 'X-Content-Type-Options': 'nosniff', 'X-Stacks-Status': st, 'X-Stacks-Why': ascii(why).slice(0, 200) });
    res.end(NONE);
  };

  app.route('GET', '/img', async (req, res, url) => {
    const u = url.searchParams.get('u') || '';
    if (!ownPage(req)) return unavailable(res, 'only for this app', 'refused');
    if (!R.okUrl(u)) return unavailable(res, 'not an http(s) address on the open web', 'refused');
    const alt = url.searchParams.get('alt');
    if (alt && R.okUrl(alt)) R.noteCtx(u, { alts: [alt] });
    const hit = R.cachedImage(u);
    if (hit) { cache.stats.hits++; if (await serve(req, res, u, hit)) return; }
    else cache.stats.misses++;
    const t0 = Date.now();
    let iv = null, tr = 0;
    const slow = new Promise((ok) => {
      iv = setInterval(() => {
        if (!tr && R.stageOf(u) === 'rescue') tr = Date.now();
        if ((tr && Date.now() - tr > RESCUE_WAIT) || Date.now() - t0 > FG_WAIT) ok({ st: 'slow' });
      }, 100);
    });
    const out = await Promise.race([R.resolveImage(u, { fg: true }), slow]).finally(() => clearInterval(iv));
    if (out.st === 'big') { res.writeHead(302, { Location: u, 'Cache-Control': 'no-store' }); return res.end(); }
    if ((out.st === 'ok' || out.st === 'rescued') && out.meta && await serve(req, res, u, out.meta)) return;
    if (out.st === 'slow') return unavailable(res, 'still looking for a copy', 'pending');
    unavailable(res, out.why || 'unavailable');
  });

  // The POST routes below change state or start fetches: this app's pages only.
  const guard = (fn) => async (req, res, ...rest) => (ownPage(req) ? fn(req, res, ...rest) : app.json(res, { error: 'only for this app' }, 403));

  app.route('POST', '/img/info', guard(async (req, res) => {
    const b = await app.body(req);
    const out = {};
    let warmed = 0;
    for (const x of (b.imgs || []).slice(0, 500)) {
      const u = x?.u;
      if (!R.okUrl(u)) continue;
      R.noteCtx(u, { item: b.item, page: b.page, title: b.title, alt: x.alt, w: x.w, h: x.h, alts: x.alts });
      const info = R.imageInfo(u);
      if (info) out[u] = info;
      else if (b.warm && warmed < 80) { warmed++; R.resolveImage(u, { fg: false, how: 'warm' }).catch(() => {}); }
    }
    app.json(res, out);
  }));

  app.route('POST', '/rescue/report', guard(async (req, res) => {
    const b = await app.body(req);
    const out = {};
    for (const x of (b.imgs || []).slice(0, 200)) {
      const u = x?.u;
      if (!R.okUrl(u)) continue;
      R.noteCtx(u, { item: b.item, page: b.page, title: b.title, alt: x.alt, w: x.w, h: x.h, alts: x.alts });
      if (x.flag === 'placeholder') {
        const r = await Promise.race([R.flagImage(u), new Promise((ok) => setTimeout(() => ok({ st: 'pending' }), FG_WAIT).unref())]);
        out[u] = { st: r.st, why: r.why, via: r.meta?.via, ts: r.meta?.ts, w: r.meta?.w, h: r.meta?.h };
      } else out[u] = R.imageInfo(u) || { st: 'unknown' };
    }
    app.json(res, out);
  }));

  app.route('POST', '/rescue/manual', guard(async (req, res) => {
    const b = await app.body(req);
    if (!R.okUrl(b.u)) return app.json(res, { st: 'bad', why: 'bad image address' }, 400);
    const r = await R.manualCopy(b.u, String(b.from || '').trim());
    app.json(res, { st: r.st, why: r.why, via: r.meta?.via, w: r.meta?.w, h: r.meta?.h });
  }));

  const ai = () => (R.AI_ON && (app.hasKey() || app.ai?.MOCK) ? () => R.agentic(app.ai) : null);
  let nextRun = 0;
  const run = (reason, extra = {}) => R.scavenge({ reason, ai: ai(), ...extra });
  app.route('POST', '/rescue/run', guard(async (req, res) => {
    const b = await app.body(req).catch(() => ({}));
    const p = run('on demand', { force: !!b.force });
    if (b.wait) return app.json(res, await p);
    p.catch(() => {});
    app.json(res, { started: true });
  }));

  app.route('GET', '/rescue/doc', (req, res, url) => {
    const u = url.searchParams.get('u') || '', kind = url.searchParams.get('kind');
    // The reader names the item's kind: documents of allowlisted hosts not in corpus.json at startup fall back too.
    if (kind && cache.allowed(u)) R.addDoc(u, { kind, t: url.searchParams.get('t') || '' });
    app.json(res, R.docState(u));
  });

  app.route('GET', '/rescue/state', (req, res) => {
    const pick = (o, n) => Object.entries(o).slice(-n).map(([u, r]) => ({ u, ...r }));
    app.json(res, {
      counts: R.counts(), blocked: R.S.blocked, running: R.isRunning(), nextRun,
      ai: { on: R.AI_ON, model: R.AI_MODEL, key: app.hasKey(), ...R.S.ai },
      images: pick(Object.fromEntries(Object.entries(R.S.imgs).filter(([, r]) => r.st !== 'big')), 400),
      docs: pick(R.S.docs, 200), log: R.S.log.slice(-100), runs: R.S.runs.slice(-10),
      placeholders: R.S.placeholders,
    });
  });

  app.status(() => {
    const last = R.S.runs.at(-1);
    return { rescue: { ...R.counts(), blocked: Object.keys(R.S.blocked), running: R.isRunning(), nextRun, ai: R.AI_ON ? (app.hasKey() ? 'on' : 'no key') : 'off', ...(last ? { lastRun: { at: last.at, rescued: last.rescued + last.docsRescued, tried: last.tried + last.docsTried } } : {}) } };
  });

  app.onStart(() => {
    setTimeout(() => R.checkCanaries().catch(() => {}), 3000).unref();
    setInterval(() => R.checkCanaries().catch(() => {}), 12 * 3600e3).unref();
    // The first pass a few minutes in (after the reader's own warm-up), then every few hours.
    nextRun = Date.now() + 10 * 60e3;
    setTimeout(() => { nextRun = Date.now() + EVERY; run('schedule').catch(() => {}); }, 10 * 60e3).unref();
    setInterval(() => { nextRun = Date.now() + EVERY; run('schedule').catch(() => {}); }, EVERY).unref();
  });
}
