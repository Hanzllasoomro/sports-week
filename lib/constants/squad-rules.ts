/**
 * Squad size rules and lineup labels by sport format.
 * Defines starting lineup count + optional / reserve player allowances.
 */

export interface SportSquadRules {
  sportSlug: string;
  playingCount: number;
  optionalCount: number;
  totalMax: number;
  playingLabel: string;
  optionalLabel: string;
}

export const SQUAD_RULES_MAP: Record<string, SportSquadRules> = {
  cricket: {
    sportSlug: 'cricket',
    playingCount: 11,
    optionalCount: 3,
    totalMax: 14,
    playingLabel: 'Playing XI (Lineup)',
    optionalLabel: 'Optional / Reserves (Max 3)',
  },
  futsal: {
    sportSlug: 'futsal',
    playingCount: 5,
    optionalCount: 3,
    totalMax: 8,
    playingLabel: 'Starting 5 (On Pitch)',
    optionalLabel: 'Optional / Substitutes (Max 3)',
  },
  volleyball: {
    sportSlug: 'volleyball',
    playingCount: 7,
    optionalCount: 3,
    totalMax: 10,
    playingLabel: 'Starting 7 (On Court)',
    optionalLabel: 'Optional / Substitutes (Max 3)',
  },
  throwball: {
    sportSlug: 'throwball',
    playingCount: 7,
    optionalCount: 3,
    totalMax: 10,
    playingLabel: 'Starting 7 (On Court)',
    optionalLabel: 'Optional / Substitutes (Max 3)',
  },
  'tug-of-war': {
    sportSlug: 'tug-of-war',
    playingCount: 8,
    optionalCount: 3,
    totalMax: 11,
    playingLabel: 'Starting 8 (Pullers)',
    optionalLabel: 'Optional / Substitutes (Max 3)',
  },
  ludo: {
    sportSlug: 'ludo',
    playingCount: 2,
    optionalCount: 1,
    totalMax: 3,
    playingLabel: 'Playing Pair',
    optionalLabel: 'Optional Reserve',
  },
};

export const DEFAULT_SQUAD_RULES: SportSquadRules = {
  sportSlug: 'default',
  playingCount: 7,
  optionalCount: 3,
  totalMax: 10,
  playingLabel: 'Starting Lineup',
  optionalLabel: 'Optional / Substitutes',
};

export function getSquadRulesForGame(gameSlug?: string): SportSquadRules {
  if (!gameSlug) return DEFAULT_SQUAD_RULES;
  const key = gameSlug.toLowerCase().trim();
  return SQUAD_RULES_MAP[key] || DEFAULT_SQUAD_RULES;
}
