/**
 * External Links Data Loader
 *
 * Loads external link mappings from YAML and provides lookup by page ID.
 * External links connect pages to their equivalents on Wikipedia, LessWrong,
 * EA Forum, and Alignment Forum.
 */

import yaml from 'js-yaml';

// Import YAML as raw text
import externalLinksYaml from './external-links.yaml?raw';

export interface ExternalLinksData {
  wikipedia?: string;
  wikidata?: string;           // Wikidata item URL
  lesswrong?: string;
  alignmentForum?: string;
  eaForum?: string;
  stampy?: string;             // aisafety.info / Stampy
  arbital?: string;            // arbital.greaterwrong.com
}

interface ExternalLinkEntry {
  pageId: string;
  links: ExternalLinksData;
}

// Parse YAML and build lookup map
let linksMap: Map<string, ExternalLinksData> | null = null;

function loadLinksMap(): Map<string, ExternalLinksData> {
  if (linksMap) return linksMap;

  try {
    const entries = yaml.load(externalLinksYaml) as ExternalLinkEntry[];
    linksMap = new Map();

    for (const entry of entries) {
      if (entry.pageId && entry.links) {
        linksMap.set(entry.pageId, entry.links);
      }
    }

    return linksMap;
  } catch (error) {
    console.error('Failed to load external links YAML:', error);
    return new Map();
  }
}

/**
 * Get external links for a page by its ID
 * @param pageId - The entity/page ID (e.g., "situational-awareness")
 * @returns External links data or undefined if not found
 */
export function getExternalLinks(pageId: string): ExternalLinksData | undefined {
  const map = loadLinksMap();
  return map.get(pageId);
}

/**
 * Check if a page has any external links
 * @param pageId - The entity/page ID
 * @returns true if the page has external links
 */
export function hasExternalLinks(pageId: string): boolean {
  const links = getExternalLinks(pageId);
  if (!links) return false;
  return Object.values(links).some(url => !!url);
}

/**
 * Get all page IDs that have external links
 * @returns Array of page IDs
 */
export function getAllPagesWithExternalLinks(): string[] {
  const map = loadLinksMap();
  return Array.from(map.keys());
}

/**
 * Get all external links entries
 * @returns Array of all external link entries
 */
export function getAllExternalLinks(): ExternalLinkEntry[] {
  const map = loadLinksMap();
  return Array.from(map.entries()).map(([pageId, links]) => ({
    pageId,
    links,
  }));
}
