// compile.mjs pieces that do not need a server (node --test test/profile-compile.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pgmLum, bboxLines } from '../compile.mjs';
import { analyzeLum, bandTexts } from '../ui/js/profile-core.js';

test('pgmLum reads a binary PGM and box-averages it to 240 px wide', () => {
  const w = 480, h = 620;
  const head = Buffer.from(`P5\n# made by a test\n${w} ${h}\n255\n`, 'latin1');
  const px = Buffer.alloc(w * h, 250);
  for (let y = 100; y < 500; y += 4) for (let x = 80; x < 400; x++) px[y * w + x] = 10; // text lines
  const { lum, W, H } = pgmLum(Buffer.concat([head, px]));
  assert.equal(W, 240);
  assert.equal(H, 310);
  const a = analyzeLum(lum, W, H);
  assert.equal(a.blank, false);
  assert.ok(Math.abs(a.ink[0] - 80 / w) < 0.01 && Math.abs(a.ink[2] - 400 / w) < 0.01, JSON.stringify(a.ink));
});

test('bboxLines reads pdftotext -bbox-layout lines as page fractions, for bandTexts', () => {
  const xml = `<doc>
  <page width="612.000000" height="792.000000">
    <flow><block xMin="108" yMin="28.6" xMax="293" yMax="37.5">
      <line xMin="108.000000" yMin="28.614357" xMax="293.095145" yMax="37.520922">
        <word xMin="108" yMin="28.6" xMax="147" yMax="37.5">Published</word>
        <word xMin="149" yMin="28.6" xMax="158" yMax="37.5">at</word>
        <word xMin="160" yMin="28.6" xMax="165" yMax="37.5">R&amp;D</word>
      </line></block></flow>
  </page>
  <page width="612.000000" height="792.000000">
  </page>
</doc>`;
  const pages = bboxLines(xml);
  assert.equal(pages.length, 2);
  assert.equal(pages[0][0].t, 'Published at R&D');
  assert.ok(Math.abs(pages[0][0].y0 - 28.614357 / 792) < 1e-9 && Math.abs(pages[0][0].x - 108 / 612) < 1e-9);
  assert.deepEqual(pages[1], []);
  const bands = { top: { y0: 0.034, y1: 0.05, next: 0.1 }, bot: null };
  bandTexts(bands, pages[0]);
  assert.equal(bands.top.t, 'Published at R&D');
});
