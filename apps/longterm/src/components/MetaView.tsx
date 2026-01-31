import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import database from "@data/database.json";
import type { Entity } from "@data/schema";

// Database structure types
interface DatabaseWithRegistry {
  pathRegistry?: Record<string, string>;
  entities?: Entity[];
}

// Graph node type
interface GraphNode {
  id: string;
  label: string;
  type: string;
  order?: number;
  href: string;
  description?: string;
}

// Edge type
interface GraphEdge {
  source: string;
  target: string;
  effect: string;
  strength?: string;
}

// Backlink type
interface Backlink {
  path: string;
  title?: string;
  context?: string;
}

// Related entry type
interface RelatedEntry {
  id: string;
  type: string;
  relationship?: string;
}

// Frontmatter type (from MDX files)
interface Frontmatter {
  title?: string;
  description?: string;
  pageType?: string;
  lastEdited?: string;
  sidebar?: {
    order?: number;
    label?: string;
  };
  ratings?: Record<string, number>;
  [key: string]: unknown;
}

interface MetaViewProps {
  slug: string;
  frontmatter: Frontmatter;
  entity?: Entity & { relatedEntries?: RelatedEntry[]; tags?: string[] };
  graphNode?: GraphNode;
  incomingEdges: GraphEdge[];
  outgoingEdges: GraphEdge[];
  backlinks: Backlink[];
  entityId: string;
}

// Helper to find entity path from ID
function getEntityPath(entityId: string): string | null {
  const db = database as unknown as DatabaseWithRegistry;
  const pathRegistry = db.pathRegistry || {};
  return pathRegistry[entityId] || null;
}

// Helper to get entity title from ID
function getEntityTitle(entityId: string): string {
  const db = database as unknown as DatabaseWithRegistry;
  const entities = db.entities || [];
  const entity = entities.find((e) => e.id === entityId);
  return entity?.title || entityId;
}

export function MetaView({
  slug,
  frontmatter,
  entity,
  graphNode,
  incomingEdges,
  outgoingEdges,
  backlinks,
  entityId,
}: MetaViewProps) {
  const handleBack = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("meta");
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const hasEntity = !!entity;
  const hasGraphNode = !!graphNode;
  const hasRatings = frontmatter.ratings && Object.keys(frontmatter.ratings).length > 0;
  const totalEdges = incomingEdges.length + outgoingEdges.length;

  return (
    <div className="meta-view-container max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-lg font-semibold mb-1.5">{frontmatter.title}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={hasEntity ? "default" : "outline"} className="text-xs">
              {hasEntity ? "Entity ✓" : "No Entity"}
            </Badge>
            <Badge variant={hasGraphNode ? "default" : "outline"} className="text-xs">
              {hasGraphNode ? "Graph ✓" : "No Graph"}
            </Badge>
            {totalEdges > 0 && (
              <Badge variant="secondary" className="text-xs">{totalEdges} edges</Badge>
            )}
            {backlinks.length > 0 && (
              <Badge variant="secondary" className="text-xs">{backlinks.length} backlinks</Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleBack}>
          ← Back
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="page">Page</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        {/* Page Tab */}
        <TabsContent value="page" className="space-y-6">
          <Section title="Frontmatter">
            <DL>
              <DT>Title</DT>
              <DD>{frontmatter.title}</DD>

              <DT>Description</DT>
              <DD muted>{frontmatter.description || <em>Not set</em>}</DD>

              <DT>Page Type</DT>
              <DD><Code>{frontmatter.pageType || "content"}</Code></DD>

              <DT>Last Edited</DT>
              <DD>{frontmatter.lastEdited || <em className="text-slate-400">Not set</em>}</DD>

              {frontmatter.sidebar && (
                <>
                  <DT>Sidebar</DT>
                  <DD>Order: {frontmatter.sidebar.order ?? "—"}, Label: {frontmatter.sidebar.label || frontmatter.title}</DD>
                </>
              )}
            </DL>
          </Section>

          {hasRatings && frontmatter.ratings && (
            <Section title="Ratings">
              <div className="space-y-2">
                {Object.entries(frontmatter.ratings).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 capitalize w-24">{key}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-l" style={{ width: `${value as number}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8">{value as number}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="File Info">
            <DL>
              <DT>Slug</DT>
              <DD><Code>{slug}</Code></DD>
              <DT>Entity ID</DT>
              <DD><Code>{entityId}</Code></DD>
            </DL>
          </Section>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Section title="Entity" subtitle="From entities.yaml">
            {entity ? (
              <DL>
                <DT>ID</DT>
                <DD>
                  <Code>{entity.id}</Code>
                  {getEntityPath(entity.id) && (
                    <a href={getEntityPath(entity.id)!} className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      View →
                    </a>
                  )}
                </DD>

                <DT>Type</DT>
                <DD><Code>{entity.type}</Code></DD>

                <DT>Title</DT>
                <DD>{entity.title}</DD>

                <DT>Description</DT>
                <DD muted>{entity.description || <em>Not set</em>}</DD>

                {entity.tags && entity.tags.length > 0 && (
                  <>
                    <DT>Tags</DT>
                    <DD>
                      <div className="flex flex-wrap gap-1">
                        {entity.tags.map((tag: string) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{tag}</span>
                        ))}
                      </div>
                    </DD>
                  </>
                )}

                <DT>Updated</DT>
                <DD>{entity.lastUpdated || <em className="text-slate-400">Not set</em>}</DD>
              </DL>
            ) : (
              <p className="text-sm text-slate-500">No entity found for ID: <Code>{entityId}</Code></p>
            )}
          </Section>

          {entity && entity.relatedEntries && entity.relatedEntries.length > 0 && (
            <Section title="Related Entries">
              <table className="w-full text-sm">
                <tbody>
                  {entity.relatedEntries.map((rel: RelatedEntry, i: number) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-1.5 pr-3">
                        <EntityLink entityId={rel.id} showId />
                      </td>
                      <td className="py-1.5 pr-3">
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{rel.type}</span>
                      </td>
                      <td className="py-1.5 text-slate-500 text-xs">{rel.relationship}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {backlinks.length > 0 && (
            <Section title={`Backlinks (${backlinks.length})`} subtitle="Pages that link here">
              <ul className="space-y-1">
                {backlinks.map((link, i) => (
                  <li key={i} className="text-sm">
                    <a href={link.path} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {link.title || link.path}
                    </a>
                    {link.context && (
                      <span className="text-slate-400 text-xs ml-2">"{link.context}"</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph" className="space-y-6">
          <Section title="Graph Node">
            {graphNode ? (
              <DL>
                <DT>ID</DT>
                <DD><Code>{graphNode.id}</Code></DD>
                <DT>Label</DT>
                <DD>{graphNode.label}</DD>
                <DT>Type</DT>
                <DD><Code>{graphNode.type}</Code></DD>
                <DT>Order</DT>
                <DD>{graphNode.order ?? <em className="text-slate-400">Not set</em>}</DD>
                <DT>Href</DT>
                <DD>
                  <a href={graphNode.href} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                    {graphNode.href}
                  </a>
                </DD>
                {graphNode.description && (
                  <>
                    <DT>Description</DT>
                    <DD muted>{graphNode.description}</DD>
                  </>
                )}
              </DL>
            ) : (
              <p className="text-sm text-slate-500">Not in parameter graph</p>
            )}
          </Section>

          {incomingEdges.length > 0 && (
            <Section title={`Incoming (${incomingEdges.length})`} subtitle="Factors that affect this">
              <table className="w-full text-sm">
                <tbody>
                  {incomingEdges.map((edge, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-1.5 pr-3">
                        <EntityLink entityId={edge.source} />
                      </td>
                      <td className="py-1.5 pr-3 text-slate-400">→</td>
                      <td className="py-1.5 pr-3">
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{edge.effect}</span>
                      </td>
                      {edge.strength && (
                        <td className="py-1.5 text-slate-400 text-xs">{edge.strength}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {outgoingEdges.length > 0 && (
            <Section title={`Outgoing (${outgoingEdges.length})`} subtitle="What this affects">
              <table className="w-full text-sm">
                <tbody>
                  {outgoingEdges.map((edge, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-1.5 pr-3 text-slate-400">→</td>
                      <td className="py-1.5 pr-3">
                        <EntityLink entityId={edge.target} />
                      </td>
                      <td className="py-1.5 pr-3">
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{edge.effect}</span>
                      </td>
                      {edge.strength && (
                        <td className="py-1.5 text-slate-400 text-xs">{edge.strength}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {!graphNode && incomingEdges.length === 0 && outgoingEdges.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">Not connected to the parameter graph.</p>
          )}
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-6">
          <Section title="Status">
            <DL>
              <DT>Full Slug</DT>
              <DD><Code>{slug}</Code></DD>
              <DT>Entity ID</DT>
              <DD><Code>{entityId}</Code></DD>
              <DT>Entity Found</DT>
              <DD>{entity ? <Badge variant="default" className="text-xs">Yes</Badge> : <Badge variant="outline" className="text-xs">No</Badge>}</DD>
              <DT>Graph Node</DT>
              <DD>{graphNode ? <Badge variant="default" className="text-xs">Yes</Badge> : <Badge variant="outline" className="text-xs">No</Badge>}</DD>
              <DT>Incoming</DT>
              <DD>{incomingEdges.length}</DD>
              <DT>Outgoing</DT>
              <DD>{outgoingEdges.length}</DD>
              <DT>Backlinks</DT>
              <DD>{backlinks.length}</DD>
            </DL>
          </Section>

          <Section title="Raw Frontmatter">
            <pre className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-3 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(frontmatter, null, 2)}
            </pre>
          </Section>

          {entity && (
            <Section title="Raw Entity">
              <pre className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-3 rounded text-xs font-mono overflow-x-auto">
                {JSON.stringify(entity, null, 2)}
              </pre>
            </Section>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Lightweight section component
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 pb-1 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// Definition list components
function DL({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1.5 text-sm">{children}</dl>;
}
function DT({ children }: { children: React.ReactNode }) {
  return <dt className="text-slate-500 text-xs">{children}</dt>;
}
function DD({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <dd className={muted ? "text-slate-500" : ""}>{children}</dd>;
}

// Inline code
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  );
}

// Entity link component
function EntityLink({ entityId, showId = false }: { entityId: string; showId?: boolean }) {
  const path = getEntityPath(entityId);
  const title = getEntityTitle(entityId);

  if (path) {
    return (
      <a href={path} className="text-blue-600 dark:text-blue-400 hover:underline" title={showId ? entityId : undefined}>
        {showId ? <Code>{entityId}</Code> : title}
      </a>
    );
  }

  return <Code>{entityId}</Code>;
}
