// The wall's figure covers for papers (ui/js/wall.js; route: routes/68-wallfigs.mjs):
// the few fields of an item's Pictures lead (GET /extract `lead`, ranked by score or
// picked in the highlights file) that a cover needs.

/**
 * A lead reduced to what a cover draws, or null when it has no picture to lead with.
 * `{show: 'one' | 'few', pics: [{img, w, h, c?, parts?, lay?}]}`, at most `max` pics
 * (one for a lead that shows one). Tables, unverified scan plates and pictures without
 * an image are left out. `c: 1` marks an image already in the disk cache (`cached(url)`),
 * which the cover then loads through the proxy; multi-image figures keep their parts
 * (at most 6, each with a size) and arrangement.
 */
export function wallFigs(lead, cached = () => false, max = 3) {
  if (!lead || lead.show === 'none' || !Array.isArray(lead.pics)) return null;
  const want = lead.show === 'few' ? max : 1;
  const pics = [];
  for (const p of lead.pics) {
    if (pics.length >= want) break;
    if (!p || !p.img || p.verify || (p.type !== 'figure' && p.type !== 'image')) continue;
    const o = { img: p.img, w: num(p.w), h: num(p.h) };
    if (/^https?:/.test(p.img) && cached(p.img)) o.c = 1;
    const parts = Array.isArray(p.parts) ? p.parts : null;
    if (parts && parts.length > 1 && parts.length <= 6 && parts.every((x) => x && x.img && num(x.w) && num(x.h))) {
      o.parts = parts.map((x) => ({ img: x.img, w: num(x.w), h: num(x.h), ...(/^https?:/.test(x.img) && cached(x.img) ? { c: 1 } : {}) }));
      if (p.lay != null) o.lay = p.lay;
    }
    pics.push(o);
  }
  return pics.length ? { show: pics.length > 1 ? 'few' : 'one', pics } : null;
}
const num = (x) => (Number.isFinite(x) && x > 0 ? Math.round(x) : null);
