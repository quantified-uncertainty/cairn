import React from 'react';
import { getResourcesByIds, getResourceById, resources } from '@data';
import type { Resource } from '@data/schema';
import { Badge } from '../ui/badge';
import { cn } from '@lib/utils';
import { getResourceTypeLabel } from './shared/style-config';

/**
 * Get icon for resource type
 */
function getResourceTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'paper':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'blog':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case 'talk':
    case 'podcast':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    case 'government':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="22" x2="9" y2="2" />
          <line x1="14" y1="22" x2="14" y2="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
  }
}


interface ResourceListProps {
  /**
   * Array of resource IDs to display
   */
  ids: string[];

  /**
   * Optional title for the list (default: "Sources & References")
   */
  title?: string;

  /**
   * Whether to show summaries (default: false)
   */
  showSummaries?: boolean;

  /**
   * Whether to show key points (default: false)
   */
  showKeyPoints?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * ResourceList - A formatted list of resources
 *
 * Usage in MDX:
 *   <ResourceList ids={["ai-control-2023", "superintelligence-2014"]} />
 *   <ResourceList ids={["paper-1", "paper-2"]} title="Key Papers" showSummaries />
 */
export function ResourceList({
  ids,
  title = 'Sources & References',
  showSummaries = false,
  showKeyPoints = false,
  className = '',
}: ResourceListProps) {
  const resolvedResources = getResourcesByIds(ids);

  if (resolvedResources.length === 0) {
    return null;
  }

  return (
    <div className={cn('my-8', className)}>
      {title && (
        <div className="text-sm font-semibold text-muted-foreground mb-3">{title}</div>
      )}
      <ul className="m-0 p-0 list-none space-y-3">
        {resolvedResources.map((resource) => (
          <li key={resource.id} className="flex items-start gap-3">
            <span
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-muted-foreground"
              title={getResourceTypeLabel(resource.type)}
            >
              {getResourceTypeIcon(resource.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-foreground font-medium hover:underline"
                >
                  {resource.title}
                </a>
                {resource.authors && resource.authors.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    — {resource.authors.join(', ')}
                  </span>
                )}
                {resource.published_date && (
                  <span className="text-sm text-muted-foreground">
                    ({resource.published_date})
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {getResourceTypeLabel(resource.type)}
                </Badge>
              </div>
              {showSummaries && resource.summary && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {resource.summary}
                </p>
              )}
              {showKeyPoints && resource.key_points && resource.key_points.length > 0 && (
                <ul className="mt-2 ml-4 text-sm text-muted-foreground list-disc space-y-1">
                  {resource.key_points.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ResourceBibliographyProps {
  /**
   * Array of resource IDs, or "all" to show all resources
   */
  ids?: string[] | 'all';

  /**
   * Filter by type
   */
  type?: string;

  /**
   * Group by type (default: true)
   */
  groupByType?: boolean;

  className?: string;
}

/**
 * ResourceBibliography - Full bibliography display
 *
 * Usage:
 *   <ResourceBibliography ids={["id1", "id2"]} />
 *   <ResourceBibliography ids="all" groupByType />
 *   <ResourceBibliography type="paper" />
 */
export function ResourceBibliography({
  ids,
  type,
  groupByType = true,
  className = '',
}: ResourceBibliographyProps) {
  let resolvedResources: Resource[];

  if (ids === 'all') {
    resolvedResources = [...resources];
  } else if (ids) {
    resolvedResources = getResourcesByIds(ids);
  } else {
    resolvedResources = [...resources];
  }

  // Filter by type if specified
  if (type) {
    resolvedResources = resolvedResources.filter((r) => r.type === type);
  }

  // Sort by title
  resolvedResources.sort((a, b) => a.title.localeCompare(b.title));

  if (resolvedResources.length === 0) {
    return <p className="text-muted-foreground italic">No resources found.</p>;
  }

  if (!groupByType) {
    return (
      <div className={className}>
        <ResourceList ids={resolvedResources.map((r) => r.id)} title="" showSummaries />
      </div>
    );
  }

  // Group by type
  const grouped = resolvedResources.reduce(
    (acc, resource) => {
      const t = resource.type || 'web';
      if (!acc[t]) acc[t] = [];
      acc[t].push(resource);
      return acc;
    },
    {} as Record<string, Resource[]>
  );

  const typeOrder = ['paper', 'book', 'report', 'blog', 'talk', 'podcast', 'government', 'reference', 'web'];

  return (
    <div className={className}>
      {typeOrder
        .filter((t) => grouped[t]?.length > 0)
        .map((t) => (
          <div key={t} className="mb-8">
            <h3 className="text-lg font-semibold mb-3">
              {getResourceTypeLabel(t)}s ({grouped[t].length})
            </h3>
            <ResourceList ids={grouped[t].map((r) => r.id)} title="" showSummaries />
          </div>
        ))}
    </div>
  );
}

export default ResourceList;
