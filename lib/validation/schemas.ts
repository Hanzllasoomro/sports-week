import { z } from 'zod';

// ─── Fixture schemas ─────────────────────────────────────────────────────────

export const FixtureCreateSchema = z.object({
  game_id:      z.string().uuid(),
  stage:        z.enum(['group', 'semifinal', 'final', 'friendly']),
  round:        z.string().optional(),
  team_a_id:    z.string().uuid().optional(),
  team_b_id:    z.string().uuid().optional(),
  player_a_id:  z.string().uuid().optional(),
  player_b_id:  z.string().uuid().optional(),
  scheduled_at: z.string().datetime(),
  venue:        z.string().max(100).optional(),
});

export const FixtureUpdateSchema = FixtureCreateSchema.partial().extend({
  id:       z.string().uuid(),
  status:   z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
  score_a:  z.number().int().min(0).optional(),
  score_b:  z.number().int().min(0).optional(),
  winner_team_id:   z.string().uuid().optional().nullable(),
  winner_player_id: z.string().uuid().optional().nullable(),
});

export const ScoreEntrySchema = z.object({
  fixture_id:       z.string().uuid(),
  score_a:          z.number({ invalid_type_error: 'Score must be a whole number' }).int().min(0),
  score_b:          z.number({ invalid_type_error: 'Score must be a whole number' }).int().min(0),
  status:           z.enum(['live', 'completed']),
  winner_team_id:   z.string().uuid().optional().nullable(),
  winner_player_id: z.string().uuid().optional().nullable(),
});

export type FixtureCreateInput = z.infer<typeof FixtureCreateSchema>;
export type FixtureUpdateInput = z.infer<typeof FixtureUpdateSchema>;
export type ScoreEntryInput    = z.infer<typeof ScoreEntrySchema>;

// ─── Individual result schema ────────────────────────────────────────────────

export const IndividualResultSchema = z.object({
  game_id:        z.string().uuid(),
  batch_id:       z.string().uuid(),
  gender:         z.enum(['boys', 'girls']),
  player_id:      z.string().uuid().optional().nullable(),
  position:       z.number().int().min(1).max(3),
  points_awarded: z.number().int().min(0),
});

export type IndividualResultInput = z.infer<typeof IndividualResultSchema>;

// ─── Roster schemas ──────────────────────────────────────────────────────────

export const PlayerCreateSchema = z.object({
  name:     z.string().min(2).max(100),
  batch_id: z.string().uuid(),
  gender:   z.enum(['boys', 'girls']),
  roll_no:  z.string().max(20).optional().nullable(),
});

export const TeamCreateSchema = z.object({
  game_id:  z.string().uuid(),
  batch_id: z.string().uuid(),
  gender:   z.enum(['boys', 'girls']),
  name:     z.string().min(2).max(100),
});

export type PlayerCreateInput = z.infer<typeof PlayerCreateSchema>;
export type TeamCreateInput   = z.infer<typeof TeamCreateSchema>;
