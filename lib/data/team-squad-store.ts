import fs from 'fs';
import path from 'path';
import { createServiceClient } from '@/lib/supabase/server';
import type { Player } from '@/types';

export interface TeamSquadDetails {
  team_id: string;
  playing_player_ids: string[];
  optional_player_ids: string[];
  updated_at?: string;
}

const STORE_FILE = path.join(process.cwd(), 'lib', 'data', 'team-squads-cache.json');

function readLocalStore(): Record<string, TeamSquadDetails> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // ignore
  }
  return {};
}

function writeLocalStore(data: Record<string, TeamSquadDetails>) {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * Persist squad details (playing lineup + optional substitutes)
 */
export async function persistTeamSquad(
  teamId: string,
  payload: { playing_player_ids: string[]; optional_player_ids: string[] }
): Promise<void> {
  const squadDetails: TeamSquadDetails = {
    team_id: teamId,
    playing_player_ids: Array.from(new Set(payload.playing_player_ids || [])),
    optional_player_ids: Array.from(new Set(payload.optional_player_ids || [])),
    updated_at: new Date().toISOString(),
  };

  // 1. Update local cache
  const cache = readLocalStore();
  cache[teamId] = squadDetails;
  writeLocalStore(cache);

  // 2. Sync into Supabase relational team_members table
  try {
    const supabase = await createServiceClient();

    // Delete existing team_members for this team
    await supabase.from('team_members').delete().eq('team_id', teamId);

    // Combine all unique player IDs (both playing & optional)
    const allPlayerIds = Array.from(
      new Set([...squadDetails.playing_player_ids, ...squadDetails.optional_player_ids])
    );

    if (allPlayerIds.length > 0) {
      const rows = allPlayerIds.map((pId) => ({
        team_id: teamId,
        player_id: pId,
      }));
      await supabase.from('team_members').insert(rows);
    }

    // 3. Fallback backup in standings breakdown JSONB
    const { data: anyStanding } = await supabase.from('standings').select('batch_id, breakdown').limit(1).single();
    if (anyStanding) {
      const currentBreakdown = anyStanding.breakdown || {};
      const squadStore = currentBreakdown._team_squads_store || {};
      squadStore[teamId] = squadDetails;
      await supabase
        .from('standings')
        .update({ breakdown: { ...currentBreakdown, _team_squads_store: squadStore } })
        .eq('batch_id', anyStanding.batch_id);
    }
  } catch (err) {
    console.error('[persistTeamSquad error]', err);
  }
}

/**
 * Retrieve saved squad details for a team
 */
export async function retrieveTeamSquad(teamId: string): Promise<TeamSquadDetails | null> {
  // 1. Check local cache
  const cache = readLocalStore();
  if (cache[teamId]) {
    return cache[teamId];
  }

  // 2. Check Supabase standings breakdown fallback
  try {
    const supabase = await createServiceClient();
    const { data: anyStanding } = await supabase.from('standings').select('breakdown').limit(1).single();
    if (anyStanding?.breakdown?._team_squads_store?.[teamId]) {
      const details = anyStanding.breakdown._team_squads_store[teamId];
      cache[teamId] = details;
      writeLocalStore(cache);
      return details;
    }

    // 3. Reconstruct from team_members relational table if present
    const { data: members } = await supabase
      .from('team_members')
      .select('player_id')
      .eq('team_id', teamId);

    if (members && members.length > 0) {
      const pIds = members.map((m: any) => m.player_id);
      const fallbackDetails: TeamSquadDetails = {
        team_id: teamId,
        playing_player_ids: pIds,
        optional_player_ids: [],
        updated_at: new Date().toISOString(),
      };
      cache[teamId] = fallbackDetails;
      writeLocalStore(cache);
      return fallbackDetails;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Enrich teams with their playing and optional squad members
 */
export async function enrichTeamsWithSquads(teams: any[]): Promise<any[]> {
  if (!teams || teams.length === 0) return [];

  const cache = readLocalStore();

  return Promise.all(
    teams.map(async (t) => {
      let squad: TeamSquadDetails | null = cache[t.id] || null;
      if (!squad) {
        squad = await retrieveTeamSquad(t.id);
      }

      // Member players from Supabase relational join
      const relationalPlayers: Player[] = (t.team_members || [])
        .map((tm: any) => tm.player)
        .filter(Boolean);

      const playingIds = new Set(squad?.playing_player_ids || []);
      const optionalIds = new Set(squad?.optional_player_ids || []);

      let playingPlayers: Player[] = [];
      let optionalPlayers: Player[] = [];

      if (playingIds.size > 0 || optionalIds.size > 0) {
        playingPlayers = relationalPlayers.filter((p) => playingIds.has(p.id));
        optionalPlayers = relationalPlayers.filter((p) => optionalIds.has(p.id));

        // In case relational players weren't populated in query, check if any unassigned
        const unassigned = relationalPlayers.filter((p) => !playingIds.has(p.id) && !optionalIds.has(p.id));
        if (unassigned.length > 0) {
          playingPlayers.push(...unassigned);
        }
      } else {
        // Fallback: all relational players are in playing lineup
        playingPlayers = relationalPlayers;
      }

      return {
        ...t,
        playing_player_ids: squad?.playing_player_ids || playingPlayers.map((p) => p.id),
        optional_player_ids: squad?.optional_player_ids || optionalPlayers.map((p) => p.id),
        playing_players: playingPlayers,
        optional_players: optionalPlayers,
        squad_count: playingPlayers.length + optionalPlayers.length,
      };
    })
  );
}
