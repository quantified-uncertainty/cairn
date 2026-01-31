---
name: cause-effect-diagram
description: Create or edit causeEffectGraph YAML for AI Transition Model entities. Use when building causal models, adding diagrams to entities, or modeling factor relationships.
allowed-tools: Read, Edit, Grep, WebSearch
---

# Cause-Effect Diagram Creation

Create interactive cause-effect diagrams that visualize causal relationships in the AI Transition Model.

## YAML Schema

Add `causeEffectGraph` to entities in `src/data/entities/ai-transition-model.yaml`:

```yaml
causeEffectGraph:
  title: "Diagram Title"           # Optional, falls back to entity title
  description: "Brief explanation" # Optional, shown in header
  primaryNodeId: "main-effect"     # Optional, highlights this node

  nodes:
    - id: node-id                  # Required: unique kebab-case identifier
      label: "Node Label"          # Required: display text (2-5 words)
      type: leaf                   # Required: leaf|cause|intermediate|effect
      description: "Hover text"    # Optional: brief explanation

  edges:
    - source: cause-node           # Required: source node id
      target: effect-node          # Required: target node id
      strength: strong             # Optional: weak|medium|strong (default: medium)
      effect: increases            # Optional: increases|decreases|mixed (default: increases)
```

## Node Types (Hierarchical Flow)

| Type | Purpose | Color | Use For |
|------|---------|-------|---------|
| `leaf` | Root inputs | Teal/cyan | External factors, base resources |
| `cause` | Derived factors | Light gray | Factors derived from leaves |
| `intermediate` | Direct factors | Darker gray | Direct contributing factors |
| `effect` | Target outcome | Amber/yellow | The main outcome being modeled |

Nodes flow: leaf → cause → intermediate → effect

## Edge Strengths

| Strength | Line Weight | Use When |
|----------|-------------|----------|
| `strong` | 3px | Direct, well-established causal link |
| `medium` | 2px | Meaningful but indirect influence |
| `weak` | 1.2px | Minor or speculative connection |

## Best Practices

1. **Node Count**: 10-15 nodes optimal, max 20
2. **No Feedback Loops**: Dagre layout doesn't handle cycles - note them in description instead
3. **Differentiate Strengths**: Use all three strengths to show relative importance
4. **Short Labels**: 2-5 words per node, details in description
5. **Layer Organization**: Organize nodes by causal depth (leaves at top, effect at bottom)
6. **Unique IDs**: Use descriptive kebab-case IDs

## Process

1. **Identify the target outcome** - This becomes the `effect` node
2. **List direct factors** - These become `intermediate` nodes
3. **Find upstream causes** - These become `cause` nodes
4. **Identify root inputs** - External factors become `leaf` nodes
5. **Draw edges** - Connect causes to effects with appropriate strengths
6. **Write descriptions** - Add hover text explaining each node

## Example: Compute Diagram

```yaml
causeEffectGraph:
  title: "What Drives Effective AI Compute?"
  description: "Causal factors affecting frontier AI training compute."
  primaryNodeId: effective-compute
  nodes:
    - id: taiwan-stability
      label: Taiwan Stability
      type: leaf
      description: Geopolitical risk to TSMC.
    - id: fab-capacity
      label: Fab Capacity
      type: cause
      description: Advanced node manufacturing.
    - id: chip-supply
      label: Chip Supply
      type: intermediate
      description: Total advanced AI chips produced.
    - id: effective-compute
      label: Effective Compute
      type: effect
      description: Net compute available for frontier AI training.
  edges:
    - source: taiwan-stability
      target: fab-capacity
      strength: strong
      effect: increases
    - source: fab-capacity
      target: chip-supply
      strength: strong
    - source: chip-supply
      target: effective-compute
      strength: strong
```

## File Location

All AI Transition Model entities are in:
`src/data/entities/ai-transition-model.yaml`

Find the entity by searching for `id: tmc-{factor-name}` (e.g., `id: tmc-algorithms`).

## Viewing Diagrams

- In-page: Rendered by `TransitionModelContent` component
- Standalone: `/diagrams?entity={entity-id}`
- Index: `/diagrams` lists all available diagrams
