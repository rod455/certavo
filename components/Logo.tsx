import { SITE_NAME } from '@/lib/site';

/**
 * Certavo brand marks, from the official identity:
 *  - Monogram: a "C" arc hugging a check (✓) — used for the app icon/favicon.
 *  - Wordmark: lowercase "certavo" where the "v" becomes a teal check.
 * Colors come from the CSS tokens so they adapt to context.
 */

export function Monogram({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" className={className} aria-hidden>
      <path
        d="M118 38 A60 60 0 1 0 118 122"
        stroke="rgb(var(--navy))"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <path
        d="M54 82 L74 104 L112 56"
        stroke="rgb(var(--teal))"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = 'text-xl' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline font-sans font-bold tracking-tight text-navy ${className}`}
      aria-label={SITE_NAME}
    >
      <span aria-hidden>certa</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="mx-[0.01em] h-[0.66em] w-[0.66em] translate-y-[0.05em]"
        aria-hidden
      >
        <path
          d="M3 13 L10 20 L21 5"
          stroke="rgb(var(--teal))"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span aria-hidden>o</span>
    </span>
  );
}

/** Monogram + wordmark lockup for the header. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <Monogram className="h-6 w-6 sm:h-7 sm:w-7" />
      <Wordmark className="text-base sm:text-lg" />
    </span>
  );
}
