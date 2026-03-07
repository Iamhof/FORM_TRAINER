/* eslint-disable no-console */
// Standalone benchmark for analytics aggregation
// Run with: node tests/benchmarks/analytics-standalone.mjs

import { performance } from 'node:perf_hooks';

// Import the aggregateAnalyticsData function
// Note: We'll need to run this with --loader or use a different approach

console.log('📊 Analytics Aggregation Performance Benchmark\n');
console.log('Generating mock data...\n');

// Mock data generators
function generateMockAnalytics(days, exercisesPerDay) {
  const data = [];
  const startDate = new Date('2025-07-01');
  const exerciseIds = Array.from({ length: 100 }, (_, i) => `exercise-${i}`);

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    for (let ex = 0; ex < exercisesPerDay; ex++) {
      const exerciseId = exerciseIds[ex % exerciseIds.length];

      data.push({
        user_id: 'test-user-id',
        date: dateStr,
        exercise_id: exerciseId,
        exercise_name: `Exercise ${exerciseId}`,
        total_sets: Math.floor(Math.random() * 5) + 1,
        total_reps: Math.floor(Math.random() * 20) + 10,
        total_volume: Math.floor(Math.random() * 5000) + 1000,
        max_weight: Math.floor(Math.random() * 200) + 50,
        max_reps_at_max_weight: Math.floor(Math.random() * 10) + 1,
      });
    }
  }

  return data;
}

function generateMockWorkouts(days) {
  const workouts = [];
  const startDate = new Date('2025-07-01');

  for (let day = 0; day < days; day++) {
    if (Math.random() > 0.3) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day);

      workouts.push({
        completed_at: date.toISOString(),
        programme_id: 'test-programme-id',
      });
    }
  }

  return workouts;
}

function generateMockSchedules(weeks) {
  const schedules = [];
  const startDate = new Date('2025-07-01');

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + week * 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    schedules.push({
      user_id: 'test-user-id',
      week_start: weekStartStr,
      schedule: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        status: i % 3 === 0 ? 'rest' : (Math.random() > 0.3 ? 'completed' : 'scheduled'),
        sessionId: i % 3 === 0 ? null : `session-${week}-${i}`,
      })),
    });
  }

  return schedules;
}

// eslint-disable-next-line no-unused-vars -- Prepared benchmark utility for manual use
function runBenchmark(name, fn, iterations = 10) {
  const times = [];

  // Warmup
  for (let i = 0; i < 2; i++) {
    fn();
  }

  // Actual measurement
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

  console.log(`${name}:`);
  console.log(`  Iterations: ${iterations}`);
  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Min: ${min.toFixed(2)}ms`);
  console.log(`  Max: ${max.toFixed(2)}ms`);
  console.log(`  P95: ${p95.toFixed(2)}ms`);

  return { avg, min, max, p95 };
}

// Generate test datasets
console.log('Test Case 1: Small dataset (300 data points)');
const small = {
  analytics: generateMockAnalytics(30, 10),
  workouts: generateMockWorkouts(30),
  schedules: generateMockSchedules(4),
};

console.log('Test Case 2: Medium dataset (4,500 data points)');
const medium = {
  analytics: generateMockAnalytics(90, 50),
  workouts: generateMockWorkouts(90),
  schedules: generateMockSchedules(13),
};

console.log('Test Case 3: Large dataset (18,000 data points) - CRITICAL');
const large = {
  analytics: generateMockAnalytics(180, 100),
  workouts: generateMockWorkouts(180),
  schedules: generateMockSchedules(26),
};

console.log('Test Case 4: Extreme dataset (54,750 data points) - STRESS TEST\n');
const extreme = {
  analytics: generateMockAnalytics(365, 150),
  workouts: generateMockWorkouts(365),
  schedules: generateMockSchedules(52),
};

console.log('=====================================================');
console.log('NOTE: Cannot load TypeScript module directly.');
console.log('Please run the analytics aggregation function manually');
console.log('or use ts-node/tsx to execute this benchmark.');
console.log('=====================================================\n');

console.log('Data generated successfully:');
console.log(`  Small: ${small.analytics.length} analytics records`);
console.log(`  Medium: ${medium.analytics.length} analytics records`);
console.log(`  Large: ${large.analytics.length} analytics records`);
console.log(`  Extreme: ${extreme.analytics.length} analytics records\n`);

console.log('Expected baseline (O(N²) implementation):');
console.log(`  Large dataset: ~2,500-3,000ms`);
console.log(`  Extreme dataset: ~8,000-10,000ms\n`);

console.log('Target after optimization (O(N log N)):');
console.log(`  Large dataset: <300ms (10x improvement)`);
console.log(`  Extreme dataset: <900ms (10x improvement)`);
