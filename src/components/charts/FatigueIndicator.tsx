import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle} from 'lucide-react';
import { FatigueStatus } from '../../types';

interface Props {
  status: FatigueStatus;
}

export const FatigueIndicator: React.FC<Props> = ({ status }) => {
  const configs = {
    normal: {
      icon: CheckCircle,
      bg: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      title: 'OPTIMAL',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      progressColor: 'bg-emerald-500'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'from-yellow-500/10 to-orange-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      title: 'CAUTION',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      progressColor: 'bg-yellow-500'
    },
    critical: {
      icon: AlertCircle,
      bg: 'from-red-500/10 to-rose-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      title: 'CRITICAL',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      progressColor: 'bg-red-500'
    }
  };

  const config = configs[status.level];
  const Icon = config.icon;
  const progressWidth = Math.min(Math.abs(status.decoupling) * 5, 100);

  return (
    <div className={`glass-card rounded-3xl p-6 border bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl bg-slate-900/50 ${config.text} border border-white/10`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className={`font-bold text-lg tracking-wider ${config.text}`}>{config.title}</h3>
          <p className="text-slate-400 text-xs uppercase tracking-widest">System Status</p>
        </div>
      </div>
      
      <p className="text-slate-300 text-sm mb-6 leading-relaxed">{status.message}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400 uppercase tracking-wider">Decoupling</span>
          <span className={config.text}>{status.decoupling.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full ${config.progressColor} transition-all duration-700 ease-out shadow-[0_0_10px_currentColor]`}
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};