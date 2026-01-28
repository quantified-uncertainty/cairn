import React from 'react';
import { ExternalLink, BookOpen, MessageSquare, GraduationCap } from 'lucide-react';

interface ExternalLinksData {
  wikipedia?: string;
  lesswrong?: string;
  alignmentForum?: string;
  eaForum?: string;
}

interface ExternalLinksProps {
  pageId: string;
  links?: ExternalLinksData;
}

const platformConfig = {
  wikipedia: {
    name: 'Wikipedia',
    icon: BookOpen,
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
    hoverColor: 'hover:bg-slate-200 dark:hover:bg-slate-700',
    borderColor: 'border-slate-300 dark:border-slate-600',
  },
  lesswrong: {
    name: 'LessWrong',
    icon: GraduationCap,
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    hoverColor: 'hover:bg-emerald-100 dark:hover:bg-emerald-900',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
  },
  alignmentForum: {
    name: 'Alignment Forum',
    icon: GraduationCap,
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  eaForum: {
    name: 'EA Forum',
    icon: MessageSquare,
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    hoverColor: 'hover:bg-indigo-100 dark:hover:bg-indigo-900',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
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
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
        border transition-colors duration-150 no-underline
        ${config.bgColor} ${config.textColor} ${config.hoverColor} ${config.borderColor}
      `}
    >
      <Icon size={14} />
      <span>{config.name}</span>
      <ExternalLink size={12} className="opacity-60" />
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

  // Order: Wikipedia first (as authoritative reference), then forums
  const orderedPlatforms: PlatformKey[] = ['wikipedia', 'lesswrong', 'alignmentForum', 'eaForum'];
  const sortedPlatforms = platforms.sort(([a], [b]) =>
    orderedPlatforms.indexOf(a) - orderedPlatforms.indexOf(b)
  );

  return (
    <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">
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
