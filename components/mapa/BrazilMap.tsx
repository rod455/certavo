'use client';

import { useMemo } from 'react';
import {
  bboxOfGeometry,
  makeProjector,
  geometryToPath,
  leaderOf,
  candidate,
  type BBox,
  type CitiesByUf,
  type City,
  type Ownership,
} from '@/lib/mapa';

type Feature = {
  properties: { sigla: string; name: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
};
type FC = { features: Feature[] };

const W = 800;
const H = 820;
const NEUTRAL = '#2b3a2f'; // faint olive, like the reference
const STROKE = '#6b7b64';

export function BrazilMap({
  states,
  citiesByUf,
  ownership,
  view,
  selectedCity,
  onPickState,
  onPickCity,
}: {
  states: FC;
  citiesByUf: CitiesByUf;
  ownership: Ownership;
  view: { level: 'country' } | { level: 'state'; uf: string };
  selectedCity: number | null;
  onPickState: (uf: string) => void;
  onPickCity: (city: City) => void;
}) {
  // ---- country view: all states, colored by who leads them ----
  const country = useMemo(() => {
    const brBbox: BBox = [-74, -34, -34, 5.6];
    const { project } = makeProjector(brBbox, W, H);
    return states.features.map((f) => {
      const uf = f.properties.sigla;
      const codes = (citiesByUf[uf] ?? []).map((c) => c.c);
      const lead = leaderOf(codes, ownership);
      const fill = lead ? candidate(lead)?.color ?? NEUTRAL : NEUTRAL;
      const bb = bboxOfGeometry(f.geometry);
      const [cx, cy] = project((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2);
      return { uf, name: f.properties.name, d: geometryToPath(f.geometry, project), fill, cx, cy };
    });
  }, [states, citiesByUf, ownership]);

  if (view.level === 'country') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Mapa do Brasil">
        <rect width={W} height={H} fill="transparent" />
        {country.map((s) => (
          <g key={s.uf} className="cursor-pointer" onClick={() => onPickState(s.uf)}>
            <path d={s.d} fill={s.fill} fillOpacity={0.55} stroke={STROKE} strokeWidth={0.8} />
            <text
              x={s.cx}
              y={s.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontFamily="monospace"
              fill="#e8e2d5"
              pointerEvents="none"
            >
              {s.uf}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // ---- state view: outline + city dots ----
  const uf = view.uf;
  const feature = states.features.find((f) => f.properties.sigla === uf);
  const cities = citiesByUf[uf] ?? [];
  const bbox: BBox = feature
    ? bboxOfGeometry(feature.geometry)
    : [
        Math.min(...cities.map((c) => c.lo)) - 0.3,
        Math.min(...cities.map((c) => c.la)) - 0.3,
        Math.max(...cities.map((c) => c.lo)) + 0.3,
        Math.max(...cities.map((c) => c.la)) + 0.3,
      ];
  const { project } = makeProjector(bbox, W, H, 24);
  const outline = feature ? geometryToPath(feature.geometry, project) : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={`Mapa de ${uf}`}>
      {outline && <path d={outline} fill={NEUTRAL} fillOpacity={0.25} stroke={STROKE} strokeWidth={1} />}
      {cities.map((c) => {
        const [x, y] = project(c.lo, c.la);
        const o = ownership[c.c];
        const color = o ? candidate(o.cand)?.color ?? '#9aa79a' : '#9aa79a';
        const base = c.cap ? 5 : 3;
        const sel = selectedCity === c.c;
        return (
          <circle
            key={c.c}
            cx={x}
            cy={y}
            r={sel ? base + 2 : base}
            fill={color}
            fillOpacity={o ? 0.95 : 0.35}
            stroke={sel ? '#fff' : o ? '#000' : 'none'}
            strokeOpacity={sel ? 1 : 0.25}
            strokeWidth={sel ? 2 : 0.5}
            className="cursor-pointer"
            onClick={() => onPickCity({ ...c, uf })}
          >
            <title>{c.n}</title>
          </circle>
        );
      })}
    </svg>
  );
}
