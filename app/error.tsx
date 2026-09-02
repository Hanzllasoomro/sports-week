'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-left border-l-4 border-live-red pl-8">
        <p className="font-caps-label text-live-red mb-2">Error</p>
        <h1 className="font-hero-display-mobile text-on-surface uppercase mb-4">
          SOMETHING WENT WRONG
        </h1>
        <p className="font-body text-fog-text mb-8 max-w-sm">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-gold-accent text-navy-deep font-caps-label px-6 py-3 hover:bg-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Try Again
        </button>
      </div>
    </main>
  );
}
