'use client';

import { useState } from 'react';
import { createFixture, updateFixture, deleteFixture } from '@/app/actions/fixtures';
import type { FixtureWithRelations, Game } from '@/types';
import { MOCK_GAMES, MOCK_BATCHES, MOCK_FIXTURES } from '@/lib/mock-data';
import { fixtureTime, fixtureDate } from '@/lib/utils';

export default function AdminFixturesPage() {
  const [fixtures, setFixtures] = useState<FixtureWithRelations[]>(MOCK_FIXTURES);
  const [games] = useState<Game[]>(MOCK_GAMES);

  const [isCreating, setIsCreating] = useState(false);
  const [editingFixture, setEditingFixture] = useState<FixtureWithRelations | null>(null);
  const [deletingFixture, setDeletingFixture] = useState<FixtureWithRelations | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form State for new fixture
  const [formData, setFormData] = useState({
    game_id: MOCK_GAMES[0].id,
    stage: 'group' as 'group' | 'semifinal' | 'final',
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

  async function handleUpdateFixture(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFixture) return;

    setFeedbackMessage('Updating fixture details...');
    const res = await updateFixture({
      id: editingFixture.id,
      stage: editingFixture.stage,
      round: editingFixture.round,
      scheduled_at: editingFixture.scheduled_at,
      venue: editingFixture.venue,
      status: editingFixture.status,
    });

    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Fixture updated successfully!');
      setFixtures(fixtures.map((f) => (f.id === editingFixture.id ? editingFixture : f)));
      setEditingFixture(null);
    }
    setTimeout(() => setFeedbackMessage(null), 3500);
  }

  async function handleConfirmDelete() {
    if (!deletingFixture) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm permission to remove this fixture.');
      return;
    }

    setFeedbackMessage('Deleting fixture...');
    const res = await deleteFixture(deletingFixture.id);
    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Fixture removed from schedule.');
      setFixtures(fixtures.filter((f) => f.id !== deletingFixture.id));
      setDeletingFixture(null);
      setDeleteConfirmText('');
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

  const filteredFixtures =
    statusFilter === 'all'
      ? fixtures
      : fixtures.filter((f) => f.status === statusFilter);

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            FIXTURE &amp; SCHEDULE MANAGER
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Schedule tournament matches, edit timings &amp; venues, update statuses, or cancel fixtures
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingFixture(null);
          }}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">
            {isCreating ? 'close' : 'add'}
          </span>
          <span>{isCreating ? 'Cancel' : 'Schedule Match'}</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent">
          {feedbackMessage}
        </div>
      )}

      {/* ── Create Fixture Form ── */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-4">
            SCHEDULE NEW TOURNAMENT MATCH
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Sport
              </label>
              <select
                value={formData.game_id}
                onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
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
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="group">Group / League Stage</option>
                <option value="semifinal">Semi-Final</option>
                <option value="final">Championship Final</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Round Label
              </label>
              <input
                type="text"
                placeholder="e.g. Group B or Match 3"
                value={formData.round}
                onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Date &amp; Time
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DDTHH:MM:SS+05:00"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer"
          >
            Confirm &amp; Schedule
          </button>
        </form>
      )}

      {/* ── Edit Fixture Modal ── */}
      {editingFixture && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateFixture}
            className="w-full max-w-xl bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <h3 className="font-display text-gold-accent uppercase text-lg">
                EDIT FIXTURE: {editingFixture.game?.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFixture(null)}
                className="text-fog-text hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Tournament Stage
                </label>
                <select
                  value={editingFixture.stage}
                  onChange={(e) =>
                    setEditingFixture({
                      ...editingFixture,
                      stage: e.target.value as 'group' | 'semifinal' | 'final',
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value="group">Group Stage</option>
                  <option value="semifinal">Semi-Final</option>
                  <option value="final">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Round Label
                </label>
                <input
                  type="text"
                  value={editingFixture.round || ''}
                  onChange={(e) =>
                    setEditingFixture({ ...editingFixture, round: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Scheduled Timestamp
                </label>
                <input
                  type="text"
                  value={editingFixture.scheduled_at}
                  onChange={(e) =>
                    setEditingFixture({
                      ...editingFixture,
                      scheduled_at: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Status
                </label>
                <select
                  value={editingFixture.status}
                  onChange={(e) =>
                    setEditingFixture({
                      ...editingFixture,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={editingFixture.venue || ''}
                  onChange={(e) =>
                    setEditingFixture({ ...editingFixture, venue: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setEditingFixture(null)}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete Confirmation with Permission Guard ── */}
      {deletingFixture && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border-2 border-live-red p-6 rounded shadow-2xl">
            <div className="flex items-center gap-3 text-live-red mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-display uppercase text-lg">
                CONFIRM FIXTURE DELETION
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-fog-text mb-4">
              You are deleting the fixture:{' '}
              <strong className="text-white">
                {deletingFixture.game?.name} ({deletingFixture.round})
              </strong>
              .
              {deletingFixture.status === 'completed' && (
                <span className="block mt-2 text-live-red font-bold">
                  Warning: This match is completed. Deleting it will automatically deduct earned points and recompute batch standings!
                </span>
              )}
            </p>

            <div className="mb-5 p-3 bg-navy-mid/60 border border-outline-variant/30 rounded">
              <label className="block text-xs font-caps-label text-white uppercase mb-1 font-bold">
                Security Permission Check:
              </label>
              <p className="text-[11px] text-fog-text mb-2">
                Type <span className="text-live-red font-mono font-bold">DELETE</span> to confirm removal.
              </p>
              <input
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-live-red/50 rounded text-white text-xs font-mono tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingFixture(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="px-5 py-2 bg-live-red text-white font-caps-label text-xs uppercase font-bold hover:bg-white hover:text-live-red disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Delete Fixture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Filters ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'scheduled', 'live', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-caps-label uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
              statusFilter === status
                ? 'bg-gold-accent text-navy-deep border-gold-accent font-bold'
                : 'bg-surface-container text-fog-text border-outline-variant/30 hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* ── Fixtures Table ── */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SPORT &amp; ROUND</th>
              <th className="p-3.5">MATCHUP</th>
              <th className="p-3.5">TIME &amp; VENUE</th>
              <th className="p-3.5">STATUS</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {filteredFixtures.map((f) => (
              <tr key={f.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5">
                  <div className="font-display text-white text-base">
                    {f.game?.name}
                  </div>
                  <div className="text-[11px] font-caps-label text-gold-accent uppercase">
                    {f.round} &bull; {f.stage}
                  </div>
                </td>
                <td className="p-3.5 text-white font-caps-label">
                  {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                  {f.team_b?.name || f.player_b?.name || 'TBD'}
                </td>
                <td className="p-3.5 text-fog-text">
                  <div className="font-table-numeral text-white">
                    {fixtureDate(f.scheduled_at)} &bull; {fixtureTime(f.scheduled_at)}
                  </div>
                  <div className="text-xs text-outline-variant">{f.venue}</div>
                </td>
                <td className="p-3.5">
                  <select
                    value={f.status}
                    onChange={(e) => handleStatusChange(f.id, e.target.value)}
                    className="bg-surface-container-lowest border border-outline-variant/40 rounded text-xs px-2 py-1 text-white font-caps-label uppercase"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFixture(f);
                      setIsCreating(false);
                    }}
                    className="px-2.5 py-1 text-xs font-caps-label uppercase bg-surface-container-highest text-gold-accent hover:bg-gold-accent hover:text-navy-deep rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingFixture(f);
                      setDeleteConfirmText('');
                    }}
                    className="px-2.5 py-1 text-xs font-caps-label uppercase bg-surface-container-highest text-live-red hover:bg-live-red hover:text-white rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
