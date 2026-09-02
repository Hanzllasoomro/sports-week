'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { recomputeStanding } from '@/lib/points';
import { FixtureCreateSchema, FixtureUpdateSchema } from '@/lib/validation/schemas';
import type { ActionResult, Fixture } from '@/types';

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
