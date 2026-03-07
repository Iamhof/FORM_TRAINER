// XP action types
export const XP_ACTIONS = {
  WORKOUT_LOGGED: 'WORKOUT_LOGGED',
  PROGRAMME_CREATED: 'PROGRAMME_CREATED',
  PERSONAL_RECORD: 'PERSONAL_RECORD',
  CHANGE_COLOR: 'CHANGE_COLOR',
} as const;

export type XPAction = (typeof XP_ACTIONS)[keyof typeof XP_ACTIONS];

// XP amounts per action
export const XP_AMOUNTS: Record<XPAction, number> = {
  WORKOUT_LOGGED: 50,
  PROGRAMME_CREATED: 30,
  PERSONAL_RECORD: 40,
  CHANGE_COLOR: 10,
};

// Level definitions
export interface LevelDefinition {
  level: number;
  title: string;
  xpRequired: number;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: 'Beginner', xpRequired: 0 },
  { level: 2, title: 'Novice', xpRequired: 100 },
  { level: 3, title: 'Apprentice', xpRequired: 250 },
  { level: 4, title: 'Intermediate', xpRequired: 500 },
  { level: 5, title: 'Dedicated', xpRequired: 850 },
  { level: 6, title: 'Advanced', xpRequired: 1300 },
  { level: 7, title: 'Expert', xpRequired: 1850 },
  { level: 8, title: 'Elite', xpRequired: 2500 },
  { level: 9, title: 'Champion', xpRequired: 3300 },
  { level: 10, title: 'Legend', xpRequired: 4250 },
];

export function getLevelInfo(level: number): LevelDefinition {
  const clamped = Math.min(Math.max(level, 1), LEVELS.length);
  return LEVELS[clamped - 1]!;
}

export function getLevelProgress(
  currentXp: number,
  currentLevel: number
): {
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpNeeded: number;
  progressPercent: number;
} {
  const currentDef = getLevelInfo(currentLevel);
  const isMaxLevel = currentLevel >= LEVELS.length;
  const nextDef = isMaxLevel ? currentDef : LEVELS[currentLevel]!;

  const currentLevelXp = currentDef.xpRequired;
  const nextLevelXp = isMaxLevel ? currentDef.xpRequired : nextDef.xpRequired;
  const xpIntoLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progressPercent = isMaxLevel
    ? 100
    : xpNeeded > 0
      ? Math.min(Math.round((xpIntoLevel / xpNeeded) * 100), 100)
      : 100;

  return { currentLevelXp, nextLevelXp, xpIntoLevel, xpNeeded, progressPercent };
}
