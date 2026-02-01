#!/usr/bin/env node
/**
 * External Links Matcher
 *
 * Matches wiki pages to their corresponding external resources on:
 * - Wikipedia
 * - LessWrong
 * - EA Forum
 * - Alignment Forum
 *
 * Usage:
 *   node scripts/match-external-links.mjs --dry-run        # Preview matches
 *   node scripts/match-external-links.mjs --apply          # Update external-links.yaml
 *   node scripts/match-external-links.mjs --add-components # Add DataExternalLinks to MDX files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// Simple recursive file finder (no external deps)
function findFiles(dir, pattern, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, pattern, results);
    } else if (entry.name.endsWith(pattern)) {
      results.push(fullPath);
    }
  }
  return results;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Paths
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');
const LESSWRONG_TAGS_PATH = path.join(ROOT, 'src/data/reference/lesswrong-tags.txt');
const EAFORUM_TAGS_PATH = path.join(ROOT, 'src/data/reference/eaforum-tags.txt');
const CONTENT_DIR = path.join(ROOT, 'src/content/docs');

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--apply');
const ADD_COMPONENTS = args.includes('--add-components');

// Load tag lists
function loadTags(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Tag file not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => {
    const [name, slug, postCount] = line.split('|');
    return { name, slug, postCount: parseInt(postCount, 10) || 0 };
  });
}

// Load existing external links
function loadExternalLinks() {
  if (!fs.existsSync(EXTERNAL_LINKS_PATH)) {
    return [];
  }
  const content = fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8');
  return yaml.load(content) || [];
}

// Get all MDX pages
async function getPages() {
  const fullPaths = findFiles(CONTENT_DIR, '.mdx');
  return fullPaths.map(fullPath => {
    const file = path.relative(CONTENT_DIR, fullPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let frontmatter = {};
    if (frontmatterMatch) {
      try {
        frontmatter = yaml.load(frontmatterMatch[1]) || {};
      } catch (e) {
        // Ignore parse errors
      }
    }
    const pageId = path.basename(file, '.mdx');
    return {
      pageId,
      file,
      fullPath,
      title: frontmatter.title || pageId,
      hasExternalLinks: content.includes('DataExternalLinks'),
    };
  });
}

// Normalize string for matching
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Blocklist of generic terms that shouldn't match
const GENERIC_TAGS = new Set([
  'ai', 'research', 'policy', 'models', 'opinion', 'law', 'war',
  'evolution', 'experiments', 'government', 'politics', 'suffering',
  'agency', 'gaming-videogames-tabletop'
]);

// Find best matching tag
function findMatchingTag(pageId, pageTitle, tags) {
  const normalizedId = normalize(pageId);
  const normalizedTitle = normalize(pageTitle);

  // Skip index pages
  if (pageId === 'index') return null;

  // Exact slug match (highest quality)
  let match = tags.find(t => t.slug === normalizedId || t.slug === normalizedTitle);
  if (match && !GENERIC_TAGS.has(match.slug)) return { ...match, quality: 'exact' };

  // Exact name match (normalized)
  match = tags.find(t => normalize(t.name) === normalizedId || normalize(t.name) === normalizedTitle);
  if (match && !GENERIC_TAGS.has(match.slug)) return { ...match, quality: 'name' };

  // Strong substring match (tag is substantial part of page name or vice versa)
  for (const tag of tags) {
    if (GENERIC_TAGS.has(tag.slug)) continue;
    if (tag.postCount < 20) continue; // Skip small tags

    const tagNorm = normalize(tag.name);

    // Tag name contains page ID (e.g., "deceptive-alignment" matches "deceptive-alignment-decomposition")
    if (normalizedId.length > 5 && tagNorm.includes(normalizedId)) {
      return { ...tag, quality: 'contains' };
    }

    // Page ID contains tag name, but tag must be significant portion (>50% of page name)
    if (tagNorm.length > 5 && normalizedId.includes(tagNorm) && tagNorm.length / normalizedId.length > 0.5) {
      return { ...tag, quality: 'contained' };
    }
  }

  return null;
}

// Wikipedia article patterns for AI safety topics
const WIKIPEDIA_MAPPINGS = {
  // Core concepts
  'ai-safety': 'https://en.wikipedia.org/wiki/AI_safety',
  'ai-alignment': 'https://en.wikipedia.org/wiki/AI_alignment',
  'alignment': 'https://en.wikipedia.org/wiki/AI_alignment',
  'existential-risk': 'https://en.wikipedia.org/wiki/Existential_risk_from_artificial_general_intelligence',
  'superintelligence': 'https://en.wikipedia.org/wiki/Superintelligence',
  'agi': 'https://en.wikipedia.org/wiki/Artificial_general_intelligence',
  'artificial-general-intelligence': 'https://en.wikipedia.org/wiki/Artificial_general_intelligence',
  'instrumental-convergence': 'https://en.wikipedia.org/wiki/Instrumental_convergence',
  'orthogonality-thesis': 'https://en.wikipedia.org/wiki/Orthogonality_thesis',
  'goodharts-law': 'https://en.wikipedia.org/wiki/Goodhart%27s_law',

  // Technical concepts
  'reinforcement-learning': 'https://en.wikipedia.org/wiki/Reinforcement_learning',
  'large-language-model': 'https://en.wikipedia.org/wiki/Large_language_model',
  'language-models': 'https://en.wikipedia.org/wiki/Large_language_model',
  'deepfakes': 'https://en.wikipedia.org/wiki/Deepfake',
  'deepfake': 'https://en.wikipedia.org/wiki/Deepfake',
  'autonomous-weapons': 'https://en.wikipedia.org/wiki/Lethal_autonomous_weapon',

  // Risks
  'bioweapons': 'https://en.wikipedia.org/wiki/Biological_warfare',
  'cyberweapons': 'https://en.wikipedia.org/wiki/Cyberwarfare',
  'nuclear-weapons': 'https://en.wikipedia.org/wiki/Nuclear_weapon',

  // Philosophy
  'longtermism': 'https://en.wikipedia.org/wiki/Longtermism',
  'effective-altruism': 'https://en.wikipedia.org/wiki/Effective_altruism',
  'decision-theory': 'https://en.wikipedia.org/wiki/Decision_theory',

  // Organizations
  'openai': 'https://en.wikipedia.org/wiki/OpenAI',
  'anthropic': 'https://en.wikipedia.org/wiki/Anthropic',
  'deepmind': 'https://en.wikipedia.org/wiki/DeepMind',
  'miri': 'https://en.wikipedia.org/wiki/Machine_Intelligence_Research_Institute',

  // People
  'eliezer-yudkowsky': 'https://en.wikipedia.org/wiki/Eliezer_Yudkowsky',
  'nick-bostrom': 'https://en.wikipedia.org/wiki/Nick_Bostrom',
  'stuart-russell': 'https://en.wikipedia.org/wiki/Stuart_J._Russell',
  'demis-hassabis': 'https://en.wikipedia.org/wiki/Demis_Hassabis',
  'geoffrey-hinton': 'https://en.wikipedia.org/wiki/Geoffrey_Hinton',
  'yoshua-bengio': 'https://en.wikipedia.org/wiki/Yoshua_Bengio',
  'sam-altman': 'https://en.wikipedia.org/wiki/Sam_Altman',
};

async function main() {
  console.log('Loading data...');

  const lesswrongTags = loadTags(LESSWRONG_TAGS_PATH);
  const eaforumTags = loadTags(EAFORUM_TAGS_PATH);
  const existingLinks = loadExternalLinks();
  const pages = await getPages();

  console.log(`Loaded ${lesswrongTags.length} LessWrong tags`);
  console.log(`Loaded ${eaforumTags.length} EA Forum tags`);
  console.log(`Found ${pages.length} MDX pages`);
  console.log(`Existing external links: ${existingLinks.length}`);

  // Build map of existing links
  const existingMap = new Map(existingLinks.map(e => [e.pageId, e.links]));

  // Find matches for pages without existing links
  const newMatches = [];
  const updatedLinks = [...existingLinks];

  for (const page of pages) {
    // Skip internal/project pages
    if (page.file.includes('/internal/') || page.file.includes('/project/')) {
      continue;
    }

    const existing = existingMap.get(page.pageId);
    if (existing) {
      // Already has links, skip
      continue;
    }

    const links = {};

    // Check Wikipedia
    const wikiUrl = WIKIPEDIA_MAPPINGS[page.pageId];
    if (wikiUrl) {
      links.wikipedia = wikiUrl;
    }

    // Check LessWrong
    const lwMatch = findMatchingTag(page.pageId, page.title, lesswrongTags);
    if (lwMatch) {
      links.lesswrong = `https://www.lesswrong.com/tag/${lwMatch.slug}`;
    }

    // Check EA Forum
    const eaMatch = findMatchingTag(page.pageId, page.title, eaforumTags);
    if (eaMatch) {
      links.eaForum = `https://forum.effectivealtruism.org/topics/${eaMatch.slug}`;
    }

    if (Object.keys(links).length > 0) {
      newMatches.push({
        pageId: page.pageId,
        title: page.title,
        links,
        lwMatch: lwMatch?.name,
        eaMatch: eaMatch?.name,
      });

      updatedLinks.push({
        pageId: page.pageId,
        links,
      });
    }
  }

  console.log(`\nFound ${newMatches.length} new matches:\n`);

  for (const match of newMatches) {
    console.log(`${match.pageId} (${match.title})`);
    if (match.links.wikipedia) console.log(`  Wikipedia: ${match.links.wikipedia}`);
    if (match.links.lesswrong) console.log(`  LessWrong: ${match.lwMatch} → ${match.links.lesswrong}`);
    if (match.links.eaForum) console.log(`  EA Forum: ${match.eaMatch} → ${match.links.eaForum}`);
    console.log('');
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No changes made. Use --apply to update external-links.yaml');
  } else {
    // Sort by pageId for consistent output
    updatedLinks.sort((a, b) => a.pageId.localeCompare(b.pageId));

    // Generate YAML with comments
    const yamlContent = `# External Links Mapping
# Maps page entity IDs to their corresponding pages on external platforms
#
# Supported platforms:
#   - wikipedia: Wikipedia article URL
#   - lesswrong: LessWrong tag/wiki URL
#   - alignmentForum: Alignment Forum wiki URL
#   - eaForum: EA Forum topic URL
#
# Generated: ${new Date().toISOString()}
# Total entries: ${updatedLinks.length}

${yaml.dump(updatedLinks, { lineWidth: 120, noRefs: true })}`;

    fs.writeFileSync(EXTERNAL_LINKS_PATH, yamlContent);
    console.log(`\nUpdated ${EXTERNAL_LINKS_PATH} with ${updatedLinks.length} entries`);
  }

  if (ADD_COMPONENTS) {
    console.log('\nAdding DataExternalLinks components to pages...\n');

    let added = 0;
    for (const page of pages) {
      if (page.hasExternalLinks) {
        continue; // Already has the component
      }

      const hasLinks = existingMap.has(page.pageId) ||
        newMatches.some(m => m.pageId === page.pageId);

      if (!hasLinks) {
        continue;
      }

      const content = fs.readFileSync(page.fullPath, 'utf-8');

      // Check if imports wiki components
      if (!content.includes("from '") || !content.includes("components/wiki")) {
        console.log(`  Skipping ${page.pageId} - no wiki imports`);
        continue;
      }

      // Add DataExternalLinks to import
      let updated = content;

      // Find the import line
      const importMatch = updated.match(/(import\s*\{[^}]+\}\s*from\s*['"][^'"]*components\/wiki['"];?)/);
      if (importMatch) {
        const originalImport = importMatch[1];
        if (!originalImport.includes('DataExternalLinks')) {
          const newImport = originalImport.replace(
            /import\s*\{([^}]+)\}/,
            (match, imports) => `import {${imports.trim()}, DataExternalLinks}`
          );
          updated = updated.replace(originalImport, newImport);
        }
      }

      // Add component after imports and before first content
      if (!updated.includes('<DataExternalLinks')) {
        // Find the end of frontmatter and imports
        const afterFrontmatter = updated.indexOf('---', updated.indexOf('---') + 3) + 3;
        const afterImports = updated.lastIndexOf("from '");
        if (afterImports > afterFrontmatter) {
          const importEnd = updated.indexOf('\n', afterImports);
          const insertPoint = updated.indexOf('\n', importEnd + 1);
          if (insertPoint > 0) {
            updated = updated.slice(0, insertPoint) +
              `\n<DataExternalLinks pageId="${page.pageId}" client:load />\n` +
              updated.slice(insertPoint);
          }
        }
      }

      if (updated !== content) {
        if (DRY_RUN) {
          console.log(`  Would update: ${page.file}`);
        } else {
          fs.writeFileSync(page.fullPath, updated);
          console.log(`  Updated: ${page.file}`);
        }
        added++;
      }
    }

    console.log(`\n${DRY_RUN ? 'Would add' : 'Added'} DataExternalLinks to ${added} pages`);
  }
}

main().catch(console.error);
