'use client';

import { useState, useEffect } from 'react';
import type { FixtureWithRelations, Game } from '@/types';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface LiveScoresViewProps {
  initialFixtures: FixtureWithRelations[];
  games: Game[];
}

export function LiveScoresView({ initialFixtures, games }: LiveScoresViewProps) {
  const [fixtures, setFixtures] = useState<FixtureWithRelations[]>(initialFixtures);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set up auto-refresh and realtime channel
  useEffect(() => {
    // 1. Supabase Realtime subscription if available
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('fixtures_live_scores')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'fixtures' },
          () => {
            // Trigger refresh on any fixture change
            refreshScores();
          }
        )
        .subscribe();
    } catch {
      // Supabase realtime unconfigured or offline
    }

    // 2. Fallback polling interval every 20 seconds
    const interval = setInterval(() => {
      refreshScores();
    }, 20000);

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  async function refreshScores() {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/fixtures/live');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setFixtures(data);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  }

  const liveMatches = fixtures.filter((f) => f.status === 'live');
  const upcomingMatches = fixtures.filter((f) => f.status === 'scheduled').slice(0, 4);

  const displayMatches =
    selectedSport === 'all'
      ? liveMatches
      : liveMatches.filter((f) => f.game.slug === selectedSport);

  return (
    <div className="w-full">
      {/* ── Status Bar & Manual Refresh ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-navy-mid/60 border border-outline-variant/30 rounded">
        <div className="flex items-center gap-2 text-xs font-caps-label text-fog-text">
          <span className="w-2.5 h-2.5 rounded-full bg-live-red pulse-live" />
          <span className="text-white font-bold">LIVE FEED ACTIVE:</span>
          <span>
            {liveMatches.length} match{liveMatches.length === 1 ? '' : 'es'} in progress
          </span>
          <span className="text-outline-variant hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline" suppressHydrationWarning>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <button
          type="button"
          onClick={refreshScores}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high hover:bg-gold-accent hover:text-navy-deep text-gold-accent font-caps-label text-xs uppercase font-bold rounded transition-colors cursor-pointer"
        >
          <span
            className={cn(
              'material-symbols-outlined text-sm',
              isRefreshing && 'animate-spin'
            )}
          >
            refresh
          </span>
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── Sport Filter Tabs ── */}
      <div className="flex gap-4 sm:gap-6 border-b border-outline-variant/30 mb-8 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedSport('all')}
          className={cn(
            'pb-2.5 font-caps-label text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 font-bold',
            selectedSport === 'all'
              ? 'border-gold-accent text-gold-accent'
              : 'border-transparent text-fog-text hover:text-white'
          )}
        >
          All Live ({liveMatches.length})
        </button>
        {games.map((g) => {
          const count = liveMatches.filter((f) => f.game.slug === g.slug).length;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedSport(g.slug)}
              className={cn(
                'pb-2.5 font-caps-label text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 font-bold',
                selectedSport === g.slug
                  ? 'border-gold-accent text-gold-accent'
                  : 'border-transparent text-fog-text hover:text-white'
              )}
            >
              {g.name} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* ── Live Match Grid (1 col on mobile, 2 cols on desktop) ── */}
      {displayMatches.length === 0 ? (
        <div className="py-12 px-6 text-center bg-surface-container border border-outline-variant/20 rounded mb-12">
          <div className="w-16 h-16 rounded-full bg-navy-mid mx-auto flex items-center justify-center text-gold-accent mb-4 border border-outline-variant/30">
            <span className="material-symbols-outlined text-3xl">sports</span>
          </div>
          <h3 className="font-h2 text-white uppercase text-xl">
            No Matches Currently In Progress
          </h3>
          <p className="font-body text-fog-text text-xs sm:text-sm max-w-md mx-auto mt-2">
            Check the event schedule below for upcoming fixtures or check back during scheduled match hours.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {displayMatches.map((fixture) => {
            const teamAName = fixture.team_a?.name || fixture.player_a?.name || 'TBD';
            const teamBName = fixture.team_b?.name || fixture.player_b?.name || 'TBD';
            const batchACode = fixture.team_a?.batch?.code || fixture.player_a?.batch?.code || '';
            const batchBCode = fixture.team_b?.batch?.code || fixture.player_b?.batch?.code || '';

            return (
              <div
                key={fixture.id}
                className="bg-navy-mid border-l-4 border-gold-accent p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl hover:bg-navy-mid/90 transition-all rounded-r"
              >
                {/* Header: Sport & Live Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-accent text-xl">
                      {fixture.game.slug === 'cricket'
                        ? 'sports_cricket'
                        : fixture.game.slug === 'futsal'
                        ? 'sports_soccer'
                        : fixture.game.slug === 'volleyball'
                        ? 'sports_volleyball'
                        : fixture.game.slug === 'throwball'
                        ? 'sports_handball'
                        : 'sports'}
                    </span>
                    <span className="font-caps-label text-xs uppercase text-white font-bold">
                      {fixture.game.name}
                    </span>
                    <span className="text-fog-text text-xs">&bull;</span>
                    <span className="font-table-numeral text-xs text-fog-text">
                      {fixture.round || fixture.stage}
                    </span>
                  </div>

                  {/* Pulsing Live Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container-highest border border-live-red/50 text-live-red font-caps-label text-[11px] uppercase font-bold rounded">
                    <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                    <span>Live</span>
                  </div>
                </div>

                {/* Scoreboard Arena */}
                <div className="flex items-center justify-between py-2 sm:py-3 bg-surface-container-lowest/60 rounded px-4">
                  {/* Team A */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="font-h2 text-base sm:text-lg text-white uppercase truncate font-bold">
                      {teamAName}
                    </div>
                    {batchACode && (
                      <span className="font-caps-label text-[11px] text-gold-accent">
                        Batch {batchACode}
                      </span>
                    )}
                  </div>

                  {/* Giant Scores */}
                  <div className="px-4 text-center">
                    <div className="font-display text-3xl sm:text-4xl text-gold-accent tracking-tight leading-none">
                      {fixture.score_a ?? 0} &ndash; {fixture.score_b ?? 0}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 text-center sm:text-right min-w-0">
                    <div className="font-h2 text-base sm:text-lg text-white uppercase truncate font-bold">
                      {teamBName}
                    </div>
                    {batchBCode && (
                      <span className="font-caps-label text-[11px] text-gold-accent">
                        Batch {batchBCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Venue & Timing */}
                <div className="flex items-center justify-between text-xs text-fog-text pt-2 border-t border-outline-variant/20">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {fixture.venue || 'MUET Gymnasium Arena'}
                  </span>
                  <span className="font-table-numeral">
                    Started {fixture.scheduled_at.slice(11, 16)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upcoming Fixtures Section ── */}
      {upcomingMatches.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-white uppercase text-xl sm:text-2xl mb-4 tracking-tight">
            UPCOMING ON SCHEDULE
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingMatches.map((f) => (
              <div
                key={f.id}
                className="p-4 bg-surface-container border border-outline-variant/20 rounded flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-caps-label text-xs text-gold-accent uppercase font-bold block">
                    {f.game.name} &bull; {f.round || f.stage}
                  </span>
                  <div className="font-caps-label text-xs sm:text-sm text-white mt-1">
                    {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                    {f.team_b?.name || f.player_b?.name || 'TBD'}
                  </div>
                  <span className="text-[11px] text-fog-text">
                    {f.venue || 'MUET Gym'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-display text-gold-accent text-lg block">
                    {f.scheduled_at.slice(11, 16)}
                  </span>
                  <span className="font-caps-label text-[10px] text-on-surface-variant uppercase">
                    Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
