import React from 'react';
import { getEntityById, getEntityHref, getEntityPath, getPageById } from '@data';
import { getEntityTypeIcon } from './EntityTypeIcon';
import { cn } from '@lib/utils';
import styles from './EntityLink.module.css';

interface EntityLinkProps {
  /**
   * The entity ID to link to (e.g., "deceptive-alignment", "anthropic")
   * This is the stable identifier that won't change even if paths are reorganized
   */
  id: string;

  /**
   * Optional custom label. If not provided, uses the entity's title from the database.
   * Children take priority over label if both are provided.
   */
  label?: string;

  /**
   * Children can be used as the display text (standard React pattern).
   * Takes priority over the label prop.
   */
  children?: React.ReactNode;

  /**
   * Whether to show the entity type icon (default: false)
   */
  showIcon?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * If true, opens link in new tab
   */
  external?: boolean;
}

/**
 * EntityLink - A stable link component that uses entity IDs instead of paths
 *
 * Usage:
 *   <EntityLink id="deceptive-alignment" />
 *   <EntityLink id="anthropic">Anthropic AI</EntityLink>
 *   <EntityLink id="interpretability" label="Interp Research" showIcon />
 *
 * The component looks up the entity in the database to:
 * 1. Get the correct URL path (from pathRegistry, built at build time)
 * 2. Get the display title if no label/children provided
 * 3. Optionally show an icon based on entity type
 *
 * Display text priority: children > label prop > entity.title > formatted ID
 *
 * This means links won't break when content is reorganized - only the
 * pathRegistry needs to be rebuilt (happens automatically on build).
 */
/**
 * Truncate text to a maximum length
 */
function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format entity type for display
 */
function formatEntityType(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function EntityLink({
  id,
  label,
  children,
  showIcon = false,
  className = '',
  external = false,
}: EntityLinkProps) {
  // Look up entity in the database
  const entity = getEntityById(id);
  const page = getPageById(id);

  // Get the path from the registry (falls back to type-based path)
  const href = entity
    ? getEntityHref(id, entity.type)
    : getEntityPath(id) || `/knowledge-base/${id}/`;

  // Determine display label - children take priority, then label prop, then entity title
  const displayLabel = children || label || entity?.title || formatIdAsTitle(id);

  // Get icon component if requested
  const IconComponent = showIcon && entity ? getEntityTypeIcon(entity.type) : null;

  // External link props
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  // Get summary for hover card (prefer llmSummary, fall back to description)
  const summary = page?.llmSummary || page?.description || entity?.description;
  const entityType = entity?.type;
  const TypeIconComponent = entity ? getEntityTypeIcon(entity.type) : null;

  // If we have hover info, show CSS-only tooltip (no JS required)
  if (summary || entityType) {
    return (
      <span className={styles.wrapper}>
        <a
          href={href}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-sm text-accent-foreground no-underline transition-colors hover:bg-muted/80',
            className
          )}
          {...externalProps}
        >
          {IconComponent && <IconComponent className="w-3 h-3" />}
          <span>{displayLabel}</span>
        </a>
        {/* CSS-only hover tooltip - no JavaScript required */}
        <span
          className={cn(styles.tooltip, 'absolute left-0 top-full mt-1 z-50 w-[280px] p-3 bg-popover text-popover-foreground border rounded-md shadow-md pointer-events-none opacity-0 invisible')}
          role="tooltip"
        >
          {entityType && (
            <span className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
              {TypeIconComponent && <TypeIconComponent className="w-3 h-3" />}
              <span className="uppercase tracking-wide">{formatEntityType(entityType)}</span>
            </span>
          )}
          <span className="block font-semibold text-foreground mb-1.5 text-sm">
            {entity?.title || formatIdAsTitle(id)}
          </span>
          {summary && (
            <span className="block text-muted-foreground text-[0.8rem] leading-snug">
              {truncateText(summary, 200)}
            </span>
          )}
          {page?.quality && (
            <span className="block mt-2 text-xs text-muted-foreground">
              Quality: {page.quality}/100
            </span>
          )}
        </span>
      </span>
    );
  }

  // No hover info available, return plain link
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-sm text-accent-foreground no-underline transition-colors hover:bg-muted/80',
        className
      )}
      {...externalProps}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      <span>{displayLabel}</span>
    </a>
  );
}

/**
 * Format an ID as a readable title
 * e.g., "deceptive-alignment" -> "Deceptive Alignment"
 */
function formatIdAsTitle(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * MultiEntityLink - Link to multiple entities in a comma-separated list
 */
interface MultiEntityLinkProps {
  ids: string[];
  showIcons?: boolean;
  className?: string;
}

export function MultiEntityLinks({
  ids,
  showIcons = false,
  className = '',
}: MultiEntityLinkProps) {
  return (
    <span className={cn('inline-flex flex-wrap gap-1', className)}>
      {ids.map((id, index) => (
        <React.Fragment key={id}>
          <EntityLink id={id} showIcon={showIcons} />
          {index < ids.length - 1 && ', '}
        </React.Fragment>
      ))}
    </span>
  );
}

export default EntityLink;
