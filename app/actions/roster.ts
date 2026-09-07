'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { PlayerCreateSchema, TeamCreateSchema } from '@/lib/validation/schemas';
import type { ActionResult, Player, Team } from '@/types';

// ─── Player Actions ─────────────────────────────────────────────────────────

/**
 * Checks if a player already exists matching the given name and roll number.
 */
export async function checkDuplicatePlayer(params: {
  name: string;
  roll_no?: string | null;
  batch_id?: string;
  exclude_id?: string;
}): Promise<{
  isDuplicate: boolean;
  matchType?: 'exact_both' | 'same_roll' | 'same_name_batch';
  message?: string;
  matchingPlayer?: any;
}> {
  const cleanName = params.name.trim();
  const cleanRoll = params.roll_no?.trim() || null;

  if (!cleanName) return { isDuplicate: false };

  try {
    const supabase = await createServiceClient();
    let query = supabase.from('players').select('id, name, roll_no, batch_id, gender, batches(code)');
    if (params.exclude_id) {
      query = query.neq('id', params.exclude_id);
    }
    const { data: players } = await query;

    const list = players || [];
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Helper to safely get batch code
    const getBatchCode = (p: any) => {
      if (!p?.batches) return 'Batch';
      if (Array.isArray(p.batches) && p.batches[0]?.code) return p.batches[0].code;
      if (p.batches.code) return p.batches.code;
      return 'Batch';
    };

    // 1. Check match on BOTH Name AND Roll Number
    if (cleanRoll) {
      const matchBoth = list.find(
        (p: any) => norm(p.name) === norm(cleanName) && norm(p.roll_no || '') === norm(cleanRoll)
      );
      if (matchBoth) {
        return {
          isDuplicate: true,
          matchType: 'exact_both',
          message: `Duplicate athlete: "${matchBoth.name}" with roll number "${matchBoth.roll_no}" is already registered in ${getBatchCode(matchBoth)}.`,
          matchingPlayer: matchBoth,
        };
      }

      // 2. Check conflict on Roll Number
      const matchRoll = list.find((p: any) => norm(p.roll_no || '') === norm(cleanRoll));
      if (matchRoll) {
        return {
          isDuplicate: true,
          matchType: 'same_roll',
          message: `Roll number conflict: Roll number "${cleanRoll}" is already assigned to "${matchRoll.name}" (${getBatchCode(matchRoll)}).`,
          matchingPlayer: matchRoll,
        };
      }
    }

    // 3. Check duplicate Name within the same batch
    if (params.batch_id) {
      const matchNameBatch = list.find(
        (p) => p.batch_id === params.batch_id && norm(p.name) === norm(cleanName)
      );
      if (matchNameBatch) {
        return {
          isDuplicate: true,
          matchType: 'same_name_batch',
          message: `Name conflict: An athlete named "${matchNameBatch.name}" is already registered in this batch.`,
          matchingPlayer: matchNameBatch,
        };
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    console.error('[checkDuplicatePlayer]', err);
    return { isDuplicate: false };
  }
}

/**
 * Scans all registered players across all batches to audit for duplicates
 */
export async function scanAllDuplicatePlayers(): Promise<{
  totalCount: number;
  duplicateBothCount: number;
  duplicateRollCount: number;
  duplicateNameCount: number;
  exactMatches: { key: string; name: string; roll_no: string; players: any[] }[];
  rollConflicts: { roll_no: string; players: any[] }[];
  nameConflicts: { name: string; players: any[] }[];
}> {
  try {
    const supabase = await createServiceClient();
    const { data: players, error } = await supabase
      .from('players')
      .select('id, name, roll_no, batch_id, gender, batches(code)')
      .order('name');

    if (error || !players) throw error || new Error('No data');

    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const clean = (s: string) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

    // 1. Group by Name + Roll Number
    const bothMap = new Map<string, any[]>();
    for (const p of players) {
      const key = `${clean(p.name)}:::${norm(p.roll_no || '')}`;
      if (!bothMap.has(key)) bothMap.set(key, []);
      bothMap.get(key)!.push(p);
    }
    const exactMatches = Array.from(bothMap.entries())
      .filter(([_, list]) => list.length > 1)
      .map(([_, list]) => ({
        key: `${list[0].name}_${list[0].roll_no}`,
        name: list[0].name,
        roll_no: list[0].roll_no,
        players: list,
      }));

    // 2. Group by Roll Number
    const rollMap = new Map<string, any[]>();
    for (const p of players) {
      const r = norm(p.roll_no || '');
      if (r) {
        if (!rollMap.has(r)) rollMap.set(r, []);
        rollMap.get(r)!.push(p);
      }
    }
    const rollConflicts = Array.from(rollMap.entries())
      .filter(([_, list]) => list.length > 1)
      .map(([_, list]) => ({
        roll_no: list[0].roll_no,
        players: list,
      }));

    // 3. Group by Name
    const nameMap = new Map<string, any[]>();
    for (const p of players) {
      const n = clean(p.name);
      if (!nameMap.has(n)) nameMap.set(n, []);
      nameMap.get(n)!.push(p);
    }
    const nameConflicts = Array.from(nameMap.entries())
      .filter(([_, list]) => list.length > 1)
      .map(([_, list]) => ({
        name: list[0].name,
        players: list,
      }));

    return {
      totalCount: players.length,
      duplicateBothCount: exactMatches.length,
      duplicateRollCount: rollConflicts.length,
      duplicateNameCount: nameConflicts.length,
      exactMatches,
      rollConflicts,
      nameConflicts,
    };
  } catch (err) {
    console.error('[scanAllDuplicatePlayers]', err);
    return {
      totalCount: 0,
      duplicateBothCount: 0,
      duplicateRollCount: 0,
      duplicateNameCount: 0,
      exactMatches: [],
      rollConflicts: [],
      nameConflicts: [],
    };
  }
}

export async function createPlayer(raw: unknown): Promise<ActionResult<Player>> {
  const parsed = PlayerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  try {
    // Check for duplicate player before creating
    const dupCheck = await checkDuplicatePlayer({
      name: parsed.data.name,
      roll_no: parsed.data.roll_no,
      batch_id: parsed.data.batch_id,
    });

    if (dupCheck.isDuplicate) {
      return {
        error: {
          message: dupCheck.message || 'An athlete with this name and roll number already exists',
          code: 'DUPLICATE_PLAYER',
        },
      };
    }

    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('players')
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/players');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data };
  } catch (err: unknown) {
    console.error('[createPlayer]', err);
    const message = err instanceof Error ? err.message : 'Failed to create player';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function updatePlayer(
  id: string,
  updates: { name?: string; roll_no?: string | null; batch_id?: string; gender?: 'boys' | 'girls' }
): Promise<ActionResult<Player>> {
  if (!id) {
    return { error: { message: 'Player ID is required', code: 'VALIDATION_ERROR' } };
  }

  try {
    // If name or roll_no is being updated, verify no conflicting duplicate exists
    if (updates.name) {
      const dupCheck = await checkDuplicatePlayer({
        name: updates.name,
        roll_no: updates.roll_no,
        batch_id: updates.batch_id,
        exclude_id: id,
      });

      if (dupCheck.isDuplicate) {
        return {
          error: {
            message: dupCheck.message || 'Cannot update: matches an existing athlete',
            code: 'DUPLICATE_PLAYER',
          },
        };
      }
    }

    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/players');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data };
  } catch (err: unknown) {
    console.error('[updatePlayer]', err);
    const message = err instanceof Error ? err.message : 'Failed to update player';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function deletePlayer(id: string): Promise<ActionResult<{ success: boolean }>> {
  if (!id) {
    return { error: { message: 'Player ID is required', code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/players');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data: { success: true } };
  } catch (err: unknown) {
    console.error('[deletePlayer]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete player';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

// ─── Team Actions ───────────────────────────────────────────────────────────

export async function createTeam(raw: unknown): Promise<ActionResult<Team & { playing_player_ids?: string[]; optional_player_ids?: string[] }>> {
  const parsed = TeamCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const { playing_player_ids, optional_player_ids, ...teamFields } = parsed.data;

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('teams')
      .insert(teamFields)
      .select()
      .single();

    if (error) throw error;

    if (playing_player_ids || optional_player_ids) {
      const { persistTeamSquad } = await import('@/lib/data/team-squad-store');
      await persistTeamSquad(data.id, {
        playing_player_ids: playing_player_ids || [],
        optional_player_ids: optional_player_ids || [],
      });
    }

    revalidatePath('/admin/teams');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data: { ...data, playing_player_ids, optional_player_ids } };
  } catch (err: unknown) {
    console.error('[createTeam]', err);
    const message = err instanceof Error ? err.message : 'Failed to create team';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function updateTeam(
  id: string,
  updates: {
    name?: string;
    game_id?: string;
    batch_id?: string;
    gender?: 'boys' | 'girls';
    playing_player_ids?: string[];
    optional_player_ids?: string[];
  }
): Promise<ActionResult<Team & { playing_player_ids?: string[]; optional_player_ids?: string[] }>> {
  if (!id) {
    return { error: { message: 'Team ID is required', code: 'VALIDATION_ERROR' } };
  }

  const { playing_player_ids, optional_player_ids, ...teamFields } = updates;

  try {
    const supabase = await createServiceClient();
    let data: any = null;
    if (Object.keys(teamFields).length > 0) {
      const { data: updated, error } = await supabase
        .from('teams')
        .update(teamFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      data = updated;
    } else {
      const { data: current } = await supabase.from('teams').select().eq('id', id).single();
      data = current;
    }

    if (playing_player_ids !== undefined || optional_player_ids !== undefined) {
      const { persistTeamSquad, retrieveTeamSquad } = await import('@/lib/data/team-squad-store');
      const existingSquad = await retrieveTeamSquad(id);
      await persistTeamSquad(id, {
        playing_player_ids: playing_player_ids ?? existingSquad?.playing_player_ids ?? [],
        optional_player_ids: optional_player_ids ?? existingSquad?.optional_player_ids ?? [],
      });
    }

    revalidatePath('/admin/teams');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data: { ...data, playing_player_ids, optional_player_ids } };
  } catch (err: unknown) {
    console.error('[updateTeam]', err);
    const message = err instanceof Error ? err.message : 'Failed to update team';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function deleteTeam(id: string): Promise<ActionResult<{ success: boolean }>> {
  if (!id) {
    return { error: { message: 'Team ID is required', code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/teams');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data: { success: true } };
  } catch (err: unknown) {
    console.error('[deleteTeam]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete team';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function addPlayerToTeam(
  teamId: string,
  playerId: string
): Promise<ActionResult<{ team_id: string; player_id: string }>> {
  if (!teamId || !playerId) {
    return { error: { message: 'Team ID and Player ID are required', code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, player_id: playerId });

    if (error) throw error;
    return { data: { team_id: teamId, player_id: playerId } };
  } catch (err: unknown) {
    console.error('[addPlayerToTeam]', err);
    const message = err instanceof Error ? err.message : 'Failed to add player to team';
    return { error: { message, code: 'DB_ERROR' } };
  }
}
