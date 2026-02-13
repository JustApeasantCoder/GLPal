import { GLP1Entry } from '../types';
import { calculateMedicationConcentration } from '../utils/calculations';

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
    });
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
        : parseFloat(concentration.toFixed(1));

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
        const doseValue = Math.round(dot.value[1]);

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
              formatter: doseValue + 'mg',
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

  if (series.length > 0 && todayIndex >= 0) {
    const todayDateStr = xAxisDates[todayIndex];
    (series[0] as any).markLine = {
      silent: true,
      symbol: 'none',
      z: 100,
      label: { show: false },
      lineStyle: { type: 'dotted', width: 2 },
      data: [{ xAxis: todayDateStr }],
    };
  }

  return series;
};
