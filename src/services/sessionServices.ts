import { supabase } from '../lib/supabase';

export type Session = {
  id?: number;
  user_id: string;
  started_at?: string;
  ended_at?: string;
  mode?: string;
  source?: string;
  avg_hr?: number;
  avg_power?: number;
  avg_speed?: number;
  avg_ei?: number;
  avg_decoupling?: number;
};

// START SESSION
export const startSession = async (userId: string, mode: string, source: string) => {
  return await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      mode,
      source,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
};

// END SESSION
export const endSession = async (sessionId: number) => {
  return await supabase
    .from('sessions')
    .update({
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
};

// UPDATE SUMMARY (avg HR, power, dll)
export const updateSessionSummary = async (
  sessionId: number,
  summary: {
    avg_hr?: number;
    avg_power?: number;
    avg_speed?: number;
    avg_ei?: number;
    avg_decoupling?: number;
  }
) => {
  return await supabase
    .from('sessions')
    .update(summary)
    .eq('id', sessionId);
};

// GET ALL USER SESSIONS
export const getUserSessions = async (userId: string) => {
  return await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
};