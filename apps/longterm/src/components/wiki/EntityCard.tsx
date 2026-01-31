"use client"

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { EntityTypeBadge, type EntityType } from './EntityTypeIcon';
import { cn } from '@lib/utils';

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
    <Card className="p-4 py-4 gap-2 transition-all hover:border-accent-foreground hover:shadow-md">
      <EntityTypeBadge type={category as EntityType} size="xs" />
      <h4 className="m-0 text-base font-semibold">
        <a href={path} className="text-foreground no-underline hover:text-accent-foreground">
          {title}
        </a>
      </h4>
      {description && (
        <p className="m-0 text-sm text-muted-foreground leading-snug">{description}</p>
      )}
    </Card>
  );
}

interface EntityCardsProps {
  children: React.ReactNode;
}

export function EntityCards({ children }: EntityCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 my-4">
      {children}
    </div>
  );
}

export default EntityCard;
