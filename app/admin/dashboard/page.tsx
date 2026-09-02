import type { Metadata } from 'next';
import Link from 'next/link';
import { getFixtures, getBatches, getGames } from '@/lib/data/public';
import { fixtureTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard — Admin Console | Sports Week 2026',
  description: 'Event control center for SES Sports Week 2026.',
};

export default async function AdminDashboardPage() {
  const [fixtures, batches, games] = await Promise.all([
    getFixtures(),
    getBatches(),
    getGames(),
  ]);

  const liveMatches = fixtures.filter((f) => f.status === 'live');
  const completedMatches = fixtures.filter((f) => f.status === 'completed');
  const upcomingMatches = fixtures.filter((f) => f.status === 'scheduled');

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Top Welcome Title */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight">
            ADMIN DASHBOARD
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            SES &amp; AI Sports Week 2026 &bull; Central Control &amp; Match Operations
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="font-caps-label text-[11px] text-gold-accent uppercase font-bold tracking-wider">
            SYSTEM STATUS
          </div>
          <div className="font-table-numeral text-xs text-fog-text flex items-center sm:justify-end gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-win-green" />
            <span>ONLINE &bull; READY FOR LIVE MATCHES</span>
          </div>
        </div>
      </div>

      {/* ── 4 Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-navy-mid p-4 sm:p-5 border-t-2 border-t-outline-variant/40 flex flex-col justify-between">
          <span className="font-caps-label text-xs text-fog-text uppercase">
            Total Matches
          </span>
          <span className="font-display text-white text-2xl sm:text-3xl md:text-4xl mt-2">
            {fixtures.length}
          </span>
          <span className="text-[10px] text-fog-text font-table-numeral mt-1">
            {completedMatches.length} Completed
          </span>
        </div>

        <div className="bg-navy-mid p-4 sm:p-5 border-t-2 border-t-live-red flex flex-col justify-between">
          <span className="font-caps-label text-xs text-fog-text uppercase">
            Active Live Now
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-display text-gold-accent text-2xl sm:text-3xl md:text-4xl">
              {liveMatches.length}
            </span>
            {liveMatches.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-live-red pulse-live" />
            )}
          </div>
          <span className="text-[10px] text-live-red font-caps-label uppercase mt-1">
            Realtime scoring active
          </span>
        </div>

        <div className="bg-navy-mid p-4 sm:p-5 border-t-2 border-t-gold-accent flex flex-col justify-between">
          <span className="font-caps-label text-xs text-fog-text uppercase">
            Batches Contesting
          </span>
          <span className="font-display text-white text-2xl sm:text-3xl md:text-4xl mt-2">
            {batches.length}
          </span>
          <span className="text-[10px] text-gold-accent font-caps-label uppercase mt-1">
            SW (5) &bull; AI (4)
          </span>
        </div>

        <div className="bg-navy-mid p-4 sm:p-5 border-t-2 border-t-primary flex flex-col justify-between">
          <span className="font-caps-label text-xs text-fog-text uppercase">
            Official Sports
          </span>
          <span className="font-display text-white text-2xl sm:text-3xl md:text-4xl mt-2">
            {games.length}
          </span>
          <span className="text-[10px] text-primary font-caps-label uppercase mt-1">
            6 Team &bull; 4 Individual
          </span>
        </div>
      </div>

      {/* ── Main Operations Grid (8 cols live management, 4 cols quick actions) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        {/* Live Management (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-white uppercase text-xl sm:text-2xl tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
              LIVE MATCH CONTROLS
            </h2>
            <Link
              href="/admin/results"
              className="font-caps-label text-xs text-gold-accent hover:text-white uppercase flex items-center gap-1 transition-colors"
            >
              <span>Score Entry Room</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {liveMatches.length === 0 ? (
            <div className="p-6 bg-surface-container border border-outline-variant/20 text-center rounded">
              <span className="material-symbols-outlined text-3xl text-fog-text mb-1">
                timer_off
              </span>
              <p className="text-xs text-fog-text">
                No matches currently marked as Live. You can set a fixture to Live in the Fixtures manager.
              </p>
            </div>
          ) : (
            liveMatches.map((fixture) => (
              <div
                key={fixture.id}
                className="bg-surface-container-high p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-live-red shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-navy-mid flex items-center justify-center text-gold-accent shrink-0">
                    <span className="material-symbols-outlined text-xl">
                      {fixture.game.slug === 'cricket' ? 'sports_cricket' : 'sports_soccer'}
                    </span>
                  </div>
                  <div>
                    <div className="font-caps-label text-[11px] text-live-red flex items-center gap-1.5 uppercase font-bold">
                      <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                      LIVE &bull; {fixture.game.name} ({fixture.round || fixture.stage})
                    </div>
                    <div className="font-caps-label text-sm text-white font-bold mt-0.5">
                      {fixture.team_a?.name || 'Team A'}{' '}
                      <span className="text-gold-accent font-display text-base px-1">
                        {fixture.score_a ?? 0} &ndash; {fixture.score_b ?? 0}
                      </span>{' '}
                      {fixture.team_b?.name || 'Team B'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    href={`/admin/results?fixtureId=${fixture.id}`}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors text-center"
                  >
                    Enter Score
                  </Link>
                  <Link
                    href="/admin/fixtures"
                    className="flex-1 sm:flex-none px-3.5 py-1.5 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white transition-colors text-center"
                  >
                    Edit Match
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Action Shortcuts (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          <h2 className="font-display text-white uppercase text-xl sm:text-2xl tracking-tight mb-1">
            QUICK ACTIONS
          </h2>

          <Link
            href="/admin/fixtures"
            className="p-3.5 bg-gold-accent text-navy-deep flex items-center justify-between font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors shadow"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>Schedule New Fixture</span>
            </div>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>

          <Link
            href="/admin/results"
            className="p-3.5 bg-navy-mid text-white border border-outline-variant/30 flex items-center justify-between font-caps-label text-xs uppercase font-bold hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gold-accent">scoreboard</span>
              <span>Enter Match Scores</span>
            </div>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>

          <Link
            href="/admin/players"
            className="p-3.5 bg-navy-mid text-white border border-outline-variant/30 flex items-center justify-between font-caps-label text-xs uppercase font-bold hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gold-accent">person_add</span>
              <span>Register Athletes / Players</span>
            </div>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>

          <Link
            href="/admin/teams"
            className="p-3.5 bg-navy-mid text-white border border-outline-variant/30 flex items-center justify-between font-caps-label text-xs uppercase font-bold hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gold-accent">groups</span>
              <span>Manage Batch Teams</span>
            </div>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>

          <Link
            href="/admin/batches"
            className="p-3.5 bg-navy-mid text-white border border-outline-variant/30 flex items-center justify-between font-caps-label text-xs uppercase font-bold hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gold-accent">school</span>
              <span>Manage Batches &amp; Depts</span>
            </div>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>
        </div>
      </div>

      {/* ── Recent Updates & Audit Log ── */}
      <div>
        <h2 className="font-display text-white uppercase text-xl sm:text-2xl tracking-tight mb-4">
          RECENT TOURNAMENT UPDATES
        </h2>

        <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
                <th className="p-3.5">TIME</th>
                <th className="p-3.5">MATCH / EVENT</th>
                <th className="p-3.5">DETAILS</th>
                <th className="p-3.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {fixtures.slice(0, 5).map((f) => (
                <tr key={f.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="p-3.5 text-fog-text font-table-numeral">
                    {fixtureTime(f.scheduled_at)}
                  </td>
                  <td className="p-3.5 font-bold text-white">
                    {f.game.name} ({f.round || f.stage})
                  </td>
                  <td className="p-3.5 text-fog-text">
                    {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                    {f.team_b?.name || f.player_b?.name || 'TBD'} &bull; {f.venue || 'MUET Gym'}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-caps-label uppercase font-bold ${
                        f.status === 'live'
                          ? 'bg-live-red/20 text-live-red border border-live-red/40'
                          : f.status === 'completed'
                          ? 'bg-win-green/20 text-win-green border border-win-green/40'
                          : 'bg-surface-container-high text-fog-text'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
