'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { recomputeStanding } from '@/lib/points';
import { ScoreEntrySchema, IndividualResultSchema } from '@/lib/validation/schemas';
import type { ActionResult, Fixture, IndividualResult } from '@/types';

/**
 * Save a score update / result for a team fixture.
 * Validates input, writes to DB, then triggers points recomputation.
 */
export async function saveResult(raw: unknown): Promise<ActionResult<Fixture>> {
  const parsed = ScoreEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const { fixture_id, score_a, score_b, status, winner_team_id, winner_player_id } = parsed.data;

  try {
    const supabase = await createServiceClient();

    // Check for overwriting a completed fixture (confirmation required on client)
    const { data: existing } = await supabase
      .from('fixtures')
      .select('status, team_a_id, team_b_id')
      .eq('id', fixture_id)
      .single();

    if (!existing) {
      return { error: { message: 'Fixture not found', code: 'NOT_FOUND' } };
    }

    const { data, error } = await supabase
      .from('fixtures')
      .update({ score_a, score_b, status, winner_team_id, winner_player_id })
      .eq('id', fixture_id)
      .select()
      .single();

    if (error) throw error;

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

    return { data };
  } catch (err: unknown) {
    console.error('[saveIndividualResult]', err);
    const message = err instanceof Error ? err.message : 'Failed to save individual result';
    return { error: { message, code: 'DB_ERROR' } };
  }
}
