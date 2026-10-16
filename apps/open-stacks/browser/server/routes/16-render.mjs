// Server-side PDF page rendering: the HTTP side of server/render.mjs (docs/performance/prerender.md).
//
//   GET  /render/page?u=<pdf url>&k=<page, 0-based>&w=<px>[&lane=fg|near][&wait=ms]
//        200 the page as a JPEG (whole page, ASPECT·w × w at most; header X-Render: {n, pw, ph, w, ms, by}),
//        rendered now at fg priority when missing (waits up to `wait`, default 1500, at most 5000 ms);
//        204 no engine (or still starting); 202 {state} not ready within `wait`; 503 the PDF is not on
//        the server's disk yet; 403 a host off the allowlist; 404 no such page; 422 the engine failed.
//        Answered with Access-Control-Allow-Origin: * so the page can come from the second origin.
//   POST /render/hint {open: {u, k, w, n?, per?}, next: [{u, k}]}: replaces the background plan
//        -> {ok, seq, engine, n: {url: pages}} (page counts of the documents on disk).
//   GET  /render/state                -> {engine, pending, workers, classes}
//   GET  /render/state?u=<url>&w=<px> -> {engine, n, w, bits, ready, running, queued, src}
//   POST /render/forget {u}           -> {ok, freed}: drop a document's pages (benchmarks, a bad render)
//   /status gains `render` (engine, queues, counts, engine ms p50/p90, bytes).
//
// Settings: STACKS_RENDER_ENGINE (quartz|poppler|mupdf|none: where the engine order starts),
// STACKS_RENDER_WORKERS (default cores - 1), STACKS_RENDER_MAX (default 6G).
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { createService, parseSize, defaultWorkers } from '../render.mjs';
import { sizeClass, CLASSES } from '../pdfnative.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function (app) {
  const env = process.env;
  const svc = createService({
    dir: join(app.CACHE, 'render'), cache: app.cache,
    workers: Number(env.STACKS_RENDER_WORKERS) || defaultWorkers(),
    max: parseSize(env.STACKS_RENDER_MAX, 6 * 1024 ** 3),
    prefer: env.STACKS_RENDER_ENGINE,
  });
  app.render = svc;
  app.onStart(() => svc.start());

  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-Render' };
  function reply(res, code, obj) {
    const head = { ...CORS, 'Cache-Control': 'no-store', ...(code === 503 ? { 'Retry-After': '1' } : {}) };
    if (code === 204 || obj == null) { res.writeHead(code, head); res.end(); return; }
    res.writeHead(code, { 'Content-Type': 'application/json', ...head });
    res.end(JSON.stringify(obj));
  }
  function serve(req, res, u, k, w, file, extra = {}) {
    let st; try { st = statSync(file); } catch { return reply(res, 202, { state: 'evicted' }); }
    const info = svc.infoNow(u), pg = info?.pages?.[k];
    const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    const head = {
      'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600', ETag: etag,
      'X-Render': JSON.stringify({ n: info?.n ?? null, pw: pg?.w ?? null, ph: pg?.h ?? null, w, ms: 0, ...extra }), ...CORS,
    };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, head); res.end(); return; }
    res.writeHead(200, { ...head, 'Content-Length': st.size });
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  }

  app.route('GET', '/render/page', async (req, res, url) => {
    const q = url.searchParams, u = q.get('u') || '';
    const k = Number(q.get('k')), w = sizeClass(q.get('w'));
    const lane = q.get('lane') === 'near' ? 'near' : 'fg';
    if (!svc.engine) return reply(res, 204);
    if (!/^https?:\/\//.test(u) || !app.cache.allowed(u)) return reply(res, 403, { error: 'host not allowed' }); // /local/ files are not rendered here
    if (!Number.isInteger(k) || k < 0 || k > 100000) return reply(res, 400, { error: 'bad page' });
    const r = svc.request(u, k, w, lane);
    if (r.now) return r.now.ok ? serve(req, res, u, k, w, r.now.file) : reply(res, r.now.code || 422, { error: r.now.error });
    const wait = Math.max(0, Math.min(5000, Number(q.get('wait') ?? 1500) || 0));
    let onClose;
    const closed = new Promise((ok) => { onClose = () => ok('closed'); res.on('close', onClose); });
    const out = await Promise.race([r.job.promise, sleep(wait).then(() => null), closed]);
    res.off('close', onClose);
    svc.release(r.job);
    if (out === 'closed' || res.writableEnded || res.destroyed) return;
    if (!out) return reply(res, 202, { state: r.job.state });
    if (!out.ok) return reply(res, out.error === 'dropped' ? 202 : 422, { error: out.error });
    serve(req, res, u, k, w, out.file, out.r ? { ms: out.r.ms, by: out.r.by } : {});
  });

  app.route('POST', '/render/hint', async (req, res) => {
    if (Number(req.headers['content-length'] || 0) > 65536) return reply(res, 413, { error: 'too large' });
    let h; try { h = await app.body(req); } catch { return reply(res, 400, { error: 'bad json' }); }
    const r = await svc.hint(h || {});
    reply(res, 200, { ok: true, engine: svc.engine, ...r });
  });

  app.route('GET', '/render/state', async (req, res, url) => {
    const u = url.searchParams.get('u');
    if (!u) return reply(res, 200, { engine: svc.engine, pending: svc.pending, workers: svc.W, classes: CLASSES });
    if (!/^https?:\/\//.test(u) || !app.cache.allowed(u)) return reply(res, 403, { error: 'host not allowed' });
    // The page count of a PDF on disk the service has not looked at yet (pdfinfo: a few ms), so the
    // browser need not parse it with pdf.js to know it.
    if (svc.engine && !svc.infoNow(u) && app.cache.cached(u)) await Promise.race([svc.infoOf(u).catch(() => null), sleep(500)]);
    reply(res, 200, svc.stateOf(u, url.searchParams.get('w')));
  });

  app.route('POST', '/render/forget', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return reply(res, 400, { error: 'bad json' }); }
    if (!b?.u || !app.cache.allowed(b.u)) return reply(res, 403, { error: 'host not allowed' });
    reply(res, 200, { ok: true, freed: svc.forget(b.u) });
  });

  app.status(() => ({ render: svc.summary() }));
}
