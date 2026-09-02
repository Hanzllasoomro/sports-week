'use client';

import { useState, useEffect } from 'react';
import { createFixture, updateFixture, deleteFixture } from '@/app/actions/fixtures';
import type { FixtureWithRelations, Game, Batch } from '@/types';
import { MOCK_GAMES, MOCK_BATCHES, MOCK_FIXTURES } from '@/lib/mock-data';
import { fixtureTime } from '@/lib/utils';

export default function AdminFixturesPage() {
  const [fixtures, setFixtures] = useState<FixtureWithRelations[]>(MOCK_FIXTURES);
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [batches, setBatches] = useState(MOCK_BATCHES);

  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    game_id: MOCK_GAMES[0].id,
    stage: 'group' as const,
    round: 'Match 1',
    scheduled_at: '2026-09-08T10:00:00+05:00',
    venue: 'MUET Gymnasium',
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFeedbackMessage('Scheduling fixture...');

    const res = await createFixture(formData);
    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Fixture successfully scheduled!');
      setIsCreating(false);
      // Optimistically add to local state
      const selectedGame = games.find((g) => g.id === formData.game_id)!;
      const newFixture: FixtureWithRelations = {
        id: (res.data as any)?.id || `f-new-${Date.now()}`,
        ...formData,
        status: 'scheduled',
        game: selectedGame,
      };
      setFixtures([newFixture, ...fixtures]);
    }
    setTimeout(() => setFeedbackMessage(null), 3500);
  }

  async function handleStatusChange(fixtureId: string, newStatus: any) {
    setFeedbackMessage(`Updating status to ${newStatus}...`);
    const res = await updateFixture({ id: fixtureId, status: newStatus });
    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Status updated!');
      setFixtures((prev) =>
        prev.map((f) => (f.id === fixtureId ? { ...f, status: newStatus } : f))
      );
    }
    setTimeout(() => setFeedbackMessage(null), 3000);
  }

  async function handleDelete(fixtureId: string) {
    if (!confirm('Are you sure you want to cancel and delete this fixture?')) return;
    const res = await deleteFixture(fixtureId);
    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Fixture deleted.');
      setFixtures((prev) => prev.filter((f) => f.id !== fixtureId));
    }
    setTimeout(() => setFeedbackMessage(null), 3000);
  }

  const filteredFixtures =
    statusFilter === 'all'
      ? fixtures
      : fixtures.filter((f) => f.status === statusFilter);

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            MANAGE FIXTURES
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Create, update times, venues, and status for tournament matches
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors flex items-center gap-2 cursor-pointer w-fit"
        >
          <span className="material-symbols-outlined text-base">
            {isCreating ? 'close' : 'add'}
          </span>
          <span>{isCreating ? 'Cancel' : 'Schedule New Match'}</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent flex items-center gap-2 animate-in fade-in-50">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Create Fixture Form Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-5 sm:p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl animate-in slide-in-from-top-4 duration-200"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-4">
            NEW FIXTURE SETUP
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Sport / Game
              </label>
              <select
                value={formData.game_id}
                onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.format})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Tournament Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
              >
                <option value="group">Group Stage</option>
                <option value="semifinal">Semi-Final</option>
                <option value="final">Grand Final</option>
                <option value="friendly">Friendly / Exhibition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Round Label
              </label>
              <input
                type="text"
                value={formData.round}
                onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                placeholder="e.g. Match 1, Group A"
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Scheduled Date &amp; Time
              </label>
              <input
                type="datetime-local"
                defaultValue="2026-09-08T10:00"
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_at: new Date(e.target.value).toISOString() })
                }
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Venue Location
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. MUET Gymnasium Arena, Pitch A"
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer"
          >
            Confirm &amp; Publish Fixture
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        {['all', 'live', 'scheduled', 'completed'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded text-xs font-caps-label uppercase tracking-wider transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-gold-accent text-navy-deep font-bold'
                : 'bg-surface-container text-fog-text hover:text-white'
            }`}
          >
            {st} ({st === 'all' ? fixtures.length : fixtures.filter((f) => f.status === st).length})
          </button>
        ))}
      </div>

      {/* Fixtures Table */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SPORT &amp; ROUND</th>
              <th className="p-3.5">TEAMS / ATHLETES</th>
              <th className="p-3.5">TIME &amp; VENUE</th>
              <th className="p-3.5">SCORE</th>
              <th className="p-3.5">STATUS</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {filteredFixtures.map((f) => (
              <tr key={f.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5">
                  <span className="font-bold text-white block">{f.game.name}</span>
                  <span className="text-[11px] text-fog-text font-caps-label">
                    {f.round || f.stage}
                  </span>
                </td>
                <td className="p-3.5 text-white font-caps-label text-xs">
                  <div>{f.team_a?.name || f.player_a?.name || 'TBD'}</div>
                  <div className="text-fog-text text-[10px]">vs</div>
                  <div>{f.team_b?.name || f.player_b?.name || 'TBD'}</div>
                </td>
                <td className="p-3.5 text-fog-text text-xs font-table-numeral">
                  <div>{fixtureTime(f.scheduled_at)}</div>
                  <div className="text-[10px] text-outline-variant">{f.venue || 'MUET Gym'}</div>
                </td>
                <td className="p-3.5 font-display text-base text-gold-accent">
                  {f.score_a != null && f.score_b != null ? `${f.score_a} - ${f.score_b}` : '-'}
                </td>
                <td className="p-3.5">
                  <select
                    value={f.status}
                    onChange={(e) => handleStatusChange(f.id, e.target.value)}
                    className={`px-2 py-1 rounded text-[11px] font-caps-label uppercase font-bold border ${
                      f.status === 'live'
                        ? 'bg-live-red/20 text-live-red border-live-red/40'
                        : f.status === 'completed'
                        ? 'bg-win-green/20 text-win-green border-win-green/40'
                        : 'bg-surface-container-high text-fog-text border-outline-variant/30'
                    }`}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live Now</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <a
                      href={`/admin/results?fixtureId=${f.id}`}
                      className="p-1.5 text-gold-accent hover:text-white transition-colors"
                      title="Enter Scores"
                    >
                      <span className="material-symbols-outlined text-lg">scoreboard</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      className="p-1.5 text-fog-text hover:text-live-red transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
