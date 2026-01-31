import React from 'react';
import {
  getSubItemRatings,
  type SubItemRatings,
} from '@data/parameter-graph-data';

function getInterpretation(value: number, metric: keyof SubItemRatings): string {
  const interpretations: Record<keyof SubItemRatings, Record<string, string>> = {
    changeability: {
      low: "Very difficult to change",
      medium: "Moderately changeable",
      high: "Relatively easy to influence",
    },
    xriskImpact: {
      low: "Low direct existential impact",
      medium: "Moderate existential impact",
      high: "High direct existential impact",
    },
    trajectoryImpact: {
      low: "Low long-term effects",
      medium: "Moderate long-term effects",
      high: "High long-term effects",
    },
    uncertainty: {
      low: "Lower uncertainty",
      medium: "Moderate uncertainty",
      high: "High uncertainty",
    },
  };

  const level = value <= 33 ? 'low' : value <= 66 ? 'medium' : 'high';
  return interpretations[metric][level];
}

interface FactorRatingsProps {
  nodeId?: string;
  subItemLabel?: string;
  ratings?: SubItemRatings;
  title?: string;
}

export function FactorRatings({
  nodeId,
  subItemLabel,
  ratings: directRatings,
  title = "Ratings",
}: FactorRatingsProps) {
  const ratings = directRatings ||
    (nodeId && subItemLabel ? getSubItemRatings(nodeId, subItemLabel) : undefined);

  if (!ratings) {
    return null;
  }

  const metrics: Array<{ key: keyof SubItemRatings; label: string }> = [
    { key: 'changeability', label: 'Changeability' },
    { key: 'xriskImpact', label: 'X-risk Impact' },
    { key: 'trajectoryImpact', label: 'Trajectory Impact' },
    { key: 'uncertainty', label: 'Uncertainty' },
  ];

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
        <span>📊</span>
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs text-blue-600/70 dark:text-blue-400/70">from YAML</span>
      </div>
      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-blue-500/20">
              <th className="text-left py-2 pr-4 font-semibold">Metric</th>
              <th className="text-left py-2 pr-4 font-semibold">Score</th>
              <th className="text-left py-2 font-semibold">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label }) => {
              const value = ratings[key];
              if (value === undefined) return null;
              return (
                <tr key={key} className="border-b border-blue-500/10 last:border-0">
                  <td className="py-2 pr-4 font-medium">{label}</td>
                  <td className="py-2 pr-4 tabular-nums">{value}/100</td>
                  <td className="py-2">{getInterpretation(value, key)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FactorRatings;
