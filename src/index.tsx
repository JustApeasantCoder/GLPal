import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './shared/components/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

const isElectron = window.navigator.userAgent.includes('Electron');

if (!isElectron) {
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      console.log('New version available, refreshing...');
      window.location.reload();
    },
  });
}

reportWebVitals();
