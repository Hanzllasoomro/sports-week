'use client';

import { useState } from 'react';
import { createGame } from '@/app/actions/admin';
import { MOCK_GAMES } from '@/lib/mock-data';

export default function AdminGamesPage() {
  const [games, setGames] = useState(MOCK_GAMES);
  const [isAdding, setIsAdding] = useState(false);
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

    const newGame = {
      id: `g-new-${Date.now()}`,
      ...formData,
      icon: 'sports',
      description: `${formData.name} championship.`,
      rules: ['Standard university tournament rules apply.'],
    };

    setGames([...games, newGame]);
    setIsAdding(false);
    setFormData({ name: '', slug: '', format: 'team', gender: 'both' });
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
            Configure official tournament sports, team formats, and eligibility categories
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
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

      {/* Games List */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SPORT NAME</th>
              <th className="p-3.5">SLUG</th>
              <th className="p-3.5">FORMAT</th>
              <th className="p-3.5">CATEGORY</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
