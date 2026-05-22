import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Heart,
  Gauge,
  Activity,
  Timer,
  TrendingUp,
  Route,
  Orbit,
  Navigation,
  MapPin,
} from 'lucide-react';
import { SensorData, RunningMode } from '../types';

type SummaryState = {
  samples?: SensorData[];
  summary?: Partial<ActivitySummary>;
  mode?: RunningMode;
  source?: 'Gps' | 'Estimated' | 'Hybrid' | 'NoSpeed';
};

type ActivitySummary = {
  durationSec: number;
  distanceKm: number;
  avgPower: number;
  avgHr: number;
  avgSpeed: number;
  avgCadence: number;
  avgGct: number;
  avgVo: number;
  decouplingFinal: number;
  decouplingPeak: number;
  fatigueFinal: string;
  mode: 'INDOOR' | 'OUTDOOR';
  source: 'Gps' | 'Estimated' | 'Hybrid' | 'NoSpeed';
};

type ChartMetricKey =
  | 'runningPower'
  | 'heartRate'
  | 'speed'
  | 'cadence'
  | 'groundContactTime'
  | 'verticalOscillation';

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hrs.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getFiniteValues = (values: number[]) => {
  return values.filter((v) => Number.isFinite(v));
};

const getPositiveValues = (values: number[]) => {
  return values.filter((v) => Number.isFinite(v) && v > 0);
};

const averagePositive = (values: number[]) => {
  const valid = getPositiveValues(values);
  if (!valid.length) return 0;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
};

const maxValue = (values: number[]) => {
  const valid = getFiniteValues(values);
  if (!valid.length) return 0;
  return Math.max(...valid);
};

const getLastFinite = (values: number[]) => {
  for (let i = values.length - 1; i >= 0; i--) {
    if (Number.isFinite(values[i])) return values[i];
  }
  return 0;
};

const SummaryCard: React.FC<{
  title: string;
  value: string;
  icon?: React.ElementType;
  accent?: string;
}> = ({ title, value, icon: Icon, accent = 'text-cyan-400' }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs uppercase tracking-wider">{title}</span>
        {Icon ? <Icon size={16} className={accent} /> : null}
      </div>
      <div className="text-white text-2xl font-bold font-mono-nums">{value}</div>
    </div>
  );
};

const LineMiniChart: React.FC<{
  title: string;
  unit: string;
  colorClass?: string;
  data: SensorData[];
  dataKey: ChartMetricKey;
}> = ({ title, unit, colorClass = 'stroke-cyan-400', data, dataKey }) => {
  const chart = useMemo(() => {
    if (!data.length) return null;

    const validData = data.filter((item) => {
      const value = Number(item[dataKey] ?? 0);
      return Number.isFinite(value) && value > 0;
    });

    const values = validData.map((item) => Number(item[dataKey] ?? 0));

    if (!values.length) return null;

    const width = 900;
    const height = 260;

    const paddingLeft = 56;
    const paddingRight = 24;
    const paddingTop = 24;
    const paddingBottom = 32;

    const min = Math.min(...values);
    const max = Math.max(...values);

    const paddedMin = min > 0 ? Math.max(0, min * 0.95) : min;
    const paddedMax = max <= 0 ? max * 0.95 : max * 1.05;
    const range = paddedMax - paddedMin || 1;

    const toX = (index: number) =>
      paddingLeft +
      (index / Math.max(validData.length - 1, 1)) * (width - paddingLeft - paddingRight);

    const toY = (value: number) =>
      height -
      paddingBottom -
      ((value - paddedMin) / range) * (height - paddingTop - paddingBottom);

    const points = validData.map((item, index) => {
      const raw = Number(item[dataKey] ?? 0);
      return `${toX(index)},${toY(raw)}`;
    });

    const lastValue = values[values.length - 1] ?? 0;

    const yTicks = [
      paddedMin,
      paddedMin + range * 0.25,
      paddedMin + range * 0.5,
      paddedMin + range * 0.75,
      paddedMax
    ];

    const durationSec =
      validData.length > 1
        ? Math.max(
            0,
            Math.round(
              (validData[validData.length - 1].timestamp - validData[0].timestamp) / 1000
            )
          )
        : validData.length;

    const xTicks = [
      { label: '0s', value: 0 },
      { label: `${Math.round(durationSec / 2)}s`, value: 0.5 },
      { label: `${durationSec}s`, value: 1 }
    ];

    return {
      width,
      height,
      points: points.join(' '),
      min,
      max,
      paddedMin,
      paddedMax,
      lastValue,
      yTicks,
      xTicks,
      toX,
      toY,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom
    };
  }, [data, dataKey]);

  if (!chart) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white font-semibold mb-2">{title}</div>
        <div className="text-slate-400 text-sm">No chart data available.</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <p className="text-slate-400 text-sm">Trend from dashboard-received samples</p>
        </div>

        <div className="text-right">
          <div className="text-white font-bold text-xl font-mono-nums">
            {chart.lastValue.toFixed(1)}
          </div>
          <div className="text-slate-400 text-xs">Current</div>
          <div className="text-slate-500 text-[10px] uppercase">{unit}</div>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0f1222]">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="w-full h-64"
          preserveAspectRatio="none"
        >
          {/* horizontal grid + Y labels */}
          {chart.yTicks.map((tick, idx) => {
            const y = chart.toY(tick);
            return (
              <g key={`y-${idx}`}>
                <line
                  x1={chart.paddingLeft}
                  y1={y}
                  x2={chart.width - chart.paddingRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={chart.paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="rgba(148,163,184,0.9)"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* vertical axis */}
          <line
            x1={chart.paddingLeft}
            y1={chart.paddingTop}
            x2={chart.paddingLeft}
            y2={chart.height - chart.paddingBottom}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />

          {/* horizontal axis */}
          <line
            x1={chart.paddingLeft}
            y1={chart.height - chart.paddingBottom}
            x2={chart.width - chart.paddingRight}
            y2={chart.height - chart.paddingBottom}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />

          {/* chart line shadow */}
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="8"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={chart.points}
          />

          {/* chart line */}
          <polyline
            fill="none"
            className={colorClass}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={chart.points}
          />

          {/* X labels */}
          {chart.xTicks.map((tick, idx) => {
            const x =
              chart.paddingLeft +
              tick.value * (chart.width - chart.paddingLeft - chart.paddingRight);

            return (
              <g key={`x-${idx}`}>
                <text
                  x={x}
                  y={chart.height - 8}
                  textAnchor={idx === 0 ? 'start' : idx === chart.xTicks.length - 1 ? 'end' : 'middle'}
                  fontSize="11"
                  fill="rgba(148,163,184,0.9)"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono-nums">
        <span>Min actual: {chart.min.toFixed(1)} {unit}</span>
        <span>Max actual: {chart.max.toFixed(1)} {unit}</span>
      </div>
    </div>
  );
};

export const ActivitySummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as SummaryState;

  const samples = state.samples || [];

  const validSampleCount = useMemo(() => {
    return samples.filter((s) => {
      const speed = Number(s.speed || 0);
      const power = Number(s.runningPower || 0);
      const cadence = Number(s.cadence || 0);

      return (
        Number.isFinite(speed) &&
        Number.isFinite(power) &&
        Number.isFinite(cadence) &&
        speed > 0 &&
        power > 0 &&
        cadence > 0
      );
    }).length;
  }, [samples]);

  const summary = useMemo<ActivitySummary>(() => {
    const durationSec =
      typeof state.summary?.durationSec === 'number'
        ? state.summary.durationSec
        : samples.length > 1
        ? Math.max(
            0,
            Math.round(
              (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000
            )
          )
        : 0;

    const distanceKm =
      typeof state.summary?.distanceKm === 'number'
        ? state.summary.distanceKm
        : samples.length
        ? Number(samples[samples.length - 1].distance || 0)
        : 0;

    const avgPower =
      samples.length > 0
        ? averagePositive(samples.map((s) => Number(s.runningPower || 0)))
        : typeof state.summary?.avgPower === 'number'
        ? state.summary.avgPower
        : 0;

    const avgHr =
      samples.length > 0
        ? averagePositive(samples.map((s) => Number(s.heartRate || 0)))
        : typeof state.summary?.avgHr === 'number'
        ? state.summary.avgHr
        : 0;

    const avgSpeed =
      samples.length > 0
        ? averagePositive(samples.map((s) => Number(s.speed || 0)))
        : typeof state.summary?.avgSpeed === 'number'
        ? state.summary.avgSpeed
        : 0;

    const avgCadence =
      samples.length > 0
        ? averagePositive(samples.map((s) => Number(s.cadence || 0)))
        : typeof state.summary?.avgCadence === 'number'
        ? state.summary.avgCadence
        : 0;

    const avgGct =
      samples.length > 0
        ? averagePositive(samples.map((s) => Number(s.groundContactTime || 0)))
        : typeof state.summary?.avgGct === 'number'
        ? state.summary.avgGct
        : 0;

    const avgVo =
      samples.length > 0
        ? averagePositive(samples.map((s) => Number(s.verticalOscillation || 0)))
        : typeof state.summary?.avgVo === 'number'
        ? state.summary.avgVo
        : 0;

    const decouplingValues = samples.map((s) => Number(s.decoupling || 0));
    const decouplingFinal =
      typeof state.summary?.decouplingFinal === 'number'
        ? state.summary.decouplingFinal
        : getLastFinite(decouplingValues);

    const decouplingPeak =
      typeof state.summary?.decouplingPeak === 'number'
        ? state.summary.decouplingPeak
        : maxValue(decouplingValues);

    const fatigueFinal =
      state.summary?.fatigueFinal ||
      samples[samples.length - 1]?.fatigueStatus ||
      'NORMAL';

    const mode =
      state.summary?.mode ||
      (state.mode === 'indoor' ? 'INDOOR' : 'OUTDOOR');

    const source =
      state.summary?.source ||
      (state.source
        ? state.source
        : state.mode === 'indoor'
        ? 'Estimated'
        : 'Gps');

    return {
      durationSec,
      distanceKm,
      avgPower,
      avgHr,
      avgSpeed,
      avgCadence,
      avgGct,
      avgVo,
      decouplingFinal,
      decouplingPeak,
      fatigueFinal,
      mode,
      source
    };
  }, [samples, state]);

  if (!samples.length) {
    return (
      <div className="min-h-screen bg-[#0B0C15] text-white p-6">
        <div className="max-w-4xl mx-auto pt-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Activity Summary</h1>
            <p className="text-slate-400">No session data was found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C15] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Activity Summary</h1>
          <p className="text-slate-400">
            Final session overview and time-series performance charts
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <SummaryCard title="Duration" value={formatDuration(summary.durationSec)} icon={Timer} />
          <SummaryCard title="Distance" value={`${summary.distanceKm.toFixed(2)} km`} icon={Route} />
          <SummaryCard title="Avg Speed" value={`${summary.avgSpeed.toFixed(1)} km/h`} icon={Gauge} />
          <SummaryCard title="Avg Power" value={`${Math.round(summary.avgPower)} W`} icon={Zap} />
          <SummaryCard title="Avg HR" value={`${Math.round(summary.avgHr)} bpm`} icon={Heart} accent="text-pink-400" />
          <SummaryCard title="Avg Cadence" value={`${Math.round(summary.avgCadence)} spm`} icon={Activity} />
          <SummaryCard title="Avg GCT" value={`${Math.round(summary.avgGct)} ms`} icon={Timer} accent="text-purple-400" />
          <SummaryCard title="Avg VO" value={`${summary.avgVo.toFixed(1)} cm`} icon={TrendingUp} accent="text-fuchsia-400" />
          <SummaryCard title="Final Decoupling" value={`${summary.decouplingFinal.toFixed(2)} %`} icon={Orbit} accent="text-amber-400" />
          <SummaryCard title="Peak Decoupling" value={`${summary.decouplingPeak.toFixed(2)} %`} icon={TrendingUp} accent="text-orange-400" />
          <SummaryCard title="Mode" value={summary.mode} icon={Navigation} />
          <SummaryCard title="Source" value={summary.source} icon={MapPin} />
          <SummaryCard title="Received Samples" value={`${samples.length}`} icon={Activity} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Fatigue Final</div>
            <div className="text-white text-3xl font-bold">{summary.fatigueFinal}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">
              Valid / Received Samples
            </div>
            <div className="text-white text-3xl font-bold font-mono-nums">
              {validSampleCount} / {samples.length}
            </div>
            <div className="text-slate-500 text-xs mt-2">
              Valid samples are calculated from dashboard-received session data.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <LineMiniChart
            title="Power vs Time"
            unit="W"
            data={samples}
            dataKey="runningPower"
            colorClass="text-cyan-400"
          />

          <LineMiniChart
            title="Heart Rate vs Time"
            unit="bpm"
            data={samples}
            dataKey="heartRate"
            colorClass="text-pink-400"
          />

          <LineMiniChart
            title="Speed vs Time"
            unit="km/h"
            data={samples}
            dataKey="speed"
            colorClass="text-emerald-400"
          />

          <LineMiniChart
            title="Cadence vs Time"
            unit="spm"
            data={samples}
            dataKey="cadence"
            colorClass="text-sky-400"
          />

          <LineMiniChart
            title="Ground Contact Time vs Time"
            unit="ms"
            data={samples}
            dataKey="groundContactTime"
            colorClass="text-violet-400"
          />

          <LineMiniChart
            title="Vertical Oscillation vs Time"
            unit="cm"
            data={samples}
            dataKey="verticalOscillation"
            colorClass="text-fuchsia-400"
          />
        </div>
      </div>
    </div>
  );
};

export default ActivitySummaryPage;