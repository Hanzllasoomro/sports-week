import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Game Detail' };

export default function GameDetailPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-caps-label text-fog-text">Game Detail — coming in Phase 1</p>
    </main>
  );
}
