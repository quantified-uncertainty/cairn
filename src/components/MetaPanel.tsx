import { useEffect, useState } from 'react';

interface MetaPanelProps {
  slug: string;
  frontmatter: Record<string, any>;
  database: {
    entities: any[];
    parameterGraph?: {
      nodes?: any[];
      edges?: any[];
    };
    backlinks?: Record<string, any[]>;
    pages?: any[];
  };
}

export function MetaPanel({ slug, frontmatter, database }: MetaPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for ?meta query param
    const params = new URLSearchParams(window.location.search);
    setIsVisible(params.has('meta'));

    // Listen for URL changes (for SPA navigation)
    const handlePopState = () => {
      const newParams = new URLSearchParams(window.location.search);
      setIsVisible(newParams.has('meta'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!isVisible) return null;

  // Extract entity ID from slug
  const slugParts = slug.split('/');
  let entityId = slugParts[slugParts.length - 1];
  if (entityId === 'index' || !entityId) {
    entityId = slugParts[slugParts.length - 2] || slugParts[0];
  }

  // Get entity data
  const entity = database.entities?.find((e: any) => e.id === entityId);

  // Get parameter graph data
  const parameterGraph = database.parameterGraph || {};
  const graphNode = parameterGraph.nodes?.find((n: any) => n.id === entityId);

  // Get edges
  const incomingEdges = parameterGraph.edges?.filter((e: any) => e.target === entityId) || [];
  const outgoingEdges = parameterGraph.edges?.filter((e: any) => e.source === entityId) || [];

  // Get backlinks
  const backlinks = database.backlinks?.[entityId] || [];

  // Get page stats
  const pageStats = database.pages?.find((p: any) => p.slug === slug);

  const toggleMeta = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('meta')) {
      url.searchParams.delete('meta');
    } else {
      url.searchParams.set('meta', '');
    }
    window.history.pushState({}, '', url.toString());
    setIsVisible(!isVisible);
  };

  return (
    <div className="meta-panel">
      <div className="meta-header">
        <h2>Page Metadata</h2>
        <button onClick={toggleMeta} className="meta-close">×</button>
      </div>

      <section>
        <h3>Frontmatter</h3>
        <table>
          <tbody>
            <tr><td><strong>Title</strong></td><td>{frontmatter.title}</td></tr>
            <tr><td><strong>Description</strong></td><td>{frontmatter.description || 'Not set'}</td></tr>
            <tr><td><strong>Page Type</strong></td><td><code>{frontmatter.pageType || 'content'}</code></td></tr>
            <tr><td><strong>Last Edited</strong></td><td>{frontmatter.lastEdited || 'Not set'}</td></tr>
            <tr><td><strong>Sidebar Order</strong></td><td>{frontmatter.sidebar?.order ?? 'Not set'}</td></tr>
          </tbody>
        </table>
      </section>

      {frontmatter.ratings && (
        <section>
          <h3>Ratings</h3>
          <table>
            <tbody>
              {Object.entries(frontmatter.ratings).map(([key, value]: [string, any]) => (
                <tr key={key}>
                  <td><strong>{key}</strong></td>
                  <td>
                    {value}/100
                    <div className="rating-bar">
                      <div className="rating-fill" style={{ width: `${value}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {entity && (
        <section>
          <h3>Entity Data</h3>
          <table>
            <tbody>
              <tr><td><strong>ID</strong></td><td><code>{entity.id}</code></td></tr>
              <tr><td><strong>Type</strong></td><td><code>{entity.type}</code></td></tr>
              <tr><td><strong>Tags</strong></td><td>{entity.tags?.join(', ') || 'None'}</td></tr>
            </tbody>
          </table>
        </section>
      )}

      {graphNode && (
        <section>
          <h3>Graph Node</h3>
          <table>
            <tbody>
              <tr><td><strong>ID</strong></td><td><code>{graphNode.id}</code></td></tr>
              <tr><td><strong>Type</strong></td><td><code>{graphNode.type}</code></td></tr>
              <tr><td><strong>Href</strong></td><td><a href={graphNode.href}>{graphNode.href}</a></td></tr>
            </tbody>
          </table>
        </section>
      )}

      {incomingEdges.length > 0 && (
        <section>
          <h3>Incoming Edges ({incomingEdges.length})</h3>
          <ul>
            {incomingEdges.map((edge: any, i: number) => (
              <li key={i}><code>{edge.source}</code> → this ({edge.effect})</li>
            ))}
          </ul>
        </section>
      )}

      {outgoingEdges.length > 0 && (
        <section>
          <h3>Outgoing Edges ({outgoingEdges.length})</h3>
          <ul>
            {outgoingEdges.map((edge: any, i: number) => (
              <li key={i}>this → <code>{edge.target}</code> ({edge.effect})</li>
            ))}
          </ul>
        </section>
      )}

      {backlinks.length > 0 && (
        <section>
          <h3>Backlinks ({backlinks.length})</h3>
          <ul>
            {backlinks.slice(0, 10).map((link: any, i: number) => (
              <li key={i}><a href={link.path}>{link.title || link.path}</a></li>
            ))}
            {backlinks.length > 10 && <li>...and {backlinks.length - 10} more</li>}
          </ul>
        </section>
      )}

      {pageStats && (
        <section>
          <h3>Page Stats</h3>
          <table>
            <tbody>
              {pageStats.quality && <tr><td><strong>Quality</strong></td><td>{pageStats.quality}/5</td></tr>}
              {pageStats.importance && <tr><td><strong>Importance</strong></td><td>{pageStats.importance}/100</td></tr>}
              {pageStats.wordCount && <tr><td><strong>Word Count</strong></td><td>{pageStats.wordCount}</td></tr>}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h3>Debug</h3>
        <table>
          <tbody>
            <tr><td><strong>Slug</strong></td><td><code>{slug}</code></td></tr>
            <tr><td><strong>Entity ID</strong></td><td><code>{entityId}</code></td></tr>
            <tr><td><strong>Entity Found</strong></td><td>{entity ? 'Yes' : 'No'}</td></tr>
            <tr><td><strong>Graph Node</strong></td><td>{graphNode ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
      </section>

      <details>
        <summary>Raw Frontmatter JSON</summary>
        <pre>{JSON.stringify(frontmatter, null, 2)}</pre>
      </details>

      <style>{`
        .meta-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          max-width: 90vw;
          height: 100vh;
          background: white;
          border-left: 2px solid #e5e7eb;
          box-shadow: -4px 0 20px rgba(0,0,0,0.1);
          overflow-y: auto;
          padding: 16px;
          z-index: 1000;
          font-size: 14px;
        }
        .meta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .meta-header h2 {
          margin: 0;
          font-size: 18px;
        }
        .meta-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        .meta-close:hover {
          color: #000;
        }
        .meta-panel section {
          margin-bottom: 16px;
        }
        .meta-panel h3 {
          font-size: 14px;
          color: #666;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-panel table {
          width: 100%;
          border-collapse: collapse;
        }
        .meta-panel td {
          padding: 4px 8px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: top;
        }
        .meta-panel td:first-child {
          width: 100px;
          color: #666;
        }
        .meta-panel code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .meta-panel ul {
          margin: 0;
          padding-left: 20px;
        }
        .meta-panel li {
          margin: 4px 0;
        }
        .rating-bar {
          display: inline-block;
          width: 60px;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          margin-left: 8px;
          vertical-align: middle;
        }
        .rating-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
        }
        .meta-panel details {
          margin-top: 16px;
        }
        .meta-panel summary {
          cursor: pointer;
          color: #666;
        }
        .meta-panel pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 11px;
          margin-top: 8px;
        }
        @media (prefers-color-scheme: dark) {
          .meta-panel {
            background: #1f2937;
            color: #f9fafb;
            border-left-color: #374151;
          }
          .meta-panel code {
            background: #374151;
          }
          .meta-panel td {
            border-bottom-color: #374151;
          }
        }
      `}</style>
    </div>
  );
}

// A simple toggle button that can be placed anywhere
export function MetaToggle() {
  const [hasMeta, setHasMeta] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHasMeta(params.has('meta'));
  }, []);

  const toggleMeta = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('meta')) {
      url.searchParams.delete('meta');
    } else {
      url.searchParams.set('meta', '');
    }
    window.location.href = url.toString();
  };

  return (
    <button
      onClick={toggleMeta}
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        padding: '8px 12px',
        background: hasMeta ? '#3b82f6' : '#f3f4f6',
        color: hasMeta ? 'white' : '#666',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '12px',
        zIndex: 999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {hasMeta ? 'Hide Meta' : 'Show Meta'}
    </button>
  );
}
