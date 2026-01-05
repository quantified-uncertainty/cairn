import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CredibilityBadgeProps {
  level: number; // 1-5
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const credibilityConfig: Record<number, { label: string; color: string; bgColor: string; description: string }> = {
  5: {
    label: 'Gold',
    color: '#b8860b',
    bgColor: 'rgba(184, 134, 11, 0.15)',
    description: 'Peer-reviewed, gold standard source',
  },
  4: {
    label: 'High',
    color: '#2e7d32',
    bgColor: 'rgba(46, 125, 50, 0.12)',
    description: 'High quality, established institution',
  },
  3: {
    label: 'Good',
    color: '#1976d2',
    bgColor: 'rgba(25, 118, 210, 0.12)',
    description: 'Good quality, reputable source',
  },
  2: {
    label: 'Mixed',
    color: '#f57c00',
    bgColor: 'rgba(245, 124, 0, 0.12)',
    description: 'Mixed quality, verify claims',
  },
  1: {
    label: 'Low',
    color: '#d32f2f',
    bgColor: 'rgba(211, 47, 47, 0.12)',
    description: 'Low credibility, use with caution',
  },
};

export function CredibilityBadge({
  level,
  size = 'sm',
  showLabel = false,
  className = '',
}: CredibilityBadgeProps) {
  const config = credibilityConfig[level] || credibilityConfig[3];

  const sizeClasses = {
    sm: 'text-[10px] px-1 py-0 gap-0.5',
    md: 'text-[11px] px-1.5 py-0.5 gap-1',
    lg: 'text-xs px-2 py-1 gap-1',
  };

  // Star display for small sizes
  const stars = '★'.repeat(level) + '☆'.repeat(5 - level);

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-sm font-medium border-transparent',
        sizeClasses[size],
        className
      )}
      title={`Credibility: ${config.label} (${level}/5) - ${config.description}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {showLabel ? (
        <>
          <span>{config.label}</span>
          <span className="opacity-70">({level})</span>
        </>
      ) : (
        <span className="tracking-tighter">{stars}</span>
      )}
    </Badge>
  );
}

interface CredibilityIndicatorProps {
  level: number;
  publicationName?: string;
  peerReviewed?: boolean;
  className?: string;
}

/**
 * More detailed credibility indicator with publication info
 */
export function CredibilityIndicator({
  level,
  publicationName,
  peerReviewed,
  className = '',
}: CredibilityIndicatorProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px]', className)}>
      <CredibilityBadge level={level} size="sm" />
      {publicationName && (
        <span className="text-(--sl-color-gray-3) italic">
          {publicationName}
        </span>
      )}
      {peerReviewed && (
        <Badge
          variant="outline"
          className="text-[9px] px-1 py-0 rounded-sm font-medium border-transparent"
          title="Peer-reviewed publication"
          style={{
            backgroundColor: 'rgba(46, 125, 50, 0.12)',
            color: '#2e7d32',
          }}
        >
          peer-reviewed
        </Badge>
      )}
    </span>
  );
}

export default CredibilityBadge;
