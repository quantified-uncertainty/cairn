import React from 'react';
import { getSubItemScope } from '../../data/parameter-graph-data';

interface FactorScopeProps {
  nodeId?: string;
  subItemLabel?: string;
  scope?: string;
  title?: string;
}

export function FactorScope({
  nodeId,
  subItemLabel,
  scope: directScope,
  title = "Scope",
}: FactorScopeProps) {
  const scope = directScope ||
    (nodeId && subItemLabel ? getSubItemScope(nodeId, subItemLabel) : undefined);

  if (!scope) {
    return null;
  }

  // Parse scope into includes/excludes
  const lines = scope.split('\n').filter(line => line.trim());
  const includes: string[] = [];
  const excludes: string[] = [];
  let currentSection: 'includes' | 'excludes' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('includes:')) {
      currentSection = 'includes';
      const content = trimmed.slice('includes:'.length).trim();
      if (content) includes.push(content);
    } else if (trimmed.toLowerCase().startsWith('excludes:')) {
      currentSection = 'excludes';
      const content = trimmed.slice('excludes:'.length).trim();
      if (content) excludes.push(content);
    } else if (currentSection === 'includes') {
      includes.push(trimmed);
    } else if (currentSection === 'excludes') {
      excludes.push(trimmed);
    }
  }

  return (
    <div className="rounded-lg border border-green-500/30 bg-green-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-b border-green-500/20">
        <span>📋</span>
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs text-green-600/70 dark:text-green-400/70">from YAML</span>
      </div>
      <div className="p-4 text-sm space-y-3">
        {includes.length > 0 && (
          <div>
            <span className="font-semibold">Includes:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {includes.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {excludes.length > 0 && (
          <div>
            <span className="font-semibold">Excludes:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {excludes.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default FactorScope;
