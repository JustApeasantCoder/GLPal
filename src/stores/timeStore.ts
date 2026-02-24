import { create } from 'zustand';
import { timeService } from '../core/timeService';

interface TimeState {
  time: number;
  timeResetKey: number;
  startTicking: () => void;
  stopTicking: () => void;
  resetTime: () => void;
  travelDays: (days: number) => void;
  nowDate: () => Date;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export const useTimeStore = create<TimeState>((set, get) => {
  timeService.initialize();

  return {
    time: timeService.now(),
    timeResetKey: 0,

    startTicking: () => {
      if (intervalId) return;
      
      intervalId = setInterval(() => {
        set({ time: timeService.now() });
      }, 1000);
    },

    stopTicking: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    resetTime: () => {
      timeService.reset();
      set({ time: timeService.now(), timeResetKey: get().timeResetKey + 1 });
    },

    travelDays: (days: number) => {
      timeService.travelDays(days);
      set({ time: timeService.now(), timeResetKey: get().timeResetKey + 1 });
    },

    nowDate: () => timeService.nowDate(),
  };
});
