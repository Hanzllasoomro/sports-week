import type { Standing, Fixture, PointsRule } from '@/types';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Recomputes total_points and breakdown for a single batch from scratch.
 * Called inside Server Actions after a result is saved.
 * Writes result to the standings table.
 */
export async function recomputeStanding(batchId: string): Promise<void> {
  const supabase = await createServiceClient();

  // 1. Fetch all points rules
  const { data: rules } = await supabase
    .from('points_rules')
    .select('*');

  // 2. Fetch completed fixtures where this batch participated (team games)
  const { data: teamFixtures } = await supabase
    .from('fixtures')
    .select(`
      *,
      game:games(*),
      team_a:teams!fixtures_team_a_id_fkey(*, batch:batches(*)),
      team_b:teams!fixtures_team_b_id_fkey(*, batch:batches(*))
    `)
    .eq('status', 'completed')
    .or(`team_a.batch_id.eq.${batchId},team_b.batch_id.eq.${batchId}`);

  // 3. Fetch individual results for this batch
  const { data: individualResults } = await supabase
    .from('individual_results')
    .select('*, game:games(*)')
    .eq('batch_id', batchId);

  let totalPoints = 0;
  const breakdown: Record<string, { boys: number; girls: number }> = {};

  // 4. Sum team game points
  for (const fixture of (teamFixtures ?? [])) {
    const gameSlug: string = fixture.game?.slug ?? 'unknown';
    const gender: 'boys' | 'girls' =
      fixture.team_a?.gender ?? fixture.team_b?.gender ?? 'boys';

    if (!breakdown[gameSlug]) breakdown[gameSlug] = { boys: 0, girls: 0 };

    const isWinnerA = fixture.winner_team_id === fixture.team_a_id;
    const isWinnerB = fixture.winner_team_id === fixture.team_b_id;

    const batchIsTeamA = fixture.team_a?.batch_id === batchId;
    const batchIsTeamB = fixture.team_b?.batch_id === batchId;

    let pts = 0;

    if (fixture.stage === 'final') {
      if ((batchIsTeamA && isWinnerA) || (batchIsTeamB && isWinnerB)) {
        pts = lookupTeamPoints(rules ?? [], fixture.game_id, 'final', 1);
      } else if ((batchIsTeamA && isWinnerB) || (batchIsTeamB && isWinnerA)) {
        pts = lookupTeamPoints(rules ?? [], fixture.game_id, 'final', 2);
      }
    } else {
      // Group or Semifinal
      const isWinner =
        (batchIsTeamA && isWinnerA) || (batchIsTeamB && isWinnerB);

      if (isWinner) {
        pts = lookupTeamPoints(rules ?? [], fixture.game_id, fixture.stage, 1);
      }
    }

    if (pts > 0) {
      breakdown[gameSlug][gender] += pts;
      totalPoints += pts;
    }
  }

  // 5. Sum individual game points
  for (const result of (individualResults ?? [])) {
    const gameSlug: string = result.game?.slug ?? 'unknown';
    const gender: 'boys' | 'girls' = result.gender;

    if (!breakdown[gameSlug]) breakdown[gameSlug] = { boys: 0, girls: 0 };

    breakdown[gameSlug][gender] += result.points_awarded;
    totalPoints += result.points_awarded;
  }

  // 6. Upsert into standings
  await supabase
    .from('standings')
    .upsert({
      batch_id: batchId,
      total_points: totalPoints,
      breakdown,
    });
}

function lookupTeamPoints(
  rules: PointsRule[],
  gameId: string,
  stage: string,
  position: number
): number {
  // Prefer game-specific rule
  const specific = rules.find(
    (r) =>
      r.game_id === gameId &&
      r.stage === stage &&
      (r.position === position || r.position === null)
  );
  if (specific) return specific.points;

  // Fall back to default (game_id = null)
  const defaultRule = rules.find(
    (r) =>
      r.game_id === null &&
      r.stage === stage &&
      (r.position === position || r.position === null)
  );
  return defaultRule?.points ?? 0;
}
