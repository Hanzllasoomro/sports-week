'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPlayer, updatePlayer, deletePlayer, scanAllDuplicatePlayers, registerPlayersFromTeamList } from '@/app/actions/roster';
import { MOCK_BATCHES } from '@/lib/mock-data';

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<any | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Duplicate Player Audit State
  const [isAuditingDuplicates, setIsAuditingDuplicates] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    scanned: boolean;
    totalCount: number;
    duplicateBothCount: number;
    duplicateRollCount: number;
    exactMatches: any[];
    rollConflicts: any[];
  }>({
    scanned: false,
    totalCount: 0,
    duplicateBothCount: 0,
    duplicateRollCount: 0,
    exactMatches: [],
    rollConflicts: [],
  });

  const [formData, setFormData] = useState({
    name: '',
    roll_no: '',
    batch_id: MOCK_BATCHES[2].id,
    gender: 'boys' as 'boys' | 'girls',
  });

  // Team List Import State
  const [isImportingTeamList, setIsImportingTeamList] = useState(false);
  const [importTeamListText, setImportTeamListText] = useState('');
  const [importBatchId, setImportBatchId] = useState(MOCK_BATCHES[2].id);
  const [importGender, setImportGender] = useState<'boys' | 'girls'>('boys');
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  // Normalization helpers for duplicate detection
  const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanName = (s: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

  // Real-time check for Add Form
  const addDuplicateMatch =
    formData.name.trim() && formData.roll_no.trim()
      ? players.find(
          (p) =>
            cleanName(p.name) === cleanName(formData.name) &&
            cleanStr(p.roll_no) === cleanStr(formData.roll_no)
        )
      : null;

  const addRollConflict =
    !addDuplicateMatch && formData.roll_no.trim()
      ? players.find((p) => cleanStr(p.roll_no) === cleanStr(formData.roll_no))
      : null;

  // Real-time check for Edit Modal
  const editDuplicateMatch =
    editingPlayer && editingPlayer.name?.trim() && editingPlayer.roll_no?.trim()
      ? players.find(
          (p) =>
            p.id !== editingPlayer.id &&
            cleanName(p.name) === cleanName(editingPlayer.name) &&
            cleanStr(p.roll_no) === cleanStr(editingPlayer.roll_no)
        )
      : null;

  const editRollConflict =
    !editDuplicateMatch && editingPlayer && editingPlayer.roll_no?.trim()
      ? players.find(
          (p) =>
            p.id !== editingPlayer.id &&
            cleanStr(p.roll_no) === cleanStr(editingPlayer.roll_no)
        )
      : null;

  // Real-time Parser & Duplicate Analyzer for Team List
  const parsedImportList = useMemo(() => {
    if (!importTeamListText.trim()) return [];
    const lines = importTeamListText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    return lines.map((line) => {
      let clean = line.replace(/^\s*(?:#?\d+[\.\)\-:]\s*|[\-\*•]\s*)/, '').trim();
      let extractedName = clean;
      let extractedRoll: string | null = null;

      const rollRegex = /\b(2[0-9][- ]?(?:SW|BSAI|AI|CS|IT|EL|ES)[- ]?[0-9]{1,4})\b/i;
      const match = clean.match(rollRegex);

      if (match) {
        extractedRoll = match[1].replace(/[- ]/g, '').toUpperCase();
        extractedName = clean.replace(match[0], '').replace(/[\(\)\[\],\-\t|:]/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        const delimMatch = clean.match(/^(.*?)(?:[,\t\-|–—]|\s*\((.*?)\))\s*([A-Za-z0-9]+)?$/);
        if (delimMatch) {
          const part1 = (delimMatch[1] || '').trim();
          const part2 = (delimMatch[2] || delimMatch[3] || '').trim();
          if (part2 && /^[A-Za-z0-9]{3,10}$/.test(part2)) {
            extractedName = part1;
            extractedRoll = part2.toUpperCase();
          }
        }
      }

      const nName = cleanName(extractedName);
      const nRoll = extractedRoll ? cleanStr(extractedRoll) : null;

      // Check duplicate on BOTH Name and Roll Number
      const matchBoth = players.find(
        (p) => cleanName(p.name) === nName && nRoll && cleanStr(p.roll_no || '') === nRoll
      );
      if (matchBoth) {
        return {
          name: extractedName,
          roll_no: extractedRoll,
          status: 'already_registered' as const,
          matchedPlayer: matchBoth,
        };
      }

      // Check conflict on Roll Number
      if (nRoll) {
        const rollConflict = players.find(
          (p) => cleanStr(p.roll_no || '') === nRoll && cleanName(p.name) !== nName
        );
        if (rollConflict) {
          return {
            name: extractedName,
            roll_no: extractedRoll,
            status: 'roll_conflict' as const,
            conflictMessage: `Roll number ${extractedRoll} belongs to ${rollConflict.name} (${rollConflict.batch || 'Batch'})`,
            matchedPlayer: rollConflict,
          };
        }
      }

      // Check conflict on Name within batch
      const nameMatch = players.find(
        (p) => p.batch_id === importBatchId && cleanName(p.name) === nName
      );
      if (nameMatch) {
        return {
          name: extractedName,
          roll_no: extractedRoll,
          status: 'name_conflict' as const,
          conflictMessage: `Athlete named "${nameMatch.name}" already registered in this batch`,
          matchedPlayer: nameMatch,
        };
      }

      return {
        name: extractedName,
        roll_no: extractedRoll,
        status: 'new_player' as const,
      };
    });
  }, [importTeamListText, players, importBatchId]);

  const parsedImportSummary = useMemo(() => {
    const newCount = parsedImportList.filter((p) => p.status === 'new_player').length;
    const alreadyCount = parsedImportList.filter((p) => p.status === 'already_registered').length;
    const conflictCount = parsedImportList.filter((p) => p.status === 'roll_conflict' || p.status === 'name_conflict').length;
    return { newCount, alreadyCount, conflictCount };
  }, [parsedImportList]);

  async function handleImportTeamListSubmit() {
    if (parsedImportList.length === 0) return;

    setIsSubmittingImport(true);
    setFeedback('Registering unregistered players from team list...');

    const res = await registerPlayersFromTeamList({
      batch_id: importBatchId,
      gender: importGender,
      players: parsedImportList.map((p) => ({
        name: p.name,
        roll_no: p.roll_no,
      })),
    });

    if (res.error) {
      setFeedback(`Error: ${res.error.message}`);
      setIsSubmittingImport(false);
      return;
    }

    const data = res.data!;
    const b = MOCK_BATCHES.find((x) => x.id === importBatchId);

    const newlyAdded: any[] = data.players
      .filter((p) => p.status === 'newly_registered')
      .map((p) => ({
        id: p.id,
        name: p.name,
        roll_no: p.roll_no || 'Pending',
        batch_id: p.batch_id,
        batch: b?.code || 'Batch',
        gender: p.gender,
      }));

    if (newlyAdded.length > 0) {
      setPlayers([...newlyAdded, ...players]);
    }

    setIsSubmittingImport(false);
    setIsImportingTeamList(false);
    setImportTeamListText('');
    setFeedback(
      `Roster updated! ${data.newlyRegisteredCount} newly registered in database, ${data.alreadyRegisteredCount} matched & verified, ${data.conflictsCount} conflicts.`
    );
    setTimeout(() => setFeedback(null), 4500);
  }

  // Load real players on mount
  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch('/api/players');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
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

  // Run comprehensive duplicate audit
  async function handleRunAudit() {
    setIsScanning(true);
    setFeedback('Scanning entire athlete roster for matching names and roll numbers...');

    // 1. Client-side scan on current players list
    const bothMap = new Map<string, any[]>();
    for (const p of players) {
      const key = `${cleanName(p.name)}:::${cleanStr(p.roll_no)}`;
      if (!bothMap.has(key)) bothMap.set(key, []);
      bothMap.get(key)!.push(p);
    }
    const localExact = Array.from(bothMap.entries())
      .filter(([_, list]) => list.length > 1)
      .map(([_, list]) => ({
        key: `${list[0].name}_${list[0].roll_no}`,
        name: list[0].name,
        roll_no: list[0].roll_no,
        players: list,
      }));

    const rollMap = new Map<string, any[]>();
    for (const p of players) {
      const r = cleanStr(p.roll_no);
      if (r) {
        if (!rollMap.has(r)) rollMap.set(r, []);
        rollMap.get(r)!.push(p);
      }
    }
    const localRoll = Array.from(rollMap.entries())
      .filter(([_, list]) => list.length > 1)
      .map(([_, list]) => ({
        roll_no: list[0].roll_no,
        players: list,
      }));

    // 2. Server-side scan
    try {
      const serverRes = await scanAllDuplicatePlayers();
      setAuditResults({
        scanned: true,
        totalCount: serverRes.totalCount || players.length,
        duplicateBothCount: serverRes.duplicateBothCount || localExact.length,
        duplicateRollCount: serverRes.duplicateRollCount || localRoll.length,
        exactMatches: serverRes.exactMatches?.length ? serverRes.exactMatches : localExact,
        rollConflicts: serverRes.rollConflicts?.length ? serverRes.rollConflicts : localRoll,
      });
    } catch {
      setAuditResults({
        scanned: true,
        totalCount: players.length,
        duplicateBothCount: localExact.length,
        duplicateRollCount: localRoll.length,
        exactMatches: localExact,
        rollConflicts: localRoll,
      });
    }

    setIsScanning(false);
    setFeedback('Duplicate audit complete.');
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return;

    if (addDuplicateMatch) {
      alert(`Duplicate Error: An athlete named "${addDuplicateMatch.name}" with roll number "${addDuplicateMatch.roll_no}" is already registered in ${addDuplicateMatch.batch}.`);
      return;
    }

    setFeedback('Registering athlete into database...');
    const res = await createPlayer(formData);

    if (res.error) {
      setFeedback(`Note: ${res.error.message}`);
      return;
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

    if (editDuplicateMatch) {
      alert(`Conflict: Another athlete with name "${editDuplicateMatch.name}" and roll number "${editDuplicateMatch.roll_no}" already exists in ${editDuplicateMatch.batch}.`);
      return;
    }

    setFeedback(`Updating athlete ${editingPlayer.name}...`);
    const res = await updatePlayer(editingPlayer.id, {
      name: editingPlayer.name,
      roll_no: editingPlayer.roll_no,
      batch_id: editingPlayer.batch_id,
      gender: editingPlayer.gender,
    });

    if (res.error) {
      setFeedback(`Note: ${res.error.message}`);
      return;
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsAuditingDuplicates(!isAuditingDuplicates);
              if (!isAuditingDuplicates && !auditResults.scanned) {
                handleRunAudit();
              }
            }}
            className={`font-caps-label text-xs uppercase px-4 py-2.5 font-bold transition-colors cursor-pointer w-fit flex items-center gap-2 border ${
              isAuditingDuplicates
                ? 'bg-navy-mid text-gold-accent border-gold-accent'
                : 'border-gold-accent/40 text-gold-accent hover:bg-gold-accent hover:text-navy-deep'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isAuditingDuplicates ? 'visibility_off' : 'find_replace'}
            </span>
            <span>{isAuditingDuplicates ? 'Close Audit' : 'Check Duplicates'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsImportingTeamList(!isImportingTeamList);
              setIsAdding(false);
              setIsAuditingDuplicates(false);
            }}
            className={`font-caps-label text-xs uppercase px-4 py-2.5 font-bold transition-colors cursor-pointer w-fit flex items-center gap-2 border ${
              isImportingTeamList
                ? 'bg-navy-mid text-gold-accent border-gold-accent'
                : 'border-gold-accent/40 text-gold-accent hover:bg-gold-accent hover:text-navy-deep'
            }`}
          >
            <span className="material-symbols-outlined text-base">playlist_add_check</span>
            <span>{isImportingTeamList ? 'Close Importer' : 'Import Team List'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAdding(!isAdding);
              setIsImportingTeamList(false);
              setEditingPlayer(null);
            }}
            className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">{isAdding ? 'close' : 'add'}</span>
            <span>{isAdding ? 'Cancel' : 'Register New Player'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* ── DUPLICATE AUDIT CONSOLE ── */}
      {isAuditingDuplicates && (
        <div className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-2xl animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent text-2xl">manage_search</span>
                <h2 className="font-display text-white text-xl uppercase tracking-wide">
                  ATHLETE DUPLICATE AUDIT CONSOLE
                </h2>
              </div>
              <p className="font-body text-fog-text text-xs mt-1">
                Deep roster scan detecting duplicate athlete records matching player&apos;s full name &amp; roll number
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isScanning}
              className="bg-navy-mid border border-gold-accent/40 text-gold-accent hover:bg-gold-accent hover:text-navy-deep font-caps-label text-xs uppercase px-4 py-2 font-bold transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${isScanning ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isScanning ? 'Scanning Roster...' : 'Re-Run Live Scan'}</span>
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-navy-mid/60 border border-outline-variant/30 rounded">
              <span className="text-[11px] font-caps-label uppercase text-fog-text block">
                Total Athletes Scanned
              </span>
              <span className="font-display text-2xl text-white font-table-numeral mt-1 block">
                {auditResults.scanned ? auditResults.totalCount : players.length}
              </span>
              <span className="text-[10px] text-fog-text mt-0.5 block">Across all 9 academic batches</span>
            </div>

            <div className="p-4 bg-navy-mid/60 border border-outline-variant/30 rounded">
              <span className="text-[11px] font-caps-label uppercase text-fog-text block">
                Name &amp; Roll Number Matches
              </span>
              <span
                className={`font-display text-2xl font-table-numeral mt-1 block ${
                  auditResults.duplicateBothCount > 0 ? 'text-live-red font-bold' : 'text-win-green'
                }`}
              >
                {auditResults.duplicateBothCount}
              </span>
              <span className="text-[10px] text-fog-text mt-0.5 block">Identical name + roll number entries</span>
            </div>

            <div className="p-4 bg-navy-mid/60 border border-outline-variant/30 rounded">
              <span className="text-[11px] font-caps-label uppercase text-fog-text block">
                Roll Number Conflicts
              </span>
              <span
                className={`font-display text-2xl font-table-numeral mt-1 block ${
                  auditResults.duplicateRollCount > 0 ? 'text-gold-accent font-bold' : 'text-win-green'
                }`}
              >
                {auditResults.duplicateRollCount}
              </span>
              <span className="text-[10px] text-fog-text mt-0.5 block">Different names sharing same roll</span>
            </div>
          </div>

          {/* Audit Status / Results Display */}
          {auditResults.duplicateBothCount === 0 && auditResults.duplicateRollCount === 0 ? (
            <div className="p-5 bg-win-green/10 border border-win-green/30 rounded flex items-start gap-3">
              <span className="material-symbols-outlined text-win-green text-2xl">verified</span>
              <div>
                <h4 className="font-caps-label text-win-green uppercase font-bold text-xs">
                  Roster Integrity Verified: 100% Clean
                </h4>
                <p className="text-xs text-fog-text mt-0.5 leading-relaxed">
                  No duplicate athlete entries matching both player name and roll number were detected across the tournament database. All {players.length} athlete registrations are completely distinct.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-caps-label text-xs uppercase text-live-red font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">warning</span>
                <span>Duplicate Athlete Clusters Detected ({auditResults.exactMatches.length} Matches)</span>
              </h4>

              {auditResults.exactMatches.map((group, idx) => (
                <div key={idx} className="p-4 bg-navy-mid/80 border border-live-red/40 rounded space-y-3">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                    <span className="text-xs font-bold text-white uppercase font-caps-label">
                      Athlete: {group.name} &bull; Roll No: {group.roll_no}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-live-red/20 text-live-red text-[10px] font-bold font-caps-label uppercase">
                      {group.players.length} Duplicate Copies
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.players.map((p: any, pIdx: number) => (
                      <div
                        key={p.id}
                        className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{p.name}</div>
                          <div className="text-[11px] text-fog-text font-mono mt-0.5">
                            Roll: {p.roll_no} &bull; Batch: {p.batches?.code || p.batch || 'Batch'} ({p.gender})
                          </div>
                          <div className="text-[9px] text-fog-text/60 font-mono mt-0.5">ID: {p.id}</div>
                        </div>

                        {pIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingPlayer(p);
                              setDeleteConfirmInput('');
                            }}
                            className="px-2.5 py-1.5 bg-live-red/20 hover:bg-live-red hover:text-white text-live-red rounded text-[11px] font-caps-label uppercase font-bold transition-colors cursor-pointer"
                          >
                            Delete Duplicate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Team List Importer & Duplicate Checker ── */}
      {isImportingTeamList && (
        <div className="mb-8 p-6 bg-surface-container border-2 border-gold-accent/70 rounded shadow-2xl animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent text-2xl">playlist_add_check</span>
              <div>
                <h3 className="font-display text-white text-lg uppercase tracking-wide">
                  BULK ATHLETE REGISTRATION FROM TEAM LIST
                </h3>
                <p className="font-body text-fog-text text-xs">
                  Paste full team roster with names and roll numbers. Unregistered athletes will be registered automatically, with duplicate checks on roll number, name, or both.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsImportingTeamList(false)}
              className="text-fog-text hover:text-white"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Target Academic Batch
              </label>
              <select
                value={importBatchId}
                onChange={(e) => setImportBatchId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold"
              >
                {MOCK_BATCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.department.code} - Year {b.year})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Gender Division
              </label>
              <select
                value={importGender}
                onChange={(e) => setImportGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1 font-bold">
                Paste / Enter Player List (One athlete per line)
              </label>
              <textarea
                rows={8}
                value={importTeamListText}
                onChange={(e) => setImportTeamListText(e.target.value)}
                placeholder={`1. Asad Memon - 24SW048\n2. Bilal Khan, 24SW12\n3. Farhan Ali (24SW33)\n4. Zubair Ahmed\t24SW99\n5. Tariq Shah`}
                className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-mono focus:border-gold-accent focus:outline-none"
              />
              <span className="text-[10px] text-fog-text block mt-1">
                Accepts lines with dashes, commas, tabs, parentheses or plain names.
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-caps-label text-fog-text uppercase font-bold">
                  Live Duplicate Verification ({parsedImportList.length} Athletes)
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-caps-label">
                  <span className="px-2 py-0.5 rounded bg-win-green/20 text-win-green font-bold">
                    {parsedImportSummary.newCount} New
                  </span>
                  <span className="px-2 py-0.5 rounded bg-navy-mid text-gold-accent font-bold border border-gold-accent/30">
                    {parsedImportSummary.alreadyCount} Registered
                  </span>
                  {parsedImportSummary.conflictCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-live-red/20 text-live-red font-bold">
                      {parsedImportSummary.conflictCount} Conflicts
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 bg-surface-container-lowest/60 p-2 rounded border border-outline-variant/20">
                {parsedImportList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-fog-text italic">
                    Paste athlete names &amp; roll numbers to preview real-time registration &amp; duplicate check status.
                  </div>
                ) : (
                  parsedImportList.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-surface-container rounded border border-outline-variant/20 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-fog-text w-4">{idx + 1}.</span>
                        <span className="font-bold text-white truncate">{entry.name}</span>
                        <span className="text-[10px] text-fog-text font-mono">
                          ({entry.roll_no || 'No roll no'})
                        </span>
                      </div>

                      <div className="shrink-0">
                        {entry.status === 'already_registered' && (
                          <span className="px-2 py-0.5 rounded bg-navy-mid text-gold-accent text-[10px] font-caps-label font-bold border border-gold-accent/40 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            <span>Already Registered</span>
                          </span>
                        )}
                        {entry.status === 'new_player' && (
                          <span className="px-2 py-0.5 rounded bg-win-green/20 text-win-green text-[10px] font-caps-label font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person_add</span>
                            <span>Will Register</span>
                          </span>
                        )}
                        {entry.status === 'roll_conflict' && (
                          <span
                            title={entry.conflictMessage}
                            className="px-2 py-0.5 rounded bg-live-red/20 text-live-red text-[10px] font-caps-label font-bold flex items-center gap-1 cursor-help"
                          >
                            <span className="material-symbols-outlined text-xs">warning</span>
                            <span>Roll Conflict</span>
                          </span>
                        )}
                        {entry.status === 'name_conflict' && (
                          <span
                            title={entry.conflictMessage}
                            className="px-2 py-0.5 rounded bg-gold-accent/20 text-gold-accent text-[10px] font-caps-label font-bold flex items-center gap-1 cursor-help"
                          >
                            <span className="material-symbols-outlined text-xs">info</span>
                            <span>Same Name</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={handleImportTeamListSubmit}
                  disabled={isSubmittingImport || parsedImportList.length === 0}
                  className="px-5 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-extrabold rounded hover:bg-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isSubmittingImport ? 'sync' : 'how_to_reg'}
                  </span>
                  <span>
                    {isSubmittingImport ? 'Registering Athletes...' : 'Register Unregistered Athletes'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Player Form ── */}
      {isAdding && (
        <form
          onSubmit={handleAddPlayer}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg mb-2">
            ATHLETE REGISTRATION
          </h3>
          <p className="text-xs text-fog-text mb-4">
            Register a new student athlete into the official tournament roster. Real-time duplicate verification is active.
          </p>

          {/* Real-time duplicate warnings */}
          {addDuplicateMatch && (
            <div className="mb-4 p-3 bg-live-red/20 border border-live-red/50 rounded text-xs text-live-red font-caps-label flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>
                Duplicate Athlete Conflict: &quot;{addDuplicateMatch.name}&quot; with roll number &quot;{addDuplicateMatch.roll_no}&quot; is already registered in {addDuplicateMatch.batch}!
              </span>
            </div>
          )}

          {addRollConflict && (
            <div className="mb-4 p-3 bg-gold-accent/20 border border-gold-accent/50 rounded text-xs text-gold-accent font-caps-label flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              <span>
                Roll Number Already Assigned: Roll number &quot;{addRollConflict.roll_no}&quot; belongs to &quot;{addRollConflict.name}&quot; in {addRollConflict.batch}.
              </span>
            </div>
          )}

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
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent focus:border-gold-accent focus:outline-none"
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
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-mono focus:border-gold-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Batch
              </label>
              <select
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
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
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs focus:border-gold-accent focus:outline-none"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={!!addDuplicateMatch}
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Real-time duplicate warnings for Edit */}
            {editDuplicateMatch && (
              <div className="mb-4 p-3 bg-live-red/20 border border-live-red/50 rounded text-xs text-live-red font-caps-label flex items-center gap-2">
                <span className="material-symbols-outlined text-base">warning</span>
                <span>
                  Duplicate Athlete Conflict: Another athlete &quot;{editDuplicateMatch.name}&quot; with roll number &quot;{editDuplicateMatch.roll_no}&quot; is already registered in {editDuplicateMatch.batch}!
                </span>
              </div>
            )}

            {editRollConflict && (
              <div className="mb-4 p-3 bg-gold-accent/20 border border-gold-accent/50 rounded text-xs text-gold-accent font-caps-label flex items-center gap-2">
                <span className="material-symbols-outlined text-base">info</span>
                <span>
                  Roll Number In Use: Roll number &quot;{editRollConflict.roll_no}&quot; is already assigned to &quot;{editRollConflict.name}&quot; in {editRollConflict.batch}.
                </span>
              </div>
            )}

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
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!editDuplicateMatch}
                className="px-5 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
