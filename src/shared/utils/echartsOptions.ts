import { CHART_COLORS } from './chartUtils';

export interface BaseChartOptions {
  xAxisDates: string[];
  zoomStart: number;
  zoomEnd: number;
}

export const createBaseChartOptions = ({
  xAxisDates,
  zoomStart,
  zoomEnd,
}: BaseChartOptions) => ({
  backgroundColor: 'transparent',
  grid: {
    top: 15,
    left: 10,
    right: 10,
    bottom: 25,
    containLabel: true,
  },
  xAxis: {
    type: 'category' as const,
    data: xAxisDates,
    boundaryGap: false,
    axisLine: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
    axisTick: { lineStyle: { color: 'rgba(156, 123, 211, 0.2)' } },
    axisLabel: { fontSize: 12, color: '#94a3b8' },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value' as const,
    position: 'right' as const,
    min: 0,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#94a3b8',
      fontSize: 11,
      margin: 10,
    },
    splitLine: {
      lineStyle: { color: 'rgba(156, 123, 211, 0.1)', type: 'dashed' as const },
    },
  },
  dataZoom: [
    {
      type: 'inside' as const,
      start: zoomStart,
      end: zoomEnd,
      zoomOnMouseWheel: true,
      moveOnMouseWheel: true,
    },
  ],
});

export const createTooltipOptions = () => ({
  trigger: 'axis' as const,
  backgroundColor: 'rgba(20, 15, 35, 0.95)',
  borderColor: 'rgba(177, 156, 217, 0.4)',
  borderWidth: 1,
  borderRadius: 12,
  padding: [12, 16],
  extraCssText:
    'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); backdrop-filter: blur(10px);',
  textStyle: { color: '#E2E8F0', fontSize: 13 },
});

export const createYAxisConfig = (
  formatter: (value: number) => string,
  min?: number,
  max?: number
) => ({
  type: 'value' as const,
  position: 'right' as const,
  min,
  max,
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: {
    color: '#94a3b8',
    fontSize: 11,
    margin: 10,
    formatter,
  },
  splitLine: {
    lineStyle: { color: 'rgba(156, 123, 211, 0.1)', type: 'dashed' as const },
  },
});

export const createLineAreaStyle = (
  color: { stroke: string; fill: string },
  width: number = 2
) => ({
  lineStyle: { width, color: color.stroke },
  areaStyle: {
    color: {
      type: 'linear' as const,
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
});

/* TEMPORARILY REMOVED BLUR - TODO: Restore later */
export const createDotStyle = (color: string) => ({
  color,
  borderColor: '#2D1B4E',
  borderWidth: 2,
});

export const CHART_CONSTANTS = {
  dotSymbol: 'circle' as const,
  defaultDotSize: 10,
  maxVisibleDots: 6,
  labelDistance: 8,
  labelFontSize: 10,
  labelColor: '#E2E8F0',
  todayLineStyle: {
    type: 'dotted' as const,
    width: 2,
  },
  futureLineStyle: {
    type: 'dotted' as const,
    width: 2,
  },
  legend: {
    bottom: 0,
    icon: 'circle' as const,
    itemWidth: 12,
    itemHeight: 12,
    textStyle: { fontSize: 12, color: '#94a3b8' },
  },
};
