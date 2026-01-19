import React, { useState } from 'react';

interface Component {
  name: string;
  type: 'deterministic' | 'narrow_ml' | 'general_llm' | 'rl_agent' | 'human';
  failureProb: number;
  damagePotential: number;
}

interface Architecture {
  id: string;
  name: string;
  description: string;
  components: Component[];
  mitigations: string[];
  color: string;
}

const componentTypeInfo = {
  deterministic: { label: 'Deterministic', baseProb: 0.001, color: '#22c55e' },
  narrow_ml: { label: 'Narrow ML', baseProb: 0.03, color: '#3b82f6' },
  general_llm: { label: 'General LLM', baseProb: 0.1, color: '#f59e0b' },
  rl_agent: { label: 'RL Agent', baseProb: 0.2, color: '#ef4444' },
  human: { label: 'Human', baseProb: 0.05, color: '#8b5cf6' },
};

const defaultArchitectures: Architecture[] = [
  {
    id: 'baseline',
    name: 'Baseline (Human Only)',
    description: 'Traditional human-driven process with no AI delegation',
    components: [
      { name: 'Human Operator', type: 'human', failureProb: 0.05, damagePotential: 2000 },
    ],
    mitigations: ['Training', 'Checklists'],
    color: '#8b5cf6',
  },
  {
    id: 'simple_ai',
    name: 'Simple AI Assist',
    description: 'AI provides suggestions, human makes all decisions',
    components: [
      { name: 'LLM Recommender', type: 'general_llm', failureProb: 0.1, damagePotential: 500 },
      { name: 'Human Review', type: 'human', failureProb: 0.03, damagePotential: 2000 },
    ],
    mitigations: ['Output filtering', 'Human approval'],
    color: '#3b82f6',
  },
  {
    id: 'autonomous',
    name: 'Autonomous AI',
    description: 'AI handles routine tasks, human handles exceptions',
    components: [
      { name: 'Task Router', type: 'narrow_ml', failureProb: 0.02, damagePotential: 300 },
      { name: 'LLM Executor', type: 'general_llm', failureProb: 0.08, damagePotential: 1500 },
      { name: 'Exception Handler', type: 'human', failureProb: 0.04, damagePotential: 3000 },
    ],
    mitigations: ['Sandboxing', 'Rate limiting', 'Monitoring'],
    color: '#f59e0b',
  },
  {
    id: 'full_auto',
    name: 'Full Automation',
    description: 'End-to-end AI with minimal human intervention',
    components: [
      { name: 'Orchestrator Agent', type: 'rl_agent', failureProb: 0.15, damagePotential: 5000 },
      { name: 'Execution LLM', type: 'general_llm', failureProb: 0.1, damagePotential: 2000 },
      { name: 'Verification ML', type: 'narrow_ml', failureProb: 0.03, damagePotential: 1000 },
    ],
    mitigations: ['Defense in depth', 'Tripwires', 'Circuit breakers'],
    color: '#ef4444',
  },
];

function calculateArchitectureRisk(arch: Architecture): { expected: number; worst: number } {
  let expectedTotal = 0;
  let worstCase = 0;

  for (const comp of arch.components) {
    expectedTotal += comp.failureProb * comp.damagePotential;
    worstCase += comp.damagePotential;
  }

  // Apply mitigation discount
  const mitigationFactor = Math.pow(0.85, arch.mitigations.length);
  expectedTotal *= mitigationFactor;

  return { expected: expectedTotal, worst: worstCase };
}

function RiskBar({ expected, worst, maxWorst, color }: { expected: number; worst: number; maxWorst: number; color: string }) {
  const expectedWidth = (expected / maxWorst) * 100;
  const worstWidth = (worst / maxWorst) * 100;

  return (
    <div style={{ position: 'relative', height: '24px', background: 'var(--sl-color-gray-6)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: `${worstWidth}%`,
        background: color,
        opacity: 0.2,
      }} />
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: `${expectedWidth}%`,
        background: color,
        opacity: 0.8,
      }} />
      <div style={{
        position: 'absolute',
        left: `${expectedWidth}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        border: `2px solid ${color}`,
        borderRadius: '50%',
        width: '12px',
        height: '12px',
      }} />
    </div>
  );
}

function ComponentBreakdown({ components }: { components: Component[] }) {
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {components.map((comp, i) => (
        <div key={i} style={{
          padding: '4px 8px',
          background: componentTypeInfo[comp.type].color,
          color: 'white',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '500',
        }}>
          {comp.name}
        </div>
      ))}
    </div>
  );
}

export default function ArchitectureComparator() {
  const [architectures, setArchitectures] = useState<Architecture[]>(defaultArchitectures);
  const [selectedArch, setSelectedArch] = useState<string | null>(null);

  const risks = architectures.map(arch => ({
    ...arch,
    risk: calculateArchitectureRisk(arch),
  }));

  const maxWorst = Math.max(...risks.map(r => r.risk.worst));
  const minExpected = Math.min(...risks.map(r => r.risk.expected));

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '0 0.5rem' }}>
      {/* Overview */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Architecture Comparison</div>
        <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '16px' }}>
          Compare risk profiles of different delegation architectures. Darker bars show expected monthly risk; lighter bars show worst-case potential.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {risks.map(arch => (
            <div
              key={arch.id}
              onClick={() => setSelectedArch(selectedArch === arch.id ? null : arch.id)}
              style={{
                padding: '12px',
                background: selectedArch === arch.id ? 'var(--sl-color-bg)' : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                border: selectedArch === arch.id ? `2px solid ${arch.color}` : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: arch.color }}>{arch.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)' }}>{arch.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>${arch.risk.expected.toFixed(0)}/mo</div>
                  <div style={{ fontSize: '10px', color: 'var(--sl-color-gray-3)' }}>expected</div>
                </div>
              </div>
              <RiskBar expected={arch.risk.expected} worst={arch.risk.worst} maxWorst={maxWorst} color={arch.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Selected Architecture Detail */}
      {selectedArch && (
        <div style={{
          padding: '16px',
          background: 'var(--sl-color-gray-6)',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          {(() => {
            const arch = risks.find(a => a.id === selectedArch)!;
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: arch.color }}>{arch.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)' }}>{arch.description}</div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Components</div>
                <div style={{ marginBottom: '16px' }}>
                  <ComponentBreakdown components={arch.components} />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--sl-color-gray-5)' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Component</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Failure Prob</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Damage Potential</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Expected Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arch.components.map((comp, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--sl-color-gray-6)' }}>
                        <td style={{ padding: '8px', fontWeight: '500' }}>{comp.name}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            background: componentTypeInfo[comp.type].color,
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '10px',
                          }}>
                            {componentTypeInfo[comp.type].label}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{(comp.failureProb * 100).toFixed(1)}%</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>${comp.damagePotential.toLocaleString()}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>
                          ${(comp.failureProb * comp.damagePotential).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Mitigations</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {arch.mitigations.map((mit, i) => (
                    <span key={i} style={{
                      padding: '4px 10px',
                      background: 'var(--sl-color-bg)',
                      border: '1px solid var(--sl-color-gray-5)',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}>
                      {mit}
                    </span>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Comparison Summary */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Trade-off Analysis</div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--sl-color-gray-5)' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Architecture</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Expected Risk</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Worst Case</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Components</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Mitigations</th>
            </tr>
          </thead>
          <tbody>
            {risks.map(arch => {
              const isLowest = arch.risk.expected === minExpected;
              return (
                <tr key={arch.id} style={{
                  borderBottom: '1px solid var(--sl-color-gray-6)',
                  background: isLowest ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                }}>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: arch.color, fontWeight: '600' }}>{arch.name}</span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>
                    ${arch.risk.expected.toFixed(0)}/mo
                    {isLowest && <span style={{ color: '#22c55e', marginLeft: '4px' }}>*</span>}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${arch.risk.worst.toLocaleString()}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{arch.components.length}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{arch.mitigations.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Component Type Legend</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {Object.entries(componentTypeInfo).map(([key, info]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: info.color,
              }} />
              <span style={{ fontSize: '12px' }}>{info.label}</span>
              <span style={{ fontSize: '10px', color: 'var(--sl-color-gray-3)' }}>
                (~{(info.baseProb * 100).toFixed(1)}% base)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
