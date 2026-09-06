'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { whatsappLink, shareOrCopy } from '@/lib/share';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { todayUtc, challengeNumberForDate } from '@/lib/daily';
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

type Measured = { cum: number[]; total: number; trueFrac: number };

function lockKey(n: number) {
  return `certavo:cutle:${n}`;
}

export function CutleGame() {
  const locale = useLocale();
  const dailyN = challengeNumberForDate(todayUtc());

  const [practice, setPractice] = useState(false);
  const [cp, setCp] = useState(() => EMOJIS[dailyIndex(dailyN)]);
  const [uxFrac, setUxFrac] = useState(0.5); // cut position (0..1)
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<(CutScore & { uxFrac: number }) | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const measured = useRef<Measured | null>(null);

  // draw the emoji + measure its area profile whenever the emoji changes
  useEffect(() => {
    measured.current = null;
    let revoked = '';
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let url = svgPath(cp);
      try {
        const txt = await (await fetch(url)).text();
        const patched = txt.replace('<svg', '<svg width="300" height="300"');
        url = URL.createObjectURL(new Blob([patched], { type: 'image/svg+xml' }));
        revoked = url;
      } catch {
        /* fall back to the raw path */
      }
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, SIZE, SIZE);
        const pad = 26;
        const box = SIZE - pad * 2;
        const ar = (img.width || 1) / (img.height || 1);
        let w = box,
          h = box;
        if (ar > 1) h = box / ar;
        else w = box * ar;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
        const cols = new Array(SIZE).fill(0);
        let total = 0;
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            if (data[(y * SIZE + x) * 4 + 3] > 16) {
              cols[x]++;
              total++;
            }
          }
        }
        const cum = new Array(SIZE).fill(0);
        let acc = 0;
        for (let x = 0; x < SIZE; x++) {
          acc += cols[x];
          cum[x] = acc;
        }
        let trueX = SIZE / 2;
        for (let x = 0; x < SIZE; x++) {
          if (total && cum[x] >= total / 2) {
            trueX = x;
            break;
          }
        }
        measured.current = { cum, total, trueFrac: trueX / SIZE };
        if (revoked) URL.revokeObjectURL(revoked);
      };
      img.src = url;
    })();
  }, [cp]);

  // restore today's result if already played (daily only)
  useEffect(() => {
    if (practice) return;
    try {
      const raw = window.localStorage.getItem(lockKey(dailyN));
      if (raw) {
        const r = JSON.parse(raw);
        setUxFrac(r.uxFrac);
        setResult(r);
        setDone(true);
      }
    } catch {
      /* ignore */
    }
  }, [practice, dailyN]);

  const leftFractionAt = useCallback((frac: number) => {
    const m = measured.current;
    if (!m || !m.total) return frac; // before measuring, fall back to position
    const x = Math.min(SIZE - 1, Math.max(0, Math.round(frac * (SIZE - 1))));
    return m.cum[x] / m.total;
  }, []);

  function pointer(clientX: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const f = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setUxFrac(f);
  }

  function submit() {
    const lf = leftFractionAt(uxFrac);
    const s = { ...scoreCut(lf), uxFrac };
    setResult(s);
    setDone(true);
    if (!practice) {
      try {
        window.localStorage.setItem(lockKey(dailyN), JSON.stringify({ ...s, cp }));
      } catch {
        /* ignore */
      }
    }
  }

  function playPractice() {
    setPractice(true);
    setDone(false);
    setResult(null);
    setUxFrac(0.5);
    setCp(EMOJIS[Math.floor(Math.random() * TOTAL)]);
  }

  const trueFrac = measured.current?.trueFrac ?? 0.5;
  const char = emojiChar(cp);

  // ---- share ----
  const base = `${SITE_URL}/${locale}`;
  const shareText = result
    ? `Cutle #${dailyN} 🔪 cortei o ${char} com ${result.precision}% de precisão ${'⭐'.repeat(result.stars) || ''}. Consegue melhor?\n${base}/cutle`
    : '';
  const [copied, setCopied] = useState(false);
  async function share() {
    window.open(whatsappLink(shareText), '_blank', 'noopener');
  }
  async function copy() {
    const k = await shareOrCopy(shareText);
    if (k === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <header className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-navy-soft">
          Cutle · {practice ? 'treino' : `#${dailyN}`}
        </p>
        <h1 className="mt-1 font-sans text-2xl font-bold">Corte no meio</h1>
        <p className="mt-1 text-sm text-navy-soft">
          Arraste a linha pra dividir a figura em duas metades de área igual (50/50).
        </p>
      </header>

      {/* the cutting board */}
      <div
        ref={wrapRef}
        className="relative mx-auto aspect-square w-full max-w-[340px] touch-none select-none overflow-hidden rounded-card border-2 border-navy bg-paper-2"
        onPointerDown={(e) => {
          if (done) return;
          setDragging(true);
          pointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (done || !dragging) return;
          pointer(e.clientX);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="h-full w-full" />

        {/* revealed halves tint */}
        {done && result && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-teal/15"
              style={{ width: `${result.uxFrac * 100}%` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 bg-navy/15"
              style={{ width: `${(1 - result.uxFrac) * 100}%` }}
            />
            {/* true 50/50 line */}
            <div
              className="pointer-events-none absolute inset-y-0 w-0 border-l-2 border-dashed border-error"
              style={{ left: `${trueFrac * 100}%` }}
            />
          </>
        )}

        {/* the user's cut line */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0 border-l-2 border-teal"
          style={{ left: `${(done && result ? result.uxFrac : uxFrac) * 100}%` }}
        >
          <span className="absolute -left-2 top-0 h-4 w-4 -translate-y-1/2 rounded-full bg-teal" />
          <span className="absolute -left-2 bottom-0 h-4 w-4 translate-y-1/2 rounded-full bg-teal" />
        </div>
      </div>

      {!done ? (
        <button type="button" onClick={submit} className="btn-primary w-full">
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
                vermelha é o corte perfeito.
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
            {!practice && (
              <p className="text-center text-xs text-navy-soft">
                Volte amanhã para o Cutle #{dailyN + 1}.
              </p>
            )}
          </>
        )
      )}
    </div>
  );
}
