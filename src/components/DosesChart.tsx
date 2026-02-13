import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { GLP1Entry } from '../types';
import { ChartPeriod } from '../hooks';
import { calculateGLP1Concentration } from '../utils/calculations';

const COLOR_PALETTE = [
  { stroke: '#9C7BD3', fill: 'rgba(156, 123, 211, 0.3)' },
  { stroke: '#4ADEA8', fill: 'rgba(74, 222, 168, 0.3)' },
  { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.3)' },
  { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.3)' },
  { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.3)' },
  { stroke: '#94A3B8', fill: 'rgba(148, 163, 184, 0.3)' },
];

interface DosesChartEChartsProps {
  data: GLP1Entry[];
  period: ChartPeriod;
}

const DosesChartECharts: React.FC<DosesChartEChartsProps> = ({ data, period }) => {
  const { chartOption } = useMemo(() => {
    if (data.length === 0) {
      return { chartOption: {} };
    }
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const medsArray = sortedData.map(e => e.medication);
    const meds = Array.from(new Set(medsArray));
    
    const medicationColors: Record<string, { stroke: string; fill: string }> = {};
    meds.forEach((med, index) => {
      medicationColors[med] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    
    const dosesByMed: Record<string, { date: Date; dose: number }[]> = {};
    meds.forEach(med => {
      dosesByMed[med] = sortedData
        .filter(e => e.medication === med)
        .map(e => ({ date: new Date(e.date), dose: e.dose }));
    });

    const halfLifeByMed: Record<string, number> = {};
    meds.forEach(med => {
      const medData = sortedData.find(e => e.medication === med);
      if (medData) halfLifeByMed[med] = medData.halfLifeHours;
    });
    
    if (sortedData.length === 0) {
      return { chartOption: {} };
    }
    
    let firstDate = new Date(sortedData[0].date);
    let lastDate = new Date(sortedData[sortedData.length - 1].date);
    
    // Ensure we show at least 14 days (2 weeks) of data
    const minDays = 14;
    const dataRangeDays = (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000);
    if (dataRangeDays < minDays) {
      lastDate = new Date(firstDate.getTime() + minDays * 24 * 60 * 60 * 1000);
    }
    
    // Always extend to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastDate < today) {
      lastDate = today;
    }
    
    // Generate x-axis data first so we can find today's index
    const xAxisDates: string[] = [];
    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      xAxisDates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    // Find the index of today in the x-axis data
    const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let todayIndex = xAxisDates.indexOf(todayStr);
    
    // If today is not found (shouldn't happen now since firstDate = today), use 0
    if (todayIndex === -1) {
      todayIndex = 0;
    }
    
    const totalPoints = xAxisDates.length;
    
    const todayPercent = ((todayIndex + 1) / totalPoints) * 100;
    
    let zoomStart = 0;
    let zoomEnd = 100;
    
    if (period === 'week') {
      const windowPoints = 14;
      if (todayIndex === 0) {
        zoomStart = 0;
        zoomEnd = (windowPoints / totalPoints) * 100;
      } else {
        zoomEnd = todayPercent;
        zoomStart = Math.max(0, todayPercent - (windowPoints / totalPoints) * 100);
      }
    } else if (period === 'month') {
      const windowPoints = 30;
      if (todayIndex === 0) {
        zoomStart = 0;
        zoomEnd = (windowPoints / totalPoints) * 100;
      } else {
        zoomEnd = todayPercent;
        zoomStart = Math.max(0, todayPercent - (windowPoints / totalPoints) * 100);
      }
    } else if (period === '90days') {
      const windowPoints = 90;
      if (todayIndex === 0) {
        zoomStart = 0;
        zoomEnd = (windowPoints / totalPoints) * 100;
      } else {
        zoomEnd = todayPercent;
        zoomStart = Math.max(0, todayPercent - (windowPoints / totalPoints) * 100);
      }
    }
    
    const doseDatesByMed: Record<string, Set<string>> = {};
    const doseAmountByMed: Record<string, Record<string, number>> = {};
    meds.forEach(med => {
      doseDatesByMed[med] = new Set();
      doseAmountByMed[med] = {};
      dosesByMed[med].forEach(d => {
        const peakDate = new Date(d.date.getTime() + 24 * 60 * 60 * 1000);
        const dateKey = peakDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        doseDatesByMed[med].add(dateKey);
        doseAmountByMed[med][dateKey] = d.dose;
      });
    });
    
    const series: any[] = meds.map(med => {
      const lineData: any[] = [];
      const doseData: any[] = [];
      const color = medicationColors[med];
      
      for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
        const concentration = calculateGLP1Concentration(
          dosesByMed[med],
          halfLifeByMed[med],
          new Date(d)
        );
        
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const hasDose = doseDatesByMed[med].has(dateStr);
        const dose = hasDose ? doseAmountByMed[med][dateStr] : undefined;
        const value = isNaN(concentration) ? null : parseFloat(concentration.toFixed(1));
        
        lineData.push([dateStr, value]);
        
        if (dose) {
          doseData.push({
            name: dateStr,
            value: [dateStr, value],
            symbol: 'circle',
            symbolSize: 10,
            itemStyle: { 
              color: color.stroke, 
              borderColor: '#2D1B4E', 
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: color.stroke + '99',
            },
          });
        }
      }
      
      return [
        {
          name: med,
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbol: 'none',
          lineStyle: { width: 2, color: color.stroke },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: color.fill },
                { offset: 1, color: color.fill.replace('0.3', '0.02') },
              ],
            },
          },
          emphasis: {
            lineStyle: { width: 3 },
            itemStyle: { opacity: 0 },
          },
          triggerLineEvent: false,
          data: lineData,
        },
        {
          name: med,
          type: 'scatter',
          z: 10,
          showInLegend: false,
          emphasis: {
            scale: 1.2,
          },
          data: doseData,
        },
      ];
    }).flat();
    
    // Add today marker line to the first series
    if (series.length > 0 && todayIndex >= 0) {
      const todayDateStr = xAxisDates[todayIndex];
      (series[0] as any).markLine = {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#4ADEA8', type: 'solid', width: 2 },
        label: { 
          show: true, 
          position: 'start', 
          formatter: 'Today',
          color: '#4ADEA8',
          fontSize: 11,
          padding: [4, 8],
        },
        data: [
          { xAxis: todayDateStr }
        ],
      };
    }
    
    const firstDateTime = firstDate.getTime();
    const lastDateTime = lastDate.getTime();
    const totalDays = Math.floor((lastDateTime - firstDateTime) / (24 * 60 * 60 * 1000));
    
    const option = {
      backgroundColor: 'transparent',
      color: meds.map(med => medicationColors[med]?.stroke || '#9C7BD3'),
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
          const filteredParams = params.filter((p: any) => p.seriesType !== 'scatter');
          const nonZeroParams = filteredParams.filter((p: any) => (p.value?.[1] ?? 0) > 0);
          if (nonZeroParams.length === 0) return `${params[0].axisValue}<div style="color: #94a3b8; font-size: 11px;">No active dose</div>`;
          const dateStr = params[0].axisValue;
          let html = `<div style="font-weight: 600; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid rgba(156, 123, 211, 0.2);">${dateStr}</div>`;
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
        data: meds,
        bottom: 0,
        icon: 'circle',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12, color: '#94a3b8' },
        formatter: (value: string) => {
          return value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1').trim();
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
        top: 10,
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
          formatter: (value: number) => value.toFixed(1) + ' mg',
        },
        splitLine: {
          lineStyle: { color: 'rgba(156, 123, 211, 0.1)', type: 'dashed' },
        },
      },
      series,
    };
    
    return { chartOption: option };
  }, [data, period]);

  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="text-center text-text-muted">
          <p className="text-sm">No dose data yet</p>
          <p className="text-xs mt-1">Log your first dose to see the chart</p>
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

export default DosesChartECharts;
