import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { GLP1Entry } from '../types';
import { useMedicationChartData } from '../hooks/useChartDataProcessor';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { generateMedicationSeries } from '../utils/medicationChartUtils';
import ChartEmptyState from './ui/ChartEmptyState';

import { ChartPeriod } from '../hooks';

interface MedicationChartProps {
  data: GLP1Entry[];
  period: ChartPeriod;
}

const MedicationChart: React.FC<MedicationChartProps> = ({ data, period }) => {
  const { medications, medicationColors, dosesByMed, halfLifeByMed } =
    useMedicationChartData(data);

  const firstDataDate = useMemo(
    () =>
      data.length > 0
        ? new Date(Math.min(...data.map((d) => new Date(d.date).getTime())))
        : new Date(),
    [data]
  );

  const lastDataDate = useMemo(
    () =>
      data.length > 0
        ? new Date(Math.max(...data.map((d) => new Date(d.date).getTime())))
        : new Date(),
    [data]
  );

  const {
    xAxisDates,
    todayIndex,
    zoomStart,
    zoomEnd,
    visibleStartIndex,
    visibleEndIndex,
  } = useChartDateRange(firstDataDate, lastDataDate, period);

  const chartOption = useMemo(() => {
    if (data.length === 0) {
      return {};
    }

    const series = generateMedicationSeries({
      medications,
      medicationColors,
      dosesByMed,
      halfLifeByMed,
      firstDate: firstDataDate,
      lastDate: lastDataDate,
      xAxisDates,
      todayIndex,
      visibleStartIndex,
      visibleEndIndex,
    });

    const option = {
      backgroundColor: 'transparent',
      color: medications.map(
        (med) => medicationColors[med]?.stroke || '#9C7BD3'
      ),
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
          const filteredParams = params.filter(
            (p: any) => p.seriesType !== 'scatter'
          );
          const nonZeroParams = filteredParams.filter(
            (p: any) => (p.value?.[1] ?? 0) > 0
          );
          const dateStr = params[0].axisValue;
          const dateIndex = xAxisDates.indexOf(dateStr);
          const actualDate = dateIndex >= 0 ? new Date(firstDataDate.getTime() + dateIndex * 24 * 60 * 60 * 1000) : new Date();
          const dateWithYear = `${dateStr} ${actualDate.getFullYear()}`;
          if (nonZeroParams.length === 0)
            return `${dateWithYear}<div style="color: #94a3b8; font-size: 11px;">No active dose</div>`;
          let html = `<div style="font-weight: 600; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid rgba(156, 123, 211, 0.2);">${dateWithYear}</div>`;
          nonZeroParams.forEach((item: any) => {
            const color = item.color || '#9C7BD3';
            const value = item.value?.[1] ?? 0;
            html += `<div style="display: flex; align-items: center; gap: 10px; margin: 4px 0;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; box-shadow: 0 0 6px ${color}80;"></span>
              <span style="color: #94a3b8;">${item.seriesName}:</span>
              <span style="font-weight: 600; color: #fff;">${value.toFixed(1)} mg</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: medications,
        bottom: 0,
        icon: 'circle',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12, color: '#94a3b8' },
        formatter: (value: string) => {
          return (
            value.charAt(0).toUpperCase() +
            value.slice(1).replace(/([A-Z])/g, ' $1').trim()
          );
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: zoomStart,
          end: zoomEnd,
          zoomOnMouseWheel: true,
          moveOnMouseWheel: true,
        },
      ],
      grid: {
        top: 15,
        left: 10,
        right: 10,
        bottom: 25,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xAxisDates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisTick: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisLabel: { fontSize: 12, color: '#94a3b8' },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        position: 'right',
        min: 0,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          margin: 10,
          formatter: (value: number) => value.toFixed(1) + 'mg',
        },
        splitLine: {
          lineStyle: { color: 'rgba(156, 123, 211, 0.1)', type: 'dashed' },
        },
      },
      series,
    };

    return option;
  }, [
    data,
    medications,
    medicationColors,
    dosesByMed,
    halfLifeByMed,
    firstDataDate,
    lastDataDate,
    xAxisDates,
    todayIndex,
    zoomStart,
    zoomEnd,
    visibleStartIndex,
    visibleEndIndex,
  ]);

  if (data.length === 0) {
    return (
      <ChartEmptyState
        title="No dose data yet"
        description="Log your first dose to see the chart"
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

export default MedicationChart;
