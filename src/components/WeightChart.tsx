import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeightEntry } from '../types';

interface WeightChartProps {
  data: WeightEntry[];
  goalWeight: number;
}

const WeightChart: React.FC<WeightChartProps> = ({ data, goalWeight }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = data.map(entry => ({
    ...entry,
    displayDate: formatDate(entry.date),
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(0, 255, 255, 0.1)" 
          />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={{ stroke: 'rgba(0, 255, 255, 0.2)' }}
          />
          <YAxis 
            domain={['dataMin - 2', 'dataMax + 2']}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={{ stroke: 'rgba(0, 255, 255, 0.2)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
            }}
            labelStyle={{ color: '#67e8f9' }}
            itemStyle={{ color: '#a5f3fc' }}
          />
          <ReferenceLine 
            y={goalWeight} 
            stroke="rgba(16, 185, 129, 0.8)" 
            strokeDasharray="5 5" 
            label={{ value: "Goal", fill: '#10b981', fontSize: 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="url(#cyanGradient)" 
            strokeWidth={3}
            dot={{ 
              fill: '#06b6d4', 
              r: 5,
              stroke: '#0284c7',
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))'
            }}
            activeDot={{ 
              r: 7,
              filter: 'drop-shadow(0 0 12px rgba(0, 255, 255, 0.8))'
            }}
          />
          <defs>
            <linearGradient id="cyanGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#00ffff" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;