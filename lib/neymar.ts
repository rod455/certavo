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
          'Forma o trio MSN com Messi e Suárez e, em 2015, conquista a Champions da tríplice coroa — mas divide os holofotes com o maior de todos.',
        chapter:
          'Desembarcou no Barcelona e, ao lado de Messi e Suárez, formou o MSN — um dos ataques mais temidos da história. Em 2015 levantou a Champions da tríplice coroa, genial, porém sempre à sombra do camisa 10.',
        stats: { ucl: 1, liga: 2, goals: 105, assists: 60 },
      },
      {
        key: 'B',
        label: 'Real Madrid',
        choice: 'Vai para o Real Madrid',
        real: false,
        consequence:
          'No Real, forma um trio com Cristiano e Benzema e ataca a hegemonia do Barça. Estimativa: divide a década de ouro europeia e empilha Champions.',
        chapter:
          'Rejeitou o Barça e vestiu o branco do Real Madrid. Ao lado de Cristiano e Benzema, virou peça da dinastia que ganhou tudo na Europa — o brasileiro que ousou brilhar na casa do rival.',
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
          'Inteiro, Neymar comanda a seleção. O 7 a 1 nunca acontece e o Brasil, com ele decisivo, briga pelo título mundial em casa.',
        chapter:
          'A joelhada de Zúñiga passa perto, mas a vértebra resiste. Inteiro na semifinal, Neymar segura a Alemanha e o fantasma do 7 a 1 nunca nasce — o Brasil chega à final da sua Copa com o camisa 10 no comando.',
        stats: { goals: 3, assists: 2 },
      },
      {
        key: 'B',
        label: 'Fratura a vértebra',
        choice: 'Fratura a vértebra e assiste de fora (o 7 a 1)',
        real: true,
        consequence:
          'Com a terceira vértebra lombar fraturada, Neymar assiste de fora. Sem ele, o Brasil sofre o histórico 7 a 1 — a maior humilhação da seleção.',
        chapter:
          'A joelhada fratura a terceira vértebra lombar e encerra a Copa dele. Do banco, de colar cervical, Neymar assiste ao Brasil desabar no 7 a 1 contra a Alemanha — a ferida que marcaria toda a sua geração.',
        stats: {},
      },
    ],
  },
  {
    year: '2016',
    title: 'Olimpíada ou Copa América',
    prompt:
      '2016: por causa do calendário, o Brasil deixa Neymar escolher UM torneio — a Copa América Centenário ou a Olimpíada no Rio. Ele escolhe:',
    options: [
      {
        key: 'A',
        label: 'Olimpíada (ouro)',
        choice: 'A Olimpíada do Rio',
        real: true,
        gold: true,
        consequence:
          'Capitão, faz o gol mais rápido da história olímpica e bate o pênalti do título contra a Alemanha: o primeiro OURO do futebol masculino brasileiro. A redenção do 7 a 1.',
        chapter:
          'Escolheu a Olimpíada do Rio e carregou o país nas costas. Fez o gol mais rápido da história dos Jogos e converteu o pênalti que deu ao Brasil o primeiro ouro olímpico do futebol masculino — a redenção definitiva contra a mesma Alemanha.',
        stats: { goals: 6, assists: 3 },
      },
      {
        key: 'B',
        label: 'Copa América',
        choice: 'A Copa América',
        real: false,
        consequence:
          'Aposta na Copa América para acabar com o jejum da seleção principal. Estimativa: brilha e briga pela taça que não vem desde 2007 — mas abre mão do ouro olímpico.',
        chapter:
          'Trocou o Rio pela Copa América e mirou o título que faltava à seleção principal. Deu ao Brasil o protagonismo que faltou naquele torneio — mas o ouro olímpico ficou para a história de outro.',
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
          'Deixa o {club} rumo a Paris, reina na França e leva o PSG à final da Champions em 2020 — mas o troféu europeu escapa por pouco, entre lesões e eliminações.',
        chapter:
          'Aceitou o desafio de ser O cara e deixou o {club} rumo a Paris. Ganhou quase tudo na França e levou o PSG à sua primeira final de Champions, mas o troféu europeu e as lesões recorrentes viraram o seu tormento.',
        stats: { liga: 5, goals: 90, assists: 60 },
      },
      {
        key: 'B',
        label: 'Fica no {club}',
        choice: 'Recusa e fica no {club} para ser o dono absoluto',
        real: false,
        consequence:
          'Recusa os 222 milhões e fica no {club}, decidido a ser o líder máximo do time. Estimativa: assume de vez o posto de melhor do mundo e reina na Europa.',
        chapter:
          'Recusou os 222 milhões e ficou no {club}. Assumiu o time e o manto de melhor do mundo — provando que não precisava trocar de casa para ser o maior.',
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
          'Menos festas e polêmicas, mais foco. A imagem de profissional exemplar blinda a carreira das distrações e prolonga o auge.',
        chapter:
          'Escolheu a estabilidade e a família. Longe das manchetes de balada, ganhou a fama de profissional exemplar — o talento intacto e a cabeça no lugar.',
        stats: { goals: 15, assists: 10 },
      },
      {
        key: 'B',
        label: 'Vida de solteiro',
        choice: 'Cai na vida de solteiro (festas e polêmicas)',
        real: true,
        consequence:
          'Festas milionárias, carnavais e polêmicas amorosas. O gênio segue genial em campo, mas a imagem fora dele vira assunto tanto quanto o futebol.',
        chapter:
          'Mergulhou na vida de solteiro: as festas milionárias, o carnaval, as polêmicas amorosas e os holofotes. O craque continuou craque, mas a fama de fora de campo passou a competir com a de dentro.',
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
          'Reacende a Vila Belmiro. Estimativa: Libertadores, Brasileirões e o carinho do país — o filho pródigo termina onde tudo começou.',
        chapter:
          'Voltou para o Santos, o clube que o revelou, e reacendeu a Vila Belmiro. Entre Brasileirões e a sonhada Libertadores, terminou onde tudo começou — como lenda máxima da torcida.',
        stats: { libertadores: 1, brasileirao: 2, goals: 70, assists: 40 },
      },
      {
        key: 'B',
        label: 'Arábia',
        choice: 'Vai para a Arábia Saudita (o grande contrato)',
        real: true,
        money: true,
        consequence:
          'Troca o {club} pelo contrato bilionário do Al-Hilal. Enche os cofres e a galeria de títulos regionais — mas uma grave lesão no joelho e a distância do topo alimentam o "podia ter sido mais".',
        chapter:
          'Trocou o {club} pelo contrato bilionário da Arábia Saudita. Encheu os bolsos no Al-Hilal, mas uma grave lesão no joelho e a distância dos grandes palcos deixaram a pergunta: e se tivesse buscado a glória em vez do cheque?',
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

  // World Cup: escaping the 2014 injury lets a healthy Neymar lead Brazil to
  // the hexa at home. Ballon d'Or: only when he steps out of Messi's shadow
  // (goes to Real in 2013, or stays and inherits the Barça) WITH Champions to
  // show — plus a World Cup is itself a near-guaranteed Ballon.
  const protagonist = path[0] === 'B' || path[3] === 'B';
  const worldCup = hero ? 1 : 0;
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
  if (worldCup > 0) {
    legado.push('Inteiro, comandou o Brasil ao HEXA — campeão do mundo em casa, em 2014.');
  } else if (hero) {
    legado.push('O homem que escapou da lesão e evitou o 7 a 1 — o Brasil nunca esqueceu.');
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
