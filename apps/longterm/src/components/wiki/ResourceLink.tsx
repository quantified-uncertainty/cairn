import React from 'react';
import { getResourceById, getResourceCredibility, getResourcePublication } from '../../data';
import { CredibilityBadge } from './CredibilityBadge';
import { ResourceTags } from './ResourceTags';
import { cn } from '../../lib/utils';
import styles from './ResourceLink.module.css';

interface ResourceLinkProps {
  id: string;
  label?: string;
  children?: React.ReactNode;
  showType?: boolean;
  showCredibility?: boolean;
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const typeIcons: Record<string, string> = {
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

function getResourceTypeIcon(type: string): string {
  return typeIcons[type] || '🔗';
}

function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// Sub-components
// ============================================================================

function CardHeader({ type, credibility }: { type: string; credibility?: string | null }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-[0.7rem] uppercase tracking-tight text-muted-foreground">
        {getResourceTypeIcon(type)} {type}
      </span>
      {credibility && <CredibilityBadge level={credibility} size="sm" />}
    </div>
  );
}

function CardButton({ href, primary, external, children }: { href: string; primary?: boolean; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={cn(
        "flex-1 px-2.5 py-1.5 text-xs font-medium text-center no-underline rounded transition-colors",
        primary
          ? "bg-accent-foreground text-background hover:bg-accent-foreground/90"
          : "bg-muted text-foreground hover:bg-muted/80"
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

// ============================================================================
// Main Component
// ============================================================================

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
        className={cn("text-destructive italic", className)}
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
    <span className={styles.wrapper}>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("text-accent-foreground no-underline font-medium hover:underline", className)}
      >
        {icon && <span className="mr-1">{icon}</span>}
        <span>{displayLabel}</span>
        {showCredibility && credibility && (
          <span className="ml-1">
            <CredibilityBadge level={credibility} size="sm" />
          </span>
        )}
        <span className="text-xs ml-0.5 opacity-70">↗</span>
      </a>

      {/* CSS-only hover tooltip - no JavaScript required */}
      <span
        className={cn(styles.tooltip, "absolute left-0 top-full mt-1 z-50 w-[280px] p-2.5 bg-popover text-popover-foreground border rounded-md shadow-md pointer-events-none")}
        role="tooltip"
      >
        <CardHeader type={resource.type} credibility={credibility} />

        {publication && (
          <span className="text-[10px] text-muted-foreground italic mb-1 block">
            {publication.name}
            {publication.peer_reviewed && ' (peer-reviewed)'}
          </span>
        )}

        <span className="block font-semibold text-foreground mb-1.5 text-[0.8rem]">
          {resource.title}
        </span>

        {resource.authors && resource.authors.length > 0 && (
          <span className="block text-[0.8rem] text-muted-foreground mb-1.5">
            {resource.authors.slice(0, 3).join(', ')}
            {resource.authors.length > 3 && ' et al.'}
            {resource.published_date && ` (${resource.published_date.slice(0, 4)})`}
          </span>
        )}

        {resource.summary && (
          <span className="block text-[0.8rem] text-muted-foreground mb-2.5 leading-snug">
            {truncateText(resource.summary, 180)}
          </span>
        )}

        <span className="block mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <a href={detailUrl} className="text-accent-foreground hover:underline no-underline pointer-events-auto">
            View our notes →
          </a>
        </span>
      </span>
    </span>
  );
}

// ============================================================================
// ResourceCite - Inline citation style
// ============================================================================

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
    return <span className="text-destructive">[?]</span>;
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
      className={cn("text-accent-foreground no-underline hover:underline", className)}
      title={tooltip}
    >
      {citeText}
    </a>
  );
}

export { ResourceLink as R };

export default ResourceLink;
