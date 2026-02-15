import { GLP1Entry } from '../types';
import { calculateMedicationConcentration } from '../utils/calculations';
import { CHART_COLORS } from './chartUtils';

interface MedicationSeriesParams {
  medications: string[];
  medicationColors: Record<string, { stroke: string; fill: string }>;
  dosesByMed: Record<string, { date: Date; dose: number }[]>;
  halfLifeByMed: Record<string, number>;
  firstDate: Date;
  lastDate: Date;
  xAxisDates: string[];
  todayIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
}

export const generateMedicationSeries = ({
  medications,
  medicationColors,
  dosesByMed,
  halfLifeByMed,
  firstDate,
  lastDate,
  xAxisDates,
  todayIndex,
  visibleStartIndex,
  visibleEndIndex,
}: MedicationSeriesParams) => {
  const doseDatesByMed: Record<string, Set<string>> = {};
  const doseAmountByMed: Record<string, Record<string, number>> = {};
  const combinedDoseDates = new Set<string>();
  const combinedDoseAmounts: Record<string, number> = {};

  medications.forEach((med) => {
    doseDatesByMed[med] = new Set();
    doseAmountByMed[med] = {};
    dosesByMed[med].forEach((d) => {
      const peakDate = new Date(d.date.getTime() + 24 * 60 * 60 * 1000);
      const dateKey = peakDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      doseDatesByMed[med].add(dateKey);
      doseAmountByMed[med][dateKey] = d.dose;
      combinedDoseDates.add(dateKey);
      combinedDoseAmounts[dateKey] = (combinedDoseAmounts[dateKey] || 0) + d.dose;
    });
  });

  const combinedColor = CHART_COLORS.combined;
  const combinedSeries: any[] = [];
  const combinedLineDataBefore: any[] = [];
  const combinedLineDataAfter: any[] = [];
  const combinedDoseData: any[] = [];

  const combinedDoseDatesArray = Array.from(combinedDoseDates);
  
  const iterateDate = new Date(firstDate);
  while (iterateDate <= lastDate) {
    let totalConcentration = 0;
    medications.forEach((med) => {
      totalConcentration += calculateMedicationConcentration(
        dosesByMed[med],
        halfLifeByMed[med],
        new Date(iterateDate)
      );
    });

    const dateStr = iterateDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const hasDose = combinedDoseDates.has(dateStr);
    const dose = hasDose ? combinedDoseAmounts[dateStr] : undefined;
    const value = isNaN(totalConcentration) ? null : totalConcentration;

    const dateIndex = xAxisDates.indexOf(dateStr);
    if (dateIndex <= todayIndex) {
      combinedLineDataBefore.push([dateStr, value]);
    }
    if (dateIndex >= todayIndex) {
      combinedLineDataAfter.push([dateStr, value]);
    }

    if (dose) {
      combinedDoseData.push({
        name: dateStr,
        value: [dateStr, value],
        symbol: 'circle',
        symbolSize: 10,
        itemStyle: {
          color: combinedColor.stroke,
          borderColor: '#2D1B4E',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: combinedColor.stroke + '99',
        },
      });
    }

    iterateDate.setDate(iterateDate.getDate() + 1);
  }

  if (medications.length > 0) {
    combinedSeries.push(
      {
        name: 'Combined',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'none',
        itemStyle: { color: combinedColor.stroke },
        lineStyle: { width: 2, color: combinedColor.stroke },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: combinedColor.fill },
              { offset: 1, color: combinedColor.fill.replace('0.3', '0.02') },
            ],
          },
        },
        emphasis: {
          lineStyle: { width: 3 },
          itemStyle: { opacity: 0 },
        },
        triggerLineEvent: false,
        data: combinedLineDataBefore,
      },
      {
        name: 'Combined_future',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'none',
        showInLegend: false,
        lineStyle: { width: 2, color: combinedColor.stroke, type: 'dotted' },
        emphasis: {
          disabled: true,
        },
        triggerLineEvent: false,
        data: combinedLineDataAfter,
      },
      {
        name: 'Combined',
        type: 'scatter',
        z: 10,
        showInLegend: false,
        emphasis: {
          scale: 1.2,
        },
        data: combinedDoseData,
      }
    );
  }

  combinedSeries.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      let lastShownValue: number | null = null;
      s.data = s.data.map((dot: any) => {
        const doseValue = dot.value[1];
        let shouldShow = true;
        if (lastShownValue !== null && lastShownValue > 0) {
          const diff = Math.abs(doseValue - lastShownValue) / lastShownValue;
          if (diff <= 0.25) {
            shouldShow = false;
          }
        }
        if (shouldShow) {
          lastShownValue = doseValue;
          const formattedDoseValue = doseValue < 1 ? doseValue.toFixed(2) : doseValue.toFixed(1);
          return {
            ...dot,
            label: {
              show: true,
              position: 'top',
              formatter: formattedDoseValue + 'mg',
              color: '#E2E8F0',
              fontSize: 10,
              distance: 8,
            },
          };
        }
        return { ...dot, label: { show: false } };
      });
    }
  });

  combinedSeries.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      const visibleDots = s.data.filter((dot: any) => {
        const dotIndex = xAxisDates.indexOf(dot.value[0]);
        return dotIndex >= visibleStartIndex && dotIndex <= visibleEndIndex;
      });
      if (visibleDots.length > 6) {
        const step = Math.floor(visibleDots.length / 6);
        s.data = visibleDots
          .filter((_: any, i: number) => i % step === 0)
          .slice(0, 6);
      }
    }
  });

  const series: any[] = medications.map((med) => {
    const lineDataBefore: any[] = [];
    const lineDataAfter: any[] = [];
    const doseData: any[] = [];
    const color = medicationColors[med];

    const iterateDate = new Date(firstDate);
    while (iterateDate <= lastDate) {
      const concentration = calculateMedicationConcentration(
        dosesByMed[med],
        halfLifeByMed[med],
        new Date(iterateDate)
      );

      const dateStr = iterateDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const hasDose = doseDatesByMed[med].has(dateStr);
      const dose = hasDose ? doseAmountByMed[med][dateStr] : undefined;
      const value = isNaN(concentration)
        ? null
        : concentration;

      const dateIndex = xAxisDates.indexOf(dateStr);
      if (dateIndex <= todayIndex) {
        lineDataBefore.push([dateStr, value]);
      }
      if (dateIndex >= todayIndex) {
        lineDataAfter.push([dateStr, value]);
      }

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

      iterateDate.setDate(iterateDate.getDate() + 1);
    }

    return [
      {
        name: med,
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'none',
        itemStyle: { color: color.stroke },
        lineStyle: { width: 2, color: color.stroke },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
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
        data: lineDataBefore,
      },
      {
        name: med + '_future',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'none',
        showInLegend: false,
        lineStyle: { width: 2, color: color.stroke, type: 'dotted' },
        emphasis: {
          disabled: true,
        },
        triggerLineEvent: false,
        data: lineDataAfter,
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

  series.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      let lastShownValue: number | null = null;

      s.data = s.data.map((dot: any) => {
        const doseValue = dot.value[1];

        let shouldShow = true;
        if (lastShownValue !== null && lastShownValue > 0) {
          const diff = Math.abs(doseValue - lastShownValue) / lastShownValue;
          if (diff <= 0.25) {
            shouldShow = false;
          }
        }

        if (shouldShow) {
          lastShownValue = doseValue;
          const formattedDoseValue = doseValue < 1 ? doseValue.toFixed(2) : doseValue.toFixed(1);
          return {
            ...dot,
            label: {
              show: true,
              position: 'top',
              formatter: formattedDoseValue + 'mg',
              color: '#E2E8F0',
              fontSize: 10,
              distance: 8,
            },
          };
        }

        return { ...dot, label: { show: false } };
      });
    }
  });

  series.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      const visibleDots = s.data.filter((dot: any) => {
        const dotIndex = xAxisDates.indexOf(dot.value[0]);
        return dotIndex >= visibleStartIndex && dotIndex <= visibleEndIndex;
      });

      if (visibleDots.length > 6) {
        const step = Math.floor(visibleDots.length / 6);
        s.data = visibleDots
          .filter((_: any, i: number) => i % step === 0)
          .slice(0, 6);
      }
    }
  });

  if (todayIndex >= 0) {
    const todayDateStr = xAxisDates[todayIndex];
    const markLineConfig = {
      silent: true,
      symbol: 'none',
      z: 100,
      label: { show: false },
      lineStyle: { type: 'dotted', width: 2, color: '#94A3B8' },
      data: [{ xAxis: todayDateStr }],
    };

    const todayLineSeries = {
      name: 'Today',
      type: 'line',
      markLine: markLineConfig,
      data: [],
      silent: true,
      animation: false,
      lineStyle: { opacity: 0 },
      areaStyle: { opacity: 0 },
    };

    if (combinedSeries.length > 0) {
      (combinedSeries[2] as any).markLine = markLineConfig;
    }
    if (series.length > 0) {
      (series[2] as any).markLine = markLineConfig;
    }

    return [...(medications.length > 1 ? combinedSeries : []), ...series, todayLineSeries];
  }

  return [...(medications.length > 1 ? combinedSeries : []), ...series];
};
