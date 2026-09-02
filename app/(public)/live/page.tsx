import type { Metadata } from 'next';
import { getFixtures, getGames } from '@/lib/data/public';
import { LiveScoresView } from '@/components/public/LiveScoresView';

export const metadata: Metadata = {
  title: 'Live Scores — Sports Week 2026',
  description:
    'Real-time scores, live match center, and court updates for SES Sports Week 2026 at MUET Gymnasium.',
};

export default async function LiveScoresPage() {
  const [fixtures, games] = await Promise.all([
    getFixtures(),
    getGames(),
  ]);

  return (
    <main className="flex-1 w-full px-4 sm:px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-10 text-left border-l-4 border-live-red pl-4 sm:pl-6">
        <div className="font-caps-label text-live-red uppercase text-xs sm:text-sm tracking-wider mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
          <span>REAL-TIME MATCH CENTER</span>
        </div>
        <h1
          className="font-display text-white uppercase tracking-tight leading-none"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
        >
          LIVE <span className="text-gold-accent">SCORES</span>
        </h1>
        <p className="font-body text-fog-text text-xs sm:text-base mt-2 max-w-2xl">
          Live point updates, court statuses, and scoreboards across all tournament grounds at MUET.
        </p>
      </div>

      {/* Live Scores View Component */}
      <LiveScoresView initialFixtures={fixtures} games={games} />
    </main>
  );
}
