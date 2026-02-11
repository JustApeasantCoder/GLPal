import { generateSimulatedData } from '../src/utils/generateData';
import { initializeDatabase } from '../src/utils/database';

// Initialize the database
initializeDatabase();
generateSimulatedData();

console.log('Database initialization complete!');
process.exit(0);