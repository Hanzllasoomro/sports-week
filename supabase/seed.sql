-- ============================================================
-- SES Sports Week 2026 — Seed Data
-- ============================================================
-- Run AFTER schema.sql
-- Finalized decisions (from memory.md 2026-09-02):
--   • AI batches: 23AI, 24AI, 25AI, 26AI
--   • Ludo: team format for both genders
--   • Standings: combined (boys + girls points sum per batch)
-- ============================================================

-- ─── Departments ────────────────────────────────────────────
insert into departments (id, code, name) values
  ('d1000000-0000-0000-0000-000000000001', 'SW', 'Software Engineering'),
  ('d1000000-0000-0000-0000-000000000002', 'AI', 'Artificial Intelligence')
on conflict (code) do nothing;

-- ─── Batches ────────────────────────────────────────────────
-- SW batches
insert into batches (id, code, department_id, year) values
  ('b1000000-0000-0000-0000-000000000001', '22SW', 'd1000000-0000-0000-0000-000000000001', 2022),
  ('b1000000-0000-0000-0000-000000000002', '23SW', 'd1000000-0000-0000-0000-000000000001', 2023),
  ('b1000000-0000-0000-0000-000000000003', '24SW', 'd1000000-0000-0000-0000-000000000001', 2024),
  ('b1000000-0000-0000-0000-000000000004', '25SW', 'd1000000-0000-0000-0000-000000000001', 2025),
  ('b1000000-0000-0000-0000-000000000005', '26SW', 'd1000000-0000-0000-0000-000000000001', 2026)
on conflict (code) do nothing;

-- AI batches (22AI excluded per confirmed decision)
insert into batches (id, code, department_id, year) values
  ('b1000000-0000-0000-0000-000000000006', '23AI', 'd1000000-0000-0000-0000-000000000002', 2023),
  ('b1000000-0000-0000-0000-000000000007', '24AI', 'd1000000-0000-0000-0000-000000000002', 2024),
  ('b1000000-0000-0000-0000-000000000008', '25AI', 'd1000000-0000-0000-0000-000000000002', 2025),
  ('b1000000-0000-0000-0000-000000000009', '26AI', 'd1000000-0000-0000-0000-000000000002', 2026)
on conflict (code) do nothing;

-- ─── Games ──────────────────────────────────────────────────
-- Team games
insert into games (id, name, slug, format, gender) values
  ('c1000000-0000-0000-0000-000000000001', 'Cricket',    'cricket',    'team', 'both'),
  ('c1000000-0000-0000-0000-000000000002', 'Futsal',     'futsal',     'team', 'boys'),
  ('c1000000-0000-0000-0000-000000000003', 'Volleyball', 'volleyball', 'team', 'boys'),
  ('c1000000-0000-0000-0000-000000000004', 'Tug of War', 'tug-of-war', 'team', 'boys'),
  ('c1000000-0000-0000-0000-000000000005', 'Throwball',  'throwball',  'team', 'girls'),
  ('c1000000-0000-0000-0000-000000000006', 'Ludo',       'ludo',       'team', 'both')
on conflict (slug) do nothing;

-- Individual games
insert into games (id, name, slug, format, gender) values
  ('c1000000-0000-0000-0000-000000000007', 'Badminton',    'badminton',    'individual', 'both'),
  ('c1000000-0000-0000-0000-000000000008', 'Table Tennis', 'table-tennis', 'individual', 'both'),
  ('c1000000-0000-0000-0000-000000000009', 'Chess',        'chess',        'individual', 'both'),
  ('c1000000-0000-0000-0000-000000000010', 'Mini Marathon','mini-marathon','individual', 'both')
on conflict (slug) do nothing;

-- ─── Default Points Rules ───────────────────────────────────
-- Team games — stage-based
insert into points_rules (game_id, stage, position, points) values
  -- Group stage win
  (null, 'group',     null, 3),
  -- Semifinal loss (3rd place)
  (null, 'semifinal', null, 5),
  -- Final (runner-up)
  (null, 'final',     2,    7),
  -- Final (winner)
  (null, 'final',     1,    10)
on conflict do nothing;

-- Individual games — podium
insert into points_rules (game_id, stage, position, points) values
  (null, null, 1, 10),  -- 1st place
  (null, null, 2, 7),   -- 2nd place
  (null, null, 3, 5)    -- 3rd place
on conflict do nothing;

-- ─── Initialize Standings rows (all 0) ──────────────────────
insert into standings (batch_id, total_points, breakdown)
select id, 0, '{}'::jsonb from batches
on conflict (batch_id) do nothing;
