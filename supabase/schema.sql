-- ============================================================
-- SES Sports Week 2026 — Supabase Postgres Schema
-- ============================================================
-- Apply via: Supabase Dashboard > SQL Editor, or `supabase db push`
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Departments ────────────────────────────────────────────
create table if not exists departments (
  id   uuid primary key default gen_random_uuid(),
  code text not null unique,  -- 'SW' | 'AI'
  name text not null
);

-- ─── Batches ────────────────────────────────────────────────
create table if not exists batches (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,  -- e.g. '24SW', '23AI'
  department_id uuid not null references departments(id) on delete cascade,
  year          int  not null          -- e.g. 2024
);

-- ─── Games ──────────────────────────────────────────────────
create table if not exists games (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  slug     text not null unique,  -- e.g. 'cricket', 'badminton'
  format   text not null check (format in ('team', 'individual')),
  gender   text not null check (gender in ('boys', 'girls', 'both')),
  category text
);

-- ─── Teams (one per batch × game × gender for team games) ──
create table if not exists teams (
  id       uuid primary key default gen_random_uuid(),
  game_id  uuid not null references games(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  gender   text not null check (gender in ('boys', 'girls')),
  name     text not null,
  unique (game_id, batch_id, gender)
);

-- ─── Players ────────────────────────────────────────────────
create table if not exists players (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  batch_id uuid not null references batches(id) on delete cascade,
  gender   text not null check (gender in ('boys', 'girls')),
  roll_no  text
);

-- ─── Team Members ───────────────────────────────────────────
create table if not exists team_members (
  team_id   uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  primary key (team_id, player_id)
);

-- ─── Fixtures ───────────────────────────────────────────────
create table if not exists fixtures (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references games(id) on delete cascade,
  round            text,
  stage            text not null check (stage in ('group', 'semifinal', 'final', 'friendly')),
  -- Team fixtures
  team_a_id        uuid references teams(id) on delete set null,
  team_b_id        uuid references teams(id) on delete set null,
  -- Individual fixtures
  player_a_id      uuid references players(id) on delete set null,
  player_b_id      uuid references players(id) on delete set null,
  scheduled_at     timestamptz not null,
  venue            text,
  status           text not null default 'scheduled'
                   check (status in ('scheduled', 'live', 'completed', 'cancelled')),
  score_a          int,
  score_b          int,
  cricket_details  jsonb, -- detailed cricket match state (runs, wickets, overs, batsmen, bowler, target, timeline)
  winner_team_id   uuid references teams(id) on delete set null,
  winner_player_id uuid references players(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Migration for existing deployments:
-- alter table fixtures add column if not exists cricket_details jsonb;

-- ─── Individual Results (podium finishes) ───────────────────
create table if not exists individual_results (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  batch_id       uuid not null references batches(id) on delete cascade,
  gender         text not null check (gender in ('boys', 'girls')),
  player_id      uuid references players(id) on delete set null,
  position       int  not null check (position >= 1),  -- 1=gold, 2=silver, 3=bronze
  points_awarded int  not null default 0,
  unique (game_id, gender, position)  -- one winner per game/gender/position
);

-- ─── Points Rules (admin-editable, not hardcoded) ──────────
create table if not exists points_rules (
  id       uuid primary key default gen_random_uuid(),
  game_id  uuid references games(id) on delete cascade,  -- null = default rule
  stage    text check (stage in ('group', 'semifinal', 'final', 'friendly')),
  position int,   -- null = team result; >0 = individual podium position
  points   int  not null default 0
);

-- ─── Standings (precomputed, written by points engine) ──────
create table if not exists standings (
  batch_id      uuid primary key references batches(id) on delete cascade,
  total_points  int  not null default 0,
  breakdown     jsonb not null default '{}'::jsonb,  -- { "cricket": { "boys": 10, "girls": 5 } }
  updated_at    timestamptz not null default now()
);

-- ─── Admins (linked to Supabase Auth users) ─────────────────
create table if not exists admins (
  id   uuid primary key,  -- = auth.users.id
  name text not null,
  role text not null default 'admin' check (role in ('admin', 'superadmin'))
);

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists idx_fixtures_status       on fixtures(status);
create index if not exists idx_fixtures_scheduled_at on fixtures(scheduled_at);
create index if not exists idx_fixtures_game_id      on fixtures(game_id);
create index if not exists idx_players_batch_id      on players(batch_id);
create index if not exists idx_team_members_team_id  on team_members(team_id);
create index if not exists idx_standings_total_points on standings(total_points desc);

-- ─── Updated_at trigger ─────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_fixtures_updated_at
  before update on fixtures
  for each row execute procedure set_updated_at();

create or replace trigger trg_standings_updated_at
  before update on standings
  for each row execute procedure set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────
-- Public: read-only on everything except admins table
alter table departments        enable row level security;
alter table batches            enable row level security;
alter table games              enable row level security;
alter table teams              enable row level security;
alter table players            enable row level security;
alter table team_members       enable row level security;
alter table fixtures           enable row level security;
alter table individual_results enable row level security;
alter table points_rules       enable row level security;
alter table standings          enable row level security;
alter table admins             enable row level security;

-- Public read policies
create policy "public_read_departments"        on departments        for select using (true);
create policy "public_read_batches"            on batches            for select using (true);
create policy "public_read_games"              on games              for select using (true);
create policy "public_read_teams"              on teams              for select using (true);
create policy "public_read_players"            on players            for select using (true);
create policy "public_read_team_members"       on team_members       for select using (true);
create policy "public_read_fixtures"           on fixtures           for select using (true);
create policy "public_read_individual_results" on individual_results for select using (true);
create policy "public_read_points_rules"       on points_rules       for select using (true);
create policy "public_read_standings"          on standings          for select using (true);

-- Admin write policies (service role bypasses RLS — these guard anon key usage)
create policy "admin_all_departments"        on departments        for all using (auth.role() = 'authenticated');
create policy "admin_all_batches"            on batches            for all using (auth.role() = 'authenticated');
create policy "admin_all_games"              on games              for all using (auth.role() = 'authenticated');
create policy "admin_all_teams"              on teams              for all using (auth.role() = 'authenticated');
create policy "admin_all_players"            on players            for all using (auth.role() = 'authenticated');
create policy "admin_all_team_members"       on team_members       for all using (auth.role() = 'authenticated');
create policy "admin_all_fixtures"           on fixtures           for all using (auth.role() = 'authenticated');
create policy "admin_all_individual_results" on individual_results for all using (auth.role() = 'authenticated');
create policy "admin_all_points_rules"       on points_rules       for all using (auth.role() = 'authenticated');
create policy "admin_all_standings"          on standings          for all using (auth.role() = 'authenticated');
create policy "admin_read_admins"            on admins             for select using (auth.uid() = id);
