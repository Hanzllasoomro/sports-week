'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { StandingRow } from '@/types';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface StandingsTableProps {
  initialStandings: StandingRow[];
}

export function StandingsTable({ initialStandings }: StandingsTableProps) {
  const [standings, setStandings] = useState<StandingRow[]>(initialStandings);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('public_standings_updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'standings' },
          () => {
            fetchLatestStandings();
          }
        )
        .subscribe();
    } catch {
      // ignore
    }

    const interval = setInterval(() => {
      fetchLatestStandings();
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

  async function fetchLatestStandings() {
    try {
      const res = await fetch('/api/standings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setStandings(data);
          setLastSync(new Date());
        }
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="w-full">
      {/* Informational Callout & Live Sync Status */}
      <div className="mb-6 p-3.5 sm:p-4 bg-navy-mid/60 border border-gold-accent/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-gold-accent text-xl mt-0.5 shrink-0">
            info
          </span>
          <div className="text-xs sm:text-sm text-fog-text">
            <span className="text-white font-bold">Unified University Standings:</span>{' '}
            Points earned by Boys and Girls teams/athletes across all 10 sports are combined into the batch total.
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-[11px] font-caps-label text-gold-accent uppercase font-bold shrink-0 bg-surface-container px-2.5 py-1 rounded border border-outline-variant/30">
          <span className="w-2 h-2 rounded-full bg-win-green" />
          <span suppressHydrationWarning>Auto-Sync (~20s)</span>
        </div>
      </div>

      {/* Standings Table Container */}
      <div className="w-full bg-surface-container-lowest border border-outline-variant/20 shadow-xl overflow-hidden">
        {/* Table Column Headers */}
        <div className="flex items-center px-3 sm:px-6 py-3.5 bg-navy-mid text-cream font-caps-label text-xs sm:text-sm uppercase tracking-wider border-b border-outline-variant/30 select-none">
          <div className="w-12 sm:w-16 text-center font-bold">RANK</div>
          <div className="flex-1 pl-2 sm:pl-4">BATCH &amp; DEPARTMENT</div>
          <div className="w-20 sm:w-28 text-right pr-2 sm:pr-4 font-bold">POINTS</div>
          <div className="w-8 text-center sm:block hidden" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-outline-variant/15">
          {standings.map((row) => {
            const isRank1 = row.rank === 1;
            const isSelected = selectedBatchId === row.batch.id;

            return (
              <div key={row.batch.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedBatchId(isSelected ? null : row.batch.id)
                  }
                  className={cn(
                    'w-full flex items-center px-3 sm:px-6 py-4 text-left transition-all duration-200 cursor-pointer group',
                    isRank1
                      ? 'bg-navy-deep border-l-4 border-gold-accent hover:bg-navy-mid/40'
                      : 'bg-surface-container hover:bg-navy-mid/30 border-l-4 border-transparent',
                    isSelected && 'bg-navy-mid/60'
                  )}
                  aria-expanded={isSelected}
                >
                  {/* Rank Column */}
                  <div className="w-12 sm:w-16 text-center shrink-0">
                    <span
                      className={cn(
                        'font-display text-xl sm:text-2xl',
                        isRank1
                          ? 'text-gold-accent font-bold scale-110 inline-block'
                          : row.rank <= 3
                          ? 'text-cream'
                          : 'text-on-surface-variant'
                      )}
                    >
                      {row.rank}
                    </span>
                  </div>

                  {/* Batch & Department Info */}
                  <div className="flex-1 pl-2 sm:pl-4 flex items-center gap-2.5 sm:gap-4 min-w-0">
                    {/* Badge Icon */}
                    <div
                      className={cn(
                        'w-9 h-9 sm:w-11 sm:h-11 rounded flex items-center justify-center font-display text-sm sm:text-base tracking-wider shrink-0 border',
                        isRank1
                          ? 'bg-gold-accent text-navy-deep border-gold-accent font-bold shadow'
                          : row.batch.department.code === 'AI'
                          ? 'bg-surface-container-high text-primary border-primary/40'
                          : 'bg-surface-container-high text-gold-accent border-gold-accent/30'
                      )}
                    >
                      {row.batch.code.slice(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-h2 text-base sm:text-xl uppercase tracking-tight truncate',
                            isRank1 ? 'text-gold-accent font-bold' : 'text-white'
                          )}
                        >
                          {row.batch.code}
                        </span>
                        <span className="text-[10px] sm:text-xs font-caps-label px-1.5 py-0.5 rounded bg-surface-container-highest text-fog-text uppercase shrink-0">
                          {row.batch.department.code}
                        </span>
                      </div>
                      <p className="font-body text-fog-text text-xs sm:text-sm truncate hidden xs:block sm:block">
                        {row.batch.department.name}
                      </p>
                    </div>
                  </div>

                  {/* Points Column */}
                  <div className="w-20 sm:w-28 text-right pr-2 sm:pr-4 shrink-0">
                    <span
                      className={cn(
                        'font-display text-lg sm:text-2xl',
                        isRank1 ? 'text-gold-accent font-bold' : 'text-cream'
                      )}
                    >
                      {row.total_points}
                    </span>
                    <span className="font-caps-label text-[10px] text-fog-text uppercase ml-1">
                      PTS
                    </span>
                  </div>

                  {/* Expand Chevron */}
                  <div className="w-8 text-center shrink-0 text-on-surface-variant group-hover:text-gold-accent transition-colors">
                    <span
                      className={cn(
                        'material-symbols-outlined text-lg transition-transform duration-200',
                        isSelected && 'rotate-180 text-gold-accent'
                      )}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Expanded Sport Breakdown Accordion */}
                {isSelected && (
                  <div className="px-4 sm:px-16 py-4 bg-surface-container-lowest border-t border-outline-variant/20 animate-in fade-in-50 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-outline-variant/20">
                      <h4 className="font-caps-label text-xs uppercase text-gold-accent font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">analytics</span>
                        {row.batch.code} &bull; Sport Contribution Breakdown
                      </h4>
                      <Link
                        href={`/teams/${row.batch.code}`}
                        className="text-xs text-fog-text hover:text-white flex items-center gap-1 underline"
                      >
                        View Full Batch Roster &rarr;
                      </Link>
                    </div>

                    {Object.keys(row.breakdown).length === 0 ? (
                      <p className="text-xs text-fog-text py-2">
                        No matches or individual podium finishes recorded yet for this batch.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {Object.entries(row.breakdown).map(([sport, scores]) => {
                          const sportTotal = (scores.boys || 0) + (scores.girls || 0);
                          if (sportTotal === 0) return null;

                          return (
                            <div
                              key={sport}
                              className="p-2.5 bg-surface-container rounded border border-outline-variant/20"
                            >
                              <div className="font-caps-label text-xs text-white uppercase font-bold truncate">
                                {sport.replace('-', ' ')}
                              </div>
                              <div className="flex items-center justify-between mt-1 text-xs">
                                <span className="text-fog-text">
                                  B: {scores.boys} | G: {scores.girls}
                                </span>
                                <span className="font-display text-gold-accent text-sm font-bold">
                                  +{sportTotal}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
