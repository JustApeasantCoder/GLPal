import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { WeightEntry } from '../types';
import { formatWeight } from '../utils/unitConversion';
import { ChartPeriod } from '../hooks';

interface WeightChartProps {
  data: WeightEntry[];
  goalWeight: number;
  unitSystem?: 'metric' | 'imperial';
  period?: ChartPeriod;
}

const WeightChart: React.FC<WeightChartProps> = ({ data, goalWeight, unitSystem = 'metric', period = 'month' }) => {
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

    // Generate indices for dots to show (up to 12 points evenly distributed)
    const getDotIndices = (dataLength: number): number[] => {
      if (dataLength <= 12) {
        return Array.from({ length: dataLength }, (_, i) => i);
      }
      const indices = new Set<number>();
      indices.add(0);
      indices.add(dataLength - 1);
      const step = (dataLength - 1) / 11;
      for (let i = 1; i <= 10; i++) {
        indices.add(Math.round(i * step));
      }
      return Array.from(indices).sort((a, b) => a - b);
    };

    const dotIndices = new Set(getDotIndices(chartData.length));

    const weights = sortedData.map(e => e.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const padding = (maxWeight - minWeight) * 0.1 || 5;

    // Calculate zoom to show last 30 days by default
    let firstDate = new Date(sortedData[0].date);
    let lastDate = new Date(sortedData[sortedData.length - 1].date);
    
    const actualLastDate = new Date(lastDate);
    actualLastDate.setHours(0, 0, 0, 0);
    
    // Add 120 days padding to allow zooming out to full range
    lastDate = new Date(lastDate.getTime() + 120 * 24 * 60 * 60 * 1000);
    
    // Calculate zoom based on last data date
    const daysFromStartToLastData = (actualLastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000);
    const totalDataDays = (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000);
    const actualDataDays = daysFromStartToLastData;
    
    let daysToShow: number;
    switch (period) {
      case 'week': daysToShow = 14; break;
      case 'month': daysToShow = 30; break;
      case '90days': daysToShow = 90; break;
      case 'all': daysToShow = actualDataDays; break;
      default: daysToShow = actualDataDays;
    }
    
    let zoomStart = 0;
    const zoomEnd = 100;
    if (actualDataDays > daysToShow) {
      zoomStart = ((actualDataDays - daysToShow) / actualDataDays) * 100;
    }
    zoomStart = Math.max(0, Math.min(100, zoomStart));

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
          showSymbol: true,
          symbol: (params: any) => {
            const index = params.dataIndex;
            return dotIndices.has(index) ? 'circle' : 'none';
          },
          symbolSize: (params: any) => {
            const index = params.dataIndex;
            return dotIndices.has(index) ? 10 : 0;
          },
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
          start: zoomStart,
          end: zoomEnd,
          zoomOnMouseWheel: true,
          moveOnMouseWheel: true,
        },
      ],
    };

    return { chartOption: option };
  }, [data, goalWeight, unitSystem, period]);

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
