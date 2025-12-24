import React, { useState } from 'react';

interface Paper {
  title: string;
  authors: string[];
  organization?: string;
  year: number;
  type: string;
  summary: string;
  importance: string;
  link: string;
  linkLabel: string;
}

interface Category {
  id: string;
  name: string;
  papers: Paper[];
}

interface ReadingGuide {
  title: string;
  papers: string[];
}

interface Resource {
  name: string;
  url: string;
}

interface LiteratureData {
  categories: Category[];
  readingGuides: Record<string, ReadingGuide>;
  resources: Resource[];
}

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  categorySection: {
    marginBottom: '32px',
  } as React.CSSProperties,
  categoryTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  } as React.CSSProperties,
  paper: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  paperTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#1f2937',
  } as React.CSSProperties,
  paperMeta: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '8px',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '0.75rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginRight: '8px',
  } as React.CSSProperties,
  paperSection: {
    marginTop: '12px',
  } as React.CSSProperties,
  sectionLabel: {
    fontWeight: 600,
    color: '#374151',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  sectionText: {
    color: '#4b5563',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    marginTop: '4px',
  } as React.CSSProperties,
  link: {
    display: 'inline-block',
    marginTop: '12px',
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  readingGuide: {
    backgroundColor: '#eff6ff',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #bfdbfe',
  } as React.CSSProperties,
  readingGuideTitle: {
    fontWeight: 600,
    color: '#1e40af',
    marginBottom: '8px',
  } as React.CSSProperties,
  readingGuideList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#374151',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  resourceList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } as React.CSSProperties,
  resourceItem: {
    marginBottom: '8px',
  } as React.CSSProperties,
  resourceLink: {
    color: '#2563eb',
    textDecoration: 'none',
  } as React.CSSProperties,
  filterContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '24px',
  } as React.CSSProperties,
  filterButton: {
    padding: '6px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  filterButtonActive: {
    padding: '6px 12px',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    backgroundColor: '#2563eb',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.875rem',
  } as React.CSSProperties,
};

function PaperCard({ paper }: { paper: Paper }) {
  return (
    <div style={styles.paper}>
      <div style={styles.paperTitle}>{paper.title}</div>
      <div style={styles.paperMeta}>
        <span style={styles.badge}>{paper.year}</span>
        <span style={styles.badge}>{paper.type}</span>
        {paper.organization && <span style={styles.badge}>{paper.organization}</span>}
        <span>{paper.authors.join(', ')}</span>
      </div>
      <div style={styles.paperSection}>
        <div style={styles.sectionLabel}>Summary</div>
        <div style={styles.sectionText}>{paper.summary}</div>
      </div>
      <div style={styles.paperSection}>
        <div style={styles.sectionLabel}>Why It Matters</div>
        <div style={styles.sectionText}>{paper.importance}</div>
      </div>
      <a href={paper.link} target="_blank" rel="noopener noreferrer" style={styles.link}>
        {paper.linkLabel} →
      </a>
    </div>
  );
}

export function LiteratureList({ data }: { data: LiteratureData }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = selectedCategory
    ? data.categories.filter(c => c.id === selectedCategory)
    : data.categories;

  return (
    <div style={styles.container}>
      <div style={styles.filterContainer}>
        <button
          style={selectedCategory === null ? styles.filterButtonActive : styles.filterButton}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {data.categories.map(category => (
          <button
            key={category.id}
            style={selectedCategory === category.id ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredCategories.map(category => (
        <div key={category.id} style={styles.categorySection}>
          <h2 style={styles.categoryTitle}>{category.name}</h2>
          {category.papers.map((paper, idx) => (
            <PaperCard key={idx} paper={paper} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ReadingGuides({ guides }: { guides: Record<string, ReadingGuide> }) {
  return (
    <div>
      {Object.entries(guides).map(([key, guide]) => (
        <div key={key} style={styles.readingGuide}>
          <div style={styles.readingGuideTitle}>{guide.title}</div>
          <ol style={styles.readingGuideList}>
            {guide.papers.map((paper, idx) => (
              <li key={idx}>{paper}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function ResourcesList({ resources }: { resources: Resource[] }) {
  return (
    <ul style={styles.resourceList}>
      {resources.map((resource, idx) => (
        <li key={idx} style={styles.resourceItem}>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" style={styles.resourceLink}>
            {resource.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default LiteratureList;
