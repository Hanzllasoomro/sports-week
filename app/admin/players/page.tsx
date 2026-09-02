'use client';

import { useState } from 'react';
import { createPlayer } from '@/app/actions/roster';
import { MOCK_BATCHES } from '@/lib/mock-data';

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState([
    { id: 'p-1', name: 'Bilal Ahmed', roll_no: '24SW01', batch: '24SW', gender: 'boys' },
    { id: 'p-2', name: 'Zaid Khan', roll_no: '23AI05', batch: '23AI', gender: 'boys' },
    { id: 'p-3', name: 'Ayesha Raza', roll_no: '24SW44', batch: '24SW', gender: 'girls' },
    { id: 'p-4', name: 'Maryam Soomro', roll_no: '23AI28', batch: '23AI', gender: 'girls' },
    { id: 'p-5', name: 'Shahmeer Tariq', roll_no: '24SW15', batch: '24SW', gender: 'boys' },
    { id: 'p-6', name: 'Usman Ali', roll_no: '23AI12', batch: '23AI', gender: 'boys' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    roll_no: '',
    batch_id: MOCK_BATCHES[2].id,
    gender: 'boys' as 'boys' | 'girls',
  });

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return;

    setFeedback('Registering athlete...');
    const res = await createPlayer(formData);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Optimistically added)`);
    } else {
      setFeedback('Athlete registered into batch roster!');
    }

    const b = MOCK_BATCHES.find((x) => x.id === formData.batch_id);

    setPlayers([
      ...players,
      {
        id: `p-new-${Date.now()}`,
        name: formData.name,
        roll_no: formData.roll_no || 'Pending',
        batch: b?.code || 'Batch',
        gender: formData.gender,
      },
    ]);

    setIsAdding(false);
    setFormData({ name: '', roll_no: '', batch_id: MOCK_BATCHES[2].id, gender: 'boys' });
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            REGISTERED ATHLETES &amp; PLAYERS
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Student athlete rosters across Software Engineering and AI batches
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">{isAdding ? 'close' : 'add'}</span>
          <span>{isAdding ? 'Cancel' : 'Register New Player'}</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent">
          {feedback}
        </div>
      )}

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
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Student Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Asad Memon"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g. 24SW88"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
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

      {/* Players Table */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">ATHLETE NAME</th>
              <th className="p-3.5">ROLL NO</th>
              <th className="p-3.5">BATCH</th>
              <th className="p-3.5">CATEGORY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5 font-bold text-white font-caps-label">
                  {p.name}
                </td>
                <td className="p-3.5 text-fog-text font-table-numeral">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
