# GLPal – Privacy-First GLP-1 & Weight Tracking App

GLPal is a modern, privacy-focused health tracking app designed for **weight management, GLP-1 medication monitoring, peptide logging, and metabolic health tracking** — with all data stored locally on your device.

No accounts.  
No subscriptions.  
No ads.  
No tracking.  

Just you and your data.

---

## Why GLPal?

Unlike cloud-based health tracking apps, GLPal keeps **100% of your data stored locally on your device**.

- No sign-ups  
- No hidden data collection  
- No external analytics  
- No cloud storage  
- No paywalls  

Your health information never leaves your computer.

GLPal is built for users who value **privacy, control, and simplicity** — without sacrificing powerful tracking and visualization tools.

---

## Core Features

### 📊 Weight Tracking
- Log daily weight entries
- Set weight goals
- Track macronutrients
- Interactive progress charts
- Long-term trend analysis

A clean and efficient **weight tracking app** for consistent progress monitoring.

---

### 💉 GLP-1 Medication Tracking
- Log medication doses
- Track injection sites
- Record pain levels
- Monitor injection site reactions (ISR)
- Track side effects
- Visualize concentration curves
- Create customizable dosing protocols

Structured and organized **GLP-1 medication tracking** in one dashboard.

---

### 🧬 Peptide Tracking
- Log peptide injections
- Track dosing history
- Manage custom protocols
- Supports common peptides:
  - BPC-157
  - TB-500
  - CJC-1295
  - Ipamorelin
  - And more

A privacy-focused peptide logging system.

---

### 🧮 Peptide Calculator
- Calculate peptide doses
- Reconstitute solutions
- Adjust dosage based on concentration
- Flexible protocol adjustments

A built-in **peptide calculator** for precise planning.

---

### 📈 Metabolic Dashboard
- Real-time health metrics
- Mobile-first interface
- Fast data entry
- Visual trend insights

---

### 🔄 Import & Export
- Backup your data to a file
- Restore anytime
- Full ownership of your records

Your data stays portable — and stays yours.

---

### ⚙ Protocol Management
- Create medication protocols
- Customize dosing schedules
- Set frequency and duration
- Modify active plans anytime

---

## Privacy & Data Storage

All data is stored locally using `localStorage`.

GLPal does **not** use:
- Cloud databases  
- External APIs  
- Third-party analytics  
- Tracking scripts  

Your health information remains on your device at all times.

Stored data keys:

- `glpal_weight_entries`
- `glpal_medication_entries`
- `glpal_medication_manual_entries`
- `glpal_medication_protocol`
- `glpal_user_profile`

---

## Tech Stack

- React 19 + TypeScript  
- Tailwind CSS  
- ECharts  
- Electron (desktop support)  
- localStorage (data persistence)  
- Jest + React Testing Library  

---

## Quick Start

```bash
npm install
npm start              # React development server
npm run electron-dev   # Launch desktop app
npm test               # Run tests


## Available Commands

| Command | Description |
|---------|-------------|
| npm start | Start React dev server |
| npm run electron-dev | Electron with hot reload |
| npm run build | Production build |
| npm run electron-pack | Build + package Electron app |
| npm test | Run tests (watch mode) |
| npm test -- --watchAll=false | Single test run |

## Project Structure

```
src/
├── components/
├── contexts/
├── hooks/
├── services/
├── utils/
├── constants/
├── styles/
├── types.ts
└── App.tsx
```

Structured, modular, and maintainable.

## Who Is GLPal For?

Individuals using GLP-1 medications

Users managing peptide protocols

People focused on weight management

Privacy-conscious users who prefer offline tools

Anyone wanting a simple local health tracker

## Support

GLPal is completely free and built independently.

If you find it useful, your support helps fund development and future platform distribution.

☕ Buy me a coffee:
https://ko-fi.com/justapeasantcoder

## Disclaimer

GLPal is a personal health tracking tool intended for informational purposes only. The data and calculations provided by this application are not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making any changes to your medication, diet, or exercise routine. Never disregard professional medical advice or delay seeking it because of something you have tracked in this app.