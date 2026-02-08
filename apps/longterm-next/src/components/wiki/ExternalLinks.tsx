import React from "react";
import { ExternalLink, BookOpen, MessageSquare, GraduationCap, Briefcase } from "lucide-react";

// Re-use the canonical type from the data layer
import type { ExternalLinksData } from "@/data";

const platformConfig = {
  wikipedia: { name: "Wikipedia", icon: BookOpen },
  wikidata: { name: "Wikidata", icon: BookOpen },
  lesswrong: { name: "LessWrong", icon: GraduationCap },
  alignmentForum: { name: "Alignment Forum", icon: GraduationCap },
  eaForum: { name: "EA Forum", icon: MessageSquare },
  stampy: { name: "AI Safety Info", icon: MessageSquare },
  arbital: { name: "Arbital", icon: BookOpen },
  eightyK: { name: "80,000 Hours", icon: Briefcase },
};

type PlatformKey = keyof typeof platformConfig;

export function ExternalLinks({ pageId, links }: { pageId: string; links?: ExternalLinksData }) {
  if (!links) return null;

  const platforms = Object.entries(links).filter(([_, url]) => url) as [PlatformKey, string][];
  if (platforms.length === 0) return null;

  const orderedPlatforms: PlatformKey[] = ["wikipedia", "wikidata", "eightyK", "lesswrong", "alignmentForum", "eaForum", "stampy", "arbital"];
  const sorted = platforms.sort(([a], [b]) => orderedPlatforms.indexOf(a) - orderedPlatforms.indexOf(b));

  return (
    <div className="mb-8 mt-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm text-muted-foreground">See also:</span>
        {sorted.map(([platform, url]) => {
          const config = platformConfig[platform];
          const Icon = config.icon;
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              <Icon size={14} />
              <span>{config.name}</span>
              <ExternalLink size={10} className="opacity-50" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default ExternalLinks;
