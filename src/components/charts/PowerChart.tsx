import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { SensorData } from '../../types';

interface Props {
  data: SensorData[];
}

export const PowerChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], {minute: '2-digit', second:'2-digit'})} 
            stroke="#64748B"
            tick={{fill: '#64748B', fontSize: 12}}
            axisLine={{stroke: 'rgba(255,255,255,0.1)'}}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#22D3EE" 
            tick={{fill: '#22D3EE', fontSize: 12}}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#EC4899" 
            tick={{fill: '#EC4899', fontSize: 12}}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}
            labelStyle={{color: '#94A3B8'}}
          />
          <Area 
            yAxisId="left" 
            type="monotone" 
            dataKey="runningPower" 
            stroke="#22D3EE" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPower)" 
            name="Power (W)"
          />
          <Area 
            yAxisId="right" 
            type="monotone" 
            dataKey="heartRate" 
            stroke="#EC4899" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorHR)" 
            name="Heart Rate (bpm)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};