'use server';

import { createServiceClient } from '@/lib/supabase/server';
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
    const { error } = await supabase.from('fixtures').delete().eq('id', id);
    if (error) throw error;
    return { data: { id } };
  } catch (err: unknown) {
    console.error('[deleteFixture]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete fixture';
    return { error: { message, code: 'DB_ERROR' } };
  }
}
