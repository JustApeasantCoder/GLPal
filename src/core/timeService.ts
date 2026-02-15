class TimeService {
  private offset = 0;
  private isSimulationMode = false;

  now(): number {
    return Date.now() + this.offset;
  }

  // Get the simulated date as a Date object
  nowDate(): Date {
    return new Date(this.now());
  }

  // Travel to a specific date (positive = future, negative = past)
  travelToDate(date: Date): void {
    this.offset = date.getTime() - Date.now();
    this.isSimulationMode = true;
    this.persist();
  }

  // Travel days forward or backward
  travelDays(days: number): void {
    this.offset += days * 24 * 60 * 60 * 1000;
    this.isSimulationMode = true;
    this.persist();
  }

  // Fast forward by ms
  fastForward(ms: number): void {
    this.offset += ms;
    this.isSimulationMode = true;
    this.persist();
  }

  // Reset to real time
  reset(): void {
    this.offset = 0;
    this.isSimulationMode = false;
    localStorage.removeItem('glpal_sim_offset');
    localStorage.removeItem('glpal_sim_start');
  }

  getOffset(): number {
    return this.offset;
  }

  isSimulating(): boolean {
    return this.isSimulationMode;
  }

  // Initialize from localStorage if exists
  initialize(): void {
    const stored = localStorage.getItem('glpal_sim_offset');
    if (stored) {
      this.isSimulationMode = true;
      this.offset = parseInt(stored);
    }
  }

  // Save current state to localStorage
  persist(): void {
    if (this.isSimulationMode) {
      localStorage.setItem('glpal_sim_offset', this.offset.toString());
    }
  }
}

export const timeService = new TimeService();
