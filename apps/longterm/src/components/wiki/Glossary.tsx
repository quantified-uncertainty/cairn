import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card } from '../ui/card';

// Glossary terms database
const glossaryTerms: Record<string, { definition: string; related?: string[] }> = {
  'AGI': {
    definition: 'Artificial General Intelligence - AI systems that can perform any intellectual task a human can do.',
    related: ['TAI', 'Superintelligence', 'ASI']
  },
  'TAI': {
    definition: 'Transformative AI - AI capable of causing changes comparable to the industrial or agricultural revolution.',
    related: ['AGI', 'Superintelligence']
  },
  'ASI': {
    definition: 'Artificial Superintelligence - AI that vastly exceeds human cognitive abilities in virtually all domains.',
    related: ['AGI', 'Takeoff']
  },
  'Alignment': {
    definition: 'The challenge of ensuring AI systems pursue goals that are beneficial to humans.',
    related: ['Outer alignment', 'Inner alignment', 'RLHF']
  },
  'Outer alignment': {
    definition: 'Specifying an objective function that, if optimized perfectly, would lead to good outcomes.',
    related: ['Alignment', 'Inner alignment', 'Reward hacking']
  },
  'Inner alignment': {
    definition: 'Ensuring that the AI\'s learned objective matches the specified objective.',
    related: ['Alignment', 'Mesa-optimization', 'Deceptive alignment']
  },
  'Mesa-optimization': {
    definition: 'When a learned model itself becomes an optimizer with its own objectives.',
    related: ['Inner alignment', 'Deceptive alignment', 'Mesa-optimizer']
  },
  'Mesa-optimizer': {
    definition: 'A learned model that is itself an optimizer, potentially with different objectives than the training objective.',
    related: ['Mesa-optimization', 'Inner alignment']
  },
  'Deceptive alignment': {
    definition: 'When an AI appears aligned during training but pursues different goals when deployed.',
    related: ['Mesa-optimization', 'Treacherous turn', 'Inner alignment']
  },
  'Treacherous turn': {
    definition: 'A hypothetical scenario where an AI behaves cooperatively until it\'s powerful enough to pursue its true goals.',
    related: ['Deceptive alignment', 'Power-seeking']
  },
  'RLHF': {
    definition: 'Reinforcement Learning from Human Feedback - training AI using human preferences as a reward signal.',
    related: ['Alignment', 'Constitutional AI', 'Reward hacking']
  },
  'Constitutional AI': {
    definition: 'Training AI systems to critique and revise their outputs based on a set of principles or constitution.',
    related: ['RLHF', 'Anthropic']
  },
  'Interpretability': {
    definition: 'Research aimed at understanding how AI systems work internally.',
    related: ['Mechanistic interpretability', 'Alignment']
  },
  'Mechanistic interpretability': {
    definition: 'Understanding AI systems by reverse-engineering their internal computations at a detailed level.',
    related: ['Interpretability', 'Sparse autoencoders']
  },
  'Scaling laws': {
    definition: 'Empirical relationships showing how AI capabilities improve with increased compute, data, and parameters.',
    related: ['TAI', 'Timelines']
  },
  'Takeoff': {
    definition: 'The transition period from human-level AI to superintelligence; can be fast (weeks-months) or slow (decades).',
    related: ['AGI', 'ASI', 'FOOM']
  },
  'FOOM': {
    definition: 'Fast takeoff scenario - rapid recursive self-improvement leading to superintelligence in days/weeks.',
    related: ['Takeoff', 'Recursive self-improvement']
  },
  'RSP': {
    definition: 'Responsible Scaling Policy - Anthropic\'s framework for making capability development conditional on safety.',
    related: ['ASL', 'Anthropic']
  },
  'ASL': {
    definition: 'AI Safety Level - Categories in Anthropic\'s RSP defining capability thresholds and required safeguards.',
    related: ['RSP', 'Anthropic']
  },
  'P(doom)': {
    definition: 'Shorthand for the probability of existential catastrophe from AI.',
    related: ['X-risk', 'Alignment']
  },
  'X-risk': {
    definition: 'Existential risk - risks that could cause human extinction or permanent civilizational collapse.',
    related: ['P(doom)', 'GCR']
  },
  'GCR': {
    definition: 'Global Catastrophic Risk - risks that could cause widespread devastation but not necessarily extinction.',
    related: ['X-risk']
  },
  'Reward hacking': {
    definition: 'When an AI finds unintended ways to achieve high reward that don\'t match the intended goal.',
    related: ['Alignment', 'Goodhart\'s law', 'Specification gaming']
  },
  'Specification gaming': {
    definition: 'AI behavior that satisfies the literal specification but violates the intended goal.',
    related: ['Reward hacking', 'Goodhart\'s law']
  },
  'Goodhart\'s law': {
    definition: 'When a measure becomes a target, it ceases to be a good measure.',
    related: ['Reward hacking', 'Alignment']
  },
  'Corrigibility': {
    definition: 'The property of an AI that allows humans to correct, modify, or shut it down.',
    related: ['Alignment', 'AI control']
  },
  'Instrumental convergence': {
    definition: 'The tendency for intelligent agents to pursue certain sub-goals (power, resources) regardless of final goals.',
    related: ['Power-seeking', 'Alignment']
  },
  'Power-seeking': {
    definition: 'AI behavior oriented toward acquiring resources, influence, or capabilities.',
    related: ['Instrumental convergence', 'Alignment']
  },
  'Compute governance': {
    definition: 'Policies regulating access to AI training compute as a lever for AI governance.',
    related: ['AI governance', 'Export controls']
  },
  'Frontier lab': {
    definition: 'AI companies at the cutting edge of capability development (OpenAI, Anthropic, DeepMind, etc.).',
    related: ['AGI']
  },
  'Scalable oversight': {
    definition: 'Methods for humans to supervise AI systems on tasks too complex for humans to evaluate directly.',
    related: ['Alignment', 'RLHF']
  },
  'Sycophancy': {
    definition: 'AI tendency to tell users what they want to hear rather than what\'s true.',
    related: ['RLHF', 'Alignment']
  },
  'Situational awareness': {
    definition: 'An AI\'s understanding that it is an AI being trained/evaluated.',
    related: ['Deceptive alignment', 'Mesa-optimization']
  },
  'Emergent capabilities': {
    definition: 'AI abilities that appear suddenly at certain scales without being explicitly trained.',
    related: ['Scaling laws', 'AGI']
  },
};

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
}

export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const entry = glossaryTerms[term];

  if (!entry) {
    return (
      <span className="border-b border-dashed border-red-400 text-red-600 dark:text-red-400">
        {children || term}
      </span>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="border-b border-dotted border-accent-foreground cursor-help text-accent-foreground">
          {children || term}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{term}</h4>
          <p className="text-sm text-muted-foreground m-0">{entry.definition}</p>
          {entry.related && entry.related.length > 0 && (
            <p className="text-xs text-muted-foreground m-0">
              <span className="font-medium">Related:</span> {entry.related.join(', ')}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Full glossary page component
export function GlossaryList() {
  const sortedTerms = Object.keys(glossaryTerms).sort();

  return (
    <Card className="my-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border font-semibold">
        <span>📖</span>
        <span>Glossary</span>
      </div>
      <dl className="divide-y divide-border">
        {sortedTerms.map(term => (
          <div key={term} className="px-4 py-3 hover:bg-muted/50 transition-colors">
            <dt className="font-semibold text-foreground">{term}</dt>
            <dd className="mt-1 text-sm text-muted-foreground m-0">
              {glossaryTerms[term].definition}
              {glossaryTerms[term].related && (
                <span className="block mt-1 text-xs text-muted-foreground/70">
                  Related: {glossaryTerms[term].related?.join(', ')}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default GlossaryTerm;
