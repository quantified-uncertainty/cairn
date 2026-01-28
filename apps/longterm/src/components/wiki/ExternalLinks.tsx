import React from 'react';
import { ExternalLink, BookOpen, MessageSquare, GraduationCap, Briefcase } from 'lucide-react';

interface ExternalLinksData {
  wikipedia?: string;
  wikidata?: string;
  lesswrong?: string;
  alignmentForum?: string;
  eaForum?: string;
  stampy?: string;
  arbital?: string;
  eightyK?: string;
}

interface ExternalLinksProps {
  pageId: string;
  links?: ExternalLinksData;
}

const platformConfig = {
  wikipedia: {
    name: 'Wikipedia',
    icon: BookOpen,
  },
  wikidata: {
    name: 'Wikidata',
    icon: BookOpen,
  },
  lesswrong: {
    name: 'LessWrong',
    icon: GraduationCap,
  },
  alignmentForum: {
    name: 'Alignment Forum',
    icon: GraduationCap,
  },
  eaForum: {
    name: 'EA Forum',
    icon: MessageSquare,
  },
  stampy: {
    name: 'AI Safety Info',
    icon: MessageSquare,
  },
  arbital: {
    name: 'Arbital',
    icon: BookOpen,
  },
  eightyK: {
    name: '80,000 Hours',
    icon: Briefcase,
  },
};

type PlatformKey = keyof typeof platformConfig;

function ExternalLinkButton({ platform, url }: { platform: PlatformKey; url: string }) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline"
    >
      <Icon size={14} />
      <span>{config.name}</span>
      <ExternalLink size={10} className="opacity-50" />
    </a>
  );
}

/**
 * Displays prominent links to external resources (Wikipedia, LessWrong, EA Forum)
 * for pages that have corresponding content on those platforms.
 *
 * Usage:
 * ```tsx
 * <ExternalLinks pageId="situational-awareness" links={linksData} />
 * ```
 *
 * Or with the DataExternalLinks wrapper that loads from the YAML file:
 * ```tsx
 * <DataExternalLinks pageId="situational-awareness" client:load />
 * ```
 */
export function ExternalLinks({ pageId, links }: ExternalLinksProps) {
  if (!links) return null;

  const platforms = Object.entries(links).filter(([_, url]) => url) as [PlatformKey, string][];

  if (platforms.length === 0) return null;

  // Order: Wikipedia first (as authoritative reference), then forums, then specialized resources
  const orderedPlatforms: PlatformKey[] = ['wikipedia', 'wikidata', 'eightyK', 'lesswrong', 'alignmentForum', 'eaForum', 'stampy', 'arbital'];
  const sortedPlatforms = platforms.sort(([a], [b]) =>
    orderedPlatforms.indexOf(a) - orderedPlatforms.indexOf(b)
  );

  return (
    <div className="mb-8 mt-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm text-muted-foreground">
          See also:
        </span>
        {sortedPlatforms.map(([platform, url]) => (
          <ExternalLinkButton key={platform} platform={platform} url={url} />
        ))}
      </div>
    </div>
  );
}

export default ExternalLinks;
