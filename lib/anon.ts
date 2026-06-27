'use client';

/**
 * Anonymous identity + local progress cache.
 *
 * localStorage is used ONLY for the anonymous player's own progress/streak and
 * a "already played today" lock — never as the source of truth for ranking,
 * which is validated and stored server-side.
 */
const ANON_KEY = 'certavo:anon-id';
const NICK_KEY = 'certavo:nick';
const DAILY_DONE_PREFIX = 'certavo:daily-done:';
const FINAL_DONE_PREFIX = 'certavo:final-done:';

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

export function getNick(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(NICK_KEY) ?? '';
}

export function setNick(nick: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NICK_KEY, nick.slice(0, 24));
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

/**
 * The knockout Final is a one-shot game (one attempt per theme — that's how the
 * bracket reads the result). We lock it locally so the player can't replay it.
 */
export function hasPlayedFinal(theme: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(FINAL_DONE_PREFIX + theme) !== null;
}

export function markFinalPlayed(theme: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FINAL_DONE_PREFIX + theme, '1');
}
