// Page shapes before a profile exists, so the reader's placeholders have the size of the pages
// they stand for (ui/js/shapes.js). Only what is already on this machine is read; nothing is
// fetched for it.
//
//   GET /shapes?ids=a,b,…&k=a:3,b:0   -> {id: {pages: {k: [w, h]}, med: [w, h], src} | null}   (up to 40 ids)
//
// k: the page each item will open at (default 0); pages near it are given when known.
// - Web PDFs: the render service's page sizes (server/render.mjs info.json, in points; read with
//   pdfinfo once the PDF is on disk, a few ms, waited on for at most 150 ms per request).
// - Internet Archive scans: the pixel size from the header of a page image on disk, at any width
//   (cache.mjs keys are archive.org/download/<id>/page/n<k>_w<W>.jpg).
// - PDFs in Local folders: pdfinfo's page sizes (else the first /MediaBox in the file's first
//   256 KB), cached by path, size and mtime.
// src says which: 'render', 'scan', 'local'. null: nothing known yet.
import { execFile } from 'child_process';
import { openSync, readSync, closeSync, statSync } from 'fs';
import { itemOf } from '../profile.mjs';
import { imageSize } from '../local.mjs';

const W = [1000, 600, 400, 200, 120, 1500, 2000];
const NEAR = 4; // pages from the opening page on
const median = (xs) => { const s = [...xs].sort((a, b) => a[0] / a[1] - b[0] / b[1]); return s.length ? s[Math.floor(s.length / 2)] : null; };

/** "Page    1 size: 612 x 792 pts (letter)" lines → {k: [w, h]} (0-based). */
export function parsePageSizes(out) {
  const pages = {};
  for (const m of String(out).matchAll(/^Page\s+(\d+)\s+size:\s*([\d.]+)\s*x\s*([\d.]+)/gm)) pages[Number(m[1]) - 1] = [Number(m[2]), Number(m[3])];
  if (!Object.keys(pages).length) { const m = /^Page size:\s*([\d.]+)\s*x\s*([\d.]+)/m.exec(String(out)); if (m) pages[0] = [Number(m[1]), Number(m[2])]; }
  return pages;
}
/** The first /MediaBox [x0 y0 x1 y1] in a buffer → [w, h] | null. */
export function mediaBox(buf) {
  const m = /\/MediaBox\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/.exec(buf.toString('latin1'));
  if (!m) return null;
  const w = Math.abs(m[3] - m[1]), h = Math.abs(m[4] - m[2]);
  return w > 0 && h > 0 ? [w, h] : null;
}

export default function (app) {
  const { cache } = app;
  const localMemo = new Map(); // abs -> {key, shape | promise}
  const pdfinfo = (file, first, last) => new Promise((ok) => {
    execFile('pdfinfo', ['-f', String(first + 1), '-l', String(last + 1), file], { timeout: 2000 }, (err, out) => ok(err ? null : out));
  });
  async function localShape(it, k) {
    const x = app.local?.index?.get(it.id);
    if (!x || x.gone || x.e.cloud || !x.e.abs) return null; // never read an iCloud stub (it would download)
    let st; try { st = statSync(x.e.abs); } catch { return null; }
    const key = `${st.size}:${st.mtimeMs}:${k}`, memo = localMemo.get(x.e.abs);
    if (memo?.key === key) return memo.v;
    const v = (async () => {
      let pages = {};
      const out = await pdfinfo(x.e.abs, Math.max(0, k - 1), k + NEAR);
      if (out) pages = parsePageSizes(out);
      if (!Object.keys(pages).length) {
        const fd = openSync(x.e.abs, 'r');
        try { const b = Buffer.alloc(Math.min(st.size, 256 * 1024)); readSync(fd, b, 0, b.length, 0); const mb = mediaBox(b); if (mb) pages[k] = mb; } finally { closeSync(fd); }
      }
      const list = Object.values(pages);
      return list.length ? { pages, med: median(list), src: 'local' } : null;
    })();
    localMemo.set(x.e.abs, { key, v }); if (localMemo.size > 2000) localMemo.delete(localMemo.keys().next().value);
    return v;
  }
  function scanShape(it, k) {
    const pages = {};
    for (let j = Math.max(0, k - 1); j <= k + NEAR && (!it.n || j < it.n); j++) {
      for (const w of W) {
        const u = `https://archive.org/download/${it.ia}/page/n${j}_w${w}.jpg`;
        if (!cache.cached(u)) continue;
        const s = imageSize(cache.paths(u).body);
        if (s) { pages[j] = s; break; }
      }
    }
    const list = Object.values(pages);
    return list.length ? { pages, med: median(list), src: 'scan' } : null;
  }
  async function renderShape(it, k) {
    const svc = app.render; if (!svc?.engine) return null;
    let info = svc.infoNow(it.url);
    if (!info && cache.cached(it.url)) info = await Promise.race([svc.infoOf(it.url).catch(() => null), new Promise((r) => setTimeout(r, 150))]);
    if (!info?.pages?.length) return null;
    const pages = {};
    for (let j = Math.max(0, k - 1); j <= k + NEAR && j < info.pages.length; j++) pages[j] = [info.pages[j].w, info.pages[j].h];
    return { pages, med: median(info.pages.map((p) => [p.w, p.h])), n: info.n, src: 'render' };
  }

  app.route('GET', '/shapes', async (req, res, url) => {
    const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 40);
    const at = new Map((url.searchParams.get('k') || '').split(',').map((s) => { const j = s.lastIndexOf(':'); return [s.slice(0, j), Math.max(0, Math.min(1e5, Number(s.slice(j + 1)) || 0))]; }));
    const out = {};
    await Promise.all(ids.map(async (id) => {
      const it = itemOf(id), k = at.get(id) || 0;
      let v = null;
      try {
        if (!it) v = null;
        else if (it.kind === 'scan' && it.ia) v = scanShape(it, k);
        else if (it.kind === 'pdf' && String(it.id).startsWith('local:')) v = await localShape(it, k);
        else if (it.kind === 'pdf' && /^https?:\/\//.test(it.url || '') && cache.allowed(it.url)) v = await renderShape(it, k);
      } catch { v = null; }
      out[id] = v;
    }));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(out));
  });
}
