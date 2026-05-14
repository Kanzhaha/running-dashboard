import { supabase } from '../lib/supabase';
import { SensorData } from '../types';

export type SessionSample = {
  session_id: number;
  user_id: string;
  sample_time?: string;

  heart_rate?: number;
  mean_rr?: number;
  sdnn?: number;
  rmssd?: number;

  power_total?: number;
  power_aero?: number;
  power_climb?: number;
  power_acc?: number;
  power_vert?: number;

  cadence?: number;
  gct?: number;
  vo?: number;

  speed?: number;
  speed_gps?: number;
  speed_estimated?: number;

  distance?: number;
  elevation?: number;

  efficiency_index?: number;
  decoupling?: number;
  fatigue_status?: string;
  mode?: string;
  source?: string;
};

export const saveSessionSample = async (
  sessionId: number,
  userId: string,
  sample: SensorData
) => {
  return await supabase.from('session_samples').insert({
    session_id: sessionId,
    user_id: userId,
    sample_time: new Date(sample.timestamp).toISOString(),

    heart_rate: sample.heartRate,
    mean_rr: sample.meanRR,
    sdnn: sample.hrvSDNN,
    rmssd: sample.hrvRMSSD,

    power_total: sample.runningPower,
    power_aero: sample.powerAero,
    power_climb: sample.powerClimb,
    power_acc: sample.powerAcc,
    power_vert: sample.powerVert,

    cadence: sample.cadence,
    gct: sample.groundContactTime,
    vo: sample.verticalOscillation,

    speed: sample.speed,
    speed_gps: sample.speedSource === 'gps' ? sample.speed : null,
    speed_estimated: sample.speedSource === 'estimated' ? sample.speed : null,

    distance: sample.distance,
    elevation: sample.elevation,

    efficiency_index: sample.efficiencyIndex,
    decoupling: sample.decoupling,
    fatigue_status: sample.fatigueStatus,
    mode: sample.mode,
    source: sample.source,
  });
};

export const getSessionSamples = async (sessionId: number) => {
  return await supabase
    .from('session_samples')
    .select('*')
    .eq('session_id', sessionId)
    .order('sample_time', { ascending: true });
};