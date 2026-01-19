import React, { useState, useMemo } from 'react';

interface Parameter {
  id: string;
  name: string;
  baseValue: number;
  min: number;
  max: number;
  unit: string;
}

interface SensitivityResult {
  parameterId: string;
  parameterName: string;
  lowValue: number;
  highValue: number;
  lowRisk: number;
  highRisk: number;
  baseRisk: number;
  elasticity: number;
  importance: number;
}

// Simple risk model for demonstration
function calculateRisk(params: Record<string, number>): number {
  const prob1 = params.prob_error || 0.05;
  const damage1 = params.damage_error || 1000;
  const prob2 = params.prob_security || 0.01;
  const damage2 = params.damage_security || 5000;
  const prob3 = params.prob_outage || 0.02;
  const damage3 = params.damage_outage || 3000;
  const mitigationEffect = params.mitigation || 0.7;

  const baseRisk = (prob1 * damage1 + prob2 * damage2 + prob3 * damage3);
  return baseRisk * (1 - mitigationEffect);
}

const defaultParameters: Parameter[] = [
  { id: 'prob_error', name: 'Error Probability', baseValue: 0.05, min: 0.01, max: 0.15, unit: '' },
  { id: 'damage_error', name: 'Error Damage', baseValue: 1000, min: 200, max: 5000, unit: '$' },
  { id: 'prob_security', name: 'Security Incident Prob', baseValue: 0.01, min: 0.001, max: 0.05, unit: '' },
  { id: 'damage_security', name: 'Security Incident Damage', baseValue: 5000, min: 1000, max: 20000, unit: '$' },
  { id: 'prob_outage', name: 'Outage Probability', baseValue: 0.02, min: 0.005, max: 0.08, unit: '' },
  { id: 'damage_outage', name: 'Outage Damage', baseValue: 3000, min: 500, max: 10000, unit: '$' },
  { id: 'mitigation', name: 'Mitigation Effectiveness', baseValue: 0.7, min: 0.3, max: 0.95, unit: '' },
];

function TornadoChart({ results, baseRisk }: { results: SensitivityResult[], baseRisk: number }) {
  const sortedResults = [...results].sort((a, b) => b.importance - a.importance);
  const maxSwing = Math.max(...results.map(r => Math.max(Math.abs(r.lowRisk - baseRisk), Math.abs(r.highRisk - baseRisk))));

  const width = 500;
  const barHeight = 28;
  const height = sortedResults.length * (barHeight + 8) + 40;
  const centerX = width / 2;
  const maxBarWidth = (width - 200) / 2;

  return (
    <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
      {/* Center line */}
      <line x1={centerX} y1={20} x2={centerX} y2={height - 20} stroke="var(--sl-color-gray-4)" strokeWidth="2" />

      {/* Base risk label */}
      <text x={centerX} y={12} textAnchor="middle" fontSize="11" fill="var(--sl-color-gray-3)">
        Base: ${baseRisk.toFixed(0)}
      </text>

      {sortedResults.map((result, i) => {
        const y = 30 + i * (barHeight + 8);
        const lowWidth = ((baseRisk - result.lowRisk) / maxSwing) * maxBarWidth;
        const highWidth = ((result.highRisk - baseRisk) / maxSwing) * maxBarWidth;

        return (
          <g key={result.parameterId}>
            {/* Parameter name */}
            <text x={10} y={y + barHeight / 2 + 4} fontSize="11" fill="var(--sl-color-text)">
              {result.parameterName}
            </text>

            {/* Low bar (left, green - risk reduction) */}
            {lowWidth > 0 && (
              <rect
                x={centerX - lowWidth}
                y={y}
                width={lowWidth}
                height={barHeight}
                fill="#22c55e"
                opacity={0.8}
              />
            )}

            {/* High bar (right, red - risk increase) */}
            {highWidth > 0 && (
              <rect
                x={centerX}
                y={y}
                width={highWidth}
                height={barHeight}
                fill="#ef4444"
                opacity={0.8}
              />
            )}

            {/* Value labels */}
            <text x={centerX - lowWidth - 5} y={y + barHeight / 2 + 4} textAnchor="end" fontSize="10" fill="var(--sl-color-gray-3)">
              ${result.lowRisk.toFixed(0)}
            </text>
            <text x={centerX + highWidth + 5} y={y + barHeight / 2 + 4} textAnchor="start" fontSize="10" fill="var(--sl-color-gray-3)">
              ${result.highRisk.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <rect x={width - 130} y={10} width={12} height={12} fill="#22c55e" />
      <text x={width - 115} y={20} fontSize="10" fill="var(--sl-color-gray-3)">Lower risk</text>
      <rect x={width - 130} y={26} width={12} height={12} fill="#ef4444" />
      <text x={width - 115} y={36} fontSize="10" fill="var(--sl-color-gray-3)">Higher risk</text>
    </svg>
  );
}

function ElasticityTable({ results }: { results: SensitivityResult[] }) {
  const sortedResults = [...results].sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--sl-color-gray-5)' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
            <th style={{ textAlign: 'right', padding: '8px' }}>Elasticity</th>
            <th style={{ textAlign: 'right', padding: '8px' }}>Risk Range</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {sortedResults.map(result => (
            <tr key={result.parameterId} style={{ borderBottom: '1px solid var(--sl-color-gray-6)' }}>
              <td style={{ padding: '8px' }}>{result.parameterName}</td>
              <td style={{
                padding: '8px',
                textAlign: 'right',
                fontWeight: '600',
                color: Math.abs(result.elasticity) > 0.5 ? '#ef4444' : Math.abs(result.elasticity) > 0.2 ? '#f59e0b' : 'var(--sl-color-text)'
              }}>
                {result.elasticity > 0 ? '+' : ''}{result.elasticity.toFixed(2)}
              </td>
              <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                ${result.lowRisk.toFixed(0)} - ${result.highRisk.toFixed(0)}
              </td>
              <td style={{ padding: '8px', fontSize: '11px', color: 'var(--sl-color-gray-3)' }}>
                {Math.abs(result.elasticity) > 0.5
                  ? "High impact - prioritize"
                  : Math.abs(result.elasticity) > 0.2
                  ? "Moderate impact"
                  : "Low impact"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SensitivityDashboard() {
  const [parameters, setParameters] = useState<Parameter[]>(defaultParameters);
  const [selectedParam, setSelectedParam] = useState<string | null>(null);

  // Calculate sensitivity for each parameter
  const results: SensitivityResult[] = useMemo(() => {
    const baseParams: Record<string, number> = {};
    parameters.forEach(p => { baseParams[p.id] = p.baseValue; });
    const baseRisk = calculateRisk(baseParams);

    return parameters.map(param => {
      // Calculate risk at low and high parameter values
      const lowParams = { ...baseParams, [param.id]: param.min };
      const highParams = { ...baseParams, [param.id]: param.max };

      const lowRisk = calculateRisk(lowParams);
      const highRisk = calculateRisk(highParams);

      // Elasticity: % change in risk / % change in parameter
      const paramChange = (param.max - param.min) / param.baseValue;
      const riskChange = (highRisk - lowRisk) / baseRisk;
      const elasticity = riskChange / paramChange;

      // Importance: absolute swing in risk
      const importance = Math.abs(highRisk - lowRisk);

      return {
        parameterId: param.id,
        parameterName: param.name,
        lowValue: param.min,
        highValue: param.max,
        lowRisk,
        highRisk,
        baseRisk,
        elasticity,
        importance,
      };
    });
  }, [parameters]);

  const baseRisk = useMemo(() => {
    const baseParams: Record<string, number> = {};
    parameters.forEach(p => { baseParams[p.id] = p.baseValue; });
    return calculateRisk(baseParams);
  }, [parameters]);

  const updateParameter = (id: string, field: keyof Parameter, value: number) => {
    setParameters(parameters.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const topFactors = [...results].sort((a, b) => b.importance - a.importance).slice(0, 3);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '0 0.5rem' }}>
      {/* Summary */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '4px' }}>Base Monthly Risk</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>${baseRisk.toFixed(0)}</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '8px' }}>Top Drivers</div>
            {topFactors.map((factor, i) => (
              <div key={factor.parameterId} style={{
                fontSize: '12px',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'flex-end',
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#22c55e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                }}>{i + 1}</span>
                {factor.parameterName}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tornado Chart */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Tornado Diagram</div>
        <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '16px' }}>
          Shows impact of each parameter varying from minimum to maximum while others stay at base values
        </div>

        <TornadoChart results={results} baseRisk={baseRisk} />
      </div>

      {/* Elasticity Table */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Parameter Elasticities</div>
        <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '16px' }}>
          Elasticity = % change in risk / % change in parameter. Higher absolute values indicate more sensitive parameters.
        </div>

        <ElasticityTable results={results} />
      </div>

      {/* Parameter Editor */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Edit Parameters</div>
        <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '16px' }}>
          Adjust base values and ranges to match your specific situation
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {parameters.map(param => (
            <div key={param.id} style={{
              padding: '12px',
              background: 'var(--sl-color-bg)',
              borderRadius: '6px',
              border: '1px solid var(--sl-color-gray-5)',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{param.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                    Min
                  </label>
                  <input
                    type="number"
                    step={param.baseValue < 1 ? 0.01 : 100}
                    value={param.min}
                    onChange={(e) => updateParameter(param.id, 'min', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid var(--sl-color-gray-5)',
                      borderRadius: '4px',
                      background: 'var(--sl-color-bg)',
                      color: 'var(--sl-color-text)',
                      fontSize: '12px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                    Base Value
                  </label>
                  <input
                    type="number"
                    step={param.baseValue < 1 ? 0.01 : 100}
                    value={param.baseValue}
                    onChange={(e) => updateParameter(param.id, 'baseValue', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '2px solid #3b82f6',
                      borderRadius: '4px',
                      background: 'var(--sl-color-bg)',
                      color: 'var(--sl-color-text)',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                    Max
                  </label>
                  <input
                    type="number"
                    step={param.baseValue < 1 ? 0.01 : 100}
                    value={param.max}
                    onChange={(e) => updateParameter(param.id, 'max', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid var(--sl-color-gray-5)',
                      borderRadius: '4px',
                      background: 'var(--sl-color-bg)',
                      color: 'var(--sl-color-text)',
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%)',
        borderRadius: '8px',
        border: '1px solid var(--sl-color-gray-5)',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Optimization Recommendations</div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
          {topFactors.map((factor, i) => (
            <li key={factor.parameterId} style={{ marginBottom: '4px' }}>
              <strong>{factor.parameterName}</strong>:
              {factor.elasticity > 0
                ? ` Reducing this from ${factor.highValue.toFixed(factor.highValue < 1 ? 2 : 0)} to ${factor.lowValue.toFixed(factor.lowValue < 1 ? 2 : 0)} could save ~$${(factor.highRisk - factor.lowRisk).toFixed(0)}/month`
                : ` Increasing this from ${factor.lowValue.toFixed(factor.lowValue < 1 ? 2 : 0)} to ${factor.highValue.toFixed(factor.highValue < 1 ? 2 : 0)} could save ~$${(factor.lowRisk - factor.highRisk).toFixed(0)}/month`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
