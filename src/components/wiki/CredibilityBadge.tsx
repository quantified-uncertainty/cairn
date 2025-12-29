import React from 'react';

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

  const sizeStyles = {
    sm: { fontSize: '10px', padding: '1px 4px', gap: '2px' },
    md: { fontSize: '11px', padding: '2px 6px', gap: '3px' },
    lg: { fontSize: '12px', padding: '3px 8px', gap: '4px' },
  };

  const style = sizeStyles[size];

  // Star display for small sizes
  const stars = '★'.repeat(level) + '☆'.repeat(5 - level);

  return (
    <span
      className={`credibility-badge credibility-badge--${level} ${className}`}
      title={`Credibility: ${config.label} (${level}/5) - ${config.description}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: style.gap,
        fontSize: style.fontSize,
        padding: style.padding,
        borderRadius: '3px',
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {showLabel ? (
        <>
          <span>{config.label}</span>
          <span style={{ opacity: 0.7 }}>({level})</span>
        </>
      ) : (
        <span style={{ letterSpacing: '-1px' }}>{stars}</span>
      )}
    </span>
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
  const config = credibilityConfig[level] || credibilityConfig[3];

  return (
    <span
      className={`credibility-indicator ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
      }}
    >
      <CredibilityBadge level={level} size="sm" />
      {publicationName && (
        <span style={{ color: 'var(--sl-color-gray-3)', fontStyle: 'italic' }}>
          {publicationName}
        </span>
      )}
      {peerReviewed && (
        <span
          style={{
            fontSize: '9px',
            padding: '1px 4px',
            borderRadius: '3px',
            backgroundColor: 'rgba(46, 125, 50, 0.12)',
            color: '#2e7d32',
          }}
          title="Peer-reviewed publication"
        >
          peer-reviewed
        </span>
      )}
    </span>
  );
}

export default CredibilityBadge;
