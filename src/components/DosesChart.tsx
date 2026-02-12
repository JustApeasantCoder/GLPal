import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GLP1Entry } from '../types';
import { ChartPeriod } from '../hooks';
import { calculateGLP1Concentration } from '../utils/calculations';

const MEDICATION_COLORS: Record<string, { stroke: string; fill: string }> = {
  semaglutide: { stroke: '#9C7BD3', fill: 'rgba(156, 123, 211, 0.3)' },
  tirzepatide: { stroke: '#4ADEA8', fill: 'rgba(74, 222, 168, 0.3)' },
  retatrutide: { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.3)' },
  liraglutide: { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.3)' },
  dulaglutide: { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.3)' },
  other: { stroke: '#94A3B8', fill: 'rgba(148, 163, 184, 0.3)' },
};

const getMedicationColor = (medication: string) => {
  return MEDICATION_COLORS[medication] || MEDICATION_COLORS.other;
};

interface DosesChartProps {
  data: GLP1Entry[];
  period: ChartPeriod;
}

const DosesChart: React.FC<DosesChartProps> = ({ data, period }) => {
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }
    
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.filter(entry => new Date(entry.date) >= startDate);
  }, [data, period]);

  const { medications, chartData } = useMemo(() => {
    if (filteredData.length === 0) return { medications: [] as string[], chartData: [] as any[] };

    const medsArray = filteredData.map(e => e.medication);
    const meds = Array.from(new Set(medsArray));
    
    const dosesByMed: Record<string, { date: Date; dose: number }[]> = {};
    meds.forEach(med => {
      dosesByMed[med] = filteredData
        .filter(e => e.medication === med)
        .map(e => ({ date: new Date(e.date), dose: e.dose }));
    });

    const halfLifeByMed: Record<string, number> = {};
    meds.forEach(med => {
      const medData = filteredData.find(e => e.medication === med);
      if (medData) halfLifeByMed[med] = medData.halfLifeHours;
    });

    const startDate = new Date(filteredData[0].date);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    const peakData: Record<string, { date: string; dose: number }[]> = {};
    meds.forEach(med => {
      peakData[med] = [];
      dosesByMed[med].forEach(d => {
        const peakDate = new Date(d.date.getTime() + 24 * 60 * 60 * 1000);
        peakData[med].push({
          date: peakDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dose: d.dose,
        });
      });
    });

    const generatedData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dataPoint: any = { date: dateStr };

      meds.forEach(med => {
        const concentration = calculateGLP1Concentration(
          dosesByMed[med],
          halfLifeByMed[med],
          new Date(d)
        );
        dataPoint[med] = parseFloat(concentration.toFixed(3));
      });

      const allPeaks: { med: string; dose: number }[] = [];
      meds.forEach(med => {
        const peak = peakData[med].find(p => p.date === dateStr);
        if (peak) allPeaks.push({ med, dose: peak.dose });
      });
      dataPoint.peaks = allPeaks;

      generatedData.push(dataPoint);
    }

    return { medications: meds, chartData: generatedData };
  }, [filteredData]);

  const hasData = filteredData.length > 0;

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { peaks?: { med: string; dose: number }[] } }) => {
    const { cx, cy, payload } = props;
    const peaks = payload?.peaks;
    if (!peaks?.length || cx === undefined || cy === undefined) return null;

    return (
      <g>
        {peaks.map((peak, i) => {
          const color = getMedicationColor(peak.med);
          return (
            <g key={`${peak.med}-${i}`}>
              <circle
                cx={cx + i * 20 - (peaks.length - 1) * 10}
                cy={cy}
                r={5}
                fill={color.stroke}
                stroke="#2D1B4E"
                strokeWidth={2}
                filter="drop-shadow(0 0 8px rgba(156, 123, 211, 0.6))"
              />
              <text
                x={cx + i * 20 - (peaks.length - 1) * 10 + 10}
                y={cy - 10}
                textAnchor="middle"
                fill={color.stroke}
                fontSize={10}
                fontWeight={600}
              >
                {peak.dose}mg
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const CustomYAxisTick = ({ x, y, payload, index, visibleTicksCount }: any) => {
    if (index === 0 || index === visibleTicksCount - 1) {
      return null;
    }
    return (
      <text x={x + 22} y={y} textAnchor="start" fill="#94a3b8" fontSize={12}>
        {payload.value.toFixed(1)}
      </text>
    );
  };

  return (
    <div className="w-full h-full relative">
      {!hasData && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center text-text-muted">
            <p className="text-sm">No dose data yet</p>
            <p className="text-xs mt-1">Log your first dose to see the chart</p>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
        <AreaChart
          data={chartData}
          style={{ opacity: hasData ? 1 : 0.3 }}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 10,
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
            orientation="left"
            width={1}
            axisLine={{ stroke: 'rgba(156, 123, 211, 0.2)' }}
            tick={<CustomYAxisTick />}
            tickCount={6}
            tickMargin={10}
          />
          <Tooltip 
            formatter={(value?: number, name?: string) => {
              if (name && value !== undefined) {
                const medName = name.charAt(0).toUpperCase() + name.slice(1);
                return [`${value.toFixed(3)} mg`, medName];
              }
              return ['', ''];
            }}
            contentStyle={{ 
              backgroundColor: 'rgba(45, 27, 78, 0.8)', 
              border: '1px solid rgba(177, 156, 217, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(177, 156, 217, 0.3)'
            }}
            labelStyle={{ color: '#B19CD9' }}
          />
          {medications.map(med => {
            const color = getMedicationColor(med);
            return (
              <Area 
                key={med}
                type="monotone" 
                dataKey={med} 
                stroke={color.stroke} 
                fill={color.fill} 
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ 
                  r: 7,
                  fill: color.stroke,
                  stroke: '#2D1B4E',
                  strokeWidth: 2,
                }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DosesChart;
