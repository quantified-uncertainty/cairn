# Mermaid Diagram Guidelines

## Basic Usage

Use the `<Mermaid>` component (not code blocks):

```jsx
<Mermaid client:load chart={`
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
`} />
```

## Best Practices

- Prefer vertical flowcharts (`TD`) over horizontal (`LR`)
- Maximum 15 nodes per diagram
- Maximum 3 subgraphs
- Use semantic colors (red for risks, green for interventions)

## Common Syntax Issues

**Subgraph syntax**: Use `subgraph id["Label"]` not `subgraph "Label"`

```mermaid
# Good
subgraph risks["Risk Factors"]
    A --> B
end

# Bad - causes parsing errors
subgraph "Risk Factors"
    A --> B
end
```

**Avoid comparison operators in labels**: Use "above 0.5" instead of "> 0.5"

```mermaid
# Good
A["Probability above 0.5"]

# Bad - parsed as HTML tag
A["Probability > 0.5"]
```

## Validation

Run `npm run crux -- validate mermaid` to check diagram syntax.

Common errors caught:
- Unquoted labels with special characters
- Invalid subgraph IDs
- Comparison operators in labels
- Unclosed subgraphs
