import React from 'react';
import { getEntityById, getEntityHref, getEntityPath } from '../../data';
import { getEntityTypeIcon } from './EntityTypeIcon';
import { cn } from '../../lib/utils';

interface EntityLinkProps {
  /**
   * The entity ID to link to (e.g., "deceptive-alignment", "anthropic")
   * This is the stable identifier that won't change even if paths are reorganized
   */
  id: string;

  /**
   * Optional custom label. If not provided, uses the entity's title from the database
   */
  label?: string;

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
 *   <EntityLink id="anthropic" label="Anthropic AI" showIcon />
 *   <EntityLink id="interpretability" />
 *
 * The component looks up the entity in the database to:
 * 1. Get the correct URL path (from pathRegistry, built at build time)
 * 2. Get the display title if no label is provided
 * 3. Optionally show an icon based on entity type
 *
 * This means links won't break when content is reorganized - only the
 * pathRegistry needs to be rebuilt (happens automatically on build).
 */
export function EntityLink({
  id,
  label,
  showIcon = false,
  className = '',
  external = false,
}: EntityLinkProps) {
  // Look up entity in the database
  const entity = getEntityById(id);

  // Get the path from the registry (falls back to type-based path)
  const href = entity
    ? getEntityHref(id, entity.type)
    : getEntityPath(id) || `/knowledge-base/${id}/`;

  // Determine display label
  const displayLabel = label || entity?.title || formatIdAsTitle(id);

  // Get icon if requested
  const icon = showIcon && entity ? getEntityTypeIcon(entity.type) : null;

  // External link props
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-sm text-accent-foreground no-underline transition-colors hover:bg-muted/80',
        className
      )}
      {...externalProps}
    >
      {icon && <span className="text-xs">{icon}</span>}
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
