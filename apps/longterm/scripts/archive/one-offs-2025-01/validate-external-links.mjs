#!/usr/bin/env node
/**
 * Validate External Links
 *
 * Checks all external links in external-links.yaml to verify they exist.
 * Removes broken links and reports findings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');

const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');

// Rate limiting
const DELAY_MS = 200;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
      },
      redirect: 'follow'
    });

    clearTimeout(timeout);

    // For LessWrong/AF, check if it's a "create page" redirect
    if (url.includes('lesswrong.com') || url.includes('alignmentforum.org')) {
      // HEAD might not catch wiki redirects, do a GET for these
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
        },
        redirect: 'follow'
      });
      const text = await getResponse.text();
      // Check for "wiki page has not been created" text
      if (text.includes('wiki page has not been created') || text.includes('CREATE PAGE')) {
        return { valid: false, reason: 'Wiki page not created' };
      }
    }

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 404) {
      return { valid: false, reason: `404 Not Found` };
    } else {
      return { valid: false, reason: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

async function main() {
  console.log('Loading external links...');
  const entries = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));

  const brokenLinks = [];
  const validLinks = [];
  let totalChecked = 0;

  console.log(`Checking ${entries.length} entries...\n`);

  for (const entry of entries) {
    const pageId = entry.pageId;
    const platforms = Object.entries(entry.links);

    for (const [platform, url] of platforms) {
      if (!url) continue;

      totalChecked++;
      if (VERBOSE) {
        process.stdout.write(`Checking ${platform}: ${url}...`);
      }

      const result = await checkUrl(url);

      if (result.valid) {
        validLinks.push({ pageId, platform, url });
        if (VERBOSE) console.log(' OK');
      } else {
        brokenLinks.push({ pageId, platform, url, reason: result.reason });
        if (VERBOSE) {
          console.log(` BROKEN (${result.reason})`);
        } else {
          console.log(`BROKEN: ${pageId} -> ${platform}: ${url} (${result.reason})`);
        }
      }

      await sleep(DELAY_MS);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total checked: ${totalChecked}`);
  console.log(`Valid: ${validLinks.length}`);
  console.log(`Broken: ${brokenLinks.length}`);

  if (brokenLinks.length > 0) {
    console.log(`\nBroken links by platform:`);
    const byPlatform = {};
    for (const link of brokenLinks) {
      byPlatform[link.platform] = (byPlatform[link.platform] || 0) + 1;
    }
    for (const [platform, count] of Object.entries(byPlatform).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${platform}: ${count}`);
    }
  }

  if (APPLY && brokenLinks.length > 0) {
    console.log(`\nRemoving ${brokenLinks.length} broken links...`);

    const brokenSet = new Set(brokenLinks.map(l => `${l.pageId}:${l.platform}`));

    for (const entry of entries) {
      for (const platform of Object.keys(entry.links)) {
        if (brokenSet.has(`${entry.pageId}:${platform}`)) {
          delete entry.links[platform];
        }
      }
    }

    // Remove entries with no links
    const filteredEntries = entries.filter(e => Object.keys(e.links).length > 0);

    const yamlContent = `# External Links Mapping
# Maps page entity IDs to their corresponding pages on external platforms
#
# Supported platforms:
#   - wikipedia: Wikipedia article URL
#   - wikidata: Wikidata item URL
#   - lesswrong: LessWrong tag/wiki URL
#   - alignmentForum: Alignment Forum wiki URL
#   - eaForum: EA Forum topic URL
#   - stampy: AISafety.info / Stampy article URL
#   - arbital: Arbital (GreaterWrong) page URL
#
# Generated: ${new Date().toISOString()}
# Total entries: ${filteredEntries.length}

${yaml.dump(filteredEntries, { lineWidth: 120, noRefs: true })}`;

    fs.writeFileSync(EXTERNAL_LINKS_PATH, yamlContent);
    console.log(`Saved ${filteredEntries.length} entries (removed ${entries.length - filteredEntries.length} empty entries)`);
  } else if (brokenLinks.length > 0) {
    console.log(`\nRun with --apply to remove broken links`);
  }
}

main().catch(console.error);
