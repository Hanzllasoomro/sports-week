'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { PlayerCreateSchema, TeamCreateSchema } from '@/lib/validation/schemas';
import type { ActionResult, Player, Team } from '@/types';

export async function createPlayer(raw: unknown): Promise<ActionResult<Player>> {
  const parsed = PlayerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('players')
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: unknown) {
    console.error('[createPlayer]', err);
    const message = err instanceof Error ? err.message : 'Failed to create player';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function createTeam(raw: unknown): Promise<ActionResult<Team>> {
  const parsed = TeamCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('teams')
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: unknown) {
    console.error('[createTeam]', err);
    const message = err instanceof Error ? err.message : 'Failed to create team';
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
