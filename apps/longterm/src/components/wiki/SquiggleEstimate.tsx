/**
 * Minimal SquiggleEstimate stub for Astro.
 * The full interactive version lives in longterm-next.
 * This renders the code as a styled code block.
 */
interface SquiggleEstimateProps {
  title?: string;
  code?: string;
  children?: any;
  showEditor?: boolean;
}

export function SquiggleEstimate({ title, code, children }: SquiggleEstimateProps) {
  const displayCode = code || (typeof children === "string" ? children : "") || "";
  return (
    <div style={{ margin: "1rem 0", border: "1px solid var(--sl-color-gray-5)", borderRadius: "0.5rem", overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "0.5rem 1rem", background: "var(--sl-color-gray-6)", borderBottom: "1px solid var(--sl-color-gray-5)", fontSize: "0.875rem", fontWeight: 600 }}>
          {title}
        </div>
      )}
      <pre style={{ padding: "1rem", margin: 0, fontSize: "0.8rem", overflow: "auto" }}>
        <code>{displayCode.trim()}</code>
      </pre>
    </div>
  );
}
