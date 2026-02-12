#!/usr/bin/env node

/**
 * MGrep Helper Script for GLPal Project
 * Usage: node mgrep.js "search term" or just mgrep.js for interactive mode
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Common search patterns for quick access
const PATTERNS = {
  weight: 'weight tracking, goal weight, weight loss, weight entry, weight chart, weight analytics',
  bmi: 'BMI calculation, body mass index, bmi category',
  tdee: 'TDEE, basal metabolic rate, calorie calculation, activity level',
  glp1: 'GLP1, medication, dose, concentration, semaglutide, tirzepatide',
  input: 'form input, input field, validation, change handler, debounce',
  state: 'useState, state management, profile, settings',
  theme: 'dark mode, theme provider, styling, tailwind',
  test: 'unit test, test coverage, jest, testing library',
  build: 'webpack, build error, compilation, typescript error',
  save: 'localStorage, database, persistence, save operation',
  unit: 'unit conversion, metric, imperial, lbs, kg, height conversion',
  component: 'src/components',
  hook: 'src/hooks',
  utils: 'src/utils',
  service: 'src/services'
};

function runMgrep(query, options = '') {
  const cmd = `mgrep ${JSON.stringify(query)} --type ts,tsx,js,jsx --context 2 --number 10 ${options}`;
  console.log(`🔍 Searching: ${query}`);
  
  try {
    const result = execSync(cmd, { encoding: 'utf8' });
    console.log(`\n${result}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log(`💡 Try: mgrep ${JSON.stringify(query)} --type ts,tsx,js,jsx --context 2 --number 10`);
  }
}

// Interactive mode
function interactiveMode() {
  console.log('🚀 GLPal MGrep Helper\n');
  console.log('Quick searches:');
  Object.entries(PATTERNS).forEach(([key, pattern]) => {
    console.log(`  ${key.padEnd(8)} → mgrep.js ${key}`);
  });
  console.log('\nExamples:');
  console.log('  mgrep.js weight     # Search weight-related code');
  console.log('  mgrep.js "goal weight"  # Search specific phrase');
  console.log('  mgrep.js --pattern    # Use raw mgrep directly');
  console.log('\nDirect mgrep examples:');
  console.log('  mgrep "useState" --type ts,tsx');
  console.log('  mgrep "input" --context 3');
  console.log('  mgrep "error" --exclude node_modules');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  interactiveMode();
} else {
  const query = args.join(' ');
  const pattern = PATTERNS[query.toLowerCase()];
  if (pattern && pattern !== query) {
    console.log(`📋 Using pattern for: ${query}`);
    runMgrep(pattern);
  } else {
    runMgrep(query);
  }
}