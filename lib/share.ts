import type { AnswerRecord } from './types';
import { SITE_NAME, SHARE_HOST } from './site';

// Use ASCII unicode escapes (not literal emoji) so no editor/build/transport
// step can ever mojibake them — the runtime string is identical.
const GREEN = '\u{1F7E9}'; // 🟩
const BLACK = '\u{2B1B}'; // ⬛

/** Build the Wordle-style emoji grid (5 per row). */
export function resultGrid(answers: AnswerRecord[], perRow = 5): string {
  const cells = answers.map((a) => (a.correct ? GREEN : BLACK));
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += perRow) {
    rows.push(cells.slice(i, i + perRow).join(''));
  }
  return rows.join('\n');
}

/** Full shareable text for the daily challenge. */
export function dailyShareText(opts: {
  challengeNumber: number;
  answers: AnswerRecord[];
  correctCount: number;
  total: number;
}): string {
  const { challengeNumber, answers, correctCount, total } = opts;
  const header = `${SITE_NAME} • Daily #${challengeNumber}`;
  const grid = resultGrid(answers);
  const score = `${correctCount}/${total}`;
  const url = `${SHARE_HOST}/d/${challengeNumber}`;
  return `${header}\n${grid}\n${score}\n${url}`;
}

/** WhatsApp deep link with pre-filled message. */
export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Try the Web Share API, fall back to clipboard. Returns 'shared'|'copied'. */
export async function shareOrCopy(
  text: string,
  title = SITE_NAME,
): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch {
      /* user cancelled or share failed — fall through to copy */
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
