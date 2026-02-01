#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load current external links
const links = yaml.load(fs.readFileSync(path.join(ROOT, 'src/data/external-links.yaml'), 'utf-8'));
const coveredPages = new Set(links.map(l => l.pageId));

// Find all MDX pages
function findFiles(dir, ext, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) findFiles(fullPath, ext, results);
    else if (entry.name.endsWith(ext)) results.push(fullPath);
  }
  return results;
}

const contentDir = path.join(ROOT, 'src/content/docs');
const pages = findFiles(contentDir, '.mdx')
  .filter(p => !p.includes('/internal/') && !p.includes('/project/'))
  .map(p => {
    const content = fs.readFileSync(p, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    let title = path.basename(p, '.mdx');
    if (match) {
      try {
        const fm = yaml.load(match[1]);
        if (fm.title) title = fm.title;
      } catch(e) {}
    }
    return { pageId: path.basename(p, '.mdx'), title, path: p.replace(contentDir + '/', '') };
  });

const uncovered = pages.filter(p => !coveredPages.has(p.pageId) && p.pageId !== 'index');
console.log('Total pages:', pages.length);
console.log('Covered:', coveredPages.size);
console.log('Uncovered (non-index):', uncovered.length);
console.log('');
uncovered.forEach(p => console.log(`${p.pageId}|${p.title}|${p.path}`));
