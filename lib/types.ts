import { locales } from '@/i18n/locales';

export type Lang = (typeof locales)[number];

export type MediaType = 'none' | 'flag' | 'image' | 'emoji';

/**
 * The single, theme-agnostic question shape. The game engine renders any
 * question from this format and never needs to know the theme. Adding a new
 * theme means adding data, never touching the engine.
 */
export type Question = {
  id: string;
  pack_id: string;
  media_type: MediaType;
  media_value: string | null; // ISO code "BR", image URL, or emoji
  prompt: Record<string, string>; // { pt, en, es }
  options: Record<string, string[]>; // 4 options per language
  correct_index: number; // 0..3
  difficulty: 1 | 2 | 3;
  /**
   * Optional per-option media, so options themselves can be visual (e.g. pick
   * the correct flag). Generic on purpose — the engine renders it without
   * knowing the theme. `values[i]` pairs with `options[lang][i]`.
   */
  option_media?: { type: MediaType; values: (string | null)[] } | null;
};

export type GameMode = 'daily' | 'time_attack' | 'sudden_death' | 'final';

export type ThemeSlug = 'flags' | 'sports' | (string & {});

/** One answered question, used for the shareable grid and server validation. */
export type AnswerRecord = {
  questionId: string;
  chosenIndex: number;
  correct: boolean;
  msTaken: number;
};

export type GameResult = {
  mode: GameMode;
  themeSlug: ThemeSlug;
  score: number;
  correctCount: number;
  total: number;
  streak: number;
  answers: AnswerRecord[];
  durationMs: number; // wall-clock play time
  challengeDate?: string; // YYYY-MM-DD (daily only)
  challengeNumber?: number; // daily only
  challengeName?: string; // localized edition name (daily only)
};
