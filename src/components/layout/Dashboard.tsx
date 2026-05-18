import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Heart,
  Timer,
  TrendingUp,
  Zap,
  MapPin,
  Play,
  Pause,
  LogOut,
  Gauge,
  Route,
  Orbit,
  UserCircle2,
  Ruler,
  Scale,
  Navigation,
  Satellite
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '../metrics/MetricCard';
import { PowerChart } from '../charts/PowerChart';
import { FatigueIndicator } from '../charts/FatigueIndicator';
import {
  SensorData,
  FatigueStatus,
  RunningMode,
  GPSStatus,
  DeviceConfigStatus,
  DeviceSource,
  DeviceGpsStatus
} from '../../types';
import { useMqtt } from '../../hooks/useMqtt';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../services/profileServices';
import { signOut } from '../../services/authServices';
import {
  startSession,
  endSession,
  updateSessionSummary
} from '../../services/sessionServices';
import { saveSessionSample } from '../../services/sampleServices';

interface UserProfile {
  name: string;
  weight: string;
  height: string;
  gender: 'male' | 'female';
  mode?: RunningMode;
}

const DEFAULT_FATIGUE: FatigueStatus = {
  level: 'normal',
  decoupling: 0,
  message: 'Performa optimal. Maintain current pace.'
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hasPayload = (value: unknown) =>
  value !== undefined && value !== null && value !== '';

const formatPace = (pace: number) => {
  if (!Number.isFinite(pace) || pace <= 0) return '--:--';
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCoordinate = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--.------';
  return value.toFixed(6);
};

const getHeartRateZone = (hr: number, gender?: 'male' | 'female') => {
  const maxHr = gender === 'female' ? 184 : 190;
  const ratio = hr / maxHr;
  if (ratio < 0.6) return 'Recovery';
  if (ratio < 0.72) return 'Endurance';
  if (ratio < 0.82) return 'Aerobic';
  if (ratio < 0.9) return 'Threshold';
  return 'Anaerobic';
};

const getGpsLabel = (status?: GPSStatus, mode?: RunningMode) => {
  if (mode === 'indoor') return 'Estimated';
  if (status === 'locked') return 'GPS Locked';
  if (status === 'searching') return 'Searching';
  return 'GPS Ready';
};

const getGpsPillState = (status?: GPSStatus, mode?: RunningMode) => {
  if (mode === 'indoor') {
    return {
      label: 'GPS INACTIVE',
      dot: 'bg-red-400',
      text: 'text-red-400',
      glow: 'shadow-[0_0_20px_rgba(248,113,113,0.15)]'
    };
  }

  if (status === 'locked') {
    return {
      label: 'GPS ACTIVE',
      dot: 'bg-emerald-400 animate-pulse',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]'
    };
  }

  if (status === 'searching') {
    return {
      label: 'GPS SEARCHING',
      dot: 'bg-amber-400 animate-pulse',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]'
    };
  }

  return {
    label: 'GPS INACTIVE',
    dot: 'bg-red-400',
    text: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(248,113,113,0.15)]'
  };
};

const mapDeviceGpsStatusToUi = (
  rawStatus?: DeviceGpsStatus,
  mode?: RunningMode
): GPSStatus => {
  if (mode === 'indoor') return 'estimated';
  if (rawStatus === 'LOCKED') return 'locked';
  if (rawStatus === 'NOFIX') return 'searching';
  return 'searching';
};

const mapFatigueStatus = (rawStatus?: string, decoupling = 0): FatigueStatus => {
  switch (rawStatus) {
    case 'CRITICAL':
      return {
        level: 'critical',
        decoupling,
        message: 'Critical cardiac drift detected. Reduce intensity immediately.'
      };
    case 'CAUTION':
    case 'BUILDING':
      return {
        level: 'warning',
        decoupling,
        message: 'Moderate fatigue building up. Monitor closely.'
      };
    default:
      return {
        level: 'normal',
        decoupling,
        message: 'Performa optimal. Maintain current pace.'
      };
  }
};

const getDeviceStatusUi = (status?: DeviceConfigStatus) => {
  switch (status) {
    case 'OFFLINE':
      return {
        text: 'text-red-400',
        dot: 'bg-red-400',
        border: 'border-red-500/30',
        bg: 'bg-red-500/10'
      };
    case 'BOOTING':
      return {
        text: 'text-blue-400',
        dot: 'bg-blue-400',
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10'
      };
    case 'WAITING_PROFILE':
      return {
        text: 'text-amber-400',
        dot: 'bg-amber-400',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10'
      };
    case 'PROFILE_READY':
    case 'READY_TO_START':
      return {
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10'
      };
    case 'CALIBRATING':
      return {
        text: 'text-cyan-400',
        dot: 'bg-cyan-400',
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/10'
      };
    case 'RUNNING':
      return {
        text: 'text-purple-400',
        dot: 'bg-purple-400',
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10'
      };
    default:
      return {
        text: 'text-slate-400',
        dot: 'bg-slate-400',
        border: 'border-slate-500/30',
        bg: 'bg-slate-500/10'
      };
  }
};

const resetDashboardUi = (
  setDuration: React.Dispatch<React.SetStateAction<number>>,
  setData: React.Dispatch<React.SetStateAction<SensorData[]>>,
  setLatest: React.Dispatch<React.SetStateAction<SensorData | null>>,
  setFatigue: React.Dispatch<React.SetStateAction<FatigueStatus>>,
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setDuration(0);
  setData([]);
  setLatest(null);
  setFatigue(DEFAULT_FATIGUE);
  setIsRunning(false);
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected: mqttConnected, messages, publish } = useMqtt();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [data, setData] = useState<SensorData[]>([]);
  const [latest, setLatest] = useState<SensorData | null>(null);
  const [fatigue, setFatigue] = useState<FatigueStatus>(DEFAULT_FATIGUE);
  const [duration, setDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceConfigStatus>('OFFLINE');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const resetPendingRef = useRef(false);
  const lastSavedSampleRef = useRef<number>(0);

  useEffect(() => {
    const loadUserProfile = async () => {
      const localProfile = localStorage.getItem('userProfile');
      let fallbackMode: RunningMode = 'outdoor';

      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile) as Partial<UserProfile>;
          fallbackMode = parsed.mode || 'outdoor';
        } catch (err) {
          console.error('Error parsing local userProfile:', err);
        }
      }

      if (!user) {
        if (localProfile) {
          try {
            const parsed = JSON.parse(localProfile) as UserProfile;
            setUserProfile({ ...parsed, mode: parsed.mode || 'outdoor' });
          } catch (err) {
            console.error('Error loading local profile:', err);
          }
        }
        return;
      }

      const { data: dbProfile, error } = await getProfile(user.id);

      if (error) {
        console.error('Error fetching profile:', error.message);
      }

      if (dbProfile) {
        const nextProfile: UserProfile = {
          name: dbProfile.full_name || 'Runner',
          weight: dbProfile.weight_kg ? String(dbProfile.weight_kg) : '',
          height: dbProfile.height_cm ? String(dbProfile.height_cm) : '',
          gender: dbProfile.sex === 'female' ? 'female' : 'male',
          mode: dbProfile.preferred_mode || fallbackMode
        };

        setUserProfile(nextProfile);
        localStorage.setItem('userProfile', JSON.stringify(nextProfile));
      } else if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile) as UserProfile;
          setUserProfile({ ...parsed, mode: parsed.mode || 'outdoor' });
        } catch (err) {
          console.error('Error loading fallback local profile:', err);
        }
      }
    };

    loadUserProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('userProfile');
    localStorage.removeItem('pendingProfile');
    navigate('/');
  };

  const publishProfileToDevice = () => {
    if (!userProfile) return;

    const modePayload = userProfile.mode === 'indoor' ? 'INDOOR' : 'OUTDOOR';
    const sexPayload = userProfile.gender === 'male' ? 'M' : 'F';

    publish('wearable/config/mode', modePayload);
    publish('wearable/config/weight', String(userProfile.weight));
    publish('wearable/config/height', String(userProfile.height));
    publish('wearable/config/sex', sexPayload);
  };

  const handleStart = async () => {
    if (!user || !userProfile || isRunning) return;

    resetPendingRef.current = false;

    const mode = userProfile.mode === 'indoor' ? 'INDOOR' : 'OUTDOOR';
    const source = userProfile.mode === 'indoor' ? 'Estimated' : 'Gps';

    const { data: sessionData, error } = await startSession(user.id, mode, source);

    if (error) {
      console.error('Error starting session:', error.message);
      alert(error.message);
      return;
    }

    if (sessionData?.id) {
      setCurrentSessionId(sessionData.id);
      lastSavedSampleRef.current = 0;
    }

    publishProfileToDevice();
    await sleep(300);
    publish('wearable/config/command', 'START');
  };

  const handleStop = async () => {
  resetPendingRef.current = true;
  publish('wearable/config/command', 'RESET');

  const samplesToSummarize = [...data];
  const latestSample = samplesToSummarize[samplesToSummarize.length - 1];

  const avgHr =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce((sum, item) => sum + item.heartRate, 0) /
        samplesToSummarize.length
      : 0;

  const avgEi =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce(
          (sum, item) => sum + (item.efficiencyIndex || 0),
          0
        ) / samplesToSummarize.length
      : 0;

  const avgDecoupling =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce(
          (sum, item) => sum + (item.decoupling || 0),
          0
        ) / samplesToSummarize.length
      : 0;

  const avgPowerLocal =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce((sum, item) => sum + item.runningPower, 0) /
        samplesToSummarize.length
      : 0;

  const avgSpeedLocal =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce((sum, item) => sum + item.speed, 0) /
        samplesToSummarize.length
      : 0;

  const avgCadenceLocal =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce((sum, item) => sum + item.cadence, 0) /
        samplesToSummarize.length
      : 0;

  const avgGctLocal =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce((sum, item) => sum + item.groundContactTime, 0) /
        samplesToSummarize.length
      : 0;

  const avgVoLocal =
    samplesToSummarize.length > 0
      ? samplesToSummarize.reduce((sum, item) => sum + item.verticalOscillation, 0) /
        samplesToSummarize.length
      : 0;

  const decouplingPeak =
    samplesToSummarize.length > 0
      ? Math.max(...samplesToSummarize.map((item) => item.decoupling || 0))
      : 0;

  const summaryPayload = {
    durationSec: duration,
    distanceKm: latestSample?.distance || 0,
    avgPower: avgPowerLocal || 0,
    avgHr: avgHr || 0,
    avgSpeed: avgSpeedLocal || 0,
    avgCadence: avgCadenceLocal || 0,
    avgGct: avgGctLocal || 0,
    avgVo: avgVoLocal || 0,
    decouplingFinal: latestSample?.decoupling || 0,
    decouplingPeak: decouplingPeak || 0,
    fatigueFinal: latestSample?.fatigueStatus || 'NORMAL',
    mode: userProfile?.mode === 'indoor' ? 'INDOOR' : 'OUTDOOR',
    source:
      latestSample?.source ||
      (messages['wearable/source'] as DeviceSource | undefined) ||
      (userProfile?.mode === 'indoor' ? 'Estimated' : 'Gps')
  };

  if (currentSessionId) {
    const { error: summaryError } = await updateSessionSummary(currentSessionId, {
      avg_hr: avgHr || 0,
      avg_power: avgPowerLocal || 0,
      avg_speed: avgSpeedLocal || 0,
      avg_ei: avgEi || 0,
      avg_decoupling: avgDecoupling || 0,
    });

    if (summaryError) {
      console.error('Error updating session summary:', summaryError.message);
    }

    const { error: endError } = await endSession(currentSessionId);

    if (endError) {
      console.error('Error ending session:', endError.message);
    }

    setCurrentSessionId(null);
  }

  navigate('/activity-summary', {
    state: {
      samples: samplesToSummarize,
      summary: summaryPayload,
      mode: userProfile?.mode || 'outdoor',
      source:
        latestSample?.source ||
        (messages['wearable/source'] as DeviceSource | undefined) ||
        (userProfile?.mode === 'indoor' ? 'Estimated' : 'Gps')
    }
  });
};

  useEffect(() => {
    const availability = messages['wearable/availability'];
    const hasAnyDeviceSignal =
      !!messages['wearable/config/status'] ||
      !!messages['wearable/heartrate'] ||
      !!messages['wearable/power/total'] ||
      !!messages['wearable/cadence'];

    const deviceOnline =
      mqttConnected &&
      (availability === 'online' || hasAnyDeviceSignal);

    if (!deviceOnline) {
      setDeviceStatus('OFFLINE');
      setIsRunning(false);
    }
  }, [mqttConnected, messages]);

  useEffect(() => {
    const configStatus = messages['wearable/config/status'] as DeviceConfigStatus | undefined;
    const availability = messages['wearable/availability'];

    const hasAnyDeviceSignal =
      !!messages['wearable/config/status'] ||
      !!messages['wearable/heartrate'] ||
      !!messages['wearable/power/total'] ||
      !!messages['wearable/cadence'];

    const deviceOnline =
      mqttConnected &&
      (availability === 'online' || hasAnyDeviceSignal);

    if (!deviceOnline) {
      setDeviceStatus('OFFLINE');
      setIsRunning(false);
      return;
    }

    if (configStatus) {
      setDeviceStatus(configStatus);
    }

    const effectiveStatus = configStatus || deviceStatus;
    const isSessionActive =
      effectiveStatus === 'RUNNING' || effectiveStatus === 'CALIBRATING';

    setIsRunning(isSessionActive);

    if (
      resetPendingRef.current &&
      (
        effectiveStatus === 'READY_TO_START' ||
        effectiveStatus === 'WAITING_PROFILE'
      )
    ) {
      resetDashboardUi(
        setDuration,
        setData,
        setLatest,
        setFatigue,
        setIsRunning
      );
      resetPendingRef.current = false;
      return;
    }

    if (effectiveStatus === 'WAITING_PROFILE') {
      resetDashboardUi(
        setDuration,
        setData,
        setLatest,
        setFatigue,
        setIsRunning
      );
      return;
    }

    if (effectiveStatus === 'BOOTING') {
      setIsRunning(false);
      return;
    }

    if (!isSessionActive) return;

    const heartRate = parseFloat(messages['wearable/heartrate'] ?? '0');
    const meanRR = parseFloat(messages['wearable/hrv/mean_rr'] ?? '0');
    const hrvSDNN = parseFloat(messages['wearable/hrv/sdnn'] ?? '0');
    const hrvRMSSD = parseFloat(messages['wearable/hrv/rmssd'] ?? '0');
    const runningPower = parseFloat(messages['wearable/power/total'] ?? '0');
    const cadence = parseFloat(messages['wearable/cadence'] ?? '0');
    const groundContactTime = parseFloat(messages['wearable/gct'] ?? '0');
    const verticalOscillation = parseFloat(messages['wearable/vo'] ?? '0');
    const elevation = parseFloat(messages['wearable/elevation'] ?? '0');
    const speed = parseFloat(messages['wearable/speed'] ?? '0');
    const distance = parseFloat(messages['wearable/distance'] ?? '0');
    const pace = parseFloat(messages['wearable/pace'] ?? '0');
    const latitude = parseFloat(messages['wearable/latitude'] ?? 'NaN');
    const longitude = parseFloat(messages['wearable/longitude'] ?? 'NaN');
    const efficiencyIndex = parseFloat(messages['wearable/efficiency_index'] ?? '0');
    const decoupling = parseFloat(messages['wearable/decoupling'] ?? '0');

    const powerAero = parseFloat(messages['wearable/power/aero'] ?? '0');
    const powerClimb = parseFloat(messages['wearable/power/climb'] ?? '0');
    const powerAcc = parseFloat(messages['wearable/power/acc'] ?? '0');
    const powerVert = parseFloat(messages['wearable/power/vert'] ?? '0');

    const rawFatigueStatus = messages['wearable/fatigue_status'];
    const rawGpsStatus = messages['wearable/gps_status'] as DeviceGpsStatus | undefined;
    const rawSource = messages['wearable/source'] as DeviceSource | undefined;

    const hasAnyLiveMetric =
      hasPayload(messages['wearable/heartrate']) ||
      hasPayload(messages['wearable/power/total']) ||
      hasPayload(messages['wearable/cadence']);

    if (!hasAnyLiveMetric) return;

    const selectedMode: RunningMode = userProfile?.mode || 'outdoor';

    const nextData: SensorData = {
      timestamp: Date.now(),
      runningPower,
      heartRate,
      meanRR,
      hrvSDNN,
      hrvRMSSD,
      cadence,
      groundContactTime,
      verticalOscillation,
      elevation,
      speed,
      distance,
      pace,
      latitude:
        selectedMode === 'indoor'
          ? undefined
          : Number.isFinite(latitude)
          ? latitude
          : undefined,
      longitude:
        selectedMode === 'indoor'
          ? undefined
          : Number.isFinite(longitude)
          ? longitude
          : undefined,
      gpsStatus: mapDeviceGpsStatusToUi(rawGpsStatus, selectedMode),
      rawGpsStatus,
      speedSource:
        rawSource === 'Hybrid'
          ? 'hybrid'
          : rawSource === 'Estimated'
          ? 'estimated'
          : rawSource === 'NoSpeed'
          ? 'nospeed'
          : 'gps',
      efficiencyIndex,
      decoupling,
      fatigueStatus: rawFatigueStatus,
      powerAero,
      powerClimb,
      powerAcc,
      powerVert,
      mode: selectedMode === 'indoor' ? 'INDOOR' : 'OUTDOOR',
      source: rawSource || (selectedMode === 'indoor' ? 'Estimated' : 'Gps')
    };

    setLatest(nextData);
    setData((prev) => [...prev.slice(-300), nextData]);
    setFatigue(mapFatigueStatus(rawFatigueStatus, decoupling));

    if (user && currentSessionId) {
      const now = Date.now();

      if (now - lastSavedSampleRef.current >= 1000) {
        lastSavedSampleRef.current = now;

        saveSessionSample(currentSessionId, user.id, nextData).catch((err) => {
          console.error('Error saving session sample:', err?.message || err);
        });
      }
    }
  }, [messages, currentSessionId, user, userProfile]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const avgPower = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((sum, item) => sum + item.runningPower, 0) / data.length;
  }, [data]);

  const avgSpeed = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((sum, item) => sum + item.speed, 0) / data.length;
  }, [data]);

  const meanRRDisplay = latest?.meanRR ?? 0;
  const hrvSDNNDisplay = latest?.hrvSDNN ?? 0;
  const hrvRMSSDDisplay = latest?.hrvRMSSD ?? 0;

  const selectedMode: RunningMode = userProfile?.mode || 'outdoor';
  const modeLabel = selectedMode === 'indoor' ? 'INDOOR' : 'OUTDOOR';
  const sourceLabel =
    latest?.source ||
    (messages['wearable/source'] as DeviceSource | undefined) ||
    (selectedMode === 'indoor' ? 'Estimated' : 'Gps');

  const heartRateZone = latest ? getHeartRateZone(latest.heartRate, userProfile?.gender) : '--';
  const gpsPill = getGpsPillState(latest?.gpsStatus, selectedMode);
  const availability = messages['wearable/availability'];
  const hasAnyDeviceSignal =
    !!messages['wearable/config/status'] ||
    !!messages['wearable/heartrate'] ||
    !!messages['wearable/power/total'] ||
    !!messages['wearable/cadence'];

  const isDeviceOnline =
    mqttConnected && (availability === 'online' || hasAnyDeviceSignal);

  const effectiveDeviceStatus: DeviceConfigStatus =
    isDeviceOnline ? deviceStatus : 'OFFLINE';

  const deviceStatusUi = getDeviceStatusUi(effectiveDeviceStatus);

  return (
    <div className="galaxy-bg min-h-screen p-6 md:p-8 relative overflow-hidden">
      <div className="fixed top-20 left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div
        className="fixed bottom-20 right-20 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
        style={{ animationDelay: '1.5s' }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1">
              Hello,{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {userProfile?.name || 'Runner'}
              </span>{' '}
              !!!
            </h1>
            <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">
              We're Ready to RUN.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">

            <div
              className={`flex items-center gap-2 px-5 py-3 rounded-full glass-card border border-white/10 ${gpsPill.text} ${gpsPill.glow}`}
              title="GPS Status"
            >
              <span className={`w-3 h-3 rounded-full ${gpsPill.dot}`}></span>
              <Satellite size={16} />
              <span className="text-sm font-semibold tracking-wide uppercase">
                {gpsPill.label}
              </span>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="p-3 rounded-full glass-card border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
              title="Profile"
            >
              <UserCircle2 size={20} />
            </button>

            <button
              onClick={isRunning ? handleStop : handleStart}
              className={`p-3 rounded-full glass-card glow-cyan transition-all hover:scale-105 ${
                isRunning ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={handleLogout}
              className="p-3 rounded-full glass-card border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="glass-card rounded-3xl p-4 md:p-5 border border-white/10 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                <Orbit size={14} /> Mode
              </div>
              <div className="text-white font-semibold tracking-wide">{modeLabel}</div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                <Scale size={14} /> Weight
              </div>
              <div className="text-white font-semibold">
                {userProfile?.weight || '--'} <span className="text-slate-400 text-sm">kg</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                <Ruler size={14} /> Height
              </div>
              <div className="text-white font-semibold">
                {userProfile?.height || '--'} <span className="text-slate-400 text-sm">cm</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                <UserCircle2 size={14} /> Gender
              </div>
              <div className="text-white font-semibold capitalize">{userProfile?.gender || '--'}</div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                <Navigation size={14} /> Source
              </div>
              <div className="text-white font-semibold capitalize">
                {sourceLabel}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`rounded-2xl border px-4 py-3 ${deviceStatusUi.border} ${deviceStatusUi.bg}`}>
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                Device Status
              </div>

              <div className={`flex items-center font-semibold tracking-wide ${deviceStatusUi.text}`}>
                {effectiveDeviceStatus}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                Session State
              </div>
              <div className="text-white font-semibold tracking-wide">
                {!isDeviceOnline
                  ? 'OFFLINE'
                  : effectiveDeviceStatus === 'BOOTING'
                  ? 'BOOTING'
                  : isRunning
                  ? 'ACTIVE'
                  : 'IDLE'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={publishProfileToDevice}
              disabled={
                !isDeviceOnline ||
                effectiveDeviceStatus === 'BOOTING'
              }
              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
            >
              Apply Profile to Device
            </button>

            <button
              onClick={handleStart}
              disabled={
                isRunning ||
                !isDeviceOnline ||
                effectiveDeviceStatus === 'BOOTING' ||
                effectiveDeviceStatus === 'WAITING_PROFILE'
              }
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
            >
              Start Session
            </button>

            <button
              onClick={handleStop}
              disabled={!isRunning}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              Stop Session
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 opacity-10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-1">
                  Running Power
                </p>
                <h2 className="text-6xl md:text-7xl font-bold text-white font-mono-nums">
                  {latest ? Math.round(latest.runningPower) : '---'}
                  <span className="text-2xl text-slate-400 ml-2 font-sans font-medium">W</span>
                </h2>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400">
                <Zap size={28} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              Target Zone: 240-260W
            </div>
            <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${latest ? Math.min((latest.runningPower / 320) * 100, 100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500 opacity-10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-pink-400 text-sm font-semibold uppercase tracking-wider mb-1">
                  Heart Rate
                </p>
                <h2 className="text-6xl md:text-7xl font-bold text-white font-mono-nums">
                  {latest ? Math.round(latest.heartRate) : '---'}
                  <span className="text-2xl text-slate-400 ml-2 font-sans font-medium">bpm</span>
                </h2>
              </div>
              <div className="p-3 bg-pink-500/20 rounded-2xl text-pink-400">
                <Heart size={28} />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                Zone: <span className="text-pink-400 font-semibold">{heartRateZone}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Source: ECG</span>
            </div>
            <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                style={{ width: `${latest ? Math.min((latest.heartRate / 190) * 100, 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Cadence"
            value={latest ? Math.round(latest.cadence) : '--'}
            unit="spm"
            icon={Activity}
            color="cyan"
            trend="+2%"
          />
          <MetricCard
            title="Ground Contact"
            value={latest ? Math.round(latest.groundContactTime) : '--'}
            unit="ms"
            icon={Timer}
            color="purple"
            trend="-5ms"
          />
          <MetricCard
            title="Vertical Osc."
            value={latest ? latest.verticalOscillation.toFixed(1) : '--'}
            unit="cm"
            icon={TrendingUp}
            color="pink"
          />
          <MetricCard
            title="Elevation"
            value={latest ? Math.round(latest.elevation) : '--'}
            unit="m"
            icon={MapPin}
            color="blue"
          />
          <MetricCard
            title="Speed"
            value={latest ? latest.speed.toFixed(1) : '--'}
            unit="km/h"
            icon={Gauge}
            color="green"
          />
          <MetricCard
            title="Distance"
            value={latest ? latest.distance.toFixed(2) : '--'}
            unit="km"
            icon={Route}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Power & Cardiac Response</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Real-time physiological decoupling analysis
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
                    <span className="text-slate-300">Power</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></span>
                    <span className="text-slate-300">Heart Rate</span>
                  </div>
                </div>
              </div>
              <PowerChart data={data} />
            </div>

            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h3 className="text-xl font-semibold text-white">GPS & Run Context</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Core positioning and speed-source context for the current session
                  </p>
                </div>
                <div
                  className={`px-3 py-2 rounded-full text-xs uppercase tracking-wider border ${
                    latest?.gpsStatus === 'locked' || selectedMode === 'indoor'
                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                      : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  }`}
                >
                  {getGpsLabel(latest?.gpsStatus, selectedMode)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Latitude</div>
                  <div className="text-white font-mono-nums text-xl">
                    {formatCoordinate(latest?.latitude)}
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Longitude</div>
                  <div className="text-white font-mono-nums text-xl">
                    {formatCoordinate(latest?.longitude)}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Pace</div>
                  <div className="text-white font-mono-nums text-xl">
                    {latest ? formatPace(latest.pace) : '--:--'}{' '}
                    <span className="text-sm text-slate-400">min/km</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                    Speed Source
                  </div>
                  <div className="text-white font-semibold capitalize text-xl">
                    {sourceLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-300 font-medium">Efficiency Index</span>
                <span className="text-2xl font-bold text-white font-mono-nums">
                  {latest ? (latest.efficiencyIndex || 0).toFixed(2) : '--'}
                  <span className="text-sm text-slate-500 ml-1">bpm/W</span>
                </span>
              </div>
              <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`absolute h-full rounded-full transition-all duration-500 ${
                    latest && (latest.efficiencyIndex || 0) > 0.65
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  }`}
                  style={{
                    width: `${latest ? Math.min((latest.efficiencyIndex || 0) * 100, 100) : 0}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Efficient</span>
                <span>Critical</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <FatigueIndicator status={fatigue} />

            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <h4 className="font-semibold text-white mb-6 flex items-center gap-2 text-lg">
                <Heart className="text-pink-400" size={20} />
                HRV Metrics
              </h4>

              <div className="space-y-5">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">Mean RR</span>
                  <span className="font-mono-nums text-xl font-bold text-white">
                    {meanRRDisplay > 0 ? `${meanRRDisplay.toFixed(1)} ms` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">SDNN</span>
                  <span className="font-mono-nums text-xl font-bold text-cyan-400">
                    {hrvSDNNDisplay > 0 ? `${hrvSDNNDisplay.toFixed(1)} ms` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">RMSSD</span>
                  <span className="font-mono-nums text-xl font-bold text-emerald-400">
                    {hrvRMSSDDisplay > 0 ? `${hrvRMSSDDisplay.toFixed(1)} ms` : '--'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <h4 className="font-semibold text-white mb-6 flex items-center gap-2 text-lg">
                <MapPin className="text-cyan-400" size={20} />
                Session Stats
              </h4>

              <div className="space-y-5">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">Duration</span>
                  <span className="font-mono-nums text-2xl font-bold text-white">
                    {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">Avg Power</span>
                  <span className="font-mono-nums text-xl font-bold text-cyan-400">
                    {avgPower ? `${Math.round(avgPower)} W` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">Avg Speed</span>
                  <span className="font-mono-nums text-xl font-bold text-emerald-400">
                    {avgSpeed ? `${avgSpeed.toFixed(1)} km/h` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">Distance</span>
                  <span className="font-mono-nums text-xl font-bold text-white">
                    {latest ? `${latest.distance.toFixed(2)} km` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-400 text-sm">Current Pace</span>
                  <span className="font-mono-nums text-xl font-bold text-orange-400">
                    {latest ? `${formatPace(latest.pace)} /km` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};