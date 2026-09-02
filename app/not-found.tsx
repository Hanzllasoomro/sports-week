export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-left border-l-4 border-gold-accent pl-8">
        <p className="font-caps-label text-gold-accent mb-2">404</p>
        <h1 className="font-hero-display-mobile text-on-surface uppercase mb-4">
          PAGE NOT FOUND
        </h1>
        <p className="font-body text-fog-text mb-8 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-gold-accent text-navy-deep font-caps-label px-6 py-3 hover:bg-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          Back to Home
        </a>
      </div>
    </main>
  );
}
