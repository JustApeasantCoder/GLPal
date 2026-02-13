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
    
    const firstDate = new Date(sortedData[0].date);
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    lastDate.setDate(lastDate.getDate() + 7);
    
    // Calculate zoom based on last data date (not today)
    const lastDataDate = new Date(sortedData[sortedData.length - 1].date);
    lastDataDate.setHours(0, 0, 0, 0);
    const daysFromStartToLastData = (lastDataDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000);
    const totalDataDays = (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000);
    
    let daysToShow: number;
    switch (period) {
      case 'week': daysToShow = 14; break;
      case 'month': daysToShow = 30; break;
      case '90days': daysToShow = 90; break;
      case 'all': daysToShow = totalDataDays; break;
      default: daysToShow = totalDataDays;
    }
    
    let zoomStart = 0;
    if (totalDataDays > daysToShow) {
      zoomStart = Math.max(0, Math.min(100, ((daysFromStartToLastData - daysToShow) / totalDataDays) * 100));
    }
    console.log('period:', period, 'daysToShow:', daysToShow, 'daysFromStartToLastData:', daysFromStartToLastData, 'zoomStart:', zoomStart);
    
    const zoomEnd = 100;
    
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
    
    const series: any[] = meds.map(med => {
      const lineData: any[] = [];
      
      for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
        const concentration = calculateGLP1Concentration(
          dosesByMed[med],
          halfLifeByMed[med],
          new Date(d)
        );
        
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const peak = peakData[med].find(p => p.date === dateStr);
        
        lineData.push({
          date: dateStr,
          value: parseFloat(concentration.toFixed(3)),
          dose: peak ? peak.dose : null,
        });
      }
      
      const color = medicationColors[med];
      return {
        name: med,
        type: 'line',
        smooth: true,
        symbol: (params: any) => params.data?.dose ? 'circle' : 'none',
        symbolSize: (params: any) => params.data?.dose ? 8 : 0,
        lineStyle: { width: 2, color: color.stroke },
        itemStyle: { color: color.stroke },
        emphasis: {
          itemStyle: {
            borderColor: '#2D1B4E',
            borderWidth: 2,
          },
        },
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
        data: lineData,
      };
    });
    
    const firstDateTime = firstDate.getTime();
    const lastDateTime = lastDate.getTime();
    const totalDays = Math.floor((lastDateTime - firstDateTime) / (24 * 60 * 60 * 1000));
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(45, 27, 78, 0.8)',
        borderColor: 'rgba(177, 156, 217, 0.3)',
        borderRadius: 8,
        boxShadow: '0 0 20px rgba(177, 156, 217, 0.3)',
        textStyle: { color: '#B19CD9' },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const nonZeroParams = params.filter((p: any) => p.value?.value > 0);
          if (nonZeroParams.length === 0) return `${params[0].axisValue}<div style="color: #94a3b8; font-size: 11px;">No active dose</div>`;
          const dateStr = params[0].axisValue;
          let html = `<div style="font-weight: 600; margin-bottom: 4px;">${dateStr}</div>`;
          nonZeroParams.forEach((item: any) => {
            const color = item.color || '#9C7BD3';
            const value = item.value?.value ?? 0;
            html += `<div style="display: flex; align-items: center; gap: 8px; margin: 2px 0;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
              <span>${item.seriesName}: <strong>${value.toFixed(3)} mg</strong></span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: meds,
        bottom: 25,
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
        bottom: 65,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: totalDays + 1 }, (_, i) => {
          const d = new Date(firstDateTime + i * 24 * 60 * 60 * 1000);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisTick: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisLabel: { fontSize: 12, color: '#94a3b8' },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        orientation: 'left',
        width: 1,
        min: 0,
        axisLine: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
        axisTick: { show: false },
        axisLabel: { 
          color: '#94a3b8',
          fontSize: 11,
          margin: 10,
          formatter: (value: number) => value.toFixed(1),
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
