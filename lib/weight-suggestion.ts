/**
 * Pure utility functions for smart weight suggestions during workout sessions.
 * No React dependencies — fully testable.
 */

export interface TargetReps {
  min: number;
  max: number;
}

export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance' | 'general';

export type PRProximity = 'none' | 'approaching' | 'matched' | 'exceeded';

export interface SuggestWeightParams {
  /** Previous set data for this set index (null if no history) */
  previousSet: { weight: number; reps: number } | null;
  /** Zero-based set index */
  setIndex: number;
  /** Total number of sets for this exercise */
  totalSets: number;
  /** Target reps string from programme (e.g. "8-12", "5", "15+") */
  targetReps: string;
  /** Programme category (e.g. "Hypertrophy", "Strength") */
  programmeCategory: string | null;
  /** User's current PR for this exercise */
  pr: { weight: number; reps: number } | null;
}

const STANDARD_INCREMENT = 2.5;
const PLATE_INCREMENT = 1.25;

/**
 * Parses a target reps string into min/max range.
 * Examples: "8-12" → {min:8, max:12}, "10" → {min:10, max:10}, "15+" → {min:15, max:20}
 */
export function parseTargetReps(reps: string): TargetReps {
  const trimmed = reps.trim();

  // Range format: "8-12"
  const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]!, 10);
    const max = parseInt(rangeMatch[2]!, 10);
    return { min, max };
  }

  // Plus format: "15+"
  const plusMatch = trimmed.match(/^(\d+)\+$/);
  if (plusMatch) {
    const min = parseInt(plusMatch[1]!, 10);
    return { min, max: min + 5 };
  }

  // Single number: "10"
  const singleMatch = trimmed.match(/^(\d+)$/);
  if (singleMatch) {
    const value = parseInt(singleMatch[1]!, 10);
    return { min: value, max: value };
  }

  // Fallback for malformed strings
  return { min: 8, max: 12 };
}

/**
 * Determines the training goal from programme category and rep range.
 */
export function determineGoal(
  programmeCategory: string | null,
  targetReps: TargetReps,
): TrainingGoal {
  const category = programmeCategory?.toLowerCase() ?? '';

  // Explicit category name takes priority over rep ranges
  if (category.includes('strength')) return 'strength';
  if (category.includes('endurance')) return 'endurance';
  if (category.includes('hypertrophy')) return 'hypertrophy';

  // Fall back to rep range inference
  if (targetReps.max <= 5) return 'strength';
  if (targetReps.min >= 15) return 'endurance';
  if (targetReps.min >= 6 && targetReps.max <= 15) return 'hypertrophy';

  return 'general';
}

/**
 * Rounds a weight to the nearest plate increment (1.25kg).
 */
export function roundToPlate(weight: number): number {
  return Math.round(weight / PLATE_INCREMENT) * PLATE_INCREMENT;
}

/**
 * Core smart weight suggestion algorithm.
 * Returns suggested weight in kg, or null if no suggestion can be made.
 */
export function suggestWeight(params: SuggestWeightParams): number | null {
  const { previousSet, setIndex, targetReps, programmeCategory } = params;

  // No history → no suggestion
  if (!previousSet || previousSet.weight <= 0) {
    return null;
  }

  const target = parseTargetReps(targetReps);
  const goal = determineGoal(programmeCategory, target);
  const prevWeight = previousSet.weight;
  const prevReps = previousSet.reps;

  let suggested: number;

  switch (goal) {
    case 'strength':
      if (prevReps >= target.max) {
        // Hit top of range — progressive overload
        suggested = prevWeight + STANDARD_INCREMENT;
      } else if (prevReps >= target.min) {
        // In range — keep weight
        suggested = prevWeight;
      } else {
        // Below range — reduce weight
        suggested = prevWeight - STANDARD_INCREMENT;
      }
      break;

    case 'hypertrophy':
      if (prevReps >= target.max) {
        // Hit top of range — time to increase
        suggested = prevWeight + STANDARD_INCREMENT;
      } else if (prevReps >= target.min) {
        // In range — keep weight
        suggested = prevWeight;
      } else {
        // Below range — reduce
        suggested = prevWeight - STANDARD_INCREMENT;
      }
      break;

    case 'endurance':
      if (prevReps >= target.max + 3) {
        // Well above range — small increase
        suggested = prevWeight + PLATE_INCREMENT;
      } else {
        // Maintain weight, progression through reps
        suggested = prevWeight;
      }
      break;

    case 'general':
    default:
      if (prevReps >= target.max) {
        suggested = prevWeight + STANDARD_INCREMENT;
      } else {
        suggested = prevWeight;
      }
      break;
  }

  // Fatigue adjustment for later sets
  if (setIndex >= 3 && suggested > 30) {
    suggested -= STANDARD_INCREMENT;
  } else if (setIndex >= 2 && suggested > 20) {
    suggested -= PLATE_INCREMENT;
  }

  // Round and clamp
  suggested = roundToPlate(suggested);
  return Math.max(0, suggested);
}

/**
 * Determines how close a weight is to the user's PR.
 */
export function getPRProximity(
  currentWeight: number,
  pr: { weight: number; reps: number } | null,
): PRProximity {
  if (!pr || pr.weight <= 0 || currentWeight <= 0) {
    return 'none';
  }

  if (currentWeight > pr.weight) {
    return 'exceeded';
  }

  if (currentWeight === pr.weight) {
    return 'matched';
  }

  // Within 5% of PR weight
  const threshold = pr.weight * 0.95;
  if (currentWeight >= threshold) {
    return 'approaching';
  }

  return 'none';
}
