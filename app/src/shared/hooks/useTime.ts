import { useEffect } from 'react';
import { useTimeStore } from '../../stores/timeStore';

export const useTime = () => {
  const { time, startTicking, stopTicking } = useTimeStore();

  useEffect(() => {
    startTicking();
    return () => stopTicking();
  }, []);

  return time;
};
