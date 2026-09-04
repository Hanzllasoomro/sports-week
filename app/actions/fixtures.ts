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
  // Direct IDs if selecting existing:
  team_a_id?: string | null;
  team_b_id?: string | null;
  player_a_id?: string | null;
  player_b_id?: string | null;
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

    let teamAId: string | null = payload.team_a_id || null;
    let teamBId: string | null = payload.team_b_id || null;
    let playerAId: string | null = payload.player_a_id || null;
    let playerBId: string | null = payload.player_b_id || null;

    // 1. If Team match without existing ID:
    if (!teamAId && payload.team_a_name && payload.team_a_batch_id) {
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

    if (!teamBId && payload.team_b_name && payload.team_b_batch_id) {
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

    // 2. If Individual match without existing ID:
    if (!playerAId && payload.player_a_name && payload.player_a_batch_id) {
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

    if (!playerBId && payload.player_b_name && payload.player_b_batch_id) {
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
 * Supports standard elimination brackets with Byes for 20 to 25 teams (and any size from 4 to 32).
 * Non-final match dates are decided by the admin (customizable params).
 * The Championship Final is strictly locked to September 10, 2026.
 */
export async function autoGenerateTournamentSlots(payload: {
  game_id: string; // or 'all'
  team_count: number; // e.g. 4, 8, 9, 16, 20, 22, 24, 25, 32
  gender: 'boys' | 'girls';
  round32_date?: string; // admin-decided (e.g. 2026-09-08)
  round16_date?: string; // admin-decided (e.g. 2026-09-08 or 2026-09-09)
  quarter_date?: string; // admin-decided
  semi_date?: string;    // admin-decided
  venue?: string;
  match_format?: 'team' | 'individual';
}): Promise<ActionResult<{ count: number; byes: number; round32Matches: number }>> {
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

    const defaultVenue = payload.venue || 'MUET Main Sports Complex';
    const finalDate = '2026-09-10'; // Strictly locked to September 10, 2026
    const r32Date = payload.round32_date || '2026-09-08';
    const r16Date = payload.round16_date || '2026-09-08';
    const quarterDate = payload.quarter_date || '2026-09-09';
    const semiDate = payload.semi_date || '2026-09-09';

    const N = Math.max(2, Math.min(32, Math.round(payload.team_count || 8)));
    const slotsToInsert: any[] = [];
    let calculatedByes = 0;
    let calculatedR32Matches = 0;

    // Helper to format ISO strings with Pakistan Standard Time (+05:00)
    const formatSlotTime = (dateStr: string, hour: number, minute: number) => {
      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      return `${dateStr}T${hh}:${mm}:00+05:00`;
    };

    for (const gid of gameIds) {
      if (N <= 4) {
        // 4 Teams Bracket
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: formatSlotTime(semiDate, 10, 0),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: formatSlotTime(semiDate, 15, 0),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: formatSlotTime(finalDate, 17, 0),
            venue: defaultVenue,
            status: 'scheduled',
          }
        );
      } else if (N <= 8) {
        // 5 to 8 Teams (Quarter-Finals Bracket)
        const qfMatches = N <= 8 ? 4 : 4;
        const qfTimes = [
          [9, 30],
          [11, 30],
          [14, 30],
          [16, 30],
        ];
        for (let i = 0; i < qfMatches; i++) {
          slotsToInsert.push({
            game_id: gid,
            stage: 'group',
            round: `Quarter-Final ${i + 1}`,
            scheduled_at: formatSlotTime(quarterDate, qfTimes[i][0], qfTimes[i][1]),
            venue: defaultVenue,
            status: 'scheduled',
          });
        }
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: formatSlotTime(semiDate, 10, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: formatSlotTime(semiDate, 15, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: formatSlotTime(finalDate, 17, 0),
            venue: defaultVenue,
            status: 'scheduled',
          }
        );
      } else if (N === 9) {
        // 9 Batches (1 Playoff + 4 Quarters + 2 Semis + 1 Final)
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'group',
            round: 'Preliminary Playoff',
            scheduled_at: formatSlotTime(quarterDate, 8, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 1',
            scheduled_at: formatSlotTime(quarterDate, 10, 0),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 2',
            scheduled_at: formatSlotTime(quarterDate, 11, 45),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 3',
            scheduled_at: formatSlotTime(quarterDate, 14, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'group',
            round: 'Quarter-Final 4',
            scheduled_at: formatSlotTime(quarterDate, 16, 15),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: formatSlotTime(semiDate, 10, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: formatSlotTime(semiDate, 15, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: formatSlotTime(finalDate, 17, 0),
            venue: defaultVenue,
            status: 'scheduled',
          }
        );
      } else if (N <= 16) {
        // 10 to 16 Competitors (Round of 16 Bracket)
        const byes = 16 - N;
        const r16Prelims = N - 8;
        calculatedByes = byes;

        for (let i = 0; i < r16Prelims; i++) {
          const hour = 9 + Math.floor((i * 45) / 60);
          const min = (i * 45) % 60;
          slotsToInsert.push({
            game_id: gid,
            stage: 'group',
            round: `Round of 16 - Match ${i + 1}`,
            scheduled_at: formatSlotTime(r16Date, hour, min),
            venue: defaultVenue,
            status: 'scheduled',
          });
        }
        for (let i = 0; i < 4; i++) {
          const hour = 14 + Math.floor((i * 60) / 60);
          slotsToInsert.push({
            game_id: gid,
            stage: 'group',
            round: `Quarter-Final ${i + 1}`,
            scheduled_at: formatSlotTime(quarterDate, hour, 0),
            venue: defaultVenue,
            status: 'scheduled',
          });
        }
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: formatSlotTime(semiDate, 10, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: formatSlotTime(semiDate, 15, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: formatSlotTime(finalDate, 17, 0),
            venue: defaultVenue,
            status: 'scheduled',
          }
        );
      } else {
        // 17 to 32 Competitors (Specifically 20-25 competitors in Badminton & Table Tennis)
        // Bracket Size = 32
        const byes = 32 - N;
        const r32Matches = N - 16;
        calculatedByes = byes;
        calculatedR32Matches = r32Matches;

        // 1. Round of 32 / Preliminary Matches (Day 1 morning / afternoon)
        for (let i = 0; i < r32Matches; i++) {
          const startMinuteTotal = 9 * 60 + i * 40; // 40-minute intervals starting at 09:00 AM
          const hour = Math.floor(startMinuteTotal / 60);
          const min = startMinuteTotal % 60;
          slotsToInsert.push({
            game_id: gid,
            stage: 'group',
            round: `Round of 32 - Match ${i + 1}`,
            scheduled_at: formatSlotTime(r32Date, hour, min),
            venue: defaultVenue,
            status: 'scheduled',
          });
        }

        // 2. Round of 16 (8 Matches - Day 1 afternoon / Day 2)
        for (let i = 0; i < 8; i++) {
          const startMinuteTotal = 15 * 60 + 30 + i * 40; // Spaced starting at 03:30 PM
          const hour = Math.floor(startMinuteTotal / 60);
          const min = startMinuteTotal % 60;
          slotsToInsert.push({
            game_id: gid,
            stage: 'group',
            round: `Round of 16 - Match ${i + 1}`,
            scheduled_at: formatSlotTime(r16Date, hour, min),
            venue: defaultVenue,
            status: 'scheduled',
          });
        }

        // 3. Quarter-Finals (4 Matches - Day 2)
        const qfTimes = [
          [10, 0],
          [11, 30],
          [14, 0],
          [15, 30],
        ];
        for (let i = 0; i < 4; i++) {
          slotsToInsert.push({
            game_id: gid,
            stage: 'group',
            round: `Quarter-Final ${i + 1}`,
            scheduled_at: formatSlotTime(quarterDate, qfTimes[i][0], qfTimes[i][1]),
            venue: defaultVenue,
            status: 'scheduled',
          });
        }

        // 4. Semi-Finals (2 Matches - Day 2 evening or Day 3 morning)
        slotsToInsert.push(
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 1',
            scheduled_at: formatSlotTime(semiDate, 17, 0),
            venue: defaultVenue,
            status: 'scheduled',
          },
          {
            game_id: gid,
            stage: 'semifinal',
            round: 'Semi-Final 2',
            scheduled_at: formatSlotTime(semiDate, 18, 30),
            venue: defaultVenue,
            status: 'scheduled',
          },
          // 5. Championship Grand Finale (Day 3 - September 10, 2026 strictly)
          {
            game_id: gid,
            stage: 'final',
            round: 'Championship Final',
            scheduled_at: formatSlotTime(finalDate, 17, 0),
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

    return {
      data: {
        count: inserted?.length || slotsToInsert.length,
        byes: calculatedByes,
        round32Matches: calculatedR32Matches,
      },
    };
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
  // Direct IDs if selecting existing:
  team_a_id?: string | null;
  team_b_id?: string | null;
  player_a_id?: string | null;
  player_b_id?: string | null;
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

    let teamAId: string | null = payload.team_a_id || null;
    let teamBId: string | null = payload.team_b_id || null;
    let playerAId: string | null = payload.player_a_id || null;
    let playerBId: string | null = payload.player_b_id || null;

    if (payload.is_team) {
      if (!teamAId && payload.team_a_name && payload.team_a_batch_id) {
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
      if (!teamBId && payload.team_b_name && payload.team_b_batch_id) {
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
      if (!playerAId && payload.player_a_name && payload.player_a_batch_id) {
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
      if (!playerBId && payload.player_b_name && payload.player_b_batch_id) {
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

