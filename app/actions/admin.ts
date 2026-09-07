'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createServerSupabase, createServiceClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';

import { signAdminSession, verifyScorerCredentials, findScorerByEmail } from '@/lib/security/auth';

/** Admin / Scorer login handler */
export async function loginAdmin(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();

  if (!email || !password) {
    redirect('/admin/login?error=Please+provide+both+email+and+password');
  }

  const cookieStore = await cookies();

  // 1. Official Scorer accounts check (Sajid, Abdullah, Zaheer, Aina, Tayyaba)
  const scorer = verifyScorerCredentials(email, password);
  if (scorer) {
    const token = await signAdminSession(scorer.email, 'scorer', scorer.name);
    cookieStore.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    redirect('/admin/results');
  }

  // 2. Secure Check against deployment environment variables (Superadmin)
  const envEmail = (process.env.ADMIN_EMAIL || 'admin@muet.edu.pk').toLowerCase().trim();
  const envPassword = process.env.ADMIN_PASSWORD || 'SES_SportsWeek_2026!';

  if (email === envEmail && password === envPassword) {
    const token = await signAdminSession(email, 'superadmin', 'Tournament Administrator');
    cookieStore.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    redirect('/admin/dashboard');
  }

  // 3. Try Supabase Auth (DB-synced credentials)
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/admin/login?error=Invalid+email+or+password`);
    }

    if (data.user) {
      // Lookup role from admins table
      const { data: profile } = await supabase
        .from('admins')
        .select('role, name')
        .eq('id', data.user.id)
        .single();

      const matchedScorer = findScorerByEmail(email);
      const role = profile?.role || (matchedScorer ? 'scorer' : 'admin');
      const name = profile?.name || matchedScorer?.name || data.user.user_metadata?.name || 'Tournament Official';

      const token = await signAdminSession(email, role, name);
      cookieStore.set('admin_session', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      if (role === 'scorer') {
        redirect('/admin/results');
      } else {
        redirect('/admin/dashboard');
      }
    }
  } catch (err) {
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    redirect('/admin/login?error=Authentication+failed');
  }
}

/** Admin logout handler */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('admin_demo_session');

  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  redirect('/admin/login');
}

/** Create a new batch */
export async function createBatch(
  code: string,
  departmentCode: 'SW' | 'AI',
  year: number
): Promise<ActionResult<any>> {
  if (!code || !departmentCode || !year) {
    return { error: { message: 'Missing required batch fields', code: 'VALIDATION_ERROR' } };
  }

  try {
    const supabase = await createServiceClient();

    // Get department id
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', departmentCode)
      .single();

    if (!dept) {
      return { error: { message: `Department ${departmentCode} not found`, code: 'NOT_FOUND' } };
    }

    const { data, error } = await supabase
      .from('batches')
      .insert({
        code: code.trim().toUpperCase(),
        department_id: dept.id,
        year,
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    return { error: { message: err.message || 'Failed to create batch', code: 'DB_ERROR' } };
  }
}

/** Create a new game */
export async function createGame(gameData: {
  name: string;
  slug: string;
  format: 'team' | 'individual';
  gender: 'boys' | 'girls' | 'both';
  category?: string;
}): Promise<ActionResult<any>> {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/games');
    revalidatePath('/admin/games');
    return { data };
  } catch (err: any) {
    return { error: { message: err.message || 'Failed to create game', code: 'DB_ERROR' } };
  }
}

/** Update an existing championship game */
export async function updateGame(
  id: string,
  gameData: {
    name: string;
    slug: string;
    format: 'team' | 'individual';
    gender: 'boys' | 'girls' | 'both';
    description?: string;
  }
): Promise<ActionResult<any>> {
  if (!id) return { error: { message: 'Game ID required', code: 'VALIDATION_ERROR' } };

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('games')
      .update(gameData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/games');
    revalidatePath(`/games/${gameData.slug}`);
    revalidatePath('/admin/games');
    return { data };
  } catch (err: any) {
    console.error('[updateGame]', err);
    return { error: { message: err.message || 'Failed to update game', code: 'DB_ERROR' } };
  }
}

/** Delete a game with permission confirmation */
export async function deleteGame(id: string): Promise<ActionResult<{ id: string }>> {
  if (!id) return { error: { message: 'Game ID required', code: 'VALIDATION_ERROR' } };

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('games').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/games');
    revalidatePath('/admin/games');
    revalidatePath('/schedule');
    revalidatePath('/standings');
    return { data: { id } };
  } catch (err: any) {
    console.error('[deleteGame]', err);
    return { error: { message: err.message || 'Failed to delete game', code: 'DB_ERROR' } };
  }
}

/** Update an existing academic batch */
export async function updateBatch(
  id: string,
  updates: { code: string; year: number }
): Promise<ActionResult<any>> {
  if (!id) return { error: { message: 'Batch ID required', code: 'VALIDATION_ERROR' } };

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('batches')
      .update({
        code: updates.code.trim().toUpperCase(),
        year: updates.year,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/standings');
    revalidatePath('/admin/batches');
    revalidatePath(`/teams/${updates.code}`);
    return { data };
  } catch (err: any) {
    console.error('[updateBatch]', err);
    return { error: { message: err.message || 'Failed to update batch', code: 'DB_ERROR' } };
  }
}

/** Delete an academic batch */
export async function deleteBatch(id: string): Promise<ActionResult<{ id: string }>> {
  if (!id) return { error: { message: 'Batch ID required', code: 'VALIDATION_ERROR' } };

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('batches').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/standings');
    revalidatePath('/admin/batches');
    return { data: { id } };
  } catch (err: any) {
    console.error('[deleteBatch]', err);
    return { error: { message: err.message || 'Failed to delete batch', code: 'DB_ERROR' } };
  }
}
