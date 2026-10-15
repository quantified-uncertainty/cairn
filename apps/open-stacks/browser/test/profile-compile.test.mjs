// compile.mjs pieces that do not need a server (node --test test/profile-compile.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pgmLum } from '../compile.mjs';
import { analyzeLum } from '../ui/js/profile-core.js';

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
