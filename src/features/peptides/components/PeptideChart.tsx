import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { PeptideLogEntry } from '../../../types';
import { isMobile } from '../../../shared/utils/common';

interface PeptideChartProps {
  logs: PeptideLogEntry[];
  color: string;
  height?: number;
}

const PeptideChart: React.FC<PeptideChartProps> = ({ logs, color, height = 200 }) => {
  const chartOption = useMemo(() => {
    if (logs.length === 0) return null;

    const grouped: Record<string, { date: string; count: number }> = {};
    
    logs.forEach(log => {
      const date = log.date;
      if (!grouped[date]) {
        grouped[date] = { date, count: 0 };
      }
      grouped[date].count++;
    });

    const sortedData = Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    return {
      backgroundColor: 'transparent',
      animation: !isMobile(),
      grid: {
        top: 10,
        right: 10,
        bottom: 30,
        left: 30,
      },
      xAxis: {
        type: 'category',
        data: sortedData.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#666', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#666', fontSize: 10 },
        splitLine: { lineStyle: { color: '#222' } },
      },
      tooltip: {
        backgroundColor: '#1a1625',
        borderColor: '#B19CD9',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>${data.value} injections`;
        },
      },
      series: [{
        type: 'line',
        data: sortedData.map(d => d.count),
        smooth: true,
        lineStyle: {
          color: color,
          width: 2,
        },
        itemStyle: {
          color: color,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}00` },
            ],
          },
        },
      }],
    };
  }, [logs, color]);

  if (!chartOption) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 text-sm"
        style={{ height }}
      >
        No injection history yet
      </div>
    );
  }

  return (
    <ReactECharts 
      option={chartOption} 
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default PeptideChart;
