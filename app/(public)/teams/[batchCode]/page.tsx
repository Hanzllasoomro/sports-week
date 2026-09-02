import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Team Roster' };

export default function TeamRosterPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-caps-label text-fog-text">Team Roster — coming in Phase 1</p>
    </main>
  );
}
