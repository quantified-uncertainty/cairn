import React from 'react';

interface ScenarioRatingsProps {
  changeability?: number;
  xriskImpact?: number;
  trajectoryImpact?: number;
  uncertainty?: number;
}

function getInterpretation(value: number, metric: string): string {
  const level = value <= 33 ? 'low' : value <= 66 ? 'medium' : 'high';

  const interpretations: Record<string, Record<string, string>> = {
    changeability: {
      low: "Very difficult to change",
      medium: "Moderately changeable",
      high: "Relatively easy to influence",
    },
    xriskImpact: {
      low: "Low existential risk potential",
      medium: "Moderate existential risk potential",
      high: "High existential risk potential",
    },
    trajectoryImpact: {
      low: "Low long-term impact",
      medium: "Moderate long-term impact",
      high: "High long-term impact",
    },
    uncertainty: {
      low: "Lower uncertainty",
      medium: "Moderate uncertainty",
      high: "High uncertainty",
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
