import React from 'react';
import './wiki.css';

type EntityCategory = 'lab' | 'capability' | 'risk' | 'safety-agenda' | 'policy' | 'timeline' | 'scenario' | 'intervention' | 'crux' | 'case-study' | 'researcher' | 'resource' | 'funder';

interface EntityCardProps {
  id: string;
  category: EntityCategory;
  title: string;
  description?: string;
}

const categoryPaths: Record<EntityCategory, string> = {
  lab: '/organizations',
  capability: '/capabilities',
  risk: '/risks',
  'safety-agenda': '/safety-approaches',
  policy: '/policies',
  timeline: '/timelines',
  scenario: '/scenarios',
  intervention: '/analysis/interventions',
  crux: '/understanding-ai-risk/core-argument',
  'case-study': '/analysis/case-studies',
  researcher: '/people',
  resource: '/resources',
  funder: '/resources/funding',
};

const categoryStyles: Record<EntityCategory, { label: string; bg: string; color: string }> = {
  lab: { label: 'Organization', bg: '#fee2e2', color: '#991b1b' },
  capability: { label: 'Capability', bg: '#e0f2fe', color: '#075985' },
  risk: { label: 'Risk', bg: '#fef3c7', color: '#92400e' },
  'safety-agenda': { label: 'Safety Agenda', bg: '#ede9fe', color: '#5b21b6' },
  policy: { label: 'Policy', bg: '#ccfbf1', color: '#115e59' },
  timeline: { label: 'Timeline', bg: '#dbeafe', color: '#1e40af' },
  scenario: { label: 'Scenario', bg: '#fce7f3', color: '#9d174d' },
  intervention: { label: 'Intervention', bg: '#dcfce7', color: '#166534' },
  crux: { label: 'Key Crux', bg: '#ffedd5', color: '#c2410c' },
  'case-study': { label: 'Case Study', bg: '#e7e5e4', color: '#57534e' },
  researcher: { label: 'Researcher', bg: '#e2e8f0', color: '#475569' },
  resource: { label: 'Resource', bg: '#e0e7ff', color: '#3730a3' },
  funder: { label: 'Funder', bg: '#dcfce7', color: '#166534' },
};

const defaultPath = '/';
const defaultStyle = { label: 'Entry', bg: '#f3f4f6', color: '#374151' };

export function EntityCard({ id, category, title, description }: EntityCardProps) {
  const basePath = categoryPaths[category] || defaultPath;
  const path = `${basePath}/${id}`;
  const style = categoryStyles[category] || defaultStyle;

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
