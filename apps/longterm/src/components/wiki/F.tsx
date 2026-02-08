import React from 'react';
import { getFact } from '@data';
import { cn } from '@lib/utils';
import styles from './F.module.css';

interface FProps {
  /**
   * Entity ID (e.g., "openai", "anthropic")
   */
  e: string;

  /**
   * Fact ID within the entity (e.g., "valuation-2024", "revenue-arr-2025")
   */
  f: string;

  /**
   * Optional display override. If provided, this is shown instead of the fact value.
   * The canonical value is still shown in the tooltip.
   */
  children?: React.ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * F - Inline canonical fact component
 *
 * Renders a single fact value from the canonical facts store.
 * Shows a tooltip on hover with metadata (asOf date, source, notes).
 *
 * Usage:
 *   <F e="openai" f="valuation-2024" />
 *   <F e="anthropic" f="revenue-arr-2025">~$9B ARR</F>
 */
export function F({ e, f, children, className }: FProps) {
  const fact = getFact(e, f);

  if (!fact) {
    return (
      <span
        className={cn(
          'inline px-1 py-0.5 bg-destructive/10 text-destructive text-sm rounded',
          className
        )}
        title={`Missing fact: ${e}.${f}`}
      >
        {children || `[missing: ${e}.${f}]`}
      </span>
    );
  }

  const displayValue = children || fact.value || `[no value: ${e}.${f}]`;
  const isComputed = Boolean('computed' in fact && (fact as Record<string, unknown>).computed);
  const hasMetadata = fact.asOf || fact.source || fact.note || isComputed;

  // Simple span if no metadata to show in tooltip
  if (!hasMetadata) {
    return (
      <span
        className={cn('inline font-medium', className)}
        data-fact={`${e}.${f}`}
      >
        {displayValue}
      </span>
    );
  }

  return (
    <span className={styles.wrapper}>
      <span
        className={cn(
          'inline border-b border-dotted border-muted-foreground/40 cursor-help',
          className
        )}
        data-fact={`${e}.${f}`}
        tabIndex={0}
      >
        {displayValue}
      </span>
      <span
        className={cn(
          styles.tooltip,
          'absolute left-0 top-full mt-1 z-50 w-[220px] p-2.5 bg-popover text-popover-foreground border rounded-md shadow-md pointer-events-none opacity-0 invisible text-xs'
        )}
        role="tooltip"
      >
        <span className="block font-semibold text-foreground mb-1">
          {fact.value || displayValue}
        </span>
        {isComputed && (
          <span className="block text-blue-500 text-[10px] font-medium mb-0.5">
            Computed
          </span>
        )}
        {fact.asOf && (
          <span className="block text-muted-foreground">
            As of: {fact.asOf}
          </span>
        )}
        {fact.note && (
          <span className="block text-muted-foreground mt-1">
            {fact.note}
          </span>
        )}
        {fact.source && (
          <span className="block text-muted-foreground mt-1 truncate">
            Source: {fact.source}
          </span>
        )}
        <span className="block text-muted-foreground/60 mt-1.5 font-mono text-[10px]">
          {e}.{f}
        </span>
      </span>
    </span>
  );
}

export default F;
