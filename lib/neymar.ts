/**
 * "O Caminho do Neymar — Linha do Tempo Alternativa"
 *
 * A shared *chain* quiz: each of N momentos (turning points in Neymar's life)
 * is answered by a different person. The chosen path travels inside the link
 * (e.g. /neymar/3?p=AB), so the whole game is stateless — no backend — and the
 * final story is a pure, deterministic function of the answer string.
 *
 * The story is built COMPOSITIONALLY: each option contributes a narrative
 * chapter + stat deltas + flags, and the ending aggregates them. That scales to
 * any combination (2^N) without hand-writing every outcome.
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
  /** contributes flags to the ending */
  hero?: boolean; // avoided the 7x1
  money?: boolean; // chose the money
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
    title: 'A saída do Santos',
    prompt:
      '2013: Neymar está no auge do Santos. Chegam propostas do Barcelona e do Real Madrid. Para onde ele vai?',
    options: [
      {
        key: 'A',
        label: 'Barcelona',
        choice: 'Vai para o Barcelona',
        real: true,
        consequence:
          'Forma o trio MSN com Messi e Suárez — dos mais temidos da história. Mas vive à sombra do camisa 10.',
        chapter:
          'Foi para o Barcelona e formou o lendário trio MSN com Messi e Suárez. Encantou o mundo, mas jogou a carreira inteira à sombra do argentino.',
        stats: { ucl: 1, liga: 2, goals: 105, assists: 75 },
      },
      {
        key: 'B',
        label: 'Real Madrid',
        choice: 'Vai para o Real Madrid',
        real: false,
        consequence:
          'No Real, forma um quarteto com Cristiano e Benzema. Estimativa: dominância total na Europa, 5 Champions na década.',
        chapter:
          'Rejeitou o Barça e vestiu o branco do Real Madrid, decidido a destronar Cristiano na casa dele. Virou o dono da década merengue.',
        stats: { ucl: 5, liga: 3, goals: 165, assists: 100 },
      },
    ],
  },
  {
    year: '2014',
    title: 'A lesão na Copa',
    prompt:
      'Copa de 2014: Neymar leva a joelhada de Zúñiga nas quartas contra a Colômbia. Na semifinal contra a Alemanha, ele:',
    options: [
      {
        key: 'A',
        label: 'Joga machucado',
        choice: 'Joga mesmo machucado',
        real: false,
        hero: true,
        consequence:
          'Com Neymar em campo, a Alemanha não atropela. Nada de 7x1 — o Brasil cai de cabeça erguida e ele fatura a Chuteira de Ouro.',
        chapter:
          'Contra tudo, entrou em campo com a coluna pendurada na semifinal. Segurou a Alemanha, o vexame do 7x1 nunca existiu e o Brasil caiu lutando — com ele carregando a braçadeira e a Chuteira de Ouro.',
        stats: { goals: 6, assists: 3 },
      },
      {
        key: 'B',
        label: 'Não joga (7x1)',
        choice: 'Não joga — fica de fora',
        real: true,
        consequence:
          'Sem ele, o Brasil desaba no histórico 7x1. A imagem de "frágil" e a camisa 10 chorando marcam a carreira.',
        chapter:
          'Assistiu de terno ao Brasil desabar no 7x1 contra a Alemanha. A imagem daquela noite — e o peso de ser a esperança que faltou — o perseguiu por anos.',
        stats: {},
      },
    ],
  },
  {
    year: '2015',
    title: 'Bruna Marquezine',
    prompt:
      '2015: Neymar e Bruna Marquezine vivem o auge do namoro. Na encruzilhada da vida pessoal, ele:',
    options: [
      {
        key: 'A',
        label: 'Fica com a Bruna',
        choice: 'Mantém o relacionamento',
        real: false,
        consequence:
          'Estabilidade fora de campo, menos festas, mais foco. Vira o "namoradinho do Brasil" e rende ainda mais dentro de campo.',
        chapter:
          'Escolheu a estabilidade com a Bruna. Menos manchetes de balada, mais treino: virou o namoradinho do Brasil e um exemplo dentro e fora de campo.',
        stats: { ucl: 1, goals: 20, assists: 15 },
      },
      {
        key: 'B',
        label: 'Vida de solteiro',
        choice: 'Termina e vive a vida de solteiro',
        real: true,
        consequence:
          'Vida de solteiro, festas e muitas manchetes. O talento segue intacto, mas a disciplina entra em xeque.',
        chapter:
          'Terminou tudo e mergulhou na vida de solteiro. Festas, aniversários homéricos e polêmicas: o gênio seguia genial, mas a disciplina virou assunto.',
        stats: { goals: 10, assists: 8 },
      },
    ],
  },
  {
    year: '2017',
    title: 'A transferência recorde',
    prompt:
      '2017: o PSG paga a multa de 222 milhões, a maior da história. Neymar:',
    options: [
      {
        key: 'A',
        label: 'PSG',
        choice: 'Aceita e vira o rei de Paris',
        real: true,
        money: true,
        consequence:
          'Reina na França com 5 Ligue 1 — mas a Champions escapa nas oitavas ano após ano. "Rei da França, frustrado na Europa."',
        chapter:
          'Aceitou os milhões do PSG e virou o astro de Paris. Reinou na França, mas a Champions que ele foi buscar sempre escapava nas oitavas.',
        stats: { liga: 5, goals: 100, assists: 80 },
      },
      {
        key: 'B',
        label: 'Fica no Barça',
        choice: 'Fica no Barça e assume o posto de Messi',
        real: false,
        consequence:
          'Recusa o PSG, herda o trono do Messi e vira o maior craque do mundo: 2 Champions e 200+ gols pelo Barça.',
        chapter:
          'Recusou os 222 milhões, ficou no Barcelona e, com a saída de Messi, herdou o trono. Dois anos depois já era, sem discussão, o melhor do planeta.',
        stats: { ucl: 2, liga: 3, goals: 200, assists: 120 },
      },
    ],
  },
  {
    year: '2023+',
    title: 'A encruzilhada final',
    prompt:
      '2023 em diante: veterano, Neymar decide o último capítulo da carreira. Ele:',
    options: [
      {
        key: 'A',
        label: 'Volta pro Santos',
        choice: 'Volta pro Santos e vira lenda em casa',
        real: false,
        consequence:
          'Reacende a Vila Belmiro: Libertadores, Brasileirões e o carinho de um país inteiro. O filho pródigo voltou.',
        chapter:
          'Voltou para o Santos e reacendeu a Vila Belmiro. Libertadores, Brasileirões e um estádio inteiro cantando seu nome: o filho pródigo virou lenda em casa.',
        stats: { libertadores: 2, brasileirao: 3, goals: 80, assists: 50 },
      },
      {
        key: 'B',
        label: 'Arábia',
        choice: 'Vai para a Arábia focar no dinheiro',
        real: true,
        money: true,
        consequence:
          'Enche os cofres na Arábia e coleciona títulos regionais. Para muitos, o gênio que trocou a glória pelo dinheiro.',
        chapter:
          'Escolheu os cofres da Arábia Saudita. Encheu os bolsos e a galeria de títulos regionais, mas ficou a pergunta: e se tivesse buscado a glória em vez do dinheiro?',
        stats: { liga: 2, goals: 60, assists: 40 },
      },
    ],
  },
];

export const TOTAL_MOMENTS = MOMENTS.length;

/** A path is a string of option keys, e.g. "ABABA". */
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

export type NeymarStory = {
  title: string; // tier headline
  tier: number; // 0..4 (worst→best), for styling
  chapters: string[]; // the narrative, one per momento
  summary: string[]; // short labels of the choices
  stats: Stats;
  legado: string[]; // 2–3 closing sentences
  hero: boolean;
};

const TIERS = [
  { min: 40, title: 'LENDA ABSOLUTA' },
  { min: 29, title: 'HERÓI ETERNO' },
  { min: 19, title: 'CRAQUE RESPEITADO' },
  { min: 11, title: 'GÊNIO INCONSTANTE' },
  { min: -Infinity, title: 'O QUE PODIA TER SIDO' },
];

/** Build the full alternative history from a completed answer path. */
export function buildNeymarStory(path: string): NeymarStory {
  const stats: Stats = { ...ZERO };
  const chapters: string[] = [];
  const summary: string[] = [];
  let hero = false;
  let money = 0;

  [...path].forEach((key, step) => {
    const opt = optionAt(step, key);
    if (!opt) return;
    chapters.push(opt.chapter);
    summary.push(opt.label);
    if (opt.hero) hero = true;
    if (opt.money) money += 1;
    for (const k of Object.keys(opt.stats) as (keyof Stats)[]) {
      stats[k] += opt.stats[k] ?? 0;
    }
  });

  const score =
    stats.ucl * 4 +
    stats.libertadores * 5 +
    stats.brasileirao * 2 +
    stats.liga * 0.5 +
    (hero ? 10 : 0) +
    stats.goals / 50 +
    stats.assists / 50;

  const tierIndex = TIERS.findIndex((t) => score >= t.min);
  const tier = TIERS.length - 1 - tierIndex; // 0 worst … 4 best

  // Compose the closing legacy from flags, not just the score.
  const legado: string[] = [];
  if (hero) {
    legado.push('O homem que entrou machucado e evitou o 7x1 — o Brasil nunca esqueceu.');
  }
  if (stats.ucl >= 4) {
    legado.push(`Ergueu ${stats.ucl} Champions League e reinou na Europa por uma década.`);
  } else if (stats.ucl === 0) {
    legado.push('A Champions League, porém, foi o troféu que nunca veio.');
  }
  if (stats.libertadores > 0 || stats.brasileirao > 0) {
    legado.push('Voltou para casa e escreveu seu nome na história do futebol brasileiro.');
  }
  if (money >= 2) {
    legado.push('Para os críticos, faltou fome de glória onde sobrou dinheiro.');
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
  };
}
