// The wall's figure covers: what server/wallfigs.mjs keeps of a Pictures lead.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wallFigs } from '../server/wallfigs.mjs';

const fig = (n, o = {}) => ({ pid: `figure:S1.F${n}`, type: 'figure', img: `https://arxiv.org/html/2401.00001v1/x${n}.png`, w: 300, h: 200, label: `Figure ${n}`, caption: 'A long caption that the cover never shows.', loc: { anchor: `S1.F${n}` }, at: 0.1 * n, score: 0.9 - 0.1 * n, ...o });

test('no lead, or a lead with nothing to show, is null', () => {
  assert.equal(wallFigs(null), null);
  assert.equal(wallFigs({ show: 'none', pics: [], by: 'score' }), null);
  assert.equal(wallFigs({ show: 'one', pics: [{ type: 'table', html: '<table></table>' }] }), null);
});

test('a lead that shows one keeps one picture, with only the fields a cover draws', () => {
  const v = wallFigs({ show: 'one', pics: [fig(1), fig(2)], by: 'score' });
  assert.deepEqual(v, { show: 'one', pics: [{ img: 'https://arxiv.org/html/2401.00001v1/x1.png', w: 300, h: 200 }] });
});

test('a lead that shows a few keeps up to three, in rank order', () => {
  const v = wallFigs({ show: 'few', pics: [fig(1), fig(2), fig(3), fig(4)], by: 'score' });
  assert.equal(v.show, 'few');
  assert.deepEqual(v.pics.map((p) => p.img.slice(-6)), ['x1.png', 'x2.png', 'x3.png']);
});

test('tables, unverified plates and pictures without an image are skipped', () => {
  const v = wallFigs({ show: 'few', pics: [{ type: 'table', img: 'https://arxiv.org/t.png' }, { type: 'plate', img: 'https://archive.org/p.jpg', verify: true }, { type: 'figure', img: null }, fig(2)] });
  assert.deepEqual(v.pics.map((p) => p.img.slice(-6)), ['x2.png']);
  assert.equal(v.show, 'one');
});

test('images in the disk cache are marked, parts and arrangement kept (at most 6 parts)', () => {
  const parts = [1, 2, 3].map((k) => ({ img: `https://arxiv.org/html/2401.00001v1/p${k}.png`, w: 100 * k, h: 90 }));
  const cached = (u) => /p2\.png|x1\.png/.test(u);
  const v = wallFigs({ show: 'one', pics: [fig(1, { parts, lay: ['r', 0, 1, 2] })] }, cached);
  assert.equal(v.pics[0].c, 1);
  assert.deepEqual(v.pics[0].lay, ['r', 0, 1, 2]);
  assert.deepEqual(v.pics[0].parts.map((p) => p.c || 0), [0, 1, 0]);
  const many = Array.from({ length: 7 }, (_, k) => ({ img: `https://arxiv.org/x${k}.png`, w: 10, h: 10 }));
  assert.equal(wallFigs({ show: 'one', pics: [fig(1, { parts: many, lay: ['r'] })] }).pics[0].parts, undefined);
});

test('local images (inline SVG from /figures/svg) are never marked as cached', () => {
  const v = wallFigs({ show: 'one', pics: [fig(1, { img: '/figures/svg?id=arxiv%3A2401.00001&f=S1.F1&k=0', w: null })] }, () => true);
  assert.equal(v.pics[0].c, undefined);
  assert.equal(v.pics[0].w, null);
});
