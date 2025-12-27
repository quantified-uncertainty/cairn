/**
 * Script to add PageStatus component to all knowledge-base MDX files
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

async function addPageStatus() {
  const files = findMdxFiles('src/content/docs/knowledge-base');

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Skip if already has PageStatus
    if (content.includes('<PageStatus')) {
      console.log(`SKIP (already has PageStatus): ${file}`);
      skipped++;
      continue;
    }

    // Skip index files - they're usually just navigation pages
    if (file.endsWith('/index.mdx')) {
      console.log(`SKIP (index file): ${file}`);
      skipped++;
      continue;
    }

    // Extract title from frontmatter for LLM summary
    const titleMatch = content.match(/^title:\s*["']?([^"'\n]+)["']?/m);
    const descMatch = content.match(/^description:\s*["']?([^"'\n]+)["']?/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown';
    const description = descMatch ? descMatch[1].trim() : '';

    // Create a simple LLM summary from the description or title
    const llmSummary = description || `Overview of ${title} in the context of AI safety.`;

    // Find where to insert - after the import statements
    const importMatch = content.match(/^import\s+.*$/gm);

    if (!importMatch) {
      console.log(`SKIP (no imports found): ${file}`);
      skipped++;
      continue;
    }

    let newContent = content;

    // Check if PageStatus is already imported
    if (!content.includes('PageStatus')) {
      // Add PageStatus to an existing wiki import, or create new import
      const wikiImportRegex = /^(import\s*\{[^}]*)\}\s*from\s*['"]([^'"]*components\/wiki[^'"]*)['"]/m;
      const wikiImportMatch = content.match(wikiImportRegex);

      if (wikiImportMatch) {
        // Add PageStatus to existing wiki import
        const existingImports = wikiImportMatch[1];
        const importPath = wikiImportMatch[2];
        const newImport = `${existingImports}, PageStatus} from '${importPath}'`;
        newContent = newContent.replace(wikiImportRegex, newImport);
      } else {
        // Find the last import and add after it
        const lastImportIndex = content.lastIndexOf('import ');
        const lineEnd = content.indexOf('\n', lastImportIndex);

        // Calculate relative path to wiki components
        const depth = file.split('/').length - 4; // from src/content/docs/knowledge-base
        const relativePath = '../'.repeat(depth) + 'components/wiki';

        const importStatement = `\nimport { PageStatus } from '${relativePath}';`;
        newContent = newContent.slice(0, lineEnd + 1) + importStatement + newContent.slice(lineEnd + 1);
      }
    }

    // Find the position after all imports and before the first component/heading
    // Look for the pattern of blank line after imports
    const afterImportsMatch = newContent.match(/^import\s+[^\n]+\n(?:\s*\n)+/gm);

    // Find the first non-import content (usually a component like <DataInfoBox or a ## heading)
    const firstContentMatch = newContent.match(/\n\n(<[A-Z]|##\s)/);

    if (firstContentMatch) {
      const insertPos = newContent.indexOf(firstContentMatch[0]) + 2; // After the \n\n

      // Escape quotes in llmSummary for JSX
      const escapedSummary = llmSummary.replace(/"/g, '\\"');

      const pageStatusComponent = `<PageStatus quality={2} lastEdited="${TODAY}" llmSummary="${escapedSummary}" />\n\n`;

      newContent = newContent.slice(0, insertPos) + pageStatusComponent + newContent.slice(insertPos);

      fs.writeFileSync(file, newContent);
      console.log(`UPDATED: ${file}`);
      updated++;
    } else {
      console.log(`SKIP (couldn't find insert position): ${file}`);
      skipped++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${files.length}`);
}

addPageStatus().catch(console.error);
