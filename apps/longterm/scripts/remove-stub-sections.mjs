#!/usr/bin/env node
/**
 * Remove Stub Sections from MDX Files
 *
 * Finds and removes sections that contain only placeholder text like:
 * - [Brief 2-3 paragraph description...]
 * - [Describe...]
 * - Empty sections
 *
 * Also removes stub sections at the end of files that duplicate headers
 * that already have content earlier in the file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content/docs/knowledge-base');

const DRY_RUN = !process.argv.includes('--apply');

// Patterns that indicate a stub/placeholder section
const PLACEHOLDER_PATTERNS = [
  /\[Brief \d+-\d+ paragraph description[^\]]*\]/,
  /\[Describe[^\]]*\]/,
  /\[Explain[^\]]*\]/,
  /\[Provide[^\]]*\]/,
  /\[List[^\]]*\]/,
  /\[Add[^\]]*\]/,
  /\[Insert[^\]]*\]/,
  /\[Include[^\]]*\]/,
  /\[Write[^\]]*\]/,
  /\[Complete[^\]]*\]/,
];

// Section headers that often have stubs
const STUB_SECTION_HEADERS = [
  '## Overview',
  '## Risks Addressed',
  '## How It Works',
  '## Critical Assessment',
  '## Limitations',
  '## Key Uncertainties',
  '## Responses',
];

function findMdxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findMdxFiles(fullPath));
    } else if (item.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasPlaceholder(text) {
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text));
}

function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Find frontmatter boundary
  let frontmatterEnd = 0;
  let inFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }

  // Parse into sections
  const sections = [];
  let currentSection = null;

  for (let i = frontmatterEnd + 1; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headerMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        startLine: i,
        header: line,
        headerText: headerMatch[2],
        level: headerMatch[1].length,
        content: [],
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Find sections to remove
  const sectionsToRemove = [];
  const seenHeaders = new Set();

  for (const section of sections) {
    const contentText = section.content.join('\n').trim();

    // Check if this section is a stub (contains placeholder or is effectively empty)
    const isStub = hasPlaceholder(contentText) ||
                   contentText === '' ||
                   contentText === 'This intervention addresses the following risks:' ||
                   contentText === 'The following interventions may help address this risk:' ||
                   contentText.match(/^This (risk|intervention|response) (addresses|is related to)[^.]*\.?\s*$/) ||
                   contentText.match(/^The following interventions may help address this risk:?\s*$/);

    // Check if this is a duplicate header (already seen)
    const normalizedHeader = section.headerText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicate = seenHeaders.has(normalizedHeader);

    if (isStub && (isDuplicate || STUB_SECTION_HEADERS.includes(section.header))) {
      sectionsToRemove.push(section);
    }

    seenHeaders.add(normalizedHeader);
  }

  if (sectionsToRemove.length === 0) {
    return { changed: false };
  }

  // Build new content, excluding stub sections
  const linesToRemove = new Set();
  for (const section of sectionsToRemove) {
    // Mark the header line and all content lines for removal
    linesToRemove.add(section.startLine);
    for (let i = 0; i < section.content.length; i++) {
      linesToRemove.add(section.startLine + 1 + i);
    }
  }

  // Find the end of the last section to remove (to clean trailing content)
  let lastSectionEndLine = 0;
  for (const section of sectionsToRemove) {
    const endLine = section.startLine + section.content.length;
    if (endLine > lastSectionEndLine) {
      lastSectionEndLine = endLine;
    }
  }

  // Build new content
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (!linesToRemove.has(i)) {
      newLines.push(lines[i]);
    }
  }

  // Clean up multiple consecutive blank lines
  const cleanedLines = [];
  let prevBlank = false;
  for (const line of newLines) {
    const isBlank = line.trim() === '';
    if (!(isBlank && prevBlank)) {
      cleanedLines.push(line);
    }
    prevBlank = isBlank;
  }

  // Remove trailing blank lines before final content
  while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim() === '') {
    cleanedLines.pop();
  }
  cleanedLines.push(''); // Add single trailing newline

  const newContent = cleanedLines.join('\n');

  return {
    changed: true,
    oldContent: content,
    newContent,
    removedSections: sectionsToRemove.map(s => s.header),
  };
}

function main() {
  console.log(DRY_RUN ? 'DRY RUN - no files will be modified\n' : 'APPLYING CHANGES\n');

  const files = findMdxFiles(CONTENT_DIR);
  let totalChanged = 0;
  let totalSectionsRemoved = 0;

  for (const file of files) {
    const result = cleanFile(file);

    if (result.changed) {
      const relPath = path.relative(ROOT, file);
      console.log(`\n${relPath}:`);
      console.log(`  Removing: ${result.removedSections.join(', ')}`);

      totalChanged++;
      totalSectionsRemoved += result.removedSections.length;

      if (!DRY_RUN) {
        fs.writeFileSync(file, result.newContent);
        console.log('  ✓ Saved');
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Files modified: ${totalChanged}`);
  console.log(`Sections removed: ${totalSectionsRemoved}`);

  if (DRY_RUN && totalChanged > 0) {
    console.log('\nRun with --apply to make changes');
  }
}

main();
