import { describe, test, expect } from 'vitest';
import { z } from 'zod';

// Re-create the schemas here to test validation rules in isolation.
// These mirror the schemas in the tRPC routes.

const workoutSetSchema = z.object({
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(0).max(999),
  completed: z.boolean(),
});

const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.array(workoutSetSchema),
});

const logWorkoutInputSchema = z.object({
  programmeId: z.string(),
  programmeName: z.string(),
  day: z.number().int().min(1).max(7),
  week: z.number().int().min(1).max(52),
  exercises: z.array(workoutExerciseSchema),
  completedAt: z.string().datetime(),
});

const programmeExerciseSchema = z.object({
  day: z.number(),
  exerciseId: z.string(),
  sets: z.number().int().min(1).max(30),
  reps: z.string(),
  rest: z.number().int().min(0).max(600),
});

const createProgrammeInputSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  days: z.number().int().min(1).max(7),
  weeks: z.number().int().min(1).max(52),
  category: z.string().optional(),
  exercises: z.array(programmeExerciseSchema),
});

describe('workout log input validation', () => {
  const validInput = {
    programmeId: 'abc-123',
    programmeName: 'Push Pull Legs',
    day: 1,
    week: 1,
    exercises: [
      {
        exerciseId: 'ex-1',
        sets: [{ weight: 100, reps: 10, completed: true }],
      },
    ],
    completedAt: '2026-03-16T12:00:00.000Z',
  };

  test('accepts valid input', () => {
    expect(() => logWorkoutInputSchema.parse(validInput)).not.toThrow();
  });

  test('rejects negative weight', () => {
    const input = {
      ...validInput,
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: -10, reps: 5, completed: true }],
        },
      ],
    };
    expect(() => logWorkoutInputSchema.parse(input)).toThrow();
  });

  test('rejects weight exceeding 2000', () => {
    const input = {
      ...validInput,
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: 2001, reps: 5, completed: true }],
        },
      ],
    };
    expect(() => logWorkoutInputSchema.parse(input)).toThrow();
  });

  test('rejects negative reps', () => {
    const input = {
      ...validInput,
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: 50, reps: -1, completed: true }],
        },
      ],
    };
    expect(() => logWorkoutInputSchema.parse(input)).toThrow();
  });

  test('rejects non-integer reps', () => {
    const input = {
      ...validInput,
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: 50, reps: 5.5, completed: true }],
        },
      ],
    };
    expect(() => logWorkoutInputSchema.parse(input)).toThrow();
  });

  test('rejects reps exceeding 999', () => {
    const input = {
      ...validInput,
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: 50, reps: 1000, completed: true }],
        },
      ],
    };
    expect(() => logWorkoutInputSchema.parse(input)).toThrow();
  });

  test('rejects day < 1', () => {
    expect(() => logWorkoutInputSchema.parse({ ...validInput, day: 0 })).toThrow();
  });

  test('rejects day > 7', () => {
    expect(() => logWorkoutInputSchema.parse({ ...validInput, day: 8 })).toThrow();
  });

  test('rejects week < 1', () => {
    expect(() => logWorkoutInputSchema.parse({ ...validInput, week: 0 })).toThrow();
  });

  test('rejects week > 52', () => {
    expect(() => logWorkoutInputSchema.parse({ ...validInput, week: 53 })).toThrow();
  });

  test('rejects non-integer day', () => {
    expect(() => logWorkoutInputSchema.parse({ ...validInput, day: 1.5 })).toThrow();
  });

  test('rejects non-ISO completedAt', () => {
    expect(() => logWorkoutInputSchema.parse({ ...validInput, completedAt: 'March 16' })).toThrow();
  });

  test('rejects non-datetime completedAt', () => {
    expect(() => logWorkoutInputSchema.parse({ ...validInput, completedAt: '2026-13-01' })).toThrow();
  });

  test('accepts zero weight and zero reps', () => {
    const input = {
      ...validInput,
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: 0, reps: 0, completed: false }],
        },
      ],
    };
    expect(() => logWorkoutInputSchema.parse(input)).not.toThrow();
  });
});

describe('programme create input validation', () => {
  const validInput = {
    name: 'Push Pull Legs',
    days: 3,
    weeks: 8,
    exercises: [
      { day: 1, exerciseId: 'ex-1', sets: 3, reps: '8-12', rest: 90 },
    ],
  };

  test('accepts valid input', () => {
    expect(() => createProgrammeInputSchema.parse(validInput)).not.toThrow();
  });

  test('rejects empty name', () => {
    expect(() => createProgrammeInputSchema.parse({ ...validInput, name: '' })).toThrow();
  });

  test('rejects name longer than 100 chars', () => {
    expect(() =>
      createProgrammeInputSchema.parse({ ...validInput, name: 'x'.repeat(101) })
    ).toThrow();
  });

  test('trims whitespace from name', () => {
    const result = createProgrammeInputSchema.parse({ ...validInput, name: '  My Program  ' });
    expect(result.name).toBe('My Program');
  });

  test('rejects days < 1', () => {
    expect(() => createProgrammeInputSchema.parse({ ...validInput, days: 0 })).toThrow();
  });

  test('rejects days > 7', () => {
    expect(() => createProgrammeInputSchema.parse({ ...validInput, days: 8 })).toThrow();
  });

  test('rejects weeks < 1', () => {
    expect(() => createProgrammeInputSchema.parse({ ...validInput, weeks: 0 })).toThrow();
  });

  test('rejects weeks > 52', () => {
    expect(() => createProgrammeInputSchema.parse({ ...validInput, weeks: 53 })).toThrow();
  });

  test('rejects non-integer days', () => {
    expect(() => createProgrammeInputSchema.parse({ ...validInput, days: 2.5 })).toThrow();
  });

  test('rejects exercise sets < 1', () => {
    const input = {
      ...validInput,
      exercises: [{ day: 1, exerciseId: 'ex-1', sets: 0, reps: '8', rest: 90 }],
    };
    expect(() => createProgrammeInputSchema.parse(input)).toThrow();
  });

  test('rejects exercise sets > 30', () => {
    const input = {
      ...validInput,
      exercises: [{ day: 1, exerciseId: 'ex-1', sets: 31, reps: '8', rest: 90 }],
    };
    expect(() => createProgrammeInputSchema.parse(input)).toThrow();
  });

  test('rejects negative rest', () => {
    const input = {
      ...validInput,
      exercises: [{ day: 1, exerciseId: 'ex-1', sets: 3, reps: '8', rest: -1 }],
    };
    expect(() => createProgrammeInputSchema.parse(input)).toThrow();
  });

  test('rejects rest > 600', () => {
    const input = {
      ...validInput,
      exercises: [{ day: 1, exerciseId: 'ex-1', sets: 3, reps: '8', rest: 601 }],
    };
    expect(() => createProgrammeInputSchema.parse(input)).toThrow();
  });

  test('rejects non-integer rest', () => {
    const input = {
      ...validInput,
      exercises: [{ day: 1, exerciseId: 'ex-1', sets: 3, reps: '8', rest: 90.5 }],
    };
    expect(() => createProgrammeInputSchema.parse(input)).toThrow();
  });
});
