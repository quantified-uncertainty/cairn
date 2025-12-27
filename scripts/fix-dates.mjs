#!/usr/bin/env node
/**
 * Fix unquoted dates in frontmatter
 * YAML parses unquoted dates as Date objects, but Astro expects strings
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

let fixed = 0;

function fixFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      fixFiles(full);
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      let content = readFileSync(full, 'utf-8');
      // Match lastEdited: YYYY-MM-DD (not already quoted)
      if (content.match(/^lastEdited: \d{4}-\d{2}-\d{2}$/m)) {
        content = content.replace(
          /^lastEdited: (\d{4}-\d{2}-\d{2})$/gm,
          'lastEdited: "$1"'
        );
        writeFileSync(full, content);
        fixed++;
        console.log('Fixed:', full);
      }
    }
  }
}

fixFiles('src/content/docs');
console.log(`\nTotal fixed: ${fixed}`);
