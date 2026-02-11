import React from 'react';
import GLP1Chart from './GLP1Chart';
import { GLP1Entry } from '../types';

interface GLP1TabProps {
  glp1Entries: GLP1Entry[];
}

const GLP1Tab: React.FC<GLP1TabProps> = ({ glp1Entries }) => {
  return (
    <div className="space-y-3">
      <header className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
        <h1 className="text-2xl font-bold text-[#B19CD9] [text-shadow:0_0_20px_rgba(177,156,217,0.6)] mb-2">GLP-1 Tracking</h1>
        <p className="text-sm text-[#B19CD9]/80">Track your GLP-1 medication doses and monitor concentration levels.</p>
      </header>

      <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
        <h2 className="text-lg font-semibold text-[#B19CD9] mb-3 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">GLP-1 Progress</h2>
        <div className="h-64 sm:h-80">
          <GLP1Chart data={glp1Entries} />
        </div>
      </div>
    </div>
  );
};

export default GLP1Tab;