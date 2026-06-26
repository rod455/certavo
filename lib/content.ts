import type { Question, Lang } from './types';
import { seededRng, shuffle } from './rng';
import countriesData from '@/data/countries-i18n.json';
import sportsData from '@/data/sports.json';

const LANGS: Lang[] = ['pt', 'en', 'es'];

export type Country = { code: string; name: Record<string, string> };
export const countries = countriesData as Country[];

const byCode = new Map(countries.map((c) => [c.code, c]));

function localizedName(code: string): Record<string, string> {
  const c = byCode.get(code);
  if (c) return c.name;
  return { pt: code, en: code, es: code };
}

/** Pick 3 distractor countries for `code`, deterministically by question id. */
function distractorCodes(code: string, id: string): string[] {
  const pool = countries.filter((c) => c.code !== code);
  return shuffle(pool, seededRng(id))
    .slice(0, 3)
    .map((c) => c.code);
}

/** Build per-language options + a deterministic correct index from codes. */
function optionsFromCodes(
  correctCode: string,
  distractors: string[],
  id: string,
): { options: Record<string, string[]>; codes: string[]; correctIndex: number } {
  const all = [correctCode, ...distractors];
  const ordered = shuffle(all, seededRng(`${id}:order`));
  const correctIndex = ordered.indexOf(correctCode);
  const options: Record<string, string[]> = {};
  for (const lang of LANGS) {
    options[lang] = ordered.map((c) => localizedName(c)[lang]);
  }
  return { options, codes: ordered, correctIndex };
}

const FLAG_PROMPT: Record<Lang, string> = {
  pt: 'Que país é esta bandeira?',
  en: 'Which country is this flag?',
  es: '¿De qué país es esta bandera?',
};

const FLAG_FOR_PROMPT: Record<Lang, (name: string) => string> = {
  pt: (n) => `Qual é a bandeira de ${n}?`,
  en: (n) => `Which flag belongs to ${n}?`,
  es: (n) => `¿Cuál es la bandera de ${n}?`,
};

/** Flag → country name. */
export function flagToNameQuestions(packId: string): Question[] {
  return countries.map((c) => {
    const id = `flag-name-${c.code}`;
    const { options, correctIndex } = optionsFromCodes(
      c.code,
      distractorCodes(c.code, id),
      id,
    );
    return {
      id,
      pack_id: packId,
      media_type: 'flag',
      media_value: c.code,
      prompt: { ...FLAG_PROMPT },
      options,
      correct_index: correctIndex,
      difficulty: 1,
    };
  });
}

/** Country name → correct flag (visual options). */
export function nameToFlagQuestions(packId: string): Question[] {
  return countries.map((c) => {
    const id = `name-flag-${c.code}`;
    const { options, codes, correctIndex } = optionsFromCodes(
      c.code,
      distractorCodes(c.code, id + ':b'),
      id,
    );
    const prompt: Record<string, string> = {};
    for (const lang of LANGS) prompt[lang] = FLAG_FOR_PROMPT[lang](c.name[lang]);
    return {
      id,
      pack_id: packId,
      media_type: 'none',
      media_value: null,
      prompt,
      options,
      correct_index: correctIndex,
      difficulty: 2,
      option_media: { type: 'flag', values: codes },
    };
  });
}

const WC_PROMPT: Record<Lang, (y: number) => string> = {
  pt: (y) => `Quem foi campeão da Copa do Mundo de ${y}?`,
  en: (y) => `Who won the ${y} World Cup?`,
  es: (y) => `¿Quién ganó la Copa del Mundo de ${y}?`,
};

const OLY_PROMPT: Record<Lang, (y: number) => string> = {
  pt: (y) => `Qual cidade sediou os Jogos Olímpicos de ${y}?`,
  en: (y) => `Which city hosted the ${y} Olympic Games?`,
  es: (y) => `¿Qué ciudad fue sede de los Juegos Olímpicos de ${y}?`,
};

type Sports = {
  worldCupChampions: { year: number; code: string }[];
  olympicHosts: { year: number; city: Record<string, string> }[];
};
const sports = sportsData as Sports;

export function worldCupQuestions(packId: string): Question[] {
  const winnerCodes = [...new Set(sports.worldCupChampions.map((w) => w.code))];
  return sports.worldCupChampions.map(({ year, code }) => {
    const id = `wc-${year}`;
    const distractors = shuffle(
      winnerCodes.filter((c) => c !== code),
      seededRng(id),
    ).slice(0, 3);
    const { options, correctIndex } = optionsFromCodes(code, distractors, id);
    const prompt: Record<string, string> = {};
    for (const lang of LANGS) prompt[lang] = WC_PROMPT[lang](year);
    return {
      id,
      pack_id: packId,
      media_type: 'none',
      media_value: null,
      prompt,
      options,
      correct_index: correctIndex,
      difficulty: 2,
    };
  });
}

export function olympicQuestions(packId: string): Question[] {
  const hosts = sports.olympicHosts;
  return hosts.map((host) => {
    const id = `oly-${host.year}`;
    // Some cities hosted more than once (e.g. Tokyo) — dedupe by name so no two
    // options ever read the same.
    const seen = new Set([host.city.en]);
    const distractorPool = hosts.filter((h) => {
      if (seen.has(h.city.en)) return false;
      seen.add(h.city.en);
      return true;
    });
    const distractors = shuffle(distractorPool, seededRng(id)).slice(0, 3);
    const all = shuffle([host, ...distractors], seededRng(`${id}:order`));
    const correctIndex = all.indexOf(host);
    const options: Record<string, string[]> = {};
    for (const lang of LANGS) options[lang] = all.map((h) => h.city[lang]);
    const prompt: Record<string, string> = {};
    for (const lang of LANGS) prompt[lang] = OLY_PROMPT[lang](host.year);
    return {
      id,
      pack_id: packId,
      media_type: 'none',
      media_value: null,
      prompt,
      options,
      correct_index: correctIndex,
      difficulty: 2,
    };
  });
}

/** Pack/theme definitions — adding content here (or in DB) needs no engine change. */
export const THEMES = {
  flags: {
    slug: 'flags',
    name: { pt: 'Bandeiras do Mundo', en: 'World Flags', es: 'Banderas del Mundo' },
    icon: '🏳️',
    packs: [
      {
        slug: 'flags-name',
        name: {
          pt: 'Bandeira → País',
          en: 'Flag → Country',
          es: 'Bandera → País',
        },
        build: flagToNameQuestions,
      },
      {
        slug: 'name-flag',
        name: {
          pt: 'País → Bandeira',
          en: 'Country → Flag',
          es: 'País → Bandera',
        },
        build: nameToFlagQuestions,
      },
    ],
  },
  worldcup: {
    slug: 'worldcup',
    name: { pt: 'Copa do Mundo', en: 'World Cup', es: 'Copa del Mundo' },
    icon: '⚽',
    packs: [
      {
        slug: 'world-cup-champions',
        name: {
          pt: 'Campeões da Copa do Mundo',
          en: 'World Cup Champions',
          es: 'Campeones de la Copa del Mundo',
        },
        build: worldCupQuestions,
      },
    ],
  },
  sports: {
    slug: 'sports',
    name: { pt: 'Esportes', en: 'Sports', es: 'Deportes' },
    icon: '🏅',
    packs: [
      {
        slug: 'olympic-hosts',
        name: {
          pt: 'Sedes Olímpicas',
          en: 'Olympic Hosts',
          es: 'Sedes Olímpicas',
        },
        build: olympicQuestions,
      },
    ],
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

/** All questions for a theme (across its packs), with stable ids. */
export function questionsForTheme(theme: ThemeKey): Question[] {
  return THEMES[theme].packs.flatMap((p) => p.build(`${theme}:${p.slug}`));
}

/** The global daily pool: a curated mix across themes. */
export function dailyPool(): Question[] {
  return [
    ...flagToNameQuestions('flags:flags-name'),
    ...worldCupQuestions('worldcup:world-cup-champions'),
    ...olympicQuestions('sports:olympic-hosts'),
  ];
}

/**
 * Daily "editions" — each day's challenge has a themed name and its own pool.
 * Editions rotate deterministically by challenge number (so #1 is always the
 * same edition for everyone). Add an edition = add an entry here (data-only).
 */
export type DailyEdition = {
  slug: string;
  name: Record<Lang, string>;
  build: () => Question[];
};

export const DAILY_EDITIONS: DailyEdition[] = [
  {
    slug: 'flags',
    name: {
      pt: 'Bandeiras de Países',
      en: 'Country Flags',
      es: 'Banderas de Países',
    },
    build: () => flagToNameQuestions('flags:flags-name'),
  },
  {
    slug: 'worldcup',
    name: { pt: 'Copa do Mundo', en: 'World Cup', es: 'Copa del Mundo' },
    build: () => worldCupQuestions('worldcup:world-cup-champions'),
  },
  {
    slug: 'sports',
    name: { pt: 'Esportes', en: 'Sports', es: 'Deportes' },
    build: () => olympicQuestions('sports:olympic-hosts'),
  },
  {
    slug: 'mixed',
    name: { pt: 'Geral', en: 'Mixed', es: 'General' },
    build: () => dailyPool(),
  },
];

/** Deterministic edition for a challenge number (#1 → first edition). */
export function dailyEdition(challengeNumber: number): DailyEdition {
  const i = (challengeNumber - 1) % DAILY_EDITIONS.length;
  return DAILY_EDITIONS[i];
}
