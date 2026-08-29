'use client';

/**
 * "Mapa do Poder" — a money-map of Brazil (à la maiorde.com.br) with a politics
 * theme: pay (mock PIX for now) to make a city dominated by a candidate. Whoever
 * pays most owns the city. The map is made of money, not of opinion.
 *
 * v1 keeps ownership in localStorage (per browser) so the whole dynamic works
 * without a backend or real payments. Shared global state (Supabase) + a real
 * PIX provider drop in behind the same helpers later.
 */

export type Candidate = { id: string; name: string; short: string; color: string };

/** Editable data — swap/extend the slate here. (Real names per your call.) */
export const CANDIDATES: Candidate[] = [
  { id: 'lula', name: 'Lula', short: 'Esquerda', color: '#E53935' },
  { id: 'bolsonaro', name: 'Bolsonaro', short: 'Direita', color: '#1E88E5' },
];

export function candidate(id: string): Candidate | undefined {
  return CANDIDATES.find((c) => c.id === id);
}

export type City = { c: number; n: string; la: number; lo: number; cap: number; uf: string };
export type CitiesByUf = Record<string, Omit<City, 'uf'>[]>;

export type Owned = { cand: string; amount: number; name?: string; msg?: string; at: number };
export type Ownership = Record<number, Owned>;
export type FeedItem = Owned & { city: string; uf: string };

export const MIN_BID = 1; // R$ minimum to take an unclaimed city
export const INCREMENT = 0.5; // must beat the current bid by at least this
export const UNCLAIMED_OFF = 0.5; // 50% off to grab unclaimed cities

/** Minimum amount (R$) needed to take a city given its current owner (if any). */
export function minToTake(current?: Owned): number {
  if (!current) return MIN_BID;
  return Math.round((current.amount + INCREMENT) * 100) / 100;
}

const OWN_KEY = 'certavo:mapa:own';
const FEED_KEY = 'certavo:mapa:feed';

export function loadOwnership(): Ownership {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(OWN_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function loadFeed(): FeedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(FEED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(own: Ownership, feed: FeedItem[]) {
  window.localStorage.setItem(OWN_KEY, JSON.stringify(own));
  window.localStorage.setItem(FEED_KEY, JSON.stringify(feed.slice(0, 40)));
}

/** Apply a (mock-)paid domination. Returns the new ownership + feed. */
export function dominate(
  own: Ownership,
  feed: FeedItem[],
  city: City,
  candId: string,
  amount: number,
  who: { name?: string; msg?: string },
): { own: Ownership; feed: FeedItem[] } {
  const entry: Owned = {
    cand: candId,
    amount: Math.round(amount * 100) / 100,
    name: who.name?.trim() || undefined,
    msg: who.msg?.trim() || undefined,
    at: Date.now(),
  };
  const nextOwn = { ...own, [city.c]: entry };
  const nextFeed = [{ ...entry, city: city.n, uf: city.uf }, ...feed];
  save(nextOwn, nextFeed);
  return { own: nextOwn, feed: nextFeed };
}

/** Grab many cities at once (mass invasion of unclaimed cities). */
export function dominateAll(
  own: Ownership,
  feed: FeedItem[],
  cities: City[],
  candId: string,
  amountEach: number,
  who: { name?: string; msg?: string },
): { own: Ownership; feed: FeedItem[] } {
  const at = Date.now();
  const name = who.name?.trim() || undefined;
  const msg = who.msg?.trim() || undefined;
  const nextOwn = { ...own };
  for (const city of cities) {
    nextOwn[city.c] = { cand: candId, amount: amountEach, name, msg, at };
  }
  const summary: FeedItem = {
    cand: candId,
    amount: Math.round(amountEach * cities.length * 100) / 100,
    name,
    msg,
    at,
    city: `${cities.length} cidades`,
    uf: '',
  };
  const nextFeed = [summary, ...feed];
  save(nextOwn, nextFeed);
  return { own: nextOwn, feed: nextFeed };
}

export type Score = { cand: Candidate; cities: number; total: number };

export function placar(own: Ownership): Score[] {
  const agg: Record<string, { cities: number; total: number }> = {};
  for (const c of CANDIDATES) agg[c.id] = { cities: 0, total: 0 };
  for (const k of Object.keys(own)) {
    const o = own[Number(k)];
    if (agg[o.cand]) {
      agg[o.cand].cities += 1;
      agg[o.cand].total += o.amount;
    }
  }
  return CANDIDATES.map((cand) => ({ cand, ...agg[cand.id] })).sort(
    (a, b) => b.total - a.total,
  );
}

/** The candidate leading a set of cities (by count), or null. */
export function leaderOf(cityCodes: number[], own: Ownership): string | null {
  const tally: Record<string, number> = {};
  for (const code of cityCodes) {
    const o = own[code];
    if (o) tally[o.cand] = (tally[o.cand] ?? 0) + 1;
  }
  let best: string | null = null;
  let max = 0;
  for (const id of Object.keys(tally)) {
    if (tally[id] > max) {
      max = tally[id];
      best = id;
    }
  }
  return best;
}

export function brl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------------------------------------------------------------------------
// Equirectangular projection fitted to a bbox — self-contained (no map lib,
// no external tiles), matching the stylized outline+dots look.
// ---------------------------------------------------------------------------

export type BBox = [number, number, number, number]; // [minLon,minLat,maxLon,maxLat]

export function bboxOfGeometry(geom: {
  type: string;
  coordinates: number[][][] | number[][][][];
}): BBox {
  let minLon = 180,
    minLat = 90,
    maxLon = -180,
    maxLat = -90;
  const walk = (a: unknown): void => {
    if (Array.isArray(a) && typeof a[0] === 'number') {
      const [lon, lat] = a as number[];
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(a)) {
      a.forEach(walk);
    }
  };
  walk(geom.coordinates);
  return [minLon, minLat, maxLon, maxLat];
}

export type Projector = {
  project: (lon: number, lat: number) => [number, number];
  scale: number;
};

export function makeProjector(bbox: BBox, w: number, h: number, pad = 12): Projector {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const midLat = (minLat + maxLat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180); // longitude compression
  const lonSpan = (maxLon - minLon) * kx || 1e-6;
  const latSpan = maxLat - minLat || 1e-6;
  const scale = Math.min((w - 2 * pad) / lonSpan, (h - 2 * pad) / latSpan);
  const drawW = lonSpan * scale;
  const drawH = latSpan * scale;
  const offX = (w - drawW) / 2;
  const offY = (h - drawH) / 2;
  const project = (lon: number, lat: number): [number, number] => [
    offX + (lon - minLon) * kx * scale,
    offY + (maxLat - lat) * scale,
  ];
  return { project, scale };
}

/** Turn a Polygon/MultiPolygon into an SVG path with the projector. */
export function geometryToPath(
  geom: { type: string; coordinates: number[][][] | number[][][][] },
  project: (lon: number, lat: number) => [number, number],
): string {
  const polys =
    geom.type === 'Polygon'
      ? [geom.coordinates as number[][][]]
      : (geom.coordinates as number[][][][]);
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      });
      d += 'Z';
    }
  }
  return d;
}
