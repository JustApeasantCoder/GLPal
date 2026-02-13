import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { WeightEntry } from '../types';
import { formatWeight } from '../utils/unitConversion';
import { useWeightChartData } from '../hooks/useChartDataProcessor';
import { useWeightChartDateRange } from '../hooks/useChartDateRange';
import ChartEmptyState from './ui/ChartEmptyState';
import { ChartPeriod } from '../hooks';

interface WeightChartProps {
  data: WeightEntry[];
  goalWeight: number;
  unitSystem?: 'metric' | 'imperial';
  period?: ChartPeriod;
}

const WeightChart: React.FC<WeightChartProps> = ({
  data,
  goalWeight,
  unitSystem = 'metric',
  period = 'month',
}) => {
  const { sortedData, minWeight, maxWeight, weightPadding } =
    useWeightChartData(data);

  const firstDataDate = useMemo(
    () => (sortedData.length > 0 ? sortedData[0].date : new Date()),
    [sortedData]
  );

  const lastDataDate = useMemo(
    () =>
      sortedData.length > 0
        ? sortedData[sortedData.length - 1].date
        : new Date(),
    [sortedData]
  );

  const { zoomStart, visibleStartIndex, visibleEndIndex, totalPoints } =
    useWeightChartDateRange(firstDataDate, lastDataDate, period);

  const chartOption = useMemo(() => {
    if (data.length === 0) {
      return {};
    }

    const getDotIndices = (dataLength: number): number[] => {
      const visibleLength = visibleEndIndex - visibleStartIndex;
      if (visibleLength <= 12) {
        return Array.from({ length: visibleLength }, (_, i) => visibleStartIndex + i);
      }
      const indices: number[] = [];
      indices.push(visibleStartIndex);
      const step = (visibleLength - 1) / 11;
      for (let i = 1; i <= 10; i++) {
        indices.push(visibleStartIndex + Math.round(i * step));
      }
      indices.push(visibleEndIndex);
      return Array.from(new Set(indices)).sort((a, b) => a - b);
    };

    const dotIndices = new Set(getDotIndices(sortedData.length));

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20, 15, 35, 0.95)',
        borderColor: 'rgba(177, 156, 217, 0.4)',
        borderWidth: 1,
        borderRadius: 12,
        padding: [12, 16],
        extraCssText:
          'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); backdrop-filter: blur(10px);',
        textStyle: { color: '#E2E8F0', fontSize: 13 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const item = params[0];
          const weight = item.value[1];
          const formattedWeight = formatWeight(weight, unitSystem);
          const dateIndex = sortedData.findIndex(d => d.displayDate === item.axisValue);
          const actualDate = dateIndex >= 0 ? new Date(firstDataDate.getTime() + dateIndex * 24 * 60 * 60 * 1000) : new Date();
          const dateWithYear = `${item.axisValue} ${actualDate.getFullYear()}`;
          return `<div style="font-weight: 600; margin-bottom: 4px;">${dateWithYear}</div>
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
        data: sortedData.map((d) => d.displayDate),
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisTick: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisLabel: { fontSize: 12, color: '#94a3b8', margin: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        position: 'right',
        min: Math.floor(minWeight - weightPadding),
        max: Math.ceil(maxWeight + weightPadding),
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
          symbol: 'none',
          lineStyle: { width: 3, color: '#9C7BD3' },
          itemStyle: {
            color: '#9C7BD3',
            borderColor: '#2D1B4E',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(156, 123, 211, 0.3)' },
                { offset: 1, color: 'rgba(156, 123, 211, 0.02)' },
              ],
            },
          },
          data: sortedData.map((d) => [d.displayDate, d.weight]),
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: 'rgba(177, 156, 217, 0.6)',
              type: 'dashed',
              width: 2,
            },
            data: [{ yAxis: goalWeight }],
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
        {
          name: 'WeightDots',
          type: 'scatter',
          z: 10,
          data: sortedData
            .map((d, i) => ({ ...d, index: i }))
            .filter((d) => dotIndices.has(d.index))
            .map((d) => ({
              value: [d.displayDate, d.weight],
              itemStyle: {
                color: '#9C7BD3',
                borderColor: '#2D1B4E',
                borderWidth: 2,
                shadowBlur: 8,
                shadowColor: '#9C7BD399',
              },
            })),
          symbol: 'circle',
          symbolSize: 10,
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) =>
              Math.round(params.value[1]) + (unitSystem === 'imperial' ? 'lbs' : 'kg'),
            color: '#E2E8F0',
            fontSize: 10,
            distance: 8,
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          start: zoomStart,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseWheel: true,
        },
      ],
    };

    return option;
  }, [
    data,
    sortedData,
    minWeight,
    maxWeight,
    weightPadding,
    goalWeight,
    unitSystem,
    zoomStart,
    visibleStartIndex,
    visibleEndIndex,
    firstDataDate,
  ]);

  if (data.length === 0) {
    return (
      <ChartEmptyState
        title="No weight data yet"
        description="Log your first weight to see the chart"
      />
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
