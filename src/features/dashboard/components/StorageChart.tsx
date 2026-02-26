import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { MedicationStorage, StorageCategory, PeptideCategory } from '../../../types';
import { MEDICATIONS } from '../../../constants/medications';
import { PEPTIDE_PRESETS } from '../../../types';

interface StorageChartProps {
  storage: MedicationStorage[];
  selectedCategory: StorageCategory | 'all';
  glp1MedicationOrder?: string[];
  height?: number;
}

const GLP1_COLORS = [
  '#9C7BD3', // Semaglutide
  '#4ADEA8', // Tirzepatide
  '#F59E0B', // Retatrutide
  '#EF4444', // Cagrilintide
  '#3B82F6', // Liraglutide
  '#94A3B8', // Dulaglutide
  '#6B7280', // Custom/Other
];

const PEPTIDE_CATEGORY_COLORS: Record<PeptideCategory, string> = {
  healing: '#EF4444',
  growth_hormone: '#F59E0B',
  fat_loss: '#10B981',
  muscle: '#3B82F6',
  longevity: '#8B5CF6',
  immune: '#EC4899',
  skin: '#F472B6',
  cognitive: '#06B6D4',
  other: '#6B7280',
};

const getItemColor = (item: MedicationStorage, glp1MedicationOrder: string[] = []): string => {
  if (item.category === 'glp1') {
    // First try to match by exact medication name in the logged order
    let medIndex = glp1MedicationOrder.indexOf(item.medicationName);
    if (medIndex === -1) {
      // Try partial match with medication name from logs
      const baseName = item.medicationName.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
      for (let i = 0; i < glp1MedicationOrder.length; i++) {
        const logMedBase = glp1MedicationOrder[i].toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
        if (baseName.includes(logMedBase) || logMedBase.includes(baseName)) {
          medIndex = i;
          break;
        }
      }
    }
    return GLP1_COLORS[medIndex >= 0 ? medIndex : GLP1_COLORS.length - 1];
  }
  
  if (item.category === 'peptide') {
    const peptide = PEPTIDE_PRESETS.find(p => 
      item.medicationName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(item.medicationName.toLowerCase())
    );
    return peptide ? PEPTIDE_CATEGORY_COLORS[peptide.category] : '#6B7280';
  }
  
  return '#6B7280';
};

const StorageChart: React.FC<StorageChartProps> = ({ storage, selectedCategory, glp1MedicationOrder = [], height = 180 }) => {
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [selectedCategory]);

  const chartOption = useMemo(() => {
    const filtered = selectedCategory === 'all' 
      ? storage
      : storage.filter(item => item.category === selectedCategory);

    if (filtered.length === 0) return null;

    const activeStorage = filtered.filter(item => item.remainingUnits > 0);
    if (activeStorage.length === 0) return null;

    const sortedData = [...activeStorage]
      .sort((a, b) => b.remainingUnits - a.remainingUnits)
      .slice(0, 10);

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      grid: {
        top: 10,
        right: 60,
        bottom: 10,
        left: 10,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { 
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(177, 156, 217, 0.1)',
          },
        },
        backgroundColor: 'rgba(26, 26, 36, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderRadius: 12,
        padding: [12, 16],
        textStyle: { color: '#fff', fontSize: 13, fontFamily: 'system-ui' },
        formatter: (params: any) => {
          const item = params[0];
          const dataIndex = item.dataIndex;
          const data = sortedData[dataIndex];
          const totalDosage = (data.remainingUnits * data.dosagePerUnit).toFixed(1);
          const valueRemaining = (data.remainingUnits * data.unitCost).toFixed(2);
          const percentRemaining = Math.round((data.remainingUnits / data.initialUnits) * 100);
          
          const categoryColors: Record<string, string> = {
            glp1: '#3B82F6',
            peptide: '#10B981',
            other: '#6B7280',
          };
          
          let html = `
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #fff;">${data.medicationName}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${categoryColors[data.category] || '#6B7280'};"></span>
              <span style="color: #999; font-size: 12px; text-transform: capitalize;">${data.category}</span>
            </div>
            <div style="background: #2a2a3a; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #999;">Remaining</span>
                <span style="color: ${item.color}; font-weight: 600;">${data.remainingUnits} units (${percentRemaining}%)</span>
              </div>
              <div style="width: 100%; height: 6px; background: #1a1a24; border-radius: 3px; overflow: hidden;">
                <div style="width: ${percentRemaining}%; height: 100%; background: linear-gradient(90deg, ${item.color}, ${item.color}aa); border-radius: 3px;"></div>
              </div>
            </div>
          `;
          if (data.dosagePerUnit > 0) {
            html += `<div style="color: #999; margin-bottom: 4px;"><span style="color: #ccc;">Total dosage:</span> ${totalDosage} mg</div>`;
          }
          html += `<div style="color: #999; margin-bottom: 4px;"><span style="color: #ccc;">Value:</span> $${valueRemaining}</div>`;
          if (data.expiryDate) {
            html += `<div style="color: #999;"><span style="color: #ccc;">Expires:</span> ${data.expiryDate}</div>`;
          }
          return html;
        },
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
          color: '#666', 
          fontSize: 11,
          formatter: (value: number) => value >= 1000 ? `${value / 1000}k` : value.toString(),
        },
        splitLine: { 
          lineStyle: { 
            color: '#222',
            type: 'dashed',
          } 
        },
      },
      yAxis: {
        type: 'category',
        data: sortedData.map(d => d.medicationName),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
          color: '#aaa', 
          fontSize: 11,
          fontWeight: 500,
          width: 80,
          overflow: 'truncate',
        },
      },
      series: [{
        type: 'bar',
        data: sortedData.map(d => {
          const color = getItemColor(d, glp1MedicationOrder);
          const percent = Math.round((d.remainingUnits / d.initialUnits) * 100);
          return {
            value: d.remainingUnits,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: color },
                  { offset: 1, color: `${color}cc` },
                ],
              },
              borderRadius: [0, 8, 8, 0],
            },
          };
        }),
        barWidth: '55%',
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(255, 255, 255, 0.03)',
          borderRadius: [0, 8, 8, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#888',
          fontSize: 11,
          fontWeight: 500,
          formatter: (params: any) => `${params.value}u`,
          offset: [8, 0],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(177, 156, 217, 0.3)',
          },
        },
      }],
    };
  }, [storage, selectedCategory, glp1MedicationOrder]);

  if (!chartOption) {
    return (
      <div 
        className="flex flex-col items-center justify-center text-gray-500 text-sm p-4"
        style={{ height }}
      >
        <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span>No active storage to display</span>
      </div>
    );
  }

  return (
    <ReactECharts 
      key={chartKey}
      option={chartOption} 
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default StorageChart;
