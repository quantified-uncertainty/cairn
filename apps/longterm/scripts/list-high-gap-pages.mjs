#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pages.json'), 'utf-8'));

const minGap = parseInt(process.argv[2]) || 40;

const highGap = pages
  .filter(p => p.quality && p.importance)
  .filter(p => !p.path.includes('/models/'))
  .map(p => ({
    id: p.id,
    title: p.title,
    path: p.path,
    quality: p.quality,
    importance: p.importance,
    gap: p.importance - p.quality
  }))
  .filter(p => p.gap > minGap)
  .sort((a, b) => b.gap - a.gap);

console.log(`Pages with gap > ${minGap}:\n`);
highGap.forEach(p => {
  // Find actual file
  const basePath = path.join(ROOT, 'src/content/docs' + p.path);
  let filePath = basePath + '.mdx';
  if (!fs.existsSync(filePath)) {
    filePath = basePath + '/index.mdx';
  }
  if (!fs.existsSync(filePath)) {
    // Try without trailing slash
    const altPath = basePath.replace(/\/$/, '') + '.mdx';
    if (fs.existsSync(altPath)) {
      filePath = altPath;
    }
  }

  const relPath = path.relative(ROOT, filePath);
  console.log(`${p.id}|${relPath}|${p.gap}|${p.quality}|${p.importance}`);
});
console.log(`\nTotal: ${highGap.length}`);
