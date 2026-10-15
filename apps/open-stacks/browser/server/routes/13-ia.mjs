// GET /ia/preview?u=<Internet Archive page image URL>&w=600,400,200[&fetch=1]
// A small image of a scan page for the reader to show while the sharp one
// loads (render.js previewScan, feed.js). One already on disk at one of the
// widths w (largest first) is sent at once. Otherwise, with fetch=1 and the
// page's w1000 not on disk yet, the smallest of them is fetched now, beside
// the w1000 rather than merged into it (cache.mjs ensure exact): a page costs
// the datanode ~0.6 s at any size and a w200 has little to transfer, so it
// usually arrives first (measured: w200 0.68 s, w1000 1.07 s median), and two
// requests to the item's two datanodes rarely both hit the slow tail. Only if
// archive.org has a slot free at once (ifFree: never at the expense of the
// sharp pages), and never hedged. 204 when there is nothing to show.
import { createReadStream } from 'fs';

export default function (app) {
  const { cache } = app;
  app.route('GET', '/ia/preview', async (req, res, url) => {
    const u = url.searchParams.get('u') || '';
    if (!cache.allowed(u) || !/^https:\/\/(www\.)?archive\.org\/download\/[^/?#]+\/page\/n\d+_w\d+\.jpg$/.test(u)) return app.send(res, 400, 'not an Internet Archive page image');
    const ws = (url.searchParams.get('w') || '400,200').split(',').map(Number).filter((w) => w >= 100 && w < 1000);
    if (!ws.length) return app.send(res, 400, 'no preview width');
    const at = (w) => u.replace(/_w\d+\.jpg$/, `_w${w}.jpg`);
    let pick = ws.map(at).find((v) => cache.cached(v));
    if (!pick && url.searchParams.get('fetch') && !cache.cached(at(1000))) {
      const v = at(Math.min(...ws));
      try { await cache.ensure(v, { exact: true, ifFree: true }); pick = v; } catch { /* busy, or nothing to show */ }
    }
    if (!pick || !cache.cached(pick)) { res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); return; }
    const m = cache.meta(pick);
    res.writeHead(200, { 'Content-Type': m.type, 'Content-Length': m.size, 'Cache-Control': 'no-store', 'X-Width': pick.match(/_w(\d+)\.jpg$/)[1] });
    createReadStream(cache.paths(pick).body).pipe(res);
  });
}
