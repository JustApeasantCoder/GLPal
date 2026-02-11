import { addWeightEntry, addGLP1Entry, initializeDatabase, getUserProfile, saveUserProfile } from './database';

// Generate 90 days of weight data from 103kg to 85kg
export const generateSimulatedData = (): void => {
  initializeDatabase();
  
  // Set up a default user profile if none exists
  let profile = getUserProfile();
  if (!profile) {
    profile = {
      age: 35,
      gender: 'male',
      height: 180, // cm
      activityLevel: 1.5 // moderate activity
    };
    saveUserProfile(profile);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 89); // 90 days ago

  const startWeight = 103; // kg
  const endWeight = 85; // kg
  const totalWeightLoss = startWeight - endWeight;
  const days = 90;

  // Generate weight entries with realistic fluctuations
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Base weight with linear progression
    const baseWeight = startWeight - (totalWeightLoss * (i / days));
    
    // Add realistic fluctuations (±0.3kg)
    const fluctuation = (Math.random() - 0.5) * 0.6;
    
    // Add weekly pattern (slightly higher on weekends)
    const dayOfWeek = currentDate.getDay();
    const weekendAdjustment = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.2 : 0;
    
    // Add occasional plateaus (every 3-4 weeks)
    const isPlateauDay = i > 0 && i % 25 === 0 && i < days - 5;
    const plateauAdjustment = isPlateauDay ? 0.3 : 0;
    
    const finalWeight = Math.round((baseWeight + fluctuation + weekendAdjustment - plateauAdjustment) * 100) / 100;
    
    const dateString = currentDate.toISOString().split('T')[0];
    addWeightEntry({
      date: dateString,
      weight: finalWeight
    });
  }

  // Generate some GLP-1 medication entries
  const medications = [
    { name: 'Semaglutide', dose: 1.0, halfLife: 168 }, // 7 days
    { name: 'Liraglutide', dose: 1.8, halfLife: 13 }, // 13 hours
    { name: 'Tirzepatide', dose: 15.0, halfLife: 117 } // 5 days
  ];

  // Add a few sample medication entries
  const medicationDates = [
    startDate.getTime() + (30 * 24 * 60 * 60 * 1000), // Day 30
    startDate.getTime() + (60 * 24 * 60 * 60 * 1000), // Day 60
  ];

  medicationDates.forEach((timestamp, index) => {
    const medDate = new Date(timestamp);
    const dateString = medDate.toISOString().split('T')[0];
    const medication = medications[index % medications.length];
    
    addGLP1Entry({
      date: dateString,
      medication: medication.name,
      dose: medication.dose,
      halfLifeHours: medication.halfLife
    });
  });

  console.log('Generated 90 days of simulated weight data (103kg to 85kg)');
  console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`);
  console.log(`Sample GLP-1 entries added: ${medicationDates.length}`);
};