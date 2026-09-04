import { z } from 'zod';

// ─── Fixture schemas ─────────────────────────────────────────────────────────

export const FixtureCreateSchema = z.object({
  game_id:      z.string(),
  stage:        z.enum(['group', 'semifinal', 'final', 'friendly']),
  round:        z.string().optional(),
  team_a_id:    z.string().optional().nullable(),
  team_b_id:    z.string().optional().nullable(),
  player_a_id:  z.string().optional().nullable(),
  player_b_id:  z.string().optional().nullable(),
  scheduled_at: z.string(),
  venue:        z.string().max(100).optional().nullable(),
});

export const FixtureUpdateSchema = FixtureCreateSchema.partial().extend({
  id:       z.string(),
  status:   z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
  score_a:  z.number().int().min(0).optional(),
  score_b:  z.number().int().min(0).optional(),
  cricket_details: z.any().optional().nullable(),
  winner_team_id:   z.string().optional().nullable(),
  winner_player_id: z.string().optional().nullable(),
});

export const ScoreEntrySchema = z.object({
  fixture_id:       z.string(),
  score_a:          z.number({ invalid_type_error: 'Score must be a whole number' }).int().min(0),
  score_b:          z.number({ invalid_type_error: 'Score must be a whole number' }).int().min(0),
  status:           z.enum(['scheduled', 'live', 'completed', 'cancelled']),
  cricket_details:  z.any().optional().nullable(),
  winner_team_id:   z.string().optional().nullable(),
  winner_player_id: z.string().optional().nullable(),
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
