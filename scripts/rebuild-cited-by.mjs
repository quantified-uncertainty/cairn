#!/usr/bin/env node
/**
 * Rebuild cited_by relationships for all resources
 * Scans MDX files for <R id="..."> usage and updates resources.yaml
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { parse, stringify } from 'yaml';

const CONTENT_DIR = 'src/content/docs';
const RESOURCES_FILE = 'src/data/resources.yaml';

function findMdxFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      findMdxFiles(path, files);
    } else if (entry.endsWith('.mdx')) {
      files.push(path);
    }
  }
  return files;
}

// Load resources
let resources = parse(readFileSync(RESOURCES_FILE, 'utf-8'));

// Build id -> resource map and clear cited_by
const resourceMap = new Map();
for (const r of resources) {
  r.cited_by = []; // Clear existing
  resourceMap.set(r.id, r);
}

// Scan all MDX files for <R id="..."> usage
const files = findMdxFiles(CONTENT_DIR);
const rComponentRegex = /<R\s+id="([^"]+)"/g;

let totalCitations = 0;

for (const filePath of files) {
  const content = readFileSync(filePath, 'utf-8');
  const articleId = basename(filePath, '.mdx');

  // Skip index files
  if (articleId === 'index') continue;

  // Find all R component usages
  const ids = new Set();
  let match;
  while ((match = rComponentRegex.exec(content)) !== null) {
    ids.add(match[1]);
  }

  // Update cited_by for each resource
  for (const id of ids) {
    const resource = resourceMap.get(id);
    if (resource) {
      if (!resource.cited_by.includes(articleId)) {
        resource.cited_by.push(articleId);
        totalCitations++;
      }
    }
  }
}

// Remove empty cited_by arrays for cleaner YAML
for (const r of resources) {
  if (r.cited_by.length === 0) {
    delete r.cited_by;
  }
}

// Count stats
const withCitedBy = resources.filter(r => r.cited_by && r.cited_by.length > 0).length;
const withoutCitedBy = resources.filter(r => !r.cited_by || r.cited_by.length === 0).length;

console.log('Resources with citations:', withCitedBy);
console.log('Resources without citations:', withoutCitedBy);
console.log('Total citations:', totalCitations);

// Save
const header = `# External Resources Referenced in the Knowledge Base
# ==================================================
#
# Auto-generated and manually curated.
# See src/data/schema.ts for Resource schema.

`;
writeFileSync(RESOURCES_FILE, header + stringify(resources, { lineWidth: 100 }));
console.log('\nSaved updated resources.yaml');
