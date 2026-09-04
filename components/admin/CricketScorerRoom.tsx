'use client';

import { useState, useEffect } from 'react';
import type { FixtureWithRelations, CricketMatchDetails, CricketBatsman, CricketBowler } from '@/types';
import { cn } from '@/lib/utils';

interface CricketScorerRoomProps {
  fixture: FixtureWithRelations;
  isSubmitting: boolean;
  onSave: (payload: {
    scoreA: number;
    scoreB: number;
    status: 'live' | 'completed';
    cricketDetails: CricketMatchDetails;
    winnerTeamId?: string | null;
  }) => Promise<void>;
}

export function CricketScorerRoom({ fixture, isSubmitting, onSave }: CricketScorerRoomProps) {
  const teamAName = fixture.team_a?.name || 'Team A';
  const teamBName = fixture.team_b?.name || 'Team B';
  const teamAId = fixture.team_a_id || fixture.team_a?.id || 'team_a';
  const teamBId = fixture.team_b_id || fixture.team_b?.id || 'team_b';

  // Load existing details or provide sensible defaults
  const initialDetails: CricketMatchDetails = fixture.cricket_details || {
    innings: 1,
    batting_team_id: teamAId,
    overs_limit: 6,
    target: null,
    team_a_cricket: {
      runs: fixture.score_a ?? 0,
      wickets: 0,
      overs: '0.0',
      extras: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0, total: 0 },
    },
    team_b_cricket: {
      runs: fixture.score_b ?? 0,
      wickets: 0,
      overs: '0.0',
      extras: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0, total: 0 },
    },
    current_batsmen: [
      { name: 'Batter 1', runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: true },
      { name: 'Batter 2', runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: false },
    ],
    current_bowler: { name: 'Bowler 1', overs: '0.0', maidens: 0, runs_conceded: 0, wickets: 0 },
    recent_balls: [],
    toss_note: `${teamAName} won the toss & elected to bat`,
  };

  const [innings, setInnings] = useState<1 | 2>(initialDetails.innings || 1);
  const [battingTeamId, setBattingTeamId] = useState<string>(initialDetails.batting_team_id || teamAId);
  const [oversLimit, setOversLimit] = useState<number>(initialDetails.overs_limit || 6);
  const [target, setTarget] = useState<number | ''>(initialDetails.target ?? '');
  const [status, setStatus] = useState<'live' | 'completed'>(fixture.status === 'completed' ? 'completed' : 'live');

  // Innings scores
  const [runsA, setRunsA] = useState<number>(initialDetails.team_a_cricket?.runs ?? fixture.score_a ?? 0);
  const [wicketsA, setWicketsA] = useState<number>(initialDetails.team_a_cricket?.wickets ?? 0);
  const [oversA, setOversA] = useState<string>(initialDetails.team_a_cricket?.overs ?? '0.0');

  const [runsB, setRunsB] = useState<number>(initialDetails.team_b_cricket?.runs ?? fixture.score_b ?? 0);
  const [wicketsB, setWicketsB] = useState<number>(initialDetails.team_b_cricket?.wickets ?? 0);
  const [oversB, setOversB] = useState<string>(initialDetails.team_b_cricket?.overs ?? '0.0');

  // Active Batsmen
  const [batsmen, setBatsmen] = useState<CricketBatsman[]>(
    initialDetails.current_batsmen && initialDetails.current_batsmen.length >= 2
      ? initialDetails.current_batsmen
      : [
          { name: 'Batter 1', runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: true },
          { name: 'Batter 2', runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: false },
        ]
  );

  // Active Bowler
  const [bowler, setBowler] = useState<CricketBowler>(
    initialDetails.current_bowler || {
      name: 'Bowler',
      overs: '0.0',
      maidens: 0,
      runs_conceded: 0,
      wickets: 0,
    }
  );

  // Recent Balls & Notes
  const [recentBalls, setRecentBalls] = useState<string[]>(initialDetails.recent_balls || []);
  const [tossNote, setTossNote] = useState<string>(initialDetails.toss_note || '');
  const [statusNote, setStatusNote] = useState<string>(initialDetails.status_note || '');

  // Reset or update state whenever fixture prop changes
  useEffect(() => {
    if (fixture) {
      const details = fixture.cricket_details;
      setInnings(details?.innings || 1);
      setBattingTeamId(details?.batting_team_id || teamAId);
      setOversLimit(details?.overs_limit || 6);
      setTarget(details?.target ?? '');
      setStatus(fixture.status === 'completed' ? 'completed' : 'live');

      setRunsA(details?.team_a_cricket?.runs ?? fixture.score_a ?? 0);
      setWicketsA(details?.team_a_cricket?.wickets ?? 0);
      setOversA(details?.team_a_cricket?.overs ?? '0.0');

      setRunsB(details?.team_b_cricket?.runs ?? fixture.score_b ?? 0);
      setWicketsB(details?.team_b_cricket?.wickets ?? 0);
      setOversB(details?.team_b_cricket?.overs ?? '0.0');

      if (details?.current_batsmen && details.current_batsmen.length >= 2) {
        setBatsmen(details.current_batsmen);
      }
      if (details?.current_bowler) {
        setBowler(details.current_bowler);
      }
      if (details?.recent_balls) {
        setRecentBalls(details.recent_balls);
      }
      if (details?.toss_note) {
        setTossNote(details.toss_note);
      }
      if (details?.status_note) {
        setStatusNote(details.status_note);
      }
    }
  }, [fixture.id]);

  const isBattingA = battingTeamId === teamAId;
  const currentRuns = isBattingA ? runsA : runsB;
  const currentWickets = isBattingA ? wicketsA : wicketsB;
  const currentOvers = isBattingA ? oversA : oversB;

  // Helper to add ball to over string (e.g. 1.2 -> 1.3; 1.5 -> 2.0)
  function incrementOvers(oversStr: string): { newOvers: string; isOverComplete: boolean } {
    const [ovStr, bStr] = oversStr.split('.');
    let ov = parseInt(ovStr || '0', 10);
    let b = parseInt(bStr || '0', 10);
    b += 1;
    let isOverComplete = false;
    if (b >= 6) {
      ov += 1;
      b = 0;
      isOverComplete = true;
    }
    return { newOvers: `${ov}.${b}`, isOverComplete };
  }

  // Quick Action Handler for scoring balls
  function handleRecordBall(action: '0' | '1' | '2' | '3' | '4' | '6' | 'W' | 'Wd' | 'Nb') {
    const runsToAdd =
      action === '0'
        ? 0
        : action === '1'
        ? 1
        : action === '2'
        ? 2
        : action === '3'
        ? 3
        : action === '4'
        ? 4
        : action === '6'
        ? 6
        : action === 'W'
        ? 0
        : 1; // Wd or Nb adds 1 extra run

    const isLegalBall = action !== 'Wd' && action !== 'Nb';

    // 1. Update Team Runs
    if (isBattingA) {
      setRunsA((prev) => prev + runsToAdd);
    } else {
      setRunsB((prev) => prev + runsToAdd);
    }

    // 2. Update Overs if legal delivery
    let overCompleted = false;
    if (isLegalBall) {
      if (isBattingA) {
        const { newOvers, isOverComplete } = incrementOvers(oversA);
        setOversA(newOvers);
        overCompleted = isOverComplete;
      } else {
        const { newOvers, isOverComplete } = incrementOvers(oversB);
        setOversB(newOvers);
        overCompleted = isOverComplete;
      }
      // Increment bowler over count too
      const { newOvers: newBowlerOvers } = incrementOvers(bowler.overs || '0.0');
      setBowler((prev) => ({
        ...prev,
        overs: newBowlerOvers,
        runs_conceded: prev.runs_conceded + runsToAdd,
      }));
    } else {
      // Extra conceded by bowler
      setBowler((prev) => ({ ...prev, runs_conceded: prev.runs_conceded + runsToAdd }));
    }

    // 3. Update Wicket if wicket fell
    if (action === 'W') {
      if (isBattingA) setWicketsA((prev) => Math.min(10, prev + 1));
      else setWicketsB((prev) => Math.min(10, prev + 1));
      setBowler((prev) => ({ ...prev, wickets: prev.wickets + 1 }));
    }

    // 4. Update Batsmen stats
    setBatsmen((prev) => {
      const updated = [...prev];
      const strikerIdx = updated.findIndex((b) => b.is_on_strike) !== -1 ? updated.findIndex((b) => b.is_on_strike) : 0;
      const nonStrikerIdx = strikerIdx === 0 ? 1 : 0;

      if (action === 'W') {
        // Striker is out, replace with next batsman
        updated[strikerIdx] = {
          ...updated[strikerIdx],
          balls: updated[strikerIdx].balls + (isLegalBall ? 1 : 0),
          how_out: `b ${bowler.name}`,
          is_on_strike: false,
        };
        // Introduce new batsman
        const newBatterNumber = (isBattingA ? wicketsA : wicketsB) + 3;
        updated[strikerIdx] = {
          name: `Batter ${newBatterNumber}`,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          is_on_strike: true,
        };
      } else if (isLegalBall) {
        // Legal scoring run
        updated[strikerIdx] = {
          ...updated[strikerIdx],
          runs: updated[strikerIdx].runs + runsToAdd,
          balls: updated[strikerIdx].balls + 1,
          fours: updated[strikerIdx].fours + (action === '4' ? 1 : 0),
          sixes: updated[strikerIdx].sixes + (action === '6' ? 1 : 0),
        };
      }

      // Rotate strike on odd runs (1 or 3)
      let shouldRotate = action === '1' || action === '3';
      // Rotate strike at end of over
      if (overCompleted) {
        shouldRotate = !shouldRotate;
      }

      if (shouldRotate && updated[strikerIdx] && updated[nonStrikerIdx]) {
        updated[strikerIdx].is_on_strike = false;
        updated[nonStrikerIdx].is_on_strike = true;
      }

      return updated;
    });

    // 5. Append ball to recent balls
    const ballLabel = action === 'Wd' ? '1wd' : action === 'Nb' ? '1nb' : action;
    setRecentBalls((prev) => {
      const next = [...prev, ballLabel];
      return next.slice(-12); // keep last 12 deliveries
    });
  }

  function handleSwapStrike() {
    setBatsmen((prev) =>
      prev.map((b) => ({ ...b, is_on_strike: !b.is_on_strike }))
    );
  }

  function handleUndoLastBall() {
    setRecentBalls((prev) => prev.slice(0, -1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Compute CRR and RRR
    const oversParts = currentOvers.split('.');
    const totalBalls = parseInt(oversParts[0] || '0', 10) * 6 + parseInt(oversParts[1] || '0', 10);
    const crr = totalBalls > 0 ? parseFloat(((currentRuns / totalBalls) * 6).toFixed(2)) : 0;

    let rrr: number | null = null;
    const targetVal = typeof target === 'number' ? target : null;
    if (targetVal) {
      const ballsRemaining = Math.max(1, oversLimit * 6 - totalBalls);
      const runsRemaining = Math.max(0, targetVal - currentRuns);
      rrr = parseFloat(((runsRemaining / ballsRemaining) * 6).toFixed(2));
    }

    const cricketDetailsPayload: CricketMatchDetails = {
      innings,
      batting_team_id: battingTeamId,
      overs_limit: oversLimit,
      target: targetVal,
      team_a_cricket: {
        runs: runsA,
        wickets: wicketsA,
        overs: oversA,
      },
      team_b_cricket: {
        runs: runsB,
        wickets: wicketsB,
        overs: oversB,
      },
      current_batsmen: batsmen,
      current_bowler: bowler,
      recent_balls: recentBalls,
      crr,
      rrr,
      status_note: statusNote.trim() || undefined,
      toss_note: tossNote.trim() || undefined,
    };

    let winnerTeamId: string | null = null;
    if (status === 'completed') {
      if (runsA > runsB) winnerTeamId = teamAId;
      else if (runsB > runsA) winnerTeamId = teamBId;
    }

    await onSave({
      scoreA: runsA,
      scoreB: runsB,
      status,
      cricketDetails: cricketDetailsPayload,
      winnerTeamId,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Top Match Control Bar ── */}
      <div className="bg-navy-mid p-4 rounded border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gold-accent text-xl">sports_cricket</span>
          <div>
            <h2 className="font-caps-label text-sm uppercase text-white font-bold">
              CRICKET DIGITAL SCORING CONSOLE
            </h2>
            <span className="text-xs text-fog-text">
              {fixture.round || fixture.stage} &bull; {teamAName} vs {teamBName}
            </span>
          </div>
        </div>

        {/* Innings & Overs Limit Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded border border-outline-variant/30">
            <span className="text-[11px] font-caps-label text-fog-text px-2 uppercase">Innings:</span>
            <button
              type="button"
              onClick={() => {
                setInnings(1);
                setBattingTeamId(teamAId);
              }}
              className={cn(
                'px-2.5 py-1 text-xs font-caps-label uppercase font-bold rounded cursor-pointer transition-colors',
                innings === 1 ? 'bg-gold-accent text-navy-deep' : 'text-fog-text hover:text-white'
              )}
            >
              1st Innings
            </button>
            <button
              type="button"
              onClick={() => {
                setInnings(2);
                setBattingTeamId(teamBId);
                if (!target && runsA > 0) setTarget(runsA + 1);
              }}
              className={cn(
                'px-2.5 py-1 text-xs font-caps-label uppercase font-bold rounded cursor-pointer transition-colors',
                innings === 2 ? 'bg-gold-accent text-navy-deep' : 'text-fog-text hover:text-white'
              )}
            >
              2nd Innings
            </button>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded border border-outline-variant/30 text-xs">
            <span className="font-caps-label text-fog-text uppercase">Overs Match:</span>
            <select
              value={oversLimit}
              onChange={(e) => setOversLimit(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value={4} className="bg-navy-deep">4 Overs</option>
              <option value={6} className="bg-navy-deep">6 Overs (Group)</option>
              <option value={8} className="bg-navy-deep">8 Overs (Final)</option>
              <option value={10} className="bg-navy-deep">10 Overs</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active Batting Team Switcher ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Team A Card */}
        <div
          onClick={() => setBattingTeamId(teamAId)}
          className={cn(
            'p-4 rounded border-2 transition-all cursor-pointer flex flex-col justify-between',
            isBattingA
              ? 'bg-navy-mid border-gold-accent shadow-xl'
              : 'bg-surface-container border-outline-variant/25 opacity-75 hover:opacity-100'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-h2 text-base uppercase text-white font-bold">
              {teamAName}
            </span>
            {isBattingA && (
              <span className="px-2 py-0.5 bg-gold-accent text-navy-deep font-caps-label text-[10px] uppercase font-bold rounded">
                BATTING NOW
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3 my-2">
            <span className="font-display text-4xl text-gold-accent font-table-numeral">
              {runsA}/{wicketsA}
            </span>
            <span className="text-fog-text font-table-numeral text-sm">
              ({oversA} / {oversLimit} ov)
            </span>
          </div>
          <div className="text-[11px] text-fog-text font-caps-label">
            Click to set {teamAName} as active batting team
          </div>
        </div>

        {/* Team B Card */}
        <div
          onClick={() => setBattingTeamId(teamBId)}
          className={cn(
            'p-4 rounded border-2 transition-all cursor-pointer flex flex-col justify-between',
            !isBattingA
              ? 'bg-navy-mid border-gold-accent shadow-xl'
              : 'bg-surface-container border-outline-variant/25 opacity-75 hover:opacity-100'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-h2 text-base uppercase text-white font-bold">
              {teamBName}
            </span>
            {!isBattingA && (
              <span className="px-2 py-0.5 bg-gold-accent text-navy-deep font-caps-label text-[10px] uppercase font-bold rounded">
                BATTING NOW
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3 my-2">
            <span className="font-display text-4xl text-gold-accent font-table-numeral">
              {runsB}/{wicketsB}
            </span>
            <span className="text-fog-text font-table-numeral text-sm">
              ({oversB} / {oversLimit} ov)
            </span>
          </div>
          <div className="text-[11px] text-fog-text font-caps-label">
            Click to set {teamBName} as active batting team
          </div>
        </div>
      </div>

      {/* ── Quick Ball Action Deck ── */}
      <div className="bg-surface-container-low p-4 sm:p-5 rounded border border-gold-accent/40 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="font-caps-label text-xs uppercase text-gold-accent font-bold tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">touch_app</span>
            BALL ACTION DECK (1-TAP AUTO SCORE &amp; ROTATE STRIKE)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSwapStrike}
              className="px-2.5 py-1 bg-surface-container hover:bg-gold-accent hover:text-navy-deep text-fog-text font-caps-label text-xs uppercase font-bold rounded transition-colors"
            >
              ⇄ Swap Strike
            </button>
            <button
              type="button"
              onClick={handleUndoLastBall}
              className="px-2.5 py-1 bg-surface-container hover:bg-live-red hover:text-white text-fog-text font-caps-label text-xs uppercase font-bold rounded transition-colors"
            >
              ↶ Undo Ball
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => handleRecordBall('0')}
            className="py-3 bg-surface-container hover:bg-surface-container-highest text-white rounded font-display text-lg font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            • Dot (0)
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('1')}
            className="py-3 bg-surface-container-high hover:bg-gold-accent hover:text-navy-deep text-white rounded font-display text-lg font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            +1 Run
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('2')}
            className="py-3 bg-surface-container-high hover:bg-gold-accent hover:text-navy-deep text-white rounded font-display text-lg font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            +2 Runs
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('3')}
            className="py-3 bg-surface-container-high hover:bg-gold-accent hover:text-navy-deep text-white rounded font-display text-lg font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            +3 Runs
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('4')}
            className="py-3 bg-win-green text-navy-deep hover:bg-win-green/90 rounded font-display text-lg font-extrabold cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            4 FOUR
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('6')}
            className="py-3 bg-gold-accent text-navy-deep hover:bg-white rounded font-display text-lg font-extrabold cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            6 SIX
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('W')}
            className="py-3 bg-live-red text-white hover:bg-red-700 rounded font-display text-lg font-extrabold cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            W WICKET
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('Wd')}
            className="py-3 bg-amber-500 text-navy-deep hover:bg-amber-400 rounded font-display text-sm font-bold cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            +1 Wide
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('Nb')}
            className="py-3 bg-amber-600 text-navy-deep hover:bg-amber-500 rounded font-display text-sm font-bold cursor-pointer transition-all shadow hover:scale-[1.02]"
          >
            +1 No Ball
          </button>
        </div>

        {/* Timeline strip */}
        <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-caps-label text-fog-text uppercase shrink-0">
            Recent Deliveries:
          </span>
          {recentBalls.length === 0 ? (
            <span className="text-xs text-fog-text italic">No balls recorded in this spell</span>
          ) : (
            recentBalls.map((b, idx) => (
              <span
                key={idx}
                className={cn(
                  'px-2 py-0.5 rounded font-display text-xs font-bold shrink-0',
                  b.includes('W') && !b.includes('wd')
                    ? 'bg-live-red text-white'
                    : b === '6'
                    ? 'bg-gold-accent text-navy-deep'
                    : b === '4'
                    ? 'bg-win-green text-navy-deep'
                    : b.includes('wd') || b.includes('nb')
                    ? 'bg-amber-500 text-navy-deep'
                    : 'bg-surface-container text-white'
                )}
              >
                {b}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── Direct Score Overwrite Controls ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container p-4 rounded border border-outline-variant/30">
        <div>
          <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
            {isBattingA ? teamAName : teamBName} Runs
          </label>
          <input
            type="number"
            min={0}
            value={isBattingA ? runsA : runsB}
            onChange={(e) => {
              const val = Math.max(0, parseInt(e.target.value || '0', 10));
              if (isBattingA) setRunsA(val);
              else setRunsB(val);
            }}
            className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white font-table-numeral text-lg font-bold focus:border-gold-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
            Wickets Fallen (0-10)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            value={isBattingA ? wicketsA : wicketsB}
            onChange={(e) => {
              const val = Math.min(10, Math.max(0, parseInt(e.target.value || '0', 10)));
              if (isBattingA) setWicketsA(val);
              else setWicketsB(val);
            }}
            className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white font-table-numeral text-lg font-bold focus:border-gold-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
            Overs Bowled (e.g. 3.4)
          </label>
          <input
            type="text"
            value={isBattingA ? oversA : oversB}
            onChange={(e) => {
              if (isBattingA) setOversA(e.target.value);
              else setOversB(e.target.value);
            }}
            className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white font-table-numeral text-lg font-bold focus:border-gold-accent focus:outline-none"
          />
        </div>
      </div>

      {/* ── Target & Match Chasing Setup ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container p-4 rounded border border-outline-variant/30">
        <div>
          <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
            Chasing Target (Leave blank if 1st innings)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              placeholder="e.g. 89"
              value={target}
              onChange={(e) => setTarget(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white font-table-numeral text-base focus:border-gold-accent focus:outline-none"
            />
            {runsA > 0 && !target && (
              <button
                type="button"
                onClick={() => setTarget(runsA + 1)}
                className="px-3 py-2 bg-navy-mid text-gold-accent border border-gold-accent/40 font-caps-label text-xs uppercase font-bold rounded hover:bg-gold-accent hover:text-navy-deep transition-colors"
              >
                Set {runsA + 1}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
            Toss &amp; Decision Note
          </label>
          <input
            type="text"
            placeholder="e.g. 24SW won the toss and elected to bat"
            value={tossNote}
            onChange={(e) => setTossNote(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-sm focus:border-gold-accent focus:outline-none"
          />
        </div>
      </div>

      {/* ── Active Batsmen & Bowler Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Batsmen Configuration */}
        <div className="bg-surface-container p-4 rounded border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-caps-label text-xs uppercase text-gold-accent font-bold">
              CURRENT BATSMEN
            </span>
            <span className="text-[11px] text-fog-text">
              Radio selects striker (*)
            </span>
          </div>

          {batsmen.map((b, idx) => (
            <div key={idx} className="p-3 bg-surface-container-lowest rounded border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="striker_radio"
                    checked={b.is_on_strike}
                    onChange={() => {
                      setBatsmen((prev) =>
                        prev.map((item, i) => ({ ...item, is_on_strike: i === idx }))
                      );
                    }}
                    className="accent-gold-accent"
                  />
                  <span className="text-xs font-caps-label uppercase text-white font-bold">
                    {idx === 0 ? 'Batter 1' : 'Batter 2'} {b.is_on_strike ? '(On Strike *)' : ''}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-4 sm:col-span-1">
                  <label className="block text-[10px] text-fog-text font-caps-label uppercase">Name</label>
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBatsmen((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], name: val };
                        return next;
                      });
                    }}
                    className="w-full px-2 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-fog-text font-caps-label uppercase">Runs</label>
                  <input
                    type="number"
                    min={0}
                    value={b.runs}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value || '0', 10));
                      setBatsmen((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], runs: val };
                        return next;
                      });
                    }}
                    className="w-full px-2 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-fog-text font-caps-label uppercase">Balls</label>
                  <input
                    type="number"
                    min={0}
                    value={b.balls}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value || '0', 10));
                      setBatsmen((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], balls: val };
                        return next;
                      });
                    }}
                    className="w-full px-2 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-fog-text font-caps-label uppercase">4s / 6s</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={0}
                      value={b.fours}
                      title="Fours"
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value || '0', 10));
                        setBatsmen((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], fours: val };
                          return next;
                        });
                      }}
                      className="w-1/2 px-1 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral text-center"
                    />
                    <input
                      type="number"
                      min={0}
                      value={b.sixes}
                      title="Sixes"
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value || '0', 10));
                        setBatsmen((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], sixes: val };
                          return next;
                        });
                      }}
                      className="w-1/2 px-1 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bowler Configuration */}
        <div className="bg-surface-container p-4 rounded border border-outline-variant/30 space-y-3">
          <span className="font-caps-label text-xs uppercase text-gold-accent font-bold block">
            CURRENT BOWLER
          </span>

          <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/20 space-y-3">
            <div>
              <label className="block text-[10px] text-fog-text font-caps-label uppercase mb-0.5">
                Bowler Name
              </label>
              <input
                type="text"
                value={bowler.name}
                onChange={(e) => setBowler((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/30 rounded text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-fog-text font-caps-label uppercase">Overs</label>
                <input
                  type="text"
                  value={bowler.overs}
                  onChange={(e) => setBowler((prev) => ({ ...prev, overs: e.target.value }))}
                  className="w-full px-2 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral"
                />
              </div>
              <div>
                <label className="block text-[10px] text-fog-text font-caps-label uppercase">Maidens</label>
                <input
                  type="number"
                  min={0}
                  value={bowler.maidens}
                  onChange={(e) =>
                    setBowler((prev) => ({ ...prev, maidens: Math.max(0, parseInt(e.target.value || '0', 10)) }))
                  }
                  className="w-full px-2 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral"
                />
              </div>
              <div>
                <label className="block text-[10px] text-fog-text font-caps-label uppercase">Runs Conceded</label>
                <input
                  type="number"
                  min={0}
                  value={bowler.runs_conceded}
                  onChange={(e) =>
                    setBowler((prev) => ({
                      ...prev,
                      runs_conceded: Math.max(0, parseInt(e.target.value || '0', 10)),
                    }))
                  }
                  className="w-full px-2 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral"
                />
              </div>
              <div>
                <label className="block text-[10px] text-fog-text font-caps-label uppercase">Wickets</label>
                <input
                  type="number"
                  min={0}
                  value={bowler.wickets}
                  onChange={(e) =>
                    setBowler((prev) => ({ ...prev, wickets: Math.max(0, parseInt(e.target.value || '0', 10)) }))
                  }
                  className="w-full px-2 py-1 bg-surface-container border border-outline-variant/30 rounded text-white text-xs font-table-numeral"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
              Live Status / Win Equation Message
            </label>
            <input
              type="text"
              placeholder="e.g. 24SW need 11 runs from 8 balls to win"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Status Radio & Save Button ── */}
      <div className="p-4 bg-navy-mid rounded border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xs font-caps-label text-fog-text uppercase font-bold">
            Match Status:
          </span>
          <label className="flex items-center gap-1.5 text-xs text-white font-caps-label uppercase cursor-pointer">
            <input
              type="radio"
              name="cricket_status"
              value="live"
              checked={status === 'live'}
              onChange={() => setStatus('live')}
              className="accent-live-red"
            />
            <span>Live Match</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-white font-caps-label uppercase cursor-pointer">
            <input
              type="radio"
              name="cricket_status"
              value="completed"
              checked={status === 'completed'}
              onChange={() => setStatus('completed')}
              className="accent-win-green"
            />
            <span>Final / Completed</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-3 bg-gold-accent hover:bg-white text-navy-deep font-caps-label text-xs uppercase font-extrabold rounded shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">save</span>
          <span>{isSubmitting ? 'BROADCASTING SCORE...' : 'SAVE & BROADCAST CRICKET SCORE'}</span>
        </button>
      </div>
    </form>
  );
}
