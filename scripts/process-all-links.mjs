#!/usr/bin/env node
/**
 * Process all files with unconverted links
 * Converts markdown links to <R> components, creating resources as needed
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { createHash } from 'crypto';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const CONTENT_DIR = 'src/content/docs';
const RESOURCES_FILE = 'src/data/resources.yaml';
const PAGES_FILE = 'src/data/pages.json';

function hashId(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function normalizeUrl(url) {
  const variations = new Set();
  try {
    const parsed = new URL(url);
    const base = parsed.href.replace(/\/$/, '');
    variations.add(base);
    variations.add(base + '/');
    if (parsed.hostname.startsWith('www.')) {
      const noWww = base.replace('://www.', '://');
      variations.add(noWww);
      variations.add(noWww + '/');
    }
    if (!parsed.hostname.startsWith('www.')) {
      const withWww = base.replace('://', '://www.');
      variations.add(withWww);
      variations.add(withWww + '/');
    }
  } catch {
    variations.add(url);
  }
  return Array.from(variations);
}

function guessResourceType(url) {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (domain.includes('arxiv.org')) return 'paper';
    if (domain.includes('nature.com') || domain.includes('science.org')) return 'paper';
    if (domain.includes('springer.com') || domain.includes('wiley.com')) return 'paper';
    if (domain.includes('ncbi.nlm.nih.gov') || domain.includes('pubmed')) return 'paper';
    if (domain.includes('gov') || domain.includes('government')) return 'government';
    if (domain.includes('wikipedia.org')) return 'reference';
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'talk';
    if (domain.includes('substack.com') || domain.includes('medium.com')) return 'blog';
    if (domain.includes('forum.effectivealtruism.org')) return 'blog';
    if (domain.includes('lesswrong.com') || domain.includes('alignmentforum.org')) return 'blog';
    return 'web';
  } catch {
    return 'web';
  }
}

function getImportDepth(filePath) {
  const fromDir = dirname(filePath);
  const srcDir = 'src';
  const rel = relative(fromDir, srcDir);
  return rel.split('/').join('/') + '/';
}

// Load data
let resources = parseYaml(readFileSync(RESOURCES_FILE, 'utf-8')) || [];
const urlMap = new Map();
for (const r of resources) {
  if (!r.url) continue;
  for (const url of normalizeUrl(r.url)) {
    urlMap.set(url, r);
  }
}

const pages = JSON.parse(readFileSync(PAGES_FILE, 'utf-8'));
const filesToProcess = pages.filter(p => (p.unconvertedLinkCount || 0) > 0);

const totalUnconv = pages.reduce((s, p) => s + (p.unconvertedLinkCount || 0), 0);
console.log('Processing ' + filesToProcess.length + ' files with ' + totalUnconv + ' unconverted links...\n');

let totalConverted = 0;
let totalNewResources = 0;
let filesModified = 0;

for (const page of filesToProcess) {
  const filePath = join(CONTENT_DIR, page.filePath);
  if (!existsSync(filePath)) continue;

  let content = readFileSync(filePath, 'utf-8');
  const linkRegex = /(?<!!)\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

  const links = [];
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    links.push({ full: match[0], text: match[1], url: match[2] });
  }

  if (links.length === 0) continue;

  let fileConverted = 0;
  let fileNewResources = 0;

  for (const link of links) {
    let resource = urlMap.get(link.url) || urlMap.get(link.url.replace(/\/$/, ''));

    if (!resource) {
      // Create new resource
      const id = hashId(link.url);
      resource = {
        id,
        url: link.url,
        title: link.text,
        type: guessResourceType(link.url),
      };
      resources.push(resource);
      for (const url of normalizeUrl(link.url)) {
        urlMap.set(url, resource);
      }
      fileNewResources++;
      totalNewResources++;
    }

    const replacement = '<R id="' + resource.id + '">' + link.text + '</R>';
    content = content.replace(link.full, replacement);
    fileConverted++;
    totalConverted++;
  }

  // Add import if needed
  const hasRImport = /import\s*{[^}]*\bR\b[^}]*}\s*from/.test(content);
  if (!hasRImport && fileConverted > 0) {
    const wikiImportRegex = /import\s*{([^}]+)}\s*from\s*['"]([^'"]*components\/wiki)['"]/;
    const wikiMatch = content.match(wikiImportRegex);
    if (wikiMatch) {
      const newImports = wikiMatch[1].trim() + ', R';
      content = content.replace(wikiImportRegex, 'import {' + newImports + '} from \'' + wikiMatch[2] + '\'');
    } else {
      const importDepth = getImportDepth(filePath);
      const importStatement = '\nimport {R} from \'' + importDepth + 'components/wiki\';\n';
      if (content.startsWith('---')) {
        const afterFirst = content.indexOf('\n') + 1;
        const closingMatch = content.slice(afterFirst).match(/\n---(?=\n|[^-]|$)/);
        if (closingMatch) {
          const insertPos = afterFirst + closingMatch.index + 4;
          content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
        }
      }
    }
  }

  writeFileSync(filePath, content);
  filesModified++;
  console.log('✓ ' + page.id + ': ' + fileConverted + ' links (' + fileNewResources + ' new resources)');
}

// Save resources
const header = `# External Resources Referenced in the Knowledge Base
# ==================================================
#
# Auto-generated and manually curated.
# See src/data/schema.ts for Resource schema.

`;
writeFileSync(RESOURCES_FILE, header + stringifyYaml(resources, { lineWidth: 100 }));

console.log('\n' + '='.repeat(60));
console.log('Done! ' + totalConverted + ' links converted in ' + filesModified + ' files');
console.log('Created ' + totalNewResources + ' new resources');
console.log('\nRun: npm run build:data');
