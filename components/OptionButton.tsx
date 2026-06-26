'use client';

import { Flag } from './Flag';

export type OptionState = 'idle' | 'correct' | 'wrong' | 'reveal' | 'disabled';

export function OptionButton({
  label,
  flagCode,
  hideLabel = false,
  state = 'idle',
  onClick,
  index,
}: {
  label: string;
  flagCode?: string | null;
  hideLabel?: boolean;
  state?: OptionState;
  onClick?: () => void;
  index: number;
}) {
  const base =
    'btn w-full justify-start text-left border-2 font-semibold transition-all';
  const byState: Record<OptionState, string> = {
    idle: 'bg-paper text-navy shadow-tactile hover:-translate-y-[1px]',
    correct: 'bg-emerald text-paper border-emerald shadow-none animate-pop',
    wrong: 'bg-error text-paper border-error shadow-none animate-shake',
    reveal: 'bg-emerald/15 text-navy border-emerald',
    disabled: 'bg-paper text-navy/50 shadow-none',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'disabled' || state === 'correct' || state === 'wrong'}
      aria-label={label}
      className={`${base} ${byState[state]}`}
    >
      <span
        aria-hidden
        className="mr-1 font-mono text-xs opacity-60"
      >{String.fromCharCode(65 + index)}</span>
      {flagCode ? (
        <Flag
          code={flagCode}
          className={hideLabel ? 'h-9 w-14 shrink-0' : 'h-7 w-10 shrink-0'}
          title={label}
        />
      ) : null}
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </button>
  );
}
