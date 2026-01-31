import React from 'react';
import {
  getSubItemDebates,
  type KeyDebate,
} from '@data/parameter-graph-data';

interface FactorKeyDebatesProps {
  nodeId?: string;
  subItemLabel?: string;
  debates?: KeyDebate[];
  title?: string;
}

export function FactorKeyDebates({
  nodeId,
  subItemLabel,
  debates: directDebates,
  title = "Key Debates",
}: FactorKeyDebatesProps) {
  const debates = directDebates ||
    (nodeId && subItemLabel ? getSubItemDebates(nodeId, subItemLabel) : []);

  if (debates.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <span>💬</span>
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs text-amber-600/70 dark:text-amber-400/70">from YAML</span>
      </div>
      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-500/20">
              <th className="text-left py-2 pr-4 font-semibold">Debate</th>
              <th className="text-left py-2 font-semibold">Core Question</th>
            </tr>
          </thead>
          <tbody>
            {debates.map((debate, i) => (
              <tr key={i} className="border-b border-amber-500/10 last:border-0">
                <td className="py-2 pr-4 font-medium">{debate.topic}</td>
                <td className="py-2">{debate.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FactorKeyDebates;
