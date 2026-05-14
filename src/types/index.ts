export type RunningMode = 'indoor' | 'outdoor';
export type GPSStatus = 'searching' | 'locked' | 'estimated';

// ============================
// DEVICE STATUS (MQTT)
// ============================
export type DeviceConfigStatus =
  | 'OFFLINE'
  | 'BOOTING'
  | 'WAITING_PROFILE'
  | 'PROFILE_READY'
  | 'READY_TO_START'
  | 'CALIBRATING'
  | 'RUNNING';

export type DeviceMode = 'INDOOR' | 'OUTDOOR';
export type DeviceSource = 'Gps' | 'Estimated';
export type DeviceGpsStatus = 'LOCKED' | 'NOFIX';

// ============================
// USER PROFILE
// ============================
export interface UserProfile {
  name: string;
  weight: string;
  height: string;
  gender: 'male' | 'female';
  mode?: RunningMode;
}

// ============================
// SENSOR DATA (FINAL DASHBOARD)
// ============================
export interface SensorData {
  timestamp: number;

  // core metrics
  runningPower: number;        // Watt
  heartRate: number;           // BPM
  cadence: number;             // Steps per minute
  groundContactTime: number;   // ms
  verticalOscillation: number; // cm
  elevation: number;           // meters
  speed: number;               // km/h
  distance: number;            // km
  pace: number;                // min/km

  // GPS
  latitude?: number;
  longitude?: number;
  gpsStatus?: GPSStatus;
  rawGpsStatus?: DeviceGpsStatus;

  // source info
  speedSource?: 'estimated' | 'gps';
  mode?: DeviceMode;
  source?: DeviceSource;

  // physiology
  efficiencyIndex?: number;
  decoupling?: number;
  fatigueStatus?: string;

  // HRV
  meanRR?: number;     // ms
  hrvSDNN?: number;    // ms
  hrvRMSSD?: number;   // ms

  // power breakdown
  powerAero?: number;
  powerClimb?: number;
  powerAcc?: number;
  powerVert?: number;
}

// ============================
// FATIGUE UI
// ============================
export interface FatigueStatus {
  level: 'normal' | 'warning' | 'critical';
  decoupling: number;
  message: string;
}