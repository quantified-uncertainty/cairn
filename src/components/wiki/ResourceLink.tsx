import React from 'react';
import { getResourceById, getResourceCredibility, getResourcePublication } from '../../data';
import { CredibilityBadge } from './CredibilityBadge';
import { ResourceTags } from './ResourceTags';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import './wiki.css';

interface ResourceLinkProps {
  id: string;
  label?: string;
  children?: React.ReactNode;
  showType?: boolean;
  showCredibility?: boolean;
  className?: string;
}

function getResourceTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    paper: '📄',
    book: '📚',
    blog: '✏️',
    report: '📋',
    talk: '🎤',
    podcast: '🎧',
    government: '🏛️',
    reference: '📖',
    web: '🔗',
  };
  return icons[type] || '🔗';
}

function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * ResourceLink - A component for linking to external resources by ID
 * Uses pure CSS hover with a bridge for hoverable popups
 */
export function ResourceLink({
  id,
  label,
  children,
  showType = false,
  showCredibility = false,
  className = '',
}: ResourceLinkProps) {
  const resource = getResourceById(id);

  if (!resource) {
    return (
      <span
        className={`resource-link resource-link--missing ${className}`}
        title={`Resource not found: ${id}`}
      >
        [{id}]
      </span>
    );
  }

  const displayLabel = children || label || resource.title;
  const icon = showType ? getResourceTypeIcon(resource.type) : null;
  const detailUrl = `/browse/resources/${id}/`;
  const credibility = getResourceCredibility(resource);
  const publication = getResourcePublication(resource);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('resource-link__anchor', className)}
        >
          {icon && <span className="resource-link__icon">{icon}</span>}
          <span className="resource-link__label">{displayLabel}</span>
          {showCredibility && credibility && (
            <span className="ml-1">
              <CredibilityBadge level={credibility} size="sm" />
            </span>
          )}
          <span className="resource-link__external">↗</span>
        </a>
      </HoverCardTrigger>

      <HoverCardContent className="w-[280px] text-sm" align="start">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-(--sl-color-gray-3)">
            {getResourceTypeIcon(resource.type)} {resource.type}
          </span>
          {credibility && (
            <CredibilityBadge level={credibility} size="sm" />
          )}
        </div>

        {/* Publication info */}
        {publication && (
          <div className="text-[10px] text-(--sl-color-gray-3) italic mb-1">
            {publication.name}
            {publication.peer_reviewed && ' (peer-reviewed)'}
          </div>
        )}

        <div className="font-semibold mb-1 text-sm leading-tight">
          {resource.title}
        </div>

        {resource.authors && resource.authors.length > 0 && (
          <div className="text-xs text-(--sl-color-gray-3) mb-2">
            {resource.authors.slice(0, 3).join(', ')}
            {resource.authors.length > 3 && ' et al.'}
            {resource.published_date && ` (${resource.published_date.slice(0, 4)})`}
          </div>
        )}

        {resource.summary && (
          <p className="text-xs text-(--sl-color-gray-2) leading-relaxed mb-2">
            {truncateText(resource.summary, 180)}
          </p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-1.5 mb-2">
            <ResourceTags tags={resource.tags} limit={4} size="sm" />
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-2 py-1 text-xs font-medium rounded bg-(--sl-color-accent) text-white hover:opacity-90 transition-opacity"
          >
            Source ↗
          </a>
          <a 
            href={detailUrl} 
            className="flex-1 text-center px-2 py-1 text-xs font-medium rounded border border-(--sl-color-gray-5) text-(--sl-color-text) hover:bg-(--sl-color-gray-6) transition-colors"
          >
            Notes
          </a>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * ResourceCite - Inline citation style
 */
interface ResourceCiteProps {
  id: string;
  style?: 'numeric' | 'author-year';
  number?: number;
  className?: string;
}

export function ResourceCite({
  id,
  style = 'author-year',
  number,
  className = '',
}: ResourceCiteProps) {
  const resource = getResourceById(id);

  if (!resource) {
    return <span className="resource-cite resource-cite--missing">[?]</span>;
  }

  let citeText: string;
  if (style === 'numeric' && number !== undefined) {
    citeText = `[${number}]`;
  } else {
    const firstAuthor = resource.authors?.[0]?.split(' ').pop() || 'Unknown';
    const year = resource.published_date?.slice(0, 4) || '';
    citeText = `(${firstAuthor}${year ? ` ${year}` : ''})`;
  }

  const tooltip = [resource.title, resource.summary].filter(Boolean).join('\n\n');

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`resource-cite ${className}`}
      title={tooltip}
    >
      {citeText}
    </a>
  );
}

export { ResourceLink as R };

export default ResourceLink;
