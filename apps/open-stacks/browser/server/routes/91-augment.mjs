// Reading guides (augmentations; docs/profiles/spec.md, sections 7.2 and 8).
// The work is in server/augment.mjs; this file is the HTTP surface.
//
//   GET  /augment?id=&model=          the cached guide (with `stale`) or null; never calls the model
//                                     (header X-Augment-Running: 1 while one is being written)
//   POST /augment {id, model?, force?, text?, n?, title, authors, year, lane, laneId, kind}
//        -> NDJSON: {type:'partial', aug} … then {type:'final', aug, spend} or {type:'error', error, code, spend}
//   GET  /augment/stream?id=&model=   join a job in flight (or get the cached final); 404 {"error":"none"}
//   POST /augment/forget {id, model?}  delete a cached guide (tests; "redo")
//   POST /augment/batch {ids?, lanes?, limit?, model?, maxUsd?, dry?}   a Message Batch -> {batch, n, est, skipped}
//   GET  /augment/batch?id=           {id, status, counts, est, cost, at, …}
//   GET  /augment/batches             all batches, newest first
import { createAugmenter } from '../augment.mjs';

export default function (app) {
  if (!app.ai) { console.warn('augment: app.ai missing (30-summarize.mjs did not load); reading guides are off'); return; }
  const A = createAugmenter(app);
  app.augment = A; // for other routes and tests

  function ndjson(res) {
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
    return (o) => { if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify(o) + '\n'); };
  }
  const fail = (e) => ({ type: 'error', error: e.message, code: e.code || (e.status ? 'api_' + e.status : 'error'), spend: app.ai.spendInfo() });
  const bad = (res) => app.json(res, { error: 'unknown id' }, 400);

  app.route('GET', '/augment', async (req, res, url) => {
    const id = url.searchParams.get('id');
    if (!A.itemOf(id)) return bad(res);
    const model = url.searchParams.get('model');
    const aug = await A.read(id, model);
    // A guide being written right now: the client can join it with GET /augment/stream.
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...(!aug && A.running(id, model) && { 'X-Augment-Running': '1' }) });
    res.end(JSON.stringify(aug));
  });

  app.route('POST', '/augment', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad json' }, 400); }
    if (!A.itemOf(b.id)) return bad(res);
    const send = ndjson(res);
    try {
      const aug = await A.augment(b, (a) => send({ type: 'partial', aug: a }));
      send({ type: 'final', aug, spend: app.ai.spendInfo() });
    } catch (e) { send(fail(e)); }
    res.end();
  });

  app.route('GET', '/augment/stream', async (req, res, url) => {
    const id = url.searchParams.get('id'), model = url.searchParams.get('model');
    if (!A.itemOf(id)) return bad(res);
    let send = null;
    const job = A.attach(id, model, (a) => (send ||= ndjson(res))({ type: 'partial', aug: a }));
    if (job) {
      send ||= ndjson(res);
      try { send({ type: 'final', aug: await job, spend: app.ai.spendInfo() }); } catch (e) { send(fail(e)); }
      return res.end();
    }
    const aug = await A.read(id, model);
    if (!aug) return app.json(res, { error: 'none' }, 404);
    send = ndjson(res); send({ type: 'final', aug, spend: app.ai.spendInfo() }); res.end();
  });

  app.route('POST', '/augment/forget', async (req, res) => {
    const b = await app.body(req).catch(() => ({}));
    if (!A.itemOf(b.id)) return bad(res);
    app.json(res, { ok: true, removed: A.forget(b.id, b.model) });
  });

  app.route('POST', '/augment/batch', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad json' }, 400); }
    try {
      const out = await A.submitBatch(b);
      if (out.batch) setTimeout(() => A.pollBatch(out.batch).catch(() => {}), 60e3).unref?.();
      app.json(res, out);
    } catch (e) { app.json(res, { error: e.message, code: e.code || 'error', spend: app.ai.spendInfo() }, e.code === 'budget' ? 402 : e.code === 'no_key' || e.code === 'no_sdk' ? 503 : 502); }
  });
  app.route('GET', '/augment/batch', async (req, res, url) => {
    const id = url.searchParams.get('id');
    const rec = A.listBatches().find((r) => r.id === id);
    if (!rec) return app.json(res, { error: 'none' }, 404);
    app.json(res, { ...A.brief(rec), failed: rec.failed || [] });
  });
  app.route('GET', '/augment/batches', (req, res) => app.json(res, A.listBatches().map(A.brief)));

  app.status(() => ({ augment: A.status() }));
  app.onStart(() => A.resume());
}
