import * as Flags from 'country-flag-icons/react/3x2';
import { hasFlag } from 'country-flag-icons';

/** Convert an ISO 3166-1 alpha-2 code to its emoji flag (fallback). */
export function flagEmoji(code: string): string {
  const cc = code.toUpperCase();
  if (cc.length !== 2) return '🏳️';
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)),
  );
}

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
  const Svg = (Flags as Record<string, React.ComponentType<{ title?: string }>>)[
    cc
  ];
  if (Svg && hasFlag(cc)) {
    return (
      <span
        className={`block overflow-hidden rounded-md border-2 border-navy/15 shadow-sm ${className}`}
        role="img"
        aria-label={title ?? cc}
      >
        <Svg title={title ?? cc} />
      </span>
    );
  }
  return (
    <span className={`text-6xl ${className}`} role="img" aria-label={title ?? cc}>
      {flagEmoji(cc)}
    </span>
  );
}
