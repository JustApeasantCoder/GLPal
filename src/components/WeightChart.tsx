import React, { useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { WeightEntry, GLP1Entry } from '../types';
import { formatWeight } from '../utils/unitConversion';
import { useWeightChartData } from '../hooks/useChartDataProcessor';
import { useWeightChartDateRange } from '../hooks/useChartDateRange';
import ChartEmptyState from './ui/ChartEmptyState';
import { ChartPeriod } from '../hooks';
import { getMedicationColor } from '../utils/chartUtils';

const shortenMedicationName = (name: string): string => {
  return name.replace(/\s*\(.*?\)/g, '').trim();
};

interface WeightChartProps {
  data: WeightEntry[];
  goalWeight: number;
  unitSystem?: 'metric' | 'imperial';
  period?: ChartPeriod;
  medicationData?: GLP1Entry[];
  visibleMedications?: string[];
  onLegendChange?: (visibleMeds: string[]) => void;
}

const WeightChart: React.FC<WeightChartProps> = ({
  data,
  goalWeight,
  unitSystem = 'metric',
  period = 'month',
  medicationData = [],
  visibleMedications: externalVisibleMedications,
  onLegendChange,
}) => {
  const [localVisibleMedications, setLocalVisibleMedications] = useState<string[] | undefined>(undefined);
  const visibleMedications = externalVisibleMedications !== undefined ? externalVisibleMedications : localVisibleMedications;
  
  const { sortedData, minWeight, maxWeight, weightPadding } =
    useWeightChartData(data);
  const chartRef = useRef<any>(null);

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

  const doseChanges = useMemo(() => {
    if (!medicationData || medicationData.length === 0) return [];
    
    const sortedMeds = [...medicationData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const allMedications = Array.from(new Set(sortedMeds.map(e => e.medication)));
    const medicationColors: Record<string, { stroke: string; fill: string }> = {};
    allMedications.forEach((med, index) => {
      medicationColors[med] = getMedicationColor(index);
    });
    
    const changes: { date: string; dose: number; medication: string; color: string }[] = [];
    const lastDosePerMed: Record<string, number> = {};
    
    for (const entry of sortedMeds) {
      const prevDose = lastDosePerMed[entry.medication];
      if (prevDose === undefined) {
        lastDosePerMed[entry.medication] = entry.dose;
        changes.push({ 
          date: entry.date, 
          dose: entry.dose, 
          medication: entry.medication,
          color: medicationColors[entry.medication]?.stroke || '#4ADEA8',
        });
      } else if (entry.dose > prevDose) {
        lastDosePerMed[entry.medication] = entry.dose;
        changes.push({ 
          date: entry.date, 
          dose: entry.dose, 
          medication: entry.medication,
          color: medicationColors[entry.medication]?.stroke || '#4ADEA8',
        });
      } else if (entry.dose < prevDose) {
        lastDosePerMed[entry.medication] = entry.dose;
      }
    }
    
    return changes;
  }, [medicationData]);

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

    const doseChangeMarkers = (() => {
      if (doseChanges.length === 0) return [];
      
      const displayDates = sortedData.map(d => d.displayDate);
      const shouldShowAll = visibleMedications === undefined;
      
      return doseChanges
        .filter(change => shouldShowAll || (visibleMedications && visibleMedications.includes(shortenMedicationName(change.medication))))
        .map(change => {
          const changeDate = new Date(change.date);
          const formattedDate = changeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const index = displayDates.indexOf(formattedDate);
          
          if (index === -1) {
            const closestIndex = displayDates.findIndex((_, i) => {
              const dateD = new Date(firstDataDate.getTime() + i * 24 * 60 * 60 * 1000);
              return dateD >= changeDate;
            });
            if (closestIndex === -1) return null;
            
            const closestDate = displayDates[closestIndex];
            const weightAtDate = sortedData[closestIndex]?.weight;
            if (!weightAtDate) return null;
            
            return {
              value: [closestDate, weightAtDate],
              dose: change.dose,
              medication: change.medication,
              color: change.color,
            };
          }
          
          const weightAtDate = sortedData[index]?.weight;
          if (!weightAtDate) return null;
          
          return {
            value: [formattedDate, weightAtDate],
            dose: change.dose,
            medication: change.medication,
            color: change.color,
          };
        })
        .filter(Boolean);
    })();

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
      legend: {
        data: doseChanges.length > 0 ? Array.from(new Set(medicationData.map(e => shortenMedicationName(e.medication)))) : [],
        bottom: 0,
        icon: 'circle',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12, color: '#94a3b8' },
        formatter: (value: string) => shortenMedicationName(value),
        tooltip: {
          trigger: 'item',
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
        scale: true,
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
          lineStyle: { width: 2, color: '#9C7BD3' },
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
              textShadowColor: 'rgba(0,0,0,1)',
              textShadowBlur: 4,
              textShadowOffsetX: 1,
              textShadowOffsetY: 1,
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
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 4,
            borderColor: 'rgba(0,0,0,0.4)',
            borderWidth: 1,
            padding: [2, 2],
            textShadowColor: 'rgba(0,0,0,0.8)',
            textShadowBlur: 4,
            textShadowOffsetX: 1,
            textShadowOffsetY: 1,
          },
        },
        ...(doseChangeMarkers.length > 0 ? [{
          name: 'DoseChanges',
          type: 'scatter',
          z: 20,
          data: doseChangeMarkers.map((m: any) => ({
            value: [m.value[0], m.value[1], m.dose],
            itemStyle: {
              color: m.color,
              borderColor: '#1a3d2e',
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: m.color + '99',
            },
          })),
          symbol: 'pin',
          symbolSize: 12,
          symbolOffset: [0, -40],
          
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => params.value[2] + 'mg',
            color: '#fff',
            fontSize: 10,
            distance: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 4,
            borderColor: 'rgba(0,0,0,0.4)',
            borderWidth: 1,
            padding: [2, 2],
            textShadowColor: 'rgba(0,0,0,0.8)',
            textShadowBlur: 4,
            textShadowOffsetX: 1,
            textShadowOffsetY: 1,
          },
        }] : []),
        ...(() => {
          const allMeds = Array.from(new Set(medicationData.map(e => shortenMedicationName(e.medication))));
          return allMeds.map(med => {
            const originalMed = medicationData.find(e => shortenMedicationName(e.medication) === med);
            const allMedications = Array.from(new Set(medicationData.map(e => shortenMedicationName(e.medication))));
            const medicationColors: Record<string, { stroke: string; fill: string }> = {};
            allMedications.forEach((m, index) => {
              medicationColors[m] = getMedicationColor(index);
            });
            return {
              name: med,
              type: 'scatter',
              data: [],
              itemStyle: { color: medicationColors[med]?.stroke || '#4ADEA8' },
              symbol: 'circle',
              symbolSize: 8,
            };
          });
        })(),
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
    medicationData,
    doseChanges,
    visibleMedications,
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
        ref={chartRef}
        option={chartOption}
        style={{ height: '100%', width: '100%', opacity: 1 }}
        opts={{ renderer: 'svg' }}
        onEvents={{
          'legendselectchanged': (params: any) => {
            const { selected } = params;
            const allMeds = Array.from(new Set(medicationData.map(e => shortenMedicationName(e.medication))));
            const visibleMeds = allMeds.filter(med => selected[med] !== false);
            
            if (onLegendChange) {
              onLegendChange(visibleMeds);
            }
            setLocalVisibleMedications(visibleMeds);
          },
        }}
      />
    </div>
  );
};

export default WeightChart;
