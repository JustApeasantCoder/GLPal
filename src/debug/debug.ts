export const isDevMode = import.meta.env.DEV || process.env.NODE_ENV === 'development';

export const debug = {
  log: (...args: unknown[]) => {
    if (isDevMode) {
      console.log('[DEBUG]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevMode) {
      console.warn('[DEBUG]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevMode) {
      console.error('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevMode) {
      console.info('[DEBUG]', ...args);
    }
  },
};

export const devOnly = (component: React.ReactNode): React.ReactNode => {
  if (isDevMode) {
    return component;
  }
  return null;
};

export const ifDev = <T,>(fn: () => T): T | undefined => {
  if (isDevMode) {
    return fn();
  }
  return undefined;
};

export const ifDevFn = <T,>(fn: () => T): (() => T | undefined) => {
  return () => {
    if (isDevMode) {
      return fn();
    }
    return undefined;
  };
};
