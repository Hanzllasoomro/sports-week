'use client';

import { useState, useEffect } from 'react';
import { createTeam, updateTeam, deleteTeam } from '@/app/actions/roster';
import { MOCK_BATCHES, MOCK_GAMES } from '@/lib/mock-data';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<any | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    game_id: MOCK_GAMES[0].id,
    batch_id: MOCK_BATCHES[2].id,
    gender: 'boys' as 'boys' | 'girls',
  });

  // Load real teams on mount
  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setTeams(
              data.map((t: any) => ({
                id: t.id,
                name: t.name,
                game_id: t.game_id || MOCK_GAMES[0].id,
                game: t.game?.name || MOCK_GAMES.find((g) => g.id === t.game_id)?.name || 'Team Sport',
                batch_id: t.batch_id,
                batch: t.batch?.code || MOCK_BATCHES.find((b) => b.id === t.batch_id)?.code || 'Batch',
                gender: t.gender,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load teams', err);
      }
    }
    loadTeams();
  }, []);

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return;

    setFeedback('Creating team in database...');
    const res = await createTeam(formData);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Optimistically added)`);
    } else {
      setFeedback('Squad registered successfully in tournament records!');
    }

    const g = MOCK_GAMES.find((x) => x.id === formData.game_id);
    const b = MOCK_BATCHES.find((x) => x.id === formData.batch_id);

    setTeams([
      {
        id: res.data?.id || `t-new-${Date.now()}`,
        name: formData.name,
        game_id: formData.game_id,
        game: g?.name || 'Sport',
        batch_id: formData.batch_id,
        batch: b?.code || 'Batch',
        gender: formData.gender,
      },
      ...teams,
    ]);

    setIsAdding(false);
    setFormData({ name: '', game_id: MOCK_GAMES[0].id, batch_id: MOCK_BATCHES[2].id, gender: 'boys' });
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleUpdateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTeam) return;

    setFeedback(`Updating squad ${editingTeam.name}...`);
    const res = await updateTeam(editingTeam.id, {
      name: editingTeam.name,
      game_id: editingTeam.game_id,
      batch_id: editingTeam.batch_id,
      gender: editingTeam.gender,
    });

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Updated locally)`);
    } else {
      setFeedback('Squad details updated successfully!');
    }

    const g = MOCK_GAMES.find((x) => x.id === editingTeam.game_id);
    const b = MOCK_BATCHES.find((x) => x.id === editingTeam.batch_id);

    setTeams(
      teams.map((t) =>
        t.id === editingTeam.id
          ? {
              ...editingTeam,
              game: g?.name || t.game,
              batch: b?.code || t.batch,
            }
          : t
      )
    );
    setEditingTeam(null);
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleConfirmDelete() {
    if (!deletingTeam) return;
    if (deleteConfirmInput.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm permission to remove this squad.');
      return;
    }

    setFeedback(`Deleting squad ${deletingTeam.name}...`);
    const res = await deleteTeam(deletingTeam.id);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Removed locally)`);
    } else {
      setFeedback('Squad removed from tournament records.');
    }

    setTeams(teams.filter((t) => t.id !== deletingTeam.id));
    setDeletingTeam(null);
    setDeleteConfirmInput('');
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            MANAGE BATCH TEAMS &amp; SQUADS
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Registered squads per sport and batch for team championships with full administrative control
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingTeam(null);
          }}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">{isAdding ? 'close' : 'add'}</span>
          <span>{isAdding ? 'Cancel' : 'Register New Squad'}</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Add Team Form ── */}
      {isAdding && (
        <form
          onSubmit={handleAddTeam}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-4">
            REGISTER NEW SQUAD
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Squad / Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. 24SW Strikers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Sport
              </label>
              <select
                value={formData.game_id}
                onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                {MOCK_GAMES.filter((g) => g.format === 'team').map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Batch
              </label>
              <select
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                {MOCK_BATCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.department.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Category
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer"
          >
            Save Squad
          </button>
        </form>
      )}

      {/* ── Edit Team Modal ── */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateTeam}
            className="w-full max-w-lg bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <h3 className="font-display text-gold-accent uppercase text-lg">
                EDIT SQUAD: {editingTeam.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-fog-text hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Squad Name
                </label>
                <input
                  type="text"
                  value={editingTeam.name}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Sport
                </label>
                <select
                  value={editingTeam.game_id}
                  onChange={(e) => setEditingTeam({ ...editingTeam, game_id: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  {MOCK_GAMES.filter((g) => g.format === 'team').map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Batch
                </label>
                <select
                  value={editingTeam.batch_id}
                  onChange={(e) => setEditingTeam({ ...editingTeam, batch_id: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  {MOCK_BATCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} ({b.department.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Category
                </label>
                <select
                  value={editingTeam.gender}
                  onChange={(e) => setEditingTeam({ ...editingTeam, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white"
              >
                Update Squad
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete Confirmation with Permission Guard ── */}
      {deletingTeam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border-2 border-live-red p-6 rounded shadow-2xl">
            <div className="flex items-center gap-3 text-live-red mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-display uppercase text-lg">
                CONFIRM SQUAD DELETION
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-fog-text mb-4">
              You are deleting squad <strong className="text-white">{deletingTeam.name}</strong> ({deletingTeam.batch} &bull; {deletingTeam.game}).
              This removes the squad from scheduled fixtures and rosters.
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
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-live-red/50 rounded text-white text-xs font-mono tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingTeam(null);
                  setDeleteConfirmInput('');
                }}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmInput.trim().toUpperCase() !== 'DELETE'}
                className="px-5 py-2 bg-live-red text-white font-caps-label text-xs uppercase font-bold hover:bg-white hover:text-live-red disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Delete Squad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Teams Table ── */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SQUAD NAME</th>
              <th className="p-3.5">SPORT</th>
              <th className="p-3.5">BATCH</th>
              <th className="p-3.5">CATEGORY</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {teams.map((t) => (
              <tr key={t.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5 font-bold text-white font-caps-label">
                  {t.name}
                </td>
                <td className="p-3.5 text-gold-accent font-caps-label">
                  {t.game}
                </td>
                <td className="p-3.5 text-white font-display text-base">
                  {t.batch}
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-caps-label uppercase bg-surface-container-high text-fog-text">
                    {t.gender}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeam(t);
                      setIsAdding(false);
                    }}
                    className="px-2.5 py-1 text-xs font-caps-label uppercase bg-surface-container-highest text-gold-accent hover:bg-gold-accent hover:text-navy-deep rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingTeam(t);
                      setDeleteConfirmInput('');
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
