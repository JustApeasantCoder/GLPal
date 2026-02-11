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

  const CustomYAxisTick = ({ x, y, payload, index, visibleTicksCount }: any) => {
    // Hide first and last tick
    if (index === 0 || index === visibleTicksCount - 1) {
      return null;
    }

    return (
      <text x={x+22} y={y} textAnchor="start" fill="#94a3b8" fontSize={12}>
        {payload.value}kg
      </text>
    );
  };

  // Generate indices for dots to show (up to 12 points evenly distributed)
const getDotIndices = (dataLength: number): number[] => {
  if (dataLength <= 12) {
    // Show all points if 12 or fewer
    return Array.from({ length: dataLength }, (_, i) => i);
  }
  
  // Show first, last, and 10 evenly distributed points in between
  const indices = new Set<number>();
  indices.add(0); // Always show first point
  indices.add(dataLength - 1); // Always show last point
  
  // Add 10 evenly distributed points between first and last
  const step = (dataLength - 1) / 11;
  for (let i = 1; i <= 10; i++) {
    indices.add(Math.round(i * step));
  }
  
  return Array.from(indices).sort((a, b) => a - b);
};

const chartData = data.map(entry => ({
    ...entry,
    displayDate: formatDate(entry.date),
  }));

const dotIndices = new Set(getDotIndices(data.length));

  return (
    <div className="w-full h-[230px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 123, 211, 0.1)" />

          <XAxis
            dataKey="displayDate"
            padding={{ left: 10, right: 10 }}
            tick={{ dy:-6, fontSize: 12, fill: '#94a3b8' }}
            axisLine={{ stroke: 'rgba(156, 123, 211, 0.2)' }}
            tickMargin={10}
          />

          <YAxis
            orientation="left"
            width={1}
            domain={[
                (dataMin: number) => {
                  const min = Math.floor(dataMin);
                  return Math.max(min - 1, 0);
                },
                (dataMax: number) => {
                  const max = Math.ceil(dataMax);
                  return max + 1;
                }
              ]}
            axisLine={{ stroke: 'rgba(156, 123, 211, 0.2)' }}
            tick={<CustomYAxisTick />}
            tickCount={6}
            tickMargin={10}
          />

          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(45, 27, 78, 0.8)', 
              border: '1px solid rgba(177, 156, 217, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(177, 156, 217, 0.3)'
            }}
            labelStyle={{ color: '#B19CD9' }}
            itemStyle={{ color: '#9C7BD3' }}
          />
          <ReferenceLine 
            y={goalWeight} 
            stroke="rgba(177, 156, 217, 0.8)" 
            strokeDasharray="5 5" 
            label={{ value: "Goal", fill: '#B19CD9', fontSize: 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="url(#purpleGradient)" 
            strokeWidth={3}
            dot={(props: any) => {
              const { cx, cy, index } = props;
              // Only show dots for selected indices
              if (dotIndices.has(index)) {
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={5}
                    fill="#9C7BD3" 
                    stroke="#2D1B4E"
                    strokeWidth={2}
                    filter="drop-shadow(0 0 8px rgba(156, 123, 211, 0.6))"
                  />
                );
              }
              // Hide other dots
              return null;
            }}
            activeDot={{ 
              r: 7,
              fill: '#B19CD9',
              stroke: '#2D1B4E',
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 12px rgba(177, 156, 217, 0.8))'
            }}
          />
          <defs>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2D1B4E" />
              <stop offset="50%" stopColor="#9C7BD3" />
              <stop offset="100%" stopColor="#B19CD9" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;