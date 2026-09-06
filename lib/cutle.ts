/**
 * "Cutle" — daily cut-in-half game. You are shown an emoji and drag a vertical
 * line to split its VISIBLE AREA into two equal halves (50/50). The closer to
 * the true area-median line, the higher your precision. Bundled Twemoji SVGs
 * are used (not the OS emoji font) so the shape — and the right answer — is the
 * same for everyone. 100 emojis → one per day on a 100-day rotation.
 */

export const EMOJIS: string[] = ["1f302","1f319","1f32d","1f32e","1f32f","1f332","1f334","1f335","1f337","1f339","1f33b","1f33d","1f340","1f341","1f344","1f347","1f349","1f34c","1f34d","1f350","1f351","1f352","1f353","1f354","1f355","1f356","1f357","1f35f","1f360","1f366","1f369","1f36a","1f36d","1f377","1f378","1f37a","1f37e","1f382","1f388","1f393","1f3a3","1f3a9","1f3b7","1f3b8","1f3ba","1f3bb","1f3f9","1f40a","1f40c","1f40d","1f413","1f418","1f419","1f41c","1f41d","1f420","1f421","1f422","1f426","1f427","1f42b","1f42c","1f433","1f451","1f452","1f45f","1f462","1f48e","1f4a1","1f4a7","1f511","1f514","1f525","1f526","1f527","1f528","1f5ff","1f680","1f681","1f682","1f69c","1f6b2","1f6f4","1f941","1f942","1f950","1f951","1f952","1f954","1f955","1f956","1f95d","1f965","1f980","1f982","1f985","1f986","1f988","1f989","1f98b"];
export const TOTAL = EMOJIS.length;

/** SVG asset path for a codepoint (bundled under /public/cutle). */
export function svgPath(cp: string): string {
  return `/cutle/${cp}.svg`;
}

/** The actual emoji character, for share text / labels. */
export function emojiChar(cp: string): string {
  try {
    return String.fromCodePoint(...cp.split("-").map((h) => parseInt(h, 16)));
  } catch {
    return "";
  }
}

/** Deterministic emoji index for a daily challenge number (#1 → first). */
export function dailyIndex(challengeNumber: number): number {
  return ((challengeNumber - 1) % TOTAL + TOTAL) % TOTAL;
}

export type CutScore = {
  leftPct: number;
  rightPct: number;
  error: number; // 0..0.5
  precision: number; // 0..100
  stars: number; // 0..3
};

/** Score a cut given the fraction of area that ended up on the left. */
export function scoreCut(leftFraction: number): CutScore {
  const error = Math.abs(leftFraction - 0.5);
  const precision = Math.max(0, Math.round(100 - error * 200));
  const stars = precision >= 99 ? 3 : precision >= 92 ? 2 : precision >= 78 ? 1 : 0;
  return {
    leftPct: Math.round(leftFraction * 100),
    rightPct: Math.round((1 - leftFraction) * 100),
    error,
    precision,
    stars,
  };
}
