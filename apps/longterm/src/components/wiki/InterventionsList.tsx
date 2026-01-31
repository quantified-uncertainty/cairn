/**
 * InterventionsList - Shows interventions that address a factor
 *
 * Displays linked interventions with effect direction and strength
 */

import React from 'react';
import type { AddressedBy } from '@data/parameter-graph-data';

interface InterventionsListProps {
  interventions: AddressedBy[];
  compact?: boolean;
}

function getEffectIcon(effect: AddressedBy['effect']) {
  switch (effect) {
    case 'positive': return '↑';
    case 'negative': return '↓';
    case 'mixed': return '↕';
    default: return '?';
  }
}

function getEffectColor(effect: AddressedBy['effect']) {
  switch (effect) {
    case 'positive': return 'text-green-400';
    case 'negative': return 'text-red-400';
    case 'mixed': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
}

function getStrengthDots(strength?: AddressedBy['strength']) {
  switch (strength) {
    case 'strong': return '●●●';
    case 'medium': return '●●○';
    case 'weak': return '●○○';
    default: return '○○○';
  }
}

export function InterventionsList({ interventions, compact = false }: InterventionsListProps) {
  if (!interventions || interventions.length === 0) {
    return <div className="text-gray-500 text-sm">No linked interventions</div>;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {interventions.map((intervention, i) => (
          <a
            key={i}
            href={intervention.path}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm border border-gray-700 hover:border-gray-500 transition-colors ${getEffectColor(intervention.effect)}`}
          >
            <span>{getEffectIcon(intervention.effect)}</span>
            <span>{intervention.title || intervention.path.split('/').pop()}</span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="interventions-list">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-2 text-gray-400 font-medium">Intervention</th>
            <th className="text-center py-2 px-2 text-gray-400 font-medium">Effect</th>
            <th className="text-center py-2 px-2 text-gray-400 font-medium">Strength</th>
          </tr>
        </thead>
        <tbody>
          {interventions.map((intervention, i) => (
            <tr key={i} className="border-b border-gray-800">
              <td className="py-2 px-2">
                <a href={intervention.path} className="text-blue-400 hover:underline">
                  {intervention.title || intervention.path.split('/').pop()}
                </a>
              </td>
              <td className={`py-2 px-2 text-center ${getEffectColor(intervention.effect)}`}>
                {getEffectIcon(intervention.effect)} {intervention.effect}
              </td>
              <td className="py-2 px-2 text-center text-gray-400">
                <span title={intervention.strength || 'unknown'}>
                  {getStrengthDots(intervention.strength)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InterventionsCard({ interventions }: { interventions: AddressedBy[] }) {
  if (!interventions || interventions.length === 0) return null;

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">Addressed By</h4>
      <InterventionsList interventions={interventions} />
    </div>
  );
}

export default InterventionsList;
