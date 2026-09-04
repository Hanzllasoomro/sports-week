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
  badminton: {
    sportSlug: 'badminton',
    playingCount: 2,
    optionalCount: 1,
    totalMax: 3,
    playingLabel: 'Playing Pair (2 Players)',
    optionalLabel: 'Optional Reserve (Max 1)',
  },
  'badminton-singles': {
    sportSlug: 'badminton-singles',
    playingCount: 1,
    optionalCount: 0,
    totalMax: 1,
    playingLabel: 'Singles Competitor (1 Player)',
    optionalLabel: 'No Reserves (Singles)',
  },
  'table-tennis': {
    sportSlug: 'table-tennis',
    playingCount: 2,
    optionalCount: 1,
    totalMax: 3,
    playingLabel: 'Playing Pair (2 Players)',
    optionalLabel: 'Optional Reserve (Max 1)',
  },
  'table-tennis-singles': {
    sportSlug: 'table-tennis-singles',
    playingCount: 1,
    optionalCount: 0,
    totalMax: 1,
    playingLabel: 'Singles Competitor (1 Player)',
    optionalLabel: 'No Reserves (Singles)',
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

export function getSquadRulesForGame(
  gameSlug?: string,
  formatMode?: 'singles' | 'doubles' | 'individual' | 'team'
): SportSquadRules {
  if (!gameSlug) return DEFAULT_SQUAD_RULES;
  const key = gameSlug.toLowerCase().trim();

  if ((key === 'badminton' || key === 'table-tennis') && (formatMode === 'singles' || formatMode === 'individual')) {
    return SQUAD_RULES_MAP[`${key}-singles`] || SQUAD_RULES_MAP[key] || DEFAULT_SQUAD_RULES;
  }

  return SQUAD_RULES_MAP[key] || DEFAULT_SQUAD_RULES;
}
