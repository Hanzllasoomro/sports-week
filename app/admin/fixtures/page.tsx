'use client';

import { useState, useEffect } from 'react';
import { scheduleMatch, updateFixture, deleteFixture } from '@/app/actions/fixtures';
import type { FixtureWithRelations, Game, Batch } from '@/types';
import { MOCK_GAMES, MOCK_BATCHES, MOCK_FIXTURES } from '@/lib/mock-data';
import { fixtureTime, fixtureDate } from '@/lib/utils';

export default function AdminFixturesPage() {
  const [fixtures, setFixtures] = useState<FixtureWithRelations[]>(MOCK_FIXTURES);
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

  // Form State for dynamic match scheduling
  const [gameId, setGameId] = useState<string>(MOCK_GAMES[0].id);
  const [stage, setStage] = useState<'group' | 'semifinal' | 'final' | 'friendly'>('group');
  const [round, setRound] = useState<string>('Match 1');
  const [venue, setVenue] = useState<string>('MUET Gymnasium Arena');
  const [gender, setGender] = useState<'boys' | 'girls'>('boys');

  // Easy Date & Time Entry State
  const [matchDate, setMatchDate] = useState<string>('2026-09-08');
  const [matchTime, setMatchTime] = useState<string>('10:00');

  // Team Form Fields
  const [batchAId, setBatchAId] = useState<string>(MOCK_BATCHES[2].id); // 24SW
  const [teamAName, setTeamAName] = useState<string>('24SW Strikers');
  const [batchBId, setBatchBId] = useState<string>(MOCK_BATCHES[5].id); // 23AI
  const [teamBName, setTeamBName] = useState<string>('23AI Titans');

  // Individual Form Fields
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
          if (Array.isArray(fixData) && fixData.length > 0) {
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

  // Sync editing date & time when fixture is selected for edit
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
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
            FIXTURE &amp; SCHEDULE MANAGER
          </h1>
          <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
            Dynamic match scheduling for Team Squads and Individual Athletes with easy date &amp; time controls
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingFixture(null);
          }}
          className="bg-gold-accent text-navy-deep font-caps-label text-xs uppercase px-4 py-2.5 font-bold hover:bg-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">
            {isCreating ? 'close' : 'add'}
          </span>
          <span>{isCreating ? 'Cancel' : 'Schedule New Match'}</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="mb-6 p-3 bg-navy-mid border border-gold-accent/40 rounded text-xs font-caps-label text-gold-accent">
          {feedbackMessage}
        </div>
      )}

      {/* ── Dynamic Schedule Fixture Form ── */}
      {isCreating && (
        <form
          onSubmit={handleScheduleMatch}
          className="mb-8 p-6 bg-surface-container border border-gold-accent rounded shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3 mb-6">
            <h3 className="font-display text-gold-accent uppercase text-lg">
              SCHEDULE MATCH &bull; {selectedGame.name} ({selectedGame.format.toUpperCase()})
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

          {/* 1. Core Match Info */}
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

          {/* 2. Easy Date & Time Entry Panel */}
          <div className="p-4 bg-navy-mid/60 border border-outline-variant/30 rounded mb-6">
            <label className="block text-xs font-caps-label text-gold-accent uppercase mb-2 font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Match Date &amp; Kickoff Time</span>
            </label>

            {/* Quick Tournament Day Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-caps-label text-fog-text uppercase mr-1">
                Quick Days:
              </span>
              {[
                { label: 'Day 1 (Sep 8)', date: '2026-09-08' },
                { label: 'Day 2 (Sep 9)', date: '2026-09-09' },
                { label: 'Day 3 (Sep 10)', date: '2026-09-10' },
              ].map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setMatchDate(d.date)}
                  className={`px-3 py-1 text-xs font-caps-label uppercase rounded transition-colors cursor-pointer border ${
                    matchDate === d.date
                      ? 'bg-gold-accent text-navy-deep font-bold border-gold-accent'
                      : 'bg-surface-container-lowest text-fog-text border-outline-variant/40 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

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

            {/* Quick Time Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-caps-label text-fog-text uppercase mr-1">
                Common Kickoff Times:
              </span>
              {['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMatchTime(t)}
                  className={`px-2 py-0.5 text-[11px] font-caps-label rounded transition-colors cursor-pointer border ${
                    matchTime === t
                      ? 'bg-gold-accent text-navy-deep font-bold border-gold-accent'
                      : 'bg-surface-container text-fog-text border-outline-variant/30 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Dynamic Competitors Setup (Same form system for both Team & Individual) */}
          {isTeamSport ? (
            /* ── TEAM SPORT SETUP (Batch -> Registered Squad or Custom Input) ── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-navy-mid/40 rounded border border-outline-variant/30 mb-6">
              {/* Team A */}
              <div className="p-4 bg-surface-container-lowest rounded border border-gold-accent/30">
                <div className="font-caps-label text-xs uppercase text-gold-accent font-bold mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">shield</span>
                  <span>TEAM / SQUAD A</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Academic Batch
                    </label>
                    <select
                      value={batchAId}
                      onChange={(e) => {
                        setBatchAId(e.target.value);
                        const b = batches.find((x) => x.id === e.target.value);
                        setTeamAName(`${b?.code || 'Batch'} ${selectedGame.name}`);
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.department?.code || 'Dept'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Registered Squads Dropdown */}
                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Choose Registered Squad (or type below)
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setTeamAName(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs mb-2"
                    >
                      <option value="">-- Select from existing squads or customize --</option>
                      {registeredTeams
                        .filter((t) => t.batch_id === batchAId)
                        .map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Squad / Team Name
                    </label>
                    <input
                      type="text"
                      value={teamAName}
                      onChange={(e) => setTeamAName(e.target.value)}
                      required
                      placeholder="e.g. 24SW Strikers"
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-gold-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Team B */}
              <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30">
                <div className="font-caps-label text-xs uppercase text-fog-text font-bold mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">shield</span>
                  <span>TEAM / SQUAD B</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Academic Batch
                    </label>
                    <select
                      value={batchBId}
                      onChange={(e) => {
                        setBatchBId(e.target.value);
                        const b = batches.find((x) => x.id === e.target.value);
                        setTeamBName(`${b?.code || 'Batch'} ${selectedGame.name}`);
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.department?.code || 'Dept'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Registered Squads Dropdown */}
                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Choose Registered Squad (or type below)
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setTeamBName(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs mb-2"
                    >
                      <option value="">-- Select from existing squads or customize --</option>
                      {registeredTeams
                        .filter((t) => t.batch_id === batchBId)
                        .map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Squad / Team Name
                    </label>
                    <input
                      type="text"
                      value={teamBName}
                      onChange={(e) => setTeamBName(e.target.value)}
                      required
                      placeholder="e.g. 23AI Titans"
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── INDIVIDUAL SPORT SETUP (Batch -> Registered Athlete or Custom Input) ── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-navy-mid/40 rounded border border-outline-variant/30 mb-6">
              {/* Athlete A */}
              <div className="p-4 bg-surface-container-lowest rounded border border-primary/40">
                <div className="font-caps-label text-xs uppercase text-primary font-bold mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>ATHLETE / PLAYER A</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Batch
                    </label>
                    <select
                      value={batchAId}
                      onChange={(e) => setBatchAId(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.department?.code || 'Dept'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Select from Registered Athletes
                    </label>
                    <select
                      onChange={(e) => {
                        const p = registeredPlayers.find((x) => x.id === e.target.value);
                        if (p) {
                          setPlayerAName(p.name);
                          setPlayerARollNo(p.roll_no || '');
                        }
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs mb-2"
                    >
                      <option value="">-- Choose registered athlete or type below --</option>
                      {registeredPlayers
                        .filter((p) => p.batch_id === batchAId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.roll_no || 'No Roll No'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zaid Khan"
                        value={playerAName}
                        onChange={(e) => setPlayerAName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 24SW01"
                        value={playerARollNo}
                        onChange={(e) => setPlayerARollNo(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-table-numeral"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Athlete B */}
              <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/30">
                <div className="font-caps-label text-xs uppercase text-fog-text font-bold mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>ATHLETE / PLAYER B</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Batch
                    </label>
                    <select
                      value={batchBId}
                      onChange={(e) => setBatchBId(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.department?.code || 'Dept'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                      Select from Registered Athletes
                    </label>
                    <select
                      onChange={(e) => {
                        const p = registeredPlayers.find((x) => x.id === e.target.value);
                        if (p) {
                          setPlayerBName(p.name);
                          setPlayerBRollNo(p.roll_no || '');
                        }
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs mb-2"
                    >
                      <option value="">-- Choose registered athlete or type below --</option>
                      {registeredPlayers
                        .filter((p) => p.batch_id === batchBId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.roll_no || 'No Roll No'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bilal Ahmed"
                        value={playerBName}
                        onChange={(e) => setPlayerBName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-caps-label text-fog-text uppercase mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 23AI15"
                        value={playerBRollNo}
                        onChange={(e) => setPlayerBRollNo(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded text-white text-xs font-table-numeral"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-gold-accent text-navy-deep font-caps-label text-xs uppercase font-bold hover:bg-white transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined text-base">event_available</span>
            <span>Confirm &amp; Register Match</span>
          </button>
        </form>
      )}

      {/* ── Edit Fixture Modal with Easy Date & Time ── */}
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

              {/* Easy Date & Time inputs */}
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
              {deletingFixture.status === 'completed' && (
                <span className="block mt-2 text-live-red font-bold">
                  Warning: This match is completed. Deleting it will automatically deduct earned points and recompute batch standings!
                </span>
              )}
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

      {/* ── Fixtures Table ── */}
      <div className="overflow-x-auto bg-surface-container border border-outline-variant/20 rounded shadow">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-navy-mid text-cream font-caps-label text-xs uppercase border-b border-outline-variant/30">
              <th className="p-3.5">SPORT &amp; ROUND</th>
              <th className="p-3.5">MATCHUP</th>
              <th className="p-3.5">TIME &amp; VENUE</th>
              <th className="p-3.5">STATUS</th>
              <th className="p-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {filteredFixtures.map((f) => (
              <tr key={f.id} className="hover:bg-surface-container-high transition-colors">
                <td className="p-3.5">
                  <div className="font-display text-white text-base">
                    {f.game?.name}
                  </div>
                  <div className="text-[11px] font-caps-label text-gold-accent uppercase">
                    {f.round} &bull; {f.stage}
                  </div>
                </td>
                <td className="p-3.5 text-white font-caps-label">
                  {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                  {f.team_b?.name || f.player_b?.name || 'TBD'}
                </td>
                <td className="p-3.5 text-fog-text">
                  <div className="font-table-numeral text-white">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
