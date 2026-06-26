# Certavo

> The daily visual quiz — global, perennial, theme-agnostic.
> Flags, sports, and anything else you can express as data.

Certavo is a daily quiz game in the spirit of Wordle / NYT Games. The goal is
**virality**: a shareable emoji result + link, **zero friction** (play with no
login), and speed. The engine is theme-agnostic — **adding a category means
adding data, never touching the game code**.

> **Name note:** "Certavo" is a working brand under trademark validation. Every
> user-facing reference resolves through a single constant (`lib/site.ts`,
> `SITE_NAME`), so renaming is a one-file change.

## Stack

- **Next.js 14** (App Router) + **TypeScript** — SEO/GEO friendly, great for sharing
- **Tailwind CSS** — design tokens for the brand palette
- **next-intl** — PT-BR / EN / ES with localized routes (`/pt`, `/en`, `/es`)
- **Supabase** (Postgres + RLS + Edge Functions) — ranking, content, ingestion
- **PWA** — installable, offline app-shell via a manual service worker
- **Vitest** — engine + determinism tests
- **pnpm**, deploy on **Vercel**

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase values (optional to play)
pnpm dev                     # http://localhost:3000  → redirects to /pt
```

The game is **fully playable offline** without any backend — Supabase only
powers the server-validated leaderboard. Without env vars, ranking is simply
hidden and everything else works.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run locally |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (engine, daily determinism, content, share) |
| `pnpm gen:countries` | Regenerate `data/countries-i18n.json` from ICU |
| `pnpm tsx scripts/gen-logo.ts` | Regenerate the brand logo + PWA icons (C+check monogram) |
| `pnpm seed` | Seed Supabase content (needs `SUPABASE_SERVICE_ROLE_KEY`) |

## Game modes

All three modes run on the same engine (`lib/engine.ts`):

1. **Daily Challenge** — 10 questions, deterministic by UTC date, identical for
   everyone worldwide. Generates a shareable emoji grid + link. One play per day
   (locked locally + validated server-side).
2. **Time Attack** — 45s clock, −4s per miss, time/combo bonus on streaks.
3. **Sudden Death** — one mistake ends it; ranked by longest streak.

### Determinism (anti-cheat)

The daily seed is a hash of the `YYYY-MM-DD` (UTC) date (`lib/rng.ts`,
`lib/daily.ts`). The same selection is reproducible on the server, which
revalidates submitted results (`validate_and_insert_score`) by recomputing
correctness from the stored questions before inserting.

## Content architecture (theme-agnostic engine)

Hierarchy: **Theme → Pack → Question**. Every question uses one shape
(`lib/types.ts`), so the renderer never needs to know the theme:

```ts
type Question = {
  media_type: 'none' | 'flag' | 'image' | 'emoji';
  media_value: string | null;          // ISO code, URL, or emoji
  prompt: Record<string, string>;      // { pt, en, es }
  options: Record<string, string[]>;   // 4 options per language
  correct_index: number;               // 0..3
  difficulty: 1 | 2 | 3;
  option_media?: { type, values } | null; // optional visual options (e.g. flags)
};
```

Seed content lives in `/data` and is turned into questions by `lib/content.ts`:

- **World Flags** — generated for ~193 ISO 3166-1 countries, two directions
  (flag → country, country → flag). Names come from the runtime's ICU data
  (`Intl.DisplayNames`), pre-generated into `data/countries-i18n.json` so there
  is **no external API at runtime**.
- **Sports** — World Cup champions (1930–2022) and Olympic hosts (1960–2020)
  in `data/sports.json`.

**Adding a theme = data only.** Drop a JSON file in `/data`, add a builder +
entry in `THEMES` (or insert rows in Supabase / via the `ingest-pack`
endpoint). No engine changes.

## Backend (Supabase)

SQL lives in `supabase/migrations` (also concatenated into `supabase/all.sql`
for convenient pasting into the dashboard SQL editor):

- `0001_init.sql` — `themes`, `packs`, `questions`, `profiles`, `scores` + indexes
- `0002_rls.sql` — public **read** of content/leaderboard; **no public insert**
  of scores
- `0003_functions.sql` — `get_leaderboard(mode, period)` RPC +
  `validate_and_insert_score(payload)` (server-side revalidation)

Edge Functions in `supabase/functions`:

- `submit_score` — the only write path for scores; calls the validation RPC
- `ingest-pack` — **prepared, not automated.** Protected by `INGEST_API_KEY`;
  the future n8n AI-pack workflow will POST here.

### Setup

1. Apply the SQL: paste `supabase/all.sql` into the Supabase SQL editor, or
   `supabase db push` with the CLI.
2. Deploy functions: `supabase functions deploy submit_score` and
   `supabase functions deploy ingest-pack`; set secrets
   (`SUPABASE_SERVICE_ROLE_KEY` is provided automatically; set `INGEST_API_KEY`).
3. Seed content: `SUPABASE_SERVICE_ROLE_KEY=... pnpm seed`.

## i18n / SEO / GEO

- Localized routes `/pt` `/en` `/es` with `hreflang` alternates
- `generateMetadata` per route; dynamic OG image per daily challenge
  (`/api/og`) via `next/og`
- `sitemap.xml`, `robots.txt`, JSON-LD (`SoftwareApplication` / `Game`)
- Indexable text content (not canvas-only)

## Sharing / virality

- Wordle-style emoji grid (`lib/share.ts`)
- "Challenge friends on WhatsApp" deep link (`wa.me`)
- Web Share API with clipboard fallback
- Rich link previews via the dynamic OG image

## Monetization (phase 2 — placeholders only)

`<AdSlot>` renders a non-intrusive placeholder and is the **single integration
point** for ads. Nothing is wired to an ad network yet. Future:

- **Web:** mount an ad network inside `components/AdSlot.tsx`.
- **Native:** wrap with AdMob via a native shell; keep `AdSlot` as the seam.

## Roadmap

- AI-generated packs via an **n8n** workflow → `ingest-pack` Edge Function
- Accounts + profiles (optional; the game stays login-free)
- More themes (art, cinema, geography) — data only

## License

MIT — see [LICENSE](./LICENSE).
