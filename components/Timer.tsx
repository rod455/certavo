'use client';

export function Timer({
  msLeft,
  totalMs,
}: {
  msLeft: number;
  totalMs: number;
}) {
  const pct = Math.max(0, Math.min(100, (msLeft / totalMs) * 100));
  const seconds = (msLeft / 1000).toFixed(1);
  const low = msLeft < 10_000;
  return (
    <div className="w-full" aria-live="off">
      <div className="mb-1 flex items-center justify-between font-mono text-sm">
        <span className="text-navy-soft">⏱</span>
        <span className={low ? 'text-error font-bold' : 'text-navy'}>
          {seconds}s
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${
            low ? 'bg-error' : 'bg-emerald'
          }`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalMs}
          aria-valuenow={msLeft}
        />
      </div>
    </div>
  );
}
