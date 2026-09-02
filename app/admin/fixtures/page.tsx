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
  const [autoTeamCount, setAutoTeamCount] = useState<4 | 8 | 9>(8);
  const [autoGender, setAutoGender] = useState<'boys' | 'girls'>('boys');
  const [autoQuarterDate, setAutoQuarterDate] = useState<string>('2026-09-08');
  const [autoSemiDate, setAutoSemiDate] = useState<string>('2026-09-09');
  const [autoVenue, setAutoVenue] = useState<string>('MUET Main Sports Arena');
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  // ── Interactive Slot Placement State ──
  const [slotAssignFixture, setSlotAssignFixture] = useState<FixtureWithRelations | null>(null);
  const [slotBatchAId, setSlotBatchAId] = useState<string>(MOCK_BATCHES[2].id);
  const [slotTeamAName, setSlotTeamAName] = useState<string>('');
  const [slotPlayerAName, setSlotPlayerAName] = useState<string>('');
  const [slotPlayerARollNo, setSlotPlayerARollNo] = useState<string>('');

  const [slotBatchBId, setSlotBatchBId] = useState<string>(MOCK_BATCHES[5].id);
  const [slotTeamBName, setSlotTeamBName] = useState<string>('');
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
  const [teamAName, setTeamAName] = useState<string>('24SW Strikers');
  const [batchBId, setBatchBId] = useState<string>(MOCK_BATCHES[5].id);
  const [teamBName, setTeamBName] = useState<string>('23AI Titans');

  const [playerAName, setPlayerAName] = useState<string>('');
  const [playerARollNo, setPlayerARollNo] = useState<string>('');
  const [playerBName, setPlayerBName] = useState<string>('');
  const [playerBRollNo, setPlayerBRollNo] = useState<string>('');

  const selectedGame = games.find((g) => g.id === gameId) || games[0];
  const isTeamSport = selectedGame.format === 'team';

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
          }
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          if (Array.isArray(teamData)) {
            setRegisteredTeams(teamData);
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
      quarter_date: autoQuarterDate,
      semi_date: autoSemiDate,
      venue: autoVenue,
    });

    if (res.error) {
      setFeedbackMessage(`Error: ${res.error.message}`);
    } else {
      setFeedbackMessage(
        `Successfully generated ${res.data?.count || ''} tournament bracket slots! All finals scheduled on Sep 10, 2026.`
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
    setTimeout(() => setFeedbackMessage(null), 4500);
  }

  // ── Assign Competitors to a Slot ──
  async function handleConfirmSlotPlacement(e: React.FormEvent) {
    e.preventDefault();
    if (!slotAssignFixture) return;

    setIsPlacingSlot(true);
    setFeedbackMessage('Placing competitors into fixture slot...');

    const isTeam = slotAssignFixture.game?.format === 'team';
    const payload: any = {
      fixture_id: slotAssignFixture.id,
      is_team: isTeam,
      game_id: slotAssignFixture.game_id,
      gender: slotAssignFixture.game?.gender === 'girls' ? 'girls' : 'boys',
    };

    if (isTeam) {
      payload.team_a_name = slotTeamAName;
      payload.team_a_batch_id = slotBatchAId;
      payload.team_b_name = slotTeamBName;
      payload.team_b_batch_id = slotBatchBId;
    } else {
      payload.player_a_name = slotPlayerAName || 'Athlete A';
      payload.player_a_roll_no = slotPlayerARollNo;
      payload.player_a_batch_id = slotBatchAId;
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
      payload.team_a_name = teamAName;
      payload.team_a_batch_id = batchAId;
      payload.team_b_name = teamBName;
      payload.team_b_batch_id = batchBId;
    } else {
      payload.player_a_name = playerAName || 'Athlete A';
      payload.player_a_roll_no = playerARollNo;
      payload.player_a_batch_id = batchAId;
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAutoGenerateSlots}
            className="w-full max-w-2xl bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent text-2xl">auto_awesome</span>
                <h3 className="font-display text-gold-accent uppercase text-lg">
                  AUTOMATIC TOURNAMENT BRACKET GENERATOR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoGenerating(false)}
                className="text-fog-text hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-fog-text mb-5 font-body leading-relaxed">
              Generate tournament fixture slot placeholders automatically based on your desired bracket size. You decide the dates for Quarter-Finals and Semi-Finals below, while <strong>all Championship Finals are locked to September 10, 2026</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Sport Picker */}
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Target Sport
                </label>
                <select
                  value={autoGameId}
                  onChange={(e) => setAutoGameId(e.target.value)}
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

              {/* Bracket Size */}
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Number of Teams / Participants
                </label>
                <select
                  value={autoTeamCount}
                  onChange={(e) => setAutoTeamCount(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs font-bold"
                >
                  <option value={4}>4 Teams (2 Semi-Finals + 1 Final)</option>
                  <option value={8}>8 Teams (4 Quarter-Finals + 2 Semi-Finals + 1 Final)</option>
                  <option value={9}>9 Academic Batches (Playoff + 4 Quarters + 2 Semis + 1 Final)</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                  Category
                </label>
                <select
                  value={autoGender}
                  onChange={(e) => setAutoGender(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
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

            {/* ── Date Configuration (Admin decides non-finals, Finals locked on Sep 10) ── */}
            <div className="p-4 bg-navy-mid/60 border border-outline-variant/30 rounded mb-6">
              <label className="block text-xs font-caps-label text-white uppercase mb-3 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-gold-accent">event</span>
                <span>Stage Dates Schedule</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Quarter / Group Date (Admin Decides) */}
                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Quarter-Finals Date:
                  </label>
                  <input
                    type="date"
                    value={autoQuarterDate}
                    onChange={(e) => setAutoQuarterDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                  />
                  <span className="text-[10px] text-win-green mt-1 block">Admin Configurable</span>
                </div>

                {/* Semi Date (Admin Decides) */}
                <div>
                  <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                    Semi-Finals Date:
                  </label>
                  <input
                    type="date"
                    value={autoSemiDate}
                    onChange={(e) => setAutoSemiDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
                  />
                  <span className="text-[10px] text-win-green mt-1 block">Admin Configurable</span>
                </div>

                {/* Finals Date (STRICTLY LOCKED TO SEP 10) */}
                <div>
                  <label className="block text-[11px] font-caps-label text-gold-accent uppercase mb-1 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    <span>Championship Finals:</span>
                  </label>
                  <div className="px-3 py-2 bg-navy-mid rounded border border-gold-accent/50 text-gold-accent font-caps-label text-xs font-bold text-center">
                    September 10, 2026
                  </div>
                  <span className="text-[10px] text-gold-accent mt-1 block text-center">
                    Locked to Grand Finale
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsAutoGenerating(false)}
                className="px-4 py-2 border border-outline-variant/40 text-fog-text font-caps-label text-xs uppercase hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGeneratingSlots}
                className="px-6 py-2 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">flash_on</span>
                <span>{isGeneratingSlots ? 'Generating...' : 'Generate Bracket Slots'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── INTERACTIVE SLOT PLACEMENT MODAL ── */}
      {slotAssignFixture && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmSlotPlacement}
            className="w-full max-w-xl bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
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

            {slotAssignFixture.game?.format === 'team' ? (
              /* ── TEAM PLACEMENT ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Team A */}
                <div className="p-4 bg-surface-container-lowest rounded border border-gold-accent/30">
                  <div className="font-caps-label text-xs uppercase text-gold-accent font-bold mb-2">
                    TEAM / SQUAD A
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchAId}
                        onChange={(e) => setSlotBatchAId(e.target.value)}
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
                        Registered Squad
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) setSlotTeamAName(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        <option value="">-- Choose or custom type below --</option>
                        {registeredTeams
                          .filter((t) => t.batch_id === slotBatchAId)
                          .map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Squad Name
                      </label>
                      <input
                        type="text"
                        value={slotTeamAName}
                        onChange={(e) => setSlotTeamAName(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Team B */}
                <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30">
                  <div className="font-caps-label text-xs uppercase text-fog-text font-bold mb-2">
                    TEAM / SQUAD B
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchBId}
                        onChange={(e) => setSlotBatchBId(e.target.value)}
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
                        Registered Squad
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) setSlotTeamBName(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                      >
                        <option value="">-- Choose or custom type below --</option>
                        {registeredTeams
                          .filter((t) => t.batch_id === slotBatchBId)
                          .map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Squad Name
                      </label>
                      <input
                        type="text"
                        value={slotTeamBName}
                        onChange={(e) => setSlotTeamBName(e.target.value)}
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
                  <div className="font-caps-label text-xs uppercase text-primary font-bold mb-2">
                    ATHLETE A
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchAId}
                        onChange={(e) => setSlotBatchAId(e.target.value)}
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
                        Select Athlete
                      </label>
                      <select
                        onChange={(e) => {
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
                  <div className="font-caps-label text-xs uppercase text-fog-text font-bold mb-2">
                    ATHLETE B
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-caps-label text-fog-text uppercase mb-1">
                        Batch
                      </label>
                      <select
                        value={slotBatchBId}
                        onChange={(e) => setSlotBatchBId(e.target.value)}
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
                        Select Athlete
                      </label>
                      <select
                        onChange={(e) => {
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
            <h3 className="font-display text-gold-accent uppercase text-lg">
              SCHEDULE INDIVIDUAL MATCH &bull; {selectedGame.name} ({selectedGame.format.toUpperCase()})
            </h3>
            <span
              className={`px-2.5 py-1 rounded text-xs font-caps-label uppercase font-bold ${
                isTeamSport
                  ? 'bg-gold-accent/20 text-gold-accent border border-gold-accent/40'
                  : 'bg-primary/20 text-primary border border-primary/40'
              }`}
            >
              {isTeamSport ? 'Team Match Setup' : 'Individual Singles Setup'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-caps-label text-fog-text uppercase mb-1 font-bold">
                Sport
              </label>
              <select
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-white text-xs"
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

          <button
            type="submit"
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined text-base">event_available</span>
            <span>Confirm &amp; Register Match</span>
          </button>
        </form>
      )}

      {/* ── Edit Fixture Modal ── */}
      {editingFixture && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateFixture}
            className="w-full max-w-xl bg-surface-container border border-gold-accent p-6 rounded shadow-2xl"
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
                              setSlotAssignFixture(f);
                              setSlotTeamAName('');
                              setSlotTeamBName('');
                              setSlotPlayerAName('');
                              setSlotPlayerBName('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-caps-label uppercase bg-gold-accent/20 text-gold-accent border border-gold-accent/50 hover:bg-gold-accent hover:text-navy-deep rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                            <span>Place Teams</span>
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
                              setSlotAssignFixture(f);
                              setSlotTeamAName(f.team_a?.name || '');
                              setSlotTeamBName(f.team_b?.name || '');
                              setSlotPlayerAName(f.player_a?.name || '');
                              setSlotPlayerBName(f.player_b?.name || '');
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
