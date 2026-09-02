import type { Metadata } from 'next';
import { getStandings } from '@/lib/data/public';
import { StandingsTable } from '@/components/public/StandingsTable';

export const metadata: Metadata = {
  title: 'Standings — Sports Week 2026',
  description:
    'Live university leaderboard for SES Sports Week 2026. Real-time batch points across Software Engineering and AI departments.',
};

export default async function StandingsPage() {
  const standings = await getStandings();

  return (
    <main className="flex-1 w-full px-4 sm:px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* Header Anchor */}
      <div className="mb-6 sm:mb-10 text-left border-l-4 border-gold-accent pl-4 sm:pl-6">
        <div className="font-caps-label text-gold-accent uppercase text-xs sm:text-sm tracking-wider mb-1">
          UNIVERSITY CHAMPIONSHIPS
        </div>
        <h1
          className="font-display text-white uppercase tracking-tight leading-none"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
        >
          LIVE <span className="text-cream">STANDINGS</span>
        </h1>
        <p className="font-body text-fog-text text-xs sm:text-base mt-2 max-w-2xl">
          Current overall rankings across all 9 batches. Points updated automatically upon official match verification.
        </p>
      </div>

      {/* Standings Table */}
      <StandingsTable initialStandings={standings} />
    </main>
  );
}
