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
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
        <AreaChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Concentration (mg)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value?: number) => value ? [`${value.toFixed(3)} mg`, 'Concentration'] : ['', '']}
          />
          <Area 
            type="monotone" 
            dataKey="concentration" 
            stroke="#8b5cf6" 
            fill="#8b5cf6" 
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GLP1Chart;