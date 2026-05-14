import React from 'react';

interface Props {
  isConnected: boolean;
  deviceStatus?: string;
}

export const ConnectionStatus: React.FC<Props> = ({ isConnected, deviceStatus }) => {
  return (
    <div
      className={`h-11 flex items-center justify-center gap-3 px-6 rounded-full text-sm font-semibold tracking-wide uppercase glass-card border transition-all ${
        !isConnected
          ? 'text-red-400 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.12)]'
          : deviceStatus === 'BOOTING'
          ? 'text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : deviceStatus === 'WAITING_PROFILE'
          ? 'text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
          : 'text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
      }`}
    >
      <span
        className={`w-3 h-3 rounded-full ${
          !isConnected
            ? 'bg-red-400'
            : deviceStatus === 'BOOTING'
            ? 'bg-blue-400 animate-pulse'
            : deviceStatus === 'WAITING_PROFILE'
            ? 'bg-amber-400 animate-pulse'
            : 'bg-emerald-400 animate-pulse'
        }`}
      ></span>

      <span>
        {!isConnected ? 'OFFLINE' : deviceStatus ? deviceStatus : 'LIVE'}
      </span>
    </div>
  );
};