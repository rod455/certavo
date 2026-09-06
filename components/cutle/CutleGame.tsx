'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { whatsappLink, shareOrCopy } from '@/lib/share';
import { SITE_URL } from '@/lib/site';
import { todayUtc, challengeNumberForDate, dateForChallengeNumber } from '@/lib/daily';
import {
  EMOJIS,
  TOTAL,
  dailyIndex,
  emojiChar,
  scoreCut,
  svgPath,
  type CutScore,
} from '@/lib/cutle';

const SIZE = 320; // internal canvas resolution
const WA_GREEN = '#25D366';
const MIN_LEN = 0.12; // min drag length (fraction) to count as a cut
const ARCHIVE_START = '2026-08-01'; // first playable day in the calendar

type Pt = { x: number; y: number }; // fraction coords 0..1
type Line = { a: Pt; b: Pt };
type Mask = { mask: Uint8Array; total: number };

function lockKey(n: number) {
  return `certavo:cutle:${n}`;
}
function pad(n: number) {
  return String(n).padStart(2, '0');
}
function brShort(dateIso: string) {
  const [, m, d] = dateIso.split('-');
  return `${d}/${m}`;
}

/** Clip an infinite line (point + direction, pixel coords) to the SxS square. */
function clipLine(px: number, py: number, dx: number, dy: number): [Pt, Pt] | null {
  const cand: Pt[] = [];
  const add = (x: number, y: number) => {
    if (x >= -0.5 && x <= SIZE + 0.5 && y >= -0.5 && y <= SIZE + 0.5) cand.push({ x, y });
  };
  if (dx !== 0) for (const X of [0, SIZE]) add(X, py + ((X - px) / dx) * dy);
  if (dy !== 0) for (const Y of [0, SIZE]) add(px + ((Y - py) / dy) * dx, Y);
  const uniq = cand.filter(
    (p, i) => cand.findIndex((q) => Math.abs(q.x - p.x) < 1 && Math.abs(q.y - p.y) < 1) === i,
  );
  return uniq.length >= 2 ? [uniq[0], uniq[1]] : null;
}
function lineLen(l: Line) {
  return Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y);
}

export function CutleGame() {
  const locale = useLocale();
  const todayN = challengeNumberForDate(todayUtc());
  const startN = challengeNumberForDate(ARCHIVE_START);

  const [activeN, setActiveN] = useState(todayN);
  const [practice, setPractice] = useState(false);
  const [cp, setCp] = useState(() => EMOJIS[dailyIndex(todayN)]);
  const [line, setLine] = useState<Line | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<(CutScore & { line: Line; ref: [Pt, Pt] | null }) | null>(
    null,
  );
  const [calOpen, setCalOpen] = useState(false);
  const [played, setPlayed] = useState<Record<number, number>>({}); // challengeN -> precision

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<Mask | null>(null);

  // scan which archive days were already played (for calendar badges)
  useEffect(() => {
    const map: Record<number, number> = {};
    for (let n = startN; n <= todayN; n++) {
      try {
        const raw = window.localStorage.getItem(lockKey(n));
        if (raw) map[n] = JSON.parse(raw).precision ?? 0;
      } catch {
        /* ignore */
      }
    }
    setPlayed(map);
  }, [startN, todayN]);

  // draw + measure the emoji whenever it changes
  useEffect(() => {
    maskRef.current = null;
    let revoked = '';
    (async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      let url = svgPath(cp);
      try {
        const txt = await (await fetch(url)).text();
        const patched = txt.replace('<svg', '<svg width="300" height="300"');
        url = URL.createObjectURL(new Blob([patched], { type: 'image/svg+xml' }));
        revoked = url;
      } catch {
        /* fall back to raw path */
      }
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, SIZE, SIZE);
        const pad2 = 26;
        const box = SIZE - pad2 * 2;
        const ar = (img.width || 1) / (img.height || 1);
        let w = box,
          h = box;
        if (ar > 1) h = box / ar;
        else w = box * ar;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
        const mask = new Uint8Array(SIZE * SIZE);
        let total = 0;
        for (let i = 0; i < mask.length; i++) {
          if (data[i * 4 + 3] > 16) {
            mask[i] = 1;
            total++;
          }
        }
        maskRef.current = { mask, total };
        if (revoked) URL.revokeObjectURL(revoked);
      };
      img.src = url;
    })();
  }, [cp]);

  // restore (or clear) the stored result whenever the active day changes
  useEffect(() => {
    if (practice) return;
    try {
      const raw = window.localStorage.getItem(lockKey(activeN));
      if (raw) {
        const r = JSON.parse(raw);
        setLine(r.line);
        setResult(r);
        setDone(true);
        return;
      }
    } catch {
      /* ignore */
    }
    setLine(null);
    setResult(null);
    setDone(false);
  }, [activeN, practice]);

  function frac(clientX: number, clientY: number): Pt {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  function computeSplit(l: Line) {
    const m = maskRef.current;
    if (!m || !m.total) return { leftFraction: 0.5, ref: null as [Pt, Pt] | null };
    const Ax = l.a.x * SIZE,
      Ay = l.a.y * SIZE,
      Bx = l.b.x * SIZE,
      By = l.b.y * SIZE;
    const ex = Bx - Ax,
      ey = By - Ay;
    let pos = 0;
    const projs: number[] = [];
    const dlen = Math.hypot(ex, ey) || 1;
    const nx = -ey / dlen,
      ny = ex / dlen;
    const { mask, total } = m;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const x = i % SIZE;
      const y = (i / SIZE) | 0;
      if (ex * (y - Ay) - ey * (x - Ax) > 0) pos++;
      projs.push(x * nx + y * ny);
    }
    projs.sort((p, q) => p - q);
    const med = projs[projs.length >> 1];
    const aProj = Ax * nx + Ay * ny;
    const delta = med - aProj;
    const ref = clipLine(Ax + delta * nx, Ay + delta * ny, ex, ey);
    return { leftFraction: pos / total, ref };
  }

  function submit() {
    if (!line || lineLen(line) < MIN_LEN) return;
    const { leftFraction, ref } = computeSplit(line);
    const s = { ...scoreCut(leftFraction), line, ref };
    setResult(s);
    setDone(true);
    if (!practice) {
      try {
        window.localStorage.setItem(lockKey(activeN), JSON.stringify({ ...s, cp }));
        setPlayed((p) => ({ ...p, [activeN]: s.precision }));
      } catch {
        /* ignore */
      }
    }
  }

  function pickDay(n: number) {
    setPractice(false);
    setActiveN(n);
    setCp(EMOJIS[dailyIndex(n)]);
    setLine(null);
    setDone(false);
    setResult(null);
    setCalOpen(false);
  }

  function playPractice() {
    setPractice(true);
    setDone(false);
    setResult(null);
    setLine(null);
    setCp(EMOJIS[Math.floor(Math.random() * TOTAL)]);
  }

  const char = emojiChar(cp);
  const activeDate = dateForChallengeNumber(activeN);
  const shown = done && result ? result.line : line;
  const drawn =
    shown && lineLen(shown) > 0.001
      ? clipLine(
          shown.a.x * SIZE,
          shown.a.y * SIZE,
          (shown.b.x - shown.a.x) * SIZE,
          (shown.b.y - shown.a.y) * SIZE,
        )
      : null;

  const base = `${SITE_URL}/${locale}`;
  const shareText = result
    ? `Cutle #${activeN} 🔪 cortei o ${char} com ${result.precision}% de precisão ${'⭐'.repeat(result.stars)}. Consegue melhor?\n${base}/cutle`
    : '';
  const [copied, setCopied] = useState(false);
  function share() {
    window.open(whatsappLink(shareText), '_blank', 'noopener');
  }
  async function copy() {
    if ((await shareOrCopy(shareText)) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <header className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-navy-soft">
          Cutle · {practice ? 'treino' : `#${activeN} · ${brShort(activeDate)}`}
          {!practice && activeN === todayN ? ' · hoje' : ''}
        </p>
        <h1 className="mt-1 font-sans text-2xl font-bold">Corte no meio</h1>
        <p className="mt-1 text-sm text-navy-soft">
          Arraste o mouse (ou o dedo) pra desenhar o corte em qualquer ângulo e dividir a
          figura em duas metades de área igual (50/50).
        </p>
      </header>

      <button
        type="button"
        onClick={() => setCalOpen((v) => !v)}
        className="mx-auto font-mono text-sm text-teal underline"
      >
        📅 {calOpen ? 'fechar calendário' : 'jogar dias anteriores'}
      </button>

      {calOpen && (
        <Calendar
          startN={startN}
          todayN={todayN}
          activeN={practice ? -1 : activeN}
          played={played}
          onPick={pickDay}
        />
      )}

      <div
        ref={wrapRef}
        className="relative mx-auto aspect-square w-full max-w-[340px] touch-none select-none overflow-hidden rounded-card border-2 border-navy bg-paper-2"
        onPointerDown={(e) => {
          if (done) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          const p = frac(e.clientX, e.clientY);
          setDrawing(true);
          setLine({ a: p, b: p });
        }}
        onPointerMove={(e) => {
          if (done || !drawing) return;
          setLine((l) => (l ? { a: l.a, b: frac(e.clientX, e.clientY) } : l));
        }}
        onPointerUp={() => setDrawing(false)}
        onPointerCancel={() => setDrawing(false)}
      >
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="h-full w-full" />
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {done && result?.ref && (
            <line
              x1={result.ref[0].x}
              y1={result.ref[0].y}
              x2={result.ref[1].x}
              y2={result.ref[1].y}
              stroke="rgb(var(--error))"
              strokeWidth={2.5}
              strokeDasharray="7 6"
            />
          )}
          {drawn && (
            <>
              <line
                x1={drawn[0].x}
                y1={drawn[0].y}
                x2={drawn[1].x}
                y2={drawn[1].y}
                stroke="rgb(var(--teal))"
                strokeWidth={3}
              />
              {shown && (
                <>
                  <circle cx={shown.a.x * SIZE} cy={shown.a.y * SIZE} r={7} fill="rgb(var(--teal))" />
                  <circle cx={shown.b.x * SIZE} cy={shown.b.y * SIZE} r={7} fill="rgb(var(--teal))" />
                </>
              )}
            </>
          )}
        </svg>
        {!line && !done && (
          <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-xs text-navy-soft">
            arraste pra cortar ✂️
          </span>
        )}
      </div>

      {!done ? (
        <button
          type="button"
          onClick={submit}
          disabled={!line || lineLen(line) < MIN_LEN}
          className="btn-primary w-full disabled:opacity-40"
        >
          Cortar! 🔪
        </button>
      ) : (
        result && (
          <>
            <div className="rounded-card border-2 border-navy bg-navy p-4 text-center text-paper">
              <p className="font-mono text-5xl font-bold text-teal-soft">{result.precision}%</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-wide text-paper/70">
                precisão {'⭐'.repeat(result.stars)}
              </p>
              <p className="mt-2 text-sm text-paper/80">
                Você cortou <b>{result.leftPct}%</b> · <b>{result.rightPct}%</b>. A linha
                vermelha é o corte perfeito nesse ângulo.
              </p>
            </div>
            <button
              type="button"
              onClick={share}
              className="btn w-full border-transparent font-bold text-white shadow-tactile"
              style={{ background: WA_GREEN }}
            >
              💬 Desafiar amigos no WhatsApp
            </button>
            <button type="button" onClick={copy} className="text-center text-sm text-navy-soft underline">
              {copied ? 'Copiado!' : 'Copiar resultado'}
            </button>
            <button type="button" onClick={playPractice} className="btn-ghost w-full">
              Jogar outra (treino)
            </button>
          </>
        )
      )}
    </div>
  );
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function Calendar({
  startN,
  todayN,
  activeN,
  played,
  onPick,
}: {
  startN: number;
  todayN: number;
  activeN: number;
  played: Record<number, number>;
  onPick: (n: number) => void;
}) {
  const startDate = dateForChallengeNumber(startN);
  const endDate = dateForChallengeNumber(todayN);
  const [sy, sm] = startDate.split('-').map(Number);
  const [ey, em] = endDate.split('-').map(Number);

  const months: { y: number; m: number }[] = [];
  for (let y = sy, m = sm; y < ey || (y === ey && m <= em); ) {
    months.push({ y, m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border-2 border-navy/15 bg-paper-2 p-3">
      {months.map(({ y, m }) => {
        const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
        const cells: (number | null)[] = Array(firstDow).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        const monthName = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        });
        return (
          <div key={`${y}-${m}`}>
            <p className="mb-1 text-center font-mono text-xs uppercase tracking-wide text-navy-soft">
              {monthName}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="font-mono text-[10px] text-navy-soft/60">
                  {w}
                </span>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <span key={`e${i}`} />;
                const iso = `${y}-${pad(m)}-${pad(d)}`;
                const n = challengeNumberForDate(iso);
                const inRange = n >= startN && n <= todayN;
                const isActive = n === activeN;
                const p = played[n];
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!inRange}
                    onClick={() => onPick(n)}
                    className={`relative aspect-square rounded-md font-mono text-xs transition-colors ${
                      !inRange
                        ? 'text-navy/20'
                        : isActive
                          ? 'bg-teal font-bold text-paper'
                          : p != null
                            ? 'bg-teal/15 text-navy hover:bg-teal/25'
                            : 'bg-paper text-navy hover:bg-navy/10'
                    }`}
                  >
                    {d}
                    {inRange && p != null && !isActive && (
                      <span className="absolute inset-x-0 bottom-0.5 text-[8px] leading-none text-teal">
                        {p}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-center text-[11px] text-navy-soft">
        Toque num dia pra jogar aquela figura. Um corte por dia.
      </p>
    </div>
  );
}
