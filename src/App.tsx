import React, { useState, useEffect, useCallback } from 'react';
import WeightChart from './components/WeightChart';
import GLP1Chart from './components/GLP1Chart';
import TDEEDisplay from './components/TDEEDisplay';
import WeightInput from './components/WeightInput';
import SettingsDropdown from './components/SettingsDropdown';
import { useTheme } from './contexts/ThemeContext';
import { WeightEntry, GLP1Entry, UserProfile } from './types';
import { 
  initializeDatabase, 
  getWeightEntries, 
  getGLP1Entries, 
  getUserProfile, 
  addWeightEntry, 
  saveUserProfile 
} from './utils/database';
import { generateSimulatedData } from './utils/generateData';

type TabType = 'dashboard' | 'weight' | 'glp1';

function App() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [glp1Entries, setGLP1Entries] = useState<GLP1Entry[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | '90days' | 'all'>('90days');
  const [profile, setProfile] = useState<UserProfile>({
    age: 35,
    gender: 'male',
    height: 180,
    activityLevel: 1.5,
  });

  // Initialize database and load data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initializeApp = () => {
      try {
        initializeDatabase();
        
        // Load existing data
        const existingWeights = getWeightEntries();
        const existingGLP1 = getGLP1Entries();
        const existingProfile = getUserProfile();
        
        // If no data exists, generate simulated data
        if (existingWeights.length === 0) {
          console.log('No existing data found, generating simulated data...');
          generateSimulatedData();
          
          // Reload after generation
          const generatedWeights = getWeightEntries();
          const generatedGLP1 = getGLP1Entries();
          setWeights(generatedWeights);
          setGLP1Entries(generatedGLP1);
        } else {
          setWeights(existingWeights);
          setGLP1Entries(existingGLP1);
        }
        
        // Load profile or use default
        if (existingProfile) {
          setProfile(existingProfile);
        } else {
          saveUserProfile(profile);
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once

const handleAddWeight = (newWeight: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry = { date: today, weight: newWeight };
    
    // Save to database
    addWeightEntry(newEntry);
    
    // Update state
    setWeights(prev => [...prev, newEntry]);
  };

  const currentWeight = weights[weights.length - 1]?.weight || 0;
  const goalWeight = 80;
  const startWeight = weights[0]?.weight || currentWeight;
  
  // Filter weights based on selected period
  const getFilteredWeights = () => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (chartPeriod) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        filterDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        return weights;
      default:
        return weights;
    }
    
    const filterDateStr = filterDate.toISOString().split('T')[0];
    return weights.filter(entry => entry.date >= filterDateStr);
  };
  
  const filteredWeights = getFilteredWeights();
  
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Fixed top navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-b border-cyan-500/20 px-4 py-3 z-50 shadow-[0_4px_20px_rgba(0,255,255,0.15)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-cyan-300 [text-shadow:0_0_20px_rgba(0,255,255,0.5)]">GLPal</h1>
          <SettingsDropdown 
            profile={profile} 
            onProfileUpdate={useCallback((newProfile: UserProfile) => {
              setProfile(newProfile);
              saveUserProfile(newProfile);
            }, [])}
            isDarkMode={isDarkMode}
            onThemeToggle={toggleDarkMode}
          />
        </div>
      </nav>

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-cyan-500/20 px-4 py-2 z-50 shadow-[0_-4px_20px_rgba(0,255,255,0.15)]">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.4)] scale-105'
                  : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]'
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
               <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,255,255,0.2)] p-4 border border-cyan-500/20">
                 <h1 className="text-2xl font-bold text-cyan-300 [text-shadow:0_0_20px_rgba(0,255,255,0.6)] mb-4">Dashboard</h1>
                 
                 {/* Metrics Section */}
                 <div className="space-y-3 mb-6">
                   {/* Row 1: Current, BMI, Total Loss */}
                   <div className="grid grid-cols-3 gap-2 sm:gap-3">
                     <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm p-3 rounded-xl border border-cyan-400/30 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                       <p className="text-xs text-cyan-300 font-medium">Current</p>
                       <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(0,255,255,0.5)]">{currentWeight.toFixed(1)} kg</p>
                     </div>
                     <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm p-3 rounded-xl border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                       <p className="text-xs text-emerald-300 font-medium">BMI</p>
                       <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(16,185,129,0.5)]">{bmi.toFixed(1)}</p>
                     </div>
                     <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm p-3 rounded-xl border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                       <p className="text-xs text-purple-300 font-medium">Total Loss</p>
                       <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(168,85,247,0.5)]">
                         {totalLoss.toFixed(1)} kg
                       </p>
                       <p className="text-xs text-purple-300">
                         {totalLossPercentage.toFixed(1)}%
                       </p>
                     </div>
                   </div>
                   
                   {/* Row 2: Weekly Avg, Monthly Avg, To Lose */}
                   <div className="grid grid-cols-3 gap-2 sm:gap-3">
                     <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm p-3 rounded-xl border border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                       <p className="text-xs text-amber-300 font-medium">Weekly Avg</p>
                       <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(251,191,36,0.5)]">
                         {weeklyAverageLoss > 0 ? '-' : ''}{weeklyAverageLoss.toFixed(1)} kg
                       </p>
                     </div>
                     <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-sm p-3 rounded-xl border border-rose-400/30 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                       <p className="text-xs text-rose-300 font-medium">Monthly Avg</p>
                       <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(244,63,94,0.5)]">
                         {monthlyAverageLoss > 0 ? '-' : ''}{monthlyAverageLoss.toFixed(1)} kg
                       </p>
                     </div>
                     <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-sm p-3 rounded-xl border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                       <p className="text-xs text-indigo-300 font-medium">To Lose</p>
                       <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(99,102,241,0.5)]">
                         {(currentWeight - goalWeight).toFixed(1)} kg
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Charts Section */}
                 <div className="space-y-6">
                    {/* Weight Trends */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => setChartPeriod('week')}
                            className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === 'week'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                            }`}
                          >
                            Week
                          </button>
                          <button
                            onClick={() => setChartPeriod('month')}
                            className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === 'month'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                            }`}
                          >
                            Month
                          </button>
                          <button
                            onClick={() => setChartPeriod('90days')}
                            className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === '90days'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                            }`}
                          >
                            90 days
                          </button>
                          <button
                            onClick={() => setChartPeriod('all')}
                            className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === 'all'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                            }`}
                          >
                            All Time
                          </button>
                        </div>
                      </div>
                      <div className="h-48 sm:h-56">
                        <WeightChart data={filteredWeights} goalWeight={goalWeight} />
                      </div>
                    </div>

                   {/* GLP-1 Status */}
                   <div>
                     <h3 className="text-sm font-medium text-cyan-300 mb-3 [text-shadow:0_0_10px_rgba(0,255,255,0.4)]">GLP-1 Status</h3>
                     <div className="h-32 sm:h-40">
                       <GLP1Chart data={glp1Entries} />
                     </div>
                   </div>
                 </div>
               </div>

                {/* Metabolic Profile */}
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,255,255,0.2)] p-4 border border-cyan-500/20">
                  <TDEEDisplay profile={profile} currentWeight={currentWeight} />
                </div>
            </>
          )}

          {activeTab === 'weight' && (
            <>
              <header className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,255,255,0.2)] p-4 border border-cyan-500/20">
                <h1 className="text-2xl font-bold text-cyan-300 [text-shadow:0_0_20px_rgba(0,255,255,0.6)] mb-3">Weight Tracking</h1>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm p-3 rounded-xl border border-cyan-400/30 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                    <p className="text-xs text-cyan-300 font-medium">Current</p>
                    <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(0,255,255,0.5)]">{currentWeight.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm p-3 rounded-xl border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <p className="text-xs text-emerald-300 font-medium">Goal</p>
                    <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(16,185,129,0.5)]">{goalWeight} kg</p>
                  </div>
                </div>
              </header>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,255,255,0.2)] p-4 border border-cyan-500/20">
                <h3 className="text-sm font-semibold text-cyan-300 mb-3 [text-shadow:0_0_10px_rgba(0,255,255,0.4)]">Add Today's Weight</h3>
                <WeightInput onAddWeight={handleAddWeight} />
              </div>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,255,255,0.2)] p-4 border border-cyan-500/20">
                  <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => setChartPeriod('week')}
                      className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === 'week'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setChartPeriod('month')}
                      className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === 'month'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setChartPeriod('90days')}
                      className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === '90days'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                      }`}
                    >
                      90 days
                    </button>
                    <button
                      onClick={() => setChartPeriod('all')}
                      className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === 'all'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                      }`}
                    >
                      All Time
                    </button>
                  </div>
                </div>
                <div className="h-64 sm:h-80">
                  <WeightChart data={filteredWeights} goalWeight={goalWeight} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'glp1' && (
              <div className="space-y-3">
                <header className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,255,255,0.2)] p-4 border border-cyan-500/20">
                  <h1 className="text-2xl font-bold text-cyan-300 [text-shadow:0_0_20px_rgba(0,255,255,0.6)] mb-2">GLP-1 Tracking</h1>
                  <p className="text-sm text-cyan-200/80">Track your GLP-1 medication doses and monitor concentration levels.</p>
                </header>

                <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,255,255,0.2)] p-4 border border-cyan-500/20">
                  <h2 className="text-lg font-semibold text-cyan-300 mb-3 [text-shadow:0_0_10px_rgba(0,255,255,0.4)]">GLP-1 Progress</h2>
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