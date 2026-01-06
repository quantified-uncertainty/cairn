// Shared navigation header for AI Transition Model pages

interface TransitionModelNavProps {
  activeTab: 'graph' | 'interactive' | 'outline' | 'data' | 'table';
}

const tabs = [
  { id: 'graph', label: 'Graph', href: '/ai-transition-model-views/graph' },
  { id: 'interactive', label: 'Interactive', href: '/ai-transition-model-views/interactive' },
  { id: 'table', label: 'Table', href: '/ai-transition-model-views/table' },
  { id: 'outline', label: 'Outline', href: '/ai-transition-model-views/outline' },
  { id: 'data', label: 'Data (YAML)', href: '/ai-transition-model-views/data' },
];

const styles = `
  .tm-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
    flex-shrink: 0;
  }
  .tm-nav__back {
    color: #475569;
    text-decoration: none;
    font-size: 14px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }
  .tm-nav__back:hover {
    color: #1e293b;
    border-color: #cbd5e1;
    background: #f8fafc;
  }
  .tm-nav__tabs {
    display: flex;
    align-items: center;
    background-color: #e5e7eb;
    border-radius: 6px;
    padding: 3px;
    gap: 2px;
  }
  .tm-nav__tab {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 12px;
    font-size: 13px;
    font-family: system-ui, -apple-system, sans-serif;
    font-weight: 500;
    line-height: 1;
    border-radius: 4px;
    cursor: pointer;
    background-color: transparent;
    color: #6b7280;
    text-decoration: none;
    transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }
  .tm-nav__tab:hover {
    background-color: rgba(255, 255, 255, 0.5);
    color: #374151;
  }
  .tm-nav__tab--active {
    background-color: #ffffff;
    color: #111827;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .tm-nav__spacer {
    width: 120px;
  }
`;

export default function TransitionModelNav({ activeTab }: TransitionModelNavProps) {
  return (
    <>
      <style>{styles}</style>
      <nav className="tm-nav">
        <a href="/ai-transition-model/" className="tm-nav__back">
          &larr; AI Transition Model
        </a>
        <div className="tm-nav__tabs">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={tab.href}
              className={`tm-nav__tab ${activeTab === tab.id ? 'tm-nav__tab--active' : ''}`}
            >
              {tab.label}
            </a>
          ))}
        </div>
        <div className="tm-nav__spacer" />
      </nav>
    </>
  );
}
