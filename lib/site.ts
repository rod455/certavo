/**
 * Centralized brand / site configuration.
 *
 * The working brand is "Certavo" but it is still under trademark validation.
 * Keep every user-facing reference (manifest, OG, share text, metadata)
 * pointing at these constants so a rename is a one-file change.
 */
export const SITE_NAME = 'Certavo';
export const SITE_TAGLINE = {
  pt: 'O quiz visual de todo dia',
  en: 'The daily visual quiz',
  es: 'El quiz visual de cada día',
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://certavo.app';

/** Short share host shown in the result grid, e.g. "certavo.app/d/128". */
export const SHARE_HOST = SITE_URL.replace(/^https?:\/\//, '');

export const SITE_DESCRIPTION = {
  pt: 'Certavo é um jogo de quiz visual diário e global: bandeiras, esportes e muito mais. Jogue sem login e desafie seus amigos.',
  en: 'Certavo is a daily, global visual quiz game: flags, sports and more. Play with no login and challenge your friends.',
  es: 'Certavo es un juego de quiz visual diario y global: banderas, deportes y más. Juega sin registro y desafía a tus amigos.',
} as const;
