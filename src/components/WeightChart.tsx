import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { WeightEntry } from '../types';
import { formatWeight } from '../utils/unitConversion';

interface WeightChartProps {
  data: WeightEntry[];
  goalWeight: number;
  unitSystem?: 'metric' | 'imperial';
}

const WeightChart: React.FC<WeightChartProps> = ({ data, goalWeight, unitSystem = 'metric' }) => {
  const { chartOption } = useMemo(() => {
    if (data.length === 0) {
      return { chartOption: {} };
    }

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const chartData = sortedData.map(entry => {
      const date = new Date(entry.date);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: entry.weight,
      };
    });

    const weights = sortedData.map(e => e.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const padding = (maxWeight - minWeight) * 0.1 || 5;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20, 15, 35, 0.95)',
        borderColor: 'rgba(177, 156, 217, 0.4)',
        borderWidth: 1,
        borderRadius: 12,
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); backdrop-filter: blur(10px);',
        textStyle: { color: '#E2E8F0', fontSize: 13 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const item = params[0];
          const weight = item.value[1];
          const formattedWeight = formatWeight(weight, unitSystem);
          return `<div style="font-weight: 600; margin-bottom: 4px;">${item.axisValue}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #9C7BD3; box-shadow: 0 0 6px #9C7BD380;"></span>
              <span style="color: #94a3b8;">Weight:</span>
              <span style="font-weight: 600; color: #fff;">${formattedWeight}</span>
            </div>`;
        },
      },
      grid: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 25,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: chartData.map(d => d.date),
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisTick: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisLabel: { fontSize: 12, color: '#94a3b8', margin: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        position: 'right',
        min: Math.floor(minWeight - padding),
        max: Math.ceil(maxWeight + padding),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
          color: '#94a3b8',
          fontSize: 11,
          margin: 10,
          formatter: (value: number) => formatWeight(value, unitSystem),
        },
        splitLine: {
          lineStyle: { color: 'rgba(156, 123, 211, 0.1)', type: 'dashed' },
        },
      },
      series: [
        {
          name: 'Weight',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: { width: 3, color: '#9C7BD3' },
          itemStyle: { 
            color: '#9C7BD3',
            borderColor: '#2D1B4E',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(156, 123, 211, 0.3)' },
                { offset: 1, color: 'rgba(156, 123, 211, 0.02)' },
              ],
            },
          },
          data: chartData.map(d => [d.date, d.weight]),
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(177, 156, 217, 0.6)', type: 'dashed', width: 2 },
            data: [
              { yAxis: goalWeight }
            ],
            label: { 
              show: true, 
              position: 'insideStartTop',
              formatter: 'Goal',
              color: '#B19CD9',
              fontSize: 12,
              padding: [0, 0, 0, 20],
            },
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseWheel: true,
        },
      ],
    };

    return { chartOption: option };
  }, [data, goalWeight, unitSystem]);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="text-center text-text-muted">
          <p className="text-sm">No weight data yet</p>
          <p className="text-xs mt-1">Log your first weight to see the chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactECharts
        option={chartOption}
        style={{ height: '100%', width: '100%', opacity: 1 }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default WeightChart;
