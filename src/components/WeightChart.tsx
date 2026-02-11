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

  const processChartData = (data: WeightEntry[]): WeightEntry[] => {
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
              (dataMin: number) => dataMin - 2,
              (dataMax: number) => dataMax + 2
            ]}
            axisLine={{ stroke: 'rgba(156, 123, 211, 0.2)' }}
            tick={{ dx:45,fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(value) => `${Math.round(value)}kg`}
            tickMargin={10}
          />

          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(47, 42, 74, 0.8)', 
              border: '1px solid rgba(74, 222, 168, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(74, 222, 168, 0.3)'
            }}
            labelStyle={{ color: '#4ADEA8' }}
            itemStyle={{ color: '#9C7BD3' }}
          />
          <ReferenceLine 
            y={goalWeight} 
            stroke="rgba(74, 222, 168, 0.8)" 
            strokeDasharray="5 5" 
            label={{ value: "Goal", fill: '#4ADEA8', fontSize: 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="url(#purpleGradient)" 
            strokeWidth={3}
            dot={{ 
              fill: '#9C7BD3', 
              r: 5,
              stroke: '#5B4B8A',
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
              <stop offset="0%" stopColor="#5B4B8A" />
              <stop offset="50%" stopColor="#9C7BD3" />
              <stop offset="100%" stopColor="#4ADEA8" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;