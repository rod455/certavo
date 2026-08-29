'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CANDIDATES,
  candidate,
  loadOwnership,
  loadFeed,
  dominate,
  dominateAll,
  placar,
  minToTake,
  brl,
  MIN_BID,
  UNCLAIMED_OFF,
  type CitiesByUf,
  type City,
  type Ownership,
  type FeedItem,
} from '@/lib/mapa';
import { BrazilMap } from './BrazilMap';

type FC = {
  features: { properties: { sigla: string; name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }[];
};

const UF_NAME: Record<string, string> = {};

function timeAgo(at: number): string {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function MapaApp() {
  const [states, setStates] = useState<FC | null>(null);
  const [cities, setCities] = useState<CitiesByUf | null>(null);
  const [own, setOwn] = useState<Ownership>({});
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [view, setView] = useState<{ level: 'country' } | { level: 'state'; uf: string }>({ level: 'country' });
  const [sel, setSel] = useState<City | null>(null);
  const [candId, setCandId] = useState(CANDIDATES[0].id);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [amount, setAmount] = useState(MIN_BID);

  useEffect(() => {
    Promise.all([
      fetch('/data/br-states.json').then((r) => r.json()),
      fetch('/data/br-cities.json').then((r) => r.json()),
    ]).then(([s, c]) => {
      setStates(s);
      setCities(c);
      for (const f of s.features) UF_NAME[f.properties.sigla] = f.properties.name;
    });
    setOwn(loadOwnership());
    setFeed(loadFeed());
  }, []);

  const scores = useMemo(() => placar(own), [own]);
  const total = useMemo(() => scores.reduce((a, s) => a + s.total, 0), [scores]);
  const ownedCount = Object.keys(own).length;

  // cities in the current scope (a state, or all of Brazil)
  const scopeCities: City[] = useMemo(() => {
    if (!cities) return [];
    const push = (uf: string) => (cities[uf] ?? []).map((c) => ({ ...c, uf }));
    return view.level === 'state' ? push(view.uf) : Object.keys(cities).flatMap(push);
  }, [cities, view]);
  const unclaimed = useMemo(() => scopeCities.filter((c) => !own[c.c]), [scopeCities, own]);
  const massCost = Math.round(unclaimed.length * MIN_BID * UNCLAIMED_OFF * 100) / 100;

  function pickCity(city: City) {
    setSel(city);
    setAmount(minToTake(own[city.c]));
  }

  function pay() {
    if (!sel) return;
    const need = minToTake(own[sel.c]);
    const amt = Math.max(amount, need);
    const r = dominate(own, feed, sel, candId, amt, { name, msg });
    setOwn(r.own);
    setFeed(r.feed);
    setSel(null);
  }

  function massInvade() {
    if (unclaimed.length === 0) return;
    const r = dominateAll(own, feed, unclaimed, candId, MIN_BID * UNCLAIMED_OFF, { name, msg });
    setOwn(r.own);
    setFeed(r.feed);
  }

  const cand = candidate(candId)!;
  const totalCities = cities ? Object.values(cities).reduce((a, b) => a + b.length, 0) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_300px]">
      {/* LEFT — title, placar, live feed */}
      <aside className="flex flex-col gap-4 order-2 lg:order-1">
        <div>
          <h1 className="font-sans text-2xl font-bold leading-tight">Mapa do Poder</h1>
          <p className="mt-1 text-sm text-navy-soft">
            Escolha uma cidade e pague um PIX pro seu candidato dominar. O mapa é feito de
            dinheiro, não de opinião.
          </p>
          <p className="mt-2 font-mono text-xs text-navy-soft">
            {ownedCount}/{totalCities || '…'} cidades · {brl(total)} em jogo
          </p>
        </div>

        <div className="rounded-card border-2 border-navy/15 bg-paper-2 p-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-navy-soft">Placar geral</p>
          {scores.map((s) => (
            <div key={s.cand.id} className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: s.cand.color }} />
                <span className="font-bold">{s.cand.name}</span>
                <span className="text-xs text-navy-soft">{s.cities} cid.</span>
              </span>
              <span className="font-mono font-bold" style={{ color: s.cand.color }}>
                {brl(s.total)}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-card border-2 border-navy/15 bg-paper-2 p-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-navy-soft">Ao vivo</p>
          {feed.length === 0 ? (
            <p className="text-sm text-navy-soft">Ninguém dominou nada ainda. Seja o primeiro.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {feed.slice(0, 8).map((f, i) => {
                const c = candidate(f.cand);
                return (
                  <li key={i} className="text-sm leading-tight">
                    <span className="font-bold" style={{ color: c?.color }}>
                      {f.name ?? 'Anônimo'}
                    </span>{' '}
                    dominou <span className="font-bold">{f.city}</span>
                    {f.uf ? ` (${f.uf})` : ''} · {brl(f.amount)}
                    {f.msg && <span className="block italic text-navy-soft">“{f.msg}”</span>}
                    <span className="text-xs text-navy-soft"> {timeAgo(f.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* CENTER — the map */}
      <div className="order-1 lg:order-2">
        <div className="mb-2 flex items-center justify-between">
          {view.level === 'state' ? (
            <button
              type="button"
              onClick={() => setView({ level: 'country' })}
              className="font-mono text-sm text-teal underline"
            >
              ← Brasil
            </button>
          ) : (
            <span className="font-mono text-xs text-navy-soft">Toque num estado pra dar zoom</span>
          )}
          {view.level === 'state' && (
            <span className="font-mono text-sm font-bold">{UF_NAME[view.uf] ?? view.uf}</span>
          )}
        </div>
        <div className="aspect-[4/5] w-full overflow-hidden rounded-card border-2 border-navy bg-navy-dark">
          {states && cities ? (
            <BrazilMap
              states={states}
              citiesByUf={cities}
              ownership={own}
              view={view}
              selectedCity={sel?.c ?? null}
              onPickState={(uf) => setView({ level: 'state', uf })}
              onPickCity={pickCity}
            />
          ) : (
            <p className="p-8 text-center font-mono text-paper/60">Carregando o mapa…</p>
          )}
        </div>
        {view.level === 'state' && (
          <p className="mt-1 text-center font-mono text-[11px] text-navy-soft">
            Toque numa cidade pra dominar. Capitais são os pontos maiores.
          </p>
        )}
      </div>

      {/* RIGHT — pick candidate + actions */}
      <aside className="flex flex-col gap-3 order-3">
        <p className="font-mono text-sm uppercase tracking-wide text-navy-soft">
          Coloque seu candidato no mapa
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CANDIDATES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCandId(c.id)}
              className={`rounded-card border-2 p-3 text-center font-bold transition-colors ${
                candId === c.id ? 'text-paper' : 'bg-paper-2 text-navy'
              }`}
              style={candId === c.id ? { background: c.color, borderColor: c.color } : { borderColor: `${c.color}55` }}
            >
              {c.name}
              <span className="block text-xs font-normal opacity-80">{c.short}</span>
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="Seu nome ou apelido (aparece no feed)"
          className="min-h-[44px] rounded-card border-2 border-navy/20 bg-paper px-3 text-sm"
        />
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          maxLength={50}
          placeholder="Sua mensagem (até 50 caracteres)"
          className="min-h-[44px] rounded-card border-2 border-navy/20 bg-paper px-3 text-sm"
        />

        {/* selected city — bid */}
        {sel ? (
          <div className="rounded-card border-2 border-navy bg-navy p-3 text-paper">
            <p className="font-bold">
              {sel.n} · {sel.uf}
            </p>
            {own[sel.c] ? (
              <p className="text-sm text-paper/80">
                Dominada por{' '}
                <span style={{ color: candidate(own[sel.c].cand)?.color }}>
                  {candidate(own[sel.c].cand)?.name}
                </span>{' '}
                · {brl(own[sel.c].amount)}. Supere para tomar.
              </p>
            ) : (
              <p className="text-sm text-paper/80">Cidade livre. Domine por {brl(MIN_BID)}.</p>
            )}
            <label className="mt-2 block text-xs text-paper/70">Seu lance (R$)</label>
            <input
              type="number"
              min={minToTake(own[sel.c])}
              step={0.5}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="min-h-[44px] w-full rounded-card border-2 border-paper/20 bg-paper/10 px-3 text-paper"
            />
            <button
              type="button"
              onClick={pay}
              className="btn mt-2 w-full border-transparent font-bold text-white"
              style={{ background: cand.color }}
            >
              Pagar {brl(Math.max(amount, minToTake(own[sel.c])))} (simulado) → {cand.name}
            </button>
            <button
              type="button"
              onClick={() => setSel(null)}
              className="mt-1 w-full text-center text-xs text-paper/70 underline"
            >
              cancelar
            </button>
          </div>
        ) : (
          <p className="rounded-card border-2 border-dashed border-navy/20 p-3 text-center text-sm text-navy-soft">
            Toque numa cidade no mapa pra dar seu lance.
          </p>
        )}

        {/* mass invasion of unclaimed cities in the current scope */}
        <div className="rounded-card border-2 border-navy/15 bg-paper-2 p-3">
          <p className="flex items-center justify-between font-bold">
            Invadir desocupadas
            <span className="rounded-full bg-teal px-2 py-0.5 text-xs text-paper">50% OFF</span>
          </p>
          <p className="mt-1 text-sm text-navy-soft">
            {unclaimed.length} cidades sem dono {view.level === 'state' ? `em ${view.uf}` : 'no Brasil'} —
            domine todas de uma vez por {cand.name}.
          </p>
          <button
            type="button"
            onClick={massInvade}
            disabled={unclaimed.length === 0}
            className="btn mt-2 w-full border-transparent font-bold text-white disabled:opacity-40"
            style={{ background: cand.color }}
          >
            Invadir tudo por {brl(massCost)} (simulado)
          </button>
        </div>

        <p className="text-center text-[11px] text-navy-soft">
          Pagamento simulado — versão de teste. Entretenimento, não é propaganda eleitoral.
        </p>
      </aside>
    </div>
  );
}
