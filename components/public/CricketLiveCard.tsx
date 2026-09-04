'use client';

import type { FixtureWithRelations, CricketMatchDetails } from '@/types';
import { cn } from '@/lib/utils';

interface CricketLiveCardProps {
  fixture: FixtureWithRelations;
}

export function CricketLiveCard({ fixture }: CricketLiveCardProps) {
  const isLive = fixture.status === 'live';
  const isCompleted = fixture.status === 'completed';

  const teamAName = fixture.team_a?.name || 'Team A';
  const teamBName = fixture.team_b?.name || 'Team B';
  const batchACode = fixture.team_a?.batch?.code || '';
  const batchBCode = fixture.team_b?.batch?.code || '';

  const details: CricketMatchDetails = fixture.cricket_details || {
    innings: 1,
    batting_team_id: fixture.team_a_id || fixture.team_a?.id || '',
    overs_limit: 6,
    target: null,
    team_a_cricket: { runs: fixture.score_a ?? 0, wickets: 0, overs: '0.0' },
    team_b_cricket: { runs: fixture.score_b ?? 0, wickets: 0, overs: '0.0' },
    current_batsmen: [
      { name: 'Batter 1', runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: true },
      { name: 'Batter 2', runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: false },
    ],
    current_bowler: { name: 'Bowler', overs: '0.0', maidens: 0, runs_conceded: 0, wickets: 0 },
    recent_balls: [],
  };

  const isTeamABatting =
    !details.batting_team_id ||
    details.batting_team_id === fixture.team_a_id ||
    details.batting_team_id === fixture.team_a?.id;

  const battingTeamName = isTeamABatting ? teamAName : teamBName;
  const battingBatchCode = isTeamABatting ? batchACode : batchBCode;
  const battingStats = isTeamABatting ? details.team_a_cricket : details.team_b_cricket;

  const bowlingTeamName = isTeamABatting ? teamBName : teamAName;
  const bowlingBatchCode = isTeamABatting ? batchBCode : batchACode;
  const bowlingStats = isTeamABatting ? details.team_b_cricket : details.team_a_cricket;

  // Calculate runs needed & balls remaining if target is set
  const oversParts = (battingStats?.overs || '0.0').split('.');
  const oversBowled = parseInt(oversParts[0] || '0', 10);
  const ballsInOver = parseInt(oversParts[1] || '0', 10);
  const totalBallsBowled = oversBowled * 6 + ballsInOver;
  const maxBalls = (details.overs_limit || 6) * 6;
  const ballsRemaining = Math.max(0, maxBalls - totalBallsBowled);

  const runsNeeded = details.target ? Math.max(0, details.target - battingStats.runs) : null;

  return (
    <div className="bg-navy-mid border-2 border-gold-accent/70 rounded shadow-2xl overflow-hidden">
      {/* ── Top Bar: Match Context & Status ── */}
      <div className="bg-navy-deep/90 px-4 sm:px-5 py-3 border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gold-accent text-xl">sports_cricket</span>
          <span className="font-caps-label text-xs sm:text-sm uppercase font-bold text-white tracking-wider">
            CRICKET {details.overs_limit ? `(${details.overs_limit} OVERS)` : ''} &bull;{' '}
            <span className="text-gold-accent">{fixture.round || fixture.stage}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-fog-text hidden sm:inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {fixture.venue || 'MUET Main Ground (Pitch A)'}
          </span>

          {isLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-live-red/15 border border-live-red text-live-red font-caps-label text-[11px] uppercase font-bold rounded">
              <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
              <span>LIVE</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-win-green/20 border border-win-green text-win-green font-caps-label text-[11px] uppercase font-bold rounded">
              <span>COMPLETED</span>
            </div>
          ) : (
            <div className="px-2.5 py-0.5 bg-surface-container border border-outline-variant/40 text-fog-text font-caps-label text-[11px] uppercase font-bold rounded">
              <span>SCHEDULED</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Toss & Venue Subtitle ── */}
      {details.toss_note && (
        <div className="px-4 sm:px-5 py-2 bg-surface-container-lowest/80 border-b border-outline-variant/15 text-[11px] font-caps-label text-gold-accent flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs">info</span>
          <span>{details.toss_note}</span>
        </div>
      )}

      {/* ── Primary Cricket Scoreboard Arena ── */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-navy-mid via-surface-container-lowest to-navy-deep">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Batting Team Giant Stats (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-gold-accent text-navy-deep font-caps-label text-[10px] font-extrabold uppercase rounded shadow-sm">
                BATTING
              </span>
              <span className="text-fog-text text-xs font-caps-label">
                Innings {details.innings} of 2
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-h2 text-xl sm:text-2xl lg:text-3xl text-white uppercase font-black tracking-tight">
                {battingTeamName}
              </h2>
              {battingBatchCode && (
                <span className="font-caps-label text-xs sm:text-sm text-gold-accent font-bold">
                  Batch {battingBatchCode}
                </span>
              )}
            </div>

            {/* Giant Runs/Wickets & Overs */}
            <div className="flex items-baseline gap-3 my-2">
              <div className="font-display text-5xl sm:text-6xl lg:text-7xl text-gold-accent leading-none font-table-numeral tracking-tight">
                {battingStats.runs}
                <span className="text-white/60 font-sans text-3xl sm:text-4xl font-light">/</span>
                <span className="text-white">{battingStats.wickets}</span>
              </div>
              <div className="font-table-numeral text-sm sm:text-base text-fog-text">
                <span className="text-white font-bold text-base sm:text-lg">
                  {battingStats.overs}
                </span>
                <span className="text-fog-text"> / {details.overs_limit || 6} ov</span>
              </div>
            </div>

            {/* Other Team Summary */}
            <div className="text-xs text-fog-text flex items-center gap-2 mt-1">
              <span>{bowlingTeamName} (Batch {bowlingBatchCode}):</span>
              <span className="font-table-numeral text-white font-bold">
                {bowlingStats.runs}/{bowlingStats.wickets}
              </span>
              <span className="text-[11px]">({bowlingStats.overs} ov)</span>
            </div>
          </div>

          {/* Match Equation & Run Rates Box (5 cols) */}
          <div className="md:col-span-5 bg-surface-container-low/90 p-4 rounded border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-inner">
            {details.target ? (
              <div className="border-b border-outline-variant/20 pb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-caps-label text-fog-text uppercase font-bold">TARGET</span>
                  <span className="font-display text-lg text-gold-accent font-table-numeral">
                    {details.target}
                  </span>
                </div>
                {runsNeeded !== null && (
                  <div className="font-caps-label text-xs sm:text-sm text-white font-bold mt-1 text-live-red animate-pulse">
                    {runsNeeded <= 0
                      ? `${battingTeamName} won the match!`
                      : `Need ${runsNeeded} runs from ${ballsRemaining} balls`}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-b border-outline-variant/20 pb-2">
                <span className="font-caps-label text-[11px] text-gold-accent uppercase font-bold">
                  1ST INNINGS IN PROGRESS
                </span>
                <div className="text-xs text-fog-text mt-0.5">
                  Projected Total: ~
                  <span className="text-white font-bold font-table-numeral">
                    {Math.round(
                      battingStats.runs / Math.max(1, totalBallsBowled / 6) * (details.overs_limit || 6)
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Run Rate Meters */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-surface-container p-2 rounded border border-outline-variant/20">
                <span className="block text-[10px] font-caps-label text-fog-text uppercase">
                  CRR (Curr Rate)
                </span>
                <span className="font-display text-base sm:text-lg text-white font-table-numeral">
                  {details.crr ?? (totalBallsBowled > 0 ? ((battingStats.runs / totalBallsBowled) * 6).toFixed(2) : '0.00')}
                </span>
              </div>
              <div className="bg-surface-container p-2 rounded border border-outline-variant/20">
                <span className="block text-[10px] font-caps-label text-fog-text uppercase">
                  RRR (Req Rate)
                </span>
                <span className="font-display text-base sm:text-lg text-gold-accent font-table-numeral">
                  {details.rrr ??
                    (details.target && ballsRemaining > 0
                      ? (((details.target - battingStats.runs) / ballsRemaining) * 6).toFixed(2)
                      : details.target ? '0.00' : '—')}
                </span>
              </div>
            </div>

            {details.status_note && (
              <div className="text-[11px] text-fog-text italic pt-1 border-t border-outline-variant/15 truncate">
                {details.status_note}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Batsmen on Pitch & Active Bowler Arena ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-outline-variant/30 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/30 bg-surface-container-lowest">
        {/* On Strike / Non-Striker Batsmen Table (7 cols) */}
        <div className="lg:col-span-7 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-caps-label text-[11px] uppercase text-gold-accent font-bold tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">sports_cricket</span>
              BATSMEN ON CREASE
            </span>
            <span className="text-[10px] font-caps-label text-fog-text uppercase">
              R (B) &bull; 4s / 6s &bull; SR
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {(details.current_batsmen || []).map((batter, idx) => {
              const strikeRate = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded border transition-colors',
                    batter.is_on_strike
                      ? 'bg-navy-mid/70 border-gold-accent/50 text-white shadow-sm'
                      : 'bg-surface-container/50 border-outline-variant/20 text-fog-text'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {batter.is_on_strike && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-pulse shrink-0" />
                    )}
                    <span className="font-caps-label text-xs sm:text-sm font-bold text-white truncate">
                      {batter.name} {batter.is_on_strike ? '*' : ''}
                    </span>
                    {batter.how_out && (
                      <span className="text-[10px] text-live-red truncate">({batter.how_out})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-table-numeral text-xs">
                    <span className="text-white font-bold text-sm">
                      {batter.runs}{' '}
                      <span className="text-fog-text text-xs font-normal">({batter.balls})</span>
                    </span>
                    <span className="text-fog-text text-[11px] hidden sm:inline">
                      {batter.fours}x4 &bull; {batter.sixes}x6
                    </span>
                    <span className="text-gold-accent text-xs w-12 text-right">
                      {strikeRate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Bowler (5 cols) */}
        <div className="lg:col-span-5 p-4 flex flex-col justify-between">
          <div>
            <span className="font-caps-label text-[11px] uppercase text-gold-accent font-bold tracking-wider flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-xs">sports_baseball</span>
              CURRENT BOWLER
            </span>

            {details.current_bowler ? (
              <div className="bg-navy-mid/70 p-3 rounded border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <div className="font-caps-label text-xs sm:text-sm font-bold text-white">
                    {details.current_bowler.name}
                  </div>
                  <div className="text-[10px] font-caps-label text-fog-text uppercase mt-0.5">
                    Bowling Spell
                  </div>
                </div>

                <div className="text-right font-table-numeral">
                  <div className="text-sm font-bold text-white">
                    {details.current_bowler.wickets}
                    <span className="text-fog-text font-normal text-xs"> / </span>
                    {details.current_bowler.runs_conceded}
                  </div>
                  <div className="text-[11px] text-fog-text">
                    {details.current_bowler.overs} ov &bull; M: {details.current_bowler.maidens}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-fog-text italic p-3">No bowler currently assigned</div>
            )}
          </div>

          {/* ── Ball-by-ball timeline for the current over ── */}
          <div className="mt-3">
            <span className="block text-[10px] font-caps-label text-fog-text uppercase mb-1.5">
              THIS OVER TIMELINE
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {(details.recent_balls && details.recent_balls.length > 0
                ? details.recent_balls
                : ['•', '•', '•', '•', '•', '•']
              ).map((ball, bIdx) => {
                const isWicket = ball.toUpperCase().includes('W') && !ball.toUpperCase().includes('WD');
                const isSix = ball === '6';
                const isFour = ball === '4';
                const isDot = ball === '0' || ball === '•';
                const isExtra = ball.toLowerCase().includes('wd') || ball.toLowerCase().includes('nb');

                return (
                  <span
                    key={bIdx}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center font-display text-xs font-bold shrink-0 shadow-sm',
                      isWicket
                        ? 'bg-live-red text-white'
                        : isSix
                        ? 'bg-gold-accent text-navy-deep'
                        : isFour
                        ? 'bg-win-green text-navy-deep'
                        : isExtra
                        ? 'bg-amber-500 text-navy-deep text-[10px]'
                        : isDot
                        ? 'bg-surface-container text-fog-text/60 border border-outline-variant/30'
                        : 'bg-surface-container-high text-white'
                    )}
                  >
                    {ball}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fall of Wickets / Dismissed Batters Scorecard (if any) ── */}
      {details.batsmen_card && details.batsmen_card.length > 0 && (
        <div className="border-t border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-caps-label text-[11px] uppercase text-fog-text font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-live-red">cancel</span>
              FALL OF WICKETS &bull; DISMISSED BATTERS
            </span>
            <span className="text-[10px] font-caps-label text-fog-text uppercase">
              R (B) &bull; 4s/6s &bull; SR
            </span>
          </div>

          <div className="divide-y divide-outline-variant/15 text-xs font-body">
            {details.batsmen_card.map((b, idx) => {
              const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
              return (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="font-bold text-white mr-2">{b.name}</span>
                    <span className="text-fog-text text-[11px] italic">({b.how_out || 'out'})</span>
                  </div>
                  <div className="font-table-numeral text-right shrink-0 flex items-center gap-3">
                    <span className="text-white font-bold">{b.runs} ({b.balls}b)</span>
                    <span className="text-fog-text text-[11px] hidden sm:inline">{b.fours}x4 {b.sixes}x6</span>
                    <span className="text-gold-accent text-xs w-12 text-right">{sr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
