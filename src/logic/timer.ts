const URGENT_SECONDS = 15;

export function remainingSeconds(endAt: number, now: number): number {
  return Math.max(0, (endAt - now) / 1000);
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function isUrgent(seconds: number): boolean {
  return seconds > 0 && Math.ceil(seconds) < URGENT_SECONDS;
}

export function timerPercent(seconds: number, startingTime: number): number {
  if (startingTime <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (seconds / startingTime) * 100));
}
