// Internet Archive page images, fetched straight from the item's datanodes,
// and stand-ins for smaller sizes of pages already on disk. Used by cache.mjs.
//
// archive.org/download/<id>/page/n<k>_w<W>.jpg answers with a 302 to one of
// the item's two datanodes (its d1 and d2):
//   https://<node>/BookReader/BookReaderImages.php?id=<id>&itemPath=<dir>&server=<node>&page=n<k>_w<W>.jpg
// Measured 2026-10-15 from a cloud container (4 scans, about 1,000 requests):
// the 302 alone took 0.46 s median and 1.2 s p90, on top of the ~0.6 s the
// datanode spends on every page whatever its size (w120 to w1000 alike; it is
// not JP2 decoding, full size costs the same); so through the 302 a page took
// 1.4 s median instead of 0.96 s, and each concurrency slot did half as much
// (6 at a time: 3.3 pages/s through the 302, 5.5 direct; 12: 6.5 and 12.7).
// Asking again was no faster: nothing is cached at IA's end.
//
// So the first page fetched of an item goes through archive.org as before, and
// the URL it ends at names the datanode and the item's path; they are kept
// here (and in CACHE/ia-nodes.json across restarts), and later pages go to the
// datanode directly, alternating between the item's two like the 302 does.
// Until both are known, every fourth request still takes the 302 (which picks
// one at random). A direct request that fails (404 once an item has moved, a
// node that is down) forgets that node, and the page goes through archive.org.
// Cache keys stay the canonical archive.org URLs.
import { readFileSync, writeFileSync, renameSync } from 'fs';
import { join } from 'path';
import { CACHE } from './config.mjs';

const PAGE = /^https:\/\/(?:www\.)?archive\.org\/download\/([^/?#]+)\/page\/(n\d+[^/?#]*\.jpg)$/;
const FILE = join(CACHE, 'ia-nodes.json');
const MAX_AGE = 30 * 86400e3; // relearn now and then: items do move
const items = new Map(); // id -> { dir, nodes: [host], at, n, rr }
export const iaStats = { direct: 0, learned: 0, forgotten: 0 };

try {
  const saved = JSON.parse(readFileSync(FILE, 'utf-8'));
  for (const [id, e] of Object.entries(saved)) if (e?.dir && e.nodes?.length && Date.now() - e.at < MAX_AGE) items.set(id, { dir: e.dir, nodes: e.nodes.slice(0, 3), at: e.at, n: 0, rr: 0 });
} catch { /* first run */ }
let saveT = null;
function saveNow() {
  clearTimeout(saveT); saveT = null;
  try {
    writeFileSync(FILE + '.tmp', JSON.stringify(Object.fromEntries([...items].map(([id, e]) => [id, { dir: e.dir, nodes: e.nodes, at: e.at }]))));
    renameSync(FILE + '.tmp', FILE);
  } catch { /* read-only disk: keep going in memory */ }
}
function save() { if (!saveT) { saveT = setTimeout(saveNow, 2000); saveT.unref?.(); } }
process.on('exit', () => { if (saveT) saveNow(); });

/** {id, page} of a canonical page image URL, else null. */
export const pageOf = (u) => { const m = PAGE.exec(u); return m ? { id: m[1], page: m[2] } : null; };

/** The datanode URL for a canonical page image URL, or null to go through archive.org. */
export function direct(u) {
  const p = pageOf(u); if (!p) return null;
  const e = items.get(p.id); if (!e?.nodes.length) return null;
  // One node known: let every fourth request take the 302, so the other is found.
  if (e.nodes.length < 2 && ++e.n % 4 === 0) return null;
  const node = e.nodes[e.rr++ % e.nodes.length];
  iaStats.direct++;
  return `https://${node}/BookReader/BookReaderImages.php?id=${encodeURIComponent(p.id)}&itemPath=${encodeURIComponent(e.dir)}&server=${node}&page=${p.page}`;
}

/** After a page image came through archive.org: note where the 302 sent it (`final` is fetch's res.url). */
export function learn(u, final) {
  const p = pageOf(u); if (!p || !final || final === u) return;
  let f; try { f = new URL(final); } catch { return; }
  if (!/\.archive\.org$/.test(f.hostname) || f.pathname !== '/BookReader/BookReaderImages.php') return;
  const dir = f.searchParams.get('itemPath');
  if (!dir || f.searchParams.get('id') !== p.id) return;
  let e = items.get(p.id);
  if (!e || e.dir !== dir) { e = { dir, nodes: [], at: Date.now(), n: 0, rr: 0 }; items.set(p.id, e); }
  if (!e.nodes.includes(f.hostname)) { e.nodes.push(f.hostname); if (e.nodes.length > 3) e.nodes.shift(); e.at = Date.now(); iaStats.learned++; save(); }
}

/** A direct request to `src` failed: stop using that node for the item. */
export function forget(u, src) {
  const p = pageOf(u); if (!p) return;
  const e = items.get(p.id); if (!e) return;
  let host = null; try { host = new URL(src).hostname; } catch { /* drop them all */ }
  e.nodes = host ? e.nodes.filter((x) => x !== host) : [];
  if (!e.nodes.length) items.delete(p.id);
  iaStats.forgotten++; save();
}

// Sizes the app asks for. IA serves the JP2's power-of-two reduction at or
// above the width asked (w120 comes back ~133 px, w200 ~266, w400 ~532,
// w600 and w1000 both ~1064 for a 500 ppi scan), so a cached image up to 2.5x
// the width asked for is a fine stand-in: the feed's w400 placeholder for a
// page whose w1000 is on disk, the strip's w120 for a w200.
const WIDTHS = [120, 200, 400, 600, 1000, 1500, 2000];
/** A canonical URL of the same page at a larger width (at most 2.5x) for which has(url) holds, smallest first; else null. */
export function larger(u, has) {
  const m = /^(.*\/page\/n\d+)_w(\d+)\.jpg$/.exec(u);
  if (!m || !PAGE.test(u)) return null;
  const w = Number(m[2]);
  for (const x of WIDTHS) if (x > w && x <= 2.5 * w) { const v = `${m[1]}_w${x}.jpg`; if (has(v)) return v; }
  return null;
}
