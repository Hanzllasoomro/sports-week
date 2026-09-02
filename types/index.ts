// ─── Database entity types ─────────────────────────────────────────────────

export type Department = {
  id: string;
  code: 'SW' | 'AI';
  name: string;
};

export type Batch = {
  id: string;
  code: string; // e.g. "24SW", "23AI"
  department_id: string;
  year: number;
  department?: Department;
};

export type GameFormat = 'team' | 'individual';
export type Gender = 'boys' | 'girls' | 'both';

export type Game = {
  id: string;
  name: string;
  slug: string;
  format: GameFormat;
  gender: Gender;
  category?: string | null;
};

export type Team = {
  id: string;
  game_id: string;
  batch_id: string;
  gender: 'boys' | 'girls';
  name: string;
  game?: Game;
  batch?: Batch;
};

export type Player = {
  id: string;
  name: string;
  batch_id: string;
  gender: 'boys' | 'girls';
  roll_no?: string | null;
  batch?: Batch;
};

export type TeamMember = {
  team_id: string;
  player_id: string;
  player?: Player;
};

export type FixtureStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type FixtureStage = 'group' | 'semifinal' | 'final' | 'friendly';

export type Fixture = {
  id: string;
  game_id: string;
  round?: string | null;
  stage: FixtureStage;
  // Team game: team_a_id / team_b_id; Individual game: player_a_id / player_b_id
  team_a_id?: string | null;
  team_b_id?: string | null;
  player_a_id?: string | null;
  player_b_id?: string | null;
  scheduled_at: string; // ISO timestamp
  venue?: string | null;
  status: FixtureStatus;
  score_a?: number | null;
  score_b?: number | null;
  winner_team_id?: string | null;
  winner_player_id?: string | null;
  game?: Game;
  team_a?: Team;
  team_b?: Team;
  player_a?: Player;
  player_b?: Player;
};

export type IndividualResult = {
  id: string;
  game_id: string;
  batch_id: string;
  gender: 'boys' | 'girls';
  player_id?: string | null;
  position: number; // 1 = gold, 2 = silver, 3 = bronze
  points_awarded: number;
  game?: Game;
  batch?: Batch;
  player?: Player;
};

export type PointsRule = {
  id: string;
  game_id?: string | null; // null = default rule
  stage?: FixtureStage | null;
  position?: number | null;
  points: number;
};

export type Standing = {
  batch_id: string;
  total_points: number;
  breakdown: StandingBreakdown;
  rank?: number;
  batch?: Batch;
};

export type StandingBreakdown = {
  [gameSlug: string]: {
    boys: number;
    girls: number;
  };
};

export type Admin = {
  id: string; // Supabase auth user id
  name: string;
  role: 'admin' | 'superadmin';
};

// ─── Server Action response shape ─────────────────────────────────────────

export type ActionSuccess<T> = { data: T; error?: never };
export type ActionError = { data?: never; error: { message: string; code: string } };
export type ActionResult<T> = ActionSuccess<T> | ActionError;

// ─── Enriched view types (for UI) ─────────────────────────────────────────

/** Fixture enriched with all related data — used by public fixture lists */
export type FixtureWithRelations = Fixture & {
  game: Game;
  team_a?: Team & { batch: Batch };
  team_b?: Team & { batch: Batch };
  player_a?: Player & { batch: Batch };
  player_b?: Player & { batch: Batch };
};

/** Standings row enriched with batch + department */
export type StandingRow = {
  rank: number;
  batch: Batch & { department: Department };
  total_points: number;
  breakdown: StandingBreakdown;
};
