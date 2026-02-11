import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GLP1Entry } from '../types';
import { calculateGLP1Concentration } from '../utils/calculations';

interface GLP1ChartProps {
  data: GLP1Entry[];
}

const GLP1Chart: React.FC<GLP1ChartProps> = ({ data }) => {
  // Generate concentration data points
  const generateConcentrationData = () => {
    if (data.length === 0) return [];

    const startDate = new Date(data[0].date);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // Show 14 days into future

    const chartData = [];
    const doses = data.map(entry => ({
      date: new Date(entry.date),
      dose: entry.dose
    }));

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const concentration = calculateGLP1Concentration(doses, data[0].halfLifeHours, new Date(d));
      
      chartData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        concentration: parseFloat(concentration.toFixed(3)),
      });
    }

    return chartData;
  };

  const chartData = generateConcentrationData();

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
        <AreaChart
          data={chartData}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 25,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(156, 123, 211, 0.1)" 
          />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={{ stroke: 'rgba(156, 123, 211, 0.2)' }}
          />
          <YAxis 
            width={0}
            axisLine={true}
            tick={true}
          />
          <Tooltip 
            formatter={(value?: number) => value ? [`${value.toFixed(3)} mg`, 'Concentration'] : ['', '']}
            contentStyle={{ 
              backgroundColor: 'rgba(45, 27, 78, 0.8)', 
              border: '1px solid rgba(177, 156, 217, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(177, 156, 217, 0.3)'
            }}
            labelStyle={{ color: '#B19CD9' }}
            itemStyle={{ color: '#9C7BD3' }}
          />
          <Area 
            type="monotone" 
            dataKey="concentration" 
            stroke="url(#mintPurpleGradient)" 
            fill="url(#mintPurpleGradientFill)" 
            strokeWidth={2}
            filter="drop-shadow(0 0 15px rgba(156, 123, 211, 0.4))"
          />
          <defs>
            <linearGradient id="mintPurpleGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B19CD9" />
              <stop offset="50%" stopColor="#9C7BD3" />
              <stop offset="100%" stopColor="#2D1B4E" />
            </linearGradient>
            <linearGradient id="mintPurpleGradientFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B19CD9" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#9C7BD3" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2D1B4E" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GLP1Chart;