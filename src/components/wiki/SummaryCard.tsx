import React from 'react';
import './wiki.css';

type CardVariant = 'default' | 'highlight' | 'warning' | 'success';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  confidence?: 'high' | 'medium' | 'low';
  link?: string;
  variant?: CardVariant;
  icon?: string;
}

const variantStyles: Record<CardVariant, { bg: string; border: string; accent: string }> = {
  default: { bg: 'var(--sl-color-gray-6)', border: 'var(--sl-color-gray-5)', accent: 'var(--sl-color-accent)' },
  highlight: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', accent: '#3b82f6' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', accent: '#f59e0b' },
  success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', accent: '#22c55e' },
};

const confidenceLabels = {
  high: { text: 'High confidence', color: '#22c55e' },
  medium: { text: 'Medium confidence', color: '#f59e0b' },
  low: { text: 'Low confidence', color: '#ef4444' },
};

export function SummaryCard({
  title,
  value,
  subtitle,
  confidence,
  link,
  variant = 'default',
  icon,
}: SummaryCardProps) {
  const style = variantStyles[variant];

  const cardContent = (
    <div
      className={`summary-card summary-card--${variant}`}
    >
      <div className="summary-card__header">
        {icon && <span className="summary-card__icon">{icon}</span>}
        <span className="summary-card__title">{title}</span>
      </div>
      <div className="summary-card__value">
        {value}
      </div>
      {subtitle && (
        <div className="summary-card__subtitle">{subtitle}</div>
      )}
      {confidence && (
        <div
          className="summary-card__confidence"
          style={{ color: confidenceLabels[confidence].color }}
        >
          {confidenceLabels[confidence].text}
        </div>
      )}
    </div>
  );

  if (link) {
    return <a href={link} className="summary-card__wrapper">{cardContent}</a>;
  }

  return cardContent;
}

interface CardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function CardGrid({ children, columns = 3 }: CardGridProps) {
  return (
    <div className={`card-grid card-grid--${columns}-col`}>
      {children}
    </div>
  );
}

export default SummaryCard;
