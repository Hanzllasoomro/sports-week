'use client';

import { useState } from 'react';
import { createGame, updateGame, deleteGame } from '@/app/actions/admin';
import { MOCK_GAMES } from '@/lib/mock-data';
import type { Game } from '@/types';

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [isAdding, setIsAdding] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    format: 'team' as 'team' | 'individual',
    gender: 'both' as 'boys' | 'girls' | 'both',
  });

  async function handleAddGame(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;

    setFeedback('Adding championship sport...');
    const res = await createGame(formData);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Optimistically added)`);
    } else {
      setFeedback('Sport added to tournament catalog!');
    }

    const newGame: Game = {
      id: `g-new-${Date.now()}`,
      ...formData,
    };

    setGames([...games, newGame]);
    setIsAdding(false);
    setFormData({ name: '', slug: '', format: 'team', gender: 'both' });
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleUpdateGame(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGame) return;

    setFeedback(`Updating ${editingGame.name}...`);
    const res = await updateGame(editingGame.id, {
      name: editingGame.name,
      slug: editingGame.slug,
      format: editingGame.format,
      gender: editingGame.gender,
    });

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Updated locally)`);
    } else {
      setFeedback('Sport updated successfully!');
    }

    setGames(games.map((g) => (g.id === editingGame.id ? editingGame : g)));
    setEditingGame(null);
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleConfirmDelete() {
    if (!deletingGame) return;
    if (deleteConfirmationInput.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm permission to remove this sport.');
      return;
    }

    setFeedback(`Deleting ${deletingGame.name}...`);
    const res = await deleteGame(deletingGame.id);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Removed locally)`);
    } else {
      setFeedback('Sport removed from tournament catalog.');
    }

    setGames(games.filter((g) => g.id !== deletingGame.id));
    setDeletingGame(null);
    setDeleteConfirmationInput('');
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            MANAGE GAMES &amp; SPORTS
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Configure official tournament sports, team formats, eligibility, and rules
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingGame(null);
          }}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">{isAdding ? 'close' : 'add'}</span>
          <span>{isAdding ? 'Cancel' : 'Add New Sport'}</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent">
          {feedback}
        </div>
      )}

      {/* ── Add Game Form ── */}
      {isAdding && (
        <form
          onSubmit={handleAddGame}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-4">
            ADD NEW SPORT TO CATALOG
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Sport Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dodgeball"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="team">Team Sport</option>
                <option value="individual">Individual Sport</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Gender Category
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="both">Both (Boys &amp; Girls)</option>
                <option value="boys">Boys Only</option>
                <option value="girls">Girls Only</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer"
          >
            Save Sport
          </button>
        </form>
      )}

      {/* ── Edit Game Modal ── */}
      {editingGame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateGame}
            className="w-full max-w-xl bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <h3 className="font-display text-gold-accent uppercase text-lg">
                EDIT SPORT: {editingGame.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingGame(null)}
                className="text-fog-text hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Sport Name
                </label>
                <input
                  type="text"
                  value={editingGame.name}
                  onChange={(e) =>
                    setEditingGame({ ...editingGame, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={editingGame.slug}
                  onChange={(e) =>
                    setEditingGame({ ...editingGame, slug: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Format
                </label>
                <select
                  value={editingGame.format}
                  onChange={(e) =>
                    setEditingGame({
                      ...editingGame,
                      format: e.target.value as 'team' | 'individual',
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value="team">Team Sport</option>
                  <option value="individual">Individual Sport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                  Gender Category
                </label>
                <select
                  value={editingGame.gender}
                  onChange={(e) =>
                    setEditingGame({
                      ...editingGame,
                      gender: e.target.value as 'boys' | 'girls' | 'both',
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value="both">Both (Boys &amp; Girls)</option>
                  <option value="boys">Boys Only</option>
                  <option value="girls">Girls Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setEditingGame(null)}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white"
              >
                Update Sport
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete Confirmation with Permission Prompt ── */}
      {deletingGame && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border-2 border-live-red p-6 rounded shadow-2xl">
            <div className="flex items-center gap-3 text-live-red mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-display uppercase text-lg">
                CONFIRM SPORT DELETION
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-fog-text mb-4">
              You are about to delete <strong className="text-white">{deletingGame.name}</strong>.
              This will remove the sport from all tournament catalogs.
            </p>

            <div className="mb-5 p-3 bg-navy-mid/60 border border-outline-variant/30 rounded">
              <label className="block text-xs font-caps-label text-white uppercase mb-1 font-bold">
                Security Permission Check:
              </label>
              <p className="text-[11px] text-fog-text mb-2">
                Type <span className="text-live-red font-mono font-bold">DELETE</span> to grant permission.
              </p>
              <input
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-live-red/50 rounded text-white text-xs font-mono tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingGame(null);
                  setDeleteConfirmationInput('');
                }}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmationInput.trim().toUpperCase() !== 'DELETE'}
                className="px-5 py-2 bg-live-red text-white font-caps-label text-xs uppercase font-bold hover:bg-white hover:text-live-red disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Delete Sport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Games List Table ── */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SPORT NAME</th>
              <th className="p-3.5">SLUG</th>
              <th className="p-3.5">FORMAT</th>
              <th className="p-3.5">CATEGORY</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {games.map((g) => (
              <tr key={g.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5 font-display text-white text-base">
                  {g.name}
                </td>
                <td className="p-3.5 text-fog-text font-table-numeral">
                  {g.slug}
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-caps-label uppercase font-bold ${
                      g.format === 'team'
                        ? 'bg-gold-accent/20 text-gold-accent border border-gold-accent/40'
                        : 'bg-primary/20 text-primary border border-primary/40'
                    }`}
                  >
                    {g.format}
                  </span>
                </td>
                <td className="p-3.5 text-fog-text font-caps-label uppercase">
                  {g.gender}
                </td>
                <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGame(g);
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
                      setDeletingGame(g);
                      setDeleteConfirmationInput('');
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
