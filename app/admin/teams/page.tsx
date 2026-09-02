'use client';

import { useState } from 'react';
import { createTeam } from '@/app/actions/roster';
import { MOCK_BATCHES, MOCK_GAMES } from '@/lib/mock-data';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([
    { id: 't-1', name: '24SW Strikers', game: 'Cricket', batch: '24SW', gender: 'boys' },
    { id: 't-2', name: '23AI Titans', game: 'Cricket', batch: '23AI', gender: 'boys' },
    { id: 't-3', name: '23SW United', game: 'Futsal', batch: '23SW', gender: 'boys' },
    { id: 't-4', name: '24AI FC', game: 'Futsal', batch: '24AI', gender: 'boys' },
    { id: 't-5', name: '24SW Phoenix', game: 'Throwball', batch: '24SW', gender: 'girls' },
    { id: 't-6', name: '22SW Legends', game: 'Throwball', batch: '22SW', gender: 'girls' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    game_id: MOCK_GAMES[0].id,
    batch_id: MOCK_BATCHES[2].id,
    gender: 'boys' as 'boys' | 'girls',
  });

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return;

    setFeedback('Creating team...');
    const res = await createTeam(formData);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Optimistically added)`);
    } else {
      setFeedback('Team registered!');
    }

    const g = MOCK_GAMES.find((x) => x.id === formData.game_id);
    const b = MOCK_BATCHES.find((x) => x.id === formData.batch_id);

    setTeams([
      ...teams,
      {
        id: `t-new-${Date.now()}`,
        name: formData.name,
        game: g?.name || 'Sport',
        batch: b?.code || 'Batch',
        gender: formData.gender,
      },
    ]);

    setIsAdding(false);
    setFormData({ name: '', game_id: MOCK_GAMES[0].id, batch_id: MOCK_BATCHES[2].id, gender: 'boys' });
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            MANAGE BATCH TEAMS
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Registered squads per sport and batch for team championships
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">{isAdding ? 'close' : 'add'}</span>
          <span>{isAdding ? 'Cancel' : 'Create Squad / Team'}</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent">
          {feedback}
        </div>
      )}

      {isAdding && (
        <form
          onSubmit={handleAddTeam}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-4">
            REGISTER SQUAD
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Squad / Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. 24SW Strikers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
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
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
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
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
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

      {/* Teams Table */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SQUAD NAME</th>
              <th className="p-3.5">SPORT</th>
              <th className="p-3.5">BATCH</th>
              <th className="p-3.5">CATEGORY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {teams.map((t) => (
              <tr key={t.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5 font-bold text-white font-caps-label">
                  {t.name}
                </td>
                <td className="p-3.5 text-gold-accent">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
