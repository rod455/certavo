/**
 * "Cutle" — daily cut-in-half game. You are shown an emoji and drag a line to
 * split its VISIBLE AREA into two equal halves (50/50), at any angle. The
 * bundled Twemoji SVGs are curated to be ASYMMETRIC along their principal axes
 * (no easy 50/50), and rendered from bundled files (not the OS emoji font) so
 * the shape — and the right answer — is the same for everyone. 100 emojis.
 */

export const EMOJIS: string[] = ["1f302","1f331","1f334","1f335","1f33e","1f33f","1f340","1f34c","1f352","1f364","1f376","1f379","1f37b","1f37e","1f388","1f393","1f3a3","1f3b7","1f3ba","1f3cd","1f3cf","1f3d2","1f3d3","1f3f8","1f400","1f401","1f402","1f403","1f404","1f405","1f406","1f407","1f408","1f409","1f40a","1f40b","1f40c","1f40d","1f40e","1f410","1f413","1f415","1f41b","1f420","1f422","1f426","1f42b","1f42c","1f433","1f43f","1f45e","1f462","1f525","1f52c","1f52d","1f5dc","1f5dd","1f681","1f682","1f695","1f69b","1f69c","1f69e","1f6a0","1f6a1","1f6b2","1f6d2","1f6f4","1f6f5","1f6fc","1f942","1f94d","1f94f","1f982","1f983","1f984","1f985","1f986","1f988","1f98e","1f990","1f993","1f995","1f996","1f997","1f999","1f99f","1f9a1","1f9a3","1f9a5","1f9a8","1f9ad","1f9c3","1f9e3","1f9ef","1fa83","1fa93","1fa9d","1fab0","1fab1"];
export const TOTAL = EMOJIS.length;

export function svgPath(cp: string): string {
  return `/cutle/${cp}.svg`;
}

export function emojiChar(cp: string): string {
  try {
    return String.fromCodePoint(...cp.split("-").map((h) => parseInt(h, 16)));
  } catch {
    return "";
  }
}

export function dailyIndex(challengeNumber: number): number {
  return (((challengeNumber - 1) % TOTAL) + TOTAL) % TOTAL;
}

export type CutScore = {
  leftPct: number;
  rightPct: number;
  error: number;
  precision: number;
  stars: number;
};

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
