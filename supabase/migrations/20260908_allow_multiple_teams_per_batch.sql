-- ============================================================
-- Migration: Allow Multiple Teams Per Batch in a Sport
-- ============================================================
-- Description:
-- Currently, the `teams` table enforces a unique constraint:
--   UNIQUE (game_id, batch_id, gender)
-- which restricts every batch to exactly 1 team per sport.
--
-- This migration drops that constraint and replaces it with:
--   UNIQUE (game_id, batch_id, gender, name)
-- This allows batches to field multiple squads (e.g., Team A, Team B,
-- Section 1, Section 2, Doubles Pair 1, Doubles Pair 2), as long as
-- each squad has a distinct name.
-- ============================================================

-- 1. Drop the 1-team-per-batch constraint
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_game_id_batch_id_gender_key;

-- 2. Add the relaxed constraint that allows multiple named teams
ALTER TABLE teams ADD CONSTRAINT teams_game_batch_gender_name_key UNIQUE (game_id, batch_id, gender, name);
