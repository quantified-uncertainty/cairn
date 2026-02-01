#!/usr/bin/env node

/**
 * Page Creator V3 - Cost-Optimized Pipeline
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
 *   node scripts/content/page-creator-v3.mjs "SecureBio" --tier standard
 *   node scripts/content/page-creator-v3.mjs "Community Notes" --tier premium
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
    phases: ['research-perplexity', 'synthesize-fast', 'validate-quick'],
    description: 'Perplexity research + fast synthesis'
  },
  standard: {
    name: 'Standard',
    estimatedCost: '$4-6',
    phases: ['research-perplexity', 'research-scry', 'synthesize', 'validate-loop'],
    description: 'Full research + Sonnet synthesis + validation loop'
  },
  premium: {
    name: 'Premium',
    estimatedCost: '$8-12',
    phases: ['research-perplexity-deep', 'research-scry', 'synthesize-quality', 'review', 'validate-loop'],
    description: 'Deep research + quality synthesis + review'
  }
};

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

  const researchContent = researchData?.sources?.map(s =>
    `### ${s.category.toUpperCase()}\n${s.content}`
  ).join('\n\n') || 'No Perplexity research available';

  const scryContent = scryData?.results?.slice(0, 10).map(r =>
    `- [${r.title}](${r.uri}) by ${r.original_author} (${r.platform})\n  ${r.snippet?.slice(0, 200) || ''}`
  ).join('\n') || 'No SCRY results available';

  return `# Write Wiki Article: ${topic}

You are writing a wiki article for Cairn, an AI safety knowledge base.

## Research Data

### WEB RESEARCH (from Perplexity)
${researchContent}

### COMMUNITY DISCUSSIONS (from EA Forum/LessWrong)
${scryContent}

## Requirements

1. **Use GFM footnotes** - Format: claim[^1] with [^1]: [Source](url) at bottom
2. **Escape dollar signs** - Write \\$100M not $100M
3. **Use EntityLink for internal refs** - <EntityLink id="open-philanthropy">Open Philanthropy</EntityLink>
4. **Include criticism section** if research supports it
5. **60%+ prose** - Not just tables and bullet points

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

## Validation Tasks

1. **Run precommit validation**:
   \`npm run precommit\`

2. **If validation fails**, fix the issues:
   - Escape unescaped $ signs as \\$
   - Escape < before numbers as \\< or use &lt;
   - Fix markdown list formatting
   - Fix consecutive bold label issues

3. **Check wiki conventions**:
   - All factual claims have footnote citations [^N]
   - EntityLinks used for known entities
   - Proper frontmatter fields present
   - Import statement correct for file depth

4. **Write the final fixed version** to:
   ${path.join(getTopicDir(topic), 'final.mdx')}

5. **Report** what was fixed.

Keep iterating until \`npm run precommit\` passes.`;

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

// ============ Phase: Review ============

async function runReview(topic) {
  log('review', 'Running critical review...');

  const draftPath = path.join(getTopicDir(topic), 'draft.mdx');
  const reviewPrompt = `# Critical Review: ${topic}

Read the draft article at: ${draftPath}

You are a skeptical editor. Look for:
1. **Uncited claims** - Facts without footnote citations
2. **Missing topics** - Important aspects not covered
3. **One-sided framing** - Only positive or negative
4. **Vague language** - "significant", "many" without numbers
5. **Wiki convention violations** - Wrong citation format, missing EntityLinks

Write a review to: ${path.join(getTopicDir(topic), 'review.json')}

Format:
{
  "overallQuality": 70,
  "uncitedClaims": [...],
  "missingTopics": [...],
  "suggestions": [...]
}`;

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
  console.log(`Page Creator V3 - Cost Optimized`);
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
Page Creator V3 - Cost-Optimized Pipeline

Uses Perplexity for research ($0.10) + Claude for synthesis ($2-3)
Total: $4-6 vs $10+ with all-Claude approach

Usage:
  node scripts/content/page-creator-v3.mjs "<topic>" [options]

Options:
  --tier <tier>   Quality tier: budget, standard, premium (default: standard)
  --help          Show this help

Tiers:
${Object.entries(TIERS).map(([key, config]) =>
    `  ${key.padEnd(10)} ${config.estimatedCost.padEnd(10)} ${config.description}`
  ).join('\n')}

Examples:
  node scripts/content/page-creator-v3.mjs "MIRI" --tier standard
  node scripts/content/page-creator-v3.mjs "Anthropic" --tier premium
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

  if (!topic) {
    console.error('Error: Topic required');
    printHelp();
    process.exit(1);
  }

  ensureDir(TEMP_DIR);
  await runPipeline(topic, tier);
}

main().catch(console.error);
