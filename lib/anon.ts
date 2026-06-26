'use client';

/**
 * Anonymous identity + local progress cache.
 *
 * localStorage is used ONLY for the anonymous player's own progress/streak and
 * a "already played today" lock — never as the source of truth for ranking,
 * which is validated and stored server-side.
 */
const ANON_KEY = 'certavo:anon-id';
const DAILY_DONE_PREFIX = 'certavo:daily-done:';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `anon-${Math.abs(Date.now() ^ (performance.now() | 0)).toString(36)}`;
}

export function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(ANON_KEY);
  if (!id) {
    id = uuid();
    window.localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export function hasPlayedDaily(date: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DAILY_DONE_PREFIX + date) !== null;
}

export function markDailyPlayed(date: string, summary: unknown): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DAILY_DONE_PREFIX + date, JSON.stringify(summary));
}

export function getDailyResult<T = unknown>(date: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(DAILY_DONE_PREFIX + date);
  return raw ? (JSON.parse(raw) as T) : null;
}
