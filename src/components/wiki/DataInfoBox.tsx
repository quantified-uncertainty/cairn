/**
 * Data-aware InfoBox Component
 *
 * Wrapper that supports:
 * 1. Entity lookup via `entityId` prop (pulls from entities.yaml)
 * 2. Expert lookup via `expertId` prop (pulls from experts.yaml)
 * 3. Organization lookup via `orgId` prop (pulls from organizations.yaml)
 * 4. Inline data via props (backwards compatible)
 */

import React from 'react';
import { InfoBox, type EntityType, type ModelRatingsData } from './InfoBox';
import { Sources } from './Sources';
import { getExpertInfoBoxData, getOrgInfoBoxData, getEntityInfoBoxData } from '../../data';

interface RelatedEntry {
  type: EntityType;
  title: string;
  href: string;
}

interface RelatedSolution {
  id: string;
  title: string;
  type: string;
  href: string;
}

interface DataInfoBoxProps {
  // Data lookup options
  entityId?: string;
  expertId?: string;
  orgId?: string;

  // All original InfoBox props for inline use or overrides
  type?: EntityType;
  title?: string;
  image?: string;
  website?: string;
  founded?: string;
  location?: string;
  headcount?: string;
  funding?: string;
  severity?: 'low' | 'medium' | 'high' | 'catastrophic';
  likelihood?: string;
  timeframe?: string;
  category?: string;
  maturity?: string;
  relatedSolutions?: RelatedSolution[];
  jurisdiction?: string;
  status?: string;
  effectiveDate?: string;
  organization?: string;
  approach?: string;
  currentLevel?: string;
  projectedTimeline?: string;
  affiliation?: string;
  role?: string;
  knownFor?: string;
  customFields?: { label: string; value: string }[];
  relatedTopics?: string[];
  relatedEntries?: RelatedEntry[];
  sources?: { title: string; url?: string; author?: string; date?: string }[];
  ratings?: ModelRatingsData;
}

export function DataInfoBox({
  entityId,
  expertId,
  orgId,
  type: inlineType,
  ...inlineProps
}: DataInfoBoxProps) {
  // If entityId provided, fetch entity data
  if (entityId) {
    const data = getEntityInfoBoxData(entityId);
    if (!data) {
      return (
        <div className="wiki-infobox wiki-infobox--empty">
          <p>No entity found with ID: {entityId}</p>
        </div>
      );
    }

    const sources = data.sources || inlineProps.sources;

    return (
      <>
        <InfoBox
          type={data.type as EntityType}
          title={data.title}
          severity={data.severity as any}
          likelihood={data.likelihood}
          timeframe={data.timeframe}
          category={data.category}
          maturity={data.maturity}
          relatedSolutions={data.relatedSolutions as RelatedSolution[]}
          website={data.website}
          customFields={data.customFields}
          relatedTopics={data.relatedTopics}
          relatedEntries={data.relatedEntries as RelatedEntry[]}
          {...inlineProps} // Allow overrides
        />
        {sources && sources.length > 0 && <Sources sources={sources} />}
      </>
    );
  }

  // If expertId provided, fetch expert data
  if (expertId) {
    const data = getExpertInfoBoxData(expertId);
    if (!data) {
      return (
        <div className="wiki-infobox wiki-infobox--empty">
          <p>No expert found with ID: {expertId}</p>
        </div>
      );
    }
    return (
      <InfoBox
        type={data.type}
        title={data.title}
        affiliation={data.affiliation}
        role={data.role}
        website={data.website}
        knownFor={data.knownFor}
        {...inlineProps} // Allow overrides
      />
    );
  }

  // If orgId provided, fetch organization data
  if (orgId) {
    const data = getOrgInfoBoxData(orgId);
    if (!data) {
      return (
        <div className="wiki-infobox wiki-infobox--empty">
          <p>No organization found with ID: {orgId}</p>
        </div>
      );
    }
    return (
      <InfoBox
        type={data.type}
        title={data.title}
        founded={data.founded}
        location={data.location}
        headcount={data.headcount}
        funding={data.funding}
        website={data.website}
        {...inlineProps} // Allow overrides
      />
    );
  }

  // Use inline data
  if (!inlineType) {
    return (
      <div className="wiki-infobox wiki-infobox--empty">
        <p>InfoBox requires type prop or entityId/expertId/orgId for data lookup</p>
      </div>
    );
  }

  return <InfoBox type={inlineType} {...inlineProps} />;
}

export default DataInfoBox;
