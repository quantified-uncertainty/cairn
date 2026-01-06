"use client"

import React from 'react';
import './wiki.css';
import { EntityTypeBadge, type EntityType } from './EntityTypeIcon';

type EntityCategory = 'lab' | 'capability' | 'risk' | 'safety-agenda' | 'policy' | 'timeline' | 'scenario' | 'intervention' | 'crux' | 'case-study' | 'researcher' | 'resource' | 'funder' | 'organization' | 'lab-research' | 'lab-academic' | 'lab-frontier' | 'lab-startup' | 'historical' | 'analysis';

interface EntityCardProps {
  id: string;
  category: EntityCategory;
  title: string;
  description?: string;
}

const categoryPaths: Record<string, string> = {
  lab: '/knowledge-base/organizations',
  'lab-research': '/knowledge-base/organizations',
  'lab-academic': '/knowledge-base/organizations',
  'lab-frontier': '/knowledge-base/organizations',
  'lab-startup': '/knowledge-base/organizations',
  organization: '/knowledge-base/organizations',
  capability: '/knowledge-base/capabilities',
  risk: '/knowledge-base/risks',
  'safety-agenda': '/knowledge-base/responses',
  policy: '/knowledge-base/responses',
  timeline: '/knowledge-base/history',
  historical: '/knowledge-base/history',
  scenario: '/analysis/scenarios',
  intervention: '/knowledge-base/responses',
  crux: '/ai-transition-model/core-argument',
  'case-study': '/analysis/case-studies',
  researcher: '/knowledge-base/people',
  resource: '/getting-started',
  funder: '/knowledge-base/funders',
  analysis: '/analysis',
};

const defaultPath = '/';

export function EntityCard({ id, category, title, description }: EntityCardProps) {
  const basePath = categoryPaths[category] || defaultPath;
  const path = `${basePath}/${id}`;

  return (
    <div className="wiki-entity-card">
      <EntityTypeBadge type={category as EntityType} size="xs" />
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
