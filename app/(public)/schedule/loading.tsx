export default function Loading() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gold-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-caps-label text-fog-text">Loading...</p>
      </div>
    </main>
  );
}
