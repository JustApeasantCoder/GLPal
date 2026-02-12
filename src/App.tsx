import React, { useState, useEffect, useCallback } from 'react';
import SettingsMenu from './components/SettingsMenu';
import Dashboard from './components/Dashboard';
import WeightTab from './components/WeightTab';
import GLP1Tab from './components/GLP1Tab';
import DosageTab from './components/DosageTab';
import Navigation from './components/Navigation';
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

type TabType = 'dashboard' | 'weight' | 'glp1' | 'dosage';

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
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [glp1Entries, setGLP1Entries] = useState<GLP1Entry[]>([]);
  
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
        const existingGLP1 = getGLP1Entries();
        const existingProfile = getUserProfile();
        
        // If no data exists, generate simulated data
        if (existingWeights.length === 0) {
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

// Use goal weight from profile with fallback
  const goalWeight = profile.goalWeight || 80;



return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gradient-start via-gradient-mid to-gradient-end animate-gradient-shift hide-scrollbar">
      {/* Fixed top navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-card-bg backdrop-blur-xl border-b border-card-border px-4 py-3 z-50 shadow-theme">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-text-primary" style={{ textShadow: isDarkMode ? '0 0 20px rgba(177,156,217,0.5)' : '0 0 20px rgba(45,27,78,0.3)' }}>GLPal</h1>
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
      </nav>

      {/* Fixed bottom navigation */}
      <Navigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main scrollable content area with padding for nav - 20:9 aspect ratio for mobile */}
      <main className="flex-1 pt-16 pb-16 overflow-y-auto hide-scrollbar relative">
        <div className="w-full max-w-md mx-auto px-4 py-2 space-y-3 md:max-w-2xl lg:max-w-4xl relative">
          <TabContent isActive={activeTab === 'dashboard'}>
            <Dashboard
              weights={weights}
              glp1Entries={glp1Entries}
              profile={profile}
              goalWeight={goalWeight}
              onAddWeight={handleAddWeight}
            />
          </TabContent>

          <TabContent isActive={activeTab === 'weight'}>
            <WeightTab
              weights={weights}
              profile={profile}
              onAddWeight={handleAddWeight}
            />
          </TabContent>

          <TabContent isActive={activeTab === 'glp1'}>
            <GLP1Tab glp1Entries={glp1Entries} />
          </TabContent>

          <TabContent isActive={activeTab === 'dosage'}>
            <DosageTab />
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