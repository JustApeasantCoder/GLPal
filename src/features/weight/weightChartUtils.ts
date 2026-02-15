export const shortenMedicationName = (name: string): string => {
  return name.replace(/\s*\(.*?\)/g, '').trim();
};

export const getMedicationColor = (index: number): { stroke: string; fill: string } => {
  const colors = [
    { stroke: '#4ADEA8', fill: 'rgba(74, 222, 168, 0.3)' },
    { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.3)' },
    { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.3)' },
    { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.3)' },
    { stroke: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.3)' },
  ];
  return colors[index % colors.length];
};
