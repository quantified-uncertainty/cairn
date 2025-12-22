import React from 'react';
import './wiki.css';

type EntityCategory = 'lab' | 'capability' | 'risk' | 'safety-agenda' | 'policy' | 'timeline' | 'scenario' | 'intervention';

interface EntityLinkProps {
  id: string;
  category: EntityCategory;
  label?: string;
}

const categoryPaths: Record<EntityCategory, string> = {
  lab: '/labs',
  capability: '/capabilities',
  risk: '/risks',
  'safety-agenda': '/safety-agendas',
  policy: '/policies',
  timeline: '/timelines',
  scenario: '/scenarios',
  intervention: '/interventions',
};

const categoryIcons: Record<EntityCategory, string> = {
  lab: '🏢',
  capability: '⚡',
  risk: '⚠️',
  'safety-agenda': '🛡️',
  policy: '📋',
  timeline: '📅',
  scenario: '🎭',
  intervention: '🔧',
};

export function EntityLink({ id, category, label }: EntityLinkProps) {
  const path = `${categoryPaths[category]}/${id}`;
  const displayLabel = label || id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const icon = categoryIcons[category];

  return (
    <a href={path} className="wiki-entity-link">
      <span className="wiki-entity-link__icon">{icon}</span>
      <span>{displayLabel}</span>
    </a>
  );
}

export default EntityLink;
