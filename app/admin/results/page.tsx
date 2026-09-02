'use client';

import { useState, useEffect } from 'react';
import { saveResult, saveIndividualResult } from '@/app/actions/results';
import type { FixtureWithRelations, Game, Batch } from '@/types';
import { MOCK_FIXTURES, MOCK_GAMES, MOCK_BATCHES } from '@/lib/mock-data';

export default function AdminResultsPage() {
  const [fixtures, setFixtures] = useState<FixtureWithRelations[]>(MOCK_FIXTURES);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(MOCK_FIXTURES[0]?.id || '');
  const [scoreA, setScoreA] = useState<number>(MOCK_FIXTURES[0]?.score_a ?? 0);
  const [scoreB, setScoreB] = useState<number>(MOCK_FIXTURES[0]?.score_b ?? 0);
  const [status, setStatus] = useState<'live' | 'completed'>('live');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Individual Podium State
  const [tab, setTab] = useState<'team' | 'individual'>('team');
  const [podiumGameId, setPodiumGameId] = useState<string>(MOCK_GAMES[6].id); // Badminton
  const [podiumBatchId, setPodiumBatchId] = useState<string>(MOCK_BATCHES[2].id);
  const [podiumGender, setPodiumGender] = useState<'boys' | 'girls'>('boys');
  const [podiumPosition, setPodiumPosition] = useState<number>(1);
  const [podiumPoints, setPodiumPoints] = useState<number>(10);

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0];

  useEffect(() => {
    if (selectedFixture) {
      setScoreA(selectedFixture.score_a ?? 0);
      setScoreB(selectedFixture.score_b ?? 0);
      setStatus(selectedFixture.status === 'completed' ? 'completed' : 'live');
    }
  }, [selectedFixtureId]);

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

  async function handleSaveIndividual(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback('Recording podium finish & updating batch standings...');

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
      setFeedback('Podium medal recorded & batch points credited!');
    }
    setIsSubmitting(false);
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            SCORE &amp; RESULT ENTRY
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Real-time score adjustments and podium medal points allocation
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('team')}
            className={`px-4 py-2 font-caps-label text-xs uppercase font-bold transition-colors cursor-pointer ${
              tab === 'team'
                ? 'bg-gold-accent text-navy-deep'
                : 'bg-surface-container text-fog-text hover:text-white'
            }`}
          >
            Team Matches
          </button>
          <button
            type="button"
            onClick={() => setTab('individual')}
            className={`px-4 py-2 font-caps-label text-xs uppercase font-bold transition-colors cursor-pointer ${
              tab === 'individual'
                ? 'bg-gold-accent text-navy-deep'
                : 'bg-surface-container text-fog-text hover:text-white'
            }`}
          >
            Individual Podium
          </button>
        </div>
      </div>

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
                    [{f.status.toUpperCase()}] {f.game.name} —{' '}
                    {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                    {f.team_b?.name || f.player_b?.name || 'TBD'} ({f.round || f.stage})
                  </option>
                ))}
              </select>
            </div>

            {selectedFixture && (
              <form onSubmit={handleSaveTeamScore}>
                {/* Match Banner Header */}
                <div className="p-4 bg-navy-mid rounded border border-outline-variant/20 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-accent">sports</span>
                    <span className="font-caps-label text-sm uppercase text-white font-bold">
                      {selectedFixture.game.name} &bull; {selectedFixture.round || selectedFixture.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest rounded text-xs font-caps-label text-live-red uppercase font-bold border border-live-red/40">
                    <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                    <span>Active Room</span>
                  </div>
                </div>

                {/* Big +/- Giant Score Controls (matching Stitch 06-score-entry.html) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {/* Team A */}
                  <div className="bg-surface-container-lowest p-5 rounded border border-outline-variant/30 text-center">
                    <div className="font-h2 text-base sm:text-lg uppercase text-white font-bold truncate">
                      {selectedFixture.team_a?.name || 'Team A'}
                    </div>
                    <span className="font-caps-label text-xs text-gold-accent block mb-4">
                      {selectedFixture.team_a?.batch?.code || 'Batch'}
                    </span>

                    {/* Big Score Display */}
                    <div className="font-display text-6xl sm:text-7xl text-gold-accent my-3">
                      {scoreA}
                    </div>

                    {/* +/- Buttons */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                        className="w-12 h-12 rounded bg-surface-container-high hover:bg-white hover:text-navy-deep text-white font-display text-2xl flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreA(scoreA + 1)}
                        className="w-12 h-12 rounded bg-gold-accent hover:bg-white text-navy-deep font-display text-2xl flex items-center justify-center transition-colors cursor-pointer font-bold shadow"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreA(scoreA + 4)}
                        className="px-3 h-12 rounded bg-surface-container-high hover:bg-white hover:text-navy-deep text-gold-accent font-caps-label text-xs font-bold transition-colors cursor-pointer"
                        title="Add Boundary / +4"
                      >
                        +4
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreA(scoreA + 6)}
                        className="px-3 h-12 rounded bg-surface-container-high hover:bg-white hover:text-navy-deep text-gold-accent font-caps-label text-xs font-bold transition-colors cursor-pointer"
                        title="Add Six / +6"
                      >
                        +6
                      </button>
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="bg-surface-container-lowest p-5 rounded border border-outline-variant/30 text-center">
                    <div className="font-h2 text-base sm:text-lg uppercase text-white font-bold truncate">
                      {selectedFixture.team_b?.name || 'Team B'}
                    </div>
                    <span className="font-caps-label text-xs text-gold-accent block mb-4">
                      {selectedFixture.team_b?.batch?.code || 'Batch'}
                    </span>

                    {/* Big Score Display */}
                    <div className="font-display text-6xl sm:text-7xl text-gold-accent my-3">
                      {scoreB}
                    </div>

                    {/* +/- Buttons */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                        className="w-12 h-12 rounded bg-surface-container-high hover:bg-white hover:text-navy-deep text-white font-display text-2xl flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreB(scoreB + 1)}
                        className="w-12 h-12 rounded bg-gold-accent hover:bg-white text-navy-deep font-display text-2xl flex items-center justify-center transition-colors cursor-pointer font-bold shadow"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreB(scoreB + 4)}
                        className="px-3 h-12 rounded bg-surface-container-high hover:bg-white hover:text-navy-deep text-gold-accent font-caps-label text-xs font-bold transition-colors cursor-pointer"
                        title="Add Boundary / +4"
                      >
                        +4
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreB(scoreB + 6)}
                        className="px-3 h-12 rounded bg-surface-container-high hover:bg-white hover:text-navy-deep text-gold-accent font-caps-label text-xs font-bold transition-colors cursor-pointer"
                        title="Add Six / +6"
                      >
                        +6
                      </button>
                    </div>
                  </div>
                </div>

                {/* Match Status Selector & Submit */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant/30">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-xs font-caps-label text-fog-text uppercase font-bold">
                      Match Status:
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-xs text-white font-caps-label uppercase focus:border-gold-accent focus:outline-none"
                    >
                      <option value="live">In Progress (Live)</option>
                      <option value="completed">Final (Completed &amp; Points Awarded)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Publish Official Score'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Guide & Audit Rules (Spans 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="p-5 bg-surface-container border border-outline-variant/20 rounded">
              <h3 className="font-caps-label text-xs uppercase text-gold-accent font-bold mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">verified</span>
                POINTS SYSTEM RULES
              </h3>
              <p className="text-xs text-fog-text mb-3 leading-relaxed">
                When a match is marked <strong>Completed</strong>, the points calculation engine (<code className="text-gold-accent">lib/points.ts</code>) triggers automatically and adds points to the winning batch:
              </p>
              <ul className="text-xs text-fog-text flex flex-col gap-1.5 font-table-numeral">
                <li className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span>Group Stage Win:</span>
                  <span className="text-gold-accent font-bold">3 PTS</span>
                </li>
                <li className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span>Semi-Final Win:</span>
                  <span className="text-gold-accent font-bold">5 PTS</span>
                </li>
                <li className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span>Final Runner-Up:</span>
                  <span className="text-gold-accent font-bold">7 PTS</span>
                </li>
                <li className="flex justify-between">
                  <span>Final Champion:</span>
                  <span className="text-gold-accent font-bold">10 PTS</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Individual Podium Finish Form */
        <div className="max-w-2xl bg-surface-container border border-outline-variant/30 rounded p-6 shadow-xl">
          <h3 className="font-display text-gold-accent uppercase text-xl mb-2">
            INDIVIDUAL SPORT PODIUM FINISH
          </h3>
          <p className="text-xs text-fog-text mb-6">
            Record Gold, Silver, and Bronze medal winners for Badminton, Table Tennis, Chess, and Mini Marathon.
          </p>

          <form onSubmit={handleSaveIndividual} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Sport
              </label>
              <select
                value={podiumGameId}
                onChange={(e) => setPodiumGameId(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                {MOCK_GAMES.filter((g) => g.format === 'individual').map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Winning Batch
                </label>
                <select
                  value={podiumBatchId}
                  onChange={(e) => setPodiumBatchId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  {MOCK_BATCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} ({b.department.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Category Gender
                </label>
                <select
                  value={podiumGender}
                  onChange={(e) => setPodiumGender(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Medal Position
                </label>
                <select
                  value={podiumPosition}
                  onChange={(e) => {
                    const pos = Number(e.target.value);
                    setPodiumPosition(pos);
                    setPodiumPoints(pos === 1 ? 10 : pos === 2 ? 7 : 5);
                  }}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value={1}>1st Place (Gold Medal)</option>
                  <option value={2}>2nd Place (Silver Medal)</option>
                  <option value={3}>3rd Place (Bronze Medal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Points Awarded
                </label>
                <input
                  type="number"
                  value={podiumPoints}
                  onChange={(e) => setPodiumPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 px-8 py-3 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Award Podium Points'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
