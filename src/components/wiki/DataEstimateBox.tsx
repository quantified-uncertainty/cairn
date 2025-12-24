/**
 * Data-aware EstimateBox Component
 *
 * Wrapper that supports both:
 * 1. Inline data via `estimates` prop (backwards compatible)
 * 2. Data lookup via `dataId` prop (pulls from YAML data)
 */

import React from 'react';
import { EstimateBox } from './EstimateBox';
import { getEstimateBoxData } from '../../data';

interface Estimate {
  source: string;
  value: string;
  date?: string;
  url?: string;
  notes?: string;
}

interface DataEstimateBoxProps {
  // Either provide dataId to fetch from YAML...
  dataId?: string;
  // ...or provide inline data
  variable?: string;
  description?: string;
  estimates?: Estimate[];
  unit?: string;
  aggregateRange?: string;
}

export function DataEstimateBox({
  dataId,
  variable: inlineVariable,
  description: inlineDescription,
  estimates: inlineEstimates,
  unit: inlineUnit,
  aggregateRange: inlineAggregateRange,
}: DataEstimateBoxProps) {
  // If dataId provided, fetch from data
  if (dataId) {
    const data = getEstimateBoxData(dataId);
    if (!data) {
      return (
        <div className="estimate-box estimate-box--empty">
          <p>No estimate data found for ID: {dataId}</p>
        </div>
      );
    }
    return (
      <EstimateBox
        variable={data.variable}
        description={data.description}
        estimates={data.estimates}
        unit={data.unit}
        aggregateRange={data.aggregateRange}
      />
    );
  }

  // Use inline data
  if (!inlineVariable || !inlineEstimates) {
    return (
      <div className="estimate-box estimate-box--empty">
        <p>EstimateBox requires either dataId or variable+estimates props</p>
      </div>
    );
  }

  return (
    <EstimateBox
      variable={inlineVariable}
      description={inlineDescription}
      estimates={inlineEstimates}
      unit={inlineUnit}
      aggregateRange={inlineAggregateRange}
    />
  );
}

export default DataEstimateBox;
