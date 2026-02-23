import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Landing from './landing/Landing';
import { ThemeProvider } from './contexts/ThemeContext';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './shared/components/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Lightweight client-side router: root path serves Landing, "/app" serves the App SPA
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

type Route = '/' | '/app';

function determineInitialRoute(): Route {
  const path = window.location.pathname;
  const hash = window.location.hash;
  const base = import.meta.env.BASE_URL || '/';
  const normalizedPath = base === '/' ? path : path.replace(base, '');
  // If accessing /app/ path directly (not hash), show the App
  if (normalizedPath === 'app' || normalizedPath === 'app/') return '/app';
  // Support both "#/" and "#/app" styles
  if (hash.startsWith('#/app')) return '/app';
  // Default to landing
  return '/';
}

function navigateTo(path: Route) {
  // Use hash-based routing to avoid server rewrites on GH Pages
  window.location.hash = path === '/' ? '#/' : '#'+path;
  // Force a re-render by dispatching a popstate-like update
  // (hashchange will trigger the listener below in React render loop)
  // No-op here; the listener will pick up the change.
}

const RouterWrapper: React.FC = () => {
  const [route, setRoute] = React.useState<Route>(determineInitialRoute());

  React.useEffect(() => {
    const onHashChange = () => {
      setRoute(detectRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Helper to map hash to our Route type
  function detectRouteFromHash(): Route {
    const h = window.location.hash;
    if (h.startsWith('#/app')) return '/app';
    return '/';
  }

  if (route === '/') {
    return <Landing onNavigate={(p) => navigateTo(p as Route)} />;
  }
  // route === '/app'
  return <App />;
};

// Render the chosen entry point
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <RouterWrapper />
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
