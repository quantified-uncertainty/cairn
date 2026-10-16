// Inline SVG diagrams styled by the page's own CSS (a component's <style> block: classes, CSS
// variables, a wide and a narrow version switched by media queries) lose all of it when a page is
// extracted, since styles are removed: shapes fill black and both versions show. Before
// extraction, applyPageSvgStyles(doc) applies the page's inline <style> rules to its diagrams as
// inline styles, which survive (Readability leaves SVG alone), as the page would show them on a
// desktop screen with a light theme: rules for a dark colour scheme are skipped, width queries
// are judged for a 1200 px window, and a diagram (or part) those rules hide is removed.
// External stylesheets are not fetched. Icons (16 px, no classes inside) are left as they are.

const DESKTOP_W = 1200;
const INHERITED = /^(--|font|color$|fill$|stroke$|letter-spacing|text-anchor|dominant-baseline)/;

/** Whether a media condition holds for the light, desktop page we show. */
function mediaHolds(cond) {
  const c = String(cond || '').toLowerCase();
  if (!c || c === 'all' || c === 'screen') return true;
  if (/print/.test(c) && !/screen/.test(c)) return false;
  if (/prefers-color-scheme\s*:\s*dark/.test(c)) return /\bnot\b/.test(c);
  if (/prefers-color-scheme\s*:\s*light/.test(c)) return !/\bnot\b/.test(c);
  // Width queries, judged for a desktop window (rem and em at 16 px).
  const px = (v, u) => (u === 'px' || !u ? +v : +v * 16);
  let ok = true, any = false;
  for (const m of c.matchAll(/\((min|max)-width\s*:\s*([\d.]+)(px|rem|em)?\)/g)) {
    any = true; const v = px(m[2], m[3]);
    ok &&= m[1] === 'min' ? DESKTOP_W >= v : DESKTOP_W <= v;
  }
  for (const m of c.matchAll(/\(width\s*([<>]=?)\s*([\d.]+)(px|rem|em)?\)/g)) {
    any = true; const v = px(m[2], m[3]), o = m[1];
    ok &&= o === '<' ? DESKTOP_W < v : o === '<=' ? DESKTOP_W <= v : o === '>' ? DESKTOP_W > v : DESKTOP_W >= v;
  }
  if (any) return /\bnot\b/.test(c) ? !ok : ok;
  try { return matchMedia(c).matches; } catch { return false; }
}
function flatRules(list, out) {
  for (const r of list) {
    if (r.selectorText != null && r.style) out.push(r);
    else if (r.media && r.cssRules) { if (mediaHolds(r.conditionText ?? r.media.mediaText)) flatRules(r.cssRules, out); }
    else if (r.cssRules && r.conditionText != null) { let ok = false; try { ok = CSS.supports(r.conditionText); } catch { /* no */ } if (ok) flatRules(r.cssRules, out); }
  }
  return out;
}
const matches = (el, sel) => { try { return el.matches(sel); } catch { return false; } };
const apply = (el, rule, only = null) => {
  const st = rule.style;
  for (let k = 0; k < st.length; k++) { const p = st[k]; if (!only || only.test(p)) el.style.setProperty(p, st.getPropertyValue(p), st.getPropertyPriority(p)); }
};
// A page's dark theme, chosen by an attribute or class on <html> (Starlight: data-theme), is not the one shown.
const DARK_SEL = /data-theme\s*=\s*["']?dark|\.dark\b|\.theme-dark\b/i;

/** Apply the page's inline <style> rules to its SVG diagrams; returns how many diagrams it styled. */
export function applyPageSvgStyles(doc) {
  const svgs = [...doc.querySelectorAll('svg')].filter((s) => s.querySelector('[class]') && !s.closest('svg svg'));
  if (!svgs.length) return 0;
  const css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  if (!/\.[\w-]/.test(css)) return 0;
  let sheet;
  try { sheet = new CSSStyleSheet(); sheet.replaceSync(css); } catch { return 0; }
  // Only the rules naming a class used in a diagram, or the diagrams' wrappers.
  const classes = new Set();
  const wrap = (s) => [s.parentElement, s.parentElement?.parentElement].filter(Boolean);
  for (const s of svgs) for (const el of [s, ...wrap(s), ...s.querySelectorAll('[class]')]) for (const c of el.classList) classes.add(c);
  const rules = flatRules(sheet.cssRules, []).filter((r) => !DARK_SEL.test(r.selectorText) && (r.selectorText.match(/\.[\w-]+/g) || []).some((c) => classes.has(c.slice(1))));
  if (!rules.length) return 0;
  let n = 0;
  for (const s of svgs) {
    // What the wrappers give the diagram (variables, font, colour) goes on the <svg>, which survives extraction.
    const own = [];
    for (const w of wrap(s).reverse()) for (const r of rules) if (matches(w, r.selectorText)) own.push([r, INHERITED]);
    for (const r of rules) if (matches(s, r.selectorText)) own.push([r, null]);
    for (const [r, only] of own) apply(s, r, only);
    // "inherit" on the <svg> meant the wrapper's value, and the wrapper's styles do not survive extraction.
    const from = {};
    for (const w of wrap(s).reverse()) for (const r of rules) if (matches(w, r.selectorText)) for (let k = 0; k < r.style.length; k++) { const p = r.style[k]; if (INHERITED.test(p)) from[p] = r.style.getPropertyValue(p); }
    for (const [p, v] of Object.entries(from)) if (s.style.getPropertyValue(p).trim() === 'inherit') s.style.setProperty(p, v);
    if (s.style.display === 'none') { s.remove(); continue; }
    for (const el of s.querySelectorAll('*')) for (const r of rules) if (matches(el, r.selectorText)) apply(el, r);
    for (const el of s.querySelectorAll('*')) if (el.style.display === 'none') el.remove();
    n++;
  }
  return n;
}
