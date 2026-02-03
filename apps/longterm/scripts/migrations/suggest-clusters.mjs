#!/usr/bin/env node
/**
 * Suggest Cluster Assignments for Pages
 *
 * Uses Claude Haiku to suggest topic cluster assignments for each page
 * based on title, description, path, and category.
 *
 * Usage:
 *   node scripts/migrations/suggest-clusters.mjs [--apply] [--limit N]
 *
 * Options:
 *   --apply    Apply suggestions to files (otherwise just outputs JSON)
 *   --limit N  Only process first N pages (for testing)
 *   --dry-run  Show what would be done without making API calls
 */

import { createClient, MODELS, callClaude, processBatch, parseJsonResponse } from '../lib/anthropic.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// Load database
const db = JSON.parse(readFileSync(join(ROOT, 'src/data/database.json'), 'utf-8'));
const pages = db.pages || [];

// Valid clusters
const CLUSTERS = [
  'ai-safety',    // Relevant for AI safety/alignment (default for most AI content)
  'biorisks',     // Relevant for biosecurity, pandemics, bioweapons
  'cyber',        // Relevant for cybersecurity, hacking, digital threats
  'epistemics',   // Relevant for forecasting, truth, deception, worldviews
  'governance',   // Relevant for policy, regulation, international coordination
  'community',    // Relevant for field-building, funding, careers, orgs
];

const SYSTEM_PROMPT = `You are a classifier for a wiki about AI safety and existential risks.

Your task is to assign topic clusters to wiki pages. A page can belong to MULTIPLE clusters.

Available clusters:
- ai-safety: Content primarily about AI alignment, AI safety research, AI risks, AI capabilities, or AI development. This is the DEFAULT for most AI-related content. INCLUDES AI deception, scheming, treacherous turn, ELK, interpretability - these are core AI safety topics.
- biorisks: Content about biosecurity, pandemics, bioweapons, pathogens, or biological threats.
- cyber: Content about cybersecurity, hacking, digital infrastructure, or cyber attacks.
- epistemics: Content about SOCIETAL epistemics: forecasting institutions (Epoch AI, Metaculus), prediction markets, worldviews, societal misinformation/disinformation, or epistemic infrastructure. NOT for AI deception/scheming (that's ai-safety). Think: "institutions and methods for society to know things."
- governance: Content about policy, regulation, international coordination, treaties, or institutional responses to AI/x-risk.
- community: Content primarily about organizations, people, funders, field-building, or the EA/longtermist/AI safety community structure.

Assignment rules:
1. MOST pages will include 'ai-safety' since this is an AI safety wiki
2. Pages about PEOPLE or ORGANIZATIONS should include 'community' PLUS their domain (e.g., biosecurity researcher gets ['community', 'biorisks'])
3. Pages can have 2-3 clusters if they span topics (e.g., "AI governance" gets ['ai-safety', 'governance'])
4. Be SPECIFIC and CONSERVATIVE - don't add clusters unless clearly relevant
5. 'epistemics' is NARROW - only for forecasting orgs, prediction markets, worldviews, societal truth infrastructure. AI deception topics stay in ai-safety only.

Respond with a JSON object:
{
  "clusters": ["cluster1", "cluster2"],
  "reasoning": "Brief explanation"
}`;

async function suggestClustersForPage(client, page) {
  // Try to read first 500 words of content
  let contentPreview = '';
  try {
    const filePath = join(ROOT, 'src/content/docs', page.filePath);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      // Remove frontmatter
      const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/, '');
      // Remove imports and JSX components
      const textOnly = withoutFrontmatter
        .replace(/^import\s+.*$/gm, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\{[^}]+\}/g, ' ')
        .trim();
      // Get first 500 words
      const words = textOnly.split(/\s+/).slice(0, 500);
      contentPreview = words.join(' ');
    }
  } catch (e) {
    // Ignore read errors
  }

  const userPrompt = `Assign clusters to this wiki page:

Title: ${page.title}
Path: ${page.path}
Category: ${page.category}
Description: ${page.description || page.llmSummary || '(none)'}
${contentPreview ? `\nContent preview (first 500 words):\n${contentPreview}` : ''}

Respond with JSON only.`;

  const { text } = await callClaude(client, {
    model: MODELS.haiku,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 300,
    temperature: 0,
  });

  const result = parseJsonResponse(text);
  return {
    path: page.path,
    title: page.title,
    clusters: result.clusters,
    reasoning: result.reasoning,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const applyOnly = args.includes('--apply-only');
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null;

  console.log('Cluster Suggestion Tool');
  console.log('=======================\n');

  // If --apply-only, just apply from existing JSON file
  if (applyOnly) {
    const outputPath = join(ROOT, '.claude/temp/cluster-suggestions.json');
    if (!existsSync(outputPath)) {
      console.error('No suggestions file found. Run without --apply-only first.');
      process.exit(1);
    }
    const suggestions = JSON.parse(readFileSync(outputPath, 'utf-8'));
    console.log(`Applying ${suggestions.length} suggestions from ${outputPath}${force ? ' (force overwrite)' : ''}\n`);
    await applyClusterSuggestions(suggestions, force);
    return;
  }

  // Filter to pages without clusters (or all pages if re-running)
  let pagesToProcess = pages.filter(p => !p.path.includes('/internal/') && !p.path.includes('/meta/'));

  if (limit) {
    pagesToProcess = pagesToProcess.slice(0, limit);
  }

  console.log(`Pages to process: ${pagesToProcess.length}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would process these pages:');
    pagesToProcess.slice(0, 10).forEach(p => console.log(`  - ${p.title} (${p.path})`));
    if (pagesToProcess.length > 10) {
      console.log(`  ... and ${pagesToProcess.length - 10} more`);
    }
    return;
  }

  const client = createClient();
  const results = [];
  let errors = 0;

  console.log('\nProcessing pages...\n');

  const batchResults = await processBatch(
    pagesToProcess,
    async (page) => suggestClustersForPage(client, page),
    {
      concurrency: 5,
      delayBetweenBatches: 100,
      onProgress: ({ completed, total, item, result, error }) => {
        if (error) {
          console.log(`[${completed}/${total}] ❌ ${item.title}: ${error.message}`);
          errors++;
        } else {
          const clusters = result.clusters.join(', ');
          console.log(`[${completed}/${total}] ✓ ${item.title} → [${clusters}]`);
        }
      },
    }
  );

  // Collect successful results
  for (const { success, result } of batchResults) {
    if (success) {
      results.push(result);
    }
  }

  // Save results
  const outputPath = join(ROOT, '.claude/temp/cluster-suggestions.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Saved ${results.length} suggestions to ${outputPath}`);
  if (errors > 0) {
    console.log(`⚠ ${errors} errors occurred`);
  }

  // Summary stats
  const clusterCounts = {};
  for (const r of results) {
    for (const c of r.clusters) {
      clusterCounts[c] = (clusterCounts[c] || 0) + 1;
    }
  }
  console.log('\nCluster distribution:');
  Object.entries(clusterCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cluster, count]) => {
      console.log(`  ${cluster}: ${count} pages`);
    });

  if (apply) {
    console.log('\n--apply flag detected. Applying to files...');
    await applyClusterSuggestions(results);
  } else {
    console.log('\nTo apply these suggestions to MDX files, run:');
    console.log('  node scripts/migrations/suggest-clusters.mjs --apply');
  }
}

async function applyClusterSuggestions(suggestions, force = false) {
  // Valid clusters - filter out any invalid ones Haiku might have invented
  const VALID_CLUSTERS = ['ai-safety', 'biorisks', 'cyber', 'epistemics', 'governance', 'community'];

  // Build path -> clusters map (filtering to valid clusters only)
  const clusterMap = new Map();
  for (const s of suggestions) {
    const validClusters = s.clusters.filter(c => VALID_CLUSTERS.includes(c));
    // Default to ai-safety if no valid clusters
    clusterMap.set(s.path, validClusters.length > 0 ? validClusters : ['ai-safety']);
  }

  // Read and update each MDX file
  let updated = 0;
  let skipped = 0;

  for (const page of pages) {
    const clusters = clusterMap.get(page.path);
    if (!clusters) continue;

    // filePath is relative like "knowledge-base/capabilities/agentic-ai.mdx"
    // Full path is src/content/docs/ + filePath
    const filePath = join(ROOT, 'src/content/docs', page.filePath);
    if (!existsSync(filePath)) {
      console.log(`  ⚠ File not found: ${filePath}`);
      skipped++;
      continue;
    }

    let content = readFileSync(filePath, 'utf-8');

    // Check if clusters already exist
    if (content.includes('clusters:')) {
      if (!force) {
        console.log(`  ⏭ Already has clusters: ${page.path}`);
        skipped++;
        continue;
      }
      // Remove existing clusters line for force update
      content = content.replace(/^clusters:.*\n/m, '');
    }

    // Find frontmatter end and insert clusters
    const frontmatterEnd = content.indexOf('---', 4);
    if (frontmatterEnd === -1) {
      console.log(`  ⚠ No frontmatter found: ${page.path}`);
      skipped++;
      continue;
    }

    // Insert clusters before the closing ---
    const clustersYaml = `clusters: [${clusters.map(c => `"${c}"`).join(', ')}]\n`;
    const newContent =
      content.slice(0, frontmatterEnd) +
      clustersYaml +
      content.slice(frontmatterEnd);

    writeFileSync(filePath, newContent);
    console.log(`  ✓ Updated: ${page.path}`);
    updated++;
  }

  console.log(`\n✓ Updated ${updated} files, skipped ${skipped}`);
}

main().catch(console.error);
