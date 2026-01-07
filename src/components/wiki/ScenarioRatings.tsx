import React from 'react';

interface ScenarioRatingsProps {
  changeability?: number;
  xriskImpact?: number;
  trajectoryImpact?: number;
  uncertainty?: number;
}

function getInterpretation(value: number, metric: string): string {
  const level = value <= 33 ? 'low' : value <= 66 ? 'medium' : 'high';

  // Interpretations for scenario pages (typically negative outcomes)
  const interpretations: Record<string, Record<string, string>> = {
    changeability: {
      low: "Hard to prevent or redirect",
      medium: "Somewhat influenceable",
      high: "More tractable to address",
    },
    xriskImpact: {
      low: "Limited direct extinction risk",
      medium: "Meaningful extinction risk",
      high: "Substantial extinction risk",
    },
    trajectoryImpact: {
      low: "Minor effect on long-term welfare",
      medium: "Significant effect on long-term welfare",
      high: "Major effect on long-term welfare",
    },
    uncertainty: {
      low: "Relatively confident assessment",
      medium: "Moderate uncertainty in estimates",
      high: "High uncertainty; estimates speculative",
    },
  };

  return interpretations[metric]?.[level] || '';
}

export function ScenarioRatings({
  changeability,
  xriskImpact,
  trajectoryImpact,
  uncertainty,
}: ScenarioRatingsProps) {
  const metrics = [
    { key: 'changeability', label: 'Changeability', value: changeability },
    { key: 'xriskImpact', label: 'X-risk Impact', value: xriskImpact },
    { key: 'trajectoryImpact', label: 'Trajectory Impact', value: trajectoryImpact },
    { key: 'uncertainty', label: 'Uncertainty', value: uncertainty },
  ].filter(m => m.value !== undefined);

  if (metrics.length === 0) return null;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 pr-4 font-semibold">Metric</th>
          <th className="text-left py-2 pr-4 font-semibold">Score</th>
          <th className="text-left py-2 font-semibold">Interpretation</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map(({ key, label, value }) => (
          <tr key={key} className="border-b last:border-0">
            <td className="py-2 pr-4 font-medium">{label}</td>
            <td className="py-2 pr-4 tabular-nums">{value}/100</td>
            <td className="py-2">{getInterpretation(value!, key)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ScenarioRatings;
