/**
 * Add quality/llmSummary/lastEdited frontmatter fields to pages missing them
 */

import fs from 'fs';
import path from 'path';

const TODAY = new Date().toISOString().split('T')[0];

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

function addFrontmatterFields() {
  const files = findMdxFiles('src/content/docs/knowledge-base');

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    // Skip index files
    if (file.endsWith('/index.mdx')) {
      skipped++;
      continue;
    }

    let content = fs.readFileSync(file, 'utf-8');

    // Check if already has quality field
    if (content.match(/^quality:\s*\d/m)) {
      console.log(`SKIP (has quality): ${file}`);
      skipped++;
      continue;
    }

    // Extract description from frontmatter for llmSummary
    const descMatch = content.match(/^description:\s*["']?([^"'\n]+)["']?/m);
    const description = descMatch ? descMatch[1].trim() : '';

    // Find the end of frontmatter (second ---)
    const frontmatterEnd = content.indexOf('---', 4);
    if (frontmatterEnd === -1) {
      console.log(`SKIP (no frontmatter): ${file}`);
      skipped++;
      continue;
    }

    // Insert new fields before the closing ---
    const newFields = `quality: 2
llmSummary: "${description.replace(/"/g, '\\"')}"
lastEdited: "${TODAY}"
`;

    content = content.slice(0, frontmatterEnd) + newFields + content.slice(frontmatterEnd);

    fs.writeFileSync(file, content);
    console.log(`UPDATED: ${file}`);
    updated++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

addFrontmatterFields();
