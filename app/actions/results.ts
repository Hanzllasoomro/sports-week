'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { recomputeStanding } from '@/lib/points';
import { ScoreEntrySchema, IndividualResultSchema } from '@/lib/validation/schemas';
import type { ActionResult, Fixture, IndividualResult } from '@/types';
import { persistCricketDetails } from '@/lib/data/cricket-store';

/**
 * Save a score update / result for a team fixture.
 * Validates input, writes to DB, then triggers points recomputation.
 */
export async function saveResult(raw: unknown): Promise<ActionResult<Fixture>> {
  const parsed = ScoreEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const { fixture_id, score_a, score_b, status, cricket_details, winner_team_id, winner_player_id } = parsed.data;

  // Validate UUID format before inserting/updating in Postgres
  const isValidUuid = (val?: string | null) =>
    !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const cleanWinnerTeamId = isValidUuid(winner_team_id) ? winner_team_id : null;
  const cleanWinnerPlayerId = isValidUuid(winner_player_id) ? winner_player_id : null;

  try {
    const supabase = await createServiceClient();

    // Check for existing fixture in database
    let { data: existing } = await supabase
      .from('fixtures')
      .select('id, status, team_a_id, team_b_id, game_id, stage')
      .eq('id', fixture_id)
      .single();

    if (!existing) {
      // Check if it's one of our initial fixtures and auto-insert into Supabase
      const { MOCK_FIXTURES } = await import('@/lib/mock-data');
      const fallback = MOCK_FIXTURES.find((f) => f.id === fixture_id);

      if (fallback) {
        const insertPayload: any = {
          id: fallback.id,
          game_id: fallback.game_id,
          stage: fallback.stage,
          round: fallback.round,
          scheduled_at: fallback.scheduled_at,
          venue: fallback.venue,
          status,
          score_a,
          score_b,
          winner_team_id: cleanWinnerTeamId,
          winner_player_id: cleanWinnerPlayerId,
        };
        if (cricket_details !== undefined) {
          insertPayload.cricket_details = cricket_details;
        }

        let { data: inserted, error: insertErr } = await supabase
          .from('fixtures')
          .insert(insertPayload)
          .select()
          .single();

        // If insert failed due to missing cricket_details column, retry without it
        if (insertErr && cricket_details !== undefined) {
          delete insertPayload.cricket_details;
          const retry = await supabase
            .from('fixtures')
            .insert(insertPayload)
            .select()
            .single();
          inserted = retry.data;
          insertErr = retry.error;
        }

        if (insertErr) {
          console.error('[saveResult auto-insert failed]', insertErr);
        } else if (inserted) {
          existing = inserted;
        }
      }
    }

    let data: any = existing;

    if (existing) {
      const updatePayload: any = {
        score_a,
        score_b,
        status,
        winner_team_id: cleanWinnerTeamId,
        winner_player_id: cleanWinnerPlayerId,
      };
      if (cricket_details !== undefined) {
        updatePayload.cricket_details = cricket_details;
      }

      let { data: updated, error: updateErr } = await supabase
        .from('fixtures')
        .update(updatePayload)
        .eq('id', fixture_id)
        .select()
        .single();

      // If update failed due to missing cricket_details column, gracefully retry without it
      if (updateErr && cricket_details !== undefined) {
        delete updatePayload.cricket_details;
        const retry = await supabase
          .from('fixtures')
          .update(updatePayload)
          .eq('id', fixture_id)
          .select()
          .single();
        updated = retry.data;
        updateErr = retry.error;
      }

      if (updateErr) throw updateErr;
      data = updated;

      // Always persist into multi-tier cricket store (direct DB, JSONB fallback, and cache)
      if (cricket_details) {
        await persistCricketDetails(fixture_id, cricket_details);
      }
    } else {
      return {
        error: {
          message: `Fixture with ID ${fixture_id} not found in database. Please choose a scheduled match.`,
          code: 'NOT_FOUND',
        },
      };
    }

    // Recompute standings for affected batches
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

    // Revalidate cached pages so public visitors see instant updates
    revalidatePath('/');
    revalidatePath('/standings');
    revalidatePath('/live');
    revalidatePath('/schedule');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/results');

    return { data };
  } catch (err: unknown) {
    console.error('[saveResult]', err);
    const message = err instanceof Error ? err.message : 'Failed to save result';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

/**
 * Save an individual game result (podium finish).
 * Triggers points recomputation for the batch.
 */
export async function saveIndividualResult(raw: unknown): Promise<ActionResult<IndividualResult>> {
  const parsed = IndividualResultSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('individual_results')
      .upsert(parsed.data, { onConflict: 'game_id,gender,position' })
      .select()
      .single();

    if (error) throw error;

    await recomputeStanding(parsed.data.batch_id);

    // Revalidate cached public views
    revalidatePath('/');
    revalidatePath('/standings');
    revalidatePath('/live');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/results');

    return { data };
  } catch (err: unknown) {
    console.error('[saveIndividualResult]', err);
    const message = err instanceof Error ? err.message : 'Failed to save individual result';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

/**
 * Save a Marathon winner / podium finish (Gold, Silver, Bronze).
 * Automatically handles runner attribution and batch standings recomputation.
 */
export async function saveMarathonResult(payload: {
  batch_id: string;
  gender: 'boys' | 'girls';
  position: number;
  points_awarded: number;
  runner_name?: string;
  runner_roll_no?: string;
}): Promise<ActionResult<any>> {
  try {
    const supabase = await createServiceClient();

    // 1. Get Mini Marathon game id
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('slug', 'mini-marathon')
      .single();

    const gameId = game?.id || 'c1000000-0000-0000-0000-000000000010';

    // 2. If runner name is provided, create/link player
    let playerId: string | null = null;
    if (payload.runner_name && payload.runner_name.trim()) {
      const { data: newPlayer } = await supabase
        .from('players')
        .insert({
          name: payload.runner_name.trim(),
          roll_no: payload.runner_roll_no?.trim() || null,
          batch_id: payload.batch_id,
          gender: payload.gender,
        })
        .select('id')
        .single();
      playerId = newPlayer?.id || null;
    }

    // 3. Upsert marathon result
    const { data, error } = await supabase
      .from('individual_results')
      .upsert(
        {
          game_id: gameId,
          batch_id: payload.batch_id,
          gender: payload.gender,
          position: payload.position,
          points_awarded: payload.points_awarded,
          player_id: playerId,
        },
        { onConflict: 'game_id,gender,position' }
      )
      .select('*, batch:batches(*), player:players(*)')
      .single();

    if (error) throw error;

    // 4. Recompute standing for affected batch
    await recomputeStanding(payload.batch_id);

    // 5. Revalidate public and admin views
    revalidatePath('/');
    revalidatePath('/standings');
    revalidatePath('/live');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/results');
    revalidatePath('/games/mini-marathon');

    return { data };
  } catch (err: unknown) {
    console.error('[saveMarathonResult]', err);
    const message = err instanceof Error ? err.message : 'Failed to save marathon winner';
    return { error: { message, code: 'DB_ERROR' } };
  }
}

/**
 * Fetch all declared marathon podium results
 */
export async function getMarathonResults(): Promise<any[]> {
  try {
    const supabase = await createServiceClient();
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('slug', 'mini-marathon')
      .single();

    const gameId = game?.id || 'c1000000-0000-0000-0000-000000000010';

    const { data, error } = await supabase
      .from('individual_results')
      .select('*, batch:batches(*), player:players(*)')
      .eq('game_id', gameId)
      .order('gender', { ascending: true })
      .order('position', { ascending: true });

    if (!error && data) return data;
  } catch (err) {
    console.error('[getMarathonResults]', err);
  }
  return [];
}
