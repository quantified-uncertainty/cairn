// Stub Mermaid component for @cairn/ui
// Apps can override this by passing their own Mermaid renderer

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  return (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm">
      <code>{chart}</code>
    </pre>
  );
}
