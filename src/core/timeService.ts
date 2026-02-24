class TimeService {
  private offset = 0;
  private isSimulationMode = false;

  now(): number {
    return Date.now() + this.offset;
  }

  nowDate(): Date {
    return new Date(this.now());
  }

  toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  todayString(): string {
    return this.toLocalDateString(this.nowDate());
  }

  toLocalISOString(date: Date): string {
    return date.toISOString();
  }

  todayISOString(): string {
    return this.nowDate().toISOString();
  }

  getLocalISODateString(): string {
    const now = this.nowDate();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  isToday(date: Date): boolean {
    return this.isSameDay(date, this.nowDate());
  }

  travelToDate(date: Date): void {
    this.offset = date.getTime() - Date.now();
    this.isSimulationMode = true;
    this.persist();
  }

  travelDays(days: number): void {
    this.offset += days * 24 * 60 * 60 * 1000;
    this.isSimulationMode = true;
    this.persist();
  }

  fastForward(ms: number): void {
    this.offset += ms;
    this.isSimulationMode = true;
    this.persist();
  }

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

  initialize(): void {
    const stored = localStorage.getItem('glpal_sim_offset');
    if (stored) {
      this.isSimulationMode = true;
      this.offset = parseInt(stored);
    }
  }

  persist(): void {
    if (this.isSimulationMode) {
      localStorage.setItem('glpal_sim_offset', this.offset.toString());
    }
  }

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  getDaysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
  }
}

export const timeService = new TimeService();
