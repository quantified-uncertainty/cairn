#!/usr/bin/env node
/**
 * Comprehensive site audit script
 * Checks for various content issues across the knowledge base
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDir = 'src/content/docs/knowledge-base';
const allIssues = [];

// Helper to walk directories
function walkDir(dir, callback) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.mdx')) {
      callback(filePath);
    }
  }
}

// Collect all valid paths for link checking
const allPaths = new Set();
walkDir('src/content/docs', (file) => {
  const urlPath = file
    .replace('src/content/docs', '')
    .replace(/\/index\.mdx$/, '/')
    .replace(/\.mdx$/, '/');
  allPaths.add(urlPath);
});

// Issue categories
const issuesByCategory = {
  'broken-links': [],
  'placeholder-text': [],
  'short-content': [],
  'missing-metadata': [],
  'stale-content': [],
  'empty-sections': [],
  'formatting-issues': [],
  'todo-comments': [],
};

// Patterns for placeholder text
const placeholderPatterns = [
  { pattern: /\[TODO[^\]]*\]/gi, name: '[TODO]' },
  { pattern: /\[TBD\]/gi, name: '[TBD]' },
  { pattern: /\[PLACEHOLDER\]/gi, name: '[PLACEHOLDER]' },
  { pattern: /\[INSERT[^\]]*\]/gi, name: '[INSERT...]' },
  { pattern: /\[ADD[^\]]*\]/gi, name: '[ADD...]' },
  { pattern: /\[FILL[^\]]*\]/gi, name: '[FILL...]' },
  { pattern: /\[EXPLAIN[^\]]*\]/gi, name: '[EXPLAIN...]' },
  { pattern: /\[DESCRIBE[^\]]*\]/gi, name: '[DESCRIBE...]' },
  { pattern: /\[Link\]/g, name: '[Link]' },
  { pattern: /\[Source\]/g, name: '[Source]' },
  { pattern: /\[Citation needed\]/gi, name: '[Citation needed]' },
  { pattern: /Lorem ipsum/gi, name: 'Lorem ipsum' },
  { pattern: /FIXME/g, name: 'FIXME' },
  { pattern: /XXX(?![a-zA-Z])/g, name: 'XXX' },
];

// Analyze each file
walkDir(docsDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, content: body } = matter(content);
  const relativePath = filePath.replace('src/content/docs/', '');
  const isIndex = filePath.includes('index.mdx');

  // Skip stub pages
  if (frontmatter.pageType === 'stub' || frontmatter.pageType === 'documentation') {
    return;
  }

  // 1. Check for placeholder text
  for (const { pattern, name } of placeholderPatterns) {
    const matches = body.match(pattern);
    if (matches) {
      issuesByCategory['placeholder-text'].push({
        file: relativePath,
        detail: `Found ${matches.length}x "${name}"`,
      });
    }
  }

  // 2. Check for short content (excluding index pages)
  if (!isIndex && body.length < 800) {
    issuesByCategory['short-content'].push({
      file: relativePath,
      detail: `Only ${body.length} chars`,
    });
  }

  // 3. Check for missing metadata
  if (!isIndex) {
    if (!frontmatter.quality) {
      issuesByCategory['missing-metadata'].push({
        file: relativePath,
        detail: 'Missing quality rating',
      });
    }
    if (!frontmatter.importance) {
      issuesByCategory['missing-metadata'].push({
        file: relativePath,
        detail: 'Missing importance rating',
      });
    }
    if (!frontmatter.description) {
      issuesByCategory['missing-metadata'].push({
        file: relativePath,
        detail: 'Missing description',
      });
    }
  }

  // 4. Check for stale content
  if (frontmatter.lastEdited) {
    const date = new Date(frontmatter.lastEdited);
    const monthsOld = (new Date() - date) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld > 6) {
      issuesByCategory['stale-content'].push({
        file: relativePath,
        detail: `Last edited ${frontmatter.lastEdited} (${Math.round(monthsOld)} months ago)`,
      });
    }
  }

  // 5. Check for empty sections
  const lines = body.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith('## ') && (lines[i + 1].startsWith('## ') || lines[i + 1].trim() === '')) {
      if (lines[i + 2] && lines[i + 2].startsWith('## ')) {
        issuesByCategory['empty-sections'].push({
          file: relativePath,
          detail: `Empty section: "${lines[i].replace('## ', '')}"`,
        });
      }
    }
  }

  // 6. Check for TODO comments in code
  const todoMatches = body.match(/\/\/\s*TODO|\/\*\s*TODO|#\s*TODO/gi);
  if (todoMatches) {
    issuesByCategory['todo-comments'].push({
      file: relativePath,
      detail: `${todoMatches.length} TODO comments in code`,
    });
  }

  // 7. Check for broken internal links
  const linkRegex = /\[([^\]]+)\]\((\/.+?)\)/g;
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    const linkPath = match[2].split('#')[0].split('?')[0];
    if (!allPaths.has(linkPath) && !linkPath.startsWith('/http')) {
      issuesByCategory['broken-links'].push({
        file: relativePath,
        detail: `Link to "${linkPath}" may be broken`,
      });
    }
  }

  // 8. Check for formatting issues
  // Unbalanced markdown (very rough check)
  const backtickCount = (body.match(/```/g) || []).length;
  if (backtickCount % 2 !== 0) {
    issuesByCategory['formatting-issues'].push({
      file: relativePath,
      detail: 'Unbalanced code blocks (odd number of ```)',
    });
  }
});

// Print results
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                    SITE AUDIT RESULTS                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let totalIssues = 0;

for (const [category, issues] of Object.entries(issuesByCategory)) {
  if (issues.length === 0) continue;

  totalIssues += issues.length;
  console.log(`\n### ${category.toUpperCase().replace(/-/g, ' ')} (${issues.length})`);
  console.log('─'.repeat(60));

  // Dedupe by file for cleaner output
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue.detail);
  }

  const entries = Object.entries(byFile).slice(0, 15);
  for (const [file, details] of entries) {
    console.log(`  ${file}`);
    for (const detail of details.slice(0, 3)) {
      console.log(`    → ${detail}`);
    }
    if (details.length > 3) {
      console.log(`    → ... and ${details.length - 3} more`);
    }
  }

  if (Object.keys(byFile).length > 15) {
    console.log(`  ... and ${Object.keys(byFile).length - 15} more files`);
  }
}

console.log('\n' + '═'.repeat(64));
console.log(`TOTAL ISSUES FOUND: ${totalIssues}`);
console.log('═'.repeat(64));
