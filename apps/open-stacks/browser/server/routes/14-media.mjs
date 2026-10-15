// Images inside posts and web articles, and the rescue of broken images and
// documents (the engine is server/rescue.mjs).
//
//   GET  /img?u=URL[&alt=URL]   the image, fetched once into the disk cache. A broken one
//                               (HTTP error, a web page, a known placeholder) is looked for
//                               elsewhere: the post's other copies (alt), mirrors, the Wayback
//                               Machine. 200 with X-Stacks-Via / -From / -Archived when rescued;
//                               302 to the original over 15 MB; 404 {why} when nothing works.
//   POST /img/info {item, page, title, imgs: [{u, alt, w, h, alts}], warm}
//                            -> {url: {st: ok|rescued|bad|big|pending, w, h, via, ts, why, sug}}
//                               for what is known; warm fetches the rest in the background.
//   POST /rescue/report {item, page, title, imgs: [{u, alt, w, h, alts, flag}]}
//                               context for broken images; flag: 'placeholder' when the reader
//                               says an image it shows is wrong (learned, then looked for again)
//   POST /rescue/manual {u, from}  a copy found by hand (checked before it is used)
//   POST /rescue/run {wait, force}  run the scavenger now (it also runs every few hours)
//   GET  /rescue/doc?u=URL   -> {st, via, archived, date, from, why} for the reader's header
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
const FG_WAIT = 40e3; // the longest the reader waits for a rescue before the image shows as unavailable

export default function (app) {
  const { cache } = app;
  // Dead documents (404, 410, 451, gone hosts, placeholder pages) fall back to the archive inside cache.ensure.
  cache.onDead?.(R.deadHook);

  const ascii = (s) => String(s ?? '').replace(/[^\x20-\x7e]/g, '');
  async function serve(req, res, u, m) {
    const etag = `"${m.sha1 || m.size + '-' + m.at}"`;
    const hdr = {
      ETag: etag, 'Cache-Control': 'private, max-age=3600', 'Access-Control-Allow-Origin': '*',
      // Images only: never a page that could run script on this origin (an SVG opened directly).
      'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Access-Control-Expose-Headers': 'X-Stacks-Via, X-Stacks-From, X-Stacks-Archived',
      ...(m.via ? { 'X-Stacks-Via': ascii(m.via), 'X-Stacks-From': ascii(m.from), 'X-Stacks-Archived': ascii(m.ts) } : {}),
    };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, hdr); return res.end(); }
    let buf;
    try { buf = await readFile(cache.paths(u).body); } catch { return false; } // evicted just now
    res.writeHead(200, { ...hdr, 'Content-Type': m.type, 'Content-Length': buf.length });
    res.end(buf);
    return true;
  }
  const unavailable = (res, why, code = 404) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Stacks-Status': 'unavailable' });
    res.end(JSON.stringify({ error: 'image unavailable', why }));
  };

  app.route('GET', '/img', async (req, res, url) => {
    const u = url.searchParams.get('u') || '';
    if (!R.okUrl(u)) return unavailable(res, 'not an http(s) address on the open web', 400);
    const alt = url.searchParams.get('alt');
    if (alt && R.okUrl(alt)) R.noteCtx(u, { alts: [alt] });
    const hit = R.cachedImage(u);
    if (hit) { cache.stats.hits++; if (await serve(req, res, u, hit)) return; }
    else cache.stats.misses++;
    const timer = new Promise((r) => setTimeout(() => r({ st: 'slow' }), FG_WAIT).unref());
    const out = await Promise.race([R.resolveImage(u, { fg: true }), timer]);
    if (out.st === 'big') { res.writeHead(302, { Location: u, 'Cache-Control': 'no-store' }); return res.end(); }
    if ((out.st === 'ok' || out.st === 'rescued') && out.meta && await serve(req, res, u, out.meta)) return;
    if (out.st === 'slow') return unavailable(res, 'still looking for a copy', 504);
    unavailable(res, out.why || 'unavailable');
  });

  app.route('POST', '/img/info', async (req, res) => {
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
  });

  app.route('POST', '/rescue/report', async (req, res) => {
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
  });

  app.route('POST', '/rescue/manual', async (req, res) => {
    const b = await app.body(req);
    if (!R.okUrl(b.u)) return app.json(res, { st: 'bad', why: 'bad image address' }, 400);
    const r = await R.manualCopy(b.u, String(b.from || '').trim());
    app.json(res, { st: r.st, why: r.why, via: r.meta?.via, w: r.meta?.w, h: r.meta?.h });
  });

  const ai = () => (R.AI_ON && (app.hasKey() || app.ai?.MOCK) ? () => R.agentic(app.ai) : null);
  let nextRun = 0;
  const run = (reason, extra = {}) => R.scavenge({ reason, ai: ai(), ...extra });
  app.route('POST', '/rescue/run', async (req, res) => {
    const b = await app.body(req).catch(() => ({}));
    const p = run('on demand', { force: !!b.force });
    if (b.wait) return app.json(res, await p);
    p.catch(() => {});
    app.json(res, { started: true });
  });

  app.route('GET', '/rescue/doc', (req, res, url) => app.json(res, R.docState(url.searchParams.get('u') || '')));

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
