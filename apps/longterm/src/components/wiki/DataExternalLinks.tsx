/**
 * Data-aware External Links Component
 *
 * Wrapper that automatically loads external links from YAML data by page ID.
 * Displays prominent links to Wikipedia, LessWrong, EA Forum, and Alignment Forum.
 *
 * Usage:
 * ```tsx
 * <DataExternalLinks pageId="situational-awareness" client:load />
 * ```
 */

import React from 'react';
import { ExternalLinks } from './ExternalLinks';
import { getExternalLinks, type ExternalLinksData } from '@data/external-links-data';

interface DataExternalLinksProps {
  pageId: string;
  // Allow manual override of links
  links?: ExternalLinksData;
}

export function DataExternalLinks({ pageId, links: manualLinks }: DataExternalLinksProps) {
  // Use manual links if provided, otherwise look up from YAML
  const links = manualLinks ?? getExternalLinks(pageId);

  if (!links) {
    return null;
  }

  return <ExternalLinks pageId={pageId} links={links} />;
}

export default DataExternalLinks;
