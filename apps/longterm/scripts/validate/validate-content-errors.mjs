#!/usr/bin/env node

/**
 * LLM-Based Content Error Detection
 *
 * Uses Claude to review page content and identify:
 * - Unclear or confusing writing
 * - Factual issues or unsupported claims
 * - Missing context or unexplained jargon
 * - Structural problems (orphaned references, broken flow)
 * - Placeholder or template text that wasn't filled in
 * - Citation issues (claims without sources)
 * - Inconsistencies within the page
 *
 * Usage:
 *   node scripts/validate/validate-content-errors.mjs --page scheming    # Review specific page
 *   node scripts/validate/validate-content-errors.mjs --limit 10         # Review top 10 by importance
 *   node scripts/validate/validate-content-errors.mjs --path /risks/     # Filter by path
 *   node scripts/validate/validate-content-errors.mjs --dry-run          # Show what would be reviewed
 *   node scripts/validate/validate-content-errors.mjs --output FILE      # Write results to file
 *
 * Cost: ~$0.02-0.05 per page with Haiku, ~$0.15-0.30 with Sonnet
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import { createClient } from '../lib/anthropic.mjs';
import { findMdxFiles } from '../lib/file-utils.mjs';
import { parseFrontmatter, getContentBody, shouldSkipValidationFull } from '../lib/mdx-utils.mjs';
import { getColors, formatPath } from '../lib/output.mjs';
import { CONTENT_DIR } from '../lib/content-types.mjs';

const args = process.argv.slice(2);
const options = {
  page: args.includes('--page') ? args[args.indexOf('--page') + 1] : null,
  path: args.includes('--path') ? args[args.indexOf('--path') + 1] : null,
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 10,
  dryRun: args.includes('--dry-run'),
  output: args.includes('--output') ? args[args.indexOf('--output') + 1] : null,
  model: args.includes('--model') ? args[args.indexOf('--model') + 1] : 'haiku',
  parallel: args.includes('--parallel') ? parseInt(args[args.indexOf('--parallel') + 1]) : 2,
  minImportance: args.includes('--min-importance') ? parseInt(args[args.indexOf('--min-importance') + 1]) : 0,
  help: args.includes('--help') || args.includes('-h'),
};

const colors = getColors(false);

if (options.help) {
  console.log(`
LLM-Based Content Error Detection

Reviews wiki pages using Claude to find content issues that automated validators miss.

Usage:
  node scripts/validate/validate-content-errors.mjs [options]

Options:
  --page ID          Review a specific page by ID or partial match
  --path PATTERN     Only review pages matching path pattern
  --limit N          Number of pages to review (default: 10)
  --min-importance N Only review pages with importance >= N
  --model MODEL      Use 'haiku' (default, cheap) or 'sonnet' (better)
  --parallel N       Number of concurrent reviews (default: 2)
  --dry-run          Show what would be reviewed without calling API
  --output FILE      Write results to JSON file
  --help             Show this help

Examples:
  node scripts/validate/validate-content-errors.mjs --page scheming
  node scripts/validate/validate-content-errors.mjs --limit 20 --model sonnet
  node scripts/validate/validate-content-errors.mjs --path /risks/ --min-importance 70

Cost Estimates:
  Haiku:  ~$0.02-0.05 per page
  Sonnet: ~$0.15-0.30 per page
`);
  process.exit(0);
}

const SYSTEM_PROMPT = `You are a meticulous content reviewer for a technical wiki about AI safety and existential risk.

Your job is to identify ERRORS and ISSUES in the content - things that are wrong, unclear, missing, or broken.

Focus on finding:

1. **Clarity Issues** (severity: warning)
   - Sentences that are confusing or hard to parse
   - Jargon used without explanation
   - Ambiguous pronouns or references
   - Overly complex sentence structures

2. **Factual/Accuracy Issues** (severity: error)
   - Claims that seem wrong or outdated
   - Numbers or statistics without sources
   - Contradictions within the page
   - Statements presented as fact that are actually contested

3. **Completeness Issues** (severity: warning)
   - Sections that trail off or seem unfinished
   - References to things not explained
   - Missing obvious counterarguments or considerations
   - "See X" references where X doesn't exist on the page

4. **Placeholder/Template Issues** (severity: error)
   - Text that looks like unfilled templates
   - Generic statements that don't add value
   - Repeated boilerplate text
   - Suspiciously vague statements like "various factors" or "many experts believe"

5. **Citation Issues** (severity: warning)
   - Major claims without any source
   - "Studies show" without citing studies
   - Quantified claims without references
   - Dead-end references (mentioned but not linked)

6. **Structural Issues** (severity: info)
   - Awkward section ordering
   - Content that seems to belong elsewhere
   - Redundant sections
   - Missing expected sections for this type of content

DO NOT flag:
- Style preferences (unless clarity is affected)
- Minor grammar issues
- Missing optional content
- Things that are inherently uncertain (this is a wiki about future risks)

Return a JSON array of issues. Each issue should have:
- type: 'clarity' | 'factual' | 'completeness' | 'placeholder' | 'citation' | 'structural'
- severity: 'error' | 'warning' | 'info'
- location: Where in the content (section name or quote a few words)
- description: What's wrong
- suggestion: How to fix it (brief)

If the page has NO significant issues, return an empty array [].

Be selective - only flag things that genuinely need fixing. Aim for 0-8 issues per page.`;

const USER_PROMPT_TEMPLATE = `Review this wiki page for errors and issues:

**Title**: {{title}}
**Path**: {{path}}
**Page Type**: {{pageType}}

---
CONTENT:
{{content}}
---

Return a JSON array of issues found. Be specific about locations and provide actionable suggestions.`;

// Load pages data
function loadPagesData() {
  const pagesFile = join(CONTENT_DIR, '../../data/pages.json');
  if (existsSync(pagesFile)) {
    return JSON.parse(readFileSync(pagesFile, 'utf-8'));
  }
  return [];
}

// Get page metadata from pages.json
function getPageMetadata(filePath, pagesData) {
  const relativePath = relative(CONTENT_DIR, filePath);
  const urlPath = '/' + relativePath.replace(/\.mdx?$/, '').replace(/\/index$/, '') + '/';

  return pagesData.find(p => p.path === urlPath) || {
    path: urlPath,
    importance: 50,
    quality: 50,
  };
}

// Select pages to review
function selectPages(pagesData) {
  let files = findMdxFiles(CONTENT_DIR);

  // Filter by path pattern
  if (options.path) {
    files = files.filter(f => f.includes(options.path));
  }

  // Filter by specific page
  if (options.page) {
    const query = options.page.toLowerCase();
    files = files.filter(f => {
      const relativePath = relative(CONTENT_DIR, f).toLowerCase();
      return relativePath.includes(query);
    });
  }

  // Build page list with metadata
  let pages = files.map(file => {
    const content = readFileSync(file, 'utf-8');
    const frontmatter = parseFrontmatter(content);
    const metadata = getPageMetadata(file, pagesData);

    return {
      file,
      content,
      frontmatter,
      title: frontmatter.title || metadata.title || file,
      path: metadata.path,
      importance: frontmatter.importance || metadata.importance || 50,
      quality: frontmatter.quality || metadata.quality || 50,
      pageType: frontmatter.pageType || 'content',
    };
  });

  // Filter out pages that should skip validation
  pages = pages.filter(p => !shouldSkipValidationFull(p.frontmatter, p.file));

  // Filter by minimum importance
  if (options.minImportance > 0) {
    pages = pages.filter(p => p.importance >= options.minImportance);
  }

  // Sort by importance (highest first)
  pages.sort((a, b) => b.importance - a.importance);

  // Apply limit
  if (!options.page) {
    pages = pages.slice(0, options.limit);
  }

  return pages;
}

// Review a single page
async function reviewPage(client, page, modelId) {
  const body = getContentBody(page.content);

  // Truncate if very long (keep first 8000 words)
  const words = body.split(/\s+/);
  const truncated = words.length > 8000
    ? words.slice(0, 8000).join(' ') + '\n\n[... truncated at 8000 words]'
    : body;

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{{title}}', page.title)
    .replace('{{path}}', page.path)
    .replace('{{pageType}}', page.pageType)
    .replace('{{content}}', truncated);

  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].text;

    // Parse JSON response
    try {
      // Handle potential markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || [null, text];
      const jsonText = jsonMatch[1] || text;

      // Find JSON array in response
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch {
      console.error(`  ${colors.yellow}Failed to parse response${colors.reset}`);
      return [{ type: 'parse_error', severity: 'error', description: 'Failed to parse LLM response', raw: text.slice(0, 200) }];
    }
  } catch (error) {
    return [{ type: 'api_error', severity: 'error', description: error.message }];
  }
}

// Format issue for display
function formatIssue(issue) {
  let icon;
  if (issue.severity === 'error') icon = `${colors.red}✗`;
  else if (issue.severity === 'warning') icon = `${colors.yellow}⚠`;
  else icon = `${colors.blue}ℹ`;

  let output = `  ${icon} [${issue.type}] ${issue.description}${colors.reset}`;
  if (issue.location) {
    output += `\n    ${colors.dim}Location: ${issue.location}${colors.reset}`;
  }
  if (issue.suggestion) {
    output += `\n    ${colors.dim}Fix: ${issue.suggestion}${colors.reset}`;
  }
  return output;
}

// Main
async function main() {
  if (!process.env.ANTHROPIC_API_KEY && !options.dryRun) {
    console.error(`${colors.red}Error: ANTHROPIC_API_KEY required${colors.reset}`);
    console.log('Set in .env file or environment variable');
    process.exit(1);
  }

  const pagesData = loadPagesData();
  const pages = selectPages(pagesData);

  if (pages.length === 0) {
    console.log(`${colors.yellow}No pages match the criteria${colors.reset}`);
    process.exit(0);
  }

  // Model selection
  const modelId = options.model === 'sonnet'
    ? 'claude-sonnet-4-5-20250929'
    : 'claude-3-5-haiku-20241022';

  // Cost estimate
  const avgInputTokens = 3000;
  const avgOutputTokens = 500;
  const inputRate = options.model === 'sonnet' ? 3 : 0.25;
  const outputRate = options.model === 'sonnet' ? 15 : 1.25;
  const estimatedCost = pages.length * (
    (avgInputTokens / 1_000_000) * inputRate +
    (avgOutputTokens / 1_000_000) * outputRate
  );

  console.log(`${colors.blue}Content Error Detection${colors.reset}`);
  console.log(`Model: ${options.model} (${modelId})`);
  console.log(`Pages to review: ${pages.length}`);
  console.log(`Estimated cost: $${estimatedCost.toFixed(2)}\n`);

  if (options.dryRun) {
    console.log('Pages that would be reviewed:');
    for (const page of pages) {
      console.log(`  - ${page.title} (importance: ${page.importance})`);
    }
    process.exit(0);
  }

  const client = createClient();
  const results = [];

  // Process pages with concurrency
  for (let i = 0; i < pages.length; i += options.parallel) {
    const batch = pages.slice(i, i + options.parallel);

    const batchResults = await Promise.all(
      batch.map(async (page) => {
        process.stdout.write(`Reviewing: ${page.title}... `);
        const issues = await reviewPage(client, page, modelId);
        const issueCount = issues.filter(i => i.severity !== 'info').length;

        if (issueCount === 0) {
          console.log(`${colors.green}✓ No issues${colors.reset}`);
        } else {
          console.log(`${colors.yellow}${issueCount} issue(s)${colors.reset}`);
        }

        return {
          file: formatPath(page.file),
          title: page.title,
          path: page.path,
          importance: page.importance,
          quality: page.quality,
          issues,
        };
      })
    );

    results.push(...batchResults);

    // Rate limiting
    if (i + options.parallel < pages.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Display results
  console.log(`\n${colors.bold}Results${colors.reset}\n`);

  const pagesWithIssues = results.filter(r => r.issues.length > 0);
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const errorCount = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'error').length, 0);
  const warningCount = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'warning').length, 0);

  // Sort by issue count
  pagesWithIssues.sort((a, b) => {
    const aErrors = a.issues.filter(i => i.severity === 'error').length;
    const bErrors = b.issues.filter(i => i.severity === 'error').length;
    if (aErrors !== bErrors) return bErrors - aErrors;
    return b.issues.length - a.issues.length;
  });

  for (const result of pagesWithIssues) {
    console.log(`${colors.bold}${result.title}${colors.reset} ${colors.dim}(${result.path})${colors.reset}`);
    for (const issue of result.issues) {
      console.log(formatIssue(issue));
    }
    console.log();
  }

  // Summary
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log(`  Pages reviewed: ${results.length}`);
  console.log(`  Pages with issues: ${pagesWithIssues.length}`);
  console.log(`  Total issues: ${totalIssues}`);
  if (errorCount > 0) console.log(`  ${colors.red}Errors: ${errorCount}${colors.reset}`);
  if (warningCount > 0) console.log(`  ${colors.yellow}Warnings: ${warningCount}${colors.reset}`);

  // Write output file
  if (options.output) {
    const outputPath = options.output.startsWith('/')
      ? options.output
      : join(process.cwd(), options.output);

    mkdirSync(join(outputPath, '..'), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nResults written to: ${options.output}`);
  } else {
    // Default output location
    const defaultOutput = '.claude/temp/content-errors.json';
    mkdirSync(join(process.cwd(), '.claude/temp'), { recursive: true });
    writeFileSync(defaultOutput, JSON.stringify(results, null, 2));
    console.log(`\nResults written to: ${defaultOutput}`);
  }
}

main().catch(console.error);
