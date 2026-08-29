/**
 * "O Caminho do Neymar — Linha do Tempo Alternativa"
 *
 * A shared *chain* quiz grounded in Neymar's real career: each momento is a
 * genuine turning point (Barça vs Real in 2013, the 2014 vertebra injury and
 * the 7x1, the 2016 Olympic gold, the €222M PSG move, his personal life, the
 * Saudi move). Each has the REAL outcome and an "e se?" alternative that the
 * app extrapolates.
 *
 * The chosen path travels inside the link (e.g. /neymar/3?p=AB), so the whole
 * game is stateless — no backend — and the final story is a pure, deterministic
 * function of the answer string, built compositionally (each option adds a
 * chapter + stat deltas + flags; the ending aggregates them).
 *
 * Content is PT-BR on purpose — this is a Brazilian football culture game.
 */

export type OptionKey = 'A' | 'B';

export type Stats = {
  ucl: number; // Champions League
  liga: number; // national league titles (La Liga / Ligue 1 / etc.)
  libertadores: number;
  brasileirao: number;
  goals: number;
  assists: number;
};

const ZERO: Stats = { ucl: 0, liga: 0, libertadores: 0, brasileirao: 0, goals: 0, assists: 0 };

export type MomentOption = {
  key: OptionKey;
  /** short label used in the summary line */
  label: string;
  /** the button text */
  choice: string;
  real: boolean;
  /** immediate "e se?" extrapolation shown to whoever answered */
  consequence: string;
  /** narrative fragment woven into the final story */
  chapter: string;
  stats: Partial<Stats>;
  hero?: boolean; // escaped the 2014 injury / avoided the 7x1
  gold?: boolean; // 2016 Olympic gold
  money?: boolean; // chose the money (Saudi Arabia)
};

export type Moment = {
  year: string;
  title: string;
  prompt: string;
  options: [MomentOption, MomentOption];
};

export const MOMENTS: Moment[] = [
  {
    year: '2013',
    title: 'A ida para a Europa',
    prompt:
      '2013: aos 21 anos, ídolo do Santos e melhor jogador da Copa das Confederações, Neymar vai para a Europa. Ele escolhe:',
    options: [
      {
        key: 'A',
        label: 'Barcelona',
        choice: 'Vai para o Barcelona',
        real: true,
        consequence:
          'Forma o trio MSN com Messi e Suárez — 122 gols só na temporada 2014/15. Em 2015 faz a tríplice coroa e vence a Juventus por 3 a 1 na final da Champions, em Berlim. Mas, ano após ano, é Messi quem leva a Bola de Ouro.',
        chapter:
          'Desembarcou no Barcelona e, ao lado de Messi e Suárez, formou o MSN — 122 gols só em 2014/15. Coroou tudo com a tríplice coroa de 2015 e a Champions ganha da Juventus por 3 a 1 em Berlim. Genial, mas sempre o segundo da fila, atrás do camisa 10.',
        stats: { ucl: 1, liga: 2, goals: 105, assists: 60 },
      },
      {
        key: 'B',
        label: 'Real Madrid',
        choice: 'Vai para o Real Madrid',
        real: false,
        consequence:
          'No Real de Cristiano e Benzema, ataca a hegemonia do Barça. Estimativa: entra na dinastia das três Champions seguidas (2016 nos pênaltis sobre o Atlético, 2017 com 4 a 1 na Juve, 2018 com 3 a 1 no Liverpool) e, longe da sombra do Messi, vira candidato à Bola de Ouro.',
        chapter:
          'Rejeitou o Barça e vestiu o branco do Real Madrid. Ao lado de Cristiano e Benzema, virou peça da dinastia das três Champions seguidas — 2016, 2017 e a final de Kiev em 2018 — o brasileiro que ousou brilhar na casa do rival e, enfim, saiu da sombra de Messi.',
        stats: { ucl: 3, liga: 2, goals: 150, assists: 80 },
      },
    ],
  },
  {
    year: '2014',
    title: 'A lesão na Copa',
    prompt:
      'Copa de 2014, em casa: Neymar é o líder da seleção e já tem 4 gols. Nas quartas, Zúñiga sobe nas suas costas. E se…',
    options: [
      {
        key: 'A',
        label: 'Escapa da lesão',
        choice: 'A joelhada não o fratura — ele joga a semifinal',
        real: false,
        hero: true,
        consequence:
          'Inteiro na semifinal, Neymar organiza o time e o massacre não acontece: o Brasil perde para a Alemanha por 2 a 1, com gol dele, e cai de cabeça erguida. Não dava para ser campeão — a Alemanha ainda leva a taça, batendo a Argentina por 1 a 0 com gol de Götze na prorrogação. Mas o 7 a 1 nunca existiu.',
        chapter:
          'A joelhada de Zúñiga passa perto e a vértebra resiste. Inteiro na semifinal, Neymar organiza o Brasil e o 7 a 1 nunca acontece: derrota digna por 2 a 1, com gol dele na despedida. A Alemanha ainda seria campeã (1 a 0 na Argentina, gol de Götze), mas o maior trauma da história da seleção foi apagado do mapa.',
        stats: { goals: 3, assists: 2 },
      },
      {
        key: 'B',
        label: 'Fratura a vértebra',
        choice: 'Fratura a vértebra e assiste de fora (o 7 a 1)',
        real: true,
        consequence:
          'Com a terceira vértebra lombar fraturada — e Thiago Silva suspenso — o Brasil entra desfalcado e desmorona: 7 a 1 para a Alemanha, cinco gols em 18 minutos. Os alemães seguem e são campeões sobre a Argentina. O 7 a 1 vira a maior humilhação da seleção.',
        chapter:
          'A joelhada fratura a terceira vértebra lombar e encerra a Copa dele. Sem Neymar e sem Thiago Silva, o Brasil desaba no 7 a 1 — cinco gols alemães em 18 minutos — e assiste a Alemanha levantar a taça. A ferida marcaria toda a sua geração.',
        stats: {},
      },
    ],
  },
  {
    year: '2016',
    title: 'Olimpíada ou Copa América',
    prompt:
      '2016: por causa do calendário, o Brasil deixa Neymar escolher UM torneio — a Copa América Centenário (EUA) ou a Olimpíada no Rio. Ele escolhe:',
    options: [
      {
        key: 'A',
        label: 'Olimpíada (ouro)',
        choice: 'A Olimpíada do Rio',
        real: true,
        gold: true,
        consequence:
          'Capitão, faz o gol mais rápido da história olímpica (15 segundos) e goleia Honduras por 6 a 0 na semi. Na final, 1 a 1 com a Alemanha; nos pênaltis, converte a última cobrança e dá ao Brasil o primeiro OURO do futebol masculino — a vingança perfeita contra os algozes de 2014, no Maracanã lotado.',
        chapter:
          'Escolheu a Olimpíada do Rio e carregou o país. Fez o gol mais rápido da história dos Jogos, goleou Honduras por 6 a 0 e, na final contra a mesma Alemanha, empatou em 1 a 1 e converteu o pênalti decisivo: o primeiro ouro olímpico do futebol masculino brasileiro, no Maracanã — a redenção definitiva do 7 a 1.',
        stats: { goals: 6, assists: 3 },
      },
      {
        key: 'B',
        label: 'Copa América',
        choice: 'A Copa América',
        real: false,
        consequence:
          'Vai à Copa América Centenário, onde em 2016 o Brasil real caiu na fase de grupos (o gol de mão de Ruidíaz). Com Neymar, a seleção avança e chega à final contra a Argentina de Messi: 1 a 1 e, nos pênaltis, o Brasil enfim leva a taça que não vem desde 2007 — Messi perde outra decisão. O preço: sem ele, a Alemanha se vinga e fatura o ouro olímpico no Maracanã.',
        chapter:
          'Trocou o Rio pela Copa América Centenário. Onde o Brasil real caiu na primeira fase, ele levou a seleção à final contra a Argentina de Messi e, nos pênaltis, ergueu a taça que faltava desde 2007. O preço foi alto: sem Neymar, a Alemanha se vingou e levou o ouro olímpico no Maracanã.',
        stats: { goals: 4, assists: 3 },
      },
    ],
  },
  {
    year: '2017',
    title: 'A transferência recorde',
    prompt:
      '2017: o PSG aciona a multa de 222 milhões de euros — a maior transferência da história. No auge no {club}, Neymar:',
    options: [
      {
        key: 'A',
        label: 'PSG',
        choice: 'Aceita e vira o astro máximo do PSG',
        real: true,
        consequence:
          'Deixa o {club} rumo a Paris e vira o rei da França: Ligue 1 e Copa da França em série. Leva o PSG à final da Champions de 2020, mas perde por 1 a 0 para o Bayern — gol de Coman, ironicamente cria da base do próprio PSG. As lesões seguidas no pé afastam o título europeu de vez.',
        chapter:
          'Aceitou os 222 milhões e deixou o {club} rumo a Paris. Reinou na França e chegou à final da Champions em 2020, mas caiu por 1 a 0 para o Bayern, gol de Coman. Entre as lesões no pé e as eliminações, o troféu europeu — e a Bola de Ouro — nunca vieram.',
        stats: { liga: 5, goals: 90, assists: 60 },
      },
      {
        key: 'B',
        label: 'Fica no {club}',
        choice: 'Recusa e fica no {club} para ser o dono absoluto',
        real: false,
        consequence:
          'Recusa os 222 milhões e fica no {club}, no auge da forma. Livre do desgaste de Paris, chega inteiro à Copa de 2018: bate a Bélgica por 2 a 1 nas quartas (onde o Brasil real caiu), supera a França de Mbappé por 1 a 0 na semi e vence a Croácia por 3 a 1 na final. Hexacampeão mundial.',
        chapter:
          'Recusou os 222 milhões e ficou no {club}. Livre do desgaste de Paris, chegou inteiro à Copa de 2018: venceu a Bélgica por 2 a 1 nas quartas — o jogo em que o Brasil real caiu —, superou a França de Mbappé na semi e bateu a Croácia na final. Hexacampeão, e enfim o dono do mundo.',
        stats: { ucl: 2, liga: 3, goals: 170, assists: 90 },
      },
    ],
  },
  {
    year: '2018',
    title: 'A vida fora de campo',
    prompt:
      'No auge da fama, longe dos gramados, Neymar decide o rumo da vida pessoal:',
    options: [
      {
        key: 'A',
        label: 'Estabilidade',
        choice: 'Assume a estabilidade e a família',
        real: false,
        consequence:
          'Some das capas de escândalo. Sem farofas, festas homéricas nem novelas amorosas, chega mais inteiro às decisões e estica o auge por mais tempo — a fama de profissional exemplar blinda a carreira das distrações.',
        chapter:
          'Escolheu a estabilidade e a família. Longe das manchetes de balada, das farofas e das novelas amorosas, ganhou a fama de profissional exemplar e chegou mais inteiro às grandes decisões — o talento intacto e a cabeça no lugar.',
        stats: { goals: 15, assists: 10 },
      },
      {
        key: 'B',
        label: 'Vida de solteiro',
        choice: 'Cai na vida de solteiro (festas e polêmicas)',
        real: true,
        consequence:
          'As festas milionárias, o carnaval, as farofas e as novelas amorosas viram assunto nacional. O gênio segue genial em campo, mas a imagem fora dele — e algumas lesões em momentos-chave — passam a competir com o futebol.',
        chapter:
          'Mergulhou na vida de solteiro: festas milionárias, carnaval, farofas e polêmicas amorosas que viraram novela. O craque continuou craque, mas a fama de fora de campo — e as lesões em momentos decisivos — passaram a roubar a cena do futebol.',
        stats: { goals: 8, assists: 6 },
      },
    ],
  },
  {
    year: '2023+',
    title: 'O último capítulo',
    prompt:
      'Veterano e cheio de rodagem, Neymar decide o fim da carreira. Ele:',
    options: [
      {
        key: 'A',
        label: 'Volta pro Santos',
        choice: 'Volta pro Santos e busca a lenda em casa',
        real: false,
        consequence:
          'Volta para o Santos, o clube que o revelou, e reacende a Vila Belmiro. Estimativa: puxa o time de volta ao topo, briga por Brasileirão e pela sonhada Libertadores e termina ovacionado — o filho pródigo que voltou para escrever o fim em casa.',
        chapter:
          'Voltou para o Santos, o clube que o revelou, e reacendeu a Vila Belmiro. Devolveu o time ao topo, brigou por Brasileirões e pela sonhada Libertadores e terminou onde tudo começou — como o maior ídolo da história da torcida.',
        stats: { libertadores: 1, brasileirao: 2, goals: 70, assists: 40 },
      },
      {
        key: 'B',
        label: 'Arábia',
        choice: 'Vai para a Arábia Saudita (o grande contrato)',
        real: true,
        money: true,
        consequence:
          'Troca o {club} pelo contrato bilionário do Al-Hilal. Enche os cofres e coleciona títulos sauditas, mas uma ruptura do ligamento cruzado do joelho o tira dos gramados por quase um ano. Longe dos grandes palcos, fica o "podia ter sido mais".',
        chapter:
          'Trocou o {club} pelo contrato bilionário da Arábia Saudita. Encheu os bolsos no Al-Hilal, mas uma ruptura de ligamento no joelho o tirou por quase um ano e o afastou dos grandes palcos. Ficou a pergunta: e se tivesse buscado a glória em vez do cheque?',
        stats: { liga: 1, goals: 30, assists: 20 },
      },
    ],
  },
];

export const TOTAL_MOMENTS = MOMENTS.length;

/** A path is a string of option keys, e.g. "ABABAB". */
export function isValidPath(path: string): boolean {
  return (
    path.length <= TOTAL_MOMENTS &&
    [...path].every((c, i) => c === MOMENTS[i]?.options[0].key || c === MOMENTS[i]?.options[1].key)
  );
}

function optionAt(step: number, key: string): MomentOption | null {
  const m = MOMENTS[step];
  if (!m) return null;
  return m.options.find((o) => o.key === key) ?? null;
}

// ---------------------------------------------------------------------------
// Linear coherence: the story is a single timeline. Choices carry state
// forward — mainly which CLUB Neymar plays for — so later momentos read
// correctly (e.g. after going to Real in 2013, 2017 becomes "leave the Real
// for PSG, or stay", never "leave Barça"). Templates use {club}.
// ---------------------------------------------------------------------------

/** How each momento changes the current club (empty = unchanged). */
function clubAfterMoment(step: number, key: string, prevClub: string): string {
  if (step === 0) return key === 'A' ? 'Barcelona' : 'Real Madrid'; // 2013
  if (step === 3) return key === 'A' ? 'PSG' : prevClub; // 2017 (stay = unchanged)
  if (step === 5) return key === 'A' ? 'Santos' : 'Al-Hilal'; // 2023+
  return prevClub;
}

/** The club Neymar plays for going INTO `step`, given the answers before it. */
export function clubEntering(priorPath: string): string {
  let club = '';
  [...priorPath].forEach((key, i) => {
    club = clubAfterMoment(i, key, club);
  });
  return club;
}

function fill(text: string, club: string): string {
  return text.replaceAll('{club}', club || 'clube atual');
}

export type ResolvedOption = Omit<
  MomentOption,
  'label' | 'choice' | 'consequence' | 'chapter'
> & {
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

/** Resolve a momento's text against the club state implied by the prior path. */
export function resolveMoment(step: number, priorPath: string): ResolvedMoment | null {
  const m = MOMENTS[step];
  if (!m) return null;
  const club = clubEntering(priorPath);
  return {
    year: m.year,
    title: m.title,
    prompt: fill(m.prompt, club),
    options: m.options.map((o) => ({
      ...o,
      label: fill(o.label, club),
      choice: fill(o.choice, club),
      consequence: fill(o.consequence, club),
      chapter: fill(o.chapter, club),
    })),
  };
}

export type NeymarStory = {
  title: string; // tier headline
  tier: number; // 0..4 (worst→best), for styling
  chapters: string[]; // the narrative, one per momento
  summary: string[]; // short labels of the choices
  stats: Stats;
  legado: string[]; // closing sentences
  hero: boolean;
  gold: boolean;
  worldCup: number; // World Cups won (0/1)
  ballon: number; // Ballon d'Or count
};

const TIERS = [
  { min: 45, title: 'LENDA ABSOLUTA' },
  { min: 33, title: 'HERÓI ETERNO' },
  { min: 22, title: 'CRAQUE RESPEITADO' },
  { min: 13, title: 'GÊNIO INCONSTANTE' },
  { min: -Infinity, title: 'O QUE PODIA TER SIDO' },
];

/** Build the full alternative history from a completed answer path. */
export function buildNeymarStory(path: string): NeymarStory {
  const stats: Stats = { ...ZERO };
  const chapters: string[] = [];
  const summary: string[] = [];
  let hero = false;
  let gold = false;
  let money = 0;

  let club = '';
  [...path].forEach((key, step) => {
    const opt = optionAt(step, key);
    if (!opt) return;
    // resolve this chapter with the club state BEFORE this momento changes it
    chapters.push(fill(opt.chapter, club));
    summary.push(fill(opt.label, club));
    if (opt.hero) hero = true;
    if (opt.gold) gold = true;
    if (opt.money) money += 1;
    for (const k of Object.keys(opt.stats) as (keyof Stats)[]) {
      stats[k] += opt.stats[k] ?? 0;
    }
    club = clubAfterMoment(step, key, club);
  });

  // World Cup: staying at his club instead of PSG keeps Neymar fresh and
  // focused — he leads Brazil past Belgium and wins the 2018 title. (Escaping
  // the 2014 injury only avoids the 7x1; Brazil had no real title chance there.)
  const stayed = path[3] === 'B';
  const worldCup = stayed ? 1 : 0;

  // Ballon d'Or: only when he steps out of Messi's shadow (Real in 2013, or
  // stays and inherits the Barça) WITH Champions to show — and a World Cup is
  // itself a near-guaranteed Ballon.
  const protagonist = path[0] === 'B' || stayed;
  let ballon = 0;
  if (protagonist) {
    ballon = stats.ucl >= 3 ? 3 : stats.ucl >= 2 ? 2 : stats.ucl >= 1 ? 1 : 0;
  }
  ballon = Math.min(ballon + worldCup, 5);

  const score =
    stats.ucl * 4 +
    stats.libertadores * 5 +
    stats.brasileirao * 2 +
    stats.liga * 0.5 +
    (hero ? 10 : 0) +
    (gold ? 8 : 0) +
    worldCup * 12 +
    ballon * 6 +
    stats.goals / 50 +
    stats.assists / 50;

  const tierIndex = TIERS.findIndex((t) => score >= t.min);
  const tier = TIERS.length - 1 - tierIndex; // 0 worst … 4 best

  // Compose the closing legacy from the flags, not just the score.
  const legado: string[] = [];
  if (hero) {
    legado.push('Escapou da lesão e evitou o 7 a 1: o Brasil caiu de pé, e o trauma nunca existiu.');
  }
  if (worldCup > 0) {
    legado.push('Livre do desgaste de Paris, liderou o Brasil sobre a Bélgica e foi campeão do mundo em 2018.');
  }
  if (ballon > 0) {
    legado.push(
      ballon === 1
        ? 'Saiu da sombra de Messi e Cristiano e conquistou a Bola de Ouro.'
        : `Destronou Messi e Cristiano e ergueu ${ballon} Bolas de Ouro.`,
    );
  }
  if (gold) {
    legado.push('Deu ao Brasil o ouro olímpico que faltava, e se vingou da Alemanha.');
  }
  if (stats.ucl >= 3) {
    legado.push(`Ergueu ${stats.ucl} Champions League e reinou na Europa.`);
  } else if (stats.ucl === 0) {
    legado.push('A Champions League, porém, foi o troféu que nunca veio.');
  }
  if (stats.libertadores > 0 || stats.brasileirao > 0) {
    legado.push('Voltou pra casa e virou lenda máxima do futebol brasileiro.');
  }
  if (money >= 1) {
    legado.push('Para os críticos, no fim faltou fome de glória onde sobrou dinheiro.');
  }
  // tier-flavored closer
  if (tier >= 4) {
    legado.push('Lembrado como o maior brasileiro desde Pelé.');
  } else if (tier === 3) {
    legado.push('Ficou entre os maiores da história — sem discussão.');
  } else if (tier === 2) {
    legado.push('Um dos grandes de sua geração, sem ser unanimidade.');
  } else if (tier === 1) {
    legado.push('Talento de sobra, polêmicas demais: o eterno "quase".');
  } else {
    legado.push('O maior "e se?" da história do futebol brasileiro.');
  }

  return {
    title: TIERS[tierIndex].title,
    tier,
    chapters,
    summary,
    stats,
    legado,
    hero,
    gold,
    worldCup,
    ballon,
  };
}
