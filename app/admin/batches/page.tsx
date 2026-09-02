'use client';

import { useState } from 'react';
import { createBatch } from '@/app/actions/admin';
import { MOCK_BATCHES, MOCK_DEPARTMENTS } from '@/lib/mock-data';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState(MOCK_BATCHES);
  const [code, setCode] = useState('');
  const [deptCode, setDeptCode] = useState<'SW' | 'AI'>('SW');
  const [year, setYear] = useState<number>(2025);
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;

    setFeedback('Adding batch...');
    const res = await createBatch(code, deptCode, year);

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Optimistically added locally)`);
    } else {
      setFeedback('Batch created successfully!');
    }

    const dept = MOCK_DEPARTMENTS.find((d) => d.code === deptCode)!;
    const newBatch = {
      id: `b-new-${Date.now()}`,
      code: code.toUpperCase(),
      department_id: dept.id,
      year,
      department: dept,
    };
    setBatches([...batches, newBatch]);
    setCode('');
    setIsAdding(false);
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            MANAGE BATCHES &amp; DEPARTMENTS
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Registered academic batches competing for the Sports Week trophy
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">{isAdding ? 'close' : 'add'}</span>
          <span>{isAdding ? 'Cancel' : 'Register New Batch'}</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent">
          {feedback}
        </div>
      )}

      {isAdding && (
        <form
          onSubmit={handleAddBatch}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-4">
            ADD NEW ACADEMIC BATCH
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Batch Code
              </label>
              <input
                type="text"
                placeholder="e.g. 27SW"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Department
              </label>
              <select
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="SW">Software Engineering (SW)</option>
                <option value="AI">Artificial Intelligence (AI)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                Class Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer"
          >
            Save Batch
          </button>
        </form>
      )}

      {/* Batches Table */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">BATCH CODE</th>
              <th className="p-3.5">DEPARTMENT</th>
              <th className="p-3.5">CLASS YEAR</th>
              <th className="p-3.5">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5 font-display text-gold-accent text-lg">
                  {b.code}
                </td>
                <td className="p-3.5 text-white font-caps-label">
                  {b.department.name} ({b.department.code})
                </td>
                <td className="p-3.5 text-fog-text font-table-numeral">
                  {b.year}
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-caps-label uppercase bg-win-green/20 text-win-green border border-win-green/40">
                    Contesting
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
