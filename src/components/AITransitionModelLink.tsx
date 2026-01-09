// Simple link component to navigate to the AI Transition Model visualization
// Used in place of embedded graphs

const styles = `
  .ai-model-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 15px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }
  .ai-model-link:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    color: white;
  }
  .ai-model-link__icon {
    font-size: 18px;
  }
`;

export default function AITransitionModelLink() {
  return (
    <>
      <style>{styles}</style>
      <a href="/ai-transition-model-views/graph" className="ai-model-link">
        <span className="ai-model-link__icon">📊</span>
        View Interactive Graph
        <span>→</span>
      </a>
    </>
  );
}
