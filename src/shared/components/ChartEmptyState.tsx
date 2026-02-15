import React from 'react';

interface ChartEmptyStateProps {
  title: string;
  description: string;
}

const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  title,
  description,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="text-center text-text-muted">
        <p className="text-sm">{title}</p>
        <p className="text-xs mt-1">{description}</p>
      </div>
    </div>
  );
};

export default ChartEmptyState;
