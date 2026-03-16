import { describe, expect, it } from 'vitest';

import {
  parseTargetReps,
  suggestWeight,
  getPRProximity,
  determineGoal,
  roundToPlate,
} from '@/lib/weight-suggestion';

describe('parseTargetReps', () => {
  it('parses range format "8-12"', () => {
    expect(parseTargetReps('8-12')).toEqual({ min: 8, max: 12 });
  });

  it('parses range with spaces "8 - 12"', () => {
    expect(parseTargetReps('8 - 12')).toEqual({ min: 8, max: 12 });
  });

  it('parses single number "10"', () => {
    expect(parseTargetReps('10')).toEqual({ min: 10, max: 10 });
  });

  it('parses plus format "15+"', () => {
    expect(parseTargetReps('15+')).toEqual({ min: 15, max: 20 });
  });

  it('parses low range "3-5"', () => {
    expect(parseTargetReps('3-5')).toEqual({ min: 3, max: 5 });
  });

  it('returns default for malformed string', () => {
    expect(parseTargetReps('abc')).toEqual({ min: 8, max: 12 });
  });

  it('returns default for empty string', () => {
    expect(parseTargetReps('')).toEqual({ min: 8, max: 12 });
  });
});

describe('determineGoal', () => {
  it('returns strength for "Strength" category', () => {
    expect(determineGoal('Strength', { min: 8, max: 12 })).toBe('strength');
  });

  it('returns strength for low rep max', () => {
    expect(determineGoal(null, { min: 3, max: 5 })).toBe('strength');
  });

  it('returns hypertrophy for "Hypertrophy" category', () => {
    expect(determineGoal('Hypertrophy', { min: 8, max: 12 })).toBe('hypertrophy');
  });

  it('returns hypertrophy for mid-range reps', () => {
    expect(determineGoal(null, { min: 8, max: 12 })).toBe('hypertrophy');
  });

  it('returns endurance for "Endurance" category', () => {
    expect(determineGoal('Endurance', { min: 8, max: 12 })).toBe('endurance');
  });

  it('returns endurance for high rep min', () => {
    expect(determineGoal(null, { min: 15, max: 20 })).toBe('endurance');
  });

  it('returns general for null category with ambiguous reps', () => {
    expect(determineGoal(null, { min: 1, max: 100 })).toBe('general');
  });
});

describe('roundToPlate', () => {
  it('rounds to nearest 1.25', () => {
    expect(roundToPlate(67.3)).toBe(67.5);
    expect(roundToPlate(67.6)).toBe(67.5);
    expect(roundToPlate(68.1)).toBe(67.5); // 68.1 is closer to 67.5 than 68.75
    expect(roundToPlate(60)).toBe(60);
    expect(roundToPlate(61.25)).toBe(61.25);
  });
});

describe('suggestWeight', () => {
  const baseParams = {
    setIndex: 0,
    totalSets: 3,
    targetReps: '8-12',
    programmeCategory: 'Hypertrophy' as string | null,
    pr: null,
  };

  it('returns null when no previous set', () => {
    expect(suggestWeight({ ...baseParams, previousSet: null })).toBeNull();
  });

  it('returns null when previous weight is 0', () => {
    expect(suggestWeight({ ...baseParams, previousSet: { weight: 0, reps: 10 } })).toBeNull();
  });

  describe('hypertrophy', () => {
    it('increases weight when reps hit top of range', () => {
      const result = suggestWeight({
        ...baseParams,
        previousSet: { weight: 60, reps: 12 },
      });
      expect(result).toBe(62.5); // 60 + 2.5
    });

    it('keeps weight when reps in mid-range', () => {
      const result = suggestWeight({
        ...baseParams,
        previousSet: { weight: 60, reps: 10 },
      });
      expect(result).toBe(60);
    });

    it('decreases weight when reps below range', () => {
      const result = suggestWeight({
        ...baseParams,
        previousSet: { weight: 60, reps: 6 },
      });
      expect(result).toBe(57.5); // 60 - 2.5
    });

    it('exceeds top of range triggers increase', () => {
      const result = suggestWeight({
        ...baseParams,
        previousSet: { weight: 60, reps: 15 },
      });
      expect(result).toBe(62.5);
    });
  });

  describe('strength', () => {
    const strengthParams = { ...baseParams, targetReps: '3-5', programmeCategory: 'Strength' };

    it('increases weight when hit top of range', () => {
      const result = suggestWeight({
        ...strengthParams,
        previousSet: { weight: 100, reps: 5 },
      });
      expect(result).toBe(102.5);
    });

    it('keeps weight when in range', () => {
      const result = suggestWeight({
        ...strengthParams,
        previousSet: { weight: 100, reps: 4 },
      });
      expect(result).toBe(100);
    });

    it('decreases weight when below range', () => {
      const result = suggestWeight({
        ...strengthParams,
        previousSet: { weight: 100, reps: 2 },
      });
      expect(result).toBe(97.5);
    });
  });

  describe('endurance', () => {
    const enduranceParams = { ...baseParams, targetReps: '15+', programmeCategory: 'Endurance' };

    it('maintains weight within range', () => {
      const result = suggestWeight({
        ...enduranceParams,
        previousSet: { weight: 30, reps: 18 },
      });
      expect(result).toBe(30);
    });

    it('small increase when well above range', () => {
      const result = suggestWeight({
        ...enduranceParams,
        previousSet: { weight: 30, reps: 25 },
        // target max is 20, reps >= 23 triggers increase
      });
      expect(result).toBe(31.25); // 30 + 1.25
    });
  });

  describe('fatigue adjustment', () => {
    it('reduces suggestion for set index 2 (third set) when weight > 20', () => {
      const result = suggestWeight({
        ...baseParams,
        setIndex: 2,
        previousSet: { weight: 60, reps: 10 },
      });
      expect(result).toBe(58.75); // 60 - 1.25
    });

    it('reduces more for set index 3+ when weight > 30', () => {
      const result = suggestWeight({
        ...baseParams,
        setIndex: 3,
        previousSet: { weight: 60, reps: 10 },
      });
      expect(result).toBe(57.5); // 60 - 2.5
    });

    it('does not reduce for light weights on set 2', () => {
      const result = suggestWeight({
        ...baseParams,
        setIndex: 2,
        previousSet: { weight: 15, reps: 10 },
      });
      expect(result).toBe(15); // No fatigue adjustment for <= 20kg
    });
  });

  describe('rounding', () => {
    it('rounds to nearest 1.25', () => {
      // 57.5 - 2.5 = 55.0, which is already plate-aligned
      const result = suggestWeight({
        ...baseParams,
        previousSet: { weight: 57.5, reps: 6 },
      });
      expect(result).toBe(55);
    });
  });

  describe('clamping', () => {
    it('never returns negative', () => {
      const result = suggestWeight({
        ...baseParams,
        previousSet: { weight: 1.25, reps: 3 },
      });
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('getPRProximity', () => {
  const pr = { weight: 100, reps: 5 };

  it('returns none when no PR', () => {
    expect(getPRProximity(80, null)).toBe('none');
  });

  it('returns none when PR weight is 0', () => {
    expect(getPRProximity(80, { weight: 0, reps: 5 })).toBe('none');
  });

  it('returns none when current weight is 0', () => {
    expect(getPRProximity(0, pr)).toBe('none');
  });

  it('returns none when well below PR', () => {
    expect(getPRProximity(80, pr)).toBe('none');
  });

  it('returns approaching when within 5% of PR', () => {
    expect(getPRProximity(96, pr)).toBe('approaching'); // 96 >= 95 (5% threshold)
  });

  it('returns matched when equal to PR weight', () => {
    expect(getPRProximity(100, pr)).toBe('matched');
  });

  it('returns exceeded when above PR weight', () => {
    expect(getPRProximity(102.5, pr)).toBe('exceeded');
  });

  it('returns approaching at exact threshold', () => {
    expect(getPRProximity(95, pr)).toBe('approaching'); // 95 === 100 * 0.95
  });
});
