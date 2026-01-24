#!/usr/bin/env node
/**
 * Validate and optionally fix unescaped dollar signs in MDX files
 *
 * Dollar signs before numbers (e.g., $100) get parsed as LaTeX math by KaTeX,
 * causing MDX parsing errors when combined with JSX tags like <R>.
 *
 * Usage:
 *   node scripts/validate-dollar-signs.mjs           # Check only
 *   node scripts/validate-dollar-signs.mjs --fix     # Fix issues
 *   node scripts/validate-dollar-signs.mjs --verbose # Show all matches
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const CONTENT_DIR = 'src/content/docs';
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');

// Pattern: unescaped $ followed by a number (not already escaped with \)
// Matches $5, $5.25, $100M, etc.
const DOLLAR_NUMBER_PATTERN = /(?<!\\)\$(\d)/g;

function getAllMdxFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath));
    } else if (entry.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function getFrontmatterEndLine(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return 0;

  let dashCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      dashCount++;
      if (dashCount === 2) return i;
    }
  }
  return 0;
}

function isInCodeBlock(content, position) {
  // Check if position is inside a code block (``` or `)
  const before = content.slice(0, position);

  // Count triple backticks
  const tripleBackticks = (before.match(/```/g) || []).length;
  if (tripleBackticks % 2 === 1) return true;

  // Check inline code (simplistic - just check if between backticks on same line)
  const lastNewline = before.lastIndexOf('\n');
  const currentLine = before.slice(lastNewline + 1);
  const backticks = (currentLine.match(/`/g) || []).length;
  return backticks % 2 === 1;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const frontmatterEnd = getFrontmatterEndLine(content);

  const issues = [];
  let position = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip frontmatter
    if (i <= frontmatterEnd) {
      position += line.length + 1;
      continue;
    }

    // Find all matches in this line
    let match;
    const regex = new RegExp(DOLLAR_NUMBER_PATTERN.source, 'g');
    while ((match = regex.exec(line)) !== null) {
      const absolutePos = position + match.index;

      // Skip if in code block
      if (!isInCodeBlock(content, absolutePos)) {
        issues.push({
          line: i + 1,
          column: match.index + 1,
          text: line.slice(Math.max(0, match.index - 10), match.index + 15),
          match: match[0]
        });
      }
    }

    position += line.length + 1;
  }

  return issues;
}

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const frontmatterEnd = getFrontmatterEndLine(content);

  const fixedLines = lines.map((line, i) => {
    // Skip frontmatter
    if (i <= frontmatterEnd) return line;

    // Replace unescaped $ before numbers, but not in code blocks
    // This is a simplified fix - complex cases may need manual review
    return line.replace(/(?<!\\)(?<!`[^`]*)\$(\d)/g, '\\$$1');
  });

  const fixedContent = fixedLines.join('\n');

  if (fixedContent !== content) {
    writeFileSync(filePath, fixedContent);
    return true;
  }
  return false;
}

// Main
console.log('\x1b[34mChecking MDX files for unescaped dollar signs...\x1b[0m\n');

const files = getAllMdxFiles(CONTENT_DIR);
let totalIssues = 0;
let filesWithIssues = 0;
let filesFixed = 0;

for (const file of files) {
  const relPath = relative(process.cwd(), file);
  const issues = checkFile(file);

  if (issues.length > 0) {
    filesWithIssues++;
    totalIssues += issues.length;

    if (shouldFix) {
      if (fixFile(file)) {
        filesFixed++;
        console.log(`\x1b[32m✓ Fixed:\x1b[0m ${relPath} (${issues.length} issues)`);
      }
    } else {
      console.log(`\x1b[1m${relPath}\x1b[0m`);
      for (const issue of issues) {
        console.log(`  \x1b[33m⚠ Line ${issue.line}:\x1b[0m ...${issue.text}...`);
        if (verbose) {
          console.log(`    \x1b[2mMatch: "${issue.match}" → should be "\\${issue.match}"\x1b[0m`);
        }
      }
      console.log();
    }
  }
}

// Summary
console.log('\x1b[1mSummary:\x1b[0m');
if (totalIssues === 0) {
  console.log('  \x1b[32m✓ No unescaped dollar signs found\x1b[0m');
} else if (shouldFix) {
  console.log(`  \x1b[32m✓ Fixed ${totalIssues} issues in ${filesFixed} files\x1b[0m`);
} else {
  console.log(`  \x1b[33m${totalIssues} unescaped dollar signs in ${filesWithIssues} files\x1b[0m`);
  console.log('  \x1b[2mRun with --fix to auto-fix\x1b[0m');
  process.exit(1);
}
