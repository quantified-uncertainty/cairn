/**
 * Script to remove manual PageStatus components from MDX files
 * since they'll now be auto-injected from frontmatter
 */

import fs from 'fs';
import path from 'path';

function findMdxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findMdxFiles(fullPath, files);
    } else if (entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function removePageStatus() {
  const files = findMdxFiles('src/content/docs/knowledge-base');

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    // Check if has PageStatus component
    if (!content.includes('<PageStatus')) {
      skipped++;
      continue;
    }

    // Remove PageStatus from imports
    // Pattern: , PageStatus or PageStatus, or just PageStatus in import
    content = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*components\/wiki[^'"]*)['"]/gm,
      (match, imports, path) => {
        const importList = imports.split(',').map(i => i.trim()).filter(i => i !== 'PageStatus' && i !== '');
        if (importList.length === 0) {
          return ''; // Remove entire import if empty
        }
        return `import {${importList.join(', ')}} from '${path}'`;
      }
    );

    // Remove the PageStatus component usage (including multiline)
    content = content.replace(/<PageStatus[^/>]*\/>\s*\n?/g, '');
    content = content.replace(/<PageStatus[^>]*>[^<]*<\/PageStatus>\s*\n?/g, '');

    // Clean up any double blank lines created
    content = content.replace(/\n\n\n+/g, '\n\n');

    // Clean up empty imports
    content = content.replace(/import\s*\{\s*\}\s*from\s*['"][^'"]*['"]\s*;?\n?/g, '');

    fs.writeFileSync(file, content);
    console.log(`UPDATED: ${file}`);
    updated++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

removePageStatus();
