#!/usr/bin/env node

/**
 * Migration Script: Extract TODO Placeholders to Hidden Frontmatter
 *
 * Converts MDX files with visible placeholder sections (e.g., `[Limitation 1]: [Description]`)
 * into clean content with todos tracked in frontmatter.
 *
 * Usage:
 *   node scripts/migrate-placeholders-to-todos.mjs --dry-run   # Preview changes
 *   node scripts/migrate-placeholders-to-todos.mjs --apply     # Apply changes
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { findMdxFiles } from './lib/file-utils.mjs';
import { getContentBody } from './lib/mdx-utils.mjs';

const PROJECT_ROOT = process.cwd();
const KNOWLEDGE_BASE_DIR = join(PROJECT_ROOT, 'src/content/docs/knowledge-base');

// Patterns to detect placeholder content
const PLACEHOLDER_PATTERNS = [
  // Long-form explanatory placeholders
  /\[Explain[^\]]*\]/gs,
  /\[Describe[^\]]*\]/gs,
  /\[List[^\]]*\]/gs,
  /\[Provide[^\]]*\]/gs,
  /\[Include[^\]]*\]/gs,

  // Numbered placeholders
  /\[Limitation \d+\]/g,
  /\[Uncertainty \d+\]/g,
  /\[Parameter \d+\]/g,
  /\[Factor \d+\]/g,
  /\[Response \d+\]/g,
  /\[Risk \d+\]/g,

  // Generic placeholders
  /\[Description\]/g,
  /\[Description of[^\]]*\]/g,
  /\[Brief justification\]/g,
  /\[Value\]/g,
  /\[Range\]/g,
  /\[Citation\]/g,
  /\[Low\/Medium\/High\]/g,
  /\[Source\]/g,
  /\[What[^\]]*\]/g,
  /\[Why[^\]]*\]/g,
  /\[How[^\]]*\]/g,
];

/**
 * Check if a section contains placeholder content
 */
function sectionHasPlaceholders(sectionContent) {
  for (const pattern of PLACEHOLDER_PATTERNS) {
    // Create a fresh copy of the regex to avoid lastIndex issues
    const regex = new RegExp(pattern.source, pattern.flags);
    if (regex.test(sectionContent)) {
      return true;
    }
  }
  return false;
}

/**
 * Count placeholders in section for TODO description
 */
function countPlaceholdersInSection(sectionContent) {
  let count = 0;
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const matches = sectionContent.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Extract sections from content
 */
function extractSections(content) {
  const sections = [];
  // Match ## headings and their content up to the next ## or end
  const sectionRegex = /^(## .+)$([\s\S]*?)(?=^## |\n---\n|$(?![\s\S]))/gm;

  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      heading: match[1].replace(/^## /, '').trim(),
      fullMatch: match[0],
      headingLine: match[1],
      content: match[2],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return sections;
}

/**
 * Analyze file for placeholder sections and generate TODOs
 */
function analyzeFile(content) {
  const todos = [];
  const sectionsToRemove = [];

  const sections = extractSections(content);

  for (const section of sections) {
    if (sectionHasPlaceholders(section.fullMatch)) {
      const placeholderCount = countPlaceholdersInSection(section.fullMatch);

      // Generate TODO message
      if (placeholderCount > 1) {
        todos.push(`Complete '${section.heading}' section (${placeholderCount} placeholders)`);
      } else {
        todos.push(`Complete '${section.heading}' section`);
      }

      // Track section for removal
      sectionsToRemove.push(section);
    }
  }

  return { todos, sectionsToRemove };
}

/**
 * Remove placeholder sections from content
 */
function removePlaceholderSections(content, sectionsToRemove) {
  // Sort sections by position (descending) to remove from end first
  const sorted = [...sectionsToRemove].sort((a, b) => b.start - a.start);

  let newContent = content;
  for (const section of sorted) {
    // Remove the section
    const before = newContent.slice(0, section.start);
    const after = newContent.slice(section.end);
    newContent = before + after;
  }

  // Clean up excessive newlines
  newContent = newContent.replace(/\n{4,}/g, '\n\n\n');
  newContent = newContent.replace(/\n{3,}$/, '\n');

  return newContent;
}

/**
 * Get raw frontmatter string (between --- delimiters)
 */
function getRawFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

/**
 * Add todos to existing frontmatter by inserting YAML at the end
 * This preserves the exact formatting of the original frontmatter
 */
function addTodosToFrontmatter(rawFrontmatter, todos) {
  // Check if todos already exists
  if (/^todos:/m.test(rawFrontmatter)) {
    // This is a simple case - we won't try to merge, just return as-is
    // since we don't want to duplicate
    return rawFrontmatter;
  }

  // Format todos as YAML
  const todosYaml = 'todos:\n' + todos.map(t => `  - "${t}"`).join('\n');

  // Insert before the closing --- by appending to frontmatter
  return rawFrontmatter.trimEnd() + '\n' + todosYaml;
}

/**
 * Process a single MDX file
 */
function processFile(filePath, options) {
  const content = readFileSync(filePath, 'utf-8');
  const rawFrontmatter = getRawFrontmatter(content);
  const mdxContent = getContentBody(content);

  if (!rawFrontmatter) {
    return { changed: false };
  }

  const { todos, sectionsToRemove } = analyzeFile(mdxContent);

  if (todos.length === 0) {
    return { changed: false };
  }

  // Add todos to frontmatter preserving original formatting
  const newFrontmatter = addTodosToFrontmatter(rawFrontmatter, todos);

  // Remove placeholder sections from content
  const newMdxContent = removePlaceholderSections(mdxContent, sectionsToRemove);

  // Reconstruct the file
  const newFile = `---\n${newFrontmatter}\n---\n${newMdxContent}`;

  if (options.apply) {
    writeFileSync(filePath, newFile, 'utf-8');
  }

  return {
    changed: true,
    todos: todos,
    sectionsRemoved: sectionsToRemove.map(s => s.heading),
    newFile
  };
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');
  const verbose = args.includes('--verbose');

  if (!dryRun && !apply) {
    console.log('Usage: node scripts/migrate-placeholders-to-todos.mjs [--dry-run | --apply]');
    console.log('  --dry-run  Preview changes without modifying files');
    console.log('  --apply    Apply changes to files');
    console.log('  --verbose  Show detailed output');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Placeholder to TODO Migration ${dryRun ? '(DRY RUN)' : '(APPLYING)'}`);
  console.log(`${'='.repeat(60)}\n`);

  const files = findMdxFiles(KNOWLEDGE_BASE_DIR);
  console.log(`Found ${files.length} MDX files to scan\n`);

  let changedCount = 0;
  let totalTodos = 0;
  const results = [];

  for (const file of files) {
    try {
      const result = processFile(file, { apply, verbose });

      if (result.changed) {
        changedCount++;
        totalTodos += result.todos.length;

        const shortPath = file.replace(KNOWLEDGE_BASE_DIR + '/', '');
        console.log(`\n${apply ? '✓' : '⦿'} ${shortPath}`);
        console.log(`  TODOs: ${result.todos.join(', ')}`);
        console.log(`  Sections removed: ${result.sectionsRemoved.join(', ')}`);

        results.push({
          file: shortPath,
          todos: result.todos,
          sectionsRemoved: result.sectionsRemoved
        });
      }
    } catch (err) {
      console.error(`Error processing ${file}: ${err.message}`);
      if (verbose) {
        console.error(err.stack);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files ${apply ? 'modified' : 'to modify'}: ${changedCount}`);
  console.log(`Total TODOs ${apply ? 'added' : 'to add'}: ${totalTodos}`);

  if (dryRun && changedCount > 0) {
    console.log(`\nRun with --apply to make these changes.`);
  }
}

main();
