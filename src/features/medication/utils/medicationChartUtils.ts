import { GLP1Entry } from '../../../types';
import { calculateMedicationConcentration } from '../../../shared/utils/calculations';
import { CHART_COLORS } from '../../weight/utils/chartUtils';

interface DoseDataPoint {
  date: Date;
  dose: number;
}

interface MedicationSeriesParams {
  medications: string[];
  medicationColors: Record<string, { stroke: string; fill: string }>;
  dosesByMed: Record<string, DoseDataPoint[]>;
  halfLifeByMed: Record<string, number>;
  firstDate: Date;
  lastDate: Date;
  xAxisDates: string[];
  todayIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
}

const formatDateStr = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const createDoseMarker = (
  dateStr: string,
  value: number | null,
  color: { stroke: string; fill: string }
) => ({
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

const formatDoseLabel = (doseValue: number): string => {
  return (doseValue < 1 ? doseValue.toFixed(2) : doseValue.toFixed(1)) + 'mg';
};

const filterVisibleDots = (
  data: any[],
  xAxisDates: string[],
  visibleStartIndex: number,
  visibleEndIndex: number,
  maxDots: number = 6
): any[] => {
  const visibleDots = data.filter((dot: any) => {
    const dotIndex = xAxisDates.indexOf(dot.value[0]);
    return dotIndex >= visibleStartIndex && dotIndex <= visibleEndIndex;
  });

  if (visibleDots.length > maxDots) {
    const step = Math.floor(visibleDots.length / maxDots);
    return visibleDots.filter((_: any, i: number) => i % step === 0).slice(0, maxDots);
  }

  return visibleDots;
};

const deduplicateLabels = (data: any[]): any[] => {
  if (!data || data.length === 0) return data;

  let lastShownValue: number | null = null;
  return data.map((dot) => {
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
      return {
        ...dot,
        label: {
          show: true,
          position: 'top',
          formatter: formatDoseLabel(doseValue),
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
      };
    }

    return { ...dot, label: { show: false } };
  });
};

const createAreaStyle = (color: { stroke: string; fill: string }) => ({
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
});

const createLineSeries = (
  name: string,
  color: { stroke: string; fill: string },
  data: any[],
  isFuture: boolean = false
) => ({
  name,
  type: 'line',
  smooth: true,
  showSymbol: false,
  symbol: 'none',
  itemStyle: { color: color.stroke },
  lineStyle: { width: 2, color: color.stroke, type: isFuture ? 'dotted' : 'solid' },
  areaStyle: isFuture ? undefined : createAreaStyle(color),
  emphasis: isFuture
    ? { disabled: true }
    : { lineStyle: { width: 3 }, itemStyle: { opacity: 0 } },
  triggerLineEvent: false,
  showInLegend: isFuture ? false : true,
  data,
});

const createScatterSeries = (
  name: string,
  color: { stroke: string; fill: string },
  data: any[]
) => ({
  name,
  type: 'scatter',
  z: 10,
  showInLegend: false,
  emphasis: { scale: 1.2 },
  data,
});

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
      const dateKey = formatDateStr(peakDate);
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

    const dateStr = formatDateStr(iterateDate);
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
      combinedDoseData.push(createDoseMarker(dateStr, value, combinedColor));
    }

    iterateDate.setDate(iterateDate.getDate() + 1);
  }

  if (medications.length > 0) {
    combinedSeries.push(
      createLineSeries('Combined', combinedColor, combinedLineDataBefore),
      createLineSeries('Combined_future', combinedColor, combinedLineDataAfter, true),
      createScatterSeries('Combined', combinedColor, combinedDoseData)
    );
  }

  combinedSeries.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      s.data = deduplicateLabels(s.data);
    }
  });

  combinedSeries.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      s.data = filterVisibleDots(s.data, xAxisDates, visibleStartIndex, visibleEndIndex);
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

      const dateStr = formatDateStr(iterateDate);
      const hasDose = doseDatesByMed[med].has(dateStr);
      const dose = hasDose ? doseAmountByMed[med][dateStr] : undefined;
      const value = isNaN(concentration) ? null : concentration;

      const dateIndex = xAxisDates.indexOf(dateStr);
      if (dateIndex <= todayIndex) {
        lineDataBefore.push([dateStr, value]);
      }
      if (dateIndex >= todayIndex) {
        lineDataAfter.push([dateStr, value]);
      }

      if (dose) {
        doseData.push(createDoseMarker(dateStr, value, color));
      }

      iterateDate.setDate(iterateDate.getDate() + 1);
    }

    return [
      createLineSeries(med, color, lineDataBefore),
      createLineSeries(med + '_future', color, lineDataAfter, true),
      createScatterSeries(med, color, doseData),
    ];
  }).flat();

  series.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      s.data = deduplicateLabels(s.data);
    }
  });

  series.forEach((s: any) => {
    if (s.type === 'scatter' && s.data && s.data.length > 0) {
      s.data = filterVisibleDots(s.data, xAxisDates, visibleStartIndex, visibleEndIndex);
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

export {
  formatDateStr,
  createDoseMarker,
  formatDoseLabel,
  filterVisibleDots,
  deduplicateLabels,
  createAreaStyle,
  createLineSeries,
  createScatterSeries,
};
