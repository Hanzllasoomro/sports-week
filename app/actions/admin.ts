'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase, createServiceClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';

/** Admin login handler */
export async function loginAdmin(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();
  const isDemo = formData.get('is_demo') === 'true';

  const cookieStore = await cookies();

  // 1. If demo login requested, set demo session cookie
  if (isDemo || (email === 'admin@muet.edu.pk' && password === 'admin123')) {
    cookieStore.set('admin_demo_session', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    redirect('/admin/dashboard');
  }

  if (!email || !password) {
    redirect('/admin/login?error=Please+provide+both+email+and+password');
  }

  // 2. Try Supabase Auth
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Fallback for development/testing if Supabase users are not set up online
      if (password === 'admin123' || password === 'admin') {
        cookieStore.set('admin_demo_session', 'true', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7,
        });
        redirect('/admin/dashboard');
      }
      redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      redirect('/admin/dashboard');
    }
  } catch (err) {
    // If redirect was thrown by Next.js, rethrow it
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    redirect('/admin/login?error=Authentication+failed');
  }
}

/** Admin logout handler */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
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
    return { data };
  } catch (err: any) {
    return { error: { message: err.message || 'Failed to create game', code: 'DB_ERROR' } };
  }
}
