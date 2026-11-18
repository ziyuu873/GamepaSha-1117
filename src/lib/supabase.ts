import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  name: string;
  score: number;
  player_number: number;
  created_at: string;
};

export type Mission = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  form_url: string | null;
  reward_points: number;
  is_active: boolean;
  sort_order: number;
  max_per_day: number | null;
  created_at: string;
};

export type Submission = {
  id: string;
  mission_id: string;
  player_id: string;
  created_at: string;
};

export type SubmitResult = {
  player_number: number;
  player_id: string;
  total_score: number;
  awarded_points: number;
  is_new_player: boolean;
  mission_title: string;
};

const PLAYER_NUMBER_KEY = 'photoquest_player_number';

export function getStoredPlayerNumber(): number | null {
  const raw = localStorage.getItem(PLAYER_NUMBER_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

export function storePlayerNumber(n: number): void {
  localStorage.setItem(PLAYER_NUMBER_KEY, String(n));
}
