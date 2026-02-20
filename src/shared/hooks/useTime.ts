import { useState, useEffect } from 'react';
import { timeService } from '../../core/timeService';

export const useTime = (intervalMs = 1000, resetKey?: number) => {
  const [time, setTime] = useState(timeService.now());

  useEffect(() => {
    timeService.initialize();
    
    const timer = setInterval(() => {
      setTime(timeService.now());
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [intervalMs, resetKey]);

  return time;
};
