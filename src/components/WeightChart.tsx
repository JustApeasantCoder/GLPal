import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeightEntry } from '../types';

interface WeightChartProps {
  data: WeightEntry[];
  goalWeight: number;
  currentWeight?: number;
}

const WeightChart: React.FC<WeightChartProps> = ({ data, goalWeight, currentWeight }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = data.map(entry => ({
    ...entry,
    displayDate: formatDate(entry.date),
  }));

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: currentWeight ? 80 : 30, // Make room for weight display
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={['dataMin - 2', 'dataMax + 2']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <ReferenceLine 
            y={goalWeight} 
            stroke="#10b981" 
            strokeDasharray="5 5" 
            label="Goal"
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {currentWeight && (
        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{currentWeight.toFixed(1)} kg</p>
        </div>
      )}
    </div>
  );
};

export default WeightChart;