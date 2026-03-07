/**
 * Personal Trainer (PT) feature type definitions
 * Defines interfaces for PT-client relationships, shared programmes, and analytics
 */

export interface SharedProgrammeLink {
  id: string;
  programmeId: string;
}

export interface PTClient {
  id: string;
  relationshipId: string;
  status: 'pending' | 'active' | 'inactive';
  connectedAt: string;
  name: string;
  email: string;
  sharedProgrammes: number;
  sharedProgrammeIds?: SharedProgrammeLink[];
}

export interface ClientAnalyticsRecord {
  id: string;
  userId: string;
  exerciseId: string;
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalReps: number;
  createdAt: string;
}

export interface ClientWorkoutRecord {
  id: string;
  userId: string;
  programmeId: string;
  programmeName: string;
  day: number;
  week: number;
  exercises: {
    exerciseId: string;
    sets: { weight: number; reps: number; completed: boolean }[];
  }[];
  completedAt: string;
  createdAt: string;
}
