import React from 'react';
import './wiki.css';

type EntityCategory = 'lab' | 'capability' | 'risk' | 'safety-agenda' | 'policy' | 'timeline' | 'scenario' | 'intervention';

interface EntityCardProps {
  id: string;
  category: EntityCategory;
  title: string;
  description?: string;
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

const categoryStyles: Record<EntityCategory, { label: string; bg: string; color: string }> = {
  lab: { label: 'Lab', bg: '#fee2e2', color: '#991b1b' },
  capability: { label: 'Capability', bg: '#e0f2fe', color: '#075985' },
  risk: { label: 'Risk', bg: '#fef3c7', color: '#92400e' },
  'safety-agenda': { label: 'Safety Agenda', bg: '#ede9fe', color: '#5b21b6' },
  policy: { label: 'Policy', bg: '#ccfbf1', color: '#115e59' },
  timeline: { label: 'Timeline', bg: '#dbeafe', color: '#1e40af' },
  scenario: { label: 'Scenario', bg: '#fce7f3', color: '#9d174d' },
  intervention: { label: 'Intervention', bg: '#dcfce7', color: '#166534' },
};

export function EntityCard({ id, category, title, description }: EntityCardProps) {
  const path = `${categoryPaths[category]}/${id}`;
  const style = categoryStyles[category];

  return (
    <div className="wiki-entity-card">
      <span
        className="wiki-entity-card__type"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.label}
      </span>
      <h4 className="wiki-entity-card__title">
        <a href={path}>{title}</a>
      </h4>
      {description && (
        <p className="wiki-entity-card__description">{description}</p>
      )}
    </div>
  );
}

interface EntityCardsProps {
  children: React.ReactNode;
}

export function EntityCards({ children }: EntityCardsProps) {
  return <div className="wiki-entity-cards">{children}</div>;
}

export default EntityCard;
