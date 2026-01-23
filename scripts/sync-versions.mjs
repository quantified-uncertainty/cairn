#!/usr/bin/env node
/**
 * Sync versions from package.json to version.json for each app.
 *
 * This script runs after `changeset version` to:
 * 1. Read each app's package.json version
 * 2. Update corresponding version.json (major, minor, patch parsed from semver)
 * 3. Add git hash from `git rev-parse --short HEAD`
 * 4. Add build date
 *
 * Usage: node scripts/sync-versions.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Apps that have version.json files
const apps = [
  'delegation-risk',
  'longterm',
  'meta'
];

/**
 * Get the current git hash (short form)
 */
function getGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

/**
 * Parse semver string into major, minor, patch
 */
function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Sync version for a single app
 */
function syncAppVersion(appName) {
  const appDir = join(rootDir, 'apps', appName);
  const packageJsonPath = join(appDir, 'package.json');
  const versionJsonPath = join(appDir, 'version.json');

  // Check if both files exist
  if (!existsSync(packageJsonPath)) {
    console.log(`  Skipping ${appName}: no package.json`);
    return false;
  }

  if (!existsSync(versionJsonPath)) {
    console.log(`  Skipping ${appName}: no version.json`);
    return false;
  }

  // Read current files
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const versionJson = JSON.parse(readFileSync(versionJsonPath, 'utf-8'));

  // Parse version from package.json
  const { major, minor, patch } = parseSemver(packageJson.version);

  // Update version.json
  const updatedVersionJson = {
    ...versionJson,
    major,
    minor,
    patch,
    gitHash: getGitHash(),
    lastBuildDate: new Date().toISOString().split('T')[0]
  };

  // Write updated version.json
  writeFileSync(
    versionJsonPath,
    JSON.stringify(updatedVersionJson, null, 2) + '\n',
    'utf-8'
  );

  console.log(`  ${appName}: ${major}.${minor}.${patch}+${updatedVersionJson.gitHash}`);
  return true;
}

// Main execution
console.log('Syncing versions from package.json to version.json...\n');

let synced = 0;
for (const app of apps) {
  if (syncAppVersion(app)) {
    synced++;
  }
}

console.log(`\nSynced ${synced} app(s).`);
