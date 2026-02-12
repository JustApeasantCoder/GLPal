import { addWeightEntry, addGLP1Entry, initializeDatabase, getUserProfile, saveUserProfile } from './database';

// Generate 120 days of weight data with drastic changes: 105kg → 90kg → 100kg → 80kg
export const generateSimulatedData = (): void => {
  initializeDatabase();
  
  // Set up a default user profile if none exists
  let profile = getUserProfile();
  if (!profile) {
    profile = {
      age: 35,
      gender: 'male',
      height: 180, // cm
      activityLevel: 1.2 // Sedentary
    };
    saveUserProfile(profile);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 119); // 120 days ago

  const totalDays = 120;
  
  // Define phases for dramatic weight changes
  const phases = [
    { start: 0, end: 35, startWeight: 105, endWeight: 90, description: "Initial rapid loss" },  // Days 1-35: 105→90
    { start: 35, end: 65, startWeight: 90, endWeight: 100, description: "Weight regain" },      // Days 36-65: 90→100  
    { start: 65, end: 120, startWeight: 100, endWeight: 80, description: "Final aggressive loss" } // Days 66-120: 100→80
  ];

  // Generate weight entries with dramatic fluctuations
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Determine which phase we're in
    let baseWeight = 105; // default start
    for (const phase of phases) {
      if (i >= phase.start && i <= phase.end) {
        const phaseProgress = (i - phase.start) / (phase.end - phase.start);
        baseWeight = phase.startWeight - ((phase.startWeight - phase.endWeight) * phaseProgress);
        break;
      }
    }
    
    // Add drastic fluctuations (±1.2kg) - much more dramatic
    const fluctuation = (Math.random() - 0.5) * 2.4;
    
    // Add strong weekly pattern (significantly higher on weekends, lower after weekend)
    const dayOfWeek = currentDate.getDay();
    let weekendAdjustment = 0;
    if (dayOfWeek === 0) weekendAdjustment = 1.5; // Sunday: weight gain
    else if (dayOfWeek === 1) weekendAdjustment = 0.8; // Monday: still elevated
    else if (dayOfWeek === 5) weekendAdjustment = -0.8; // Friday: pre-weekend loss
    
    // Add dramatic plateaus and spikes (every 2-3 weeks)
    let dramaticAdjustment = 0;
    if (i > 10 && i % 18 === 0) {
      dramaticAdjustment = 2.0; // Sudden weight spike
    } else if (i > 20 && i % 15 === 0) {
      dramaticAdjustment = -1.5; // Sudden weight drop
    }
    
    // Add holiday season effects (around days 30-40 and 80-90)
    if ((i >= 30 && i <= 40) || (i >= 80 && i <= 90)) {
      dramaticAdjustment += 1.2; // Holiday weight gain
    }
    
    const finalWeight = Math.round((baseWeight + fluctuation + weekendAdjustment + dramaticAdjustment) * 100) / 100;
    
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

  // Add a few sample medication entries spread across 120 days
  const medicationDates = [
    startDate.getTime() + (30 * 24 * 60 * 60 * 1000),  // Day 30
    startDate.getTime() + (60 * 24 * 60 * 60 * 1000),  // Day 60
    startDate.getTime() + (90 * 24 * 60 * 60 * 1000),  // Day 90
    startDate.getTime() + (110 * 24 * 60 * 60 * 1000), // Day 110
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
};