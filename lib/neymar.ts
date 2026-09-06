/**
 * "O Caminho do Neymar" — engine v2.
 *
 * Now a real branching narrative: each momento offers N options (A, B, C…)
 * that ADAPT to the path so far (e.g. after going to the Real, 2017 becomes
 * "stay at the Real / PSG / Premier League", not "leave the Barça"). Adding an
 * option later is just data.
 *
 * Numbers are ANCHORED IN REAL DATA (see data/neymar-stats.json, FBref):
 *   · career all-comps ≈ 0.60 goal + 0.34 assist per game
 *   · Barcelona 4 seasons = 103 G / 56 A  ·  PSG 6 seasons = 118 G / 69 A
 * Real branches reproduce reality; "e se?" branches = real rate × a context
 * factor, bounded by what those clubs actually won in that era.
 */

export type Stats = {
  ucl: number;
  liga: number; // national league titles (La Liga / Ligue 1 / Premier / Saudi)
  libertadores: number;
  brasileirao: number;
  goals: number;
  assists: number;
};

type SimState = Stats & {
  club: string;
  worldCup: number;
  hero: boolean;
  gold: boolean;
  money: number;
  protagonist: boolean;
};

type Effect = {
  label: string;
  choice: string;
  consequence: string;
  chapter: string;
  setClub?: string;
  goals?: number;
  assists?: number;
  ucl?: number;
  liga?: number;
  libertadores?: number;
  brasileirao?: number;
  worldCup?: number;
  hero?: boolean;
  gold?: boolean;
  money?: boolean;
  protagonist?: boolean;
};

type Option = { effect: Effect; when?: (s: SimState) => boolean };
type Moment = {
  year: string;
  title: string;
  prompt: string; // may contain {club}
  options: (s: SimState) => Option[];
};

const KEYS = 'ABCDEFG';

function fill(text: string, club: string): string {
  return text.replaceAll('{club}', club || 'clube atual');
}

// --- reusable club-phase options (used from 2017 onward, context-aware) ---
const goPSG: Effect = {
  label: 'PSG',
  choice: 'Aceita os €222M e vai pro PSG',
  consequence:
    'Deixa o {club} rumo a Paris pela transferência recorde da história. ~118 gols e 5 Ligue 1, mas a Champions escapa (vice em 2020) e o desgaste cobra caro.',
  chapter:
    'Aceitou os €222 milhões e deixou o {club} rumo a Paris. Fez ~118 gols e ganhou tudo na França, mas a Champions e a Bola de Ouro nunca vieram — e, gasto, não brilhou na Copa de 2018.',
  setClub: 'PSG',
  goals: 118,
  assists: 69,
  liga: 5,
};
const goCity: Effect = {
  label: 'Manchester City',
  choice: 'Vai pra Premier League (Manchester City)',
  consequence:
    'Troca o {club} pela Premier: no City de Guardiola vira o astro da Inglaterra (~120 gols), ganha a Champions e, inteiro, é campeão do mundo em 2018.',
  chapter:
    'Trocou o {club} pela Premier League. No City de Guardiola dominou a Inglaterra (~120 gols), enfim ergueu a Champions e, inteiro, levou o Brasil ao título mundial de 2018.',
  setClub: 'Manchester City',
  goals: 120,
  assists: 70,
  liga: 3,
  ucl: 1,
  protagonist: true,
  worldCup: 1,
};
const goReal: Effect = {
  label: 'Real Madrid',
  choice: 'Vai pro Real Madrid',
  consequence:
    'Assume o Real e a dinastia das Champions (~130 gols). Longe da sombra do Messi, vira candidato à Bola de Ouro e, inteiro, disputa a Copa de 2018.',
  chapter:
    'Vestiu o branco do Real Madrid e virou peça da dinastia europeia (~130 gols), longe da sombra de Messi — e, inteiro, levou o Brasil ao título mundial de 2018.',
  setClub: 'Real Madrid',
  goals: 130,
  assists: 70,
  ucl: 2,
  liga: 2,
  protagonist: true,
  worldCup: 1,
};

export const MOMENTS: Moment[] = [
  {
    year: '2013',
    title: 'A ida para a Europa',
    prompt:
      '2013: ídolo do Santos e melhor jogador da Copa das Confederações, Neymar decide o futuro na Europa. Ele vai para o:',
    options: () => [
      {
        effect: {
          label: 'Barcelona',
          choice: 'Barcelona',
          consequence:
            'Forma o trio MSN com Messi e Suárez e faz a tríplice coroa de 2015 — 103 gols em 180 jogos, mas sempre à sombra do camisa 10.',
          chapter:
            'Foi ao Barcelona e formou o MSN com Messi e Suárez. Fez 103 gols e a Champions de 2015, genial — mas dividiu os holofotes, e as Bolas de Ouro, com Messi.',
          setClub: 'Barcelona',
          goals: 103,
          assists: 56,
          ucl: 1,
          liga: 2,
        },
      },
      {
        effect: {
          label: 'Real Madrid',
          choice: 'Real Madrid',
          consequence:
            'No Real de Cristiano e Benzema entra na dinastia das Champions (2016–2018). Estimativa: ~145 gols e, longe do Messi, vira candidato à Bola de Ouro.',
          chapter:
            'Rejeitou o Barça e brilhou de branco no Real. Peça da dinastia das três Champions seguidas (~145 gols), o brasileiro que saiu da sombra de Messi.',
          setClub: 'Real Madrid',
          goals: 145,
          assists: 80,
          ucl: 3,
          liga: 2,
          protagonist: true,
        },
      },
      {
        effect: {
          label: 'Manchester City',
          choice: 'Manchester City (Premier League)',
          consequence:
            'Aposta no futebol inglês: no City de Guardiola vira o astro da Premier (~130 gols), títulos ingleses em série e, enfim, o protagonista absoluto.',
          chapter:
            'Surpreendeu o mundo e foi para a Premier League. No Manchester City de Guardiola dominou a Inglaterra (~130 gols) e assumiu o papel de maior estrela — sem sombra de ninguém.',
          setClub: 'Manchester City',
          goals: 130,
          assists: 75,
          liga: 3,
          ucl: 1,
          protagonist: true,
        },
      },
    ],
  },
  {
    year: '2014',
    title: 'A lesão na Copa',
    prompt:
      'Copa de 2014, em casa: nas quartas, Zúñiga sobe nas costas de Neymar. E se…',
    options: () => [
      {
        effect: {
          label: 'Escapa da lesão',
          choice: 'A joelhada não o fratura — ele joga a semi',
          consequence:
            'Inteiro na semifinal, evita o massacre: o Brasil perde por 2 a 1 pra Alemanha (gol dele) e cai de cabeça erguida. A Alemanha ainda é campeã sobre a Argentina, mas o 7 a 1 nunca existe.',
          chapter:
            'A vértebra resiste. Inteiro na semi, Neymar evita o 7 a 1 — derrota digna por 2 a 1, com gol dele. A Alemanha ainda leva a taça (1 a 0 na Argentina), mas o maior trauma da seleção nunca nasce.',
          hero: true,
        },
      },
      {
        effect: {
          label: 'Fratura a vértebra',
          choice: 'Fratura a vértebra e assiste ao 7 a 1',
          consequence:
            'Com a vértebra fraturada e Thiago Silva suspenso, o Brasil desaba: 7 a 1 pra Alemanha, cinco gols em 18 minutos. A maior humilhação da seleção.',
          chapter:
            'A joelhada fratura a vértebra e encerra a Copa dele. Sem ele e sem Thiago Silva, o Brasil sofre o histórico 7 a 1 contra a Alemanha — a ferida de uma geração.',
        },
      },
    ],
  },
  {
    year: '2016',
    title: 'Olimpíada ou Copa América',
    prompt:
      '2016: o Brasil deixa Neymar escolher UM torneio — a Copa América Centenário ou a Olimpíada no Rio. Ele escolhe:',
    options: () => [
      {
        effect: {
          label: 'Olimpíada (ouro)',
          choice: 'A Olimpíada do Rio',
          consequence:
            'Capitão, faz o gol mais rápido da história olímpica e bate o pênalti do título contra a Alemanha: o primeiro OURO do futebol masculino brasileiro. A redenção do 7 a 1.',
          chapter:
            'Escolheu a Olimpíada do Rio: gol mais rápido da história dos Jogos, e o pênalti decisivo do ouro contra a Alemanha, no Maracanã — a redenção definitiva do 7 a 1.',
          gold: true,
        },
      },
      {
        effect: {
          label: 'Copa América',
          choice: 'A Copa América',
          consequence:
            'Vai à Copa América, onde o Brasil real caiu na fase de grupos. Com ele, a seleção chega à final contra a Argentina de Messi e vence nos pênaltis o título que não vinha desde 2007 — mas a Alemanha leva o ouro olímpico.',
          chapter:
            'Trocou o Rio pela Copa América e levou o Brasil ao título que faltava desde 2007, batendo a Argentina de Messi na final. O preço: sem ele, a Alemanha faturou o ouro olímpico no Maracanã.',
        },
      },
    ],
  },
  {
    year: '2017',
    title: 'A transferência recorde',
    prompt:
      '2017: o PSG oferece a multa de €222 milhões — a maior da história. No auge no {club}, Neymar:',
    options: (s) => {
      // "Ficar" muda de significado conforme o clube; as outras opções são os
      // destinos que fazem sentido a partir de onde ele está.
      const stay: Effect = {
        label: `Fica no {club}`,
        choice: `Recusa e fica no {club}`,
        consequence:
          'Recusa os €222M e fica no {club}. Assume de vez o protagonismo (~170 gols), e — inteiro, longe do desgaste de Paris — lidera o Brasil ao título mundial de 2018 sobre a Bélgica, a França de Mbappé e a Croácia.',
        chapter:
          'Recusou os €222 milhões e ficou no {club}. Virou o dono do time (~170 gols) e, inteiro em 2018, levou o Brasil ao hexa: passou pela Bélgica, pela França de Mbappé e bateu a Croácia na final.',
        goals: 170,
        assists: 90,
        ucl: 2,
        liga: 3,
        protagonist: true,
        worldCup: 1,
      };
      const opts: Option[] = [{ effect: stay }, { effect: goPSG }];
      if (s.club !== 'Manchester City') opts.push({ effect: goCity });
      if (s.club !== 'Real Madrid') opts.push({ effect: goReal });
      return opts;
    },
  },
  {
    year: '2018',
    title: 'A vida fora de campo',
    prompt: 'No auge da fama, Neymar decide o rumo da vida pessoal:',
    options: () => [
      {
        effect: {
          label: 'Estabilidade',
          choice: 'Assume a estabilidade e a família',
          consequence:
            'Some das capas de escândalo. Sem farofas nem novelas, chega mais inteiro às decisões e estica o auge — a fama de profissional exemplar blinda a carreira.',
          chapter:
            'Escolheu a estabilidade e a família. Longe das manchetes de balada, virou exemplo dentro e fora de campo e chegou mais inteiro às grandes decisões.',
          goals: 15,
          assists: 10,
        },
      },
      {
        effect: {
          label: 'Vida de solteiro',
          choice: 'Cai na vida de solteiro (festas e polêmicas)',
          consequence:
            'Festas milionárias, carnaval e polêmicas amorosas viram novela nacional. O gênio segue genial, mas a imagem fora de campo — e lesões em momentos-chave — competem com o futebol.',
          chapter:
            'Mergulhou na vida de solteiro: festas, carnaval e polêmicas que viraram novela. O craque continuou craque, mas a fama de fora de campo e as lesões passaram a roubar a cena.',
          goals: 8,
          assists: 6,
        },
      },
    ],
  },
  {
    year: '2023+',
    title: 'O último capítulo',
    prompt: 'Veterano, Neymar decide o fim da carreira. Ele:',
    options: () => [
      {
        effect: {
          label: 'Volta pro Santos',
          choice: 'Volta pro Santos e vira lenda em casa',
          consequence:
            'Reacende a Vila Belmiro: Libertadores, Brasileirões e o carinho do país. O filho pródigo termina onde tudo começou.',
          chapter:
            'Voltou para o Santos e reacendeu a Vila Belmiro. Entre Brasileirões e a sonhada Libertadores, terminou como o maior ídolo da história da torcida.',
          setClub: 'Santos',
          libertadores: 1,
          brasileirao: 2,
          goals: 70,
          assists: 40,
        },
      },
      {
        effect: {
          label: 'Arábia',
          choice: 'Vai pra Arábia Saudita (o grande contrato)',
          consequence:
            'Troca o {club} pelo contrato bilionário do Al-Hilal. Enche os cofres e ganha títulos sauditas, mas uma grave lesão no joelho o afasta do topo — fica o "podia ter sido mais".',
          chapter:
            'Trocou o {club} pelo contrato bilionário da Arábia. Encheu os bolsos no Al-Hilal, mas uma ruptura no joelho o tirou por quase um ano, longe dos grandes palcos.',
          setClub: 'Al-Hilal',
          liga: 1,
          goals: 30,
          assists: 20,
          money: true,
        },
      },
      {
        effect: {
          label: 'Última cartada',
          choice: 'Fica na Europa atrás da Champions que faltou',
          consequence:
            'Recusa o dinheiro fácil e aposta tudo numa última temporada europeia atrás do troféu que nunca teve. Estimativa: enfim ergue a Liga dos Campeões e se aposenta no auge da lenda.',
          chapter:
            'Recusou o dinheiro fácil e ficou na Europa por uma última cartada. Contra tudo, ergueu enfim a Liga dos Campeões que faltava e pendurou as chuteiras como lenda consumada.',
          ucl: 1,
          goals: 40,
          assists: 25,
          protagonist: true,
        },
      },
    ],
  },
];

export const TOTAL_MOMENTS = MOMENTS.length;

function initState(): SimState {
  return {
    club: '',
    ucl: 0,
    liga: 0,
    libertadores: 0,
    brasileirao: 0,
    goals: 0,
    assists: 0,
    worldCup: 0,
    hero: false,
    gold: false,
    money: 0,
    protagonist: false,
  };
}

function apply(s: SimState, e: Effect): { state: SimState; chapter: string; label: string } {
  const chapter = fill(e.chapter, s.club);
  const label = fill(e.label, s.club);
  const state: SimState = {
    ...s,
    goals: s.goals + (e.goals ?? 0),
    assists: s.assists + (e.assists ?? 0),
    ucl: s.ucl + (e.ucl ?? 0),
    liga: s.liga + (e.liga ?? 0),
    libertadores: s.libertadores + (e.libertadores ?? 0),
    brasileirao: s.brasileirao + (e.brasileirao ?? 0),
    worldCup: s.worldCup + (e.worldCup ?? 0),
    hero: s.hero || !!e.hero,
    gold: s.gold || !!e.gold,
    money: s.money + (e.money ? 1 : 0),
    protagonist: s.protagonist || !!e.protagonist,
    club: e.setClub ?? s.club,
  };
  return { state, chapter, label };
}

/** Options available at `step` given the answers before it (with keys). */
function optionsAt(step: number, prefix: string) {
  const s = simulate(prefix).state;
  const m = MOMENTS[step];
  if (!m) return [];
  return m.options(s).map((o, i) => ({ key: KEYS[i], ...o }));
}

/** Run a (possibly partial) path, collecting narrative + final state. */
function simulate(path: string): {
  state: SimState;
  chapters: string[];
  labels: string[];
  valid: boolean;
} {
  let s = initState();
  const chapters: string[] = [];
  const labels: string[] = [];
  for (let step = 0; step < path.length; step++) {
    const m = MOMENTS[step];
    if (!m) return { state: s, chapters, labels, valid: false };
    const opts = m.options(s);
    const idx = KEYS.indexOf(path[step]);
    if (idx < 0 || idx >= opts.length) return { state: s, chapters, labels, valid: false };
    const r = apply(s, opts[idx].effect);
    s = r.state;
    chapters.push(r.chapter);
    labels.push(r.label);
  }
  return { state: s, chapters, labels, valid: true };
}

export function isValidPath(path: string): boolean {
  return path.length <= TOTAL_MOMENTS && simulate(path).valid;
}

/** The club Neymar plays for going into `step` (for headers). */
export function clubEntering(prefix: string): string {
  return simulate(prefix).state.club;
}

export type ResolvedOption = {
  key: string;
  label: string;
  choice: string;
  consequence: string;
  chapter: string;
};
export type ResolvedMoment = {
  year: string;
  title: string;
  prompt: string;
  options: ResolvedOption[];
};

export function resolveMoment(step: number, prefix: string): ResolvedMoment | null {
  const m = MOMENTS[step];
  if (!m) return null;
  const club = clubEntering(prefix);
  return {
    year: m.year,
    title: m.title,
    prompt: fill(m.prompt, club),
    options: optionsAt(step, prefix).map((o) => ({
      key: o.key,
      label: fill(o.effect.label, club),
      choice: fill(o.effect.choice, club),
      consequence: fill(o.effect.consequence, club),
      chapter: fill(o.effect.chapter, club),
    })),
  };
}

export type NeymarStory = {
  title: string;
  tier: number;
  chapters: string[];
  summary: string[];
  stats: Stats;
  legado: string[];
  hero: boolean;
  gold: boolean;
  worldCup: number;
  ballon: number;
};

const TIERS = [
  { min: 45, title: 'LENDA ABSOLUTA' },
  { min: 33, title: 'HERÓI ETERNO' },
  { min: 22, title: 'CRAQUE RESPEITADO' },
  { min: 13, title: 'GÊNIO INCONSTANTE' },
  { min: -Infinity, title: 'O QUE PODIA TER SIDO' },
];

export function buildNeymarStory(path: string): NeymarStory {
  const { state, chapters, labels } = simulate(path);
  const stats: Stats = {
    ucl: state.ucl,
    liga: state.liga,
    libertadores: state.libertadores,
    brasileirao: state.brasileirao,
    goals: state.goals,
    assists: state.assists,
  };

  // Ballon d'Or: only out of Messi's shadow (protagonist) WITH Champions; a
  // World Cup is a near-guaranteed Ballon too.
  const worldCup = state.worldCup;
  let ballon = state.protagonist
    ? stats.ucl >= 3
      ? 3
      : stats.ucl >= 2
        ? 2
        : stats.ucl >= 1
          ? 1
          : 0
    : 0;
  ballon = Math.min(ballon + worldCup, 5);

  const score =
    stats.ucl * 4 +
    stats.libertadores * 5 +
    stats.brasileirao * 2 +
    stats.liga * 0.5 +
    (state.hero ? 6 : 0) +
    (state.gold ? 8 : 0) +
    worldCup * 12 +
    ballon * 6 +
    stats.goals / 50 +
    stats.assists / 50;
  const tierIndex = TIERS.findIndex((t) => score >= t.min);
  const tier = TIERS.length - 1 - tierIndex;

  const legado: string[] = [];
  if (worldCup > 0) {
    legado.push('Livre e inteiro, liderou o Brasil ao título mundial de 2018.');
  } else if (state.hero) {
    legado.push('Escapou da lesão e evitou o 7 a 1: o Brasil caiu de pé, sem trauma.');
  }
  if (ballon > 0) {
    legado.push(
      ballon === 1
        ? 'Saiu da sombra de Messi e Cristiano e conquistou a Bola de Ouro.'
        : `Destronou Messi e Cristiano e ergueu ${ballon} Bolas de Ouro.`,
    );
  }
  if (state.gold) legado.push('Deu ao Brasil o ouro olímpico que faltava.');
  if (stats.ucl >= 2) legado.push(`Ergueu ${stats.ucl} Champions League na Europa.`);
  else if (stats.ucl === 0) legado.push('A Champions League, porém, foi o troféu que nunca veio.');
  if (stats.libertadores > 0 || stats.brasileirao > 0)
    legado.push('Voltou pra casa e virou lenda máxima do futebol brasileiro.');
  if (state.money >= 1) legado.push('Para os críticos, faltou fome de glória onde sobrou dinheiro.');
  legado.push(
    tier >= 4
      ? 'Lembrado como o maior brasileiro desde Pelé.'
      : tier === 3
        ? 'Ficou entre os maiores da história — sem discussão.'
        : tier === 2
          ? 'Um dos grandes de sua geração, sem ser unanimidade.'
          : tier === 1
            ? 'Talento de sobra, polêmicas demais: o eterno "quase".'
            : 'O maior "e se?" da história do futebol brasileiro.',
  );

  return {
    title: TIERS[tierIndex].title,
    tier,
    chapters,
    summary: labels,
    stats,
    legado,
    hero: state.hero,
    gold: state.gold,
    worldCup,
    ballon,
  };
}
