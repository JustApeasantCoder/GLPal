const { generateSimulatedData } = require('./dist/src/utils/generateData');

// Generate the simulated data
generateSimulatedData();

console.log('Database initialization complete!');
process.exit(0);