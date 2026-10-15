// Native PDF page rendering for the render service (server/render.mjs; docs/performance/prerender.md,
// section 2): which engines this machine has, one renderer per engine, and a self-test that renders
// a fixture page before an engine is trusted.
//
// Engines, in order: quartz (server/native/stacks-render.swift, macOS only, compiled once with
// `swiftc -O` into CACHE/render/bin when the Command Line Tools are present), poppler (pdftoppm,
// else pdftocairo), mupdf (mutool run, one process a page). STACKS_RENDER_ENGINE (read by
// render.mjs) names where the order starts; an engine that fails falls through to the next.
//
// Geometry: a page is its crop box clipped to the media box, with /Rotate applied, as pdf.js shows
// it. At size class w it is drawn to fit 0.85·w wide and w tall, the box render.js draws pdf.js
// pages into at RENDER_H, so a server image is the size a pdf.js render would be.
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import os from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync, readdirSync, statSync, openSync, readSync, closeSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const NATIVE = join(dirname(fileURLToPath(import.meta.url)), 'native');
export const ORDER = ['quartz', 'poppler', 'mupdf'];
/** Whole-page size classes (px); a request is rounded up to one (render.js RENDER_H is 1400-2200). */
export const CLASSES = [1400, 1800, 2200];
export const ASPECT = 0.85;
export const QUALITY = 80;

export function sizeClass(px) {
  const n = Number(px) || 0;
  for (const c of CLASSES) if (n <= c) return c;
  return CLASSES.at(-1);
}
/** A page of pw × ph points drawn to fit ASPECT·w × w px: its scale and pixel size. */
export function fitPage(pw, ph, w) {
  const s = Math.min((ASPECT * w) / pw, w / ph);
  return { s, W: Math.max(1, Math.round(pw * s)), H: Math.max(1, Math.round(ph * s)) };
}
/** Engines to try for STACKS_RENDER_ENGINE: from the one named, in ORDER; none or off: none. */
export function engineOrder(prefer) {
  const p = String(prefer || '').trim().toLowerCase();
  if (p === 'none' || p === 'off') return [];
  const i = ORDER.indexOf(p);
  return i < 0 ? [...ORDER] : ORDER.slice(i);
}

/** Width and height of a JPEG from its SOF marker, or null. */
export function jpegSize(buf) {
  if (!buf || buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}
function head(file, n = 65536) {
  const fd = openSync(file, 'r');
  try { const b = Buffer.alloc(n); const got = readSync(fd, b, 0, n, 0); return b.subarray(0, got); } finally { closeSync(fd); }
}

/** Run a command; resolves {code, stdout, stderr} (code null when killed), rejects only when it cannot start.
 *  Background lanes run at a lower priority: `nice` 5 (near) or 10 (ahead; utility QoS through taskpolicy on a Mac). */
export function run(cmd, args, { timeout = 20000, lane = 'fg', input } = {}) {
  return new Promise((res, rej) => {
    let c = cmd, a = args;
    if (lane === 'ahead' && process.platform === 'darwin' && existsSync('/usr/sbin/taskpolicy')) { c = '/usr/sbin/taskpolicy'; a = ['-c', 'utility', cmd, ...args]; }
    let p;
    try { p = spawn(c, a, { stdio: [input == null ? 'ignore' : 'pipe', 'pipe', 'pipe'] }); } catch (e) { rej(e); return; }
    let out = '', err = '', done = false;
    const t = setTimeout(() => { try { p.kill('SIGKILL'); } catch { /* gone */ } }, timeout);
    p.stdout.on('data', (d) => { if (out.length < 8e6) out += d; });
    p.stderr.on('data', (d) => { if (err.length < 1e5) err += d; });
    p.on('error', (e) => { if (done) return; done = true; clearTimeout(t); rej(e); });
    p.on('close', (code) => { if (done) return; done = true; clearTimeout(t); res({ code, stdout: out, stderr: err }); });
    if (input != null) p.stdin.end(input);
    const nice = lane === 'near' ? 5 : lane === 'ahead' && c === cmd ? 10 : 0;
    if (nice && p.pid) try { os.setPriority(p.pid, nice); } catch { /* not allowed: fine */ }
  });
}
export const has = (cmd, args = ['-v']) => run(cmd, args, { timeout: 8000 }).then((r) => r.code === 0, () => false);

/** Page sizes in points, crop box with /Rotate applied, from poppler's pdfinfo. */
export async function pdfinfo(file, { timeout = 30000 } = {}) {
  const r = await run('pdfinfo', ['-f', '1', '-l', '100000', file], { timeout });
  if (r.code !== 0) throw new Error('pdfinfo: ' + (r.stderr.trim().split('\n').pop() || 'failed'));
  const n = Number((r.stdout.match(/^Pages:\s+(\d+)/m) || [])[1]) || 0;
  if (/^Encrypted:\s+yes/m.test(r.stdout) && !n) throw new Error('encrypted');
  const pages = [];
  for (const m of r.stdout.matchAll(/^Page\s+(\d+)\s+size:\s+([\d.]+) x ([\d.]+)/gm)) pages[Number(m[1]) - 1] = { w: Number(m[2]), h: Number(m[3]) };
  for (const m of r.stdout.matchAll(/^Page\s+(\d+)\s+rot:\s+(\d+)/gm)) {
    const p = pages[Number(m[1]) - 1]; const rot = Number(m[2]) % 360;
    if (p && rot) { p.rot = rot; if (rot % 180) [p.w, p.h] = [p.h, p.w]; }
  }
  if (!n) throw new Error('pdfinfo: no pages');
  for (let k = 0; k < n; k++) pages[k] ||= pages[k - 1] || { w: 612, h: 792 };
  return { n, pages: pages.slice(0, n) };
}

/** A long-lived helper that reads one JSON command per line and writes one JSON reply per line, in order. */
export class LineWorker {
  constructor(cmd, args = []) {
    this.q = []; this.buf = ''; this.dead = false; this.n = 0;
    this.p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'ignore'] });
    this.p.stdout.setEncoding('utf8');
    this.p.stdout.on('data', (d) => {
      this.buf += d;
      let i;
      while ((i = this.buf.indexOf('\n')) >= 0) { const line = this.buf.slice(0, i); this.buf = this.buf.slice(i + 1); if (line.trim()) this.reply(line); }
    });
    this.p.stdin.on('error', () => {});
    this.p.on('error', (e) => this.fail(e));
    this.p.on('exit', () => this.fail(new Error('worker exited')));
  }
  reply(line) {
    const j = this.q.shift(); if (!j) return;
    clearTimeout(j.t);
    let r; try { r = JSON.parse(line); } catch { j.rej(new Error('bad reply')); return; }
    if (r.ok) j.res(r); else j.rej(new Error(r.error || 'failed'));
  }
  send(cmd, timeout = 15000) {
    if (this.dead) return Promise.reject(new Error('worker gone'));
    return new Promise((res, rej) => {
      const j = { res, rej, t: setTimeout(() => this.kill('timeout'), timeout) };
      this.q.push(j);
      this.p.stdin.write(JSON.stringify({ id: ++this.n, ...cmd }) + '\n');
    });
  }
  fail(e) { this.dead = true; for (const j of this.q.splice(0)) { clearTimeout(j.t); j.rej(e); } }
  kill(why = 'killed') { if (!this.dead) { try { this.p.kill('SIGKILL'); } catch { /* gone */ } } this.fail(new Error('worker ' + why)); }
}

// ------------------------------------------------------------------ engines ----
// An engine: { name, info(file) -> {n, pages: [{w, h}]}, render({file, k, w, out, lane, timeout, info, slot})
// -> {w, h, pw, ph}, close() }. render writes a JPEG to `out` (a temporary name the caller renames).

function popplerEngine(tool, version) {
  return {
    name: 'poppler', tool, version,
    info: (file) => pdfinfo(file),
    async render({ file, k, w, out, lane, timeout, info }) {
      const pg = info.pages[k]; if (!pg) throw new Error('no page ' + k);
      const f = fitPage(pg.w, pg.h, w);
      const prefix = out.replace(/\.jpg$/, '') + '-pp';
      // -cropbox: the crop box, as pdf.js shows it (without it poppler renders the media box). -r from the
      // displayed size (-scale-to-y applies before /Rotate), and the rectangle given exactly: with -r alone
      // poppler rounds some pages up a pixel (Appendix C).
      const args = ['-cropbox', '-jpeg', '-jpegopt', `quality=${QUALITY}`, '-r', String(+(72 * f.s).toFixed(5)),
        '-x', '0', '-y', '0', '-W', String(f.W), '-H', String(f.H), '-f', String(k + 1), '-l', String(k + 1), '-singlefile', file, prefix];
      const r = await run(tool, args, { timeout, lane });
      if (r.code !== 0 || !existsSync(prefix + '.jpg')) {
        try { unlinkSync(prefix + '.jpg'); } catch { /* none */ }
        throw new Error(`${tool} ${r.code == null ? 'timed out' : 'exited ' + r.code}: ${r.stderr.trim().split('\n').pop() || ''}`.trim());
      }
      renameSync(prefix + '.jpg', out);
      return { w: f.W, h: f.H, pw: pg.w, ph: pg.h };
    },
    close() {},
  };
}

function mupdfEngine(version) {
  const script = join(NATIVE, 'mu-render.js');
  const last = (s) => { const l = s.trim().split('\n').filter((x) => x.startsWith('{')).pop(); if (!l) throw new Error('no reply'); return JSON.parse(l); };
  return {
    name: 'mupdf', version,
    async info(file) {
      const r = await run('mutool', ['run', script, 'info', file], { timeout: 30000 });
      if (r.code !== 0) throw new Error('mutool info: ' + (r.stderr.trim().split('\n').pop() || 'failed'));
      const j = last(r.stdout); if (!j.n) throw new Error('mutool: no pages');
      return { n: j.n, pages: j.pages };
    },
    async render({ file, k, w, out, lane, timeout }) {
      const r = await run('mutool', ['run', script, 'render', file, String(k), String(w), out, String(QUALITY)], { timeout, lane });
      if (r.code !== 0) { try { unlinkSync(out); } catch { /* none */ } throw new Error(`mutool ${r.code == null ? 'timed out' : 'exited ' + r.code}: ${r.stderr.trim().split('\n').pop() || ''}`.trim()); }
      return last(r.stdout);
    },
    close() {},
  };
}

function quartzEngine(bin, hello) {
  const workers = new Map(); // slot -> LineWorker (one helper process per pool slot, documents kept open)
  const get = (slot) => { let w = workers.get(slot); if (!w || w.dead) { w = new LineWorker(bin); workers.set(slot, w); } return w; };
  return {
    name: 'quartz', bin, hello,
    async info(file) { const r = await get('info').send({ op: 'info', file }, 30000); return { n: r.n, pages: r.pages }; },
    async render({ file, k, w, out, lane, timeout, info, slot = 0 }) {
      const pg = info.pages[k]; if (!pg) throw new Error('no page ' + k);
      const f = fitPage(pg.w, pg.h, w);
      const r = await get(slot).send({ op: 'render', file, k, h: f.H, box: [0, 0, 1, 1], q: QUALITY / 100, out, lane }, timeout);
      return { w: r.w, h: r.h, pw: r.pw, ph: r.ph };
    },
    close() { for (const w of workers.values()) w.kill('closed'); workers.clear(); },
  };
}

/** Build the Quartz helper once (macOS with the Command Line Tools), or say why not. Never runs
 *  /usr/bin/swiftc blindly: without the tools it opens the "install developer tools" dialog. */
export async function buildQuartz(binDir, { build = true } = {}) {
  if (process.platform !== 'darwin') return { ok: false, why: 'not macOS' };
  if ((await run('xcode-select', ['-p'], { timeout: 8000 }).catch(() => ({ code: 1 }))).code !== 0) return { ok: false, why: 'no Command Line Tools (xcode-select -p)' };
  if ((await run('xcrun', ['--find', 'swiftc'], { timeout: 15000 }).catch(() => ({ code: 1 }))).code !== 0) return { ok: false, why: 'no swiftc (xcrun --find swiftc)' };
  const v = await run('xcrun', ['swiftc', '--version'], { timeout: 30000 }).catch(() => null);
  if (!v || v.code !== 0) return { ok: false, why: 'swiftc --version failed' };
  const src = join(NATIVE, 'stacks-render.swift');
  const hash = createHash('sha1').update(readFileSync(src)).update(v.stdout + v.stderr).digest('hex').slice(0, 10);
  const bin = join(binDir, 'stacks-render-' + hash);
  if (existsSync(bin)) return { ok: true, bin, built: false };
  if (existsSync(bin + '.failed')) return { ok: false, why: `the build failed before (${join(binDir, 'build.log')})` };
  if (!build) return { ok: false, why: 'not built yet' };
  mkdirSync(binDir, { recursive: true });
  const t0 = Date.now();
  const r = await run('xcrun', ['swiftc', '-O', '-o', bin + '.part', src], { timeout: 300000 }).catch((e) => ({ code: 1, stderr: String(e) }));
  if (r.code !== 0 || !existsSync(bin + '.part')) {
    writeFileSync(join(binDir, 'build.log'), `${new Date().toISOString()} swiftc failed (${r.code})\n${r.stderr || ''}${r.stdout || ''}`);
    writeFileSync(bin + '.failed', '');
    return { ok: false, why: 'swiftc failed (see ' + join(binDir, 'build.log') + ')' };
  }
  renameSync(bin + '.part', bin);
  for (const f of readdirSync(binDir)) if (/^stacks-render-[0-9a-f]{10}(\.failed)?$/.test(f) && !f.startsWith('stacks-render-' + hash)) try { unlinkSync(join(binDir, f)); } catch { /* in use */ }
  return { ok: true, bin, built: true, ms: Date.now() - t0 };
}

/** One engine by name, ready to self-test, or {why} when this machine lacks it. */
export async function makeEngine(name, { dir, build = true } = {}) {
  if (name === 'poppler') {
    for (const tool of ['pdftoppm', 'pdftocairo']) if (await has(tool)) {
      if (!(await has('pdfinfo'))) return { why: 'no pdfinfo' };
      return { engine: popplerEngine(tool) };
    }
    return { why: 'no pdftoppm or pdftocairo' };
  }
  if (name === 'mupdf') return (await has('mutool')) ? { engine: mupdfEngine() } : { why: 'no mutool' };
  if (name === 'quartz') {
    const b = await buildQuartz(join(dir, 'bin'), { build });
    if (!b.ok) return { why: b.why };
    const w = new LineWorker(b.bin);
    try { const hello = await w.send({ op: 'hello' }, 10000); return { engine: quartzEngine(b.bin, hello) }; } catch (e) { return { why: 'helper: ' + e.message }; } finally { w.kill('done'); }
  }
  return { why: 'unknown engine ' + name };
}

/** Render one page through an engine into `out` and check the JPEG it wrote. */
export async function renderTo(engine, opt) {
  const t0 = Date.now();
  const r = await engine.render(opt);
  let dim = null, bytes = 0;
  try { bytes = statSync(opt.out).size; dim = jpegSize(head(opt.out)); } catch { /* checked below */ }
  if (!dim || bytes < 100) { try { unlinkSync(opt.out); } catch { /* none */ } throw new Error(`${engine.name}: no JPEG written`); }
  return { w: dim.w, h: dim.h, pw: r.pw, ph: r.ph, bytes, ms: Date.now() - t0, by: engine.name };
}

// ------------------------------------------------------------------ self-test ----
// The geometry test PDF (docs/performance/prerender.md, Appendix C): 36-pt squares inset 36 pt from the
// corners of each page's visible box and a bar under the top-left one.
export const GEOMETRY_PAGES = [
  { media: [0, 0, 612, 792] },
  { media: [0, 0, 612, 792], rot: 90 },
  { media: [0, 0, 612, 792], crop: [72, 72, 540, 720] },
  { media: [0, 0, 792, 612] },
  { media: [0, 0, 612, 792], crop: [36, 108, 576, 756], rot: 270 },
];
/** The pages as shown (points): crop box, rotation applied. */
export const GEOMETRY_SHOWN = [[612, 792], [792, 612], [468, 648], [792, 612], [648, 540]];
export function geometryPdf(pages = GEOMETRY_PAGES) {
  const objs = [];
  const add = (s) => objs.push(s);
  add(null); add(null); // 1: catalog, 2: pages
  const kids = [];
  for (const p of pages) {
    const [x0, y0, x1, y1] = p.crop || p.media;
    const sq = (x, y) => `${x} ${y} 36 36 re f\n`;
    const c = '0 0 0 rg\n' + sq(x0 + 36, y0 + 36) + sq(x1 - 72, y0 + 36) + sq(x0 + 36, y1 - 72) + sq(x1 - 72, y1 - 72) + `${x0 + 36} ${y1 - 102} 108 18 re f\n`;
    add(`<< /Length ${c.length} >>\nstream\n${c}endstream`);
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [${p.media.join(' ')}]${p.crop ? ` /CropBox [${p.crop.join(' ')}]` : ''}${p.rot ? ` /Rotate ${p.rot}` : ''} /Contents ${objs.length} 0 R /Resources << >> >>`);
    kids.push(objs.length);
  }
  objs[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offs = objs.map((o, i) => { const at = pdf.length; pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; return at; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

/** Before an engine is used: page sizes of the geometry PDF (crop box, rotation) and three renders
 *  (rotated, cropped, rotated and cropped) at the size fitPage gives. → {ok, ms} or {ok: false, why}. */
export async function selfTest(engine, dir) {
  const t0 = Date.now();
  try {
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'geometry.pdf');
    if (!existsSync(file)) writeFileSync(file, geometryPdf());
    const info = await engine.info(file);
    if (info.n !== GEOMETRY_SHOWN.length) throw new Error(`info: ${info.n} pages, expected ${GEOMETRY_SHOWN.length}`);
    GEOMETRY_SHOWN.forEach(([w, h], k) => {
      const p = info.pages[k];
      if (!p || Math.abs(p.w - w) > 0.6 || Math.abs(p.h - h) > 0.6) throw new Error(`info: p. ${k + 1} is ${p?.w} × ${p?.h} pt, expected ${w} × ${h}`);
    });
    for (const k of [1, 2, 4]) {
      const out = join(dir, `t${k}-${engine.name}-${process.pid}.jpg`);
      const r = await renderTo(engine, { file, k, w: 400, out, info, lane: 'fg', timeout: 30000, slot: 'selftest' });
      try { unlinkSync(out); } catch { /* gone */ }
      const f = fitPage(GEOMETRY_SHOWN[k][0], GEOMETRY_SHOWN[k][1], 400);
      if (Math.abs(r.w - f.W) > 1 || Math.abs(r.h - f.H) > 1) throw new Error(`render: p. ${k + 1} came out ${r.w} × ${r.h} px, expected ${f.W} × ${f.H}`);
    }
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, why: String(e.message || e) };
  }
}

/** Every engine from `prefer` on that this machine has and that passes the self-test, in order.
 *  → {engines: [engine], report: {name: {ok, why?, ms?}}}. */
export async function findEngines({ prefer, dir, build = true, only } = {}) {
  const report = {}, engines = [];
  for (const name of only || engineOrder(prefer)) {
    const m = await makeEngine(name, { dir, build });
    if (!m.engine) { report[name] = { ok: false, why: m.why }; continue; }
    const t = await selfTest(m.engine, join(dir, 'selftest'));
    report[name] = t;
    if (t.ok) engines.push(m.engine); else m.engine.close();
  }
  return { engines, report };
}
