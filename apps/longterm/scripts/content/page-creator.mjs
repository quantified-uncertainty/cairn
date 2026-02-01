#!/usr/bin/env node

/**
 * Page Creator - Cost-Optimized Pipeline
 *
 * Uses Perplexity for research (cheap, good at web search)
 * Uses Claude for synthesis and validation iteration
 *
 * Cost breakdown (standard tier):
 * - Research: ~$0.10 (12 Perplexity queries)
 * - SCRY search: Free
 * - Extraction: ~$0.50 (Gemini Flash)
 * - Synthesis: ~$2.00 (Claude Sonnet)
 * - Validation loop: ~$1.50 (Claude Code SDK, iterates until passing)
 * Total: ~$4-5 vs $10+ with all-Claude approach
 *
 * Usage:
 *   node scripts/content/page-creator.mjs "SecureBio" --tier standard
 *   node scripts/content/page-creator.mjs "Community Notes" --tier premium
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { batchResearch, generateResearchQueries, callOpenRouter, MODELS } from '../lib/openrouter.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const TEMP_DIR = path.join(ROOT, '.claude/temp/page-creator');

// ============ Configuration ============

const TIERS = {
  budget: {
    name: 'Budget',
    estimatedCost: '$2-3',
    phases: ['research-perplexity', 'synthesize-fast', 'verify-sources', 'validate-loop', 'validate-full', 'grade'],
    description: 'Perplexity research + fast synthesis'
  },
  standard: {
    name: 'Standard',
    estimatedCost: '$4-6',
    phases: ['research-perplexity', 'research-scry', 'synthesize', 'verify-sources', 'validate-loop', 'review', 'validate-full', 'grade'],
    description: 'Full research + Sonnet synthesis + validation loop'
  },
  premium: {
    name: 'Premium',
    estimatedCost: '$8-12',
    phases: ['research-perplexity-deep', 'research-scry', 'synthesize-quality', 'verify-sources', 'review', 'validate-loop', 'validate-full', 'grade'],
    description: 'Deep research + quality synthesis + review'
  }
};

// Build-breaking validation rules (must all pass)
const CRITICAL_RULES = [
  'dollar-signs',
  'comparison-operators',
  'frontmatter-schema',
  'entitylink-ids',
  'internal-links',
  'fake-urls',
  'component-props',
  'citation-urls'
];

// Quality rules (should pass, but won't block)
const QUALITY_RULES = [
  'tilde-dollar',
  'markdown-lists',
  'consecutive-bold-labels',
  'placeholders',
  'vague-citations',
  'temporal-artifacts'
];

// ============ Utility Functions ============

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function log(phase, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] [${phase}] ${message}`);
}

function getTopicDir(topic) {
  const sanitized = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return path.join(TEMP_DIR, sanitized);
}

function saveResult(topic, filename, data) {
  const dir = getTopicDir(topic);
  ensureDir(dir);
  const filePath = path.join(dir, filename);
  if (typeof data === 'string') {
    fs.writeFileSync(filePath, data);
  } else {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  return filePath;
}

function loadResult(topic, filename) {
  const filePath = path.join(getTopicDir(topic), filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  if (filename.endsWith('.json')) {
    return JSON.parse(content);
  }
  return content;
}

// ============ Phase: Perplexity Research ============

async function runPerplexityResearch(topic, depth = 'standard') {
  log('research', `Starting Perplexity research (${depth})...`);

  // Generate queries based on depth
  let queries = generateResearchQueries(topic);

  if (depth === 'lite') {
    queries = queries.slice(0, 6); // Just core queries
  } else if (depth === 'deep') {
    // Add more specific queries
    queries.push(
      { query: `${topic} technical details methodology approach`, category: 'technical' },
      { query: `${topic} comparison alternatives competitors`, category: 'comparison' },
      { query: `${topic} future plans roadmap strategy`, category: 'future' },
      { query: `${topic} academic papers research publications citations`, category: 'academic' },
    );
  }

  log('research', `Running ${queries.length} Perplexity queries...`);

  const results = await batchResearch(queries, { concurrency: 3 });

  let totalCost = 0;
  const sources = [];

  for (const result of results) {
    totalCost += result.cost || 0;
    sources.push({
      category: result.category,
      query: result.query,
      content: result.content,
      citations: result.citations || [],  // Perplexity source URLs for [1], [2], etc.
      tokens: result.usage?.total_tokens || 0,
      cost: result.cost || 0,
    });
    log('research', `  ${result.category}: ${result.usage?.total_tokens || 0} tokens, $${(result.cost || 0).toFixed(4)}`);
  }

  log('research', `Total research cost: $${totalCost.toFixed(4)}`);

  // Save results
  const outputPath = saveResult(topic, 'perplexity-research.json', {
    topic,
    depth,
    queryCount: queries.length,
    totalCost,
    timestamp: new Date().toISOString(),
    sources,
  });

  log('research', `Saved to ${outputPath}`);

  return { success: true, cost: totalCost, queryCount: queries.length };
}

// ============ Phase: SCRY Research ============

async function runScryResearch(topic) {
  log('scry', 'Searching SCRY (EA Forum, LessWrong)...');

  const SCRY_PUBLIC_KEY = 'exopriors_public_readonly_v1_2025';

  const searches = [
    { table: 'mv_eaforum_posts', query: topic },
    { table: 'mv_lesswrong_posts', query: topic },
    { table: 'mv_eaforum_posts', query: `${topic} criticism` },
  ];

  const results = [];

  for (const search of searches) {
    try {
      const sql = `SELECT title, uri, snippet, original_author, original_timestamp::date as date
        FROM scry.search('${search.query.replace(/'/g, "''")}', '${search.table}')
        WHERE title IS NOT NULL AND kind = 'post'
        LIMIT 10`;

      const response = await fetch('https://api.exopriors.com/v1/scry/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SCRY_PUBLIC_KEY}`,
          'Content-Type': 'text/plain',
        },
        body: sql,
      });

      const data = await response.json();

      if (data.rows) {
        const platform = search.table.includes('eaforum') ? 'EA Forum' : 'LessWrong';
        log('scry', `  ${platform} "${search.query}": ${data.rows.length} results`);
        results.push(...data.rows.map(row => ({
          ...row,
          platform,
          searchQuery: search.query,
        })));
      }
    } catch (error) {
      log('scry', `  Error searching ${search.table}: ${error.message}`);
    }
  }

  // Deduplicate by URI
  const seen = new Set();
  const unique = results.filter(r => {
    if (seen.has(r.uri)) return false;
    seen.add(r.uri);
    return true;
  });

  saveResult(topic, 'scry-research.json', {
    topic,
    resultCount: unique.length,
    timestamp: new Date().toISOString(),
    results: unique,
  });

  log('scry', `Found ${unique.length} unique community posts`);

  return { success: true, resultCount: unique.length };
}

// ============ Phase: Synthesis ============

function getSynthesisPrompt(topic, quality = 'standard') {
  const researchData = loadResult(topic, 'perplexity-research.json');
  const scryData = loadResult(topic, 'scry-research.json');

  // Count total available citation URLs
  let totalCitations = 0;

  // Format research with citation URLs included
  const researchContent = researchData?.sources?.map(s => {
    let section = `### ${s.category.toUpperCase()}\n${s.content}`;
    // If we have citation URLs, append them so the writer can use real links
    if (s.citations && s.citations.length > 0) {
      totalCitations += s.citations.length;
      section += `\n\n**Source URLs for [1], [2], etc. citations above:**\n${s.citations.map((url, i) => `[${i + 1}]: ${url}`).join('\n')}`;
    } else {
      section += `\n\n**WARNING: No source URLs available for this section. Do not invent URLs.**`;
    }
    return section;
  }).join('\n\n') || 'No Perplexity research available';

  const scryContent = scryData?.results?.slice(0, 10).map(r =>
    `- [${r.title}](${r.uri}) by ${r.original_author} (${r.platform})\n  ${r.snippet?.slice(0, 200) || ''}`
  ).join('\n') || 'No SCRY results available';

  // Add citation availability warning
  const citationWarning = totalCitations > 0
    ? `✅ ${totalCitations} source URLs available in research data - USE THESE for citations`
    : `⚠️ NO SOURCE URLs available in research data - use descriptive citations only, NO FAKE URLs`;

  return `# Write Wiki Article: ${topic}

You are writing a wiki article for LongtermWiki, an AI safety knowledge base.

## Research Data

### WEB RESEARCH (from Perplexity)
${researchContent}

### COMMUNITY DISCUSSIONS (from EA Forum/LessWrong)
${scryContent}

## Citation Status
${citationWarning}

## Requirements

1. **CRITICAL: Use ONLY real URLs from the research data**
   - Format: claim[^1] with [^1]: [Source Title](actual-url) at bottom
   - Look for "Source URLs for [1], [2]" sections in the research data
   - NEVER invent URLs like "example.com", "/posts/example", or "undefined"
   - NEVER make up plausible-looking URLs - if you don't have a real URL, use text-only citation
   - If no URL available: [^1]: Source name - description (no link)
   - **NEVER use vague citations** like "Interview", "Earnings call", "Conference talk", "Reports"
   - Always specify: exact name, date, and context (e.g., "Tesla Q4 2021 earnings call", "MIT Aeronautics Centennial Symposium (Oct 2014)")
2. **Escape dollar signs** - Write \\$100M not $100M
3. **Use EntityLink for internal refs** - <EntityLink id="open-philanthropy">Open Philanthropy</EntityLink>
4. **Include criticism section** if research supports it
5. **60%+ prose** - Not just tables and bullet points
6. **Limited info fallback** - If research is sparse, write a shorter article rather than padding with filler
7. **Present information as current** - NEVER write "as of the research data" or "through late 2024"
   - BAD: "As of the research data (through late 2024), no ratifications..."
   - GOOD: "As of early 2026, the convention remains in..." or just "No ratifications have been reported"
   - Don't reference when sources were gathered - present facts as current knowledge
8. **Maintain logical consistency** - Ensure claims within each section align with the section's thesis
   - If a section is titled "Lack of X", don't describe the subject as having X
   - If discussing limitations, don't use quotes that suggest the opposite

## Known Entity IDs
open-philanthropy, anthropic, openai, deepmind, miri, lesswrong, redwood-research,
eliezer-yudkowsky, paul-christiano, dario-amodei, scheming, misuse-risks

## Output Format

Write the complete MDX article to: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/draft.mdx

Include proper frontmatter:
---
title: "${topic}"
description: "..."
importance: 50
lastEdited: "${new Date().toISOString().split('T')[0]}"
sidebar:
  order: 50
ratings:
  novelty: 5
  rigor: 6
  actionability: 5
  completeness: 6
---
import {EntityLink, Backlinks, KeyPeople, KeyQuestions, Section} from '@components/wiki';

## Article Sections
- Quick Assessment (table)
- Overview (2-3 paragraphs)
- History
- [Topic-specific sections]
- Criticisms/Concerns (if applicable)
- Key Uncertainties
- Sources (footnotes)
- <Backlinks />`;
}

async function runSynthesis(topic, quality = 'standard') {
  log('synthesis', `Generating article (${quality})...`);

  const prompt = getSynthesisPrompt(topic, quality);

  // Use Claude Code SDK for synthesis
  return new Promise((resolve, reject) => {
    const model = quality === 'quality' ? 'opus' : 'sonnet';
    const budget = quality === 'quality' ? 3.0 : 2.0;

    const claude = spawn('npx', [
      '@anthropic-ai/claude-code',
      '-p',
      '--print',
      '--dangerously-skip-permissions',
      '--model', model,
      '--max-budget-usd', String(budget),
      '--allowedTools', 'Read,Write,Glob'
    ], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    claude.stdin.write(prompt);
    claude.stdin.end();

    let stdout = '';
    claude.stdout.on('data', data => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    claude.on('close', code => {
      if (code === 0) {
        resolve({ success: true, model, budget });
      } else {
        reject(new Error(`Synthesis failed with code ${code}`));
      }
    });
  });
}

// ============ Phase: Source Verification ============

async function runSourceVerification(topic) {
  log('verify-sources', 'Checking content against research sources...');

  const topicDir = getTopicDir(topic);
  const researchPath = path.join(topicDir, 'perplexity-research.json');
  const draftPath = path.join(topicDir, 'draft.mdx');

  if (!fs.existsSync(researchPath) || !fs.existsSync(draftPath)) {
    log('verify-sources', 'Missing research or draft, skipping verification');
    return { success: true, warnings: [] };
  }

  const research = JSON.parse(fs.readFileSync(researchPath, 'utf-8'));
  const draft = fs.readFileSync(draftPath, 'utf-8');

  // Combine all research text for searching
  const researchText = research.responses
    ?.map(r => r.content || '')
    .join('\n')
    .toLowerCase() || '';

  const warnings = [];

  // Pattern to find author attribution statements
  // e.g., "authored by X, Y, and Z" or "by X and Y" or "written by X"
  const authorPatterns = [
    /authored by\s+([^.\n]+)/gi,
    /written by\s+([^.\n]+)/gi,
    /paper was authored by\s+([^.\n]+)/gi,
    /including\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*(?:,?\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)/g,
  ];

  // Extract names from draft
  const mentionedNames = new Set();
  for (const pattern of authorPatterns) {
    let match;
    while ((match = pattern.exec(draft)) !== null) {
      // Extract individual names from the match
      const nameStr = match[1];
      // Split by commas and "and"
      const names = nameStr
        .replace(/\s+and\s+/gi, ', ')
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0 && /^[A-Z]/.test(n));

      for (const name of names) {
        // Only add if it looks like a proper name (first and last name)
        if (name.split(/\s+/).length >= 2) {
          mentionedNames.add(name);
        }
      }
    }
  }

  // Check if each name appears in the research
  for (const name of mentionedNames) {
    const nameLower = name.toLowerCase();
    // Also try last name only for matching
    const lastName = name.split(/\s+/).pop()?.toLowerCase();

    if (!researchText.includes(nameLower) && lastName && !researchText.includes(lastName)) {
      warnings.push({
        type: 'unverified-name',
        name,
        message: `Name "${name}" not found in research sources - possible hallucination`,
      });
    }
  }

  // Check for footnotes with undefined URLs (should have been caught by synthesis)
  const undefinedUrlMatches = draft.match(/\]\(undefined\)/g);
  if (undefinedUrlMatches) {
    warnings.push({
      type: 'undefined-urls',
      count: undefinedUrlMatches.length,
      message: `${undefinedUrlMatches.length} footnote(s) have undefined URLs`,
    });
  }

  if (warnings.length > 0) {
    log('verify-sources', `⚠️  Found ${warnings.length} potential issue(s):`);
    for (const w of warnings) {
      log('verify-sources', `  - ${w.message}`);
    }
    // Save warnings to file for review
    saveResult(topic, 'source-warnings.json', warnings);
  } else {
    log('verify-sources', '✓ All extracted claims found in research');
  }

  return { success: true, warnings };
}

// ============ Phase: Validation Loop ============

async function runValidationLoop(topic, maxIterations = 3) {
  log('validate', 'Starting validation loop...');

  const draftPath = path.join(getTopicDir(topic), 'draft.mdx');
  if (!fs.existsSync(draftPath)) {
    log('validate', 'No draft found, skipping validation');
    return { success: false, error: 'No draft found' };
  }

  const validationPrompt = `# Validate and Fix Wiki Article

Read the draft article at: ${draftPath}

## Validation Tasks - Fix ALL Issues

### Critical Issues (MUST fix - these break the build):

1. **Run precommit validation**:
   \`npm run precommit\`

2. **Fix escaping issues**:
   - Escape unescaped $ signs as \\$
   - Escape < before numbers as \\< or use &lt;
   - Use ≈ instead of ~ in table cells (~ renders as strikethrough)
   - Use ≈\\$ instead of ~\\$ (tilde + escaped dollar causes errors)

3. **Fix EntityLinks** (verify IDs resolve):
   - Read src/data/pathRegistry.json to see which entity IDs exist
   - For each EntityLink in the draft, verify the id exists in pathRegistry
   - If an EntityLink id doesn't resolve:
     - Check for similar IDs (e.g., "center-for-ai-safety" should be "cais")
     - Or remove the EntityLink and use plain text instead

4. **Fix broken citations**:
   - Ensure all [^N] footnote citations have actual URLs, not "undefined"
   - NEVER use fake URLs like "example.com", "/posts/example", etc.
   - If no real URL available, use text-only citation: [^1]: Source name - description

### Quality Issues (MUST fix - these cause rendering problems):

5. **Fix markdown list formatting**:
   - Numbered lists starting at N>1 need blank line before
   - Check with: \`npm run crux -- validate unified --rules=markdown-lists\`

6. **Fix consecutive bold labels**:
   - Bold lines like "**Label:** text" need blank line between them
   - Check with: \`npm run crux -- validate unified --rules=consecutive-bold-labels\`

7. **Remove placeholders**:
   - No TODO markers or placeholder text like "[insert X here]"

### Final Steps:

8. **Check wiki conventions**:
   - All factual claims have footnote citations
   - Proper frontmatter fields present (title, description, importance, lastEdited, ratings)
   - Import statement: \`import {...} from '@components/wiki';\`

9. **Write the final fixed version** to:
   ${path.join(getTopicDir(topic), 'final.mdx')}

10. **Report** what was fixed.

Keep iterating until ALL checks pass. Run precommit again after each fix.`;

  return new Promise((resolve, reject) => {
    const claude = spawn('npx', [
      '@anthropic-ai/claude-code',
      '-p',
      '--print',
      '--dangerously-skip-permissions',
      '--model', 'sonnet',
      '--max-budget-usd', '2.0',
      '--allowedTools', 'Read,Write,Edit,Bash,Glob,Grep'
    ], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    claude.stdin.write(validationPrompt);
    claude.stdin.end();

    let stdout = '';
    claude.stdout.on('data', data => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    claude.on('close', code => {
      const finalPath = path.join(getTopicDir(topic), 'final.mdx');
      const hasOutput = fs.existsSync(finalPath);
      resolve({
        success: code === 0 && hasOutput,
        hasOutput,
        exitCode: code
      });
    });
  });
}

// ============ Phase: Full Validation (programmatic) ============

async function runFullValidation(topic) {
  log('validate-full', 'Running comprehensive validation...');

  const finalPath = path.join(getTopicDir(topic), 'final.mdx');
  if (!fs.existsSync(finalPath)) {
    log('validate-full', 'No final.mdx found, skipping');
    return { success: false, error: 'No final.mdx found' };
  }

  const results = {
    critical: { passed: 0, failed: 0, errors: [] },
    quality: { passed: 0, failed: 0, warnings: [] },
    compile: { success: false, error: null }
  };

  // 1. Run MDX compilation check on the single file
  log('validate-full', 'Checking MDX compilation...');
  try {
    const { execSync } = await import('child_process');
    // Use compile --quick which only checks changed files
    execSync('npm run crux -- validate compile --quick', {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 60000
    });
    results.compile.success = true;
    log('validate-full', '  ✓ MDX compiles');
  } catch (error) {
    results.compile.error = error.message;
    log('validate-full', '  ✗ MDX compilation failed');
  }

  // 2. Run unified rules on the file
  log('validate-full', 'Running validation rules...');

  // Helper to extract JSON from npm output (filters out npm log lines)
  const extractJson = (output) => {
    const lines = output.split('\n');
    const jsonStartIdx = lines.findIndex(line => line.trim().startsWith('{'));
    if (jsonStartIdx === -1) return null;
    // Join all lines from the JSON start to the end
    const jsonStr = lines.slice(jsonStartIdx).join('\n');
    return JSON.parse(jsonStr);
  };

  // Critical rules (build-breaking)
  const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  for (const rule of CRITICAL_RULES) {
    try {
      const { execSync } = await import('child_process');
      let output;
      let hasParseError = false;

      try {
        output = execSync(
          `npm run crux -- validate unified --rules=${rule} --ci 2>&1`,
          { cwd: ROOT, stdio: 'pipe', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
        ).toString();
      } catch (execError) {
        // Command may exit non-zero if there are errors in other files
        // Capture stdout/stderr and check if our file has issues
        output = execError.stdout?.toString() || execError.stderr?.toString() || '';
      }

      // Try to parse JSON output
      let json = null;
      try {
        json = extractJson(output);
      } catch (parseErr) {
        // JSON truncated - fall back to grep approach
        hasParseError = true;
      }

      if (json) {
        // JSON parsing succeeded - filter for our file
        const fileIssues = json.issues?.filter(i =>
          i.file?.includes(topicSlug) &&
          i.severity === 'error'
        ) || [];

        if (fileIssues.length > 0) {
          results.critical.failed++;
          results.critical.errors.push({ rule, issues: fileIssues });
          log('validate-full', `  ✗ ${rule}: ${fileIssues.length} error(s)`);
        } else {
          results.critical.passed++;
          log('validate-full', `  ✓ ${rule}`);
        }
      } else if (hasParseError) {
        // JSON truncated - use grep fallback for our file
        // Run again in non-CI mode and grep for our file
        try {
          const grepOutput = execSync(
            `npm run crux -- validate unified --rules=${rule} 2>&1 | grep -i "${topicSlug}" || true`,
            { cwd: ROOT, stdio: 'pipe', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
          ).toString();

          const errorCount = (grepOutput.match(/error/gi) || []).length;
          if (errorCount > 0) {
            results.critical.failed++;
            results.critical.errors.push({ rule, error: `${errorCount} error(s) found via grep` });
            log('validate-full', `  ✗ ${rule}: ${errorCount} error(s)`);
          } else {
            results.critical.passed++;
            log('validate-full', `  ✓ ${rule}`);
          }
        } catch {
          // Grep fallback failed - assume no issues for our file
          results.critical.passed++;
          log('validate-full', `  ✓ ${rule} (no issues for this file)`);
        }
      } else {
        // No JSON output - treat as success
        results.critical.passed++;
        log('validate-full', `  ✓ ${rule}`);
      }
    } catch (error) {
      // If parsing or other error, mark as failed
      results.critical.failed++;
      results.critical.errors.push({ rule, error: error.message });
      log('validate-full', `  ✗ ${rule}: check failed`);
    }
  }

  // Quality rules (non-blocking)
  for (const rule of QUALITY_RULES) {
    try {
      const { execSync } = await import('child_process');
      const output = execSync(
        `npm run crux -- validate unified --rules=${rule} --ci 2>&1`,
        { cwd: ROOT, stdio: 'pipe', timeout: 30000 }
      ).toString();

      const json = extractJson(output);
      if (!json) {
        results.quality.passed++;
        log('validate-full', `  ✓ ${rule}`);
        continue;
      }

      const fileIssues = json.issues?.filter(i =>
        i.file?.includes(topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      ) || [];

      if (fileIssues.length > 0) {
        results.quality.failed++;
        results.quality.warnings.push({ rule, issues: fileIssues });
        log('validate-full', `  ⚠ ${rule}: ${fileIssues.length} warning(s)`);
      } else {
        results.quality.passed++;
        log('validate-full', `  ✓ ${rule}`);
      }
    } catch (error) {
      // Quality rules don't block
      log('validate-full', `  ? ${rule}: check skipped`);
    }
  }

  // Summary
  const success = results.compile.success && results.critical.failed === 0;
  log('validate-full', `\nValidation summary: ${success ? 'PASSED' : 'FAILED'}`);
  log('validate-full', `  Critical: ${results.critical.passed}/${results.critical.passed + results.critical.failed} passed`);
  log('validate-full', `  Quality: ${results.quality.passed}/${results.quality.passed + results.quality.failed} passed`);

  // Save results
  saveResult(topic, 'validation-results.json', results);

  return { success, results };
}

// ============ Phase: Grading ============

const GRADING_SYSTEM_PROMPT = `You are an expert evaluator of AI safety content. Score this page on:

- importance (0-100): How significant for understanding AI risk
- quality dimensions (0-10 each): novelty, rigor, actionability, completeness
- llmSummary: 1-2 sentence summary with key conclusions

Be harsh but fair. Typical wiki content scores 3-5 on quality dimensions. 7+ is exceptional.

IMPORTANCE guidelines:
- 90-100: Essential for prioritization decisions
- 70-89: High value for practitioners
- 50-69: Useful context
- 30-49: Reference material
- 0-29: Peripheral or stubs

Respond with valid JSON only.`;

async function runGrading(topic) {
  log('grade', 'Running quality grading on temp file...');

  const finalPath = path.join(getTopicDir(topic), 'final.mdx');
  if (!fs.existsSync(finalPath)) {
    log('grade', 'No final.mdx found, skipping grading');
    return { success: false, error: 'No final.mdx found' };
  }

  // Read the file
  const content = fs.readFileSync(finalPath, 'utf-8');

  // Extract frontmatter and body
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    log('grade', 'Could not parse frontmatter');
    return { success: false, error: 'Invalid frontmatter' };
  }

  const [, fmYaml, body] = fmMatch;

  // Parse existing frontmatter
  let frontmatter;
  try {
    const { parse: parseYaml } = await import('yaml');
    frontmatter = parseYaml(fmYaml);
  } catch (e) {
    log('grade', `Frontmatter parse error: ${e.message}`);
    return { success: false, error: 'Frontmatter parse error' };
  }

  const title = frontmatter.title || topic;
  const description = frontmatter.description || '';

  // Call Claude API for grading
  log('grade', 'Calling Claude for grading...');

  try {
    const { createClient, parseJsonResponse } = await import('../lib/anthropic.mjs');
    const client = createClient();

    const userPrompt = `Grade this content page:

**Title**: ${title}
**Description**: ${description}

---
FULL CONTENT:
${body.slice(0, 15000)}
---

Respond with JSON:
{
  "importance": <0-100>,
  "ratings": {
    "novelty": <0-10>,
    "rigor": <0-10>,
    "actionability": <0-10>,
    "completeness": <0-10>
  },
  "llmSummary": "<1-2 sentences with conclusions>",
  "reasoning": "<brief explanation>"
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: GRADING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.content[0].text;
    const grades = parseJsonResponse(text);

    if (!grades || !grades.importance) {
      log('grade', 'Invalid grading response');
      return { success: false, error: 'Invalid response' };
    }

    log('grade', `Importance: ${grades.importance}, Quality: ${Math.round((grades.ratings.novelty + grades.ratings.rigor + grades.ratings.actionability + grades.ratings.completeness) * 2.5)}`);

    // Calculate quality score (same formula as grade-content.mjs)
    const quality = Math.round(
      (grades.ratings.novelty + grades.ratings.rigor +
       grades.ratings.actionability + grades.ratings.completeness) * 2.5
    );

    // Update frontmatter
    frontmatter.importance = grades.importance;
    frontmatter.ratings = grades.ratings;
    frontmatter.quality = quality;
    frontmatter.llmSummary = grades.llmSummary;

    // Count metrics
    const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
    const citations = (body.match(/\[\^\d+\]/g) || []).length;
    const tables = (body.match(/^\|/gm) || []).length > 0 ? Math.floor((body.match(/^\|/gm) || []).length / 3) : 0;
    const diagrams = (body.match(/<Mermaid/g) || []).length;

    frontmatter.metrics = {
      wordCount,
      citations: new Set((body.match(/\[\^\d+\]/g) || [])).size,
      tables,
      diagrams
    };

    // Write updated file
    const { stringify: stringifyYaml } = await import('yaml');
    const newContent = `---\n${stringifyYaml(frontmatter)}---\n${body}`;
    fs.writeFileSync(finalPath, newContent);

    log('grade', `✓ Graded: imp=${grades.importance}, qual=${quality}`);
    log('grade', `  Summary: ${grades.llmSummary?.slice(0, 100)}...`);

    return {
      success: true,
      importance: grades.importance,
      quality,
      ratings: grades.ratings,
      llmSummary: grades.llmSummary
    };

  } catch (error) {
    log('grade', `Grading API error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============ Phase: Review ============

async function runReview(topic) {
  log('review', 'Running critical review...');

  const draftPath = path.join(getTopicDir(topic), 'draft.mdx');
  const reviewPrompt = `# Critical Review: ${topic}

Read the draft article at: ${draftPath}

You are a skeptical editor doing a final quality check. Look specifically for:

## HIGH PRIORITY - Logical Issues

1. **Section-content contradictions**: Does the content within a section contradict its heading?
   - Example: A section titled "Lack of Preventive Mechanisms" that then describes the subject as "preventive"
   - Example: A "Criticisms" section that only contains praise

2. **Self-contradicting quotes**: Are quotes used in contexts that contradict their meaning?
   - Example: Calling something "preventive, not punitive" while arguing it lacks prevention

3. **Temporal artifacts**: Does the text expose when research was conducted?
   - BAD: "As of the research data (through late 2024)..."
   - BAD: "Based on available sources from 2023..."
   - BAD: "No information was found in the sources..."
   - GOOD: "As of early 2026..." or state facts directly without referencing sources

## STANDARD CHECKS

4. **Uncited claims** - Major facts without footnote citations
5. **Missing topics** - Important aspects not covered based on the title
6. **One-sided framing** - Only positive or negative coverage
7. **Vague language** - "significant", "many experts" without specifics

## Output

Write findings to: ${path.join(getTopicDir(topic), 'review.json')}

Format:
{
  "overallQuality": 70,
  "logicalIssues": [
    {"section": "...", "problem": "...", "suggestion": "..."}
  ],
  "temporalArtifacts": ["line containing the artifact..."],
  "uncitedClaims": [...],
  "missingTopics": [...],
  "suggestions": [...]
}

If you find any logicalIssues or temporalArtifacts, also fix them directly in the draft file.`;

  return new Promise((resolve, reject) => {
    const claude = spawn('npx', [
      '@anthropic-ai/claude-code',
      '-p',
      '--print',
      '--dangerously-skip-permissions',
      '--model', 'sonnet',
      '--max-budget-usd', '1.0',
      '--allowedTools', 'Read,Write'
    ], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    claude.stdin.write(reviewPrompt);
    claude.stdin.end();

    claude.on('close', code => {
      resolve({ success: code === 0 });
    });
  });
}

// ============ Pipeline Runner ============

async function runPipeline(topic, tier = 'standard') {
  const config = TIERS[tier];
  if (!config) {
    console.error(`Unknown tier: ${tier}`);
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Page Creator - Cost Optimized`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Topic: "${topic}"`);
  console.log(`Tier: ${config.name} (${config.estimatedCost})`);
  console.log(`Phases: ${config.phases.join(' → ')}`);
  console.log(`${'='.repeat(60)}\n`);

  const results = {
    topic,
    tier,
    startTime: new Date().toISOString(),
    phases: {},
    totalCost: 0
  };

  for (const phase of config.phases) {
    console.log(`\n${'─'.repeat(50)}`);
    log(phase, 'Starting...');

    try {
      let result;

      switch (phase) {
        case 'research-perplexity':
          result = await runPerplexityResearch(topic, 'standard');
          results.totalCost += result.cost || 0;
          break;

        case 'research-perplexity-deep':
          result = await runPerplexityResearch(topic, 'deep');
          results.totalCost += result.cost || 0;
          break;

        case 'research-scry':
          result = await runScryResearch(topic);
          break;

        case 'synthesize':
          result = await runSynthesis(topic, 'standard');
          results.totalCost += result.budget || 0;
          break;

        case 'synthesize-fast':
          result = await runSynthesis(topic, 'fast');
          results.totalCost += 1.0;
          break;

        case 'synthesize-quality':
          result = await runSynthesis(topic, 'quality');
          results.totalCost += result.budget || 0;
          break;

        case 'verify-sources':
          result = await runSourceVerification(topic);
          if (result.warnings?.length > 0) {
            log(phase, `⚠️  Found ${result.warnings.length} potential hallucination(s) - review recommended`);
          }
          break;

        case 'review':
          result = await runReview(topic);
          results.totalCost += 1.0;
          break;

        case 'validate-loop':
          result = await runValidationLoop(topic);
          results.totalCost += 2.0;
          break;

        case 'validate-quick':
          // Just run validators, don't iterate
          result = { success: true };
          results.totalCost += 0.5;
          break;

        case 'validate-full':
          // Run comprehensive programmatic validation
          result = await runFullValidation(topic);
          if (!result.success) {
            log(phase, '❌ Critical validation failures - page may break build');
          }
          break;

        case 'grade':
          // Run quality grading
          result = await runGrading(topic);
          results.totalCost += 0.01; // Grading is very cheap
          break;

        default:
          log(phase, `Unknown phase: ${phase}`);
          continue;
      }

      results.phases[phase] = { success: true, ...result };
      log(phase, '✅ Complete');

    } catch (error) {
      log(phase, `❌ Failed: ${error.message}`);
      results.phases[phase] = { success: false, error: error.message };

      // Stop on critical failures
      if (phase.includes('research') || phase.includes('synthesize')) {
        break;
      }
    }
  }

  results.endTime = new Date().toISOString();

  // Save summary
  saveResult(topic, 'pipeline-results.json', results);

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Pipeline Complete');
  console.log(`${'='.repeat(60)}`);
  console.log(`Estimated cost: ~$${results.totalCost.toFixed(2)}`);

  const finalPath = path.join(getTopicDir(topic), 'final.mdx');
  const draftPath = path.join(getTopicDir(topic), 'draft.mdx');

  if (fs.existsSync(finalPath)) {
    console.log(`\n📄 Final article: ${finalPath}`);
  } else if (fs.existsSync(draftPath)) {
    console.log(`\n📄 Draft article: ${draftPath}`);
  }

  return results;
}

// ============ CLI ============

function printHelp() {
  console.log(`
Page Creator - Cost-Optimized Pipeline

Uses Perplexity for research ($0.10) + Claude for synthesis ($2-3)
Total: $4-6 vs $10+ with all-Claude approach

Usage:
  node scripts/content/page-creator.mjs "<topic>" [options]

Options:
  --tier <tier>     Quality tier: budget, standard, premium (default: standard)
  --phase <phase>   Run a single phase only (for resuming/testing)
  --help            Show this help

Phases:
  research-perplexity   Perplexity web research
  research-scry         Scry knowledge base search
  synthesize            Claude synthesis to MDX
  validate-loop         Iterative Claude validation
  validate-full         Comprehensive programmatic validation
  grade                 Quality grading

Tiers:
${Object.entries(TIERS).map(([key, config]) =>
    `  ${key.padEnd(10)} ${config.estimatedCost.padEnd(10)} ${config.description}`
  ).join('\n')}

Examples:
  node scripts/content/page-creator.mjs "MIRI" --tier standard
  node scripts/content/page-creator.mjs "Anthropic" --tier premium
  node scripts/content/page-creator.mjs "Lighthaven" --phase grade
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const topic = args.find(arg => !arg.startsWith('--'));
  const tierIndex = args.indexOf('--tier');
  const tier = tierIndex !== -1 ? args[tierIndex + 1] : 'standard';
  const phaseIndex = args.indexOf('--phase');
  const singlePhase = phaseIndex !== -1 ? args[phaseIndex + 1] : null;

  if (!topic) {
    console.error('Error: Topic required');
    printHelp();
    process.exit(1);
  }

  ensureDir(TEMP_DIR);

  // If running a single phase, execute just that phase
  if (singlePhase) {
    console.log(`Running single phase: ${singlePhase} for "${topic}"`);
    let result;
    switch (singlePhase) {
      case 'research-perplexity':
        result = await runPerplexityResearch(topic);
        break;
      case 'research-scry':
        result = await runScryResearch(topic);
        break;
      case 'synthesize':
        result = await runSynthesis(topic, tier === 'premium' ? 'opus' : 'sonnet', 2.0);
        break;
      case 'verify-sources':
        result = await runSourceVerification(topic);
        break;
      case 'validate-loop':
        result = await runValidationLoop(topic);
        break;
      case 'validate-full':
        result = await runFullValidation(topic);
        break;
      case 'grade':
        result = await runGrading(topic);
        break;
      default:
        console.error(`Unknown phase: ${singlePhase}`);
        process.exit(1);
    }
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  await runPipeline(topic, tier);
}

main().catch(console.error);
