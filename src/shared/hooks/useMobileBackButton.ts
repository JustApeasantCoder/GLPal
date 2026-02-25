import { useEffect, useCallback, useRef } from 'react';
import { App } from '@capacitor/app';

type BackHandler = () => boolean;

export function useMobileBackButton(onBack: BackHandler) {
  const handlerRef = useRef<BackHandler>(onBack);
  handlerRef.current = onBack;

  useEffect(() => {
    let isHandled = false;

    const handleCapacitorBack = async () => {
      const result = handlerRef.current();
      if (!result) {
        await App.exitApp();
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (isHandled) {
        isHandled = false;
        return;
      }

      const result = handlerRef.current();
      if (!result) {
        return;
      }

      event.preventDefault();
      isHandled = true;
      window.history.pushState(null, '', window.location.href);
    };

    const init = async () => {
      try {
        await App.addListener('backButton', handleCapacitorBack);
      } catch (e) {
        console.log('Capacitor App not available, using browser fallback');
      }
    };

    init();

    window.addEventListener('popstate', handlePopState, { passive: false });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      App.removeAllListeners();
    };
  }, []);
}

export function usePreventBackNavigation(enabled: boolean) {
  const preventBack = useCallback(() => {
    if (enabled) {
      window.history.pushState(null, '', window.location.href);
      return true;
    }
    return false;
  }, [enabled]);

  useMobileBackButton(preventBack);
}
