'use client';

import { useState, useEffect, useMemo } from 'react';
import { createTeam, updateTeam, deleteTeam, createPlayer, registerPlayersFromTeamList, type TeamListPlayerInput } from '@/app/actions/roster';
import { MOCK_BATCHES, MOCK_GAMES } from '@/lib/mock-data';
import { getSquadRulesForGame } from '@/lib/constants/squad-rules';
import { cn } from '@/lib/utils';
import type { Player } from '@/types';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<any | null>(null);
  const [viewingSquadTeam, setViewingSquadTeam] = useState<any | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Search filter for available player pool in builder
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Format mode for racket sports (singles vs doubles/pair)
  const [teamFormatMode, setTeamFormatMode] = useState<'doubles' | 'singles'>('doubles');

  // Inline Quick Player Add state
  const [showQuickAddPlayer, setShowQuickAddPlayer] = useState(false);
  const [quickPlayerName, setQuickPlayerName] = useState('');
  const [quickPlayerRoll, setQuickPlayerRoll] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Team List Import & Duplicate Detection state
  const [showTeamListImport, setShowTeamListImport] = useState(false);
  const [teamListRawText, setTeamListRawText] = useState('');
  const [isProcessingTeamList, setIsProcessingTeamList] = useState(false);

  // Add Form State with squad selections
  const [formData, setFormData] = useState({
    name: '',
    game_id: MOCK_GAMES[0].id,
    batch_id: MOCK_BATCHES[2].id,
    gender: 'boys' as 'boys' | 'girls',
    playing_player_ids: [] as string[],
    optional_player_ids: [] as string[],
  });

  // Load real teams & registered players on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [teamsRes, playersRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/players'),
        ]);

        if (teamsRes.ok) {
          const data = await teamsRes.json();
          if (Array.isArray(data)) {
            setTeams(
              data.map((t: any) => ({
                id: t.id,
                name: t.name,
                game_id: t.game_id || MOCK_GAMES[0].id,
                game: t.game?.name || MOCK_GAMES.find((g) => g.id === t.game_id)?.name || 'Team Sport',
                game_slug: t.game?.slug || MOCK_GAMES.find((g) => g.id === t.game_id)?.slug || 'cricket',
                batch_id: t.batch_id,
                batch: t.batch?.code || MOCK_BATCHES.find((b) => b.id === t.batch_id)?.code || 'Batch',
                gender: t.gender,
                playing_player_ids: t.playing_player_ids || [],
                optional_player_ids: t.optional_player_ids || [],
                playing_players: t.playing_players || [],
                optional_players: t.optional_players || [],
                squad_count: t.squad_count || (t.playing_player_ids?.length || 0) + (t.optional_player_ids?.length || 0),
              }))
            );
          }
        }

        if (playersRes.ok) {
          const playData = await playersRes.json();
          if (Array.isArray(playData)) {
            setPlayers(playData);
          }
        }
      } catch (err) {
        console.error('Failed to load teams or players', err);
      }
    }
    loadData();
  }, []);

  // Compute active sport squad rules for active form (Add or Edit)
  const activeGameId = isAdding ? formData.game_id : editingTeam?.game_id;
  const activeGame = MOCK_GAMES.find((g) => g.id === activeGameId) || MOCK_GAMES[0];
  const squadRules = getSquadRulesForGame(activeGame.slug, teamFormatMode);

  const activeBatchId = isAdding ? formData.batch_id : editingTeam?.batch_id;
  const activeGender = isAdding ? formData.gender : editingTeam?.gender;

  // Filter pool of athletes registered for the selected batch
  const batchAthletes = players.filter((p) => {
    const matchesBatch = p.batch_id === activeBatchId || p.batch?.id === activeBatchId;
    const matchesGender = activeGame.gender === 'both' || p.gender === activeGender;
    return matchesBatch && matchesGender;
  });

  // Current selections
  const currentPlayingIds: string[] = isAdding
    ? formData.playing_player_ids
    : editingTeam?.playing_player_ids || [];
  const currentOptionalIds: string[] = isAdding
    ? formData.optional_player_ids
    : editingTeam?.optional_player_ids || [];

  const unassignedAthletes = batchAthletes.filter(
    (p) => !currentPlayingIds.includes(p.id) && !currentOptionalIds.includes(p.id)
  );

  const filteredUnassignedAthletes = unassignedAthletes.filter((p) => {
    if (!playerSearchQuery.trim()) return true;
    const q = playerSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.roll_no && p.roll_no.toLowerCase().includes(q));
  });

  // ── Squad Roster Manipulation Handlers ──
  function handleAddToPlaying(playerId: string) {
    if (currentPlayingIds.length >= squadRules.playingCount) return;
    if (isAdding) {
      setFormData((prev) => ({
        ...prev,
        playing_player_ids: [...prev.playing_player_ids, playerId],
        optional_player_ids: prev.optional_player_ids.filter((id) => id !== playerId),
      }));
    } else if (editingTeam) {
      setEditingTeam((prev: any) => ({
        ...prev,
        playing_player_ids: [...(prev.playing_player_ids || []), playerId],
        optional_player_ids: (prev.optional_player_ids || []).filter((id: string) => id !== playerId),
      }));
    }
  }

  function handleAddToOptional(playerId: string) {
    if (currentOptionalIds.length >= squadRules.optionalCount) return;
    if (isAdding) {
      setFormData((prev) => ({
        ...prev,
        optional_player_ids: [...prev.optional_player_ids, playerId],
        playing_player_ids: prev.playing_player_ids.filter((id) => id !== playerId),
      }));
    } else if (editingTeam) {
      setEditingTeam((prev: any) => ({
        ...prev,
        optional_player_ids: [...(prev.optional_player_ids || []), playerId],
        playing_player_ids: (prev.playing_player_ids || []).filter((id: string) => id !== playerId),
      }));
    }
  }

  function handleRemoveFromSquad(playerId: string) {
    if (isAdding) {
      setFormData((prev) => ({
        ...prev,
        playing_player_ids: prev.playing_player_ids.filter((id) => id !== playerId),
        optional_player_ids: prev.optional_player_ids.filter((id) => id !== playerId),
      }));
    } else if (editingTeam) {
      setEditingTeam((prev: any) => ({
        ...prev,
        playing_player_ids: (prev.playing_player_ids || []).filter((id: string) => id !== playerId),
        optional_player_ids: (prev.optional_player_ids || []).filter((id: string) => id !== playerId),
      }));
    }
  }

  function handlePromoteToPlaying(playerId: string) {
    if (currentPlayingIds.length >= squadRules.playingCount) return;
    if (isAdding) {
      setFormData((prev) => ({
        ...prev,
        optional_player_ids: prev.optional_player_ids.filter((id) => id !== playerId),
        playing_player_ids: [...prev.playing_player_ids, playerId],
      }));
    } else if (editingTeam) {
      setEditingTeam((prev: any) => ({
        ...prev,
        optional_player_ids: (prev.optional_player_ids || []).filter((id: string) => id !== playerId),
        playing_player_ids: [...(prev.playing_player_ids || []), playerId],
      }));
    }
  }

  function handleDemoteToOptional(playerId: string) {
    if (currentOptionalIds.length >= squadRules.optionalCount) return;
    if (isAdding) {
      setFormData((prev) => ({
        ...prev,
        playing_player_ids: prev.playing_player_ids.filter((id) => id !== playerId),
        optional_player_ids: [...prev.optional_player_ids, playerId],
      }));
    } else if (editingTeam) {
      setEditingTeam((prev: any) => ({
        ...prev,
        playing_player_ids: (prev.playing_player_ids || []).filter((id: string) => id !== playerId),
        optional_player_ids: [...(prev.optional_player_ids || []), playerId],
      }));
    }
  }

  // 1-Click Auto Fill from Available Batch Pool
  function handleAutoFillSquad() {
    const neededPlaying = squadRules.playingCount - currentPlayingIds.length;
    const neededOptional = squadRules.optionalCount - currentOptionalIds.length;

    const toAddPlaying = unassignedAthletes.slice(0, neededPlaying).map((p) => p.id);
    const remainingAfterPlaying = unassignedAthletes.slice(neededPlaying);
    const toAddOptional = remainingAfterPlaying.slice(0, neededOptional).map((p) => p.id);

    if (isAdding) {
      setFormData((prev) => ({
        ...prev,
        playing_player_ids: [...prev.playing_player_ids, ...toAddPlaying],
        optional_player_ids: [...prev.optional_player_ids, ...toAddOptional],
      }));
    } else if (editingTeam) {
      setEditingTeam((prev: any) => ({
        ...prev,
        playing_player_ids: [...(prev.playing_player_ids || []), ...toAddPlaying],
        optional_player_ids: [...(prev.optional_player_ids || []), ...toAddOptional],
      }));
    }
  }

  // Inline Quick Athlete Registration Handler with duplicate checking
  async function handleQuickAddAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!quickPlayerName.trim()) return;

    const cleanName = quickPlayerName.trim();
    const cleanRoll = quickPlayerRoll.trim();
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normName = cleanName.toLowerCase().replace(/\s+/g, ' ');

    // 1. Check if athlete is ALREADY registered with both name and roll_no
    const alreadyRegistered = players.find(
      (p) =>
        p.name.toLowerCase().replace(/\s+/g, ' ') === normName &&
        cleanRoll &&
        norm(p.roll_no || '') === norm(cleanRoll)
    );

    if (alreadyRegistered) {
      // Draft directly into squad lineup without creating duplicate
      if (currentPlayingIds.length < squadRules.playingCount) {
        handleAddToPlaying(alreadyRegistered.id);
      } else if (currentOptionalIds.length < squadRules.optionalCount) {
        handleAddToOptional(alreadyRegistered.id);
      }
      setQuickPlayerName('');
      setQuickPlayerRoll('');
      setShowQuickAddPlayer(false);
      setFeedback(`Athlete ${alreadyRegistered.name} is already registered. Added to squad lineup!`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    // 2. Check roll number duplication conflict
    if (cleanRoll) {
      const rollConflict = players.find(
        (p) => norm(p.roll_no || '') === norm(cleanRoll) && p.name.toLowerCase().replace(/\s+/g, ' ') !== normName
      );
      if (rollConflict) {
        const bCode = typeof rollConflict.batch === 'object' ? rollConflict.batch?.code : rollConflict.batch || 'Batch';
        alert(`Roll Number Conflict: Roll number "${cleanRoll}" is already assigned to "${rollConflict.name}" (${bCode}).`);
        return;
      }
    }

    setIsQuickAdding(true);
    const res = await createPlayer({
      name: cleanName,
      roll_no: cleanRoll || undefined,
      batch_id: activeBatchId,
      gender: activeGender,
    });

    if (res.error) {
      setFeedback(`Could not register athlete: ${res.error.message}`);
    } else {
      const newPlayer: Player = res.data || {
        id: `p-quick-${Date.now()}`,
        name: cleanName,
        roll_no: cleanRoll,
        batch_id: activeBatchId,
        gender: activeGender,
      };

      setPlayers((prev) => [...prev, newPlayer]);

      // Automatically slot into playing lineup if space exists, otherwise optional
      if (currentPlayingIds.length < squadRules.playingCount) {
        handleAddToPlaying(newPlayer.id);
      } else if (currentOptionalIds.length < squadRules.optionalCount) {
        handleAddToOptional(newPlayer.id);
      }

      setQuickPlayerName('');
      setQuickPlayerRoll('');
      setShowQuickAddPlayer(false);
      setFeedback(`Athlete ${newPlayer.name} registered and drafted into squad!`);
      setTimeout(() => setFeedback(null), 3000);
    }
    setIsQuickAdding(false);
  }

  // Real-time Parser & Duplicate Analyzer for Team List
  const parsedTeamList = useMemo(() => {
    if (!teamListRawText.trim()) return [];
    const lines = teamListRawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const normStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normNameStr = (s: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

    return lines.map((line) => {
      // Remove leading numbering e.g. "1.", "1)", "1 - ", "#1", "* "
      let clean = line.replace(/^\s*(?:#?\d+[\.\)\-:]\s*|[\-\*•]\s*)/, '').trim();
      let extractedName = clean;
      let extractedRoll: string | null = null;

      // Match roll number like 24SW048, 25BSAI19, 23AI01, 22SW100
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

      const nName = normNameStr(extractedName);
      const nRoll = extractedRoll ? normStr(extractedRoll) : null;

      // Check duplication against loaded players
      // 1. Exact match on BOTH Name and Roll Number
      const matchBoth = players.find(
        (p) => normNameStr(p.name) === nName && nRoll && normStr(p.roll_no || '') === nRoll
      );

      if (matchBoth) {
        return {
          name: extractedName,
          roll_no: extractedRoll,
          status: 'already_registered' as const,
          matchedPlayer: matchBoth,
        };
      }

      // 2. Roll number conflict
      if (nRoll) {
        const rollConflict = players.find(
          (p) => normStr(p.roll_no || '') === nRoll && normNameStr(p.name) !== nName
        );
        if (rollConflict) {
          const bCode = typeof rollConflict.batch === 'object' ? rollConflict.batch?.code : rollConflict.batch || 'Batch';
          return {
            name: extractedName,
            roll_no: extractedRoll,
            status: 'roll_conflict' as const,
            conflictMessage: `Roll number ${extractedRoll} belongs to ${rollConflict.name} (${bCode})`,
            matchedPlayer: rollConflict,
          };
        }
      }

      // 3. Name match in same batch
      const nameMatch = players.find(
        (p) => p.batch_id === activeBatchId && normNameStr(p.name) === nName
      );
      if (nameMatch) {
        return {
          name: extractedName,
          roll_no: extractedRoll,
          status: 'name_conflict' as const,
          conflictMessage: `Athlete named "${nameMatch.name}" already in batch (${nameMatch.roll_no || 'no roll'})`,
          matchedPlayer: nameMatch,
        };
      }

      return {
        name: extractedName,
        roll_no: extractedRoll,
        status: 'new_player' as const,
      };
    });
  }, [teamListRawText, players, activeBatchId]);

  const parsedSummary = useMemo(() => {
    const newCount = parsedTeamList.filter((p) => p.status === 'new_player').length;
    const alreadyCount = parsedTeamList.filter((p) => p.status === 'already_registered').length;
    const conflictCount = parsedTeamList.filter((p) => p.status === 'roll_conflict' || p.status === 'name_conflict').length;
    return { newCount, alreadyCount, conflictCount };
  }, [parsedTeamList]);

  // Bulk Register & Draft from Team List
  async function handleImportTeamListSubmit() {
    if (parsedTeamList.length === 0) return;

    setIsProcessingTeamList(true);
    setFeedback('Registering players from team list and checking duplicates...');

    const playersPayload: TeamListPlayerInput[] = parsedTeamList.map((entry, idx) => ({
      name: entry.name,
      roll_no: entry.roll_no,
      slotType: idx < squadRules.playingCount ? 'playing' : 'optional',
    }));

    const res = await registerPlayersFromTeamList({
      batch_id: activeBatchId,
      gender: activeGender,
      players: playersPayload,
      team_id: editingTeam?.id,
    });

    if (res.error) {
      setFeedback(`Error: ${res.error.message}`);
      setIsProcessingTeamList(false);
      return;
    }

    const data = res.data!;
    const activeBatch = MOCK_BATCHES.find((b) => b.id === activeBatchId);

    // Add newly registered players to local players state
    const newlyRegisteredPlayers: Player[] = data.players
      .filter((p) => p.status === 'newly_registered')
      .map((p) => ({
        id: p.id,
        name: p.name,
        roll_no: p.roll_no || 'Pending',
        batch_id: p.batch_id,
        gender: p.gender,
        batch: activeBatch,
      }));

    if (newlyRegisteredPlayers.length > 0) {
      setPlayers((prev) => [...newlyRegisteredPlayers, ...prev]);
    }

    // Auto-assign all resolved players into squad slots
    if (isAdding) {
      setFormData((prev) => ({
        ...prev,
        playing_player_ids: Array.from(new Set([...prev.playing_player_ids, ...data.resolvedPlayingIds])),
        optional_player_ids: Array.from(new Set([...prev.optional_player_ids, ...data.resolvedOptionalIds])),
      }));
    } else if (editingTeam) {
      setEditingTeam((prev: any) => ({
        ...prev,
        playing_player_ids: Array.from(new Set([...(prev.playing_player_ids || []), ...data.resolvedPlayingIds])),
        optional_player_ids: Array.from(new Set([...(prev.optional_player_ids || []), ...data.resolvedOptionalIds])),
      }));
    }

    setIsProcessingTeamList(false);
    setShowTeamListImport(false);
    setTeamListRawText('');
    setFeedback(
      `Team list processed! ${data.newlyRegisteredCount} newly registered in database, ${data.alreadyRegisteredCount} existing athletes matched & drafted, ${data.conflictsCount} conflicts.`
    );
    setTimeout(() => setFeedback(null), 4500);
  }

  // Real-time check for duplicate squad in Add form (game_id, batch_id, gender, name)
  const existingSquadConflict =
    isAdding &&
    formData.name.trim() &&
    teams.find(
      (t) =>
        t.game_id === formData.game_id &&
        t.batch_id === formData.batch_id &&
        t.gender === formData.gender &&
        t.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );

  const existingBatchSquadsInSport =
    isAdding &&
    teams.filter(
      (t) =>
        t.game_id === formData.game_id &&
        t.batch_id === formData.batch_id &&
        t.gender === formData.gender
    );

  // ── Team CRUD Handlers ──
  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return;

    if (existingSquadConflict) {
      alert(`Squad Conflict: A squad named "${existingSquadConflict.name}" is already registered for this Batch in ${existingSquadConflict.game} (${existingSquadConflict.gender}). Please choose a distinct squad name.`);
      return;
    }

    setFeedback('Creating team & locking in squad lineup in tournament database...');
    const res = await createTeam(formData);

    if (res.error) {
      setFeedback(`Error: ${res.error.message}`);
      alert(`Could not save team to database:\n${res.error.message}`);
      return;
    }

    setFeedback(`Squad ${formData.name} registered with ${formData.playing_player_ids.length} Playing + ${formData.optional_player_ids.length} Optional players!`);

    const g = MOCK_GAMES.find((x) => x.id === formData.game_id);
    const b = MOCK_BATCHES.find((x) => x.id === formData.batch_id);

    const playingPlayers = players.filter((p) => formData.playing_player_ids.includes(p.id));
    const optionalPlayers = players.filter((p) => formData.optional_player_ids.includes(p.id));

    setTeams([
      {
        id: res.data?.id || `t-new-${Date.now()}`,
        name: formData.name,
        game_id: formData.game_id,
        game: g?.name || 'Sport',
        game_slug: g?.slug || 'cricket',
        batch_id: formData.batch_id,
        batch: b?.code || 'Batch',
        gender: formData.gender,
        playing_player_ids: formData.playing_player_ids,
        optional_player_ids: formData.optional_player_ids,
        playing_players: playingPlayers,
        optional_players: optionalPlayers,
        squad_count: formData.playing_player_ids.length + formData.optional_player_ids.length,
      },
      ...teams,
    ]);

    setIsAdding(false);
    setFormData({
      name: '',
      game_id: MOCK_GAMES[0].id,
      batch_id: MOCK_BATCHES[2].id,
      gender: 'boys',
      playing_player_ids: [],
      optional_player_ids: [],
    });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleUpdateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTeam) return;

    setFeedback(`Updating squad ${editingTeam.name} & roster...`);
    const res = await updateTeam(editingTeam.id, {
      name: editingTeam.name,
      game_id: editingTeam.game_id,
      batch_id: editingTeam.batch_id,
      gender: editingTeam.gender,
      playing_player_ids: editingTeam.playing_player_ids || [],
      optional_player_ids: editingTeam.optional_player_ids || [],
    });

    if (res.error) {
      setFeedback(`Note: ${res.error.message} (Updated locally)`);
    } else {
      setFeedback('Squad details and lineup updated successfully!');
    }

    const g = MOCK_GAMES.find((x) => x.id === editingTeam.game_id);
    const b = MOCK_BATCHES.find((x) => x.id === editingTeam.batch_id);

    const playingPlayers = players.filter((p) => (editingTeam.playing_player_ids || []).includes(p.id));
    const optionalPlayers = players.filter((p) => (editingTeam.optional_player_ids || []).includes(p.id));

    setTeams(
      teams.map((t) =>
        t.id === editingTeam.id
          ? {
              ...editingTeam,
              game: g?.name || t.game,
              game_slug: g?.slug || t.game_slug,
              batch: b?.code || t.batch,
              playing_players: playingPlayers,
              optional_players: optionalPlayers,
              squad_count: (editingTeam.playing_player_ids?.length || 0) + (editingTeam.optional_player_ids?.length || 0),
            }
          : t
      )
    );
    setEditingTeam(null);
    setTimeout(() => setFeedback(null), 4000);
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

  // ── Helper to Render Squad Builder Inside Form ──
  function renderSquadBuilder() {
    const playingPlayers = players.filter((p) => currentPlayingIds.includes(p.id));
    const optionalPlayers = players.filter((p) => currentOptionalIds.includes(p.id));

    const isPlayingFull = currentPlayingIds.length >= squadRules.playingCount;
    const isOptionalFull = currentOptionalIds.length >= squadRules.optionalCount;

    return (
      <div className="space-y-4 pt-4 border-t border-outline-variant/30">
        {/* Rules Banner */}
        <div className="p-3.5 bg-navy-mid border-2 border-gold-accent/60 rounded flex flex-wrap items-center justify-between gap-3 shadow">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent text-xl">groups</span>
            <div>
              <div className="font-caps-label text-xs uppercase text-white font-extrabold flex items-center gap-2">
                <span>{activeGame.name.toUpperCase()} SQUAD SPECIFICATIONS</span>
                <span className="px-2 py-0.5 rounded bg-gold-accent text-navy-deep font-bold text-[10px]">
                  {squadRules.playingCount} + {squadRules.optionalCount} (MAX {squadRules.totalMax})
                </span>
              </div>
              <p className="text-[11px] text-fog-text">
                {squadRules.playingCount} {squadRules.playingLabel} &bull; {squadRules.optionalCount} {squadRules.optionalLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unassignedAthletes.length > 0 && (
              <button
                type="button"
                onClick={handleAutoFillSquad}
                className="px-3 py-1.5 bg-surface-container-high hover:bg-gold-accent hover:text-navy-deep text-gold-accent font-caps-label text-[11px] uppercase font-bold rounded transition-colors cursor-pointer flex items-center gap-1 border border-gold-accent/40"
              >
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                <span>Auto-Fill ({unassignedAthletes.length} avail)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowTeamListImport(!showTeamListImport);
                setShowQuickAddPlayer(false);
              }}
              className="px-3 py-1.5 bg-navy-mid border border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-navy-deep font-caps-label text-[11px] uppercase font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">playlist_add_check</span>
              <span>Import Team List</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowQuickAddPlayer(!showQuickAddPlayer);
                setShowTeamListImport(false);
              }}
              className="px-3 py-1.5 bg-gold-accent text-navy-deep font-caps-label text-[11px] uppercase font-extrabold rounded hover:bg-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Quick Register Athlete</span>
            </button>
          </div>
        </div>

        {/* Team List Import & Duplicate Checker Console */}
        {showTeamListImport && (
          <div className="p-4 bg-surface-container-lowest border-2 border-gold-accent/70 rounded shadow-xl space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent text-xl">playlist_add_check</span>
                <div>
                  <h4 className="font-display text-white text-sm uppercase">
                    IMPORT TEAM LIST FOR BATCH {MOCK_BATCHES.find((b) => b.id === activeBatchId)?.code}
                  </h4>
                  <p className="text-[11px] text-fog-text">
                    Paste student names &amp; roll numbers. Unregistered players will be registered into the database with duplicate checks on roll number, name, or both.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamListImport(false)}
                className="text-fog-text hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Paste / Enter Team List (One player per line)
                </label>
                <textarea
                  rows={7}
                  value={teamListRawText}
                  onChange={(e) => setTeamListRawText(e.target.value)}
                  placeholder={`1. Asad Memon - 24SW048\n2. Bilal Khan, 24SW12\n3. Farhan Ali (24SW33)\n4. Zubair Ahmed\t24SW99\n5. Tariq Shah`}
                  className="w-full p-2.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-mono focus:border-gold-accent focus:outline-none"
                />
                <span className="text-[10px] text-fog-text block mt-1">
                  Supports formats: &quot;Name - RollNo&quot;, &quot;Name, RollNo&quot;, &quot;Name (RollNo)&quot;, or tab-separated lines.
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-caps-label text-fog-text uppercase font-bold">
                    Real-time Analysis ({parsedTeamList.length} Players)
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-caps-label">
                    <span className="px-1.5 py-0.5 rounded bg-win-green/20 text-win-green font-bold">
                      {parsedSummary.newCount} New
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-navy-mid text-gold-accent font-bold border border-gold-accent/30">
                      {parsedSummary.alreadyCount} Registered
                    </span>
                    {parsedSummary.conflictCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-live-red/20 text-live-red font-bold">
                        {parsedSummary.conflictCount} Conflicts
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 bg-surface-container/60 p-2 rounded border border-outline-variant/20">
                  {parsedTeamList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-fog-text italic">
                      Paste player names and roll numbers in the box to see live duplicate checking.
                    </div>
                  ) : (
                    parsedTeamList.map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 bg-surface-container rounded border border-outline-variant/20 flex items-center justify-between text-xs gap-2"
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

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] text-fog-text">
                    Will auto-slot {Math.min(parsedTeamList.length, squadRules.playingCount)} into Playing Lineup
                    {parsedTeamList.length > squadRules.playingCount &&
                      ` and ${Math.min(parsedTeamList.length - squadRules.playingCount, squadRules.optionalCount)} into Reserves`}
                  </div>

                  <button
                    type="button"
                    onClick={handleImportTeamListSubmit}
                    disabled={isProcessingTeamList || parsedTeamList.length === 0}
                    className="px-4 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-extrabold rounded hover:bg-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isProcessingTeamList ? 'sync' : 'how_to_reg'}
                    </span>
                    <span>{isProcessingTeamList ? 'Registering & Drafting...' : 'Register & Draft Squad'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Inline Modal/Form */}
        {showQuickAddPlayer && (
          <div className="p-3.5 bg-surface-container-lowest border border-gold-accent rounded space-y-2">
            <span className="font-caps-label text-xs uppercase text-gold-accent font-bold block">
              Quick Register New Athlete for Batch {MOCK_BATCHES.find((b) => b.id === activeBatchId)?.code}:
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Full Name (e.g. Asad Brohi)"
                value={quickPlayerName}
                onChange={(e) => setQuickPlayerName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
              />
              <input
                type="text"
                placeholder="Roll No (e.g. 24SW33)"
                value={quickPlayerRoll}
                onChange={(e) => setQuickPlayerRoll(e.target.value)}
                className="w-32 px-3 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleQuickAddAthlete}
                disabled={isQuickAdding || !quickPlayerName.trim()}
                className="px-4 py-1.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold rounded hover:bg-white disabled:opacity-50 cursor-pointer"
              >
                {isQuickAdding ? 'Saving...' : 'Add & Draft'}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickAddPlayer(false)}
                className="px-3 py-1.5 bg-surface-container text-fog-text text-xs rounded hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Squad Selection Columns (Playing Lineup & Optional Reserves) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Playing Lineup */}
          <div className="p-3.5 bg-surface-container-lowest rounded border border-outline-variant/30 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-win-green text-base">sports_score</span>
                <span className="font-caps-label text-xs uppercase text-white font-bold">
                  {squadRules.playingLabel}
                </span>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-caps-label uppercase font-black font-table-numeral',
                  isPlayingFull ? 'bg-win-green text-navy-deep' : 'bg-gold-accent/20 text-gold-accent'
                )}
              >
                {currentPlayingIds.length} / {squadRules.playingCount} Slots
              </span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {playingPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-2 bg-surface-container rounded border border-outline-variant/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-navy-mid text-gold-accent font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white truncate">{p.name}</span>
                    <span className="text-[10px] text-fog-text font-mono">({p.roll_no || 'Roster'})</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Demote to Optional Reserves"
                      disabled={isOptionalFull}
                      onClick={() => handleDemoteToOptional(p.id)}
                      className="p-1 text-fog-text hover:text-gold-accent hover:bg-surface-container-high rounded disabled:opacity-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      title="Remove from Squad"
                      onClick={() => handleRemoveFromSquad(p.id)}
                      className="p-1 text-fog-text hover:text-live-red hover:bg-surface-container-high rounded cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Dotted empty slot indicators */}
              {Array.from({ length: Math.max(0, squadRules.playingCount - currentPlayingIds.length) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="p-2 border border-dashed border-outline-variant/30 rounded text-center text-[11px] text-fog-text/60 font-caps-label uppercase"
                  >
                    Slot {currentPlayingIds.length + i + 1} &bull; Empty
                  </div>
                )
              )}
            </div>
          </div>

          {/* Section 2: Optional Reserves */}
          <div className="p-3.5 bg-surface-container-lowest rounded border border-outline-variant/30 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-gold-accent text-base">chair</span>
                <span className="font-caps-label text-xs uppercase text-white font-bold">
                  {squadRules.optionalLabel}
                </span>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-caps-label uppercase font-black font-table-numeral',
                  isOptionalFull ? 'bg-gold-accent text-navy-deep' : 'bg-surface-container text-fog-text'
                )}
              >
                {currentOptionalIds.length} / {squadRules.optionalCount} Reserves
              </span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {optionalPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-2 bg-surface-container rounded border border-outline-variant/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-gold-accent font-caps-label text-[9px] font-bold">
                      RES {idx + 1}
                    </span>
                    <span className="font-bold text-white truncate">{p.name}</span>
                    <span className="text-[10px] text-fog-text font-mono">({p.roll_no || 'Roster'})</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Promote to Starting Lineup"
                      disabled={isPlayingFull}
                      onClick={() => handlePromoteToPlaying(p.id)}
                      className="p-1 text-fog-text hover:text-win-green hover:bg-surface-container-high rounded disabled:opacity-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      title="Remove from Squad"
                      onClick={() => handleRemoveFromSquad(p.id)}
                      className="p-1 text-fog-text hover:text-live-red hover:bg-surface-container-high rounded cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Dotted empty slot indicators */}
              {Array.from({ length: Math.max(0, squadRules.optionalCount - currentOptionalIds.length) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="p-2 border border-dashed border-outline-variant/30 rounded text-center text-[11px] text-fog-text/60 font-caps-label uppercase"
                  >
                    Reserve {currentOptionalIds.length + i + 1} &bull; Empty
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Available Batch Athlete Pool */}
        <div className="p-3 bg-surface-container rounded border border-outline-variant/20 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-caps-label text-xs uppercase text-gold-accent font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">badge</span>
              <span>Available Batch Athletes ({unassignedAthletes.length} in pool)</span>
            </span>

            <input
              type="text"
              placeholder="Search athlete by name or roll number..."
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
              className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/30 rounded text-white text-xs w-full sm:w-64"
            />
          </div>

          {filteredUnassignedAthletes.length === 0 ? (
            <p className="text-xs text-fog-text py-2 italic">
              {batchAthletes.length === 0
                ? 'No registered athletes found for this batch yet. Use "Quick Register Athlete" above to add players.'
                : 'All registered athletes in this batch have been assigned to the squad.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredUnassignedAthletes.map((p) => (
                <div
                  key={p.id}
                  className="p-2 bg-surface-container-lowest rounded border border-outline-variant/20 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                    <span className="text-[10px] text-fog-text font-mono">{p.roll_no || 'No roll no'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isPlayingFull}
                      onClick={() => handleAddToPlaying(p.id)}
                      className="px-2 py-0.5 bg-win-green/20 hover:bg-win-green text-win-green hover:text-navy-deep font-caps-label text-[10px] uppercase font-bold rounded transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      + Lineup
                    </button>
                    <button
                      type="button"
                      disabled={isOptionalFull}
                      onClick={() => handleAddToOptional(p.id)}
                      className="px-2 py-0.5 bg-gold-accent/20 hover:bg-gold-accent text-gold-accent hover:text-navy-deep font-caps-label text-[10px] uppercase font-bold rounded transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      + Reserve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
            Registered squads with sport-specific lineup requirements (11+3 for cricket, 5+3 for futsal, 7+3 for volleyball)
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingTeam(null);
            setFormData({
              name: '',
              game_id: MOCK_GAMES[0].id,
              batch_id: MOCK_BATCHES[2].id,
              gender: 'boys',
              playing_player_ids: [],
              optional_player_ids: [],
            });
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

      {/* ── Add Team Form with Squad Builder ── */}
      {isAdding && (
        <form
          onSubmit={handleAddTeam}
          className="mb-8 p-6 bg-surface-container border border-gold-accent/40 rounded shadow-xl space-y-4"
        >
          <h3 className="font-display text-gold-accent uppercase text-lg">
            REGISTER NEW SQUAD &amp; LINEUP
          </h3>

          {/* Real-time duplicate squad warning (same squad name) */}
          {existingSquadConflict && (
            <div className="p-3.5 bg-live-red/20 border border-live-red/50 rounded text-xs text-live-red font-caps-label flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">warning</span>
              <div>
                <span className="font-bold block">
                  Duplicate Squad Name: &quot;{existingSquadConflict.name}&quot; is already registered for this batch in {existingSquadConflict.game} ({existingSquadConflict.gender}).
                </span>
                <span className="text-[11px] text-fog-text block mt-0.5">
                  Please choose a distinct squad name (e.g. {existingSquadConflict.name} B, Section 2).
                </span>
              </div>
            </div>
          )}

          {/* Info banner when other squads already exist for this batch in this sport */}
          {!existingSquadConflict && existingBatchSquadsInSport && existingBatchSquadsInSport.length > 0 && (
            <div className="p-3 bg-navy-mid/60 border border-gold-accent/40 rounded text-xs text-gold-accent font-caps-label flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
              <div>
                <span className="font-bold block">
                  Batch already has {existingBatchSquadsInSport.length} registered squad(s) in this sport: {existingBatchSquadsInSport.map((t: any) => t.name).join(', ')}
                </span>
                <span className="text-[11px] text-fog-text block mt-0.5">
                  Multiple squads per batch are supported! Just give this squad a unique name.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    game_id: e.target.value,
                    playing_player_ids: [],
                    optional_player_ids: [],
                  });
                }}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                {MOCK_GAMES.filter((g) => g.format === 'team' || g.slug === 'badminton' || g.slug === 'table-tennis').map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.slug === 'badminton' || g.slug === 'table-tennis' ? '(Pairs / Singles)' : ''}
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
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    batch_id: e.target.value,
                    playing_player_ids: [],
                    optional_player_ids: [],
                  });
                }}
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as any,
                    playing_player_ids: [],
                    optional_player_ids: [],
                  })
                }
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
          </div>

          {/* Format Mode for Badminton & Table Tennis */}
          {(activeGame.slug === 'badminton' || activeGame.slug === 'table-tennis') && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container-lowest border border-gold-accent/40 rounded">
              <span className="text-xs font-caps-label text-white uppercase font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-gold-accent">sports_tennis</span>
                <span>{activeGame.name} Squad Format:</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTeamFormatMode('doubles');
                    setFormData((prev) => ({ ...prev, playing_player_ids: [], optional_player_ids: [] }));
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors cursor-pointer',
                    teamFormatMode === 'doubles'
                      ? 'bg-gold-accent text-navy-deep border-gold-accent'
                      : 'bg-surface-container border-outline-variant/30 text-fog-text hover:text-white'
                  )}
                >
                  👥 Doubles / Pair (2 Playing + 1 Reserve)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeamFormatMode('singles');
                    setFormData((prev) => ({ ...prev, playing_player_ids: [], optional_player_ids: [] }));
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors cursor-pointer',
                    teamFormatMode === 'singles'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-container border-outline-variant/30 text-fog-text hover:text-white'
                  )}
                >
                  👤 Singles (1 Playing Athlete)
                </button>
              </div>
            </div>
          )}

          {/* Interactive Squad Builder */}
          {renderSquadBuilder()}

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!existingSquadConflict}
              className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Squad &amp; Roster
            </button>
          </div>
        </form>
      )}

      {/* ── Edit Team Modal with Squad Builder ── */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleUpdateTeam}
            className="w-full max-w-4xl bg-surface-container border border-gold-accent p-6 rounded shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
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
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      game_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  {MOCK_GAMES.filter((g) => g.format === 'team' || g.slug === 'badminton' || g.slug === 'table-tennis').map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.slug === 'badminton' || g.slug === 'table-tennis' ? '(Pairs / Singles)' : ''}
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
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      batch_id: e.target.value,
                    })
                  }
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

            {/* Format Mode for Badminton & Table Tennis (Edit Mode) */}
            {(activeGame.slug === 'badminton' || activeGame.slug === 'table-tennis') && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container-lowest border border-gold-accent/40 rounded">
                <span className="text-xs font-caps-label text-white uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-gold-accent">sports_tennis</span>
                  <span>{activeGame.name} Squad Format:</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTeamFormatMode('doubles');
                      setEditingTeam((prev: any) => ({ ...prev, playing_player_ids: [], optional_player_ids: [] }));
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors cursor-pointer',
                      teamFormatMode === 'doubles'
                        ? 'bg-gold-accent text-navy-deep border-gold-accent'
                        : 'bg-surface-container border-outline-variant/30 text-fog-text hover:text-white'
                    )}
                  >
                    👥 Doubles / Pair (2 Playing + 1 Reserve)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTeamFormatMode('singles');
                      setEditingTeam((prev: any) => ({ ...prev, playing_player_ids: [], optional_player_ids: [] }));
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors cursor-pointer',
                      teamFormatMode === 'singles'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-container border-outline-variant/30 text-fog-text hover:text-white'
                    )}
                  >
                    👤 Singles (1 Playing Athlete)
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Squad Builder for Edit */}
            {renderSquadBuilder()}

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
                className="px-5 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors"
              >
                Update Squad &amp; Lineup
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── View Squad Roster Modal ── */}
      {viewingSquadTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface-container border-2 border-gold-accent rounded-lg shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display text-white text-xl uppercase tracking-tight flex items-center gap-2">
                  <span>{viewingSquadTeam.name}</span>
                  <span className="px-2 py-0.5 rounded bg-gold-accent text-navy-deep text-xs font-bold font-caps-label">
                    Batch {viewingSquadTeam.batch}
                  </span>
                </h3>
                <span className="text-xs text-fog-text font-caps-label">
                  {viewingSquadTeam.game} &bull; Category: {viewingSquadTeam.gender.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingSquadTeam(null)}
                className="text-fog-text hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Playing Lineup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                <span className="font-caps-label text-xs uppercase text-win-green font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">sports_score</span>
                  <span>
                    Starting Lineup (
                    {viewingSquadTeam.playing_players?.length || viewingSquadTeam.playing_player_ids?.length || 0})
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(viewingSquadTeam.playing_players && viewingSquadTeam.playing_players.length > 0
                  ? viewingSquadTeam.playing_players
                  : players.filter((p) => (viewingSquadTeam.playing_player_ids || []).includes(p.id))
                ).map((p: any, idx: number) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant/20 flex items-center gap-2.5"
                  >
                    <span className="w-6 h-6 rounded-full bg-navy-mid text-gold-accent font-bold font-mono text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                      <span className="text-[10px] text-fog-text font-mono">{p.roll_no || 'Batch Roster'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Reserves */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                <span className="font-caps-label text-xs uppercase text-gold-accent font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">chair</span>
                  <span>
                    Optional / Reserves (
                    {viewingSquadTeam.optional_players?.length || viewingSquadTeam.optional_player_ids?.length || 0})
                  </span>
                </span>
              </div>

              {(viewingSquadTeam.optional_players && viewingSquadTeam.optional_players.length > 0
                ? viewingSquadTeam.optional_players
                : players.filter((p) => (viewingSquadTeam.optional_player_ids || []).includes(p.id))
              ).length === 0 ? (
                <p className="text-xs text-fog-text italic py-1">No reserve players assigned.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(viewingSquadTeam.optional_players && viewingSquadTeam.optional_players.length > 0
                    ? viewingSquadTeam.optional_players
                    : players.filter((p) => (viewingSquadTeam.optional_player_ids || []).includes(p.id))
                  ).map((p: any, idx: number) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant/20 flex items-center gap-2.5"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-gold-accent font-caps-label text-[10px] font-bold">
                        RES {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                        <span className="text-[10px] text-fog-text font-mono">{p.roll_no || 'Batch Roster'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setViewingSquadTeam(null)}
                className="px-5 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold rounded hover:bg-white cursor-pointer"
              >
                Close Roster Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Guard ── */}
      {deletingTeam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border-2 border-live-red p-6 rounded shadow-2xl">
            <div className="flex items-center gap-3 text-live-red mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-display uppercase text-lg">CONFIRM SQUAD DELETION</h3>
            </div>

            <p className="text-xs sm:text-sm text-fog-text mb-4">
              You are deleting squad <strong className="text-white">{deletingTeam.name}</strong> ({deletingTeam.batch} &bull; {deletingTeam.game}).
              This removes the squad and its roster from tournament records.
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

      {/* ── Teams Table with Squad Roster Column ── */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SQUAD NAME</th>
              <th className="p-3.5">SPORT</th>
              <th className="p-3.5">BATCH</th>
              <th className="p-3.5">CATEGORY</th>
              <th className="p-3.5">SQUAD ROSTER</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {teams.map((t) => {
              const rules = getSquadRulesForGame(t.game_slug);
              const pCount = t.playing_player_ids?.length || t.playing_players?.length || 0;
              const oCount = t.optional_player_ids?.length || t.optional_players?.length || 0;

              return (
                <tr key={t.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="p-3.5 font-bold text-white font-caps-label">{t.name}</td>
                  <td className="p-3.5 text-gold-accent font-caps-label">{t.game}</td>
                  <td className="p-3.5 text-white font-display text-base">{t.batch}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-caps-label uppercase bg-surface-container-high text-fog-text">
                      {t.gender}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-caps-label uppercase font-bold font-table-numeral',
                          pCount >= rules.playingCount
                            ? 'bg-win-green/20 text-win-green border border-win-green/40'
                            : 'bg-gold-accent/15 text-gold-accent border border-gold-accent/30'
                        )}
                      >
                        {pCount} Lineup + {oCount} Res ({pCount + oCount} Total)
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingSquadTeam(t)}
                        className="px-2 py-0.5 bg-surface-container-highest hover:bg-gold-accent hover:text-navy-deep text-fog-text font-caps-label text-[10px] uppercase font-bold rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                  <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeam({
                          ...t,
                          playing_player_ids: t.playing_player_ids || t.playing_players?.map((p: any) => p.id) || [],
                          optional_player_ids: t.optional_player_ids || t.optional_players?.map((p: any) => p.id) || [],
                        });
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
