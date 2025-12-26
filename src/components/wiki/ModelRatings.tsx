/**
 * ModelRatings Component
 *
 * Displays multi-dimensional quality ratings for analytical models.
 * Shows a compact visual summary of novelty, rigor, actionability, and completeness.
 */

import React from 'react';
import { Lightbulb, FlaskConical, Target, CheckCircle2 } from 'lucide-react';

export interface ModelRatingsData {
  novelty?: number;       // 1-5: How original/innovative is the framing?
  rigor?: number;         // 1-5: How well-supported by evidence?
  actionability?: number; // 1-5: Does it suggest concrete interventions?
  completeness?: number;  // 1-5: How fleshed out is the analysis?
}

interface ModelRatingsProps {
  ratings: ModelRatingsData;
  showLabels?: boolean;
  size?: 'sm' | 'md';
}

const RATING_CONFIG = [
  { key: 'novelty', label: 'Novelty', icon: Lightbulb, description: 'Originality of framing' },
  { key: 'rigor', label: 'Rigor', icon: FlaskConical, description: 'Evidence quality' },
  { key: 'actionability', label: 'Actionability', icon: Target, description: 'Suggests interventions' },
  { key: 'completeness', label: 'Completeness', icon: CheckCircle2, description: 'Analysis depth' },
] as const;

function RatingDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="model-ratings__dots">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`model-ratings__dot ${i < value ? 'model-ratings__dot--filled' : ''}`}
        />
      ))}
    </div>
  );
}

export function ModelRatings({ ratings, showLabels = true, size = 'md' }: ModelRatingsProps) {
  const hasAnyRating = Object.values(ratings).some(v => v !== undefined);

  if (!hasAnyRating) {
    return null;
  }

  // Calculate average for summary
  const ratingValues = Object.values(ratings).filter((v): v is number => v !== undefined);
  const average = ratingValues.length > 0
    ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
    : null;

  return (
    <div className={`model-ratings model-ratings--${size}`}>
      <div className="model-ratings__header">
        <span className="model-ratings__title">Model Quality</span>
        {average && (
          <span className="model-ratings__average">{average}/5</span>
        )}
      </div>
      <div className="model-ratings__grid">
        {RATING_CONFIG.map(({ key, label, icon: Icon, description }) => {
          const value = ratings[key as keyof ModelRatingsData];
          if (value === undefined) return null;

          return (
            <div key={key} className="model-ratings__item" title={description}>
              <Icon size={size === 'sm' ? 14 : 16} className="model-ratings__icon" />
              {showLabels && <span className="model-ratings__label">{label}</span>}
              <RatingDots value={value} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModelRatings;
