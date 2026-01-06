import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface MetaViewProps {
  slug: string;
  frontmatter: Record<string, any>;
  entity?: any;
  graphNode?: any;
  incomingEdges: any[];
  outgoingEdges: any[];
  backlinks: any[];
  entityId: string;
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

  return (
    <div className="meta-view-container">
      {/* Header */}
      <div className="meta-view-header">
        <h1 className="meta-view-title">
          Page Metadata: {frontmatter.title}
        </h1>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          ← Back to content
        </Button>
      </div>

      {/* Frontmatter Section */}
      <Section title="Frontmatter">
        <Table>
          <TableBody>
            <Row label="Title" value={frontmatter.title} />
            <Row
              label="Description"
              value={frontmatter.description}
              fallback="Not set"
            />
            <Row label="Page Type">
              <Code>{frontmatter.pageType || "content"}</Code>
            </Row>
            <Row
              label="Last Edited"
              value={frontmatter.lastEdited}
              fallback="Not set"
            />
            <Row label="Sidebar Order" value={frontmatter.sidebar?.order} fallback="Not set" />
            <Row
              label="Sidebar Label"
              value={frontmatter.sidebar?.label || frontmatter.title}
            />
          </TableBody>
        </Table>
      </Section>

      {/* Ratings Section */}
      {frontmatter.ratings && (
        <Section title="Ratings">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Visual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(frontmatter.ratings).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="text-muted-foreground">{key}</TableCell>
                  <TableCell>{value as number}/100</TableCell>
                  <TableCell>
                    <RatingBar value={value as number} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}

      {/* Entity Data Section */}
      <Section title="Entity Data (entities.yaml)">
        {entity ? (
          <>
            <Table>
              <TableBody>
                <Row label="ID">
                  <Code>{entity.id}</Code>
                </Row>
                <Row label="Type">
                  <Code>{entity.type}</Code>
                </Row>
                <Row label="Title" value={entity.title} />
                <Row
                  label="Description"
                  value={entity.description}
                  fallback="Not set"
                />
                <Row
                  label="Tags"
                  value={entity.tags?.join(", ")}
                  fallback="None"
                />
                <Row
                  label="Last Updated"
                  value={entity.lastUpdated}
                  fallback="Not set"
                />
              </TableBody>
            </Table>

            {entity.relatedEntries?.length > 0 && (
              <>
                <h3 className="text-sm text-muted-foreground mt-4 mb-2">
                  Related Entries
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Relationship</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entity.relatedEntries.map((rel: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Code>{rel.id}</Code>
                        </TableCell>
                        <TableCell>
                          <Code>{rel.type}</Code>
                        </TableCell>
                        <TableCell>{rel.relationship}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </>
        ) : (
          <p className="text-muted-foreground italic">
            No entity found for ID: <Code>{entityId}</Code>
          </p>
        )}
      </Section>

      {/* Graph Node Section */}
      <Section title="Parameter Graph Node">
        {graphNode ? (
          <>
            <Table>
              <TableBody>
                <Row label="ID">
                  <Code>{graphNode.id}</Code>
                </Row>
                <Row label="Label" value={graphNode.label} />
                <Row label="Type">
                  <Code>{graphNode.type}</Code>
                </Row>
                <Row label="Order" value={graphNode.order} fallback="Not set" />
                <Row label="Href">
                  <a
                    href={graphNode.href}
                    className="text-blue-400 hover:underline"
                  >
                    {graphNode.href}
                  </a>
                </Row>
              </TableBody>
            </Table>
            {graphNode.description && (
              <p className="mt-2 text-sm">
                <strong>Description:</strong> {graphNode.description}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground italic">Not in parameter graph</p>
        )}
      </Section>

      {/* Incoming Edges */}
      {incomingEdges.length > 0 && (
        <Section title={`Incoming Edges (${incomingEdges.length})`}>
          <p className="text-sm text-muted-foreground mb-2">
            Factors that affect this
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Effect</TableHead>
                <TableHead>Strength</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingEdges.map((edge, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Code>{edge.source}</Code>
                  </TableCell>
                  <TableCell>{edge.effect}</TableCell>
                  <TableCell>{edge.strength}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}

      {/* Outgoing Edges */}
      {outgoingEdges.length > 0 && (
        <Section title={`Outgoing Edges (${outgoingEdges.length})`}>
          <p className="text-sm text-muted-foreground mb-2">
            What this affects
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Effect</TableHead>
                <TableHead>Strength</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outgoingEdges.map((edge, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Code>{edge.target}</Code>
                  </TableCell>
                  <TableCell>{edge.effect}</TableCell>
                  <TableCell>{edge.strength}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <Section title={`Backlinks (${backlinks.length})`}>
          <p className="text-sm text-muted-foreground mb-2">
            Pages that link here
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {backlinks.map((link, i) => (
              <li key={i}>
                <a href={link.path} className="text-blue-400 hover:underline">
                  {link.title || link.path}
                </a>
                {link.context && (
                  <span className="text-muted-foreground italic text-sm">
                    {" "}
                    — "{link.context}"
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Debug Info */}
      <Section title="Debug Info">
        <Table>
          <TableBody>
            <Row label="Full Slug">
              <Code>{slug}</Code>
            </Row>
            <Row label="Entity ID (derived)">
              <Code>{entityId}</Code>
            </Row>
            <Row label="Entity Found" value={entity ? "Yes" : "No"} />
            <Row label="Graph Node Found" value={graphNode ? "Yes" : "No"} />
            <Row label="Incoming Edges" value={incomingEdges.length} />
            <Row label="Outgoing Edges" value={outgoingEdges.length} />
            <Row label="Backlinks" value={backlinks.length} />
          </TableBody>
        </Table>
      </Section>

      {/* Raw JSON */}
      <details className="mt-4">
        <summary className="cursor-pointer text-muted-foreground text-sm">
          Raw Frontmatter JSON
        </summary>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs mt-2">
          {JSON.stringify(frontmatter, null, 2)}
        </pre>
      </details>

      {entity && (
        <details className="mt-4">
          <summary className="cursor-pointer text-muted-foreground text-sm">
            Raw Entity JSON
          </summary>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs mt-2">
            {JSON.stringify(entity, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// Helper components
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 pb-6 border-b border-gray-700">
      <h2 className="text-sm text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  fallback,
  children,
}: {
  label: string;
  value?: any;
  fallback?: string;
  children?: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground w-36">{label}</TableCell>
      <TableCell>
        {children ?? (value !== undefined && value !== null ? (
          String(value)
        ) : (
          <span className="italic text-muted-foreground">{fallback}</span>
        ))}
      </TableCell>
    </TableRow>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{children}</code>
  );
}

function RatingBar({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-700 rounded">
        <div
          className="h-full bg-blue-500 rounded"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
