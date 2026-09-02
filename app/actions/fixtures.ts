'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { recomputeStanding } from '@/lib/points';
import { FixtureCreateSchema, FixtureUpdateSchema } from '@/lib/validation/schemas';
import type { ActionResult, Fixture } from '@/types';

/** High-level scheduler that creates teams/players and schedules the fixture */
export async function scheduleMatch(payload: {
  game_id: string;
  stage: 'group' | 'semifinal' | 'final' | 'friendly';
  round: string;
  scheduled_at: string;
  venue: string;
  // Team options:
  team_a_name?: string;
  team_a_batch_id?: string;
  team_b_name?: string;
  team_b_batch_id?: string;
  gender?: 'boys' | 'girls';
  // Individual options:
  player_a_name?: string;
  player_a_roll_no?: string;
  player_a_batch_id?: string;
  player_b_name?: string;
  player_b_roll_no?: string;
  player_b_batch_id?: string;
}): Promise<ActionResult<any>> {
  try {
    const supabase = await createServiceClient();

    let teamAId: string | null = null;
    let teamBId: string | null = null;
    let playerAId: string | null = null;
    let playerBId: string | null = null;

    // 1. If Team match:
    if (payload.team_a_name && payload.team_a_batch_id) {
      const { data: teamA } = await supabase
        .from('teams')
        .insert({
          name: payload.team_a_name.trim(),
          batch_id: payload.team_a_batch_id,
          game_id: payload.game_id,
          gender: payload.gender || 'boys',
        })
        .select('id')
        .single();
      teamAId = teamA?.id || null;
    }

    if (payload.team_b_name && payload.team_b_batch_id) {
      const { data: teamB } = await supabase
        .from('teams')
        .insert({
          name: payload.team_b_name.trim(),
          batch_id: payload.team_b_batch_id,
          game_id: payload.game_id,
          gender: payload.gender || 'boys',
        })
        .select('id')
        .single();
      teamBId = teamB?.id || null;
    }

    // 2. If Individual match:
    if (payload.player_a_name && payload.player_a_batch_id) {
      const { data: playerA } = await supabase
        .from('players')
        .insert({
          name: payload.player_a_name.trim(),
          roll_no: payload.player_a_roll_no?.trim() || null,
          batch_id: payload.player_a_batch_id,
          gender: payload.gender || 'boys',
        })
        .select('id')
        .single();
      playerAId = playerA?.id || null;
    }

    if (payload.player_b_name && payload.player_b_batch_id) {
      const { data: playerB } = await supabase
        .from('players')
        .insert({
          name: payload.player_b_name.trim(),
          roll_no: payload.player_b_roll_no?.trim() || null,
          batch_id: payload.player_b_batch_id,
          gender: payload.gender || 'boys',
        })
        .select('id')
        .single();
      playerBId = playerB?.id || null;
    }

    // 3. Insert fixture
    const { data: fixture, error: fixErr } = await supabase
      .from('fixtures')
      .insert({
        game_id: payload.game_id,
        stage: payload.stage,
        round: payload.round,
        scheduled_at: payload.scheduled_at,
        venue: payload.venue,
        team_a_id: teamAId,
        team_b_id: teamBId,
        player_a_id: playerAId,
        player_b_id: playerBId,
        status: 'scheduled',
      })
      .select(`
        *,
        game:games(*),
        team_a:teams!fixtures_team_a_id_fkey(*, batch:batches(*)),
        team_b:teams!fixtures_team_b_id_fkey(*, batch:batches(*)),
        player_a:players!fixtures_player_a_id_fkey(*, batch:batches(*)),
        player_b:players!fixtures_player_b_id_fkey(*, batch:batches(*))
      `)
      .single();

    if (fixErr) throw fixErr;

    revalidatePath('/schedule');
    revalidatePath('/live');
    revalidatePath('/admin/fixtures');
    revalidatePath('/admin/results');
    revalidatePath('/admin/dashboard');
    revalidatePath('/');

    return { data: fixture };
  } catch (err: any) {
    console.error('[scheduleMatch]', err);
    return { error: { message: err.message || 'Failed to schedule match', code: 'DB_ERROR' } };
  }
}

export async function createFixture(raw: unknown): Promise<ActionResult<Fixture>> {
  const parsed = FixtureCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('fixtures')
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/schedule');
    revalidatePath('/live');
    revalidatePath('/admin/fixtures');
    revalidatePath('/admin/dashboard');
    revalidatePath('/');

    return { data };
  } catch (err: unknown) {
    console.error('[createFixture]', err);
    const message = err instanceof Error ? err.message : 'Failed to create fixture';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function updateFixture(raw: unknown): Promise<ActionResult<Fixture>> {
  const parsed = FixtureUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const { id, ...updates } = parsed.data;

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('fixtures')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/schedule');
    revalidatePath('/live');
    revalidatePath('/admin/fixtures');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/results');
    revalidatePath('/');

    return { data };
  } catch (err: unknown) {
    console.error('[updateFixture]', err);
    const message = err instanceof Error ? err.message : 'Failed to update fixture';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

export async function deleteFixture(id: string): Promise<ActionResult<{ id: string }>> {
  if (!id) return { error: { message: 'Fixture ID required', code: 'VALIDATION_ERROR' } };

  try {
    const supabase = await createServiceClient();

    // Check if the fixture had completed and affected points
    const { data: existing } = await supabase
      .from('fixtures')
      .select('status, team_a_id, team_b_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('fixtures').delete().eq('id', id);
    if (error) throw error;

    // If it was completed, recompute affected batch standings
    if (existing && existing.status === 'completed') {
      const batchIds = new Set<string>();
      if (existing.team_a_id) {
        const { data: teamA } = await supabase
          .from('teams').select('batch_id').eq('id', existing.team_a_id).single();
        if (teamA) batchIds.add(teamA.batch_id);
      }
      if (existing.team_b_id) {
        const { data: teamB } = await supabase
          .from('teams').select('batch_id').eq('id', existing.team_b_id).single();
        if (teamB) batchIds.add(teamB.batch_id);
      }
      await Promise.all([...batchIds].map(recomputeStanding));
      revalidatePath('/standings');
    }

    revalidatePath('/schedule');
    revalidatePath('/live');
    revalidatePath('/admin/fixtures');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/results');
    revalidatePath('/');

    return { data: { id } };
  } catch (err: unknown) {
    console.error('[deleteFixture]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete fixture';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

/**
 * Auto-generates tournament bracket slots based on team count.
 * Non-final match dates are decided by the admin (customizable params).
 * The Championship Final is strictly locked to September 10, 2026.
 */
export async function autoGenerateTournamentSlots(payload: {
  game_id: string; // or 'all'
  team_count: 4 | 8 | 9;
  gender: 'boys' | 'girls';
  quarter_date: string; // admin-decided
  semi_date: string;    // admin-decided
  venue?: string;
}): Promise<ActionResult<{ count: number }>> {
  try {
    const supabase = await createServiceClient();

    let gameIds: string[] = [];
    if (payload.game_id === 'all') {
      const { data: allGames } = await supabase.from('games').select('id');
      gameIds = (allGames || []).map((g) => g.id);
    } else {
      gameIds = [payload.game_id];
    }

    if (gameIds.length === 0) {
      return { error: { message: 'No games selected for bracket scheduling', code: 'VALIDATION_ERROR' } };
    }

    const defaultVenue = payload.venue || 'MUET Main Sports Arena';
    const finalDate = '2026-09-10'; // Strictly locked to September 10, 2026
    const quarterDate = payload.quarter_date || '2026-09-08';
    const semiDate = payload.semi_date || '2026-09-09';

    const slotsToInsert: any[] = [];

    for (const gid of gameIds) {
      if (payload.team_count === 4) {
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: `${semiDate}T10:00:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: `${semiDate}T15:00:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: `${finalDate}T17:00:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          }
        );
      } else if (payload.team_count === 8) {
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 1',
            scheduled_at: `${quarterDate}T09:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 2',
            scheduled_at: `${quarterDate}T11:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 3',
            scheduled_at: `${quarterDate}T14:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 4',
            scheduled_at: `${quarterDate}T16:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: `${semiDate}T10:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: `${semiDate}T15:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: `${finalDate}T17:00:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          }
        );
      } else {
        // 9 Batches
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'group',
            round: 'Preliminary Playoff',
            scheduled_at: `${quarterDate}T08:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 1',
            scheduled_at: `${quarterDate}T10:00:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 2',
            scheduled_at: `${quarterDate}T11:45:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 3',
            scheduled_at: `${quarterDate}T14:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 4',
            scheduled_at: `${quarterDate}T16:15:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: `${semiDate}T10:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: `${semiDate}T15:30:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: `${finalDate}T17:00:00+05:00`,
            venue: defaultVenue,
            status: 'scheduled',
          }
        );
      }
    }

    const { data: inserted, error: insErr } = await supabase
      .from('fixtures')
      .insert(slotsToInsert)
      .select('id');

    if (insErr) throw insErr;

    revalidatePath('/schedule');
    revalidatePath('/live');
    revalidatePath('/admin/fixtures');
    revalidatePath('/admin/results');
    revalidatePath('/admin/dashboard');
    revalidatePath('/');

    return { data: { count: inserted?.length || slotsToInsert.length } };
  } catch (err: any) {
    console.error('[autoGenerateTournamentSlots]', err);
    return { error: { message: err.message || 'Failed to auto-generate slots', code: 'DB_ERROR' } };
  }
}

/**
 * Assigns competitors (Teams or Players) to a specific scheduled slot
 */
export async function assignSlotCompetitors(payload: {
  fixture_id: string;
  is_team: boolean;
  game_id: string;
  gender?: 'boys' | 'girls';
  // If team:
  team_a_name?: string;
  team_a_batch_id?: string;
  team_b_name?: string;
  team_b_batch_id?: string;
  // If player:
  player_a_name?: string;
  player_a_roll_no?: string;
  player_a_batch_id?: string;
  player_b_name?: string;
  player_b_roll_no?: string;
  player_b_batch_id?: string;
}): Promise<ActionResult<any>> {
  try {
    const supabase = await createServiceClient();

    let teamAId: string | null = null;
    let teamBId: string | null = null;
    let playerAId: string | null = null;
    let playerBId: string | null = null;

    if (payload.is_team) {
      if (payload.team_a_name && payload.team_a_batch_id) {
        const { data: teamA } = await supabase
          .from('teams')
          .insert({
            name: payload.team_a_name.trim(),
            batch_id: payload.team_a_batch_id,
            game_id: payload.game_id,
            gender: payload.gender || 'boys',
          })
          .select('id')
          .single();
        teamAId = teamA?.id || null;
      }
      if (payload.team_b_name && payload.team_b_batch_id) {
        const { data: teamB } = await supabase
          .from('teams')
          .insert({
            name: payload.team_b_name.trim(),
            batch_id: payload.team_b_batch_id,
            game_id: payload.game_id,
            gender: payload.gender || 'boys',
          })
          .select('id')
          .single();
        teamBId = teamB?.id || null;
      }
    } else {
      if (payload.player_a_name && payload.player_a_batch_id) {
        const { data: playerA } = await supabase
          .from('players')
          .insert({
            name: payload.player_a_name.trim(),
            roll_no: payload.player_a_roll_no?.trim() || null,
            batch_id: payload.player_a_batch_id,
            gender: payload.gender || 'boys',
          })
          .select('id')
          .single();
        playerAId = playerA?.id || null;
      }
      if (payload.player_b_name && payload.player_b_batch_id) {
        const { data: playerB } = await supabase
          .from('players')
          .insert({
            name: payload.player_b_name.trim(),
            roll_no: payload.player_b_roll_no?.trim() || null,
            batch_id: payload.player_b_batch_id,
            gender: payload.gender || 'boys',
          })
          .select('id')
          .single();
        playerBId = playerB?.id || null;
      }
    }

    const { data: updated, error: updErr } = await supabase
      .from('fixtures')
      .update({
        team_a_id: teamAId,
        team_b_id: teamBId,
        player_a_id: playerAId,
        player_b_id: playerBId,
      })
      .eq('id', payload.fixture_id)
      .select(`
        *,
        game:games(*),
        team_a:teams!fixtures_team_a_id_fkey(*, batch:batches(*)),
        team_b:teams!fixtures_team_b_id_fkey(*, batch:batches(*)),
        player_a:players!fixtures_player_a_id_fkey(*, batch:batches(*)),
        player_b:players!fixtures_player_b_id_fkey(*, batch:batches(*))
      `)
      .single();

    if (updErr) throw updErr;

    revalidatePath('/schedule');
    revalidatePath('/live');
    revalidatePath('/admin/fixtures');
    revalidatePath('/admin/results');
    revalidatePath('/admin/dashboard');
    revalidatePath('/');

    return { data: updated };
  } catch (err: any) {
    console.error('[assignSlotCompetitors]', err);
    return { error: { message: err.message || 'Failed to assign competitors', code: 'DB_ERROR' } };
  }
}

