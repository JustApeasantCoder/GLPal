import React, { useState, useEffect, useCallback } from 'react';
import SettingsMenu from './features/dashboard/components/SettingsMenu';
import Dashboard from './features/dashboard/Dashboard';
import MedicationTab from './features/medication/MedicationTab';
import DosageCalculatorTab from './features/medication/DosageCalculatorTab';
import Navigation from './shared/components/Navigation';
import { useTheme } from './contexts/ThemeContext';
import { WeightEntry, GLP1Entry, UserProfile } from './types';
import { ChartPeriod, useTime } from './shared/hooks';
import { 
  initializeDatabase, 
  getWeightEntries, 
  getAllGLP1Entries, 
  getMedicationEntries,
  getUserProfile, 
  addWeightEntry, 
  addGLP1ManualEntry,
  saveUserProfile,
  clearAllData
} from './shared/utils/database';
import { initializeSampleWeightData } from './shared/utils/sampleData';
import { timeService } from './core/timeService';
import LogTab from './features/medication/LogTab';

type TabType = 'dashboard' | 'doses' | 'dosage' | 'log';

interface TabContentProps {
  children: React.ReactNode;
  isActive: boolean;
}

const TabContent: React.FC<TabContentProps> = ({ children, isActive }) => {
  if (!isActive) return null;
  
  return (
    <div className="tab-fade-in">
      {children}
    </div>
  );
};

function App() {
  const { isDarkMode, toggleTheme } = useTheme();
  const now = useTime(1000);
const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('90days');
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [dosesEntries, setDosesEntries] = useState<GLP1Entry[]>([]);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  
  const [profile, setProfile] = useState<UserProfile>({
    age: 35,
    gender: 'male',
    height: 180,
    activityLevel: 1.2,
    unitSystem: 'metric',
  });

  // Save profile immediately for responsive input experience
  const handleSave = useCallback((newProfile: UserProfile) => {
    saveUserProfile(newProfile);
  }, []);

  // Initialize database and load data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initializeApp = () => {
try {
        initializeDatabase();
        
        // Load existing data
        const existingWeights = getWeightEntries();
        const existingGLP1 = getMedicationEntries();
        const existingProfile = getUserProfile();
        
        // If no data exists, generate sample data
        if (existingWeights.length === 0) {
          initializeSampleWeightData();
          
          // Reload after generation
          const generatedWeights = getWeightEntries();
          const generatedGLP1 = getMedicationEntries();
          setWeights(generatedWeights);
          setDosesEntries(generatedGLP1);
        } else {
          setWeights(existingWeights);
          setDosesEntries(existingGLP1);
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
    const today = timeService.nowDate().toISOString().split('T')[0];
    const newEntry = { date: today, weight: newWeight };
    
    // Save to database
    addWeightEntry(newEntry);
    
    // Update state
    setWeights(prev => [...prev, newEntry]);
  };

  const handleAddDose = (dose: number, medication: string, date: string) => {
    const newEntry = { 
      date, 
      medication, 
      dose, 
      halfLifeHours: 144 
    };
    
    // Save to database (manual entry)
    addGLP1ManualEntry(newEntry);
    
    // Reload generated entries for chart (manual entries go to Log tab)
    const generatedEntries = getMedicationEntries();
    setDosesEntries(generatedEntries);
  };

  const handleRefreshDoses = useCallback(() => {
    const entries = getMedicationEntries();
    setDosesEntries(entries);
  }, []);

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      clearAllData();
      setWeights([]);
      setDosesEntries([]);
      window.location.reload();
    }
  };

// Use goal weight from profile with fallback
  const goalWeight = profile.goalWeight || 80;



return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gradient-start via-gradient-mid to-gradient-end animate-gradient-shift hide-scrollbar">
      {/* Fixed top navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-card-bg backdrop-blur-xl border-b border-card-border px-4 py-3 z-50 shadow-theme">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2" style={{ textShadow: isDarkMode ? '0 0 20px rgba(177,156,217,0.5)' : '0 0 20px rgba(45,27,78,0.3)' }}>
            GLPal
            <span className="text-sm font-normal text-text-muted">
              {new Date(now).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearData}
              className="p-2 rounded-xl hover:bg-red-500/20 transition-all duration-300"
              aria-label="Delete all data"
              title="Delete all data"
            >
              <svg
                className="w-5 h-5 text-text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                timeService.travelDays(1 / 24);
              }}
              className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
              aria-label="Speed up 1 hour"
              title="+1 Hour"
            >
              <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
<button
              onClick={() => {
                timeService.travelDays(-1);
              }}
              className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
              aria-label="Go back 1 day"
              title="-1 Day"
            >
              <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => {
                timeService.travelDays(1);
              }}
              className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
              aria-label="Speed up 1 day"
              title="+1 Day"
            >
              <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => {
                timeService.reset();
                window.location.reload();
              }}
              className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
              aria-label="Reset dose simulation"
              title="Reset"
            >
              <svg
                className="w-5 h-5 text-text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300 hover:shadow-theme"
              aria-label="Settings"
            >
              <svg
                className="w-6 h-6 text-text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.3)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Fixed bottom navigation */}
      <Navigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main scrollable content area with padding for nav - 20:9 aspect ratio for mobile */}
      <main className="flex-1 pt-16 pb-16 overflow-y-auto hide-scrollbar relative">
        <div className="w-full px-4 py-2 space-y-3 md:px-6 lg:px-8 relative">
          <TabContent isActive={activeTab === 'dashboard'}>
            <div className="max-w-md mx-auto">
              <Dashboard
                weights={weights}
                dosesEntries={dosesEntries}
                profile={profile}
                goalWeight={goalWeight}
                onAddWeight={handleAddWeight}
                chartPeriod={chartPeriod}
                onChartPeriodChange={setChartPeriod}
              />
            </div>
          </TabContent>



          <TabContent isActive={activeTab === 'doses'}>
            <div className="max-w-md mx-auto">
              <MedicationTab 
                medicationEntries={dosesEntries} 
                onAddMedication={handleAddDose}
                onRefreshMedications={handleRefreshDoses}
                onLogDose={() => setLogRefreshKey(k => k + 1)}
                chartPeriod={chartPeriod}
                onChartPeriodChange={setChartPeriod}
              />
            </div>
          </TabContent>


          <TabContent isActive={activeTab === 'dosage'}>
            <div className="max-w-md mx-auto">
              <DosageCalculatorTab />
            </div>
          </TabContent>
          <TabContent isActive={activeTab === 'log'}>
            <div className="max-w-md mx-auto">
              <LogTab refreshKey={logRefreshKey} />
            </div>
          </TabContent>
        </div>
      </main>

      <SettingsMenu
        profile={profile}
        onProfileUpdate={useCallback((newProfile: UserProfile) => {
          // Update UI state immediately for responsive experience
          setProfile(newProfile);
          
          // Save immediately for responsive input
          handleSave(newProfile);
        }, [handleSave])}
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;