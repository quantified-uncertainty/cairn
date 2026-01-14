/**
 * TransitionModelContent - Auto-generates page content from entity data
 *
 * Single component that renders all standard sections for AI Transition Model pages:
 * - Current assessment (status level and trend)
 * - Ratings table
 * - Scope definition
 * - Key debates
 * - Warning indicators
 * - Interventions
 * - Influence relationships
 * - Related content links
 *
 * Usage: <TransitionModelContent entityId="tmc-compute" client:load />
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getEntityById } from '../../data';
import {
  getFactorScenarioInfluences,
  getScenarioFactorInfluences,
  getScenarioOutcomeConnections,
} from '../../data/parameter-graph-data';
import { getEntitySubgraph } from '../../data/master-graph-data';
import { FactorStatusCard } from './FactorStatusBadge';
import { InterventionsCard } from './InterventionsList';
import { EstimatesCard } from './EstimatesPanel';
import { WarningIndicatorsCard } from './WarningIndicatorsTable';
import { Backlinks } from './Backlinks';
import CauseEffectGraph from '../CauseEffectGraph';
import { Mermaid } from './index';

// Types for TMC entity data
interface TMCRatings {
  changeability?: number;
  xriskImpact?: number;
  trajectoryImpact?: number;
  uncertainty?: number;
}

interface TMCKeyDebate {
  topic: string;
  description: string;
}

interface TMCRelatedContentLink {
  path: string;
  title: string;
}

interface TMCRelatedContent {
  risks?: TMCRelatedContentLink[];
  responses?: TMCRelatedContentLink[];
  models?: TMCRelatedContentLink[];
  cruxes?: TMCRelatedContentLink[];
  researchReports?: TMCRelatedContentLink[];
}

interface TMCCurrentAssessment {
  level: number;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  confidence?: number;
  lastUpdated?: string;
  notes?: string;
}

interface TMCAddressedBy {
  id?: string;
  path?: string;
  title?: string;
  effect: 'positive' | 'negative' | 'mixed';
  strength?: 'strong' | 'medium' | 'weak';
}

interface TMCWarningIndicator {
  indicator: string;
  status: string;
  trend?: 'improving' | 'stable' | 'worsening';
  concern?: 'low' | 'medium' | 'high';
}

interface TMCEstimate {
  source: string;
  probability: number;
  confidence?: [number, number];
  asOf?: string;
  url?: string;
}

// Cause-Effect Graph types
interface TMCCauseEffectNode {
  id: string;
  label: string;
  description?: string;
  type: 'cause' | 'intermediate' | 'effect';
  confidence?: number;
  details?: string;
  sources?: string[];
  relatedConcepts?: string[];
  entityRef?: string;
}

interface TMCCauseEffectEdge {
  id?: string;
  source: string;
  target: string;
  strength?: 'weak' | 'medium' | 'strong';
  confidence?: 'low' | 'medium' | 'high';
  effect?: 'increases' | 'decreases' | 'mixed';
  label?: string;
}

interface TMCCauseEffectGraph {
  title?: string;
  description?: string;
  primaryNodeId?: string;  // ID of the node representing this entity (highlighted)
  nodes: TMCCauseEffectNode[];
  edges: TMCCauseEffectEdge[];
}

// Content table for YAML-first architecture
interface TMCContentTable {
  headers: string[];
  rows: string[][];
  caption?: string;
}

// Content section for YAML-first architecture
interface TMCContentSection {
  heading: string;
  body?: string;
  mermaid?: string;
  table?: TMCContentTable;
  component?: string;
  componentProps?: Record<string, unknown>;
}

// Rich content for YAML-first architecture
interface TMCContent {
  intro?: string;
  sections?: TMCContentSection[];
  footer?: string;
}

// Extended entity type for TMC entities
interface TMCEntity {
  id: string;
  type: string;
  title: string;
  description?: string;
  parentFactor?: string;
  path?: string;
  ratings?: TMCRatings;
  scope?: string;
  keyDebates?: TMCKeyDebate[];
  relatedContent?: TMCRelatedContent;
  currentAssessment?: TMCCurrentAssessment;
  addressedBy?: TMCAddressedBy[];
  warningIndicators?: TMCWarningIndicator[];
  estimates?: TMCEstimate[];
  causeEffectGraph?: TMCCauseEffectGraph;
  content?: TMCContent;  // YAML-first: Rich prose content stored in YAML
}

interface TransitionModelContentProps {
  // Primary: Provide entityId (e.g., "tmc-compute")
  entityId?: string;
  // Legacy: slug is converted to tmc-{slug} for backward compatibility
  slug?: string;
  // Control what sections to show
  showRatings?: boolean;
  showScope?: boolean;
  showDebates?: boolean;
  showRelated?: boolean;
  showInfluences?: boolean;
  showDescription?: boolean;
  // Extended schema sections
  showCurrentAssessment?: boolean;
  showInterventions?: boolean;
  showEstimates?: boolean;
  showWarningIndicators?: boolean;
  showCauseEffectGraph?: boolean;
  // YAML-first content sections
  showContent?: boolean;
  // Show backlinks at bottom
  showBacklinks?: boolean;
}

function RatingsSection({ ratings }: { ratings: TMCRatings }) {
  const metrics = [
    { key: 'changeability' as const, label: 'Changeability', desc: (v: number) => v <= 33 ? 'Very difficult to influence' : v <= 66 ? 'Moderately changeable' : 'Relatively tractable' },
    { key: 'xriskImpact' as const, label: 'X-risk Impact', desc: (v: number) => v <= 33 ? 'Low direct x-risk impact' : v <= 66 ? 'Moderate x-risk impact' : 'High direct x-risk impact' },
    { key: 'trajectoryImpact' as const, label: 'Trajectory Impact', desc: (v: number) => v <= 33 ? 'Low long-term effects' : v <= 66 ? 'Moderate long-term effects' : 'High long-term effects' },
    { key: 'uncertainty' as const, label: 'Uncertainty', desc: (v: number) => v <= 33 ? 'Lower uncertainty' : v <= 66 ? 'Moderate uncertainty' : 'High uncertainty' },
  ];

  return (
    <div className="tm-section tm-ratings">
      <table className="tm-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Score</th>
            <th>Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(({ key, label, desc }) => {
            const value = ratings[key];
            if (value === undefined) return null;
            return (
              <tr key={key}>
                <td className="tm-metric-name">{label}</td>
                <td className="tm-metric-value">{value}/100</td>
                <td className="tm-metric-desc">{desc(value)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScopeSection({ scope }: { scope: string }) {
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

  if (includes.length === 0 && excludes.length === 0) return null;

  return (
    <div className="tm-section tm-scope">
      <h3>Scope</h3>
      {includes.length > 0 && (
        <div className="tm-scope-group">
          <strong>Includes:</strong>
          <ul>
            {includes.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
      {excludes.length > 0 && (
        <div className="tm-scope-group">
          <strong>Excludes:</strong>
          <ul>
            {excludes.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function DebatesSection({ debates }: { debates: TMCKeyDebate[] }) {
  if (debates.length === 0) return null;

  return (
    <div className="tm-section tm-debates">
      <h3>Key Debates</h3>
      <table className="tm-table">
        <thead>
          <tr>
            <th>Debate</th>
            <th>Core Question</th>
          </tr>
        </thead>
        <tbody>
          {debates.map((debate, i) => (
            <tr key={i}>
              <td className="tm-debate-topic">{debate.topic}</td>
              <td>{debate.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelatedContentSection({ related }: { related: TMCRelatedContent }) {
  // Separate research reports from other content for special treatment
  const researchReports = related.researchReports || [];

  const sections = [
    { key: 'risks' as const, label: 'Related Risks', icon: '' },
    { key: 'responses' as const, label: 'Related Responses', icon: '' },
    { key: 'models' as const, label: 'Related Models', icon: '' },
    { key: 'cruxes' as const, label: 'Related Cruxes', icon: '' },
  ];

  const hasOtherContent = sections.some(s => related[s.key]?.length);
  const hasResearchReports = researchReports.length > 0;

  if (!hasOtherContent && !hasResearchReports) return null;

  return (
    <div className="tm-section tm-related">
      {/* Research Reports displayed prominently as cards */}
      {hasResearchReports && (
        <div className="tm-research-reports">
          <h3>Research Report</h3>
          {researchReports.map((report, i) => (
            <a key={i} href={report.path} className="tm-research-card">
              <div className="tm-research-card-icon">📄</div>
              <div className="tm-research-card-content">
                <div className="tm-research-card-title">{report.title}</div>
                <div className="tm-research-card-desc">
                  In-depth analysis with citations, causal factors, and open questions
                </div>
              </div>
              <div className="tm-research-card-arrow">→</div>
            </a>
          ))}
        </div>
      )}

      {/* Other related content in grid */}
      {hasOtherContent && (
        <>
          <h3>Related Content</h3>
          <div className="tm-related-grid">
            {sections.map(({ key, label, icon }) => {
              const items = related[key];
              if (!items?.length) return null;
              return (
                <div key={key} className="tm-related-group">
                  <h4>{icon} {label}</h4>
                  <ul>
                    {items.map((item, i) => (
                      <li key={i}>
                        <a href={item.path}>{item.title}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function InfluencesSection({ parentFactor }: { parentFactor: string }) {
  // Use parentFactor to determine which influences to show
  // For factors (cause nodes), show scenarios influenced
  // For scenarios (intermediate nodes), show factors that influence and outcomes affected

  // Try as a factor first (cause node)
  const factorInfluences = getFactorScenarioInfluences(parentFactor);
  if (factorInfluences.length > 0) {
    return (
      <div className="tm-section tm-influences">
        <h3>Scenarios Influenced</h3>
        <table className="tm-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Effect</th>
              <th>Strength</th>
            </tr>
          </thead>
          <tbody>
            {factorInfluences.map((inf, i) => (
              <tr key={i}>
                <td>
                  <a href={`/ai-transition-model/scenarios/${inf.scenarioId}/`}>
                    {inf.scenarioLabel}
                  </a>
                </td>
                <td>{inf.effect === 'increases' ? '↑ Increases' : inf.effect === 'decreases' ? '↓ Decreases' : '—'}</td>
                <td>{inf.strength || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Try as a scenario (intermediate node)
  const scenarioFactorInfluences = getScenarioFactorInfluences(parentFactor);
  const outcomeConnections = getScenarioOutcomeConnections(parentFactor);

  if (scenarioFactorInfluences.length > 0 || outcomeConnections.length > 0) {
    return (
      <>
        {scenarioFactorInfluences.length > 0 && (
          <div className="tm-section tm-influences">
            <h3>Influenced By</h3>
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Effect</th>
                  <th>Strength</th>
                </tr>
              </thead>
              <tbody>
                {scenarioFactorInfluences.map((inf, i) => (
                  <tr key={i}>
                    <td>
                      <a href={`/ai-transition-model/factors/${inf.factorId}/`}>
                        {inf.factorLabel}
                      </a>
                    </td>
                    <td>{inf.effect === 'increases' ? '↑ Increases' : inf.effect === 'decreases' ? '↓ Decreases' : '—'}</td>
                    <td>{inf.strength || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {outcomeConnections.length > 0 && (
          <div className="tm-section tm-outcomes">
            <h3>Outcomes Affected</h3>
            <ul className="tm-outcome-list">
              {outcomeConnections.map((conn, i) => (
                <li key={i}>
                  <a href={`/ai-transition-model/outcomes/${conn.outcomeId}/`}>
                    {conn.outcomeLabel}
                  </a>
                  {conn.effect && (
                    <span className="tm-effect">
                      {conn.effect === 'increases' ? ' ↑' : conn.effect === 'decreases' ? ' ↓' : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return null;
}

/**
 * Preprocesses markdown content from YAML to handle JSX components
 * that were migrated from MDX files. ReactMarkdown doesn't process JSX,
 * so we convert them to markdown equivalents or strip them.
 */
function preprocessYamlContent(content: string): string {
  let result = content;

  // Convert <R id="...">text</R> to markdown links
  // Matches: <R id="abc123">Link Text</R>
  result = result.replace(/<R\s+id="([^"]+)"[^>]*>([^<]+)<\/R>/g, '[$2](/browse/resources/$1/)');

  // Remove self-closing JSX components that shouldn't be in YAML content
  // DataInfoBox, ImpactList, FactorRelationshipDiagram, ParameterDistinctions
  result = result.replace(/<(DataInfoBox|ImpactList|FactorRelationshipDiagram|ParameterDistinctions)[^>]*\/>/g, '');

  // Remove JSX components with client:load directive (these were MDX-specific)
  // Matches: <ComponentName ... client:load /> or <ComponentName ... client:load>...</ComponentName>
  result = result.replace(/<(ATMPage|ImpactList|FactorRelationshipDiagram)[^>]*client:load[^>]*>[\s\S]*?<\/\1>/g, '');
  result = result.replace(/<(ATMPage|ImpactList|FactorRelationshipDiagram)[^>]*client:load[^>]*\/>/g, '');

  // Remove orphaned opening JSX tags (migration errors where only opening tag remains)
  // Matches: <ComponentName ...> at start or on its own line
  result = result.replace(/^\s*<[A-Z][a-zA-Z]*[^/>]*>\s*$/gm, '');

  // Remove any remaining self-closing components that look like JSX (capitalized)
  result = result.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '');

  // Clean up any double blank lines left after removing components
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  result = result.trim();

  return result;
}

/**
 * Fixes markdown tables that were broken by YAML multiline folding.
 * YAML multiline strings can add extra newlines/indentation that break tables.
 * This function:
 * 1. Identifies table rows (lines starting and ending with |)
 * 2. Removes blank lines between table rows
 * 3. Handles YAML folding that splits rows across lines
 */
function fixMarkdownTables(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let tableBuffer: string[] = [];
  let pendingBlankLines = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const isTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
    const isSeparator = /^\|[-:|]+\|$/.test(trimmedLine);

    if (isTableRow || isSeparator) {
      // This is a table row - add to buffer (skip any pending blank lines)
      tableBuffer.push(trimmedLine);
      pendingBlankLines = 0;
    } else if (trimmedLine === '' && tableBuffer.length > 0) {
      // Blank line while in a potential table - defer decision
      pendingBlankLines++;
    } else {
      // Non-table line - flush any buffered table
      if (tableBuffer.length > 0) {
        result.push(...tableBuffer);
        tableBuffer = [];
      }
      // Add any pending blank lines for non-table content
      for (let i = 0; i < pendingBlankLines; i++) {
        result.push('');
      }
      pendingBlankLines = 0;
      result.push(line);
    }
  }

  // Flush any remaining table
  if (tableBuffer.length > 0) {
    result.push(...tableBuffer);
  }

  return result.join('\n');
}

/**
 * Renders a single content section from YAML content structure.
 * Supports markdown body, mermaid diagrams, and tables.
 */
function ContentSectionRenderer({ section }: { section: TMCContentSection }) {
  return (
    <div className="tm-content-section">
      <h2>{section.heading}</h2>

      {/* Mermaid diagram */}
      {section.mermaid && (
        <div className="tm-content-mermaid">
          <Mermaid chart={section.mermaid} />
        </div>
      )}

      {/* Table */}
      {section.table && (
        <div className="tm-content-table-wrapper">
          <table className="tm-table tm-content-table">
            <thead>
              <tr>
                {section.table.headers.map((header, i) => (
                  <th key={i}><ReactMarkdown>{header}</ReactMarkdown></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx}><ReactMarkdown>{cell}</ReactMarkdown></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {section.table.caption && (
            <p className="tm-table-caption">{section.table.caption}</p>
          )}
        </div>
      )}

      {/* Markdown body */}
      {section.body && (
        <div className="tm-content-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixMarkdownTables(preprocessYamlContent(section.body))}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/**
 * Renders the full content structure from YAML.
 * Includes intro, sections, and footer.
 */
function ContentRenderer({ content }: { content: TMCContent }) {
  return (
    <div className="tm-yaml-content">
      {/* Intro paragraphs */}
      {content.intro && (
        <div className="tm-content-intro">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixMarkdownTables(preprocessYamlContent(content.intro))}</ReactMarkdown>
        </div>
      )}

      {/* Content sections */}
      {content.sections?.map((section, i) => (
        <ContentSectionRenderer key={i} section={section} />
      ))}

      {/* Footer */}
      {content.footer && (
        <div className="tm-content-footer">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixMarkdownTables(preprocessYamlContent(content.footer))}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function TransitionModelContent({
  entityId,
  slug,
  showRatings = true,
  showScope = true,
  showDebates = true,
  showRelated = true,
  showInfluences = true,
  showDescription = false,
  showCurrentAssessment = true,
  showInterventions = true,
  showEstimates = true,
  showWarningIndicators = true,
  showCauseEffectGraph = true,
  showContent = true,
  showBacklinks = true,
}: TransitionModelContentProps) {
  // Support legacy slug prop by converting to tmc-{slug}
  let effectiveEntityId = entityId;
  if (!effectiveEntityId && slug) {
    effectiveEntityId = `tmc-${slug}`;
  }

  if (!effectiveEntityId) {
    return <div className="tm-error">No entityId provided. Use entityId="tmc-compute" format.</div>;
  }

  // Direct entity lookup from database
  const rawEntity = getEntityById(effectiveEntityId);

  if (!rawEntity) {
    return <div className="tm-error">No entity found for ID "{effectiveEntityId}". Ensure the entity exists in ai-transition-model.yaml.</div>;
  }

  // Cast to TMC entity type for TypeScript
  const entity = rawEntity as unknown as TMCEntity;

  return (
    <div className="tm-content">
      {showDescription && entity.description && (
        <div className="tm-section tm-description">
          <p>{entity.description}</p>
        </div>
      )}

      {/* YAML-first content sections (intro + sections + footer) */}
      {showContent && entity.content && (
        <ContentRenderer content={entity.content} />
      )}

      {/* Current Assessment - shows status level and trend */}
      {showCurrentAssessment && entity.currentAssessment && (
        <FactorStatusCard assessment={entity.currentAssessment} />
      )}

      {showRatings && entity.ratings && <RatingsSection ratings={entity.ratings} />}

      {showScope && entity.scope && <ScopeSection scope={entity.scope} />}

      {showDebates && entity.keyDebates && entity.keyDebates.length > 0 && (
        <DebatesSection debates={entity.keyDebates} />
      )}

      {/* Cause-Effect Graph - causal relationships visualization */}
      {showCauseEffectGraph && (() => {
        // First check for manually-defined graph
        if (entity.causeEffectGraph && entity.causeEffectGraph.nodes.length > 0) {
          // Calculate dynamic height based on layer count (nodes spread horizontally within layers)
          const nodes = entity.causeEffectGraph!.nodes;
          // Count unique layers (types) - this determines vertical extent
          const layerCount = new Set(nodes.map(n => n.type)).size;
          // Height formula: base + per-layer spacing, clamped
          // ~150px per layer (node height + spacing), plus padding
          const calculatedHeight = Math.min(800, Math.max(400, 100 + (layerCount * 150)));

          return (
            <div className="tm-section tm-cause-effect">
              {entity.causeEffectGraph.title && (
                <h3>{entity.causeEffectGraph.title}</h3>
              )}
              {entity.causeEffectGraph.description && (
                <p className="tm-graph-description">{entity.causeEffectGraph.description}</p>
              )}
              <CauseEffectGraph
                height={calculatedHeight}
                hideListView={true}
                selectedNodeId={entity.causeEffectGraph.primaryNodeId}
                entityId={effectiveEntityId || entity.id}
                graphConfig={{
                  hideGroupBackgrounds: true,
                  useDagre: true,  // Cleaner layout for simple causal diagrams
                  typeLabels: {
                    leaf: 'Root Causes',
                    cause: 'Derived',
                    intermediate: 'Direct Factors',
                    effect: 'Target',
                  },
                }}
                initialNodes={entity.causeEffectGraph.nodes.map((node, i) => ({
                  id: node.id,
                  type: 'causeEffect' as const,
                  position: { x: 0, y: 0 },
                  data: {
                    label: node.label,
                    description: node.description || '',
                    type: node.type,
                    ...(node.confidence !== undefined && { confidence: node.confidence }),
                    details: node.details || '',
                    sources: node.sources || [],
                    relatedConcepts: node.relatedConcepts || [],
                  },
                }))}
                initialEdges={entity.causeEffectGraph.edges.map((edge, i) => ({
                  id: edge.id || `e-${edge.source}-${edge.target}`,
                  source: edge.source,
                  target: edge.target,
                  data: {
                    strength: edge.strength || 'medium',
                    confidence: edge.confidence || 'medium',
                    effect: edge.effect || 'increases',
                  },
                  label: edge.label,
                }))}
              />
            </div>
          );
        }

        // Fall back to auto-generated subgraph from master graph
        // Extract the base entity ID (strip "tmc-" prefix if present)
        const baseId = effectiveEntityId?.startsWith('tmc-')
          ? effectiveEntityId.slice(4)
          : effectiveEntityId;

        if (!baseId) return null;

        // Try to get auto-generated subgraph
        const autoSubgraph = getEntitySubgraph(baseId, 12);
        if (!autoSubgraph || autoSubgraph.nodes.length === 0) return null;

        // Calculate height based on node count
        const layerCount = new Set(autoSubgraph.nodes.map(n => n.data.type)).size;
        const calculatedHeight = Math.min(600, Math.max(350, 80 + (layerCount * 120)));

        return (
          <div className="tm-section tm-cause-effect tm-auto-graph">
            <h3>Causal Relationships</h3>
            <p className="tm-graph-description tm-auto-generated-note">
              Auto-generated from the master graph. Shows key relationships.
            </p>
            <CauseEffectGraph
              height={calculatedHeight}
              hideListView={true}
              selectedNodeId={autoSubgraph.primaryNodeId}
              entityId={effectiveEntityId || entity.id}
              graphConfig={{
                hideGroupBackgrounds: true,
                useDagre: true,
                typeLabels: {
                  cause: 'Causes',
                  intermediate: 'This Factor',
                  effect: 'Effects',
                },
              }}
              initialNodes={autoSubgraph.nodes}
              initialEdges={autoSubgraph.edges}
            />
          </div>
        );
      })()}

      {/* Probability Estimates (primarily for scenarios) */}
      {showEstimates && entity.estimates && entity.estimates.length > 0 && (
        <EstimatesCard estimates={entity.estimates} />
      )}

      {/* Warning Indicators */}
      {showWarningIndicators && entity.warningIndicators && entity.warningIndicators.length > 0 && (
        <WarningIndicatorsCard indicators={entity.warningIndicators} />
      )}

      {/* Interventions that address this factor */}
      {showInterventions && entity.addressedBy && entity.addressedBy.length > 0 && (
        <InterventionsCard interventions={entity.addressedBy} />
      )}

      {/* Show influences based on parentFactor */}
      {showInfluences && entity.parentFactor && (
        <InfluencesSection parentFactor={entity.parentFactor} />
      )}

      {showRelated && entity.relatedContent && <RelatedContentSection related={entity.relatedContent} />}

      {/* Backlinks section */}
      {showBacklinks && effectiveEntityId && (
        <>
          <hr className="tm-divider" />
          <Backlinks entityId={effectiveEntityId.replace(/^tmc-/, '')} />
        </>
      )}

      <style>{`
        .tm-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .tm-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: var(--sl-color-white);
        }
        .tm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .tm-table th,
        .tm-table td {
          padding: 0.5rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }
        .tm-table th {
          font-weight: 600;
          color: var(--sl-color-gray-2);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .tm-table tr:last-child td {
          border-bottom: none;
        }
        .tm-metric-name,
        .tm-debate-topic {
          font-weight: 500;
        }
        .tm-metric-value {
          font-family: var(--sl-font-mono);
          color: var(--sl-color-text-accent);
        }
        .tm-metric-desc {
          color: var(--sl-color-gray-3);
        }
        .tm-graph-description {
          color: var(--sl-color-gray-3);
          font-size: 0.9rem;
          margin: 0 0 1rem 0;
        }
        .tm-auto-generated-note {
          font-style: italic;
          font-size: 0.85rem;
          color: var(--sl-color-gray-4);
        }
        .tm-cause-effect {
          margin-top: 1rem;
        }
        .tm-scope-group {
          margin-bottom: 0.75rem;
        }
        .tm-scope-group:last-child {
          margin-bottom: 0;
        }
        .tm-scope-group ul {
          margin: 0.25rem 0 0 1.25rem;
          padding: 0;
        }
        .tm-scope-group li {
          margin: 0.25rem 0;
        }
        .tm-related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .tm-related-group h4 {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        .tm-related-group ul {
          margin: 0;
          padding: 0 0 0 1rem;
          list-style: disc;
        }
        .tm-related-group li {
          margin: 0.25rem 0;
        }
        .tm-related-group a {
          color: var(--sl-color-text-accent);
          text-decoration: none;
        }
        .tm-related-group a:hover {
          text-decoration: underline;
        }
        .tm-research-reports {
          margin-bottom: 1.5rem;
        }
        .tm-research-reports h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: var(--sl-color-white);
        }
        .tm-research-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, var(--sl-color-accent-low) 0%, var(--sl-color-gray-6) 100%);
          border: 1px solid var(--sl-color-accent);
          border-radius: 0.75rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .tm-research-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: var(--sl-color-accent-high);
        }
        .tm-research-card-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
        }
        .tm-research-card-content {
          flex: 1;
          min-width: 0;
        }
        .tm-research-card-title {
          font-weight: 600;
          color: var(--sl-color-white);
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .tm-research-card-desc {
          font-size: 0.85rem;
          color: var(--sl-color-gray-3);
          line-height: 1.4;
        }
        .tm-research-card-arrow {
          font-size: 1.25rem;
          color: var(--sl-color-accent);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .tm-research-card:hover .tm-research-card-arrow {
          transform: translateX(4px);
        }
        .tm-outcome-list {
          margin: 0;
          padding: 0 0 0 1.25rem;
        }
        .tm-outcome-list li {
          margin: 0.5rem 0;
        }
        .tm-outcome-list a {
          color: var(--sl-color-text-accent);
          text-decoration: none;
        }
        .tm-outcome-list a:hover {
          text-decoration: underline;
        }
        .tm-effect {
          color: var(--sl-color-gray-3);
          margin-left: 0.25rem;
        }
        .tm-error {
          padding: 1rem;
          background: var(--sl-color-red-low);
          border: 1px solid var(--sl-color-red);
          border-radius: 0.5rem;
          color: var(--sl-color-red-high);
        }
        /* YAML-first content sections */
        .tm-yaml-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .tm-content-intro {
          font-size: 1rem;
          line-height: 1.7;
        }
        .tm-content-intro p {
          margin: 0 0 1rem 0;
        }
        .tm-content-intro p:last-child {
          margin-bottom: 0;
        }
        .tm-content-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem 0;
          color: var(--sl-color-white);
          border-bottom: 1px solid var(--sl-color-gray-5);
          padding-bottom: 0.5rem;
        }
        .tm-content-section h2:first-child {
          margin-top: 0;
        }
        .tm-content-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        .tm-content-body {
          line-height: 1.7;
        }
        .tm-content-body p {
          margin: 0 0 1rem 0;
        }
        .tm-content-body ul, .tm-content-body ol {
          margin: 0.5rem 0 1rem 1.5rem;
          padding: 0;
        }
        .tm-content-body li {
          margin: 0.25rem 0;
        }
        .tm-content-body strong {
          font-weight: 600;
        }
        .tm-content-body a {
          color: var(--sl-color-text-accent);
          text-decoration: none;
        }
        .tm-content-body a:hover {
          text-decoration: underline;
        }
        .tm-content-mermaid {
          margin: 1rem 0;
        }
        .tm-content-table {
          margin: 1rem 0;
        }
        .tm-content-table p {
          margin: 0;
        }
        .tm-table-caption {
          font-size: 0.85rem;
          color: var(--sl-color-gray-3);
          font-style: italic;
          text-align: center;
          margin: 0.5rem 0 0 0;
        }
        .tm-content-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--sl-color-gray-5);
        }
        .tm-divider {
          border: none;
          border-top: 1px solid var(--sl-color-gray-5);
          margin: 1rem 0;
        }
        /* Styles for ReactMarkdown-generated tables */
        .tm-content-body table,
        .tm-content-intro table,
        .tm-content-footer table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .tm-content-body table th,
        .tm-content-body table td,
        .tm-content-intro table th,
        .tm-content-intro table td,
        .tm-content-footer table th,
        .tm-content-footer table td {
          border: 1px solid var(--sl-color-gray-5);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .tm-content-body table th,
        .tm-content-intro table th,
        .tm-content-footer table th {
          background: var(--sl-color-gray-6);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default TransitionModelContent;
