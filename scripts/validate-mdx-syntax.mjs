#!/usr/bin/env node

/**
 * MDX Syntax Validation Script
 *
 * Checks for common MDX/Mermaid syntax errors that cause build failures:
 * - Mermaid code blocks instead of <Mermaid> component
 * - Unescaped < characters followed by numbers (parsed as JSX)
 * - <br/> tags in Mermaid diagrams (not supported)
 * - Subgraph syntax without IDs
 *
 * Usage: node scripts/validate-mdx-syntax.mjs [--ci]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = 'src/content/docs';
const CI_MODE = process.argv.includes('--ci');

const colors = CI_MODE ? {
  red: '', green: '', yellow: '', blue: '', dim: '', bold: '', reset: ''
} : {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// Patterns to check with descriptions
const PATTERNS = [
  {
    id: 'mermaid-codeblock',
    pattern: /^```mermaid/m,
    description: 'Mermaid code block instead of <Mermaid> component',
    severity: 'error',
    fix: 'Use <Mermaid client:load chart={`...`} /> component instead',
  },
  {
    id: 'unescaped-lt-number',
    pattern: /\| <[0-9]/,
    description: 'Unescaped < followed by number in table (MDX parses as JSX)',
    severity: 'error',
    fix: 'Replace <N with "Less than N" or use &lt;',
  },
  {
    id: 'prose-lt-number',
    pattern: /[^|`$]\s<[0-9]/,
    description: 'Unescaped < followed by number in prose',
    severity: 'warning',
    fix: 'Replace <N with "less than N" or wrap in backticks',
  },
  {
    id: 'br-in-mermaid',
    pattern: /<br\s*\/?>/,
    description: '<br/> tag (may cause issues in Mermaid diagrams)',
    severity: 'warning',
    fix: 'Remove <br/> and use spaces or dashes instead',
  },
  {
    id: 'subgraph-no-id',
    pattern: /subgraph\s+"[^"]+"\s*\n/,
    description: 'Subgraph without ID (use subgraph ID["Label"] format)',
    severity: 'warning',
    fix: 'Change to: subgraph MyId["My Label"]',
  },
];

function findMdxFiles(dir, results = []) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        findMdxFiles(filePath, results);
      } else if (file.endsWith('.mdx')) {
        results.push(filePath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  return results;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const issues = [];

  for (const check of PATTERNS) {
    const matches = content.match(new RegExp(check.pattern, 'gm'));
    if (matches) {
      // Find line numbers
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (check.pattern.test(lines[i])) {
          issues.push({
            ...check,
            line: i + 1,
            lineContent: lines[i].substring(0, 80) + (lines[i].length > 80 ? '...' : ''),
          });
        }
      }
    }
  }

  return issues;
}

function main() {
  const files = findMdxFiles(CONTENT_DIR);
  const allIssues = [];
  let errorCount = 0;
  let warningCount = 0;

  if (!CI_MODE) {
    console.log(`${colors.blue}Checking ${files.length} MDX files for syntax issues...${colors.reset}\n`);
  }

  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      allIssues.push({ file, issues });
      for (const issue of issues) {
        if (issue.severity === 'error') errorCount++;
        else warningCount++;
      }
    }
  }

  if (CI_MODE) {
    console.log(JSON.stringify({
      files: files.length,
      errors: errorCount,
      warnings: warningCount,
      issues: allIssues,
    }, null, 2));
  } else {
    if (allIssues.length === 0) {
      console.log(`${colors.green}✓ No syntax issues found${colors.reset}\n`);
    } else {
      for (const { file, issues } of allIssues) {
        const relPath = file.replace(process.cwd() + '/', '');
        console.log(`${colors.bold}${relPath}${colors.reset}`);

        for (const issue of issues) {
          const icon = issue.severity === 'error' ? `${colors.red}✗` : `${colors.yellow}⚠`;
          console.log(`  ${icon} Line ${issue.line}: ${issue.description}${colors.reset}`);
          console.log(`    ${colors.dim}${issue.lineContent}${colors.reset}`);
          console.log(`    ${colors.blue}Fix: ${issue.fix}${colors.reset}`);
        }
        console.log();
      }

      console.log(`${colors.bold}Summary:${colors.reset}`);
      if (errorCount > 0) {
        console.log(`  ${colors.red}${errorCount} error(s)${colors.reset}`);
      }
      if (warningCount > 0) {
        console.log(`  ${colors.yellow}${warningCount} warning(s)${colors.reset}`);
      }
      console.log();
    }
  }

  // Exit with error code if there are errors
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
