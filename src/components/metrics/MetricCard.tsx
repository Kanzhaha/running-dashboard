import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  color?: 'cyan' | 'purple' | 'pink' | 'blue' | 'orange' | 'red' | 'green' | 'yellow';
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon: Icon,
  color = 'cyan',
  trend
}) => {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)]',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400',
    green: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
    yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`glass-card rounded-2xl p-5 border bg-gradient-to-br ${colorClasses[color]} hover:border-opacity-50 transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-slate-900/50 border border-white/10`}>
          <Icon size={18} className="text-current" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-slate-900/50 ${
            trend.includes('+') ? 'text-emerald-400' : trend.includes('-') ? 'text-slate-400' : 'text-slate-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-bold text-white font-mono-nums tracking-tight">{value}</span>
        <span className="text-xs text-slate-400 font-medium uppercase">{unit}</span>
      </div>
      <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">{title}</span>
    </div>
  );
};