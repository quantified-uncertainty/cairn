import { MiniModelDiagram } from '../MiniModelDiagram';

interface ModelPositionProps {
  /** The node ID to highlight in the diagram */
  nodeId: string;
  /** Optional link to the full interactive graph */
  showLink?: boolean;
}

const containerStyles: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const headerStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '12px',
};

const linkStyles: React.CSSProperties = {
  display: 'block',
  textAlign: 'right',
  fontSize: '11px',
  color: '#6b7280',
  textDecoration: 'none',
  marginTop: '8px',
};

/**
 * A styled wrapper for MiniModelDiagram for use in knowledge base pages.
 * Shows the position of the current page within the AI Transition Model hierarchy.
 *
 * Usage in MDX:
 * ```mdx
 * import {ModelPosition} from '@components/wiki';
 *
 * <ModelPosition nodeId="ai-uses" client:load />
 * ```
 *
 * Node IDs:
 * - Root Factors: misalignment-potential, ai-capabilities, ai-uses, ai-ownership, civ-competence, transition-turbulence, misuse-potential
 * - Scenarios: ai-takeover, human-catastrophe, long-term-lockin
 * - Outcomes: existential-catastrophe, long-term-trajectory
 */
export function ModelPosition({ nodeId, showLink = true }: ModelPositionProps) {
  return (
    <div style={containerStyles}>
      <div style={headerStyles}>Position in Model</div>
      <MiniModelDiagram selectedNodeId={nodeId} />
      {showLink && (
        <a href="/ai-transition-model-views/outline" style={linkStyles}>
          View full interactive model →
        </a>
      )}
    </div>
  );
}
