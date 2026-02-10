import React, { useState } from 'react';
import WeightChart from './components/WeightChart';
import GLP1Chart from './components/GLP1Chart';
import TDEECalculator from './components/TDEECalculator';
import TDEEDisplay from './components/TDEEDisplay';
import WeightInput from './components/WeightInput';
import { WeightEntry, GLP1Entry, UserProfile } from './types';

type TabType = 'weight' | 'glp1' | 'tdee';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('weight');
  const [weights, setWeights] = useState<WeightEntry[]>([
    { date: '2024-01-01', weight: 85 },
    { date: '2024-01-02', weight: 84.8 },
    { date: '2024-01-03', weight: 84.9 },
    { date: '2024-01-04', weight: 84.5 },
    { date: '2024-01-05', weight: 84.6 },
    { date: '2024-01-06', weight: 84.3 },
    { date: '2024-01-07', weight: 84.1 },
  ]);

  const [glp1Entries] = useState<GLP1Entry[]>([
    { date: '2024-01-01', medication: 'Semaglutide', dose: 0.25, halfLifeHours: 168 },
    { date: '2024-01-08', medication: 'Semaglutide', dose: 0.5, halfLifeHours: 168 },
    { date: '2024-01-15', medication: 'Semaglutide', dose: 1.0, halfLifeHours: 168 },
  ]);

  const [profile, setProfile] = useState<UserProfile>({
    age: 35,
    gender: 'male',
    height: 180,
    activityLevel: 1.5,
  });

  const handleAddWeight = (newWeight: number) => {
    const today = new Date().toISOString().split('T')[0];
    setWeights(prev => [...prev, { date: today, weight: newWeight }]);
  };

  const currentWeight = weights[weights.length - 1]?.weight || 0;
  const goalWeight = 80;

  const tabs = [
    { id: 'weight', label: 'Weight', icon: '⚖️' },
    { id: 'glp1', label: 'GLP-1', icon: '💉' },
    { id: 'tdee', label: 'TDEE', icon: '🔥' }
  ] as const;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main scrollable content area with padding for bottom nav */}
      <main className="flex-1 bg-gray-100 p-4 pb-20 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'weight' && (
            <>
              {/* Header */}
              <header className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-3xl font-bold text-gray-900">GLPal - Health Tracker</h1>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Current Weight</p>
                    <p className="text-2xl font-bold text-blue-900">{currentWeight.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Goal Weight</p>
                    <p className="text-2xl font-bold text-green-900">{goalWeight} kg</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">To Lose</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {(currentWeight - goalWeight).toFixed(1)} kg
                    </p>
                  </div>
                </div>
              </header>

              {/* Forms and Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <WeightInput onAddWeight={handleAddWeight} />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <TDEECalculator onProfileUpdate={setProfile} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Weight Trends</h2>
                  <div className="w-full h-80">
                    <WeightChart data={weights} goalWeight={goalWeight} />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">GLP-1 Concentration</h2>
                  <div className="w-full h-80">
                    <GLP1Chart data={glp1Entries} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <TDEEDisplay profile={profile} currentWeight={currentWeight} />
              </div>
            </>
          )}

          {activeTab === 'glp1' && (
            <div className="space-y-6">
              <header className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-3xl font-bold text-gray-900">GLP-1 Tracking</h1>
                <p className="mt-2 text-gray-600">Track your GLP-1 medication doses and monitor concentration levels.</p>
              </header>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">GLP-1 Progress</h2>
                <div className="w-full h-80">
                  <GLP1Chart data={glp1Entries} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tdee' && (
            <div className="space-y-6">
              <header className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-3xl font-bold text-gray-900">TDEE Calculator</h1>
                <p className="mt-2 text-gray-600">Calculate your Total Daily Energy Expenditure and weight loss targets.</p>
              </header>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <TDEECalculator onProfileUpdate={setProfile} />
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Metabolic Profile</h2>
                <TDEEDisplay profile={profile} currentWeight={currentWeight} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;