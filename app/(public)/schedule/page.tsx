import type { Metadata } from 'next';
import { getFixtures, getGames } from '@/lib/data/public';
import { ScheduleView } from '@/components/public/ScheduleView';

export const metadata: Metadata = {
  title: 'Event Schedule — Sports Week 2026',
  description:
    'Full 3-day fixture schedule for SES Sports Week 2026 (Sep 8–10) at MUET Gymnasium. Day 1, Day 2, and Grand Finals.',
};

export default async function SchedulePage() {
  const [fixtures, games] = await Promise.all([
    getFixtures(),
    getGames(),
  ]);

  return (
    <main className="flex-1 w-full px-4 sm:px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-10 text-left border-l-4 border-gold-accent pl-4 sm:pl-6">
        <div className="font-caps-label text-gold-accent uppercase text-xs sm:text-sm tracking-wider mb-1">
          TOURNAMENT TIMELINE
        </div>
        <h1
          className="font-display text-white uppercase tracking-tight leading-none"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
        >
          EVENT <span className="text-gold-accent">SCHEDULE</span>
        </h1>
        <p className="font-body text-fog-text text-xs sm:text-base mt-2 max-w-2xl">
          Complete timetable across all 3 days. Filter by day or sport to see game times, venues, and live match progressions.
        </p>
      </div>

      {/* Schedule View Component */}
      <ScheduleView initialFixtures={fixtures} games={games} />
    </main>
  );
}
