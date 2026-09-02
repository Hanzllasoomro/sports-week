import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Live Scores' };

export default function Page() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-caps-label text-fog-text">Live Scores — coming in Phase 1</p>
    </main>
  );
}
