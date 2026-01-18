#!/usr/bin/env node
/**
 * Validate and optionally fix unescaped comparison operators in MDX files
 *
 * Less-than (<) followed by numbers/letters gets parsed as JSX tags in MDX,
 * causing build failures. These need to be escaped as &lt;
 *
 * Greater-than (>) is less problematic but can cause issues in certain contexts.
 *
 * Usage:
 *   node scripts/validate-comparison-operators.mjs           # Check only
 *   node scripts/validate-comparison-operators.mjs --fix     # Fix issues
 *   node scripts/validate-comparison-operators.mjs --verbose # Show all matches
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const CONTENT_DIR = 'src/content/docs';
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');

// Pattern: < followed by a digit or \$ (escaped dollar sign)
// This catches <10%, <$100, <1 year, etc.
// We use a negative lookbehind to avoid matching already-escaped &lt;
const LESS_THAN_PATTERN = /<(\d|\\?\$)/g;

// Pattern: > followed by a digit that isn't in a valid context
// Less common issue, but can occur in tables
const GREATER_THAN_PATTERN = />(\d)/g;

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

function isInJsxAttribute(content, position) {
  // Check if we're inside a JSX attribute (e.g., chart={`...`})
  const before = content.slice(0, position);
  const lastNewline = before.lastIndexOf('\n');
  const currentLine = before.slice(lastNewline + 1);

  // Inside a template literal in JSX
  const templateStart = currentLine.lastIndexOf('{`');
  const templateEnd = currentLine.lastIndexOf('`}');
  if (templateStart > templateEnd) return true;

  return false;
}

function isAlreadyEscaped(content, position) {
  // Check if the < is already part of &lt;
  const after = content.slice(position, position + 4);
  if (after === '&lt;') return true;

  // Check for \< (backslash escaped)
  if (position > 0 && content[position - 1] === '\\') return true;

  return false;
}

function isValidHtmlTag(content, position) {
  // Check if this looks like a valid HTML/JSX tag (e.g., <R, <br, <Mermaid)
  const after = content.slice(position, position + 20);
  // Valid tags start with letter or /, not digit or symbol
  return /^<[a-zA-Z\/]/.test(after);
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

    // Find less-than matches
    let match;
    const ltRegex = new RegExp(LESS_THAN_PATTERN.source, 'g');
    while ((match = ltRegex.exec(line)) !== null) {
      const absolutePos = position + match.index;

      // Skip if in code block, JSX attribute, already escaped, or valid HTML tag
      if (!isInCodeBlock(content, absolutePos) &&
          !isInJsxAttribute(content, absolutePos) &&
          !isAlreadyEscaped(content, absolutePos) &&
          !isValidHtmlTag(content, absolutePos)) {
        issues.push({
          line: i + 1,
          column: match.index + 1,
          text: line.slice(Math.max(0, match.index - 10), match.index + 15),
          match: match[0],
          type: 'less-than',
          fix: '&lt;' + match[1]
        });
      }
    }

    // Find greater-than matches (less critical, only in specific contexts)
    // For now, we'll just check for >NUMBER in table cells
    if (line.includes('|')) {
      const gtRegex = new RegExp(GREATER_THAN_PATTERN.source, 'g');
      while ((match = gtRegex.exec(line)) !== null) {
        const absolutePos = position + match.index;

        // Skip if in code block or already escaped
        if (!isInCodeBlock(content, absolutePos) &&
            !isAlreadyEscaped(content, absolutePos)) {
          // Check if it's actually causing rendering issues (usually doesn't)
          // We'll warn but not fail on these
          if (verbose) {
            console.log(`  \x1b[2mNote: >${match[1]} at line ${i + 1} - usually OK but verify rendering\x1b[0m`);
          }
        }
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

  let fixCount = 0;
  const fixedLines = lines.map((line, i) => {
    // Skip frontmatter
    if (i <= frontmatterEnd) return line;

    // Replace < before digits/dollar signs, but not in code blocks or valid tags
    // This is a simplified fix - complex cases may need manual review
    let fixed = line;

    // Replace <NUMBER patterns (not already &lt; and not valid HTML tags)
    fixed = fixed.replace(/(?<!&lt)(?<![a-zA-Z])<(\d)/g, (match, digit) => {
      fixCount++;
      return '&lt;' + digit;
    });

    // Replace <\$NUMBER patterns (escaped dollar signs)
    fixed = fixed.replace(/(?<!&lt)<(\\?\$\d)/g, (match, rest) => {
      fixCount++;
      return '&lt;' + rest;
    });

    return fixed;
  });

  const fixedContent = fixedLines.join('\n');

  if (fixedContent !== content) {
    writeFileSync(filePath, fixedContent);
    return fixCount;
  }
  return 0;
}

// Main
console.log('\x1b[34mChecking MDX files for unescaped comparison operators...\x1b[0m\n');

const files = getAllMdxFiles(CONTENT_DIR);
let totalIssues = 0;
let filesWithIssues = 0;
let totalFixed = 0;

for (const file of files) {
  const relPath = relative(process.cwd(), file);
  const issues = checkFile(file);

  if (issues.length > 0) {
    filesWithIssues++;
    totalIssues += issues.length;

    if (shouldFix) {
      const fixed = fixFile(file);
      if (fixed > 0) {
        totalFixed += fixed;
        console.log(`\x1b[32m✓ Fixed:\x1b[0m ${relPath} (${fixed} issues)`);
      }
    } else {
      console.log(`\x1b[1m${relPath}\x1b[0m`);
      for (const issue of issues) {
        console.log(`  \x1b[33m⚠ Line ${issue.line}:\x1b[0m ...${issue.text}...`);
        if (verbose) {
          console.log(`    \x1b[2mMatch: "${issue.match}" → should be "${issue.fix}"\x1b[0m`);
        }
      }
      console.log();
    }
  }
}

// Summary
console.log('\x1b[1mSummary:\x1b[0m');
if (totalIssues === 0) {
  console.log('  \x1b[32m✓ No unescaped comparison operators found\x1b[0m');
} else if (shouldFix) {
  console.log(`  \x1b[32m✓ Fixed ${totalFixed} issues across ${filesWithIssues} files\x1b[0m`);
} else {
  console.log(`  \x1b[33m${totalIssues} unescaped comparison operators in ${filesWithIssues} files\x1b[0m`);
  console.log('  \x1b[2mRun with --fix to auto-fix\x1b[0m');
  process.exit(1);
}
