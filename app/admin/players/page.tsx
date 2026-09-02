'use client';

import { useState, useEffect } from 'react';
import { createPlayer, updatePlayer, deletePlayer } from '@/app/actions/roster';
import { MOCK_BATCHES } from '@/lib/mock-data';

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([
    { id: 'p-1', name: 'Bilal Ahmed', roll_no: '24SW01', batch_id: MOCK_BATCHES[2].id, batch: '24SW', gender: 'boys' },
    { id: 'p-2', name: 'Zaid Khan', roll_no: '23AI05', batch_id: MOCK_BATCHES[5].id, batch: '23AI', gender: 'boys' },
    { id: 'p-3', name: 'Ayesha Raza', roll_no: '24SW44', batch_id: MOCK_BATCHES[2].id, batch: '24SW', gender: 'girls' },
    { id: 'p-4', name: 'Maryam Soomro', roll_no: '23AI28', batch_id: MOCK_BATCHES[5].id, batch: '23AI', gender: 'girls' },
    { id: 'p-5', name: 'Shahmeer Tariq', roll_no: '24SW15', batch_id: MOCK_BATCHES[2].id, batch: '24SW', gender: 'boys' },
    { id: 'p-6', name: 'Usman Ali', roll_no: '23AI12', batch_id: MOCK_BATCHES[5].id, batch: '23AI', gender: 'boys' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<any | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    roll_no: '',
    batch_id: MOCK_BATCHES[2].id,
    gender: 'boys' as 'boys' | 'girls',
  });

  // Load real players on mount
  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch('/api/players');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPlayers(
              data.map((p: any) => ({
                id: p.id,
                name: p.name,
                roll_no: p.roll_no || 'Pending',
                batch_id: p.batch_id,
                batch: p.batch?.code || MOCK_BATCHES.find((b) => b.id === p.batch_id)?.code || 'Batch',
                gender: p.gender,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load players', err);
      }
    }
    loadPlayers();
  }, []);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return;

    setFeedback('Registering athlete into database...');
    const res = await createPlayer(formData);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Optimistically added)`);
    } else {
      setFeedback('Athlete registered into batch roster!');
    }

    const b = MOCK_BATCHES.find((x) => x.id === formData.batch_id);

    setPlayers([
      {
        id: res.data?.id || `p-new-${Date.now()}`,
        name: formData.name,
        roll_no: formData.roll_no || 'Pending',
        batch_id: formData.batch_id,
        batch: b?.code || 'Batch',
        gender: formData.gender,
      },
      ...players,
    ]);

    setIsAdding(false);
    setFormData({ name: '', roll_no: '', batch_id: MOCK_BATCHES[2].id, gender: 'boys' });
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleUpdatePlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlayer) return;

    setFeedback(`Updating athlete ${editingPlayer.name}...`);
    const res = await updatePlayer(editingPlayer.id, {
      name: editingPlayer.name,
      roll_no: editingPlayer.roll_no,
      batch_id: editingPlayer.batch_id,
      gender: editingPlayer.gender,
    });

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Updated locally)`);
    } else {
      setFeedback('Athlete details updated successfully!');
    }

    const b = MOCK_BATCHES.find((x) => x.id === editingPlayer.batch_id);

    setPlayers(
      players.map((p) =>
        p.id === editingPlayer.id
          ? {
              ...editingPlayer,
              batch: b?.code || p.batch,
            }
          : p
      )
    );
    setEditingPlayer(null);
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleConfirmDelete() {
    if (!deletingPlayer) return;
    if (deleteConfirmInput.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm permission to remove this athlete.');
      return;
    }

    setFeedback(`Deleting athlete ${deletingPlayer.name}...`);
    const res = await deletePlayer(deletingPlayer.id);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Removed locally)`);
    } else {
      setFeedback('Athlete removed from batch roster.');
    }

    setPlayers(players.filter((p) => p.id !== deletingPlayer.id));
    setDeletingPlayer(null);
    setDeleteConfirmInput('');
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            REGISTERED ATHLETES &amp; PLAYERS
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Student athlete rosters across Software Engineering and AI batches with full administrative control
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingPlayer(null);
          }}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">{isAdding ? 'close' : 'add'}</span>
          <span>{isAdding ? 'Cancel' : 'Register New Player'}</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Add Player Form ── */}
      {isAdding && (
        <form
          onSubmit={handleAddPlayer}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-4">
            ATHLETE REGISTRATION
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Student Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Asad Memon"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g. 24SW88"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-mono"
              />
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
                Gender
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
            Save Player
          </button>
        </form>
      )}

      {/* ── Edit Player Modal ── */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdatePlayer}
            className="w-full max-w-lg bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <h3 className="font-display text-gold-accent uppercase text-lg">
                EDIT ATHLETE: {editingPlayer.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="text-fog-text hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Student Full Name
                </label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={editingPlayer.roll_no || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, roll_no: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Batch
                </label>
                <select
                  value={editingPlayer.batch_id}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, batch_id: e.target.value })}
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
                  Gender
                </label>
                <select
                  value={editingPlayer.gender}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, gender: e.target.value as any })}
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
                onClick={() => setEditingPlayer(null)}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white"
              >
                Update Athlete
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete Confirmation with Permission Guard ── */}
      {deletingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border-2 border-live-red p-6 rounded shadow-2xl">
            <div className="flex items-center gap-3 text-live-red mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-display uppercase text-lg">
                CONFIRM ATHLETE DELETION
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-fog-text mb-4">
              You are deleting athlete <strong className="text-white">{deletingPlayer.name}</strong> ({deletingPlayer.roll_no} &bull; {deletingPlayer.batch}).
              This removes the athlete from squad rosters and individual fixtures.
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
                  setDeletingPlayer(null);
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
                Delete Athlete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Players Table ── */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">ATHLETE NAME</th>
              <th className="p-3.5">ROLL NO</th>
              <th className="p-3.5">BATCH</th>
              <th className="p-3.5">CATEGORY</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5 font-bold text-white font-caps-label">
                  {p.name}
                </td>
                <td className="p-3.5 text-fog-text font-mono">
                  {p.roll_no}
                </td>
                <td className="p-3.5 text-gold-accent font-display text-base">
                  {p.batch}
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-caps-label uppercase bg-surface-container-high text-fog-text">
                    {p.gender}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlayer(p);
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
                      setDeletingPlayer(p);
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
