'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { PlayerCreateSchema, TeamCreateSchema } from '@/lib/validation/schemas';
import type { ActionResult, Player, Team } from '@/types';

// ─── Player Actions ─────────────────────────────────────────────────────────

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

    revalidatePath('/admin/teams');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data };
  } catch (err: unknown) {
    console.error('[createTeam]', err);
    const message = err instanceof Error ? err.message : 'Failed to create team';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function updateTeam(
  id: string,
  updates: { name?: string; game_id?: string; batch_id?: string; gender?: 'boys' | 'girls' }
): Promise<ActionResult<Team>> {
  if (!id) {
    return { error: { message: 'Team ID is required', code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/teams');
    revalidatePath('/admin/fixtures');
    revalidatePath('/teams');
    return { data };
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
