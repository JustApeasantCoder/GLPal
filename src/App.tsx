import React, { useState } from 'react';
import WeightChart from './components/WeightChart';
import GLP1Chart from './components/GLP1Chart';
import TDEEDisplay from './components/TDEEDisplay';
import WeightInput from './components/WeightInput';
import SettingsDropdown from './components/SettingsDropdown';
import { useTheme } from './contexts/ThemeContext';
import { WeightEntry, GLP1Entry, UserProfile } from './types';

type TabType = 'dashboard' | 'weight' | 'glp1';

function App() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
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
  const startWeight = weights[0]?.weight || currentWeight;
  
  // Calculate BMI (height in cm, weight in kg)
  const heightInMeters = profile.height / 100;
  const bmi = currentWeight / (heightInMeters * heightInMeters);
  
  // Calculate total loss and percentage
  const totalLoss = startWeight - currentWeight;
  const totalLossPercentage = startWeight > 0 ? (totalLoss / startWeight) * 100 : 0;
  
  // Calculate averages
  const weeklyAverageLoss = weights.length >= 2 ? 
    ((weights[0].weight - currentWeight) / ((weights.length - 1) / 7)) : 0;
  const monthlyAverageLoss = weights.length >= 2 ? 
    ((weights[0].weight - currentWeight) / ((weights.length - 1) / 30)) : 0;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'weight', label: 'Weight', icon: '⚖️' },
    { id: 'glp1', label: 'GLP-1', icon: '💉' }
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Fixed top navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">GLPal</h1>
          <SettingsDropdown 
            profile={profile} 
            onProfileUpdate={setProfile}
            isDarkMode={isDarkMode}
            onThemeToggle={toggleDarkMode}
          />
        </div>
      </nav>

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main scrollable content area with padding for nav - 20:9 aspect ratio for mobile */}
      <main className="flex-1 pt-16 pb-16 overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-4 py-2 space-y-3 md:max-w-2xl lg:max-w-4xl">
          {activeTab === 'dashboard' && (
            <>
               {/* Unified Dashboard Card */}
               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h1>
                 
                 {/* Metrics Section */}
                 <div className="space-y-3 mb-6">
                   {/* Row 1: Current, BMI, Total Loss */}
                   <div className="grid grid-cols-3 gap-2 sm:gap-3">
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                       <p className="text-xs text-blue-600 dark:text-blue-400">Current</p>
                       <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{currentWeight.toFixed(1)} kg</p>
                     </div>
                     <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                       <p className="text-xs text-green-600 dark:text-green-400">BMI</p>
                       <p className="text-lg font-bold text-green-900 dark:text-green-300">{bmi.toFixed(1)}</p>
                     </div>
                     <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                       <p className="text-xs text-purple-600 dark:text-purple-400">Total Loss</p>
                       <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
                         {totalLoss.toFixed(1)} kg
                       </p>
                       <p className="text-xs text-purple-600 dark:text-purple-400">
                         {totalLossPercentage.toFixed(1)}%
                       </p>
                     </div>
                   </div>
                   
                   {/* Row 2: Weekly Avg, Monthly Avg, To Lose */}
                   <div className="grid grid-cols-3 gap-2 sm:gap-3">
                     <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                       <p className="text-xs text-orange-600 dark:text-orange-400">Weekly Avg</p>
                       <p className="text-lg font-bold text-orange-900 dark:text-orange-300">
                         {weeklyAverageLoss > 0 ? '-' : ''}{weeklyAverageLoss.toFixed(1)} kg
                       </p>
                     </div>
                     <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                       <p className="text-xs text-pink-600 dark:text-pink-400">Monthly Avg</p>
                       <p className="text-lg font-bold text-pink-900 dark:text-pink-300">
                         {monthlyAverageLoss > 0 ? '-' : ''}{monthlyAverageLoss.toFixed(1)} kg
                       </p>
                     </div>
                     <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                       <p className="text-xs text-indigo-600 dark:text-indigo-400">To Lose</p>
                       <p className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
                         {(currentWeight - goalWeight).toFixed(1)} kg
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Charts Section */}
                 <div className="space-y-6">
                   {/* Weight Trends */}
                   <div>
                     <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Weight Trends</h3>
                     <div className="h-48 sm:h-56">
                       <WeightChart data={weights} goalWeight={goalWeight} />
                     </div>
                   </div>

                   {/* GLP-1 Status */}
                   <div>
                     <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">GLP-1 Status</h3>
                     <div className="h-32 sm:h-40">
                       <GLP1Chart data={glp1Entries} />
                     </div>
                   </div>
                 </div>
               </div>

                {/* Metabolic Profile */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                  <TDEEDisplay profile={profile} currentWeight={currentWeight} />
                </div>
            </>
          )}

          {activeTab === 'weight' && (
            <>
              <header className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Weight Tracking</h1>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Current</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{currentWeight.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400">Goal</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-300">{goalWeight} kg</p>
                  </div>
                </div>
              </header>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add Today's Weight</h3>
                <WeightInput onAddWeight={handleAddWeight} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Weight Trends</h2>
                <div className="h-64 sm:h-80">
                  <WeightChart data={weights} goalWeight={goalWeight} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'glp1' && (
              <div className="space-y-3">
                <header className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">GLP-1 Tracking</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track your GLP-1 medication doses and monitor concentration levels.</p>
                </header>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">GLP-1 Progress</h2>
                  <div className="h-64 sm:h-80">
                    <GLP1Chart data={glp1Entries} />
                  </div>
                </div>
              </div>
            )}


        </div>
      </main>
    </div>
  );
}

export default App;