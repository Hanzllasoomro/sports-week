'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveResult, saveIndividualResult, saveMarathonResult, getMarathonResults } from '@/app/actions/results';
import type { FixtureWithRelations, Game, Batch } from '@/types';
import { MOCK_FIXTURES, MOCK_GAMES, MOCK_BATCHES } from '@/lib/mock-data';
import { CricketScorerRoom } from '@/components/admin/CricketScorerRoom';

function ResultsContent() {
  const searchParams = useSearchParams();
  const isRestricted = searchParams.get('restricted') === 'true';

  const [fixtures, setFixtures] = useState<FixtureWithRelations[]>(MOCK_FIXTURES);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(MOCK_FIXTURES[0]?.id || '');
  const [scoreA, setScoreA] = useState<number>(MOCK_FIXTURES[0]?.score_a ?? 0);
  const [scoreB, setScoreB] = useState<number>(MOCK_FIXTURES[0]?.score_b ?? 0);
  const [status, setStatus] = useState<'live' | 'completed'>('live');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab State: 'team' | 'marathon' | 'individual'
  const [tab, setTab] = useState<'team' | 'marathon' | 'individual'>('team');

  // Individual Podium State
  const [podiumGameId, setPodiumGameId] = useState<string>(MOCK_GAMES[6].id); // Badminton
  const [podiumBatchId, setPodiumBatchId] = useState<string>(MOCK_BATCHES[2].id);
  const [podiumGender, setPodiumGender] = useState<'boys' | 'girls'>('boys');
  const [podiumPosition, setPodiumPosition] = useState<number>(1);
  const [podiumPoints, setPodiumPoints] = useState<number>(10);

  // Dedicated Marathon Winner State
  const [marathonGender, setMarathonGender] = useState<'boys' | 'girls'>('boys');
  const [marathonPosition, setMarathonPosition] = useState<number>(1);
  const [marathonBatchId, setMarathonBatchId] = useState<string>(MOCK_BATCHES[2].id);
  const [marathonPoints, setMarathonPoints] = useState<number>(10);
  const [marathonRunnerName, setMarathonRunnerName] = useState<string>('');
  const [marathonRunnerRoll, setMarathonRunnerRoll] = useState<string>('');
  const [marathonResultsList, setMarathonResultsList] = useState<any[]>([]);

  const [players, setPlayers] = useState<any[]>([]);

  // Load real fixtures, players, and marathon results on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [fixRes, playRes, marathonData] = await Promise.all([
          fetch('/api/fixtures'),
          fetch('/api/players'),
          getMarathonResults(),
        ]);

        if (fixRes.ok) {
          const data = await fixRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setFixtures(data);
            if (!selectedFixtureId || !data.some((f: any) => f.id === selectedFixtureId)) {
              setSelectedFixtureId(data[0].id);
            }
          }
        }

        if (playRes.ok) {
          const playData = await playRes.json();
          if (Array.isArray(playData)) {
            setPlayers(playData);
          }
        }

        if (Array.isArray(marathonData)) {
          setMarathonResultsList(marathonData);
        }
      } catch (err) {
        console.error('Failed to load fixtures / players / marathon', err);
      }
    }
    loadData();
  }, []);

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0];

  useEffect(() => {
    if (selectedFixture) {
      setScoreA(selectedFixture.score_a ?? 0);
      setScoreB(selectedFixture.score_b ?? 0);
      setStatus(selectedFixture.status === 'completed' ? 'completed' : 'live');
    }
  }, [selectedFixtureId]);

  async function handleSaveMarathon(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback('Recording Official Marathon Winner & calculating points...');

    const res = await saveMarathonResult({
      batch_id: marathonBatchId,
      gender: marathonGender,
      position: marathonPosition,
      points_awarded: marathonPoints,
      runner_name: marathonRunnerName,
      runner_roll_no: marathonRunnerRoll,
    });

    if (res.error) {
      setFeedback(`Error: ${res.error.message}`);
    } else {
      const posLabel = marathonPosition === 1 ? '1st (Gold 🥇)' : marathonPosition === 2 ? '2nd (Silver 🥈)' : '3rd (Bronze 🥉)';
      const batchCode = MOCK_BATCHES.find((b) => b.id === marathonBatchId)?.code || 'Batch';
      setFeedback(`Marathon Result Saved! ${batchCode} awarded ${marathonPoints} points for ${marathonGender.toUpperCase()} ${posLabel}!`);
      
      // Refresh list
      const freshList = await getMarathonResults();
      if (Array.isArray(freshList)) {
        setMarathonResultsList(freshList);
      }
      setMarathonRunnerName('');
      setMarathonRunnerRoll('');
    }
    setIsSubmitting(false);
    setTimeout(() => setFeedback(null), 5000);
  }

  async function handleSaveTeamScore(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFixture) return;

    setIsSubmitting(true);
    setFeedback('Recording official score & updating standings...');

    const res = await saveResult({
      fixture_id: selectedFixture.id,
      score_a: scoreA,
      score_b: scoreB,
      status,
      winner_team_id:
        status === 'completed'
          ? scoreA > scoreB
            ? selectedFixture.team_a?.id
            : scoreB > scoreA
            ? selectedFixture.team_b?.id
            : null
          : null,
      winner_player_id:
        status === 'completed'
          ? scoreA > scoreB
            ? selectedFixture.player_a?.id
            : scoreB > scoreA
            ? selectedFixture.player_b?.id
            : null
          : null,
    });

    if (res.error) {
      setFeedback(`Error: ${res.error.message}`);
    } else {
      setFeedback('Score saved! Standings recomputed automatically.');
      setFixtures((prev) =>
        prev.map((f) =>
          f.id === selectedFixture.id
            ? { ...f, score_a: scoreA, score_b: scoreB, status }
            : f
        )
      );
    }
    setIsSubmitting(false);
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleSaveCricketScore(payload: {
    scoreA: number;
    scoreB: number;
    status: 'live' | 'completed';
    cricketDetails: any;
    winnerTeamId?: string | null;
  }) {
    if (!selectedFixture) return;
    setIsSubmitting(true);
    setFeedback('Broadcasting live cricket scorecard...');

    const res = await saveResult({
      fixture_id: selectedFixture.id,
      score_a: payload.scoreA,
      score_b: payload.scoreB,
      status: payload.status,
      cricket_details: payload.cricketDetails,
      winner_team_id: payload.winnerTeamId,
    });

    if (res.error) {
      setFeedback(`Error: ${res.error.message}`);
    } else {
      setFeedback('Cricket score saved and broadcasted to live feed!');
      setFixtures((prev) =>
        prev.map((f) =>
          f.id === selectedFixture.id
            ? {
                ...f,
                score_a: payload.scoreA,
                score_b: payload.scoreB,
                status: payload.status,
                cricket_details: payload.cricketDetails,
                winner_team_id: payload.winnerTeamId,
              }
            : f
        )
      );
    }
    setIsSubmitting(false);
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleSavePodium(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback('Crediting podium points...');

    const res = await saveIndividualResult({
      game_id: podiumGameId,
      batch_id: podiumBatchId,
      gender: podiumGender,
      position: podiumPosition,
      points_awarded: podiumPoints,
    });

    if (res.error) {
      setFeedback(`Error: ${res.error.message}`);
    } else {
      setFeedback(`Awarded ${podiumPoints} points for Position #${podiumPosition}! Standings updated.`);
    }
    setIsSubmitting(false);
    setTimeout(() => setFeedback(null), 4000);
  }

  const isIndividualMatch = selectedFixture?.game?.format === 'individual';
  const competitorAName =
    selectedFixture?.player_a?.name || selectedFixture?.team_a?.name || 'Competitor A';
  const competitorBName =
    selectedFixture?.player_b?.name || selectedFixture?.team_b?.name || 'Competitor B';

  const competitorABatch =
    selectedFixture?.player_a?.batch?.code || selectedFixture?.team_a?.batch?.code || 'Batch';
  const competitorBBatch =
    selectedFixture?.player_b?.batch?.code || selectedFixture?.team_b?.batch?.code || 'Batch';

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Page Title & Navigation Tabs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            SCORE &amp; RESULT ENTRY ROOM
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Real-time score adjustments for team fixtures and individual sport podium medals
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center rounded border border-outline-variant/40 p-1 bg-surface-container-lowest gap-1">
          <button
            type="button"
            onClick={() => setTab('team')}
            className={`px-3.5 py-2 font-caps-label text-xs uppercase font-bold transition-colors cursor-pointer rounded-sm flex items-center gap-1.5 ${
              tab === 'team'
                ? 'bg-gold-accent text-navy-deep'
                : 'bg-surface-container text-fog-text hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">scoreboard</span>
            <span>Match Scoreboard</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('marathon')}
            className={`px-3.5 py-2 font-caps-label text-xs uppercase font-bold transition-colors cursor-pointer rounded-sm flex items-center gap-1.5 ${
              tab === 'marathon'
                ? 'bg-gold-accent text-navy-deep'
                : 'bg-surface-container text-fog-text hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">directions_run</span>
            <span>Winner Marathon</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('individual')}
            className={`px-3.5 py-2 font-caps-label text-xs uppercase font-bold transition-colors cursor-pointer rounded-sm flex items-center gap-1.5 ${
              tab === 'individual'
                ? 'bg-gold-accent text-navy-deep'
                : 'bg-surface-container text-fog-text hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">military_tech</span>
            <span>Individual Podium</span>
          </button>
        </div>
      </div>

      {/* Scorer Access Restricted Banner if redirected */}
      {isRestricted && (
        <div className="mb-6 p-4 bg-navy-mid/90 border-l-4 border-gold-accent rounded text-xs flex items-start gap-3 shadow-lg">
          <span className="material-symbols-outlined text-gold-accent text-xl mt-0.5">verified_user</span>
          <div>
            <div className="font-caps-label text-gold-accent uppercase font-bold text-xs">
              Official Scorer Workspace
            </div>
            <p className="mt-0.5 text-fog-text">
              Your official account is authorized specifically to add match scores and declare game winners &amp; marathon podiums.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className="mb-6 p-3.5 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{feedback}</span>
        </div>
      )}

      {tab === 'team' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Match selector & Big +/- scoreboard (Spans 8 cols) */}
          <div className="lg:col-span-8 bg-surface-container border border-outline-variant/30 rounded p-6 shadow-xl">
            {fixtures.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-fog-text/50 mb-3">
                  event_busy
                </span>
                <h3 className="font-display text-white text-lg uppercase mb-2">
                  NO MATCHES CURRENTLY SCHEDULED
                </h3>
                <p className="text-xs text-fog-text mb-6 max-w-md mx-auto font-body">
                  All match results have been cleared or not yet registered. Use the Fixture &amp; Schedule Manager to schedule tournament games.
                </p>
                <a
                  href="/admin/fixtures"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Schedule Matches Now</span>
                </a>
              </div>
            ) : (
              <>
                {/* Fixture Selector Dropdown */}
                <div className="mb-6">
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-2">
                    Select Active Match
                  </label>
                  <select
                    value={selectedFixtureId}
                    onChange={(e) => setSelectedFixtureId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-sm focus:border-gold-accent focus:outline-none"
                  >
                    {fixtures.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{f.status.toUpperCase()}] {f.game?.name} —{' '}
                        {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                        {f.team_b?.name || f.player_b?.name || 'TBD'} ({f.round || f.stage})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFixture && (
                  selectedFixture.game?.slug === 'cricket' ? (
                    <CricketScorerRoom
                      key={selectedFixture.id}
                      fixture={selectedFixture}
                      players={players}
                      isSubmitting={isSubmitting}
                      onSave={handleSaveCricketScore}
                    />
                  ) : (
                    <form onSubmit={handleSaveTeamScore}>
                {/* Match Banner Header */}
                <div className="p-4 bg-navy-mid rounded border border-outline-variant/20 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-accent">sports</span>
                    <span className="font-caps-label text-sm uppercase text-white font-bold">
                      {selectedFixture.game?.name} &bull; {selectedFixture.round || selectedFixture.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest rounded text-xs font-caps-label text-live-red uppercase font-bold border border-live-red/40">
                    <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                    <span>Active Room</span>
                  </div>
                </div>

                {/* Big +/- Giant Score Controls (matching Stitch 06-score-entry.html) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {/* Competitor A */}
                  <div className="bg-surface-container-lowest p-5 rounded border border-outline-variant/30 text-center">
                    <div className="font-h2 text-base sm:text-lg uppercase text-white font-bold truncate">
                      {competitorAName}
                    </div>
                    <span className="font-caps-label text-xs text-gold-accent block mb-4">
                      {competitorABatch} {selectedFixture.player_a?.roll_no && `(${selectedFixture.player_a.roll_no})`}
                    </span>

                    {/* Big Score Display */}
                    <div className="font-display text-6xl sm:text-7xl text-gold-accent my-3 font-table-numeral">
                      {scoreA}
                    </div>

                    {/* +/- Buttons */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                        className="w-12 h-12 rounded bg-surface-container hover:bg-live-red text-white text-2xl font-bold flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/30"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreA(scoreA + 1)}
                        className="w-12 h-12 rounded bg-gold-accent hover:bg-white text-navy-deep text-2xl font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick increment chips */}
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setScoreA(scoreA + 4)}
                        className="px-2.5 py-1 rounded bg-navy-mid text-gold-accent text-xs font-caps-label hover:bg-gold-accent hover:text-navy-deep transition-colors"
                      >
                        +4 pts
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreA(scoreA + 6)}
                        className="px-2.5 py-1 rounded bg-navy-mid text-gold-accent text-xs font-caps-label hover:bg-gold-accent hover:text-navy-deep transition-colors"
                      >
                        +6 pts
                      </button>
                    </div>
                  </div>

                  {/* Competitor B */}
                  <div className="bg-surface-container-lowest p-5 rounded border border-outline-variant/30 text-center">
                    <div className="font-h2 text-base sm:text-lg uppercase text-white font-bold truncate">
                      {competitorBName}
                    </div>
                    <span className="font-caps-label text-xs text-fog-text block mb-4">
                      {competitorBBatch} {selectedFixture.player_b?.roll_no && `(${selectedFixture.player_b.roll_no})`}
                    </span>

                    {/* Big Score Display */}
                    <div className="font-display text-6xl sm:text-7xl text-white my-3 font-table-numeral">
                      {scoreB}
                    </div>

                    {/* +/- Buttons */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                        className="w-12 h-12 rounded bg-surface-container hover:bg-live-red text-white text-2xl font-bold flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/30"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreB(scoreB + 1)}
                        className="w-12 h-12 rounded bg-gold-accent hover:bg-white text-navy-deep text-2xl font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick increment chips */}
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setScoreB(scoreB + 4)}
                        className="px-2.5 py-1 rounded bg-navy-mid text-gold-accent text-xs font-caps-label hover:bg-gold-accent hover:text-navy-deep transition-colors"
                      >
                        +4 pts
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreB(scoreB + 6)}
                        className="px-2.5 py-1 rounded bg-navy-mid text-gold-accent text-xs font-caps-label hover:bg-gold-accent hover:text-navy-deep transition-colors"
                      >
                        +6 pts
                      </button>
                    </div>
                  </div>
                </div>

                {/* Match Status Selector & Submit */}
                <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-caps-label text-fog-text uppercase font-bold">
                      Match Status:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-white font-caps-label uppercase cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="live"
                          checked={status === 'live'}
                          onChange={() => setStatus('live')}
                          className="accent-gold-accent"
                        />
                        <span>In Progress (Live)</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-white font-caps-label uppercase cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="completed"
                          checked={status === 'completed'}
                          onChange={() => setStatus('completed')}
                          className="accent-win-green"
                        />
                        <span>Final / Completed</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save & Publish Score'}
                  </button>
                </div>
              </form>
            )
          )}
          </>
        )}
      </div>

          {/* Quick Rules & Guidelines Panel (Spans 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container border border-outline-variant/30 rounded p-6 shadow-xl">
              <h3 className="font-caps-label text-xs uppercase text-gold-accent font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">rule</span>
                <span>Scoring Rules Matrix</span>
              </h3>
              <ul className="text-xs text-fog-text space-y-2.5 font-body">
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent font-bold">&bull;</span>
                  <span><strong>Group Win:</strong> 3 points awarded to the winning batch.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent font-bold">&bull;</span>
                  <span><strong>Semi-Final Win:</strong> 5 points awarded to the victor.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent font-bold">&bull;</span>
                  <span><strong>Final Runner-Up:</strong> 7 points awarded for 2nd place.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent font-bold">&bull;</span>
                  <span><strong>Final Winner:</strong> 10 points awarded to tournament champions.</span>
                </li>
              </ul>
            </div>

            <div className="bg-navy-mid/60 border border-outline-variant/30 rounded p-5">
              <div className="font-caps-label text-xs uppercase text-white font-bold mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-gold-accent">sync</span>
                <span>Automatic Standings Engine</span>
              </div>
              <p className="text-xs text-fog-text leading-relaxed">
                Saving score updates marked as <strong>Final / Completed</strong> automatically triggers the points calculation engine in <code className="text-gold-accent">lib/points.ts</code>, updating the unified leaderboard within ~20s.
              </p>
            </div>
          </div>
        </div>
      ) : tab === 'marathon' ? (
        /* ── DEDICATED MARATHON WINNERS TAB ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Winner Form */}
          <div className="lg:col-span-7 bg-surface-container border border-outline-variant/30 rounded p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-2xl text-gold-accent">directions_run</span>
              <h2 className="font-display text-white text-xl uppercase tracking-wider">
                DECLARE MARATHON WINNERS
              </h2>
            </div>
            <p className="font-body text-fog-text text-xs mb-6">
              Official Scorer portal for recording 1st, 2nd, and 3rd place finishes for the SES Mini Marathon. Points are credited to the runner&apos;s batch standing automatically.
            </p>

            <form onSubmit={handleSaveMarathon} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                    Division / Category
                  </label>
                  <select
                    value={marathonGender}
                    onChange={(e) => setMarathonGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-semibold focus:border-gold-accent focus:outline-none"
                  >
                    <option value="boys">Boys Marathon (3.5km Campus Loop)</option>
                    <option value="girls">Girls Marathon (3.5km Campus Loop)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                    Podium Finish
                  </label>
                  <select
                    value={marathonPosition}
                    onChange={(e) => {
                      const pos = Number(e.target.value);
                      setMarathonPosition(pos);
                      setMarathonPoints(pos === 1 ? 10 : pos === 2 ? 7 : 5);
                    }}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-semibold focus:border-gold-accent focus:outline-none"
                  >
                    <option value={1}>🥇 1st Place &bull; Gold Medal (10 Pts)</option>
                    <option value={2}>🥈 2nd Place &bull; Silver Medal (7 Pts)</option>
                    <option value={3}>🥉 3rd Place &bull; Bronze Medal (5 Pts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                  Winning Batch
                </label>
                <select
                  value={marathonBatchId}
                  onChange={(e) => setMarathonBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-semibold focus:border-gold-accent focus:outline-none"
                >
                  {MOCK_BATCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} ({b.department.code} — {b.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                    Runner Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sajid Ali"
                    value={marathonRunnerName}
                    onChange={(e) => setMarathonRunnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                    Roll Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24SW05"
                    value={marathonRunnerRoll}
                    onChange={(e) => setMarathonRunnerRoll(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Championship Points to Award
                </label>
                <input
                  type="number"
                  min="0"
                  value={marathonPoints}
                  onChange={(e) => setMarathonPoints(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-table-numeral focus:border-gold-accent focus:outline-none font-bold"
                />
                <span className="text-[10px] text-fog-text mt-1 block">
                  Official rule points: Gold = 10 pts, Silver = 7 pts, Bronze = 5 pts.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 px-6 py-3.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">emoji_events</span>
                <span>{isSubmitting ? 'Recording Marathon Winner...' : 'Award Marathon Podium Finish'}</span>
              </button>
            </form>
          </div>

          {/* Declared Marathon Podium Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Boys Division Podium */}
            <div className="bg-surface-container border border-outline-variant/30 rounded p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-2">
                <h3 className="font-caps-label text-xs uppercase text-white font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Boys Marathon Podium</span>
                </h3>
                <span className="font-caps-label text-[10px] uppercase text-fog-text">3.5km Race</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { pos: 1, medal: '🥇', label: 'Gold Champion', pts: 10, border: 'border-gold-accent/40 bg-gold-accent/10' },
                  { pos: 2, medal: '🥈', label: 'Silver Runner-Up', pts: 7, border: 'border-outline-variant/40 bg-navy-mid/40' },
                  { pos: 3, medal: '🥉', label: 'Bronze 3rd Place', pts: 5, border: 'border-outline-variant/40 bg-navy-mid/40' },
                ].map((tier) => {
                  const winner = marathonResultsList.find(
                    (r) => r.gender === 'boys' && r.position === tier.pos
                  );

                  return (
                    <div
                      key={tier.pos}
                      className={`p-3 rounded border flex items-center justify-between ${tier.border}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tier.medal}</span>
                        <div>
                          <div className="font-caps-label text-[10px] uppercase text-fog-text">
                            {tier.label}
                          </div>
                          <div className="text-xs font-bold text-white">
                            {winner ? (
                              <span>
                                {winner.player?.name || 'Runner'} ({winner.batch?.code})
                              </span>
                            ) : (
                              <span className="text-fog-text/60 italic">Not yet awarded</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-table-numeral text-xs font-bold text-gold-accent">
                          {winner ? `+${winner.points_awarded || tier.pts} pts` : `${tier.pts} pts`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Girls Division Podium */}
            <div className="bg-surface-container border border-outline-variant/30 rounded p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-2">
                <h3 className="font-caps-label text-xs uppercase text-white font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>Girls Marathon Podium</span>
                </h3>
                <span className="font-caps-label text-[10px] uppercase text-fog-text">3.5km Race</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { pos: 1, medal: '🥇', label: 'Gold Champion', pts: 10, border: 'border-gold-accent/40 bg-gold-accent/10' },
                  { pos: 2, medal: '🥈', label: 'Silver Runner-Up', pts: 7, border: 'border-outline-variant/40 bg-navy-mid/40' },
                  { pos: 3, medal: '🥉', label: 'Bronze 3rd Place', pts: 5, border: 'border-outline-variant/40 bg-navy-mid/40' },
                ].map((tier) => {
                  const winner = marathonResultsList.find(
                    (r) => r.gender === 'girls' && r.position === tier.pos
                  );

                  return (
                    <div
                      key={tier.pos}
                      className={`p-3 rounded border flex items-center justify-between ${tier.border}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tier.medal}</span>
                        <div>
                          <div className="font-caps-label text-[10px] uppercase text-fog-text">
                            {tier.label}
                          </div>
                          <div className="text-xs font-bold text-white">
                            {winner ? (
                              <span>
                                {winner.player?.name || 'Runner'} ({winner.batch?.code})
                              </span>
                            ) : (
                              <span className="text-fog-text/60 italic">Not yet awarded</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-table-numeral text-xs font-bold text-gold-accent">
                          {winner ? `+${winner.points_awarded || tier.pts} pts` : `${tier.pts} pts`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── OTHER INDIVIDUAL PODIUM TAB ── */
        <div className="bg-surface-container border border-outline-variant/30 rounded p-6 max-w-2xl mx-auto shadow-xl">
          <h2 className="font-display text-gold-accent uppercase text-xl mb-2">
            INDIVIDUAL SPORT PODIUM FINISH
          </h2>
          <p className="font-body text-fog-text text-xs mb-6">
            Award 1st, 2nd, or 3rd place finishes for Badminton, Table Tennis, or Chess.
          </p>

          <form onSubmit={handleSavePodium} className="space-y-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                Sport
              </label>
              <select
                value={podiumGameId}
                onChange={(e) => setPodiumGameId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
              >
                {MOCK_GAMES.filter((g) => g.format === 'individual' && g.slug !== 'mini-marathon').map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                  Batch
                </label>
                <select
                  value={podiumBatchId}
                  onChange={(e) => setPodiumBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
                >
                  {MOCK_BATCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} ({b.department.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                  Category
                </label>
                <select
                  value={podiumGender}
                  onChange={(e) => setPodiumGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                  Podium Position
                </label>
                <select
                  value={podiumPosition}
                  onChange={(e) => {
                    const pos = Number(e.target.value);
                    setPodiumPosition(pos);
                    setPodiumPoints(pos === 1 ? 10 : pos === 2 ? 7 : 5);
                  }}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
                >
                  <option value={1}>1st Place &bull; Gold Medal</option>
                  <option value={2}>2nd Place &bull; Silver Medal</option>
                  <option value={3}>3rd Place &bull; Bronze Medal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-semibold">
                  Points Credited
                </label>
                <input
                  type="number"
                  value={podiumPoints}
                  onChange={(e) => setPodiumPoints(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-table-numeral focus:border-gold-accent focus:outline-none font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 px-6 py-3 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Credit Podium Points'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-8 text-center text-fog-text font-caps-label uppercase text-xs">
          Loading score and result entry room...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
