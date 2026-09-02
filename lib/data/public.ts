import { createClient } from '@/lib/supabase/server';
import type { Batch, Game, StandingRow, FixtureWithRelations, Player } from '@/types';

// ─── Canonical Seed / Fallback Data ──────────────────────────────────────────

export const MOCK_DEPARTMENTS = [
  { id: 'd1000000-0000-0000-0000-000000000001', code: 'SW' as const, name: 'Software Engineering' },
  { id: 'd1000000-0000-0000-0000-000000000002', code: 'AI' as const, name: 'Artificial Intelligence' },
];

export const MOCK_BATCHES: (Batch & { department: typeof MOCK_DEPARTMENTS[number] })[] = [
  { id: 'b1000000-0000-0000-0000-000000000001', code: '22SW', department_id: MOCK_DEPARTMENTS[0].id, year: 2022, department: MOCK_DEPARTMENTS[0] },
  { id: 'b1000000-0000-0000-0000-000000000002', code: '23SW', department_id: MOCK_DEPARTMENTS[0].id, year: 2023, department: MOCK_DEPARTMENTS[0] },
  { id: 'b1000000-0000-0000-0000-000000000003', code: '24SW', department_id: MOCK_DEPARTMENTS[0].id, year: 2024, department: MOCK_DEPARTMENTS[0] },
  { id: 'b1000000-0000-0000-0000-000000000004', code: '25SW', department_id: MOCK_DEPARTMENTS[0].id, year: 2025, department: MOCK_DEPARTMENTS[0] },
  { id: 'b1000000-0000-0000-0000-000000000005', code: '26SW', department_id: MOCK_DEPARTMENTS[0].id, year: 2026, department: MOCK_DEPARTMENTS[0] },
  { id: 'b1000000-0000-0000-0000-000000000006', code: '23AI', department_id: MOCK_DEPARTMENTS[1].id, year: 2023, department: MOCK_DEPARTMENTS[1] },
  { id: 'b1000000-0000-0000-0000-000000000007', code: '24AI', department_id: MOCK_DEPARTMENTS[1].id, year: 2024, department: MOCK_DEPARTMENTS[1] },
  { id: 'b1000000-0000-0000-0000-000000000008', code: '25AI', department_id: MOCK_DEPARTMENTS[1].id, year: 2025, department: MOCK_DEPARTMENTS[1] },
  { id: 'b1000000-0000-0000-0000-000000000009', code: '26AI', department_id: MOCK_DEPARTMENTS[1].id, year: 2026, department: MOCK_DEPARTMENTS[1] },
];

export interface GameWithMeta extends Game {
  icon: string;
  description: string;
  rules: string[];
}

export const MOCK_GAMES: GameWithMeta[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Cricket',
    slug: 'cricket',
    format: 'team',
    gender: 'both',
    icon: 'sports_cricket',
    description: 'Tape ball cricket tournament with 6-over knockout rounds and 8-over finals.',
    rules: ['6 overs per innings (Group), 8 overs (Final)', 'Maximum 2 overs per bowler', 'Standard ICC tape ball street rules apply'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Futsal',
    slug: 'futsal',
    format: 'team',
    gender: 'boys',
    icon: 'sports_soccer',
    description: 'Fast-paced 5-a-side indoor football hosted at MUET Main Gymnasium.',
    rules: ['20-minute halves with rolling substitutions', 'No offside rule', 'Direct penalty shootout on tie in knockouts'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Volleyball',
    slug: 'volleyball',
    format: 'team',
    gender: 'boys',
    icon: 'sports_volleyball',
    description: 'Best-of-3 sets volleyball tournament played on the university court.',
    rules: ['Best of 3 sets (25 points each, decider 15 points)', 'Rally point scoring', 'Net-touch is a direct fault'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    name: 'Tug of War',
    slug: 'tug-of-war',
    format: 'team',
    gender: 'boys',
    icon: 'fitness_center',
    description: 'High-intensity 8-player squad test of strength on the main grass pitch.',
    rules: ['8 pullers per batch', 'Best of 3 pulls', 'No cleats or spiked footwear allowed'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    name: 'Throwball',
    slug: 'throwball',
    format: 'team',
    gender: 'girls',
    icon: 'sports_handball',
    description: 'Exciting 7-a-side women throwball championship.',
    rules: ['7 active players on court', 'Ball must be caught with both hands and released within 3 seconds', 'No jumping while throwing'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    name: 'Ludo',
    slug: 'ludo',
    format: 'team',
    gender: 'both',
    icon: 'casino',
    description: 'Team strategy board championship with paired batch competitors.',
    rules: ['2 players per team (doubles format)', 'First team to bring all 8 tokens home wins', 'Standard 4-color board rules'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    name: 'Badminton',
    slug: 'badminton',
    format: 'individual',
    gender: 'both',
    icon: 'sports_tennis',
    description: 'Singles tournament testing agility and racket speed.',
    rules: ['Singles format for Boys & Girls', 'Best of 3 sets to 21 points', 'Standard BWF service and line rules'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000008',
    name: 'Table Tennis',
    slug: 'table-tennis',
    format: 'individual',
    gender: 'both',
    icon: 'sports_tennis',
    description: 'Lightning-fast singles ping pong matches in the sports complex hall.',
    rules: ['Best of 5 games to 11 points', 'Alternate 2 serves', 'ITTF standard rubber and racket rules'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000009',
    name: 'Chess',
    slug: 'chess',
    format: 'individual',
    gender: 'both',
    icon: 'chess',
    description: 'Rapid chess championship (15 mins + 10s increment).',
    rules: ['FIDE rapid rules with digital clocks', 'Touch-move strictly enforced', 'Swiss system or knockout depending on bracket'],
  },
  {
    id: 'c1000000-0000-0000-0000-000000000010',
    name: 'Mini Marathon',
    slug: 'mini-marathon',
    format: 'individual',
    gender: 'both',
    icon: 'directions_run',
    description: '3.5km endurance campus circuit race starting and finishing at the Gymnasium.',
    rules: ['Open to all registered batch runners', 'Checkpoints must be stamped along the campus loop', 'Top 3 runners score podium points'],
  },
];

export const MOCK_STANDINGS: StandingRow[] = [
  {
    rank: 1,
    batch: MOCK_BATCHES[2], // 24SW
    total_points: 62,
    breakdown: {
      cricket: { boys: 10, girls: 7 },
      futsal: { boys: 10, girls: 0 },
      volleyball: { boys: 7, girls: 0 },
      throwball: { boys: 0, girls: 10 },
      badminton: { boys: 5, girls: 3 },
      chess: { boys: 7, girls: 3 },
    },
  },
  {
    rank: 2,
    batch: MOCK_BATCHES[5], // 23AI
    total_points: 54,
    breakdown: {
      cricket: { boys: 7, girls: 5 },
      futsal: { boys: 7, girls: 0 },
      'tug-of-war': { boys: 10, girls: 0 },
      badminton: { boys: 10, girls: 5 },
      'table-tennis': { boys: 7, girls: 3 },
    },
  },
  {
    rank: 3,
    batch: MOCK_BATCHES[1], // 23SW
    total_points: 48,
    breakdown: {
      volleyball: { boys: 10, girls: 0 },
      cricket: { boys: 5, girls: 10 },
      ludo: { boys: 7, girls: 7 },
      chess: { boys: 5, girls: 4 },
    },
  },
  {
    rank: 4,
    batch: MOCK_BATCHES[6], // 24AI
    total_points: 41,
    breakdown: {
      futsal: { boys: 5, girls: 0 },
      throwball: { boys: 0, girls: 7 },
      'table-tennis': { boys: 10, girls: 7 },
      badminton: { boys: 7, girls: 5 },
    },
  },
  {
    rank: 5,
    batch: MOCK_BATCHES[0], // 22SW (Seniors)
    total_points: 36,
    breakdown: {
      'tug-of-war': { boys: 7, girls: 0 },
      cricket: { boys: 3, girls: 3 },
      chess: { boys: 10, girls: 7 },
      ludo: { boys: 3, girls: 3 },
    },
  },
  {
    rank: 6,
    batch: MOCK_BATCHES[7], // 25AI
    total_points: 28,
    breakdown: {
      volleyball: { boys: 5, girls: 0 },
      'mini-marathon': { boys: 10, girls: 5 },
      badminton: { boys: 3, girls: 5 },
    },
  },
  {
    rank: 7,
    batch: MOCK_BATCHES[3], // 25SW
    total_points: 24,
    breakdown: {
      ludo: { boys: 10, girls: 5 },
      futsal: { boys: 3, girls: 0 },
      'mini-marathon': { boys: 3, girls: 3 },
    },
  },
  {
    rank: 8,
    batch: MOCK_BATCHES[8], // 26AI (Freshmen)
    total_points: 15,
    breakdown: {
      'mini-marathon': { boys: 7, girls: 0 },
      chess: { boys: 3, girls: 5 },
    },
  },
  {
    rank: 9,
    batch: MOCK_BATCHES[4], // 26SW (Freshmen)
    total_points: 12,
    breakdown: {
      ludo: { boys: 5, girls: 3 },
      throwball: { boys: 0, girls: 4 },
    },
  },
];

export const MOCK_FIXTURES: FixtureWithRelations[] = [
  // Live matches (Day 1)
  {
    id: 'f1000000-0000-0000-0000-000000000001',
    game_id: MOCK_GAMES[0].id, // Cricket
    stage: 'group',
    round: 'Match 1',
    scheduled_at: '2026-09-08T10:00:00+05:00',
    venue: 'Main Ground (Pitch A)',
    status: 'live',
    score_a: 78,
    score_b: 64,
    game: MOCK_GAMES[0],
    team_a: {
      id: 't-24sw-cric',
      game_id: MOCK_GAMES[0].id,
      batch_id: MOCK_BATCHES[2].id,
      gender: 'boys',
      name: '24SW Strikers',
      batch: MOCK_BATCHES[2],
    },
    team_b: {
      id: 't-23ai-cric',
      game_id: MOCK_GAMES[0].id,
      batch_id: MOCK_BATCHES[5].id,
      gender: 'boys',
      name: '23AI Titans',
      batch: MOCK_BATCHES[5],
    },
  },
  {
    id: 'f1000000-0000-0000-0000-000000000002',
    game_id: MOCK_GAMES[1].id, // Futsal
    stage: 'group',
    round: 'Group B',
    scheduled_at: '2026-09-08T11:15:00+05:00',
    venue: 'Gymnasium Indoor Arena',
    status: 'live',
    score_a: 3,
    score_b: 2,
    game: MOCK_GAMES[1],
    team_a: {
      id: 't-23sw-fut',
      game_id: MOCK_GAMES[1].id,
      batch_id: MOCK_BATCHES[1].id,
      gender: 'boys',
      name: '23SW United',
      batch: MOCK_BATCHES[1],
    },
    team_b: {
      id: 't-24ai-fut',
      game_id: MOCK_GAMES[1].id,
      batch_id: MOCK_BATCHES[6].id,
      gender: 'boys',
      name: '24AI FC',
      batch: MOCK_BATCHES[6],
    },
  },
  // Completed matches (Day 1)
  {
    id: 'f1000000-0000-0000-0000-000000000003',
    game_id: MOCK_GAMES[4].id, // Throwball
    stage: 'group',
    round: 'Opening Match',
    scheduled_at: '2026-09-08T09:00:00+05:00',
    venue: 'Girls Sports Complex',
    status: 'completed',
    score_a: 2,
    score_b: 0,
    winner_team_id: 't-24sw-tb',
    game: MOCK_GAMES[4],
    team_a: {
      id: 't-24sw-tb',
      game_id: MOCK_GAMES[4].id,
      batch_id: MOCK_BATCHES[2].id,
      gender: 'girls',
      name: '24SW Phoenix',
      batch: MOCK_BATCHES[2],
    },
    team_b: {
      id: 't-22sw-tb',
      game_id: MOCK_GAMES[4].id,
      batch_id: MOCK_BATCHES[0].id,
      gender: 'girls',
      name: '22SW Legends',
      batch: MOCK_BATCHES[0],
    },
  },
  {
    id: 'f1000000-0000-0000-0000-000000000004',
    game_id: MOCK_GAMES[6].id, // Badminton
    stage: 'group',
    round: 'Round 1',
    scheduled_at: '2026-09-08T09:30:00+05:00',
    venue: 'Gym Badminton Court 1',
    status: 'completed',
    score_a: 2,
    score_b: 1,
    game: MOCK_GAMES[6],
    player_a: {
      id: 'p-1',
      name: 'Zaid Khan',
      batch_id: MOCK_BATCHES[5].id,
      gender: 'boys',
      batch: MOCK_BATCHES[5],
    },
    player_b: {
      id: 'p-2',
      name: 'Hamza Ali',
      batch_id: MOCK_BATCHES[1].id,
      gender: 'boys',
      batch: MOCK_BATCHES[1],
    },
  },
  // Upcoming matches (Day 1)
  {
    id: 'f1000000-0000-0000-0000-000000000005',
    game_id: MOCK_GAMES[2].id, // Volleyball
    stage: 'group',
    round: 'Match 2',
    scheduled_at: '2026-09-08T14:00:00+05:00',
    venue: 'Outdoor Court A',
    status: 'scheduled',
    game: MOCK_GAMES[2],
    team_a: {
      id: 't-25ai-vb',
      game_id: MOCK_GAMES[2].id,
      batch_id: MOCK_BATCHES[7].id,
      gender: 'boys',
      name: '25AI Spikers',
      batch: MOCK_BATCHES[7],
    },
    team_b: {
      id: 't-26sw-vb',
      game_id: MOCK_GAMES[2].id,
      batch_id: MOCK_BATCHES[4].id,
      gender: 'boys',
      name: '26SW Challengers',
      batch: MOCK_BATCHES[4],
    },
  },
  {
    id: 'f1000000-0000-0000-0000-000000000006',
    game_id: MOCK_GAMES[3].id, // Tug of War
    stage: 'group',
    round: 'Quarter-Final 1',
    scheduled_at: '2026-09-08T16:30:00+05:00',
    venue: 'Main Athletic Grounds',
    status: 'scheduled',
    game: MOCK_GAMES[3],
    team_a: {
      id: 't-23ai-tow',
      game_id: MOCK_GAMES[3].id,
      batch_id: MOCK_BATCHES[5].id,
      gender: 'boys',
      name: '23AI Powerhouse',
      batch: MOCK_BATCHES[5],
    },
    team_b: {
      id: 't-22sw-tow',
      game_id: MOCK_GAMES[3].id,
      batch_id: MOCK_BATCHES[0].id,
      gender: 'boys',
      name: '22SW Titans',
      batch: MOCK_BATCHES[0],
    },
  },
  // Day 2 matches (Sep 09)
  {
    id: 'f1000000-0000-0000-0000-000000000007',
    game_id: MOCK_GAMES[0].id, // Cricket
    stage: 'semifinal',
    round: 'Semi-Final 1',
    scheduled_at: '2026-09-09T10:00:00+05:00',
    venue: 'Main Ground (Pitch A)',
    status: 'scheduled',
    game: MOCK_GAMES[0],
    team_a: {
      id: 't-24sw-cric',
      game_id: MOCK_GAMES[0].id,
      batch_id: MOCK_BATCHES[2].id,
      gender: 'boys',
      name: '24SW Strikers',
      batch: MOCK_BATCHES[2],
    },
    team_b: {
      id: 't-23sw-cric',
      game_id: MOCK_GAMES[0].id,
      batch_id: MOCK_BATCHES[1].id,
      gender: 'boys',
      name: '23SW Kings',
      batch: MOCK_BATCHES[1],
    },
  },
  {
    id: 'f1000000-0000-0000-0000-000000000008',
    game_id: MOCK_GAMES[1].id, // Futsal
    stage: 'semifinal',
    round: 'Semi-Final 2',
    scheduled_at: '2026-09-09T12:30:00+05:00',
    venue: 'Gymnasium Indoor Arena',
    status: 'scheduled',
    game: MOCK_GAMES[1],
    team_a: {
      id: 't-24ai-fut',
      game_id: MOCK_GAMES[1].id,
      batch_id: MOCK_BATCHES[6].id,
      gender: 'boys',
      name: '24AI FC',
      batch: MOCK_BATCHES[6],
    },
    team_b: {
      id: 't-25sw-fut',
      game_id: MOCK_GAMES[1].id,
      batch_id: MOCK_BATCHES[3].id,
      gender: 'boys',
      name: '25SW Rovers',
      batch: MOCK_BATCHES[3],
    },
  },
  // Day 3 matches (Sep 10 - Finals)
  {
    id: 'f1000000-0000-0000-0000-000000000009',
    game_id: MOCK_GAMES[0].id, // Cricket
    stage: 'final',
    round: 'Championship Grand Final',
    scheduled_at: '2026-09-10T15:00:00+05:00',
    venue: 'Main Cricket Oval',
    status: 'scheduled',
    game: MOCK_GAMES[0],
    team_a: {
      id: 't-24sw-cric',
      game_id: MOCK_GAMES[0].id,
      batch_id: MOCK_BATCHES[2].id,
      gender: 'boys',
      name: '24SW Strikers',
      batch: MOCK_BATCHES[2],
    },
    team_b: {
      id: 't-23ai-cric',
      game_id: MOCK_GAMES[0].id,
      batch_id: MOCK_BATCHES[5].id,
      gender: 'boys',
      name: '23AI Titans',
      batch: MOCK_BATCHES[5],
    },
  },
];

export const MOCK_PLAYERS_SAMPLE: Record<string, Player[]> = {
  '24SW': [
    { id: 'p-24sw-1', name: 'Bilal Ahmed', batch_id: 'b1000000-0000-0000-0000-000000000003', gender: 'boys', roll_no: '24SW01' },
    { id: 'p-24sw-2', name: 'Shahmeer Tariq', batch_id: 'b1000000-0000-0000-0000-000000000003', gender: 'boys', roll_no: '24SW15' },
    { id: 'p-24sw-3', name: 'Ayesha Raza', batch_id: 'b1000000-0000-0000-0000-000000000003', gender: 'girls', roll_no: '24SW44' },
    { id: 'p-24sw-4', name: 'Zubair Mallah', batch_id: 'b1000000-0000-0000-0000-000000000003', gender: 'boys', roll_no: '24SW50' },
    { id: 'p-24sw-5', name: 'Fatima Noor', batch_id: 'b1000000-0000-0000-0000-000000000003', gender: 'girls', roll_no: '24SW62' },
  ],
  '23AI': [
    { id: 'p-23ai-1', name: 'Zaid Khan', batch_id: 'b1000000-0000-0000-0000-000000000006', gender: 'boys', roll_no: '23AI05' },
    { id: 'p-23ai-2', name: 'Usman Ali', batch_id: 'b1000000-0000-0000-0000-000000000006', gender: 'boys', roll_no: '23AI12' },
    { id: 'p-23ai-3', name: 'Maryam Soomro', batch_id: 'b1000000-0000-0000-0000-000000000006', gender: 'girls', roll_no: '23AI28' },
    { id: 'p-23ai-4', name: 'Farhan Junejo', batch_id: 'b1000000-0000-0000-0000-000000000006', gender: 'boys', roll_no: '23AI35' },
  ],
};

// ─── Hybrid Data Fetchers (Supabase with Automatic Fallback) ─────────────────

export async function getStandings(): Promise<StandingRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('standings')
      .select('batch_id, total_points, breakdown, batch:batches(*, department:departments(*))')
      .order('total_points', { ascending: false });

    if (!error && data && data.length > 0 && data.some((d: any) => d.total_points > 0)) {
      return data.map((item: any, idx: number) => ({
        rank: idx + 1,
        batch: item.batch,
        total_points: item.total_points,
        breakdown: item.breakdown || {},
      }));
    }
  } catch {
    // Fall back smoothly if Supabase isn't reachable yet
  }
  return MOCK_STANDINGS;
}

export async function getFixtures(day?: 1 | 2 | 3, status?: string): Promise<FixtureWithRelations[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('fixtures')
      .select(`
        *,
        game:games(*),
        team_a:teams!fixtures_team_a_id_fkey(*, batch:batches(*, department:departments(*))),
        team_b:teams!fixtures_team_b_id_fkey(*, batch:batches(*, department:departments(*))),
        player_a:players!fixtures_player_a_id_fkey(*, batch:batches(*, department:departments(*))),
        player_b:players!fixtures_player_b_id_fkey(*, batch:batches(*, department:departments(*)))
      `)
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as FixtureWithRelations[];
    }
  } catch {
    // Fall back to mock
  }

  let result = [...MOCK_FIXTURES];

  if (day) {
    const datePrefixes: Record<1 | 2 | 3, string> = {
      1: '2026-09-08',
      2: '2026-09-09',
      3: '2026-09-10',
    };
    result = result.filter((f) => f.scheduled_at.startsWith(datePrefixes[day]));
  }

  if (status) {
    result = result.filter((f) => f.status === status);
  }

  return result;
}

export async function getLiveFixtures(): Promise<FixtureWithRelations[]> {
  return getFixtures(undefined, 'live');
}

export async function getGames(): Promise<GameWithMeta[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('games').select('*').order('name');
    if (!error && data && data.length > 0) {
      return data.map((g: any) => {
        const fallback = MOCK_GAMES.find((mg) => mg.slug === g.slug);
        return {
          ...g,
          icon: fallback?.icon || 'sports',
          description: fallback?.description || `${g.name} championship matches.`,
          rules: fallback?.rules || ['Tournament rules enforced by official ref.'],
        };
      });
    }
  } catch {
    // Fall back to mock
  }
  return MOCK_GAMES;
}

export async function getGameBySlug(slug: string): Promise<GameWithMeta | null> {
  const games = await getGames();
  return games.find((g) => g.slug === slug) || null;
}

export async function getBatches(): Promise<(Batch & { department: typeof MOCK_DEPARTMENTS[number] })[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('batches')
      .select('*, department:departments(*)')
      .order('code');
    if (!error && data && data.length > 0) {
      return data as (Batch & { department: typeof MOCK_DEPARTMENTS[number] })[];
    }
  } catch {
    // Fall back
  }
  return MOCK_BATCHES;
}

export async function getBatchByCode(code: string): Promise<{
  batch: Batch & { department: typeof MOCK_DEPARTMENTS[number] };
  standing: StandingRow | null;
  fixtures: FixtureWithRelations[];
  players: Player[];
} | null> {
  const batches = await getBatches();
  const normalizedCode = code.toUpperCase();
  const batch = batches.find((b) => b.code.toUpperCase() === normalizedCode);
  if (!batch) return null;

  const standings = await getStandings();
  const standing = standings.find((s) => s.batch.code.toUpperCase() === normalizedCode) || null;

  const allFixtures = await getFixtures();
  const fixtures = allFixtures.filter(
    (f) =>
      f.team_a?.batch?.code.toUpperCase() === normalizedCode ||
      f.team_b?.batch?.code.toUpperCase() === normalizedCode ||
      f.player_a?.batch?.code.toUpperCase() === normalizedCode ||
      f.player_b?.batch?.code.toUpperCase() === normalizedCode
  );

  const players = MOCK_PLAYERS_SAMPLE[normalizedCode] || [
    { id: `p-${normalizedCode}-1`, name: 'Batch Representative', batch_id: batch.id, gender: 'boys', roll_no: `${normalizedCode}01` },
    { id: `p-${normalizedCode}-2`, name: 'Sports Coordinator', batch_id: batch.id, gender: 'girls', roll_no: `${normalizedCode}02` },
  ];

  return { batch, standing, fixtures, players };
}
