/**
 * ATMPage - Full page component for AI Transition Model entities
 *
 * Renders a complete page from YAML data with optional custom content.
 * Simplifies MDX files to just frontmatter + component call.
 *
 * Usage (minimal page):
 *   <ATMPage entityId="tmc-compute" />
 *
 * Usage (with custom content):
 *   <ATMPage entityId="tmc-compute">
 *     <Mermaid ... />
 *     Custom tables, prose, etc.
 *   </ATMPage>
 */

import React from 'react';
import { getEntityById } from '@data';
import { TransitionModelContent } from './TransitionModelContent';
import { Backlinks } from './Backlinks';

interface ATMPageProps {
  /** Entity ID (e.g., "tmc-compute", "racing-intensity") */
  entityId: string;
  /** Custom content to render between description and structured data */
  children?: React.ReactNode;
  /** Show description from YAML as intro (default: true) */
  showDescription?: boolean;
  /** Show backlinks section at bottom (default: true) */
  showBacklinks?: boolean;
  /** Props to pass through to TransitionModelContent */
  showRatings?: boolean;
  showScope?: boolean;
  showDebates?: boolean;
  showRelated?: boolean;
  showInfluences?: boolean;
  showCurrentAssessment?: boolean;
  showInterventions?: boolean;
  showEstimates?: boolean;
  showWarningIndicators?: boolean;
  showCauseEffectGraph?: boolean;
}

export function ATMPage({
  entityId,
  children,
  showDescription = true,
  showBacklinks = true,
  showRatings = true,
  showScope = true,
  showDebates = true,
  showRelated = true,
  showInfluences = true,
  showCurrentAssessment = true,
  showInterventions = true,
  showEstimates = true,
  showWarningIndicators = true,
  showCauseEffectGraph = true,
}: ATMPageProps) {
  // Normalize entityId - add tmc- prefix if needed for lookup
  const lookupId = entityId.startsWith('tmc-') ? entityId : `tmc-${entityId}`;
  const entity = getEntityById(lookupId) || getEntityById(entityId);

  if (!entity) {
    return (
      <div className="atm-error">
        Entity "{entityId}" not found. Check the entityId matches an entry in ai-transition-model.yaml.
      </div>
    );
  }

  // Extract backlinks ID (strip tmc- prefix for backlinks lookup)
  const backlinksId = entityId.replace(/^tmc-/, '');

  return (
    <div className="atm-page">
      {/* Description as intro prose */}
      {showDescription && entity.description && (
        <div className="atm-intro">
          <p>{entity.description}</p>
        </div>
      )}

      {/* Custom content from MDX children */}
      {children && (
        <div className="atm-custom-content">
          {children}
        </div>
      )}

      {/* Divider before structured content */}
      {(showDescription || children) && <hr className="atm-divider" />}

      {/* Structured data from YAML via TransitionModelContent */}
      <TransitionModelContent
        entityId={lookupId}
        showDescription={false}
        showRatings={showRatings}
        showScope={showScope}
        showDebates={showDebates}
        showRelated={showRelated}
        showInfluences={showInfluences}
        showCurrentAssessment={showCurrentAssessment}
        showInterventions={showInterventions}
        showEstimates={showEstimates}
        showWarningIndicators={showWarningIndicators}
        showCauseEffectGraph={showCauseEffectGraph}
        showBacklinks={false}
      />

      {/* Backlinks */}
      {showBacklinks && (
        <>
          <hr className="atm-divider" />
          <Backlinks entityId={backlinksId} />
        </>
      )}

      <style>{`
        .atm-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .atm-intro {
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--sl-color-text);
        }
        .atm-intro p {
          margin: 0;
        }
        .atm-custom-content {
          margin: 1rem 0;
        }
        .atm-divider {
          border: none;
          border-top: 1px solid var(--sl-color-gray-5);
          margin: 0.5rem 0;
        }
        .atm-error {
          padding: 1rem;
          background: var(--sl-color-red-low);
          border: 1px solid var(--sl-color-red);
          border-radius: 0.5rem;
          color: var(--sl-color-red-high);
        }
      `}</style>
    </div>
  );
}

export default ATMPage;
