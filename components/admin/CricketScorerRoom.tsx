'use client';

import { useState, useEffect, useRef } from 'react';
import type { FixtureWithRelations, CricketMatchDetails, CricketBatsman, CricketBowler, Player } from '@/types';
import { cn } from '@/lib/utils';
import { MOCK_PLAYERS_SAMPLE } from '@/lib/mock-data';

interface CricketScorerRoomProps {
  fixture: FixtureWithRelations;
  players?: Player[];
  isSubmitting: boolean;
  onSave: (payload: {
    scoreA: number;
    scoreB: number;
    status: 'live' | 'completed';
    cricketDetails: CricketMatchDetails;
    winnerTeamId?: string | null;
  }) => Promise<void>;
}

export function CricketScorerRoom({
  fixture,
  players = [],
  isSubmitting,
  onSave,
}: CricketScorerRoomProps) {
  const teamAName = fixture.team_a?.name || 'Team A';
  const teamBName = fixture.team_b?.name || 'Team B';
  const teamAId = fixture.team_a_id || fixture.team_a?.id || 'team_a';
  const teamBId = fixture.team_b_id || fixture.team_b?.id || 'team_b';

  const batchACode = fixture.team_a?.batch?.code || '24SW';
  const batchBCode = fixture.team_b?.batch?.code || '23AI';

  // Helper to get squad for a batch code
  function getSquadForBatch(batchCode: string, team?: any): string[] {
    // 1. If team has explicit playing and optional players configured via squad builder
    if (team?.playing_players && team.playing_players.length > 0) {
      const playingNames = team.playing_players.map((p: any) => p.name?.trim()).filter(Boolean);
      const optionalNames = (team.optional_players || []).map((p: any) => p.name?.trim()).filter(Boolean);
      return Array.from(new Set([...playingNames, ...optionalNames]));
    }

    const teamBatchId = team?.batch_id;
    const fromProps = players
      .filter(
        (p) =>
          (teamBatchId && p.batch_id === teamBatchId) ||
          p.batch?.code?.toUpperCase() === batchCode.toUpperCase()
      )
      .map((p) => p.name?.trim())
      .filter(Boolean) as string[];

    const uniqueFromProps = Array.from(new Set(fromProps));
    if (uniqueFromProps.length >= 2) {
      const list = [...uniqueFromProps];
      if (list.length < 11) {
        for (let i = list.length + 1; i <= 11; i++) {
          list.push(`${batchCode} Player ${i}`);
        }
      }
      return list;
    }

    const fromMock = (MOCK_PLAYERS_SAMPLE[batchCode.toUpperCase()] || [])
      .map((p) => p.name?.trim())
      .filter(Boolean) as string[];
    const combined = Array.from(new Set([...uniqueFromProps, ...fromMock]));

    if (combined.length < 11) {
      for (let i = combined.length + 1; i <= 11; i++) {
        combined.push(`${batchCode} Player ${i}`);
      }
    }
    return combined;
  }

  const teamASquad = getSquadForBatch(batchACode, fixture.team_a);
  const teamBSquad = getSquadForBatch(batchBCode, fixture.team_b);

  // Helper to create sensible fresh defaults with 0 runs
  function getInitialDetails(f: FixtureWithRelations, sA: string[], sB: string[]): CricketMatchDetails {
    if (f.cricket_details) {
      return f.cricket_details;
    }
    return {
      innings: 1,
      batting_team_id: teamAId,
      overs_limit: 6,
      target: null,
      team_a_cricket: { runs: f.score_a ?? 0, wickets: 0, overs: '0.0' },
      team_b_cricket: { runs: f.score_b ?? 0, wickets: 0, overs: '0.0' },
      current_batsmen: [
        { name: sA[0] || `${batchACode} Batter 1`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: true },
        { name: sA[1] || `${batchACode} Batter 2`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: false },
      ],
      current_bowler: {
        name: sB[0] || `${batchBCode} Bowler 1`,
        overs: '0.0',
        maidens: 0,
        runs_conceded: 0,
        wickets: 0,
      },
      recent_balls: [],
      toss_note: `${teamAName} won the toss & elected to bat`,
    };
  }

  const initialDetails = getInitialDetails(fixture, teamASquad, teamBSquad);

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

  // Active Batsmen (Always ensure starting at 0 for fresh matches)
  const [batsmen, setBatsmen] = useState<CricketBatsman[]>(
    initialDetails.current_batsmen && initialDetails.current_batsmen.length >= 2
      ? initialDetails.current_batsmen
      : [
          { name: teamASquad[0] || `${batchACode} Batter 1`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: true },
          { name: teamASquad[1] || `${batchACode} Batter 2`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: false },
        ]
  );

  // Active Bowler
  const [bowler, setBowler] = useState<CricketBowler>(
    initialDetails.current_bowler || {
      name: teamBSquad[0] || `${batchBCode} Bowler 1`,
      overs: '0.0',
      maidens: 0,
      runs_conceded: 0,
      wickets: 0,
    }
  );

  // Full innings scorecard tracking (all dismissed & current batters, bowlers)
  const [batsmenCard, setBatsmenCard] = useState<CricketBatsman[]>(initialDetails.batsmen_card || []);
  const [bowlersCard, setBowlersCard] = useState<CricketBowler[]>(initialDetails.bowlers_card || []);

  // Recent Balls & Notes
  const [recentBalls, setRecentBalls] = useState<string[]>(initialDetails.recent_balls || []);
  const [tossNote, setTossNote] = useState<string>(initialDetails.toss_note || '');
  const [statusNote, setStatusNote] = useState<string>(initialDetails.status_note || '');

  // Auto-Broadcast System
  const [autoBroadcast, setAutoBroadcast] = useState<boolean>(true);
  const [broadcastIndicator, setBroadcastIndicator] = useState<string | null>('Auto-broadcast ready');
  const [overCompleteNotification, setOverCompleteNotification] = useState<string | null>(null);

  // Wicket Modal State
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [outBatsmanIndex, setOutBatsmanIndex] = useState<0 | 1>(0); // default striker
  const [dismissalType, setDismissalType] = useState<string>('Bowled');
  const [incomingBatsmanName, setIncomingBatsmanName] = useState<string>('');

  // Undo history stack
  const historyRef = useRef<any[]>([]);

  // Synchronize state on fixture or players change
  const currentFixtureIdRef = useRef<string>(fixture.id);

  useEffect(() => {
    const isNewFixture = currentFixtureIdRef.current !== fixture.id;
    currentFixtureIdRef.current = fixture.id;

    if (fixture.cricket_details) {
      const d = fixture.cricket_details;
      setInnings(d.innings || 1);
      setBattingTeamId(d.batting_team_id || teamAId);
      setOversLimit(d.overs_limit || 6);
      setTarget(d.target ?? '');
      setRunsA(d.team_a_cricket?.runs ?? fixture.score_a ?? 0);
      setWicketsA(d.team_a_cricket?.wickets ?? 0);
      setOversA(d.team_a_cricket?.overs ?? '0.0');
      setRunsB(d.team_b_cricket?.runs ?? fixture.score_b ?? 0);
      setWicketsB(d.team_b_cricket?.wickets ?? 0);
      setOversB(d.team_b_cricket?.overs ?? '0.0');
      if (d.current_batsmen && d.current_batsmen.length >= 2) {
        setBatsmen(d.current_batsmen);
      }
      if (d.current_bowler) {
        setBowler(d.current_bowler);
      }
      setBatsmenCard(d.batsmen_card || []);
      setBowlersCard(d.bowlers_card || []);
      setRecentBalls(d.recent_balls || []);
      setTossNote(d.toss_note || `${teamAName} won the toss & elected to bat`);
      setStatusNote(d.status_note || '');
      setStatus(fixture.status === 'completed' ? 'completed' : 'live');
    } else if (isNewFixture) {
      // Clean initialization for a fresh fixture
      setInnings(1);
      setBattingTeamId(teamAId);
      setOversLimit(6);
      setTarget('');
      setRunsA(fixture.score_a ?? 0);
      setWicketsA(0);
      setOversA('0.0');
      setRunsB(fixture.score_b ?? 0);
      setWicketsB(0);
      setOversB('0.0');
      setBatsmen([
        { name: teamASquad[0] || `${batchACode} Batter 1`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: true },
        { name: teamASquad[1] || `${batchACode} Batter 2`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: false },
      ]);
      setBowler({
        name: teamBSquad[0] || `${batchBCode} Bowler 1`,
        overs: '0.0',
        maidens: 0,
        runs_conceded: 0,
        wickets: 0,
      });
      setBatsmenCard([]);
      setBowlersCard([]);
      setRecentBalls([]);
      setTossNote(`${teamAName} won the toss & elected to bat`);
      setStatusNote('');
      setStatus(fixture.status === 'completed' ? 'completed' : 'live');
    } else if (players.length > 0) {
      // If players arrived after initial mount on an uninitialized match with 0 runs
      setBatsmen((prev) => {
        if (prev.every((b) => b.runs === 0 && b.balls === 0)) {
          return [
            { name: teamASquad[0] || prev[0]?.name || `${batchACode} Batter 1`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: true },
            { name: teamASquad[1] || prev[1]?.name || `${batchACode} Batter 2`, runs: 0, balls: 0, fours: 0, sixes: 0, is_on_strike: false },
          ];
        }
        return prev;
      });
      setBowler((prev) => {
        if (prev.runs_conceded === 0 && prev.wickets === 0 && prev.overs === '0.0') {
          return {
            ...prev,
            name: teamBSquad[0] || prev.name || `${batchBCode} Bowler 1`,
          };
        }
        return prev;
      });
    }
  }, [fixture.id, fixture.cricket_details, players]);

  const isBattingA = battingTeamId === teamAId;
  const currentBattingSquad = isBattingA ? teamASquad : teamBSquad;
  const currentBowlingSquad = isBattingA ? teamBSquad : teamASquad;

  const currentRuns = isBattingA ? runsA : runsB;
  const currentWickets = isBattingA ? wicketsA : wicketsB;
  const currentOvers = isBattingA ? oversA : oversB;

  // Striker & Non-striker helpers
  const striker = batsmen.find((b) => b.is_on_strike) || batsmen[0];
  const nonStriker = batsmen.find((b) => !b.is_on_strike) || batsmen[1];

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

  // Trigger broadcast to backend
  async function triggerBroadcast(stateOverride?: {
    runsA?: number;
    wicketsA?: number;
    oversA?: string;
    runsB?: number;
    wicketsB?: number;
    oversB?: string;
    batsmen?: CricketBatsman[];
    bowler?: CricketBowler;
    recentBalls?: string[];
    batsmenCard?: CricketBatsman[];
    bowlersCard?: CricketBowler[];
    status?: 'live' | 'completed';
    target?: number | '';
    innings?: 1 | 2;
    battingTeamId?: string;
  }) {
    const rA = stateOverride?.runsA ?? runsA;
    const wA = stateOverride?.wicketsA ?? wicketsA;
    const oA = stateOverride?.oversA ?? oversA;
    const rB = stateOverride?.runsB ?? runsB;
    const wB = stateOverride?.wicketsB ?? wicketsB;
    const oB = stateOverride?.oversB ?? oversB;
    const currentBat = stateOverride?.batsmen ?? batsmen;
    const currentBowl = stateOverride?.bowler ?? bowler;
    const currentRecent = stateOverride?.recentBalls ?? recentBalls;
    const bCard = stateOverride?.batsmenCard ?? batsmenCard;
    const bwCard = stateOverride?.bowlersCard ?? bowlersCard;
    const curStatus = stateOverride?.status ?? status;
    const curTarget = stateOverride?.target ?? target;
    const curInnings = stateOverride?.innings ?? innings;
    const curBattingTeamId = stateOverride?.battingTeamId ?? battingTeamId;

    const curActiveRuns = curBattingTeamId === teamAId ? rA : rB;
    const curActiveOvers = curBattingTeamId === teamAId ? oA : oB;

    const oversParts = curActiveOvers.split('.');
    const totalBalls = parseInt(oversParts[0] || '0', 10) * 6 + parseInt(oversParts[1] || '0', 10);
    const crr = totalBalls > 0 ? parseFloat(((curActiveRuns / totalBalls) * 6).toFixed(2)) : 0;

    let rrr: number | null = null;
    const targetVal = typeof curTarget === 'number' ? curTarget : null;
    if (targetVal) {
      const ballsRemaining = Math.max(1, oversLimit * 6 - totalBalls);
      const runsRemaining = Math.max(0, targetVal - curActiveRuns);
      rrr = parseFloat(((runsRemaining / ballsRemaining) * 6).toFixed(2));
    }

    const cricketDetailsPayload: CricketMatchDetails = {
      innings: curInnings,
      batting_team_id: curBattingTeamId,
      overs_limit: oversLimit,
      target: targetVal,
      team_a_cricket: { runs: rA, wickets: wA, overs: oA },
      team_b_cricket: { runs: rB, wickets: wB, overs: oB },
      current_batsmen: currentBat,
      current_bowler: currentBowl,
      batsmen_card: bCard,
      bowlers_card: bwCard,
      recent_balls: currentRecent,
      crr,
      rrr,
      status_note: statusNote.trim() || undefined,
      toss_note: tossNote.trim() || undefined,
    };

    let winnerTeamId: string | null = null;
    if (curStatus === 'completed') {
      if (rA > rB) winnerTeamId = teamAId;
      else if (rB > rA) winnerTeamId = teamBId;
    }

    setBroadcastIndicator('Syncing delivery...');
    try {
      await onSave({
        scoreA: rA,
        scoreB: rB,
        status: curStatus,
        cricketDetails: cricketDetailsPayload,
        winnerTeamId,
      });
      setBroadcastIndicator(`✓ Auto-Broadcasted (${curActiveOvers} ov)`);
    } catch {
      setBroadcastIndicator('Sync failed — check connection');
    }
  }

  // Save current snapshot for undo
  function saveSnapshot() {
    historyRef.current.push({
      runsA,
      wicketsA,
      oversA,
      runsB,
      wicketsB,
      oversB,
      batsmen: JSON.parse(JSON.stringify(batsmen)),
      bowler: JSON.parse(JSON.stringify(bowler)),
      recentBalls: [...recentBalls],
      batsmenCard: [...batsmenCard],
      bowlersCard: [...bowlersCard],
    });
    if (historyRef.current.length > 20) historyRef.current.shift();
  }

  function handleUndo() {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop();
    setRunsA(prev.runsA);
    setWicketsA(prev.wicketsA);
    setOversA(prev.oversA);
    setRunsB(prev.runsB);
    setWicketsB(prev.wicketsB);
    setOversB(prev.oversB);
    setBatsmen(prev.batsmen);
    setBowler(prev.bowler);
    setRecentBalls(prev.recentBalls);
    setBatsmenCard(prev.batsmenCard);
    setBowlersCard(prev.bowlersCard);
    setOverCompleteNotification(null);
    if (autoBroadcast) {
      triggerBroadcast(prev);
    }
  }

  // ── Core Ball Recording Engine with Automatic Strike Rotation ──
  function handleRecordBall(action: '0' | '1' | '2' | '3' | '4' | '6' | 'W' | 'Wd' | 'Nb') {
    if (action === 'W') {
      // Open Wicket dismissal modal to pick outgoing & incoming batsman
      const remainingBatters = currentBattingSquad.filter(
        (p) => !batsmen.some((b) => b.name === p) && !batsmenCard.some((b) => b.name === p)
      );
      setIncomingBatsmanName(remainingBatters[0] || `Batter ${currentWickets + 3}`);
      const strikerIdx = batsmen.findIndex((b) => b.is_on_strike);
      setOutBatsmanIndex(strikerIdx === 1 ? 1 : 0);
      setIsWicketModalOpen(true);
      return;
    }

    saveSnapshot();

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
        : 1; // Wide or No-ball

    const isLegalBall = action !== 'Wd' && action !== 'Nb';

    // 1. Calculate Team Runs
    const newRunsA = isBattingA ? runsA + runsToAdd : runsA;
    const newRunsB = !isBattingA ? runsB + runsToAdd : runsB;
    if (isBattingA) setRunsA(newRunsA);
    else setRunsB(newRunsB);

    // 2. Calculate Overs & Over Completion
    let newOversA = oversA;
    let newOversB = oversB;
    let overCompleted = false;

    if (isLegalBall) {
      if (isBattingA) {
        const res = incrementOvers(oversA);
        newOversA = res.newOvers;
        overCompleted = res.isOverComplete;
        setOversA(newOversA);
      } else {
        const res = incrementOvers(oversB);
        newOversB = res.newOvers;
        overCompleted = res.isOverComplete;
        setOversB(newOversB);
      }
    }

    // 3. Update Bowler Figures
    let newBowlerOvers = bowler.overs || '0.0';
    if (isLegalBall) {
      newBowlerOvers = incrementOvers(bowler.overs || '0.0').newOvers;
    }
    const newBowler: CricketBowler = {
      ...bowler,
      overs: newBowlerOvers,
      runs_conceded: bowler.runs_conceded + runsToAdd,
    };
    setBowler(newBowler);

    // 4. Update Batsmen stats & Automatic Strike Swap
    const updatedBatsmen = batsmen.map((b) => ({ ...b }));
    const strikerIdx = updatedBatsmen.findIndex((b) => b.is_on_strike) !== -1
      ? updatedBatsmen.findIndex((b) => b.is_on_strike)
      : 0;
    const nonStrikerIdx = strikerIdx === 0 ? 1 : 0;

    if (isLegalBall) {
      updatedBatsmen[strikerIdx].runs += runsToAdd;
      updatedBatsmen[strikerIdx].balls += 1;
      if (action === '4') updatedBatsmen[strikerIdx].fours += 1;
      if (action === '6') updatedBatsmen[strikerIdx].sixes += 1;
    }

    // ── Auto Swap Rule ──
    // Odd runs (1, 3): Batsmen cross.
    // End of over: Bowling end changes, so ends swap again.
    let strikeSwapped = false;
    const isOddRun = runsToAdd % 2 === 1;

    if (isOddRun) {
      strikeSwapped = !strikeSwapped;
    }
    if (overCompleted) {
      // Over ends: ends switch
      strikeSwapped = !strikeSwapped;
    }

    if (strikeSwapped) {
      updatedBatsmen[strikerIdx].is_on_strike = false;
      updatedBatsmen[nonStrikerIdx].is_on_strike = true;
    }

    setBatsmen(updatedBatsmen);

    // 5. Append recent ball
    const ballLabel = action === 'Wd' ? '1wd' : action === 'Nb' ? '1nb' : action;
    const newRecentBalls = [...recentBalls, ballLabel].slice(-12);
    setRecentBalls(newRecentBalls);

    // 6. Check Over Completion prompt
    if (overCompleted) {
      const activeOvers = isBattingA ? newOversA : newOversB;
      setOverCompleteNotification(
        `🔔 Over ${activeOvers.split('.')[0]} completed! Strike auto-rotated. Please select the next bowler below.`
      );
    } else {
      setOverCompleteNotification(null);
    }

    // 7. Auto-Broadcast instantly if enabled
    if (autoBroadcast) {
      triggerBroadcast({
        runsA: newRunsA,
        oversA: newOversA,
        runsB: newRunsB,
        oversB: newOversB,
        batsmen: updatedBatsmen,
        bowler: newBowler,
        recentBalls: newRecentBalls,
      });
    }
  }

  // ── Confirm Wicket from Modal ──
  function confirmWicket() {
    saveSnapshot();

    const isLegalBall = true;
    const newRunsA = runsA;
    const newRunsB = runsB;

    // Increment Wickets
    const newWicketsA = isBattingA ? Math.min(10, wicketsA + 1) : wicketsA;
    const newWicketsB = !isBattingA ? Math.min(10, wicketsB + 1) : wicketsB;
    if (isBattingA) setWicketsA(newWicketsA);
    else setWicketsB(newWicketsB);

    // Increment Overs
    let newOversA = oversA;
    let newOversB = oversB;
    let overCompleted = false;
    if (isBattingA) {
      const res = incrementOvers(oversA);
      newOversA = res.newOvers;
      overCompleted = res.isOverComplete;
      setOversA(newOversA);
    } else {
      const res = incrementOvers(oversB);
      newOversB = res.newOvers;
      overCompleted = res.isOverComplete;
      setOversB(newOversB);
    }

    // Update Bowler wickets & overs
    const newBowler: CricketBowler = {
      ...bowler,
      overs: incrementOvers(bowler.overs || '0.0').newOvers,
      wickets: bowler.wickets + 1,
    };
    setBowler(newBowler);

    // Archive dismissed batsman into batsmenCard
    const dismissedBatter = batsmen[outBatsmanIndex];
    const updatedCard = [
      ...batsmenCard,
      {
        ...dismissedBatter,
        balls: dismissedBatter.balls + 1,
        how_out: `${dismissalType} b ${bowler.name}`,
        is_on_strike: false,
      },
    ];
    setBatsmenCard(updatedCard);

    // Create incoming batsman starting with exactly 0 runs, 0 balls, 0 boundaries!
    const newIncomingBatter: CricketBatsman = {
      name: incomingBatsmanName.trim() || `Batter ${(isBattingA ? newWicketsA : newWicketsB) + 2}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      is_on_strike: outBatsmanIndex === 0 ? true : false,
    };

    const updatedBatsmen = [...batsmen];
    updatedBatsmen[outBatsmanIndex] = newIncomingBatter;

    // Handle end of over strike swap if wicket fell on ball 6
    if (overCompleted) {
      updatedBatsmen[0].is_on_strike = !updatedBatsmen[0].is_on_strike;
      updatedBatsmen[1].is_on_strike = !updatedBatsmen[1].is_on_strike;
      const activeOvers = isBattingA ? newOversA : newOversB;
      setOverCompleteNotification(
        `🔔 Over ${activeOvers.split('.')[0]} completed! Strike auto-rotated. Please select the next bowler below.`
      );
    }

    setBatsmen(updatedBatsmen);

    const newRecentBalls = [...recentBalls, 'W'].slice(-12);
    setRecentBalls(newRecentBalls);
    setIsWicketModalOpen(false);

    if (autoBroadcast) {
      triggerBroadcast({
        wicketsA: newWicketsA,
        oversA: newOversA,
        wicketsB: newWicketsB,
        oversB: newOversB,
        batsmen: updatedBatsmen,
        bowler: newBowler,
        recentBalls: newRecentBalls,
        batsmenCard: updatedCard,
      });
    }
  }

  // Manual strike swap button
  function handleManualSwapStrike() {
    saveSnapshot();
    const updated = batsmen.map((b) => ({ ...b, is_on_strike: !b.is_on_strike }));
    setBatsmen(updated);
    if (autoBroadcast) triggerBroadcast({ batsmen: updated });
  }

  // Change active batsman name from team list (starting at 0 for fresh batters)
  function handleSelectBatsman(index: 0 | 1, name: string) {
    saveSnapshot();
    const updated = [...batsmen];
    // Start fresh batsman with 0 runs, 0 balls
    updated[index] = {
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      is_on_strike: updated[index]?.is_on_strike ?? (index === 0),
    };
    setBatsmen(updated);
    if (autoBroadcast) triggerBroadcast({ batsmen: updated });
  }

  // Change bowler from bowling team list
  function handleSelectBowler(name: string) {
    saveSnapshot();
    // Check if bowler bowled earlier in this match
    const existingSpell = bowlersCard.find((b) => b.name === name);
    const newBowler: CricketBowler = existingSpell || {
      name,
      overs: '0.0',
      maidens: 0,
      runs_conceded: 0,
      wickets: 0,
    };
    setBowler(newBowler);
    setOverCompleteNotification(null);
    if (autoBroadcast) triggerBroadcast({ bowler: newBowler });
  }

  // Switch active batting team (e.g. 1st innings to 2nd innings)
  function handleSwitchBattingTeam(newTeamId: string) {
    if (newTeamId === battingTeamId) return;
    saveSnapshot();

    const newIsBattingA = newTeamId === teamAId;
    const newBattingSquad = newIsBattingA ? teamASquad : teamBSquad;
    const newBowlingSquad = newIsBattingA ? teamBSquad : teamASquad;

    // Set active batsmen for the newly chosen batting team
    const newBatsmen: CricketBatsman[] = [
      {
        name: newBattingSquad[0] || `${newIsBattingA ? batchACode : batchBCode} Batter 1`,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        is_on_strike: true,
      },
      {
        name: newBattingSquad[1] || `${newIsBattingA ? batchACode : batchBCode} Batter 2`,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        is_on_strike: false,
      },
    ];

    // Set active bowler from fielding team
    const newBowler: CricketBowler = {
      name: newBowlingSquad[0] || `${newIsBattingA ? batchBCode : batchACode} Bowler 1`,
      overs: '0.0',
      maidens: 0,
      runs_conceded: 0,
      wickets: 0,
    };

    setBattingTeamId(newTeamId);
    setBatsmen(newBatsmen);
    setBowler(newBowler);

    // Auto calculate target if Team A batted and Team B is now chasing
    let updatedTarget = target;
    if (!newIsBattingA && runsA > 0 && !target) {
      updatedTarget = runsA + 1;
      setTarget(updatedTarget);
      setInnings(2);
    } else if (newIsBattingA) {
      setInnings(1);
    }

    if (autoBroadcast) {
      triggerBroadcast({
        battingTeamId: newTeamId,
        batsmen: newBatsmen,
        bowler: newBowler,
        target: updatedTarget,
        innings: !newIsBattingA && runsA > 0 ? 2 : 1,
      });
    }
  }

  // Manual Save Form Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await triggerBroadcast();
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Match Overview & Auto-Broadcast Pill ── */}
      <div className="bg-navy-mid p-4 rounded border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-gold-accent text-2xl">sports_cricket</span>
          <div>
            <h2 className="font-caps-label text-sm uppercase text-white font-extrabold flex items-center gap-2">
              <span>CRICKET DIGITAL UMPIRE &amp; SCORER</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-gold-accent text-[10px]">
                {oversLimit} OVERS
              </span>
            </h2>
            <span className="text-xs text-fog-text">
              {fixture.round || fixture.stage} &bull; {teamAName} vs {teamBName}
            </span>
          </div>
        </div>

        {/* Auto-Broadcast Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded border border-outline-variant/30">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                autoBroadcast ? 'bg-win-green pulse-live' : 'bg-fog-text'
              )}
            />
            <label className="text-xs font-caps-label uppercase text-white font-bold cursor-pointer flex items-center gap-1.5 select-none">
              <input
                type="checkbox"
                checked={autoBroadcast}
                onChange={(e) => setAutoBroadcast(e.target.checked)}
                className="accent-gold-accent cursor-pointer"
              />
              <span>Auto-Broadcast Per Ball</span>
            </label>
          </div>

          <span className="text-xs text-gold-accent font-table-numeral hidden sm:inline font-bold">
            {broadcastIndicator}
          </span>
        </div>
      </div>

      {/* ── Over Complete Notification Banner ── */}
      {overCompleteNotification && (
        <div className="p-3.5 bg-gold-accent/15 border-2 border-gold-accent rounded text-xs font-caps-label text-gold-accent font-bold flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">notifications_active</span>
            <span>{overCompleteNotification}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] text-white uppercase">Pick Next Bowler:</span>
            {currentBowlingSquad
              .filter((p) => p !== bowler.name)
              .slice(0, 5)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectBowler(p)}
                  className="px-2 py-0.5 bg-gold-accent text-navy-deep text-[11px] font-bold rounded hover:bg-white transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ── Innings & Batting Team Switcher ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Team A Card */}
        <div
          onClick={() => handleSwitchBattingTeam(teamAId)}
          className={cn(
            'p-4 rounded border-2 transition-all cursor-pointer flex flex-col justify-between shadow-md',
            isBattingA
              ? 'bg-navy-mid border-gold-accent shadow-gold-accent/10 shadow-xl'
              : 'bg-surface-container border-outline-variant/25 opacity-70 hover:opacity-100'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-h2 text-base uppercase text-white font-bold">
              {teamAName} (Batch {batchACode})
            </span>
            {isBattingA ? (
              <span className="px-2 py-0.5 bg-gold-accent text-navy-deep font-caps-label text-[10px] font-extrabold uppercase rounded animate-pulse">
                🏏 BATTING (INN {innings})
              </span>
            ) : (
              <span className="text-xs text-fog-text uppercase font-caps-label">Fielding</span>
            )}
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="font-display text-4xl sm:text-5xl text-gold-accent font-table-numeral">
              {runsA}/{wicketsA}
            </span>
            <span className="text-fog-text font-table-numeral text-sm">
              ({oversA} / {oversLimit} ov)
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-fog-text font-caps-label pt-1 border-t border-outline-variant/20">
            <span>{isBattingA ? 'Tap to switch team' : 'Click to set as batting team'}</span>
            <span>Roster: {teamASquad.length} players</span>
          </div>
        </div>

        {/* Team B Card */}
        <div
          onClick={() => handleSwitchBattingTeam(teamBId)}
          className={cn(
            'p-4 rounded border-2 transition-all cursor-pointer flex flex-col justify-between shadow-md',
            !isBattingA
              ? 'bg-navy-mid border-gold-accent shadow-gold-accent/10 shadow-xl'
              : 'bg-surface-container border-outline-variant/25 opacity-70 hover:opacity-100'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-h2 text-base uppercase text-white font-bold">
              {teamBName} (Batch {batchBCode})
            </span>
            {!isBattingA ? (
              <span className="px-2 py-0.5 bg-gold-accent text-navy-deep font-caps-label text-[10px] font-extrabold uppercase rounded animate-pulse">
                🏏 BATTING (INN {innings})
              </span>
            ) : (
              <span className="text-xs text-fog-text uppercase font-caps-label">Fielding</span>
            )}
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="font-display text-4xl sm:text-5xl text-gold-accent font-table-numeral">
              {runsB}/{wicketsB}
            </span>
            <span className="text-fog-text font-table-numeral text-sm">
              ({oversB} / {oversLimit} ov)
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-fog-text font-caps-label pt-1 border-t border-outline-variant/20">
            <span>{!isBattingA ? 'Tap to switch team' : 'Click to set as batting team'}</span>
            <span>Roster: {teamBSquad.length} players</span>
          </div>
        </div>
      </div>

      {/* ── Active Batters on Crease (Striker & Non-Striker with Dropdowns) ── */}
      <div className="bg-surface-container-low p-4 rounded border border-outline-variant/30 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent text-base">groups</span>
            <span className="font-caps-label text-xs uppercase text-white font-bold tracking-wider">
              ACTIVE BATSMEN (AUTO-SWAP ON ODD RUNS &amp; OVER END)
            </span>
          </div>

          <button
            type="button"
            onClick={handleManualSwapStrike}
            className="px-3 py-1 bg-surface-container-high hover:bg-gold-accent hover:text-navy-deep text-gold-accent font-caps-label text-xs uppercase font-extrabold rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            <span>Manual Swap Strike</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batter 1 */}
          <div
            className={cn(
              'p-3.5 rounded border-2 transition-all',
              batsmen[0]?.is_on_strike
                ? 'bg-navy-mid border-gold-accent shadow-md'
                : 'bg-surface-container border-outline-variant/30'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="active_striker_radio"
                  checked={batsmen[0]?.is_on_strike}
                  onChange={() => {
                    const updated = [
                      { ...batsmen[0], is_on_strike: true },
                      { ...batsmen[1], is_on_strike: false },
                    ];
                    setBatsmen(updated);
                    if (autoBroadcast) triggerBroadcast({ batsmen: updated });
                  }}
                  className="accent-gold-accent"
                />
                <span className="font-caps-label text-xs uppercase font-bold text-white flex items-center gap-1">
                  <span>Batsman 1</span>
                  {batsmen[0]?.is_on_strike && (
                    <span className="px-1.5 py-0.2 bg-gold-accent text-navy-deep text-[10px] font-black rounded">
                      ON STRIKE *
                    </span>
                  )}
                </span>
              </label>

              <span className="font-display text-lg text-gold-accent font-table-numeral">
                {batsmen[0]?.runs} <span className="text-xs text-fog-text">({batsmen[0]?.balls}b)</span>
              </span>
            </div>

            {/* Squad Select Dropdown */}
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-caps-label text-fog-text uppercase mb-1">
                  Select from {isBattingA ? teamAName : teamBName} Squad:
                </label>
                <select
                  value={batsmen[0]?.name || ''}
                  onChange={(e) => handleSelectBatsman(0, e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold focus:border-gold-accent focus:outline-none"
                >
                  {currentBattingSquad.map((p) => (
                    <option key={p} value={p} disabled={p === batsmen[1]?.name}>
                      {p} {p === batsmen[0]?.name ? '★ (Current)' : p === batsmen[1]?.name ? '(Other Crease)' : '(Score 0)'}
                    </option>
                  ))}
                  {!currentBattingSquad.includes(batsmen[0]?.name) && batsmen[0]?.name && (
                    <option value={batsmen[0]?.name}>{batsmen[0]?.name} ★ (Current)</option>
                  )}
                </select>
              </div>

              {/* Individual quick stats editor */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">RUNS</span>
                  <span className="font-bold text-white font-table-numeral">{batsmen[0]?.runs}</span>
                </div>
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">BALLS</span>
                  <span className="font-bold text-white font-table-numeral">{batsmen[0]?.balls}</span>
                </div>
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">4s</span>
                  <span className="font-bold text-win-green font-table-numeral">{batsmen[0]?.fours}</span>
                </div>
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">6s</span>
                  <span className="font-bold text-gold-accent font-table-numeral">{batsmen[0]?.sixes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Batter 2 */}
          <div
            className={cn(
              'p-3.5 rounded border-2 transition-all',
              batsmen[1]?.is_on_strike
                ? 'bg-navy-mid border-gold-accent shadow-md'
                : 'bg-surface-container border-outline-variant/30'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="active_striker_radio"
                  checked={batsmen[1]?.is_on_strike}
                  onChange={() => {
                    const updated = [
                      { ...batsmen[0], is_on_strike: false },
                      { ...batsmen[1], is_on_strike: true },
                    ];
                    setBatsmen(updated);
                    if (autoBroadcast) triggerBroadcast({ batsmen: updated });
                  }}
                  className="accent-gold-accent"
                />
                <span className="font-caps-label text-xs uppercase font-bold text-white flex items-center gap-1">
                  <span>Batsman 2</span>
                  {batsmen[1]?.is_on_strike && (
                    <span className="px-1.5 py-0.2 bg-gold-accent text-navy-deep text-[10px] font-black rounded">
                      ON STRIKE *
                    </span>
                  )}
                </span>
              </label>

              <span className="font-display text-lg text-gold-accent font-table-numeral">
                {batsmen[1]?.runs} <span className="text-xs text-fog-text">({batsmen[1]?.balls}b)</span>
              </span>
            </div>

            {/* Squad Select Dropdown */}
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-caps-label text-fog-text uppercase mb-1">
                  Select from {isBattingA ? teamAName : teamBName} Squad:
                </label>
                <select
                  value={batsmen[1]?.name || ''}
                  onChange={(e) => handleSelectBatsman(1, e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold focus:border-gold-accent focus:outline-none"
                >
                  {currentBattingSquad.map((p) => (
                    <option key={p} value={p} disabled={p === batsmen[0]?.name}>
                      {p} {p === batsmen[1]?.name ? '★ (Current)' : p === batsmen[0]?.name ? '(Other Crease)' : '(Score 0)'}
                    </option>
                  ))}
                  {!currentBattingSquad.includes(batsmen[1]?.name) && batsmen[1]?.name && (
                    <option value={batsmen[1]?.name}>{batsmen[1]?.name} ★ (Current)</option>
                  )}
                </select>
              </div>

              {/* Individual quick stats editor */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">RUNS</span>
                  <span className="font-bold text-white font-table-numeral">{batsmen[1]?.runs}</span>
                </div>
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">BALLS</span>
                  <span className="font-bold text-white font-table-numeral">{batsmen[1]?.balls}</span>
                </div>
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">4s</span>
                  <span className="font-bold text-win-green font-table-numeral">{batsmen[1]?.fours}</span>
                </div>
                <div className="bg-surface-container-lowest p-1 rounded">
                  <span className="text-[10px] text-fog-text block">6s</span>
                  <span className="font-bold text-gold-accent font-table-numeral">{batsmen[1]?.sixes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Bowler Squad Selector ── */}
      <div className="bg-surface-container-low p-4 rounded border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex-1 w-full md:w-auto">
          <span className="font-caps-label text-xs uppercase text-gold-accent font-bold tracking-wider flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-sm">sports_baseball</span>
            ACTIVE BOWLER ({isBattingA ? teamBName : teamAName})
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bowler.name}
              onChange={(e) => handleSelectBowler(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold focus:border-gold-accent focus:outline-none min-w-[180px]"
            >
              {currentBowlingSquad.map((p) => (
                <option key={p} value={p}>
                  {p} {p === bowler.name ? '★ (Active Bowler)' : ''}
                </option>
              ))}
              {!currentBowlingSquad.includes(bowler.name) && bowler.name && (
                <option value={bowler.name}>{bowler.name} ★ (Active Bowler)</option>
              )}
            </select>

            <span className="text-xs text-fog-text font-table-numeral">
              Spell: <strong>{bowler.overs} ov</strong> &bull; Wkts: <strong>{bowler.wickets}</strong> &bull; Conceded: <strong>{bowler.runs_conceded} r</strong>
            </span>
          </div>
        </div>

        {/* Quick Bowler Squad Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          <span className="text-[10px] text-fog-text font-caps-label uppercase shrink-0">
            Quick Bowler:
          </span>
          {currentBowlingSquad.slice(0, 5).map((p) => {
            const parts = p.split(' ');
            const shortName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectBowler(p)}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-caps-label font-bold transition-all shrink-0 cursor-pointer',
                  bowler.name === p
                    ? 'bg-gold-accent text-navy-deep shadow'
                    : 'bg-surface-container text-fog-text hover:text-white'
                )}
              >
                {shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 1-Tap Quick Ball Action Deck ── */}
      <div className="bg-surface-container-high p-4 sm:p-5 rounded border-2 border-gold-accent shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent text-lg">touch_app</span>
            <span className="font-caps-label text-xs uppercase text-gold-accent font-extrabold tracking-wider">
              1-TAP BALL ACTION DECK &bull; STRIKER: {striker?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              className="px-2.5 py-1 bg-surface-container-lowest hover:bg-live-red hover:text-white text-fog-text font-caps-label text-xs uppercase font-bold rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">undo</span>
              <span>Undo Ball</span>
            </button>
          </div>
        </div>

        {/* Big Touch Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => handleRecordBall('0')}
            className="py-3.5 bg-surface-container-lowest hover:bg-surface-container text-white rounded font-display text-xl font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.03] active:scale-95"
          >
            • Dot (0)
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('1')}
            className="py-3.5 bg-navy-mid hover:bg-gold-accent hover:text-navy-deep text-white rounded font-display text-xl font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.03] active:scale-95 flex flex-col items-center justify-center leading-tight"
          >
            <span>+1 Run</span>
            <span className="text-[10px] font-sans text-gold-accent font-semibold">Swap</span>
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('2')}
            className="py-3.5 bg-navy-mid hover:bg-gold-accent hover:text-navy-deep text-white rounded font-display text-xl font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.03] active:scale-95"
          >
            +2 Runs
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('3')}
            className="py-3.5 bg-navy-mid hover:bg-gold-accent hover:text-navy-deep text-white rounded font-display text-xl font-bold border border-outline-variant/30 cursor-pointer transition-all shadow hover:scale-[1.03] active:scale-95 flex flex-col items-center justify-center leading-tight"
          >
            <span>+3 Runs</span>
            <span className="text-[10px] font-sans text-gold-accent font-semibold">Swap</span>
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('4')}
            className="py-3.5 bg-win-green text-navy-deep hover:bg-emerald-400 rounded font-display text-xl font-extrabold cursor-pointer transition-all shadow-lg hover:scale-[1.03] active:scale-95"
          >
            4 FOUR
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('6')}
            className="py-3.5 bg-gold-accent text-navy-deep hover:bg-white rounded font-display text-xl font-black cursor-pointer transition-all shadow-lg hover:scale-[1.03] active:scale-95"
          >
            6 SIX
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('W')}
            className="py-3.5 bg-live-red text-white hover:bg-red-700 rounded font-display text-xl font-black cursor-pointer transition-all shadow-lg hover:scale-[1.03] active:scale-95"
          >
            W WICKET
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('Wd')}
            className="py-3.5 bg-amber-500 text-navy-deep hover:bg-amber-400 rounded font-display text-sm font-extrabold cursor-pointer transition-all shadow hover:scale-[1.03] active:scale-95"
          >
            +1 Wide
          </button>
          <button
            type="button"
            onClick={() => handleRecordBall('Nb')}
            className="py-3.5 bg-amber-600 text-navy-deep hover:bg-amber-500 rounded font-display text-sm font-extrabold cursor-pointer transition-all shadow hover:scale-[1.03] active:scale-95"
          >
            +1 No Ball
          </button>
        </div>

        {/* Timeline of deliveries */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-caps-label text-fog-text uppercase shrink-0">
            Current Over Timeline:
          </span>
          {recentBalls.length === 0 ? (
            <span className="text-xs text-fog-text italic">Tap any ball button to begin scoring</span>
          ) : (
            recentBalls.map((b, idx) => (
              <span
                key={idx}
                className={cn(
                  'px-2 py-0.5 rounded font-display text-xs font-bold shrink-0 shadow-sm',
                  b.includes('W') && !b.includes('wd')
                    ? 'bg-live-red text-white'
                    : b === '6'
                    ? 'bg-gold-accent text-navy-deep'
                    : b === '4'
                    ? 'bg-win-green text-navy-deep'
                    : b.includes('wd') || b.includes('nb')
                    ? 'bg-amber-500 text-navy-deep'
                    : 'bg-surface-container-lowest text-white'
                )}
              >
                {b}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── Match Parameters & Manual Broadcast ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container p-4 rounded border border-outline-variant/30">
          <div>
            <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
              Innings &amp; Target
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInnings(1);
                  setBattingTeamId(teamAId);
                  if (autoBroadcast) triggerBroadcast({ innings: 1, battingTeamId: teamAId });
                }}
                className={cn(
                  'flex-1 py-2 rounded text-xs font-caps-label font-bold uppercase transition-colors',
                  innings === 1 ? 'bg-gold-accent text-navy-deep' : 'bg-surface-container-lowest text-fog-text'
                )}
              >
                1st Inn
              </button>
              <button
                type="button"
                onClick={() => {
                  setInnings(2);
                  setBattingTeamId(teamBId);
                  const newTarg = runsA > 0 ? runsA + 1 : '';
                  setTarget(newTarg);
                  if (autoBroadcast) triggerBroadcast({ innings: 2, battingTeamId: teamBId, target: newTarg });
                }}
                className={cn(
                  'flex-1 py-2 rounded text-xs font-caps-label font-bold uppercase transition-colors',
                  innings === 2 ? 'bg-gold-accent text-navy-deep' : 'bg-surface-container-lowest text-fog-text'
                )}
              >
                2nd Inn
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
              Chasing Target ({innings === 2 ? 'Required' : 'Optional'})
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 89"
              value={target}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : '';
                setTarget(val);
                if (autoBroadcast) triggerBroadcast({ target: val });
              }}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white font-table-numeral text-base font-bold focus:border-gold-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
              Match Status
            </label>
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-1.5 text-xs text-white font-caps-label uppercase cursor-pointer">
                <input
                  type="radio"
                  name="cricket_match_status"
                  value="live"
                  checked={status === 'live'}
                  onChange={() => {
                    setStatus('live');
                    if (autoBroadcast) triggerBroadcast({ status: 'live' });
                  }}
                  className="accent-live-red"
                />
                <span>Live</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-white font-caps-label uppercase cursor-pointer">
                <input
                  type="radio"
                  name="cricket_match_status"
                  value="completed"
                  checked={status === 'completed'}
                  onChange={() => {
                    setStatus('completed');
                    if (autoBroadcast) triggerBroadcast({ status: 'completed' });
                  }}
                  className="accent-win-green"
                />
                <span>Final / Completed</span>
              </label>
            </div>
          </div>
        </div>

        {/* Big Manual Broadcast / Commit button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-navy-mid rounded border border-outline-variant/30">
          <div className="text-xs text-fog-text">
            {autoBroadcast
              ? '⚡ Auto-Broadcast is ON: Each delivery updates spectator scoreboards instantly.'
              : 'Auto-Broadcast is OFF: Click below to publish your current score.'}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-gold-accent hover:bg-white text-navy-deep font-caps-label text-xs uppercase font-black rounded shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            <span>{isSubmitting ? 'BROADCASTING...' : 'FORCE BROADCAST LIVE SCORE'}</span>
          </button>
        </div>
      </form>

      {/* ── WICKET DISMISSAL MODAL ── */}
      {isWicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-mid border-2 border-live-red rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2 text-live-red font-caps-label text-sm uppercase font-black">
                <span className="material-symbols-outlined">sports_cricket</span>
                <span>WICKET DISMISSAL EVENT</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWicketModalOpen(false)}
                className="text-fog-text hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Which batsman is OUT */}
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1.5">
                Who got Out?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutBatsmanIndex(0)}
                  className={cn(
                    'p-2.5 rounded border text-left font-caps-label text-xs uppercase font-bold transition-all',
                    outBatsmanIndex === 0
                      ? 'bg-live-red text-white border-live-red'
                      : 'bg-surface-container text-fog-text border-outline-variant/30'
                  )}
                >
                  <div>{batsmen[0]?.name}</div>
                  <div className="text-[10px] font-normal">{batsmen[0]?.is_on_strike ? 'Striker *' : 'Non-Striker'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setOutBatsmanIndex(1)}
                  className={cn(
                    'p-2.5 rounded border text-left font-caps-label text-xs uppercase font-bold transition-all',
                    outBatsmanIndex === 1
                      ? 'bg-live-red text-white border-live-red'
                      : 'bg-surface-container text-fog-text border-outline-variant/30'
                  )}
                >
                  <div>{batsmen[1]?.name}</div>
                  <div className="text-[10px] font-normal">{batsmen[1]?.is_on_strike ? 'Striker *' : 'Non-Striker'}</div>
                </button>
              </div>
            </div>

            {/* How Out */}
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1.5">
                Dismissal Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Bowled', 'Caught', 'Run Out', 'LBW', 'Stumped', 'Hit Wicket'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDismissalType(method)}
                    className={cn(
                      'py-1.5 px-2 rounded text-xs font-caps-label uppercase font-bold border transition-colors',
                      dismissalType === method
                        ? 'bg-gold-accent text-navy-deep border-gold-accent'
                        : 'bg-surface-container text-fog-text border-outline-variant/30 hover:text-white'
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Incoming Batsman from Squad */}
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1.5">
                Incoming Batsman (Starts with 0 Runs):
              </label>
              <select
                value={incomingBatsmanName}
                onChange={(e) => setIncomingBatsmanName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold focus:border-gold-accent focus:outline-none"
              >
                {currentBattingSquad
                  .filter((p) => !batsmen.some((b) => b.name === p) && !batsmenCard.some((b) => b.name === p))
                  .map((p) => (
                    <option key={p} value={p}>
                      {p} (Score 0)
                    </option>
                  ))}
                <option value={`Batter ${currentWickets + 3}`}>Custom / Next Batter</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsWicketModalOpen(false)}
                className="flex-1 py-2.5 bg-surface-container text-fog-text hover:text-white font-caps-label text-xs uppercase font-bold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmWicket}
                className="flex-1 py-2.5 bg-live-red hover:bg-red-700 text-white font-caps-label text-xs uppercase font-black rounded shadow-lg"
              >
                CONFIRM WICKET &amp; INCOMING BATSMAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
