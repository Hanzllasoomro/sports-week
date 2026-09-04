'use client';

import { useState, useEffect } from 'react';
import {
  scheduleMatch,
  updateFixture,
  deleteFixture,
  autoGenerateTournamentSlots,
  assignSlotCompetitors,
} from '@/app/actions/fixtures';
import type { FixtureWithRelations, Game, Batch } from '@/types';
import { MOCK_GAMES, MOCK_BATCHES } from '@/lib/mock-data';
import { fixtureTime, fixtureDate } from '@/lib/utils';

export default function AdminFixturesPage() {
  const [fixtures, setFixtures] = useState<FixtureWithRelations[]>([]);
  const [games] = useState<Game[]>(MOCK_GAMES);
  const [batches] = useState<Batch[]>(MOCK_BATCHES);
  const [registeredPlayers, setRegisteredPlayers] = useState<any[]>([]);
  const [registeredTeams, setRegisteredTeams] = useState<any[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingFixture, setEditingFixture] = useState<FixtureWithRelations | null>(null);
  const [editDate, setEditDate] = useState<string>('2026-09-08');
  const [editTime, setEditTime] = useState<string>('10:00');
  const [deletingFixture, setDeletingFixture] = useState<FixtureWithRelations | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // ── Auto-Schedule Bracket State ──
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGameId, setAutoGameId] = useState<string>('all');
  const [autoTeamCount, setAutoTeamCount] = useState<number>(24);
  const [autoGender, setAutoGender] = useState<'boys' | 'girls'>('boys');
  const [autoR32Date, setAutoR32Date] = useState<string>('2026-09-08');
  const [autoR16Date, setAutoR16Date] = useState<string>('2026-09-08');
  const [autoQuarterDate, setAutoQuarterDate] = useState<string>('2026-09-09');
  const [autoSemiDate, setAutoSemiDate] = useState<string>('2026-09-09');
  const [autoVenue, setAutoVenue] = useState<string>('MUET Main Sports Complex');
  const [autoMatchFormat, setAutoMatchFormat] = useState<'team' | 'individual'>('team');
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  // ── Interactive Slot Placement State ──
  const [slotAssignFixture, setSlotAssignFixture] = useState<FixtureWithRelations | null>(null);
  const [slotMatchFormat, setSlotMatchFormat] = useState<'team' | 'individual'>('team');
  const [slotBatchAId, setSlotBatchAId] = useState<string>(MOCK_BATCHES[2].id);
  const [slotTeamAId, setSlotTeamAId] = useState<string>('');
  const [slotTeamAName, setSlotTeamAName] = useState<string>('');
  const [slotPlayerAId, setSlotPlayerAId] = useState<string>('');
  const [slotPlayerAName, setSlotPlayerAName] = useState<string>('');
  const [slotPlayerARollNo, setSlotPlayerARollNo] = useState<string>('');

  const [slotBatchBId, setSlotBatchBId] = useState<string>(MOCK_BATCHES[5].id);
  const [slotTeamBId, setSlotTeamBId] = useState<string>('');
  const [slotTeamBName, setSlotTeamBName] = useState<string>('');
  const [slotPlayerBId, setSlotPlayerBId] = useState<string>('');
  const [slotPlayerBName, setSlotPlayerBName] = useState<string>('');
  const [slotPlayerBRollNo, setSlotPlayerBRollNo] = useState<string>('');
  const [isPlacingSlot, setIsPlacingSlot] = useState(false);

  // ── Single Match Schedule Form State ──
  const [gameId, setGameId] = useState<string>(MOCK_GAMES[0].id);
  const [stage, setStage] = useState<'group' | 'semifinal' | 'final' | 'friendly'>('group');
  const [round, setRound] = useState<string>('Match 1');
  const [venue, setVenue] = useState<string>('MUET Gymnasium Arena');
  const [gender, setGender] = useState<'boys' | 'girls'>('boys');

  const [matchDate, setMatchDate] = useState<string>('2026-09-08');
  const [matchTime, setMatchTime] = useState<string>('10:00');

  const [batchAId, setBatchAId] = useState<string>(MOCK_BATCHES[2].id);
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamAName, setTeamAName] = useState<string>('');
  const [batchBId, setBatchBId] = useState<string>(MOCK_BATCHES[5].id);
  const [teamBId, setTeamBId] = useState<string>('');
  const [teamBName, setTeamBName] = useState<string>('');

  const [playerAId, setPlayerAId] = useState<string>('');
  const [playerAName, setPlayerAName] = useState<string>('');
  const [playerARollNo, setPlayerARollNo] = useState<string>('');
  const [playerBId, setPlayerBId] = useState<string>('');
  const [playerBName, setPlayerBName] = useState<string>('');
  const [playerBRollNo, setPlayerBRollNo] = useState<string>('');
  const [singleMatchFormat, setSingleMatchFormat] = useState<'team' | 'individual'>('team');

  const selectedGame = games.find((g) => g.id === gameId) || games[0];
  const isRacketSport = selectedGame.slug === 'badminton' || selectedGame.slug === 'table-tennis';
  const isTeamSport = isRacketSport ? singleMatchFormat === 'team' : selectedGame.format === 'team';

  // Global Escape key listener to close modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsAutoGenerating(false);
        setSlotAssignFixture(null);
        setEditingFixture(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load real fixtures, teams, and players on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [fixRes, playRes, teamRes] = await Promise.all([
          fetch('/api/fixtures'),
          fetch('/api/players'),
          fetch('/api/teams'),
        ]);

        if (fixRes.ok) {
          const fixData = await fixRes.json();
          if (Array.isArray(fixData)) {
            setFixtures(fixData);
          }
        }

        if (playRes.ok) {
          const playData = await playRes.json();
          if (Array.isArray(playData)) {
            setRegisteredPlayers(playData);
            const defaultPlayA = playData.find((p) => p.batch_id === batchAId);
            if (defaultPlayA) {
              setPlayerAId(defaultPlayA.id);
              setPlayerAName(defaultPlayA.name);
              setPlayerARollNo(defaultPlayA.roll_no || '');
            }
            const defaultPlayB = playData.find((p) => p.batch_id === batchBId);
            if (defaultPlayB) {
              setPlayerBId(defaultPlayB.id);
              setPlayerBName(defaultPlayB.name);
              setPlayerBRollNo(defaultPlayB.roll_no || '');
            }
          }
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          if (Array.isArray(teamData)) {
            setRegisteredTeams(teamData);
            const defaultTeamA = teamData.find((t) => t.batch_id === batchAId);
            if (defaultTeamA) {
              setTeamAId(defaultTeamA.id);
              setTeamAName(defaultTeamA.name);
            }
            const defaultTeamB = teamData.find((t) => t.batch_id === batchBId);
            if (defaultTeamB) {
              setTeamBId(defaultTeamB.id);
              setTeamBName(defaultTeamB.name);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load data', err);
      }
    }
    loadData();
  }, []);

  // Sync editing date & time
  useEffect(() => {
    if (editingFixture && editingFixture.scheduled_at) {
      try {
        const d = new Date(editingFixture.scheduled_at);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setEditDate(`${yyyy}-${mm}-${dd}`);
        setEditTime(`${hh}:${min}`);
      } catch {
        // ignore
      }
    }
  }, [editingFixture]);

  // Handle slot assignment defaults
  useEffect(() => {
    if (slotAssignFixture) {
      const bA = batches.find((b) => b.id === slotBatchAId);
      const bB = batches.find((b) => b.id === slotBatchBId);
      if (slotAssignFixture.game?.format === 'team') {
        setSlotTeamAName(`${bA?.code || 'Batch A'} ${slotAssignFixture.game.name}`);
        setSlotTeamBName(`${bB?.code || 'Batch B'} ${slotAssignFixture.game.name}`);
      }
    }
  }, [slotAssignFixture, slotBatchAId, slotBatchBId]);

  // ── Auto Generate Bracket Slots ──
  async function handleAutoGenerateSlots(e: React.FormEvent) {
    e.preventDefault();
    setIsGeneratingSlots(true);
    setFeedbackMessage('Auto-generating tournament bracket slots in database...');

    const res = await autoGenerateTournamentSlots({
      game_id: autoGameId,
      team_count: autoTeamCount,
      gender: autoGender,
      round32_date: autoR32Date,
      round16_date: autoR16Date,
      quarter_date: autoQuarterDate,
      semi_date: autoSemiDate,
      venue: autoVenue,
      match_format: autoMatchFormat,
    });

    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      const byeInfo = res.data?.byes ? ` (${res.data.byes} byes into Round of 16)` : '';
      setFeedbackMessage(
        `Successfully generated ${res.data?.count || ''} tournament bracket slots${byeInfo}! All finals locked to Sep 10, 2026.`
      );
      setIsAutoGenerating(false);

      // Reload fresh fixtures
      const freshRes = await fetch('/api/fixtures');
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setFixtures(freshData);
      }
    }
    setIsGeneratingSlots(false);
    setTimeout(() => setFeedbackMessage(null), 5000);
  }

  // ── Assign Competitors to a Slot ──
  async function handleConfirmSlotPlacement(e: React.FormEvent) {
    e.preventDefault();
    if (!slotAssignFixture) return;

    setIsPlacingSlot(true);
    setFeedbackMessage('Placing competitors into fixture slot...');

    const isTeam = slotMatchFormat === 'team';
    const payload: any = {
      fixture_id: slotAssignFixture.id,
      is_team: isTeam,
      game_id: slotAssignFixture.game_id,
      gender: slotAssignFixture.game?.gender === 'girls' ? 'girls' : 'boys',
    };

    if (isTeam) {
      payload.team_a_id = slotTeamAId || undefined;
      payload.team_a_name = slotTeamAName;
      payload.team_a_batch_id = slotBatchAId;
      payload.team_b_id = slotTeamBId || undefined;
      payload.team_b_name = slotTeamBName;
      payload.team_b_batch_id = slotBatchBId;
    } else {
      payload.player_a_id = slotPlayerAId || undefined;
      payload.player_a_name = slotPlayerAName || 'Athlete A';
      payload.player_a_roll_no = slotPlayerARollNo;
      payload.player_a_batch_id = slotBatchAId;
      payload.player_b_id = slotPlayerBId || undefined;
      payload.player_b_name = slotPlayerBName || 'Athlete B';
      payload.player_b_roll_no = slotPlayerBRollNo;
      payload.player_b_batch_id = slotBatchBId;
    }

    const res = await assignSlotCompetitors(payload);

    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Competitors placed into slot successfully!');
      if (res.data) {
        setFixtures(fixtures.map((f) => (f.id === slotAssignFixture.id ? res.data : f)));
      }
      setSlotAssignFixture(null);
    }
    setIsPlacingSlot(false);
    setTimeout(() => setFeedbackMessage(null), 3500);
  }

  // ── Single Match Schedule ──
  async function handleScheduleMatch(e: React.FormEvent) {
    e.preventDefault();
    setFeedbackMessage('Scheduling match in database...');

    const scheduledAt = `${matchDate}T${matchTime}:00+05:00`;

    const payload: any = {
      game_id: gameId,
      stage,
      round,
      scheduled_at: scheduledAt,
      venue,
      gender,
    };

    if (isTeamSport) {
      payload.team_a_id = teamAId || undefined;
      payload.team_a_name = teamAName;
      payload.team_a_batch_id = batchAId;
      payload.team_b_id = teamBId || undefined;
      payload.team_b_name = teamBName;
      payload.team_b_batch_id = batchBId;
    } else {
      payload.player_a_id = playerAId || undefined;
      payload.player_a_name = playerAName || 'Athlete A';
      payload.player_a_roll_no = playerARollNo;
      payload.player_a_batch_id = batchAId;
      payload.player_b_id = playerBId || undefined;
      payload.player_b_name = playerBName || 'Athlete B';
      payload.player_b_roll_no = playerBRollNo;
      payload.player_b_batch_id = batchBId;
    }

    const res = await scheduleMatch(payload);

    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Match successfully scheduled and registered in database!');
      setIsCreating(false);
      if (res.data) {
        setFixtures([res.data, ...fixtures]);
      }
    }
    setTimeout(() => setFeedbackMessage(null), 3500);
  }

  // ── Update Fixture ──
  async function handleUpdateFixture(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFixture) return;

    setFeedbackMessage('Updating fixture details...');
    const scheduledAt = `${editDate}T${editTime}:00+05:00`;

    const res = await updateFixture({
      id: editingFixture.id,
      stage: editingFixture.stage,
      round: editingFixture.round,
      scheduled_at: scheduledAt,
      venue: editingFixture.venue,
      status: editingFixture.status,
    });

    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage('Fixture updated successfully!');
      setFixtures(
        fixtures.map((f) =>
          f.id === editingFixture.id
            ? { ...editingFixture, scheduled_at: scheduledAt }
            : f
        )
      );
      setEditingFixture(null);
    }
    setTimeout(() => setFeedbackMessage(null), 3500);
  }

  // ── Delete Fixture with Permission ──
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

  // ── Status Change ──
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
      {/* ── Header with Auto-Schedule & Manual Schedule Buttons ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            FIXTURE &amp; SCHEDULE MANAGER
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Automatic bracket scheduling by team count, slot placement, and custom match dates (Finals locked on Sep 10)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto-Schedule Generator Button */}
          <button
            type="button"
            onClick={() => {
              setIsAutoGenerating(true);
              setIsCreating(false);
            }}
            className="bg-navy-mid border border-gold-accent text-gold-accent font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-gold-accent hover:text-navy-deep transition-all cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            <span>Auto-Schedule Bracket</span>
          </button>

          {/* Schedule Single Match Button */}
          <button
            type="button"
            onClick={() => {
              setIsCreating(!isCreating);
              setIsAutoGenerating(false);
              setEditingFixture(null);
            }}
            className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined text-base">
              {isCreating ? 'close' : 'add'}
            </span>
            <span>{isCreating ? 'Cancel' : 'Schedule Single Match'}</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ── AUTO-SCHEDULE GENERATOR MODAL ── */}
      {isAutoGenerating && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAutoGenerating(false);
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
        >
          <form
            onSubmit={handleAutoGenerateSlots}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-container border border-gold-accent p-5 sm:p-6 rounded shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent text-2xl">auto_awesome</span>
                <h3 className="font-display text-gold-accent uppercase text-base sm:text-lg">
                  AUTOMATIC TOURNAMENT BRACKET GENERATOR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoGenerating(false)}
                className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/40 rounded text-fog-text hover:text-white hover:border-gold-accent/50 flex items-center gap-1 transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <span className="material-symbols-outlined text-base">close</span>
                <span className="text-[11px] font-caps-label uppercase font-bold">Close</span>
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              <p className="text-xs text-fog-text font-body leading-relaxed">
                Generate tournament fixture slot placeholders automatically based on your desired bracket size. Supports standard knockout elimination with <strong>automatic Byes</strong> for <strong>20 to 25 teams</strong> (Badminton, Table Tennis, and all championship sports). All Championship Finals are strictly locked to September 10, 2026.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sport Picker */}
                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                    Target Sport
                  </label>
                  <select
                    value={autoGameId}
                    onChange={(e) => {
                      setAutoGameId(e.target.value);
                      const sel = games.find((g) => g.id === e.target.value);
                      if (sel) {
                        setAutoMatchFormat(sel.format === 'team' ? 'team' : 'individual');
                      }
                    }}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
                  >
                    <option value="all">🌟 All 10 Championship Sports</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.format})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Match Format (Singles vs Pair-Up) */}
                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                    Match Format Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAutoMatchFormat('individual')}
                      className={`px-3 py-2 rounded text-xs font-caps-label uppercase font-bold border transition-colors ${
                        autoMatchFormat === 'individual'
                          ? 'bg-primary/30 border-primary text-white'
                          : 'bg-surface-container-lowest border-outline-variant/30 text-fog-text hover:text-white'
                      }`}
                    >
                      👤 Singles (1v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoMatchFormat('team')}
                      className={`px-3 py-2 rounded text-xs font-caps-label uppercase font-bold border transition-colors ${
                        autoMatchFormat === 'team'
                          ? 'bg-gold-accent/30 border-gold-accent text-gold-accent'
                          : 'bg-surface-container-lowest border-outline-variant/30 text-fog-text hover:text-white'
                      }`}
                    >
                      👥 Doubles / Pairs (2v2)
                    </button>
                  </div>
                </div>

                {/* Bracket Size with Presets */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-caps-label text-fog-text uppercase font-bold">
                      Number of Competitors / Teams (4 to 32)
                    </label>
                    <span className="text-xs font-table-numeral text-gold-accent font-bold">
                      {autoTeamCount} Competitors Selected
                    </span>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { label: '4 Teams', count: 4 },
                      { label: '8 Teams', count: 8 },
                      { label: '9 Batches', count: 9 },
                      { label: '16 Teams', count: 16 },
                      { label: '20 Teams (12 Byes)', count: 20 },
                      { label: '22 Teams (10 Byes)', count: 22 },
                      { label: '24 Teams (8 Byes)', count: 24 },
                      { label: '25 Teams (7 Byes)', count: 25 },
                      { label: '32 Teams', count: 32 },
                    ].map((p) => (
                      <button
                        key={p.count}
                        type="button"
                        onClick={() => setAutoTeamCount(p.count)}
                        className={`px-2.5 py-1 rounded text-[11px] font-caps-label uppercase transition-all ${
                          autoTeamCount === p.count
                            ? 'bg-gold-accent text-navy-deep font-bold shadow'
                            : 'bg-surface-container-lowest border border-outline-variant/30 text-fog-text hover:text-white hover:border-gold-accent/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={4}
                      max={32}
                      value={autoTeamCount}
                      onChange={(e) => setAutoTeamCount(Number(e.target.value))}
                      className="flex-1 accent-gold-accent cursor-pointer"
                    />
                    <input
                      type="number"
                      min={4}
                      max={32}
                      value={autoTeamCount}
                      onChange={(e) => setAutoTeamCount(Math.max(4, Math.min(32, Number(e.target.value) || 4)))}
                      className="w-16 px-2 py-1 bg-surface-container-lowest border border-outline-variant/40 rounded text-center text-white text-xs font-bold font-table-numeral"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                    Gender Category
                  </label>
                  <select
                    value={autoGender}
                    onChange={(e) => setAutoGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                  >
                    <option value="boys">Boys Division</option>
                    <option value="girls">Girls Division</option>
                  </select>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                    Primary Arena / Venue
                  </label>
                  <input
                    type="text"
                    value={autoVenue}
                    onChange={(e) => setAutoVenue(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                  />
                </div>
              </div>

              {/* ── Interactive Bracket Structure Summary Card ── */}
              {(() => {
                const N = autoTeamCount;
                const byes = N > 16 ? 32 - N : N > 8 ? 16 - N : 0;
                const r32Matches = N > 16 ? N - 16 : 0;
                const r16Matches = N > 16 ? 8 : N > 8 ? N - 8 : 0;
                const totalMatches = N - 1;

                return (
                  <div className="p-4 bg-surface-container-lowest border border-gold-accent/30 rounded space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-caps-label text-xs uppercase text-gold-accent font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">account_tree</span>
                        <span>Tournament Bracket Breakdown ({N} Teams)</span>
                      </span>
                      <span className="px-2 py-0.5 bg-gold-accent/20 border border-gold-accent/40 rounded text-[10px] font-caps-label text-gold-accent font-bold uppercase">
                        {totalMatches} Total Matches
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                      {N > 16 ? (
                        <>
                          <div className="p-2 bg-surface-container rounded border border-outline-variant/20">
                            <div className="text-[10px] text-fog-text uppercase font-caps-label">Direct Byes to R16</div>
                            <div className="font-display text-win-green text-sm font-bold">{byes} Teams</div>
                          </div>
                          <div className="p-2 bg-surface-container rounded border border-outline-variant/20">
                            <div className="text-[10px] text-fog-text uppercase font-caps-label">Round of 32</div>
                            <div className="font-display text-white text-sm font-bold">{r32Matches} Matches</div>
                          </div>
                          <div className="p-2 bg-surface-container rounded border border-outline-variant/20">
                            <div className="text-[10px] text-fog-text uppercase font-caps-label">Round of 16</div>
                            <div className="font-display text-white text-sm font-bold">8 Matches</div>
                          </div>
                          <div className="p-2 bg-surface-container rounded border border-gold-accent/30">
                            <div className="text-[10px] text-gold-accent uppercase font-caps-label">Quarters &rarr; Final</div>
                            <div className="font-display text-gold-accent text-sm font-bold">7 Matches (4+2+1)</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-surface-container rounded border border-outline-variant/20">
                            <div className="text-[10px] text-fog-text uppercase font-caps-label">Bracket Size</div>
                            <div className="font-display text-white text-sm font-bold">{N <= 4 ? 4 : N <= 8 ? 8 : 16}</div>
                          </div>
                          <div className="p-2 bg-surface-container rounded border border-outline-variant/20">
                            <div className="text-[10px] text-fog-text uppercase font-caps-label">Byes</div>
                            <div className="font-display text-win-green text-sm font-bold">{byes} Teams</div>
                          </div>
                          <div className="p-2 bg-surface-container rounded border border-outline-variant/20">
                            <div className="text-[10px] text-fog-text uppercase font-caps-label">Early Rounds</div>
                            <div className="font-display text-white text-sm font-bold">{totalMatches - 3} Matches</div>
                          </div>
                          <div className="p-2 bg-surface-container rounded border border-gold-accent/30">
                            <div className="text-[10px] text-gold-accent uppercase font-caps-label">Semis &amp; Final</div>
                            <div className="font-display text-gold-accent text-sm font-bold">3 Matches (2+1)</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Date Configuration (Admin decides non-finals, Finals locked on Sep 10) ── */}
              <div className="p-4 bg-navy-mid/60 border border-outline-variant/30 rounded">
                <label className="block text-xs font-caps-label text-white uppercase mb-3 font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-gold-accent">event</span>
                  <span>Tournament Round Schedule Dates</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Round of 32 Date */}
                  {autoTeamCount > 16 && (
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Round of 32:
                      </label>
                      <input
                        type="date"
                        value={autoR32Date}
                        onChange={(e) => setAutoR32Date(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                      />
                      <span className="text-[10px] text-win-green mt-1 block">Day 1 Morning</span>
                    </div>
                  )}

                  {/* Round of 16 Date */}
                  {autoTeamCount > 8 && (
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Round of 16:
                      </label>
                      <input
                        type="date"
                        value={autoR16Date}
                        onChange={(e) => setAutoR16Date(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                      />
                      <span className="text-[10px] text-win-green mt-1 block">Day 1 / Day 2</span>
                    </div>
                  )}

                  {/* Quarter Date */}
                  <div>
                    <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                      Quarter-Finals:
                    </label>
                    <input
                      type="date"
                      value={autoQuarterDate}
                      onChange={(e) => setAutoQuarterDate(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                    />
                    <span className="text-[10px] text-win-green mt-1 block">Day 2</span>
                  </div>

                  {/* Semi Date */}
                  <div>
                    <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                      Semi-Finals:
                    </label>
                    <input
                      type="date"
                      value={autoSemiDate}
                      onChange={(e) => setAutoSemiDate(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                    />
                    <span className="text-[10px] text-win-green mt-1 block">Day 2 Evening</span>
                  </div>

                  {/* Finals Date (STRICTLY LOCKED TO SEP 10) */}
                  <div>
                    <label className="block text-[11px] font-caps-label text-gold-accent uppercase mb-1 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      <span>Grand Finals:</span>
                    </label>
                    <div className="px-2.5 py-1.5 bg-navy-mid rounded border border-gold-accent/50 text-gold-accent font-caps-label text-xs font-bold text-center">
                      Sep 10, 2026
                    </div>
                    <span className="text-[10px] text-gold-accent mt-1 block text-center font-caps-label">
                      Grand Finale
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/20 flex-shrink-0 bg-surface-container mt-2">
              <button
                type="button"
                onClick={() => setIsAutoGenerating(false)}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white hover:border-white transition-colors cursor-pointer"
              >
                Cancel / Close
              </button>
              <button
                type="submit"
                disabled={isGeneratingSlots}
                className="px-6 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">flash_on</span>
                <span>{isGeneratingSlots ? 'Generating...' : `Generate ${autoTeamCount}-Team Bracket`}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── INTERACTIVE SLOT PLACEMENT MODAL ── */}
      {slotAssignFixture && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSlotAssignFixture(null);
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        >
          <form
            onSubmit={handleConfirmSlotPlacement}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <div>
                <h3 className="font-display text-gold-accent uppercase text-lg">
                  PLACE COMPETITORS IN FIXTURE SLOT
                </h3>
                <span className="text-xs font-caps-label text-fog-text uppercase">
                  {slotAssignFixture.game?.name} &bull; {slotAssignFixture.round} &bull;{' '}
                  {fixtureDate(slotAssignFixture.scheduled_at)} ({fixtureTime(slotAssignFixture.scheduled_at)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSlotAssignFixture(null)}
                className="text-fog-text hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Format Toggle: Singles vs Doubles / Pairs */}
            <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded border border-outline-variant/30 mb-4">
              <span className="text-xs font-caps-label text-fog-text uppercase font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-gold-accent">tune</span>
                <span>Match Format:</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSlotMatchFormat('individual')}
                  className={`px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors ${
                    slotMatchFormat === 'individual'
                      ? 'bg-primary/30 border-primary text-white shadow-sm'
                      : 'bg-surface-container border-transparent text-fog-text hover:text-white'
                  }`}
                >
                  👤 Singles (1v1 Athlete)
                </button>
                <button
                  type="button"
                  onClick={() => setSlotMatchFormat('team')}
                  className={`px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors ${
                    slotMatchFormat === 'team'
                      ? 'bg-gold-accent/30 border-gold-accent text-gold-accent shadow-sm'
                      : 'bg-surface-container border-transparent text-fog-text hover:text-white'
                  }`}
                >
                  👥 Doubles / Pairs (2v2 Team)
                </button>
              </div>
            </div>

            {slotMatchFormat === 'team' ? (
              /* ── TEAM / PAIR PLACEMENT ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Team / Pair A */}
                <div className="p-4 bg-surface-container-lowest rounded border border-gold-accent/30">
                  <div className="font-caps-label text-xs uppercase text-gold-accent font-bold mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span>
                    <span>PAIR / SQUAD A</span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchAId}
                        onChange={(e) => {
                          setSlotBatchAId(e.target.value);
                          setSlotTeamAId('');
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Select Registered Squad / Pair
                      </label>
                      <select
                        value={slotTeamAId}
                        onChange={(e) => {
                          setSlotTeamAId(e.target.value);
                          const t = registeredTeams.find((x) => x.id === e.target.value);
                          if (t) setSlotTeamAName(t.name);
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        <option value="">-- Choose or custom type below --</option>
                        {registeredTeams
                          .filter((t) => t.batch_id === slotBatchAId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Pair / Squad Name
                      </label>
                      <input
                        type="text"
                        value={slotTeamAName}
                        onChange={(e) => setSlotTeamAName(e.target.value)}
                        placeholder="e.g. 24SW Pair A or Hamza & Ali"
                        required
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Team / Pair B */}
                <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30">
                  <div className="font-caps-label text-xs uppercase text-fog-text font-bold mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span>
                    <span>PAIR / SQUAD B</span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchBId}
                        onChange={(e) => {
                          setSlotBatchBId(e.target.value);
                          setSlotTeamBId('');
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Select Registered Squad / Pair
                      </label>
                      <select
                        value={slotTeamBId}
                        onChange={(e) => {
                          setSlotTeamBId(e.target.value);
                          const t = registeredTeams.find((x) => x.id === e.target.value);
                          if (t) setSlotTeamBName(t.name);
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        <option value="">-- Choose or custom type below --</option>
                        {registeredTeams
                          .filter((t) => t.batch_id === slotBatchBId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Pair / Squad Name
                      </label>
                      <input
                        type="text"
                        value={slotTeamBName}
                        onChange={(e) => setSlotTeamBName(e.target.value)}
                        placeholder="e.g. 23AI Pair A or Usman & Bilal"
                        required
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── INDIVIDUAL ATHLETE PLACEMENT ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Athlete A */}
                <div className="p-4 bg-surface-container-lowest rounded border border-primary/40">
                  <div className="font-caps-label text-xs uppercase text-primary font-bold mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">person</span>
                    <span>ATHLETE A (SINGLES)</span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchAId}
                        onChange={(e) => {
                          setSlotBatchAId(e.target.value);
                          setSlotPlayerAId('');
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Select Registered Athlete
                      </label>
                      <select
                        value={slotPlayerAId}
                        onChange={(e) => {
                          setSlotPlayerAId(e.target.value);
                          const p = registeredPlayers.find((x) => x.id === e.target.value);
                          if (p) {
                            setSlotPlayerAName(p.name);
                            setSlotPlayerARollNo(p.roll_no || '');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        <option value="">-- Choose or type below --</option>
                        {registeredPlayers
                          .filter((p) => p.batch_id === slotBatchAId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.roll_no || 'No Roll'})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Athlete Name"
                        value={slotPlayerAName}
                        onChange={(e) => setSlotPlayerAName(e.target.value)}
                        required
                        className="w-full px-2 py-1 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-primary"
                      />
                      <input
                        type="text"
                        placeholder="Roll No"
                        value={slotPlayerARollNo}
                        onChange={(e) => setSlotPlayerARollNo(e.target.value)}
                        className="w-full px-2 py-1 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-table-numeral"
                      />
                    </div>
                  </div>
                </div>

                {/* Athlete B */}
                <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30">
                  <div className="font-caps-label text-xs uppercase text-fog-text font-bold mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">person</span>
                    <span>ATHLETE B (SINGLES)</span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchBId}
                        onChange={(e) => {
                          setSlotBatchBId(e.target.value);
                          setSlotPlayerBId('');
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Select Registered Athlete
                      </label>
                      <select
                        value={slotPlayerBId}
                        onChange={(e) => {
                          setSlotPlayerBId(e.target.value);
                          const p = registeredPlayers.find((x) => x.id === e.target.value);
                          if (p) {
                            setSlotPlayerBName(p.name);
                            setSlotPlayerBRollNo(p.roll_no || '');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        <option value="">-- Choose or type below --</option>
                        {registeredPlayers
                          .filter((p) => p.batch_id === slotBatchBId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.roll_no || 'No Roll'})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Athlete Name"
                        value={slotPlayerBName}
                        onChange={(e) => setSlotPlayerBName(e.target.value)}
                        required
                        className="w-full px-2 py-1 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-white"
                      />
                      <input
                        type="text"
                        placeholder="Roll No"
                        value={slotPlayerBRollNo}
                        onChange={(e) => setSlotPlayerBRollNo(e.target.value)}
                        className="w-full px-2 py-1 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-table-numeral"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setSlotAssignFixture(null)}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPlacingSlot}
                className="px-6 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">how_to_reg</span>
                <span>{isPlacingSlot ? 'Assigning...' : 'Place in Slot'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Single Match Schedule Form ── */}
      {isCreating && (
        <form
          onSubmit={handleScheduleMatch}
          className="mb-8 p-6 bg-surface-container border border-gold-accent rounded shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3 mb-6">
            <div>
              <h3 className="font-display text-gold-accent uppercase text-lg">
                SCHEDULE NEW MATCH &bull; {selectedGame.name} ({selectedGame.format.toUpperCase()})
              </h3>
              <p className="text-xs text-fog-text">
                Select registered teams or participants for both sides, configure match timing, and register into database.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded text-xs font-caps-label uppercase font-bold ${
                  isTeamSport
                    ? 'bg-gold-accent/20 text-gold-accent border border-gold-accent/40'
                    : 'bg-primary/20 text-primary border border-primary/40'
                }`}
              >
                {isTeamSport ? 'Team Match Setup' : 'Individual Singles Setup'}
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/40 rounded text-fog-text hover:text-white flex items-center gap-1 text-xs font-caps-label uppercase cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">close</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Sport
              </label>
              <select
                value={gameId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setGameId(newId);
                  const sel = games.find((g) => g.id === newId);
                  if (sel) {
                    if (sel.slug === 'badminton' || sel.slug === 'table-tennis') {
                      // racket sport: preserve user choice or set to doubles
                    } else {
                      setSingleMatchFormat(sel.format === 'team' ? 'team' : 'individual');
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.format})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Tournament Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="group">Group / League Stage</option>
                <option value="semifinal">Semi-Final</option>
                <option value="final">Championship Final</option>
                <option value="friendly">Friendly / Exhibition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Round Label
              </label>
              <input
                type="text"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                required
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Category
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
          </div>

          {/* Racket Sport Competition Mode Toggle */}
          {isRacketSport && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-container-lowest rounded border border-gold-accent/30 mb-6">
              <span className="text-xs font-caps-label text-gold-accent uppercase font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">sports_tennis</span>
                <span>{selectedGame.name} Competition Mode:</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSingleMatchFormat('team')}
                  className={`px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors ${
                    singleMatchFormat === 'team'
                      ? 'bg-gold-accent/30 border-gold-accent text-gold-accent shadow-sm'
                      : 'bg-surface-container border-transparent text-fog-text hover:text-white'
                  }`}
                >
                  👥 Doubles / Pairs (2v2 Team)
                </button>
                <button
                  type="button"
                  onClick={() => setSingleMatchFormat('individual')}
                  className={`px-3 py-1.5 rounded text-xs font-caps-label uppercase font-bold border transition-colors ${
                    singleMatchFormat === 'individual'
                      ? 'bg-primary/30 border-primary text-white shadow-sm'
                      : 'bg-surface-container border-transparent text-fog-text hover:text-white'
                  }`}
                >
                  👤 Singles (1v1 Athlete)
                </button>
              </div>
            </div>
          )}

          {/* ── COMPETITOR SELECTION FROM REGISTERED TEAMS / ATHLETES ── */}
          {isTeamSport ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* Team A Selection Card */}
              <div className="p-4 bg-surface-container-lowest rounded border border-gold-accent/30 space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="font-caps-label text-xs uppercase text-gold-accent font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    <span>TEAM A / FIRST COMPETITOR</span>
                  </div>
                  <span className="text-[10px] font-caps-label text-fog-text uppercase">
                    {registeredTeams.filter((t) => t.batch_id === batchAId).length} Teams in Batch
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Select Batch / Department
                  </label>
                  <select
                    value={batchAId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setBatchAId(bId);
                      setTeamAId('');
                      const matchTeam = registeredTeams.find((t) => t.batch_id === bId);
                      if (matchTeam) {
                        setTeamAId(matchTeam.id);
                        setTeamAName(matchTeam.name);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.department?.name || 'MUET'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-gold-accent uppercase mb-1 font-bold">
                    Choose from Registered Teams
                  </label>
                  <select
                    value={teamAId}
                    onChange={(e) => {
                      setTeamAId(e.target.value);
                      const t = registeredTeams.find((x) => x.id === e.target.value);
                      if (t) setTeamAName(t.name);
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-gold-accent/50 rounded text-white text-xs font-bold"
                  >
                    <option value="">-- Choose Registered Team or Type Below --</option>
                    {registeredTeams
                      .filter((t) => t.batch_id === batchAId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.game ? `(${t.game.name})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Team Name (Selected or Custom)
                  </label>
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    placeholder="e.g. 24SW Cricket XI or Team Alpha"
                    required
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
                  />
                </div>
              </div>

              {/* Team B Selection Card */}
              <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="font-caps-label text-xs uppercase text-fog-text font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    <span>TEAM B / OPPONENT</span>
                  </div>
                  <span className="text-[10px] font-caps-label text-fog-text uppercase">
                    {registeredTeams.filter((t) => t.batch_id === batchBId).length} Teams in Batch
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Select Batch / Department
                  </label>
                  <select
                    value={batchBId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setBatchBId(bId);
                      setTeamBId('');
                      const matchTeam = registeredTeams.find((t) => t.batch_id === bId);
                      if (matchTeam) {
                        setTeamBId(matchTeam.id);
                        setTeamBName(matchTeam.name);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.department?.name || 'MUET'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-gold-accent uppercase mb-1 font-bold">
                    Choose from Registered Teams
                  </label>
                  <select
                    value={teamBId}
                    onChange={(e) => {
                      setTeamBId(e.target.value);
                      const t = registeredTeams.find((x) => x.id === e.target.value);
                      if (t) setTeamBName(t.name);
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-gold-accent/50 rounded text-white text-xs font-bold"
                  >
                    <option value="">-- Choose Registered Team or Type Below --</option>
                    {registeredTeams
                      .filter((t) => t.batch_id === batchBId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.game ? `(${t.game.name})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Team Name (Selected or Custom)
                  </label>
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    placeholder="e.g. 23AI Cricket XI or Team Beta"
                    required
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* Athlete A Selection Card */}
              <div className="p-4 bg-surface-container-lowest rounded border border-primary/40 space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="font-caps-label text-xs uppercase text-primary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>ATHLETE A (SINGLES)</span>
                  </div>
                  <span className="text-[10px] font-caps-label text-fog-text uppercase">
                    {registeredPlayers.filter((p) => p.batch_id === batchAId).length} Players in Batch
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Select Batch / Department
                  </label>
                  <select
                    value={batchAId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setBatchAId(bId);
                      setPlayerAId('');
                      const matchPlayer = registeredPlayers.find((p) => p.batch_id === bId);
                      if (matchPlayer) {
                        setPlayerAId(matchPlayer.id);
                        setPlayerAName(matchPlayer.name);
                        setPlayerARollNo(matchPlayer.roll_no || '');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.department?.name || 'MUET'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-primary uppercase mb-1 font-bold">
                    Choose from Registered Participants
                  </label>
                  <select
                    value={playerAId}
                    onChange={(e) => {
                      setPlayerAId(e.target.value);
                      const p = registeredPlayers.find((x) => x.id === e.target.value);
                      if (p) {
                        setPlayerAName(p.name);
                        setPlayerARollNo(p.roll_no || '');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-primary/40 rounded text-white text-xs font-bold"
                  >
                    <option value="">-- Choose Registered Athlete or Type Below --</option>
                    {registeredPlayers
                      .filter((p) => p.batch_id === batchAId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.roll_no || 'No Roll #'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                      Athlete Name
                    </label>
                    <input
                      type="text"
                      value={playerAName}
                      onChange={(e) => setPlayerAName(e.target.value)}
                      placeholder="e.g. Hamza Shaikh"
                      required
                      className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={playerARollNo}
                      onChange={(e) => setPlayerARollNo(e.target.value)}
                      placeholder="e.g. 24SW01"
                      className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Athlete B Selection Card */}
              <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="font-caps-label text-xs uppercase text-fog-text font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>ATHLETE B (SINGLES)</span>
                  </div>
                  <span className="text-[10px] font-caps-label text-fog-text uppercase">
                    {registeredPlayers.filter((p) => p.batch_id === batchBId).length} Players in Batch
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Select Batch / Department
                  </label>
                  <select
                    value={batchBId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setBatchBId(bId);
                      setPlayerBId('');
                      const matchPlayer = registeredPlayers.find((p) => p.batch_id === bId);
                      if (matchPlayer) {
                        setPlayerBId(matchPlayer.id);
                        setPlayerBName(matchPlayer.name);
                        setPlayerBRollNo(matchPlayer.roll_no || '');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.department?.name || 'MUET'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-caps-label text-primary uppercase mb-1 font-bold">
                    Choose from Registered Participants
                  </label>
                  <select
                    value={playerBId}
                    onChange={(e) => {
                      setPlayerBId(e.target.value);
                      const p = registeredPlayers.find((x) => x.id === e.target.value);
                      if (p) {
                        setPlayerBName(p.name);
                        setPlayerBRollNo(p.roll_no || '');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-container border border-primary/40 rounded text-white text-xs font-bold"
                  >
                    <option value="">-- Choose Registered Athlete or Type Below --</option>
                    {registeredPlayers
                      .filter((p) => p.batch_id === batchBId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.roll_no || 'No Roll #'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                      Athlete Name
                    </label>
                    <input
                      type="text"
                      value={playerBName}
                      onChange={(e) => setPlayerBName(e.target.value)}
                      placeholder="e.g. Bilal Ahmed"
                      required
                      className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={playerBRollNo}
                      onChange={(e) => setPlayerBRollNo(e.target.value)}
                      placeholder="e.g. 23AI45"
                      className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="p-4 bg-navy-mid/60 border border-outline-variant/30 rounded mb-6">
            <label className="block text-xs font-caps-label text-gold-accent uppercase mb-2 font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Match Date &amp; Kickoff Time</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-base">event_available</span>
              <span>Confirm &amp; Register Match</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-5 py-2.5 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Edit Fixture Modal ── */}
      {editingFixture && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingFixture(null);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        >
          <form
            onSubmit={handleUpdateFixture}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
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
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
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
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
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
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Time
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
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

              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
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

      {/* ── Fixtures Table with Slot Placement ── */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SPORT &amp; ROUND</th>
              <th className="p-3.5">SLOT COMPETITORS</th>
              <th className="p-3.5">DATE, TIME &amp; VENUE</th>
              <th className="p-3.5">STATUS</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {filteredFixtures.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-fog-text">
                  <span className="material-symbols-outlined text-3xl mb-1 text-gold-accent/50 block">
                    event_busy
                  </span>
                  No fixtures currently scheduled. Click <strong>Auto-Schedule Bracket</strong> or <strong>Schedule Single Match</strong> above to create tournament matches.
                </td>
              </tr>
            ) : (
              filteredFixtures.map((f) => {
                const hasCompetitorA = !!(f.team_a?.name || f.player_a?.name);
                const hasCompetitorB = !!(f.team_b?.name || f.player_b?.name);
                const isSlotUnassigned = !hasCompetitorA || !hasCompetitorB;

                return (
                  <tr key={f.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-3.5">
                      <div className="font-display text-white text-base">
                        {f.game?.name}
                      </div>
                      <div className="text-[11px] font-caps-label text-gold-accent uppercase flex items-center gap-1.5">
                        <span>{f.round} &bull; {f.stage}</span>
                        {f.stage === 'final' && (
                          <span className="px-1.5 py-0.2 bg-gold-accent/20 text-gold-accent border border-gold-accent/40 rounded text-[9px] font-bold">
                            Sep 10 Final
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Slot Competitors with Interactive Slot Placement */}
                    <td className="p-3.5 text-white font-caps-label">
                      {isSlotUnassigned ? (
                        <div className="flex items-center gap-2">
                          <span className="text-fog-text/70 italic">
                            {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                            {f.team_b?.name || f.player_b?.name || 'TBD'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const isTeam = !!f.team_a_id || f.game?.format === 'team' || (!f.player_a_id && (f.game?.slug === 'badminton' || f.game?.slug === 'table-tennis'));
                              setSlotAssignFixture(f);
                              setSlotMatchFormat(isTeam ? 'team' : 'individual');
                              setSlotTeamAId(f.team_a_id || '');
                              setSlotTeamAName(f.team_a?.name || '');
                              setSlotTeamBId(f.team_b_id || '');
                              setSlotTeamBName(f.team_b?.name || '');
                              setSlotPlayerAId(f.player_a_id || '');
                              setSlotPlayerAName(f.player_a?.name || '');
                              setSlotPlayerARollNo(f.player_a?.roll_no || '');
                              setSlotPlayerBId(f.player_b_id || '');
                              setSlotPlayerBName(f.player_b?.name || '');
                              setSlotPlayerBRollNo(f.player_b?.roll_no || '');
                              if (f.team_a?.batch_id) setSlotBatchAId(f.team_a.batch_id);
                              else if (f.player_a?.batch_id) setSlotBatchAId(f.player_a.batch_id);
                              if (f.team_b?.batch_id) setSlotBatchBId(f.team_b.batch_id);
                              else if (f.player_b?.batch_id) setSlotBatchBId(f.player_b.batch_id);
                            }}
                            className="px-2.5 py-1 text-[11px] font-caps-label uppercase bg-gold-accent/20 text-gold-accent border border-gold-accent/50 hover:bg-gold-accent hover:text-navy-deep rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">how_to_reg</span>
                            <span>Place Competitors</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            {f.team_a?.name || f.player_a?.name} vs{' '}
                            {f.team_b?.name || f.player_b?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const isTeam = !!f.team_a_id || f.game?.format === 'team' || (!f.player_a_id && (f.game?.slug === 'badminton' || f.game?.slug === 'table-tennis'));
                              setSlotAssignFixture(f);
                              setSlotMatchFormat(isTeam ? 'team' : 'individual');
                              setSlotTeamAId(f.team_a_id || '');
                              setSlotTeamAName(f.team_a?.name || '');
                              setSlotTeamBId(f.team_b_id || '');
                              setSlotTeamBName(f.team_b?.name || '');
                              setSlotPlayerAId(f.player_a_id || '');
                              setSlotPlayerAName(f.player_a?.name || '');
                              setSlotPlayerARollNo(f.player_a?.roll_no || '');
                              setSlotPlayerBId(f.player_b_id || '');
                              setSlotPlayerBName(f.player_b?.name || '');
                              setSlotPlayerBRollNo(f.player_b?.roll_no || '');
                              if (f.team_a?.batch_id) setSlotBatchAId(f.team_a.batch_id);
                              else if (f.player_a?.batch_id) setSlotBatchAId(f.player_a.batch_id);
                              if (f.team_b?.batch_id) setSlotBatchBId(f.team_b.batch_id);
                              else if (f.player_b?.batch_id) setSlotBatchBId(f.player_b.batch_id);
                            }}
                            className="text-fog-text hover:text-gold-accent transition-colors"
                            title="Re-assign slot competitors"
                          >
                            <span className="material-symbols-outlined text-xs">swap_horiz</span>
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-fog-text">
                      <div className="font-table-numeral text-white font-medium">
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
                          setIsAutoGenerating(false);
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
