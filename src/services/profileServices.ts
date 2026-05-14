import { supabase } from '../lib/supabase';
import { RunningMode } from '../types';

export type UserProfile = {
  id: string;
  full_name: string;
  height_cm: number;
  weight_kg: number;
  sex: 'male' | 'female';
  preferred_mode?: RunningMode;
  updated_at?: string;
};

export const getProfile = async (userId: string) => {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
};

export const upsertProfile = async (profile: UserProfile) => {
  return await supabase.from('profiles').upsert({
    ...profile,
    updated_at: new Date().toISOString(),
  });
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id'>>
) => {
  return await supabase.from('profiles').upsert({
    id: userId,
    ...updates,
    updated_at: new Date().toISOString(),
  });
};