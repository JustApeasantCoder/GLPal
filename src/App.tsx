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

interface TabContentProps {
  children: React.ReactNode;
  isActive: boolean;
}

const TabContent: React.FC<TabContentProps> = ({ children, isActive }) => {
  return (
    <div
      className={`transition-all duration-500 ease-in-out transform ${
        isActive
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
};

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
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'weight', label: 'Weight' },
    { id: 'glp1', label: 'GLP-1' }
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0d0a15] via-[#161220] to-[#2D1B4E] animate-gradient-shift hide-scrollbar">
      {/* Fixed top navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-b border-[#B19CD9]/20 px-4 py-3 z-50 shadow-[0_4px_20px_rgba(177,156,217,0.15)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-[#B19CD9] [text-shadow:0_0_20px_rgba(177,156,217,0.5)]">GLPal</h1>
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
      <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-[#B19CD9]/20 px-4 py-2 z-50 shadow-[0_-4px_20px_rgba(177,156,217,0.15)]">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-500 ease-out transform ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_20px_rgba(177,156,217,0.4)] scale-110 translate-y-[-2px]'
                  : 'text-gray-400 hover:text-[#B19CD9] hover:bg-[#B19CD9]/20 hover:shadow-[0_0_20px_rgba(177,156,217,0.3)] hover:scale-105 hover:translate-y-[-1px]'
              }`}
            >
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main scrollable content area with padding for nav - 20:9 aspect ratio for mobile */}
      <main className="flex-1 pt-16 pb-16 overflow-y-auto hide-scrollbar relative">
        <div className="w-full max-w-md mx-auto px-4 py-2 space-y-3 md:max-w-2xl lg:max-w-4xl relative">
          <TabContent isActive={activeTab === 'dashboard'}>
            <>
               {/* Unified Dashboard Card */}
               <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
                 <h1 className="text-2xl font-bold text-[#B19CD9] [text-shadow:0_0_20px_rgba(177,156,217,0.6)] mb-4">Dashboard</h1>
                 
                 {/* Metrics Section */}
                 <div className="space-y-3 mb-6">
                    {/* Row 1: Current, BMI, Total Loss */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Current</p>
                        <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">{currentWeight.toFixed(1)} kg</p>
                      </div>
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">BMI</p>
                        <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">{bmi.toFixed(1)}</p>
                      </div>
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm px-2 py-1 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Total Loss</p>
                        <p className="text-base font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)] leading-tight">
                          {totalLoss.toFixed(1)} kg <span className="text-xs text-[#B19CD9]/80 -mt-1 inline-block">({totalLossPercentage.toFixed(1)}%)</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Row 2: Weekly Avg, Monthly Avg, To Lose */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Weekly Avg</p>
                        <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                          {weeklyAverageLoss > 0 ? '-' : ''}{weeklyAverageLoss.toFixed(1)} kg
                        </p>
                      </div>
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Monthly Avg</p>
                        <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                          {monthlyAverageLoss > 0 ? '-' : ''}{monthlyAverageLoss.toFixed(1)} kg
                        </p>
                      </div>
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">To Lose</p>
                        <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                          {(currentWeight - goalWeight).toFixed(1)} kg
                        </p>
                      </div>
                    </div>
                 </div>

                 {/* Charts Section */}
                 <div className="space-y-6">
                    {/* Weight Trends */}
                    <div>
                        <div className="flex justify-center mb-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setChartPeriod('week')}
                            className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === 'week'
                                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                            }`}
                          >
                            Week
                          </button>
                          <button
                            onClick={() => setChartPeriod('month')}
                            className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === 'month'
                                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                            }`}
                          >
                            Month
                          </button>
                          <button
                            onClick={() => setChartPeriod('90days')}
                            className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === '90days'
                                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                            }`}
                          >
                            90 days
                          </button>
                          <button
                            onClick={() => setChartPeriod('all')}
                            className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                              chartPeriod === 'all'
                                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
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
                     {/*<h3 className="text-sm font-medium text-[#4ADEA8] mb-3 [text-shadow:0_0_10px_rgba(74,222,168,0.4)]">GLP-1 Status</h3>*/}
                     <div className="h-32 sm:h-40">
                       <GLP1Chart data={glp1Entries} />
                     </div>
                   </div>
                 </div>
               </div>

{/* Metabolic Profile */}
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
                  <TDEEDisplay profile={profile} currentWeight={currentWeight} />
                </div>

                {/* Additional Metric Cards */}
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
                  <h4 className="font-medium text-[#B19CD9] mb-3 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Performance Metrics</h4>
                  <div className="space-y-3">
                    {/* Performance Overview Row */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Progress Rate</p>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                            {((totalLoss / (startWeight - goalWeight)) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-[#B19CD9]/80">to goal</p>
                        </div>
                      </div>
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Time Active</p>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                            {filteredWeights.length} days
                          </p>
                          <p className="text-xs text-[#B19CD9]/80">tracking</p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Stats Row */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Start Weight</p>
                        <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">{startWeight.toFixed(1)} kg</p>
                        <p className="text-xs text-[#B19CD9]/80">{new Date(weights[0]?.date).toLocaleDateString()}</p>
                      </div>
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Best Week</p>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                            -{Math.max(...weights.map((w, i) => i > 0 ? weights[i - 1].weight - w.weight : 0)).toFixed(1)} kg
                          </p>
                          <p className="text-xs text-[#B19CD9]/80">loss</p>
                        </div>
                      </div>
                      <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
                        <p className="text-xs text-[#B19CD9] font-medium">Worst Week</p>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                            +{Math.max(...weights.map((w, i) => i > 0 ? w.weight - weights[i - 1].weight : 0)).toFixed(1)} kg
                          </p>
                          <p className="text-xs text-[#B19CD9]/80">gain</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </>
          </TabContent>

          <TabContent isActive={activeTab === 'weight'}>
            <>
              <header className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
                <h1 className="text-2xl font-bold text-[#B19CD9] [text-shadow:0_0_20px_rgba(177,156,217,0.6)] mb-3">Weight Tracking</h1>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_20px_rgba(177,156,217,0.3)]">
                    <p className="text-xs text-[#B19CD9] font-medium">Current</p>
                    <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(177,156,217,0.5)]">{currentWeight.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#5B4B8A]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#5B4B8A]/30 shadow-[0_0_20px_rgba(91,75,138,0.3)]">
                    <p className="text-xs text-[#9C7BD3] font-medium">Goal</p>
                    <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(156,123,211,0.5)]">{goalWeight} kg</p>
                  </div>
                </div>
              </header>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
                <h3 className="text-sm font-semibold text-[#B19CD9] mb-3 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Add Today's Weight</h3>
                <WeightInput onAddWeight={handleAddWeight} />
              </div>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
                  <div className="flex justify-center mb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartPeriod('week')}
                      className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === 'week'
                          ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                          : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setChartPeriod('month')}
                      className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === 'month'
                          ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                          : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setChartPeriod('90days')}
                      className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === '90days'
                          ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                          : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                      }`}
                    >
                      90 days
                    </button>
                    <button
                      onClick={() => setChartPeriod('all')}
                      className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                        chartPeriod === 'all'
                          ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                          : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
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
          </TabContent>

          <TabContent isActive={activeTab === 'glp1'}>
            <>
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
            </>
          </TabContent>
        </div>
      </main>
    </div>
  );
}

export default App;