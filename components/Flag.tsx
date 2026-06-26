import { hasFlag } from 'country-flag-icons';

/** Convert an ISO 3166-1 alpha-2 code to its emoji flag (fallback). */
export function flagEmoji(code: string): string {
  const cc = code.toUpperCase();
  if (cc.length !== 2) return '🏳️';
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)),
  );
}

/**
 * Renders a flag as a static, lazy-loaded SVG image from /public/flags. This
 * keeps every flag out of the JS bundle (only the visible ones are fetched),
 * which makes the game pages much lighter than bundling ~250 flag components.
 */
export function Flag({
  code,
  className = '',
  title,
}: {
  code: string;
  className?: string;
  title?: string;
}) {
  const cc = code.toUpperCase();
  if (hasFlag(cc)) {
    return (
      <span
        className={`block overflow-hidden rounded-md border-2 border-navy/15 shadow-sm ${className}`}
        role="img"
        aria-label={title ?? cc}
      >
        <img
          src={`/flags/${cc}.svg`}
          alt={title ?? cc}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className={`text-6xl ${className}`} role="img" aria-label={title ?? cc}>
      {flagEmoji(cc)}
    </span>
  );
}
