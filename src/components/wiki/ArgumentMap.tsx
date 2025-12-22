import { useState } from 'react';
import './wiki.css';

interface Argument {
  id: string;
  claim: string;
  type: 'pro' | 'con' | 'consideration';
  strength: 'strong' | 'moderate' | 'weak';
  summary: string;
  details?: string;
  supporters?: string[];
  rebuttals?: string[];
  sources?: { title: string; url?: string }[];
}

interface ArgumentMapProps {
  title: string;
  description?: string;
  mainClaim: string;
  proArguments: Argument[];
  conArguments: Argument[];
  considerations?: Argument[];
  verdict?: {
    position: string;
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
  };
}

const strengthColors = {
  strong: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  moderate: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  weak: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
};

const strengthLabels = {
  strong: '●●●',
  moderate: '●●○',
  weak: '●○○',
};

export function ArgumentMap({
  title,
  description,
  mainClaim,
  proArguments,
  conArguments,
  considerations,
  verdict,
}: ArgumentMapProps) {
  const [expandedArgs, setExpandedArgs] = useState<Set<string>>(new Set());
  const [showRebuttals, setShowRebuttals] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedArgs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedArgs(newExpanded);
  };

  const toggleRebuttals = (id: string) => {
    const newShow = new Set(showRebuttals);
    if (newShow.has(id)) {
      newShow.delete(id);
    } else {
      newShow.add(id);
    }
    setShowRebuttals(newShow);
  };

  const renderArgument = (arg: Argument, side: 'pro' | 'con') => {
    const isExpanded = expandedArgs.has(arg.id);
    const showingRebuttals = showRebuttals.has(arg.id);
    const colors = strengthColors[arg.strength];

    return (
      <div
        key={arg.id}
        className={`argument-card argument-${side}`}
        style={{ borderLeftColor: side === 'pro' ? '#22c55e' : '#ef4444' }}
      >
        <div className="argument-header" onClick={() => toggleExpand(arg.id)}>
          <div className="argument-claim">{arg.claim}</div>
          <div className="argument-meta">
            <span
              className="argument-strength"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.border,
              }}
              title={`${arg.strength} argument`}
            >
              {strengthLabels[arg.strength]}
            </span>
            <span className="argument-expand">{isExpanded ? '−' : '+'}</span>
          </div>
        </div>

        <div className="argument-summary">{arg.summary}</div>

        {isExpanded && (
          <div className="argument-details">
            {arg.details && <p className="argument-full">{arg.details}</p>}

            {arg.supporters && arg.supporters.length > 0 && (
              <div className="argument-supporters">
                <strong>Proponents:</strong> {arg.supporters.join(', ')}
              </div>
            )}

            {arg.rebuttals && arg.rebuttals.length > 0 && (
              <div className="argument-rebuttals-section">
                <button
                  className="rebuttals-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRebuttals(arg.id);
                  }}
                >
                  {showingRebuttals ? '▼' : '▶'} Rebuttals ({arg.rebuttals.length})
                </button>
                {showingRebuttals && (
                  <ul className="rebuttals-list">
                    {arg.rebuttals.map((rebuttal, i) => (
                      <li key={i}>{rebuttal}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {arg.sources && arg.sources.length > 0 && (
              <div className="argument-sources">
                <strong>Sources:</strong>{' '}
                {arg.sources.map((source, i) => (
                  <span key={i}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                    {i < arg.sources!.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="argument-map">
      <div className="argument-map-header">
        <h3 className="argument-map-title">{title}</h3>
        {description && <p className="argument-map-description">{description}</p>}
      </div>

      <div className="main-claim-box">
        <span className="main-claim-label">Main Claim</span>
        <div className="main-claim-text">{mainClaim}</div>
      </div>

      <div className="arguments-container">
        <div className="arguments-column arguments-pro">
          <h4 className="column-header column-header-pro">
            <span className="column-icon">✓</span> Arguments For
          </h4>
          {proArguments.map((arg) => renderArgument(arg, 'pro'))}
        </div>

        <div className="arguments-column arguments-con">
          <h4 className="column-header column-header-con">
            <span className="column-icon">✗</span> Arguments Against
          </h4>
          {conArguments.map((arg) => renderArgument(arg, 'con'))}
        </div>
      </div>

      {considerations && considerations.length > 0 && (
        <div className="considerations-section">
          <h4 className="considerations-header">Key Considerations</h4>
          <div className="considerations-list">
            {considerations.map((cons) => (
              <div key={cons.id} className="consideration-item">
                <strong>{cons.claim}:</strong> {cons.summary}
              </div>
            ))}
          </div>
        </div>
      )}

      {verdict && (
        <div className="verdict-section">
          <h4 className="verdict-header">Assessment</h4>
          <div className="verdict-content">
            <div className="verdict-position">
              <strong>Position:</strong> {verdict.position}
              <span className={`verdict-confidence confidence-${verdict.confidence}`}>
                ({verdict.confidence} confidence)
              </span>
            </div>
            <div className="verdict-reasoning">{verdict.reasoning}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArgumentMap;
