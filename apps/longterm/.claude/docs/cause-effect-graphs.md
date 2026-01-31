# Cause-Effect Graph Guidelines

Cause-effect graphs visualize causal relationships between factors using ReactFlow. Use these for AI Transition Model entity pages.

## When to Use

- **Cause-effect graphs**: For entity-specific causal models showing what affects a particular factor
- **Mermaid diagrams**: For general flowcharts, sequences, or simpler relationship diagrams

## Graph Structure Pattern

For factor-level pages, use a **three-tier structure**:

1. **Upstream drivers** (leaf nodes): What drives each sub-component
2. **Sub-components** (intermediate nodes): The model's defined sub-items (use entityRef)
3. **Critical questions** (leaf nodes): Key uncertainties that affect the outcome
4. **Output** (effect node): The factor being explained

## Node Content Guidelines

**DO use:**
- Conceptually interesting causal factors (e.g., "Paradigm Discoveries", "Chip Supply Chain")
- The model's existing sub-components with entityRef links
- Critical questions phrased as questions (e.g., "Will scaling hit a ceiling?")
- Factors someone with domain knowledge would identify as important

**DON'T use:**
- Arbitrary statistics as node names (e.g., "IMF: 40% Jobs Exposed")
- Generic labels (e.g., "Global Politics" instead of "Taiwan Strait Tension")
- Data points pulled from reports without conceptual framing

## Node Types

| Type | Position | Purpose |
|------|----------|---------|
| `leaf` | Top/sides | Upstream drivers and critical questions |
| `intermediate` | Middle | Sub-components from the model (use entityRef) |
| `effect` | Bottom | The factor/outcome being explained |

## Edge Styling

**Strength determines visual importance:**
- `strong`: Thick line (primary causal relationships)
- `medium`: Normal line (significant but secondary)
- `weak`: Thin line (minor or uncertain relationships)

**Effect direction:**
- `increases` (default): Normal arrow
- `decreases`: Red-tinted line
- `mixed`: Dashed line (use for critical questions/uncertainties)

## Example YAML

```yaml
causeEffectGraph:
  title: "What Drives AI Capabilities?"
  description: "The three pillars of AI capability, their drivers, and key uncertainties."
  primaryNodeId: ai-capabilities
  nodes:
    - id: chip-supply-chain
      label: "Chip Supply Chain"
      type: leaf
      description: "TSMC/ASML concentration, Taiwan geopolitical risk."
    - id: compute
      label: "Compute"
      type: intermediate
      entityRef: tmc-compute
      description: "Hardware and energy available for training."
    - id: ai-capabilities
      label: "AI Capabilities"
      type: effect
      description: "Aggregate frontier AI capability level."
  edges:
    - source: chip-supply-chain
      target: compute
      strength: strong
    - source: compute
      target: ai-capabilities
      strength: strong
```

## Best Practices

1. **Use the model's structure**: Check for existing sub-components (parentFactor relationships) and use them as intermediate nodes
2. **Add critical questions**: Include 1-3 key uncertainties as leaf nodes with `effect: mixed`
3. **Set primaryNodeId**: Highlight the node representing the current page
4. **Link to ATM entities**: Use `entityRef` to connect sub-components to their pages
5. **Show relative importance**: Use `strength` on edges to distinguish critical vs minor relationships
6. **Aim for 10-15 nodes**: Enough depth to be informative, not so many it's overwhelming

## Schema Location

Cause-effect graph schema is defined in `src/data/schema.ts`:
- `CauseEffectNode`: Node with id, label, type, entityRef, confidence
- `CauseEffectEdge`: Edge with source, target, strength, effect, confidence
- `CauseEffectGraph`: Container with title, description, primaryNodeId, nodes, edges

Data is stored in entity YAML files under the `causeEffectGraph` field.

## Graph Sync Architecture

**Two-tier system with single source of truth:**

1. **Master Graph** (`src/data/graphs/ai-transition-model-master.yaml`)
   - Contains ALL node definitions (categories, sub-items, detailed nodes)
   - Single source of truth for node IDs, labels, descriptions
   - Viewable at `/diagrams/master-graph/`

2. **Individual Entity Diagrams** (`src/data/entities/ai-transition-model.yaml`)
   - Each entity can have a `causeEffectGraph` field
   - Define which nodes to include and their edge relationships
   - Nodes MUST exist in master graph (enforced by validation)

**Sync workflow:**
```bash
node scripts/graph/analyze-graph-sync.mjs              # Check sync status
node scripts/graph/add-missing-nodes-to-master.mjs --dry-run  # Preview
node scripts/graph/add-missing-nodes-to-master.mjs --apply    # Apply
npm run validate  # Includes graph sync validation
```
