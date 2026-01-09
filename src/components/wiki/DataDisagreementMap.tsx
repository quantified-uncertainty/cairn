/**
 * Data-aware DisagreementMap Component
 *
 * Wrapper that supports both:
 * 1. Inline data via `positions` prop (backwards compatible)
 * 2. Data lookup via `topic` prop (pulls from YAML data)
 */

import React from 'react';
import { DisagreementMap } from './DisagreementMap';
import { getDisagreementMapData } from '../../data';
import { Card } from '../ui/card';

interface Position {
  actor?: string;
  position?: string;
  estimate?: string;
  confidence?: 'low' | 'medium' | 'high';
  source?: string;
  url?: string;
  name?: string;
  description?: string;
  proponents?: string[];
  strength?: number;
}

interface DataDisagreementMapProps {
  topic: string;
  description?: string;
  // If positions provided, use them; otherwise fetch from data
  positions?: Position[];
  spectrum?: {
    low: string;
    high: string;
  };
  // If true, merge inline positions with data positions
  mergeWithData?: boolean;
}

export function DataDisagreementMap({
  topic,
  description,
  positions: inlinePositions,
  spectrum,
  mergeWithData = false,
}: DataDisagreementMapProps) {
  // Get positions from data
  const dataPositions = getDisagreementMapData(topic);

  // Determine which positions to use
  let positions: Position[];

  if (inlinePositions && inlinePositions.length > 0) {
    if (mergeWithData && dataPositions.length > 0) {
      // Merge inline with data, inline takes precedence
      const inlineActors = new Set(inlinePositions.map(p => p.actor || p.name));
      const nonDuplicateData = dataPositions.filter(p => !inlineActors.has(p.actor));
      positions = [...inlinePositions, ...nonDuplicateData];
    } else {
      // Use inline only
      positions = inlinePositions;
    }
  } else if (dataPositions.length > 0) {
    // Use data only
    positions = dataPositions;
  } else {
    // No data available
    positions = [];
  }

  if (positions.length === 0) {
    return (
      <Card className="my-6 p-4 border-dashed">
        <p className="text-muted-foreground m-0">No position data available for topic: {topic}</p>
      </Card>
    );
  }

  return (
    <DisagreementMap
      topic={topic}
      description={description}
      positions={positions}
      spectrum={spectrum}
    />
  );
}

export default DataDisagreementMap;
