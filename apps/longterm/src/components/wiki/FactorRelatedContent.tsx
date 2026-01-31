import React from 'react';
import {
  getSubItemRelatedContent,
  type RelatedContent,
  type RelatedContentLink,
} from '@data/parameter-graph-data';

interface FactorRelatedContentProps {
  nodeId?: string;
  subItemLabel?: string;
  relatedContent?: RelatedContent;
  title?: string;
}

function LinkList({ links, category }: { links: RelatedContentLink[]; category: string }) {
  if (links.length === 0) return null;

  return (
    <div className="mb-3 last:mb-0">
      <h4 className="text-sm font-semibold mb-1.5">Related {category}</h4>
      <ul className="list-disc list-inside space-y-1">
        {links.map((link, i) => (
          <li key={i}>
            <a href={link.path} className="text-purple-600 dark:text-purple-400 hover:underline">
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FactorRelatedContent({
  nodeId,
  subItemLabel,
  relatedContent: directContent,
  title = "Related Content",
}: FactorRelatedContentProps) {
  const content = directContent ||
    (nodeId && subItemLabel ? getSubItemRelatedContent(nodeId, subItemLabel) : undefined);

  if (!content) {
    return null;
  }

  const hasContent =
    (content.risks?.length || 0) > 0 ||
    (content.responses?.length || 0) > 0 ||
    (content.models?.length || 0) > 0 ||
    (content.cruxes?.length || 0) > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border-b border-purple-500/20">
        <span>🔗</span>
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs text-purple-600/70 dark:text-purple-400/70">from YAML</span>
      </div>
      <div className="p-4 text-sm">
        {content.risks && <LinkList links={content.risks} category="Risks" />}
        {content.responses && <LinkList links={content.responses} category="Responses" />}
        {content.models && <LinkList links={content.models} category="Models" />}
        {content.cruxes && <LinkList links={content.cruxes} category="Cruxes" />}
      </div>
    </div>
  );
}

export default FactorRelatedContent;
