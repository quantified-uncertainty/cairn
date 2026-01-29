#!/usr/bin/env node

/**
 * Validate Placeholders and Incomplete Content
 *
 * Detects common patterns of unfinished content:
 * - TODO/TBD/FIXME markers
 * - Placeholder patterns like [Value], [Description], etc.
 * - Empty or sparse sections
 * - Incomplete sentences (trailing ...)
 * - Empty table cells
 * - Repeated placeholder text
 *
 * Usage:
 *   node scripts/validate/validate-placeholders.mjs           # Check all files
 *   node scripts/validate/validate-placeholders.mjs --ci      # CI mode (JSON output)
 *   node scripts/validate/validate-placeholders.mjs --verbose # Show context
 *   node scripts/validate/validate-placeholders.mjs --path risks  # Filter by path
 */

import { readFileSync } from 'fs';
import { relative } from 'path';
import { findMdxFiles } from '../lib/file-utils.mjs';
import { parseFrontmatter, getContentBody, shouldSkipValidationFull } from '../lib/mdx-utils.mjs';
import { getColors, formatPath } from '../lib/output.mjs';
import { CONTENT_DIR } from '../lib/content-types.mjs';

const args = process.argv.slice(2);
const CI_MODE = args.includes('--ci');
const VERBOSE = args.includes('--verbose');
const PATH_FILTER = args.includes('--path') ? args[args.indexOf('--path') + 1] : null;

const colors = getColors(CI_MODE);

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  // Explicit markers
  { pattern: /\bTODO\b/gi, name: 'TODO marker', severity: 'warning' },
  { pattern: /\bTBD\b/gi, name: 'TBD marker', severity: 'warning' },
  { pattern: /\bFIXME\b/gi, name: 'FIXME marker', severity: 'warning' },
  { pattern: /\bXXX\b/g, name: 'XXX marker', severity: 'warning' },
  // Note: HACK removed - too many false positives in "reward hacking" context

  // Bracketed placeholders
  { pattern: /\[(?:Value|TBD|TODO|TBC|N\/A|XX+|\.\.\.)\]/gi, name: 'Bracketed placeholder', severity: 'warning' },
  { pattern: /\[(?:Description|Explanation|Details|Content|Text)\]/gi, name: 'Description placeholder', severity: 'warning' },
  { pattern: /\[(?:Insert|Add|Fill in|Complete|Provide)[^\]]*\]/gi, name: 'Action placeholder', severity: 'warning' },
  // Note: Uses negative lookahead to avoid matching markdown links like [source](url)
  { pattern: /\[(?:Source|Citation|Reference|Link)\](?!\()/gi, name: 'Citation placeholder', severity: 'warning' },
  { pattern: /\[(?:Date|Year|Number|Percentage|Figure)\]/gi, name: 'Data placeholder', severity: 'warning' },

  // Numbered placeholders (from templates)
  { pattern: /\[(?:Limitation|Uncertainty|Point|Item|Example)\s*\d*\](?::\s*\[|\s*-\s*\[)/gi, name: 'Template list placeholder', severity: 'warning' },

  // Incomplete sentences
  { pattern: /[^.!?]\s*\.{3,}\s*$/gm, name: 'Trailing ellipsis (incomplete)', severity: 'info' },
  { pattern: /^\s*\.{3,}\s*$/gm, name: 'Ellipsis-only line', severity: 'info' },

  // Empty/placeholder table cells (not header separators)
  { pattern: /\|\s*\?\s*\|/g, name: 'Question mark table cell', severity: 'info' },

  // Common draft patterns
  // Note: Removed "coming soon" - too many false positives in legitimate context like "AGI was coming soon"
  // Note: Removed "to be completed/determined" - too many false positives in legitimate prose like "remains to be determined"
  { pattern: /\bplaceholder\b/gi, name: 'Placeholder text', severity: 'warning' },
  { pattern: /\bwork in progress\b/gi, name: 'Work in progress marker', severity: 'info' },
  // Note: "draft" removed - too many false positives in legitimate content like "Draft Executive Order"

  // Repeated/template text
  { pattern: /Lorem ipsum/gi, name: 'Lorem ipsum text', severity: 'error' },
  { pattern: /\[Your [^\]]+\]/gi, name: 'Template prompt placeholder', severity: 'warning' },

  // Suspicious patterns
  { pattern: /^\s*\*\s*\.\.\.\s*$/gm, name: 'Bullet with only ellipsis', severity: 'warning' },
  { pattern: /^\s*-\s*\.\.\.\s*$/gm, name: 'List item with only ellipsis', severity: 'warning' },
];

// Section names to check for emptiness
const SECTION_NAMES = ['Overview', 'Key Uncertainties', 'How It Works', 'Limitations'];

/**
 * Extract section content between ## heading and next ## heading (not ###)
 */
function getSectionContent(body, sectionName) {
  // Find the section header (allowing for optional ? in Limitations?)
  const headerPattern = sectionName === 'Limitations'
    ? /^##\s+Limitations?\s*$/mi
    : new RegExp(`^##\\s+${sectionName}\\s*$`, 'mi');

  const headerMatch = body.match(headerPattern);
  if (!headerMatch) return null;

  const startIndex = headerMatch.index + headerMatch[0].length;
  const afterHeader = body.slice(startIndex);

  // Find next ## heading (exactly 2 #'s, not 3+)
  // Match \n## followed by a space and non-# character
  const nextH2Match = afterHeader.match(/\n##\s+[^#]/);
  const endIndex = nextH2Match ? nextH2Match.index : afterHeader.length;

  return afterHeader.slice(0, endIndex);
}

/**
 * Check if text is inside a code block
 */
function isInCodeBlock(content, position) {
  const before = content.slice(0, position);
  const tripleBackticks = (before.match(/```/g) || []).length;
  return tripleBackticks % 2 === 1;
}

/**
 * Check if text is inside a Mermaid component
 * Mermaid uses: <Mermaid ...chart={`...`}.../>
 * Note: Must look for the actual closing `} /> pattern, not just /> (which appears in <br/> tags)
 */
function isInMermaid(content, position) {
  // Find the most recent <Mermaid
  const before = content.slice(0, position);
  const lastMermaidOpen = before.lastIndexOf('<Mermaid');
  if (lastMermaidOpen === -1) return false;

  // Look for the actual Mermaid closing pattern: `} /> or similar
  // The backtick closes the template string, } closes the JSX expression
  const afterMermaid = content.slice(lastMermaidOpen, position);
  // Match patterns like: `} /> or \`} /> (end of template string + JSX closing)
  const closingPattern = /`\s*}\s*\/>/;
  const closingMatch = afterMermaid.match(closingPattern);
  // If no closing pattern found before position, we're inside the Mermaid
  return !closingMatch;
}

/**
 * Check if text is inside an HTML comment
 */
function isInComment(content, position) {
  const before = content.slice(0, position);
  const opens = (before.match(/<!--/g) || []).length;
  const closes = (before.match(/-->/g) || []).length;
  return opens > closes;
}

/**
 * Get line number for a position
 */
function getLineNumber(content, position) {
  return content.slice(0, position).split('\n').length;
}

/**
 * Extract context around a match
 */
function getContext(content, position, matchLength) {
  const start = Math.max(0, position - 30);
  const end = Math.min(content.length, position + matchLength + 30);
  let context = content.slice(start, end);

  // Clean up for display
  context = context.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (start > 0) context = '...' + context;
  if (end < content.length) context = context + '...';

  return context;
}

/**
 * Check for empty or sparse sections
 */
function checkSparseSections(body) {
  const issues = [];

  for (const sectionName of SECTION_NAMES) {
    const sectionContent = getSectionContent(body, sectionName);
    if (sectionContent !== null) {
      const trimmedContent = sectionContent.trim();
      const wordCount = trimmedContent.split(/\s+/).filter(w => w.length > 2).length;

      if (wordCount < 10) {
        // Find the line number of the section header
        const headerPattern = sectionName === 'Limitations'
          ? /^##\s+Limitations?\s*$/mi
          : new RegExp(`^##\\s+${sectionName}\\s*$`, 'mi');
        const headerMatch = body.match(headerPattern);
        const lineNum = headerMatch ? getLineNumber(body, headerMatch.index) : 0;

        issues.push({
          pattern: `Sparse section: ${sectionName}`,
          severity: 'info',
          line: lineNum,
          context: `${sectionName} section has only ${wordCount} words`,
        });
      }
    }
  }

  return issues;
}

/**
 * Check for empty table cells (more than 2 in a row)
 */
function checkEmptyTableCells(body) {
  const issues = [];
  const tableRowRegex = /^\|[^|]+(?:\|[^|]+)+\|$/gm;
  let match;

  while ((match = tableRowRegex.exec(body)) !== null) {
    const row = match[0];
    // Skip header separator rows
    if (/^\|[\s:-]+\|$/.test(row.replace(/[^|:-\s]/g, ''))) continue;

    const cells = row.split('|').slice(1, -1);
    const emptyCells = cells.filter(c => c.trim() === '' || c.trim() === '-').length;

    if (emptyCells >= 2 && emptyCells > cells.length / 2) {
      issues.push({
        pattern: 'Mostly empty table row',
        severity: 'info',
        line: getLineNumber(body, match.index),
        context: `Row has ${emptyCells}/${cells.length} empty cells`,
      });
    }
  }

  return issues;
}

/**
 * Check a single file for placeholders
 */
function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const frontmatter = parseFrontmatter(content);
  const body = getContentBody(content);
  const issues = [];

  // Skip validation for certain page types
  if (shouldSkipValidationFull(frontmatter, filePath)) {
    return issues;
  }

  // Check each placeholder pattern
  for (const { pattern, name, severity } of PLACEHOLDER_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(body)) !== null) {
      const position = match.index;

      // Skip if in code block, comment, or Mermaid diagram
      if (isInCodeBlock(body, position) || isInComment(body, position) || isInMermaid(body, position)) {
        continue;
      }

      issues.push({
        pattern: name,
        severity,
        line: getLineNumber(body, position),
        match: match[0],
        context: VERBOSE ? getContext(body, position, match[0].length) : null,
      });
    }
  }

  // Check for sparse sections
  issues.push(...checkSparseSections(body));

  // Check for empty table cells
  issues.push(...checkEmptyTableCells(body));

  // Check frontmatter for todos (these are tracked separately but worth noting)
  if (frontmatter.todos && frontmatter.todos.length > 0) {
    issues.push({
      pattern: 'Frontmatter TODOs',
      severity: 'info',
      line: 1,
      context: `${frontmatter.todos.length} tracked TODO(s) in frontmatter`,
    });
  }

  return issues;
}

/**
 * Main function
 */
function main() {
  let files = findMdxFiles(CONTENT_DIR);

  // Filter by path if specified
  if (PATH_FILTER) {
    files = files.filter(f => f.includes(PATH_FILTER));
  }

  const allIssues = [];
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  if (!CI_MODE) {
    console.log(`${colors.blue}Checking ${files.length} files for placeholders and incomplete content...${colors.reset}\n`);
  }

  for (const file of files) {
    const issues = checkFile(file);

    if (issues.length > 0) {
      allIssues.push({ file, issues });

      for (const issue of issues) {
        if (issue.severity === 'error') errorCount++;
        else if (issue.severity === 'warning') warningCount++;
        else infoCount++;
      }
    }
  }

  if (CI_MODE) {
    console.log(JSON.stringify({
      files: files.length,
      filesWithIssues: allIssues.length,
      errors: errorCount,
      warnings: warningCount,
      infos: infoCount,
      issues: allIssues.map(({ file, issues }) => ({
        file: formatPath(file),
        issues,
      })),
    }, null, 2));
  } else {
    if (allIssues.length === 0) {
      console.log(`${colors.green}✓ No placeholder or incomplete content found${colors.reset}\n`);
    } else {
      // Sort by severity
      allIssues.sort((a, b) => {
        const aMax = Math.max(...a.issues.map(i => i.severity === 'error' ? 2 : i.severity === 'warning' ? 1 : 0));
        const bMax = Math.max(...b.issues.map(i => i.severity === 'error' ? 2 : i.severity === 'warning' ? 1 : 0));
        return bMax - aMax;
      });

      for (const { file, issues } of allIssues) {
        const relPath = formatPath(file);
        console.log(`${colors.bold}${relPath}${colors.reset}`);

        for (const issue of issues) {
          let icon;
          if (issue.severity === 'error') icon = `${colors.red}✗`;
          else if (issue.severity === 'warning') icon = `${colors.yellow}⚠`;
          else icon = `${colors.blue}ℹ`;

          console.log(`  ${icon} Line ${issue.line}: ${issue.pattern}${colors.reset}`);
          if (issue.match) {
            console.log(`    ${colors.dim}Match: "${issue.match}"${colors.reset}`);
          }
          if (issue.context && VERBOSE) {
            console.log(`    ${colors.dim}Context: ${issue.context}${colors.reset}`);
          }
        }
        console.log();
      }

      console.log(`${colors.bold}Summary:${colors.reset}`);
      console.log(`  Files checked: ${files.length}`);
      console.log(`  Files with issues: ${allIssues.length}`);
      if (errorCount > 0) {
        console.log(`  ${colors.red}${errorCount} error(s)${colors.reset}`);
      }
      if (warningCount > 0) {
        console.log(`  ${colors.yellow}${warningCount} warning(s)${colors.reset}`);
      }
      if (infoCount > 0) {
        console.log(`  ${colors.blue}${infoCount} info(s)${colors.reset}`);
      }
      console.log();
    }
  }

  // Exit with error only if there are errors (not warnings)
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
