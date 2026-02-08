"use client";

export default function InternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h2 className="text-xl font-semibold">Failed to load internal page</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || "This internal page could not be rendered."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
