import { generateSimulatedData } from '../src/utils/generateData';
import { initializeDatabase } from '../src/utils/database';

// Initialize the database
initializeDatabase();
generateSimulatedData();

process.exit(0);