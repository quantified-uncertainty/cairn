#!/usr/bin/env node

/**
 * Fix broken /parameters/ links in AI Transition Model YAML files
 *
 * These links should point to /factors/[parent]/[subitem]/ paths instead.
 * The script builds a mapping from entity IDs to correct paths, then
 * replaces all occurrences.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../src/data');
const ENTITIES_DIR = path.join(DATA_DIR, 'entities');

// Build path mapping from all entity files
async function buildPathMap() {
  const pathMap = new Map();

  const entityFiles = await glob('*.yaml', { cwd: ENTITIES_DIR });

  for (const file of entityFiles) {
    const content = fs.readFileSync(path.join(ENTITIES_DIR, file), 'utf-8');

    // Parse YAML - handle both array and object formats
    let entities;
    try {
      const parsed = yaml.parse(content);
      entities = Array.isArray(parsed) ? parsed : parsed.entities || [parsed];
    } catch (e) {
      console.warn(`Warning: Could not parse ${file}: ${e.message}`);
      continue;
    }

    for (const entity of entities) {
      if (!entity) continue;

      // Extract the slug from the path or id
      if (entity.path) {
        // Extract slug from path: /ai-transition-model/factors/X/Y/ -> Y
        const match = entity.path.match(/\/ai-transition-model\/[^/]+\/[^/]+\/([^/]+)\//);
        if (match) {
          const slug = match[1];
          pathMap.set(slug, entity.path);
        }
        // Also check for /parameters/ paths -> use those as keys too
        const paramMatch = entity.path.match(/\/ai-transition-model\/parameters\/([^/]+)\//);
        if (paramMatch) {
          // This is an entity with a /parameters/ path - we need to find its correct path
          // For now, store it but flag that it needs fixing
          const slug = paramMatch[1];
          if (!pathMap.has(slug)) {
            pathMap.set(slug, entity.path); // Will be overwritten by correct path
          }
        }
      }
    }
  }

  return pathMap;
}

// Build manual mapping for known entities based on their parent factors
function buildCorrectPathMap() {
  // These are the correct paths based on the entity structure
  return new Map([
    // Misalignment Potential sub-items
    ['alignment-robustness', '/ai-transition-model/factors/misalignment-potential/alignment-robustness/'],
    ['safety-capability-gap', '/ai-transition-model/factors/misalignment-potential/safety-capability-gap/'],
    ['interpretability-coverage', '/ai-transition-model/factors/misalignment-potential/interpretability-coverage/'],
    ['human-oversight-quality', '/ai-transition-model/factors/misalignment-potential/human-oversight-quality/'],
    ['safety-culture-strength', '/ai-transition-model/factors/misalignment-potential/safety-culture-strength/'],

    // Misuse Potential sub-items
    ['biological-threat-exposure', '/ai-transition-model/factors/misuse-potential/biological-threat-exposure/'],
    ['cyber-threat-exposure', '/ai-transition-model/factors/misuse-potential/cyber-threat-exposure/'],
    ['robot-threat-exposure', '/ai-transition-model/factors/misuse-potential/robot-threat-exposure/'],
    ['surprise-threat-exposure', '/ai-transition-model/factors/misuse-potential/surprise-threat-exposure/'],

    // Transition Turbulence sub-items
    ['racing-intensity', '/ai-transition-model/factors/transition-turbulence/racing-intensity/'],
    ['economic-stability', '/ai-transition-model/factors/transition-turbulence/economic-stability/'],

    // Civilizational Competence sub-items
    ['adaptability', '/ai-transition-model/factors/civilizational-competence/adaptability/'],
    ['epistemics', '/ai-transition-model/factors/civilizational-competence/epistemics/'],
    ['governance', '/ai-transition-model/factors/civilizational-competence/governance/'],

    // Sub-items of Adaptability (under Civilizational Competence)
    ['societal-resilience', '/ai-transition-model/factors/civilizational-competence/societal-resilience/'],
    ['human-expertise', '/ai-transition-model/factors/civilizational-competence/human-expertise/'],
    ['human-agency', '/ai-transition-model/factors/civilizational-competence/human-agency/'],

    // Sub-items of Epistemics (under Civilizational Competence)
    ['epistemic-health', '/ai-transition-model/factors/civilizational-competence/epistemic-health/'],
    ['information-authenticity', '/ai-transition-model/factors/civilizational-competence/information-authenticity/'],
    ['reality-coherence', '/ai-transition-model/factors/civilizational-competence/reality-coherence/'],
    ['societal-trust', '/ai-transition-model/factors/civilizational-competence/societal-trust/'],
    ['preference-authenticity', '/ai-transition-model/factors/civilizational-competence/preference-authenticity/'],

    // Sub-items of Governance (under Civilizational Competence)
    ['regulatory-capacity', '/ai-transition-model/factors/civilizational-competence/regulatory-capacity/'],
    ['institutional-quality', '/ai-transition-model/factors/civilizational-competence/institutional-quality/'],
    ['international-coordination', '/ai-transition-model/factors/civilizational-competence/international-coordination/'],
    ['coordination-capacity', '/ai-transition-model/factors/civilizational-competence/coordination-capacity/'],
    ['ai-control-concentration', '/ai-transition-model/factors/civilizational-competence/ai-control-concentration/'],
  ]);
}

// Find and fix all /parameters/ links in YAML files
async function fixParametersLinks(dryRun = true) {
  const pathMap = buildCorrectPathMap();

  const yamlFiles = await glob('**/*.yaml', { cwd: ENTITIES_DIR });

  let totalFixed = 0;
  let totalFiles = 0;
  const issues = [];

  for (const file of yamlFiles) {
    const filePath = path.join(ENTITIES_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Find all /parameters/ links
    const paramRegex = /\/ai-transition-model\/parameters\/([a-z-]+)\//g;
    let match;
    let fileFixed = 0;

    while ((match = paramRegex.exec(originalContent)) !== null) {
      const slug = match[1];
      const wrongPath = match[0];
      const correctPath = pathMap.get(slug);

      if (correctPath) {
        content = content.replaceAll(wrongPath, correctPath);
        fileFixed++;
      } else {
        issues.push({ file, slug, wrongPath });
      }
    }

    if (fileFixed > 0) {
      totalFixed += fileFixed;
      totalFiles++;

      if (dryRun) {
        console.log(`Would fix ${fileFixed} links in ${file}`);
      } else {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed ${fileFixed} links in ${file}`);
      }
    }
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Summary:`);
  console.log(`  Fixed ${totalFixed} links in ${totalFiles} files`);

  if (issues.length > 0) {
    console.log(`\n  ${issues.length} unresolved slugs (no mapping found):`);
    const uniqueIssues = [...new Set(issues.map(i => i.slug))];
    uniqueIssues.forEach(slug => {
      console.log(`    - ${slug}`);
    });
  }

  return { totalFixed, totalFiles, issues };
}

// Also fix path: definitions that use /parameters/
async function fixPathDefinitions(dryRun = true) {
  const pathMap = buildCorrectPathMap();
  const filePath = path.join(ENTITIES_DIR, 'ai-transition-model-content.yaml');

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Find path: "/ai-transition-model/parameters/X/" definitions
  const pathDefRegex = /path: "\/ai-transition-model\/parameters\/([a-z-]+)\/"/g;
  let match;
  let fixed = 0;

  while ((match = pathDefRegex.exec(originalContent)) !== null) {
    const slug = match[1];
    const wrongPath = `/ai-transition-model/parameters/${slug}/`;
    const correctPath = pathMap.get(slug);

    if (correctPath) {
      content = content.replaceAll(`path: "${wrongPath}"`, `path: "${correctPath}"`);
      fixed++;
      console.log(`${dryRun ? '[DRY RUN] ' : ''}Would fix path definition: ${slug}`);
    }
  }

  if (!dryRun && fixed > 0) {
    fs.writeFileSync(filePath, content);
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Fixed ${fixed} path definitions`);

  return fixed;
}

// Main
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

console.log(dryRun ? 'Running in dry-run mode. Use --apply to make changes.\n' : 'Applying changes...\n');

console.log('=== Fixing /parameters/ links in markdown content ===');
await fixParametersLinks(dryRun);

console.log('\n=== Fixing path: definitions ===');
await fixPathDefinitions(dryRun);
