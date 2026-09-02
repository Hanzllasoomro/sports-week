import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Enter Results' };

export default function Page() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-caps-label text-fog-text">Enter Results — coming in Phase 1</p>
    </main>
  );
}
