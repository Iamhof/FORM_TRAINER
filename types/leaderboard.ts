export interface LeaderboardProfile {
  id: string;
  user_id: string;
  is_opted_in: boolean;
  display_name: string;
  show_real_name: boolean;
  show_in_total_volume: boolean;
  show_in_monthly_volume: boolean;
  show_in_total_sessions: boolean;
  show_in_monthly_sessions: boolean;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardStats {
  id: string;
  user_id: string;
  total_volume_kg: number;
  total_sessions: number;
  monthly_volume_kg: number;
  monthly_sessions: number;
  monthly_period: string;
  total_volume_rank: number | null;
  monthly_volume_rank: number | null;
  total_sessions_rank: number | null;
  monthly_sessions_rank: number | null;
  last_calculated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  value: number;
  is_current_user: boolean;
  accent_color?: string;
}

export type LeaderboardType = 
  | 'total_volume'
  | 'monthly_volume'
  | 'total_sessions'
  | 'monthly_sessions';

export type GenderFilter = 'all' | 'male' | 'female';
