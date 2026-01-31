/**
 * WarningIndicatorsTable - Shows warning indicators with status and trends
 */

import React from 'react';
import type { WarningIndicator } from '@data/parameter-graph-data';

interface WarningIndicatorsTableProps {
  indicators: WarningIndicator[];
}

function getTrendIcon(trend?: WarningIndicator['trend']) {
  switch (trend) {
    case 'improving': return '↑';
    case 'worsening': return '↓';
    case 'stable': return '→';
    default: return '—';
  }
}

function getTrendColor(trend?: WarningIndicator['trend']) {
  switch (trend) {
    case 'improving': return 'text-green-400';
    case 'worsening': return 'text-red-400';
    case 'stable': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
}

function getConcernBadge(concern?: WarningIndicator['concern']) {
  switch (concern) {
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function WarningIndicatorsTable({ indicators }: WarningIndicatorsTableProps) {
  if (!indicators || indicators.length === 0) {
    return null;
  }

  return (
    <div className="warning-indicators">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-2 text-gray-400 font-medium">Indicator</th>
            <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
            <th className="text-center py-2 px-2 text-gray-400 font-medium">Trend</th>
            <th className="text-center py-2 px-2 text-gray-400 font-medium">Concern</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((indicator, i) => (
            <tr key={i} className="border-b border-gray-800">
              <td className="py-2 px-2 font-medium">{indicator.indicator}</td>
              <td className="py-2 px-2 text-gray-300">{indicator.status}</td>
              <td className={`py-2 px-2 text-center ${getTrendColor(indicator.trend)}`}>
                {getTrendIcon(indicator.trend)}
              </td>
              <td className="py-2 px-2 text-center">
                {indicator.concern && (
                  <span className={`inline-block px-2 py-0.5 rounded text-xs border ${getConcernBadge(indicator.concern)}`}>
                    {indicator.concern}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WarningIndicatorsCard({ indicators }: { indicators: WarningIndicator[] }) {
  if (!indicators || indicators.length === 0) return null;

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">Warning Indicators</h4>
      <WarningIndicatorsTable indicators={indicators} />
    </div>
  );
}

export default WarningIndicatorsTable;
