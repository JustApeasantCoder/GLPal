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

  const processChartData = (data: WeightEntry[]): WeightEntry[] => {
  // Temporarily disabled - return all data points
  return data;
  
  // Always limit to 12 points maximum for better readability
  if (data.length <= 12) return data;
  
  const chunkSize = Math.ceil(data.length / 12);
  const processedData: WeightEntry[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const avgWeight = chunk.reduce((sum, entry) => sum + entry.weight, 0) / chunk.length;
    const middleIndex = Math.floor(chunk.length / 2);
    processedData.push({
      date: chunk[middleIndex].date,
      weight: avgWeight
    });
  }
  
  return processedData;
};

const chartData = processChartData(data).map(entry => ({
    ...entry,
    displayDate: formatDate(entry.date),
  }));

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
            dot={{ 
              fill: '#9C7BD3', 
              r: 5,
              stroke: '#2D1B4E',
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 8px rgba(156, 123, 211, 0.6))'
            }}
            activeDot={{ 
              r: 7,
              filter: 'drop-shadow(0 0 12px rgba(156, 123, 211, 0.8))'
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