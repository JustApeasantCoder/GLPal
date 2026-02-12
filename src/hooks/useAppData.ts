import React, { useState, useEffect, useCallback } from 'react';
import { WeightEntry, GLP1Entry, UserProfile } from '../types';
import { 
  initializeDatabase, 
  getWeightEntries, 
  getGLP1Entries, 
  getUserProfile, 
  addWeightEntry, 
  addGLP1Entry,
  saveUserProfile 
} from '../utils/database';
import { generateSimulatedData } from '../utils/generateData';

interface AppDataContextType {
  weights: WeightEntry[];
  glp1Entries: GLP1Entry[];
  profile: UserProfile;
  addWeight: (weight: number) => void;
  addGLP1Entry: (entry: Omit<GLP1Entry, 'date'>) => void;
  updateProfile: (profile: UserProfile) => void;
  isLoading: boolean;
}

export const useAppData = (): AppDataContextType => {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [glp1Entries, setGLP1Entries] = useState<GLP1Entry[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    age: 35,
    gender: 'male',
    height: 180,
    activityLevel: 1.55,
    unitSystem: 'metric'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize database
        await initializeDatabase();
        
        // Load user profile
        const savedProfile = await getUserProfile();
        if (savedProfile) {
          setProfile(savedProfile);
        } else {
          // Save default profile if none exists
          await saveUserProfile(profile);
        }
        
        // Load existing data
        const weightData = await getWeightEntries();
        const glp1Data = await getGLP1Entries();
        
        // If no data exists, generate simulated data
        if (weightData.length === 0 && glp1Data.length === 0) {
          // Generate data directly (function operates on DB)
          generateSimulatedData();
          
          // Reload data after generation
          const newWeightData = await getWeightEntries();
          const newGLP1Data = await getGLP1Entries();
          setWeights(newWeightData);
          setGLP1Entries(newGLP1Data);
        } else {
          setWeights(weightData);
          setGLP1Entries(glp1Data);
        }
      } catch (error) {
        console.error('Error initializing app data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [profile]); // Only include profile as dependency to prevent infinite loops

  const addWeight = useCallback(async (weight: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: WeightEntry = { date: today, weight };
    
    try {
      await addWeightEntry(newEntry);
      setWeights(prev => [...prev, newEntry].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error adding weight entry:', error);
    }
  }, []);

  const addGLP1EntryFunc = useCallback(async (entry: Omit<GLP1Entry, 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: GLP1Entry = { ...entry, date: today };
    
    try {
      await addGLP1Entry(newEntry);
      setGLP1Entries(prev => [...prev, newEntry].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error adding GLP-1 entry:', error);
    }
  }, []);

  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    try {
      await saveUserProfile(newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }, []);

  return {
    weights,
    glp1Entries,
    profile,
    addWeight,
    addGLP1Entry: addGLP1EntryFunc,
    updateProfile,
    isLoading
  };
};