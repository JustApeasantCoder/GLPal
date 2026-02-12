# MGrep Setup for GLPal Project

## Quick Start
```bash
# Interactive mode (shows all patterns)
node mgrep.js

# Quick searches
node mgrep.js weight     # Weight-related code
node mgrep.js bmi       # BMI calculations  
node mgrep.js input     # Input handling
node mgrep.js theme     # Dark mode/styling
node mgrep.js test      # Testing code
```

## Direct Usage
```bash
# Search for specific terms
mgrep "useState" --type ts,tsx
mgrep "goal weight" --context 3 --number 10

# Windows users can also use
mgrep.bat weight
```

## Available Patterns
- `weight` - Weight tracking, goal weight, weight loss, weight entry, chart, analytics, lbs, kg
- `bmi` - BMI calculation, body mass index, categories, overweight, obese  
- `tdee` - Calorie calculation, metabolism, activity level, BMR, energy
- `glp1` - GLP1 medication, dose, semaglutide, tirzepatide, concentration, injection
- `input` - Form inputs, validation, change handlers, debounce
- `state` - useState, state management, profile, settings
- `theme` - Dark mode, styling, tailwind, CSS, purple theme
- `test` - Unit tests, coverage, jest, specs
- `build` - Build errors, webpack, TypeScript, compilation, lint
- `save` - localStorage, database, persistence, storage operations
- `unit` - Unit conversion, metric/imperial, height/weight conversion

## Configuration Files
- `.mgreprc` - Main configuration with search patterns
- `.mgrepignore` - Files to exclude from search

## Examples
```bash
# Find weight-related components
mgrep "weight" --type tsx

# Search for state management in utils
mgrep "useState" --path src/utils --type ts

# Find all GLP1 related code
mgrep "GLP1|medication|dose" --type ts,tsx

# Find input validation patterns
mgrep "validation|error" --context 3

# Search for performance issues
mgrep "performance|slow|optimize" --type ts,tsx,js
```