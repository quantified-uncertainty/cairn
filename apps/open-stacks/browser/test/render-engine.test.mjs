// Server-side rendering engines (server/pdfnative.mjs): order, size classes, the self-test against the
// geometry PDF (docs/performance/prerender.md, Appendix C) and falling through to the next engine.
//   node --test test/render-engine.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync, chmodSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as native from '../server/pdfnative.mjs';

const tools = { poppler: await native.has('pdftoppm') && await native.has('pdfinfo'), mupdf: await native.has('mutool') };
const which = async (cmd) => (await native.run('sh', ['-c', `command -v ${cmd}`])).stdout.trim();

test('engine order: STACKS_RENDER_ENGINE names where it starts; none or off turns it off', () => {
  assert.deepEqual(native.engineOrder(undefined), ['quartz', 'poppler', 'mupdf']);
  assert.deepEqual(native.engineOrder(''), ['quartz', 'poppler', 'mupdf']);
  assert.deepEqual(native.engineOrder('quartz'), ['quartz', 'poppler', 'mupdf']);
  assert.deepEqual(native.engineOrder('poppler'), ['poppler', 'mupdf']);
  assert.deepEqual(native.engineOrder('MuPDF'), ['mupdf']);
  assert.deepEqual(native.engineOrder('none'), []);
  assert.deepEqual(native.engineOrder('off'), []);
  assert.deepEqual(native.engineOrder('nonsense'), ['quartz', 'poppler', 'mupdf']);
});

test('size classes round up; pages fit 0.85·w × w as pdf.js draws them', () => {
  assert.equal(native.sizeClass(0), 1400);
  assert.equal(native.sizeClass(1400), 1400);
  assert.equal(native.sizeClass(1401), 1800);
  assert.equal(native.sizeClass(1785), 1800);
  assert.equal(native.sizeClass(2200), 2200);
  assert.equal(native.sizeClass(9000), 2200);
  assert.equal(native.sizeClass('junk'), 1400);
  assert.deepEqual(native.fitPage(612, 792, 1800), { s: 1800 / 792, W: 1391, H: 1800 }); // letter: height-limited
  const land = native.fitPage(792, 612, 1800); // landscape: width-limited at 0.85·w
  assert.equal(land.W, 1530); assert.equal(land.H, 1182);
});

test('jpegSize reads the SOF marker', () => {
  const sof = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x90, 0x01, 0x35, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(native.jpegSize(sof), { w: 309, h: 400 });
  assert.equal(native.jpegSize(Buffer.from('not a jpeg')), null);
});

test('the geometry PDF: five pages, crop boxes and rotations', () => {
  const pdf = native.geometryPdf().toString('latin1');
  assert.match(pdf, /^%PDF-1\.4/);
  assert.equal((pdf.match(/\/Type \/Page /g) || []).length, 5);
  assert.match(pdf, /\/Rotate 270/);
  assert.match(pdf, /\/CropBox \[72 72 540 720\]/);
});

for (const name of ['poppler', 'mupdf']) {
  test(`${name}: passes the self-test and renders the geometry pages at the right size`, { skip: !tools[name] && `${name} not installed` }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stacks-render-engine-'));
    try {
      const { engine, why } = await native.makeEngine(name, { dir });
      assert.ok(engine, why);
      const st = await native.selfTest(engine, join(dir, 'st'));
      assert.equal(st.ok, true, st.why);
      const file = join(dir, 'g.pdf'); writeFileSync(file, native.geometryPdf());
      const info = await engine.info(file);
      assert.equal(info.n, 5);
      info.pages.forEach((p, k) => { assert.ok(Math.abs(p.w - native.GEOMETRY_SHOWN[k][0]) < 0.6 && Math.abs(p.h - native.GEOMETRY_SHOWN[k][1]) < 0.6, `p. ${k + 1}: ${p.w} × ${p.h}`); });
      for (const k of [0, 2, 3]) {
        const out = join(dir, `p${k}.jpg`);
        const r = await native.renderTo(engine, { file, k, w: 1400, out, info, lane: 'near', timeout: 30000 });
        const f = native.fitPage(...native.GEOMETRY_SHOWN[k], 1400);
        assert.ok(Math.abs(r.w - f.W) <= 1 && Math.abs(r.h - f.H) <= 1, `p. ${k + 1}: ${r.w} × ${r.h}, expected ${f.W} × ${f.H}`);
        assert.deepEqual(native.jpegSize(readFileSync(out)), { w: r.w, h: r.h });
        assert.equal(r.by, name);
      }
      await assert.rejects(native.renderTo(engine, { file, k: 9, w: 1400, out: join(dir, 'x.jpg'), info, timeout: 30000 }));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('a broken engine falls through to the next, and nothing working means none', { skip: !(tools.poppler && tools.mupdf) && 'needs poppler and MuPDF' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stacks-render-fall-'));
  const PATH = process.env.PATH;
  try {
    // A pdftoppm that answers -v but renders nothing: its self-test fails and MuPDF takes over.
    const bin = join(dir, 'bin'); mkdirSync(bin);
    writeFileSync(join(bin, 'pdftoppm'), '#!/bin/sh\n[ "$1" = "-v" ] && exit 0\nexit 3\n'); chmodSync(join(bin, 'pdftoppm'), 0o755);
    for (const t of ['pdfinfo', 'mutool', 'sh']) symlinkSync(await which(t), join(bin, t));
    process.env.PATH = bin;
    const a = await native.findEngines({ prefer: 'poppler', dir: join(dir, 'c') });
    assert.equal(a.report.poppler.ok, false);
    assert.match(a.report.poppler.why, /pdftoppm exited 3/);
    assert.deepEqual(a.engines.map((e) => e.name), ['mupdf']);
    // Nothing on PATH at all: no engine, and the browser keeps drawing with pdf.js.
    process.env.PATH = join(dir, 'empty');
    const b = await native.findEngines({ dir: join(dir, 'c') });
    assert.deepEqual(b.engines, []);
    assert.equal(b.report.quartz.ok, false);
    assert.match(b.report.poppler.why, /no pdftoppm/);
    assert.match(b.report.mupdf.why, /no mutool/);
    // STACKS_RENDER_ENGINE=none: not even tried.
    assert.deepEqual((await native.findEngines({ prefer: 'none', dir: join(dir, 'c') })).report, {});
  } finally { process.env.PATH = PATH; rmSync(dir, { recursive: true, force: true }); }
});

test('the Quartz helper is never built off macOS', async () => {
  if (process.platform === 'darwin') return;
  assert.deepEqual(await native.buildQuartz(join(tmpdir(), 'nowhere')), { ok: false, why: 'not macOS' });
  assert.equal((await native.makeEngine('quartz', { dir: tmpdir() })).why, 'not macOS');
});
