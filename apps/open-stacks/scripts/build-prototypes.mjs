#!/usr/bin/env node
/**
 * Wrap the prototype sources into standalone pages for the static wiki.
 *
 *   node scripts/build-prototypes.mjs
 *
 * Each prototype in prototypes/*.html is written as a page fragment (its own
 * <title>, <style>, markup and scripts, with no <html>/<head>/<body>) so the
 * same file can be published unchanged as a Claude artifact, where the viewer
 * adds the document skeleton. For the wiki, this script adds an equivalent
 * skeleton and writes public/prototypes/<name>.html (gitignored; regenerated
 * by `pnpm dev` and `pnpm build`). Data files live in public/prototypes/data/
 * and are fetched by relative URL in both settings.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(APP, 'prototypes');
const OUT = join(APP, 'public/prototypes');

// Mirrors the artifact viewer's skeleton so a page renders the same in both places.
const RESET = [
  ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}',
  'body{margin:0;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}',
  'img{max-width:100%}',
  '[hidden]{display:none!important}',
].join('');

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.html')).sort()) {
  const body = readFileSync(join(SRC, file), 'utf-8');
  if (/<!doctype|<html[\s>]/i.test(body.slice(0, 500))) {
    throw new Error(`${file}: prototype sources are fragments; remove the document skeleton`);
  }
  const page =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    `<style>${RESET}</style></head><body>\n${body}\n</body></html>\n`;
  writeFileSync(join(OUT, file), page);
  n++;
}
console.log(`build-prototypes: wrapped ${n} prototype page(s) into public/prototypes/`);
