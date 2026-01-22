// Architecture Scenarios data loader

import yaml from 'js-yaml';
import graphYaml from './graphs/architecture-scenarios.yaml?raw';

interface RawSubItem {
  id?: string;
  label?: string;
  description?: string;
}

interface RawNode {
  id: string;
  label: string;
  description?: string;
  type: 'cause' | 'intermediate' | 'effect';
  order?: number;
  subgroup?: string;
  subItems?: RawSubItem[];
}

interface RawEdge {
  id: string;
  source: string;
  target: string;
  strength?: 'strong' | 'medium' | 'weak';
  effect?: 'increases' | 'decreases';
}

interface RawGraphData {
  nodes: RawNode[];
  edges: RawEdge[];
}

const rawData = yaml.load(graphYaml) as RawGraphData;

export interface ArchitectureProperty {
  id: string;
  label: string;
  description?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ArchitectureScenario {
  id: string;
  label: string;
  description?: string;
  likelihood: string;
  timeline: string;
  properties: ArchitectureProperty[];
}

export function getArchitectureScenarios(): ArchitectureScenario[] {
  const scenarios: ArchitectureScenario[] = [];
  const effectNodes = rawData.nodes.filter(n => n.type === 'effect');

  for (const effect of effectNodes) {
    // Find all edges pointing to this effect
    const incomingEdges = rawData.edges.filter(e => e.target === effect.id);

    const properties: ArchitectureProperty[] = [];

    for (const edge of incomingEdges) {
      const sourceNode = rawData.nodes.find(n => n.id === edge.source);
      if (!sourceNode) continue;

      properties.push({
        id: sourceNode.id,
        label: sourceNode.label,
        description: sourceNode.description,
        sentiment: edge.effect === 'decreases' ? 'negative' : 'positive',
      });
    }

    // Extract likelihood and timeline from subItems
    let likelihood = '';
    let timeline = '';

    if (effect.subItems) {
      for (const item of effect.subItems) {
        if (item.label?.includes('Likelihood:')) {
          likelihood = item.label.replace('Likelihood: ', '');
        }
        if (item.label?.includes('Timeline:')) {
          timeline = item.label.replace('Timeline: ', '');
        }
      }
    }

    scenarios.push({
      id: effect.id,
      label: effect.label,
      description: effect.description,
      likelihood,
      timeline,
      properties,
    });
  }

  return scenarios;
}

// Property categories for structured display
export const PROPERTY_CATEGORIES = [
  { key: 'whitebox', label: 'White-box Access' },
  { key: 'training', label: 'Training Access' },
  { key: 'predictable', label: 'Behavioral Predictability' },
  { key: 'repr', label: 'Representation Convergence' },
] as const;

// Get a normalized property rating for matrix view
export function getPropertyRating(scenario: ArchitectureScenario, propertyKey: string): {
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' | 'PARTIAL';
  sentiment: 'positive' | 'negative' | 'neutral';
} {
  const prop = scenario.properties.find(p => p.id.includes(propertyKey));
  if (!prop) return { level: 'UNKNOWN', sentiment: 'neutral' };

  const label = prop.label.toUpperCase();

  if (label.includes('HIGH') && !label.includes('MEDIUM')) {
    return { level: 'HIGH', sentiment: 'positive' };
  }
  if (label.includes('MEDIUM-HIGH')) {
    return { level: 'MEDIUM', sentiment: 'positive' };
  }
  if (label.includes('MEDIUM')) {
    return { level: 'MEDIUM', sentiment: 'neutral' };
  }
  if (label.includes('LOW')) {
    return { level: 'LOW', sentiment: 'negative' };
  }
  if (label.includes('PARTIAL')) {
    return { level: 'PARTIAL', sentiment: 'neutral' };
  }
  if (label.includes('UNKNOWN') || label.includes('UNCERTAIN')) {
    return { level: 'UNKNOWN', sentiment: 'neutral' };
  }
  if (label.includes('LIMITED')) {
    return { level: 'LOW', sentiment: 'negative' };
  }
  if (label.includes('SIMILAR')) {
    return { level: 'MEDIUM', sentiment: 'positive' };
  }
  if (label.includes('COMPLEX')) {
    return { level: 'MEDIUM', sentiment: 'neutral' };
  }
  if (label.includes('LIKELY')) {
    return { level: 'HIGH', sentiment: 'positive' };
  }

  return { level: 'UNKNOWN', sentiment: 'neutral' };
}

export const rawArchitectureData = rawData;
