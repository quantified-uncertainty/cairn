"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const TABLES = [
  {
    id: 'safety-approaches',
    title: 'Safety Approaches',
    description: 'Evaluate safety research on effectiveness vs capability uplift. Which techniques actually make the world safer?',
    href: '/knowledge-base/responses/safety-approaches/table',
    category: 'Safety & Alignment',
    columns: 12,
    rows: 40,
  },
  {
    id: 'safety-generalizability',
    title: 'Safety Generalizability',
    description: 'Which safety approaches generalize across different AI architectures and deployment patterns?',
    href: '/knowledge-base/responses/safety-generalizability/table',
    category: 'Safety & Alignment',
    columns: 8,
    rows: 35,
  },
  {
    id: 'safety-matrix',
    title: 'Safety × Architecture Matrix',
    description: 'Matrix view showing compatibility between safety approaches and architecture scenarios.',
    href: '/knowledge-base/responses/safety-generalizability/matrix',
    category: 'Safety & Alignment',
    isMatrix: true,
  },
  {
    id: 'architecture-scenarios',
    title: 'Architecture Scenarios',
    description: 'Compare deployment patterns and base architectures. Safety outlook, research tractability, key properties.',
    href: '/knowledge-base/architecture-scenarios/table',
    category: 'Intelligence Paradigms',
    columns: 15,
    rows: 12,
  },
  {
    id: 'deployment-architectures',
    title: 'Deployment Architectures',
    description: 'Compare how AI systems are deployed: API access, on-device, edge computing, etc.',
    href: '/knowledge-base/deployment-architectures/table',
    category: 'Intelligence Paradigms',
    columns: 10,
    rows: 8,
  },
  {
    id: 'accident-risks',
    title: 'Accident Risks',
    description: 'Compare accident and misalignment risks by severity, likelihood, and detectability.',
    href: '/knowledge-base/risks/accident/table',
    category: 'Risks',
    columns: 10,
    rows: 15,
  },
  {
    id: 'eval-types',
    title: 'Evaluation Types',
    description: 'Compare different evaluation methodologies for AI systems.',
    href: '/knowledge-base/models/eval-types/table',
    category: 'Evaluations',
    columns: 8,
    rows: 20,
  },
  {
    id: 'transition-model',
    title: 'AI Transition Model Parameters',
    description: 'All parameters in the AI Transition Model with ratings for changeability, uncertainty, and impact.',
    href: '/ai-transition-model/table',
    category: 'AI Transition Model',
    columns: 5,
    rows: 50,
  },
];

const CATEGORY_ORDER = [
  'Safety & Alignment',
  'Intelligence Paradigms',
  'Risks',
  'Evaluations',
  'AI Transition Model',
];

function TableCard({ table }: { table: typeof TABLES[0] }) {
  return (
    <a href={table.href} className="no-underline group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
              {table.title}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {table.isMatrix ? 'Matrix' : 'Table'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs leading-relaxed">
            {table.description}
          </CardDescription>
          {table.columns && table.rows && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              {table.columns} cols × {table.rows} rows
            </p>
          )}
        </CardContent>
      </Card>
    </a>
  );
}

export default function TablesGallery() {
  const byCategory = TABLES.reduce((acc, table) => {
    if (!acc[table.category]) acc[table.category] = [];
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, typeof TABLES>);

  const orderedCategories = CATEGORY_ORDER.filter(cat => byCategory[cat]);

  return (
    <div className="space-y-8">
      {orderedCategories.map(category => (
        <section key={category}>
          <h2 className="text-base font-semibold mb-3 text-foreground">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {byCategory[category].map(table => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        </section>
      ))}

      <div className="pt-4 border-t text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">See also:</p>
        <ul className="space-y-1">
          <li><a href="/diagrams" className="hover:text-foreground hover:underline">Cause-Effect Diagrams</a></li>
          <li><a href="/diagrams/master-graph" className="hover:text-foreground hover:underline">Master Graph</a></li>
          <li><a href="/guides/interactive-views" className="hover:text-foreground hover:underline">All Interactive Views</a></li>
        </ul>
      </div>
    </div>
  );
}
