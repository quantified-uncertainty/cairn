#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function fixFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      fixFiles(full);
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      let content = readFileSync(full, 'utf-8');
      // Match unquoted dates like: lastEdited: 2025-12-27
      if (content.match(/^lastEdited: \d{4}-\d{2}-\d{2}$/m)) {
        content = content.replace(/^lastEdited: (\d{4}-\d{2}-\d{2})$/gm, 'lastEdited: "$1"');
        writeFileSync(full, content);
        console.log('Fixed:', full);
      }
    }
  }
}

fixFiles('src/content/docs');
console.log('Done');
