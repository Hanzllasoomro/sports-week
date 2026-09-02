'use client';

import { useState } from 'react';
import type { FixtureWithRelations, Game } from '@/types';
import { cn, fixtureTime } from '@/lib/utils';

interface ScheduleViewProps {
  initialFixtures: FixtureWithRelations[];
  games: Game[];
}

export function ScheduleView({ initialFixtures, games }: ScheduleViewProps) {
  const [selectedDay, setSelectedDay] = useState<1 | 2 | 3>(1);
  const [selectedSport, setSelectedSport] = useState<string>('all');

  const DAYS = [
    { day: 1 as const, label: 'Day 1', date: 'SEP 08' },
    { day: 2 as const, label: 'Day 2', date: 'SEP 09' },
    { day: 3 as const, label: 'Day 3 (Finals)', date: 'SEP 10' },
  ];

  const datePrefixes: Record<1 | 2 | 3, string> = {
    1: '2026-09-08',
    2: '2026-09-09',
    3: '2026-09-10',
  };

  const filteredFixtures = initialFixtures.filter((f) => {
    const matchesDay = f.scheduled_at.startsWith(datePrefixes[selectedDay]);
    const matchesSport =
      selectedSport === 'all' || f.game.slug === selectedSport;
    return matchesDay && matchesSport;
  });

  return (
    <div className="w-full">
      {/* ── Day Navigation Tabs (Horizontally scrollable on mobile) ── */}
      <div className="border-b border-outline-variant/30 mb-6 overflow-x-auto no-scrollbar" role="tablist" aria-label="Tournament Days">
        <div className="flex gap-4 sm:gap-8 min-w-max pb-1">
          {DAYS.map((d) => {
            const isActive = selectedDay === d.day;
            return (
              <button
                key={d.day}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDay(d.day)}
                className={cn(
                  'pb-3 font-caps-label text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap border-b-2 font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent rounded-sm',
                  isActive
                    ? 'border-gold-accent text-gold-accent'
                    : 'border-transparent text-fog-text hover:text-white hover:border-fog-text/40'
                )}
              >
                {d.label} &bull; <span className="font-table-numeral">{d.date}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sport Filter Chips ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        <button
          type="button"
          onClick={() => setSelectedSport('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-caps-label uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 border',
            selectedSport === 'all'
              ? 'bg-gold-accent text-navy-deep border-gold-accent font-bold'
              : 'bg-surface-container text-fog-text border-outline-variant/30 hover:text-white'
          )}
        >
          All Sports ({initialFixtures.filter((f) => f.scheduled_at.startsWith(datePrefixes[selectedDay])).length})
        </button>
        {games.map((g) => {
          const count = initialFixtures.filter(
            (f) =>
              f.scheduled_at.startsWith(datePrefixes[selectedDay]) &&
              f.game.slug === g.slug
          ).length;

          if (count === 0) return null;

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedSport(g.slug)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-caps-label uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 border',
                selectedSport === g.slug
                  ? 'bg-gold-accent text-navy-deep border-gold-accent font-bold'
                  : 'bg-surface-container text-fog-text border-outline-variant/30 hover:text-white'
              )}
            >
              {g.name} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Fixtures List ── */}
      {filteredFixtures.length === 0 ? (
        <div className="p-10 text-center bg-surface-container rounded border border-outline-variant/20">
          <span className="material-symbols-outlined text-4xl text-fog-text mb-2">
            event_busy
          </span>
          <h3 className="font-h2 text-white uppercase text-lg">
            No fixtures scheduled
          </h3>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            No matches matching the selected filter on Day {selectedDay}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredFixtures.map((fixture) => {
            const isLive = fixture.status === 'live';
            const isCompleted = fixture.status === 'completed';

            const teamAName = fixture.team_a?.name || fixture.player_a?.name || 'TBD';
            const teamBName = fixture.team_b?.name || fixture.player_b?.name || 'TBD';
            const batchACode = fixture.team_a?.batch?.code || fixture.player_a?.batch?.code || '';
            const batchBCode = fixture.team_b?.batch?.code || fixture.player_b?.batch?.code || '';

            const winnerA = isCompleted && fixture.score_a != null && fixture.score_b != null && fixture.score_a > fixture.score_b;
            const winnerB = isCompleted && fixture.score_a != null && fixture.score_b != null && fixture.score_b > fixture.score_a;

            return (
              <div
                key={fixture.id}
                className={cn(
                  'flex items-stretch overflow-hidden transition-all duration-200 border',
                  isLive
                    ? 'bg-navy-mid border-live-red/60 shadow-lg'
                    : isCompleted
                    ? 'bg-surface-dim border-outline-variant/15 opacity-90'
                    : 'bg-surface-container border-outline-variant/25 hover:bg-surface-container-high'
                )}
              >
                {/* Left Indicator Strip */}
                <div
                  className={cn(
                    'w-1.5 shrink-0',
                    isLive
                      ? 'bg-live-red relative'
                      : isCompleted
                      ? 'bg-win-green/60'
                      : 'bg-outline-variant/30'
                  )}
                >
                  {isLive && (
                    <div className="absolute inset-0 bg-live-red animate-pulse" />
                  )}
                </div>

                {/* Fixture Body */}
                <div className="flex-1 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  {/* Left: Timing & Sport Badge */}
                  <div className="flex items-center gap-3 sm:w-1/4 shrink-0">
                    <div className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px] text-center">
                      <span
                        className={cn(
                          'font-display text-sm sm:text-base font-bold',
                          isLive
                            ? 'text-live-red'
                            : isCompleted
                            ? 'text-fog-text'
                            : 'text-gold-accent'
                        )}
                      >
                        {isLive ? 'LIVE' : fixtureTime(fixture.scheduled_at)}
                      </span>
                      <span className="material-symbols-outlined text-lg sm:text-xl text-on-surface-variant mt-0.5">
                        {fixture.game.slug === 'cricket'
                          ? 'sports_cricket'
                          : fixture.game.slug === 'futsal'
                          ? 'sports_soccer'
                          : fixture.game.slug === 'volleyball'
                          ? 'sports_volleyball'
                          : fixture.game.slug === 'throwball'
                          ? 'sports_handball'
                          : fixture.game.slug === 'tug-of-war'
                          ? 'fitness_center'
                          : 'sports'}
                      </span>
                    </div>

                    <div>
                      <span className="font-caps-label text-xs uppercase text-white font-bold block">
                        {fixture.game.name}
                      </span>
                      <span className="font-table-numeral text-[11px] text-fog-text">
                        {fixture.round || fixture.stage}
                      </span>
                    </div>
                  </div>

                  {/* Center: Teams & Scores */}
                  <div className="flex-1 flex flex-col justify-center gap-1.5 py-1 sm:py-0 border-y sm:border-y-0 border-outline-variant/10">
                    {/* Team A */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={cn(
                            'font-caps-label text-xs sm:text-sm uppercase truncate',
                            winnerA ? 'text-win-green font-bold' : 'text-on-surface'
                          )}
                        >
                          {teamAName}
                        </span>
                        {batchACode && (
                          <span className="text-[10px] font-caps-label px-1 bg-surface-container-high rounded text-gold-accent">
                            {batchACode}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'font-display text-base sm:text-lg',
                          winnerA ? 'text-win-green font-bold' : 'text-fog-text'
                        )}
                      >
                        {isLive || isCompleted ? fixture.score_a ?? 0 : '-'}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={cn(
                            'font-caps-label text-xs sm:text-sm uppercase truncate',
                            winnerB ? 'text-win-green font-bold' : 'text-on-surface'
                          )}
                        >
                          {teamBName}
                        </span>
                        {batchBCode && (
                          <span className="text-[10px] font-caps-label px-1 bg-surface-container-high rounded text-gold-accent">
                            {batchBCode}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'font-display text-base sm:text-lg',
                          winnerB ? 'text-win-green font-bold' : 'text-fog-text'
                        )}
                      >
                        {isLive || isCompleted ? fixture.score_b ?? 0 : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Venue & Status Indicator */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 sm:min-w-[130px] shrink-0 text-right">
                    <span className="text-xs text-fog-text flex items-center gap-1 truncate">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {fixture.venue || 'MUET Gym'}
                    </span>

                    {isLive ? (
                      <span className="font-caps-label text-[11px] text-live-red uppercase font-bold flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-highest border border-live-red/40 rounded">
                        <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                        In Progress
                      </span>
                    ) : isCompleted ? (
                      <span className="font-caps-label text-[11px] text-win-green uppercase font-semibold">
                        Final Score
                      </span>
                    ) : (
                      <span className="font-caps-label text-[11px] text-on-surface-variant uppercase">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
