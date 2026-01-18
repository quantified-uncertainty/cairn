// Component that injects full-width styles when rendered
export default function FullWidthLayout() {
  return (
    <style>{`
      /* Hide right sidebar */
      .right-sidebar-container,
      .right-sidebar {
        display: none !important;
      }

      /* Expand main content area to full width */
      .main-pane {
        grid-column: 2 / -1 !important;
        max-width: none !important;
      }

      /* Remove all content width constraints */
      .content-panel,
      .main-frame,
      .sl-markdown-content,
      main.main-pane,
      [data-pagefind-body] {
        max-width: none !important;
        width: 100% !important;
      }

      /* Override Starlight's content width variable */
      :root {
        --sl-content-width: 100% !important;
      }

      /* Ensure the content wrapper expands */
      .sl-container {
        max-width: none !important;
      }
    `}</style>
  );
}
