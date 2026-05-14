import React from 'react';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#22D3EE',
  label,
  sublabel
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min((value / max) * 100, 100);
  const dashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dashoffset 0.5s ease-out'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-2xl font-bold text-white font-mono-nums">{label}</span>}
        {sublabel && <span className="text-xs text-slate-400 uppercase">{sublabel}</span>}
      </div>
    </div>
  );
};