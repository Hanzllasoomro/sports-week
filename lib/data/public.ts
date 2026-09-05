import { createClient } from '@/lib/supabase/server';
import type { Batch, StandingRow, FixtureWithRelations, Player } from '@/types';
import {
  MOCK_DEPARTMENTS,
  MOCK_BATCHES,
  MOCK_GAMES,
  MOCK_STANDINGS,
  MOCK_FIXTURES,
  MOCK_PLAYERS_SAMPLE,
  type GameWithMeta,
} from '@/lib/mock-data';

export {
  MOCK_DEPARTMENTS,
  MOCK_BATCHES,
  MOCK_GAMES,
  MOCK_STANDINGS,
  MOCK_FIXTURES,
  MOCK_PLAYERS_SAMPLE,
  type GameWithMeta,
};

// ─── Hybrid Data Fetchers (Supabase with Automatic Fallback) ─────────────────

export async function getStandings(): Promise<StandingRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('standings')
      .select('batch_id, total_points, breakdown, batch:batches(*, department:departments(*))')
      .order('total_points', { ascending: false });

    if (!error && data && data.length > 0) {
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
    if (!error && data) {
      const { retrieveCricketDetails } = await import('@/lib/data/cricket-store');
      const enriched = await Promise.all(
        data.map(async (item: any) => {
          if (item.game?.slug === 'cricket') {
            // Always pull from our multi-tier cricket store (local cache + Supabase JSONB fallback)
            // This guarantees the freshest scoring data regardless of whether Supabase
            // has the cricket_details column or not.
            const stored = await retrieveCricketDetails(item.id);
            if (stored) {
              item.cricket_details = stored;
            }
          }
          return item;
        })
      );
      return enriched as FixtureWithRelations[];
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

export async function getTeams(): Promise<any[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('teams')
      .select('*, batch:batches(*), game:games(*), team_members(*, player:players(*, batch:batches(*)))')
      .order('name');
    if (!error && data) {
      const { enrichTeamsWithSquads } = await import('@/lib/data/team-squad-store');
      return await enrichTeamsWithSquads(data);
    }
  } catch {
    // ignore
  }
  return [];
}

export async function getPlayers(): Promise<any[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('players')
      .select('*, batch:batches(*)')
      .order('name');
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // ignore
  }
  return Object.values(MOCK_PLAYERS_SAMPLE).flat();
}
