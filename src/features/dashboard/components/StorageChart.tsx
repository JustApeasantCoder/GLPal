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
      grid: {
        top: 10,
        right: 60,
        bottom: 20,
        left: 100,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#1a1625',
        borderColor: '#B19CD9',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          const dataIndex = item.dataIndex;
          const data = sortedData[dataIndex];
          const totalDosage = (data.remainingUnits * data.dosagePerUnit).toFixed(1);
          const valueRemaining = (data.remainingUnits * data.unitCost).toFixed(2);
          const percentRemaining = Math.round((data.remainingUnits / data.initialUnits) * 100);
          
          let html = `<div class="font-semibold">${data.medicationName}</div>`;
          html += `<div style="color: ${item.color}">${data.remainingUnits} units remaining (${percentRemaining}%)</div>`;
          if (data.dosagePerUnit > 0) {
            html += `<div>${totalDosage} mg total dosage</div>`;
          }
          html += `<div>$${valueRemaining} value remaining</div>`;
          if (data.expiryDate) {
            html += `<div>Expires: ${data.expiryDate}</div>`;
          }
          return html;
        },
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#666', fontSize: 10 },
        splitLine: { lineStyle: { color: '#222' } },
      },
      yAxis: {
        type: 'category',
        data: sortedData.map(d => d.medicationName),
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { 
          color: '#999', 
          fontSize: 10,
          width: 90,
          overflow: 'truncate',
        },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        data: sortedData.map(d => ({
          value: d.remainingUnits,
          itemStyle: {
            color: getItemColor(d, glp1MedicationOrder),
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          color: '#999',
          fontSize: 10,
          formatter: (params: any) => `${params.value}u`,
        },
      }],
    };
  }, [storage, selectedCategory, glp1MedicationOrder]);

  if (!chartOption) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 text-sm p-4"
        style={{ height }}
      >
        No active storage to display
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
