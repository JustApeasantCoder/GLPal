import React from 'react';
import GLP1Chart from './GLP1Chart';
import { GLP1Entry } from '../types';

interface GLP1TabProps {
  glp1Entries: GLP1Entry[];
}

const GLP1Tab: React.FC<GLP1TabProps> = ({ glp1Entries }) => {
  return (
    <div className="space-y-3">
      <header className="bg-card-bg backdrop-blur-lg rounded-2xl shadow-theme p-4 border border-card-border">
        <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ textShadow: '0 0 20px var(--accent-purple-light)' }}>GLP-1 Tracking</h1>
        <p className="text-sm text-text-muted">Track your GLP-1 medication doses and monitor concentration levels.</p>
      </header>

      <div className="bg-card-bg backdrop-blur-lg rounded-2xl shadow-theme p-4 border border-card-border">
        <h2 className="text-lg font-semibold text-text-primary mb-3" style={{ textShadow: '0 0 10px var(--accent-purple-light)' }}>GLP-1 Progress</h2>
        <div className="h-64 sm:h-80">
          <GLP1Chart data={glp1Entries} />
        </div>
      </div>
    </div>
  );
};

export default GLP1Tab;