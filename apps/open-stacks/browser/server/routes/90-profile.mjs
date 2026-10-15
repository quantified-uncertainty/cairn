// Profiles: the compiled form of each item (docs/profiles/spec.md, section 7.1).
//
//   GET  /profile?id=[&src=]            the profile (+ stale), ETag "<pid>.<rev>", 304 on If-None-Match; 404 {error:'none'}
//   GET  /profiles?ids=a,b,…[&full=1]   {id: brief | null} (up to 200 ids; full=1: whole profiles, up to 40)
//   POST /profile[?src=]                an analysis upload (JSON); 409 {error:'older'} unless force
//   POST /profile/text?id=[&from=]      replace text.txt (text/plain)
//   POST /profile/asset?id=&size=display|thumb|sprite&k=|j=&w=&h=&box=&H=&pri=[&cw=&ch=&cols=]   image bytes
//   GET  /profile/asset?id=&size=&k=|j=&v=                                                       the image
//   POST /profile/forget {id}           delete (tests; "recompile this item")
import { createReadStream } from 'fs';
import * as store from '../profile.mjs';

const readBuf = async (req, max) => {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > max) return null; chunks.push(c); }
  return Buffer.concat(chunks);
};

export default function (app) {
  const jsonH = (res, code, obj, extra = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...extra }); res.end(JSON.stringify(obj)); };
  const out = (res, r) => jsonH(res, r.code, r.body);

  app.route('GET', '/profile', (req, res, url) => {
    const id = url.searchParams.get('id'), src = url.searchParams.get('src');
    if (!store.resolve(id, src)) return jsonH(res, 400, { error: 'unknown id' });
    const P = store.readProfile(id, src);
    if (!P) return jsonH(res, 404, { error: 'none' });
    const etag = `"${P.pid}.${P.rev}"`;
    store.touchProfile(P.pid);
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' }); return res.end(); }
    jsonH(res, 200, P, { ETag: etag });
  });

  app.route('GET', '/profiles', (req, res, url) => {
    const full = url.searchParams.get('full') === '1';
    const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, full ? 40 : 200);
    const o = {};
    for (const id of ids) {
      const P = store.resolve(id) ? store.readProfile(id) : null;
      o[id] = P ? (full ? P : store.brief(P)) : null;
    }
    jsonH(res, 200, o);
  });

  app.route('POST', '/profile', async (req, res, url) => {
    const buf = await readBuf(req, store.LIMITS.json);
    if (!buf) return jsonH(res, 413, { error: 'too large' });
    let up; try { up = JSON.parse(buf.toString('utf-8')); } catch { return jsonH(res, 400, { error: 'invalid', detail: 'JSON' }); }
    out(res, await store.putAnalysis(up?.id, url.searchParams.get('src'), up));
  });

  app.route('POST', '/profile/text', async (req, res, url) => {
    const buf = await readBuf(req, store.LIMITS.text);
    if (!buf) return jsonH(res, 413, { error: 'too large' });
    out(res, store.putText(url.searchParams.get('id'), url.searchParams.get('src'), buf.toString('utf-8'), url.searchParams.get('from') || 'pdf'));
  });

  app.route('POST', '/profile/asset', async (req, res, url) => {
    const q = Object.fromEntries(url.searchParams);
    const max = store.LIMITS[q.size] || store.LIMITS.display;
    const buf = await readBuf(req, max);
    if (!buf) return jsonH(res, 413, { error: 'too large', max });
    out(res, store.putAsset(q.id, q.src, q, buf));
  });

  app.route('GET', '/profile/asset', (req, res, url) => {
    const q = url.searchParams, size = q.get('size');
    const kj = Number(size === 'sprite' ? q.get('j') : q.get('k'));
    const a = store.assetFile(q.get('id'), q.get('src'), size, kj, q.get('v'));
    if (a.code) return jsonH(res, a.code, { error: a.code === 400 ? 'unknown id' : 'none' });
    res.writeHead(200, { 'Content-Type': a.type, 'Content-Length': a.bytes, 'Cache-Control': a.immutable ? 'public, max-age=31536000, immutable' : 'no-cache' });
    createReadStream(a.file).on('error', () => res.end()).pipe(res);
  });

  app.route('POST', '/profile/forget', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return jsonH(res, 400, { error: 'invalid' }); }
    out(res, store.forget(b.id, b.src));
  });

  app.status(() => ({ profiles: store.profileState() }));
}
